import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../models/qr_payload.dart';
import '../services/localization_service.dart';
import '../viewmodels/sync_viewmodel.dart';

class QrScannerView extends StatefulWidget {
  final void Function(QrPayload payload) onQrScanned;

  const QrScannerView({
    Key? key,
    required this.onQrScanned,
  }) : super(key: key);

  @override
  State<QrScannerView> createState() => _QrScannerViewState();
}

class _QrScannerViewState extends State<QrScannerView> with TickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
    returnImage: false,
  );

  late AnimationController _laserController;
  late Animation<double> _laserAnimation;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  bool _hasDetected = false;
  bool _isTorchOn = false;
  bool _isAnalyzingImage = false;

  @override
  void initState() {
    super.initState();

    // 1. Smooth laser scanning animation (up and down sweep)
    _laserController = AnimationController(
      duration: const Duration(milliseconds: 2200),
      vsync: this,
    )..repeat(reverse: true);

    _laserAnimation = CurvedAnimation(
      parent: _laserController,
      curve: Curves.easeInOutSine,
    );

    // 2. Subtle breathing pulse for scanner frame and reticle
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  void _onDetectBarcode(BarcodeCapture capture) {
    if (_hasDetected) return;

    for (final barcode in capture.barcodes) {
      final rawVal = barcode.rawValue;
      if (rawVal != null && rawVal.isNotEmpty) {
        _processRawQrString(rawVal);
        break;
      }
    }
  }

  void _processRawQrString(String rawJson) {
    if (_hasDetected) return;

    try {
      final payload = QrPayload.fromJson(rawJson);
      HapticFeedback.mediumImpact();
      setState(() {
        _hasDetected = true;
      });
      widget.onQrScanned(payload);
    } catch (e) {
      debugPrint("[Scanner] QR parse failure: $e");
    }
  }

  Future<void> _toggleTorch() async {
    try {
      await _controller.toggleTorch();
      setState(() {
        _isTorchOn = !_isTorchOn;
      });
      HapticFeedback.selectionClick();
    } catch (e) {
      debugPrint("[Scanner] Failed to toggle torch: $e");
    }
  }

  Future<void> _switchCamera() async {
    try {
      await _controller.switchCamera();
      HapticFeedback.selectionClick();
    } catch (e) {
      debugPrint("[Scanner] Failed to switch camera: $e");
    }
  }

  Future<void> _pickImageFromGallery() async {
    if (_isAnalyzingImage || _hasDetected) return;

    final t = Provider.of<LocalizationService>(context, listen: false);

    try {
      final result = await FilePicker.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final filePath = result.files.single.path;
        if (filePath != null && filePath.isNotEmpty) {
          setState(() {
            _isAnalyzingImage = true;
          });

          final capture = await _controller.analyzeImage(filePath);
          setState(() {
            _isAnalyzingImage = false;
          });

          if (capture != null && capture.barcodes.isNotEmpty) {
            final raw = capture.barcodes.first.rawValue;
            if (raw != null && raw.isNotEmpty) {
              _processRawQrString(raw);
              return;
            }
          }

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                behavior: SnackBarBehavior.floating,
                backgroundColor: const Color(0xFF1E293B),
                content: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Color(0xFFF59E0B), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        t.get('qrNotFound'),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
        }
      }
    } catch (e) {
      setState(() {
        _isAnalyzingImage = false;
      });
      debugPrint("[Scanner] Error picking QR image: $e");
    }
  }

  void _onBack() {
    Provider.of<SyncViewModel>(context, listen: false).returnHome();
  }

  @override
  void dispose() {
    _laserController.dispose();
    _pulseController.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = Provider.of<LocalizationService>(context);
    final size = MediaQuery.of(context).size;
    final boxSize = math.min(size.width * 0.72, 280.0);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Camera Video Feed
          MobileScanner(
            controller: _controller,
            onDetect: _onDetectBarcode,
            errorBuilder: (context, error) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.camera_alt_outlined, color: Color(0xFFEF4444), size: 52),
                      const SizedBox(height: 14),
                      Text(
                        error.errorCode == MobileScannerErrorCode.permissionDenied
                            ? t.get('cameraPermRequired')
                            : t.get('cameraInitFailed').replaceAll('{error}', error.errorCode.name),
                        style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // 2. Holographic Cyber Scanner Overlay Viewport
          AnimatedBuilder(
            animation: Listenable.merge([_laserAnimation, _pulseAnimation]),
            builder: (context, child) {
              return CustomPaint(
                painter: HolographicScannerPainter(
                  laserPosition: _laserAnimation.value,
                  pulseRatio: _pulseAnimation.value,
                  boxSize: boxSize,
                  isDetected: _hasDetected,
                ),
                child: const SizedBox.expand(),
              );
            },
          ),

          // 3. Top Frosted Glass Navigation Bar
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Row(
                  children: [
                    // Back Button (Frosted Glass Pill)
                    _buildFrostedButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      tooltip: t.get('back'),
                      onTap: _onBack,
                    ),
                    const SizedBox(width: 12),

                    // Title & P2P Status Pill
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t.get('scanTitle'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 17.0,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF06B6D4),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Color(0xFF06B6D4),
                                      blurRadius: 6,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'P2P Direct Sync',
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 11.0,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Flashlight Toggle
                    _buildFrostedButton(
                      icon: _isTorchOn ? Icons.flashlight_on_rounded : Icons.flashlight_off_rounded,
                      isActive: _isTorchOn,
                      activeColor: const Color(0xFFF59E0B),
                      tooltip: t.get('torch'),
                      onTap: _toggleTorch,
                    ),
                    const SizedBox(width: 8),

                    // Flip Camera Toggle
                    _buildFrostedButton(
                      icon: Icons.flip_camera_ios_rounded,
                      tooltip: t.get('flip'),
                      onTap: _switchCamera,
                    ),
                    const SizedBox(width: 8),

                    // Gallery Image Pick
                    _buildFrostedButton(
                      icon: Icons.photo_library_rounded,
                      tooltip: t.get('pickFromGallery'),
                      isLoading: _isAnalyzingImage,
                      onTap: _pickImageFromGallery,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 4. Center Viewfinder Crosshair Accents
          Center(
            child: SizedBox(
              width: boxSize,
              height: boxSize,
              child: Stack(
                children: [
                  // Center Crosshair Icon
                  Center(
                    child: Opacity(
                      opacity: 0.25,
                      child: Icon(
                        Icons.add_rounded,
                        color: _hasDetected ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
                        size: 32,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 5. Bottom Instructions & Discovered LAN Devices Panel
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                child: Consumer<SyncViewModel>(
                  builder: (context, syncVm, child) {
                    return Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Discovered LAN PCs Card
                        if (syncVm.discoveredPCs.isNotEmpty) ...[
                          _buildDiscoveredPcsCard(context, syncVm, t),
                          const SizedBox(height: 14),
                        ],

                        // Scanner Guidance Capsule
                        _buildGuidanceCard(t),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UI Component Builders
  // ───────────────────────────────────────────────────────────────────────────

  Widget _buildFrostedButton({
    required IconData icon,
    required VoidCallback onTap,
    String? tooltip,
    bool isActive = false,
    Color activeColor = const Color(0xFF8B5CF6),
    bool isLoading = false,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(14),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isActive
                    ? activeColor.withOpacity(0.25)
                    : const Color(0xFF0F172A).withOpacity(0.65),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isActive
                      ? activeColor.withOpacity(0.8)
                      : Colors.white.withOpacity(0.18),
                  width: isActive ? 1.5 : 1.0,
                ),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: activeColor.withOpacity(0.4),
                          blurRadius: 12,
                          spreadRadius: 1,
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Center(
                child: isLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Icon(
                        icon,
                        color: isActive ? activeColor : Colors.white,
                        size: 20,
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGuidanceCard(LocalizationService t) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF090D16).withOpacity(0.72),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: Colors.white.withOpacity(0.15),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF06B6D4), Color(0xFF6366F1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF06B6D4).withOpacity(0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.qr_code_scanner_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      t.get('scanSubTip'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      t.currentLocale.startsWith('zh')
                          ? '在电脑端点击『连接手机』获取二维码'
                          : 'Click "Link Mobile" on PC to display QR code',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11.0,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDiscoveredPcsCard(
    BuildContext context,
    SyncViewModel syncVm,
    LocalizationService t,
  ) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF0F172A).withOpacity(0.85),
                const Color(0xFF1E1B4B).withOpacity(0.80),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: const Color(0xFF8B5CF6).withOpacity(0.4),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF8B5CF6).withOpacity(0.2),
                blurRadius: 18,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header title with pulsing radar dot
              Row(
                children: [
                  // Animated Pulsing Radar Dot
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0xFF10B981),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${t.get('lanPcFound')} (${syncVm.discoveredPCs.length})',
                    style: const TextStyle(
                      color: Color(0xFFF1F5F9),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Device Horizontal Carousel
              SizedBox(
                height: 64,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: syncVm.discoveredPCs.length,
                  itemBuilder: (context, index) {
                    final pc = syncVm.discoveredPCs[index];
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        syncVm.connectToPC(pc['ip'], pc['name']);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            behavior: SnackBarBehavior.floating,
                            backgroundColor: const Color(0xFF0F172A),
                            content: Text(
                              t.currentLocale.startsWith('zh')
                                  ? '正在发起与 ${pc["name"]} 的直连握手...'
                                  : 'Connecting to ${pc["name"]}...',
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                            ),
                          ),
                        );
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFF818CF8).withOpacity(0.35),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: const Color(0xFF6366F1).withOpacity(0.25),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.computer_rounded,
                                color: Color(0xFFA5B4FC),
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  pc['name'] ?? 'PC',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  pc['ip'] ?? '',
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                                ),
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF6366F1).withOpacity(0.4),
                                    blurRadius: 6,
                                  ),
                                ],
                              ),
                              child: Text(
                                t.get('instantConnect'),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Holographic Custom Painter
// ─────────────────────────────────────────────────────────────────────────────

class HolographicScannerPainter extends CustomPainter {
  final double laserPosition;
  final double pulseRatio;
  final double boxSize;
  final bool isDetected;

  HolographicScannerPainter({
    required this.laserPosition,
    required this.pulseRatio,
    required this.boxSize,
    required this.isDetected,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;

    final double left = (width - boxSize) / 2;
    final double top = (height - boxSize) / 2 - 20; // Slightly higher for visual balance
    final double right = left + boxSize;
    final double bottom = top + boxSize;
    final Rect boxRect = Rect.fromLTRB(left, top, right, bottom);
    const double radius = 26.0;

    // 1. Draw Viewport Mask (Dark frosted outer backdrop via EvenOdd Fill)
    final Path maskPath = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Rect.fromLTWH(0, 0, width, height))
      ..addRRect(RRect.fromRectAndRadius(boxRect, const Radius.circular(radius)));

    final Paint maskPaint = Paint()..color = const Color(0xB8050811);
    canvas.drawPath(maskPath, maskPaint);

    // 2. Draw Subtle Viewport Ambient Glow Outline
    final Paint ambientBorderPaint = Paint()
      ..color = isDetected
          ? const Color(0xFF10B981).withOpacity(0.9)
          : const Color(0xFF6366F1).withOpacity(0.25 * pulseRatio)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    canvas.drawRRect(
      RRect.fromRectAndRadius(boxRect, const Radius.circular(radius)),
      ambientBorderPaint,
    );

    // 3. Draw Holographic Laser Sweep Beam & Trailing Gradient Aura
    if (!isDetected) {
      final double laserY = top + (boxSize * laserPosition);
      final double auraHeight = 46.0;

      // Laser Trailing Aura Gradient
      final Rect auraRect = Rect.fromLTRB(left + 8, laserY - auraHeight, right - 8, laserY + 4);
      final Paint auraPaint = Paint()
        ..shader = ui.Gradient.linear(
          Offset(left, laserY - auraHeight),
          Offset(left, laserY),
          [
            const Color(0xFF06B6D4).withOpacity(0.0),
            const Color(0xFF06B6D4).withOpacity(0.12),
            const Color(0xFF38BDF8).withOpacity(0.35),
          ],
        );
      canvas.drawRect(auraRect, auraPaint);

      // Core Laser Line (Cyan -> Sky Blue -> Violet Gradient)
      final Paint laserCorePaint = Paint()
        ..shader = ui.Gradient.linear(
          Offset(left, laserY),
          Offset(right, laserY),
          [
            const Color(0xFF06B6D4).withOpacity(0.1),
            const Color(0xFF38BDF8),
            const Color(0xFFA855F7),
            const Color(0xFF06B6D4).withOpacity(0.1),
          ],
        )
        ..strokeWidth = 2.8
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;

      canvas.drawLine(Offset(left + 12, laserY), Offset(right - 12, laserY), laserCorePaint);

      // Laser End Glowing Micro-Dots
      final Paint dotPaint = Paint()..color = const Color(0xFF38BDF8);
      canvas.drawCircle(Offset(left + 14, laserY), 2.5, dotPaint);
      canvas.drawCircle(Offset(right - 14, laserY), 2.5, dotPaint);
    }

    // 4. Draw Precision Rounded Corner Brackets (Cyber Holographic)
    final Color cornerPrimary = isDetected ? const Color(0xFF10B981) : const Color(0xFF38BDF8);
    final Color cornerSecondary = isDetected ? const Color(0xFF34D399) : const Color(0xFFA855F7);

    final Paint cornerPaint = Paint()
      ..shader = ui.Gradient.linear(
        Offset(left, top),
        Offset(right, bottom),
        [cornerPrimary, cornerSecondary],
      )
      ..strokeWidth = 4.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const double cornerLen = 32.0;

    // Top-Left Corner
    final Path tlPath = Path()
      ..moveTo(left, top + cornerLen)
      ..lineTo(left, top + radius)
      ..arcToPoint(Offset(left + radius, top), radius: const Radius.circular(radius))
      ..lineTo(left + cornerLen, top);
    canvas.drawPath(tlPath, cornerPaint);

    // Top-Right Corner
    final Path trPath = Path()
      ..moveTo(right - cornerLen, top)
      ..lineTo(right - radius, top)
      ..arcToPoint(Offset(right, top + radius), radius: const Radius.circular(radius))
      ..lineTo(right, top + cornerLen);
    canvas.drawPath(trPath, cornerPaint);

    // Bottom-Left Corner
    final Path blPath = Path()
      ..moveTo(left, bottom - cornerLen)
      ..lineTo(left, bottom - radius)
      ..arcToPoint(Offset(left + radius, bottom), radius: const Radius.circular(radius))
      ..lineTo(left + cornerLen, bottom);
    canvas.drawPath(blPath, cornerPaint);

    // Bottom-Right Corner
    final Path brPath = Path()
      ..moveTo(right - cornerLen, bottom)
      ..lineTo(right - radius, bottom)
      ..arcToPoint(Offset(right, bottom - radius), radius: const Radius.circular(radius))
      ..lineTo(right, bottom - cornerLen);
    canvas.drawPath(brPath, cornerPaint);
  }

  @override
  bool shouldRepaint(covariant HolographicScannerPainter oldDelegate) {
    return oldDelegate.laserPosition != laserPosition ||
        oldDelegate.pulseRatio != pulseRatio ||
        oldDelegate.boxSize != boxSize ||
        oldDelegate.isDetected != isDetected;
  }
}
