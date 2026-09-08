import 'dart:convert';

class QrPayload {
  final String bleMac;
  final String serviceUuid;
  final String charUuid;
  final String sessionId;
  final String? hotspotSsid;
  final String? hotspotPassword;
  final List<String>? pcIps;
  final int httpPort;

  QrPayload({
    required this.bleMac,
    required this.serviceUuid,
    required this.charUuid,
    required this.sessionId,
    this.hotspotSsid,
    this.hotspotPassword,
    this.pcIps,
    this.httpPort = 15186,
  });

  factory QrPayload.fromJson(String jsonStr) {
    final Map<String, dynamic> data = json.decode(jsonStr);
    
    List<String>? parsedIps;
    final rawIps = data['ip'] ?? data['pc_ips'];
    if (rawIps is List) {
      parsedIps = List<String>.from(rawIps.map((e) => e.toString()));
    }

    int port = 15186;
    final rawPort = data['p'] ?? data['http_port'];
    if (rawPort is int) {
      port = rawPort;
    } else if (rawPort != null) {
      port = int.tryParse(rawPort.toString()) ?? 15186;
    }

    const defaultServiceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    const defaultCharUuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

    return QrPayload(
      bleMac: (data['m'] ?? data['ble_mac'] ?? '').toString(),
      serviceUuid: (data['u'] ?? data['service_uuid'] ?? defaultServiceUuid).toString(),
      charUuid: (data['c'] ?? data['char_uuid'] ?? defaultCharUuid).toString(),
      sessionId: (data['s'] ?? data['session_id'] ?? '').toString(),
      hotspotSsid: data['hs']?.toString() ?? data['hotspotSsid']?.toString(),
      hotspotPassword: data['hp']?.toString() ?? data['hotspotPassword']?.toString(),
      pcIps: parsedIps,
      httpPort: port,
    );
  }
}
