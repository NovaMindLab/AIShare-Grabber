# 📱✈️🖥️ ShareCLIP (AIShare-Grabber)

[![GitHub release](https://img.shields.io/github/v/release/NovaMindLab/AIShare-Grabber?color=7c3aed&label=Release&logo=github)](https://github.com/NovaMindLab/AIShare-Grabber/releases)
[![Flutter Version](https://img.shields.io/badge/Flutter-%E2%89%A53.11.1-02569B?logo=flutter&logoColor=white)](https://flutter.dev)
[![Electron Version](https://img.shields.io/badge/Electron-30.5.1-47848F?logo=electron&logoColor=white)](https://www.electronjs.org)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-Node-005A9C?logo=onnx&logoColor=white)](https://onnxruntime.ai/)
[![Leaflet Map](https://img.shields.io/badge/Leaflet_Map-1.9.4-B5E285?logo=leaflet&logoColor=white)](https://leafletjs.com/)

> **ShareCLIP** is a premium, localized, multi-device photo synchronization and AI-powered classification ecosystem. It achieves blazing-fast **P2P cross-device file transfer** via WebRTC over local Wi-Fi, using BLE (Bluetooth Low Energy) for instant offline signaling. Once synced, a local **MobileCLIP ONNX** model automatically classifies your photos and enables semantic text search—all running **100% locally and privately** on your PC.

🔗 **Official Landing Page**: [https://novamindlab.github.io/AIShare-Grabber/](https://novamindlab.github.io/AIShare-Grabber/)

---

## ⚡ Direct-Link P2P Signaling & Transmission Flow

This animated diagram shows how ShareCLIP initiates connections offline using BLE, negotiates WebRTC SDP, and transfers files in chunked packets via a high-speed Wi-Fi channel:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 340" width="100%" height="auto" style="background:#0f172a; border-radius:12px; font-family:'Segoe UI',system-ui,sans-serif;">
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

## ✨ Features

- **📶 Offline Connectivity (BLE + WebRTC)**: Discover, connect and coordinate directly with zero cellular data configuration. Custom chunking protocols bypass BLE MTU size limitations to deliver raw WebRTC SDP packets reliably.
- **⚡ High-Speed Direct Transport**: Splits files into binary slices with a 16-byte custom header, sending them through WebRTC DataChannels over local Wi-Fi. Features built-in reactive backpressure monitoring to avoid device memory overflow and OOMs.
- **🧠 Zero-Trust Local AI (MobileCLIP)**: Runs zero-shot classification on-device using quantized MobileCLIP models inside the Electron host via `onnxruntime-node`. No server APIs, no internet, total privacy.
- **🗺️ Interactive Footprint Map**: Reads EXIF GPS tags from camera-taken photos (`ACCESS_MEDIA_LOCATION`), stores coordinates in SQLite, and displays your travel footprints on an interactive Leaflet map featuring fluid marker clustering.
- **🔍 Semantic Similarity Clustering**: Detects duplicate or near-duplicate images locally using cosine distance threshold comparisons, enabling easy photo cleanup with one-click deletion.
- **🌐 20-Language i18n**: Fully localized across Android, PC, and Web portal to support global users seamlessly.

---

## 📸 Product Screenshots

Here is a visual tour of ShareCLIP in action:

<table width="100%">
  <tr>
    <td width="50%" align="center">
      <b>🗺️ Interactive Footprint Map (PC)</b><br/>
      <img src="./docs/images/media__1783477173684.png" width="100%" alt="Footprint Map Tab"/>
    </td>
    <td width="50%" align="center">
      <b>🔍 Duplicate Image Clustering (PC)</b><br/>
      <img src="./docs/images/media__1783479158661.png" width="100%" alt="Duplicate Image Clustering"/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <b>🖼️ Image Gallery & Auto AI Classification</b><br/>
      <img src="./docs/images/media__1783480418697.png" width="100%" alt="Image Gallery & CLIP Predictions"/>
    </td>
    <td width="50%" align="center">
      <b>📱 Link Mobile Panel (PC)</b><br/>
      <img src="./docs/images/media__1783489995368.png" width="100%" alt="Link Mobile Connection Dashboard"/>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <b>⚙️ Custom Download Paths Settings</b><br/>
      <img src="./docs/images/media__1783494494855.png" width="100%" alt="Custom Download Path Settings"/>
    </td>
    <td width="50%" align="center">
      <b>🔑 Mobile Permissions Guide</b><br/>
      <img src="./docs/images/media__1783491129806.png" width="100%" alt="Android Granular Media Permissions"/>
    </td>
  </tr>
</table>

---

## 🛠️ Project Structure

The repository is structured as a mono-repo split into native client applications:

- **[`/android`](file:///d:/AI_serach_image/image_clip_android/android/)**: Companion mobile client app written in Dart/Flutter.
- **[`/cp_clip`](file:///d:/AI_serach_image/image_clip_android/cp_clip/)**: Desktop companion host application written in Electron 30, Vue 3, Vite, SQLite, ONNX Runtime Node, and Sharp.
- **[`/web`](file:///d:/AI_serach_image/image_clip_android/web/)**: Sources for the Vue 3 + Vite official landing portal.
- **[`/wiki`](file:///d:/AI_serach_image/image_clip_android/wiki/)**: Central developer documentation and protocol specs database.

---

## 🚀 Getting Started

### 📱 Android Client

1. **Prerequisites**: Ensure you have Flutter SDK ($\ge$ 3.11.1) and Android SDK installed.
2. **Install dependencies**:
   ```bash
   cd android
   flutter pub get
   ```
3. **Run the App**: Connect your Android device via USB debugging and run:
   ```bash
   flutter run
   ```

---

### 🖥️ PC Desktop Client

1. **Prerequisites**: Node.js ($\ge$ v20) and Python ($\ge$ 3.10, for building C++ dependencies like `node-gyp`).
2. **Install dependencies**:
   ```bash
   cd cp_clip
   npm install
   ```
3. **Run in development mode**:
   ```bash
   npm run dev
   ```
4. **Compile and package (Portable EXE)**:
   ```bash
   npm run dist
   ```

---

### 🌐 Official Website

1. **Install dependencies**:
   ```bash
   cd web
   npm install
   ```
2. **Run dev server**:
   ```bash
   npm run dev
   ```
3. **Build website**:
   ```bash
   npm run build
   ```

---

## 📄 License & Privacy

ShareCLIP runs entirely **offline**. Your images, metadata, location tags, and classification predictions never leave your local devices.

Developed by the **NovaMindLab** team. For details on protocols, see the [Central Developer Wiki](file:///d:/AI_serach_image/image_clip_android/wiki/README.md).
