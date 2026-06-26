import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class WebRtcSyncEngine {
  RTCPeerConnection? _peerConnection;
  RTCDataChannel? _dataChannel;

  // Observers / Listeners
  final void Function(RTCIceCandidate candidate) onLocalIceCandidate;
  final void Function(Uint8List message) onMessageReceived;

  // States
  final ValueNotifier<RTCPeerConnectionState> connectionState = 
      ValueNotifier<RTCPeerConnectionState>(RTCPeerConnectionState.RTCPeerConnectionStateNew);

  final ValueNotifier<RTCDataChannelState> dataChannelState = 
      ValueNotifier<RTCDataChannelState>(RTCDataChannelState.RTCDataChannelClosed);

  WebRtcSyncEngine({
    required this.onLocalIceCandidate,
    required this.onMessageReceived,
  });

  Future<void> startPeerConnection() async {
    final Map<String, dynamic> configuration = {
      "iceServers": [
        {"url": "stun:stun.l.google.com:19302"},
      ],
      "sdpSemantics": "unified-plan",
      "bundlePolicy": "max-bundle",
      "rtcpMuxPolicy": "require",
    };

    final Map<String, dynamic> loopbackConstraints = {
      "mandatory": {},
      "optional": [],
    };

    _peerConnection = await createPeerConnection(configuration, loopbackConstraints);

    // Bind PeerConnection callbacks
    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      debugPrint("[WebRTC] Local ICE Candidate gathered: ${candidate.candidate}");
      onLocalIceCandidate(candidate);
    };

    _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
      debugPrint("[WebRTC] Connection state change: $state");
      connectionState.value = state;
    };

    _peerConnection!.onDataChannel = (RTCDataChannel dc) {
      debugPrint("[WebRTC] Remote peer opened DataChannel: ${dc.label}");
      _dataChannel = dc;
      _bindDataChannel(dc);
    };

    // Create DataChannel (Client-side init)
    RTCDataChannelInit init = RTCDataChannelInit()..ordered = true;
    _dataChannel = await _peerConnection!.createDataChannel("photo_sync", init);
    _bindDataChannel(_dataChannel!);
    debugPrint("[WebRTC] DataChannel 'photo_sync' successfully created");
  }

  void _bindDataChannel(RTCDataChannel dc) {
    dc.onDataChannelState = (RTCDataChannelState state) {
      debugPrint("[WebRTC] DataChannel state change: $state");
      dataChannelState.value = state;
    };

    dc.onMessage = (RTCDataChannelMessage message) {
      if (message.isBinary) {
        onMessageReceived(message.binary);
      }
    };
  }

  Future<String> createOffer() async {
    if (_peerConnection == null) throw StateError("PeerConnection is not initialized");

    final Map<String, dynamic> constraints = {
      "mandatory": {
        "OfferToReceiveAudio": false,
        "OfferToReceiveVideo": false,
      },
      "optional": [],
    };

    RTCSessionDescription offer = await _peerConnection!.createOffer(constraints);
    await _peerConnection!.setLocalDescription(offer);
    
    debugPrint("[WebRTC] Generated local Offer SDP");
    return offer.sdp!;
  }

  Future<void> setRemoteAnswer(String answerSdp) async {
    if (_peerConnection == null) throw StateError("PeerConnection is not initialized");

    RTCSessionDescription answer = RTCSessionDescription(answerSdp, "answer");
    await _peerConnection!.setRemoteDescription(answer);
    debugPrint("[WebRTC] Remote Answer SDP successfully injected");
  }

  Future<void> addRemoteIceCandidate(String sdpMid, int sdpMLineIndex, String candidateStr) async {
    if (_peerConnection == null) return;
    RTCIceCandidate candidate = RTCIceCandidate(candidateStr, sdpMid, sdpMLineIndex);
    await _peerConnection!.addCandidate(candidate);
    debugPrint("[WebRTC] Injected remote ICE Candidate");
  }

  int getBufferedAmount() {
    return _dataChannel?.bufferedAmount ?? 0;
  }

  Future<bool> sendBinary(Uint8List data) async {
    final dc = _dataChannel;
    if (dc == null || dataChannelState.value != RTCDataChannelState.RTCDataChannelOpen) {
      return false;
    }

    try {
      await dc.send(RTCDataChannelMessage.fromBinary(data));
      return true;
    } catch (e) {
      debugPrint("[WebRTC] Failed to transmit package over DataChannel: $e");
      return false;
    }
  }

  Future<void> close() async {
    try {
      await _dataChannel?.close();
    } catch (e) {
      debugPrint("[WebRTC] Error closing DataChannel: $e");
    }
    _dataChannel = null;

    try {
      await _peerConnection?.close();
      await _peerConnection?.dispose();
    } catch (e) {
      debugPrint("[WebRTC] Error disposing PeerConnection: $e");
    }
    _peerConnection = null;

    connectionState.value = RTCPeerConnectionState.RTCPeerConnectionStateClosed;
    dataChannelState.value = RTCDataChannelState.RTCDataChannelClosed;
  }
}
