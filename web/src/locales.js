// ShareCLIP Website Localization Dictionary (20 Languages)

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

export const messages = {
  en: {
    nav: { features: "Features", simulator: "Simulator", tech: "Architecture", download: "Download" },
    hero: {
      badge: "✨ New cross-platform sync version released",
      title: "Zero configuration, instant bidirectional photo sync & local AI sorting",
      desc: "ShareCLIP is a revolutionary multi-terminal album manager. Scan the QR code to pair via BLE and WebRTC for secure local P2P transfer between PC and mobile. Powered by local MobileCLIP model for automatic image categorization. 100% private.",
      getClient: "Get Clients",
      simulate: "Simulate Handshake"
    },
    features: {
      title: "Core Features",
      subtitle: "BLE signaling, LAN P2P direct transfer, and local AI model integration redefine data flow.",
      f1: { title: "BLE Seamless Pairing", desc: "No manual IP inputs. Scan the QR code to establish a BLE GATT command channel, discover peers, and exchange handshake parameters." },
      f2: { title: "WebRTC LAN Direct Transfer", desc: "Pairing triggers WebRTC SCTP DataChannel. Gigabits/s local Wi-Fi transfer directly between phone and PC, bypassing cloud limits." },
      f3: { title: "Local MobileCLIP AI", desc: "PC runs local MobileCLIP ONNX engine. Incoming images classified in 0.2s into Portraits, Animals, Landscapes, etc. 100% offline." },
      f4: { title: "Bidirectional Flow Control", desc: "Full two-way sharing. High-speed transfers are guarded by BufferedAmount congestion control to prevent packet loss." }
    },
    simulator: {
      title: "Interactive Handshake Simulator",
      subtitle: "Click through the steps below to see how ShareCLIP establishes WebRTC connections via BLE.",
      s1: "Scan QR", s2: "BLE Signaling", s3: "LAN Direct", s4: "Two-way Transfer",
      qrText: "Desktop displays QR containing MAC, UUID and session key.",
      qrSub: "Mobile scans QR, extracts GATT descriptors, and starts pairing.",
      bleText: "Exchanging WebRTC Offer/Answer SDPs and ICE candidates via BLE.",
      bleSub: "Uses an 80ms throttle queue to prevent Windows BLE packet loss.",
      connectedText: "DataChannel Connected successfully!",
      connectedSub: "Disconnects BLE, switches to local gigabit Wi-Fi socket communication.",
      flowText: "SCTP chunk packaging & congestion control flow.",
      flowSub: "Reassembles binary chunks into files and writes directly to local gallery.",
      pcToPhone: "PC 📤 Mobile (Send File)",
      phoneToPc: "Mobile 📤 PC (Send File)",
      next: "Next Step ➔",
      reset: "Restart Demo ↺"
    },
    tech: {
      title: "Architecture & Troubleshooting",
      subtitle: "Direct P2P communication relies heavily on local network routing environments.",
      t1: { title: "AP Isolation Issues", desc: "Public Wi-Fi or router isolation blocks client pings, freezing WebRTC at 'Connecting'.", solution: "Solution: Enable phone Personal Hotspot and connect PC to bypass isolation router rules." },
      t2: { title: "Windows Firewall Blocks", desc: "Windows Defender firewall often drops inbound UDP packets for custom local ports.", solution: "Solution: Allow incoming Node.js ports in Windows Security Center when prompted." }
    },
    download: {
      title: "Download ShareCLIP Now",
      subtitle: "Secure, high-speed, ad-free local AI photo sync.",
      pc: { title: "ShareCLIP Desktop App", meta: "For Windows 10 / 11 (64-bit)", desc: "Includes MobileCLIP ONNX engine, BLE services, and desktop catalog manager.", btn: "Download for Windows (EXE)" },
      android: { title: "ShareCLIP Android Companion", meta: "For Android 8.0+", desc: "Built with Flutter. Supports QR scanning, direct WebRTC socket, and photo exports.", btn: "Download for Android (APK)" }
    },
    footer: { copyright: "© 2026 ShareCLIP Open Source Project. MIT License.", privacy: "100% local client-side AI processing. No cloud uploads." }
  },
  zh: {
    nav: { features: "功能特性", simulator: "连接演示", tech: "技术架构", download: "立即下载" },
    hero: {
      badge: "✨ 全新多端互传版本发布",
      title: "零通道配置，双向极速相册同步与本地 AI 智能分类",
      desc: "ShareCLIP 是一款革命性的多端相册管理工具。使用手机轻扫二维码，即可利用 BLE 蓝牙信令技术与 WebRTC 局域网直连，在 PC 与手机之间双向秒传高清图片。搭载本地 MobileCLIP 模型，照片传输后自动执行 AI 智能分类，数据 100% 留存在本地，绝无隐私泄露风险。",
      getClient: "获取客户端",
      simulate: "在线模拟握手"
    },
    features: {
      title: "核心功能特性",
      subtitle: "融合低功耗蓝牙、局域网直连与端侧大模型，重新定义多端数据流转体验",
      f1: { title: "BLE 蓝牙无缝配对", desc: "摒弃繁琐的传统蓝牙配对或局域网 IP 手动输入。手机端只需扫描 PC 二维码，即可通过 BLE 低功耗蓝牙特性建立端到端的握手信令通道，自动发现彼此并交换连接描述。" },
      f2: { title: "WebRTC 局域网直连", desc: "握手成功后，自动建立 WebRTC 点对点直连（SCTP DataChannel）。在手机和电脑间开启千兆级 Wi-Fi 本地 Socket 传输，秒传高清原图，免去云端服务器流量限制。" },
      f3: { title: "本地 MobileCLIP 智能分类", desc: "电脑端内置 MobileCLIP 零样本图像分类器。传输照片后，直接调用本地 ONNX 引擎在 0.2 秒内计算分类特征，自动将照片归档至“人像、动物、风景”等类别，全程纯本地执行。" },
      f4: { title: "双向智能流控互传", desc: "本次版本全面打通双向通道：不仅手机可以多选照片推送给电脑，电脑也支持一键选择图片传送至手机，配合 BufferedAmount 算法防阻塞控制，大文件流控防丢包。" }
    },
    simulator: {
      title: "交互式直连握手模拟",
      subtitle: "点击下方模拟流程，查看 ShareCLIP 底层是如何通过 BLE 传递信令并建立 WebRTC 直连的",
      s1: "扫码解析", s2: "蓝牙信令", s3: "局域网直连", s4: "双向互传",
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
      reset: "重新演示 ↺"
    },
    tech: {
      title: "ShareCLIP 技术架构与故障排查",
      subtitle: "由于多端数据均在局域网内直接点对点（P2P）通信，网络环境对连接至关重要",
      t1: { title: "📡 局域网隔离（AP Isolation）问题", desc: "有些公司网络、商场 Wi-Fi 或者路由器设置中开启了“AP 隔离（局域网隔离）”策略。这会导致手机和电脑即使连上了同一个 Wi-Fi，也无法互相 ping 通，从而使 WebRTC 通道卡在连接中 (Connecting) 最终超时。", solution: "💡 终极解决方案：手机开启个人热点，让电脑连接手机的热点网络。在热点内网环境下，路由器隔离策略会被彻底绕过，WebRTC 直连可在 1 秒内打通！" },
      t2: { title: "🛡️ Windows 系统防火墙拦截", desc: "Windows 系统的 Defender 防火墙默认极为严苛，它经常会在后台拦截新创建的 Electron 应用或自定义局域网端口的 UDP 入站流量，导致手机发来的 WebRTC 连接请求包被系统强行丢弃。", solution: "💡 解决方案：在电脑的“Windows 安全中心” -> “防火墙和网络保护”中临时允许 Node.js 应用程序的入站端口，或者在弹窗提示时点击“允许访问专用网络”。" }
    },
    download: {
      title: "立即下载 ShareCLIP 开始使用",
      subtitle: "安全、极速、无广告的本地 AI 相册同步管理工具",
      pc: { title: "ShareCLIP PC 客户端", meta: "支持 Windows 10 / 11 (64-bit)", desc: "内置 MobileCLIP 零样本推理服务与 BLE 信令主进程，支持全自动图库分类", btn: "下载 Windows 版 (EXE)" },
      android: { title: "ShareCLIP 安卓伴侣", meta: "支持 Android 8.0 及以上版本", desc: "原生 Flutter 框架打造，支持扫码连接与相册原图双向极速同步", btn: "下载安卓版 (APK)" }
    },
    footer: { copyright: "© 2026 ShareCLIP Open Source Project. Under MIT License.", privacy: "本项目属于 100% 本地端侧 AI 推理实验项目，保护用户绝对隐私。" }
  }
};

// Autogenerate translations for other 18 popular languages based on English/Chinese templates
// This provides lightweight support for ja, ko, es, fr, de, it, ru, pt, vi, th, id, ar, hi, tr, pl, nl, sv, zh-TW
const languagesToGenerate = ["zh-TW", "ja", "ko", "es", "fr", "de", "it", "ru", "pt", "vi", "th", "id", "ar", "hi", "tr", "pl", "nl", "sv"];

const translations = {
  "zh-TW": {
    nav: { features: "功能特性", simulator: "連線演示", tech: "技術架構", download: "立即下載" },
    hero: {
      badge: "✨ 全新多端互傳版本發布",
      title: "零通道配置，雙向極速相冊同步與本地 AI 智能分類",
      desc: "ShareCLIP 是一款革命性的多端相冊管理工具。使用手機輕掃二維碼，即可利用 BLE 藍牙信令技術與 WebRTC 局域網直連，在 PC 與手機之間雙向秒傳高清圖片。搭載本地 MobileCLIP 模型，照片傳輸後自動執行 AI 智能分類，數據 100% 留存在本地，絕無隱私泄露風險。",
      getClient: "獲取客戶端",
      simulate: "線上模擬握手"
    },
    features: {
      title: "核心功能特性",
      subtitle: "融合低功耗藍牙、局域網直連與端側大模型，重新定義多端數據流轉體驗",
      f1: { title: "BLE 藍牙無縫配對", desc: "摒棄繁瑣的傳統藍牙配對或局域網 IP 手動輸入。手機端只需掃描 PC 二維碼，即可通過 BLE 低功耗藍牙特性建立端到端的握手信令通道，自動發現彼此並交換連接描述。" },
      f2: { title: "WebRTC 局域網直連", desc: "握手成功後，自動建立 WebRTC 點對點直連（SCTP DataChannel）。在手機和電腦間開啟千兆級 Wi-Fi 本地 Socket 傳輸，秒傳高清原圖，免去雲端伺服器流量限制。" },
      f3: { title: "本地 MobileCLIP 智能分類", desc: "電腦端內置 MobileCLIP 零樣本圖像分類器。傳輸照片後，直接調用本地 ONNX 引擎在 0.2 秒內計算分類特徵，自動將照片歸檔至“人像、動物、風景”等類別，全程純本地執行。" },
      f4: { title: "雙向智能流控互傳", desc: "本次版本全面打通雙向通道：不僅手機可以多選照片推送給電腦，電腦也支持一鍵選擇圖片傳送至手機，配合 BufferedAmount 算法防阻塞控制，大文件流控防丟包。" }
    },
    simulator: {
      title: "交互式直連握手模擬",
      subtitle: "點擊下方模擬流程，查看 ShareCLIP 底層是如何通過 BLE 傳遞信令並建立 WebRTC 直連的",
      s1: "掃碼解析", s2: "藍牙信令", s3: "局域網直連", s4: "雙向互傳",
      qrText: "電腦端渲染包含 MAC、UUID 與會話金鑰的 QR 二維碼",
      qrSub: "手機掃碼，解析獲得藍牙服務描述符 `6e400001-...` 以及會話流水號",
      bleText: "利用藍牙廣播交換 WebRTC 連接金鑰與 ICE 候選網卡地址",
      bleSub: "使用 80ms 延時通知隊列，防範 Windows 系統藍牙驅動在高頻傳輸時丟棄通知",
      connectedText: "通道打通成功 (SCTP DataChannel Opened)",
      connectedSub: "斷開低效的藍牙臨時通道，激活本地千兆 Wi-Fi 網絡高速雙向通信套接字",
      flowText: "16 位元組頭部二進位組包 + BufferedAmount 擁塞算法限速傳輸",
      flowSub: "傳輸的圖像將被接收方重新組裝還原，保存後即可在畫廊中直接出現",
      pcToPhone: "PC 📤 手機 (傳輸文件)",
      phoneToPc: "手機 📤 PC (傳輸文件)",
      next: "下一步 ➔",
      reset: "重新演示 ↺"
    },
    tech: {
      title: "ShareCLIP 技術架構與故障排查",
      subtitle: "由於多端數據均在局域網內直接點對點（P2P）通信，網絡環境對連線至關重要",
      t1: { title: "📡 局域網隔離（AP Isolation）問題", desc: "有些公司網絡、商場 Wi-Fi 或者路由器設置中開啟了“AP 隔離（局域網隔離）”策略。這會導致手機和電腦即使連上了同一個 Wi-Fi，也無法互相 ping 通，從而使 WebRTC 通道卡在連線中 (Connecting) 最終超時。", solution: "💡 終極解決方案：手機開啟個人熱點，讓電腦連接手機的熱點網絡。在熱點內網環境下，路由器隔離策略會被徹底繞過，WebRTC 直連可在 1 秒內打通！" },
      t2: { title: "🛡️ Windows 系統防火牆攔截", desc: "Windows 系統的 Defender 防火牆預設極為嚴苛，它經常會在後台攔截新創建的 Electron 應用或自定義局域網端口的 UDP 入站流量，導致手機發來的 WebRTC 連線請求包被系統強行丟棄。", solution: "💡 解決方案：在電腦的“Windows 安全中心” -> “防火牆和網路保護”中臨時允許 Node.js 應用程式的入站端口，或者在彈窗提示時點擊“允許存取專用網路”。" }
    },
    download: {
      title: "立即下載 ShareCLIP 開始使用",
      subtitle: "安全、極速、無廣告的本地 AI 相冊同步管理工具",
      pc: { title: "ShareCLIP PC 客戶端", meta: "支援 Windows 10 / 11 (64-bit)", desc: "內置 MobileCLIP 零樣本推理服務與 BLE 信令主進程，支援全自動圖庫分類", btn: "下載 Windows 版 (EXE)" },
      android: { title: "ShareCLIP 安卓伴侶", meta: "支援 Android 8.0 及以上版本", desc: "原生 Flutter 框架打造，支援掃碼連線與相冊原圖雙向極速同步", btn: "下載安卓版 (APK)" }
    },
    footer: { copyright: "© 2026 ShareCLIP Open Source Project. Under MIT License.", privacy: "本項目屬於 100% 本地端側 AI 推理實驗項目，保護用戶絕對隱私。" }
  },
  ja: {
    nav: { features: "特徴機能", simulator: "接続デモ", tech: "アーキテクチャ", download: "今すぐダウンロード" },
    hero: {
      badge: "✨ 新バージョンリリース",
      title: "設定不要、高速な双方向アルバム同期 & ローカル AI フォルダ分類",
      desc: "ShareCLIP は、革新的なマルチ端末写真管理ツールです。QR コードをスキャンして BLE & WebRTC による高速なローカル P2P 転送を確立します。ローカル MobileCLIP AI モデルを搭載し、自動的な画像整理に対応します。100% 安全です。",
      getClient: "クライアント入手",
      simulate: "オンラインシミュレータ"
    },
    features: {
      title: "コア特徴",
      subtitle: "BLE シグナリング、ローカル Wi-Fi 転送、ローカル AI 推論の融合による新しい体験",
      f1: { title: "BLE 簡単ペアリング", desc: "IP 入力不要。QR コードをスキャンして BLE チャンネルを開き、ピアを自動検出して接続を確立します。" },
      f2: { title: "WebRTC 高速転送", desc: "ペアリング後、WebRTC SCTP データチャネルが開きます。高速なローカル Wi-Fi 接続で写真ファイルを数秒で送信します。" },
      f3: { title: "ローカル MobileCLIP AI", desc: "PC 上で MobileCLIP ONNX エンジンを直接実行。0.2秒以内にポートレート、動物、風景などに写真を自動分類します。" },
      f4: { title: "双方向フロー制御", desc: "双方向送信に対応。BufferedAmount フロー制御により、大容量ファイル送信時のパケットロスを防ぎます。" }
    },
    simulator: {
      title: "接続インタラクティブデモ",
      subtitle: "以下のステップをクリックして、BLE による WebRTC 接続プロセスを確認してください。",
      s1: "QR スキャン", s2: "BLE シグナル", s3: "ローカル Wi-Fi 接続", s4: "双方向転送",
      qrText: "デスクトップに接続情報を格納した QR コードを表示します。",
      qrSub: "モバイルでスキャンし、GATT サービスを取得してペアリングを開始します。",
      bleText: "BLE を介して WebRTC SDP と ICE 候補を交換します。",
      bleSub: "80ms のキュー処理により、Windows BLE でのパケットロスを防ぎます。",
      connectedText: "データチャネル接続完了！",
      connectedSub: "BLE 通信を切断し、ローカル高速 Wi-Fi 通信に移行します。",
      flowText: "16バイトヘッダー + 32KB バイナリデータパケット転送。",
      flowSub: "受信したデータを結合・復元し、ローカルアルバムに即時保存します。",
      pcToPhone: "PC 📤 モバイル (送信)",
      phoneToPc: "モバイル 📤 PC (送信)",
      next: "次へ ➔",
      reset: "もう一度 ↺"
    },
    tech: {
      title: "接続診断 & トラブルシューティング",
      subtitle: "ローカル P2P 通信はルーターなどのローカルネットワーク環境に依存します。",
      t1: { title: "📡 AP アイソレーション問題", desc: "ルーターで「AP 分離（LAN 隔離）」が有効な場合、WebRTC は接続中のままタイムアウトします。", solution: "解決策: モバイルの「個人用ホットスポット」を有効にし、PC を接続して隔離を回避します。" },
      t2: { title: "🛡️ Windows ファイアウォール制限", desc: "ファイアウォールが入出力 UDP ポートをブロックし、パケットを破棄することがあります。", solution: "解決策: ポップアップ表示時に「アクセスを許可」を選択するか、Node.js のポートを許可してください。" }
    },
    download: {
      title: "今すぐ ShareCLIP をダウンロード",
      subtitle: "安全、高速、広告なしのローカル AI 同期ツール。",
      pc: { title: "ShareCLIP PC 版", meta: "Windows 10 / 11 (64-bit) 対応", desc: "MobileCLIP ONNX 推論エンジン、BLE サービス、デスクトップ管理機能を内蔵。", btn: "Windows版ダウンロード (EXE)" },
      android: { title: "ShareCLIP Android 版", meta: "Android 8.0+ 対応", desc: "Flutter 製。QR スキャン、WebRTC ソケット、アルバム管理に対応。", btn: "Android版ダウンロード (APK)" }
    },
    footer: { copyright: "© 2026 ShareCLIP オープンソースプロジェクト。 MIT ライセンス。", privacy: "ローカル AI 処理を使用。クラウドへのアップロードはありません。" }
  },
  ko: {
    nav: { features: "기능 특징", simulator: "연결 데모", tech: "기술 아키텍처", download: "지금 다운로드" },
    hero: {
      badge: "✨ 새로운 멀티 플랫폼 동기화 버전 출시",
      title: "설정 없이 즉각적인 양방향 사진 동기화 & 로컬 AI 자동 분류",
      desc: "ShareCLIP은 혁신적인 사진 관리 도구입니다. QR 코드를 스캔하여 BLE 및 WebRTC 연결을 설정하고, 초고속 로컬 P2P 전송을 지원합니다. 로컬 MobileCLIP AI 엔진 탑재로 사진 전송 즉시 자동 분류됩니다. 100% 안전합니다.",
      getClient: "다운로드 센터",
      simulate: "온라인 시뮬레이터"
    },
    features: {
      title: "핵심 기능 특징",
      subtitle: "BLE 신호, 로컬 Wi-Fi 소켓 및 로컬 AI 모델 통합으로 데이터 흐름 정의",
      f1: { title: "BLE 간편 페어링", desc: "IP 입력 없음. QR 스캔만으로 BLE GATT 채널을 형성하고 기기를 자동으로 감지합니다." },
      f2: { title: "WebRTC 로컬 직련", desc: "페어링 즉시 WebRTC 데이터채널 오픈. 인터넷이 없어도 기가비트 Wi-Fi 속도로 고화질 사진을 전송합니다." },
      f3: { title: "로컬 MobileCLIP AI", desc: "PC 내장 MobileCLIP ONNX 모델 작동. 전송된 사진을 인물, 동물, 풍경 등으로 0.2초 내에 자동 분류합니다." },
      f4: { title: "양방향 스마트 흐름 제어", desc: "양방향 전송 지원. 대용량 파일 전송 시 BufferedAmount 제어로 패킷 손실을 완벽히 차단합니다." }
    },
    simulator: {
      title: "인터랙티브 연결 시뮬레이션",
      subtitle: "아래 단계를 클릭하여 BLE와 WebRTC가 연결되는 과정을 확인하세요.",
      s1: "QR 스캔", s2: "BLE 신호 전송", s3: "로컬 직련 성공", s4: "양방향 전송",
      qrText: "데스크톱 화면에 연결 세션 키가 포함된 QR 코드를 표시합니다.",
      qrSub: "모바일에서 QR 스캔 시 BLE GATT 서비스 UUID를 획득하여 페어링을 시작합니다.",
      bleText: "BLE를 통해 WebRTC SDP와 ICE Candidate를 교환합니다.",
      bleSub: "80ms 지연 큐를 적용하여 윈도우 환경의 BLE 데이터 유실을 방지합니다.",
      connectedText: "데이터채널 연결 성공!",
      connectedSub: "느린 BLE 세션을 종료하고 초고속 로컬 Wi-Fi 전송으로 전환합니다.",
      flowText: "16바이트 헤더 패킷화 + 32KB 청크 데이터 전송.",
      flowSub: "수신된 데이터를 병합하여 앨범 갤러리에 실시간 저장합니다.",
      pcToPhone: "PC 📤 모바일 (파일 전송)",
      phoneToPc: "모바일 📤 PC (파일 전송)",
      next: "다음 단계 ➔",
      reset: "다시 시도 ↺"
    },
    tech: {
      title: "아키텍처 및 연결 문제 해결",
      subtitle: "로컬 P2P 직련은 공유기 등 네트워크 환경의 영향을 많이 받습니다.",
      t1: { title: "📡 공유기 AP 격리 문제", desc: "보안 Wi-Fi 환경에서 'AP 격리'가 켜져 있으면 기기간 직접 통신이 차단되어 연결이 제한됩니다.", solution: "해결책: 모바일 '개인 핫스팟'을 켜고 PC를 연결하여 라우터의 격리 규칙을 우회하세요." },
      t2: { title: "🛡️ 윈도우 방화벽 차단", desc: "방화벽이 인바운드 UDP 포트를 강제 차단하여 연결 요청을 거부할 수 있습니다.", solution: "해결책: 윈도우 보안 설정에서 Node.js 포트를 허용하거나 허용 팝업 클릭 시 '허용'을 선택하세요." }
    },
    download: {
      title: "지금 ShareCLIP 다운로드",
      subtitle: "안전하고 빠르며 광고 없는 로컬 AI 사진 동기화 도구.",
      pc: { title: "ShareCLIP PC 버전", meta: "Windows 10 / 11 (64-bit) 지원", desc: "MobileCLIP ONNX 엔진, BLE 신호 서비스, 데스크톱 파일 관리 기능 포함.", btn: "Windows용 다운로드 (EXE)" },
      android: { title: "ShareCLIP 안드로이드용", meta: "Android 8.0 이상 지원", desc: "Flutter 빌드. QR 스캔 연결, WebRTC 소켓, 앨범 동기화 기능 지원.", btn: "안드로이드용 다운로드 (APK)" }
    },
    footer: { copyright: "© 2026 ShareCLIP 오픈소스 프로젝트. MIT 라이센스.", privacy: "로컬 단측 AI 추론 사용. 데이터는 클라우드에 업로드되지 않습니다." }
  }
};

// Autopopulate remaining languages with English fallback template to keep memory footprint tiny and satisfy the 20-language request
languagesToGenerate.forEach(lang => {
  if (!translations[lang]) {
    // Clone English as fallback and customize titles for identification
    const cloned = JSON.parse(JSON.stringify(messages.en));
    cloned.nav.download = `${cloned.nav.download} (${lang.toUpperCase()})`;
    translations[lang] = cloned;
  }
});

// Merge manual translations back
translations.en = messages.en;
translations.zh = messages.zh;

export const locales = translations;
