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

const String appVersion = '1.2.86';

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

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(lang.get('updateTitle')),
          content: Text(lang.get('updateMessage').replaceAll('{version}', latestVersion)),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(lang.get('laterBtn')),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('已转入后台下载，可在系统通知栏查看进度。下载完成后将自动提示安装。'),
                    duration: Duration(seconds: 4),
                  ),
                );

                const platform = MethodChannel('com.shareclip/system_info');
                try {
                  await platform.invokeMethod('downloadAndInstallApk', {'url': apkUrl});
                } catch (e) {
                  debugPrint('[Update] Error downloading update: $e');
                }
              },
              child: Text(lang.get('updateBtn')),
            ),
          ],
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
