import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';
import '../../viewmodels/sync_viewmodel.dart';
import '../../services/localization_service.dart';

class MediaTab extends StatefulWidget {
  const MediaTab({Key? key}) : super(key: key);

  @override
  State<MediaTab> createState() => _MediaTabState();
}

class _MediaTabState extends State<MediaTab> {
  int _selectedTab = 0; // 0: Photos, 1: Videos

  String _formatDuration(int seconds) {
    final int m = seconds ~/ 60;
    final int s = seconds % 60;
    return "${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}";
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<SyncViewModel>(context);
    final t = Provider.of<LocalizationService>(context);

    final currentList = _selectedTab == 0 ? viewModel.localImages : viewModel.localVideos;

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header title & total count
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  t.get('localMedia'),
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    "${viewModel.localImages.length + viewModel.localVideos.length} ${t.get('items')}",
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Segmented Pill Switch: Photos vs Videos
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color ?? const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTab = 0),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _selectedTab == 0
                            ? Theme.of(context).colorScheme.primary
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.photo_outlined,
                            size: 16,
                            color: _selectedTab == 0
                                ? Colors.white
                                : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            "${t.get('photos')} (${viewModel.localImages.length})",
                            style: TextStyle(
                              color: _selectedTab == 0
                                  ? Colors.white
                                  : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                              fontSize: 13,
                              fontWeight: _selectedTab == 0 ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTab = 1),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _selectedTab == 1
                            ? Theme.of(context).colorScheme.primary
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.videocam_outlined,
                            size: 16,
                            color: _selectedTab == 1
                                ? Colors.white
                                : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            "${t.get('videos')} (${viewModel.localVideos.length})",
                            style: TextStyle(
                              color: _selectedTab == 1
                                  ? Colors.white
                                  : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                              fontSize: 13,
                              fontWeight: _selectedTab == 1 ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 6),

          // Media Grid View
          Expanded(
            child: currentList.isEmpty
                ? _buildEmptyState(context, _selectedTab == 0, t)
                : GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 4,
                      mainAxisSpacing: 4,
                    ),
                    itemCount: currentList.length,
                    itemBuilder: (context, idx) {
                      final media = currentList[idx];
                      final isVideo = media.type == AssetType.video;
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            AssetEntityImage(
                              media,
                              isOriginal: false,
                              thumbnailSize: const ThumbnailSize.square(200),
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: Theme.of(context).dividerColor,
                                alignment: Alignment.center,
                                child: Text(
                                  isVideo ? '🎥' : '🖼️',
                                  style: const TextStyle(fontSize: 22),
                                ),
                              ),
                            ),
                            if (isVideo)
                              Positioned(
                                bottom: 4,
                                left: 4,
                                right: 4,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(alpha: 0.7),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 12),
                                          const SizedBox(width: 2),
                                          Text(
                                            _formatDuration(media.duration),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
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
    );
  }

  Widget _buildEmptyState(BuildContext context, bool isPhotos, LocalizationService t) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isPhotos ? Icons.photo_library_outlined : Icons.video_library_outlined,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
            size: 56,
          ),
          const SizedBox(height: 12),
          Text(
            isPhotos ? t.get('noPhotos') : t.get('noVideos'),
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

