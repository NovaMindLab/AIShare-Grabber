// ShareCLIP Desktop Client Localization Dictionary (20 Languages)

export const languages = {
  en: "English",
  zh: "简体中文",
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

export const locales = {
  en: {
    sidebar: {
      importFolder: "Import Directory",
      importFiles: "Import Files",
      connHeader: "Connections",
      linkMobile: "📱 Link Mobile",
      localHeader: "Local Resources",
      tabImages: "🖼️ Pictures",
      tabVideos: "🎥 Videos",
      tabAudios: "🎵 Audio",
      tabFiles: "📄 Files",
      aiFilter: "AI Categorization",
      allImages: "All Pictures",
      archTitle: "💡 Architecture Note",
      archDesc: "This app runs MobileCLIP zero-shot image classification fully locally on Node.js. 100% offline."
    },
    header: {
      currentPath: "Current Directory: ",
      noPath: "No directory loaded, please select a folder or import images.",
      searchPlaceholder: "Enter search query in English, e.g. 'a dog', 'sunset'...",
      searchBtn: "Search",
      themeBtn: "Toggle Theme"
    },
    link: {
      linkTitle: "Link Companion Phone",
      linkDesc: "Enabling the sync service will start BLE advertising. Scan the pairing QR code from the ShareCLIP mobile app to establish a high-speed bidirectional WebRTC P2P direct channel.",
      startBtn: "🚀 Enable Mobile Sync",
      initializing: "Initializing local BLE advertising...",
      advertisingTitle: "📢 BLE Advertising Active",
      advertisingDesc: "Please open the mobile app and tap 'Link PC' to scan the QR code for handshaking.",
      stopBtn: "Stop Sync",
      handshaking: "Negotiating WebRTC parameters...",
      connectedTitle: "🟢 P2P Direct Channel Established",
      connectedDesc: "Phone connected successfully. You can now send photos from your phone or manage transfers below.",
      disconnectBtn: "Disconnect",
      logsTitle: "📝 Connection Logs",
      clearLogs: "Clear",
      waitingLogs: "Waiting for logs...",
      hotspotTab: "Wi-Fi Hotspot",
      qrTab: "Scan QR Code",
      startHotspot: "🚀 Create Wi-Fi Hotspot",
      stopHotspot: "Stop Hotspot",
      hotspotRunning: "🟢 Local Wi-Fi Hotspot Active",
      hotspotStarting: "Starting local Wi-Fi hotspot...",
      hotspotFailed: "Failed to start Wi-Fi hotspot. Please verify Wi-Fi is enabled.",
      hotspotInstructions: "1. Connect your phone's Wi-Fi to the hotspot shown below. 2. Scan the pairing QR code to pair and sync."
    },
    images: {
      emptyImages: "No image resources",
      emptyImagesDesc: "Import folders, select images, or sync from your mobile companion to manage pictures and run MobileCLIP classification.",
      importImagesBtn: "📁 Import Images Folder",
      aiAnalyzing: "AI Analyzing...",
      matchScore: "Match score",
      waitingQueue: "Wait in queue"
    },
    media: {
      emptyVideos: "No video resources",
      emptyVideosDesc: "Videos synced from phone or imported locally can be played and managed here.",
      emptyAudios: "No audio resources",
      emptyAudiosDesc: "Audios synced from phone or imported locally can be played and managed here.",
      emptyDocs: "No document resources",
      emptyDocsDesc: "Documents synced from phone or imported locally can be managed here.",
      fileDoc: "Document File",
      fileVideo: "Video File",
      fileAudio: "Audio File"
    },
    details: {
      detailsTitle: "Resource Details",
      imageName: "Name",
      imagePath: "Path",
      imageSize: "Size",
      syncTime: "Sync Time",
      predictionsTitle: "Local MobileCLIP AI Predictions",
      sendToPhone: "📤 Send to Phone",
      deleteBtn: "Delete",
      closeBtn: "Close"
    }
  },
  zh: {
    sidebar: {
      importFolder: "导入本地目录",
      importFiles: "导入选定文件",
      connHeader: "连接管理",
      linkMobile: "📱 连接手机",
      localHeader: "本地资源",
      tabImages: "🖼️ 图片",
      tabVideos: "🎥 视频",
      tabAudios: "🎵 音频",
      tabFiles: "📄 文件",
      aiFilter: "智能分类筛选",
      allImages: "全部图片",
      archTitle: "💡 架构说明",
      archDesc: "本应用采用预计算 CLIP 架构，在本地纯 Node.js 主进程中运行 MobileCLIP 零样本图像分类，完全本地化，无需上传网络。"
    },
    header: {
      currentPath: "当前目录: ",
      noPath: "未加载任何目录，请选择文件夹或导入图片。",
      searchPlaceholder: "输入英文搜索, 如 'a dog', 'sunset'...",
      searchBtn: "搜索",
      themeBtn: "切换主题"
    },
    link: {
      linkTitle: "连接移动设备",
      linkDesc: "开启同步服务后，本地将启动 BLE 广播。使用 ShareCLIP 手机端 App 扫描配对二维码，即可建立极速 P2P Wi-Fi 直连通道，实现跨设备双向文件传输。",
      startBtn: "🚀 开启手机同步服务",
      initializing: "正在初始化本地低功耗蓝牙广播...",
      advertisingTitle: "📢 蓝牙信令广播中",
      advertisingDesc: "请打开手机 App 并点击“连接 PC”扫描配对二维码进行握手连接。",
      stopBtn: "停止广播",
      handshaking: "正在协商 WebRTC 握手参数...",
      connectedTitle: "🟢 已建立极速 P2P 直连通道",
      connectedDesc: "手机已成功连接。您现在可以从手机发送照片或在下方管理传输。",
      disconnectBtn: "断开连接",
      logsTitle: "📝 实时连接日志 (Live Logs)",
      clearLogs: "清空",
      waitingLogs: "等待同步日志...",
      hotspotTab: "本地热点模式",
      qrTab: "扫码配对模式",
      startHotspot: "🚀 开启本地 Wi-Fi 热点",
      stopHotspot: "关闭本地热点",
      hotspotRunning: "🟢 本地 Wi-Fi 热点已开启",
      hotspotStarting: "正在创建本地直连热点...",
      hotspotFailed: "开启本地热点失败，请确保电脑的无线网卡已开启。",
      hotspotInstructions: "1. 请先将手机的 Wi-Fi 连接至下方创建的直连热点。2. 连接成功后，使用手机端 App 扫描下方的配对二维码进行握手同步。"
    },
    images: {
      emptyImages: "暂无本地图片资源",
      emptyImagesDesc: "点击左侧导入本地目录或导入选定文件，或者通过手机端直连进行传输，即可在此管理图片并运行 MobileCLIP 分类。",
      importImagesBtn: "📁 导入本地图片文件夹",
      aiAnalyzing: "AI 分析中...",
      matchScore: "匹配度",
      waitingQueue: "等待队列"
    },
    media: {
      emptyVideos: "暂无本地视频资源",
      emptyVideosDesc: "导入视频文件或从手机传输视频后，可以在这里直接播放与预览。",
      emptyAudios: "暂无本地音频资源",
      emptyAudiosDesc: "导入音频文件或从手机传输音频后，可以在这里直接播放与预览。",
      emptyDocs: "暂无本地文件资源",
      emptyDocsDesc: "导入各种文件或从手机传输文件后，可以在这里管理这些文件。",
      fileDoc: "文件资源",
      fileVideo: "视频文件",
      fileAudio: "音频文件"
    },
    details: {
      detailsTitle: "资源详情",
      imageName: "文件名",
      imagePath: "物理路径",
      imageSize: "大小",
      syncTime: "同步时间",
      predictionsTitle: "端侧 MobileCLIP AI 分析结果",
      sendToPhone: "📤 传送给手机",
      deleteBtn: "删除",
      closeBtn: "关闭"
    }
  }
};

// Autopopulate remaining languages with English fallback
const langList = ["zh-TW", "ja", "ko", "es", "fr", "de", "it", "ru", "pt", "vi", "th", "id", "ar", "hi", "tr", "pl", "nl", "sv"];
langList.forEach(lang => {
  if (lang === "zh-TW") {
    // Traditional Chinese custom translations
    locales["zh-TW"] = {
      sidebar: {
        importFolder: "匯入本地目錄",
        importFiles: "匯入選定檔案",
        connHeader: "連線管理",
        linkMobile: "📱 連線手機",
        localHeader: "本地資源",
        tabImages: "🖼️ 圖片",
        tabVideos: "🎥 影片",
        tabAudios: "🎵 音訊",
        tabFiles: "📄 檔案",
        aiFilter: "智能分類篩選",
        allImages: "全部圖片",
        archTitle: "💡 架構說明",
        archDesc: "本應用採用預計算 CLIP 架構，在本地純 Node.js 主進程中執行 MobileCLIP 零樣本圖像分類，完全本地化，無需上傳網路。"
      },
      header: {
        currentPath: "目前目錄: ",
        noPath: "未載入任何目錄，請選擇資料夾或匯入圖片。",
        searchPlaceholder: "輸入英文搜尋, 如 'a dog', 'sunset'...",
        searchBtn: "搜尋",
        themeBtn: "切換主題"
      },
      link: {
        linkTitle: "連線行動裝置",
        linkDesc: "開啟同步服務後，本地將啟動 BLE 廣播。使用 ShareCLIP 手機端 App 掃描配對二維碼，即可建立極速 P2P Wi-Fi 直連通道，實現跨裝置雙向檔案傳輸。",
        startBtn: "🚀 開啟手機同步服務",
        initializing: "正在初始化本地低功耗藍牙廣播...",
        advertisingTitle: "📢 藍牙信令廣播中",
        advertisingDesc: "請打開手機 App 並點擊“連線 PC”掃描配對二維碼進行握手連線。",
        stopBtn: "停止廣播",
        handshaking: "正在協商 WebRTC 握手參數...",
        connectedTitle: "🟢 已建立極速 P2P 直連通道",
        connectedDesc: "手機已成功連線。您現在可以從手機傳送照片或在下方管理傳輸。",
        disconnectBtn: "斷開連線",
        logsTitle: "📝 即時連線日誌 (Live Logs)",
        clearLogs: "清空",
        waitingLogs: "等待同步日誌...",
        hotspotTab: "本地熱點模式",
        qrTab: "掃碼配對模式",
        startHotspot: "🚀 開啟本地 Wi-Fi 熱點",
        stopHotspot: "關閉本地熱點",
        hotspotRunning: "🟢 本地 Wi-Fi 熱點已開啟",
        hotspotStarting: "正在創建本地直連熱點...",
        hotspotFailed: "開啟本地熱點失敗，請確保電腦的無線網卡已開啟。",
        hotspotInstructions: "1. 請先將手機的 Wi-Fi 連線至下方創建的直連熱點。2. 連線成功後，使用手機端 App 掃描下方的配對二維碼進行握手連線。"
      },
      images: {
        emptyImages: "暫無本地圖片資源",
        emptyImagesDesc: "點擊左側匯入本地目錄或匯入選定檔案，或者通過手機端直連進行傳輸，即可在此管理圖片並執行 MobileCLIP 分類。",
        importImagesBtn: "📁 匯入本地圖片資料夾",
        aiAnalyzing: "AI 分析中...",
        matchScore: "匹配度",
        waitingQueue: "等待隊列"
      },
      media: {
        emptyVideos: "暫無本地影片資源",
        emptyVideosDesc: "匯入影片檔案或從手機傳輸影片後，可以在這裡直接播放與預覽。",
        emptyAudios: "暫無本地音訊資源",
        emptyAudiosDesc: "匯入音訊檔案或從手機傳輸音訊後，可以在這裡直接播放與預覽。",
        emptyDocs: "暫無本地檔案資源",
        emptyDocsDesc: "匯入各種檔案或從手機傳輸檔案後，可以在這裡管理這些檔案。",
        fileDoc: "檔案資源",
        fileVideo: "影片檔案",
        fileAudio: "音訊檔案"
      },
      details: {
        detailsTitle: "資源詳情",
        imageName: "檔案名稱",
        imagePath: "物理路徑",
        imageSize: "大小",
        syncTime: "同步時間",
        predictionsTitle: "端側 MobileCLIP AI 分析結果",
        sendToPhone: "📤 傳送給手機",
        deleteBtn: "刪除",
        closeBtn: "關閉"
      }
    };
  } else if (!locales[lang]) {
    // Clone English as default fallback
    const cloned = JSON.parse(JSON.stringify(locales.en));
    // Add prefix to button to verify it's working
    cloned.sidebar.linkMobile = `${cloned.sidebar.linkMobile} (${lang.toUpperCase()})`;
    locales[lang] = cloned;
  }
});
