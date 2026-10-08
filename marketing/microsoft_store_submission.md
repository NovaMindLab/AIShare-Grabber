# 微软商店 (Microsoft Store) 官方上架提交全流程指南与物料清单

> **项目名称**: ShareCLIP  
> **最新版本**: `v4.5.8`  
> **官网地址**: [https://novamindlab.github.io/AIShare-Grabber/](https://novamindlab.github.io/AIShare-Grabber/)  
> **隐私政策**: [https://novamindlab.github.io/AIShare-Grabber/privacy.html](https://novamindlab.github.io/AIShare-Grabber/privacy.html)  
> **开源仓库**: [https://github.com/NovaMindLab/AIShare-Grabber](https://github.com/NovaMindLab/AIShare-Grabber)  
> **视觉物料路径**: `marketing/microsoft_store_assets/` (已全量生成，直接拖拽上传)

---

## 一、双轨上架方案对比与选择建议

微软自 Windows 11 起全面革新了 Microsoft Store 生态，允许开发者以两种方式发布应用程序：

| 对比维度 | 方案 A：Win32 应用直连发布 (强烈推荐 🌟🌟🌟🌟🌟) | 方案 B：MSIX / APPX 原生打包上传 |
|---|---|---|
| **核心原理** | 微软商店直接索引你已构建好的官方 `.exe` 安装包，用户点击安装时商店自动调用静默安装器。 | 将 Electron 转换为 UWP/MSIX 虚拟化容器包并上传至微软 CDN 托管。 |
| **工作量** | **零改动、零构建**！5 分钟在网页端填表即可提交。 | 需从 Partner Center 抓取证书标识并本地打包上传，耗时较长。 |
| **底层硬件兼容性** | **100% 完美原生运行**：蓝牙后台服务 (`ble_signaling_server.exe`)、Wi-Fi AP 热点脚本 (`wifi_ap.ps1`)、局域网高并发 HTTP/WebRTC 端口监听没有任何沙盒阻碍。 | 受 AppContainer/Centennial 沙盒限制，需严格配置 `runFullTrust` 声明，原生模块易产生文件虚拟化重定向隐患。 |
| **后续更新流** | 发新版本时，仅需在 Partner Center 更新安装包下载 URL 即可。也可直接使用客户端内置的自动更新。 | 每次发版必须重新打包数百兆的 `.msix` 并手动或通过 API 上传。 |
| **审核速度** | 通常 **24 ~ 48 小时**（微软自动化沙盒环境运行静默安装测试 + 基础合规扫描）。 | 需过完整 MSIX 静态特征分析与沙盒行为审查。 |

> 💡 **核心建议**：**优先采用【方案 A：Win32 应用直连】**！ShareCLIP 具有端侧深度硬件通信与 C++ 原生动态库（ONNX Runtime / SQLite3 / Sharp），Win32 直连方案是最稳健、最快过审、用户体验最佳的官方路径。

---

## 二、方案 A：Win32 应用直连上架保姆级操作步骤 (5 分钟完成)

### 步骤 1：登录微软合作伙伴中心
1. 访问并登录 [Microsoft Partner Center (微软合作伙伴中心)](https://partner.microsoft.com/dashboard/apps-and-games/overview)。
2. 在左侧菜单点击 **“应用和游戏 (Apps and games)”** -> 点击页面右上方的 **“新建应用 (New app)”**。
3. 在弹出的类型选择中，选择 **“Win32 应用程序 (Win32 application)”**（**请勿**选通用 Windows 平台应用）。

---

### 步骤 2：预留产品名称 (Product Name)
- 输入想要在商店显示的名称：
  - 推荐：`ShareCLIP`
  - 备选（如主词已被抢占）：`ShareCLIP: Local-First Media Suite` 或 `ShareCLIP - AirDrop Alternative`
- 点击 **“保留产品名称 (Reserve product name)”**。

---

### 步骤 3：配置安装包信息 (Package / Installer Information)

在新建的应用提交中，进入 **“程序包 (Packages)”** / **“安装程序设置 (Installer Settings)”**：

| 设置项 (Field) | 填写内容 (Value) | 说明 |
|---|---|---|
| **安装程序类型 (Installer type)** | `EXE` | 基于 NSIS 封装的标准 Win32 安装程序 |
| **体系结构 (Architecture)** | `x64` | 64 位 Windows 系统 |
| **安装程序下载 URL (Download URL)** | `https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v4.5.8/ShareCLIP-Setup-4.5.8.exe` | 官方 GitHub Release 直链，微软爬虫将自动下载测试 |
| **静默安装参数 (Silent install parameters)** | `/S` | NSIS 标准静默参数，项目 `installer.nsh` 已保证无弹窗静默完成 |
| **静默卸载命令 (Silent uninstall command)** | `"%LocalAppData%\Programs\ShareCLIP\Uninstall ShareCLIP.exe" /S` | 标准 NSIS 用户态卸载静默指令 |
| **安装程序退出代码 (Exit codes)** | `0` (Success) | 默认返回值 0 代表安装成功 |
| **应用程序版本 (Application version)** | `4.5.8` | 当前发布的最新版本号 |

---

### 步骤 4：填写商店列表详情 (Store Listing Metadata)

进入 **“应用信息 / 商店列表 (Store listings)”** -> 添加支持的语言（建议添加 **中文 (简体) (Chinese Simplified)** 与 **英语 (English)**）：

#### 🇨🇳 中文版列表元数据 (可直接复制粘贴)
```text
【产品名称 (Product Name)】:
ShareCLIP

【副标题 / 简短描述 (Subtitle / Short description, 100 字符内)】:
私有局域网极速互传 AirDrop 替代品，端侧离线 AI 语义搜图与 4K 视频下载工坊

【主要分类 (Primary Category)】:
照片和视频 (Photo & video)
【次要分类 (Secondary Category)】:
实用工具 (Utilities & tools)

【详细描述 (Description)】:
ShareCLIP 是一款 100% 遵循 Local-First 原则的现代多媒体管理与极速局域网互传神器。打破苹果生态壁垒，让 Windows、Android、macOS 与 Web 浏览器无缝融为一体。无需连接任何公网云端服务器，保障极致隐私与千兆级内网直传速度！

🌟 核心亮点与功能特性：

⚡ 零云端私有局域网互传 (AirDrop 终极替代品)
- 基于 WebRTC DataChannel 与本地 Socket 直传，传输速度跑满局域网（实测 80~120 MB/s）；
- 完美解决 Windows 与 Android/iOS/Mac 跨设备互传难题；
- 内置 WebShare 免安装浏览器端，同局域网设备扫码即可即开即传。

🧠 端侧离线 MobileCLIP2 语义搜图 (自然语言查相册)
- 独家集成 Apple MobileCLIP2-S0 端侧轻量神经网络，512 维特征向量全在本地提取；
- 支持输入自然语言搜索（如：“穿着红衣服在海边看日落”、“草地上奔跑的金毛犬”、“去年拍的发票收据”）；
- 100% 本地运算，无需联网，相片数据绝不上传云端，彻底守护您的隐私。

👥 本地人脸聚类与智能人物相册
- 内置 RetinaFace 与 ArcFace 端侧视觉模型，全自动识别、对齐并提取人脸特征；
- 一键按人物自动聚类归类，构建专属于您的本地家庭人脸相册。

🎬 4K 多平台视频下载工坊与独立画中画播放器
- 支持解析与下载主流流媒体平台高清/4K 视频与音频；
- 独创独立置顶无边框视频播放器，支持 HTTP Range 206 毫秒级拖拽快进与无缝流式播放；
- 独家集成 AnimeGAN 神经网络滤镜，支持实时将本地视频转化为二次元动漫风格。

📋 跨平台剪贴板实时无感同步
- 电脑端复制文字或截图，手机端毫秒级同步接收，办公创作行云流水。

🌍 20 国多语言原生支持
- 全球化多语言界面无缝自适应，让全世界用户畅享隐私互传。

【产品功能要点 (Product Features, 每行一项)】:
- ⚡ 零云端私有局域网极速互传 (80+ MB/s，跨 Windows、Android、Mac、Web)
- 🧠 MobileCLIP2 端侧离线自然语言搜图，无惧断网，零隐私泄露风险
- 👥 RetinaFace+ArcFace 本地人脸聚类智能相册
- 🎬 4K 多平台视频下载器与无边框置顶流媒体播放器
- 🎨 AnimeGAN 神经网络实时视频动漫化转换
- 📋 跨平台文本与图片剪贴板实时无感同步
- 🌐 20 国多语言全量本地化支持

【搜索关键词 / 搜索词 (Search terms, 最多 7 个)】:
AirDrop, 局域网传输, LocalSend, AI搜图, 视频下载器, 剪贴板同步, 局域网共享
```

---

#### 🇺🇸 英文版列表元数据 (可直接复制粘贴)
```text
【Product Name】:
ShareCLIP

【Subtitle / Short Description (under 100 chars)】:
Private P2P AirDrop Alternative, On-Device AI Photo Search & 4K Media Engine

【Primary Category】:
Photo & video
【Secondary Category】:
Utilities & tools

【Description】:
ShareCLIP is a privacy-first, local-first media powerhouse bridging Windows, Android, macOS, Linux, and Web browsers. Designed to replace cloud-dependent ecosystems, ShareCLIP offers blazing-fast local Wi-Fi file transfers (80+ MB/s), neural on-device photo search, facial clustering albums, and an all-in-one 4K media workshop with zero subscriptions and zero privacy trade-offs.

🌟 Key Features:

⚡ Zero-Cloud P2P AirDrop Alternative:
- True local Wi-Fi transfer over WebRTC DataChannel (80-120 MB/s).
- Seamless sharing between Windows PC, Android phones, Mac, and any web browser via built-in WebShare.
- No file size limits, zero cloud bandwidth throttling, and 100% offline security.

🧠 On-Device AI Natural Language Photo Search:
- Embedded Apple MobileCLIP2-S0 vision-language model extracts 512-D embeddings entirely on your device.
- Search your photos using everyday natural language (e.g., "sunset at the beach", "golden retriever on grass", "receipts from last year").
- Zero cloud uploads, zero telemetry, full offline functionality.

👥 Local Facial Recognition & Smart Albums:
- On-device face detection and recognition powered by RetinaFace & ArcFace.
- Automatic clustering into organized family and friend portrait galleries.

🎬 4K Multi-Site Video Downloader & Detached Player:
- Download high-res / 4K videos from popular video sharing networks.
- Frameless, always-on-top detached player with instant HTTP Range 206 seeking.
- Real-time AnimeGAN neural video style transfer to cartoonize local clips.

📋 Seamless Real-Time Clipboard Synchronization:
- Instant text and image clipboard sync between your PC and mobile devices.

🌍 20 Languages Fully Localized:
- Native multi-lingual experience across 20 global languages.

【Product Features】:
- ⚡ Blazing-fast local P2P transfer (80+ MB/s, zero cloud relay)
- 🧠 On-device MobileCLIP2 AI natural language photo search
- 👥 Local face detection and clustering albums (RetinaFace + ArcFace)
- 🎬 Universal 4K video downloader and detached pip player
- 🎨 AnimeGAN neural video style transfer
- 📋 Real-time cross-platform clipboard synchronization
- 🌐 Complete localized support across 20 languages

【Keywords (Up to 7 terms)】:
AirDrop, LocalSend, File Transfer, AI Photo, Video Downloader, Clipboard Sync, P2P
```

---

### 步骤 5：上传图标与高清截图 (Visual Assets)

所有素材均已自动生成并保存在工程目录：[`marketing/microsoft_store_assets/`](file:///d:/AI_serach_image/image_clip_android/marketing/microsoft_store_assets/)，请直接上传：

1. **应用展示图标 (App Icon / Store Logo)**：
   - 上传文件：`marketing/microsoft_store_assets/StoreLogo_300x300.png`（300x300 PNG）
2. **桌面截图 (Screenshots, 至少上传 1 张，建议全部上传)**：
   - 截图 1：`marketing/microsoft_store_assets/Screenshot_1_Hero_1366x768.png` (主界面与千兆局域网秒传)
   - 截图 2：`marketing/microsoft_store_assets/Screenshot_2_Local_AI_PhotoSearch_1366x768.png` (端侧 AI 语义搜图与人脸聚类)
   - 截图 3：`marketing/microsoft_store_assets/Screenshot_3_Zero_Cloud_P2P_Sync_1366x768.png` (多端互传与 WebShare)
   - 截图 4 (高清备选)：`marketing/microsoft_store_assets/Screenshot_Hero_1920x1080.png` (1080P 全高清展示图)

---

### 步骤 6：合规性、支持信息与年龄分级 (Properties & Age Ratings)

1. **支持与联系信息 (Support & Contact)**：
   - **隐私策略 URL (Privacy Policy URL)**: `https://novamindlab.github.io/AIShare-Grabber/privacy.html`
   - **支持网站 URL (Support URL)**: `https://github.com/NovaMindLab/AIShare-Grabber/issues`
   - **官方网站 (Website)**: `https://novamindlab.github.io/AIShare-Grabber/`
   - **支持邮箱 (Support Email)**: `support@shareclip.com`（或您的个人注册邮箱）
   - **版权声明 (Copyright)**: `Copyright © 2026 NovaMindLab. All rights reserved.`

2. **年龄分级问卷 (IARC Age Rating)**：
   - 点击进入 IARC 问卷；
   - 类别选择：**“实用工具、效率或其他 (Utility, Productivity or other)”**；
   - 问卷题目（关于暴力、血腥、色情、博彩、不良词汇、分享用户地理位置给第三方等）：**全部选择 “否 (No)”**；
   - 填写完成后即可直接获得全球 **3+ / Everyone (全年龄段适宜)** 免费认证。

3. **定价与可用性 (Pricing and Availability)**：
   - 价格基础：**免费 (Free)**
   - 市场区域：选择 **所有市场 (All markets)**（全球 240+ 地区上线）

---

### 步骤 7：提交审核 (Submit for Review)
- 点击右上角的 **“提交到应用商店 (Submit to the Store)”**。
- 状态将变为 **“正在进行认证 (In certification)”**。
- 微软测试集群会自动拉取 EXE 进行沙盒静默安装测试，通常 **24 ~ 48 小时** 内即可在 Windows 10/11 的 Microsoft Store 客户端中搜索并安装！

---

## 三、方案 B：MSIX / APPX 原生打包上传步骤 (备选方案)

如果您希望生成 `.msix` 文件直接将二进制托管在微软服务器：

1. **在 Partner Center 获取身份三要素**：
   - 预留应用名称后，进入 **“产品管理 (Product management)”** -> **“产品标识 (Product identity)”**；
   - 复制以下三项：
     - **程序包标识名 (Package/Identity Name)**（如：`NovaMindLab.ShareCLIP`）
     - **发布者 ID (Publisher ID)**（格式如：`CN=12345678-ABCD-EF01-2345-6789ABCDEF01`）
     - **发布者显示名称 (Publisher Display Name)**（如：`NovaMindLab`）
2. **在项目终端中执行一键打包**：
   ```powershell
   # 进入桌面客户端工程
   cd cp_clip

   # 传入您的微软开发者身份变量并执行商店包构建
   $env:MS_IDENTITY_NAME="你的程序包标识名"
   $env:MS_PUBLISHER="你的Publisher_ID"
   $env:MS_PUBLISHER_DISPLAY_NAME="你的发布者显示名称"

   npm run dist:store
   ```
3. **上传生成的产物**：
   - 构建完成后，在 `cp_clip/dist_electron/` 目录下将生成 `ShareCLIP-Store-4.5.8.appx`（或 `.msix`）；
   - 在 Partner Center 的“程序包”栏目直接将该文件拖拽上传即可。

---

## 四、常见审核避坑指南

1. **关于隐私条款**：
   微软严格要求应用详情页中必须包含公开可访问的隐私政策 URL。本项目已在 GitHub Pages 永久托管标准合规协议：`https://novamindlab.github.io/AIShare-Grabber/privacy.html`，符合 GDPR 与 CCPA 规范。
2. **关于防火墙与网络权限**：
   微软沙盒初次运行安装包时，由于项目需要局域网端口监听（8080/8081），Windows Defender 防火墙可能会提示“允许访问网络”，这属于局域网传输工具的标准正常行为，不影响过审。
3. **关于数字签名**：
   - Win32 直连模式下，微软允许未签名的开源 EXE 或通过 Sigstore/Self-signed 签名的二进制，微软会在商店侧为其建立受信封装层。
4. **如果审核员询问测试账号**：
   在“审核备注 (Notes for certification)”中可填写：
   `"This is a local-first P2P Wi-Fi transfer and on-device AI album management app. No account login, cloud registration, or external server credentials are required to use any feature."`
