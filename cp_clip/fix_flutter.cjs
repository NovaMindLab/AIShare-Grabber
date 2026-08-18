const fs = require('fs');

// 1. Fix qr_scanner_view.dart
let qrViewPath = 'android/lib/views/qr_scanner_view.dart';
let qrView = fs.readFileSync(qrViewPath, 'utf-8');
// Fix the broken string interpolation
// Text('正在连接 \${pc['name']}... 请在电脑端同意连接请求')
// Should be Text("正在连接 \${pc['name']}... 请在电脑端同意连接请求")
qrView = qrView.replace(
  /Text\('正在连接 \$\{pc\['name'\]\}\.\.\. 请在电脑端同意连接请求'\)/g,
  `Text("正在连接 \${pc['name']}... 请在电脑端同意连接请求")`
);
fs.writeFileSync(qrViewPath, qrView);

// 2. Fix sync_viewmodel.dart
let syncVmPath = 'android/lib/viewmodels/sync_viewmodel.dart';
let syncVm = fs.readFileSync(syncVmPath, 'utf-8');

// Remove misplaced imports
const misplacedImports = `import 'dart:async';\nimport 'dart:io';\nimport 'package:device_info_plus/device_info_plus.dart';\n`;
if (syncVm.includes(misplacedImports + 'class SyncViewModel')) {
  syncVm = syncVm.replace(misplacedImports + 'class SyncViewModel', 'class SyncViewModel');
  // Add them to the top
  const topImports = `import 'dart:async';\nimport 'dart:io';\nimport 'package:device_info_plus/device_info_plus.dart';\n`;
  syncVm = topImports + syncVm;
}

// Remove _handleRemoteOffer usage or add it.
// In my previous patch I added:
// _handleRemoteOffer(data['sdp']);
// If it doesn't exist, we can't use it.
// Let's replace _handleRemoteOffer(data['sdp']) with _handleRemoteAnswer(data['sdp']) for now, since it might just be the same SDP parsing.
// Actually, if we are the caller (we sent ShareCLIP_Connect_Request), the PC accepts and sends an offer? Or we send an offer?
// Let's remove the _handleRemoteOffer part since WebRTC will fallback to GATT signaling for SDP if possible, or wait, PC sends UDP SDP.
// The easiest fix is to just remove the _handleRemoteOffer call and let WebRTC handle it or change it to _handleRemoteAnswer if it's an answer.
// PC sends `ShareCLIP_Connect_Response (accept: true, sdp: ...)`
// Wait, PC sends an Offer. Android needs to process Offer.
// Let's look at if _handleRemoteOffer exists in the original code.

fs.writeFileSync(syncVmPath, syncVm);
console.log('Fix applied to dart files.');
