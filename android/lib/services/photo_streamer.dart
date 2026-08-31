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

  // ── Helper to safely collect assets in batches (prevents Binder TransactionTooLargeException) ──
  Future<void> _safeCollectPathAssets(
    AssetPathEntity path,
    Map<String, AssetEntity> aggregated, {
    AssetType? filterType,
  }) async {
    try {
      final int count = await path.assetCountAsync;
      if (count <= 0) return;
      int start = 0;
      const int batchSize = 200;
      while (start < count) {
        final end = (start + batchSize < count) ? start + batchSize : count;
        final items = await path.getAssetListRange(start: start, end: end);
        for (final item in items) {
          if (filterType != null && item.type != filterType) {
            continue;
          }
          aggregated[item.id] = item;
        }
        start = end;
      }
    } catch (e) {
      debugPrint('[Streamer] Safe collect error for path "${path.name}": $e');
    }
  }

  // ── Generic internal asset loader ──────────────────────────────────────────
  Future<List<AssetEntity>> _loadAssets(RequestType type) async {
    try {
      debugPrint('[Streamer] Requesting PhotoManager permissions ($type)...');
      final PermissionState ps = await PhotoManager.requestPermissionExtend(
        requestOption: const PermissionRequestOption(
          androidPermission: AndroidPermission(
            type: RequestType.all,
            mediaLocation: false,
          ),
        ),
      );
      debugPrint('[Streamer] Permission state: $ps');
      if (!ps.isAuth && ps != PermissionState.limited) {
        debugPrint('[Streamer] Permission rejected ($type)');
        return [];
      }

      // 1. Try with filter first
      List<AssetPathEntity> paths = [];
      try {
        final FilterOptionGroup filter = FilterOptionGroup(
          imageOption: const FilterOption(sizeConstraint: SizeConstraint(ignoreSize: true)),
          videoOption: const FilterOption(sizeConstraint: SizeConstraint(ignoreSize: true)),
          audioOption: const FilterOption(sizeConstraint: SizeConstraint(ignoreSize: true)),
        );
        paths = await PhotoManager.getAssetPathList(
          type: type,
          filterOption: filter,
        );
      } catch (e) {
        debugPrint('[Streamer] Filtered getAssetPathList failed, falling back to default: $e');
      }

      // 2. Fallback without filter if empty
      if (paths.isEmpty) {
        try {
          paths = await PhotoManager.getAssetPathList(type: type);
        } catch (e) {
          debugPrint('[Streamer] Default getAssetPathList failed: $e');
        }
      }

      debugPrint('[Streamer] [$type] paths found: ${paths.length}');

      // Aggregate assets across all album folders and deduplicate by ID
      final Map<String, AssetEntity> aggregated = {};

      for (final path in paths) {
        await _safeCollectPathAssets(path, aggregated);
      }

      // 3. Fallback: If type is RequestType.video and aggregated count is 0 (or paths is empty),
      // query RequestType.all and filter for AssetType.video across OEM directories
      if (type == RequestType.video && aggregated.isEmpty) {
        debugPrint('[Streamer] Video count is 0, attempting fallback via RequestType.all...');
        try {
          final allPaths = await PhotoManager.getAssetPathList(type: RequestType.all);
          for (final path in allPaths) {
            await _safeCollectPathAssets(path, aggregated, filterType: AssetType.video);
          }
        } catch (e) {
          debugPrint('[Streamer] Fallback RequestType.all for videos failed: $e');
        }
      }

      // 4. Fallback for Audio if aggregated is empty
      if (type == RequestType.audio && aggregated.isEmpty) {
        debugPrint('[Streamer] Audio count is 0, attempting fallback via RequestType.all...');
        try {
          final allPaths = await PhotoManager.getAssetPathList(type: RequestType.all);
          for (final path in allPaths) {
            await _safeCollectPathAssets(path, aggregated, filterType: AssetType.audio);
          }
        } catch (e) {
          debugPrint('[Streamer] Fallback RequestType.all for audio failed: $e');
        }
      }

      debugPrint('[Streamer] [$type] total aggregated from ${paths.length} paths: ${aggregated.length}');
      return aggregated.values.toList();
    } catch (e, stack) {
      debugPrint('[Streamer] Error loading [$type] assets: $e\n$stack');
      return [];
    }
  }

  /// Load all images from the MediaStore (gallery)
  Future<List<AssetEntity>> loadLocalImages() => _loadAssets(RequestType.image);

  /// Load all audio files from the MediaStore
  Future<List<AssetEntity>> loadLocalAudio() => _loadAssets(RequestType.audio);

  /// Load video-only assets (for a dedicated Videos tab if needed)
  Future<List<AssetEntity>> loadLocalVideos() => _loadAssets(RequestType.video);

  Future<void> _sendMetadataPacket({
    required int fileId,
    required String assetId,
    required String name,
    required int size,
    double? latitude,
    double? longitude,
    String? createDate,
    double? duration,
  }) async {
    final Map<String, dynamic> metadataMap = {
      "file_id": fileId,
      "asset_id": assetId,
      "name": name,
      "size": size,
    };
    if (latitude != null && latitude != 0.0) {
      metadataMap["latitude"] = latitude;
    }
    if (longitude != null && longitude != 0.0) {
      metadataMap["longitude"] = longitude;
    }
    if (createDate != null && createDate.isNotEmpty) {
      metadataMap["create_date"] = createDate;
    }
    if (duration != null && duration > 0) {
      metadataMap["duration"] = duration;
    }
    final payloadStr = jsonEncode(metadataMap);
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
      File? file;
      try {
        file = await entity.file.timeout(const Duration(seconds: 3), onTimeout: () => null);
      } catch (_) {}
      if (file == null) {
        try {
          file = await entity.originFile.timeout(const Duration(seconds: 3), onTimeout: () => null);
        } catch (_) {}
      }
      if (file == null) {
        debugPrint("[Streamer] Error: could not obtain file/originFile for asset: ${entity.title}");
        return false;
      }
      final int size = await file.length();
      final String safeId = sanitizeId(entity.id);
      String rawTitle = entity.title ?? '';
      String cleanTitle = rawTitle.replaceAll(RegExp(r'[/\\:*?"<>|]'), '_').trim();
      String cleanName = cleanTitle.isNotEmpty ? cleanTitle : (entity.type == AssetType.video ? 'video_$safeId.mp4' : 'photo_$safeId.jpg');
      if (!cleanName.contains('.')) {
        final String extension = entity.mimeType?.split('/').last ?? (entity.type == AssetType.video ? 'mp4' : 'jpg');
        cleanName = '$cleanName.$extension';
      }

      // Obtain GPS coordinates asynchronously (required for Android 10+)
      final LatLng? latLng = await entity.latlngAsync();
      final double? lat = (latLng != null && latLng.latitude != 0.0) ? latLng.latitude : null;
      final double? lng = (latLng != null && latLng.longitude != 0.0) ? latLng.longitude : null;

      final int? createSec = (entity.createDateSecond != null && entity.createDateSecond! > 0)
          ? entity.createDateSecond
          : entity.modifiedDateSecond;
      String? createDateStr;
      if (createSec != null && createSec > 0) {
        createDateStr = DateTime.fromMillisecondsSinceEpoch(createSec * 1000, isUtc: true).toIso8601String();
      }
      final double durationSec = entity.duration.toDouble();

      // Send metadata first
      await _sendMetadataPacket(
        fileId: fileId,
        assetId: entity.id,
        name: cleanName,
        size: size,
        latitude: lat,
        longitude: lng,
        createDate: createDateStr,
        duration: durationSec,
      );

      return await _streamFileInternal(file: file, fileId: fileId, onProgress: onProgress);
    } catch (e, stack) {
      debugPrint("[Streamer] Exception during gallery asset streaming: $e\n$stack");
      return false;
    }
  }

  /// Stream a selected audio entity chunk-by-chunk using RandomAccessFile to avoid memory OOM
  Future<bool> streamAudio({
    required AssetEntity entity,
    required int fileId,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    debugPrint("[Streamer] Starting transmission of audio asset: ${entity.title}, ID: $fileId");
    try {
      File? file;
      try {
        file = await entity.file.timeout(const Duration(seconds: 3), onTimeout: () => null);
      } catch (_) {}
      if (file == null) {
        try {
          file = await entity.originFile.timeout(const Duration(seconds: 3), onTimeout: () => null);
        } catch (_) {}
      }
      if (file == null) {
        debugPrint("[Streamer] Error: could not obtain file/originFile for audio asset: ${entity.title}");
        return false;
      }
      final int size = await file.length();
      String cleanName = entity.title ?? 'audio_${entity.id}.mp3';
      if (!cleanName.contains('.')) {
        final String extension = entity.mimeType?.split('/').last ?? 'mp3';
        cleanName = '$cleanName.$extension';
      }

      final int? createSec = (entity.createDateSecond != null && entity.createDateSecond! > 0)
          ? entity.createDateSecond
          : entity.modifiedDateSecond;
      String? createDateStr;
      if (createSec != null && createSec > 0) {
        createDateStr = DateTime.fromMillisecondsSinceEpoch(createSec * 1000, isUtc: true).toIso8601String();
      }
      final double durationSec = entity.duration.toDouble();

      // Send metadata first
      await _sendMetadataPacket(
        fileId: fileId,
        assetId: entity.id,
        name: cleanName,
        size: size,
        createDate: createDateStr,
        duration: durationSec,
      );

      return await _streamFileInternal(file: file, fileId: fileId, onProgress: onProgress);
    } catch (e, stack) {
      debugPrint("[Streamer] Exception during audio asset streaming: $e\n$stack");
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
        // If DataChannel write buffer exceeds 128KB, yield execution and wait to prevent SCTP overflow
        while (syncEngine != null && syncEngine!.getBufferedAmount() > 128 * 1024) {
          await Future.delayed(const Duration(milliseconds: 15));
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

        // Yield execution to allow WebRTC I/O event loop and keepalive timers to breathe
        if (chunkIndex % 3 == 0) {
          await Future.delayed(const Duration(milliseconds: 2));
        }
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

  Future<bool> _streamBytesInternal({
    required Uint8List data,
    required int fileId,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    final engine = syncEngine;
    if (engine == null) return false;
    const int chunkSize = 32 * 1024; // 32KB chunks
    final int totalChunks = (data.length / chunkSize).ceil();
    int bytesSent = 0;

    for (int chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      while (engine.getBufferedAmount() > 1000000) {
        await Future.delayed(const Duration(milliseconds: 30));
      }

      final int payloadSize = (bytesSent + chunkSize < data.length) ? chunkSize : (data.length - bytesSent);
      final Uint8List chunkBytes = data.sublist(bytesSent, bytesSent + payloadSize);

      final ByteData headerData = ByteData(16);
      headerData.setInt32(0, fileId, Endian.big);
      headerData.setInt32(4, chunkIndex, Endian.big);
      headerData.setInt32(8, totalChunks, Endian.big);
      headerData.setInt32(12, payloadSize, Endian.big);

      final Uint8List packet = Uint8List(16 + payloadSize);
      packet.setRange(0, 16, headerData.buffer.asUint8List());
      packet.setRange(16, 16 + payloadSize, chunkBytes);

      final bool success = await engine.sendBinary(packet);
      if (!success) {
        debugPrint("[Streamer] Failed to write chunk $chunkIndex over DataChannel");
        return false;
      }

      bytesSent += payloadSize;
      onProgress(chunkIndex, totalChunks, bytesSent);

      await Future.delayed(Duration.zero);
    }
    return true;
  }

  /// Helper to sanitize asset IDs for safe cross-platform file paths
  static String sanitizeId(String rawId) {
    return rawId.replaceAll(RegExp(r'[/\\:*?"<>|]'), '_');
  }

  /// Stream a selected thumbnail chunk-by-chunk using raw thumbnail bytes with multi-tier fallback
  Future<bool> streamThumbnail({
    required AssetEntity entity,
    required int fileId,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    debugPrint("[Streamer] Starting transmission of thumbnail for asset: ${entity.title}, ID: $fileId");
    try {
      Uint8List? thumbData;
      // 1. Try standard 400x400 JPEG thumbnail
      try {
        thumbData = await entity.thumbnailDataWithSize(
          const ThumbnailSize.square(400),
          format: ThumbnailFormat.jpeg,
          quality: 85,
        );
      } catch (e) {
        debugPrint("[Streamer] thumbnailDataWithSize JPEG failed for ${entity.id}: $e");
      }

      // 2. Fallback: try without explicit format (allows native WebP/PNG)
      if (thumbData == null) {
        try {
          thumbData = await entity.thumbnailDataWithSize(
            const ThumbnailSize.square(400),
            quality: 85,
          );
        } catch (_) {}
      }

      // 3. Fallback: try default thumbnailData
      if (thumbData == null) {
        try {
          thumbData = await entity.thumbnailData;
        } catch (_) {}
      }

      // 4. Fallback: read directly from file / originFile (e.g. for HEIC/RAW or unhandled codecs)
      if (thumbData == null) {
        try {
          File? f;
          try {
            f = await entity.file.timeout(const Duration(seconds: 2), onTimeout: () => null);
          } catch (_) {}
          if (f == null) {
            try {
              f = await entity.originFile.timeout(const Duration(seconds: 2), onTimeout: () => null);
            } catch (_) {}
          }
          if (f != null) {
            thumbData = await f.readAsBytes();
          }
        } catch (e) {
          debugPrint("[Streamer] File read fallback failed for ${entity.id}: $e");
        }
      }

      if (thumbData == null) {
        debugPrint("[Streamer] All thumbnail extraction methods failed for asset ${entity.id}");
        return false;
      }

      final String safeId = sanitizeId(entity.id);
      final String name = 'thumb_$safeId.jpg';
      final LatLng? latLng = await entity.latlngAsync();
      final double? lat = (latLng != null && latLng.latitude != 0.0) ? latLng.latitude : null;
      final double? lng = (latLng != null && latLng.longitude != 0.0) ? latLng.longitude : null;

      await _sendMetadataPacket(
        fileId: fileId,
        assetId: entity.id,
        name: name,
        size: thumbData.length,
        latitude: lat,
        longitude: lng,
      );

      return await _streamBytesInternal(
        data: thumbData,
        fileId: fileId,
        onProgress: onProgress,
      );
    } catch (e, stack) {
      debugPrint("[Streamer] Exception during thumbnail streaming: $e\n$stack");
      return false;
    }
  }

  /// Stream an original full-resolution photo to the PC for album sync.
  /// Name is prefixed with 'album_' so PC side can distinguish from regular transfers.
  /// createDate is sent in metadata for breakpoint resume tracking.
  Future<bool> streamOriginalPhoto({
    required AssetEntity entity,
    required int fileId,
    required void Function(int chunkIndex, int totalChunks, int bytesSent) onProgress,
  }) async {
    debugPrint("[Streamer] Starting album original photo stream: ${entity.title}, ID: $fileId");
    try {
      File? file;
      try {
        file = await entity.file.timeout(const Duration(seconds: 3), onTimeout: () => null);
      } catch (_) {}
      if (file == null) {
        try {
          file = await entity.originFile.timeout(const Duration(seconds: 3), onTimeout: () => null);
        } catch (_) {}
      }
      if (file == null) {
        debugPrint("[Streamer] Error: could not obtain file/originFile for album asset: ${entity.title}");
        return false;
      }
      final int size = await file.length();
      final String extension = entity.mimeType?.split('/').last ?? 'jpg';
      // Use album_ prefix so PC can identify this as an album sync file
      final String safeId = sanitizeId(entity.id);
      final String albumName = 'album_$safeId.$extension';

      // Build metadata with createDate for breakpoint tracking
      final int? createSec = (entity.createDateSecond != null && entity.createDateSecond! > 0)
          ? entity.createDateSecond
          : entity.modifiedDateSecond;
      final String createDateStr = (createSec != null && createSec > 0)
          ? DateTime.fromMillisecondsSinceEpoch(createSec * 1000).toUtc().toIso8601String()
          : DateTime.now().toUtc().toIso8601String();

      final Map<String, dynamic> metadataMap = {
        "file_id": fileId,
        "asset_id": entity.id,
        "name": albumName,
        "size": size,
        "create_date": createDateStr,
      };
      final LatLng? latLng = await entity.latlngAsync();
      if (latLng != null && latLng.latitude != 0.0) {
        metadataMap["latitude"] = latLng.latitude;
      }
      if (latLng != null && latLng.longitude != 0.0) {
        metadataMap["longitude"] = latLng.longitude;
      }

      final payloadStr = jsonEncode(metadataMap);
      final payloadBytes = utf8.encode(payloadStr);
      final header = ByteData(16);
      header.setInt32(0, -5, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, payloadBytes.length, Endian.big);
      final packet = Uint8List(16 + payloadBytes.length);
      packet.setRange(0, 16, header.buffer.asUint8List(header.offsetInBytes, 16));
      packet.setRange(16, packet.length, payloadBytes);
      await syncEngine?.sendBinary(packet);

      return await _streamFileInternal(file: file, fileId: fileId, onProgress: onProgress);
    } catch (e, stack) {
      debugPrint("[Streamer] Exception during album photo streaming: $e\n$stack");
      return false;
    }
  }
}
