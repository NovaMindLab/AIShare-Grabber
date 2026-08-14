import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/localization_service.dart';
import '../../services/theme_service.dart';
import '../../themes/app_theme.dart';
import '../../main.dart';

class SettingsTab extends StatelessWidget {
  const SettingsTab({Key? key}) : super(key: key);

  void _showLanguageModal(BuildContext context, LocalizationService t, bool isZh) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final theme = Theme.of(ctx);
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.7,
          ),
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top drag handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 10, bottom: 6),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Title bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isZh ? '选择语言' : 'Select Language',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close, color: theme.colorScheme.onSurface.withValues(alpha: 0.6), size: 20),
                      onPressed: () => Navigator.pop(ctx),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Scrollable language list
              Flexible(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: LocalizationService.languages.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    indent: 20,
                    endIndent: 20,
                    color: theme.dividerColor.withValues(alpha: 0.5),
                  ),
                  itemBuilder: (context, index) {
                    final entry = LocalizationService.languages.entries.elementAt(index);
                    final isSelected = t.currentLocale == entry.key;

                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
                      title: Text(
                        entry.value,
                        style: TextStyle(
                          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.onSurface,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 15,
                        ),
                      ),
                      trailing: isSelected
                          ? Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.check, color: theme.colorScheme.primary, size: 18),
                            )
                          : null,
                      onTap: () {
                        t.setLanguage(entry.key);
                        Navigator.pop(ctx);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = Provider.of<LocalizationService>(context);
    final themeService = Provider.of<ThemeService>(context);
    final isZh = t.currentLocale.startsWith('zh');
    final currentLanguageName = LocalizationService.languages[t.currentLocale] ?? t.currentLocale;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            isZh ? '设置与外观' : 'Settings & Appearance',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),

          // Theme Selection
          Text(
            isZh ? '主题风格' : 'Theme Mode',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: AppThemeMode.values.map((mode) {
              final isSelected = themeService.themeMode == mode;
              return GestureDetector(
                onTap: () => themeService.setThemeMode(mode),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected 
                        ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.15)
                        : Theme.of(context).cardTheme.color,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected 
                          ? Theme.of(context).colorScheme.primary 
                          : Theme.of(context).dividerColor,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _getThemeIcon(mode, isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurface),
                      const SizedBox(width: 8),
                      Text(
                        _getThemeName(mode, isZh),
                        style: TextStyle(
                          color: isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurface,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 32),

          // Language Selection Header
          Text(
            isZh ? '语言设置' : 'Language',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),

          // Compact Language Card that opens bottom sheet selector
          Material(
            color: Theme.of(context).cardTheme.color,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => _showLanguageModal(context, t, isZh),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        Icons.language_rounded,
                        color: Theme.of(context).colorScheme.primary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isZh ? '当前语言' : 'Current Language',
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            currentLanguageName,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.keyboard_arrow_right_rounded,
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                      size: 22,
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 48),
          
          Center(
            child: Text(
              'ShareCLIP v$appVersion',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Icon _getThemeIcon(AppThemeMode mode, Color color) {
    switch (mode) {
      case AppThemeMode.light:
        return Icon(Icons.wb_sunny_outlined, color: color, size: 18);
      case AppThemeMode.dark:
        return Icon(Icons.nightlight_round, color: color, size: 18);
      case AppThemeMode.ocean:
        return Icon(Icons.water_drop_outlined, color: color, size: 18);
      case AppThemeMode.amoled:
        return Icon(Icons.dark_mode, color: color, size: 18);
      case AppThemeMode.cyberpunk:
        return Icon(Icons.electric_bolt, color: color, size: 18);
    }
  }

  String _getThemeName(AppThemeMode mode, bool isZh) {
    switch (mode) {
      case AppThemeMode.light:
        return isZh ? '清爽亮色' : 'Clear Light';
      case AppThemeMode.dark:
        return isZh ? '经典暗色' : 'Midnight Dark';
      case AppThemeMode.ocean:
        return isZh ? '深海蓝调' : 'Deep Ocean';
      case AppThemeMode.amoled:
        return isZh ? '纯黑省电' : 'AMOLED Pure';
      case AppThemeMode.cyberpunk:
        return isZh ? '赛博朋克' : 'Cyberpunk';
    }
  }
}

