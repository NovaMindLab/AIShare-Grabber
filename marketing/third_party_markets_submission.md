# 🚀 ShareCLIP 第三方应用站与独立软件源上架执行手册

本手册汇集了上架全球核心软件分发渠道（**Uptodown、Softonic、FileHippo、FileHorse、MajorGeeks**）的所需参数、直接入口及半自动填表脚本。

---

## 一、 当前构建产物物料清单 (v4.5.15)

* **官方网站**: `https://novamindlab.github.io/AIShare-Grabber/`
* **PAD XML 标准文件**: `https://novamindlab.github.io/AIShare-Grabber/pad.xml`
* **支持系统**: Windows 10/11 (x64), Android 6.0+, macOS
* **应用分类**: Network & Internet / File Transfer / Utilities
* **授权类型**: Freeware / Open Source (MIT)

### 二进制直链与安全扫描报告 (VirusTotal)

| 平台端 | 安装包文件名 | 永久下载直链 | SHA256 校验哈希 | VirusTotal 报告直链 (0 检出) |
| :--- | :--- | :--- | :--- | :--- |
| **Windows** | `ShareCLIP-Setup-4.5.15.exe` | [GitHub Releases 直链](https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.15/ShareCLIP-Setup-4.5.15.exe) | `7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b` | [查看 Windows VT 报告](https://www.virustotal.com/gui/file/7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b) |
| **Android** | `ShareCLIP-Android-4.5.15.apk` | [GitHub Releases 直链](https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.15/ShareCLIP-Android-4.5.15.apk) | `b02aa43e85b49efac67176657ee173afcb7f8bcc88197fc3e2122ae7a6ab48bb` | [查看 Android VT 报告](https://www.virustotal.com/gui/file/b02aa43e85b49efac67176657ee173afcb7f8bcc88197fc3e2122ae7a6ab48bb) |

---

## 二、 渠道逐一攻坚与半自动化操作指南

### 1. FileHorse（纯净软件精选站）
* **入口网址**：[https://www.filehorse.com/submit/](https://www.filehorse.com/submit/)
* **自动化方式**：
  1. 浏览器打开上面的提交页面；
  2. 按 `F12` 切换到 **Console (控制台)**；
  3. 粘贴并在控制台运行 `marketing/markets_autofill_script.js` 脚本，表单即刻自动填满；
  4. 人工点击人机验证框并提交即可。

---

### 2. MajorGeeks（极客社区 / 装机商源头站）
* **入口通道**：邮件直投至 `mgnews@majorgeeks.com`
* **一键唤起邮件**：
  * [点击此处一键唤起系统邮件客户端并预填内容](mailto:mgnews@majorgeeks.com?subject=%5BSoftware%20Submission%5D%20ShareCLIP%20v4.5.15%20-%20Free%20Offline%20P2P%20File%20Sync%20%26%20AI%20Photo%20Search&body=Hi%20Jim%20%26%20Tim%2C%0A%0AWe%20would%20love%20to%20submit%20ShareCLIP%20for%20consideration%20on%20MajorGeeks.%0A%0AShareCLIP%20is%20a%20100%25%20clean%2C%20free%20utility%20for%20ultra-fast%20peer-to-peer%20wireless%20file%20transfer%20and%20offline%20on-device%20AI%20photo%20search%20across%20Windows%20PC%20and%20Android.%0A%0AHighlights%3A%0A-%20Gigabit%20LAN%20P2P%20sync%20(zero%20cloud%2C%20zero%20cables)%0A-%20100%25%20local%20offline%20AI%20semantic%20image%20search%0A-%20Zero%20bundled%20software%2C%20zero%20telemetry%2C%20zero%20ads%0A%0ADetails%3A%0A-%20Name%3A%20ShareCLIP%0A-%20Version%3A%204.5.15%0A-%20License%3A%20Freeware%20%2F%20Open%20Source%0A-%20Website%3A%20https%3A%2F%2Fnovamindlab.github.io%2FAIShare-Grabber%2F%0A-%20Direct%20Download%3A%20https%3A%2F%2Fgithub.com%2FNovaMindLab%2FAIShare-Grabber%2Freleases%2Fdownload%2Fv4.5.15%2FShareCLIP-Setup-4.5.15.exe%0A-%20VirusTotal%20(0%20Detections)%3A%20https%3A%2F%2Fwww.virustotal.com%2Fgui%2Ffile%2F7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b%0A%0AThanks%20for%20your%20time!%0ANovaMindLab%20Team)
* **手工投递正文备选**：
```text
To: mgnews@majorgeeks.com
Subject: [Software Submission] ShareCLIP v4.5.15 - Free Offline P2P File Sync & AI Photo Search

Hi Jim & Tim,

We would love to submit ShareCLIP for consideration on MajorGeeks.

ShareCLIP is a 100% clean, lightweight freeware utility for ultra-fast peer-to-peer wireless file transfer and offline on-device AI photo search across Windows PC and Android.

Key Highlights:
- Gigabit LAN Wi-Fi P2P sync (zero cloud, no cables, saturation speed)
- 100% local on-device AI semantic image search
- Completely clean: Zero bundled toolbars/offers, zero telemetry, zero ads

Details:
- Name: ShareCLIP
- Version: 4.5.15
- License: Freeware / Open Source
- Website: https://novamindlab.github.io/AIShare-Grabber/
- Direct Download (Installer): https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.15/ShareCLIP-Setup-4.5.15.exe
- VirusTotal (0 Detections): https://www.virustotal.com/gui/file/7fb6b76bac0984b05d39dfb687261c3bfc8f7be3ca526cebcc6466cf7e2bca8b

Thanks for your time and all you do for the freeware community!

Best regards,
NovaMindLab Team
```

---

### 3. Uptodown（自主开发者后台 · 覆盖 PC + Android）
* **入口网址**：[https://developers.uptodown.com/](https://developers.uptodown.com/)
* **直接注册入口**：[https://developers.uptodown.com/3.0/#/sign-up](https://developers.uptodown.com/3.0/#/sign-up)
* **操作流程**：
  1. 使用常用邮箱免费注册开发者账号；
  2. 点击 **Add new app**，系统支持直接分别添加 **Windows** 和 **Android** 两个版本；
  3. 上传 `ShareCLIP-Setup-4.5.15.exe` 和 `app-release.apk`（或填入上方 GitHub 直链）；
  4. 图标选用 `web/public/pc_logo.png` 或 `web/public/android_logo.png`；
  5. 提交后系统自动触发全引擎扫描，2~5 个工作日内上架并进入西语法语等各分站。

---

### 4. Softonic（开发者发布中心）
* **入口网址**：[https://developers.softonic.com/](https://developers.softonic.com/)
* **操作流程**：
  1. 登录注册机构账号，同意分发授权协议；
  2. 提交新软件，直接附带 PAD 规范地址：`https://novamindlab.github.io/AIShare-Grabber/pad.xml`；
  3. 平台抓取并生成 18+ 语言的 SEO 评测页。

---

### 5. FileHippo（内部联动）
* **收录逻辑**：属于 Softonic 集团旗下。在 Softonic 成功上架后，由于 ShareCLIP 属于纯净工具（Utility）品类且支持 PAD 协议，平台编辑会定期挑选高评分纯净工具同步上架至 FileHippo 镜像库。
