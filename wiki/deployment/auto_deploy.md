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
