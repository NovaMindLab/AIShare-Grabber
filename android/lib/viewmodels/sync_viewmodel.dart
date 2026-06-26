import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../models/qr_payload.dart';
import '../services/ble_signaling_client.dart';
import '../services/webrtc_sync_engine.dart';
import '../services/photo_streamer.dart';

enum AppState {
  idle,
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
  List<AssetEntity> localImages = [];
  final Set<String> selectedImages = {};
  String? activeTransferName;
  double activeProgress = 0.0;
  double activeSpeedKbps = 0.0;
  final Map<String, TransferStatus> transferStatusMap = {};
  final List<String> messageLog = [];
  bool permissionsGranted = false;
  String errorMsg = "";

  int _fileIdCounter = 100;

  SyncViewModel() {
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
      startScanning();
    }
  }

  void startScanning() {
    appState = AppState.scanning;
    errorMsg = "";
    notifyListeners();
    logMessage("Camera QR scanner active. Awaiting payload...");
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
        if (appState != AppState.scanning && appState != AppState.idle) {
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

    _syncEngine = WebRtcSyncEngine(
      onLocalIceCandidate: (localCandidate) async {
        await _bleClient.sendIceCandidate(
          localCandidate.sdpMid!,
          localCandidate.sdpMLineIndex!,
          localCandidate.candidate!,
        );
      },
      onMessageReceived: (binaryData) {
        logMessage("WebRTC incoming binary payload size: ${binaryData.length}B");
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
    }
  }

  void _loadLocalGallery() async {
    if (_photoStreamer == null) return;
    localImages = await _photoStreamer!.loadLocalImages();
    logMessage("Loaded ${localImages.length} gallery images from storage");
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

  void startSyncingSelected() async {
    final imagesToSync = localImages.where((img) => selectedImages.contains(img.id)).toList();
    if (imagesToSync.isEmpty) return;

    for (var img in imagesToSync) {
      transferStatusMap[img.id] = TransferStatus.pending;
    }
    selectedImages.clear();
    notifyListeners();

    for (var img in imagesToSync) {
      await _syncSingleImage(img);
    }
  }

  Future<void> _syncSingleImage(AssetEntity entity) async {
    transferStatusMap[entity.id] = TransferStatus.transferring;
    activeTransferName = entity.title;
    activeProgress = 0.0;
    activeSpeedKbps = 0.0;
    notifyListeners();

    final fileId = _fileIdCounter++;
    final streamer = _photoStreamer;
    if (streamer == null) return;

    final startTime = DateTime.now().millisecondsSinceEpoch;

    final success = await streamer.streamImage(
      entity: entity,
      fileId: fileId,
      onProgress: (chunkIndex, totalChunks, bytesSent) {
        activeProgress = (chunkIndex + 1) / totalChunks;
        final double elapsedSec = (DateTime.now().millisecondsSinceEpoch - startTime) / 1000.0;
        activeSpeedKbps = (elapsedSec > 0) ? (bytesSent * 8.0) / 1024.0 / elapsedSec : 0.0;
        notifyListeners();
      },
    );

    transferStatusMap[entity.id] = success ? TransferStatus.completed : TransferStatus.failed;
    activeTransferName = null;
    activeProgress = 0.0;
    activeSpeedKbps = 0.0;
    logMessage("Sync finished for ${entity.title}. Status: ${transferStatusMap[entity.id]}");
    notifyListeners();
  }

  void logMessage(String msg) {
    debugPrint("[ViewModel LOG] $msg");
    messageLog.add(msg);
    if (messageLog.length > 80) {
      messageLog.removeAt(0);
    }
    notifyListeners();
  }

  void resetToScanner() {
    cleanup();
    startScanning();
  }

  void cleanup() {
    _bleClient.disconnect();
    _syncEngine?.close();
    _syncEngine = null;
    _photoStreamer = null;
    appState = AppState.idle;
    localImages.clear();
    selectedImages.clear();
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
