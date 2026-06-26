import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../models/qr_payload.dart';

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
    formats: [BarcodeFormat.qrCode],
  );

  late AnimationController _animationController;
  late Animation<double> _laserAnimation;
  bool _hasDetected = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _laserAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. MobileScanner View Camera Feed
          MobileScanner(
            controller: _controller,
            onDetect: (BarcodeCapture capture) {
              if (_hasDetected) return;
              for (final barcode in capture.barcodes) {
                final rawJson = barcode.rawValue;
                if (rawJson != null) {
                  try {
                    final payload = QrPayload.fromJson(rawJson);
                    setState(() {
                      _hasDetected = true;
                    });
                    _controller.stop();
                    widget.onQrScanned(payload);
                    break;
                  } catch (e) {
                    debugPrint("[Scanner] QR parse failure: $e");
                  }
                }
              }
            },
          ),

          // 2. Animated Custom Overlay Viewport
          AnimatedBuilder(
            animation: _laserAnimation,
            builder: (context, child) {
              return CustomPaint(
                painter: ScannerOverlayPainter(
                  laserPosition: _laserAnimation.value,
                  boxSize: 260.0,
                ),
                child: Container(),
              );
            },
          ),

          // 3. Instruction Banner
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.bottomInterval == null
                  ? const EdgeInsets.only(bottom: 80.0)
                  : const EdgeInsets.only(bottom: 80.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                decoration: BoxDecoration(
                  color: const Color(0x990F172A),
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: const Text(
                  "Align the PC QR code inside the frame",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15.0,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    _controller.dispose();
    super.dispose();
  }
}

class ScannerOverlayPainter extends CustomPainter {
  final double laserPosition;
  final double boxSize;

  ScannerOverlayPainter({
    required this.laserPosition,
    required this.boxSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;

    final double left = (width - boxSize) / 2;
    final double top = (height - boxSize) / 2;
    final double right = left + boxSize;
    final double bottom = top + boxSize;

    // 1. Draw transparent viewport cutout on dim background
    final Paint backgroundPaint = Paint()..color = const Color(0x99000000);
    
    // Outer boundaries paths
    final Path backgroundPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, width, height));
    
    // Viewport cutout square path
    final Path cutoutPath = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTRB(left, top, right, bottom),
        const Radius.circular(24.0),
      ));

    // Combine paths by subtracting the cutout
    final Path finalPath = Path.combine(
      PathOperation.difference,
      backgroundPath,
      cutoutPath,
    );

    canvas.drawPath(finalPath, backgroundPaint);

    // 2. Draw stylish neon violet box corners
    final Paint cornerPaint = Paint()
      ..color = const Color(0xFF8B5CF6) // Violet accent
      ..strokeWidth = 4.0
      ..style = PaintingStyle.stroke;

    const double cornerLen = 24.0;

    // Top Left
    canvas.drawLine(Offset(left, top), Offset(left + cornerLen, top), cornerPaint);
    canvas.drawLine(Offset(left, top), Offset(left, top + cornerLen), cornerPaint);

    // Top Right
    canvas.drawLine(Offset(right, top), Offset(right - cornerLen, top), cornerPaint);
    canvas.drawLine(Offset(right, top), Offset(right, top + cornerLen), cornerPaint);

    // Bottom Left
    canvas.drawLine(Offset(left, bottom), Offset(left + cornerLen, bottom), cornerPaint);
    canvas.drawLine(Offset(left, bottom), Offset(left, bottom - cornerLen), cornerPaint);

    // Bottom Right
    canvas.drawLine(Offset(right, bottom), Offset(right - cornerLen, bottom), cornerPaint);
    canvas.drawLine(Offset(right, bottom), Offset(right, bottom - cornerLen), cornerPaint);

    // 3. Draw emerald green scanning laser line
    final Paint laserPaint = Paint()
      ..color = const Color(0xFF10B981) // Emerald laser
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final double laserY = top + (boxSize * laserPosition);
    canvas.drawLine(
      Offset(left + 10.0, laserY),
      Offset(right - 10.0, laserY),
      laserPaint,
    );
  }

  @override
  bool shouldRepaint(covariant ScannerOverlayPainter oldDelegate) {
    return oldDelegate.laserPosition != laserPosition || oldDelegate.boxSize != boxSize;
  }
}
