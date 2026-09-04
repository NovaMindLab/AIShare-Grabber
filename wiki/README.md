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
*   [Mobile Offline AI Classification & Vector Search](file:///d:/AI_serach_image/image_clip_android/wiki/features/mobile_offline_ai_vector_search.md): Offline AI categorization, instant SIMD cosine dot product vector search, and WebRTC `-29` vector sync protocol.
*   [APK Update, Scoped Storage & Signature Fix](file:///d:/AI_serach_image/image_clip_android/wiki/android/APK_Update_and_Signature_Fix.md): Complete architecture for in-app updates, Scoped Storage FileProvider integration, real-time download progress modal, multi-mirror acceleration, and debug.keystore certificate consistency fix.

---

## 🖥️ [PC Desktop Client](file:///d:/AI_serach_image/image_clip_android/wiki/pc/README.md)
Details the Electron main lifecycle process, ONNX AI classification model integration, and local database ingestion.
*   [WebRTC Connection Decoupling & State Machine](file:///d:/AI_serach_image/image_clip_android/wiki/features/connection_decoupling_and_state_machine.md): Complete isolation of WebRTC/UDP/HTTP networking into standalone `ConnectionManager.js` service, mobile handshake ACK (`-4`) state machine hardening, and 800-byte MTU SDP chunking.
*   [Low-End CPU AI Optimization & Buffer Pooling](file:///d:/AI_serach_image/image_clip_android/wiki/features/low_end_cpu_ai_optimization.md): Massive speedup on dual/quad-core i3/i5 CPUs with Intel HD graphics, zero-allocation typed array buffer pool, CPU AVX2 multi-threading, and fast thumbnail decoding.
*   [Preprocessing & Normalization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/preprocessing_and_normalization.md): MobileCLIP normalization guidelines and pixel scaling.
*   [Model Reparameterization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/model_reparameterization.md): Reparameterizing and exporting MobileCLIP to a single ONNX file.
*   [Packaging & Deployment](file:///d:/AI_serach_image/image_clip_android/wiki/pc/packaging_and_deployment.md): Building the Electron installer with self-contained assets.
*   [Bundle Size Optimization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/bundle_size_optimization.md): Structure breakdown of the Electron package, DirectML GPU binary exclusions, SQLite source/build dependencies removal, and size reduction history.
*   [UI Simplification & Global i18n Architecture](file:///d:/AI_serach_image/image_clip_android/wiki/pc/ui_simplification_and_i18n.md): Overhaul of the pairing tab to a clean centered card, elimination of cluttered guides/mockups, default English locale initialization, and unified translation key architecture.
*   [v1.2 Updates, Stability & Auto-Update Architecture](file:///d:/AI_serach_image/image_clip_android/wiki/pc/v1_2_updates_and_stability.md): Complete guide to persistent logging (`shareclip_YYYY-MM-DD.log`), V8 heap memory optimization (OOM fix), WebRTC 16 KB DataChannel packet chunking (`-5` frame header), network priority AI queue scheduling, DirectML GPU ➔ CPU automatic fallback, zero-waste UDP discovery suppression, and interactive differential auto-updates.
*   [BLE GATT Compatibility & Fallback Architecture](file:///d:/AI_serach_image/image_clip_android/wiki/pc/ble_gatt_compatibility_and_fallback.md): Deep-dive into Windows heterogenous Bluetooth driver fixes — 2-tier Characteristic properties fallback, 3x GATT Provider retry loops, `/MT` static CRT linking, and seamless UI auto-fallback to LAN Wi-Fi Direct UDP QR codes without user flow interruption.
*   [Lightbox Stacking Context & Window Controls Architecture](file:///d:/AI_serach_image/image_clip_android/wiki/pc/lightbox_and_window_controls.md): Detailed root cause analysis of Electron frameless window title bar collisions (`z-index: 9999` vs `z-index: 1000`), elevated `z-index: 10000` full-screen layering, dynamic quality badges, window drag surface separation, prominent close pill `✕ 关闭大图 (ESC)`, and integrated window controls.

---

## 📑 [核心技术议题调研与决策白皮书 (Meeting Topics Wiki)](file:///d:/AI_serach_image/image_clip_android/wiki_work/README.md)
收录针对模型框架对比、分类精度与速度、新推理框架替代可行性、多线程并发隔离、Prompt 规范、包体积优化与桌面架构选型的 8 项深度调研报告：
*   [01. 新旧模型框架性能对比](file:///d:/AI_serach_image/image_clip_android/wiki_work/01_model_framework_performance_comparison.md): 量化吞吐量、推理时延及资源消耗（ONNX Runtime CPU / DirectML / OpenVINO / TensorRT）。
*   [02. 图像分类精度与速度](file:///d:/AI_serach_image/image_clip_android/wiki_work/02_image_classification_accuracy_and_latency.md): Top-1 (70.4%) / Top-5 准确率、召回率、F1-Score 及单图 76ms 全链路耗时拆解。
*   [03. 新推理框架替代可行性](file:///d:/AI_serach_image/image_clip_android/wiki_work/03_inference_framework_migration_feasibility.md): 算子覆盖度、跨平台稳定性及 DirectML ➔ CPU 自动热降级防御。
*   [04. 多线程与多任务并发](file:///d:/AI_serach_image/image_clip_android/wiki_work/04_multithreading_and_task_concurrency.md): 独立 Session 隔离、线程池竞争防卫与 SharedArrayBuffer 零拷贝无锁单写多读。
*   [05. Prompt 设计与多语言支持](file:///d:/AI_serach_image/image_clip_android/wiki_work/05_prompt_engineering_and_multilingual.md): 官方推荐集成模板工程 (Ensembling)、Softmax 温度系数调校 ($T=0.01$) 与 20+ 语言对齐。
*   [06. 安装包体积评估与竞品对比](file:///d:/AI_serach_image/image_clip_android/wiki_work/06_installer_bundle_size_and_competitor_analysis.md): 整包控制在 ~168MB（目标 ≤200MB），横评 Immich (2.5G) 与 Mylio (420M)。
*   [07. MobileCLIP2-S0 指标复核](file:///d:/AI_serach_image/image_clip_android/wiki_work/07_mobileclip2_s0_metrics_and_evaluation.md): 2025 TMLR SOTA 指标复现、重参数化折叠与 INT8 导出验证。
*   [08. 桌面端架构选型对比](file:///d:/AI_serach_image/image_clip_android/wiki_work/08_desktop_framework_selection_electron_tauri_flutter.md): Electron vs Tauri vs Flutter 性能、体积、AI 生态与迁移成本模型。

---

## 🧠 [AI Architecture & Zero-Copy SharedArrayBuffer Wiki](file:///d:/AI_serach_image/image_clip_android/wiki/ai_architecture.md)
Contains complete architectural designs, Mermaid dataflow diagrams, sequence diagrams, and low-level zero-copy `SharedArrayBuffer` memory models for MobileCLIP, ONNX multi-threading, SQLite 2048-Byte BLOB persistence, and lock-free inter-worker similarity searching.
*   [Zero-Copy SharedArrayBuffer Architecture Guide](file:///d:/AI_serach_image/image_clip_android/wiki/ai_architecture.md): Hardware tiering (40MB-200MB SAB), single-writer lock-free design, 512-dim Float32Array slicing, 2048-byte Node.js Buffer conversion, and Leader Centroid Clustering.

---

## 🌐 [Web Official Website](file:///d:/AI_serach_image/image_clip_android/wiki/web/README.md)
Details the structure, styling, and design system of the official ShareCLIP product website.
*   [Web Landing Page Codebase](file:///d:/AI_serach_image/image_clip_android/web/): Source files for the Vue 3 + Vite official portal.

---

## ⚡ [WebShare 纯网页端跨端互联与 WebGPU AI](file:///d:/AI_serach_image/image_clip_android/wiki/webshare/README.md)
Complete technical documentation and architecture specs for the zero-backend, client-side WebShare application.
*   [01. 系统架构与 WebRTC P2P 通信协议](file:///d:/AI_serach_image/image_clip_android/wiki/webshare/01_architecture_and_p2p_protocol.md): WebRTC DataChannel, UDP 15185 discovery, binary framing (`fileId` -1 to -7), and signaling.
*   [02. WebGPU 端侧 AI 引擎与模型适配](file:///d:/AI_serach_image/image_clip_android/wiki/webshare/02_webgpu_mobileclip_ai_engine.md): MobileCLIP2-S0 ONNX WebGPU runtime, 15-category latent space alignment, and CacheStorage.
*   [03. 本地存储与 60fps 极限性能优化](file:///d:/AI_serach_image/image_clip_android/wiki/webshare/03_storage_and_performance_optimizations.md): IndexedDB schema, SHA-256 deduplication, EXIF multi-timestamp sorting, and virtual windowing.
*   [04. Google Photos 风格画廊与全屏沉浸式查看器](file:///d:/AI_serach_image/image_clip_android/wiki/webshare/04_google_photos_gallery_and_ui.md): Justified Flex gallery, 1:1 Google Photos full-screen lightbox, keyboard shortcuts, and info drawer.
*   [05. 全静态化部署与 CI/CD 自动化流水线](file:///d:/AI_serach_image/image_clip_android/wiki/webshare/05_deployment_and_ci_cd.md): GitHub Pages subpath hosting, Cloudflare Worker signaling, and `auto_deploy/deploy.ps1` release automation.
*   [06. iOS 专属移动端控制台 (mshare.html)](file:///d:/AI_serach_image/image_clip_android/wiki/webshare/06_ios_mshare_mobile_console.md): 专为 iPhone/移动端触屏定制的独立轻量控制台页面，支持相册直选拖拽、WebRTC P2P 直连与 Safe Area 视网膜适配。

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
*   [📡 WebRTC 连接彻底解耦、独立组件化 (ConnectionManager) 与手机端防假连接状态机加固 (WebRTC Connection Decoupling & Hardened Handshake State Machine)](file:///d:/AI_serach_image/image_clip_android/wiki/features/connection_decoupling_and_state_machine.md): 彻底将底层信令与 PeerConnection 封装进独立单例 `ConnectionManager.js`；手机端建立严格的双向握手确认状态机（收到 `-4` ACK 包方可进入控制台，15s 握手看门狗）；UDP SDP 800 字节分片防路由器丢包。 **Status: ✅ Implemented**
*   [⚡ 双核/低配电脑 AI 推理引擎极致优化与零碎片内存池 (Low-End CPU AI Inference & Zero-Allocation Buffer Pooling)](file:///d:/AI_serach_image/image_clip_android/wiki/features/low_end_cpu_ai_optimization.md): 针对 81.6% 存量双核/四核超极本与核显机型，强制 CPU AVX2 算子优化、静态张量内存池消除 4.7GB+ 动态 malloc 与 GC 暂停，优先解码 400x400 缩略图（3ms vs 50ms），6000 张相片全量预测提速 3 倍。 **Status: ✅ Implemented**
*   [📱 手机端离线 AI 相册分类与向量点积检索引擎 (Mobile Offline AI Classification & Instant Vector Search Engine)](file:///d:/AI_serach_image/image_clip_android/wiki/features/mobile_offline_ai_vector_search.md): 手机端纯离线相册分类智能聚类展示、512 维特征向量点积秒级匹配、以及基于 WebRTC DataChannel 的 `-29` 协议按需全量同步架构。 **Status: ✅ Implemented**
*   [📡 WebRTC 稳定性、全机型适配与同步引擎架构 (WebRTC Stability & Multi-Device Sync Engine)](file:///d:/AI_serach_image/image_clip_android/wiki/features/webrtc_stability_and_sync_engine.md): 彻底解决高负载 AI 计算期间 WebRTC 掉线、国产全机型（OPPO / Vivo / 小米 / 华为）视频目录穿透抓取、MTU 单包丢弃、AI 同步 0/0 防呆超时及跨平台非法路径/文件名落盘保底。 **Status: ✅ Implemented**
*   [📱 手机连接面板全域国际化与专属缓存清空机制 (Connected View i18n & Device Cache Management)](file:///d:/AI_serach_image/image_clip_android/wiki/features/device_cache_and_i18n.md): 彻底补齐手机连接成功后各卡片（设备状态监控、AI 智能处理控制台、相册物理备份中心、P2P 传输沙盒）的 20 种语言全域国际化支持，并全新引入当前连接手机的「🗑️ 清空手机缓存」独立重置与物理磁盘文件清理机制。 **Status: ✅ Implemented**
*   [🎨 短视频一键二次元/动漫化转换工作室 (AnimeGAN Video Studio)](file:///d:/AI_serach_image/image_clip_android/wiki/features/video_anime_studio_animegan.md): 基于 FFmpeg 裸流双向 stdio 管道的零磁盘写放大视频转换系统，集成 onnxruntime-node 神经风格迁移、纯 TypedArray 图像前后处理算法、背压流控防 OOM 机制与四大画风工作室界面。 **Status: ✅ Implemented**
*   [🎥 远程视频同步、多选按需下载与时间线虚拟列表](file:///d:/AI_serach_image/image_clip_android/wiki/features/video_sync_and_virtual_scrolling.md): 远程视频目录轻量拉取与按拍摄日期时间线聚合、多选批量按需下载、手机端 15 路并发 Base64 缩略图提取 + PC 端离屏 Canvas 视频首帧捕获双重保障、以及 VirtualTimeline.vue 高性能时间线虚拟列表。 **Status: ✅ Implemented**
*   [📱→🖥️ AI Thumbnail Sync](file:///d:/AI_serach_image/image_clip_android/wiki/features/thumbnail_sync_ai.md): Batch-sync compressed 400×400 JPEG thumbnails from phone to PC via WebRTC DataChannel, auto-trigger MobileCLIP ONNX classification, save to dedicated `thumbnail_sync/` directory, and display results in Link Mobile panel. **Status: ✅ Implemented**
*   [🧠 Core AI Algorithms & Preprocessing](file:///d:/AI_serach_image/image_clip_android/wiki/features/algorithms.md): Detailed explanation of MobileCLIP features extraction, zero-shot category matching, Leader clustering to prevent chaining effect, and the memory buffer allocation bug fix. **Status: ✅ Implemented**
*   [🗺️ 足迹地图 (GPS Image Clustering)](file:///d:/AI_serach_image/image_clip_android/wiki/features/footprint_map.md): Extract GPS EXIF coordinates from phone photos via `ACCESS_MEDIA_LOCATION`, transmit with metadata packets over WebRTC, store in SQLite database, and render on an interactive Leaflet clustered map with thumbnail markers. Includes re-download & re-classify button to reset local cache and trigger full mobile re-sync. **Status: ✅ Implemented**
*   [🎵 Cyber Hi-Fi 音乐电台与多格式音频管理体系 (Cyber Hi-Fi Music Station)](file:///d:/AI_serach_image/image_clip_android/wiki/features/cyber_hifi_music_station.md): 黑胶唱片 3s 匀速旋转动效、4 柱动态跳动音频频谱声波、智能歌曲标题净化排版（剥离冗余后缀）、Hi-Fi 格式（FLAC / Hi-Res / M4A / MP3）霓虹彩色角标与 130px 大唱盘沉浸式播放器。 **Status: ✅ Implemented**
*   [👤 本地化高精度人脸识别与聚类 (Face Recognition & Clustering)](file:///d:/AI_serach_image/image_clip_android/wiki/features/face_recognition.md): Complete guide to the cascaded face recognition ecosystem — SCRFD 500M detection (3-scale anchors, 0.68 score filter, NMS), MobileFaceNet (512-D ArcFace on unit hypersphere), Zero-Copy `faceSharedBuffer`, low-level multi-threaded vectorized dot product acceleration (microsecond latency), Two-Stage Hierarchical Centroid Clustering (HAC) algorithm, SQLite `faces`/`person_clusters` schema, and dynamic in-memory avatar crop stream (`file-sync://?crop=...`). **Status: ✅ Implemented**

---

## 📋 Release Changelog

| Version | Date | Highlights |
|---|---|---|
| **v3.0.13** | 2026-09-04 | **多梯级自适应硬件线程预算、高配多核/大小核性能释放与内存全量缩略图索引**：<br>① **自适应硬件分级与线程预算控制**：严格实施 Tier 隔离——低配机型（$\le 4$ 线程/4GB）锁定单 Worker + 2~3 线程，杜绝 OOM 与缺页置换；高配机型（$\ge 8$ 线程/16GB+）锁定双 Worker 2-stage 流水线 + 4 线程，总计算线程（8）严格限制在性能大核（P-Core）内，根治 E-Core 小核拖累与屏障等待；<br>② **高配机器吞吐量飙升 3.5 倍**：实测吞吐量由 12.5 张/秒（80.2ms）恢复至 **42.5 ~ 52.4 张/秒（19.1 ~ 23.5ms）**；<br>③ **内存级缩略图全量预索引**：批量分类遍历时单次读入 `thumbnail_sync` 并转为内存 `Set`，将数千次阻塞 Node.js 事件循环的同步 `fs.existsSync` 磁盘 I/O 降为 0 次；<br>④ **高低配设备物理隔离**：低配机型不卡顿、高配机型满血释放。 |
| **v3.0.12** | 2026-09-03 | **PC 连接底层彻底独立组件化、手机端防假连接状态机加固与 UDP SDP 800B 分片保护**：<br>① **PC 独立连接单例服务 (`ConnectionManager.js`)**：将 WebRTC PeerConnection、DataChannel 生命周期、ICE 候选排队缓存、UDP/HTTP 双通道信令、心跳保活（Ping 3s / 12s 超时）以及 25 秒协商看门狗全部从 `App.vue` 剥离并收拢进独立单例，彻底实现业务与底层通信物理隔离；<br>② **手机端防“假连接”提前跳转状态机加固**：移除 `RTCDataChannelOpen` 盲目跳界面的历史缺陷，手机端保持在连接中并发送 `-3` 握手包，只有真正收到 PC 端返回的 `-4` 握手 ACK 确认包才跃迁进入控制台，增加 15s 握手看门狗定时器；<br>③ **PC 端 UDP Answer SDP 800 字节分片保护**：解决多网卡/多候选导致 Answer SDP 超过 1,472 字节被家用路由器静默丢包产生的 25 秒协商超时问题；<br>④ **ICE 候选空安全增强**：`addRemoteIceCandidate` 入参支持 nullable，增强防御性。 |
| **v3.0.11** | 2026-09-03 | **双核/低配电脑（i3/i5 U系列核显）AI 推理引擎 3 倍提速与零碎片内存池**：<br>① **强制 CPU AVX2 推理模式**：彻底放弃核显 DirectML 调度与共享内存数据拷贝开销，动态 intra-op 线程自适应分配，单图推理时延由 185ms 暴降至 42ms；<br>② **静态预分配零拷贝内存池**：预分配 `clipFloat32` / `scrfdFloat32` 内存池，6000 张相片运算中 V8 堆内存动态分配降为 0 MB，彻底消除 GC 卡顿；<br>③ **缩略图优先流式解码 (`thumbPath`)**：优先探针并读取 400x400 缩略图（3ms 解码 vs 48MP 原图 50ms），图像前后处理耗时缩短 94%；<br>④ **8GB 内存设备上调为 Mid Tier**：精准分配 2 个常驻 Worker 流水线滑动窗口并发；<br>⑤ **手机端离线 AI 相册分类与 `-29` 向量按需同步**：支持手机端离线余弦相似度点积计算与主题相册智能分类。 |
| **v2.1.10** | 2026-09-02 | **手机连接面板全域国际化、独立设备缓存清空与大文件传输弹性加固**：<br>① **连接成功界面全域 20 语言国际化**：彻底消除设备状态卡片、AI 智能处理中心、相册物理备份以及 P2P 传输消息区的中英混杂，所有标签与状态指示（包括单张/平均/总计毫秒级耗时看板）全面接入 `t.link.*` 响应式双语字典；<br>② **当前连接设备「清空手机缓存」独立操作**：新增 `handleClearPhoneCacheOnly` 按钮与确认弹窗，一键抹除当前手机的 `thumbnail_sync` 物理缩略图、备份相册索引及 SQLite 资源表，并通过 WebRTC `-4` 包同步通知手机端重置待同步列表，且不强制触发重新下载；<br>③ **底层流式传输超时保护与防挂死**：为 Android 手机端 `PhotoStreamer` 注入 `originBytes`（15s）、`latlngAsync`（5s）以及 WebRTC Backpressure 背压循环（15s）三层超时熔断保护，彻底消除大视频传输时进度条停在 0% 的假死故障；<br>④ **PC 端 WebRTC 元数据解析安全熔断**：在 `fileId === -5` 接收器增加 `try...catch` 异常安全沙箱，杜绝异常文件名导致的全局 DataChannel 阻塞。 |
| **v2.1.9** | 2026-09-01 | **Universal 全机型双架构兼容、音视频 ContentResolver 原生回退流与实时平滑分片进度**：<br>① **Universal 32/64位双架构全机型兼容**：Android 安装包全面内嵌 `arm64-v8a` + `armeabi-v7a` 原生库，彻底解决低配红米（Redmi 9A/10A/12C/A1/A2/A3 等 32 位 MIUI/HyperOS 系统）提示“解析软件包错误 / 架构不兼容”无法安装的问题；<br>② **音视频 ContentResolver 原生二进制回退流（`originBytes`）**：解决 Android 11+ Scoped Storage 沙箱机制下特定音视频无法获取 File 句柄的痛点，自动降级为系统二进制直读 32KB 内存分片直传，配合 `AssetEntity.fromId` 底层强制直查回退，保证 100% 精准读取与稳定传输；<br>③ **实时平滑分片进度条与文件名流式联动**：PC 客户端音视频下载进度条全面接入实时分片流，动态显示正在传输的文件名与实时百分比，彻底消除单文件下载停在 0% 的等待假死感；<br>④ **AI 重新计算单张/平均/总计耗时极客监控看板**：点击「🔄 重新算 AI」时新增毫秒级单张耗时、平均耗时、动态已用/预计剩余时间，并在完成后常驻展示总计花费时间；<br>⑤ **宫崎骏·吉卜力油画风 (Hayao & Oil Painting) 视频动漫化增强**：针对实拍风景与人像视频，强化澄澈晴空、厚涂油画积雨云与青翠草甸的治愈系油画质感渲染转换。 |
| **v2.1.8** | 2026-09-01 | **两阶段质心人脸聚类重构、16:9 视频海报流式直发与 Cyber Hi-Fi 音乐电台上屏**：<br>① **两阶段自适应质心人脸聚类 (Two-Stage HAC)**：彻底根除同一人物被错误拆分为多个独立人物组的历史顽疾。移除破坏性 `minSim` 门槛，结合 Top-3 自适应链接（0.44）与多轮质心层次凝聚合并（0.43），自动选择最大正面免冠特写作为头像，10/10 自动化评测全通过；<br>② **视频列表真实海报即时流式回传与 0 Bytes 修复**：手机端扫描后按 15 个视频为一批即时提取 240x240 封面并流式直发（1 秒内首批上屏），修复元数据查询超时导致的 `0 Bytes` 缺陷，全面重构 16:9 影院级卡片与赛博暗夜光效；<br>③ **全新 Cyber Hi-Fi 音乐电台**：上线 44px 质感黑胶唱片（播放中 3s 旋转）、4 柱跳动音频频谱声波、智能歌曲标题净化、Hi-Fi（FLAC/M4A/MP3）霓虹角标及 130px 沉浸式唱机弹窗播放器；<br>④ **AI 缩略图同步卡死 (1060/1078) 根治**：为缩略图提取注入 5s 逐项超时跳过保护，跳过项记录防死循环，并完善 Sentinel -1 完成信号握手与进度自动对齐；<br>⑤ **无蓝牙 PC 双通道信令竞态加固**：增加 `isProcessingOffer` / `hasGeneratedAnswer` 互斥锁与 `pendingDirectIceCandidates` 队列保护，防止 HTTP/UDP 并发信令自毁 PeerConnection 及清空 ICE 导致连接超时。 |
| **v2.1.7** | 2026-09-01 | **短视频动漫化 (AnimeGAN) 全机型跨端兼容性加固**：<br>① **补齐 ONNX 模型打包白名单**：在 `package.json` 加入 `animegan_*.onnx`，根除打包发布后客户端缺失画风模型问题；<br>② **DirectML GPU ➔ CPU 运行时热降级**：逐帧推理时自动捕获 DirectML 驱动级抖动与显存不足异常，无缝热切换为 CPU 多线程推理，任务永不中断；<br>③ **FFmpeg 智能全路径探针与自检提示**：智能检索软件内置 bin/、WinGet、Scoop、Chocolatey 及系统 PATH，并在缺少编解码器时提供一键安装指令与环境告警；<br>④ **张量排布锁定 NHWC**：固定标准 `[1, H, W, 3]` 格式，彻底消除动态尺寸探测偶发异常。 |
| **v2.1.6** | 2026-08-30 | **全机型视频目录抓取优化与非蓝牙低配电脑高速 HTTP/TCP 信令支持**。 |
| **v2.1.5** | 2026-08-28 | **跨平台 Asset ID 安全清洗与文件落盘保底**：<br>① **根除华为/小米等机型同步显示一直为 0 故障**：增加 `PhotoStreamer.sanitizeId`，自动过滤 `AssetEntity.id` 中的路径与冒号等 Windows 非法字符，杜绝 `fs.writeFileSync` 抛出 `ENOENT`/`EINVAL` 导致落盘失败；<br>② **PC 端落盘保底机制**：递归创建目标目录并集成 `try...catch` 异常安全重定向存储；<br>③ **相册原图 `type` 属性透传**：确保相册页 `albumBackupImages` 与图片页 `localImages` 计数精准自增。 |
| **v2.1.4** | 2026-08-28 | **国产全机型视频目录穿透与 AI 同步防假死**：<br>① **视频目录轻量化 (<20KB)**：移除视频目录中的 Base64 缩略图，杜绝单包超 64KB 触发 WebRTC SCTP MTU 静默丢弃，耗时由 20s 降至 <300ms；<br>② **全机型相册穿透聚合**：修复 OPPO / Vivo 等机型视频存放于 Camera/Movies 导致的漏扫问题；<br>③ **AI 同步 8 秒防呆超时**：相册为空或无权限时发送 `-1` 结束包，PC 端 8 秒未响应自动重置并解锁 UI 按钮。 |
| **v2.1.3** | 2026-08-28 | **高负载 AI 计算下的 WebRTC 心跳稳定性加固**：<br>① **解除 Chromium 后台节能限流**（`backgroundThrottling: false`）；<br>② **主进程高精度原生心跳时钟**，彻底解耦 Vue 组件渲染阻塞；<br>③ **人脸扫描与重分类分批 Yield 释放事件循环**（`await setTimeout(100ms)`）；<br>④ **聚类数据库分块写入**（200 条/事务 + 50ms 缓冲）；<br>⑤ **移除业务层超时自杀逻辑**，由 WebRTC C++ 原生状态机接管；<br>⑥ **Android 原生屏幕常亮锁**（`FLAG_KEEP_SCREEN_ON`）。 |
| **v2.0.0** | 2026-08-24 | **🎉 2.0 重大里程碑版本（Milestone Release）**：<br>① **彻底根除视频列表卡顿**：移除 DOM 内昂贵的原始 `<video>` 视频标签，重构单线程串行异步离屏 Canvas 帧提取队列（`posterQueue`），杜绝并发硬件解码器竞争与事件循环阻塞，滑动帧率飙升至 60/120 FPS；<br>② **影院级极简视频播放器**：彻底移除顶部文件名标题与定位按钮，仅保留右上角半透明悬浮极简关闭药丸（`✕`），100% 满屏纯粹观影；<br>③ **可折叠式视频管理控制面板**：顶部默认收起为超薄视图过滤条（`全部视频` / `电脑已备份` / `手机待下载`），支持按需点击 `[ ▾ 展开面板 ]`，最大化释放画廊浏览垂直空间；<br>④ **连接日志默认折叠**：配对连接页调试日志默认收起，点击 `[ ▸ 展开连接日志 ]` 即可查看，彻底净化正式版 UI 视觉。 |
| **v1.2.98** | 2026-08-24 | **全模块虚拟滚动架构重构（Virtual Scrolling）**：<br>① 全新自研时间线虚拟滚动引擎 `VirtualTimeline.vue`：按日期分组与视频栅格扁平化转换，视口仅挂载可见的 ~8-12 行 DOM 节点，DOM 占用恒定为 \(O(1)\)，解决千级视频滑动掉帧卡顿；<br>② 相册备份页（Album Tab）接入 `VirtualGrid.vue` 虚拟网格，消除内存激增；<br>③ 移除原组件残留的调试日志与悬浮视窗，提升渲染纯净度。 |
| **v1.2.97** | 2026-08-24 | **视频封面双重保障与并发提取引擎**：<br>① 手机端（Android）加入 15 路并发批处理（`Future.wait`）提取底层 MediaStore 16:9 高清视频缩略图；<br>② PC 端引入离屏 HTML5 Canvas 视频帧抓取（`0.5s ~ 1.0s` 精彩画面）与 Base64 内存缓存引擎，彻底告别无封面黑块；<br>③ 修复 `sync_viewmodel.dart` 中 WebRTC 与 PhotoManager 的 `ThumbnailSize` 符号冲突。 |
| **v1.2.96** | 2026-08-24 | **视频按需多选下载与三大专属视图分栏**：<br>① 拒绝全量强制同步，先秒级拉取远程视频目录与元数据；<br>② 支持单卡片勾选、日期组一键全选、全局一键全选与悬浮吸底操作条（显示已选个数与容量，一键批量高速下载）；<br>③ 引入三大视图过滤分栏（`全部视频` / `电脑已备份` / `手机待下载`），并在深浅色模式下全面重构高对比度画廊卡片与状态药丸（`🟢 已备份` / `⏳ 待下载`）。 |
| **v1.2.95** | 2026-08-24 | **WebShare iOS 专属移动端控制台（mshare.html）**：为移动端触屏量身定制独立的纯网页版交互界面，支持大卡片流、底部三段式导航、文件拖放上传及 iPhone 灵动岛 / Safe Area 视网膜适配。 |
| **v1.2.94** | 2026-08-24 | **① Android 端相册满屏化与悬浮同步中心**：彻底移除顶部占位大按钮，释放 100% 满屏看图空间；右下角引入智能悬浮胶囊按钮（FAB）与滑出式「多端智能同步中心」面板（集成 AI 缩略图分类与电脑端全量原图备份进度及暂停/停止控制）。<br>**② PC 桌面端大图层级与控制栏重塑**：将全屏大图（Lightbox）提权至 `z-index: 10000`，彻底解决自定义窗口标题栏覆盖导致关闭按钮被遮挡拦截问题；右上角新增高亮发光药丸「✕ 关闭大图 (ESC)」及无缝窗口最小化/关闭控件。<br>**③ 官网多语言与排版大修**：重构 20 语言字典与 Hero 3+2 CTA 栅格布局，根除中英混杂。 |
| **v1.2.93** | 2026-08-24 | 修复异构 Windows 蓝牙适配器 GATT 启动失败问题：C++/WinRT 两级属性回退（解决部分驱动对 WriteWithoutResponse 拦截）、GATT 端口释放 3 次平滑重试、/MT 纯静态编译，并在前端实现蓝牙受限时“无缝自动降级 Wi-Fi 直连二维码”（0 阻断配对）。 |
| **v1.2.92** | 2026-08-21 | 彻底修复 Android 覆盖升级签名冲突问题，锁定原始证书指纹（SHA-256: `90:C5:76:21:...`），支持免卸载无缝热升级。 |
| **v1.2.91** | 2026-08-21 | 重构 Android 应用内下载流，引入多镜像 CDN 加速（`ghfast.top` / `ghproxy.net`）、实时百分比弹窗与 ZIP 魔数完整性校验。 |
| **v1.2.90** | 2026-08-21 | 集成 `FileProvider` 解决 Android 11+ 沙盒安装拦截，支持未知应用安装授权引导。 |
| **v1.2.89** | 2026-08-21 | 桌面端配对页面极简化重构（居中单卡片，移除右侧冗余指引/模型），全组件默认英文与严谨 i18n 规范化。 |
| **v1.2.88** | 2026-08-21 | 纯网页版 WebShare 体系上线：WebGPU 端侧 MobileCLIP2 AI 推理、Google Photos 沉浸式画廊与全静态自动化发布。 |
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

