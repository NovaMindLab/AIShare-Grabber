# Electron 桌面端 UI 极简化与全局国际化架构白皮书

本文档系统整理了 ShareCLIP Electron 桌面端在界面极简重构、设备配对体验优化、默认英文（English）配置及全组件多语言（i18n）架构的实现细节。

---

## 1. 配对连接界面极简重构

### 1.1 历史问题与重构目标
在此前的版本中，桌面端配对页面（Link Mobile）采用了左右双栏分栏卡片：
- **左侧**：二维码与状态指示；
- **中间**：`OR` 分割线；
- **右侧**：手机连接指引（步骤 1~4）、小贴士、本地导入卡片及 3D 手机模型。

由于功能堆砌过多，导致主视觉杂乱、信息层级不够聚焦。

### 1.2 重构方案
将配对区域重构为**居中、纯净、高聚焦的单体卡片**：
- 🟣 **主标题**：`Recommended: Scan QR Code`
- 📱 **清晰二维码**：带精致外发光与悬浮平滑放大微动效
- 💬 **操作指引**：`Please scan the QR code with ShareCLIP Mobile App`
- 🔘 **底部状态药丸按钮**：`Bluetooth: Enabled/Disabled` 与 `Hotspot: Enabled/Disabled` 一键启停服务。

```html
<!-- Main Simplified Pairing Card (Clean & Focused) -->
<div v-if="syncStatus !== 'connected'" class="pairing-card-centered">
  <h4>
    <span class="pulse-dot"></span>
    {{ t.link.qrTitle }}
  </h4>
  
  <div class="qr-canvas-wrapper">
    <canvas ref="qrCanvas"></canvas>
  </div>

  <p>{{ t.link.qrSub }}</p>

  <div class="status-pills-row">
    <button @click="toggleSyncService">
      {{ t.link.bleLabel }}: {{ isSyncActive ? t.link.enabled : t.link.disabled }}
    </button>
    <button @click="toggleHotspot">
      {{ t.link.hotspotLabel }}: {{ isHotspotActive ? t.link.enabled : t.link.disabled }}
    </button>
  </div>
</div>
```

---

## 2. 全局国际化 (i18n) 架构与默认英文

### 2.1 语言初始化与持久化策略
应用默认采用 **English（英文）** 作为国际化基础语言环境，同时支持在 `Settings`（系统设置）中自由切换为 20 种语言，并持久化到 `localStorage` 中：

```javascript
// cp_clip/src/App.vue
function getInitialLocale() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('shareclip_locale') : null;
  if (saved && locales[saved]) return saved;
  return 'en'; // 默认进入英文语言环境
}

const currentLocale = ref(getInitialLocale());
const t = computed(() => locales[currentLocale.value] || locales.en);

watch(currentLocale, (newLoc) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('shareclip_locale', newLoc);
  }
});
```

### 2.2 统一组件国际化词条规范
所有界面模块均严格使用响应式计算属性 `t.xxx` 映射，杜绝中英文混杂：

| 模块 | 键名路径 | 英文 (en) | 中文 (zh) |
| :--- | :--- | :--- | :--- |
| **侧边栏** | `t.sidebar.tabYtDlp` | Video Downloader | 视频下载 |
| **顶部导航** | `t.link.openThumbnailFolder` | Open Thumbnail Folder | 打开缩略图目录 |
| **顶部导航** | `t.link.howToConnect` | How to Connect | 如何连接 |
| **顶部导航** | `t.link.enterCodeBtn` | Enter Code | 输入连接码 |
| **配对卡片** | `t.link.qrTitle` | Recommended: Scan QR Code | 推荐方式：扫码连接 |
| **配对卡片** | `t.link.bleLabel` | Bluetooth | 蓝牙 |
| **配对卡片** | `t.link.hotspotLabel` | Hotspot | 热点 |
| **设备发现** | `t.link.discoveryTitle` | Searching for nearby devices... | 正在自动搜索附近设备... |
| **连接日志** | `t.link.logsTitle` | Connection Logs | 连接日志 |

---

## 3. 构建与发版自动化流程

全量构建脚本 `auto_deploy/deploy.ps1` 包含以下自动化流水线：
1. **自动版本自增**：同步升级 `cp_clip`、`web`、`webshare`、`android` 的版本号；
2. **WebShare & 静态站构建**：构建 WebGPU AI 引擎与 WASM 运行时，合并至 `web/dist/webshare/`；
3. **Electron 应用打包**：通过 `vite build` + `electron-builder` 打包生产环境安装包；
4. **Android APK 编译**：使用统一证书签名构建 ARM64 轻量安装包；
5. **多端同步发布**：自动推送 GitHub Pages 官网并创建 GitHub Release 附带全部二进制资产。
