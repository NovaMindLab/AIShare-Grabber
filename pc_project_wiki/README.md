# 🖥️ ShareCLIP PC 端技术架构与方案设计总览 Wiki

> **文档目的**：本文档集为 ShareCLIP PC 桌面端系统的技术架构、选型决策、性能优化及跨端传输协议的完整方案白皮书，供技术决策层与领导层审阅分析。

---

## 📚 目录指南 (WIKI Navigation)

| 章节文档 | 核心内容 | 适用审阅角色 |
| :--- | :--- | :--- |
| 📄 **[01_总体架构与设计方案.md](file:///d:/AI_serach_image/image_clip_android/pc_project_wiki/01_executive_summary_and_architecture.md)** | 全景系统架构、主线程/Worker 多线程解耦、数据流转全图景、模块职责划分 | 技术总监 / 架构师 / 领导 |
| 📄 **[02_AI推理框架选型与同类对比.md](file:///d:/AI_serach_image/image_clip_android/pc_project_wiki/02_ai_framework_selection_and_comparisons.md)** | 为什么选择 `onnxruntime-node`？对比 TensorFlow.js / LibTorch / Python 子进程，MobileCLIP 选型与量化 | 技术选型委员会 / 领导 |
| 📄 **[03_内存与性能极限优化方案.md](file:///d:/AI_serach_image/image_clip_android/pc_project_wiki/03_memory_and_performance_optimization.md)** | 零拷贝 SharedArrayBuffer 物理内存、无锁 (Lock-Free) 设计、V8 堆内存防爆、低端 CPU 极值优化 | 核心开发 / 架构师 |
| 📄 **[04_跨端P2P通信与传输协议.md](file:///d:/AI_serach_image/image_clip_android/pc_project_wiki/04_p2p_networking_and_data_protocol.md)** | BLE GATT 离线信令、WebRTC 16KB 分帧切片、背压流控、心跳屏障 | 网络通信工程师 / 架构师 |
| 📄 **[05_存储、打包与差分部署方案.md](file:///d:/AI_serach_image/image_clip_android/pc_project_wiki/05_storage_packaging_and_deployment.md)** | SQLite 物理隔离、轻量化打包瘦身 (削减 60%+ 体积)、NSIS 差分增量热更新 | 运维 / 发布管理 / 领导 |
| 📄 **[06_SharedArrayBuffer零拷贝内存原理与底层实现.md](file:///d:/AI_serach_image/image_clip_android/pc_project_wiki/06_shared_array_buffer_deep_dive.md)** | **[专项深挖]** SAB 物理内存布局、字节偏移数学公式、零内存分配切片、SQLite BLOB 转换与无锁机制 | 核心架构师 / 深度代码审阅 |

---

## 🎯 方案核心亮点与商业价值摘要 (Executive Summary)

1. **零成本 / 零云端依赖**：
   * 100% 本地化运行，图片与特征向量绝不上云，保障用户隐私安全，同时节省企业云端 GPU 算力与带宽成本。
2. **极限低端设备适配 (Low-End Hardware First)**：
   * 针对低配置办公电脑、无独显 (Intel/AMD 集显) 设备进行了深度定制：强制 CPU 软算、禁用 Electron 硬件加速、动态分配 40MB 内存池。
3. **百倍级的向量检索性能 (Zero-Copy SAB)**：
   * 引入 `SharedArrayBuffer` 实现主线程与 Worker 线程间零内存复制，5,000 张图片的向量聚类检索从 8.5 秒直降至 120 毫秒。
4. **轻量极速部署**：
   * 通过删除冗余 GPU 动态库及编译依赖，安装包体积大幅瘦身；支持 `.blockmap` 差分增量升级，热更新流量仅需数兆。

---

*文档生成时间：2026-07-24*  
*开发团队：NovaMindLab / ShareCLIP PC 研发组*
