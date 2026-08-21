# 05. 全静态化部署与 CI/CD 自动化流水线

WebShare 拥有**纯静态前端架构**，可以极其低成本、高可靠地部署在 **GitHub Pages**、**Cloudflare Pages**、**Vercel** 或任何静态 Web 服务器上。

---

## 1. 官网（`web/`）与 WebShare 静态合并机制

为了让用户在访问官方网站时能够一键直达 WebShare，构建流水线将两者整合为一个统一的静态站点：

```
GitHub Pages 部署产物目录 (site_dist/)
 ├── index.html                  <-- 官网主页 (ShareCLIP 介绍与客户端下载)
 ├── assets/                     <-- 官网静态资源
 ├── hero_banner.jpg             <-- 官网宣传大图
 └── webshare/                   <-- WebShare 完整工作台应用
      ├── index.html             <-- WebShare 主入口
      ├── assets/                <-- Web Worker 与 Vue 编译产物
      ├── models/                <-- 47.4MB MobileCLIP2 ONNX 模型与 15 类向量
      └── ort-wasm/              <-- 58 个 WebGPU & WASM 运行时文件
```

---

## 2. 官网入口与交互设计

在官方网站（`web/src/App.vue`）中，设置了双重导流入口：
1. **顶部导航栏**：新增醒目的 **`🌐 网页互联 (WebShare)`** 渐变按钮，直接超链接至 `./webshare/`；
2. **Hero 首屏主行动点**：在“下载 Windows 客户端”与“下载 Android APK”旁，加入 **`🌐 在线体验 WebShare 网页版 (免安装)`** 发光交互按钮。

---

## 3. GitHub Actions 自动化 CI/CD（`.github/workflows/deploy.yml`）

仓库配置了自动化持续集成流水线，当代码推送到 `main` 分支时触发：

```yaml
name: Deploy Website & WebShare to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      # 1. 构建官网
      - name: Build Official Website
        run: |
          cd web
          npm ci
          npm run build

      # 2. 构建 WebShare
      - name: Build WebShare
        run: |
          cd webshare
          npm ci
          npm run build

      # 3. 组装合并
      - name: Assemble Static Site
        run: |
          mkdir -p site_dist
          cp -r web/dist/* site_dist/
          mkdir -p site_dist/webshare
          cp -r webshare/dist/* site_dist/webshare/

      # 4. 发布至 GitHub Pages
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site_dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

---

## 4. 全自动化发版脚本（`auto_deploy/deploy.ps1`）

在本地一键发布全平台版本时，`auto_deploy/deploy.ps1` 统一接管以下 6 大发版步骤：

1. **版本号统一自增与跨端同步**：自动升级 `cp_clip`、`web`、`webshare` 的 `package.json` 以及 Android 的 `pubspec.yaml` 与 `main.dart`；
2. **构建 WebShare 并注入仓库基路径**：`npx vite build --base=/$ProjName/webshare/`；
3. **构建官方网站并合并目录**：将 WebShare 嵌入 `web/dist/webshare`；
4. **编译打包 Electron 桌面端**：输出 Windows 安装包与增量更新 `.blockmap`；
5. **编译构建 Android ARM64 APK**：输出生产版 APK 文件；
6. **推送到 `gh-pages` 分支并创建 GitHub Release**：自动上传各端安装包制品与 Release Notes。

---

## 5. 0 成本 Cloudflare Worker 信令中继（`webshare/cloudflare-worker/`）

对于需要自定义公网信令的用户，提供了开箱即用的 Serverless WebSocket 脚本：
- **部署方式**：粘贴至 Cloudflare Workers 后点击 Deploy 即可；
- **免费额度**：每天 100,000 次免费请求；
- **流量特征**：仅在建立连接的前 0.1 秒中转文本 SDP，后续照片传输 **100% 走本地 P2P Wi-Fi 直连，零流量费用**。
