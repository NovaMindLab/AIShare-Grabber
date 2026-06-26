import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';
import 'package:provider/provider.dart';
import '../viewmodels/sync_viewmodel.dart';

class TransferConsoleView extends StatefulWidget {
  const TransferConsoleView({Key? key}) : super(key: key);

  @override
  State<TransferConsoleView> createState() => _TransferConsoleViewState();
}

class _TransferConsoleViewState extends State<TransferConsoleView> with SingleTickerProviderStateMixin {
  int _activeTab = 0; // 0: Gallery, 1: Connection Logs
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<SyncViewModel>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF090D16), // Slate-950
      body: SafeArea(
        child: Column(
          children: [
            // 1. Top Glassmorphic Navigation & Status Bar
            _buildTopStatusHeader(viewModel),

            // 2. Statistics Grid
            _buildStatsGrid(viewModel),

            // 3. Active Transfer Progress Bar
            _buildActiveTransferBanner(viewModel),

            // 4. Tab Selector (Gallery vs Logs)
            _buildTabRow(),

            // 5. Main Content Area depending on Tab
            Expanded(
              child: _activeTab == 0
                  ? _buildGalleryGridTab(viewModel)
                  : _buildLogsTab(viewModel),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopStatusHeader(SyncViewModel viewModel) {
    return Container(
      width: double.infinity,
      color: const Color(0xFF0F172A),
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "CLIP COMPANION",
                style: TextStyle(
                  fontSize: 12.0,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF8B5CF6), // Violet-500
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 4.0),
              Row(
                children: [
                  AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, child) {
                      return Opacity(
                        opacity: _pulseAnimation.value,
                        child: Container(
                          width: 8.0,
                          height: 8.0,
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981), // Emerald
                            shape: BoxShape.circle,
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 6.0),
                  const Text(
                    "Sync Console Connected",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.0,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          ElevatedButton(
            onPressed: () => viewModel.resetToScanner(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              shape: RoundedCornerShape(8.0),
            ),
            child: const Text(
              "Disconnect",
              style: TextStyle(fontSize: 12.0, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(SyncViewModel viewModel) {
    final completedCount = viewModel.transferStatusMap.values.count((s) => s == TransferStatus.completed);
    final failedCount = viewModel.transferStatusMap.values.count((s) => s == TransferStatus.failed);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              title: "Transfer Speed",
              value: viewModel.activeTransferName != null
                  ? "${viewModel.activeSpeedKbps.toStringAsFixed(1)} KB/s"
                  : "0.0 KB/s",
              subtitle: viewModel.activeTransferName != null ? "Streaming image..." : "Idle",
            ),
          ),
          const SizedBox(width: 12.0),
          Expanded(
            child: _buildStatCard(
              title: "Sync Progress",
              value: "$completedCount / ${viewModel.transferStatusMap.length}",
              subtitle: failedCount > 0 ? "$failedCount failed files" : "All files healthy",
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({required String title, required String value, required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(12.0),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12.0),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 11.0,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4.0),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18.0,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2.0),
          Text(
            subtitle,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 10.0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveTransferBanner(SyncViewModel viewModel) {
    if (viewModel.activeTransferName == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Container(
        padding: const EdgeInsets.all(12.0),
        decoration: BoxDecoration(
          color: const Color(0x1F8B5CF6),
          borderRadius: BorderRadius.circular(10.0),
          border: Border.all(color: const Color(0x3D8B5CF6)),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    viewModel.activeTransferName!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13.0,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  "${(viewModel.activeProgress * 100).toStringAsFixed(0)}%",
                  style: const TextStyle(
                    color: Color(0xFF8B5CF6),
                    fontSize: 13.0,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8.0),
            ClipRRect(
              borderRadius: BorderRadius.circular(3.0),
              child: LinearProgressIndicator(
                value: viewModel.activeProgress,
                minHeight: 6.0,
                backgroundColor: const Color(0xFF1E293B),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF8B5CF6)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabRow() {
    return Container(
      color: const Color(0xFF0F172A),
      child: Row(
        children: [
          Expanded(
            child: _buildTabItem(index: 0, title: "Album Gallery"),
          ),
          Expanded(
            child: _buildTabItem(index: 1, title: "Connection Logs"),
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem({required int index, required String title}) {
    final isSelected = _activeTab == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _activeTab = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14.0),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? const Color(0xFF8B5CF6) : Colors.transparent,
              width: 2.0,
            ),
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? const Color(0xFF8B5CF6) : const Color(0xFF94A3B8),
            fontWeight: FontWeight.bold,
            fontSize: 14.0,
          ),
        ),
      ),
    );
  }

  Widget _buildGalleryGridTab(SyncViewModel viewModel) {
    if (viewModel.localImages.isEmpty) {
      return const Center(
        child: Text(
          "No images found in your photo album",
          style: TextStyle(color: Color(0xFF64748B)),
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(8.0),
            gridDelegate: const SliverGridDelegateWithFixedCrossCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8.0,
              mainAxisSpacing: 8.0,
            ),
            itemCount: viewModel.localImages.length,
            itemBuilder: (context, idx) {
              final image = viewModel.localImages[idx];
              final isSelected = viewModel.selectedImages.contains(image.id);
              final status = viewModel.transferStatusMap[image.id];

              return _buildGalleryCard(image, isSelected, status, viewModel);
            },
          ),
        ),

        // Sync trigger bottom panel
        Container(
          color: const Color(0xFF0F172A),
          padding: const EdgeInsets.all(16.0),
          width: double.infinity,
          child: ElevatedButton(
            onPressed: (viewModel.selectedImages.isNotEmpty && viewModel.activeTransferName == null)
                ? () => viewModel.startSyncingSelected()
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              disabledBackgroundColor: const Color(0xFF1E293B),
              foregroundColor: Colors.white,
              disabledForegroundColor: const Color(0xFF64748B),
              padding: const EdgeInsets.symmetric(vertical: 14.0),
              shape: RoundedCornerShape(10.0),
            ),
            child: Text(
              viewModel.selectedImages.isNotEmpty
                  ? "Sync Selected (${viewModel.selectedImages.size} Photos)"
                  : "Select photos to synchronize",
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15.0),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGalleryCard(
    AssetEntity image,
    bool isSelected,
    TransferStatus? status,
    SyncViewModel viewModel,
  ) {
    return GestureDetector(
      onTap: () => viewModel.toggleImageSelection(image.id),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(
            color: isSelected ? const Color(0xFF8B5CF6) : const Color(0xFF1E293B),
            width: isSelected ? 2.0 : 1.0,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(6.0),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // 1. Native Thumbnail decoding asynchronously
              AssetEntityImage(
                image,
                isOriginal: false,
                thumbnailSize: const ThumbnailSize.square(200),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stack) {
                  return Container(
                    color: const Color(0xFF1E293B),
                    alignment: Alignment.center,
                    child: const Text("🖼️", style: TextStyle(fontSize: 24.0)),
                  );
                },
              ),

              // Selection shading overlay
              if (isSelected)
                Container(color: const Color(0x338B5CF6)),

              // Status badge
              if (status != null)
                Positioned(
                  bottom: 4.0,
                  right: 4.0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 2.0),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(4.0),
                    ),
                    child: Text(
                      _getBadgeText(status),
                      style: const TextStyle(fontSize: 10.0),
                    ),
                  ),
                ),

              // Selection checkmark indicator
              if (isSelected)
                Positioned(
                  top: 6.0,
                  right: 6.0,
                  child: Container(
                    width: 16.0,
                    height: 16.0,
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      "✓",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _getBadgeText(TransferStatus status) {
    switch (status) {
      case TransferStatus.pending:
        return "⏳";
      case TransferStatus.transferring:
        return "🔄";
      case TransferStatus.completed:
        return "✅";
      case TransferStatus.failed:
        return "❌";
    }
  }

  Widget _buildLogsTab(SyncViewModel viewModel) {
    final logs = viewModel.messageLog.reversed.toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: logs.length,
      itemBuilder: (context, idx) {
        final line = logs[idx];
        Color color = const Color(0xFFE2E8F0);
        if (line.contains("Error") || line.contains("Failed")) {
          color = const Color(0xFFEF4444);
        } else if (line.contains("Success") || line.contains("reassembled")) {
          color = const Color(0xFF10B981);
        } else if (line.contains("Connected") || line.contains("DTLS")) {
          color = const Color(0xFF8B5CF6);
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Text(
            line,
            style: TextStyle(
              color: color,
              fontSize: 12.0,
              fontFamily: "monospace",
            ),
          ),
        );
      },
    );
  }

  RoundedRectangleBorder RoundedCornerShape(double radius) {
    return RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }
}

// Simple extension helper count mapping
extension ListCountExtension<T> on Iterable<T> {
  int count(bool Function(T element) test) {
    var total = 0;
    for (var element in this) {
      if (test(element)) {
        total++;
      }
    }
    return total;
  }
}
