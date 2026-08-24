# PC Desktop Client: Lightbox Stacking Context & Window Controls Architecture

This document details the architecture, root cause analysis, and resolution for full-screen immersive gallery viewing (Lightbox) and custom frameless window title bar stacking contexts in the Electron desktop client (`cp_clip`).

---

## 🔍 Root Cause: Stacking Context Collision

In Electron applications configured with `frame: false` (frameless window), custom title bars are implemented via HTML/CSS components (`.custom-title-bar`).

### The Bug
1. **Title Bar Layer**:
   ```css
   .custom-title-bar {
     height: 38px;
     z-index: 9999;
     -webkit-app-region: drag;
     position: fixed; /* or top flow */
   }
   ```
2. **Old Lightbox Layer**:
   ```html
   <div class="lightbox-backdrop" style="position: fixed; inset: 0; z-index: 1000; ...">
   ```
3. **Collision Effect**:
   Because `z-index: 9999 > 1000`, the 38px title bar (containing the `⚙️ 设置` button and window minimize/maximize/close buttons) rendered directly on top of the Lightbox header.
   - The Lightbox close button (`✕`) was positioned at `top: 14px; right: 32px;`, falling directly underneath the window control buttons.
   - Mouse clicks were intercepted by the title bar's drag region (`-webkit-app-region: drag`) and window control buttons, making it impossible or difficult to click the Lightbox close button.

---

## 🛠️ Stacking Context & Header Architecture

### 1. Elevated Z-Index Hierarchy
The Lightbox backdrop was elevated to `z-index: 10000`, creating a clean layer above the default app title bar:

```
+-----------------------------------------------------------+
| Layer 3: Lightbox Backdrop & Controls (z-index: 10000)    |  ← Topmost
+-----------------------------------------------------------+
| Layer 2: Custom Window Title Bar (z-index: 9999)          |  ← Standard UI
+-----------------------------------------------------------+
| Layer 1: App Main Content & Photo Grid (z-index: 1-100)   |  ← Base
+-----------------------------------------------------------+
```

### 2. Multi-Zone Lightbox Header Layout
The Lightbox top header (`52px` height) was redesigned into three distinct functional zones:

```
+----------------------------------------------------------------------------------------------------------------+
|  [📄 Photo Name & Quality Badge]   |                 [ Window Drag Area ]                | [ 1/45 ] [ ✕ 关闭大图 ESC ] [ — 口 X ] |
|  (-webkit-app-region: no-drag)     |             (-webkit-app-region: drag)              |      (-webkit-app-region: no-drag)     |
+----------------------------------------------------------------------------------------------------------------+
```

#### Left Zone: Information & Quality Status (`no-drag`)
* Displays photo filename and path with ellipsis text overflow protection.
* Dynamic Quality Badge:
  * 🌐 `正在从手机拉取超清原图...` (Active WebRTC chunk streaming)
  * ✨ `超清原图` (Lossless 4K original ready)
  * 📁 `本地图片` (Local PC disk file)
  * ⚡ `缩略图预览 (手机未连接)` (Cached thumbnail mode)

#### Center Zone: Window Drag Surface (`drag`)
* Flex fill area (`flex: 1; height: 100%; -webkit-app-region: drag;`) allowing users to freely move the Electron window across monitors while inspecting full-screen photos.

#### Right Zone: Action & Control Suite (`no-drag`)
* **Counter Pill**: `{{ currentViewingIndex + 1 }} / {{ currentViewingList.length }}`
* **Prominent Close Pill**:
  ```html
  <button 
    @click="closeDetails" 
    title="退出大图浏览 (ESC)"
    class="lightbox-close-pill"
  >
    <span>✕</span>
    <span>关闭大图</span>
    <span class="kbd-badge">ESC</span>
  </button>
  ```
* **Integrated Window Controls**:
  Direct access to minimize, maximize/restore, and app close (`minimizeWindow`, `maximizeWindow`, `closeWindow`) without exiting the full-screen photo viewer.

---

## ⌨️ Keyboard Shortcuts & Dismissal Mechanisms

To guarantee effortless exit from full-screen viewing:
1. **Close Pill Click**: Taps the top-right red-tinted close button.
2. **Backdrop Click**: `@click.self="closeDetails"` dismisses when tapping anywhere on the dark blurred background.
3. **ESC Key Listener**: `window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetails(); })`.
4. **Left / Right Arrow Keys**: Previous (`←`) and Next (`→`) photo navigation.

---

## 🧪 Verification & Build Status

* **Build**: Vite production build succeeded (`npm run build` in `cp_clip`).
* **Packaging**: NSIS Windows installer verified.
