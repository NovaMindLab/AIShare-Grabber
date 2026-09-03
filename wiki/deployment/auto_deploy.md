# 🚀 ShareCLIP 双轨全平台自动发布体系 (Dual-Track Multi-Platform Release Guide)

本文档详细说明 **ShareCLIP** 的全平台自动化编译、打包与发布体系。系统同时原生支持 **「本地极速发版」** 与 **「GitHub Actions 云端并行发版」** 两套发版模式，支持生成 **Windows (`.exe`)**、**macOS (`.dmg`/`.zip`)**、**Linux (`.AppImage`/`.deb`)**、**Android Universal APK (`.apk`)** 以及 **Web 官方门户** 的全套产物。

---

## 🗺️ 双轨发版模式架构

```mermaid
graph TD
    subgraph 模式一：本地发版模式 (Local Mode)
        L1[本地终端执行] --> L2[.\auto_deploy\deploy.ps1]
        L2 --> L3[本地编译 Web + Windows EXE + Android APK]
        L3 --> L4[本地通过 gh cli 直传 GitHub Releases]
    end

    subgraph 模式二：GitHub Actions 云端发版模式 (Cloud CI/CD Mode - 推荐)
        C1[触发: git push tag 或 .\auto_deploy\deploy.ps1 -Cloud 或 网页一键点击] --> C2[.github/workflows/release.yml]
        C2 --> J1[Ubuntu: Web 构建 ➔ GitHub Pages 部署]
        C2 --> J2[Ubuntu: Android Universal APK 高速编译]
        C2 --> J3[Windows: PC NSIS EXE 打包 + 差分 Blockmap]
        C2 --> J4[macOS: 苹果 Universal DMG + ZIP 打包]
        C2 --> J5[Ubuntu: Linux AppImage + DEB 打包]
        J1 & J2 & J3 & J4 & J5 --> J6[自动聚合全部产物并发布 GitHub Release]
    end
```

---

## 🛠️ 模式一：本地离线编译发布 (Local Mode)

适合私有调试、断网开发或需快速生成本地测试包的场景。

### 运行方式：
```powershell
# 1. 自动读取当前版本号并在本地完成全部编译与直传
.\auto_deploy\deploy.ps1

# 2. 或者显式指定发布标签
.\auto_deploy\deploy.ps1 -Tag "v2.1.10"
```

---

## ☁️ 模式二：GitHub Actions 云端全自动发版 (Cloud Mode)

**推荐主力模式**：本地 **0 算力占用**，免除本地几百兆上传带宽限制，5 个平台**云端并发编译**，约 2~3 分钟全平台产物出包完毕。

### 触发方式 1：本地 PowerShell 一行命令触发
```powershell
# 使用 -Cloud 开关，脚本将自动同步版本号、推送到远程仓库并触发云端全平台构建
.\auto_deploy\deploy.ps1 -Cloud

# 或指定版本
.\auto_deploy\deploy.ps1 -Tag "v2.1.10" -Cloud
```

### 触发方式 2：标准 Git Tag 推送
```bash
# 任何地方推送 tag 即可自动激活云端全平台编译
git tag v2.1.10
git push github v2.1.10
```

### 触发方式 3：GitHub 网页端 0 门槛手动运行
1. 打开 GitHub 仓库，进入 **Actions** 标签页；
2. 在左侧选择 **🚀 ShareCLIP Multi-Platform Cloud Release**；
3. 点击 **Run workflow**，输入目标版本号（如 `2.1.10`），点击绿色按钮即可。

---

## 📦 全平台产物清单 (Release Assets)

| 平台 / 操作系统 | 生成文件命名规范 | 说明 |
| :--- | :--- | :--- |
| 📱 **Android** | `ShareCLIP-Android-{version}.apk` | `arm64-v8a` + `armeabi-v7a` 通用双架构安装包 |
| 💻 **Windows** | `ShareCLIP-Setup-{version}.exe`<br>`ShareCLIP-Setup-{version}.exe.blockmap`<br>`latest.yml` | 64 位 NSIS 安装包与增量差分升级元数据 |
| 🍎 **macOS** | `ShareCLIP-Mac-{version}-x64.dmg`<br>`ShareCLIP-Mac-{version}-arm64.dmg`<br>`ShareCLIP-Mac-{version}-arm64.zip` | 兼容 Intel 与 Apple Silicon (M1/M2/M3/M4) |
| 🐧 **Linux** | `ShareCLIP-Linux-{version}-x64.AppImage`<br>`ShareCLIP-Linux-{version}-x64.deb` | 支持 Ubuntu/Debian 及通用 Linux 发行版 |
| 🌐 **Web** | `https://NovaMindLab.github.io/AIShare-Grabber/` | 官方在线版与 WebShare 灵动岛画廊 |

## 常见多平台云端编译排错记录 (v2.1.13 - v2.1.16)

在部署 \2.1.13\ 到 \2.1.16\ 的多端云编译时，遇到并修复了以下环境依赖和打包审核限制问题：

### 1. GitHub Pages 部署冲突与 404 白屏
- **冲突排查**：由于代码库中同时存在 \elease.yml\ 和 \deploy.yml\ 且二者的环境部署策略互斥（前者构建后推送到 \gh-pages\ 分支，后者尝试强推 pages 环境受阻），导致 Action 疯狂报错（满屏红 X）。
- **静态资源 404**：官网成功上线但白屏，因为 Vite 打包时缺失 \ase\ 路径，导致请求从 \github.io/assets\ 而非 \github.io/AIShare-Grabber/assets\ 加载。
- **修复方案**：重构了 \deploy.yml\ 以对齐分支推送逻辑（使用 \peaceiris/actions-gh-pages@v4\），并在 \web/vite.config.js\ 中显式注入 \ase: '/AIShare-Grabber/'\。

### 2. macOS 编译失败 (图标分辨率不足)
- **报错**：\image icon.png must be at least 512x512\
- **原因**：Electron-Builder 强制要求 macOS 的 DMG 安装包必须包含至少 512x512 像素以上的 \.png\ 或 \.icns\ 图标，而原有图标仅为 256x256。
- **修复方案**：通过脚本将 \cp_clip/build/icon.png\ 重采样放大至 512x512，完美通过 Mac 端打包校验。

### 3. Linux (.deb) 编译连环失败 (包信息不全)
- **报错 1**：\It is required to set Linux .deb package maintainer.\
- **报错 2**：\Please specify project homepage.\
- **原因**：Debian 系 Linux 安装包对于基础元数据（Metadata）的审查极其严苛。必须具备格式标准的维护者邮箱，以及项目主页。
- **修复方案**：在 \cp_clip/package.json\ 中，将 \uthor\ 字段改为规范的 \ShareCLIP Team <support@shareclip.com>\，同时添加 \homepage\ 字段，并为了双保险在 \linux\ 专属配置下显式指定 \maintainer\ 属性，最终成功跑通 AppImage 和 deb 的双线编译。

### 4. Android 编译在云端失败 (缺失 Debug 证书)
- **原因**：Android 自动化编译原本要求本地存在的 \debug.keystore\，但在 GitHub Runner 云端机器中没有该文件，导致 Gradle task 失败。
- **修复方案**：在 \ndroid/app/build.gradle.kts\ 中使用 \if (localKeystore.exists())\ 进行软判断，在云端 CI 环境下动态降级或跳过本地专属的签名校验。
