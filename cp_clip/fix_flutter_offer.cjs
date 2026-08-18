const fs = require('fs');

// 1. Add handleRemoteOffer to webrtc_sync_engine.dart
let enginePath = 'android/lib/services/webrtc_sync_engine.dart';
let engine = fs.readFileSync(enginePath, 'utf-8');

if (!engine.includes('Future<String> handleRemoteOffer')) {
  const insertIndex = engine.indexOf('Future<void> setRemoteAnswer(String sdp) async {');
  if (insertIndex !== -1) {
    const handleRemoteOfferCode = `
  Future<String> handleRemoteOffer(String offerSdp) async {
    RTCSessionDescription offer = RTCSessionDescription(offerSdp, 'offer');
    await _peerConnection!.setRemoteDescription(offer);
    RTCSessionDescription answer = await _peerConnection!.createAnswer({});
    await _peerConnection!.setLocalDescription(answer);
    return answer.sdp!;
  }

  `;
    engine = engine.slice(0, insertIndex) + handleRemoteOfferCode + engine.slice(insertIndex);
    fs.writeFileSync(enginePath, engine);
    console.log('webrtc_sync_engine.dart patched');
  } else {
    console.log('setRemoteAnswer not found in webrtc_sync_engine.dart');
  }
}

// 2. Add _handleRemoteOffer to sync_viewmodel.dart
let syncVmPath = 'android/lib/viewmodels/sync_viewmodel.dart';
let syncVm = fs.readFileSync(syncVmPath, 'utf-8');

if (!syncVm.includes('void _handleRemoteOffer(String offerSdp) async {')) {
  const insertIndex = syncVm.indexOf('void _handleRemoteAnswer(String answerSdp) async {');
  if (insertIndex !== -1) {
    const _handleRemoteOfferCode = `
  void _handleRemoteOffer(String offerSdp) async {
    logMessage("Received remote Offer SDP via UDP.");
    appState = AppState.connectingWebRtc;
    notifyListeners();

    try {
      String answerSdp = await _syncEngine!.handleRemoteOffer(offerSdp);
      logMessage("Generated local answer. Sending back via UDP...");
      _sendUdpSdp(answerSdp, 'answer');
    } catch (e) {
      logMessage("Error applying Remote Offer: $e");
      errorMsg = "Failed to apply Offer SDP";
      appState = AppState.failed;
      notifyListeners();
      cleanup();
    }
  }

  `;
    syncVm = syncVm.slice(0, insertIndex) + _handleRemoteOfferCode + syncVm.slice(insertIndex);
    fs.writeFileSync(syncVmPath, syncVm);
    console.log('sync_viewmodel.dart patched with _handleRemoteOffer');
  }
}

// Ensure "dart:async" is removed if it caused duplication
syncVm = syncVm.replace(/import 'dart:async';\nimport 'dart:io';\nimport 'package:device_info_plus\/device_info_plus\.dart';\nimport 'dart:async';/g, "import 'dart:async';\nimport 'dart:io';\nimport 'package:device_info_plus/device_info_plus.dart';");
fs.writeFileSync(syncVmPath, syncVm);

