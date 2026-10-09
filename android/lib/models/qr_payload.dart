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
    return QrPayload.parse(jsonStr);
  }

  static QrPayload parse(String raw) {
    final trimmed = raw.trim();

    // 1. 如果是 URL / Deep Link 形式
    if (trimmed.startsWith('shareclip://') || 
        trimmed.startsWith('http://') || 
        trimmed.startsWith('https://') || 
        trimmed.contains('?')) {
      try {
        final uri = Uri.parse(trimmed);
        final qp = uri.queryParameters;

        // 检查是否有打包参数 p (Base64 或 JSON)
        if (qp.containsKey('p')) {
          final pVal = qp['p']!;
          try {
            final decodedBytes = base64.decode(base64.normalize(pVal));
            final decodedStr = utf8.decode(decodedBytes);
            return _parseMap(json.decode(decodedStr));
          } catch (_) {
            try {
              return _parseMap(json.decode(pVal));
            } catch (_) {}
          }
        }

        // 解析平铺参数
        List<String>? parsedIps;
        if (qp['ip'] != null && qp['ip']!.isNotEmpty) {
          parsedIps = qp['ip']!.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
        }

        int port = 15186;
        if (qp['port'] != null) {
          port = int.tryParse(qp['port']!) ?? 15186;
        } else if (qp['p'] != null) {
          port = int.tryParse(qp['p']!) ?? 15186;
        }

        const defaultServiceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
        const defaultCharUuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

        return QrPayload(
          bleMac: (qp['m'] ?? qp['ble_mac'] ?? '').toString(),
          serviceUuid: (qp['u'] ?? qp['service_uuid'] ?? defaultServiceUuid).toString(),
          charUuid: (qp['c'] ?? qp['char_uuid'] ?? defaultCharUuid).toString(),
          sessionId: (qp['s'] ?? qp['session_id'] ?? '').toString(),
          hotspotSsid: qp['hs'] ?? qp['hotspotSsid'],
          hotspotPassword: qp['hp'] ?? qp['hotspotPassword'],
          pcIps: parsedIps,
          httpPort: port,
        );
      } catch (e) {
        // 若 URL 解析异常，继续尝试当做普通 JSON 解析
      }
    }

    // 2. 默认作为 JSON 解析
    final Map<String, dynamic> data = json.decode(trimmed);
    return _parseMap(data);
  }

  static QrPayload _parseMap(Map<String, dynamic> data) {
    List<String>? parsedIps;
    final rawIps = data['ip'] ?? data['pc_ips'];
    if (rawIps is List) {
      parsedIps = List<String>.from(rawIps.map((e) => e.toString()));
    } else if (rawIps is String && rawIps.isNotEmpty) {
      parsedIps = rawIps.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    }

    int port = 15186;
    final rawPort = data['p'] ?? data['http_port'] ?? data['port'];
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
