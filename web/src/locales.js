// ShareCLIP Official Website Localization Dictionary (20 Languages)

export const languages = {
  zh: "简体中文",
  en: "English",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ru: "Русский",
  pt: "Português",
  vi: "Tiếng Việt",
  th: "ไทย",
  id: "Bahasa Indonesia",
  ar: "العربية",
  hi: "हिन्दी",
  tr: "Türkçe",
  pl: "Polski",
  nl: "Nederlands",
  sv: "Svenska"
};

export const messages = {
  zh: {
    nav: {
      features: "核心功能",
      videoDemo: "实机演示",
      ai: "AI 相册引擎",
      simulator: "直连演示",
      comparison: "方案对比",
      webshare: "🌐 网页互联 (WebShare)",
      download: "立即下载"
    },
    hero: {
      badge: "✨ 手机 ➔ 电脑极速无线互传 • 100% 本地 AI 智能相册",
      titleMain: "ShareCLIP",
      titleSub: "Private P2P Photo Sync & Local AI Gallery",
      desc: "无需数据线，零云端中转。手机扫码直接将照片高速传输至电脑（80+ MB/s），并在本地利用 AI 自由搜索、人脸聚类与管理您的个人相册。100% 本地隐私安全，绝不上传第三方服务器，永久免费开源。",
      btnWebshare: "在线体验 WebShare (免安装网页版)",
      btnWindows: "下载 Windows 桌面端",
      btnAndroid: "下载 Android 客户端",
      btnSimulate: "交互式直连演示",
      btnGithub: "GitHub 开源仓库"
    },
    videoSection: {
      badge: "OFFICIAL PROMO & DEMO",
      title: "手机与 PC 秒速无线直连 • 实机操作演示",
      subtitle: "告别物理数据线与网盘限速，亲眼见证 80+ MB/s 局域网极速直传与本地 AI 智能相册管理",
      t1: "⚡ 80+ MB/s 局域网极速直传",
      t2: "🔒 100% 纯本地端侧安全",
      t3: "🧠 本地 AI 自然语言搜图",
      t4: "📱 手机 ↔ 电脑 极简扫码互通",
      videoTitle: "ShareCLIP 手机与电脑无线互联互传实机演示",
      playHint: "点击播放高清演示视频 (零流量本地运行)"
    },
    chips: {
      c1_title: "局域网极速直传",
      c1_sub: "80+ MB/s Wi-Fi 直连 • 无需数据线",
      c2_title: "100% 本地 AI 搜图",
      c2_sub: "自然语言检索 • 人脸与相似聚类",
      c3_title: "绝对隐私安全",
      c3_sub: "零云端中转 • 零订阅费用"
    },
    stats: {
      s1_val: "0 KB",
      s1_label: "公网云端上传流量 (100% 局域网直传)",
      s2_val: "80+ MB/s",
      s2_label: "局域网 Wi-Fi 直连实测速率",
      s3_val: "100%",
      s3_label: "本地 AI 推理 • 照片绝不上云",
      s4_val: "Free",
      s4_label: "开源免费 • 绝无订阅套路"
    },
    features: {
      title: "核心功能特性",
      subtitle: "专为解决“传图繁琐”与“搜图困难”而设计的跨端现代化开源工具",
      f1: {
        title: "无线扫码秒级配对",
        desc: "无需手动输入 IP，无繁琐配置。手机扫码即刻完成近场握手，自动发现彼此并建立直连通道。"
      },
      f2: {
        title: "千兆级局域网直传",
        desc: "直接基于局域网 Wi-Fi P2P 高速通道传输，速度可达 80+ MB/s，轻松备份成千上万张高清照片与视频。"
      },
      f3: {
        title: "自然语言以文搜图",
        desc: "内置轻量级视觉模型，用大白话直接搜索“海边日落”、“在草地奔跑的金毛”、“发票收据”，毫秒级离线呈现。"
      },
      f4: {
        title: "渐进式 4K 大图画廊",
        desc: "0ms 瞬间打开缩略图，手机在线时按需直传 4K 原图无缝热替换，支持键盘左右键切图与平滑缩放。"
      },
      f5: {
        title: "旅行足迹地图 (EXIF GPS)",
        desc: "自动解析照片中的相机 GPS 坐标，在世界地图上动态聚类绘制出您的旅行足迹与美好回忆。"
      },
      f6: {
        title: "智能相似图去重 & 双端同步清理",
        desc: "基于向量余弦相似度算法毫秒级定位重复与连拍废片，电脑端一键勾选清理，并联动从手机相册中安全移除。"
      }
    },
    aiSection: {
      badge: "AI PLAYGROUND",
      title: "端侧多模态 AI 智能相册引擎",
      subtitle: "所有 AI 运算均在本地电脑 CPU/GPU 及 WASM SIMD 多线程上运行，保障极致速度与绝对隐私",
      tabSearch: "自然语言语义搜图",
      tabFaces: "人脸识别与人物时间轴",
      tabDedup: "相似图与连拍去重",
      searchTitle: "本地向量语义检索演示",
      searchSub: "输入自然语言或点击下方推荐词，体验无需联网的本地 AI 搜图能力（点击照片可全屏预览）：",
      searchPlaceholder: "输入如：海边日落、在草地奔跑的金毛、发票收据、城市夜景...",
      searchBtn: "语义检索",
      presetLabel: "推荐测试词：",
      presets: [
        { icon: "🌅", text: "海边日落" },
        { icon: "🐕", text: "在草地奔跑的金毛" },
        { icon: "🧾", text: "发票与收据" },
        { icon: "🌃", text: "城市夜景建筑" },
        { icon: "🍜", text: "美味拉面美食" }
      ],
      clickPreview: "🔍 点击 4K 预览",
      similarity: "相似度",
      faceTitle: "本地人脸特征聚类与时间轴",
      faceSub: "高精度本地模型聚类，点击人物头像筛选专属相册：",
      photosCount: "张照片",
      dedupTitle: "连拍与相似图识别",
      dedupSub: "毫秒级定位连拍废片与重复抓拍，电脑端一键释放双端存储空间：",
      threshold: "相似度阈值：",
      cleanupBtn: "模拟清理重复项 (释放 48.2 MB)",
      group: "分组",
      bestKeep: "🌟 推荐保留最佳",
      suggestDel: "🗑️ 建议清理"
    },
    simulator: {
      badge: "ZERO-TRAFFIC PROTOCOL",
      title: "真·局域网 P2P 零流量极速同步流程",
      subtitle: "无需数据线、无需公网服务器，近场自动配对 + 局域网千兆直连",
      s1: "扫码解析",
      s2: "近场信令",
      s3: "局域网直连",
      s4: "双向互传",
      qrText: "电脑端渲染包含会话信息的 QR 二维码",
      qrSub: "手机扫码，解析获得服务描述与握手流水号",
      bleText: "利用离线广播交换直连密钥与网卡地址",
      bleSub: "毫秒级完成连接参数协商，全程无需互联网中转",
      connectedText: "局域网直连通道建立成功 (Connected)",
      connectedSub: "激活本地千兆 Wi-Fi 网络高速双向通信套接字",
      flowText: "流式分片二进制打包 + 背压流控算法极速传输",
      flowSub: "传输图像在接收端直接组装入库，相册瞬间即可呈现",
      pcToPhone: "PC 📤 手机 (传输文件)",
      phoneToPc: "手机 📤 PC (传输文件)",
      next: "下一步 ➔",
      reset: "重新演示 ↺",
      consoleTitle: "📡 离线信令通道控制台",
      desktop: "电脑端 (Desktop)",
      mobile: "手机端 (Android)",
      techTitle: "💡 核心设计机制：",
      t1_title: "1. 零配置扫码接入",
      t1_desc: "电脑生成动态二维码，手机扫码即可直接锁定目标设备，告别繁琐的 IP 输入或传统蓝牙配对。",
      t2_title: "2. 离线信令自动协商",
      t2_desc: "双方通过近场广播特征值交换直连参数与 Candidate 地址，彻底解决网络隔离痛点。",
      t3_title: "3. 全速释放局域网千兆性能",
      t3_desc: "通道打通后，全速切换至本地 Wi-Fi Socket，彻底释放千兆内网带宽性能。",
      t4_title: "4. 二进制流式分片与背压流控",
      t4_desc: "大文件切分为二进制 Chunk，支持断点保护与内存背压缓冲控制，绝不卡死系统。"
    },
    comparison: {
      badge: "COMPARISON",
      title: "为什么选择 ShareCLIP？",
      subtitle: "更快速、更私密、更智能：对比传统公有云盘、微信传输助手与物理数据线",
      dim: "对比维度",
      shareclip: "✨ ShareCLIP (开源方案)",
      cloud: "☁️ 传统云相册 (iCloud / 百度网盘)",
      chat: "💬 微信 / QQ 传输助手",
      usb: "🔌 USB 数据线",
      speed_dim: "传输方式与速度",
      speed_shareclip: "80+ MB/s 局域网直连 (千兆级)",
      speed_cloud: "受限于公网带宽与 VIP 限速",
      speed_chat: "受公网服务器限速 (极慢)",
      speed_usb: "需插入实体数据线",
      privacy_dim: "隐私与数据归属",
      privacy_shareclip: "100% 留存在个人硬件中",
      privacy_cloud: "上传至第三方云端服务器",
      privacy_chat: "数据流经社交平台服务器",
      privacy_usb: "本地存储",
      ai_dim: "AI 自然语言搜图",
      ai_shareclip: "✅ 本地离线运行 (不上云)",
      ai_cloud: "需上传至云端分析",
      ai_chat: "❌ 无搜图能力",
      ai_usb: "❌ 仅作为普通 U 盘读取",
      face_dim: "人脸聚类与去重",
      face_shareclip: "✅ 本地高精度聚类",
      face_cloud: "生物特征上传云端",
      face_chat: "❌ 无",
      face_usb: "❌ 无",
      conv_dim: "连接便捷性与成本",
      conv_shareclip: "扫码秒连 • 永久免费开源",
      conv_cloud: "按月付费订阅 ($2~$10/月)",
      conv_chat: "手动单张勾选 • 压缩画质",
      conv_usb: "必须随身携带适配数据线"
    },
    download: {
      badge: "OFFICIAL RELEASES",
      title: "立即下载 ShareCLIP 开始使用",
      subtitle: "跨 Windows / macOS / Linux / Android / Web 5 端全域协同的开源 AI 智能相册",
      pc_title: "Windows 桌面端",
      pc_meta: "支持 Windows 10 / 11 (64-bit)",
      pc_desc: "内置 DirectML GPU 本地 AI 引擎、4K Lightbox 画廊与智能去重管理工具。",
      pc_btn: "下载 Windows 安装包 (.exe)",
      mac_title: "macOS 桌面端",
      mac_meta: "Apple Silicon (M1~M4) & Intel Mac",
      mac_desc: "适配 macOS Sonoma / Sequoia，内置 Metal 硬件加速与原生毛玻璃设计。",
      mac_btn_arm: "🍏 下载 Apple Silicon DMG (M系列)",
      mac_btn_intel: "🖥️ 下载 Intel 芯片 DMG",
      mac_btn_zip: "📦 便携 ZIP 绿色包",
      linux_title: "Linux 桌面端",
      linux_meta: "Ubuntu, Debian, Fedora, Arch Linux",
      linux_desc: "免安装便携 AppImage 与 Debian/Ubuntu 原生 deb 安装包。",
      linux_btn_appimage: "🚀 下载 AppImage (免安装)",
      linux_btn_deb: "📦 下载 DEB 安装包",
      android_title: "Android 移动端",
      android_meta: "Android 8.0+ (Universal 32/64位通用)",
      android_desc: "基于 Flutter 构建，支持扫码秒连、Wi-Fi 直连与无感极速备份。",
      android_btn: "下载 Android 安装包 (.apk)",
      ios_title: "iOS & 移动端 PWA",
      ios_meta: "支持 iPhone / iPad • 纯浏览器免证书运行",
      ios_desc: "专为手机触摸屏打造，内置摄像头扫码器、相册多选直传与 4K 视频流式发送。",
      ios_btn: "📲 打开 MShare 网页端",
      clone_title: "💻 开发者源码极速克隆 (GitHub Clone)",
      copy_btn: "📋 复制命令",
      copied_btn: "✅ 已复制命令"
    },
    lightbox: {
      badge: "4K RAW ON-DEMAND STREAM",
      title: "📊 EXIF & AI 向量元数据",
      category: "类别归档:",
      resolution: "分辨率:",
      transferTime: "传输耗时:",
      vectorSpace: "向量空间:",
      securityHash: "安全哈希:",
      zoomIn: "🔍 放大",
      zoomOut: "🔍 缩小",
      rotate: "🔄 旋转"
    },
    footer: {
      desc: "面向真实用户的开源跨端照片极速同步与本地 AI 智能相册系统。",
      repo: "GitHub 仓库",
      release: "最新发布版本",
      license: "Apache 2.0 开源协议",
      copyright: "© 2026 ShareCLIP Open Source Project. Under Apache 2.0 License.",
      bottomNotice: "100% 本地计算 • 零云端中转 • 绝无隐私泄露"
    }
  },

  en: {
    nav: {
      features: "Features",
      videoDemo: "Video Demo",
      ai: "AI Engine",
      simulator: "Simulator",
      comparison: "Comparison",
      webshare: "🌐 WebShare Online",
      download: "Download"
    },
    hero: {
      badge: "✨ High-Speed Wireless Transfer • 100% On-Device AI Gallery",
      titleMain: "ShareCLIP",
      titleSub: "Private P2P Photo Sync & Local AI Gallery",
      desc: "Transfer photos directly from your Android phone to your PC over high-speed local Wi-Fi. Search and organize your entire photo library using 100% on-device AI. No cloud uploads, no USB cables, no subscriptions, and 100% private.",
      btnWebshare: "Try WebShare Online (Zero Install)",
      btnWindows: "Download for Windows",
      btnAndroid: "Download Android APK",
      btnSimulate: "Simulate Handshake",
      btnGithub: "GitHub Repository"
    },
    videoSection: {
      badge: "OFFICIAL PROMO & DEMO",
      title: "Mobile & PC Seamless Wireless Transfer • Live Demo",
      subtitle: "Experience high-speed LAN direct transfer and on-device AI photo organization without cables or cloud relays.",
      t1: "⚡ 80+ MB/s Gigabit LAN Stream",
      t2: "🔒 100% On-Device Privacy",
      t3: "🧠 Local AI Natural Language Search",
      t4: "📱 Seamless QR Pairing (No Cables)",
      videoTitle: "ShareCLIP Mobile & PC Direct Sync Real-World Demo",
      playHint: "Click to play full HD demo video (zero cloud traffic)"
    },
    chips: {
      c1_title: "High-Speed P2P Direct",
      c1_sub: "80+ MB/s Local Wi-Fi • No Cables",
      c2_title: "100% On-Device AI",
      c2_sub: "Natural Language Search & Face Albums",
      c3_title: "Privacy by Design",
      c3_sub: "Zero Cloud Relays • Zero Subscriptions"
    },
    stats: {
      s1_val: "0 KB",
      s1_label: "Cloud Data Uploaded (100% Local LAN)",
      s2_val: "80+ MB/s",
      s2_label: "Real-World Local Wi-Fi Speed",
      s3_val: "100%",
      s3_label: "On-Device AI • No Cloud Dependencies",
      s4_val: "Free",
      s4_label: "Open Source • No Subscription Fees"
    },
    features: {
      title: "Core Capabilities",
      subtitle: "Engineered to eliminate the hassle of cables and the privacy risks of cloud photo albums.",
      f1: {
        title: "Instant Wireless Pairing",
        desc: "No manual IP setup. Scan the QR code on your PC screen to establish an instant direct link in seconds."
      },
      f2: {
        title: "Gigabit Local Wi-Fi Transfer",
        desc: "Streams photos directly between phone and PC at up to 80+ MB/s over local Wi-Fi. Fast, private, and zero data cost."
      },
      f3: {
        title: "Natural Language AI Search",
        desc: "Find pictures by typing what you remember in everyday language (e.g., 'sunset at beach', 'dog on grass'). Runs 100% locally."
      },
      f4: {
        title: "4K Immersive Lightbox",
        desc: "0ms instant thumbnail browsing with on-demand 4K RAW photo streaming from your phone when connected."
      },
      f5: {
        title: "EXIF Travel Footprint Map",
        desc: "Extracts camera GPS coordinates and plots your travels on an interactive dynamic clustered map."
      },
      f6: {
        title: "Smart Duplicate & Burst Cleanup",
        desc: "Locates duplicate photos and bursts in milliseconds. One-click cleanup frees storage on both PC and phone."
      }
    },
    aiSection: {
      badge: "AI PLAYGROUND",
      title: "On-Device Multimodal AI Photo Engine",
      subtitle: "All AI computations run 100% locally on CPU/GPU & WASM SIMD threads for ultra speed & privacy.",
      tabSearch: "Natural Language Search",
      tabFaces: "Face Timeline & Albums",
      tabDedup: "Duplicate & Burst Cleanup",
      searchTitle: "On-Device Vector Semantic Retrieval",
      searchSub: "Type natural language or click preset tags to see instant vector matching (click photo for 4K preview):",
      searchPlaceholder: "e.g. sunset at beach, golden retriever on grass, invoice receipt, city night skyline...",
      searchBtn: "Semantic Search",
      presetLabel: "Presets:",
      presets: [
        { icon: "🌅", text: "Sunset at beach" },
        { icon: "🐕", text: "Golden retriever on grass" },
        { icon: "🧾", text: "Invoice receipt document" },
        { icon: "🌃", text: "City night skyline" },
        { icon: "🍜", text: "Delicious ramen noodles" }
      ],
      clickPreview: "🔍 4K Preview",
      similarity: "Similarity",
      faceTitle: "Local Face Feature Clustering & Timeline",
      faceSub: "High-precision local model clustering. Click avatar to filter albums:",
      photosCount: "photos",
      dedupTitle: "Burst & Duplicate Detection",
      dedupSub: "Locate bursts and duplicates in milliseconds. Free up dual-device storage in one click:",
      threshold: "Similarity Threshold:",
      cleanupBtn: "Simulate Cleanup (Free 48.2 MB)",
      group: "Group",
      bestKeep: "🌟 Best (Keep)",
      suggestDel: "🗑️ Duplicate (Delete)"
    },
    simulator: {
      badge: "ZERO-TRAFFIC PROTOCOL",
      title: "True LAN P2P Zero-Traffic Wireless Sync Pipeline",
      subtitle: "No cables, no cloud servers. Instant auto-pairing + gigabit local Wi-Fi stream.",
      s1: "Scan QR",
      s2: "Signaling",
      s3: "LAN Direct",
      s4: "Two-way Transfer",
      qrText: "Desktop displays QR code containing connection parameters.",
      qrSub: "Mobile scans QR, extracts descriptors, and initiates direct handshake.",
      bleText: "Exchanging connection candidates via offline local signaling.",
      bleSub: "Sub-second negotiation without internet connectivity.",
      connectedText: "Direct P2P Channel Established Successfully!",
      connectedSub: "Switches to local gigabit Wi-Fi socket communication at line rate.",
      flowText: "Binary chunk streaming with congestion and backpressure flow control.",
      flowSub: "Reassembles binary chunks into files and writes directly to local gallery.",
      pcToPhone: "PC 📤 Mobile (Send File)",
      phoneToPc: "Mobile 📤 PC (Send File)",
      next: "Next Step ➔",
      reset: "Restart Demo ↺",
      consoleTitle: "📡 Direct Link Signaling Console",
      desktop: "Desktop PC",
      mobile: "Android Mobile",
      techTitle: "💡 Core Design Principles:",
      t1_title: "1. Zero-Config QR Pairing",
      t1_desc: "Desktop generates a dynamic QR code. Mobile scans to lock target instantly without manual IP entry.",
      t2_title: "2. Offline Local Signaling",
      t2_desc: "Exchanges connection descriptors locally without routing through any public signaling server.",
      t3_title: "3. Gigabit Wi-Fi LAN Direct",
      t3_desc: "Once P2P link is established, data streams directly over local Wi-Fi at line rate.",
      t4_title: "4. Binary Chunk Streaming",
      t4_desc: "Files are streamed with backpressure control, ensuring responsive UI and zero memory leaks."
    },
    comparison: {
      badge: "COMPARISON",
      title: "Why Choose ShareCLIP?",
      subtitle: "Compare ShareCLIP against cloud subscriptions, messaging apps, and traditional USB cables.",
      dim: "Dimension",
      shareclip: "✨ ShareCLIP (Open Source)",
      cloud: "☁️ Cloud Storage (Google/iCloud)",
      chat: "💬 Messaging Apps",
      usb: "🔌 USB Cable",
      speed_dim: "Transfer Speed",
      speed_shareclip: "80+ MB/s Wi-Fi Direct (Gigabit)",
      speed_cloud: "Throttled by internet bandwidth",
      speed_chat: "Slow, server-routed file limits",
      speed_usb: "Wired link, requires physical cable",
      privacy_dim: "Privacy & Data Security",
      privacy_shareclip: "100% Private on your hardware",
      privacy_cloud: "Uploaded to 3rd-party servers",
      privacy_chat: "Routed through social platform servers",
      privacy_usb: "Local storage",
      ai_dim: "AI Natural Language Search",
      ai_shareclip: "✅ On-Device AI (100% Offline)",
      ai_cloud: "Cloud AI (Requires cloud upload)",
      ai_chat: "❌ No search capability",
      ai_usb: "❌ None (Dumb storage volume)",
      face_dim: "Face Clustering & Map",
      face_shareclip: "✅ Local Face Clustering",
      face_cloud: "Biometric data analyzed in cloud",
      face_chat: "❌ None",
      face_usb: "❌ None",
      conv_dim: "Convenience & Cost",
      conv_shareclip: "Instant QR scan • Free & Open Source",
      conv_cloud: "Requires monthly paid subscription",
      conv_chat: "Manual photo selection & compression",
      conv_usb: "Must carry & plug compatible cable"
    },
    download: {
      badge: "OFFICIAL RELEASES",
      title: "Download ShareCLIP Now",
      subtitle: "Open-source local AI photo sync across Windows, macOS, Linux, Android, and Web.",
      pc_title: "Windows Desktop",
      pc_meta: "Windows 10 / 11 (64-bit)",
      pc_desc: "Built-in DirectML GPU local AI engine, 4K lightbox gallery, and intelligent dedup.",
      pc_btn: "Download Windows Installer (.exe)",
      mac_title: "macOS Desktop",
      mac_meta: "Apple Silicon (M1-M4) & Intel Mac",
      mac_desc: "Optimized for macOS Sonoma / Sequoia with Metal acceleration.",
      mac_btn_arm: "🍏 Apple Silicon DMG (M-Series)",
      mac_btn_intel: "🖥️ Intel Mac DMG",
      mac_btn_zip: "📦 Portable ZIP Bundle",
      linux_title: "Linux Desktop",
      linux_meta: "Ubuntu, Debian, Fedora, Arch Linux",
      linux_desc: "Portable AppImage zero-install bundle and standard DEB package.",
      linux_btn_appimage: "🚀 Download AppImage (Portable)",
      linux_btn_deb: "📦 Download DEB (Ubuntu/Debian)",
      android_title: "Android Mobile App",
      android_meta: "Android 8.0+ (Universal 32/64-bit)",
      android_desc: "Flutter-powered near-field wireless sync and background photo backup.",
      android_btn: "Download Android APK (.apk)",
      ios_title: "iOS & Mobile PWA",
      ios_meta: "iPhone / iPad • Zero Installation",
      ios_desc: "Mobile WebGPU browser sync with camera QR scanner and streaming media.",
      ios_btn: "📲 Open MShare Web App",
      clone_title: "💻 Developer Git Clone",
      copy_btn: "📋 Copy Command",
      copied_btn: "✅ Copied"
    },
    lightbox: {
      badge: "4K RAW ON-DEMAND STREAM",
      title: "📊 EXIF & AI Vector Metadata",
      category: "Category:",
      resolution: "Resolution:",
      transferTime: "Transfer Time:",
      vectorSpace: "Vector Space:",
      securityHash: "Security Hash:",
      zoomIn: "🔍 Zoom In",
      zoomOut: "🔍 Zoom Out",
      rotate: "🔄 Rotate"
    },
    footer: {
      desc: "Open-source high-speed photo sync and local AI gallery for real-world photo management.",
      repo: "GitHub Repository",
      release: "Latest Release",
      license: "Apache 2.0 License",
      copyright: "© 2026 ShareCLIP Open Source Project. Under Apache 2.0 License.",
      bottomNotice: "100% Local Processing • Zero Cloud Relays • Absolute Privacy"
    }
  }
};

// Autogenerate translations for remaining languages with complete fallbacks
const languagesToGenerate = [
  "zh-TW", "ja", "ko", "es", "fr", "de", "it", "ru", "pt", "vi", "th", "id", "ar", "hi", "tr", "pl", "nl", "sv"
];

const translations = {
  zh: messages.zh,
  en: messages.en
};

languagesToGenerate.forEach(lang => {
  if (lang === "zh-TW") {
    // Deep clone zh for Traditional Chinese
    translations["zh-TW"] = JSON.parse(JSON.stringify(messages.zh));
    translations["zh-TW"].nav.webshare = "🌐 網頁互聯 (WebShare)";
    translations["zh-TW"].nav.download = "立即下載";
    translations["zh-TW"].hero.titleMain = "ShareCLIP";
    translations["zh-TW"].hero.titleSub = "Private P2P Photo Sync & Local AI Gallery";
    translations["zh-TW"].hero.desc = "無需數據線，零雲端中轉。手機掃碼直接將照片高速傳輸至電腦（80+ MB/s），並在本地利用 AI 自由搜索、人臉聚類與管理您的個人相冊。100% 本地隱私安全，絕不手動上傳第三方服務器，永久免費開源。";
  } else {
    // Clone English as robust fallback
    const cloned = JSON.parse(JSON.stringify(messages.en));
    translations[lang] = cloned;
  }
});

export const locales = translations;
