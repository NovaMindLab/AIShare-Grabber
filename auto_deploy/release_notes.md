### 🚀 ShareCLIP v3.0.15 Release Notes

#### 🍎 macOS 双架构原生编译与兼容性彻底修复 (macOS Native Dual-Arch Packaging)
- **修复 Intel Mac 启动 dlopen 架构不匹配崩溃**：
  - 根因：GitHub Actions `macos-latest` 升级为 Apple Silicon (arm64)，导致 `npm install` 默认编译 arm64 版原生模块（`node_sqlite3.node` / `sharp`），而在跳过模块重编译（`npmRebuild: false`）的情况下打包 `x64` 安装包，导致 Intel Mac 启动时报错 `mach-o file, but is an incompatible architecture (have 'arm64', need 'x86_64')`。
  - 修复方案：GitHub Actions 流水线重构为**双机型矩阵并行原生构建（Matrix Native Runners）**：
    - **Apple Silicon (arm64)**：在 `macos-latest`（M 系列芯片）原生安装与编译 arm64 依赖，产出原生的 `ShareCLIP-Mac-3.0.15-arm64.dmg` 与 `.zip`。
    - **Intel (x64)**：在 `macos-13`（纯 Intel Core 芯片）原生安装与编译 x86_64 依赖，产出原生的 `ShareCLIP-Mac-3.0.15-x64.dmg` 与 `.zip`。
  - 彻底消除跨架构编译与依赖污染，全面支持 M1/M2/M3/M4 及 Intel 全系 Mac。

#### 💻 全平台协同优化与构建稳健性 (Cross-Platform Enhancements)
- **CI/CD 流水线健壮性提升**：
  - 修复 Pages 部署工作流中 token 参数语法规范。
  - 增强发布流水线 Tag 解析能力，支持 Git Tag 自动触发与版本号自动回退探测。
  - 支持多工件隔离上传与统一归集发版。
- **全端版本号同步更新至 3.0.15**（桌面端 Electron、移动端 Flutter、Web Portal 与 WebShare）。
