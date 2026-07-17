import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../themes/app_theme.dart';

class ThemeService extends ChangeNotifier {
  static const String _keyTheme = 'pref_app_theme_mode';
  AppThemeMode _themeMode = AppThemeMode.light;

  ThemeService() {
    _loadTheme();
  }

  AppThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode != AppThemeMode.light;

  ThemeData get themeData => AppThemes.getTheme(_themeMode);

  Future<void> setThemeMode(AppThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyTheme, mode.name);
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final savedTheme = prefs.getString(_keyTheme);
    if (savedTheme != null) {
      _themeMode = AppThemeMode.values.firstWhere(
        (e) => e.name == savedTheme,
        orElse: () => AppThemeMode.light,
      );
      notifyListeners();
    }
  }
}
