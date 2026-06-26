import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';
import 'webrtc_sync_engine.dart';

class PhotoStreamer {
  final WebRtcSyncEngine syncEngine;

  PhotoStreamer({required this.syncEngine});

  // Query local system image gallery assets
  Future<List<AssetEntity>> loadLocalImages() async {
    // Request permissions first
    final PermissionState ps = await PhotoManager.requestPermissionExtend();
    if (!ps.isAuth) {
      debugPrint("[Streamer] Photo permissions rejected");
      return [];
    }

    final List<AssetPathEntity> paths = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      filterOption: FilterOptionGroup(
        imageOption: const FilterOption(
          sizeConstraint: SizeConstraint(ignoreSize: true),
        ),
      ),
    );

    if (paths.isEmpty) return [];

    // Retrieve all assets in the main Recent / Album path
    final int count = await paths[0].assetCountAsync;
    return await paths[0].getAssetListRange(start: 0, end: count);
  }

  // Stream a selected photo entity in chunks with Backpressure flow control
  Future<bool> streamImage({
    required AssetEntity entity,
    required int fileId,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    debugPrint("[Streamer] Starting transmission of asset: ${entity.title}, ID: $fileId");

    // 1. Fetch and compress image natively to avoid massive payloads
    final Uint8List? imageBytes = await _loadAndCompressAsset(entity);
    if (imageBytes == null) {
      debugPrint("[Streamer] Error loading/compressing image bytes");
      return false;
    }

    final int totalSize = imageBytes.length;
    const int chunkSize = 32 * 1024; // 32KB package limit
    final int totalChunks = (totalSize / chunkSize).ceil();

    debugPrint("[Streamer] Image final size: ${totalSize}B, Chunks: $totalChunks");

    try {
      int bytesSent = 0;

      for (int chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Apply WebRTC Backpressure Flow Control
        // If DataChannel write buffer exceeds 1MB, yield execution and wait
        while (syncEngine.getBufferedAmount() > 1000000) {
          debugPrint("[Streamer] Backpressure: buffer is ${syncEngine.getBufferedAmount()}B. Waiting...");
          await Future.delayed(const Duration(milliseconds: 30));
        }

        final int offset = chunkIndex * chunkSize;
        final int payloadSize = (offset + chunkSize < totalSize) ? chunkSize : (totalSize - offset);

        // Build 16-Byte Header
        final ByteData headerData = ByteData(16);
        headerData.setInt32(0, fileId, Endian.big);       // file_id (4B)
        headerData.setInt32(4, chunkIndex, Endian.big);   // chunk_index (4B)
        headerData.setInt32(8, totalChunks, Endian.big);  // total_chunks (4B)
        headerData.setInt32(12, payloadSize, Endian.big); // payload_size (4B)

        // Assemble package (Header + Payload)
        final Uint8List packet = Uint8List(16 + payloadSize);
        packet.setRange(0, 16, headerData.buffer.asUint8List());
        packet.setRange(16, 16 + payloadSize, imageBytes.sublist(offset, offset + payloadSize));

        final bool success = await syncEngine.sendBinary(packet);
        if (!success) {
          debugPrint("[Streamer] Failed to write chunk $chunkIndex over DataChannel");
          return false;
        }

        bytesSent += payloadSize;
        onProgress(chunkIndex, totalChunks, bytesSent);

        // Yield execution to allow other tasks to run
        await Future.delayed(Duration.zero);
      }

      debugPrint("[Streamer] Successfully finished streaming asset: ${entity.title}");
      return true;
    } catch (e) {
      debugPrint("[Streamer] Exception during photo streaming: $e");
      return false;
    }
  }

  // Load origin bytes, and compress natively via Flutter ui.instantiateImageCodec if size is > 1MB
  Future<Uint8List?> _loadAndCompressAsset(AssetEntity entity) async {
    try {
      final File? file = await entity.file;
      if (file == null) return null;
      final Uint8List rawBytes = await file.readAsBytes();

      // Skip compression for small images (< 1MB)
      if (rawBytes.length < 1000000) {
        return rawBytes;
      }

      // Decode and downscale image natively using the UI package engine (fast, zero external dependency)
      final ui.Codec codec = await ui.instantiateImageCodec(
        rawBytes,
        targetWidth: 1920, // Downscale max width to 1920px
      );
      final ui.FrameInfo frameInfo = await codec.getNextFrame();
      final ui.Image image = frameInfo.image;
      
      // Export as PNG (standard compressed format)
      final ByteData? pngData = await image.toByteData(format: ui.ImageByteFormat.png);
      image.dispose();
      
      if (pngData == null) return rawBytes;
      return pngData.buffer.asUint8List();
    } catch (e) {
      debugPrint("[Streamer] Failed native asset compression: $e");
      return null;
    }
  }
}
