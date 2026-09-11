# MobileCLIP Album AI Classifier - Project Wiki

欢迎来到本项目 Wiki！本知识库详细记录了在开发和优化本地 AI 相册分类应用（基于 Electron + Vue 3 + Vite + ONNX Runtime）过程中遇到的关键技术问题、根本原因分析以及最终的解决方案。

---

## 📂 Wiki 目录

### 1. [本地图片加载修复：协议处理器路径解析](file:///d:/AI_serach_image/image_clip/wiki/broken_image_fix.md)
*   **内容**：分析本地图片在 Electron 中显示为“烂图”的根源，如何通过调整自定义 `local://` 协议的 URL 构造（三斜杠 `local:///`）与后端路径解析来解决 Windows 盘符丢失的问题。

### 2. [模型重参数化与导出：解决 RepMixer 崩溃](file:///d:/AI_serach_image/image_clip/wiki/model_reparameterization.md)
*   **内容**：探讨 Apple 官方 `ml-mobileclip` 库在重参数化过程中的 `AttributeError` 崩溃。提供通用的 `safe_reparameterize_model` 绕过方案，并说明如何将模型导出并扁平化为单一自包含的 ONNX 文件。

### 3. [图像预处理修正：移除均值/标准差标准化](file:///d:/AI_serach_image/image_clip/wiki/preprocessing_and_normalization.md)
*   **内容**：揭示模型分类混乱的头号原因。详细说明为什么 MobileCLIP S0 模型的图像输入**不能**进行传统的 ImageNet 均值和标准差标准化，以及将输入像素缩放至 `[0, 1]` 如何将余弦相似度对齐至 `1.0`。

### 4. [分类优化：类别扩展与 Softmax 温度调节](file:///d:/AI_serach_image/image_clip/wiki/categories_and_temperature.md)
*   **内容**：如何通过将零样本分类类别从 8 类扩展至 15 类（覆盖日常高频场景）以及将 Softmax 温度从 `100.0` 调低至 `60.0`，从而提升分类准确度、解决分类强行“指鹿为马”并优化概率分布。

### 5. [打包与发布：构建 Standalone Portable EXE](file:///d:/AI_serach_image/image_clip_android/wiki/pc/packaging_and_deployment.md)
*   **内容**：使用 `electron-builder` 构建 Windows 绿色免安装版单文件 `.exe` 的配置说明，如何不使用 ASAR 解决原生模块 (`onnxruntime-node`、`sharp`) 以及权重文件的运行时加载问题。

### 6. [人脸识别与人物相册架构 (SCRFD + MobileFaceNet + 底层向量化加速)](file:///d:/AI_serach_image/image_clip_android/wiki/features/face_recognition.md)
*   **内容**：工业级双模型级联流水线、SCRFD 3-Scale 锚点解析与置信度过滤、512-D L2 超球面归一化、SharedArrayBuffer 零拷贝内存共享、底层微秒级向量点积加速、同图排他双门槛聚类算法与流式动态头像协议。

### 7. [人脸识别技术汇报与路线对比](file:///d:/AI_serach_image/image_clip_android/wiki/pc/face_recognition_report.md)
*   **内容**：对比 ShareCLIP 当前方案与纯 JS (face-api.js)、Dlib、OpenCV Haar、MediaPipe、RetinaFace+ResNet50 在隐私、精度、体积与算力开销上的核心权衡。

### 8. [PC 蓝牙 (BLE GATT) 兼容性修复与全链路自动降级白皮书](file:///d:/AI_serach_image/image_clip_android/wiki/pc/ble_gatt_compatibility_and_fallback.md)
*   **内容**：深度剖析异构 Windows PC 蓝牙开启失败的诱因（特征值属性冲突、端口残留竞争、广播参数敏感性），详细阐述 C++/WinRT 原生层两级属性回退、GATT 端口 3 次重试、/MT 静态编译以及前端“蓝牙失败无缝降级 Wi-Fi 直连二维码”的设计与实现。

### 9. [全屏大图预览 (Lightbox) 层级冲突与控制栏重构](file:///d:/AI_serach_image/image_clip_android/wiki/pc/lightbox_and_window_controls.md)
*   **内容**：分析 Electron 无边框窗口自定义标题栏（`z-index: 9999`）与全屏大图（`z-index: 1000`）的层级遮挡与点击事件拦截问题。详解 `z-index: 10000` 提升、拖拽区（`-webkit-app-region: drag`）与操作区分离、高亮药丸关闭按钮 `✕ 关闭大图 (ESC)` 及窗口控制组件的无缝融合。

### 10. [WebRTC 连接彻底解耦与独立 ConnectionManager 单例架构](file:///d:/AI_serach_image/image_clip_android/wiki/features/connection_decoupling_and_state_machine.md)
*   **内容**：将 WebRTC PeerConnection、DataChannel 生命周期、ICE 队列、UDP/HTTP 双通道信令、心跳 Keepalive 及 25s 协商看门狗全部从 `App.vue` 剥离并收拢进独立单例 `ConnectionManager.js`；加入 UDP Answer SDP 800B 分片保护机制，彻底消除局域网路由器丢包与业务耦合。

### 11. [双核/低配电脑与 4GB 极低内存 AI 推理引擎极致优化、多层容灾与全机型分级](file:///d:/AI_serach_image/image_clip_android/wiki/features/low_end_cpu_ai_optimization.md)
*   **内容**：针对 81.6% 存量双核/四核超极本及 4GB 内存老旧机型（如缺少 AVX2 的赛扬 N4020/N4120/Pentium），实现三级 ONNX 推理容灾降级（CPU AVX2 ➔ DirectML GPU ➔ Safe CPU）、人脸/文本模型全链路按需延迟加载（Lazy Loading 释放 >140MB 内存）、WorkerPool 异常崩溃防死锁，结合严格的 Low/Mid/High 硬件分级物理隔离与静态零拷贝内存池，解决 4GB 电脑无法启动 AI 计算的历史痛点，6000 张相片全量预测提速 3 倍且高低配互不干扰。

### 12. [多站点 4K 视频解析下载器、独立 HTML5 Electron 播放器窗口与高对比度界面体系](file:///d:/AI_serach_image/image_clip_android/wiki/features/yt_dlp_video_downloader_and_player.md)
*   **内容**：彻底解耦外部系统播放器慢启动痛点，构建独立无边框 HTML5 Video 播放器窗口（支持 GPU 硬件加速、Range 206 局部流式缓冲、画中画置顶 Pin 与全键盘快捷键）；集成 yt-dlp 4K 极速解析下载内核，支持 YouTube、Bilibili、抖音、快手、Twitter/X 等 1000+ 平台，内置智能剪贴板文案提取清洗正则与 FFmpeg DASH 音视频自动无损混流封装；重构 v4.0.0 浅色/深色双主题高对比度自适应设计体系（WCAG 2.1 AA 标准）。

### 13. [全球化全自动推广、开源赞助体系与极客包管理器分发飞轮](file:///d:/AI_serach_image/image_clip_android/wiki/features/automated_promotion_and_growth_engine.md)
*   **内容**：全方位落地 5 大增长引擎——GitHub 官方 Sponsors / Buy Me a Coffee / Patreon 全渠道赞助变现体系；WebShare 纯网页端内置自裂变引流挂件（Product-Led Growth, PLG）；GitHub Actions CI/CD 自动发版多渠道宣发流水线（自动生成发布 Markdown 与 Discord/Telegram 社区广播）；Windows 极客包管理器自动感知（Scoop & WinGet 清单与 SHA256 自动计算工具）；以及全套顶级公域社区（AlternativeTo、Reddit、Hacker News、Product Hunt、Awesome Lists）打榜物料与程序化 SEO（sitemap.xml / robots.txt）。

### 14. [Electron 差分更新（增量升级）深度排查、本地缓存净化与防降级加固架构](file:///d:/AI_serach_image/image_clip_android/wiki/features/differential_update_and_cache_purging.md)
*   **内容**：深度还原 Electron 差分升级报错回退全量 148MB 安装包的四大根因（本地 Blockmap 脏缓存版本脱节、141MB 磁盘搬运 12s 看门狗超时误杀、Azure/GitHub CDN 501 报错、无自愈机制），构建 `sanitizeUpdaterCache()` 自动净化闭环与 60s 弹性看门狗，实测由 148.78 MB 骤降至 7.64 MB，节省 94.87% 带宽。

### 15. [跨平台视频下载后处理排查、便携 FFmpeg 自愈与 GitHub 免费公有代码签名架构](file:///d:/AI_serach_image/image_clip_android/wiki/features/code_signing_and_ffmpeg_resilience.md)
*   **内容**：还原 yt-dlp 在缺少 FFmpeg 时视频下载到达 100% 后处理报错 exit code 1 的深层诱因，落地 `ensureFFmpeg` 本地便携版自动拉取、路径沙箱注入与单流自适应优雅降级；构建 GitHub Actions Win/Mac 双平台免费公有签名组合拳（Windows Authenticode 时间戳自签名 + 一键信任脚本、macOS Ad-hoc 签名与 Sequoia Gatekeeper 一键修复脚本、以及全平台 Linux 基金会 Sigstore Rekor Artifact Attestations 供应链透明存证）。

---

## 🏗️ 整体系统架构图

应用基于纯本地离线架构，核心逻辑运行在 Electron 主进程中，具体流程如下：

```mermaid
graph TD
    A[用户选择相册文件夹/图片] --> B(前端渲染等待队列)
    B --> C{主进程排队进行 AI 推理}
    C -->|1. 用 Sharp 裁剪并缩放到 256x256| D[提取 [0, 1] Planar RGB Tensor]
    D -->|2. 运行 ONNX Runtime 图像编码器| E[提取 512 维特征向量 Image Embedding]
    E -->|3. L2 归一化并与 text_embeddings.json 进行矩阵乘| F[计算 15 个类别的余弦相似度]
    F -->|4. Softmax 温度 60.0 缩放| G[生成分类概率分布并排序]
    G --> H[返回结果渲染前端视图与分类过滤器]
```
