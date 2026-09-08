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

class _QrScannerViewState extends State<QrScannerView> with SingleTickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
    returnImage: false,
  );

  late AnimationController _scanController;
  late Animation<double> _scanAnimation;

  bool _hasDetected = false;
  bool _isTorchOn = false;
  bool _isAnalyzingImage = false;

  @override
  void initState() {
    super.initState();

    _scanController = AnimationController(
      duration: const Duration(milliseconds: 2400),
      vsync: this,
    )..repeat(reverse: true);

    _scanAnimation = CurvedAnimation(
      parent: _scanController,
      curve: Curves.easeInOut,
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
    _scanController.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = Provider.of<LocalizationService>(context);
    final size = MediaQuery.of(context).size;
    final boxSize = math.min(size.width * 0.72, 260.0);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Camera Feed
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
                      const Icon(Icons.camera_alt_outlined, color: Color(0xFFEF4444), size: 48),
                      const SizedBox(height: 12),
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

          // 2. Clean Minimal Viewfinder Overlay
          AnimatedBuilder(
            animation: _scanAnimation,
            builder: (context, child) {
              return CustomPaint(
                painter: MinimalScannerPainter(
                  scanPosition: _scanAnimation.value,
                  boxSize: boxSize,
                  isDetected: _hasDetected,
                ),
                child: const SizedBox.expand(),
              );
            },
          ),

          // 3. Clean Top Navigation Bar
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
                child: Row(
                  children: [
                    // Back Button
                    _buildCircleIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      tooltip: t.get('back'),
                      onTap: _onBack,
                    ),
                    const SizedBox(width: 12),

                    // Title
                    Expanded(
                      child: Text(
                        t.get('scanTitle'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17.0,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),

                    // Flashlight Toggle
                    _buildCircleIconButton(
                      icon: _isTorchOn ? Icons.flashlight_on_rounded : Icons.flashlight_off_rounded,
                      isActive: _isTorchOn,
                      activeColor: const Color(0xFFFBBF24),
                      tooltip: t.get('torch'),
                      onTap: _toggleTorch,
                    ),
                    const SizedBox(width: 10),

                    // Flip Camera Toggle
                    _buildCircleIconButton(
                      icon: Icons.flip_camera_ios_rounded,
                      tooltip: t.get('flip'),
                      onTap: _switchCamera,
                    ),
                    const SizedBox(width: 10),

                    // Gallery Image Pick
                    _buildCircleIconButton(
                      icon: Icons.photo_library_outlined,
                      tooltip: t.get('pickFromGallery'),
                      isLoading: _isAnalyzingImage,
                      onTap: _pickImageFromGallery,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 4. Center Viewfinder Subtitle Guidance & Discovered LAN Devices
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
                          const SizedBox(height: 16),
                        ],

                        // Clean Text Hint
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.45),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                t.get('scanSubTip'),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                t.currentLocale.startsWith('zh')
                                    ? '在电脑端点击「连接手机」获取二维码'
                                    : 'Click "Link Mobile" on PC to display QR code',
                                style: const TextStyle(
                                  color: Colors.white60,
                                  fontSize: 11.5,
                                ),
                              ),
                            ],
                          ),
                        ),
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
  // UI Helpers
  // ───────────────────────────────────────────────────────────────────────────

  Widget _buildCircleIconButton({
    required IconData icon,
    required VoidCallback onTap,
    String? tooltip,
    bool isActive = false,
    Color activeColor = const Color(0xFF38BDF8),
    bool isLoading = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isActive
                ? activeColor.withOpacity(0.2)
                : Colors.black.withOpacity(0.45),
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? activeColor.withOpacity(0.6) : Colors.white.withOpacity(0.15),
              width: 1.0,
            ),
          ),
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Icon(
                    icon,
                    color: isActive ? activeColor : Colors.white,
                    size: 19,
                  ),
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withOpacity(0.12),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${t.get('lanPcFound')} (${syncVm.discoveredPCs.length})',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 52,
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
                        backgroundColor: const Color(0xFF1E293B),
                        content: Text(
                          t.currentLocale.startsWith('zh')
                              ? '正在连接 ${pc["name"]}...'
                              : 'Connecting to ${pc["name"]}...',
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      ),
                    );
                  },
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.15),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.laptop_mac_rounded,
                          color: Color(0xFF94A3B8),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              pc['name'] ?? 'PC',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
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
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            t.get('instantConnect'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
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
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Minimalist Viewfinder Painter
// ─────────────────────────────────────────────────────────────────────────────

class MinimalScannerPainter extends CustomPainter {
  final double scanPosition;
  final double boxSize;
  final bool isDetected;

  MinimalScannerPainter({
    required this.scanPosition,
    required this.boxSize,
    required this.isDetected,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;

    final double left = (width - boxSize) / 2;
    final double top = (height - boxSize) / 2 - 30; // Slightly higher for visual balance
    final double right = left + boxSize;
    final double bottom = top + boxSize;
    final Rect boxRect = Rect.fromLTRB(left, top, right, bottom);
    const double radius = 18.0;

    // 1. Semi-transparent dark mask (Cutout center)
    final Path maskPath = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Rect.fromLTWH(0, 0, width, height))
      ..addRRect(RRect.fromRectAndRadius(boxRect, const Radius.circular(radius)));

    final Paint maskPaint = Paint()..color = const Color(0x80000000);
    canvas.drawPath(maskPath, maskPaint);

    // 2. Subtle frame border
    final Paint borderPaint = Paint()
      ..color = isDetected ? const Color(0xFF10B981) : Colors.white.withOpacity(0.18)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;
    canvas.drawRRect(RRect.fromRectAndRadius(boxRect, const Radius.circular(radius)), borderPaint);

    // 3. Corner Brackets
    final Color cornerColor = isDetected ? const Color(0xFF10B981) : Colors.white;
    final Paint cornerPaint = Paint()
      ..color = cornerColor
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const double cornerLen = 22.0;

    // Top-Left
    final Path tl = Path()
      ..moveTo(left, top + cornerLen)
      ..lineTo(left, top + radius)
      ..arcToPoint(Offset(left + radius, top), radius: const Radius.circular(radius))
      ..lineTo(left + cornerLen, top);
    canvas.drawPath(tl, cornerPaint);

    // Top-Right
    final Path tr = Path()
      ..moveTo(right - cornerLen, top)
      ..lineTo(right - radius, top)
      ..arcToPoint(Offset(right, top + radius), radius: const Radius.circular(radius))
      ..lineTo(right, top + cornerLen);
    canvas.drawPath(tr, cornerPaint);

    // Bottom-Left
    final Path bl = Path()
      ..moveTo(left, bottom - cornerLen)
      ..lineTo(left, bottom - radius)
      ..arcToPoint(Offset(left + radius, bottom), radius: const Radius.circular(radius))
      ..lineTo(left + cornerLen, bottom);
    canvas.drawPath(bl, cornerPaint);

    // Bottom-Right
    final Path br = Path()
      ..moveTo(right - cornerLen, bottom)
      ..lineTo(right - radius, bottom)
      ..arcToPoint(Offset(right, bottom - radius), radius: const Radius.circular(radius))
      ..lineTo(right, bottom - cornerLen);
    canvas.drawPath(br, cornerPaint);

    // 4. Subtle Clean Scan Line
    if (!isDetected) {
      final double scanY = top + (boxSize * scanPosition);
      final Paint scanLinePaint = Paint()
        ..shader = ui.Gradient.linear(
          Offset(left + 16, scanY),
          Offset(right - 16, scanY),
          [
            Colors.transparent,
            const Color(0xFF38BDF8).withOpacity(0.85),
            Colors.transparent,
          ],
        )
        ..strokeWidth = 2.0
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;

      canvas.drawLine(Offset(left + 16, scanY), Offset(right - 16, scanY), scanLinePaint);
    }
  }

  @override
  bool shouldRepaint(covariant MinimalScannerPainter oldDelegate) {
    return oldDelegate.scanPosition != scanPosition ||
        oldDelegate.boxSize != boxSize ||
        oldDelegate.isDetected != isDetected;
  }
}
