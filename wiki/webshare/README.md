# ShareCLIP WebShare 技术架构与实现白皮书

> **WebShare** 是 ShareCLIP 生态体系中革命性的**纯浏览器端跨端互联与端侧 AI 相册管理解决方案**。  
> 无需在电脑端安装任何可执行程序，用户只需在现代浏览器（Chrome / Edge）中打开网页，即可通过扫码与 Android 手机建立高速点对点（P2P）直连传输，并在浏览器内部利用 **WebGPU 硬件加速** 与 **MobileCLIP2 视觉大模型** 完成毫秒级图像特征提取、15 场景智能分类及持久化存储。

---

## 🌟 核心特性与架构矩阵

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ShareCLIP WebShare                               │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│   🚀 零服务器后端     │   🧠 纯端侧 WebGPU AI │   ⚡ WebRTC 千兆 P2P 直连    │
│   100% 静态前端托管   │   MobileCLIP2 视觉模型│   手机与浏览器局域网高速传输 │
│   IndexedDB 本地持久化│   15 类场景秒级零样本 │   无服务器流量与隐私泄露风险 │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│   🖼️ 谷歌相册沉浸查看 │   🪟 虚拟视窗 60fps  │   📅 EXIF 时间从近到远倒序   │
│   1:1 还原 Google Photos│   40张分片视窗滚动   │   毫秒级时间模式与原图解析   │
│   全键盘快捷键+毛玻璃 │   shallowRef 内存减负│   智能去重与差分增量写入     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 📚 文档目录索引

为了系统化梳理 WebShare 的全流程实现细节，本专题文档划分为以下五个核心技术章节：

| 章节编号 | 模块名称 | 核心内容概述 |
| :--- | :--- | :--- |
| [**01**](./01_architecture_and_p2p_protocol.md) | **系统架构与 P2P 通信协议** | WebRTC DataChannel 握手流程、UDP 15185 本地发现、二进制分片帧协议、信令中继方案 |
| [**02**](./02_webgpu_mobileclip_ai_engine.md) | **WebGPU 端侧 AI 引擎与模型适配** | MobileCLIP2-S0 ONNX 模型架构、Web Worker 并行推理、图像预处理、潜在空间余弦对齐与 CacheStorage 缓存 |
| [**03**](./03_storage_and_performance_optimizations.md) | **本地存储与 60fps 性能优化** | IndexedDB 架构、SHA-256 去重、EXIF 时间倒序解析、`shallowRef` 内存减负、虚拟视窗滚动与 120ms 帧合并 |
| [**04**](./04_google_photos_gallery_and_ui.md) | **Google Photos 风格画廊与大图查看器** | Flickr/Google 等高 Flex 画廊流、1:1 全屏沉浸式查看器、全套键盘快捷键与毛玻璃 AI 详情抽屉 |
| [**05**](./05_deployment_and_ci_cd.md) | **全静态化部署与 CI/CD 流水线** | GitHub Pages 二级目录部署、官网入口嵌入、Cloudflare Worker 零成本信令、`auto_deploy.ps1` 一键发布 |

---

## 🛠️ 技术栈总览

- **前端核心框架**：Vue 3 (Composition API, `script setup`, `shallowRef`)
- **构建工具链**：Vite 5 (带有内置 UDP/WS 混合信令插件)
- **WebRTC 协议栈**：原生浏览器 `RTCPeerConnection` + `RTCDataChannel` (Binary SCTP)
- **端侧 AI 运行时**：ONNX Runtime Web (`onnxruntime-web` 1.18.0)
- **AI 硬件加速后端**：WebGPU (第一优先级) + WASM SIMD Threaded (CPU 回退兜底)
- **预训练模型**：Apple MobileCLIP2-S0 Image Encoder (47.4 MB 独立优化版) + 512 维文本特征向量
- **浏览器数据库**：IndexedDB (`webshare-ai`，支持 Blob 二进制与向量索引)
- **部署模式**：GitHub Pages 纯静态网站 (无任何原生 Node.js/Python 依赖)
