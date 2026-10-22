---
title: "How I Built an 80 MB/s Zero-Cloud AirDrop Alternative with On-Device MobileCLIP AI Search"
published: false
description: "ShareCLIP is an open-source, local-first media suite: WebRTC P2P transfers at 50-85 MB/s, on-device CLIP image search at 48+ FPS, face clustering, video downloading — all offline. MIT licensed."
tags: opensource, webrtc, ai, privacy
cover_image: https://novamindlab.github.io/AIShare-Grabber/og-image.png
canonical_url: https://novamindlab.github.io/AIShare-Grabber/
---

I've been chasing a single, stubborn idea for the past two years: **your photos, your network, your hardware — no cloud middleman.** What started as a weekend hack to AirDrop files between my Windows laptop and Android phone turned into [ShareCLIP](https://github.com/NovaMindLab/AIShare-Grabber), an open-source, local-first media suite that now ships P2P file transfer, on-device AI image search, face recognition, a video downloader, and anime-style neural transfer — across Windows, macOS, Linux, Android, and the browser.

No accounts. No subscriptions. No upload-your-life-to-someone-else's-server.

This post is a deep technical walkthrough of the architecture, the benchmarks I obsessed over, and the design decisions that kept everything running on-device. If you've ever wanted to understand how WebRTC DataChannels, ONNX Runtime, and MobileCLIP fit together in a shipping product, read on.

---

## The Problem: Cross-Platform File Sharing is Broken

You know the drill. AirDrop only talks to Apple. Nearby Share only talks to Android/Chrome OS. Windows "Nearby Sharing" barely talks to itself. And every third-party alternative either:

1. **Routes through a cloud relay** — your 4K vacation photos take a scenic detour through AWS before arriving on the laptop sitting 30 cm away.
2. **Requires both devices to install an app** — good luck convincing a friend to install something just to receive three photos.
3. **Treats search as a cloud feature** — Google Photos is magical, but the magic lives on Google's servers and costs $2.99/month once you cross 15 GB.

I wanted something that:

- Transfers at **wire speed** over local Wi-Fi, peer-to-peer, zero cloud.
- Lets a receiver **open a browser tab** instead of installing anything.
- Searches photos **on-device** using real semantic AI, not filename grep.
- Is **MIT-licensed** so you can fork it, embed it, or just read the source.

That's ShareCLIP.

---

## Architecture Deep Dive

### 1. P2P Transfer: WebRTC DataChannels over Local Wi-Fi

The transfer engine uses **WebRTC DataChannels** for the actual data plane and **UDP broadcast discovery** on port `15185` for the signaling/discovery layer. Here's how devices find each other:

```
┌──────────────┐   UDP broadcast :15185   ┌──────────────┐
│   Device A   │ ◄──────────────────────► │   Device B   │
│  (Electron)  │                          │  (Flutter)   │
│              │   WebRTC DataChannel      │              │
│              │ ════════════════════════► │              │
│              │   (SCTP / DTLS / UDP)     │              │
└──────────────┘                          └──────────────┘
```

**Discovery phase.** Each device periodically broadcasts a JSON beacon over UDP on port 15185 containing its device name, platform, and a truncated fingerprint of its DTLS certificate. Every other device on the same subnet picks it up. No mDNS, no Bonjour, no central signaling server. Just raw UDP broadcast.

**Connection phase.** Once a user selects a target device, a WebRTC `RTCPeerConnection` is created. SDP offer/answer is exchanged over a short-lived UDP channel (the same port 15185, just unicast now). ICE candidates are local-only — we explicitly filter out STUN/TURN candidates so traffic never leaves the LAN.

**Data phase.** Files are chunked and sent over an ordered, reliable SCTP DataChannel. We use a sliding-window acknowledgment scheme to keep the pipe saturated without blowing the SCTP send buffer. The chunk size is tuned per-platform (64 KB on desktop, 16 KB on Android due to the Flutter WebRTC bridge's buffer constraints).

**Real-world throughput:**

| Scenario | Throughput |
|---|---|
| Desktop ↔ Desktop (Wi-Fi 6) | 75–85 MB/s |
| Desktop → Android (Wi-Fi 5) | 50–65 MB/s |
| Desktop → WebShare (Chrome) | 55–70 MB/s |

That's **zero cloud relay servers.** The bits go directly from NIC to NIC.

### 2. WebShare: Zero-Install Browser Receiver

This is my favorite piece. The receiver doesn't need to install anything — they just open a URL in any modern Chromium or WebKit browser.

The desktop app spins up a lightweight HTTP server on the local network. The receiver scans a QR code or taps a link, which loads a single-page app that:

1. Establishes a WebRTC DataChannel back to the sender (signaling over the same HTTP connection via WebSocket upgrade).
2. Receives file chunks and assembles them in-memory using `SharedArrayBuffer` for zero-copy slicing.
3. Optionally renders image previews using **WebGPU shaders** for fast color-space conversion and thumbnail generation — no canvas 2D round-trip.

`SharedArrayBuffer` is the key optimization here. Without it, every chunk copy doubles memory pressure. With it, we can write directly into a contiguous buffer and hand it off to a `Blob` for download without any intermediate copies.

```javascript
// Simplified: zero-copy chunk assembly with SharedArrayBuffer
const sharedBuffer = new SharedArrayBuffer(fileSize);
const view = new Uint8Array(sharedBuffer);

dataChannel.onmessage = (event) => {
  const chunk = new Uint8Array(event.data);
  view.set(chunk, offset);
  offset += chunk.byteLength;
  
  if (offset === fileSize) {
    const blob = new Blob([view], { type: mimeType });
    triggerDownload(blob, fileName);
  }
};
```

The result: your non-technical friend receives files at 55+ MB/s in a browser tab. No app install. No sign-up. Just a link.

### 3. On-Device AI Image Search: MobileCLIP + ONNX Runtime

This is where it gets fun. ShareCLIP ships a full **CLIP-based semantic search** engine that runs entirely on your machine.

**The model.** We use Apple's [MobileCLIP2-S0](https://arxiv.org/abs/2311.17049), a distilled vision-language model with 74.8M parameters. It hits 71.5% top-1 accuracy on ImageNet zero-shot — not state-of-the-art for a research model, but extremely competitive for a model that fits in ~35 MB and runs on a phone CPU.

**The runtime.** ONNX Runtime, trimmed down to 18.2 MB in the Electron bundle. On Windows, we enable the **DirectML execution provider** for GPU acceleration. On macOS, CoreML. On Linux, CPU with OpenMP threading.

**The pipeline:**

```
┌─────────┐    ┌────────────────┐    ┌───────────────┐    ┌──────────┐
│  Image  │ →  │  Resize/Crop   │ →  │  MobileCLIP    │ →  │ 512-D    │
│  File   │    │  256×256 RGB   │    │  Image Encoder │    │ Embedding│
└─────────┘    └────────────────┘    └───────────────┘    └──────────┘

┌───────────┐    ┌───────────────┐    ┌──────────┐
│  "sunset  │ →  │  MobileCLIP   │ →  │ 512-D    │
│  beach"   │    │  Text Encoder │    │ Embedding│
└───────────┘    └───────────────┘    └──────────┘

              cosine_similarity(image_emb, text_emb) → rank
```

Each image is resized to 256×256, normalized, and fed through the image encoder to produce a **512-dimensional embedding vector**. Text queries go through the text encoder to produce a matching 512-D vector. Search is just cosine similarity between the query vector and every stored image vector.

**Indexing performance:**

| Metric | CPU (Ryzen 7 5800X) | GPU (DirectML, RTX 3060) |
|---|---|---|
| Single image encode | 76.2 ms | 38.5 ms |
| Text query encode | ~3.3 ms | ~3.3 ms |
| Multi-worker throughput | 13+ FPS | 48+ FPS |
| 10,000 photos indexed | ~12.8 min | ~3.5 min |

Once indexed, **search is instant.** The cosine similarity computation over 10,000 512-D vectors takes single-digit milliseconds. You type "dog on beach" and results appear before you lift your fingers from the keyboard.

The embeddings are stored in a local SQLite database alongside file paths and EXIF metadata. No cloud. No API calls. Your photo semantics never leave your machine.

### 4. Face Recognition Pipeline

ShareCLIP includes automatic face grouping using a three-stage pipeline:

1. **Detection:** [SCRFD 500M](https://arxiv.org/abs/2105.04714) — a lightweight face detector that runs in ~8 ms per frame on GPU. Detects faces with 5-point landmark alignment.
2. **Embedding:** MobileFaceNet — generates a 512-dimensional face embedding per detected face.
3. **Clustering:** Two-stage Hierarchical Agglomerative Clustering (HAC). The first pass groups faces with high cosine similarity (>0.72), then a second pass merges remaining clusters with a slightly relaxed threshold.

The result: open your photo library, and ShareCLIP automatically groups photos by person — entirely offline.

### 5. Video Downloader

Built on [yt-dlp](https://github.com/yt-dlp/yt-dlp) with support for **1,000+ sites**. ShareCLIP wraps it with:

- **FFmpeg DASH merging** for sites that serve separate audio/video streams.
- A **frameless Electron HTML5 player** with HTTP 206 Range request streaming — you can watch while downloading.
- Queue management, format selection, and subtitle extraction, all from the GUI.

### 6. AnimeGAN Studio

Neural style transfer with three pre-trained models: Miyazaki, Shinkai, and Kon styles. Runs on GPU (ONNX Runtime + DirectML/CoreML) or falls back to CPU. It's a fun feature, but it also stress-tested our ONNX Runtime integration in ways that directly improved the CLIP pipeline's stability.

---

## Desktop Stack: Electron, Carefully

Yes, I know. "Electron bad." But here's the thing: Electron gives us a single codebase for Windows, macOS (ARM64 + Intel universal binary), and Linux, with native access to ONNX Runtime, FFmpeg, and raw UDP sockets via Node.js addons.

The key was keeping the bundle lean:

| Component | Size |
|---|---|
| ONNX Runtime (trimmed) | 18.2 MB |
| MobileCLIP model | ~35 MB |
| yt-dlp + FFmpeg | ~85 MB |
| Electron + App Code | ~85 MB |
| **Total installer (LZMA)** | **~223 MB** |

For context, Google Chrome is ~200 MB. We ship an entire AI-powered media suite in roughly the same footprint.

## Mobile: Flutter + WebRTC Bridge

The Android app is built with **Flutter** and communicates with desktop instances over the same WebRTC DataChannel protocol. The Flutter side uses a native WebRTC plugin with a custom DataChannel bridge that handles the chunked transfer protocol.

Currently Android-only. iOS is on the roadmap — the main blocker is Apple's restrictions on background WebRTC connections, not the code itself.

---

## Competitor Comparison

Here's an honest comparison. I'm not going to pretend ShareCLIP beats everyone at everything — but it does occupy a unique spot.

| Feature | ShareCLIP | LocalSend | AirDrop | Google Photos | Immich |
|---|---|---|---|---|---|
| **P2P Transfer** | ✅ WebRTC, 50-85 MB/s | ✅ HTTP, ~40 MB/s | ✅ Proprietary, ~100 MB/s | ❌ Cloud only | ❌ Server upload |
| **Zero-install receiver** | ✅ WebShare (browser) | ❌ App required | ❌ Apple only | ❌ App/web (cloud) | ❌ App required |
| **AI Image Search** | ✅ On-device MobileCLIP | ❌ | ❌ | ✅ Cloud-based | ✅ Server-side ML |
| **Face Recognition** | ✅ On-device | ❌ | ❌ | ✅ Cloud-based | ✅ Server-side |
| **Video Download** | ✅ 1000+ sites | ❌ | ❌ | ❌ | ❌ |
| **Privacy** | 🟢 Fully local | 🟢 Fully local | 🟡 Apple ecosystem | 🔴 Cloud-dependent | 🟡 Self-hosted server |
| **Platforms** | Win/Mac/Linux/Android/Web | Win/Mac/Linux/Android/iOS | Apple only | All (cloud) | All (self-hosted) |
| **License** | MIT | MIT | Proprietary | Proprietary | AGPL |
| **Cost** | Free | Free | Free (Apple HW) | Free tier, then $2.99/mo | Free (self-host) |
| **i18n** | 20 languages | 30+ languages | ~40 languages | 100+ languages | 18 languages |

**vs. LocalSend:** We share the same spirit — local-first, open-source. LocalSend is more focused and polished for pure file transfer. ShareCLIP adds AI search, face recognition, video downloading, and the zero-install WebShare receiver, at the cost of a larger binary.

**vs. AirDrop:** AirDrop is faster on Apple hardware and "just works" in that ecosystem. ShareCLIP works everywhere and doesn't require both devices to be Apple.

**vs. Google Photos:** Google's AI search is better (they have billion-parameter models on TPU clusters). But your photos live on Google's servers. ShareCLIP's search is "good enough" for most queries and runs entirely on your hardware.

**vs. Immich:** Immich is excellent if you want a self-hosted Google Photos replacement. But it requires a server running 24/7 with Docker. ShareCLIP runs directly on your desktop/phone with no server infrastructure.

---

## Getting Started

### Desktop (Windows / macOS / Linux)

Grab the latest release from the [GitHub Releases](https://github.com/NovaMindLab/AIShare-Grabber/releases) page:

- **Windows:** `.exe` installer (~223 MB)
- **macOS:** Universal `.dmg` (ARM64 + Intel)
- **Linux:** `.AppImage` or `.deb`

### Android

Download the APK from GitHub Releases or (coming soon) Google Play.

### WebShare (Receiver only)

No install needed. The sender generates a link/QR code. Open it in Chrome, Edge, or Safari.

### Build from Source

```bash
git clone https://github.com/NovaMindLab/AIShare-Grabber.git
cd AIShare-Grabber

# Desktop
npm install
npm run build

# Android
cd mobile
flutter pub get
flutter build apk
```

---

## What's Next

The roadmap includes:

- **iOS app** (Flutter, pending WebRTC background mode workarounds)
- **Batch face tagging** with custom name labels
- **CLIP model upgrades** — exploring MobileCLIP-B for higher accuracy at a small speed cost
- **Encrypted transfers** — optional end-to-end encryption layer over the DataChannel
- **Plugin architecture** — let the community add new AI models and tools

---

## Try It, Break It, Star It

ShareCLIP is MIT-licensed and actively maintained. If you've read this far, you're exactly the kind of person I built this for.

⭐ **[Star on GitHub](https://github.com/NovaMindLab/AIShare-Grabber)** — it genuinely helps with discoverability.

🌐 **[Project Website](https://novamindlab.github.io/AIShare-Grabber/)** — screenshots, docs, and download links.

🐛 **[Open an Issue](https://github.com/NovaMindLab/AIShare-Grabber/issues)** — bug reports, feature requests, "this crashed on my weird Arch setup" — all welcome.

💬 **[Discussions](https://github.com/NovaMindLab/AIShare-Grabber/discussions)** — architecture questions, integration ideas, or just say hi.

If you're building something in the local-first / on-device AI space, I'd love to hear about it. The future of personal software is private-by-default, and we're just getting started.

---

*ShareCLIP is developed by [NovaMindLab](https://github.com/NovaMindLab). MIT License. All processing happens on your device. We don't collect telemetry, analytics, or crash reports unless you explicitly opt in.*
