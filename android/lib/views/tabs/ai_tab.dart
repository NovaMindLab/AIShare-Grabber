import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_manager_image_provider/photo_manager_image_provider.dart';
import '../../viewmodels/sync_viewmodel.dart';
import '../../services/localization_service.dart';
import '../../services/ai_classification_service.dart';

class AiTab extends StatefulWidget {
  const AiTab({Key? key}) : super(key: key);

  @override
  State<AiTab> createState() => _AiTabState();
}

class _AiTabState extends State<AiTab> {
  String? _selectedCategory;
  bool _showThresholdSlider = false;

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<SyncViewModel>(context);
    final aiService = viewModel.aiService;
    final t = Provider.of<LocalizationService>(context);

    // If local images are not loaded yet, request early load
    if (viewModel.localImages.isEmpty && viewModel.permissionsGranted) {
      viewModel.loadGalleryEarly();
    }

    final categories = aiService.categories;
    final categoryCounts = aiService.getCategoryCounts(viewModel.localImages);

    // Default to first category that has items, or first category
    if (_selectedCategory == null && categories.isNotEmpty) {
      _selectedCategory = categories.first.name;
      for (final cat in categories) {
        if ((categoryCounts[cat.name] ?? 0) > 0) {
          _selectedCategory = cat.name;
          break;
        }
      }
    }

    final currentCategoryPhotos = _selectedCategory != null
        ? aiService.getPhotosForCategory(_selectedCategory!, viewModel.localImages)
        : <AssetEntity>[];

    final isConnected = viewModel.appState == AppState.connected;

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6366F1).withOpacity(0.35),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t.get('navAi'),
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        aiService.syncedPhotoCount > 0
                            ? "${aiService.syncedPhotoCount} ${t.get('items')} · ${aiService.categoryCount} ${t.get('aiCategories')}"
                            : t.get('aiNotSynced'),
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                      ),
                    ],
                  ),
                ),
                // Threshold Slider Toggle Button
                IconButton(
                  icon: Icon(
                    Icons.tune_rounded,
                    color: _showThresholdSlider ? const Color(0xFFA855F7) : const Color(0xFF94A3B8),
                    size: 22,
                  ),
                  tooltip: t.get('aiThreshold'),
                  onPressed: () {
                    setState(() {
                      _showThresholdSlider = !_showThresholdSlider;
                    });
                  },
                ),
                // Sync Vectors Button
                ElevatedButton.icon(
                  onPressed: (isConnected && !viewModel.isAiVectorSyncing)
                      ? () => viewModel.syncAiVectorsFromPc()
                      : null,
                  icon: viewModel.isAiVectorSyncing
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.sync_rounded, size: 16),
                  label: Text(
                    viewModel.isAiVectorSyncing ? t.get('syncing') : t.get('syncAiVectors'),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFF1E293B),
                    disabledForegroundColor: const Color(0xFF64748B),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),

          // 2. Expandable "分类自由" (Threshold Slider Control)
          if (_showThresholdSlider)
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.tune_rounded, color: Color(0xFFA855F7), size: 16),
                          const SizedBox(width: 6),
                          Text(
                            t.get('aiThresholdControl'),
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          "${(aiService.threshold * 100).toInt()}%",
                          style: const TextStyle(color: Color(0xFFC084FC), fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: const Color(0xFF8B5CF6),
                      inactiveTrackColor: const Color(0xFF334155),
                      thumbColor: Colors.white,
                      overlayColor: const Color(0xFF8B5CF6).withOpacity(0.2),
                      trackHeight: 4.0,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7.0),
                    ),
                    child: Slider(
                      value: aiService.threshold,
                      min: 0.15,
                      max: 0.45,
                      divisions: 30,
                      onChanged: (val) => aiService.setThreshold(val),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(t.get('aiMoreMatches'), style: const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
                      Text(t.get('aiHigherPrecision'), style: const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),

          // 3. Category Horizontal Selector (15 Categories)
          if (categories.isNotEmpty)
            SizedBox(
              height: 46,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                itemCount: categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final cat = categories[idx];
                  final isSelected = cat.name == _selectedCategory;
                  final count = categoryCounts[cat.name] ?? 0;

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedCategory = cat.name;
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: isSelected
                            ? const LinearGradient(
                                colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
                              )
                            : null,
                        color: isSelected ? null : const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? Colors.transparent : const Color(0xFF334155),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(cat.icon, style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Text(
                            cat.shortName,
                            style: TextStyle(
                              color: isSelected ? Colors.white : const Color(0xFFCBD5E1),
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: isSelected ? Colors.black.withOpacity(0.2) : const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              "$count",
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF94A3B8),
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

          const SizedBox(height: 6),

          // 4. Photo Grid View or Empty State
          Expanded(
            child: categories.isEmpty
                ? _buildEmptyState(context, isConnected, viewModel, t)
                : currentCategoryPhotos.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.filter_hdr_outlined, size: 56, color: Color(0xFF475569)),
                            const SizedBox(height: 12),
                            Text(
                              t.get('aiNoCategoryPhotos'),
                              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              t.get('aiTryAdjustThreshold'),
                              style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                            ),
                          ],
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          childAspectRatio: 1.0,
                        ),
                        itemCount: currentCategoryPhotos.length,
                        itemBuilder: (context, index) {
                          final photo = currentCategoryPhotos[index];
                          final aiItem = aiService.photoItems[photo.id];
                          final score = aiItem?.topScore ?? 0.0;

                          return GestureDetector(
                            onTap: () => _showPhotoDetail(context, photo, aiItem),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  AssetEntityImage(
                                    photo,
                                    isOriginal: false,
                                    thumbnailSize: const ThumbnailSize.square(250),
                                    fit: BoxFit.cover,
                                  ),
                                  // Score tag badge
                                  if (score > 0)
                                    Positioned(
                                      bottom: 4,
                                      right: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withOpacity(0.65),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          "${(score * 100).toInt()}%",
                                          style: const TextStyle(
                                            color: Color(0xFFC084FC),
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
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

  Widget _buildEmptyState(BuildContext context, bool isConnected, SyncViewModel viewModel, LocalizationService t) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome_motion_outlined, color: Color(0xFF8B5CF6), size: 40),
            ),
            const SizedBox(height: 18),
            Text(
              t.get('aiWelcomeTitle'),
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              t.get('aiWelcomeDesc'),
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (isConnected)
              ElevatedButton.icon(
                onPressed: () => viewModel.syncAiVectorsFromPc(),
                icon: const Icon(Icons.sync_rounded),
                label: Text(t.get('syncAiVectorsNow')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.info_outline, color: Color(0xFF64748B), size: 16),
                    const SizedBox(width: 8),
                    Text(
                      t.get('aiConnectPcFirst'),
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showPhotoDetail(BuildContext context, AssetEntity photo, AiPhotoItem? aiItem) {
    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(16),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: AspectRatio(
                    aspectRatio: 1.0,
                    child: AssetEntityImage(
                      photo,
                      isOriginal: false,
                      thumbnailSize: const ThumbnailSize.square(800),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        photo.title ?? 'Photo',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      if (aiItem != null && aiItem.predictions.isNotEmpty)
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: aiItem.predictions.map((p) {
                            final cat = p['category']?.toString() ?? '';
                            final score = ((p['score'] as num?)?.toDouble() ?? 0.0) * 100;
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF8B5CF6).withOpacity(0.18),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.4)),
                              ),
                              child: Text(
                                "$cat (${score.toInt()}%)",
                                style: const TextStyle(color: Color(0xFFC084FC), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            );
                          }).toList(),
                        )
                      else
                        const Text(
                          "无详细预测信息",
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
