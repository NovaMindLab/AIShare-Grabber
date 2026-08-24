# 📱 WebShare iOS 专属移动端控制台 (mshare.html) 架构设计

---

## 1. 产生背景与设计定位

WebShare 早期以桌面浏览器与平板设备为主要设计参考，在手机移动端（特别是 iOS Safari / 微信内置浏览器 / Chrome 移动版）访问时，存在窗口元素紧凑、导航栏挤压、触控区域过小等体验问题。

为此，在 **WebShare** 项目中独立构建了 **iOS & 移动端专属控制台页面 `mshare.html`**，与桌面版 `index.html` 共享同一底层 WebRTC P2P 引擎与本地 IndexedDB 存储，但拥有为触屏交互专门定制的移动端原生 UI。

---

## 2. 核心架构与技术实现

### 2.1 双页面架构与自动重定向机制

```
                     ┌───────────────────────────────┐
                     │   用户访问 WebShare URL       │
                     └───────────────┬───────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
      【User-Agent 为移动端设备】               【User-Agent 为桌面端设备】
      /webshare/mshare.html                   /webshare/index.html
      (触控大按钮、沉浸式卡片、底部导航栏)      (宽屏画廊、Google Photos 式侧边栏)
```

- **路由与入口**：构建产物包含 `index.html` (PC 端) 与 `mshare.html` (手机端)。
- **响应式检测**：在 `index.html` 入口脚本中通过 `navigator.userAgent` 自动嗅探 iOS/Android 移动端设备，若为手机屏幕则平滑提示或跳转至 `mshare.html`。

### 2.2 移动端三段式底部导航与功能模块

1. **`[ 📱 手机相册 ]` (Gallery Tab)**：
   - 采用大圆角单列/双列卡片流布局，针对视网膜屏幕优化字体与图片显示。
   - 提供直接调用 iOS 系统相册选择器（`<input type="file" accept="image/*,video/*" multiple>`）与一键拖放上传。
2. **`[ 🔗 连接电脑 ]` (Pairing Tab)**：
   - 内置轻量化扫码器与 6 位数字局域网配对码输入框。
   - 实时显示局域网 WebRTC DataChannel 握手状态与传输速率统计。
3. **`[ ⚙️ 传输设置 ]` (Settings Tab)**：
   - 传输并发度控制、自动清理临时缓存选项、深浅色模式切换与多语言选择。

### 2.3 触控优化与 iOS 专属兼容性

- **Safe Area 适配**：全面引入 `padding-bottom: env(safe-area-inset-bottom)` 与 `padding-top: env(safe-area-inset-top)`，完美避开 iPhone 灵动岛与底部横条 Home Indicator。
- **避免 300ms 触控延迟**：禁用不必要的点击延时，全触控区域增大至最小 `44×44 pt`（符合 Apple Human Interface Guidelines）。
- **iOS WebRTC 权限与后台心跳**：针对 Safari 在后台锁屏时暂停 WebRTC 数据通道的特性，增加前台恢复自动重连与探针保活机制。
