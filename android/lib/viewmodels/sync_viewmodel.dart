import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:file_picker/file_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/qr_payload.dart';
import '../services/ble_signaling_client.dart';
import '../services/webrtc_sync_engine.dart';
import '../services/photo_streamer.dart';

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
  // Core Engines
  late final BleSignalingClient _bleClient;
  WebRtcSyncEngine? _syncEngine;
  PhotoStreamer? _photoStreamer;

  // View States
  AppState appState = AppState.idle;
  List<AssetEntity> localImages = [];   // photos + videos (gallery)
  List<AssetEntity> localAudios = [];   // music/audio from MediaStore
  final Set<String> selectedImages = {};
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
  final Set<String> pcSyncedIds = {};

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

    // Load images+videos and audio in parallel
    final results = await Future.wait([
      streamer.loadLocalImages(),
      streamer.loadLocalAudio(),
    ]);

    localImages = results[0];
    localAudios = results[1];

    debugPrint('[ViewModel] Gallery loaded: ${localImages.length} media, ${localAudios.length} audio');
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
        errorMsg = _bleClient.errorNotifier.value;
        appState = AppState.failed;
        notifyListeners();
        break;
    }
  }

  void _initializeWebRtc() async {
    logMessage("GATT signaling connected. Starting local WebRTC...");
    appState = AppState.generatingOffer;
    notifyListeners();

    final Map<int, List<Uint8List?>> incomingFiles = {};
    final Map<int, int> receivedChunksCount = {};

    _syncEngine = WebRtcSyncEngine(
      onLocalIceCandidate: (localCandidate) async {
        await _bleClient.sendIceCandidate(
          localCandidate.sdpMid!,
          localCandidate.sdpMLineIndex!,
          localCandidate.candidate!,
        );
      },
      onMessageReceived: (binaryData) async {
        try {
          if (binaryData.length < 16) {
            logMessage("WebRTC received invalid small packet: ${binaryData.length}B");
            return;
          }

          // Parse 16-byte header
          final byteData = ByteData.sublistView(binaryData, 0, 16);
          final fileId = byteData.getInt32(0, Endian.big);

          if (fileId == -2) {
            // Pong received
            _lastHeartbeatReceived = DateTime.now();
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
            logMessage("Handshake response received! PC has already synced ${pcSyncedIds.length} files.");
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
      logMessage("Uploading generated Offer SDP over BLE...");
      notifyListeners();

      final success = await _bleClient.sendSdp(offerSdp);
      if (success) {
        appState = AppState.waitingForAnswer;
        logMessage("Offer SDP transmitted. Awaiting remote Answer SDP...");
        notifyListeners();
      } else {
        throw Exception("Failed to send Offer SDP over BLE characteristics");
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
      if (diff.inSeconds >= 15) {
        logMessage("⚠️ 心跳超时：PC端已离线");
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
      _photoStreamer!.loadLocalAudio(),
    ]);
    localImages = results[0];
    localAudios = results[1];
    logMessage('Gallery: ${localImages.length} media, ${localAudios.length} audio');
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
    final audiosToSync = localAudios.where((a) => selectedAudios.contains(a.id)).toList();
    final filesToSync = List<PlatformFile>.from(chosenFiles);

    if (imagesToSync.isEmpty && audiosToSync.isEmpty && filesToSync.isEmpty) return;

    for (var img in imagesToSync) {
      transferStatusMap[img.id] = TransferStatus.pending;
    }
    for (var a in audiosToSync) {
      transferStatusMap[a.id] = TransferStatus.pending;
    }
    selectedImages.clear();
    selectedAudios.clear();
    chosenFiles.clear();
    notifyListeners();

    // 1. Sync gallery assets (images & videos)
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

    // 2. Sync selected audio assets from MediaStore
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
    } catch (_) {}
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

    final payloadStr = jsonEncode({
      "device_uuid": deviceUuid,
      "device_name": deviceName,
    });
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
    selectedImages.clear();
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
