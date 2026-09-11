### 🚀 ShareCLIP v4.0.1 Release Notes

#### 🎬 4K 视频下载后处理增强与便携版 FFmpeg 自动静默拉取 (Video Downloader Resilience & FFmpeg Self-Healing)
- **便携版 FFmpeg 零侵入自动静默拉取与自愈**：
  - 针对干净新机或未配置系统环境 PATH 的用户，`ensureFFmpeg()` 探针机制在后台静默拉取单文件免安装 FFmpeg 便携包至应用安全沙箱区（`userData/bin`），即刻完成就绪闭环，无需用户手动配置环境变量。
- **无 FFmpeg 极端场景动态优雅降级**：
  - 若系统既无本地 FFmpeg 且尚未拉取完成，`yt-download` 引擎动态自适应降级：自动采用预合并单流提取策略（`best[ext=mp4]/best`），关闭需要 FFmpeg 的海报转码与音视频后处理合并参数，原画封面直接落盘，**彻底根除下载进度到达 100% 后因缺乏混流器抛出 `exit code 1` 致命退出的历史痛点**。
- **Windows 特殊字符文件名清洗与全中文友好错误提示**：
  - 强制注入 `--windows-filenames`，自动过滤标题中包含的冒号、斜杠、管道符等非法字符；深度捕获底层 `stderr` 错误流，将网络断开、格式限制等晦涩日志转换为用户易懂的中文交互提示。

---

#### 🔏 Windows & macOS 免费公有签名体系与全球透明度存证 (Dual-Platform Free Public Code Signing)
- **Windows RFC 3161 Authenticode 证书自签与一键信任**：
  - CI/CD 构建流中自动生成专属代码签名根证书与私钥，调用 Windows SDK `signtool.exe` 并连接 DigiCert 权威时间戳服务器，为 `ShareCLIP.exe` 及安装程序签署长期有效的 Authenticode 签名；
  - 发布资产自动内嵌配套一键安装信任脚本（`Install-Certificate.bat`），管理员权限双击即可自动将公钥证书导入受信任的根证书颁发机构与受信任人，彻底消除 Windows SmartScreen “未知发布者”红色安全阻拦。
- **macOS 深度 Ad-hoc 签名与 Sequoia 隔离修复脚本**：
  - 桌面端打包配置启用 `mac.identity: "-"`，自动递归执行 `codesign --force --deep -s -`，赋予所有二进制与动态库合法 Mach-O 代码签名；
  - 自动内嵌配套一键隔离修复脚本（`Fix_App_Damage.command`），针对 macOS 15 Sequoia 严格安全沙箱，用户双击即可自动执行 `xattr -cr` 抹除下载隔离标记（`com.apple.quarantine`），彻底杜绝“App 已损坏，移至废纸篓”系统拦截。
- **Linux 基金会 Sigstore & Rekor 全球公共存证 (Build Provenance Attestations)**：
  - CI/CD 流水线接入 GitHub 官方 `actions/attest-build-provenance@v2`，对 Windows、macOS 及 Linux 全量 Release 产物计算 SHA-256 摘要，并将不可篡改的加密 Provenance 签名存入 Rekor 公共透明日志，用户可使用 GitHub CLI `gh attestation verify` 验证软件由官方工作流原生构建。

---

#### 📦 全生态大版本同步升级至 v4.0.1
- **全平台多端版本号对齐**：
  - PC Electron 桌面端 (`4.0.1`)
  - Web 官方落地页 (`4.0.1`)
  - WebShare 纯网页极速端 (`4.0.1`)
  - Android 移动端 (`4.0.1+40001`)
  - Scoop 极客包管理器清单 (`v4.0.1`)
  - WinGet 微软包管理器清单 (`v4.0.1`)

