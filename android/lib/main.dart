import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'viewmodels/sync_viewmodel.dart';
import 'views/qr_scanner_view.dart';
import 'views/transfer_console_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => SyncViewModel(),
      child: const ImageClipApp(),
    ),
  );
}

class ImageClipApp extends StatelessWidget {
  const ImageClipApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CLIP Album Sync',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF090D16), // Slate-950
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF8B5CF6), // Violet-500
          background: Color(0xFF090D16),
          surface: Color(0xFF0F172A), // Slate-900
        ),
        useMaterial3: true,
      ),
      home: const MainRouterScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainRouterScreen extends StatefulWidget {
  const MainRouterScreen({Key? key}) : super(key: key);

  @override
  State<MainRouterScreen> createState() => _MainRouterScreenState();
}

class _MainRouterScreenState extends State<MainRouterScreen> {
  @override
  void initState() {
    super.initState();
    // Prompt permissions check on start
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndRequestPermissions();
    });
  }

  Future<void> _checkAndRequestPermissions() async {
    final viewModel = Provider.of<SyncViewModel>(context, listen: false);

    // Request permissions: Camera, BLE Scan & Connect, location (for older BLE platform APIs)
    final Map<Permission, PermissionStatus> statuses = await [
      Permission.camera,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
    ].request();

    final allGranted = statuses.values.every((status) => status.isGranted);
    
    viewModel.setPermissionsGranted(allGranted);
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<SyncViewModel>(context);
    final appState = viewModel.appState;

    if (!viewModel.permissionsGranted) {
      return _buildPermissionsRequiredScreen();
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: _routeState(appState, viewModel),
    );
  }

  Widget _routeState(AppState appState, SyncViewModel viewModel) {
    switch (appState) {
      case AppState.idle:
        return const Scaffold(
          body: Center(
            child: CircularProgressIndicator(color: Color(0xFF8B5CF6)),
          ),
        );
      case AppState.scanning:
        return QrScannerView(
          onQrScanned: (payload) {
            viewModel.connectToTarget(payload);
          },
        );
      case AppState.connectingBle:
      case AppState.negotiatingMtu:
      case AppState.discoveringGatt:
      case AppState.generatingOffer:
      case AppState.sendingOffer:
      case AppState.waitingForAnswer:
      case AppState.connectingWebRtc:
        return _buildConnectingProgressScreen(appState);
      case AppState.connected:
        return const TransferConsoleView();
      case AppState.failed:
        return _buildConnectionFailedScreen(viewModel);
    }
  }

  Widget _buildPermissionsRequiredScreen() {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text(
              "🔒",
              style: TextStyle(fontSize: 64.0),
            ),
            const SizedBox(height: 16.0),
            const Text(
              "Permissions Required",
              style: TextStyle(
                color: Colors.white,
                fontSize: 22.0,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8.0),
            const Text(
              "Camera, BLE bluetooth access, and location permissions are required to perform BLE scanning and sync photos.",
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 14.0,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24.0),
            ElevatedButton(
              onPressed: _checkAndRequestPermissions,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8B5CF6),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
              ),
              child: const Text("Grand Permissions"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectingProgressScreen(AppState appState) {
    String statusText = "Handshaking...";
    switch (appState) {
      case AppState.connectingBle:
        statusText = "Scanning & Connecting to PC via BLE...";
        break;
      case AppState.negotiatingMtu:
        statusText = "Negotiating BLE transfer properties...";
        break;
      case AppState.discoveringGatt:
        statusText = "Discovering GATT service characteristics...";
        break;
      case AppState.generatingOffer:
        statusText = "Generating WebRTC Offer parameters...";
        break;
      case AppState.sendingOffer:
        statusText = "Uploading local Offer SDP over BLE...";
        break;
      case AppState.waitingForAnswer:
        statusText = "Awaiting remote WebRTC Answer SDP...";
        break;
      case AppState.connectingWebRtc:
        statusText = "Performing WebRTC DTLS/ICE Handshake...";
        break;
      default:
        break;
    }

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Loading circle indicator
              const SizedBox(
                width: 60.0,
                height: 60.0,
                child: CircularProgressIndicator(
                  strokeWidth: 4.0,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF8B5CF6)),
                ),
              ),
              const SizedBox(height: 32.0),
              const Text(
                "Establishing Connection",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8.0),
              Text(
                statusText,
                style: const TextStyle(
                  color: Color(0xFF8B5CF6),
                  fontSize: 13.0,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConnectionFailedScreen(SyncViewModel viewModel) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "⚠️",
              style: TextStyle(fontSize: 56.0),
            ),
            const SizedBox(height: 16.0),
            const Text(
              "Connection Failed",
              style: TextStyle(
                color: Colors.white,
                fontSize: 20.0,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8.0),
            Text(
              viewModel.errorMsg.isNotEmpty ? viewModel.errorMsg : "An unknown connection error occurred",
              style: const TextStyle(
                color: Color(0xFFEF4444),
                fontSize: 13.0,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32.0),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => viewModel.resetToScanner(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14.0),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
                ),
                child: const Text(
                  "Retry QR Scan",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
