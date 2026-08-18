import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';
import 'package:provider/provider.dart';
import '../viewmodels/sync_viewmodel.dart';
import '../services/localization_service.dart';

class TransferConsoleView extends StatefulWidget {
  const TransferConsoleView({Key? key}) : super(key: key);

  @override
  State<TransferConsoleView> createState() => _TransferConsoleViewState();
}

class _TransferConsoleViewState extends State<TransferConsoleView> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late TabController _subTabController;
  int _mediaSubTab = 0; // 0: Photos, 1: Videos

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

    _subTabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _subTabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<SyncViewModel>(context);
    final t = Provider.of<LocalizationService>(context);
    final totalCount = viewModel.selectedImages.length +
        viewModel.selectedVideos.length +
        viewModel.selectedAudios.length +
        viewModel.chosenFiles.length;

    return Scaffold(
      backgroundColor: const Color(0xFF070A12), // Dark Slate
      body: SafeArea(
        child: Column(
          children: [
            // 1. Top status and disconnection header
            _buildTopStatusHeader(viewModel),

            // 2. Active transfer progress banner
            _buildActiveTransferBanner(viewModel),

            // 3. Tab view main content
            Expanded(
              child: Column(
                children: [
                  Container(
                    color: const Color(0xFF070A12),
                    child: TabBar(
                      controller: _subTabController,
                      indicator: const UnderlineTabIndicator(
                        borderSide: BorderSide(width: 3.0, color: Color(0xFF8B5CF6)),
                        insets: EdgeInsets.symmetric(horizontal: 16.0),
                      ),
                      labelColor: const Color(0xFF8B5CF6),
                      unselectedLabelColor: const Color(0xFF64748B),
                      labelStyle: const TextStyle(fontSize: 12.0, fontWeight: FontWeight.bold),
                      tabs: [
                        Tab(text: t.get('tabMedia'), icon: const Icon(Icons.photo_library, size: 16.0)),
                        Tab(text: t.get('tabMusic'), icon: const Icon(Icons.music_note, size: 16.0)),
                        Tab(text: t.get('tabDocs'), icon: const Icon(Icons.insert_drive_file, size: 16.0)),
                        Tab(text: t.get('tabQueue'), icon: const Icon(Icons.playlist_add_check, size: 16.0)),
                      ],
                    ),
                  ),
                  Expanded(
                    child: TabBarView(
                      controller: _subTabController,
                      children: [
                        _buildMediaGridContent(viewModel),
                        _buildMusicPickerContent(viewModel),
                        _buildDocPickerContent(viewModel),
                        _buildQueueListContent(viewModel),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      // 4. Floating Action Button for sending - only displays when items are selected
      floatingActionButton: totalCount > 0
          ? FloatingActionButton.extended(
              onPressed: (viewModel.activeTransferName == null)
                  ? () => viewModel.syncAllSelected()
                  : null,
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              icon: const Icon(Icons.send_rounded),
              label: Text(
                "${t.get('send')} ($totalCount)",
                style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
              elevation: 6.0,
            )
          : null,
    );
  }

  Widget _buildTopStatusHeader(SyncViewModel viewModel) {
    return Container(
      width: double.infinity,
      color: const Color(0xFF070A12), // Dark slate
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.bolt_rounded, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "ShareCLIP",
                    style: TextStyle(
                      fontSize: 16.0,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2.0),
                  Row(
                    children: [
                      AnimatedBuilder(
                        animation: _pulseAnimation,
                        builder: (context, child) {
                          return Container(
                            width: 8.0,
                            height: 8.0,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withOpacity(_pulseAnimation.value),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withOpacity(0.5 * _pulseAnimation.value),
                                  blurRadius: 6,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 6.0),
                      const Text(
                        "Connected to PC",
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12.0,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          ElevatedButton.icon(
            onPressed: () => viewModel.resetToScanner(),
            icon: const Icon(Icons.power_settings_new, size: 16),
            label: const Text("Disconnect", style: TextStyle(fontSize: 11.0, fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444).withOpacity(0.2),
              foregroundColor: const Color(0xFFEF4444),
              padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
              elevation: 0,
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

  Widget _buildMediaGridContent(SyncViewModel viewModel) {
    final t = Provider.of<LocalizationService>(context);
    if (viewModel.localImages.isEmpty) {
      return const Center(
        child: Text(
          "No media assets found in gallery",
          style: TextStyle(color: Color(0xFF64748B)),
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.psychology, size: 18, color: Color(0xFF8B5CF6)),
                      const SizedBox(width: 6),
                      Text(
                        t.currentLocale == 'zh' ? "AI 智能同步" : "AI Sync",
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  viewModel.isThumbnailSyncing
                      ? Text(
                          t.currentLocale == 'zh' 
                              ? "🔄 同步中 ${viewModel.thumbnailSyncDone}/${viewModel.thumbnailSyncTotal}" 
                              : "🔄 Syncing ${viewModel.thumbnailSyncDone}/${viewModel.thumbnailSyncTotal}",
                          style: const TextStyle(color: Color(0xFF8B5CF6), fontSize: 13, fontWeight: FontWeight.bold),
                        )
                      : ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8B5CF6),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          onPressed: () {
                            viewModel.syncThumbnailsToAI(
                              targets: viewModel.selectedImages.isNotEmpty
                                  ? viewModel.localImages.where((e) => viewModel.selectedImages.contains(e.id)).toList()
                                  : null,
                            );
                          },
                          icon: const Icon(Icons.psychology, size: 16),
                          label: Text(
                            viewModel.selectedImages.isNotEmpty
                                ? (t.currentLocale == 'zh' ? "同步选中图片到AI" : "Sync Selected to AI")
                                : (t.currentLocale == 'zh' ? "同步全部图片到AI" : "Sync All to AI"),
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.cloud_upload, size: 18, color: Color(0xFF10B981)),
                      const SizedBox(width: 6),
                      Text(
                        t.currentLocale == 'zh' ? "同步相册到PC" : "Sync Album to PC",
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  viewModel.isAlbumSyncing
                      ? Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              t.currentLocale == 'zh'
                                  ? "同步中: ${viewModel.albumSyncDone}/${viewModel.albumSyncTotal} (余${viewModel.albumSyncTotal - viewModel.albumSyncDone}张)"
                                  : "Syncing: ${viewModel.albumSyncDone}/${viewModel.albumSyncTotal} (${viewModel.albumSyncTotal - viewModel.albumSyncDone} left)",
                              style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(width: 8),
                            // Pause / Resume Button
                            IconButton(
                              constraints: const BoxConstraints(),
                              padding: EdgeInsets.zero,
                              icon: Icon(
                                viewModel.isAlbumSyncPaused ? Icons.play_arrow : Icons.pause,
                                color: const Color(0xFF10B981),
                                size: 18,
                              ),
                              onPressed: () {
                                if (viewModel.isAlbumSyncPaused) {
                                  viewModel.resumeAlbumSync();
                                } else {
                                  viewModel.pauseAlbumSync();
                                }
                              },
                            ),
                            const SizedBox(width: 8),
                            // Stop Button
                            IconButton(
                              constraints: const BoxConstraints(),
                              padding: EdgeInsets.zero,
                              icon: const Icon(
                                Icons.stop,
                                color: Color(0xFFEF4444),
                                size: 18,
                              ),
                              onPressed: () => viewModel.stopAlbumSync(),
                            ),
                          ],
                        )
                      : ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          onPressed: viewModel.isThumbnailSyncing
                              ? null
                              : () => viewModel.syncAlbumToPC(),
                          icon: const Icon(Icons.cloud_upload, size: 16),
                          label: Text(
                            viewModel.lastAlbumSyncDate.isNotEmpty
                                ? (t.currentLocale == 'zh' ? "继续同步相册" : "Resume Album Sync")
                                : (t.currentLocale == 'zh' ? "同步全部相册到PC" : "Sync Album to PC"),
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                ],
              ),
            ],
          ),
        ),
        const Divider(color: Color(0xFF1E293B), height: 1),

        // Sub-segmented Tab: Photos vs Videos
        Container(
          margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _mediaSubTab = 0),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: _mediaSubTab == 0 ? const Color(0xFF8B5CF6) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.photo_outlined,
                          size: 14,
                          color: _mediaSubTab == 0 ? Colors.white : const Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          "${t.currentLocale.startsWith('zh') ? '照片' : 'Photos'} (${viewModel.localImages.length})",
                          style: TextStyle(
                            color: _mediaSubTab == 0 ? Colors.white : const Color(0xFF94A3B8),
                            fontSize: 12,
                            fontWeight: _mediaSubTab == 0 ? FontWeight.bold : FontWeight.normal,
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
                  onTap: () => setState(() => _mediaSubTab = 1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: _mediaSubTab == 1 ? const Color(0xFF8B5CF6) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.videocam_outlined,
                          size: 14,
                          color: _mediaSubTab == 1 ? Colors.white : const Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          "${t.currentLocale.startsWith('zh') ? '视频' : 'Videos'} (${viewModel.localVideos.length})",
                          style: TextStyle(
                            color: _mediaSubTab == 1 ? Colors.white : const Color(0xFF94A3B8),
                            fontSize: 12,
                            fontWeight: _mediaSubTab == 1 ? FontWeight.bold : FontWeight.normal,
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

        Expanded(
          child: Builder(
            builder: (context) {
              final currentList = _mediaSubTab == 0 ? viewModel.localImages : viewModel.localVideos;
              final isZh = t.currentLocale.startsWith('zh');

              if (currentList.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _mediaSubTab == 0 ? Icons.photo_library_outlined : Icons.video_library_outlined,
                        color: const Color(0xFF475569),
                        size: 48,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _mediaSubTab == 0
                            ? (isZh ? "相册中暂无照片" : "No photos available")
                            : (isZh ? "相册中暂无视频" : "No videos available"),
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                      ),
                    ],
                  ),
                );
              }

              return GridView.builder(
                padding: const EdgeInsets.all(8.0),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 8.0,
                  mainAxisSpacing: 8.0,
                ),
                itemCount: currentList.length,
                itemBuilder: (context, idx) {
                  final media = currentList[idx];
                  final isSelected = _mediaSubTab == 0
                      ? viewModel.selectedImages.contains(media.id)
                      : viewModel.selectedVideos.contains(media.id);
                  final status = viewModel.transferStatusMap[media.id];
                  final isVideo = media.type == AssetType.video;

                  return GestureDetector(
                    onTap: () {
                      if (_mediaSubTab == 0) {
                        viewModel.toggleImageSelection(media.id);
                      } else {
                        viewModel.toggleVideoSelection(media.id);
                      }
                    },
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
                            AssetEntityImage(
                              media,
                              isOriginal: false,
                              thumbnailSize: const ThumbnailSize.square(200),
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stack) {
                                return Container(
                                  color: const Color(0xFF1E293B),
                                  alignment: Alignment.center,
                                  child: Text(isVideo ? "🎥" : "🖼️", style: const TextStyle(fontSize: 24.0)),
                                );
                              },
                            ),

                            // Selection shading overlay
                            if (isSelected)
                              Container(color: const Color(0x338B5CF6)),

                            // Video Play / Duration Badge
                            if (isVideo)
                              Positioned(
                                bottom: 4.0,
                                left: 4.0,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 2.0),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.7),
                                    borderRadius: BorderRadius.circular(4.0),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.play_arrow, color: Colors.white, size: 10.0),
                                      const SizedBox(width: 2.0),
                                      Text(
                                        _formatDuration(media.duration),
                                        style: const TextStyle(color: Colors.white, fontSize: 9.0, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

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
                },
              );
            },
          ),
        ),
      ],
    );
  }


  String _formatDuration(int seconds) {
    final int m = seconds ~/ 60;
    final int s = seconds % 60;
    return "${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}";
  }

  // ── Music Tab: shows audio from MediaStore ────────────────────────────────
  Widget _buildMusicPickerContent(SyncViewModel viewModel) {
    final audios = viewModel.localAudios;
    final t = Provider.of<LocalizationService>(context);

    if (audios.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("🎵", style: TextStyle(fontSize: 48.0)),
            const SizedBox(height: 12.0),
            Text(
              t.get('musicEmpty'),
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 14.0),
            ),
            const SizedBox(height: 6),
            const Text(
              "Grant storage/audio permission to see files",
              style: TextStyle(color: Color(0xFF475569), fontSize: 12.0),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
          child: Text(
            '${audios.length} tracks',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: audios.length,
            itemBuilder: (context, idx) {
              final audio = audios[idx];
              final isSelected = viewModel.selectedAudios.contains(audio.id);
              final status = viewModel.transferStatusMap[audio.id];
              final title = audio.title ?? 'Unknown Track';
              final durationSec = audio.duration;
              final durationStr = durationSec > 0
                  ? _formatDuration(durationSec)
                  : '';

              return GestureDetector(
                onTap: () => viewModel.toggleAudioSelection(audio.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF1E1040)
                        : const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF8B5CF6)
                          : const Color(0xFF1E293B),
                      width: isSelected ? 1.5 : 1.0,
                    ),
                  ),
                  child: ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF8B5CF6)
                            : const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        isSelected ? Icons.music_note : Icons.music_note_outlined,
                        color: isSelected
                            ? Colors.white
                            : const Color(0xFF64748B),
                        size: 20,
                      ),
                    ),
                    title: Text(
                      title,
                      style: TextStyle(
                        color: isSelected ? Colors.white : const Color(0xFFCBD5E1),
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: durationStr.isNotEmpty
                        ? Text(
                            durationStr,
                            style: const TextStyle(
                                color: Color(0xFF64748B), fontSize: 11),
                          )
                        : null,
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (status != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 2.0),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.6),
                              borderRadius: BorderRadius.circular(4.0),
                            ),
                            child: Text(
                              _getBadgeText(status),
                              style: const TextStyle(fontSize: 11.0),
                            ),
                          ),
                          const SizedBox(width: 8.0),
                        ],
                        if (isSelected)
                          Container(
                            width: 22,
                            height: 22,
                            decoration: const BoxDecoration(
                              color: Color(0xFF8B5CF6),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: const Text(
                              '✓',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold),
                            ),
                          )
                      ],
                    ),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ── Docs Tab: file picker for documents ───────────────────────────────────
  Widget _buildDocPickerContent(SyncViewModel viewModel) {
    final docFiles = viewModel.chosenFiles.where((file) {
      final ext = file.name.split('.').last.toLowerCase();
      return !['mp3', 'wav', 'flac', 'm4a', 'aac', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mkv', 'avi', 'mov'].contains(ext);
    }).toList();

    final t = Provider.of<LocalizationService>(context);
    if (docFiles.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("📄", style: TextStyle(fontSize: 48.0)),
            const SizedBox(height: 12.0),
            Text(
              t.get('docsEmpty'),
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 14.0),
            ),
            const SizedBox(height: 16.0),
            ElevatedButton.icon(
              onPressed: () => viewModel.pickFiles('file'),
              icon: const Icon(Icons.add),
              label: Text(t.get('pickDocs')),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF8B5CF6),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.0)),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: ElevatedButton.icon(
            onPressed: () => viewModel.pickFiles('file'),
            icon: const Icon(Icons.add),
            label: const Text("Select More Document Files"),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0x1F8B5CF6),
              foregroundColor: const Color(0xFF8B5CF6),
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8.0)),
              minimumSize: const Size.fromHeight(40),
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: docFiles.length,
            itemBuilder: (context, idx) {
              final file = docFiles[idx];
              final sizeStr = file.size > 1024 * 1024
                  ? "${(file.size / (1024 * 1024)).toStringAsFixed(1)} MB"
                  : "${(file.size / 1024).toStringAsFixed(1)} KB";
              return _buildListFileItem(file.name, sizeStr, "📄", () {
                setState(() {
                  viewModel.chosenFiles.remove(file);
                });
              });
            },
          ),
        ),
      ],
    );
  }

  Widget _buildQueueListContent(SyncViewModel viewModel) {
    final selectedPhotos = viewModel.localImages.where((img) => viewModel.selectedImages.contains(img.id)).toList();
    final selectedVideos = viewModel.localVideos.where((v) => viewModel.selectedVideos.contains(v.id)).toList();
    final selectedMusic = viewModel.localAudios.where((a) => viewModel.selectedAudios.contains(a.id)).toList();
    final totalSelected = selectedPhotos.length + selectedVideos.length + selectedMusic.length + viewModel.chosenFiles.length;

    final t = Provider.of<LocalizationService>(context);
    final isZh = t.currentLocale.startsWith('zh');

    if (totalSelected == 0) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("📥", style: TextStyle(fontSize: 48.0)),
            const SizedBox(height: 12.0),
            Text(
              t.get('queueEmpty'),
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 14.0),
            ),
            const SizedBox(height: 6.0),
            Text(
              isZh ? "前往其他选项卡勾选要传输的文件" : "Browse other tabs to select files to transmit",
              style: const TextStyle(color: Color(0xFF475569), fontSize: 12.0),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      children: [
        if (selectedPhotos.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Text(
              isZh ? "已选照片 (${selectedPhotos.length})" : "SELECTED PHOTOS (${selectedPhotos.length})",
              style: const TextStyle(fontSize: 11.0, color: Color(0xFF64748B), fontWeight: FontWeight.bold, letterSpacing: 0.8),
            ),
          ),
          ...selectedPhotos.map((media) {
            return _buildListFileItem(
              (media.title != null && media.title!.isNotEmpty) ? media.title! : "Photo Asset",
              "Photo",
              "🖼️",
              () => viewModel.toggleImageSelection(media.id),
            );
          }).toList(),
        ],
        if (selectedVideos.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Text(
              isZh ? "已选视频 (${selectedVideos.length})" : "SELECTED VIDEOS (${selectedVideos.length})",
              style: const TextStyle(fontSize: 11.0, color: Color(0xFF64748B), fontWeight: FontWeight.bold, letterSpacing: 0.8),
            ),
          ),
          ...selectedVideos.map((media) {
            return _buildListFileItem(
              (media.title != null && media.title!.isNotEmpty) ? media.title! : "Video Asset",
              "Video (${_formatDuration(media.duration)})",
              "🎥",
              () => viewModel.toggleVideoSelection(media.id),
            );
          }).toList(),
        ],
        if (selectedMusic.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Text(
              isZh ? "已选音乐 (${selectedMusic.length})" : "SELECTED MUSIC (${selectedMusic.length})",
              style: const TextStyle(fontSize: 11.0, color: Color(0xFF64748B), fontWeight: FontWeight.bold, letterSpacing: 0.8),
            ),
          ),
          ...selectedMusic.map((audio) {
            return _buildListFileItem(
              audio.title ?? "Unknown Track",
              audio.duration > 0 ? "Audio (${_formatDuration(audio.duration)})" : "Audio",
              "🎵",
              () => viewModel.toggleAudioSelection(audio.id),
            );
          }).toList(),
        ],

        if (viewModel.chosenFiles.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Text(
              "CUSTOM STORAGE FILES (${viewModel.chosenFiles.length})",
              style: const TextStyle(fontSize: 11.0, color: Color(0xFF64748B), fontWeight: FontWeight.bold, letterSpacing: 0.8),
            ),
          ),
          ...viewModel.chosenFiles.map((file) {
            final ext = file.name.split('.').last.toLowerCase();
            final emoji = ['mp3', 'wav', 'flac', 'm4a', 'aac'].contains(ext) ? "🎵" : "📄";
            final sizeStr = file.size > 1024 * 1024
                ? "${(file.size / (1024 * 1024)).toStringAsFixed(1)} MB"
                : "${(file.size / 1024).toStringAsFixed(1)} KB";
            return _buildListFileItem(
              file.name,
              sizeStr,
              emoji,
              () {
                setState(() {
                  viewModel.chosenFiles.remove(file);
                });
              },
            );
          }).toList(),
        ],
      ],
    );
  }

  Widget _buildListFileItem(String name, String size, String emoji, VoidCallback onDelete) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 4.0),
      child: Container(
        padding: const EdgeInsets.all(10.0),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(8.0),
          border: Border.all(color: const Color(0x1Fffffff)),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18.0)),
            const SizedBox(width: 12.0),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2.0),
                  Text(
                    size,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 10.5,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close, color: Color(0xFFEF4444), size: 16.0),
              onPressed: onDelete,
              constraints: const BoxConstraints(),
              padding: EdgeInsets.zero,
            ),
          ],
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
}
