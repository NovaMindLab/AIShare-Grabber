import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class HttpSignalingClient {
  static final HttpClient _client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 2)
    ..idleTimeout = const Duration(seconds: 5);

  /// Send WebRTC Offer SDP to PC target IPs over HTTP TCP.
  /// Races all provided IPs in parallel and returns the first successful Answer SDP.
  static Future<Map<String, dynamic>?> exchangeSdp({
    required List<String> targetIps,
    int port = 15186,
    required String offerSdp,
    List<Map<String, dynamic>>? candidates,
  }) async {
    if (targetIps.isEmpty) return null;

    final completer = Completer<Map<String, dynamic>?>();
    int pending = targetIps.length;

    for (final ip in targetIps) {
      _sendOfferToSingleIp(
        ip: ip,
        port: port,
        offerSdp: offerSdp,
        candidates: candidates,
      ).then((result) {
        if (result != null && !completer.isCompleted) {
          completer.complete(result);
        } else {
          pending--;
          if (pending <= 0 && !completer.isCompleted) {
            completer.complete(null);
          }
        }
      }).catchError((_) {
        pending--;
        if (pending <= 0 && !completer.isCompleted) {
          completer.complete(null);
        }
      });
    }

    return completer.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () => null,
    );
  }

  static Future<Map<String, dynamic>?> _sendOfferToSingleIp({
    required String ip,
    required int port,
    required String offerSdp,
    List<Map<String, dynamic>>? candidates,
  }) async {
    try {
      final uri = Uri.parse('http://$ip:$port/api/signal');
      debugPrint('[HttpSignaling] POST offer to $uri ...');
      final request = await _client.postUrl(uri).timeout(const Duration(seconds: 3));
      request.headers.contentType = ContentType.json;
      
      final body = jsonEncode({
        'type': 'offer',
        'sdp': offerSdp,
        'candidates': candidates ?? [],
      });
      request.write(body);

      final response = await request.close().timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final respStr = await response.transform(utf8.decoder).join();
        final Map<String, dynamic> data = jsonDecode(respStr);
        if (data['success'] == true && data['sdp'] != null) {
          debugPrint('[HttpSignaling] Successfully exchanged SDP via HTTP with $ip:$port');
          data['connected_ip'] = ip;
          return data;
        }
      } else {
        debugPrint('[HttpSignaling] HTTP response ${response.statusCode} from $ip:$port');
      }
    } catch (e) {
      debugPrint('[HttpSignaling] Failed to connect to $ip:$port : $e');
    }
    return null;
  }

  /// Send additional local ICE candidate to PC target over HTTP.
  static Future<bool> sendIceCandidate({
    required String ip,
    int port = 15186,
    required RTCIceCandidate candidate,
  }) async {
    try {
      final uri = Uri.parse('http://$ip:$port/api/ice');
      final request = await _client.postUrl(uri).timeout(const Duration(seconds: 2));
      request.headers.contentType = ContentType.json;
      final body = jsonEncode({
        'candidate': {
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        }
      });
      request.write(body);
      final response = await request.close().timeout(const Duration(seconds: 2));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Quick LAN probe to test if PC HTTP signaling server is active
  static Future<Map<String, dynamic>?> probePc(String ip, {int port = 15186}) async {
    try {
      final uri = Uri.parse('http://$ip:$port/ping');
      final request = await _client.getUrl(uri).timeout(const Duration(milliseconds: 1200));
      final response = await request.close().timeout(const Duration(milliseconds: 1200));
      if (response.statusCode == 200) {
        final respStr = await response.transform(utf8.decoder).join();
        return jsonDecode(respStr) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }
}
