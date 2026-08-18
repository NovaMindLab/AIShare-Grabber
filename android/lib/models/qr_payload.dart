import 'dart:convert';

class QrPayload {
  final String bleMac;
  final String serviceUuid;
  final String charUuid;
  final String sessionId;
  final String? hotspotSsid;
  final String? hotspotPassword;
  final List<String>? pcIps;

  QrPayload({
    required this.bleMac,
    required this.serviceUuid,
    required this.charUuid,
    required this.sessionId,
    this.hotspotSsid,
    this.hotspotPassword,
    this.pcIps,
  });

  factory QrPayload.fromJson(String jsonStr) {
    final Map<String, dynamic> data = json.decode(jsonStr);
    
    List<String>? parsedIps;
    if (data['pc_ips'] != null) {
      parsedIps = List<String>.from(data['pc_ips']);
    }

    return QrPayload(
      bleMac: data['ble_mac'] ?? '',
      serviceUuid: data['service_uuid'] ?? '',
      charUuid: data['char_uuid'] ?? '',
      sessionId: data['session_id'] ?? '',
      hotspotSsid: data['hotspotSsid'],
      hotspotPassword: data['hotspotPassword'],
      pcIps: parsedIps,
    );
  }
}
