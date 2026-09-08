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

class _ConnectingViewState extends State<ConnectingView> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
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
    final statusText = _getStatusText(widget.appState, t);
    final targetIps = widget.viewModel.lastScannedPayload?.pcIps;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: Column(
            children: [
              const Spacer(flex: 3),

              // 1. Clean Animated Central Indicator
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _pulseAnimation.value,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Subtle outer soft ring
                        Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF1E293B),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF38BDF8).withOpacity(0.12),
                                blurRadius: 24,
                                spreadRadius: 4,
                              ),
                            ],
                          ),
                        ),
                        // Smooth progress indicator
                        const SizedBox(
                          width: 88,
                          height: 88,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                          ),
                        ),
                        // Center icon
                        const Icon(
                          Icons.devices_rounded,
                          color: Color(0xFF38BDF8),
                          size: 34,
                        ),
                      ],
                    ),
                  );
                },
              ),

              const SizedBox(height: 32),

              // 2. Title
              Text(
                t.get('connecting'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 19,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.2,
                ),
              ),

              const SizedBox(height: 10),

              // 3. Sub-status text
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  statusText,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
              ),

              // 4. Target IP Chip (if available)
              if (targetIps != null && targetIps.isNotEmpty) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    'PC: ${targetIps.first}',
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 12,
                    ),
                  ),
                ),
              ],

              const Spacer(flex: 4),

              // 5. Cancel Button
              GestureDetector(
                onTap: () {
                  widget.viewModel.cleanup();
                  widget.viewModel.returnHome();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 12),
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

              const SizedBox(height: 36),
            ],
          ),
        ),
      ),
    );
  }
}
