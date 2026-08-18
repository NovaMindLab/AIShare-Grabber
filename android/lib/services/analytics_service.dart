import 'package:flutter/foundation.dart';
import 'package:mixpanel_flutter/mixpanel_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Analytics service wrapper for Mixpanel with strict privacy guarantees & build-time key injection.
class AnalyticsService {
  static const String _prefKeyOptOut = 'shareclip_telemetry_opt_out';

  // Injected at build time via: flutter build apk --dart-define=MIXPANEL_TOKEN=YOUR_KEY
  // Defaults to empty string in open-source repository.
  static const String _mixpanelToken = String.fromEnvironment(
    'MIXPANEL_TOKEN',
    defaultValue: '',
  );

  static Mixpanel? _mixpanel;
  static bool _isInitialized = false;
  static bool _isOptedOut = false;

  /// Initialize Mixpanel Telemetry
  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _isOptedOut = prefs.getBool(_prefKeyOptOut) ?? false;

      if (_mixpanelToken.isEmpty) {
        if (kDebugMode) {
          print('ℹ️ [Analytics] No Mixpanel Token configured. Telemetry running in pure local/disabled mode.');
        }
        return;
      }

      _mixpanel = await Mixpanel.init(
        _mixpanelToken,
        trackAutomaticEvents: false,
      );

      if (_isOptedOut) {
        _mixpanel?.optOutTracking();
      }

      _isInitialized = true;
      if (kDebugMode) {
        print('📊 [Analytics] Mobile Mixpanel initialized successfully.');
      }

      // Track mobile app launch
      track('mobile_app_launch', {
        'platform': 'android',
        'is_debug': kDebugMode,
      });
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ [Analytics] Failed to initialize Mixpanel: $e');
      }
    }
  }

  /// Track a sanitized telemetry event
  static void track(String eventName, [Map<String, dynamic>? properties]) {
    if (!_isInitialized || _isOptedOut || _mixpanel == null) return;

    try {
      final sanitizedProps = <String, dynamic>{
        'platform': 'android',
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        ...?properties,
      };

      _mixpanel?.track(eventName, properties: sanitizedProps);
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ [Analytics] Failed to track "$eventName": $e');
      }
    }
  }

  /// Track feature usage
  static void trackFeature(String featureName, [Map<String, dynamic>? properties]) {
    track('feature_used', {
      'feature_name': featureName,
      ...?properties,
    });
  }

  /// Identify user / distinct device ID
  static void identify(String distinctId) {
    if (!_isInitialized || _isOptedOut || _mixpanel == null || distinctId.isEmpty) return;
    try {
      _mixpanel?.identify(distinctId);
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ [Analytics] Failed to identify: $e');
      }
    }
  }

  /// Toggle user opt-out status
  static Future<void> setOptOut(bool optOut) async {
    _isOptedOut = optOut;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_prefKeyOptOut, optOut);

      if (_mixpanel != null) {
        if (optOut) {
          _mixpanel?.optOutTracking();
        } else {
          _mixpanel?.optInTracking();
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ [Analytics] Failed to set opt out: $e');
      }
    }
  }

  static bool get isEnabled => _isInitialized && !_isOptedOut;
}
