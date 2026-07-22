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
import 'services/localization_service.dart';
import 'services/theme_service.dart';

const String appVersion = '1.2.46';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
            for (var asset in assets) {
              final assetName = asset['name'].toString().toLowerCase();
              if (assetName.endsWith('.apk')) {
                apkUrl = asset['browser_download_url'] as String;
                break;
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
    bool isDownloading = false;
    double progress = 0.0;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text(lang.get('updateTitle')),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(lang.get('updateMessage').replaceAll('{version}', latestVersion)),
                  if (isDownloading) ...[
                    const SizedBox(height: 24),
                    LinearProgressIndicator(
                      value: progress > 0 ? progress : null,
                      backgroundColor: Colors.grey[200],
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF7C3AED)),
                    ),
                    const SizedBox(height: 8),
                    Text('${(progress * 100).toStringAsFixed(1)}%', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ]
                ],
              ),
              actions: isDownloading ? [] : [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(lang.get('laterBtn')),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () async {
                    setState(() {
                      isDownloading = true;
                      progress = 0.0;
                    });
                    const platform = MethodChannel('com.shareclip/system_info');
                    try {
                      await platform.invokeMethod('downloadAndInstallApk', {'url': apkUrl});
                      
                      bool done = false;
                      while (!done && mounted) {
                        await Future.delayed(const Duration(milliseconds: 500));
                        try {
                          final double p = await platform.invokeMethod('getDownloadProgress');
                          if (p >= 1.0 || p < 0) {
                            done = true;
                            if (p >= 1.0) {
                                try {
                                    await platform.invokeMethod('installDownloadedApk');
                                } catch (e) {
                                    debugPrint('[Update] Error invoking install: $e');
                                }
                            }
                            if (mounted && Navigator.canPop(context)) {
                              Navigator.of(context).pop();
                            }
                          } else {
                            setState(() {
                              progress = p;
                            });
                          }
                        } catch (e) {
                          done = true;
                        }
                      }
                    } catch (e) {
                      debugPrint('[Update] Error downloading update: $e');
                      setState(() {
                        isDownloading = false;
                      });
                    }
                  },
                  child: Text(lang.get('updateBtn')),
                ),
              ],
            );
          },
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
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          body: Center(
            child: CircularProgressIndicator(color: Theme.of(context).colorScheme.primary),
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
        return _buildConnectingProgressScreen(appState, viewModel);
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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text("🔒", style: TextStyle(fontSize: 64.0)),
            const SizedBox(height: 16.0),
            Text(
              t.get('permissionTitle'),
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onBackground,
                  fontSize: 22.0,
                  fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8.0),
            Text(
              t.get('permissionDesc'),
              style: TextStyle(color: Theme.of(context).colorScheme.onBackground.withOpacity(0.6), fontSize: 14.0),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24.0),
            ElevatedButton(
              onPressed: _checkAndRequestPermissions,
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0)),
              ),
              child: Text(t.get('grantBtn')),
            ),
          ],
        ),
      ),
    );
  }

  // �?CONNECTING PROGRESS
  // ─────────────────────────────────────────────────────────────────
  Widget _buildConnectingProgressScreen(
      AppState appState, SyncViewModel viewModel) {
    final t = Provider.of<LocalizationService>(context);
    final isZh = t.currentLocale.startsWith('zh');
    final labels = {
      AppState.connectingBle: isZh ? "正在通过蓝牙搜索并连接电�?.." : "Scanning & Connecting to PC via BLE...",
      AppState.negotiatingMtu: isZh ? "正在协商蓝牙传输属�?.." : "Negotiating BLE transfer properties...",
      AppState.discoveringGatt: isZh ? "正在发现GATT特征服务..." : "Discovering GATT service characteristics...",
      AppState.generatingOffer: isZh ? "正在生成WebRTC Offer参数..." : "Generating WebRTC Offer parameters...",
      AppState.sendingOffer: isZh ? "正在通过蓝牙上传Offer SDP..." : "Uploading Offer SDP over BLE...",
      AppState.waitingForAnswer: isZh ? "正在等待电脑端回应Answer SDP..." : "Awaiting remote WebRTC Answer SDP...",
      AppState.connectingWebRtc: isZh ? "正在执行WebRTC直连握手..." : "Performing WebRTC DTLS/ICE Handshake...",
    };
    final statusText = labels[appState] ?? (isZh ? "正在连接..." : "Handshaking...");

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 60.0,
                height: 60.0,
                child: CircularProgressIndicator(
                  strokeWidth: 4.0,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
                ),
              ),
              const SizedBox(height: 32.0),
              Text(
                t.get('connecting'),
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onBackground,
                    fontSize: 18.0,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8.0),
              Text(
                statusText,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextButton(
                onPressed: () => viewModel.returnHome(),
                child: Text(isZh ? "取消" : "Cancel",
                    style: const TextStyle(color: Color(0xFF64748B))),
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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("⚠️", style: TextStyle(fontSize: 56.0)),
            const SizedBox(height: 16.0),
            Text(
              t.get('connFailed'),
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onBackground,
                  fontSize: 20.0,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8.0),
            Text(
              viewModel.errorMsg.isNotEmpty
                  ? viewModel.errorMsg
                  : t.get('connFailedDesc'),
              style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13.0),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32.0),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => viewModel.resetToScanner(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14.0),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8.0)),
                ),
                child: Text(t.get('retry'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => viewModel.returnHome(),
              child: Text(isZh ? "返回主页" : "Back to Home",
                  style: const TextStyle(color: Color(0xFF64748B))),
            ),
          ],
        ),
      ),
    );
  }
}
