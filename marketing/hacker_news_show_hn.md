# 🚀 Hacker News "Show HN" 发帖文案

* **Target**: Hacker News (https://news.ycombinator.com/submit)
* **Title**:
  > *Show HN: ShareCLIP – Local-First P2P AirDrop Alternative with MobileCLIP AI Search*

* **URL**: `https://github.com/NovaMindLab/AIShare-Grabber`
* **Text / First Comment (post immediately after submitting)**:
```text
Hi HN,

I built ShareCLIP (https://github.com/NovaMindLab/AIShare-Grabber) out of personal frustration with the fragmentation of cross-device file transfer and cloud photo subscriptions.

Most people either rely on cloud storage (Google Photos, iCloud, OneDrive) or proprietary walled gardens (Apple AirDrop, Quick Share). Both have serious drawbacks: privacy concerns, recurrent fees, and cross-OS incompatibility.

ShareCLIP is an open-source, local-first media powerhouse designed to bridge Android, Windows, macOS, Linux, and Web browsers with zero cloud reliance.

Some technical highlights:
1. P2P Transport: Uses WebRTC DataChannels over local Wi-Fi Hotspot or LAN. When both devices are nearby, transfer rates easily saturate local Wi-Fi bandwidth (30–60 MB/s) without sending a single byte over the public internet.
2. Zero-Install Web Client: Includes WebShare, a pure-browser receiver that negotiates P2P WebRTC data streams and WebGPU shaders locally in Chromium/WebKit.
3. On-Device Semantic Search: Runs Apple's MobileCLIP2 model locally via ONNX Runtime and SIMD WebAssembly. You can query your offline library using natural language ("red car on rainy street", "receipt from Starbucks") without leaking pictures to external LLM APIs.
4. Universal Video Downloader & Detached Player: Wraps yt-dlp with anti-bot evasion, automatic FFmpeg DASH stream merging, and a frameless HTML5 player window utilizing Electron protocol handlers with HTTP 206 Partial Content Range streaming.

The codebase is open source (MIT). Looking forward to your thoughts and feedback on the architecture!
```
