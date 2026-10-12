import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';

/// Lightweight embedded HTTP server providing HTTP 206 Partial Content (Range)
/// streaming of mobile video files to PC without requiring full file download.
class VideoStreamService {
  static VideoStreamService? _instance;
  static VideoStreamService get instance => _instance ??= VideoStreamService._();

  VideoStreamService._();

  HttpServer? _server;
  int _port = 0;
  String _sessionToken = '';
  List<AssetEntity> _videos = [];
  final Map<String, AssetEntity> _videoMap = {};

  int get port => _port;
  String get sessionToken => _sessionToken;
  bool get isRunning => _server != null;

  /// Start the lightweight HTTP streaming server on an OS-assigned free port (port 0).
  Future<int> start({
    required List<AssetEntity> videos,
    String? sessionToken,
  }) async {
    await stop();

    _videos = videos;
    _videoMap.clear();
    for (final v in videos) {
      _videoMap[v.id] = v;
    }

    _sessionToken = sessionToken ?? _generateToken();

    try {
      // Bind to any IPv4 with port 0 (OS automatically selects a free port)
      _server = await HttpServer.bind(
        InternetAddress.anyIPv4,
        0,
        shared: true,
      );
      _port = _server!.port;
      debugPrint('[VideoStreamService] Started on port $_port with token $_sessionToken');

      _server!.listen(
        _handleRequest,
        onError: (err) {
          debugPrint('[VideoStreamService] Server error: $err');
        },
        cancelOnError: false,
      );

      return _port;
    } catch (e) {
      debugPrint('[VideoStreamService] Failed to bind: $e');
      _server = null;
      _port = 0;
      return 0;
    }
  }

  void updateVideos(List<AssetEntity> videos) {
    _videos = videos;
    _videoMap.clear();
    for (final v in videos) {
      _videoMap[v.id] = v;
    }
  }

  Future<void> stop() async {
    if (_server != null) {
      try {
        await _server!.close(force: true);
      } catch (_) {}
      _server = null;
    }
    _port = 0;
    _videoMap.clear();
    _videos = [];
  }

  static String _generateToken() {
    final rand = Random.secure();
    final values = List<int>.generate(16, (i) => rand.nextInt(256));
    return values.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  /// Discover all valid non-loopback IPv4 addresses on the device (Wi-Fi, AP hotspot, etc.)
  static Future<List<String>> getLocalIps() async {
    final ips = <String>[];
    try {
      final interfaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLoopback: false,
      );
      for (final iface in interfaces) {
        for (final addr in iface.addresses) {
          if (!addr.isLoopback &&
              !addr.address.startsWith('127.') &&
              !addr.address.startsWith('169.254.')) {
            ips.add(addr.address);
          }
        }
      }
      // Prioritize standard Wi-Fi LAN subnets (192.168.x.x > 172.x.x.x > 10.x.x.x)
      ips.sort((a, b) {
        int scoreA = a.startsWith('192.168.') ? 3 : (a.startsWith('172.') ? 2 : (a.startsWith('10.') ? 1 : 0));
        int scoreB = b.startsWith('192.168.') ? 3 : (b.startsWith('172.') ? 2 : (b.startsWith('10.') ? 1 : 0));
        return scoreB.compareTo(scoreA);
      });
    } catch (e) {
      debugPrint('[VideoStreamService] getLocalIps error: $e');
    }
    return ips;
  }

  Future<void> _handleRequest(HttpRequest request) async {
    final response = request.response;

    // 1. CORS headers to permit Chromium / Electron <video> element playback
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type');
    response.headers.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    if (request.method == 'OPTIONS') {
      response.statusCode = HttpStatus.noContent;
      await response.close();
      return;
    }

    if (request.uri.path != '/stream/video') {
      response.statusCode = HttpStatus.notFound;
      await response.close();
      return;
    }

    // 2. Validate token
    final token = request.uri.queryParameters['token'];
    if (_sessionToken.isNotEmpty && token != _sessionToken) {
      response.statusCode = HttpStatus.forbidden;
      response.write('Forbidden: Invalid session token');
      await response.close();
      return;
    }

    // 3. Find video asset
    final id = request.uri.queryParameters['id'];
    if (id == null || id.isEmpty) {
      response.statusCode = HttpStatus.badRequest;
      response.write('Missing video id');
      await response.close();
      return;
    }

    AssetEntity? asset = _videoMap[id];
    if (asset == null) {
      for (final v in _videos) {
        if (v.id == id || 'video_${v.id}' == id) {
          asset = v;
          break;
        }
      }
    }

    if (asset == null) {
      response.statusCode = HttpStatus.notFound;
      response.write('Video asset not found: $id');
      await response.close();
      return;
    }

    // 4. Obtain File handle from MediaStore
    File? file;
    try {
      file = await asset.file.timeout(const Duration(seconds: 2), onTimeout: () => null);
      file ??= await asset.originFile.timeout(const Duration(seconds: 2), onTimeout: () => null);
    } catch (e) {
      debugPrint('[VideoStreamService] Error getting file for $id: $e');
    }

    if (file == null || !await file.exists()) {
      response.statusCode = HttpStatus.notFound;
      response.write('Video physical file not found');
      await response.close();
      return;
    }

    final totalLength = await file.length();
    final mimeType = _getContentType(file.path);

    // 5. Parse Range Header
    final rangeHeader = request.headers.value('range');

    int start = 0;
    int end = totalLength - 1;
    bool isRange = false;

    if (rangeHeader != null && rangeHeader.startsWith('bytes=')) {
      isRange = true;
      final rangeSpec = rangeHeader.substring(6);
      final parts = rangeSpec.split('-');
      if (parts.isNotEmpty && parts[0].isNotEmpty) {
        start = int.tryParse(parts[0]) ?? 0;
      }
      if (parts.length > 1 && parts[1].isNotEmpty) {
        final parsedEnd = int.tryParse(parts[1]);
        if (parsedEnd != null && parsedEnd < totalLength) {
          end = parsedEnd;
        }
      }
      if (start > end || start >= totalLength) {
        response.statusCode = HttpStatus.requestedRangeNotSatisfiable;
        response.headers.set('Content-Range', 'bytes */$totalLength');
        await response.close();
        return;
      }

      response.statusCode = HttpStatus.partialContent; // 206
      response.headers.set('Content-Range', 'bytes $start-$end/$totalLength');
    } else {
      response.statusCode = HttpStatus.ok; // 200
    }

    final contentLength = end - start + 1;
    response.headers.set('Accept-Ranges', 'bytes');
    response.headers.set('Content-Length', contentLength);
    response.headers.set('Content-Type', mimeType);

    if (request.method == 'HEAD') {
      await response.close();
      return;
    }

    // 6. Zero-copy stream from RandomAccessFile directly to response socket
    RandomAccessFile? raf;
    try {
      raf = await file.open(mode: FileMode.read);
      await raf.setPosition(start);

      const chunkSize = 64 * 1024; // 64KB buffer
      int remaining = contentLength;

      while (remaining > 0) {
        final toRead = min(remaining, chunkSize);
        final bytes = await raf.read(toRead);
        if (bytes.isEmpty) break;

        response.add(bytes);
        remaining -= bytes.length;
        await response.flush();
      }
    } catch (_) {
      // Client closed connection (e.g. user seeked or closed player)
    } finally {
      try {
        await raf?.close();
      } catch (_) {}
      try {
        await response.close();
      } catch (_) {}
    }
  }

  static String _getContentType(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.mkv')) return 'video/x-matroska';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.avi')) return 'video/x-msvideo';
    return 'video/mp4';
  }
}
