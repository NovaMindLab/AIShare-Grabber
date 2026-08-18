const fs = require('fs');
let c = fs.readFileSync('../android/lib/viewmodels/sync_viewmodel.dart', 'utf-8');

// 1. Add discoveredPCs list and timer
if (!c.includes('List<Map<String, dynamic>> discoveredPCs = [];')) {
  c = c.replace(
    'class SyncViewModel extends ChangeNotifier {',
    `import 'dart:async';\nimport 'dart:io';\nimport 'package:device_info_plus/device_info_plus.dart';\nclass SyncViewModel extends ChangeNotifier {\n  List<Map<String, dynamic>> discoveredPCs = [];\n  Timer? _discoveryTimer;\n  String? _mobileName;`
  );
}

// 2. Modify _startUdpListener and add _startUdpDiscoveryBroadcast and connectToPC
if (!c.includes('_startUdpDiscoveryBroadcast')) {
  const oldListener = `  void _startUdpListener() async {
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
  }`;

  const newListener = `  Future<void> _initMobileName() async {
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
        'device_uuid': 'mobile-\${DateTime.now().millisecondsSinceEpoch}', // simplistic uuid
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
    logMessage("Attempting UDP connection to PC $name ($ip)");
    await _initMobileName();
    _sendUdp({
      'type': 'ShareCLIP_Connect_Request',
      'from_uuid': 'mobile-temp',
      'from_name': _mobileName ?? 'Mobile Device',
    });
    // The PC will prompt the user. If accepted, PC will connect to us via WebRTC.
    // For that, we should start listening as if we were connected to GATT hotspot.
    // Actually, if PC accepts, it sends 'ShareCLIP_Connect_Response' with SDP offer.
    // We should handle that in UDP listener.
    _initializeWebRtc(isUdpFallback: true); 
  }

  void _startUdpListener() async {
    try {
      // Bind to 15185 to receive broadcasts from PC
      _udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 15185, reuseAddress: true, reusePort: true);
      _udpSocket!.broadcastEnabled = true;
      _startUdpDiscoveryBroadcast();
      
      _udpSocket!.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          Datagram? dg = _udpSocket!.receive();
          if (dg != null) {
            try {
              final msg = utf8.decode(dg.data);
              final data = json.decode(msg);
              
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
              } else if (data['type'] == 'ShareCLIP_Direct_Sdp' && data['sdpType'] == 'answer') {
                logMessage("Received UDP Answer SDP");
                _handleRemoteAnswer(data['sdp']);
              } else if (data['type'] == 'ShareCLIP_Direct_Sdp' && data['sdpType'] == 'offer') {
                logMessage("Received UDP Offer SDP");
                _handleRemoteOffer(data['sdp']);
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
  }`;

  c = c.replace(oldListener, newListener);
}

// Clean up duplicate imports if any
c = c.replace(/import 'dart:async';\nimport 'dart:io';\nimport 'package:device_info_plus\/device_info_plus\.dart';\nimport 'dart:async';/g, "import 'dart:async';\nimport 'dart:io';\nimport 'package:device_info_plus/device_info_plus.dart';");

fs.writeFileSync('../android/lib/viewmodels/sync_viewmodel.dart', c);
console.log('sync_viewmodel.dart patched');
