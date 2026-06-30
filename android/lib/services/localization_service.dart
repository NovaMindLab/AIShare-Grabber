import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalizationService extends ChangeNotifier {
  static const String _keyLang = 'pref_app_language';
  String _currentLocale = 'en'; // Defaults to English!

  LocalizationService() {
    _loadLanguage();
  }

  String get currentLocale => _currentLocale;

  static final Map<String, String> languages = {
    'en': 'English',
    'zh': '简体中文',
    'zh-TW': '繁體中文',
    'ja': '日本語',
    'ko': '한국어',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'ru': 'Русский',
    'pt': 'Português',
    'vi': 'Tiếng Việt',
    'th': 'ไทย',
    'id': 'Bahasa Indonesia',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'tr': 'Türkçe',
    'pl': 'Polski',
    'nl': 'Nederlands',
    'sv': 'Svenska'
  };

  static final Map<String, Map<String, String>> _locales = {
    'en': {
      'homeTitle': 'ShareCLIP Companion',
      'disconnected': 'Disconnected',
      'connected': 'Connected',
      'linkPc': 'Scan QR to Connect',
      'linkPcDesc': 'Scan the PC QR code to start syncing',
      'localMedia': 'Local Gallery',
      'items': 'items',
      'permissionTitle': 'Permission Required',
      'permissionDesc': 'ShareCLIP uses the camera to scan connection QR codes and Bluetooth to discover and exchange network paths with the desktop application.',
      'grantBtn': 'Grant Permissions',
      'connecting': 'Connecting PC...',
      'connectingDesc': 'Exchanging WebRTC parameters via BLE GATT signaling channel.',
      'connFailed': 'Connection Failed',
      'connFailedDesc': 'Could not pair with PC. Please check Bluetooth and Wi-Fi configurations.',
      'retry': 'Retry Pairing',
      'tabMedia': 'Media',
      'tabMusic': 'Music',
      'tabDocs': 'Docs',
      'tabQueue': 'Queue',
      'send': 'Send',
      'receiving': 'Receiving file...',
      'transmitting': 'Transmitting file...',
      'queueEmpty': 'No active transfers',
      'musicEmpty': 'No music tracks found',
      'docsEmpty': 'No documents chosen',
      'pickDocs': 'Pick Document Files',
      'scannerBanner': 'Align the PC QR code inside the frame',
      'selectLanguage': 'Select Language',
    },
    'zh': {
      'homeTitle': 'ShareCLIP 手机伴侣',
      'disconnected': '未连接',
      'connected': '已连接',
      'linkPc': '扫码连接电脑',
      'linkPcDesc': '扫描 PC 客户端二维码建立直连同步',
      'localMedia': '本地媒体',
      'items': '项',
      'permissionTitle': '授权管理',
      'permissionDesc': '本应用需要摄像头权限扫码建立配对，并需要蓝牙与定位权限以通过蓝牙广播发现并与桌面管理端握手连接。',
      'grantBtn': '授予权限',
      'connecting': '正在连接电脑...',
      'connectingDesc': '正在通过蓝牙低功耗信令通道协商 WebRTC 握手参数。',
      'connFailed': '连接失败',
      'connFailedDesc': '无法与电脑成功配对，请检查电脑同步服务是否开启并重试。',
      'retry': '重试连接',
      'tabMedia': '📸 媒体',
      'tabMusic': '🎵 音乐',
      'tabDocs': '📄 文档',
      'tabQueue': '📥 队列',
      'send': '发送',
      'receiving': '正在接收电脑文件...',
      'transmitting': '正在发送文件...',
      'queueEmpty': '暂无传输中的任务',
      'musicEmpty': '暂无本地音乐资源',
      'docsEmpty': '暂无已选择的文档',
      'pickDocs': '选择本地文档',
      'scannerBanner': '请将电脑端的二维码对准框内',
      'selectLanguage': '选择语言',
    },
    'zh-TW': {
      'homeTitle': 'ShareCLIP 手機伴侶',
      'disconnected': '未連線',
      'connected': '已連線',
      'linkPc': '掃碼連線電腦',
      'linkPcDesc': '掃描 PC 客戶端二維碼建立直連同步',
      'localMedia': '本地媒體',
      'items': '項',
      'permissionTitle': '授權管理',
      'permissionDesc': '本應用需要攝像頭權限掃碼建立配對，並需要藍牙與定位權限以通過藍牙廣播發現並與桌面管理端握手連線。',
      'grantBtn': '授予權限',
      'connecting': '正在連線電腦...',
      'connectingDesc': '正在通過藍牙低功耗信令通道協商 WebRTC 握手參數。',
      'connFailed': '連線失敗',
      'connFailedDesc': '無法與電腦成功配對，請檢查電腦同步服務是否開啟並重試。',
      'retry': '重試連線',
      'tabMedia': '📸 媒體',
      'tabMusic': '🎵 音樂',
      'tabDocs': '📄 文檔',
      'tabQueue': '📥 隊列',
      'send': '發送',
      'receiving': '正在接收電腦檔案...',
      'transmitting': '正在發送檔案...',
      'queueEmpty': '暫無傳輸中的任務',
      'musicEmpty': '暫無本地音樂資源',
      'docsEmpty': '暫無已選擇的文檔',
      'pickDocs': '選擇本地文檔',
      'scannerBanner': '請將電腦端的二維碼對準框內',
      'selectLanguage': '選擇語言',
    }
  };

  String get(String key) {
    if (_locales[_currentLocale]?.containsKey(key) ?? false) {
      return _locales[_currentLocale]![key]!;
    }
    // Fallback to English
    return _locales['en']![key] ?? key;
  }

  Future<void> setLanguage(String langCode) async {
    if (!languages.containsKey(langCode)) return;
    _currentLocale = langCode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLang, langCode);
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final savedLang = prefs.getString(_keyLang);
    if (savedLang != null && languages.containsKey(savedLang)) {
      _currentLocale = savedLang;
      notifyListeners();
    }
  }

  // Prepopulate other languages with English clone tags to guarantee safety
  static void initializeLocales() {
    languages.forEach((code, name) {
      if (!_locales.containsKey(code)) {
        final cloned = Map<String, String>.from(_locales['en']!);
        cloned['homeTitle'] = '${cloned['homeTitle']} ($name)';
        _locales[code] = cloned;
      }
    });
  }
}

// Run static initializer
final _initialized = () {
  LocalizationService.initializeLocales();
  return true;
}();
