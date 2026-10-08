# 🤖 IzzyOnDroid (F-Droid 第三方源) 官方收录申请规范与 Issue 模板

> **关于 IzzyOnDroid**:
> IzzyOnDroid 是 Android 生态中最大的 F-Droid 兼容第三方应用源（由 Izzy 维护）。收录后，全球数百万使用 F-Droid、Droid-ify、Neo Store、Aurora Droid 的隐私偏好与开源极客用户均可直接搜索、一键安装并自动接收版本升级通知。
> 
> * **活跃提交地址 (Active Tracker)**: [https://codeberg.org/IzzyOnDroid/repo/issues](https://codeberg.org/IzzyOnDroid/repo/issues)
> * **备用/历史地址 (GitLab Archive)**: [https://gitlab.com/IzzyOnDroid/repo/-/issues](https://gitlab.com/IzzyOnDroid/repo/-/issues)
> * **收录规范文档**: [IzzyOnDroid App Inclusion Policy](https://izzyondroid.org/docs/general/app-inclusion-policy/)

---

## 📋 提交 Issue 模板 (直接复制到 Codeberg / GitLab 创建 Issue)

### Issue Title:
```text
[Inclusion Request] com.novamindlab.image_clip (ShareCLIP)
```

### Issue Description (Markdown):

```markdown
### Application Information

* **Application Name:** ShareCLIP
* **Package Name (Application ID):** `com.novamindlab.image_clip`
* **Source Code Repository:** https://github.com/NovaMindLab/AIShare-Grabber
* **License:** MIT License (OSI-Approved Open Source)
* **Website / Project Home:** https://novamindlab.github.io/AIShare-Grabber/
* **Issue Tracker:** https://github.com/NovaMindLab/AIShare-Grabber/issues
* **Primary Category:** Connectivity / Multimedia
* **Secondary Categories:** System, Tools, Security

---

### Release & Binary Information

* **Release Tag Pattern:** `v*` (e.g. `v4.5.8`)
* **APK Download URL / Asset Pattern:**
  - Releases: https://github.com/NovaMindLab/AIShare-Grabber/releases
  - Asset Name Pattern: `ShareCLIP-Android-%v.apk` (or `ShareCLIP-Android-*.apk`)
  - Direct Example: `https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.8/ShareCLIP-Android-4.5.8.apk`
* **APK Type:** Universal signed release APK (includes `arm64-v8a`, `armeabi-v7a`, `x86_64`)
* **Target Android Version:** Android 8.0 (API 26) through Android 14+ (API 34)

---

### Privacy & Anti-Features Verification

* **Anti-Features:** **None**
  - [x] No advertising SDKs (No AdMob, Unity, etc.)
  - [x] No proprietary tracking/analytics (Exodus Privacy clean; zero telemetry in Android binary)
  - [x] No non-free network service lock-in (100% functional offline and over LAN)
  - [x] No paid features, subscriptions, or disabled functionality

---

### Short Description / Summary (<= 80 chars)

* **English:**
  > Private P2P AirDrop alternative & on-device AI photo gallery. Zero cloud.
* **中文 (Simplified Chinese):**
  > 私有局域网极速互传 AirDrop 替代品与端侧离线 AI 语义搜图相册。

---

### Full Description (English)

ShareCLIP is a 100% private, open-source, local-first media suite designed for seamless cross-platform photo synchronization, offline AI gallery management, and peer-to-peer file transfer between Android, Windows, macOS, Linux, and Web browsers.

#### 🌟 Key Features:
* ⚡ **High-Speed Local P2P Transfer (AirDrop Alternative)**:
  - Direct Wi-Fi Hotspot & WebRTC DataChannel transfer up to 80+ MB/s.
  - Zero cloud reliance, zero external bandwidth consumption, zero file compression.
  - Built-in WebShare client allowing file transfers to any browser without installing an app.
* 🧠 **On-Device AI Photo Search (MobileCLIP)**:
  - Powered by MobileCLIP2-S0 ONNX model running entirely on-device.
  - Search photos by natural language prompts ("cat playing in garden", "sunset over beach", "receipts") completely offline.
  - Offline face clustering, EXIF geolocation interactive map, and private local vector index.
* 🎬 **Universal 4K Multi-Site Video Downloader & Media Hub**:
  - Download high-definition video and audio streams from 1000+ online video platforms.
  - Standalone frameless floating player window with smooth Range 206 local streaming.
* 🔒 **Absolute Data Sovereignty**:
  - No account registration required.
  - Your media never leaves your local Wi-Fi network.

---

### Full Description (中文 / Simplified Chinese)

ShareCLIP 是一款 100% 私有、开源且本地优先的多媒体套件。致力于打破 Android 与 Windows、macOS、Linux、Web 跨端传输壁垒，打造无需云端上传、零隐私泄露风险的智能媒体体验。

#### 🌟 核心特性：
* ⚡ **局域网极速 P2P 互传（AirDrop 替代方案）**：
  - 基于 Wi-Fi 热点直连与 WebRTC DataChannel，局域网传输速率可达 80+ MB/s；
  - 零云端中转、零流量消耗、原图无损互传，支持百兆级大视频与 RAW 照片秒传；
  - 内置 WebShare 免装端网页快传，局域网内任意扫码即可收发文件。
* 🧠 **端侧离线 AI 语义搜图相册（MobileCLIP）**：
  - 内置轻量化 MobileCLIP2-S0 神经网络模型，100% 设备端离线推理；
  - 支持自然语言任意搜图（如“在海边看日落”、“打瞌睡的猫咪”、“发票报销”）；
  - 本地人脸聚类识别与 EXIF GPS 交互式地图足迹，隐私零外泄。
* 🎬 **全球多站点 4K 视频下载器与独立播放器**：
  - 支持解析与下载 YouTube、哔哩哔哩、抖音、TikTok、Twitter/X 等 1000+ 主流媒体；
  - 独立置顶悬浮播放器，支持 HTTP Range 206 毫秒级分段流式缓冲播放。
* 🔒 **隐私至上与完全数据自主**：
  - 无需注册账号，无广告推送，无云端追踪；
  - 采用标准 MIT 开源协议。

---

### Fastlane / Metadata Reference

* **Fastlane Directory in Git:** `fastlane/metadata/android/`
* **App Icon:** `app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
* **Release Artifacts:** `https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.8/ShareCLIP-Android-4.5.8.apk`
* **Package Checksum (SHA-256):** `340993b1fa20dc4e5b0984badb2c988f389873bcb1fbfa60492233bfa2ca3ad4`
```

---

## 🛠️ IzzyOnDroid 自动化元数据配置说明 (Auto-Update Bot)

IzzyOnDroid 具备自动化扫描机器人（`checkupdates`），会定期抓取 GitHub Releases 并自动抓取最新的 APK 文件发布到仓库。

在 ShareCLIP 仓库中，以下配置确保机器人能够 100% 自动识别并持续更新：

### 1. Release Tag 规范
* 规范格式：`vX.Y.Z`（例如 `v4.5.8`）
* 避免将正式 APK 仅发布在 Pre-release 或 Draft 状态中。

### 2. APK 命名统一规范
* Android 安装包命名必须符合模式：
  `ShareCLIP-Android-${version}.apk`（例如 `ShareCLIP-Android-4.5.8.apk`）
* 该命名与 IzzyOnDroid 匹配规则完全契合。

### 3. Fastlane 目录结构规范
若需要在 F-Droid 客户端中展示多语言长描述、应用截图与更新日志，可在仓库中保持如下目录结构：

```text
fastlane/metadata/android/
├── en-US/
│   ├── title.txt                     # ShareCLIP
│   ├── short_description.txt         # 80字符简介
│   ├── full_description.txt          # 完整英文长描述
│   ├── changelogs/
│   │   └── 458.txt                   # 版本更新日志 (按 versionCode 命名)
│   └── images/
│       ├── icon.png                  # 512x512 高清图标
│       └── phoneScreenshots/         # 界面截图
└── zh-CN/
    ├── title.txt
    ├── short_description.txt
    ├── full_description.txt
    └── changelogs/
        └── 458.txt
```

---

## ✅ 提交前自检清单 (Pre-submission Checklist)

在向 [https://codeberg.org/IzzyOnDroid/repo/issues](https://codeberg.org/IzzyOnDroid/repo/issues) 提交 Issue 前，请确认：

- [x] **开源协议有效**：根目录包含 OSI 认可的 [LICENSE](https://github.com/NovaMindLab/AIShare-Grabber/blob/main/LICENSE)（MIT License）。
- [x] **无专有广告/监控依赖**：Android 端无 Google Firebase Analytics、Flurry、AppsFlyer 等闭源分析库。
- [x] **APK 已经公开发布**：GitHub Releases 页面中存在公开可下载的 Universal APK（未置于草稿或私有存储）。
- [x] **APK 经过正式签名**：APK 已通过 v2/v3 签名方案完成签名，能在常规 Android 手机上独立安装运行。
- [x] **AndroidManifest.xml 声明规范**：`package="com.novamindlab.image_clip"`，`versionCode` 与 `versionName` 保持递增。
