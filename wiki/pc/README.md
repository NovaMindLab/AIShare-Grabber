# ShareCLIP PC Client Documentation

Welcome to the **ShareCLIP PC Desktop Client** documentation. This module is built using Electron + Vue 3 and runs the local AI image classification server.

---

## 🏗️ Architectural Overview
The PC client hosts the local BLE GATT Server for connection parameter signaling and initiates the WebRTC Answer session. Once connected, it receives photo and generic file streams from the mobile client, automatically detects and writes the correct file extensions, classifies image files using the MobileCLIP ONNX model, and allows transmitting local PC files back to the mobile companion.

## 📂 Source Code Structure
All source code files are structured in the `./cp_clip` directory:

*   [main.cjs](file:///d:/AI_serach_image/image_clip_android/cp_clip/main.cjs): Main process entry point. Handles window creation, BLE child process spawning, Wi-Fi Hotspot process orchestration, file reassembly with dynamic magic-bytes lookup, and selective ONNX classification (bypassed for non-image files).
*   [preload.cjs](file:///d:/AI_serach_image/image_clip_android/cp_clip/preload.cjs): Inter-Process Communication (IPC) bridge exposing native BLE controls, Wi-Fi Hotspot lifecycle APIs, file dialogs, and logs to the renderer.
*   [ble_signaling_server.py](file:///d:/AI_serach_image/image_clip_android/cp_clip/ble_signaling_server.py): Python helper script running the BLE GATT server, featuring a paced asynchronous notification queue to avoid Windows BLE packet drops.
*   [wifi_ap.ps1](file:///d:/AI_serach_image/image_clip_android/cp_clip/wifi_ap.ps1): PowerShell script automating direct Wi-Fi Hotspot creation on Windows 10/11 with automatic 3-stage fallback mechanisms (WiFiDirect AP, Tethering Manager, and netsh hostednetwork) to guarantee AP startup.
*   [src/App.vue](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/App.vue): Render view featuring a glassmorphic sidebar, QR canvas, live log console, and local gallery classification search grid. Now features a unified bottom-docked Transfer Dashboard, integrated bidirectional transfer progress bars (incoming/outgoing), connection status indicators, and a Dark/Light Mode theme switcher. Supports toggling between Scan QR pairing and Wi-Fi Hotspot direct pairing modes.
*   [src/main.js](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/main.js): Vue entry point.
*   [extract_embeddings.py](file:///d:/AI_serach_image/image_clip_android/cp_clip/extract_embeddings.py): Standalone model exporter converting pre-trained weights to optimized single-file ONNX formats.

## 🧠 AI & Packaging Guides
For technical details on the AI model and installer packaging:
*   [Preprocessing & Normalization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/preprocessing_and_normalization.md)
*   [Model Reparameterization](file:///d:/AI_serach_image/image_clip_android/wiki/pc/model_reparameterization.md)
*   [Packaging & Deployment](file:///d:/AI_serach_image/image_clip_android/wiki/pc/packaging_and_deployment.md)

---

## 🎨 Layout Redesign & Tab Structure

The PC client is structured as a multi-tab desktop dashboard:
*   **连接手机 (Link Mobile)**: Displays the QR code, BLE GATT server status, and real-time logs terminal in the main view.
*   **本地资源 (Local Resources)**:
    *   **图片 (Pictures)**: Lists imported local images, features the search queries, and CLIP classification tags.
    *   **视频 (Videos)**: Lists imported video files and supports native video playbacks inside the detailed preview modal.
    *   **音频 (Audio)**: Lists audio files and embeds a standard HTML5 audio player.
    *   **文件 (Files)**: Displays documents and files with type attributes.
*   **Theme Switcher**: Circular button in the top-right header allowing toggling between Dark Mode and Light Mode via `:root` CSS variables.
*   **Custom Windows Frame**: Default menu bar (`File Edit View Window Help`) is removed on Windows by calling `mainWindow.setMenu(null)` in `main.cjs` to make the window clean.

---

## ⚡ Connection Heartbeats & Decoupled Lifecycle

To maintain connection stability and avoid false drops during heavy tasks (like local ONNX classification):
1.  **Relaxed Heartbeats**: WebRTC DataChannel heartbeats run every **3 seconds** (Ping packet) and trigger timeout teardowns only after **15 seconds** of total silence.
2.  **Decoupled BLE & WebRTC**: Once the WebRTC link transitions to `'connected'`, both clients ignore BLE status updates. Disconnection of the BLE channel (typically triggered by Android battery optimization) does not interrupt the active WebRTC direct transfer link.

---

## 📶 Local Wi-Fi Hotspot Mode

For environments without standard Wi-Fi router coverage or with client isolation restrictions, the PC client can create a local Wi-Fi Hotspot:
1.  **User-Mode UWP Wi-Fi Direct**: The primary AP mechanism runs on WinRT APIs without requiring administrative privilege elevation and operates fully offline.
2.  **Failover Pipeline**: If Wi-Fi Direct fails, it cascades automatically to Windows Mobile Hotspot (Tethering Manager) and legacy `netsh wlan hostednetwork` commands.
3.  **Automatic Synchronization Coexistence**: When Hotspot is enabled, the BLE signaling server is spawned concurrently to generate pairing QR codes, allowing mobile clients to connect to the Wi-Fi AP first and then scan to complete WebRTC direct channel negotiation.

