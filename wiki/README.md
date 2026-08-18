# ShareCLIP Project Documentation Wiki

Welcome to the central **ShareCLIP** documentation wiki. ShareCLIP is a premium multi-device photo synchronization and AI-powered local classification ecosystem.

Choose a platform below to view its specific design, protocol, and deployment documentation:

---

## 📱 [Android Mobile Client](file:///d:/AI_serach_image/image_clip_android/wiki/android/README.md)
Contains mobile architecture details, camera scanners, local media database querying, and the BLE/WebRTC native clients.
*   [BLE Signaling Protocol](file:///d:/AI_serach_image/image_clip_android/wiki/android/BLE_Signaling.md): Scan, MTU negotiation, and chunked SDP notification transmission.
*   [WebRTC Channel Protocol](file:///d:/AI_serach_image/image_clip_android/wiki/android/WebRTC_Protocol.md): Direct data links, 16-byte binary packet structures, and flow control.
*   [Permissions Configuration](file:///d:/AI_serach_image/image_clip_android/wiki/android/Permissions.md): Two-stage runtime permission flow, AndroidManifest declarations, Android 13+ granular media permissions, `ACCESS_MEDIA_LOCATION` for GPS EXIF reading, and troubleshooting guide.
*   [Transfer Console Dashboard UI](file:///d:/AI_serach_image/image_clip_android/wiki/android/UI_Dashboard.md): 4-tab sliding dashboard design (Media, Music, Docs, Queue), widget map, design tokens, and interaction model.

---

## 🖥️ [PC Desktop Client](file:///d:/AI_serach_image/image_clip_android/wiki/pc/README.md)
Details the Electron main lifecycle process, ONNX AI classification model integration, and local database ingestion.
*   [Preprocessing & Normalization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/preprocessing_and_normalization.md): MobileCLIP normalization guidelines and pixel scaling.
*   [Model Reparameterization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/model_reparameterization.md): Reparameterizing and exporting MobileCLIP to a single ONNX file.
*   [Packaging & Deployment](file:///d:/AI_serach_image/image_clip_android/wiki/pc/packaging_and_deployment.md): Building the Electron installer with self-contained assets.
*   [Bundle Size Optimization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/bundle_size_optimization.md): Structure breakdown of the Electron package, DirectML GPU binary exclusions, SQLite source/build dependencies removal, and size reduction history.
*   [v1.2 Updates, Stability & Auto-Update Architecture](file:///d:/AI_serach_image/image_clip_android/wiki/pc/v1_2_updates_and_stability.md): Complete guide to persistent logging (`shareclip_YYYY-MM-DD.log`), V8 heap memory optimization (OOM fix), WebRTC 16 KB DataChannel packet chunking (`-5` frame header), network priority AI queue scheduling, DirectML GPU ➔ CPU automatic fallback, zero-waste UDP discovery suppression, and interactive differential auto-updates.

---

## 🧠 [AI Architecture & Zero-Copy SharedArrayBuffer Wiki](file:///d:/AI_serach_image/image_clip_android/wiki/ai_architecture.md)
Contains complete architectural designs, Mermaid dataflow diagrams, sequence diagrams, and low-level zero-copy `SharedArrayBuffer` memory models for MobileCLIP, ONNX multi-threading, SQLite 2048-Byte BLOB persistence, and lock-free inter-worker similarity searching.
*   [Zero-Copy SharedArrayBuffer Architecture Guide](file:///d:/AI_serach_image/image_clip_android/wiki/ai_architecture.md): Hardware tiering (40MB-200MB SAB), single-writer lock-free design, 512-dim Float32Array slicing, 2048-byte Node.js Buffer conversion, and Leader Centroid Clustering.

---

## 🌐 [Web Official Website](file:///d:/AI_serach_image/image_clip_android/wiki/web/README.md)
Details the structure, styling, and design system of the official ShareCLIP product website.
*   [Web Landing Page Codebase](file:///d:/AI_serach_image/image_clip_android/web/): Source files for the Vue 3 + Vite official portal.

---

## 🌍 [Internationalization (i18n)](file:///d:/AI_serach_image/image_clip_android/wiki/i18n.md)
Documents the 20-language support added in **v1.0.1** across all three platforms.
*   [i18n Architecture & String Keys](file:///d:/AI_serach_image/image_clip_android/wiki/i18n.md): Language list, locale files, persistence strategy, Flutter `LocalizationService`, and Vue computed locale binding.

---

## 🚀 [CI/CD & Deployment](file:///d:/AI_serach_image/image_clip_android/wiki/deployment/auto_deploy.md)
Guidelines for automated builds and releases:
*   [Automated Deployment Guide](file:///d:/AI_serach_image/image_clip_android/wiki/deployment/auto_deploy.md): Local PowerShell compilation and GitHub Actions release automation.

---

## 🔭 Features & Roadmap
Implemented and upcoming feature specifications:
*   [📱→🖥️ AI Thumbnail Sync](file:///d:/AI_serach_image/image_clip_android/wiki/features/thumbnail_sync_ai.md): Batch-sync compressed 400×400 JPEG thumbnails from phone to PC via WebRTC DataChannel, auto-trigger MobileCLIP ONNX classification, save to dedicated `thumbnail_sync/` directory, and display results in Link Mobile panel. **Status: ✅ Implemented**
*   [🧠 Core AI Algorithms & Preprocessing](file:///d:/AI_serach_image/image_clip_android/wiki/features/algorithms.md): Detailed explanation of MobileCLIP features extraction, zero-shot category matching, Leader clustering to prevent chaining effect, and the memory buffer allocation bug fix. **Status: ✅ Implemented**
*   [🗺️ 足迹地图 (GPS Image Clustering)](file:///d:/AI_serach_image/image_clip_android/wiki/features/footprint_map.md): Extract GPS EXIF coordinates from phone photos via `ACCESS_MEDIA_LOCATION`, transmit with metadata packets over WebRTC, store in SQLite database, and render on an interactive Leaflet clustered map with thumbnail markers. Includes re-download & re-classify button to reset local cache and trigger full mobile re-sync. **Status: ✅ Implemented**
*   [👤 本地化高精度人脸识别与聚类 (Face Recognition & Clustering)](file:///d:/AI_serach_image/image_clip_android/wiki/features/face_recognition.md): Complete guide to the cascaded face recognition ecosystem — SCRFD 500M detection (3-scale anchors, 0.68 score filter, NMS), MobileFaceNet (512-D ArcFace on unit hypersphere), Zero-Copy `faceSharedBuffer`, WASM SIMD 128-bit dot product acceleration (0.04µs), Average-Linkage with Same-Photo Exclusion clustering rule, SQLite `faces`/`person_clusters` schema, and dynamic in-memory avatar crop stream (`file-sync://?crop=...`). **Status: ✅ Implemented**

---

## 📋 Release Changelog

| Version | Date | Highlights |
|---|---|---|
| **v1.2.50** | 2026-07-22 | 连接成功后彻底关闭 UDP 广播搜机（0 资源浪费）；自动升级交互弹窗发布与差分 MB 流量统计上线。 |
| **v1.2.49** | 2026-07-22 | 传输优先 AI 队列避让（传输照片时 AI 让出 200ms CPU）& 180 秒传输期心跳保护屏障。 |
| **v1.2.48** | 2026-07-22 | DirectML GPU ➔ CPU 自动降级，解决特定显卡驱动报错 `80070057` 导致的 AI 初始化失败。 |
| **v1.2.47** | 2026-07-22 | WebRTC 16 KB 分帧切片协议 (`-5` 标头) 与 Android 端自动重组，解决 20,000+ 照片握手超限断开。 |
| **v1.2.46** | 2026-07-22 | 显式锁定 AppData `ShareCLIP` 目录名，解决默认 `image-clip-classifier` 路径找不到日志问题。 |
| **v1.2.45** | 2026-07-22 | 本地日志持久化系统（`logs/shareclip_YYYY-MM-DD.log`），全量崩退异常拦截，设置一键定位。 |
| **v1.2.44** | 2026-07-22 | 设置页面滚动条与直接 GitHub API 检查更新降级，解决软件退出时的销毁对象异常。 |
| **v1.2.43** | 2026-07-22 | NSIS 差分增量升级 (`differentialPackage`) 与 `.blockmap` 自动打包上传发布。 |
| **v1.2.42** | 2026-07-22 | 升级下载 GitHub 镜像直连降级 & 手机端热点网关 IP 局域网 UDP 解析兼容。 |
| **v1.2.41** | 2026-07-22 | 修复 Android `INSTALL_FAILED_VERSION_DOWNGRADE` APK 安装失败（动态 versionCode 逻辑）。 |
| **v1.2.40** | 2026-07-22 | 优化大容量照片传输与 ONNX 推理队列剥离，消除主事件循环延迟导致的心跳断开。 |
| v1.2.0 | 2026-07-08 | 足迹地图（GPS 聚类）：手机相册 GPS 坐标提取 → WebRTC 传输 → SQLite 存储 → Leaflet 地图聚类气泡展示。 |
| v1.1.0 | 2026-07-08 | 搜索功能修复（BPE tokenizer UTF-8 编码问题导致中文搜索崩溃）；搜索匹配度 0% 自动隐藏。 |
| v1.0.2 | 2026-07-03 | AI Thumbnail Sync — Link Mobile 面板一键同步 400×400 缩略图并触发 MobileCLIP 分类。 |
| v1.0.1 | 2026-06-29 | 20-language i18n support for PC EXE, Android APK, and web portal. |
| v1.0.0 | 2026-06-29 | Initial public release — Android ↔ PC BLE/WebRTC sync, AI MobileCLIP image classification, official website. |

