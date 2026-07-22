import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:file_picker/file_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/qr_payload.dart';
import '../services/ble_signaling_client.dart';
import '../services/webrtc_sync_engine.dart';
import '../services/photo_streamer.dart';
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
  final List<Uint8List> _chunkedBufferList = [];

  bool isThumbnailSyncing = false;
  int thumbnailSyncTotal = 0;
  int thumbnailSyncDone = 0;

  bool isAlbumSyncing = false;
  int albumSyncTotal = 0;
  int albumSyncDone = 0;
  String lastAlbumSyncDate = '';
  bool isAlbumSyncPaused = false;

  int _fileIdCounter = 100;
  Timer? _heartbeatTimer;
  DateTime _lastHeartbeatReceived = DateTime.now();

  SyncViewModel() {
    initDeviceUuid();
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
    if (granted && appState == AppState.idle) {
      // Go to home screen, not directly to scanner
      appState = AppState.home;
      notifyListeners();
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
    
    if (payload.bleMac.isEmpty && payload.hotspotSsid != null) {
      logMessage("QR Code indicates no BLE support. Triggering Wi-Fi Hotspot mode directly...");
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
    logMessage("Connecting to Wi-Fi: ${payload.hotspotSsid}");
    try {
      if (Platform.isAndroid) {
        await Permission.location.request();
        await Permission.nearbyWifiDevices.request();
      }
      final connected = await WiFiForIoTPlugin.connect(
        payload.hotspotSsid!,
        password: payload.hotspotPassword,
        security: NetworkSecurity.WPA,
        withInternet: false,
      );
      if (connected) {
        logMessage("Wi-Fi Connected! Starting UDP signaling...");
        _initializeWebRtc(isUdpFallback: true);
      } else {
        errorMsg = "Wi-Fi Hotspot connection failed.";
        appState = AppState.failed;
        notifyListeners();
      }
    } catch (e) {
      errorMsg = "Wi-Fi error: $e";
      appState = AppState.failed;
      notifyListeners();
    }
  }

  void _startUdpListener() async {
    try {
      _udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      _udpSocket!.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          Datagram? dg = _udpSocket!.receive();
          if (dg != null) {
            try {
              final msg = utf8.decode(dg.data);
              final data = json.decode(msg);
              if (data['type'] == 'ShareCLIP_Direct_Sdp' && data['sdpType'] == 'answer') {
                logMessage("Received UDP Answer SDP");
                _handleRemoteAnswer(data['sdp']);
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
    if (_udpSocket == null) return;
    final bytes = utf8.encode(json.encode(payload));

    final targets = <String>{
      '255.255.255.255',
      '192.168.137.1',
      '192.168.43.1',
      '192.168.137.255',
      '192.168.43.255',
    };

    try {
      final String? ip = await WiFiForIoTPlugin.getIP();
      if (ip != null && ip.contains('.')) {
        final parts = ip.split('.');
        if (parts.length == 4) {
          final prefix = '${parts[0]}.${parts[1]}.${parts[2]}';
          targets.add('$prefix.1');
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
    for (int i = 0; i < 3; i++) {
      _sendUdp({
        'type': 'ShareCLIP_Direct_Sdp',
        'sdp': sdp,
        'sdpType': type
      });
      await Future.delayed(const Duration(milliseconds: 80));
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

            _chunkedBufferList.add(chunkData);

            if (chunkIndex == totalChunks - 1) {
              final totalBytesCount = _chunkedBufferList.fold<int>(0, (sum, list) => sum + list.length);
              final fullBytes = Uint8List(totalBytesCount);
              int currOffset = 0;
              for (var chunk in _chunkedBufferList) {
                fullBytes.setAll(currOffset, chunk);
                currOffset += chunk.length;
              }
              _chunkedBufferList.clear();

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
              }
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

    try {
      await _syncEngine!.startPeerConnection();
      final offerSdp = await _syncEngine!.createOffer();

      appState = AppState.sendingOffer;
      notifyListeners();

      if (isUdpFallback) {
         logMessage("Sending UDP Offer SDP to PC...");
         _startUdpListener();
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

    // Observe DataChannel and Connection states
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
  }

  void _handleRemoteAnswer(String answerSdp) async {
    logMessage("Received remote Answer SDP via BLE notification.");
    appState = AppState.connectingWebRtc;
    notifyListeners();

    try {
      await _syncEngine?.setRemoteAnswer(answerSdp);
      logMessage("Applied remote answer. Performing WebRTC ICE handshaking...");
    } catch (e) {
      logMessage("Error applying Remote Answer: $e");
      errorMsg = "Failed to apply Answer SDP";
      appState = AppState.failed;
      notifyListeners();
      cleanup();
    }
  }

  void _onDataChannelStateChanged() {
    final state = _syncEngine?.dataChannelState.value;
    logMessage("WebRTC DataChannel state: $state");

    if (state == RTCDataChannelState.RTCDataChannelOpen) {
      appState = AppState.connected;
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
      // Relax heartbeat timeout during active thumbnail/album syncs to prevent disconnects under heavy AI load
      final isTransferring = isThumbnailSyncing || isAlbumSyncing || activeTransferName != null;
      final maxTimeoutSeconds = isTransferring ? 180 : 60;

      if (diff.inSeconds >= maxTimeoutSeconds) {
        logMessage("⚠️ 心跳超时：PC端已离线 (${diff.inSeconds}s)");
        timer.cancel();
        resetToScanner();
        return;
      }

      // Send Ping (file_id = -1, chunk_index = 0, total_chunks = 0, payload_size = 0)
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
    final list = targets ?? localImages.where((e) => e.type == AssetType.image).toList();
    if (list.isEmpty || isThumbnailSyncing) return;

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

      final String thumbName = 'thumb_${entity.id}.jpg';
       if (pcSyncedThumbnailIds.contains(entity.id) || pcSyncedThumbnailIds.contains(thumbName)) {
        debugPrint("Skip sending thumbnail for ${entity.title} (already synced)");
        thumbnailSyncDone++;
        notifyListeners();
        continue;
      }

      final fileId = _fileIdCounter++;
      final streamer = _photoStreamer;
      if (streamer == null) continue;

      final success = await streamer.streamThumbnail(
        entity: entity,
        fileId: fileId,
        onProgress: (_, __, ___) {},
      );

      if (success) {
        thumbnailSyncDone++;
      } else {
        logMessage("Failed to sync thumbnail for ${entity.title}");
      }
      notifyListeners();
    }

    // Send completion signal to PC: fileId=-6, totalCount=-1 means "sync all done"
    final doneHeader = ByteData(16);
    doneHeader.setInt32(0, -6, Endian.big);
    doneHeader.setInt32(4, 0, Endian.big);
    doneHeader.setInt32(8, -1, Endian.big); // -1 = completion sentinel
    doneHeader.setInt32(12, 0, Endian.big);
    await _syncEngine?.sendBinary(doneHeader.buffer.asUint8List());

    isThumbnailSyncing = false;
    notifyListeners();
    logMessage("Batch AI thumbnail sync finished. Sync completed: $thumbnailSyncDone/$thumbnailSyncTotal");
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
        final createMs = entity.createDateSecond;
        if (createMs == null) return false;
        final createDt = DateTime.fromMillisecondsSinceEpoch(createMs * 1000, isUtc: true);
        return createDt.isAfter(breakpoint!);
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
        if (pcSyncedIds.contains('album_${entity.id}') || pcSyncedIds.contains(entity.id)) {
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

  void cleanup() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _bleClient.disconnect();
    _syncEngine?.close();
    _syncEngine = null;
    _photoStreamer = null;
    appState = AppState.idle;
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
