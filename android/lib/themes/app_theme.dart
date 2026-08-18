import 'package:flutter/material.dart';

enum AppThemeMode {
  light,
  dark,
  ocean,
  amoled,
  cyberpunk,
}

class AppThemes {
  static ThemeData getTheme(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return _lightTheme;
      case AppThemeMode.dark:
        return _darkTheme;
      case AppThemeMode.ocean:
        return _oceanTheme;
      case AppThemeMode.amoled:
        return _amoledTheme;
      case AppThemeMode.cyberpunk:
        return _cyberpunkTheme;
    }
  }

  // 1. Clear Light
  static final ThemeData _lightTheme = ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: const Color(0xFFF8FAFC),
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF7C3AED), // Violet 600
      background: Color(0xFFF8FAFC),
      surface: Colors.white,
      onBackground: Color(0xFF0F172A),
      onSurface: Color(0xFF1E293B),
    ),
    useMaterial3: true,
    dividerColor: const Color(0xFFE2E8F0),
    cardTheme: const CardThemeData(color: Colors.white, elevation: 0),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: const Color(0xFF7C3AED).withOpacity(0.15),
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const TextStyle(color: Color(0xFF7C3AED), fontWeight: FontWeight.bold, fontSize: 12);
        }
        return const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.normal, fontSize: 12);
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const IconThemeData(color: Color(0xFF7C3AED));
        }
        return const IconThemeData(color: Color(0xFF64748B));
      }),
    )
  );

  // 2. Midnight Dark
  static final ThemeData _darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF090D16),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF8B5CF6), // Violet 500
      background: Color(0xFF090D16),
      surface: Color(0xFF0F172A),
      onBackground: Color(0xFFF8FAFC),
      onSurface: Color(0xFFF1F5F9),
    ),
    useMaterial3: true,
    dividerColor: const Color(0xFF1E293B),
    cardTheme: const CardThemeData(color: Color(0xFF0F172A), elevation: 0),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xFF090D16),
      indicatorColor: const Color(0xFF8B5CF6).withOpacity(0.2),
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold, fontSize: 12);
        }
        return const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal, fontSize: 12);
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const IconThemeData(color: Color(0xFF8B5CF6));
        }
        return const IconThemeData(color: Color(0xFF94A3B8));
      }),
    )
  );

  // 3. Deep Ocean
  static final ThemeData _oceanTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF031627),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF0EA5E9), // Sky Blue
      background: Color(0xFF031627),
      surface: Color(0xFF0B243B),
      onBackground: Color(0xFFE0F2FE),
      onSurface: Color(0xFFBAE6FD),
    ),
    useMaterial3: true,
    dividerColor: const Color(0xFF0C4A6E),
    cardTheme: const CardThemeData(color: Color(0xFF0B243B), elevation: 0),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xFF031627),
      indicatorColor: const Color(0xFF0EA5E9).withOpacity(0.2),
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const TextStyle(color: Color(0xFF0EA5E9), fontWeight: FontWeight.bold, fontSize: 12);
        }
        return TextStyle(color: const Color(0xFF38BDF8).withOpacity(0.7), fontWeight: FontWeight.normal, fontSize: 12);
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const IconThemeData(color: Color(0xFF0EA5E9));
        }
        return IconThemeData(color: const Color(0xFF38BDF8).withOpacity(0.7));
      }),
    )
  );

  // 4. AMOLED Pure
  static final ThemeData _amoledTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: Colors.black,
    colorScheme: const ColorScheme.dark(
      primary: Colors.white,
      background: Colors.black,
      surface: Color(0xFF0A0A0A),
      onBackground: Colors.white,
      onSurface: Color(0xFFE5E5E5),
    ),
    useMaterial3: true,
    dividerColor: const Color(0xFF262626),
    cardTheme: const CardThemeData(color: Color(0xFF0A0A0A), elevation: 0),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.black,
      indicatorColor: Colors.white.withOpacity(0.15),
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12);
        }
        return const TextStyle(color: Color(0xFF737373), fontWeight: FontWeight.normal, fontSize: 12);
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const IconThemeData(color: Colors.white);
        }
        return const IconThemeData(color: Color(0xFF737373));
      }),
    )
  );

  // 5. Cyberpunk
  static final ThemeData _cyberpunkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF0F0B1E),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFFF91880), // Neon Pink
      secondary: Color(0xFF00E5FF), // Neon Cyan
      background: Color(0xFF0F0B1E),
      surface: Color(0xFF1E1439),
      onBackground: Color(0xFFFFD5E2),
      onSurface: Color(0xFFE5E0FF),
    ),
    useMaterial3: true,
    dividerColor: const Color(0xFF382375),
    cardTheme: const CardThemeData(color: Color(0xFF1E1439), elevation: 0),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xFF0F0B1E),
      indicatorColor: const Color(0xFFF91880).withOpacity(0.2),
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const TextStyle(color: Color(0xFFF91880), fontWeight: FontWeight.bold, fontSize: 12);
        }
        return const TextStyle(color: Color(0xFF8675AD), fontWeight: FontWeight.normal, fontSize: 12);
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const IconThemeData(color: Color(0xFFF91880));
        }
        return const IconThemeData(color: Color(0xFF8675AD));
      }),
    )
  );
}
