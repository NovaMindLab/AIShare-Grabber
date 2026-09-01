import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/sync_viewmodel.dart';
import '../services/localization_service.dart';

class ConnectingView extends StatefulWidget {
  final AppState appState;
  final SyncViewModel viewModel;

  const ConnectingView({
    Key? key,
    required this.appState,
    required this.viewModel,
  }) : super(key: key);

  @override
  State<ConnectingView> createState() => _ConnectingViewState();
}

class _ConnectingViewState extends State<ConnectingView>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  late AnimationController _beamController;
  late Animation<double> _beamAnimation;

  late AnimationController _rotateController;

  @override
  void initState() {
    super.initState();
    // 1. Breathing pulse animation for device halos
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.92, end: 1.06).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // 2. Continuous energy beam flow animation
    _beamController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
    _beamAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _beamController, curve: Curves.linear),
    );

    // 3. Rotating orbit animation
    _rotateController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _beamController.dispose();
    _rotateController.dispose();
    super.dispose();
  }

  int _getStepIndex(AppState state) {
    switch (state) {
      case AppState.connectingBle:
      case AppState.negotiatingMtu:
      case AppState.discoveringGatt:
        return 0; // Discovery & Pairing
      case AppState.generatingOffer:
      case AppState.sendingOffer:
      case AppState.waitingForAnswer:
        return 1; // Signaling Handshake
      case AppState.connectingWebRtc:
      case AppState.connected:
        return 2; // P2P Direct
      default:
        return 0;
    }
  }

  String _getStatusText(AppState state, LocalizationService t) {
    switch (state) {
      case AppState.connectingBle:
        return t.get('statusDiscovering');
      case AppState.negotiatingMtu:
        return t.get('statusMtu');
      case AppState.discoveringGatt:
        return t.get('statusGatt');
      case AppState.generatingOffer:
        return t.get('statusCrypto');
      case AppState.sendingOffer:
        return t.get('statusOffer');
      case AppState.waitingForAnswer:
        return t.get('statusAnswer');
      case AppState.connectingWebRtc:
        return t.get('statusTunnel');
      default:
        return t.get('statusPreparing');
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Provider.of<LocalizationService>(context);
    final stepIdx = _getStepIndex(widget.appState);
    final statusText = _getStatusText(widget.appState, t);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          color: Color(0xFF070A12),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF6366F1),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            t.get('secureP2p'),
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 1),

              // Visual Device-to-Device Radar Energy Beam
              _buildDeviceBridgeVisual(stepIdx, t),

              const SizedBox(height: 36),

              // Step Progression Dots / Stepper
              _buildStepIndicator(stepIdx, t),

              const Spacer(flex: 1),

              // Glassmorphism Status Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B).withOpacity(0.45),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF8B5CF6).withOpacity(0.25),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6366F1).withOpacity(0.12),
                            blurRadius: 30,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Animated Shimmer Gradient Progress Bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: SizedBox(
                              height: 4,
                              width: double.infinity,
                              child: AnimatedBuilder(
                                animation: _beamAnimation,
                                builder: (context, child) {
                                  return LinearProgressIndicator(
                                    backgroundColor: Colors.white.withOpacity(0.08),
                                    valueColor: const AlwaysStoppedAnimation<Color>(
                                      Color(0xFF8B5CF6),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),

                          const SizedBox(height: 18),

                          Text(
                            t.get('connecting'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.3,
                            ),
                          ),

                          const SizedBox(height: 8),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF38BDF8),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  statusText,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w400,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 28),

              // Cancel Button
              GestureDetector(
                onTap: () => widget.viewModel.returnHome(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withOpacity(0.12)),
                  ),
                  child: Text(
                    t.get('cancel'),
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),

              const Spacer(flex: 1),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDeviceBridgeVisual(int stepIdx, LocalizationService t) {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return SizedBox(
          width: 320,
          height: 140,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Connection Wave & Beam Line in the middle
              Positioned(
                left: 65,
                right: 65,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Base Line
                    Container(
                      height: 2,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFF6366F1).withOpacity(0.3),
                            const Color(0xFFA855F7).withOpacity(0.8),
                            const Color(0xFF6366F1).withOpacity(0.3),
                          ],
                        ),
                      ),
                    ),

                    // Flying Energy Pulses
                    AnimatedBuilder(
                      animation: _beamAnimation,
                      builder: (context, child) {
                        return Transform.translate(
                          offset: Offset((_beamAnimation.value - 0.5) * 120, 0),
                          child: Container(
                            width: 36,
                            height: 4,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(2),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF38BDF8).withOpacity(0.9),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ],
                              gradient: const LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Color(0xFF38BDF8),
                                  Colors.white,
                                  Color(0xFF38BDF8),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    // Lightning / Sync Icon in the center with orbit ring
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        AnimatedBuilder(
                          animation: _rotateController,
                          builder: (context, child) {
                            return Transform.rotate(
                              angle: _rotateController.value * 2 * math.pi,
                              child: Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: const Color(0xFF8B5CF6).withOpacity(0.4),
                                    width: 1.5,
                                    style: BorderStyle.solid,
                                  ),
                                ),
                                child: Align(
                                  alignment: Alignment.topCenter,
                                  child: Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF38BDF8),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Color(0xFF38BDF8),
                                          blurRadius: 6,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF0F172A),
                            border: Border.all(
                              color: const Color(0xFF8B5CF6),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF8B5CF6).withOpacity(0.5),
                                blurRadius: 16,
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.bolt_rounded,
                            color: Color(0xFFFACC15),
                            size: 24,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Left Device: Mobile Phone
              Positioned(
                left: 10,
                child: Transform.scale(
                  scale: _pulseAnimation.value,
                  child: _buildDeviceNode(
                    icon: Icons.phone_android_rounded,
                    title: "Mobile",
                    isGlowing: true,
                    gradientColors: [const Color(0xFF6366F1), const Color(0xFF818CF8)],
                  ),
                ),
              ),

              // Right Device: PC Computer
              Positioned(
                right: 10,
                child: Transform.scale(
                  scale: _pulseAnimation.value,
                  child: _buildDeviceNode(
                    icon: Icons.desktop_windows_rounded,
                    title: "PC",
                    isGlowing: stepIdx >= 1,
                    gradientColors: [const Color(0xFFA855F7), const Color(0xFFC084FC)],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDeviceNode({
    required IconData icon,
    required String title,
    required bool isGlowing,
    required List<Color> gradientColors,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 68,
          height: 68,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: gradientColors,
            ),
            boxShadow: isGlowing
                ? [
                    BoxShadow(
                      color: gradientColors.first.withOpacity(0.5),
                      blurRadius: 20,
                      spreadRadius: 3,
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Icon(icon, color: Colors.white, size: 32),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildStepIndicator(int currentStep, LocalizationService t) {
    final steps = [
      t.get('stepPairing'),
      t.get('stepSignaling'),
      t.get('stepTunnel'),
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(steps.length, (index) {
        final isDone = index < currentStep;
        final isCurrent = index == currentStep;

        return Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: isCurrent
                    ? const Color(0xFF6366F1).withOpacity(0.2)
                    : isDone
                        ? const Color(0xFF10B981).withOpacity(0.15)
                        : Colors.white.withOpacity(0.04),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isCurrent
                      ? const Color(0xFF818CF8)
                      : isDone
                          ? const Color(0xFF10B981)
                          : Colors.white.withOpacity(0.1),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                     isDone
                        ? Icons.check_circle_rounded
                        : isCurrent
                            ? Icons.radio_button_checked_rounded
                            : Icons.radio_button_unchecked_rounded,
                    size: 13,
                    color: isDone
                        ? const Color(0xFF10B981)
                        : isCurrent
                            ? const Color(0xFF818CF8)
                            : Colors.white38,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    steps[index],
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                      color: isDone
                          ? const Color(0xFF10B981)
                          : isCurrent
                              ? Colors.white
                              : Colors.white38,
                    ),
                  ),
                ],
              ),
            ),
            if (index < steps.length - 1)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Container(
                  width: 14,
                  height: 1.5,
                  color: isDone
                      ? const Color(0xFF10B981).withOpacity(0.5)
                      : Colors.white.withOpacity(0.1),
                ),
              ),
          ],
        );
      }),
    );
  }
}
