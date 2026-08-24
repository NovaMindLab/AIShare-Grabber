# ShareCLIP Web Official Website Documentation

This directory contains the design guidelines for the **ShareCLIP Official Landing Page**. The actual codebase is located at the root `/web` folder of this project.

---

## 🌐 Project Overview
The ShareCLIP official website is built using **Vue 3** and **Vite** as a premium, highly responsive landing page. It showcases the features of the cross-platform photo sync system and provides direct download links for the desktop app and mobile companion APK.

## 🎨 Design System & Interactive Modules
*   **Colors**: Sleek Dark Mode (Slate-950 background) with glowing **Neon Purple** (connection & streaming flow) and **Emerald Green** (AI/CLIP processing) gradients.
*   **Typography**: Inter or System Sans-Serif font, optimized for readability.
*   **Aesthetics**: Glassmorphism, modern grid patterns, glowing cards, and smooth hover micro-animations.
*   **🎬 官方实机演示与推广视频展区 (`#video-demo`)**：包含拟态桌面窗口顶栏、高清 1080P HTML5 视频播放器（`/promo_video.mp4`）、4 大核心技术标签矩阵与一键快捷体验/下载入口。
*   **🧠 端侧 AI 交互式演练场 (`#ai-ecosystem`)**：提供自然语言 512-D 语义搜图、SIMD 128 位人脸聚类时间轴、以及 Leader Centroid 重复抓拍去重模拟。
*   **⚡ 局域网 P2P 零流量直连演示器 (`#simulator`)**：动态 60fps 流程图与 4 步交互式 BLE GATT 蓝牙信令控制台。
*   **🌍 20 种国际化多语言支持**：全语种纯净字典映射，支持简中、繁中、英语、日语、韩语、西班牙语、德语、法语等。

## 🚀 Running Locally
To launch the developer preview of the website:
1. Navigate to the top-level `web` directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
