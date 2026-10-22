# 🌟 awesome-selfhosted PR 提交指南 (直接可用)

> **操作步骤**: Fork `awesome-selfhosted/awesome-selfhosted`，编辑 `README.md`，在对应分类下插入一行，提交 PR。

---

## 目标仓库
- **仓库**: [awesome-selfhosted/awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) (⭐ 210k+)
- **提交入口**: https://github.com/awesome-selfhosted/awesome-selfhosted/edit/master/README.md

---

## PR Title
```
Add ShareCLIP - Local-first P2P file sync with on-device AI photo search
```

## PR Description (Markdown)
```markdown
## What is ShareCLIP?

[ShareCLIP](https://github.com/NovaMindLab/AIShare-Grabber) is a local-first, open-source multimedia synchronization and AI photo management suite.

### Key Features
- **P2P File Transfer**: 80+ MB/s local Wi-Fi transfer via WebRTC DataChannels, zero cloud relay
- **On-Device AI Photo Search**: Embedded Apple MobileCLIP2-S0 model (74.8M params) running via ONNX Runtime for natural language semantic photo search — 100% offline
- **Face Recognition & Clustering**: Automatic face grouping via SCRFD + MobileFaceNet
- **4K Video Downloader**: Integrated yt-dlp engine supporting 1000+ sites
- **Cross-Platform**: Windows, macOS (ARM64 + Intel), Android, Linux, Web (WebShare)
- **20 Languages**: Fully localized interface

### Placement
I've added it under **Photo and Video Galleries** as it primarily serves as a local AI photo gallery with integrated P2P sync capabilities.

### Checklist
- [x] The software is actively maintained
- [x] Licensed under an OSI-approved license (MIT)
- [x] Hosted on a public source code repository (GitHub)
- [x] Follows the formatting guidelines
- [x] Not a duplicate entry
```

---

## 插入位置与内容

### 位置 1: Photo and Video Galleries 分类

在 `README.md` 的 `### Photo and Video Galleries` 部分，按字母顺序插入（在 S 字母位置）：

```markdown
- [ShareCLIP](https://github.com/NovaMindLab/AIShare-Grabber) - Local-first P2P photo/video sync with on-device MobileCLIP AI semantic search, face clustering, and 4K video downloader. No cloud required. `MIT` `Nodejs/Electron/Flutter`
```

### 位置 2 (备选): File Transfer - Peer-to-peer Filesharing 分类

如果审核员认为更适合归类到传输工具，可放在 `### File Transfer - Peer-to-peer Filesharing`：

```markdown
- [ShareCLIP](https://github.com/NovaMindLab/AIShare-Grabber) - High-speed local Wi-Fi P2P file transfer (80+ MB/s via WebRTC) with integrated on-device AI photo search and gallery management. `MIT` `Nodejs/Electron`
```

---

## 操作流程 (3 分钟完成)

1. **打开编辑器**: 点击 https://github.com/awesome-selfhosted/awesome-selfhosted/edit/master/README.md
2. **搜索定位**: 按 `Ctrl+F` 搜索 `### Photo and Video Galleries`
3. **找到字母 S 位置**: 在该分类下找到以 S 开头的条目（如 `Sigal`、`SPIS` 等），在合适的字母顺序位置插入上面的一行
4. **填写 Commit 信息**: `Add ShareCLIP - Local-first P2P file sync with on-device AI photo search`
5. **选择 "Create a new branch" → 点击 "Propose changes"**
6. **填写 PR Title 和 Description**（直接复制上面的内容）
7. **提交 PR**

---

## 同步提交: awesome-flutter (52k+ ⭐)

### 仓库
- **仓库**: [Solido/awesome-flutter](https://github.com/Solido/awesome-flutter)
- **编辑入口**: https://github.com/Solido/awesome-flutter/edit/master/README.md

### 插入位置
在 `## Open Source Apps` → 找到合适的分类（Media 或 Utilities），按字母顺序插入：

```markdown
- [ShareCLIP](https://github.com/NovaMindLab/AIShare-Grabber) - Cross-platform P2P media sync with on-device AI photo search. Flutter Android + Electron desktop. by [@NovaMindLab](https://github.com/NovaMindLab).
```

### PR Title
```
Add ShareCLIP - Cross-platform P2P media sync with on-device AI search
```

---

## 同步提交: awesome-electron (27k+ ⭐)

### 仓库
- **仓库**: [sindresorhus/awesome-electron](https://github.com/sindresorhus/awesome-electron)
- **编辑入口**: https://github.com/sindresorhus/awesome-electron/edit/main/readme.md

### 插入位置
在 `## Open Source` 部分，按字母顺序插入：

```markdown
- [ShareCLIP](https://github.com/NovaMindLab/AIShare-Grabber) - Local-first P2P media suite with on-device MobileCLIP AI photo search, face recognition, and 4K video downloader.
```

### PR Title
```
Add ShareCLIP - Local-first media suite with on-device AI
```

---

## 同步提交: awesome-privacy (17k+ ⭐)

### 仓库
- **仓库**: [pluja/awesome-privacy](https://github.com/pluja/awesome-privacy)
- **编辑入口**: https://github.com/pluja/awesome-privacy/edit/main/README.md

### 插入位置
在 `## File Management and Sharing` 或 `## Photo Storage` 分类下插入：

```markdown
- [ShareCLIP](https://github.com/NovaMindLab/AIShare-Grabber) - Open-source P2P AirDrop alternative with 100% on-device AI photo search. Zero cloud, zero telemetry, zero accounts.
```

### PR Title
```
Add ShareCLIP to File Sharing / Photo Storage
```
