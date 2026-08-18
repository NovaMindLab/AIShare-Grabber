const fs = require('fs');

// 1. Fix qr_scanner_view.dart line 115
let qrPath = 'android/lib/views/qr_scanner_view.dart';
let qrContent = fs.readFileSync(qrPath, 'utf8');
let lines = qrContent.split('\n');
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('ScaffoldMessenger.of(context).showSnackBar')) {
    lines[i] = "                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('正在连接 \\${pc['name']}... 请在电脑端同意连接请求')));";
  }
}
fs.writeFileSync(qrPath, lines.join('\n'));

// 2. Add handleRemoteOffer
let enginePath = 'android/lib/services/webrtc_sync_engine.dart';
let engineContent = fs.readFileSync(enginePath, 'utf8');
if (!engineContent.includes('handleRemoteOffer')) {
  let target = '  Future<void> setRemoteAnswer(String answerSdp) async {';
  let replacement = `  Future<String> handleRemoteOffer(String offerSdp) async {
    RTCSessionDescription offer = RTCSessionDescription(offerSdp, 'offer');
    await _peerConnection!.setRemoteDescription(offer);
    RTCSessionDescription answer = await _peerConnection!.createAnswer({});
    await _peerConnection!.setLocalDescription(answer);
    return answer.sdp!;
  }

  Future<void> setRemoteAnswer(String answerSdp) async {`;
  engineContent = engineContent.replace(target, replacement);
  fs.writeFileSync(enginePath, engineContent);
}
