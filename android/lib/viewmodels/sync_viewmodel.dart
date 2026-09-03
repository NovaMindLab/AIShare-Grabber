import 'dart:async';
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart' hide ThumbnailSize;
import 'package:file_picker/file_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/qr_payload.dart';
import '../services/ble_signaling_client.dart';
import '../services/http_signaling_client.dart';
import '../services/webrtc_sync_engine.dart';
import '../services/photo_streamer.dart';
import '../services/ai_classification_service.dart';
import 'package:wifi_iot/wifi_iot.dart';
import 'package:permission_handler/permission_handler.dart';

enum AppState {
  idle,
  home,        // Landing screen with gallery preview and connect button
  scanning,
  connectingBle,
  negotiatingMtu,
  discoveringGatt,
  generatingOffer,
  sendingOffer,
  waitingForAnswer,
  connectingWebRtc,
  connected,
  failed,
}

enum TransferStatus {
  pending,
  transferring,
  completed,
  failed,
}

class SyncViewModel extends ChangeNotifier {
  static const String appVersion = '3.0.5';
  List<Map<String, dynamic>> discoveredPCs = [];
  Timer? _discoveryTimer;
  String? _mobileName;
  QrPayload? _lastScannedPayload;
  RawDatagramSocket? _udpSocket;
  // Core Engines
  late final BleSignalingClient _bleClient;
  WebRtcSyncEngine? _syncEngine;
  PhotoStreamer? _photoStreamer;

  // View States
  AppState appState = AppState.idle;
  List<AssetEntity> localImages = [];   // photos (gallery)
  List<AssetEntity> localVideos = [];   // videos (gallery)
  List<AssetEntity> localAudios = [];   // music/audio from MediaStore
  final Set<String> selectedImages = {};
  final Set<String> selectedVideos = {};
  final Set<String> selectedAudios = {};
  List<PlatformFile> chosenFiles = [];
  String? activeTransferName;
  double activeProgress = 0.0;
  double activeSpeedKbps = 0.0;
  final Map<String, TransferStatus> transferStatusMap = {};
  final List<String> messageLog = [];
  bool permissionsGranted = false;
  String errorMsg = "";

  String? deviceUuid;
  String? deviceName;
  static const _channel = MethodChannel('com.shareclip/system_info');
  Map<String, dynamic>? systemInfo;
  final Set<String> pcSyncedIds = {};
  final Set<String> pcSyncedThumbnailIds = {};
  bool _isCleanedUp = false;
  bool _remoteAnswerApplied = false;
  final Map<int, List<Uint8List>> _chunkedBuffers = {};
  final Map<String, List<String?>> _udpSdpChunkBuffers = {};

  bool isThumbnailSyncing = false;
  int thumbnailSyncTotal = 0;
  int thumbnailSyncDone = 0;

  bool isAlbumSyncing = false;
  int albumSyncTotal = 0;
  int albumSyncDone = 0;
  String lastAlbumSyncDate = '';
  bool isAlbumSyncPaused = false;

  bool isVideoSyncing = false;
  int videoSyncTotal = 0;
  int videoSyncDone = 0;
  String lastVideoSyncDate = '';
  bool isVideoSyncPaused = false;

  bool isAudioSyncing = false;
  int audioSyncTotal = 0;
  int audioSyncDone = 0;
  String lastAudioSyncDate = '';
  bool isAudioSyncPaused = false;

  final AiClassificationService aiService = AiClassificationService();
  bool isAiVectorSyncing = false;

  int _fileIdCounter = 100;
  Timer? _heartbeatTimer;
  DateTime _lastHeartbeatReceived = DateTime.now();

  SyncViewModel() {
    initDeviceUuid();
    aiService.addListener(notifyListeners);
    _bleClient = BleSignalingClient();
    
    // Bind BLE client events
    _bleClient.onAnswerSdpReceived = (answerSdp) {
      _handleRemoteAnswer(answerSdp);
    };
    
    _bleClient.onIceCandidateReceived = (sdpMid, sdpMLineIndex, candidate) {
      _syncEngine?.addRemoteIceCandidate(sdpMid, sdpMLineIndex, candidate);
    };

    // Observe BLE signaling state
    _bleClient.connectionState.addListener(_onBleStateChanged);
    _bleClient.errorNotifier.addListener(() {
      if (_bleClient.errorNotifier.value.isNotEmpty) {
        logMessage("BLE Error: ${_bleClient.errorNotifier.value}");
        errorMsg = _bleClient.errorNotifier.value;
        appState = AppState.failed;
        notifyListeners();
      }
    });
  }

  void setPermissionsGranted(bool granted) {
    permissionsGranted = granted;
    notifyListeners();
    if (granted) {
      _startUdpListener();
      if (appState == AppState.idle) {
        appState = AppState.home;
        notifyListeners();
      }
    }
  }

  /// Load gallery, audio and video assets early (before WebRTC connection).
  void loadGalleryEarly() async {
    final streamer = PhotoStreamer.standalone();

    // Load images, videos and audio in parallel
    final results = await Future.wait([
      streamer.loadLocalImages(),
      streamer.loadLocalVideos(),
      streamer.loadLocalAudio(),
    ]);

    localImages = results[0];
    localVideos = results[1];
    localAudios = results[2];

    debugPrint('[ViewModel] Gallery loaded: ${localImages.length} images, ${localVideos.length} videos, ${localAudios.length} audio');
    notifyListeners();
  }

  void startScanning() {
    appState = AppState.scanning;
    errorMsg = "";
    notifyListeners();
    logMessage("Camera QR scanner active. Awaiting payload...");
  }

  void returnHome() {
    appState = AppState.home;
    errorMsg = "";
    notifyListeners();
  }

  // Phase 1 scanned trigger
  void connectToTarget(QrPayload payload) {
    _lastScannedPayload = payload;
    
    if (payload.pcIps != null && payload.pcIps!.isNotEmpty) {
      logMessage("⚡ 扫描到电脑 IP (${payload.pcIps!.join(', ')}，HTTP 端口: ${payload.httpPort})，启动极速局域网直连信令...");
      appState = AppState.connectingWebRtc;
      notifyListeners();
      _initializeWebRtc(isUdpFallback: true);
      
      Timer(const Duration(seconds: 12), () {
        if (appState != AppState.connected && appState != AppState.failed) {
          logMessage("局域网直连超时 (12s)。正在尝试回退至蓝牙信令...");
          cleanup();
          appState = AppState.connectingBle;
          notifyListeners();
          
          if (payload.bleMac.isNotEmpty) {
            _bleClient.startConnect(
              mac: payload.bleMac,
              serviceUuid: payload.serviceUuid,
              charUuid: payload.charUuid,
              sessionId: payload.sessionId,
            );
          } else if (payload.hotspotSsid != null) {
            _triggerHotspotFallback(payload);
          } else {
            errorMsg = "局域网直连失败且当前电脑无可用蓝牙";
            appState = AppState.failed;
            notifyListeners();
          }
        }
      });
      return;
    }

    if (payload.bleMac.isEmpty && payload.hotspotSsid != null) {
      logMessage("二维码指示无蓝牙支持，正在自动连接电脑热点...");
      _triggerHotspotFallback(payload);
      return;
    }

    logMessage("QR Code parsed. Scanning BLE target: ${payload.bleMac}");
    appState = AppState.connectingBle;
    notifyListeners();

    _bleClient.startConnect(
      mac: payload.bleMac,
      serviceUuid: payload.serviceUuid,
      charUuid: payload.charUuid,
      sessionId: payload.sessionId,
    );
  }

  void _onBleStateChanged() {
    final bleState = _bleClient.connectionState.value;
    logMessage("BLE State update: $bleState");

    switch (bleState) {
      case BleState.idle:
        if (appState != AppState.connected && appState != AppState.scanning && appState != AppState.idle) {
          appState = AppState.idle;
          notifyListeners();
        }
        break;
      case BleState.scanning:
        appState = AppState.scanning;
        notifyListeners();
        break;
      case BleState.connecting:
        appState = AppState.connectingBle;
        notifyListeners();
        break;
      case BleState.negotiatingMtu:
        appState = AppState.negotiatingMtu;
        notifyListeners();
        break;
      case BleState.discoveringServices:
        appState = AppState.discoveringGatt;
        notifyListeners();
        break;
      case BleState.connected:
        _initializeWebRtc();
        break;
      case BleState.failed:
        if (_lastScannedPayload?.hotspotSsid != null) {
          logMessage("BLE Failed. Triggering Wi-Fi Hotspot Fallback...");
          _triggerHotspotFallback(_lastScannedPayload!);
        } else {
          errorMsg = _bleClient.errorNotifier.value;
          appState = AppState.failed;
          notifyListeners();
        }
        break;
    }
  }

  Future<void> _triggerHotspotFallback(QrPayload payload) async {
    if (payload.hotspotSsid == null || payload.hotspotSsid!.isEmpty) {
      errorMsg = "无可用电脑热点信息";
      appState = AppState.failed;
      notifyListeners();
      return;
    }

    logMessage("BLE未建立，正在自动连入电脑热点: ${payload.hotspotSsid}");
    appState = AppState.connectingWebRtc;
    notifyListeners();

    try {
      if (Platform.isAndroid) {
        await Permission.location.request();
        await Permission.nearbyWifiDevices.request();
      }

      bool connected = false;
      const platform = MethodChannel('com.shareclip/system_info');

      // 1. Try native silent connection (never launches Settings intent or exits app)
      for (int i = 0; i < 3; i++) {
        logMessage("自动无感连入热点 ${payload.hotspotSsid} (第 ${i + 1} 次尝试)...");
        try {
          final bool? res = await platform.invokeMethod<bool>('connectWifiSilent', {
            'ssid': payload.hotspotSsid,
            'password': payload.hotspotPassword,
          });
          if (res == true) {
            connected = true;
            break;
          }
        } catch (err) {
          logMessage("Silent Wi-Fi Attempt ${i + 1} error: $err");
        }

        // 2. Fallback attempt without joining System Intent
        try {
          connected = await WiFiForIoTPlugin.connect(
            payload.hotspotSsid!,
            password: payload.hotspotPassword,
            security: NetworkSecurity.WPA,
            withInternet: false,
          );
        } catch (_) {}

        if (connected) break;
        await Future.delayed(const Duration(milliseconds: 1200));
      }

      if (connected) {
        logMessage("🎉 热点自动连接成功！绑定网络流量接口...");
        try {
          await WiFiForIoTPlugin.forceWifiUsage(true);
        } catch (_) {}

        logMessage("启动热点 UDP 直连信令...");
        _initializeWebRtc(isUdpFallback: true);
      } else {
        logMessage("⚠️ 自动连接热点超时，请检查热点或手动连接。");
        errorMsg = "自动连接电脑热点 (${payload.hotspotSsid}) 失败，请检查热点密码或尝试手动连接 Wi-Fi";
        appState = AppState.failed;
        notifyListeners();
      }
    } catch (e) {
      errorMsg = "Wi-Fi 错误: $e";
      appState = AppState.failed;
      notifyListeners();
    }
  }

  Future<void> _initMobileName() async {
    if (_mobileName != null) return;
    try {
      final deviceInfo = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        _mobileName = androidInfo.model;
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        _mobileName = iosInfo.name;
      }
    } catch (_) {
      _mobileName = "Mobile Device";
    }
  }

  void _startUdpDiscoveryBroadcast() {
    _discoveryTimer?.cancel();
    _discoveryTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (appState == AppState.connected) return;
      await _initMobileName();
      _sendUdp({
        'type': 'ShareCLIP_Discovery',
        'device_uuid': deviceUuid ?? 'mobile-device-uuid',
        'device_name': _mobileName ?? 'Mobile',
        'device_type': 'Mobile',
      });
      
      // Prune old PCs
      final now = DateTime.now().millisecondsSinceEpoch;
      bool changed = false;
      discoveredPCs.removeWhere((pc) {
        if (now - (pc['lastSeen'] as int) > 10000) {
          changed = true;
          return true;
        }
        return false;
      });
      if (changed) notifyListeners();
    });
  }

  void connectToPC(String ip, String name) async {
    logMessage("Connecting to LAN PC $name ($ip)...");
    appState = AppState.connectingWebRtc;
    notifyListeners();
    await _initMobileName();

    _lastScannedPayload = QrPayload(
      bleMac: '',
      serviceUuid: '',
      charUuid: '',
      sessionId: 'lan-${DateTime.now().millisecondsSinceEpoch}',
      pcIps: [ip],
    );

    _initializeWebRtc(isUdpFallback: true); 
  }

  Future<void> _startUdpListener() async {
    // Guard: don't rebind if already listening
    if (_udpSocket != null) return;
    try {
      // Bind to 15185 to receive broadcasts from PC (reusePort must be false on Linux/Android)
      _udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 15185, reuseAddress: true, reusePort: false);
      _udpSocket!.broadcastEnabled = true;
      _startUdpDiscoveryBroadcast();
      
      _udpSocket!.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          Datagram? dg = _udpSocket!.receive();
          if (dg != null) {
            try {
              final msg = utf8.decode(dg.data);
              final data = json.decode(msg);
              
              // Ignore packets sent by ourselves via broadcast loopback
              if (deviceUuid != null && (data['sender_uuid'] == deviceUuid || data['device_uuid'] == deviceUuid)) {
                return;
              }

              if (data['type'] == 'ShareCLIP_Discovery' && data['device_type'] == 'PC') {
                final existingIndex = discoveredPCs.indexWhere((pc) => pc['uuid'] == data['device_uuid']);
                if (existingIndex >= 0) {
                  discoveredPCs[existingIndex]['lastSeen'] = DateTime.now().millisecondsSinceEpoch;
                } else {
                  discoveredPCs.add({
                    'uuid': data['device_uuid'],
                    'name': data['device_name'],
                    'ip': dg.address.address,
                    'lastSeen': DateTime.now().millisecondsSinceEpoch,
                  });
                  notifyListeners();
                }
              } else if (data['type'] == 'ShareCLIP_Connect_Request') {
                // PC requested to connect to mobile
                // Accept immediately for seamless experience
                _initializeWebRtc(isUdpFallback: true);
                _sendUdp({
                   'type': 'ShareCLIP_Connect_Response',
                   'accept': true
                });
              } else if (data['type'] == 'ShareCLIP_Connect_Response') {
                 // PC responded to our request
                 if (data['accept'] == true && data['sdp'] != null) {
                    _handleRemoteOffer(data['sdp']);
                 }
              } else if (data['type'] == 'ShareCLIP_Direct_Sdp') {
                String? sdp = data['sdp'];
                if (data['totalChunks'] != null && data['totalChunks'] > 1) {
                  final key = "${data['sessionId']}_${data['sdpType']}";
                  _udpSdpChunkBuffers.putIfAbsent(key, () => List<String?>.filled(data['totalChunks'], null));
                  final buf = _udpSdpChunkBuffers[key]!;
                  final int idx = data['chunkIndex'] ?? 0;
                  if (idx >= 0 && idx < buf.length) {
                    buf[idx] = data['sdpChunk'];
                  }
                  if (buf.every((c) => c != null)) {
                    sdp = buf.join();
                    _udpSdpChunkBuffers.remove(key);
                  }
                }

                if (sdp != null && sdp.isNotEmpty) {
                  if (data['sdpType'] == 'answer' && appState != AppState.connected) {
                    logMessage("Received UDP Answer SDP");
                    _handleRemoteAnswer(sdp);
                  } else if (data['sdpType'] == 'offer') {
                    if (appState == AppState.idle || appState == AppState.scanning) {
                      logMessage("Received UDP Offer SDP");
                      _handleRemoteOffer(sdp);
                    }
                  }
                }
              } else if (data['type'] == 'ShareCLIP_Direct_Ice') {
                 final cand = json.decode(data['candidate']);
                 _syncEngine?.addRemoteIceCandidate(cand['sdpMid'], cand['sdpMLineIndex'], cand['candidate']);
              }
            } catch (_) {}
          }
        }
      });
    } catch (e) {
      logMessage("UDP listener error: $e");
    }
  }

  Future<void> _sendUdp(Map<String, dynamic> payload) async {
    if (_udpSocket == null) {
      await _startUdpListener();
    }
    if (_udpSocket == null) return;
    final payloadWithSender = Map<String, dynamic>.from(payload);
    if (deviceUuid != null) {
      payloadWithSender['sender_uuid'] = deviceUuid;
    }
    final bytes = utf8.encode(json.encode(payloadWithSender));

    final targets = <String>{};

    if (_lastScannedPayload?.pcIps != null && _lastScannedPayload!.pcIps!.isNotEmpty) {
      targets.addAll(_lastScannedPayload!.pcIps!);
    }

    targets.add('255.255.255.255');
    targets.add('192.168.137.1');
    targets.add('192.168.43.1');

    try {
      final String? ip = await WiFiForIoTPlugin.getIP();
      if (ip != null && ip.contains('.')) {
        final parts = ip.split('.');
        if (parts.length == 4) {
          final prefix = '${parts[0]}.${parts[1]}.${parts[2]}';
          targets.add('$prefix.255');
        }
      }
    } catch (_) {}

    for (var ipStr in targets) {
      try {
        _udpSocket!.send(bytes, InternetAddress(ipStr), 15185);
      } catch (_) {}
    }
  }

  void _sendUdpSdp(String sdp, String type) async {
    // 1. Direct send
    _sendUdp({
      'type': 'ShareCLIP_Direct_Sdp',
      'sdp': sdp,
      'sdpType': type
    });

    // 2. MTU-safe chunked send (prevents router packet dropping for >1400B UDP payloads)
    const int chunkSize = 800;
    final int totalChunks = (sdp.length / chunkSize).ceil();
    final String sess = DateTime.now().millisecondsSinceEpoch.toString();
    for (int i = 0; i < totalChunks; i++) {
      final int start = i * chunkSize;
      final int end = (start + chunkSize < sdp.length) ? start + chunkSize : sdp.length;
      final chunkStr = sdp.substring(start, end);
      _sendUdp({
        'type': 'ShareCLIP_Direct_Sdp',
        'sdpType': type,
        'sdpChunk': chunkStr,
        'chunkIndex': i,
        'totalChunks': totalChunks,
        'sessionId': sess,
      });
      await Future.delayed(const Duration(milliseconds: 15));
    }
  }

  void _sendUdpIce(RTCIceCandidate candidate) async {
    for (int i = 0; i < 3; i++) {
      _sendUdp({
         'type': 'ShareCLIP_Direct_Ice',
         'candidate': json.encode({
            'sdpMid': candidate.sdpMid,
            'sdpMLineIndex': candidate.sdpMLineIndex,
            'candidate': candidate.candidate
         })
      });
      await Future.delayed(const Duration(milliseconds: 80));
    }
  }

  void _initializeWebRtc({bool isUdpFallback = false}) async {
    logMessage("GATT signaling connected. Starting local WebRTC...");
    appState = AppState.generatingOffer;
    notifyListeners();

    final Map<int, List<Uint8List?>> incomingFiles = {};
    final Map<int, int> receivedChunksCount = {};

    _syncEngine = WebRtcSyncEngine(
      onLocalIceCandidate: (localCandidate) async {
        if (isUdpFallback) {
          if (_lastScannedPayload?.pcIps != null && _lastScannedPayload!.pcIps!.isNotEmpty) {
            for (final ip in _lastScannedPayload!.pcIps!) {
              HttpSignalingClient.sendIceCandidate(
                ip: ip,
                port: _lastScannedPayload!.httpPort,
                candidate: localCandidate,
              );
            }
          }
          _sendUdpIce(localCandidate);
        } else {
          await _bleClient.sendIceCandidate(
            localCandidate.sdpMid!,
            localCandidate.sdpMLineIndex!,
            localCandidate.candidate!,
          );
        }
      },
      onMessageReceived: (binaryData) async {
        try {
          if (binaryData.length < 16) {
            logMessage("WebRTC received invalid small packet: ${binaryData.length}B");
            return;
          }

          // Any valid packet received from PC proves WebRTC connection is 100% alive
          _lastHeartbeatReceived = DateTime.now();

          // Parse 16-byte header
          final byteData = ByteData.sublistView(binaryData, 0, 16);
          final fileId = byteData.getInt32(0, Endian.big);

          if (fileId == -1) {
            // Ping received from PC
            final pongHeader = ByteData(16);
            pongHeader.setInt32(0, -2, Endian.big);
            pongHeader.setInt32(4, 0, Endian.big);
            pongHeader.setInt32(8, 0, Endian.big);
            pongHeader.setInt32(12, 0, Endian.big);
            await _syncEngine?.sendBinary(pongHeader.buffer.asUint8List());
            return;
          }

          if (fileId == -2) {
            // Pong received
            _lastHeartbeatReceived = DateTime.now();
            return;
          }

          if (fileId == -5) {
            // Chunked Handshake Packet Receiver
            final realPacketType = byteData.getInt32(4, Endian.big);
            final chunkIndex = byteData.getInt32(8, Endian.big);
            final totalChunks = byteData.getInt32(12, Endian.big);
            final chunkData = binaryData.sublist(16);

            final buffer = _chunkedBuffers.putIfAbsent(realPacketType, () => []);
            buffer.add(chunkData);

            if (chunkIndex == totalChunks - 1) {
              final totalBytesCount = buffer.fold<int>(0, (sum, list) => sum + list.length);
              final fullBytes = Uint8List(totalBytesCount);
              int currOffset = 0;
              for (var chunk in buffer) {
                fullBytes.setAll(currOffset, chunk);
                currOffset += chunk.length;
              }
              _chunkedBuffers.remove(realPacketType);

              if (realPacketType == -4) {
                final payloadStr = utf8.decode(fullBytes);
                final Map<String, dynamic> data = jsonDecode(payloadStr);
                final List<dynamic> syncedList = data['synced_ids'] ?? [];

                pcSyncedIds.clear();
                for (var id in syncedList) {
                  pcSyncedIds.add(id.toString());
                }

                final List<dynamic> syncedThumbsList = data['synced_thumbnail_ids'] ?? [];
                pcSyncedThumbnailIds.clear();
                for (var id in syncedThumbsList) {
                  pcSyncedThumbnailIds.add(id.toString());
                }

                lastAlbumSyncDate = data['last_album_sync_date'] ?? '';
                logMessage("Handshake response received! PC has ${pcSyncedIds.length} files, ${pcSyncedThumbnailIds.length} thumbnails.");
                notifyListeners();
              } else if (realPacketType == -15) {
                try {
                  final payloadStr = utf8.decode(fullBytes);
                  final Map<String, dynamic> data = jsonDecode(payloadStr);
                  final forceFullScan = data['force_full_scan'] == true;
                  final targetDate = data['target_date']?.toString();
                  List<String>? targetIds;
                  if (data['target_ids'] is List) {
                    targetIds = (data['target_ids'] as List).map((e) => e.toString()).toList();
                  }
                  logMessage("PC requested video sync (chunked). Starting...");
                  syncVideosToPC(forceFullScan: forceFullScan, targetDate: targetDate, targetIds: targetIds);
                } catch (e) {
                  logMessage("Error parsing chunked video sync payload: $e");
                }
              } else if (realPacketType == -21) {
                try {
                  final payloadStr = utf8.decode(fullBytes);
                  final Map<String, dynamic> data = jsonDecode(payloadStr);
                  final forceFullScan = data['force_full_scan'] == true;
                  final targetDate = data['target_date']?.toString();
                  List<String>? targetIds;
                  if (data['target_ids'] is List) {
                    targetIds = (data['target_ids'] as List).map((e) => e.toString()).toList();
                  }
                  logMessage("PC requested audio sync (chunked). Starting...");
                  syncAudiosToPC(forceFullScan: forceFullScan, targetDate: targetDate, targetIds: targetIds);
                } catch (e) {
                  logMessage("Error parsing chunked audio sync payload: $e");
                }
              } else if (realPacketType == -6) {
                try {
                  final payloadStr = utf8.decode(fullBytes);
                  final Map<String, dynamic> data = jsonDecode(payloadStr);
                  if (data['force_resync'] == true) {
                    pcSyncedThumbnailIds.clear();
                    logMessage("Force resync requested (chunked). Cleared local synced thumbnail tracker.");
                  } else if (data.containsKey('synced_thumbnail_ids')) {
                    final List<dynamic> syncedThumbsList = data['synced_thumbnail_ids'] ?? [];
                    pcSyncedThumbnailIds.clear();
                    for (var id in syncedThumbsList) {
                      pcSyncedThumbnailIds.add(id.toString());
                    }
                    logMessage("Updated synced thumbnail tracker from PC (chunked): ${pcSyncedThumbnailIds.length} items");
                  }
                } catch (e) {
                  debugPrint("Error parsing chunked -6 payload: $e");
                }
                isThumbnailSyncing = false;
                syncThumbnailsToAI();
              } else if (realPacketType == -30) {
                // AI Vector Sync Packet (Chunked)
                try {
                  final payloadStr = utf8.decode(fullBytes);
                  final Map<String, dynamic> data = jsonDecode(payloadStr);
                  await aiService.importSyncPayload(data);
                  isAiVectorSyncing = false;
                  logMessage("🎉 成功同步 PC AI 矢量数据: ${aiService.categoryCount} 个分类, ${aiService.syncedPhotoCount} 张照片特征向量!");
                  notifyListeners();
                } catch (e) {
                  logMessage("Error parsing chunked AI vector sync payload: $e");
                  isAiVectorSyncing = false;
                  notifyListeners();
                }
              }
            }
            return;
          }

          if (fileId == -30) {
            // AI Vector Sync Packet (Single packet)
            try {
              final payloadSize = byteData.getInt32(12, Endian.big);
              final payloadStr = utf8.decode(binaryData.sublist(16, 16 + payloadSize));
              final Map<String, dynamic> data = jsonDecode(payloadStr);
              await aiService.importSyncPayload(data);
              isAiVectorSyncing = false;
              logMessage("🎉 成功同步 PC AI 矢量数据: ${aiService.categoryCount} 个分类, ${aiService.syncedPhotoCount} 张照片特征向量!");
              notifyListeners();
            } catch (e) {
              logMessage("Error parsing AI vector sync payload: $e");
              isAiVectorSyncing = false;
              notifyListeners();
            }
            return;
          }

          if (fileId == -4) {
            // Handshake Response
            final payloadSize = byteData.getInt32(12, Endian.big);
            final payloadStr = utf8.decode(binaryData.sublist(16, 16 + payloadSize));
            final Map<String, dynamic> data = jsonDecode(payloadStr);
            final List<dynamic> syncedList = data['synced_ids'] ?? [];

            pcSyncedIds.clear();
            for (var id in syncedList) {
              pcSyncedIds.add(id.toString());
            }

            final List<dynamic> syncedThumbsList = data['synced_thumbnail_ids'] ?? [];
            pcSyncedThumbnailIds.clear();
            for (var id in syncedThumbsList) {
              pcSyncedThumbnailIds.add(id.toString());
            }

            // Store the last album sync date for breakpoint resume
            lastAlbumSyncDate = data['last_album_sync_date'] ?? '';
            logMessage("Handshake response received! PC has ${pcSyncedIds.length} files, ${pcSyncedThumbnailIds.length} thumbnails. Last album sync: ${lastAlbumSyncDate.isEmpty ? 'none' : lastAlbumSyncDate}");
            notifyListeners();
            return;
          }

          if (fileId == -6) {
            logMessage("PC requested thumbnail sync to AI. Starting sync...");
            final int flag = byteData.getInt32(8, Endian.big);
            if (flag == -2) {
              pcSyncedThumbnailIds.clear();
              logMessage("Force resync requested via flag (-2). Cleared local synced thumbnail tracker.");
            }
            if (binaryData.length >= 16) {
              final payloadSize = byteData.getInt32(12, Endian.big);
              if (payloadSize > 0 && binaryData.length >= 16 + payloadSize) {
                try {
                  final payloadStr = utf8.decode(binaryData.sublist(16, 16 + payloadSize));
                  final Map<String, dynamic> data = jsonDecode(payloadStr);
                  if (data['force_resync'] == true) {
                    pcSyncedThumbnailIds.clear();
                    logMessage("Force resync requested. Cleared local synced thumbnail tracker.");
                  } else if (data.containsKey('synced_thumbnail_ids')) {
                    final List<dynamic> syncedThumbsList = data['synced_thumbnail_ids'] ?? [];
                    pcSyncedThumbnailIds.clear();
                    for (var id in syncedThumbsList) {
                      pcSyncedThumbnailIds.add(id.toString());
                    }
                    logMessage("Updated synced thumbnail tracker from PC: ${pcSyncedThumbnailIds.length} items");
                  }
                } catch (e) {
                  debugPrint("Error parsing -6 payload: $e");
                }
              }
            }
            // Force-reset the guard to prevent deadlock from stale state (e.g. previous sync interrupted)
            isThumbnailSyncing = false;
            syncThumbnailsToAI();
            return;
          }

          if (fileId == -7) {
            if (isAlbumSyncing) {
              logMessage("PC requested to resume album sync.");
              isAlbumSyncPaused = false;
              notifyListeners();
            } else {
              logMessage("PC requested full album sync. Starting...");
              syncAlbumToPC();
            }
            return;
          }

          if (fileId == -9) {
            logMessage("PC requested to pause album sync.");
            isAlbumSyncPaused = true;
            notifyListeners();
            return;
          }

          if (fileId == -11) {
            logMessage("PC requested full album re-sync (scanning for missing files).");
            syncAlbumToPC(forceFullScan: true);
            return;
          }

          if (fileId == -10) {
            logMessage("PC requested to stop album sync.");
            isAlbumSyncing = false;
            isAlbumSyncPaused = false;
            notifyListeners();
            return;
          }

          if (fileId == -12) {
            // Delete Assets Request from PC
            final payloadSize = byteData.getInt32(12, Endian.big);
            final payloadStr = utf8.decode(binaryData.sublist(16, 16 + payloadSize));
            final Map<String, dynamic> data = jsonDecode(payloadStr);
            final List<dynamic> rawIds = data['asset_ids'] ?? [];
            final List<String> assetIdsToDelete = rawIds.map((e) => e.toString()).toList();

            if (assetIdsToDelete.isNotEmpty) {
              logMessage("🗑️ 收到电脑端同步删除 ${assetIdsToDelete.length} 张照片请求...");
              try {
                final List<String> deletedResult = await PhotoManager.editor.deleteWithIds(assetIdsToDelete);
                logMessage("🗑️ 手机相册已成功删除 ${deletedResult.length} 张照片。");
                // Remove from in-memory lists
                localImages.removeWhere((img) => deletedResult.contains(img.id));
                pcSyncedIds.removeWhere((id) => deletedResult.contains(id));
                pcSyncedThumbnailIds.removeWhere((id) => deletedResult.contains(id));
                notifyListeners();
              } catch (e) {
                logMessage("❌ 手机端删除照片发生异常: $e");
              }
            }
            return;
          }

          if (fileId == -14) {
            // Request single original photo on-demand from PC
            final payloadSize = byteData.getInt32(12, Endian.big);
            final payloadStr = utf8.decode(binaryData.sublist(16, 16 + payloadSize));
            final Map<String, dynamic> data = jsonDecode(payloadStr);
            final String? targetAssetId = data['asset_id']?.toString();

            if (targetAssetId != null && targetAssetId.isNotEmpty && _photoStreamer != null) {
              logMessage("📥 PC 端请求查看超清原图: $targetAssetId");
              Future.microtask(() async {
                try {
                  AssetEntity? targetEntity;
                  final int idx = localImages.indexWhere((e) => e.id == targetAssetId);
                  if (idx >= 0) {
                    targetEntity = localImages[idx];
                  } else {
                    targetEntity = await AssetEntity.fromId(targetAssetId);
                  }

                  if (targetEntity != null) {
                    final int singleFileId = _fileIdCounter++;
                    final success = await _photoStreamer!.streamOriginalPhoto(
                      entity: targetEntity,
                      fileId: singleFileId,
                      onProgress: (chunkIndex, totalChunks, bytesSent) {},
                    );
                    if (success) {
                      logMessage("✅ 超清原图已直传至电脑端: ${targetEntity.title}");
                    }
                  } else {
                    logMessage("⚠️ 未在手机相册中找到照片 ID: $targetAssetId");
                  }
                } catch (e) {
                  logMessage("❌ 直传超清原图异常: $e");
                }
              });
            }
            return;
          }

          if (fileId == -15) {
            // PC requested video sync (either full, incremental, or specific target)
            final payloadSize = byteData.getInt32(12, Endian.big);
            bool forceFullScan = false;
            String? targetDate;
            List<String>? targetIds;

            if (payloadSize > 0 && binaryData.length >= 16 + payloadSize) {
              try {
                final payloadStr = utf8.decode(binaryData.sublist(16, 16 + payloadSize));
                final Map<String, dynamic> data = jsonDecode(payloadStr);
                forceFullScan = data['force_full_scan'] == true;
                targetDate = data['target_date']?.toString();
                if (data['target_ids'] is List) {
                  targetIds = (data['target_ids'] as List).map((e) => e.toString()).toList();
                }
              } catch (_) {}
            }

            if (targetIds != null && targetIds.isNotEmpty) {
              isVideoSyncing = false;
              isVideoSyncPaused = false;
              logMessage("PC requested targeted video download (${targetIds.length} items). Starting...");
              syncVideosToPC(forceFullScan: forceFullScan, targetDate: targetDate, targetIds: targetIds);
            } else if (isVideoSyncing && !isVideoSyncPaused) {
              logMessage("Video sync is already in progress.");
            } else if (isVideoSyncing && isVideoSyncPaused) {
              logMessage("PC requested to resume video sync.");
              isVideoSyncPaused = false;
              notifyListeners();
            } else {
              logMessage("PC requested video sync. Starting...");
              syncVideosToPC(forceFullScan: forceFullScan, targetDate: targetDate, targetIds: targetIds);
            }
            return;
          }

          if (fileId == -17) {
            logMessage("PC requested to pause video sync.");
            isVideoSyncPaused = true;
            notifyListeners();
            return;
          }

          if (fileId == -18) {
            logMessage("PC requested to stop video sync.");
            isVideoSyncing = false;
            isVideoSyncPaused = false;
            notifyListeners();
            return;
          }

          if (fileId == -19) {
            // PC queries video catalog
            logMessage("📹 PC requested remote video catalog. Scanning...");
            Future.microtask(() async {
              try {
                final streamer = PhotoStreamer.standalone();
                localVideos = await streamer.loadLocalVideos();
                notifyListeners();
                logMessage("📹 Found ${localVideos.length} videos in device MediaStore.");

                if (localVideos.isEmpty) {
                  final respStr = jsonEncode({ "videos": [], "chunk_index": 0, "total_chunks": 1, "total_count": 0 });
                  final respBytes = utf8.encode(respStr);
                  final respHeader = ByteData(16);
                  respHeader.setInt32(0, -19, Endian.big);
                  respHeader.setInt32(4, 0, Endian.big);
                  respHeader.setInt32(8, 1, Endian.big);
                  respHeader.setInt32(12, respBytes.length, Endian.big);

                  final respPacket = Uint8List(16 + respBytes.length);
                  respPacket.setRange(0, 16, respHeader.buffer.asUint8List());
                  respPacket.setRange(16, respPacket.length, respBytes);
                  await _syncEngine?.sendBinary(respPacket);
                  logMessage("✅ Sent empty video catalog to PC.");
                  return;
                }

                // Process and stream video catalog in batches of 2 to ensure MTU safety (< 50KB per packet, preventing SCTP channel death)
                const int batchSize = 2;
                final int totalChunks = (localVideos.length / batchSize).ceil();

                for (int chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
                  final start = chunkIdx * batchSize;
                  final end = (start + batchSize < localVideos.length) ? start + batchSize : localVideos.length;
                  final chunk = localVideos.sublist(start, end);

                  final chunkResults = await Future.wait(chunk.map((v) async {
                    final int? createSec = (v.createDateSecond != null && v.createDateSecond! > 0)
                        ? v.createDateSecond
                        : v.modifiedDateSecond;
                    String? createDateStr;
                    if (createSec != null && createSec > 0) {
                      createDateStr = DateTime.fromMillisecondsSinceEpoch(createSec * 1000, isUtc: true).toIso8601String();
                    } else {
                      createDateStr = DateTime.now().toUtc().toIso8601String();
                    }

                    int size = 0;
                    try {
                      File? file = await v.file.timeout(const Duration(milliseconds: 300), onTimeout: () => null);
                      file ??= await v.originFile.timeout(const Duration(milliseconds: 200), onTimeout: () => null);
                      if (file != null) {
                        size = await file.length();
                      }
                    } catch (_) {}

                    String? thumbBase64;
                    try {
                      final Uint8List? thumbBytes = await v.thumbnailDataWithSize(
                        const ThumbnailSize.square(240),
                        quality: 60,
                      ).timeout(const Duration(milliseconds: 350), onTimeout: () => null);
                      if (thumbBytes != null && thumbBytes.isNotEmpty) {
                        thumbBase64 = "data:image/jpeg;base64,${base64Encode(thumbBytes)}";
                      }
                    } catch (_) {}

                    String cleanName = v.title ?? "video_${v.id}.mp4";
                    if (!cleanName.contains('.')) {
                      final ext = v.mimeType?.split('/').last ?? 'mp4';
                      cleanName = '$cleanName.$ext';
                    }

                    final Map<String, dynamic> item = {
                      "id": v.id,
                      "name": cleanName,
                      "size": size,
                      "duration": v.duration,
                      "create_date": createDateStr,
                      "timestamp": (createSec ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000)) * 1000,
                    };
                    if (thumbBase64 != null) {
                      item["thumb"] = thumbBase64;
                    }
                    return item;
                  }));

                  final respStr = jsonEncode({
                    "videos": chunkResults,
                    "chunk_index": chunkIdx,
                    "total_chunks": totalChunks,
                    "total_count": localVideos.length,
                  });
                  final respBytes = utf8.encode(respStr);
                  final respHeader = ByteData(16);
                  respHeader.setInt32(0, -19, Endian.big);
                  respHeader.setInt32(4, chunkIdx, Endian.big);
                  respHeader.setInt32(8, totalChunks, Endian.big);
                  respHeader.setInt32(12, respBytes.length, Endian.big);

                  final respPacket = Uint8List(16 + respBytes.length);
                  respPacket.setRange(0, 16, respHeader.buffer.asUint8List());
                  respPacket.setRange(16, respPacket.length, respBytes);
                  await _syncEngine?.sendBinary(respPacket);

                  await Future.delayed(const Duration(milliseconds: 20));
                }
                logMessage("✅ Sent video catalog with ${localVideos.length} videos ($totalChunks chunks) to PC.");
              } catch (e) {
                logMessage("❌ Error scanning/sending video catalog: $e");
              }
            });
            return;
          }

          if (fileId == -21) {
            // PC requested audio/music sync (either full, incremental, or specific target)
            final payloadSize = byteData.getInt32(12, Endian.big);
            bool forceFullScan = false;
            String? targetDate;
            List<String>? targetIds;

            if (payloadSize > 0 && binaryData.length >= 16 + payloadSize) {
              try {
                final payloadStr = utf8.decode(binaryData.sublist(16, 16 + payloadSize));
                final Map<String, dynamic> data = jsonDecode(payloadStr);
                forceFullScan = data['force_full_scan'] == true;
                targetDate = data['target_date']?.toString();
                if (data['target_ids'] is List) {
                  targetIds = (data['target_ids'] as List).map((e) => e.toString()).toList();
                }
              } catch (_) {}
            }

            if (targetIds != null && targetIds.isNotEmpty) {
              isAudioSyncing = false;
              isAudioSyncPaused = false;
              logMessage("PC requested targeted audio download (${targetIds.length} items). Starting...");
              syncAudiosToPC(forceFullScan: forceFullScan, targetDate: targetDate, targetIds: targetIds);
            } else if (isAudioSyncing && !isAudioSyncPaused) {
              logMessage("Audio sync is already in progress.");
            } else if (isAudioSyncing && isAudioSyncPaused) {
              logMessage("PC requested to resume audio sync.");
              isAudioSyncPaused = false;
              notifyListeners();
            } else {
              logMessage("PC requested audio sync. Starting...");
              syncAudiosToPC(forceFullScan: forceFullScan, targetDate: targetDate, targetIds: targetIds);
            }
            return;
          }

          if (fileId == -23) {
            logMessage("PC requested to pause audio sync.");
            isAudioSyncPaused = true;
            notifyListeners();
            return;
          }

          if (fileId == -24) {
            logMessage("PC requested to stop audio sync.");
            isAudioSyncing = false;
            isAudioSyncPaused = false;
            notifyListeners();
            return;
          }

          if (fileId == -25) {
            // PC queries audio/music catalog
            logMessage("🎵 PC requested remote audio catalog. Scanning...");
            Future.microtask(() async {
              try {
                final streamer = PhotoStreamer.standalone();
                localAudios = await streamer.loadLocalAudio();
                notifyListeners();
                logMessage("🎵 Found ${localAudios.length} audio tracks in device MediaStore.");

                final List<Map<String, dynamic>> catalog = [];
                // Process audio catalog metadata in fast batches of 50 without blocking isolate
                for (int i = 0; i < localAudios.length; i += 50) {
                  final end = (i + 50 < localAudios.length) ? i + 50 : localAudios.length;
                  final chunk = localAudios.sublist(i, end);
                  final chunkResults = await Future.wait(chunk.map((a) async {
                    final int? createSec = (a.createDateSecond != null && a.createDateSecond! > 0)
                        ? a.createDateSecond
                        : a.modifiedDateSecond;
                    String? createDateStr;
                    if (createSec != null && createSec > 0) {
                      createDateStr = DateTime.fromMillisecondsSinceEpoch(createSec * 1000, isUtc: true).toIso8601String();
                    } else {
                      createDateStr = DateTime.now().toUtc().toIso8601String();
                    }

                    int size = 0;
                    try {
                      File? file = await a.file.timeout(const Duration(milliseconds: 300), onTimeout: () => null);
                      file ??= await a.originFile.timeout(const Duration(milliseconds: 200), onTimeout: () => null);
                      if (file != null) {
                        size = await file.length();
                      }
                    } catch (_) {}

                    String cleanName = a.title ?? "music_${a.id}.mp3";
                    if (!cleanName.contains('.')) {
                      final ext = a.mimeType?.split('/').last ?? 'mp3';
                      cleanName = '$cleanName.$ext';
                    }

                    return {
                      "id": a.id,
                      "name": cleanName,
                      "size": size,
                      "duration": a.duration,
                      "create_date": createDateStr,
                      "timestamp": (createSec ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000)) * 1000,
                    };
                  }));
                  catalog.addAll(chunkResults);
                  await Future.delayed(Duration.zero);
                }

                if (catalog.isEmpty) {
                  final respStr = jsonEncode({ "audios": [], "chunk_index": 0, "total_chunks": 1, "total_count": 0 });
                  final respBytes = utf8.encode(respStr);
                  final respHeader = ByteData(16);
                  respHeader.setInt32(0, -25, Endian.big);
                  respHeader.setInt32(4, 0, Endian.big);
                  respHeader.setInt32(8, 1, Endian.big);
                  respHeader.setInt32(12, respBytes.length, Endian.big);

                  final respPacket = Uint8List(16 + respBytes.length);
                  respPacket.setRange(0, 16, respHeader.buffer.asUint8List());
                  respPacket.setRange(16, respPacket.length, respBytes);
                  await _syncEngine?.sendBinary(respPacket);
                  logMessage("✅ Sent empty audio catalog to PC.");
                  return;
                }

                // Chunk into safe 50-audio batches to ensure MTU safety (< 10KB per packet)
                const int batchSize = 50;
                final int totalChunks = (catalog.length / batchSize).ceil();
                for (int chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
                  final start = chunkIdx * batchSize;
                  final end = (start + batchSize < catalog.length) ? start + batchSize : catalog.length;
                  final chunkList = catalog.sublist(start, end);

                  final respStr = jsonEncode({
                    "audios": chunkList,
                    "chunk_index": chunkIdx,
                    "total_chunks": totalChunks,
                    "total_count": catalog.length,
                  });
                  final respBytes = utf8.encode(respStr);
                  final respHeader = ByteData(16);
                  respHeader.setInt32(0, -25, Endian.big);
                  respHeader.setInt32(4, chunkIdx, Endian.big);
                  respHeader.setInt32(8, totalChunks, Endian.big);
                  respHeader.setInt32(12, respBytes.length, Endian.big);

                  final respPacket = Uint8List(16 + respBytes.length);
                  respPacket.setRange(0, 16, respHeader.buffer.asUint8List());
                  respPacket.setRange(16, respPacket.length, respBytes);
                  await _syncEngine?.sendBinary(respPacket);
                  if (totalChunks > 1) {
                    await Future.delayed(const Duration(milliseconds: 15));
                  }
                }
                logMessage("✅ Sent audio catalog with ${catalog.length} tracks ($totalChunks chunks) to PC.");
              } catch (e) {
                logMessage("❌ Error scanning/sending audio catalog: $e");
              }
            });
            return;
          }

          final chunkIndex = byteData.getInt32(4, Endian.big);
          final totalChunks = byteData.getInt32(8, Endian.big);
          final payloadSize = byteData.getInt32(12, Endian.big);

          final payload = binaryData.sublist(16, 16 + payloadSize);
          
          if (!incomingFiles.containsKey(fileId)) {
            incomingFiles[fileId] = List<Uint8List?>.filled(totalChunks, null);
            receivedChunksCount[fileId] = 0;
            logMessage("📥 Start receiving image from PC (ID: $fileId, Chunks: $totalChunks)");
            activeTransferName = "📥 Receiving image from PC...";
            activeProgress = 0.0;
            notifyListeners();
          }

          final fileChunks = incomingFiles[fileId]!;
          if (fileChunks[chunkIndex] == null) {
            fileChunks[chunkIndex] = payload;
            receivedChunksCount[fileId] = receivedChunksCount[fileId]! + 1;
            activeProgress = receivedChunksCount[fileId]! / totalChunks;
            notifyListeners();
          }

          if (receivedChunksCount[fileId] == totalChunks) {
            logMessage("📥 Finished downloading file from PC. Reassembling...");
            activeTransferName = null;
            activeProgress = 0.0;
            notifyListeners();

            final bytesBuilder = BytesBuilder();
            for (var chunk in fileChunks) {
              if (chunk != null) {
                bytesBuilder.add(chunk);
              }
            }
            final fullBytes = bytesBuilder.toBytes();

            incomingFiles.remove(fileId);
            receivedChunksCount.remove(fileId);

            // Save to phone gallery
            try {
              final AssetEntity? entity = await PhotoManager.editor.saveImage(
                fullBytes,
                filename: "shareclip_${DateTime.now().millisecondsSinceEpoch}.png",
              );
              if (entity != null) {
                logMessage("🎉 Successfully saved image from PC to gallery: ${entity.title}");
                _loadLocalGallery();
              } else {
                logMessage("❌ Failed to save image: Editor returned null");
              }
            } catch (e) {
              logMessage("❌ Failed to save image: $e");
            }
          }
        } catch (e) {
          logMessage("Error processing WebRTC packet: $e");
          activeTransferName = null;
          activeProgress = 0.0;
          notifyListeners();
        }
      },
    );

    // CRITICAL: Register DataChannel and Connection state listeners BEFORE
    // creating/sending offer. The answer can arrive within 50ms via UDP,
    // and if listeners aren't registered yet, the DataChannelOpen event is missed.
    _remoteAnswerApplied = false;
    _syncEngine?.dataChannelState.addListener(_onDataChannelStateChanged);
    _syncEngine?.connectionState.addListener(() {
      final pcState = _syncEngine?.connectionState.value;
      logMessage("WebRTC ConnectionState: $pcState");
      if (pcState == RTCPeerConnectionState.RTCPeerConnectionStateFailed || 
          pcState == RTCPeerConnectionState.RTCPeerConnectionStateClosed) {
        if (appState == AppState.connected) {
          errorMsg = "WebRTC connection failed/closed";
          appState = AppState.failed;
          notifyListeners();
          cleanup();
        }
      }
    });

    try {
      await _syncEngine!.startPeerConnection();
      final offerSdp = await _syncEngine!.createOffer();

      appState = AppState.sendingOffer;
      notifyListeners();

      if (isUdpFallback) {
         await _startUdpListener();
         
         // 1. High-Speed HTTP/TCP Direct Signaling (Priority 1 for Non-BLE & LAN devices)
         if (_lastScannedPayload?.pcIps != null && _lastScannedPayload!.pcIps!.isNotEmpty) {
           logMessage("⚡ 正在通过局域网极速 TCP 信令握手连接 PC (${_lastScannedPayload!.pcIps!.join(', ')})...");
           final httpPort = _lastScannedPayload!.httpPort;
           HttpSignalingClient.exchangeSdp(
             targetIps: _lastScannedPayload!.pcIps!,
             port: httpPort,
             offerSdp: offerSdp,
           ).then((httpResult) {
             if (httpResult != null && httpResult['sdp'] != null && appState != AppState.connected) {
               logMessage("🎉 局域网极速信令握手成功！耗时 < 100ms");
               _handleRemoteAnswer(httpResult['sdp'].toString());
               if (httpResult['candidates'] is List) {
                 for (final c in httpResult['candidates']) {
                   try {
                     final candMap = c is Map<String, dynamic> ? c : jsonDecode(c.toString());
                     _syncEngine?.addRemoteIceCandidate(
                       candMap['sdpMid']?.toString() ?? '',
                       candMap['sdpMLineIndex'] is int ? candMap['sdpMLineIndex'] : 0,
                       candMap['candidate']?.toString() ?? '',
                     );
                   } catch (_) {}
                 }
               }
             }
           });
         }

         // 2. Dual-Track UDP Signaling (Priority 2)
         logMessage("Sending UDP Offer SDP to PC...");
         _sendUdpSdp(offerSdp, 'offer');
         appState = AppState.waitingForAnswer;
         notifyListeners();
      } else {
         logMessage("Uploading generated Offer SDP over BLE...");
         final success = await _bleClient.sendSdp(offerSdp);
         if (success) {
           appState = AppState.waitingForAnswer;
           logMessage("Offer SDP transmitted. Awaiting remote Answer SDP...");
           notifyListeners();
         } else {
           throw Exception("Failed to send Offer SDP over BLE characteristics");
         }
      }
    } catch (e) {
      logMessage("WebRTC Error: $e");
      errorMsg = e.toString();
      appState = AppState.failed;
      notifyListeners();
      cleanup();
    }
  }

  
  void _handleRemoteOffer(String offerSdp) async {
    if (appState == AppState.connected) return;
    logMessage("Received remote Offer SDP via UDP.");
    if (appState != AppState.connectingWebRtc) {
      appState = AppState.connectingWebRtc;
      notifyListeners();
    }

    try {
      if (_syncEngine == null) {
        _initializeWebRtc(isUdpFallback: true);
      }
      final String? answerSdp = await _syncEngine!.handleRemoteOffer(offerSdp);
      if (answerSdp != null && answerSdp.isNotEmpty) {
        logMessage("Generated local answer. Sending back via UDP...");
        _sendUdpSdp(answerSdp, 'answer');
      }
    } catch (e) {
      logMessage("Warning handling Remote Offer: $e");
    }
  }

  void _handleRemoteAnswer(String answerSdp) async {
    if (appState == AppState.connected) return;
    // Only apply the very first Answer to prevent concurrent setRemoteDescription calls
    if (_remoteAnswerApplied) {
      debugPrint("[ViewModel LOG] Ignoring duplicate Answer SDP (already applied)");
      return;
    }
    _remoteAnswerApplied = true;
    logMessage("Received remote Answer SDP.");
    if (appState != AppState.connectingWebRtc) {
      appState = AppState.connectingWebRtc;
      notifyListeners();
    }

    try {
      final bool applied = await _syncEngine?.setRemoteAnswer(answerSdp) ?? false;
      if (applied) {
        logMessage("Applied remote answer. Performing WebRTC ICE handshaking...");
      } else {
        // If applying failed, allow retry
        _remoteAnswerApplied = false;
      }
    } catch (e) {
      logMessage("Warning handling Remote Answer: $e");
      _remoteAnswerApplied = false;
    }
  }

  Future<void> _setKeepScreenOn(bool enabled) async {
    try {
      if (Platform.isAndroid) {
        await _channel.invokeMethod('setKeepScreenOn', {'enabled': enabled});
      }
    } catch (_) {}
  }

  void _onDataChannelStateChanged() {
    final state = _syncEngine?.dataChannelState.value;
    logMessage("WebRTC DataChannel state: $state");

    if (state == RTCDataChannelState.RTCDataChannelOpen) {
      appState = AppState.connected;
      _setKeepScreenOn(true);
      logMessage("WebRTC DataChannel is OPEN. Load sync album console.");
      _photoStreamer = PhotoStreamer(syncEngine: _syncEngine!);
      _loadLocalGallery();
      _startHeartbeat();
      _sendHandshake();
    }
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _lastHeartbeatReceived = DateTime.now();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (_syncEngine == null || appState != AppState.connected) {
        timer.cancel();
        return;
      }

      final diff = DateTime.now().difference(_lastHeartbeatReceived);
      // Send periodic Ping (file_id = -1, chunk_index = 0, total_chunks = 0, payload_size = 0)
      // to keep network NAT mappings and SCTP connection actively alive
      final pingHeader = ByteData(16);
      pingHeader.setInt32(0, -1, Endian.big);
      pingHeader.setInt32(4, 0, Endian.big);
      pingHeader.setInt32(8, 0, Endian.big);
      pingHeader.setInt32(12, 0, Endian.big);
      await _syncEngine?.sendBinary(pingHeader.buffer.asUint8List());
    });
  }


  void _loadLocalGallery() async {
    if (_photoStreamer == null) return;
    final results = await Future.wait([
      _photoStreamer!.loadLocalImages(),
      _photoStreamer!.loadLocalVideos(),
      _photoStreamer!.loadLocalAudio(),
    ]);
    localImages = results[0];
    localVideos = results[1];
    localAudios = results[2];
    logMessage('Gallery: ${localImages.length} images, ${localVideos.length} videos, ${localAudios.length} audio');
    notifyListeners();
  }

  void toggleImageSelection(String id) {
    if (selectedImages.contains(id)) {
      selectedImages.remove(id);
    } else {
      selectedImages.add(id);
    }
    notifyListeners();
  }

  void toggleVideoSelection(String id) {
    if (selectedVideos.contains(id)) {
      selectedVideos.remove(id);
    } else {
      selectedVideos.add(id);
    }
    notifyListeners();
  }

  void toggleAudioSelection(String id) {
    if (selectedAudios.contains(id)) {
      selectedAudios.remove(id);
    } else {
      selectedAudios.add(id);
    }
    notifyListeners();
  }

  void syncAllSelected() async {
    final imagesToSync = localImages.where((img) => selectedImages.contains(img.id)).toList();
    final videosToSync = localVideos.where((v) => selectedVideos.contains(v.id)).toList();
    final audiosToSync = localAudios.where((a) => selectedAudios.contains(a.id)).toList();
    final filesToSync = List<PlatformFile>.from(chosenFiles);

    if (imagesToSync.isEmpty && videosToSync.isEmpty && audiosToSync.isEmpty && filesToSync.isEmpty) return;

    for (var img in imagesToSync) {
      transferStatusMap[img.id] = TransferStatus.pending;
    }
    for (var v in videosToSync) {
      transferStatusMap[v.id] = TransferStatus.pending;
    }
    for (var a in audiosToSync) {
      transferStatusMap[a.id] = TransferStatus.pending;
    }
    selectedImages.clear();
    selectedVideos.clear();
    selectedAudios.clear();
    chosenFiles.clear();
    notifyListeners();

    // 1. Sync gallery images
    for (var img in imagesToSync) {
      if (pcSyncedIds.contains(img.id)) {
        transferStatusMap[img.id] = TransferStatus.completed;
        logMessage("Skip sending ${img.title} (already synced to PC)");
        notifyListeners();
        continue;
      }

      transferStatusMap[img.id] = TransferStatus.transferring;
      activeTransferName = img.title;
      activeProgress = 0.0;
      activeSpeedKbps = 0.0;
      notifyListeners();

      final fileId = _fileIdCounter++;
      final streamer = _photoStreamer;
      if (streamer == null) continue;

      final startTime = DateTime.now().millisecondsSinceEpoch;

      final success = await streamer.streamImage(
        entity: img,
        fileId: fileId,
        onProgress: (chunkIndex, totalChunks, bytesSent) {
          activeProgress = (chunkIndex + 1) / totalChunks;
          final double elapsedSec = (DateTime.now().millisecondsSinceEpoch - startTime) / 1000.0;
          activeSpeedKbps = (elapsedSec > 0) ? (bytesSent * 8.0) / 1024.0 / elapsedSec : 0.0;
          notifyListeners();
        },
      );

      transferStatusMap[img.id] = success ? TransferStatus.completed : TransferStatus.failed;
      activeTransferName = null;
      activeProgress = 0.0;
      activeSpeedKbps = 0.0;
      logMessage("Sync finished for ${img.title}. Status: ${transferStatusMap[img.id]}");
      notifyListeners();
    }

    // 2. Sync gallery videos
    for (var vid in videosToSync) {
      if (pcSyncedIds.contains(vid.id)) {
        transferStatusMap[vid.id] = TransferStatus.completed;
        logMessage("Skip sending ${vid.title} (already synced to PC)");
        notifyListeners();
        continue;
      }

      transferStatusMap[vid.id] = TransferStatus.transferring;
      activeTransferName = vid.title;
      activeProgress = 0.0;
      activeSpeedKbps = 0.0;
      notifyListeners();

      final fileId = _fileIdCounter++;
      final streamer = _photoStreamer;
      if (streamer == null) continue;

      final startTime = DateTime.now().millisecondsSinceEpoch;

      final success = await streamer.streamImage(
        entity: vid,
        fileId: fileId,
        onProgress: (chunkIndex, totalChunks, bytesSent) {
          activeProgress = (chunkIndex + 1) / totalChunks;
          final double elapsedSec = (DateTime.now().millisecondsSinceEpoch - startTime) / 1000.0;
          activeSpeedKbps = (elapsedSec > 0) ? (bytesSent * 8.0) / 1024.0 / elapsedSec : 0.0;
          notifyListeners();
        },
      );

      transferStatusMap[vid.id] = success ? TransferStatus.completed : TransferStatus.failed;
      activeTransferName = null;
      activeProgress = 0.0;
      activeSpeedKbps = 0.0;
      logMessage("Sync finished for ${vid.title}. Status: ${transferStatusMap[vid.id]}");
      notifyListeners();
    }

    // 3. Sync selected audio assets from MediaStore
    for (var audio in audiosToSync) {
      if (pcSyncedIds.contains(audio.id)) {
        transferStatusMap[audio.id] = TransferStatus.completed;
        logMessage("Skip sending ${audio.title} (already synced to PC)");
        notifyListeners();
        continue;
      }

      final file = await audio.originFile;
      if (file == null) continue;

      activeTransferName = audio.title ?? audio.id;
      activeProgress = 0.0;
      notifyListeners();

      final fileId = _fileIdCounter++;
      final streamer = _photoStreamer;
      if (streamer == null) continue;

      final startTime = DateTime.now().millisecondsSinceEpoch;
      final success = await streamer.streamFile(
        file: file,
        fileId: fileId,
        fileName: '${audio.id}_${audio.title ?? 'music'}.${audio.mimeType?.split('/').last ?? 'mp3'}',
        onProgress: (chunkIndex, totalChunks, bytesSent) {
          activeProgress = (chunkIndex + 1) / totalChunks;
          final double elapsedSec = (DateTime.now().millisecondsSinceEpoch - startTime) / 1000.0;
          activeSpeedKbps = (elapsedSec > 0) ? (bytesSent * 8.0) / 1024.0 / elapsedSec : 0.0;
          notifyListeners();
        },
      );

      transferStatusMap[audio.id] = success ? TransferStatus.completed : TransferStatus.failed;
      activeTransferName = null;
      activeProgress = 0.0;
      notifyListeners();
    }

    // 3. Sync custom chosen files (docs, etc.)
    for (var file in filesToSync) {
      if (file.path == null) continue;

      final docKey = '${file.name}_${file.size}';
      if (pcSyncedIds.contains(docKey)) {
        logMessage("Skip sending ${file.name} (already synced to PC)");
        continue;
      }

      activeTransferName = file.name;
      activeProgress = 0.0;
      activeSpeedKbps = 0.0;
      notifyListeners();

      final fileId = _fileIdCounter++;
      final streamer = _photoStreamer;
      if (streamer == null) continue;

      final startTime = DateTime.now().millisecondsSinceEpoch;

      final success = await streamer.streamFile(
        file: File(file.path!),
        fileId: fileId,
        fileName: file.name,
        onProgress: (chunkIndex, totalChunks, bytesSent) {
          activeProgress = (chunkIndex + 1) / totalChunks;
          final double elapsedSec = (DateTime.now().millisecondsSinceEpoch - startTime) / 1000.0;
          activeSpeedKbps = (elapsedSec > 0) ? (bytesSent * 8.0) / 1024.0 / elapsedSec : 0.0;
          notifyListeners();
        },
      );

      logMessage("Sync finished for ${file.name}. Success: $success");
    }

    activeTransferName = null;
    activeProgress = 0.0;
    activeSpeedKbps = 0.0;
    notifyListeners();
  }

  Future<void> syncThumbnailsToAI({List<AssetEntity>? targets}) async {
    if (isThumbnailSyncing) return;

    try {
      final PermissionState ps = await PhotoManager.requestPermissionExtend();
      if (!ps.isAuth) {
        logMessage("❌ 无法同步缩略图：无媒体读取权限");
        final doneHeader = ByteData(16);
        doneHeader.setInt32(0, -6, Endian.big);
        doneHeader.setInt32(4, 0, Endian.big);
        doneHeader.setInt32(8, -1, Endian.big);
        doneHeader.setInt32(12, 0, Endian.big);
        await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());
        return;
      }

      if (localImages.isEmpty) {
        logMessage("🧠 AI 缩略图同步: 本地相册尚未加载完成，正在读取...");
        final streamer = PhotoStreamer.standalone();
        localImages = await streamer.loadLocalImages();
      }

      final list = targets ?? localImages.where((e) => e.type == AssetType.image).toList();
      if (list.isEmpty) {
        logMessage("ℹ️ 相册中暂无可同步的图片");
        final doneHeader = ByteData(16);
        doneHeader.setInt32(0, -6, Endian.big);
        doneHeader.setInt32(4, 0, Endian.big);
        doneHeader.setInt32(8, -1, Endian.big);
        doneHeader.setInt32(12, 0, Endian.big);
        await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());
        return;
      }

      isThumbnailSyncing = true;
      thumbnailSyncTotal = list.length;
      thumbnailSyncDone = 0;
      notifyListeners();

      logMessage("Starting batch AI thumbnail sync. Total: ${list.length}");

      // Send start notification packet to PC: file_id = -6, total_chunks = total count
      final header = ByteData(16);
      header.setInt32(0, -6, Endian.big); // file_id = -6
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, list.length, Endian.big);
      header.setInt32(12, 0, Endian.big);
      await _syncEngine?.sendBinary(header.buffer.asUint8List());

      for (final entity in list) {
        if (_syncEngine == null || appState != AppState.connected) {
          logMessage("AI Sync interrupted: disconnected");
          break;
        }

        final String safeId = PhotoStreamer.sanitizeId(entity.id);
        final String thumbName = 'thumb_${entity.id}.jpg';
        final String safeThumbName = 'thumb_$safeId.jpg';
        if (pcSyncedThumbnailIds.contains(entity.id) || pcSyncedThumbnailIds.contains(safeId) ||
            pcSyncedThumbnailIds.contains(thumbName) || pcSyncedThumbnailIds.contains(safeThumbName)) {
          debugPrint("Skip sending thumbnail for ${entity.title} (already synced)");
          thumbnailSyncDone++;
          notifyListeners();
          continue;
        }

        final fileId = _fileIdCounter++;
        final streamer = _photoStreamer ?? PhotoStreamer(syncEngine: _syncEngine!);

        bool success = false;
        try {
          success = await streamer.streamThumbnail(
            entity: entity,
            fileId: fileId,
            onProgress: (_, _, _) {},
          ).timeout(const Duration(seconds: 15), onTimeout: () {
            debugPrint("[Sync] streamThumbnail timed out for ${entity.title} (15s), skipping");
            return false;
          });
        } catch (e) {
          debugPrint("[Sync] streamThumbnail exception for ${entity.title}: $e");
        }

        // Mark it as handled in pcSyncedThumbnailIds so whether success or failure/skipped, we won't repeatedly retry failing assets
        pcSyncedThumbnailIds.add(entity.id);
        pcSyncedThumbnailIds.add(safeId);
        pcSyncedThumbnailIds.add(thumbName);
        pcSyncedThumbnailIds.add(safeThumbName);

        thumbnailSyncDone++;
        if (!success) {
          logMessage("⏭️ 跳过无法读取的图片: ${entity.title ?? entity.id}");
        }
        notifyListeners();
      }
    } catch (e) {
      logMessage("❌ 缩略图同步发生异常: $e");
    } finally {
      // Send completion signal to PC: fileId=-6, totalCount=-1 means "sync all done"
      try {
        final doneHeader = ByteData(16);
        doneHeader.setInt32(0, -6, Endian.big);
        doneHeader.setInt32(4, 0, Endian.big);
        doneHeader.setInt32(8, -1, Endian.big); // -1 = completion sentinel
        doneHeader.setInt32(12, 0, Endian.big);
        await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());
      } catch (e) {
        debugPrint("[Sync] Error sending thumbnail completion sentinel: $e");
      }

      isThumbnailSyncing = false;
      notifyListeners();
      logMessage("Batch AI thumbnail sync finished. Sync completed: $thumbnailSyncDone/$thumbnailSyncTotal");
    }
  }

  /// Sync all original photos from the phone album to PC.
  /// Uses lastAlbumSyncDate as a breakpoint: only photos newer than that date are transmitted.
  /// Photos are sent in ascending createDate order to ensure correct incremental progress.
  Future<void> syncAlbumToPC({bool forceFullScan = false}) async {
    if (isAlbumSyncing && !isAlbumSyncPaused) return;
    
    if (isAlbumSyncing && isAlbumSyncPaused) {
      // If we are already running but paused, resume instead
      resumeAlbumSync();
      return;
    }

    isAlbumSyncing = true;
    isAlbumSyncPaused = false;
    albumSyncDone = 0;
    albumSyncTotal = 0;
    notifyListeners();

    logMessage("📸 Starting album sync. Breakpoint date: ${(lastAlbumSyncDate.isEmpty || forceFullScan) ? 'none (full scan)' : lastAlbumSyncDate}");

    try {
      final PermissionState ps = await PhotoManager.requestPermissionExtend();
      if (!ps.isAuth) {
        logMessage("❌ Album sync failed: no media permission");
        isAlbumSyncing = false;
        notifyListeners();
        return;
      }



      if (localImages.isEmpty) {
        logMessage("📸 Album sync: localImages is empty, loading...");
        final streamer = PhotoStreamer.standalone();
        localImages = await streamer.loadLocalImages();
      }
      final List<AssetEntity> allImages = List<AssetEntity>.from(localImages);

      // Chronological sort in-memory (oldest first)
      allImages.sort((a, b) {
        final aTime = a.createDateSecond ?? 0;
        final bTime = b.createDateSecond ?? 0;
        return aTime.compareTo(bTime);
      });

      // Filter to only images newer than the breakpoint date
      DateTime? breakpoint;
      if (lastAlbumSyncDate.isNotEmpty && !forceFullScan) {
        try {
          breakpoint = DateTime.parse(lastAlbumSyncDate).toUtc();
        } catch (_) {}
      }

      final List<AssetEntity> toSync = allImages.where((entity) {
        if (breakpoint == null) return true;
        final createMs = (entity.createDateSecond != null && entity.createDateSecond! > 0)
            ? entity.createDateSecond
            : entity.modifiedDateSecond;
        if (createMs == null || createMs == 0) return true;
        final createDt = DateTime.fromMillisecondsSinceEpoch(createMs * 1000, isUtc: true);
        return createDt.isAfter(breakpoint);
      }).toList();

      albumSyncTotal = toSync.length;
      notifyListeners();

      if (toSync.isEmpty) {
        logMessage("✅ Album sync complete: all photos already synced.");
        // Notify PC that sync is done
        final doneHeader = ByteData(16);
        doneHeader.setInt32(0, -8, Endian.big);
        doneHeader.setInt32(4, 0, Endian.big);
        doneHeader.setInt32(8, 0, Endian.big);
        doneHeader.setInt32(12, 0, Endian.big);
        await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());
        isAlbumSyncing = false;
        notifyListeners();
        return;
      }

      logMessage("📸 Album sync: ${toSync.length} new photos to send (out of ${allImages.length} total).");

      // Send start notification to PC: fileId=-7, total in total_chunks field
      final startHeader = ByteData(16);
      startHeader.setInt32(0, -7, Endian.big);
      startHeader.setInt32(4, 0, Endian.big);
      startHeader.setInt32(8, toSync.length, Endian.big);
      startHeader.setInt32(12, 0, Endian.big);
      await _syncEngine?.sendBinary(startHeader.buffer.asUint8List());

      final streamer = _photoStreamer;
      if (streamer == null) return;

      for (final entity in toSync) {
        // Dynamic wait check for pause state
        while (isAlbumSyncPaused) {
          if (_syncEngine == null || appState != AppState.connected || !isAlbumSyncing) {
            break;
          }
          await Future.delayed(const Duration(milliseconds: 100));
        }

        // Check if sync was stopped while paused or transferring
        if (_syncEngine == null || appState != AppState.connected || !isAlbumSyncing) {
          logMessage("📸 Album sync stopped or disconnected");
          break;
        }

        // Skip if PC already has this asset (safety check using assetId)
        final String safeId = PhotoStreamer.sanitizeId(entity.id);
        if (pcSyncedIds.contains('album_${entity.id}') || pcSyncedIds.contains(entity.id) ||
            pcSyncedIds.contains('album_$safeId') || pcSyncedIds.contains(safeId)) {
          albumSyncDone++;
          notifyListeners();
          continue;
        }

        final fileId = _fileIdCounter++;
        final success = await streamer.streamOriginalPhoto(
          entity: entity,
          fileId: fileId,
          onProgress: (chunkIndex, totalChunks, bytesSent) {
            activeProgress = totalChunks > 0 ? chunkIndex / totalChunks : 0;
            activeTransferName = '📸 ${entity.title}';
            notifyListeners();
          },
        );

        if (success) {
          albumSyncDone++;
          pcSyncedIds.add('album_${entity.id}');
        } else {
          logMessage("⚠️ Failed to sync: ${entity.title}");
        }
        notifyListeners();
      }

      activeTransferName = null;
      activeProgress = 0;
      notifyListeners();

      if (isAlbumSyncing) {
        logMessage("✅ Album sync finished: $albumSyncDone/${albumSyncTotal} photos sent.");
        // Notify PC that sync is done
        final doneHeader = ByteData(16);
        doneHeader.setInt32(0, -8, Endian.big);
        doneHeader.setInt32(4, albumSyncDone, Endian.big);
        doneHeader.setInt32(8, albumSyncTotal, Endian.big);
        doneHeader.setInt32(12, 0, Endian.big);
        await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());
      }
    } catch (e, stack) {
      logMessage("❌ Album sync error: $e");
      debugPrint("[AlbumSync] Error: $e\n$stack");
    } finally {
      isAlbumSyncing = false;
      isAlbumSyncPaused = false;
      notifyListeners();
    }
  }

  void pauseAlbumSync() {
    if (isAlbumSyncing && !isAlbumSyncPaused) {
      isAlbumSyncPaused = true;
      logMessage("📸 Album sync paused.");
      notifyListeners();
      // Send -9 (pause command) to PC
      final header = ByteData(16);
      header.setInt32(0, -9, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  void resumeAlbumSync() {
    if (isAlbumSyncing && isAlbumSyncPaused) {
      isAlbumSyncPaused = false;
      logMessage("📸 Album sync resumed.");
      notifyListeners();
      // Send -7 (resume/start command) to PC
      final header = ByteData(16);
      header.setInt32(0, -7, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, albumSyncTotal, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  void stopAlbumSync() {
    if (isAlbumSyncing) {
      isAlbumSyncing = false;
      isAlbumSyncPaused = false;
      logMessage("📸 Album sync stopped.");
      notifyListeners();
      // Send -10 (stop command) to PC
      final header = ByteData(16);
      header.setInt32(0, -10, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  Future<void> syncVideosToPC({bool forceFullScan = false, String? targetDate, List<String>? targetIds}) async {
    if (isVideoSyncing && !isVideoSyncPaused) return;

    if (isVideoSyncing && isVideoSyncPaused) {
      resumeVideoSync();
      return;
    }

    isVideoSyncing = true;
    isVideoSyncPaused = false;
    videoSyncDone = 0;
    videoSyncTotal = 0;
    notifyListeners();

    logMessage("🎥 Starting video sync. Breakpoint date: ${(lastVideoSyncDate.isEmpty || forceFullScan) ? 'none (full scan)' : lastVideoSyncDate}");

    try {
      final PermissionState ps = await PhotoManager.requestPermissionExtend();
      if (!ps.isAuth) {
        logMessage("❌ Video sync failed: no media permission");
        isVideoSyncing = false;
        notifyListeners();
        return;
      }

      if (localVideos.isEmpty) {
        logMessage("🎥 Video sync: localVideos is empty, loading...");
        final streamer = PhotoStreamer.standalone();
        localVideos = await streamer.loadLocalVideos();
      }
      final List<AssetEntity> allVideos = List<AssetEntity>.from(localVideos);

      // Chronological sort in-memory (oldest first)
      allVideos.sort((a, b) {
        final aTime = a.createDateSecond ?? 0;
        final bTime = b.createDateSecond ?? 0;
        return aTime.compareTo(bTime);
      });

      List<AssetEntity> toSync = allVideos;
      if (targetIds != null && targetIds.isNotEmpty) {
        toSync = [];
        for (final tid in targetIds) {
          final cleanTid = tid.replaceFirst(RegExp(r'^(video_|audio_|photo_|album_|thumb_)'), '').trim();
          AssetEntity? found;
          for (final v in allVideos) {
            final sId = PhotoStreamer.sanitizeId(v.id);
            if (v.id == tid || v.id == cleanTid || sId == tid || sId == cleanTid || v.title == tid || v.title == cleanTid) {
              found = v;
              break;
            }
          }
          if (found == null) {
            try {
              found = await AssetEntity.fromId(cleanTid);
            } catch (_) {}
          }
          if (found == null) {
            try {
              found = await AssetEntity.fromId(tid);
            } catch (_) {}
          }
          if (found != null) {
            toSync.add(found);
          }
        }
      } else if (targetDate != null && targetDate.isNotEmpty) {
        toSync = allVideos.where((v) {
          final int? createSec = (v.createDateSecond != null && v.createDateSecond! > 0)
              ? v.createDateSecond
              : v.modifiedDateSecond;
          if (createSec == null || createSec <= 0) return false;
          final dStr = DateTime.fromMillisecondsSinceEpoch(createSec * 1000, isUtc: true).toIso8601String().substring(0, 10);
          return dStr == targetDate;
        }).toList();
      } else if (lastVideoSyncDate.isNotEmpty && !forceFullScan) {
        DateTime? breakpoint;
        try {
          breakpoint = DateTime.parse(lastVideoSyncDate).toUtc();
        } catch (_) {}
        if (breakpoint != null) {
          toSync = allVideos.where((v) {
            final int? createSec = (v.createDateSecond != null && v.createDateSecond! > 0)
                ? v.createDateSecond
                : v.modifiedDateSecond;
            if (createSec == null || createSec <= 0) return true; // Keep undated videos for pcSyncedIds check
            final createDt = DateTime.fromMillisecondsSinceEpoch(createSec * 1000, isUtc: true);
            return createDt.isAfter(breakpoint!);
          }).toList();
        }
      }

      if (!forceFullScan && targetIds == null && targetDate == null) {
        toSync = toSync.where((v) => !pcSyncedIds.contains('video_${v.id}') && !pcSyncedIds.contains(v.id)).toList();
      }

      videoSyncTotal = toSync.length;
      notifyListeners();

      if (toSync.isEmpty) {
        logMessage("✅ Video sync complete: no matching or pending videos.");
        final doneHeader = ByteData(16);
        doneHeader.setInt32(0, -16, Endian.big);
        doneHeader.setInt32(4, 0, Endian.big);
        doneHeader.setInt32(8, 0, Endian.big);
        doneHeader.setInt32(12, 1, Endian.big); // 1 = isFinished
        await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());
        isVideoSyncing = false;
        notifyListeners();
        return;
      }

      logMessage("🎥 Video sync: ${toSync.length} videos to send (out of ${allVideos.length} total).");

      final startHeader = ByteData(16);
      startHeader.setInt32(0, -15, Endian.big);
      startHeader.setInt32(4, 0, Endian.big);
      startHeader.setInt32(8, toSync.length, Endian.big);
      startHeader.setInt32(12, 0, Endian.big);
      await _syncEngine?.sendBinary(startHeader.buffer.asUint8List());

      int successCount = 0;
      final streamer = PhotoStreamer(syncEngine: _syncEngine!);

      for (int i = 0; i < toSync.length; i++) {
        if (!isVideoSyncing) {
          logMessage("⏹️ Video sync stopped by user.");
          break;
        }

        while (isVideoSyncPaused && isVideoSyncing) {
          await Future.delayed(const Duration(milliseconds: 500));
        }
        if (!isVideoSyncing) break;

        final entity = toSync[i];
        final int fileId = _fileIdCounter++;
        logMessage("🎥 [${i + 1}/${toSync.length}] Streaming video: ${entity.title} (${entity.duration}s)...");

        final bool success = await streamer.streamImage(
          entity: entity,
          fileId: fileId,
          onProgress: (chunkIndex, totalChunks, bytesSent) {
            activeProgress = totalChunks > 0 ? chunkIndex / totalChunks : 0;
            activeTransferName = '🎥 ${entity.title}';
            notifyListeners();
          },
        );

        if (success) {
          successCount++;
          videoSyncDone = successCount;
          pcSyncedIds.add('video_${entity.id}');
          pcSyncedIds.add(entity.id);
        } else {
          logMessage("⚠️ Failed to sync video: ${entity.title}");
        }
        notifyListeners();
      }

      activeTransferName = null;
      activeProgress = 0;
      notifyListeners();

      if (isVideoSyncing) {
        logMessage("✅ Video sync finished: $videoSyncDone/${videoSyncTotal} videos sent.");
        final finishHeader = ByteData(16);
        finishHeader.setInt32(0, -16, Endian.big);
        finishHeader.setInt32(4, videoSyncDone, Endian.big);
        finishHeader.setInt32(8, videoSyncTotal, Endian.big);
        finishHeader.setInt32(12, 1, Endian.big);
        await _syncEngine?.sendBinary(finishHeader.buffer.asUint8List());
      }
    } catch (e, stack) {
      logMessage("❌ Video sync error: $e");
      debugPrint("[VideoSync] Error: $e\n$stack");
    } finally {
      isVideoSyncing = false;
      isVideoSyncPaused = false;
      notifyListeners();
    }
  }

  void pauseVideoSync() {
    if (isVideoSyncing && !isVideoSyncPaused) {
      isVideoSyncPaused = true;
      logMessage("🎥 Video sync paused.");
      notifyListeners();
      final header = ByteData(16);
      header.setInt32(0, -17, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  void resumeVideoSync() {
    if (isVideoSyncing && isVideoSyncPaused) {
      isVideoSyncPaused = false;
      logMessage("🎥 Video sync resumed.");
      notifyListeners();
      final header = ByteData(16);
      header.setInt32(0, -15, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, videoSyncTotal, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  void stopVideoSync() {
    if (isVideoSyncing) {
      isVideoSyncing = false;
      isVideoSyncPaused = false;
      logMessage("🎥 Video sync stopped.");
      notifyListeners();
      final header = ByteData(16);
      header.setInt32(0, -18, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  Future<void> syncAudiosToPC({bool forceFullScan = false, String? targetDate, List<String>? targetIds}) async {
    if (isAudioSyncing && !isAudioSyncPaused) return;

    if (isAudioSyncing && isAudioSyncPaused) {
      resumeAudioSync();
      return;
    }

    isAudioSyncing = true;
    isAudioSyncPaused = false;
    audioSyncDone = 0;
    audioSyncTotal = 0;
    notifyListeners();

    logMessage("🎵 Starting audio sync. Breakpoint date: ${(lastAudioSyncDate.isEmpty || forceFullScan) ? 'none (full scan)' : lastAudioSyncDate}");

    try {
      final PermissionState ps = await PhotoManager.requestPermissionExtend();
      if (!ps.isAuth) {
        logMessage("❌ Audio sync failed: no media permission");
        isAudioSyncing = false;
        notifyListeners();
        return;
      }

      if (localAudios.isEmpty) {
        logMessage("🎵 Audio sync: localAudios is empty, loading...");
        final streamer = PhotoStreamer.standalone();
        localAudios = await streamer.loadLocalAudio();
      }
      final List<AssetEntity> allAudios = List<AssetEntity>.from(localAudios);

      // Chronological sort in-memory (oldest first)
      allAudios.sort((a, b) {
        final aTime = a.createDateSecond ?? 0;
        final bTime = b.createDateSecond ?? 0;
        return aTime.compareTo(bTime);
      });

      List<AssetEntity> toSync = allAudios;
      if (targetIds != null && targetIds.isNotEmpty) {
        toSync = [];
        for (final tid in targetIds) {
          final cleanTid = tid.replaceFirst(RegExp(r'^(video_|audio_|photo_|album_|thumb_)'), '').trim();
          AssetEntity? found;
          for (final a in allAudios) {
            final sId = PhotoStreamer.sanitizeId(a.id);
            if (a.id == tid || a.id == cleanTid || sId == tid || sId == cleanTid || a.title == tid || a.title == cleanTid) {
              found = a;
              break;
            }
          }
          if (found == null) {
            try {
              found = await AssetEntity.fromId(cleanTid);
            } catch (_) {}
          }
          if (found == null) {
            try {
              found = await AssetEntity.fromId(tid);
            } catch (_) {}
          }
          if (found != null) {
            toSync.add(found);
          }
        }
      } else if (targetDate != null && targetDate.isNotEmpty) {
        toSync = allAudios.where((a) {
          final createMs = (a.createDateSecond != null && a.createDateSecond! > 0)
              ? a.createDateSecond
              : a.modifiedDateSecond;
          if (createMs == null || createMs == 0) return false;
          final dStr = DateTime.fromMillisecondsSinceEpoch(createMs * 1000, isUtc: true).toIso8601String().substring(0, 10);
          return dStr == targetDate;
        }).toList();
      } else if (lastAudioSyncDate.isNotEmpty && !forceFullScan) {
        DateTime? breakpoint;
        try {
          breakpoint = DateTime.parse(lastAudioSyncDate).toUtc();
        } catch (_) {}
        if (breakpoint != null) {
          toSync = allAudios.where((a) {
            final createMs = (a.createDateSecond != null && a.createDateSecond! > 0)
                ? a.createDateSecond
                : a.modifiedDateSecond;
            if (createMs == null || createMs == 0) return true; // Keep undated audio tracks for pcSyncedIds check
            final createDt = DateTime.fromMillisecondsSinceEpoch(createMs * 1000, isUtc: true);
            return createDt.isAfter(breakpoint!);
          }).toList();
        }
      }

      if (!forceFullScan && targetIds == null && targetDate == null) {
        toSync = toSync.where((a) => !pcSyncedIds.contains('audio_${a.id}') && !pcSyncedIds.contains(a.id)).toList();
      }

      audioSyncTotal = toSync.length;
      notifyListeners();

      if (toSync.isEmpty) {
        logMessage("✅ Audio sync complete: no matching or pending audios.");
        final doneHeader = ByteData(16);
        doneHeader.setInt32(0, -22, Endian.big);
        doneHeader.setInt32(4, 0, Endian.big);
        doneHeader.setInt32(8, 0, Endian.big);
        doneHeader.setInt32(12, 1, Endian.big); // 1 = isFinished
        await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());
        isAudioSyncing = false;
        notifyListeners();
        return;
      }

      logMessage("🎵 Audio sync: ${toSync.length} tracks to send (out of ${allAudios.length} total).");

      final startHeader = ByteData(16);
      startHeader.setInt32(0, -21, Endian.big);
      startHeader.setInt32(4, 0, Endian.big);
      startHeader.setInt32(8, toSync.length, Endian.big);
      startHeader.setInt32(12, 0, Endian.big);
      await _syncEngine?.sendBinary(startHeader.buffer.asUint8List());

      int successCount = 0;
      final streamer = PhotoStreamer(syncEngine: _syncEngine!);

      for (int i = 0; i < toSync.length; i++) {
        if (!isAudioSyncing) {
          logMessage("⏹️ Audio sync stopped by user.");
          break;
        }

        while (isAudioSyncPaused && isAudioSyncing) {
          await Future.delayed(const Duration(milliseconds: 500));
        }
        if (!isAudioSyncing) break;

        final entity = toSync[i];
        final int fileId = _fileIdCounter++;
        logMessage("🎵 [${i + 1}/${toSync.length}] Streaming audio: ${entity.title} (${entity.duration}s)...");

        // Keepalive touch before streaming each file
        _lastHeartbeatReceived = DateTime.now();

        int lastProgressMs = 0;
        final bool success = await streamer.streamAudio(
          entity: entity,
          fileId: fileId,
          onProgress: (chunkIndex, totalChunks, bytesSent) {
            final now = DateTime.now().millisecondsSinceEpoch;
            if (now - lastProgressMs > 120 || chunkIndex == totalChunks - 1) {
              lastProgressMs = now;
              activeProgress = totalChunks > 0 ? (chunkIndex + 1) / totalChunks : 0;
              activeTransferName = '🎵 ${entity.title}';
              notifyListeners();
            }
          },
        );

        if (success) {
          successCount++;
          audioSyncDone = successCount;
          pcSyncedIds.add('audio_${entity.id}');
          pcSyncedIds.add(entity.id);
          _lastHeartbeatReceived = DateTime.now();
        } else {
          logMessage("⚠️ Failed to sync audio: ${entity.title}");
        }
        notifyListeners();
      }

      activeTransferName = null;
      activeProgress = 0;
      notifyListeners();

      if (isAudioSyncing) {
        logMessage("✅ Audio sync finished: $audioSyncDone/${audioSyncTotal} tracks sent.");
        final finishHeader = ByteData(16);
        finishHeader.setInt32(0, -22, Endian.big);
        finishHeader.setInt32(4, audioSyncDone, Endian.big);
        finishHeader.setInt32(8, audioSyncTotal, Endian.big);
        finishHeader.setInt32(12, 1, Endian.big);
        await _syncEngine?.sendBinary(finishHeader.buffer.asUint8List());
      }
    } catch (e, stack) {
      logMessage("❌ Audio sync error: $e");
      debugPrint("[AudioSync] Error: $e\n$stack");
    } finally {
      isAudioSyncing = false;
      isAudioSyncPaused = false;
      notifyListeners();
    }
  }

  void pauseAudioSync() {
    if (isAudioSyncing && !isAudioSyncPaused) {
      isAudioSyncPaused = true;
      logMessage("🎵 Audio sync paused.");
      notifyListeners();
      final header = ByteData(16);
      header.setInt32(0, -23, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  void resumeAudioSync() {
    if (isAudioSyncing && isAudioSyncPaused) {
      isAudioSyncPaused = false;
      logMessage("🎵 Audio sync resumed.");
      notifyListeners();
      final header = ByteData(16);
      header.setInt32(0, -21, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, audioSyncTotal, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  void stopAudioSync() {
    if (isAudioSyncing) {
      isAudioSyncing = false;
      isAudioSyncPaused = false;
      logMessage("🎵 Audio sync stopped.");
      notifyListeners();
      final header = ByteData(16);
      header.setInt32(0, -24, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, 0, Endian.big);
      _syncEngine?.sendBinary(header.buffer.asUint8List());
    }
  }

  Future<void> pickFiles(String type) async {
    try {
      FileType fileType;
      if (type == 'image') {
        fileType = FileType.image;
      } else if (type == 'audio') {
        fileType = FileType.audio;
      } else if (type == 'video') {
        fileType = FileType.video;
      } else {
        fileType = FileType.any;
      }

      logMessage("Opening file picker for type: $type...");
      final result = await FilePicker.pickFiles(
        type: fileType,
        allowMultiple: true,
      );

      if (result != null && result.files.isNotEmpty) {
        // Append picked files to chosenFiles queue
        chosenFiles.addAll(result.files);
        logMessage("Added ${result.files.length} files to sync queue");
        notifyListeners();
      } else {
        logMessage("File selection canceled");
      }
    } catch (e) {
      logMessage("Error picking files: $e");
    }
  }

  Future<void> initDeviceUuid() async {
    final prefs = await SharedPreferences.getInstance();
    deviceUuid = prefs.getString('device_uuid');
    if (deviceUuid == null) {
      deviceUuid = _generateUuid();
      await prefs.setString('device_uuid', deviceUuid!);
    }

    deviceName = "Android Device";
    try {
      deviceName = Platform.isAndroid ? "Android Phone" : "iOS Phone";
      
      final Map<dynamic, dynamic>? info = await _channel.invokeMethod('getSystemInfo');
      if (info != null) {
        systemInfo = Map<String, dynamic>.from(info);
        final brand = systemInfo!['brand'] ?? '';
        final model = systemInfo!['model'] ?? '';
        deviceName = "$brand $model".trim();
        if (deviceName!.isEmpty) {
          deviceName = "Android Phone";
        }
      }
    } catch (e) {
      debugPrint("Failed to get system info: $e");
    }
    logMessage("Device initialized. UUID: $deviceUuid, Name: $deviceName");
  }

  String _generateUuid() {
    final random = Random();
    String hexDigit(int len) {
      final buffer = StringBuffer();
      for (var i = 0; i < len; i++) {
        buffer.write(random.nextInt(16).toRadixString(16));
      }
      return buffer.toString();
    }
    return '${hexDigit(8)}-${hexDigit(4)}-4${hexDigit(3)}-${(8 + random.nextInt(4)).toRadixString(16)}${hexDigit(3)}-${hexDigit(12)}';
  }

  void _sendHandshake() async {
    if (deviceUuid == null) {
      await initDeviceUuid();
    }

    final Map<String, dynamic> payloadMap = {
      "device_uuid": deviceUuid,
      "device_name": deviceName,
    };
    if (systemInfo != null) {
      payloadMap["system_info"] = systemInfo!;
    }

    final payloadStr = jsonEncode(payloadMap);
    final payloadBytes = utf8.encode(payloadStr);

    final header = ByteData(16);
    header.setInt32(0, -3, Endian.big); // file_id = -3 (Handshake)
    header.setInt32(4, 0, Endian.big);
    header.setInt32(8, 0, Endian.big);
    header.setInt32(12, payloadBytes.length, Endian.big);

    final packet = Uint8List(16 + payloadBytes.length);
    packet.setRange(0, 16, header.buffer.asUint8List());
    packet.setRange(16, packet.length, payloadBytes);

    logMessage("Sending Handshake packet (UUID: $deviceUuid)...");
    await _syncEngine?.sendBinary(packet);
  }

  void logMessage(String msg) {
    debugPrint("[ViewModel LOG] $msg");
    messageLog.add(msg);
    if (messageLog.length > 80) {
      messageLog.removeAt(0);
    }
    notifyListeners();
    // Relay logs to PC in real-time
    _bleClient.sendLog(msg);
  }

  void resetToScanner() {
    cleanup();
    startScanning();
  }

  /// Request on-demand AI vector and classification sync from PC (packet -29)
  Future<void> syncAiVectorsFromPc() async {
    if (appState != AppState.connected || _syncEngine == null) {
      logMessage("未连接到电脑，无法同步 AI 矢量数据");
      return;
    }

    try {
      isAiVectorSyncing = true;
      notifyListeners();
      logMessage("正在向 PC 发送 AI 矢量数据同步请求 (-29)...");

      final header = ByteData(16);
      header.setInt32(0, -29, Endian.big);
      header.setInt32(4, 0, Endian.big);
      header.setInt32(8, 0, Endian.big);
      header.setInt32(12, 0, Endian.big);

      await _syncEngine!.sendBinary(header.buffer.asUint8List());
    } catch (e) {
      isAiVectorSyncing = false;
      logMessage("请求 AI 矢量数据失败: $e");
      notifyListeners();
    }
  }

  void cleanup() {
    _setKeepScreenOn(false);
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _discoveryTimer?.cancel();
    _discoveryTimer = null;
    _bleClient.disconnect();
    _syncEngine?.close();
    _syncEngine = null;
    _photoStreamer = null;
    _remoteAnswerApplied = false;
    try {
      _udpSocket?.close();
    } catch (_) {}
    _udpSocket = null;
    appState = AppState.idle;
    isThumbnailSyncing = false;
    isAlbumSyncing = false;
    isAlbumSyncPaused = false;
    _chunkedBuffers.clear();
    localImages.clear();
    localVideos.clear();
    selectedImages.clear();
    selectedVideos.clear();
    selectedAudios.clear();
    chosenFiles.clear();
    transferStatusMap.clear();
    activeTransferName = null;
    activeProgress = 0.0;
    activeSpeedKbps = 0.0;
    errorMsg = "";
    notifyListeners();
  }

  @override
  void dispose() {
    _bleClient.connectionState.removeListener(_onBleStateChanged);
    cleanup();
    super.dispose();
  }
}
