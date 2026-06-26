import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

enum BleState {
  idle,
  scanning,
  connecting,
  negotiatingMtu,
  discoveringServices,
  connected,
  failed,
}

class BleSignalingClient {
  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _targetCharacteristic;
  StreamSubscription? _scanSubscription;
  StreamSubscription? _notifySubscription;
  StreamSubscription? _connectionSubscription;

  // Connection states
  final ValueNotifier<BleState> connectionState = ValueNotifier<BleState>(BleState.idle);
  final ValueNotifier<String> errorNotifier = ValueNotifier<String>("");

  // BLE credentials
  String? _targetMac;
  String? _serviceUuid;
  String? _charUuid;
  String? _sessionId;

  // Incoming SDP chunks buffer
  final Map<int, String> _incomingChunks = {};
  int _expectedChunks = -1;

  // Handlers
  void Function(String sdp)? onAnswerSdpReceived;
  void Function(String sdpMid, int sdpMLineIndex, String candidate)? onIceCandidateReceived;

  void startConnect({
    required String mac,
    required String serviceUuid,
    required String charUuid,
    required String sessionId,
  }) async {
    _targetMac = mac;
    _serviceUuid = serviceUuid;
    _charUuid = charUuid;
    _sessionId = sessionId;

    errorNotifier.value = "";
    _cleanupState();

    // Verify Bluetooth state
    if (await FlutterBluePlus.isSupported == false) {
      _setError("Bluetooth is not supported on this device");
      return;
    }

    // Wait for Bluetooth to be turn on
    await FlutterBluePlus.adapterState.where((val) => val == BluetoothAdapterState.on).first;

    startScan();
  }

  void startScan() async {
    connectionState.value = BleState.scanning;

    _scanSubscription?.cancel();
    _scanSubscription = FlutterBluePlus.onScanResults.listen((results) async {
      for (ScanResult r in results) {
        final address = r.device.remoteId.str.replaceAll(':', '').toLowerCase();
        final target = _targetMac!.replaceAll(':', '').toLowerCase();
        if (address == target) {
          debugPrint("[BLE] Target device found: ${r.device.platformName} (${r.device.remoteId.str})");
          stopScan();
          connectToDevice(r.device);
          break;
        }
      }
    }, onError: (e) {
      _setError("Scan error: $e");
    });

    try {
      await FlutterBluePlus.startScan(timeout: const Duration(seconds: 15));
    } catch (e) {
      _setError("Failed to start scan: $e");
    }

    // Timeout check
    Future.delayed(const Duration(seconds: 15), () {
      if (connectionState.value == BleState.scanning) {
        stopScan();
        _setError("Device scan timeout");
      }
    });
  }

  void stopScan() {
    FlutterBluePlus.stopScan();
    _scanSubscription?.cancel();
    _scanSubscription = null;
  }

  void connectToDevice(BluetoothDevice device) async {
    connectionState.value = BleState.connecting;
    _connectedDevice = device;

    // Observe connection state changes
    _connectionSubscription?.cancel();
    _connectionSubscription = device.connectionState.listen((state) {
      debugPrint("[BLE] Connection state changed: $state");
      if (state == BluetoothConnectionState.disconnected) {
        connectionState.value = BleState.idle;
        _cleanupState();
      }
    });

    try {
      await device.connect(autoConnect: false, license: License.nonprofit);
      
      // Request MTU negotiation
      connectionState.value = BleState.negotiatingMtu;
      await device.requestMtu(512);

      // Discover services
      connectionState.value = BleState.discoveringServices;
      List<BluetoothService> services = await device.discoverServices();
      
      BluetoothService? targetService;
      for (var service in services) {
        if (service.uuid.toString().toLowerCase() == _serviceUuid!.toLowerCase()) {
          targetService = service;
          break;
        }
      }

      if (targetService == null) {
        _setError("Target service not found on GATT server");
        return;
      }

      for (var characteristic in targetService.characteristics) {
        if (characteristic.uuid.toString().toLowerCase() == _charUuid!.toLowerCase()) {
          _targetCharacteristic = characteristic;
          break;
        }
      }

      if (_targetCharacteristic == null) {
        _setError("Target characteristic not found");
        return;
      }

      // Enable Notifications
      await _targetCharacteristic!.setNotifyValue(true);
      
      _notifySubscription?.cancel();
      _notifySubscription = _targetCharacteristic!.onValueReceived.listen((value) {
        _handleIncomingData(value);
      });

      connectionState.value = BleState.connected;
      debugPrint("[BLE] Successfully connected and configured signaling channel");
    } catch (e) {
      _setError("GATT Connection error: $e");
      disconnect();
    }
  }

  void _handleIncomingData(List<int> bytes) {
    try {
      final String text = utf8.decode(bytes);
      debugPrint("[BLE] Received Notify: $text");
      
      final parts = text.split(":");
      if (parts.isEmpty) return;

      final type = parts[0];
      switch (type) {
        case "START":
          // START:<session_id>:<total_chunks>
          if (parts.length >= 3) {
            final session = parts[1];
            if (session == _sessionId) {
              _expectedChunks = int.tryParse(parts[2]) ?? -1;
              _incomingChunks.clear();
              debugPrint("[BLE] Reassembly started. Expected chunks: $_expectedChunks");
            }
          }
          break;
        case "CHUNK":
          // CHUNK:<session_id>:<index>:<payload>
          if (parts.length >= 4) {
            final session = parts[1];
            if (session == _sessionId) {
              final index = int.tryParse(parts[2]) ?? -1;
              // Extract payload with all colons preserved
              final prefix = "CHUNK:$session:$index:";
              if (text.length > prefix.length) {
                final payload = text.substring(prefix.length);
                if (index >= 0) {
                  _incomingChunks[index] = payload;
                }
              }
            }
          }
          break;
        case "END":
          // END:<session_id>
          if (parts.length >= 2) {
            final session = parts[1];
            if (session == _sessionId) {
              _assembleSdp();
            }
          }
          break;
        case "ICE":
          // ICE:<session_id>:<sdpMid>:<sdpMLineIndex>:<candidate>
          if (parts.length >= 5) {
            final session = parts[1];
            if (session == _sessionId) {
              final sdpMid = parts[2];
              final sdpMLineIndex = int.tryParse(parts[3]) ?? -1;
              // Candidate could contain colons, extract everything after prefix
              final prefix = "ICE:$session:$sdpMid:$sdpMLineIndex:";
              if (text.length > prefix.length) {
                final candidate = text.substring(prefix.length);
                onIceCandidateReceived?.call(sdpMid, sdpMLineIndex, candidate);
              }
            }
          }
          break;
      }
    } catch (e) {
      debugPrint("[BLE] Error processing incoming notification: $e");
    }
  }

  void _assembleSdp() {
    if (_expectedChunks <= 0) return;

    final sdpBuilder = StringBuffer();
    for (int i = 0; i < _expectedChunks; i++) {
      final chunk = _incomingChunks[i];
      if (chunk == null) {
        debugPrint("[BLE] Missing SDP chunk index $i");
        return;
      }
      sdpBuilder.write(chunk);
    }

    final fullSdp = sdpBuilder.toString();
    debugPrint("[BLE] SDP successfully reassembled. Length: ${fullSdp.length}");
    onAnswerSdpReceived?.call(fullSdp);
  }

  Future<bool> sendSdp(String sdp) async {
    final char = _targetCharacteristic;
    if (char == null) return false;

    const int chunkSize = 150;
    final List<String> chunks = [];
    int offset = 0;
    while (offset < sdp.length) {
      int end = (offset + chunkSize < sdp.length) ? offset + chunkSize : sdp.length;
      chunks.add(sdp.substring(offset, end));
      offset = end;
    }

    debugPrint("[BLE] Transmitting SDP in ${chunks.length} chunks");

    try {
      // 1. Send START
      await char.write(utf8.encode("START:$_sessionId:${chunks.length}"), withoutResponse: false);
      await Future.delayed(const Duration(milliseconds: 50));

      // 2. Send CHUNKS
      for (int i = 0; i < chunks.length; i++) {
        await char.write(utf8.encode("CHUNK:$_sessionId:$i:${chunks[i]}"), withoutResponse: false);
        await Future.delayed(const Duration(milliseconds: 30));
      }

      // 3. Send END
      await char.write(utf8.encode("END:$_sessionId"), withoutResponse: false);
      debugPrint("[BLE] SDP transmitted successfully");
      return true;
    } catch (e) {
      debugPrint("[BLE] Failed to write SDP chunks: $e");
      return false;
    }
  }

  Future<bool> sendIceCandidate(String sdpMid, int sdpMLineIndex, String candidate) async {
    final char = _targetCharacteristic;
    if (char == null) return false;

    final msg = "ICE:$_sessionId:$sdpMid:$sdpMLineIndex:$candidate";
    try {
      await char.write(utf8.encode(msg), withoutResponse: false);
      return true;
    } catch (e) {
      debugPrint("[BLE] Failed to send ICE candidate over BLE: $e");
      return false;
    }
  }

  void _setError(String error) {
    errorNotifier.value = error;
    connectionState.value = BleState.failed;
  }

  void _cleanupState() {
    _notifySubscription?.cancel();
    _notifySubscription = null;
    _connectionSubscription?.cancel();
    _connectionSubscription = null;
    _targetCharacteristic = null;
    _connectedDevice = null;
    _incomingChunks.clear();
    _expectedChunks = -1;
  }

  void disconnect() async {
    stopScan();
    try {
      if (_connectedDevice != null) {
        await _connectedDevice!.disconnect();
      }
    } catch (e) {
      debugPrint("[BLE] Error disconnecting BLE device: $e");
    }
    _cleanupState();
    connectionState.value = BleState.idle;
  }
}
