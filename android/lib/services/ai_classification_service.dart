import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Represents a Category with its name, icon, and 512-dim embedding vector
class AiCategory {
  final String name;
  final Float32List? vector;
  final String? vectorBase64;

  AiCategory({
    required this.name,
    this.vector,
    this.vectorBase64,
  });

  String get shortName {
    // E.g. "🏞️ 乡村与自然风景 (Landscape)" -> "自然风景"
    final clean = name.replaceAll(RegExp(r'^[^\w\s\u4e00-\u9fa5]+'), '').trim();
    if (clean.contains('(')) {
      return clean.split('(').first.trim();
    }
    return clean;
  }

  String get icon {
    // Extract leading emoji if any
    final match = RegExp(r'^(\p{Emoji}|\u2705|\u2600|\u2708|\u26bd|[^\w\s\u4e00-\u9fa5])+', unicode: true).firstMatch(name);
    return match != null ? match.group(0)!.trim() : '🏷️';
  }
}

/// Represents an item's AI classification result and vector
class AiPhotoItem {
  final String id;
  final List<Map<String, dynamic>> predictions;
  final Float32List? vector;
  final String? vectorBase64;

  AiPhotoItem({
    required this.id,
    required this.predictions,
    this.vector,
    this.vectorBase64,
  });

  String? get topCategory {
    if (predictions.isNotEmpty) {
      return predictions.first['category']?.toString();
    }
    return null;
  }

  double get topScore {
    if (predictions.isNotEmpty) {
      final scoreVal = predictions.first['score'];
      if (scoreVal is num) return scoreVal.toDouble();
    }
    return 0.0;
  }
}

class AiClassificationService extends ChangeNotifier {
  static const String _kCategoriesKey = 'ai_synced_categories_v1';
  static const String _kPhotosKey = 'ai_synced_photos_v1';
  static const String _kThresholdKey = 'ai_similarity_threshold_v1';
  static const String _kLastSyncTimeKey = 'ai_last_sync_time_v1';

  final List<AiCategory> _categories = [];
  final Map<String, AiPhotoItem> _photoItems = {};
  double _threshold = 0.22; // Default similarity threshold for category matching
  DateTime? _lastSyncTime;
  bool _isLoaded = false;

  List<AiCategory> get categories => List.unmodifiable(_categories);
  Map<String, AiPhotoItem> get photoItems => Map.unmodifiable(_photoItems);
  double get threshold => _threshold;
  DateTime? get lastSyncTime => _lastSyncTime;
  bool get isLoaded => _isLoaded;
  int get syncedPhotoCount => _photoItems.length;
  int get categoryCount => _categories.length;

  AiClassificationService() {
    _loadFromLocal();
  }

  /// Decode base64 string to Float32List
  static Float32List? decodeBase64Vector(String? base64Str) {
    if (base64Str == null || base64Str.isEmpty) return null;
    try {
      final bytes = base64Decode(base64Str);
      return bytes.buffer.asFloat32List(bytes.offsetInBytes, bytes.lengthInBytes ~/ 4);
    } catch (e) {
      debugPrint('[AiService] Base64 vector decode error: $e');
      return null;
    }
  }

  /// Ultra-fast cosine similarity between two 512-dim vectors (pure Dart, ~1 microsecond)
  static double cosineSimilarity(Float32List a, Float32List b) {
    if (a.length != b.length) return 0.0;
    double dot = 0.0;
    double normA = 0.0;
    double normB = 0.0;
    for (int i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA <= 0.0 || normB <= 0.0) return 0.0;
    return dot / (sqrt(normA) * sqrt(normB));
  }

  /// Load cached categories and vectors from local SharedPreferences
  Future<void> _loadFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _threshold = prefs.getDouble(_kThresholdKey) ?? 0.22;
      final syncMs = prefs.getInt(_kLastSyncTimeKey);
      if (syncMs != null && syncMs > 0) {
        _lastSyncTime = DateTime.fromMillisecondsSinceEpoch(syncMs);
      }

      final categoriesJson = prefs.getString(_kCategoriesKey);
      if (categoriesJson != null && categoriesJson.isNotEmpty) {
        final List<dynamic> catList = jsonDecode(categoriesJson);
        _categories.clear();
        for (final item in catList) {
          final name = item['name']?.toString() ?? '';
          final vecB64 = item['vector']?.toString();
          _categories.add(AiCategory(
            name: name,
            vector: decodeBase64Vector(vecB64),
            vectorBase64: vecB64,
          ));
        }
      }

      final photosJson = prefs.getString(_kPhotosKey);
      if (photosJson != null && photosJson.isNotEmpty) {
        final List<dynamic> pList = jsonDecode(photosJson);
        _photoItems.clear();
        for (final item in pList) {
          final id = item['id']?.toString() ?? '';
          final vecB64 = item['vector']?.toString();
          final List<dynamic> rawPreds = item['predictions'] ?? [];
          final preds = rawPreds.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _photoItems[id] = AiPhotoItem(
            id: id,
            predictions: preds,
            vector: decodeBase64Vector(vecB64),
            vectorBase64: vecB64,
          );
        }
      }

      _isLoaded = true;
      debugPrint('[AiService] Loaded ${_categories.length} categories, ${_photoItems.length} photos from cache.');
      notifyListeners();
    } catch (e) {
      debugPrint('[AiService] Load from local failed: $e');
      _isLoaded = true;
      notifyListeners();
    }
  }

  /// Import sync payload from PC (packet -30)
  Future<void> importSyncPayload(Map<String, dynamic> data) async {
    try {
      final rawCategories = data['categories'];
      if (rawCategories is List) {
        _categories.clear();
        for (final item in rawCategories) {
          final name = item['name']?.toString() ?? '';
          final vecB64 = item['vector']?.toString();
          _categories.add(AiCategory(
            name: name,
            vector: decodeBase64Vector(vecB64),
            vectorBase64: vecB64,
          ));
        }
      }

      final rawPhotos = data['photos'];
      if (rawPhotos is List) {
        for (final item in rawPhotos) {
          final id = item['id']?.toString() ?? '';
          final vecB64 = item['vector']?.toString();
          final List<dynamic> rawPreds = item['predictions'] ?? [];
          final preds = rawPreds.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _photoItems[id] = AiPhotoItem(
            id: id,
            predictions: preds,
            vector: decodeBase64Vector(vecB64),
            vectorBase64: vecB64,
          );
        }
      }

      _lastSyncTime = DateTime.now();
      notifyListeners();

      // Persist to SharedPreferences in background
      _saveToLocal();
      debugPrint('[AiService] Successfully imported ${_categories.length} categories and ${_photoItems.length} photo vectors.');
    } catch (e, stack) {
      debugPrint('[AiService] Import sync payload error: $e\n$stack');
    }
  }

  Future<void> _saveToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_lastSyncTime != null) {
        await prefs.setInt(_kLastSyncTimeKey, _lastSyncTime!.millisecondsSinceEpoch);
      }
      await prefs.setDouble(_kThresholdKey, _threshold);

      final catData = _categories.map((c) => {
        'name': c.name,
        'vector': c.vectorBase64,
      }).toList();
      await prefs.setString(_kCategoriesKey, jsonEncode(catData));

      final photosData = _photoItems.values.map((p) => {
        'id': p.id,
        'predictions': p.predictions,
        'vector': p.vectorBase64,
      }).toList();
      await prefs.setString(_kPhotosKey, jsonEncode(photosData));
    } catch (e) {
      debugPrint('[AiService] Save to local failed: $e');
    }
  }

  /// Change similarity threshold ("分类自由")
  void setThreshold(double value) {
    if ((_threshold - value).abs() > 0.001) {
      _threshold = value;
      notifyListeners();
      SharedPreferences.getInstance().then((prefs) {
        prefs.setDouble(_kThresholdKey, _threshold);
      });
    }
  }

  /// Returns map of category name -> count of local photos matching it
  Map<String, int> getCategoryCounts(List<AssetEntity> localPhotos) {
    final Map<String, int> counts = {};
    for (final cat in _categories) {
      counts[cat.name] = 0;
    }

    for (final photo in localPhotos) {
      final item = _photoItems[photo.id];
      if (item == null) continue;

      // If photo has precomputed predictions from PC
      final topCat = item.topCategory;
      final topScore = item.topScore;

      if (topCat != null && topScore >= _threshold) {
        counts[topCat] = (counts[topCat] ?? 0) + 1;
      } else if (item.vector != null) {
        // Fallback: On-device instant cosine similarity against categories
        String? bestCat;
        double bestSim = -1.0;
        for (final cat in _categories) {
          if (cat.vector == null) continue;
          final sim = cosineSimilarity(item.vector!, cat.vector!);
          if (sim > bestSim) {
            bestSim = sim;
            bestCat = cat.name;
          }
        }
        if (bestCat != null && bestSim >= _threshold) {
          counts[bestCat] = (counts[bestCat] ?? 0) + 1;
        }
      }
    }
    return counts;
  }

  /// Filter local photos matching a specific category
  List<AssetEntity> getPhotosForCategory(String categoryName, List<AssetEntity> localPhotos) {
    final List<AssetEntity> matched = [];
    final AiCategory? targetCategory = _categories.firstWhere(
      (c) => c.name == categoryName,
      orElse: () => AiCategory(name: categoryName),
    );

    for (final photo in localPhotos) {
      final item = _photoItems[photo.id];
      if (item == null) continue;

      final topCat = item.topCategory;
      final topScore = item.topScore;

      if (topCat == categoryName && topScore >= _threshold) {
        matched.add(photo);
      } else if (item.vector != null && targetCategory?.vector != null) {
        final sim = cosineSimilarity(item.vector!, targetCategory!.vector!);
        if (sim >= _threshold) {
          matched.add(photo);
        }
      }
    }
    return matched;
  }
}
