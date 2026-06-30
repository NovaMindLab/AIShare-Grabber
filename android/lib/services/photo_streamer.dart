import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';
import 'webrtc_sync_engine.dart';

class PhotoStreamer {
  final WebRtcSyncEngine? syncEngine;

  PhotoStreamer({required WebRtcSyncEngine this.syncEngine});

  /// Standalone constructor — only for gallery scanning, no transmission capability.
  PhotoStreamer.standalone() : syncEngine = null;

  // ── Generic internal asset loader ──────────────────────────────────────────
  Future<List<AssetEntity>> _loadAssets(RequestType type) async {
    try {
      debugPrint('[Streamer] Requesting PhotoManager permissions ($type)...');
      final PermissionState ps = await PhotoManager.requestPermissionExtend();
      debugPrint('[Streamer] Permission state: $ps');
      if (!ps.isAuth) {
        debugPrint('[Streamer] Permission rejected ($type)');
        return [];
      }

      final FilterOptionGroup filter = FilterOptionGroup(
        imageOption: const FilterOption(sizeConstraint: SizeConstraint(ignoreSize: true)),
        videoOption: const FilterOption(sizeConstraint: SizeConstraint(ignoreSize: true)),
        audioOption: const FilterOption(sizeConstraint: SizeConstraint(ignoreSize: true)),
      );

      final List<AssetPathEntity> paths = await PhotoManager.getAssetPathList(
        type: type,
        filterOption: filter,
      );

      debugPrint('[Streamer] [$type] paths found: ${paths.length}');
      if (paths.isEmpty) return [];

      final int count = await paths[0].assetCountAsync;
      debugPrint('[Streamer] [$type] count in first path: $count');
      if (count == 0) return [];

      return await paths[0].getAssetListRange(start: 0, end: count);
    } catch (e, stack) {
      debugPrint('[Streamer] Error loading [$type] assets: $e\n$stack');
      return [];
    }
  }

  /// Load all images + videos from the MediaStore (gallery)
  Future<List<AssetEntity>> loadLocalImages() => _loadAssets(RequestType.common);

  /// Load all audio files from the MediaStore
  Future<List<AssetEntity>> loadLocalAudio() => _loadAssets(RequestType.audio);

  /// Load video-only assets (for a dedicated Videos tab if needed)
  Future<List<AssetEntity>> loadLocalVideos() => _loadAssets(RequestType.video);

  Future<void> _sendMetadataPacket({
    required int fileId,
    required String assetId,
    required String name,
    required int size,
  }) async {
    final payloadStr = jsonEncode({
      "file_id": fileId,
      "asset_id": assetId,
      "name": name,
      "size": size,
    });
    final payloadBytes = utf8.encode(payloadStr);

    final header = ByteData(16);
    header.setInt32(0, -5, Endian.big); // file_id = -5 (Metadata)
    header.setInt32(4, 0, Endian.big);
    header.setInt32(8, 0, Endian.big);
    header.setInt32(12, payloadBytes.length, Endian.big);

    final packet = Uint8List(16 + payloadBytes.length);
    packet.setRange(0, 16, header.buffer.asUint8List());
    packet.setRange(16, packet.length, payloadBytes);

    debugPrint("[Streamer] Sending metadata packet for fileId $fileId ($name)...");
    await syncEngine?.sendBinary(packet);
  }

  /// Stream a selected photo/video entity chunk-by-chunk using RandomAccessFile to avoid memory OOM
  Future<bool> streamImage({
    required AssetEntity entity,
    required int fileId,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    debugPrint("[Streamer] Starting transmission of gallery asset: ${entity.title}, ID: $fileId");
    try {
      final File? file = await entity.file;
      if (file == null) {
        debugPrint("[Streamer] Error: could not obtain file for asset: ${entity.title}");
        return false;
      }
      final int size = await file.length();
      final String extension = entity.mimeType?.split('/').last ?? 'jpg';
      final String cleanName = '${entity.title ?? 'photo'}.$extension';

      // Send metadata first
      await _sendMetadataPacket(
        fileId: fileId,
        assetId: entity.id,
        name: cleanName,
        size: size,
      );

      return await _streamFileInternal(file: file, fileId: fileId, onProgress: onProgress);
    } catch (e, stack) {
      debugPrint("[Streamer] Exception during gallery asset streaming: $e\n$stack");
      return false;
    }
  }

  /// Stream a generic file chunk-by-chunk using RandomAccessFile to avoid memory OOM
  Future<bool> streamFile({
    required File file,
    required int fileId,
    required String fileName,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    debugPrint("[Streamer] Starting transmission of file: $fileName, ID: $fileId");
    try {
      final int size = await file.length();
      final firstUnderscore = fileName.indexOf('_');
      String assetId = '';
      String cleanName = '';
      if (firstUnderscore != -1) {
        assetId = fileName.substring(0, firstUnderscore);
        cleanName = fileName.substring(firstUnderscore + 1);
      } else {
        assetId = '${fileName}_$size';
        cleanName = fileName;
      }

      // Send metadata first
      await _sendMetadataPacket(
        fileId: fileId,
        assetId: assetId,
        name: cleanName,
        size: size,
      );

      return await _streamFileInternal(file: file, fileId: fileId, onProgress: onProgress);
    } catch (e, stack) {
      debugPrint("[Streamer] Exception during generic file streaming: $e\n$stack");
      return false;
    }
  }

  /// memory-efficient file streaming implementation using RandomAccessFile.
  /// This reads file directly in 32KB chunks and sends them, maintaining a tiny memory footprint.
  Future<bool> _streamFileInternal({
    required File file,
    required int fileId,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    RandomAccessFile? raf;
    try {
      final int totalSize = await file.length();
      const int chunkSize = 32 * 1024; // 32KB chunks
      final int totalChunks = (totalSize / chunkSize).ceil();

      debugPrint("[Streamer] File size: ${totalSize}B, Total chunks: $totalChunks");

      raf = await file.open(mode: FileMode.read);
      int bytesSent = 0;

      for (int chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Apply WebRTC Backpressure Flow Control
        // If DataChannel write buffer exceeds 1MB, yield execution and wait
        while (syncEngine!.getBufferedAmount() > 1000000) {
          debugPrint("[Streamer] Backpressure: buffer is ${syncEngine!.getBufferedAmount()}B. Waiting...");
          await Future.delayed(const Duration(milliseconds: 30));
        }

        final int payloadSize = (bytesSent + chunkSize < totalSize) ? chunkSize : (totalSize - bytesSent);
        final Uint8List chunkBytes = await raf.read(payloadSize);

        // Build 16-Byte Header
        final ByteData headerData = ByteData(16);
        headerData.setInt32(0, fileId, Endian.big);       // file_id (4B)
        headerData.setInt32(4, chunkIndex, Endian.big);   // chunk_index (4B)
        headerData.setInt32(8, totalChunks, Endian.big);  // total_chunks (4B)
        headerData.setInt32(12, payloadSize, Endian.big); // payload_size (4B)

        // Assemble package (Header + Payload)
        final Uint8List packet = Uint8List(16 + payloadSize);
        packet.setRange(0, 16, headerData.buffer.asUint8List());
        packet.setRange(16, 16 + payloadSize, chunkBytes);

        final bool success = await syncEngine!.sendBinary(packet);
        if (!success) {
          debugPrint("[Streamer] Failed to write chunk $chunkIndex over DataChannel");
          return false;
        }

        bytesSent += payloadSize;
        onProgress(chunkIndex, totalChunks, bytesSent);

        // Yield execution to allow WebRTC processing and avoid thread starvation
        await Future.delayed(Duration.zero);
      }

      debugPrint("[Streamer] Successfully streamed file ID $fileId");
      return true;
    } catch (e, stack) {
      debugPrint("[Streamer] Exception during _streamFileInternal: $e\n$stack");
      return false;
    } finally {
      if (raf != null) {
        try {
          await raf.close();
        } catch (_) {}
      }
    }
  }
}
