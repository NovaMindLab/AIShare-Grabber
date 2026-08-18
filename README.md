<div align="center">

  <img src="./docs/images/hero_banner.jpg" width="100%" alt="ShareCLIP Hero Banner" style="border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />

  <br/><br/>

  # 📱 ShareCLIP (AIShare-Grabber)
  ### Next-Gen Local AI Photo Management & P2P Cross-Device Wireless Syncing Ecosystem

  <p align="center">
    <b>Zero-Cloud • 100% Private • Local MobileCLIP AI • P2P WebRTC Direct Link • SIMD Face Clustering</b>
  </p>

  <p align="center">
    <a href="https://github.com/NovaMindLab/AIShare-Grabber/releases"><img src="https://img.shields.io/github/v/release/NovaMindLab/AIShare-Grabber?color=a855f7&label=Release&logo=github" alt="Release" /></a>
    <a href="https://flutter.dev"><img src="https://img.shields.io/badge/Flutter-%E2%89%A53.11.1-02569B?logo=flutter&logoColor=white" alt="Flutter" /></a>
    <a href="https://www.electronjs.org"><img src="https://img.shields.io/badge/Electron-30.5.1-47848F?logo=electron&logoColor=white" alt="Electron" /></a>
    <a href="https://onnxruntime.ai/"><img src="https://img.shields.io/badge/ONNX_Runtime-Node-005A9C?logo=onnx&logoColor=white" alt="ONNX Runtime" /></a>
    <a href="https://webrtc.org/"><img src="https://img.shields.io/badge/WebRTC-P2P_DataChannel-333333?logo=webrtc&logoColor=white" alt="WebRTC" /></a>
    <a href="https://leafletjs.com/"><img src="https://img.shields.io/badge/Leaflet-1.9.4-B5E285?logo=leaflet&logoColor=white" alt="Leaflet Map" /></a>
    <a href="https://webassembly.org/"><img src="https://img.shields.io/badge/WASM_SIMD-128bit-654FF0?logo=webassembly&logoColor=white" alt="WASM SIMD" /></a>
    <a href="https://github.com/NovaMindLab/AIShare-Grabber/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License" /></a>
  </p>

  <p align="center">
    <a href="#-key-features"><b>✨ Features</b></a> •
    <a href="#-ai-photo-management-ecosystem"><b>🧠 AI Architecture</b></a> •
    <a href="#-p2p-transmission-pipeline"><b>⚡ Protocol</b></a> •
    <a href="#-product-screenshots"><b>📸 Screenshots</b></a> •
    <a href="#-getting-started"><b>🚀 Quick Start</b></a> •
    <a href="#-中文详细介绍"><b>🇨🇳 中文说明</b></a>
  </p>

  <p align="center">
    🌐 <b>Official Landing Portal</b>: <a href="https://novamindlab.github.io/AIShare-Grabber/">https://novamindlab.github.io/AIShare-Grabber/</a>
  </p>

</div>

---

## 💡 What is ShareCLIP?

**ShareCLIP (AIShare-Grabber)** is a privacy-first, lightning-fast cross-device photo management solution connecting your mobile devices and desktop workstations without cables, cloud subscriptions, or cellular data.

- **Zero-Cloud & 100% Private**: Your original photos, location data, and biometric face embeddings never touch any remote cloud server.
- **Offline Wireless Pairing**: Instant device discovery via Bluetooth Low Energy (BLE GATT) or LAN UDP broadcast, auto-negotiating high-speed **WebRTC P2P DataChannels** over local Wi-Fi.
- **On-Device Multi-Modal AI**: Powered by **MobileCLIP-S0** and **Buffalo_SC** models running locally on CPU/GPU via ONNX Runtime and WebAssembly SIMD acceleration.

---

## 🧠 AI Photo Management Ecosystem

<div align="center">
  <img src="./docs/images/ai_features.jpg" width="100%" alt="ShareCLIP AI Photo Management Features" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 16px 40px rgba(0,0,0,0.5);" />
</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| ⚡ **Offline P2P High-Speed Sync** | Zero cellular data or internet needed. Automatically coordinates WebRTC SDP packets via BLE/UDP, transmitting photos in chunked 32KB packets over local Wi-Fi at gigabit speeds with reactive backpressure control. |
| 🔍 **Semantic Natural Language Search** | Describe what you are looking for in plain language (*e.g., "sunset at beach", "dog playing on grass", "receipt document"*). MobileCLIP extracts 512-D vector embeddings for zero-shot text-to-image semantic matching. |
| 👥 **Biometric Face Recognition & Timeline** | Employs SCRFD face detection and MobileFaceNet 512-D feature extraction accelerated by **WASM SIMD 128-bit vectorization** and **SharedArrayBuffer zero-copy RAM sharing**, grouping thousands of photos into personal albums in seconds. |
| 🖼️ **Immersive Full-Screen Lightbox** | Instant 0ms thumbnail preview with on-demand **4K RAW original photo streaming** from mobile. Supports previous/next navigation (`←`/`→`), zoom/rotate, and folder revealing. |
| 🧹 **Smart Similarity & Cross-Device Deletion** | Calculates cosine similarity across your entire photo library using Leader Centroid clustering. Supports one-click duplicate cleanup with synchronized deletion from both PC cache and Android system gallery. |
| 🗺️ **EXIF GPS Footprint Map** | Extracts GPS coordinates (`ACCESS_MEDIA_LOCATION`), plotting your life travel footprints on an interactive Leaflet world map with smooth dynamic clustering. |
| 🚀 **Local Wi-Fi Hotspot Fallback** | Includes built-in soft-AP hotspot creation for restrictive environments (e.g., isolated public Wi-Fi or campus networks) for guaranteed direct device-to-device streaming. |
| 🌐 **20+ Global Languages (i18n)** | Fully localized UI across Android, Desktop PC, and Web landing page for seamless international usage. |

---

## ⚡ Direct-Link P2P Signaling & Transmission Pipeline

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 340" width="100%" height="auto" style="background:#0f172a; border-radius:12px; font-family:'Segoe UI',system-ui,sans-serif; border: 1px solid rgba(255,255,255,0.1);">
  <!-- Styles for Animation -->
  <style>
    .node-title { fill: #f8fafc; font-size: 14px; font-weight: bold; }
    .node-subtitle { fill: #94a3b8; font-size: 11px; }
    .label { fill: #cbd5e1; font-size: 12px; }
    .flow-line { stroke: #334155; stroke-width: 2; stroke-dasharray: 6 4; }
    
    /* BLE Handshake Animation */
    .ble-pulse {
      stroke: #a855f7;
      stroke-width: 2;
      fill: none;
      animation: pulse 2.5s infinite ease-out;
    }
    @keyframes pulse {
      0% { r: 10; opacity: 1; }
      100% { r: 50; opacity: 0; }
    }
    
    .ble-packet {
      fill: #c084fc;
      animation: ble-travel 3s infinite linear;
    }
    @keyframes ble-travel {
      0% { cx: 200; cy: 110; opacity: 0; }
      10% { opacity: 1; }
      40% { cx: 400; cy: 60; }
      50% { cx: 600; cy: 110; opacity: 1; }
      51% { opacity: 0; }
      100% { opacity: 0; }
    }

    /* WebRTC Stream Animation */
    .webrtc-stream {
      stroke: #3b82f6;
      stroke-width: 3;
      stroke-dasharray: 8 6;
      animation: stream-flow 1.5s infinite linear;
    }
    @keyframes stream-flow {
      to { stroke-dashoffset: -20; }
    }

    .data-chunk {
      fill: #60a5fa;
      animation: chunk-travel 2s infinite ease-in-out;
    }
    @keyframes chunk-travel {
      0% { cx: 200; cy: 220; r: 0; opacity: 0; }
      15% { r: 6; opacity: 1; }
      85% { r: 6; opacity: 1; }
      100% { cx: 600; cy: 220; r: 0; opacity: 0; }
    }
    
    /* Glow filters */
    .glow-purple { filter: drop-shadow(0 0 6px rgba(168,85,247,0.6)); }
    .glow-blue { filter: drop-shadow(0 0 6px rgba(59,130,246,0.6)); }
  </style>

  <!-- Gradients -->
  <defs>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>
  </defs>

  <!-- Background grid pattern -->
  <g opacity="0.05">
    <path d="M 0,40 L 800,40 M 0,80 L 800,80 M 0,120 L 800,120 M 0,160 L 800,160 M 0,200 L 800,200 M 0,240 L 800,240 M 0,280 L 800,280" stroke="#94a3b8" stroke-width="1"/>
    <path d="M 100,0 L 100,340 M 200,0 L 200,340 M 300,0 L 300,340 M 400,0 L 400,340 M 500,0 L 500,340 M 600,0 L 600,340 M 700,0 L 700,340" stroke="#94a3b8" stroke-width="1"/>
  </g>

  <!-- Connections / Lines -->
  <!-- BLE Signaling Arch -->
  <path d="M 200,110 Q 400,50 600,110" fill="none" class="flow-line" />
  <circle class="ble-pulse" cx="200" cy="110" r="10" />
  <circle class="ble-packet glow-purple" cx="200" cy="110" r="6" />

  <!-- WebRTC P2P DataChannel Link -->
  <path d="M 200,220 L 600,220" fill="none" class="webrtc-stream glow-blue" />
  <circle class="data-chunk" cx="200" cy="220" r="6" />
  <circle class="data-chunk" cx="200" cy="220" r="6" style="animation-delay: 0.6s;" />
  <circle class="data-chunk" cx="200" cy="220" r="6" style="animation-delay: 1.2s;" />

  <!-- Left Node: Android Client -->
  <rect x="50" y="80" width="150" height="180" rx="16" fill="url(#glassGrad)" stroke="#334155" stroke-width="2" />
  <rect x="50" y="80" width="150" height="40" rx="16" fill="url(#purpleGrad)" opacity="0.15" />
  <circle cx="125" cy="115" r="22" fill="url(#purpleGrad)" class="glow-purple" />
  <text x="125" y="120" text-anchor="middle" font-size="16">📱</text>
  <text x="125" y="165" text-anchor="middle" class="node-title">Android App</text>
  <text x="125" y="185" text-anchor="middle" class="node-subtitle">Flutter Companion</text>
  <text x="125" y="210" text-anchor="middle" fill="#a855f7" font-size="10" font-weight="bold" letter-spacing="1">GATT CLIENT</text>
  <text x="125" y="230" text-anchor="middle" fill="#60a5fa" font-size="10" font-weight="bold" letter-spacing="1">WEBRTC SENDER</text>

  <!-- Right Node: PC Client -->
  <rect x="600" y="80" width="150" height="180" rx="16" fill="url(#glassGrad)" stroke="#334155" stroke-width="2" />
  <rect x="600" y="80" width="150" height="40" rx="16" fill="url(#blueGrad)" opacity="0.15" />
  <circle cx="675" cy="115" r="22" fill="url(#blueGrad)" class="glow-blue" />
  <text x="675" y="120" text-anchor="middle" font-size="16">🖥️</text>
  <text x="675" y="165" text-anchor="middle" class="node-title">PC Client</text>
  <text x="675" y="185" text-anchor="middle" class="node-subtitle">Electron + Vue</text>
  <text x="675" y="210" text-anchor="middle" fill="#a855f7" font-size="10" font-weight="bold" letter-spacing="1">GATT SERVER</text>
  <text x="675" y="230" text-anchor="middle" fill="#60a5fa" font-size="10" font-weight="bold" letter-spacing="1">LOCAL ONNX AI</text>

  <!-- Explanatory text overlays -->
  <rect x="310" y="15" width="180" height="26" rx="6" fill="#1e293b" stroke="#a855f7" stroke-width="1" opacity="0.9" />
  <text x="400" y="32" text-anchor="middle" fill="#d8b4fe" font-size="10" font-weight="bold" class="glow-purple">1. BLE SIGNALING (OFFLINE SDP)</text>

  <rect x="300" y="245" width="200" height="26" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="1" opacity="0.9" />
  <text x="400" y="262" text-anchor="middle" fill="#93c5fd" font-size="10" font-weight="bold" class="glow-blue">2. WEBRTC DATA CHANNEL (P2P WI-FI)</text>
</svg>
```

---

## 📸 Product Screenshots

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <b>🗺️ Interactive Footprint Map (PC)</b><br/>
      <img src="./docs/images/media__1783477173684.png" width="100%" alt="Footprint Map Tab" style="border-radius: 8px;"/>
    </td>
    <td width="50%" align="center">
      <b>🔍 AI Duplicate Image Deduplication (PC)</b><br/>
      <img src="./docs/images/media__1783479158661.png" width="100%" alt="Duplicate Image Clustering" style="border-radius: 8px;"/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <b>🖼️ Image Gallery & Auto AI Classification</b><br/>
      <img src="./docs/images/media__1783480418697.png" width="100%" alt="Image Gallery & CLIP Predictions" style="border-radius: 8px;"/>
    </td>
    <td width="50%" align="center">
      <b>📱 Cross-Device Connection Dashboard</b><br/>
      <img src="./docs/images/media__1783489995368.png" width="100%" alt="Link Mobile Connection Dashboard" style="border-radius: 8px;"/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <b>⚙️ Custom Download Paths Settings</b><br/>
      <img src="./docs/images/media__1783494494855.png" width="100%" alt="Custom Download Path Settings" style="border-radius: 8px;"/>
    </td>
    <td width="50%" align="center">
      <b>🔑 Mobile Granular Permissions Guide</b><br/>
      <img src="./docs/images/media__1783491129806.png" width="100%" alt="Android Granular Media Permissions" style="border-radius: 8px;"/>
    </td>
  </tr>
</table>

---

## 🛠️ Monorepo Architecture

```
AIShare-Grabber/
├── 📱 android/          # Flutter Android Companion App (BLE GATT + WebRTC DataChannel)
├── 🖥️ cp_clip/          # Desktop Host App (Electron 30, Vue 3, ONNX Runtime, SQLite, Sharp)
│   ├── src/workers/    # Dedicated Node Worker Pool (Search, SIMD WASM clustering, Inference)
│   └── models/         # Quantized MobileCLIP-S0 & Buffalo_SC ONNX AI models
├── 🌐 web/              # Official Vue 3 + Vite Landing Portal
├── 📖 wiki/             # Architecture, protocol specs, and developer documentation
└── 📂 docs/images/      # Product graphics, diagrams, and hero assets
```

---

## 🚀 Getting Started

### 📱 1. Android Client

```bash
# Prerequisites: Flutter SDK >= 3.11.1 & Android SDK
cd android
flutter pub get
flutter run
```

### 🖥️ 2. Desktop PC Client

```bash
# Prerequisites: Node.js >= v20, Python >= 3.10
cd cp_clip
npm install

# Run in Development Mode
npm run dev

# Package as Portable Desktop Release
npm run dist
```

### 🌐 3. Official Web Portal

```bash
cd web
npm install
npm run dev
```

---

## 🇨🇳 中文详细介绍

### 🌟 核心理念
**ShareCLIP (AIShare-Grabber)** 是一款专为重视隐私与效率的用户打造的 **跨端无网照片同步与本地 AI 智能管理系统**。无需数据线、无需公网服务器中转、不消耗手机移动流量，手机与电脑之间依靠近场蓝牙（BLE）秒速握手，并通过局域网 **WebRTC DataChannel 直连** 实现千兆级极速传输。

### 🚀 六大核心技术亮点
1. **纯本地离线 AI 大脑**：集成 MobileCLIP 512 维多模态向量特征提取与 Buffalo_SC 人脸识别，支持自然语言搜图（如“海边日落”、“在草地上奔跑的金毛”）与人脸人物智能聚类，所有计算 100% 在 PC 本地运行，绝无隐私泄露风险。
2. **渐进式全屏相册大图浏览器**：0ms 瞬间打开缩略图，手机在线时按需自动拉取 4K RAW 超清原图并平滑热替换，支持键盘左右键快速切图与自由缩放。
3. **智能相似图去重与双端同步删除**：利用余弦相似度质心聚类算法毫秒级定位重复与相似抓拍，支持在电脑端一键勾选清理，并联动通过 WebRTC 信令同步从手机相册中安全移除。
4. **旅行足迹地图**：自动解析 EXIF 中的 GPS 地理信息，在世界地图上动态聚类绘制您的旅行足迹轨迹。
5. **WASM SIMD 128位与零拷贝内存加速**：采用 `SharedArrayBuffer` 物理内存共享与 WebAssembly SIMD 加速数学向量运算，数万张图片特征比对瞬时完成。
6. **断网热点直连模式**：即使身处没有路由器的户外或隔离网络环境，电脑可一键建立直连热点，保障数据传输永不中断。

---

## 📄 License & Privacy Guarantee

- **Privacy Guarantee**: ShareCLIP is architected under a strict **Zero-Trust & Zero-Telemetry** principle. None of your photos, geolocation tags, or face biometric vectors ever leave your local machines.
- **License**: Released under the [Apache License 2.0](https://github.com/NovaMindLab/AIShare-Grabber/blob/main/LICENSE).

Developed with ❤️ by the **NovaMindLab** team. For deep protocol specifications, check out the [Developer Wiki](file:///d:/AI_serach_image/image_clip_android/wiki/README.md).
