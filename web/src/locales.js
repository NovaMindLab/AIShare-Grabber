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
      ai: "AI 智能引擎",
      simulator: "直连演示",
      comparison: "方案对比",
      webshare: "🌐 网页互联 (WebShare)",
      download: "立即下载"
    },
    hero: {
      badge: "✨ 全新多端无网互传版 • 正式发布",
      titleMain: "打破设备壁垒",
      titleSub: "本地 AI 赋能的跨端无网照片管理生态",
      desc: "ShareCLIP 是一款专为重视隐私与效率的用户打造的跨端无网照片同步与本地 AI 智能管理系统。无需数据线、无需公网服务器中转，手机与电脑之间依靠近场蓝牙（BLE）秒速握手，并通过局域网 WebRTC 点对点直连实现千兆级极速传输。搭载端侧 MobileCLIP 多模态模型，所有数据 100% 留存在本地物理设备中。",
      btnWebshare: "在线体验 WebShare 网页版 (免安装)",
      btnWindows: "下载 Windows 桌面端 (175 MB)",
      btnAndroid: "下载 Android APK (35 MB)",
      btnSimulate: "交互式握手演示",
      btnGithub: "GitHub 开源仓库"
    },
    videoSection: {
      badge: "OFFICIAL PROMO & DEMO",
      title: "手机与 PC 秒级直连互传 • 沉浸式实机演示",
      subtitle: "告别物理数据线与云盘限速，体验局域网千兆 WebRTC 极速直传与端侧 MobileCLIP AI 智能分类实测",
      t1: "⚡ 40MB/s 局域网极速直传",
      t2: "🔒 100% 纯本地端侧安全",
      t3: "🧠 MobileCLIP 毫秒级 AI 分类",
      t4: "📱 手机 ↔ 电脑 极简扫码互通",
      videoTitle: "ShareCLIP 手机与电脑无线互联互传实机演示",
      playHint: "点击播放高清演示视频 (零流量本地运行)"
    },
    chips: {
      c1_title: "WebRTC 千兆直连",
      c1_sub: "1.2 GB/s 局域网无损互传",
      c2_title: "MobileCLIP-S0 AI",
      c2_sub: "512 维离线多模态语义向量",
      c3_title: "100% 本地隐私安全",
      c3_sub: "零云端中转 • 零流量消耗"
    },
    stats: {
      s1_val: "0 ms",
      s1_label: "云端中转延迟 (纯本地 P2P 直连)",
      s2_val: "80+ MB/s",
      s2_label: "局域网 Wi-Fi Socket 实测吞吐",
      s3_val: "512-D",
      s3_label: "MobileCLIP 空间自然语言语义搜索",
      s4_val: "100%",
      s4_label: "数据本地存储 • 绝无隐私外泄风险"
    },
    features: {
      title: "核心功能特性",
      subtitle: "融合低功耗蓝牙、局域网直连与端侧大模型，重新定义多端数据流转体验",
      f1: {
        title: "BLE 蓝牙无缝配对",
        desc: "摒弃繁琐的传统蓝牙配对或局域网 IP 手动输入。手机端只需扫描 PC 二维码，即可通过 BLE 低功耗蓝牙特性建立端到端的握手信令通道，自动发现彼此并交换连接描述。"
      },
      f2: {
        title: "WebRTC 局域网直连",
        desc: "握手成功后，自动建立 WebRTC 点对点直连（SCTP DataChannel）。在手机和电脑间开启千兆级 Wi-Fi 本地 Socket 传输，秒传高清原图，免去云端服务器流量限制。"
      },
      f3: {
        title: "本地 MobileCLIP 智能分类",
        desc: "电脑端内置 MobileCLIP 零样本图像分类器。传输照片后，直接调用本地 ONNX 引擎在 0.2 秒内计算分类特征，自动将照片归档至“人像、动物、风景”等类别，全程纯本地执行。"
      },
      f4: {
        title: "渐进式 4K 大图画廊 (Lightbox)",
        desc: "0ms 秒开缩略图，手机在线时按需直传 4K 原图无缝热替换，支持键盘左右键快速切图与自由放大旋转。"
      },
      f5: {
        title: "足迹地图 (Footprint Map)",
        desc: "自动提取照片 EXIF 中的 GPS 坐标信息，并在交互式地图上以紫色玻璃拟态气泡动态聚类生成你的专属旅行足迹图。"
      },
      f6: {
        title: "智能相似图去重 & 双端同步清理",
        desc: "基于余弦相似度质心聚类算法毫秒级定位重复与相似抓拍，电脑端一键勾选清理，并联动通过 WebRTC 信令同步从手机相册中安全移除。"
      }
    },
    aiSection: {
      badge: "AI PLAYGROUND",
      title: "端侧多模态 AI 智能相册引擎",
      subtitle: "所有 AI 运算均在 PC 端 CPU/GPU 及 WASM SIMD 多线程上本地运行，保障极致速度与绝对隐私",
      tabSearch: "自然语言语义搜图 (CLIP 512-D)",
      tabFaces: "人脸识别与人物时间轴 (SIMD 聚类)",
      tabDedup: "相似图与连拍去重 (Cosine 质心)",
      searchTitle: "MobileCLIP 512-D 向量空间语义检索",
      searchSub: "输入自然语言或点击测试词，实时感受本地向量语义匹配能力（点击照片可全屏预览）：",
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
      faceTitle: "WASM SIMD 128位 人脸特征聚类与时间轴",
      faceSub: "SCRFD + MobileFaceNet 本地高精度聚类，点击人物头像筛选专属相册：",
      photosCount: "张照片",
      dedupTitle: "Leader Centroid 连拍与相似图识别",
      dedupSub: "毫秒级定位连拍废片与重复抓拍，电脑端一键释放双端存储空间：",
      threshold: "相似度阈值：",
      cleanupBtn: "模拟清理重复项 (释放 48.2 MB)",
      group: "分组",
      bestKeep: "🌟 推荐保留最佳",
      suggestDel: "🗑️ 建议清理"
    },
    simulator: {
      badge: "ZERO-TRAFFIC PROTOCOL",
      title: "真·局域网 P2P 零流量极速同步架构",
      subtitle: "无需数据线、无需公网服务器，近场 BLE 自动握手 + WebRTC DataChannel 千兆级局域网直连",
      s1: "扫码解析",
      s2: "蓝牙信令",
      s3: "局域网直连",
      s4: "双向互传",
      qrText: "电脑端渲染包含 MAC、UUID 与会话密钥的 QR 二维码",
      qrSub: "手机扫码，解析获得蓝牙服务描述符 `6e400001-...` 以及会话流水号",
      bleText: "利用蓝牙广播交换 WebRTC 连接密钥与 ICE 候选网卡地址",
      bleSub: "使用 80ms 延时通知队列，防范 Windows 系统蓝牙驱动在高频传输时丢弃通知",
      connectedText: "通道打通成功 (SCTP DataChannel Opened)",
      connectedSub: "断开低效的蓝牙临时通道，激活本地千兆 Wi-Fi 网络高速双向通信套接字",
      flowText: "16 字节头部二进制组包 + BufferedAmount 拥塞算法限速传输",
      flowSub: "传输的图像将被接收方重新组装还原，保存后即可在画廊中直接出现",
      pcToPhone: "PC 📤 手机 (传输文件)",
      phoneToPc: "手机 📤 PC (传输文件)",
      next: "下一步 ➔",
      reset: "重新演示 ↺",
      consoleTitle: "📡 BLE GATT 蓝牙信令通道控制台",
      desktop: "电脑端 (Desktop)",
      mobile: "手机端 (Android)",
      techTitle: "💡 核心技术机制：",
      t1_title: "1. 零配置扫码接入",
      t1_desc: "电脑生成动态二维码，内嵌 PC 的 BLE MAC 地址、GATT Service UUID 及 32-bit 会话密钥。手机扫码即可直接锁定目标，无需繁琐的传统蓝牙配对。",
      t2_title: "2. 蓝牙信令分片规避 MTU 限制",
      t2_desc: "双方通过 GATT 特征值交换 WebRTC SDP Offer/Answer 及 ICE Candidates。内置 80ms 节流队列与分片校验，彻底解决 Windows BLE 丢包痛点。",
      t3_title: "3. 切换千兆 Wi-Fi 局域网传输",
      t3_desc: "P2P 直连通道建立完毕后，蓝牙信令通道自动静默，全速切换至本地 Wi-Fi Socket，彻底释放千兆带宽性能。",
      t4_title: "4. 16-Byte 自定义包头与流式组包",
      t4_desc: "文件切分为 32KB 二进制 Chunk，首部携带 16 字节协议头（FileId, Offset, TotalLen），支持断点保护与背压缓冲控制。"
    },
    comparison: {
      badge: "COMPARISON",
      title: "为什么选择 ShareCLIP？",
      subtitle: "对比传统公有云相册、社交软件文件传输与物理数据线",
      dim: "对比维度",
      shareclip: "✨ ShareCLIP (本方案)",
      cloud: "☁️ 传统云相册 (iCloud / 百度网盘)",
      chat: "💬 微信 / QQ 文件传输助手",
      usb: "🔌 传统 USB 物理数据线",
      speed_dim: "传输速度",
      speed_shareclip: "80+ MB/s Wi-Fi 直连 (千兆级)",
      speed_cloud: "受限于公网带宽与 VIP 限速",
      speed_chat: "受公网服务器限速 (极慢)",
      speed_usb: "高速物理直连",
      privacy_dim: "隐私与数据安全",
      privacy_shareclip: "100% 本地存储 • 零云端泄露",
      privacy_cloud: "全量上传第三方云服务器",
      privacy_chat: "数据经过社交平台服务器",
      privacy_usb: "本地存储",
      ai_dim: "AI 自然语言搜图",
      ai_shareclip: "✅ 本地 MobileCLIP 512-D",
      ai_cloud: "需上传云端做 AI 分析",
      ai_chat: "❌ 无搜图能力",
      ai_usb: "❌ 仅作为普通 U 盘读取",
      face_dim: "人脸聚类与足迹地图",
      face_shareclip: "✅ 本地 WASM SIMD 聚类",
      face_cloud: "云端分析生物特征",
      face_chat: "❌ 无",
      face_usb: "❌ 无",
      conv_dim: "便捷性",
      conv_shareclip: "无线扫码秒连 • 自动同步",
      conv_cloud: "需联网登录账号",
      conv_chat: "需手动逐张点选发送",
      conv_usb: "需寻找适配数据线连接"
    },
    download: {
      badge: "OFFICIAL RELEASES",
      title: "立即下载 ShareCLIP 开始使用",
      subtitle: "安全、极速、无广告的本地 AI 相册同步管理工具",
      pc_title: "ShareCLIP PC 桌面端",
      pc_meta: "支持 Windows 10 / 11 (64-bit) • ~175 MB",
      pc_desc: "内置 MobileCLIP ONNX 引擎、WASM SIMD 聚类加速与 4K Lightbox 画廊。",
      pc_btn: "下载 Windows 安装包 (.exe)",
      android_title: "ShareCLIP Android 移动端",
      android_meta: "支持 Android 8.0 及以上版本 • ~35 MB",
      android_desc: "基于 Flutter 构建，支持 BLE 近场扫码、Wi-Fi 直连与后台无感增量对齐。",
      android_btn: "下载 Android 安装包 (.apk)",
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
      desc: "下一代本地 AI 赋能的跨端无网照片管理与无线极速同步生态系统。",
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
      badge: "✨ Next-Gen Cross-Platform Sync • Official Release",
      titleMain: "Break Device Barriers",
      titleSub: "Local AI-Powered Zero-Traffic Photo Ecosystem",
      desc: "ShareCLIP is a privacy-first, lightning-fast cross-device photo management solution connecting your mobile devices and desktop workstations without cables, cloud subscriptions, or cellular data. Instant BLE pairing negotiates gigabit WebRTC DataChannels over local Wi-Fi, powered by on-device MobileCLIP AI for zero-shot natural language search and SIMD face clustering.",
      btnWebshare: "Experience WebShare Online (Zero Install)",
      btnWindows: "Download for Windows (175 MB)",
      btnAndroid: "Download Android APK (35 MB)",
      btnSimulate: "Simulate Handshake",
      btnGithub: "GitHub Repository"
    },
    videoSection: {
      badge: "OFFICIAL PROMO & DEMO",
      title: "Mobile & PC Seamless P2P Sync • Live Video Demo",
      subtitle: "Experience lightning-fast LAN WebRTC direct transfer and on-device MobileCLIP AI classification without cables or cloud relays.",
      t1: "⚡ 40MB/s Gigabit LAN Stream",
      t2: "🔒 100% On-Device Privacy",
      t3: "🧠 Sub-Second MobileCLIP AI",
      t4: "📱 Seamless QR Pairing",
      videoTitle: "ShareCLIP Mobile & PC Direct Sync Real-World Demo",
      playHint: "Click to play full HD demo video (zero cloud traffic)"
    },
    chips: {
      c1_title: "Gigabit WebRTC Link",
      c1_sub: "1.2 GB/s LAN Lossless P2P Stream",
      c2_title: "MobileCLIP-S0 AI",
      c2_sub: "512-D Local Multimodal Vectors",
      c3_title: "100% Private & Local",
      c3_sub: "Zero Cloud Relay • Zero Mobile Data"
    },
    stats: {
      s1_val: "0 ms",
      s1_label: "Cloud Relay Latency (Local P2P Direct)",
      s2_val: "80+ MB/s",
      s2_label: "Local Wi-Fi Socket Real-World Speed",
      s3_val: "512-D",
      s3_label: "MobileCLIP Vector Semantic Search",
      s4_val: "100%",
      s4_label: "On-Device Storage • Zero Data Leaks"
    },
    features: {
      title: "Core Features",
      subtitle: "BLE signaling, LAN P2P direct transfer, and local AI model integration redefine data flow.",
      f1: {
        title: "BLE Seamless Pairing",
        desc: "No manual IP inputs. Scan the QR code to establish a BLE GATT command channel, discover peers, and exchange handshake parameters."
      },
      f2: {
        title: "WebRTC LAN Direct Transfer",
        desc: "Pairing triggers WebRTC SCTP DataChannel. Gigabits/s local Wi-Fi transfer directly between phone and PC, bypassing cloud limits."
      },
      f3: {
        title: "Local MobileCLIP AI",
        desc: "PC runs local MobileCLIP ONNX engine. Incoming images classified in 0.2s into Portraits, Animals, Landscapes, etc. 100% offline."
      },
      f4: {
        title: "Progressive 4K Lightbox Gallery",
        desc: "Instant 0ms thumbnail preview with on-demand 4K RAW original photo streaming from mobile. Supports previous/next navigation, zoom, and rotate."
      },
      f5: {
        title: "GPS Footprint Map",
        desc: "Extracts local EXIF GPS coordinates and renders an interactive travel map showing exactly where your photos were taken with smooth dynamic clustering."
      },
      f6: {
        title: "Smart Similarity & Cross-Device Deletion",
        desc: "Calculates cosine similarity across your library using Leader Centroid clustering. One-click duplicate cleanup with synchronized deletion on mobile gallery."
      }
    },
    aiSection: {
      badge: "AI PLAYGROUND",
      title: "On-Device Multimodal AI Photo Engine",
      subtitle: "All AI computations run 100% locally on CPU/GPU & WASM SIMD threads for ultra speed & privacy.",
      tabSearch: "Natural Language Search (CLIP 512-D)",
      tabFaces: "Face Timeline (SIMD Clustering)",
      tabDedup: "Duplicate & Burst Cleanup (Cosine Centroid)",
      searchTitle: "MobileCLIP 512-D Vector Semantic Retrieval",
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
      faceTitle: "WASM SIMD 128-bit Face Feature Clustering & Timeline",
      faceSub: "SCRFD + MobileFaceNet on-device high precision clustering. Click avatar to filter albums:",
      photosCount: "photos",
      dedupTitle: "Leader Centroid Burst & Duplicate Detection",
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
      subtitle: "No cables, no cloud servers. Instant BLE auto-handshake + gigabit WebRTC DataChannel.",
      s1: "Scan QR",
      s2: "BLE Signaling",
      s3: "LAN Direct",
      s4: "Two-way Transfer",
      qrText: "Desktop displays QR containing MAC, UUID and session key.",
      qrSub: "Mobile scans QR, extracts GATT descriptors, and starts pairing.",
      bleText: "Exchanging WebRTC Offer/Answer SDPs and ICE candidates via BLE.",
      bleSub: "Uses an 80ms throttle queue to prevent Windows BLE packet loss.",
      connectedText: "DataChannel Connected successfully!",
      connectedSub: "Disconnects BLE, switches to local gigabit Wi-Fi socket communication.",
      flowText: "16-byte header chunk packaging & congestion control flow.",
      flowSub: "Reassembles binary chunks into files and writes directly to local gallery.",
      pcToPhone: "PC 📤 Mobile (Send File)",
      phoneToPc: "Mobile 📤 PC (Send File)",
      next: "Next Step ➔",
      reset: "Restart Demo ↺",
      consoleTitle: "📡 BLE GATT Signaling Console",
      desktop: "Desktop PC",
      mobile: "Android Mobile",
      techTitle: "💡 Core Technical Mechanisms:",
      t1_title: "1. Zero-Config QR Pairing",
      t1_desc: "Desktop generates a dynamic QR embedding BLE MAC, GATT Service UUID and session key. Mobile scans to lock target instantly without manual pairing.",
      t2_title: "2. BLE Signaling Chunking",
      t2_desc: "Exchanges SDP Offer/Answer and ICE candidates over GATT characteristics with 80ms throttle pacing, preventing packet loss.",
      t3_title: "3. Gigabit Wi-Fi LAN Direct",
      t3_desc: "Once P2P link is established, BLE goes silent and data switches to local Wi-Fi socket, unleashing gigabit throughput.",
      t4_title: "4. 16-Byte Header & Chunk Streaming",
      t4_desc: "Files are streamed in 32KB binary chunks with a 16-byte protocol header (FileId, Offset, TotalLen), supporting breakpoint resume & backpressure control."
    },
    comparison: {
      badge: "COMPARISON",
      title: "Why Choose ShareCLIP?",
      subtitle: "Comparing against traditional cloud albums, social messenger file assistants, and physical USB cables.",
      dim: "Dimension",
      shareclip: "✨ ShareCLIP (Our System)",
      cloud: "☁️ Cloud Storage (iCloud/Drive)",
      chat: "💬 Social Messenger Assistants",
      usb: "🔌 USB Cable",
      speed_dim: "Transfer Speed",
      speed_shareclip: "80+ MB/s Wi-Fi Direct (Gigabit)",
      speed_cloud: "Limited by internet bandwidth & throttling",
      speed_chat: "Throttled by remote servers (Slow)",
      speed_usb: "High-speed wired link",
      privacy_dim: "Privacy & Data Security",
      privacy_shareclip: "100% Local Storage • Zero Cloud Leaks",
      privacy_cloud: "Uploaded entirely to 3rd-party servers",
      privacy_chat: "Routed through social platform servers",
      privacy_usb: "Local storage",
      ai_dim: "AI Semantic Search",
      ai_shareclip: "✅ Local MobileCLIP 512-D",
      ai_cloud: "Requires uploading to cloud for analysis",
      ai_chat: "❌ No search capability",
      ai_usb: "❌ Treated as dumb storage volume",
      face_dim: "Face Clustering & Map",
      face_shareclip: "✅ Local WASM SIMD Clustering",
      face_cloud: "Biometric data analyzed in cloud",
      face_chat: "❌ None",
      face_usb: "❌ None",
      conv_dim: "Convenience",
      conv_shareclip: "Instant wireless QR scan • Auto sync",
      conv_cloud: "Requires internet & account login",
      conv_chat: "Must pick & send photos manually",
      conv_usb: "Must carry and plug compatible cable"
    },
    download: {
      badge: "OFFICIAL RELEASES",
      title: "Download ShareCLIP Now",
      subtitle: "Secure, high-speed, ad-free local AI photo sync.",
      pc_title: "ShareCLIP Desktop App",
      pc_meta: "For Windows 10 / 11 (64-bit) • ~175 MB",
      pc_desc: "Includes MobileCLIP ONNX engine, WASM SIMD acceleration, and 4K Lightbox gallery.",
      pc_btn: "Download for Windows (.exe)",
      android_title: "ShareCLIP Android Companion",
      android_meta: "For Android 8.0+ • ~35 MB",
      android_desc: "Built with Flutter. Supports BLE QR scanning, Wi-Fi Direct, and background sync.",
      android_btn: "Download for Android (.apk)",
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
      desc: "Next-Gen Local AI Photo Management & P2P Cross-Device Wireless Syncing Ecosystem.",
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
    translations["zh-TW"].hero.titleMain = "打破設備壁壘";
    translations["zh-TW"].hero.titleSub = "本地 AI 賦能的跨端無網相冊管理生態";
  } else {
    // Clone English as robust fallback
    const cloned = JSON.parse(JSON.stringify(messages.en));
    translations[lang] = cloned;
  }
});

export const locales = translations;
