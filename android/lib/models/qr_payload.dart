import 'dart:convert';

class QrPayload {
  final String bleMac;
  final String serviceUuid;
  final String charUuid;
  final String sessionId;

  QrPayload({
    required this.bleMac,
    required this.serviceUuid,
    required this.charUuid,
    required this.sessionId,
  });

  factory QrPayload.fromJson(String jsonStr) {
    final Map<String, dynamic> data = json.decode(jsonStr);
    return QrPayload(
      bleMac: data['ble_mac'] ?? '',
      serviceUuid: data['service_uuid'] ?? '',
      charUuid: data['char_uuid'] ?? '',
      sessionId: data['session_id'] ?? '',
    );
  }
}
