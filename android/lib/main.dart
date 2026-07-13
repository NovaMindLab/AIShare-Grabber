import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'viewmodels/sync_viewmodel.dart';
import 'views/qr_scanner_view.dart';
import 'views/transfer_console_view.dart';
import 'services/localization_service.dart';
import 'services/theme_service.dart';

const String appVersion = '1.2.13';

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
      themeMode: themeService.themeMode,
      // Clear Mode (Light)
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF7C3AED), // Violet 600
          background: Color(0xFFF8FAFC),
          surface: Colors.white,
          onBackground: Color(0xFF0F172A),
          onSurface: Color(0xFF1E293B),
        ),
        useMaterial3: true,
        dividerColor: const Color(0xFFE2E8F0),
        cardTheme: const CardThemeData(
          color: Colors.white,
        ),
      ),
      // Dark Mode
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF090D16),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF8B5CF6), // Violet 500
          background: Color(0xFF090D16),
          surface: Color(0xFF0F172A),
          onBackground: Color(0xFFF8FAFC),
          onSurface: Color(0xFFF1F5F9),
        ),
        useMaterial3: true,
        dividerColor: const Color(0xFF1E293B),
        cardTheme: const CardThemeData(
          color: Color(0xFF0F172A),
        ),
      ),
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
          final String htmlUrl = release['html_url'] as String;
          _showUpdateDialog(latestTag, htmlUrl);
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

  void _showUpdateDialog(String latestVersion, String releaseUrl) {
    final lang = Provider.of<LocalizationService>(context, listen: false);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: Text(lang.get('updateTitle')),
          content: Text(lang.get('updateMessage').replaceAll('{version}', latestVersion)),
          actions: [
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
                Navigator.of(context).pop();
                const platform = MethodChannel('com.shareclip/system_info');
                try {
                  await platform.invokeMethod('openUrl', {'url': releaseUrl});
                } catch (e) {
                  debugPrint('[Update] Error opening release URL: $e');
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
        return const Scaffold(
          body: Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6))),
        );
      case AppState.home:
        return _buildHomeScreen(viewModel);
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

  // 🏠 HOME SCREEN — Gallery preview + connect button
  // ─────────────────────────────────────────────────────────────────
  Widget _buildHomeScreen(SyncViewModel viewModel) {
    final t = Provider.of<LocalizationService>(context);
    final themeService = Provider.of<ThemeService>(context);
    final isDark = themeService.isDarkMode;

    final totalCount = viewModel.localImages.length + viewModel.localVideos.length;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Top Header ──
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'S',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ShareCLIP',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onBackground,
                            fontSize: 18,
                            fontWeight: FontWeight.bold),
                      ),
                      const Text(
                        'Multi-device File Sync',
                        style:
                            TextStyle(color: Color(0xFF64748B), fontSize: 11),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Theme Toggle Button
                  IconButton(
                    icon: Icon(
                      isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round_outlined,
                      color: Theme.of(context).colorScheme.onBackground.withOpacity(0.7),
                    ),
                    onPressed: () => themeService.toggleTheme(),
                  ),
                  IconButton(
                    icon: Icon(Icons.language, color: Theme.of(context).colorScheme.onBackground.withOpacity(0.7)),
                    onPressed: () => _showLanguageSelector(context),
                  ),
                  const SizedBox(width: 4),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardTheme.color,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.wifi_off,
                            color: Color(0xFF64748B), size: 12),
                        const SizedBox(width: 5),
                        Text(
                          t.get('disconnected'),
                          style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Connect to PC Button ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: GestureDetector(
                onTap: () => viewModel.startScanning(),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF8B5CF6).withOpacity(0.35),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.qr_code_scanner,
                            color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t.get('linkPc'),
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              t.get('linkPcDesc'),
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios,
                          color: Colors.white54, size: 16),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 28),

            // ── Gallery Section Header ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t.get('localMedia'),
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.onBackground,
                        fontSize: 15,
                        fontWeight: FontWeight.bold),
                  ),
                  Text(
                    totalCount > 0
                        ? '$totalCount ${t.get('items')}'
                        : '',
                    style: const TextStyle(
                        color: Color(0xFF64748B), fontSize: 12),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // ── Gallery Grid (Images first, then Videos) ──
            Expanded(
              child: totalCount == 0
                  ? _buildEmptyGallery()
                  : GridView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 4,
                        mainAxisSpacing: 4,
                      ),
                      itemCount: totalCount,
                      itemBuilder: (context, idx) {
                        final bool isImg = idx < viewModel.localImages.length;
                        final media = isImg 
                            ? viewModel.localImages[idx] 
                            : viewModel.localVideos[idx - viewModel.localImages.length];
                        final isVideo = media.type == AssetType.video;
                        return ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              AssetEntityImage(
                                media,
                                isOriginal: false,
                                thumbnailSize:
                                    const ThumbnailSize.square(180),
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  color: Theme.of(context).dividerColor,
                                  alignment: Alignment.center,
                                  child: Text(
                                    isVideo ? '🎥' : '🖼️',
                                    style:
                                        const TextStyle(fontSize: 22),
                                  ),
                                ),
                              ),
                              if (isVideo)
                                const Positioned(
                                  bottom: 4,
                                  left: 4,
                                  child: Icon(
                                    Icons.play_circle_filled,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyGallery() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.photo_library_outlined,
              color: Theme.of(context).colorScheme.onBackground.withOpacity(0.3), size: 52),
          const SizedBox(height: 12),
          Text(
            'Loading gallery...',
            style: TextStyle(color: Theme.of(context).colorScheme.onBackground.withOpacity(0.5), fontSize: 14),
          ),
        ],
      ),
    );
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

  // ⏳ CONNECTING PROGRESS
  // ─────────────────────────────────────────────────────────────────
  Widget _buildConnectingProgressScreen(
      AppState appState, SyncViewModel viewModel) {
    final t = Provider.of<LocalizationService>(context);
    final isZh = t.currentLocale.startsWith('zh');
    final labels = {
      AppState.connectingBle: isZh ? "正在通过蓝牙搜索并连接电脑..." : "Scanning & Connecting to PC via BLE...",
      AppState.negotiatingMtu: isZh ? "正在协商蓝牙传输属性..." : "Negotiating BLE transfer properties...",
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

  void _showLanguageSelector(BuildContext context) {
    final localizationService = Provider.of<LocalizationService>(context, listen: false);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Theme.of(context).cardTheme.color,
          title: Text(
            localizationService.get('selectLanguage'),
            style: TextStyle(color: Theme.of(context).colorScheme.onBackground),
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView(
              shrinkWrap: true,
              children: LocalizationService.languages.entries.map((entry) {
                return ListTile(
                  title: Text(entry.value, style: TextStyle(color: Theme.of(context).colorScheme.onSurface)),
                  trailing: localizationService.currentLocale == entry.key
                      ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
                      : null,
                  onTap: () {
                    localizationService.setLanguage(entry.key);
                    Navigator.of(context).pop();
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}
