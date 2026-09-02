### 🚀 ShareCLIP v2.1.11 更新日志

1. 🍎 **macOS 苹果生态原生适配（Apple Silicon & Intel 双架构）**：
   - 全面支持 macOS 12+ (Monterey, Ventura, Sonoma, Sequoia)；
   - 提供 Apple Silicon 原生 ARM64（M1/M2/M3/M4 系列芯片）与 Intel x64 独立 `.dmg` 安装镜像及便携 `.zip` 绿色包；
   - 深度集成 Metal 与 CoreML 硬件级 AI 推理加速。

2. 🐧 **Linux 全平台桌面端支持（AppImage & DEB）**：
   - 提供免安装即开即用 `.AppImage` 便携包，完美兼容 Ubuntu, Debian, Fedora, Arch Linux, Manjaro 等主流发行版；
   - 提供标准 `.deb` 安装包，支持 Debian/Ubuntu 系统原生包管理器安装与桌面快捷方式集成。

3. ☁️ **GitHub Actions 全平台云端并发编译流水线**：
   - 上线全新 CI/CD 自动化多平台矩阵构建流（Ubuntu + Windows + macOS 虚拟机并发），2~3 分钟全自动完成 Windows / Mac / Linux / Android / Web 5 端编译并聚合发布；
   - 支持本地一行命令 `.\auto_deploy\deploy.ps1 -Cloud` 或推送 Git Tag 触发。

4. 🌐 **官方门户网站升级 5 端全域下载中心**：
   - 官方主站首页全面设计 Windows (`.exe`)、macOS (`.dmg`/`.zip`)、Linux (`.AppImage`/`.deb`)、Android (`.apk`) 及 WebShare 5 大平台下载矩阵与架构细分直达通道。
