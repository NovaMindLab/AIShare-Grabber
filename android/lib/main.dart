import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'viewmodels/sync_viewmodel.dart';
import 'views/qr_scanner_view.dart';
import 'views/transfer_console_view.dart';
import 'views/home_view.dart';
import 'views/connecting_view.dart';
import 'services/localization_service.dart';
import 'services/theme_service.dart';
import 'services/analytics_service.dart';

const String appVersion = '1.2.93';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AnalyticsService.init();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SyncViewModel()),
        ChangeNotifierProvider(create: (_) => LocalizationService()),
        ChangeNotifierProvider(create: (_) => ThemeService()),
      ],
      child: const ImageClipApp(),
    ),
  );
}

class ImageClipApp extends StatelessWidget {
  const ImageClipApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeService = Provider.of<ThemeService>(context);
    return MaterialApp(
      title: 'ShareCLIP Sync',
      theme: themeService.themeData,
      home: const MainRouterScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
class MainRouterScreen extends StatefulWidget {
  const MainRouterScreen({Key? key}) : super(key: key);

  @override
  State<MainRouterScreen> createState() => _MainRouterScreenState();
}

class _MainRouterScreenState extends State<MainRouterScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndRequestPermissions();
    });
  }

  Future<void> _checkAndRequestPermissions() async {
    final viewModel = Provider.of<SyncViewModel>(context, listen: false);

    // Stage 1: BLE + Camera + Location
    final Map<Permission, PermissionStatus> bleStatuses = await [
      Permission.camera,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
    ].request();

    // Stage 2: Media (Android 13+ granular + legacy fallback)
    final Map<Permission, PermissionStatus> mediaStatuses = await [
      Permission.photos,
      Permission.videos,
      Permission.audio,
      Permission.storage,
      Permission.accessMediaLocation,
    ].request();

    final allBleGranted = bleStatuses.values.every((s) => s.isGranted);
    final mediaGranted = (mediaStatuses[Permission.photos]?.isGranted == true ||
        mediaStatuses[Permission.storage]?.isGranted == true);

    debugPrint('[Permissions] BLE: $allBleGranted | Media: $mediaGranted');
    viewModel.setPermissionsGranted(allBleGranted);

    if (mediaGranted) {
      viewModel.loadGalleryEarly();
    }

    // Check for app updates in the background
    _checkUpdate();
  }

  Future<void> _checkUpdate() async {
    try {
      final client = HttpClient();
      client.userAgent = 'ShareCLIP-Android-App';
      final request = await client.getUrl(Uri.parse('https://api.github.com/repos/NovaMindLab/AIShare-Grabber/releases/latest'));
      final response = await request.close();
      if (response.statusCode == 200) {
        final jsonString = await response.transform(utf8.decoder).join();
        final Map<String, dynamic> release = json.decode(jsonString) as Map<String, dynamic>;
        final String latestTag = release['tag_name'] as String;
        
        if (_isNewVersionAvailable(appVersion, latestTag)) {
          String apkUrl = '';
          if (release['assets'] != null) {
            final assets = release['assets'] as List;
            final cleanTag = latestTag.replaceAll('v', '').trim();
            // 1. Prefer exact version match APK
            for (var asset in assets) {
              final assetName = asset['name'].toString().toLowerCase();
              if (assetName.endsWith('.apk') && assetName.contains(cleanTag.toLowerCase())) {
                apkUrl = asset['browser_download_url'] as String;
                break;
              }
            }
            // 2. Fallback to any APK if exact tag match not found
            if (apkUrl.isEmpty) {
              for (var asset in assets) {
                final assetName = asset['name'].toString().toLowerCase();
                if (assetName.endsWith('.apk')) {
                  apkUrl = asset['browser_download_url'] as String;
                  break;
                }
              }
            }
          }
          if (apkUrl.isNotEmpty && mounted) {
            debugPrint('[Update] Found new APK: $apkUrl');
            _showUpdateDialog(latestTag, apkUrl);
          }
        }
      }
    } catch (e) {
      debugPrint('[Update] Error checking updates: $e');
    }
  }

  bool _isNewVersionAvailable(String current, String latest) {
    final cleanCurrent = current.replaceAll('v', '').split('+')[0];
    final cleanLatest = latest.replaceAll('v', '').split('+')[0];
    
    final currentParts = cleanCurrent.split('.').map(int.tryParse).toList();
    final latestParts = cleanLatest.split('.').map(int.tryParse).toList();
    
    for (var i = 0; i < 3; i++) {
      final currentVal = (i < currentParts.length) ? (currentParts[i] ?? 0) : 0;
      final latestVal = (i < latestParts.length) ? (latestParts[i] ?? 0) : 0;
      if (latestVal > currentVal) return true;
      if (currentVal > latestVal) return false;
    }
    return false;
  }

  void _showUpdateDialog(String latestVersion, String apkUrl) {
    final lang = Provider.of<LocalizationService>(context, listen: false);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(lang.get('updateTitle')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(lang.get('updateMessage').replaceAll('{version}', latestVersion)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  '💡 支持应用内高速直连下载与自动安装，或使用外部浏览器下载。',
                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(lang.get('laterBtn')),
            ),
            OutlinedButton.icon(
              icon: const Icon(Icons.open_in_browser, size: 16),
              label: const Text('浏览器下载'),
              onPressed: () {
                Navigator.of(dialogContext).pop();
                const platform = MethodChannel('com.shareclip/system_info');
                platform.invokeMethod('openUrl', {'url': apkUrl});
              },
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.download, size: 16),
              label: Text(lang.get('updateBtn')),
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _startInAppDownload(latestVersion, apkUrl);
              },
            ),
          ],
        );
      },
    );
  }

  void _startInAppDownload(String latestVersion, String apkUrl) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (downloadContext) {
        return _DownloadProgressDialog(
          latestVersion: latestVersion,
          apkUrl: apkUrl,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<SyncViewModel>(context);
    final appState = viewModel.appState;

    if (!viewModel.permissionsGranted) {
      return _buildPermissionsRequiredScreen();
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      transitionBuilder: (child, animation) =>
          FadeTransition(opacity: animation, child: child),
      child: KeyedSubtree(
        key: ValueKey(appState),
        child: _routeState(appState, viewModel),
      ),
    );
  }

  Widget _routeState(AppState appState, SyncViewModel viewModel) {
    switch (appState) {
      case AppState.idle:
        return Scaffold(
          backgroundColor: const Color(0xFF070A12),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6366F1).withOpacity(0.4),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    'S',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF8B5CF6)),
                  ),
                ),
              ],
            ),
          ),
        );
      case AppState.home:
        return const HomeView();
      case AppState.scanning:
        return QrScannerView(
          onQrScanned: (payload) => viewModel.connectToTarget(payload),
        );
      case AppState.connectingBle:
      case AppState.negotiatingMtu:
      case AppState.discoveringGatt:
      case AppState.generatingOffer:
      case AppState.sendingOffer:
      case AppState.waitingForAnswer:
      case AppState.connectingWebRtc:
        return ConnectingView(appState: appState, viewModel: viewModel);
      case AppState.connected:
        return const TransferConsoleView();
      case AppState.failed:
        return _buildConnectionFailedScreen(viewModel);
    }
  }

  // 🔒 PERMISSIONS REQUIRED
  // ─────────────────────────────────────────────────────────────────
  Widget _buildPermissionsRequiredScreen() {
    final t = Provider.of<LocalizationService>(context);
    return Scaffold(
      backgroundColor: const Color(0xFF070A12),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.3)),
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.shield_outlined, color: Color(0xFF818CF8), size: 40),
              ),
              const SizedBox(height: 24.0),
              Text(
                t.get('permissionTitle'),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22.0,
                    fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12.0),
              Text(
                t.get('permissionDesc'),
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.0, height: 1.5),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32.0),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _checkAndRequestPermissions,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.0)),
                    elevation: 0,
                  ),
                  child: Text(t.get('grantBtn'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ⚠️ CONNECTION FAILED
  // ─────────────────────────────────────────────────────────────────
  Widget _buildConnectionFailedScreen(SyncViewModel viewModel) {
    final t = Provider.of<LocalizationService>(context);
    final isZh = t.currentLocale.startsWith('zh');
    return Scaffold(
      backgroundColor: const Color(0xFF070A12),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.12),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.link_off_rounded, color: Color(0xFFF87171), size: 40),
              ),
              const SizedBox(height: 24.0),
              Text(
                t.get('connFailed'),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20.0,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10.0),
              Text(
                viewModel.errorMsg.isNotEmpty
                    ? viewModel.errorMsg
                    : t.get('connFailedDesc'),
                style: const TextStyle(color: Color(0xFFF87171), fontSize: 13.0, height: 1.4),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36.0),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => viewModel.resetToScanner(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14.0),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.0)),
                    elevation: 0,
                  ),
                  child: Text(t.get('retry'),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 14),
              TextButton(
                onPressed: () => viewModel.returnHome(),
                child: Text(isZh ? "返回主页" : "Back to Home",
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DownloadProgressDialog extends StatefulWidget {
  final String latestVersion;
  final String apkUrl;

  const _DownloadProgressDialog({
    required this.latestVersion,
    required this.apkUrl,
  });

  @override
  State<_DownloadProgressDialog> createState() => _DownloadProgressDialogState();
}

class _DownloadProgressDialogState extends State<_DownloadProgressDialog> {
  double _progress = 0.0;
  String _statusText = '正在连接下载服务器...';
  int _downloaded = 0;
  int _total = 0;
  bool _isFailed = false;
  String _errorMessage = '';
  HttpClient? _client;

  @override
  void initState() {
    super.initState();
    _startDownload();
  }

  @override
  void dispose() {
    _client?.close(force: true);
    super.dispose();
  }

  Future<void> _startDownload() async {
    setState(() {
      _progress = 0.0;
      _isFailed = false;
      _statusText = '准备下载安装包...';
    });

    try {
      const platform = MethodChannel('com.shareclip/system_info');
      final cacheDirPath = await platform.invokeMethod<String>('getAppCacheDir') ?? '';
      if (cacheDirPath.isEmpty) {
        throw Exception('无法获取应用存储目录');
      }

      final targetFile = File('$cacheDirPath/ShareCLIP_Update.apk');
      if (await targetFile.exists()) {
        await targetFile.delete();
      }

      // Download candidates: high-speed mirrors first, then direct GitHub URL
      final candidateUrls = [
        'https://ghfast.top/${widget.apkUrl}',
        'https://ghproxy.net/${widget.apkUrl}',
        widget.apkUrl,
      ];

      bool success = false;
      for (final url in candidateUrls) {
        try {
          if (!mounted) return;
          setState(() {
            _statusText = '正在建立高速直连通道...';
          });

          _client = HttpClient();
          _client!.badCertificateCallback = (cert, host, port) => true;
          _client!.connectionTimeout = const Duration(seconds: 15);

          final request = await _client!.getUrl(Uri.parse(url));
          request.followRedirects = true;
          request.maxRedirects = 5;

          final response = await request.close();
          if (response.statusCode != 200) {
            continue;
          }

          final contentLength = response.contentLength;
          _total = contentLength > 0 ? contentLength : 70 * 1024 * 1024;
          _downloaded = 0;

          final sink = targetFile.openWrite();
          await for (final chunk in response) {
            sink.add(chunk);
            _downloaded += chunk.length;
            if (mounted) {
              setState(() {
                _progress = (_downloaded / _total).clamp(0.0, 1.0);
                final mbDownloaded = (_downloaded / 1024 / 1024).toStringAsFixed(1);
                final mbTotal = (_total / 1024 / 1024).toStringAsFixed(1);
                _statusText = '正在下载: $mbDownloaded MB / $mbTotal MB (${(_progress * 100).toInt()}%)';
              });
            }
          }
          await sink.flush();
          await sink.close();

          // Verify magic bytes (0x50, 0x4B, 0x03, 0x04) and size
          final fileSize = await targetFile.length();
          if (fileSize > 5 * 1024 * 1024) {
            final header = await targetFile.openRead(0, 4).first;
            if (header.length >= 4 &&
                header[0] == 0x50 &&
                header[1] == 0x4B &&
                header[2] == 0x03 &&
                header[3] == 0x04) {
              success = true;
              break;
            }
          }
          if (await targetFile.exists()) {
            await targetFile.delete();
          }
        } catch (e) {
          debugPrint('[Download] Mirror $url failed: $e');
        }
      }

      if (success) {
        if (!mounted) return;
        setState(() {
          _progress = 1.0;
          _statusText = '下载完成，正在启动安装...';
        });

        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) {
          Navigator.of(context).pop();
        }
        await platform.invokeMethod('installApk', {'path': targetFile.path});
      } else {
        throw Exception('所有下载镜像均未成功，请使用浏览器下载');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isFailed = true;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_isFailed ? '⚠️ 下载未完成' : '🚀 正在高速下载 ShareCLIP ${widget.latestVersion}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!_isFailed) ...[
            Text(
              _statusText,
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: _progress > 0 ? _progress : null,
                minHeight: 10,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF7C3AED)),
              ),
            ),
          ] else ...[
            Text(
              _errorMessage,
              style: const TextStyle(fontSize: 13, color: Colors.redAccent),
            ),
            const SizedBox(height: 10),
            const Text(
              '建议使用手机自带浏览器直接下载安装包。',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ],
        ],
      ),
      actions: [
        if (_isFailed) ...[
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.language, size: 16),
            label: const Text('使用手机浏览器下载'),
            onPressed: () {
              Navigator.of(context).pop();
              const platform = MethodChannel('com.shareclip/system_info');
              platform.invokeMethod('openUrl', {'url': widget.apkUrl});
            },
          ),
        ] else ...[
          TextButton(
            onPressed: () {
              _client?.close(force: true);
              Navigator.of(context).pop();
            },
            child: const Text('取消'),
          ),
        ],
      ],
    );
  }
}
