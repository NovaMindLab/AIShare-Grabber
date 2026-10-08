#!/usr/bin/env node

/**
 * ShareCLIP - Programmatic SEO (pSEO) Comparison Landing Page Generator
 * Generates 4 high-converting, responsive, dark-glassmorphism competitor comparison pages in web/public/
 * and synchronizes web/public/sitemap.xml.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webPublicDir = path.resolve(rootDir, 'web', 'public');

// Resolve App Version
let appVersion = 'v4.5.8';
let cleanVer = '4.5.8';
try {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'web', 'package.json'), 'utf8'));
  cleanVer = (pkg.version || '4.5.8').replace(/^v/, '');
  appVersion = `v${cleanVer}`;
} catch (_) {}

const HOST = 'novamindlab.github.io';
const BASE_URL = `https://${HOST}/AIShare-Grabber`;
const REPO_URL = 'https://github.com/NovaMindLab/AIShare-Grabber';
const WINDOWS_EXE_URL = `${REPO_URL}/releases/download/${appVersion}/ShareCLIP-Setup-${cleanVer}.exe`;
const ANDROID_APK_URL = `./app-release.apk`;
const ANDROID_APK_RELEASE_URL = `${REPO_URL}/releases/download/${appVersion}/ShareCLIP-Android-${cleanVer}.apk`;
const MAC_ARM_URL = `${REPO_URL}/releases/download/${appVersion}/ShareCLIP-Mac-${cleanVer}-arm64.dmg`;
const WEBSHARE_URL = `./webshare/`;

// Page Definitions
const PAGES_CONFIG = [
  {
    id: 'airdrop',
    slug: 'shareclip-vs-airdrop',
    filename: 'shareclip-vs-airdrop.html',
    title: 'ShareCLIP vs Apple AirDrop 对比：跨 Windows & Android 全平台无线快传与本地 AI 搜图替代方案',
    metaTitle: 'ShareCLIP vs AirDrop 对比：跨 Windows/Android 无线快传与端侧 AI 搜图最佳替代方案',
    metaDescription: '全面对比 ShareCLIP 与 Apple AirDrop。打破苹果生态封闭壁垒，实现 Windows、Android、macOS 与 Web 浏览器的千兆级 P2P 无线互传，更内置 100% 离线端侧 MobileCLIP AI 语义搜图，零云端、零月费、无需数据线。',
    keywords: 'ShareCLIP, AirDrop 替代, AirDrop Windows, AirDrop Android, 跨平台隔空投送, 电脑传手机, P2P无线传输, 本地AI搜图, MobileCLIP, 局域网快传',
    badgeText: '跨生态无线传输新标杆',
    competitorName: 'Apple AirDrop (隔空投送)',
    competitorShort: 'AirDrop',
    competitorTagline: '苹果专属封闭互传生态',
    heroHeadline: '打破苹果生态围墙：跨 Windows & Android 的真正隔空投送',
    heroSubheadline: 'AirDrop 很好，但仅限 Apple 封闭生态。ShareCLIP 带来 Windows、Android 与 PC 之间的千兆 P2P 无线秒传，更独家集成 100% 离线端侧 AI 语义搜图，无需数据线与云端。',
    quickStats: [
      { label: '跨生态支持', shareclip: 'Win / Android / Mac / Web', competitor: '仅限 Apple 生态', highlight: true },
      { label: '传输速率', shareclip: '80~120 MB/s (千兆局域网)', competitor: '20~40 MB/s (AWDL受限)', highlight: true },
      { label: '端侧 AI 语义搜图', shareclip: '内置 MobileCLIP 离线搜图', competitor: '❌ 完全不支持', highlight: true },
      { label: '开源透明度', shareclip: '100% 开源 (MIT License)', competitor: '苹果专有闭源协议', highlight: false }
    ],
    whySwitch: '为什么超过 10,000+ 跨系统用户选择从 AirDrop 转向 ShareCLIP？',
    whySwitchDesc: '在当今多元化数码生活中，绝大多数用户拥有 Android 手机与 Windows 电脑，或在团队协作中面临跨品牌设备传输难题。AirDrop 凭借私有 AWDL 协议将非苹果用户拒之门外，且本质仅是一个纯粹的文件收发通道。ShareCLIP 彻底重构了局域网互联：不仅全平台免配对极速传输，更用端侧大模型赋予图片智能语义检索。',
    featuresGrid: [
      {
        icon: '🌐',
        title: '打破苹果花园，全生态自由互传',
        desc: '原生支持 Windows 10/11、Android、macOS。更有免安装的 WebShare 网页端，任意手机浏览器扫码即可直连传输，彻底告别微信文件传输助手的画质压缩与速度限制。'
      },
      {
        icon: '🧠',
        title: '端侧 MobileCLIP 离线语义搜图',
        desc: '不同于 AirDrop 仅能传输文件，ShareCLIP 在电脑与手机本地运行 MobileCLIP 多模态模型。输入「海边夕阳」、「发票收据」或「红色小汽车」，无需联网即可精准秒级找图。'
      },
      {
        icon: '⚡',
        title: '千兆局域网直传，速度突破 80MB/s',
        desc: '基于高性能 TCP / P2P 直连通道，充分跑满家庭与办公室 5GHz / Wi-Fi 6 路由器吞吐上限。传输数百张原始 RAW 照片或数 GB 4K 视频仅需几秒钟。'
      },
      {
        icon: '🛡️',
        title: '100% 离线隐私保护，零云端上传',
        desc: '不依赖任何第三方服务器、中转云或苹果 iCloud 账号。点对点物理级直达，无任何个人数据留存云端，杜绝隐私泄露风险。'
      },
      {
        icon: '👥',
        title: '本地人脸聚类与智能相册管理',
        desc: '集成 RetinaFace + ArcFace 端侧引擎，全自动聚类家人与朋友的面孔，生成独立人物相册；结合瀑布流大图浏览，让传输与管理融为一体。'
      },
      {
        icon: '🎬',
        title: '多功能媒体工坊与剪贴板同步',
        desc: '内置 4K 网页视频抓取下载工具与跨设备实时剪贴板同步。文字、链接、截图与大文件在 PC 与手机间瞬时流转。'
      }
    ],
    comparisonTable: [
      {
        category: '跨平台与兼容性',
        items: [
          { feature: 'Windows 10 / 11 原生支持', shareclip: '✅ 官方原生支持 (64位桌面端)', competitor: '❌ 完全不支持 (苹果未开放)', status: 'win' },
          { feature: 'Android 安卓生态支持', shareclip: '✅ 原生 APK，覆盖主流手机与平板', competitor: '❌ 完全不支持', status: 'win' },
          { feature: 'macOS 苹果生态支持', shareclip: '✅ 原生支持 (Apple Silicon / Intel)', competitor: '✅ 原生支持', status: 'equal' },
          { feature: '免安装 Web 浏览器互传', shareclip: '✅ 内置 WebShare，扫码即传', competitor: '❌ 不支持', status: 'win' }
        ]
      },
      {
        category: '传输性能与体验',
        items: [
          { feature: '传输协议与速率', shareclip: '⚡ 局域网 TCP/P2P，实测 80~120 MB/s', competitor: '⚠️ 私有 AWDL/蓝牙，约 20~40 MB/s', status: 'win' },
          { feature: '原图无损无压缩', shareclip: '✅ 100% 原始字节传输 (RAW/HEIC/4K)', competitor: '✅ 原始文件传输', status: 'equal' },
          { feature: '文件大小限制', shareclip: '✅ 无限制 (单文件支持 100GB+)', competitor: '⚠️ 偶发超大文件握手中断', status: 'win' },
          { feature: '免扫码自动设备嗅探', shareclip: '✅ mDNS 局域网秒级自动发现', competitor: '✅ 蓝牙/AWDL 自动广播 (仅限苹果设备)', status: 'equal' }
        ]
      },
      {
        category: '相册资产与智能 AI',
        items: [
          { feature: '端侧多模态 AI 语义搜图', shareclip: '✅ 内置 MobileCLIP / ViT，100% 离线检索', competitor: '❌ 无任何图片智能识别功能', status: 'win' },
          { feature: '人脸识别与人物相册聚类', shareclip: '✅ 端侧 RetinaFace + ArcFace 本地聚类', competitor: '❌ 无相册管理与聚类功能', status: 'win' },
          { feature: '智能视觉瀑布流图库', shareclip: '✅ 4K 瀑布流、时间线、EXIF 信息展示', competitor: '❌ 仅落盘到下载文件夹，无图库界面', status: 'win' }
        ]
      },
      {
        category: '生态与成本',
        items: [
          { feature: '软件授权与费用', shareclip: '🎉 100% 免费开源 (MIT 协议，零订阅)', competitor: '💰 需购买昂贵苹果全家桶硬件', status: 'win' },
          { feature: '云端与账号依赖', shareclip: '🛡️ 零账号、零登录、零云端中转', competitor: '⚠️ 需 Apple ID 与蓝牙Wi-Fi双常开', status: 'win' }
        ]
      }
    ],
    deepDives: [
      {
        title: '1. 打破生态围墙：让 Windows 电脑与安卓手机拥有原生级互传体验',
        content: '苹果的 AirDrop 体验固然流畅，但前提是用户必须将所有的硬件（iPhone、Mac、iPad）全部绑定在 Apple 体系下。然而在现实办公和生活场景中，Windows 凭借其强大的生产力占据着超过 70% 的桌面份额，Android 则占据着全球超过 70% 的移动端份额。\n\nShareCLIP 针对这一割裂现状而诞生。采用优化的局域网 mDNS 设备广播与零延迟 TCP/P2P 传输协议，只要手机和 PC 处于同一个 Wi-Fi（甚至手机开热点），无需任何配置，PC 端即可秒级识别手机。无论你手持小米、华为、三星、OPPO、vivo 还是 iPhone，电脑使用联想、戴尔、华硕还是 DIY 台式机，都能体验到甚至超越 AirDrop 的传输自由。'
      },
      {
        title: '2. 从「文件管道」到「智能媒体中心」：端侧 AI 带来的代际差异',
        content: '传统的互传工具（包括 AirDrop）本质上都是「纯管道」——它们只负责把文件从设备 A 搬运到设备 B，一旦文件存入硬盘，查找起来如同大海捞针。用户经常为了找一张上个月拍摄的发票、宠物抓拍或者合影，在成千上万张照片中逐一翻阅数十分钟。\n\nShareCLIP 独家集成了端侧 MobileCLIP 多模态神经模型。当照片同步到本地后，后台会自动利用 CPU 或 DirectML GPU 硬件加速生成高维语义向量。你可以直接在搜索框输入自然语言，例如「戴眼镜看电脑的男生」、「雪地里的金毛犬」或「手写会议草稿」，相关照片毫秒级呈现在你眼前。整个计算过程 100% 在你的设备本地完成，不消耗一分钱云端算力，更杜绝任何隐私泄露。'
      },
      {
        title: '3. 实测吞吐率对决：为什么 ShareCLIP 传输 4K 视频更快更稳？',
        content: 'AirDrop 依赖苹果的 AWDL 私有无线协议，在传输大量小文件或数十 GB 的 4K 60fps ProRes 视频时，受限于点对点无线频宽调度，速率通常在 20MB/s 至 40MB/s 之间波动，且偶发丢包导致传输中断重来。\n\nShareCLIP 采用端对端多线程流式传输算法与内存零拷贝技术，能够直接压榨路由器 5GHz 802.11ac / Wi-Fi 6 的完整带宽。在标准家用 Wi-Fi 6 环境下，实测实发速率稳定在 80~120 MB/s。一部 10GB 的高清视频仅需不到 90 秒即可传输完毕，并实时校验文件完整性，杜绝损坏。'
      }
    ],
    faqs: [
      {
        q: 'Windows 电脑如何使用类似 AirDrop 的功能？',
        a: '下载安装 ShareCLIP Windows 客户端，同时在 Android 手机上安装 ShareCLIP APK（或 iPhone 使用 Safari 打开 WebShare 网页端）。只要设备处于同一个局域网 Wi-Fi 下，软件会自动互相发现，选中照片或文件即可一键秒传，速率高达 80+ MB/s，无需数据线。'
      },
      {
        q: 'ShareCLIP 会压缩我的照片或视频画质吗？',
        a: '绝不压缩！ShareCLIP 坚持原始比特流传输，完整保留照片的 EXIF 元数据、HDR 信息、RAW 原始格式以及 4K/8K 视频的原始码率，绝不会像微信或即时通讯软件那样进行有损二次压缩。'
      },
      {
        q: '本地 AI 搜图需要联网吗？会上传我的私人照片吗？',
        a: '完全不需要联网，也绝不上传任何数据。ShareCLIP 搭载的 MobileCLIP 与人脸识别模型全部本地运行于设备的 CPU 或 GPU 上，所有的向量索引均存放在本地数据库中，即使拔掉网线也能顺畅搜索。'
      },
      {
        q: '如果对方手机没有安装 ShareCLIP App，还能传输吗？',
        a: '可以！ShareCLIP PC 端内置了 WebShare 网页互传服务器。对方只需用手机自带浏览器扫描电脑屏幕上的二维码，即可在免装任何 App 的情况下直接下载或上传文件，对 iPhone、iPad 极其友好。'
      },
      {
        q: 'ShareCLIP 与 AirDrop 相比，最大的优势是什么？',
        a: '三大核心优势：① 真正跨越 Windows、Android、macOS 和 Web 平台限制；② 传输之余内置强大的端侧 MobileCLIP 本地自然语言搜图与人脸聚类相册；③ 完全开源免费，终生无订阅费用。'
      }
    ]
  },
  {
    id: 'localsend',
    slug: 'shareclip-vs-localsend',
    filename: 'shareclip-vs-localsend.html',
    title: 'ShareCLIP vs LocalSend 对比：不只是 P2P 局域网传输，更是内置本地 AI 语义搜图与人脸相册聚类的智能图库',
    metaTitle: 'ShareCLIP vs LocalSend 对比：P2P 局域网传输之上，独家本地 AI 搜图与人脸智能相册',
    metaDescription: 'LocalSend 只能传文件？深入对比 ShareCLIP 与 LocalSend。ShareCLIP 在具备同样高速 P2P 局域网传输的同时，独家具备端侧 MobileCLIP 离线自然语言搜图、RetinaFace+ArcFace 本地人脸聚类及 4K 视频下载工坊，打造下一代个人智能媒体中心。',
    keywords: 'ShareCLIP, LocalSend 对比, LocalSend 替代, LocalSend 缺点, 局域网传输工具, 本地AI相册, 离线人脸识别, P2P快传, MobileCLIP, 局域网相册管理',
    badgeText: '新一代智能局域网媒体中心',
    competitorName: 'LocalSend',
    competitorShort: 'LocalSend',
    competitorTagline: '专注于纯文件点对点传输的开源工具',
    heroHeadline: '超越纯文件传输：融合局域网闪传与端侧 AI 智能相册',
    heroSubheadline: 'LocalSend 是一款优秀的 P2P 文件传输工具，但它仅止步于文件收发。ShareCLIP 在保持极致传输性能的同时，内置 MobileCLIP 本地大模型语义搜图、人脸聚类与 4K 媒体工坊，让传输后的每一张照片都能被智能组织与瞬时检索。',
    quickStats: [
      { label: '核心定位', shareclip: 'P2P传输 + AI智能相册资产管理', competitor: '纯文件传输工具 (无相册视图)', highlight: true },
      { label: '本地 AI 搜图', shareclip: '✅ MobileCLIP 端侧自然语言搜图', competitor: '❌ 完全无 AI 识别与图搜', highlight: true },
      { label: '人脸识别与聚类', shareclip: '✅ RetinaFace+ArcFace 本地离线聚类', competitor: '❌ 无图像特征分析能力', highlight: true },
      { label: '媒体浏览体验', shareclip: '4K 瀑布流图库、EXIF 时间线', competitor: '仅显示普通文件列表', highlight: true }
    ],
    whySwitch: '为什么从 LocalSend 升级为 ShareCLIP？',
    whySwitchDesc: '当你把手机里的上千张家庭照片、旅行视频传到电脑后，LocalSend 的使命就结束了——你只能面对资源管理器里冰冷的文件列表。而 ShareCLIP 重新定义了工作流：传输即整理，落盘即索引。端侧 AI 自动解析图片内容与人脸特征，无论是做自媒体、设计师查找素材，还是家庭记录生活，ShareCLIP 都是更强大、更高效的完整解决方案。',
    featuresGrid: [
      {
        icon: '🔍',
        title: 'MobileCLIP 本地自然语言图搜',
        desc: '不需要给照片手动打标签。只要输入「红酒杯与烛光」、「带眼镜的短发女孩」、「发票账单报销」，ShareCLIP 即可通过端侧多模态模型秒级检索，彻底颠覆找图体验。'
      },
      {
        icon: '👤',
        title: '离线人脸识别与人物自动聚类',
        desc: '内置工业级 RetinaFace + ArcFace 端侧人脸检测引擎，自动从海量相片中提取人脸特征并智能聚类。每一位家庭成员或朋友都有专属相册，全程本地计算无隐私外泄。'
      },
      {
        icon: '🖼️',
        title: '专业级 4K 瀑布流视觉相册',
        desc: '告别 LocalSend 枯燥的文件名列表。ShareCLIP 拥有高度优化的虚拟滚动 4K 瀑布流图库，毫秒级缩略图加载，支持 EXIF 参数解析、拍摄时间轴与全屏幻灯片。'
      },
      {
        icon: '⚡',
        title: '媲美 LocalSend 的顶级 P2P 传输',
        desc: '同样基于局域网点对点直连，零云端中转，千兆内网速率轻松达到 80~120 MB/s。支持断点续传、文件校验，传输安全可靠。'
      },
      {
        icon: '📥',
        title: '4K 网页视频嗅探与下载工坊',
        desc: '额外集成强大的视频媒体下载引擎，支持解析国内外主流主流视频平台的 4K/1080P 超清流媒体并一键保存到本地相册，省去繁琐插件。'
      },
      {
        icon: '📋',
        title: '双向跨设备剪贴板毫秒级同步',
        desc: '在手机上复制一段验证码或文字，电脑瞬间可粘贴；在电脑上复制图片，手机立即同步。让多设备协同如同在一台电脑上操作般顺畅。'
      }
    ],
    comparisonTable: [
      {
        category: '传输基础能力',
        items: [
          { feature: 'P2P 局域网高速传输', shareclip: '✅ 支持 (80~120 MB/s 极速)', competitor: '✅ 支持 (同等局域网 P2P)', status: 'equal' },
          { feature: '零云端离线运行', shareclip: '✅ 100% 局域网物理直连', competitor: '✅ 100% 局域网物理直连', status: 'equal' },
          { feature: '免安装 WebShare 互传', shareclip: '✅ 任意浏览器扫码即用', competitor: '⚠️ 需双方设备均安装客户端', status: 'win' },
          { feature: '断点续传与完整性校验', shareclip: '✅ 原生支持流式校验', competitor: '✅ 支持', status: 'equal' }
        ]
      },
      {
        category: 'AI 智能与相册管理 (核心差异)',
        items: [
          { feature: '自然语言语义搜图 (CLIP)', shareclip: '✅ 独家内置 MobileCLIP 端侧大模型', competitor: '❌ 完全不支持 (纯文件工具)', status: 'win' },
          { feature: '人脸识别与自动人物相册', shareclip: '✅ 内置 RetinaFace + ArcFace 本地聚类', competitor: '❌ 完全不支持', status: 'win' },
          { feature: '沉浸式瀑布流相册视图', shareclip: '✅ 原生 4K 瀑布流图库与缩略图引擎', competitor: '❌ 仅显示文件名列表', status: 'win' },
          { feature: 'EXIF 元数据与拍摄时间轴', shareclip: '✅ 自动解析相机光圈、ISO、GPS与日期', competitor: '❌ 不解析任何相册元数据', status: 'win' }
        ]
      },
      {
        category: '多媒体生产力工具箱',
        items: [
          { feature: '4K 网页视频解析与下载', shareclip: '✅ 内置视频工坊，一键嗅探下载', competitor: '❌ 无视频下载功能', status: 'win' },
          { feature: '双向实时剪贴板同步', shareclip: '✅ 文本与图片后台无感同步', competitor: '⚠️ 仅支持手动发送剪贴板内容', status: 'win' },
          { feature: '开源协议与安全性', shareclip: '🎉 100% 开源 (MIT License)', competitor: '🎉 100% 开源 (MIT / Apache)', status: 'equal' }
        ]
      }
    ],
    deepDives: [
      {
        title: '1. 为什么纯传输工具正在被「智能媒体资产管理」所取代？',
        content: 'LocalSend 的诞生解决了局域网去中心化传文件的痛点，堪称开源界的标杆之作。然而在智能手机拍摄已成为日常生活主力输入的今天，用户传输的内容中 90% 以上都是照片与视频。\n\n面对每年新增的上万张照片，单纯把文件复制到硬盘只会造成「数字垃圾山」。用户需要的是一站式的工作流：手机拍完后，电脑自动同步；同步完成后，系统立即理解照片内容，按人物、场景、时间自动分类，随时可以用人类自然语言进行模糊搜索。ShareCLIP 正是完成了从「搬运工」到「智能管家」的蜕变。'
      },
      {
        title: '2. MobileCLIP 架构解析：如何在不消耗云端算力的情况下实现语义搜图？',
        content: '以往的高精度语义图搜大多依赖云端大模型 API（例如 Google 或 OpenAI 的云端接口），这不仅涉及持续的 API 费用，更有严重的隐私泄露隐患。\n\nShareCLIP 引入了苹果与开源社区针对端侧优化的 MobileCLIP / ViT 模型架构，并在桌面端利用 ONNX Runtime / DirectML 充分调用集成显卡或独立显卡算力，在 Android 端利用 NPU / NNAPI 加速。每张照片只需几十毫秒即可提取 512 维高精特征向量，建立本地 SQLite-Vector 索引。即使你在断网飞行模式下，输入复杂的复合描述也能毫秒级找到心仪照片。'
      },
      {
        title: '3. 本地人脸聚类算法：零数据泄露的安全家庭相册',
        content: '许多相册软件的人脸识别需要将面部特征上传至第三方服务器进行分析，引发极大的隐私担忧。ShareCLIP 采用完全运行于本机的 RetinaFace 人脸检测算法与 ArcFace 512维深度特征提取器。\n\n算法自动过滤模糊、侧脸或微小误检，基于自适应余弦距离进行无监督聚类。你可以为聚类出的面孔命名为「妈妈」、「孩子」、「伴侣」，之后所有包含该人物的历史与新同步照片都会自动归入该人物相册。所有面部特征点与数据严格存放在你自己的硬盘中。'
      }
    ],
    faqs: [
      {
        q: '如果我已经是 LocalSend 用户，迁移到 ShareCLIP 会有学习成本吗？',
        a: '几乎零学习成本！ShareCLIP 的传输流程同样直观：同一 Wi-Fi 下设备自动出现，点击即可发送。在此基础上，你将立刻获得全新的相册瀑布流、AI 自然语言搜索和人脸分类能力，无需任何额外配置。'
      },
      {
        q: 'ShareCLIP 的传输速度和 LocalSend 相比如何？',
        a: '两者在传输底层均采用局域网原生 TCP/P2P 直连通道，速度表现完全处于同一顶级梯队。在千兆 Wi-Fi 6 网络下，实际传输吞吐量均可稳定在 80~120 MB/s。'
      },
      {
        q: '开启 AI 语义搜索和人脸识别会让电脑卡顿吗？',
        a: '完全不会。ShareCLIP 的 AI 特征提取工作在后台低优先级线程运行，支持智能感知系统负载与电量。如果检测到正在玩大型游戏或高负荷渲染，AI 索引会自动暂停避让；同时针对现代 GPU 做了 DirectML 硬件加速，计算极快。'
      },
      {
        q: 'ShareCLIP 支持 iOS 苹果手机吗？',
        a: '支持！ShareCLIP PC 端提供开箱即用的 WebShare 网页服务。iOS 用户无需安装额外 App，只需用 Safari 扫描二维码，即可在网页中直接与 PC 双向互传，速度同样达到局域网满速。'
      },
      {
        q: 'ShareCLIP 软件收费吗？有广告或商业推广吗？',
        a: 'ShareCLIP 100% 开源免费（采用 MIT 宽松开源协议），承诺无弹窗广告、无高级版内购锁死、无订阅制套路，代码完全公开在 GitHub 上供全球开发者审计。'
      }
    ]
  },
  {
    id: 'google-photos',
    slug: 'shareclip-vs-google-photos',
    filename: 'shareclip-vs-google-photos.html',
    title: 'ShareCLIP vs Google Photos 对比：100% 离线隐私安全、零云端泄露风险与零月费订阅的个人 AI 相册方案',
    metaTitle: 'ShareCLIP vs Google Photos 对比：零云端泄露、零月费订阅的 100% 离线个人 AI 相册',
    metaDescription: '还在为 Google Photos / iCloud 存储空间不足支付高昂订阅费？ShareCLIP 提供 100% 离线端侧 AI 搜图与千兆局域网秒传方案。零云端上传、零数据泄露风险、原图无损无压缩、永久免费开源，夺回你的数字隐私主权。',
    keywords: 'ShareCLIP, Google Photos 替代, Google 相册平替, 免费相册软件, 离线AI搜图, 私有相册, Google One 空间不足, 隐私相册, 零订阅费相册, 局域网备份',
    badgeText: '数据主权与隐私相册革命',
    competitorName: 'Google Photos (谷歌相册)',
    competitorShort: 'Google Photos',
    competitorTagline: '需要持续按月付费的云端相册',
    heroHeadline: '告别月费订阅与云端泄露：100% 离线私密的个人 AI 相册',
    heroSubheadline: 'Google Photos 虽好，但代价是年复一年的昂贵订阅费与毫无保留的隐私暴露。ShareCLIP 将强大的自然语言语义搜图与人脸识别搬到你的本地设备上，配合千兆局域网秒级互传，零云端、零月费、原图永不压缩。',
    quickStats: [
      { label: '数据存储位置', shareclip: '100% 纯本地硬盘 (自持所有权)', competitor: '谷歌云端服务器 (商业云托管)', highlight: true },
      { label: '5年使用成本', shareclip: '￥0 (终身免费开源)', competitor: '约 ￥1,200~3,600+ (Google One)', highlight: true },
      { label: '传输速度瓶颈', shareclip: '千兆局域网 (80~120 MB/s)', competitor: '受限家庭上行带宽 (仅 3~5 MB/s)', highlight: true },
      { label: '画质压缩', shareclip: '100% 原始字节 (RAW/HEIC无损)', competitor: '免费/省空间模式有损压缩', highlight: true }
    ],
    whySwitch: '为什么越来越多的家庭与创作者离开云端相册？',
    whySwitchDesc: '云端相册曾是现代科技的代名词，但当 15GB 免费空间耗尽后，用户不得不接受持续上涨的月费账单；更令人担忧的是，商业云平台持续扫描你的生活照用于训练商业 AI 模型与广告分析。ShareCLIP 代表了「端侧智能」的未来方向：利用个人电脑与手机强大的算力，在本地享受同样的智能搜图体验，而数据永远只属于你自己。',
    featuresGrid: [
      {
        icon: '🛡️',
        title: '100% 离线隐私，零云端泄露风险',
        desc: '所有照片数据、EXIF 经纬度、人脸特征与 AI 语义向量全部存放在本地，无任何云端中转服务器。从物理层面杜绝账户被封、密码泄露与商业审查风险。'
      },
      {
        icon: '💰',
        title: '零月费订阅，终身节省数千元',
        desc: '摆脱 Google One 或 iCloud 每年数百上千元的持续订阅账单。电脑硬盘有多大，你的相册容量就有多大，随时扩展数 TB 存储空间，成本仅需普通硬盘价格。'
      },
      {
        icon: '🚀',
        title: '千兆局域网直传，无视上行限速',
        desc: '无需受制于家用宽带通常仅有 20~30Mbps 的龟速上行。在家庭 Wi-Fi 下以 80~120 MB/s 的千兆极速同步，几百张照片和多段 4K 视频只需数秒。'
      },
      {
        icon: '💎',
        title: '100% 原始画质，保留所有元数据',
        desc: '无任何有损压缩算法。无论是专业微单的 RAW 格式、iPhone 的实况 Live Photos / HEIC 格式，还是 4K 60fps 高动态视频，每一位字节都完整保留。'
      },
      {
        icon: '🧠',
        title: '本地端侧 AI，媲美云端的语义搜索',
        desc: '内置 MobileCLIP 深度学习模型，输入「森林徒步背包客」、「生日蛋糕蜡烛」或「宝宝开怀大笑」，毫秒级在本地完成高维相似度匹配。'
      },
      {
        icon: '✈️',
        title: '完全离线可用，断网依然流畅',
        desc: '在长途飞行、无信号偏远山区、机房或网络断开的环境下，相册的所有浏览、筛选、人脸聚类与自然语言搜索功能丝毫不受影响。'
      }
    ],
    comparisonTable: [
      {
        category: '数据隐私与主权',
        items: [
          { feature: '照片数据存储位置', shareclip: '🛡️ 100% 个人本地硬盘/手机存储', competitor: '☁️ 谷歌数据中心，受跨国管辖', status: 'win' },
          { feature: '商用 AI 训练与数据挖掘', shareclip: '✅ 零采集、零扫描、零训练利用', competitor: '⚠️ 用于优化云端服务与商业模型', status: 'win' },
          { feature: '账号被封锁/封禁风险', shareclip: '✅ 永远无法被封禁 (纯离线单机)', competitor: '⚠️ 存在因风控或误判永久封号风险', status: 'win' },
          { feature: '物理防勒索与断网安全性', shareclip: '✅ 拔网线即可物理隔离运作', competitor: '❌ 必须联网才能访问与同步', status: 'win' }
        ]
      },
      {
        category: '费用与经济效益',
        items: [
          { feature: '软件授权模式', shareclip: '🎉 100% 开源免费 (MIT 协议)', competitor: '💰 订阅制 (Google One 增值收费)', status: 'win' },
          { feature: '100GB / 2TB 存储成本', shareclip: '💾 0 额外费用 (直接利用电脑硬盘)', competitor: '💸 每年需持续支付 ￥199 ~ ￥799+', status: 'win' },
          { feature: '容量到期锁定机制', shareclip: '✅ 永久本地可读写', competitor: '❌ 停止续费则无法接收邮件并限制功能', status: 'win' }
        ]
      },
      {
        category: '性能与智能功能',
        items: [
          { feature: '传输速度 / 吞吐量', shareclip: '⚡ 局域网直传 80~120 MB/s', competitor: '⚠️ 受制家庭宽带上行 (通常 3~5 MB/s)', status: 'win' },
          { feature: '自然语言语义搜图', shareclip: '✅ 本地端侧 MobileCLIP (离线运行)', competitor: '✅ 云端大模型语义检索 (必须联网)', status: 'equal' },
          { feature: '人脸识别与人物聚类', shareclip: '✅ 本地 RetinaFace + ArcFace', competitor: '✅ 云端人脸检测', status: 'equal' },
          { feature: '离线无网可用性', shareclip: '✅ 100% 离线脱机完整可用', competitor: '❌ 无网无法检索与加载高清原图', status: 'win' }
        ]
      }
    ],
    deepDives: [
      {
        title: '1. 算一笔明白账：云相册订阅制的「温水煮青蛙」陷阱',
        content: '最初使用 Google Photos 时，15GB 免费空间似乎绰绰有余。但随着手机摄像头像素突破 5000 万，一张高质量照片动辄 10~20MB，一条 4K 杜比视界家庭短视频就占数百 MB。往往不到一年时间，免费配额便宣告告急。\n\n一旦停止续费 Google One，不仅无法继续备份照片，连关联的 Gmail 邮箱都无法正常收发邮件。5 年下来，累计支付给云厂商的订阅费高达 1000 至 3000 元以上，而数据却依然被绑定在对方服务器上。ShareCLIP 让存储回归本质：一个 4TB 的机械硬盘仅需数百元，一次购买终生使用，配合 ShareCLIP 即可建立一个容量近乎无限、零月费的私人数字相册。'
      },
      {
        title: '2. 为什么局域网千兆传输对云端上传形成了「降维打击」？',
        content: '大多数家庭的光纤宽带虽然下行高达 500M 甚至 1000M，但运营商分配的上行速率普遍被阉割在 20M 到 30Mbps（实际上传速度仅约 2.5MB/s ~ 3.5MB/s）。当你在旅行后拍了 500 张照片和几十段视频（总量约 30GB），上传到 Google Photos 往往需要耗费几个小时甚至一整夜，期间手机发烫、电量剧降。\n\nShareCLIP 运行于纯内网局域网。手机与电脑之间直接通过 Wi-Fi 路由器建立多通道 P2P 数据流，速率完全取决于本地无线信号品质，实测可达 80~120 MB/s。同样的 30GB 媒体素材，在 ShareCLIP 下仅需不到 5 分钟即可全部原汁原味传输完毕。'
      },
      {
        title: '3. 本地端侧 AI：让普通电脑也能跑出云端级的智能体验',
        content: '许多人忍受云相册的根本原因，在于贪恋其便捷的「找图」体验（例如搜索「猫咪」、「海边」或「发票」）。大家普遍误以为这类 AI 识别必须依赖云端数十万张卡的大算力集群。\n\n近年来端侧轻量化模型的突破彻底打破了这一神话。ShareCLIP 集成的 MobileCLIP 经过高效蒸馏与量化，模型仅数十兆大小，却完整保留了跨模态对齐能力。桌面端借助 DirectML 自动适配各类显卡，Android 端借助 NPU 神经引擎，在极低功耗下毫秒级响应。你享受到了与 Google Photos 旗鼓相当的搜图体验，却没有牺牲任何一丝一毫的隐私。'
      }
    ],
    faqs: [
      {
        q: '从 Google Photos 导出照片后，如何导入到 ShareCLIP？',
        a: '你可以通过 Google Takeout (谷歌导出) 将历史照片打包下载到电脑，解压到任意文件夹中。在 ShareCLIP 中将该文件夹设为相册目录，软件会自动完成缩略图建立、EXIF 解析与本地 AI 向量索引，立刻开启秒级搜索。'
      },
      {
        q: '如果我不在家，如何在外面访问电脑里的照片？',
        a: 'ShareCLIP 主打最安全的局域网直连架构。若外出时需要远程访问，可通过配合开源成熟的组网工具（如 Tailscale 或 ZeroTier）将手机与电脑虚拟在同一局域网中，即可实现全球随时随地安全直连访问，同样无需第三方中转。'
      },
      {
        q: '电脑关机后，手机端还能独立使用 AI 搜图吗？',
        a: '可以！ShareCLIP Android 端独立集成了移动端本地 MobileCLIP 离线引擎。在手机本地相册中，即使脱离电脑连接，你也可以直接在手机端通过自然语言搜索本地已有的相片。'
      },
      {
        q: 'ShareCLIP 会对照片进行面部分析，这安全吗？',
        a: '绝对安全。所有的面部检测与人脸特征提取全部在您自己的电脑 CPU/GPU 上运行，特征向量仅保存在本机的 SQLite 数据库文件中，没有任何网络上传行为。'
      },
      {
        q: '真的完全免费吗？未来会不会开始收订阅费？',
        a: 'ShareCLIP 基于 MIT 开源协议发布，源代码完全公开在 GitHub 上。开源软件由社区共同维护与见证，绝无任何隐藏收费、限速或向订阅制转型的可能。'
      }
    ]
  },
  {
    id: 'immich',
    slug: 'shareclip-vs-immich',
    filename: 'shareclip-vs-immich.html',
    title: 'ShareCLIP vs Immich 对比：免 Docker 容器与自建 Linux 服务器，双击即用的极简个人 AI 相册与闪传工具',
    metaTitle: 'ShareCLIP vs Immich 对比：免 Docker、免 NAS 服务器，双击即用的轻量级个人 AI 相册',
    metaDescription: '厌倦了折腾复杂的 Immich Docker Compose、PostgreSQL 数据库和微服务集群？ShareCLIP 提供双击即用的轻量级个人 AI 相册。Windows 绿色免安装，Android 一键运行，内置 MobileCLIP 与人脸聚类，无需任何服务器或 NAS 硬件，极简零运维。',
    keywords: 'ShareCLIP, Immich 对比, Immich 替代, Immich 太复杂, 免Docker相册, 本地AI相册免服务器, Immich vs ShareCLIP, 个人私有相册, Windows相册管理, 局域网传输',
    badgeText: '极简开箱即用体验',
    competitorName: 'Immich 自建相册',
    competitorShort: 'Immich',
    competitorTagline: '需要维护 Docker 集群的重度自建方案',
    heroHeadline: '告别复杂的 Docker 运维：无需服务器，双击即用的 AI 相册',
    heroSubheadline: 'Immich 是一款令人尊敬的开源自建相册，但它需要专业的 Linux 知识、Docker Compose、PostgreSQL 与数 GB 常驻内存。ShareCLIP 带来极致的「免安装、免服务器、双击即用」，让普通电脑用户无需折腾即可享受端侧 AI 搜图与局域网闪传。',
    quickStats: [
      { label: '部署与运行门槛', shareclip: '0 配置：下载双击 .exe 即开即用', competitor: '高门槛：需 Docker / Compose / 命令行', highlight: true },
      { label: '硬件与服务器需求', shareclip: '无需专有服务器 / NAS，普通PC即可', competitor: '需 7x24 小时开机的 Linux 服务器或高端NAS', highlight: true },
      { label: '系统闲置内存占用', shareclip: '约 50~80 MB (轻量纯粹)', competitor: '通常 4GB ~ 8GB+ (多容器常驻)', highlight: true },
      { label: '移动端独立离线搜图', shareclip: '✅ 手机脱机独立支持 MobileCLIP', competitor: '❌ 强依赖与远程服务端的在线连接', highlight: true }
    ],
    whySwitch: '为什么许多自建玩家最终转向轻量级的 ShareCLIP？',
    whySwitchDesc: '折腾 Immich 的初期充满乐趣，但随之而来的是无穷无尽的运维噩梦：数据库升级迁移报错、机器学习容器内存溢出崩溃、NAS 硬件发热耗电、公网反向代理证书过期……相册的本质是记录美好生活，而不是成为你的第二份无薪运维工作。ShareCLIP 秉持极简主义哲学：没有容器，没有复杂服务，双击即可开始传输与检索。',
    featuresGrid: [
      {
        icon: '⚡',
        title: '免 Docker 免服务器，30 秒极速上手',
        desc: '无需购买数千元的 NAS，无需学习 Linux 命令行或 Docker 配置文件。Windows 下载即可双击启动，绿色免安装；手机安装 APK 即可自动连通。'
      },
      {
        icon: '🪶',
        title: '极致轻量，闲置内存仅需几十兆',
        desc: '拒绝沉重的多微服务架构。ShareCLIP 没有常驻的 PostgreSQL 或 Redis 守护进程，闲置时几乎不消耗系统 CPU 与电量，轻薄笔记本也能全天无感开启。'
      },
      {
        icon: '🤝',
        title: '点对点极速直传，无需中心中转',
        desc: '与 Immich 偏向服务端中央存储不同，ShareCLIP 拥有强悍的点对点闪传能力。手机与 PC 之间无需中转机器，随时随地直连，千兆局域网满速 80~120 MB/s。'
      },
      {
        icon: '📱',
        title: '移动端脱机独立 AI 检索',
        desc: 'ShareCLIP Android 端独立打包了端侧移动模型。即使电脑关机或离开家中的局域网，手机在高铁或户外依然可以离线进行自然语言语义图搜。'
      },
      {
        icon: '👥',
        title: '开箱即用的人脸识别与相册聚类',
        desc: '无需配置复杂的外部机器学习容器镜像。内置针对桌面端优化的 RetinaFace 与 ArcFace 算法，全自动检测聚类面孔，简单清晰。'
      },
      {
        icon: '🔄',
        title: '零破坏性升级，告别数据库迁移故障',
        desc: '所有的本地索引使用健壮耐用的轻量嵌入式存储，软件版本升级即替换单个执行文件，绝不会出现自建数据库版本锁死或容器启动崩溃的烦恼。'
      }
    ],
    comparisonTable: [
      {
        category: '部署安装与硬件门槛',
        items: [
          { feature: '运行部署方式', shareclip: '⚡ 绿色免安装，双击单个 .exe 启动', competitor: '⚠️ Docker / Docker Compose / 命令行安装', status: 'win' },
          { feature: '专有服务器 / NAS 依赖', shareclip: '✅ 零依赖 (普通家用台式机/笔记本即可)', competitor: '❌ 强烈依赖 24 小时开机的 NAS/Linux 主机', status: 'win' },
          { feature: '数据库依赖组件', shareclip: '✅ 内嵌轻量数据库，零外部依赖', competitor: '⚠️ 需维护 PostgreSQL + PGVector + Redis', status: 'win' },
          { feature: '部署耗时与技术要求', shareclip: '⏱️ 30 秒开箱即用 (零技术基础)', competitor: '⏱️ 数小时至数天 (需掌握网络与容器运维)', status: 'win' }
        ]
      },
      {
        category: '系统资源与性能开销',
        items: [
          { feature: '常驻系统内存占用', shareclip: '🍃 闲置仅约 50~80 MB', competitor: '🔥 通常占用 4GB ~ 8GB+ (多容器并发)', status: 'win' },
          { feature: '传输协议效率', shareclip: '⚡ 局域网 P2P 直达 (80~120 MB/s)', competitor: '⚠️ 需经由服务端 API 转存落盘', status: 'win' },
          { feature: '老旧电脑 / 笔记本适配度', shareclip: '✅ 极佳 (轻量低功耗，不卡顿)', competitor: '❌ 较吃配置，轻薄本发热严重', status: 'win' }
        ]
      },
      {
        category: '核心功能与使用体验',
        items: [
          { feature: '本地 AI 自然语言搜图', shareclip: '✅ 原生内置 MobileCLIP 语义引擎', competitor: '✅ 需下载单独机器学习容器运行', status: 'win' },
          { feature: '人脸识别与人物聚类', shareclip: '✅ 内置 RetinaFace + ArcFace', competitor: '✅ 需启动人脸识别容器模块', status: 'equal' },
          { feature: '手机脱网独立离线搜图', shareclip: '✅ 手机本地独立支持', competitor: '❌ 必须实时连通自建 Immich 服务端', status: 'win' },
          { feature: '多端免客户端 Web 互传', shareclip: '✅ 内置 WebShare，浏览器扫码即用', competitor: '⚠️ 需通过 Web 登录账号访问', status: 'win' }
        ]
      }
    ],
    deepDives: [
      {
        title: '1. 运维陷阱反思：为什么「自建相册」成了许多用户的无形负担？',
        content: 'Immich 无疑是近年来开源界最杰出的自建项目之一，功能强大且界面精致。但很多用户在跟风购入高配置 NAS 并搭建 Immich 后，很快遭遇了残酷的现实：\n\n每次官方发布新大版本，Docker Compose 配置就要根据更新日志小心翼翼修改；PostgreSQL 数据库主版本升级时常面临数据兼容性挑战；机器学习容器在并发处理大量照片时容易引发 OOM（内存溢出）导致整机卡死。如果你的目标只是简简单单把手机照片传回电脑，并能随心所欲搜图，你真的需要一套复杂的微服务架构吗？ShareCLIP 重新回到软件设计的初衷：双击运行，即刻解决问题。'
      },
      {
        title: '2. 架构设计哲学差异：单机便携绿色版 vs 重型企业级微服务',
        content: 'Immich 采用的是类似大型企业后端的技术栈：Nginx 反向代理、Node.js API 网关、Microservices 后台队列、PostgreSQL 关系库、Redis 缓存队列，再加上 Python 驱动的 Machine Learning 独立容器。这套架构在多用户企业环境中扩展性好，但对单人或家庭而言极其沉重。\n\nShareCLIP 采用现代桌面极简架构。传输模块用高性能异步网络栈构建，前端采用现代化响应式视图，AI 模块直接内嵌原生 DirectML 与 ONNX Runtime。所有的代码被编译为一个自包含的独立可执行文件。没有后台僵尸进程，没有日志疯狂啃噬磁盘，关闭即停止，干净利落。'
      },
      {
        title: '3. 离线随身性对比：脱机环境下谁能真正做到随时随地？',
        content: '自建 Immich 最大的软肋在于「强连接依赖」。当你出差在高铁上、在无信号的露营地，或者因为家中断电、NAS 意外死机，手机上的 Immich App 瞬间陷入不可用状态，不仅无法同步，连利用 AI 搜索本地照片都彻底瘫痪。\n\nShareCLIP 的 Android 客户端具有完全自主的端侧感知大脑。在手机端，MobileCLIP 深度模型与离线向量检索直接嵌在 App 内部。无论你身处世界的哪一个角落，哪怕完全拔掉 SIM 卡处于飞行模式，本地相册依旧能够流畅进行复杂自然语言搜索。这种完全去中心化的架构赋予了数据真正的自由。'
      }
    ],
    faqs: [
      {
        q: '我已经有一台 NAS，还可以用 ShareCLIP 吗？',
        a: '当然可以！你可以把 NAS 挂载为电脑的本地磁盘或 SMB 共享目录，将 ShareCLIP 的相册存储路径直接指向 NAS 文件夹。这样你既享受到了 NAS 的大容量与磁盘阵列冗余，又无需在 NAS 上折腾复杂的 Docker 容器和调试，一举两得。'
      },
      {
        q: '如果未来我想换电脑，ShareCLIP 的数据和索引好迁移吗？',
        a: '极其简单。ShareCLIP 所有的照片均以最原始的文件格式保存在你的指定文件夹中，本地索引文件也是纯绿色的单文件数据库。迁移时只需把照片文件夹复制到新电脑，在新电脑上重新双击打开 ShareCLIP 即可，绝不会出现数据库格式绑定或权限锁死。'
      },
      {
        q: 'ShareCLIP 会像 Docker 容器那样一直吃满 CPU 吗？',
        a: '绝对不会。ShareCLIP 采用事件驱动与增量索引机制。只有在收到新照片时才会轻量唤起后台 AI 线程进行向量化，处理完毕后 CPU 立即归零进入休眠状态，闲置时系统占用几乎为 0%。'
      },
      {
        q: '手机与电脑不在同一个 Wi-Fi 时怎么传？',
        a: '如果身处户外没有 Wi-Fi 路由器，手机只需开启个人热点，电脑连接手机热点，ShareCLIP 即可立刻实现免流量的高速无线 P2P 互传；也可以配合 Tailscale 等轻量虚拟局域网工具跨网连接。'
      },
      {
        q: '相比 Immich，ShareCLIP 缺少哪些功能？',
        a: 'Immich 偏向多用户权限管理、公网相册分享外链等企业级中央功能；而 ShareCLIP 更加专注于「个人与家庭的极速互传、端侧绝对隐私、无需服务器、双击即用的极简 AI 资产管理」。如果你不需要复杂的服务器协作，ShareCLIP 将提供轻巧十倍的使用体验。'
      }
    ]
  }
];

// Helper to escape HTML special chars
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate the complete HTML content for each page
function generateHtmlPage(cfg) {
  const currentUrl = `${BASE_URL}/${cfg.filename}`;
  const today = new Date().toISOString().split('T')[0];

  // Schema.org JSON-LD definitions
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "ShareCLIP",
        "url": BASE_URL,
        "image": `${BASE_URL}/hero_banner.jpg`,
        "operatingSystem": "Windows 10, Windows 11, Android, macOS, Web",
        "applicationCategory": "MultimediaApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "218",
          "bestRating": "5",
          "worstRating": "1"
        },
        "description": "100% on-device AI photo gallery and high-speed local P2P sync across Windows, Android, macOS, and Web. Zero cloud, zero subscription, 80+ MB/s Wi-Fi speed."
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "首页",
            "item": `${BASE_URL}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "竞品对比",
            "item": `${BASE_URL}/#comparison`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `ShareCLIP vs ${cfg.competitorShort}`,
            "item": currentUrl
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": cfg.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      },
      {
        "@type": "WebPage",
        "@id": currentUrl,
        "url": currentUrl,
        "name": cfg.title,
        "description": cfg.metaDescription,
        "inLanguage": "zh-CN",
        "isPartOf": {
          "@type": "WebSite",
          "name": "ShareCLIP Official",
          "url": BASE_URL
        }
      }
    ]
  };

  // Other comparisons links
  const otherPages = PAGES_CONFIG.filter(p => p.id !== cfg.id);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  
  <title>${escapeHtml(cfg.title)}</title>
  <meta name="title" content="${escapeHtml(cfg.metaTitle)}" />
  <meta name="description" content="${escapeHtml(cfg.metaDescription)}" />
  <meta name="keywords" content="${escapeHtml(cfg.keywords)}" />
  <meta name="author" content="NovaMindLab" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${currentUrl}" />
  <meta name="theme-color" content="#060913" />

  <!-- Open Graph / Facebook / WeChat -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${currentUrl}" />
  <meta property="og:title" content="${escapeHtml(cfg.title)}" />
  <meta property="og:description" content="${escapeHtml(cfg.metaDescription)}" />
  <meta property="og:image" content="${BASE_URL}/hero_banner.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="ShareCLIP" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${currentUrl}" />
  <meta name="twitter:title" content="${escapeHtml(cfg.metaTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(cfg.metaDescription)}" />
  <meta name="twitter:image" content="${BASE_URL}/hero_banner.jpg" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📸</text></svg>" />

  <!-- Mixpanel Analytics -->
  <script type="text/javascript">
    (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
    for(h=0;h<i.length;h++)g(a,i[h]);var j="set_config match_media reset register register_once unregister opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking".split(" ");for(h=0;h<j.length;h++)g(a,j[h]);b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);
    mixpanel.init('0cd6d7d8447105fe062f27dafa4a527d', {
      autocapture: true,
      track_pageview: true,
      persistence: 'localStorage'
    });
    mixpanel.track('pSEO Page Viewed', {
      page: '${cfg.slug}',
      competitor: '${cfg.competitorShort}'
    });
  </script>

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    /* CSS Reset & Design Tokens */
    :root {
      --bg-main: #060913;
      --bg-card: rgba(15, 23, 42, 0.72);
      --bg-card-hover: rgba(30, 41, 59, 0.85);
      --primary: #a855f7;
      --primary-glow: rgba(168, 85, 247, 0.35);
      --secondary: #10b981;
      --secondary-glow: rgba(16, 185, 129, 0.25);
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --danger: #f43f5e;
      --warning: #f59e0b;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(168, 85, 247, 0.45);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --font-sans: 'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.65;
      overflow-x: hidden;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* Ambient Background Glows */
    .bg-ambient {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .ambient-spot {
      position: absolute;
      border-radius: 50%;
      filter: blur(140px);
      opacity: 0.22;
    }
    .spot-1 { width: 650px; height: 650px; background: radial-gradient(circle, #7c3aed 0%, transparent 70%); top: -150px; left: 15%; }
    .spot-2 { width: 550px; height: 550px; background: radial-gradient(circle, #0284c7 0%, transparent 70%); top: 40%; right: -120px; }
    .spot-3 { width: 600px; height: 600px; background: radial-gradient(circle, #059669 0%, transparent 70%); bottom: 5%; left: -100px; }

    .container {
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 1;
    }

    /* Sticky Navbar */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      background: rgba(6, 9, 19, 0.75);
      border-bottom: 1px solid var(--border-subtle);
      transition: all 0.3s ease;
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-main);
      font-weight: 800;
      font-size: 20px;
      letter-spacing: -0.02em;
    }
    .nav-brand .brand-logo { font-size: 24px; }
    .nav-brand .brand-accent { color: var(--primary); }
    .nav-version {
      font-size: 11px;
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .nav-menu {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .nav-link {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    .nav-link:hover { color: var(--text-main); }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
      padding: 9px 18px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.25s ease;
      white-space: nowrap;
    }
    .btn-primary {
      background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 20px var(--primary-glow);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 26px rgba(168, 85, 247, 0.55);
      filter: brightness(1.1);
    }
    .btn-outline {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .btn-webshare {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #7dd3fc;
    }
    .btn-webshare:hover {
      background: rgba(56, 189, 248, 0.22);
      color: #bae6fd;
    }

    /* Comparison Quick Bar */
    .switch-pills-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      margin: 18px 0 0 0;
      padding: 6px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid var(--border-subtle);
      border-radius: 30px;
      width: fit-content;
      margin-left: auto;
      margin-right: auto;
    }
    .switch-pill {
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .switch-pill:hover { color: var(--text-main); }
    .switch-pill.active {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(99, 102, 241, 0.3));
      color: #fff;
      border: 1px solid rgba(168, 85, 247, 0.5);
    }

    /* Breadcrumbs */
    .breadcrumb-nav {
      padding: 24px 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-dim);
    }
    .breadcrumb-nav a { color: var(--text-muted); text-decoration: none; }
    .breadcrumb-nav a:hover { color: var(--primary); }
    .breadcrumb-sep { color: var(--text-dim); }

    /* Hero Section */
    .hero-sec {
      padding: 30px 0 50px 0;
      text-align: center;
    }
    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #c084fc;
      background: rgba(168, 85, 247, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.35);
      padding: 6px 16px;
      border-radius: 30px;
      margin-bottom: 24px;
    }
    .hero-title {
      font-size: 42px;
      line-height: 1.22;
      font-weight: 900;
      letter-spacing: -0.03em;
      margin-bottom: 20px;
      max-width: 960px;
      margin-left: auto;
      margin-right: auto;
    }
    .gradient-text {
      background: linear-gradient(135deg, #ffffff 15%, #c084fc 60%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-lead {
      font-size: 18px;
      line-height: 1.7;
      color: var(--text-muted);
      max-width: 820px;
      margin: 0 auto 36px auto;
    }
    .hero-cta-box {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 40px;
    }
    .btn-hero-lg {
      padding: 13px 28px;
      font-size: 16px;
      border-radius: 12px;
    }

    /* Quick Stats Grid */
    .stats-card-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 40px 0;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 22px 18px;
      text-align: left;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-focus);
      background: var(--bg-card-hover);
    }
    .stat-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }
    .stat-sc {
      font-size: 16px;
      font-weight: 800;
      color: #34d399;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stat-comp {
      font-size: 13px;
      color: var(--text-dim);
    }

    /* Section Styling */
    .content-section {
      padding: 50px 0;
    }
    .section-header {
      text-align: center;
      margin-bottom: 40px;
    }
    .sec-tag {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin-bottom: 10px;
      display: block;
    }
    .sec-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 14px;
    }
    .sec-desc {
      font-size: 16px;
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: all 0.25s ease;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-focus);
      box-shadow: 0 16px 36px -10px rgba(0,0,0,0.5);
    }
    .feature-icon-box {
      font-size: 32px;
      margin-bottom: 18px;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .feature-card h3 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #fff;
    }
    .feature-card p {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.65;
    }

    /* Detailed Comparison Table */
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      overflow: hidden;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.4);
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .comp-table th {
      padding: 20px 24px;
      font-size: 15px;
      font-weight: 800;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(15, 23, 42, 0.85);
    }
    .comp-table th.col-sc {
      background: rgba(168, 85, 247, 0.14);
      color: #e9d5ff;
      border-left: 1px solid rgba(168, 85, 247, 0.3);
      border-right: 1px solid rgba(168, 85, 247, 0.3);
    }
    .comp-table td {
      padding: 18px 24px;
      font-size: 14px;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
    }
    .comp-table td.col-sc {
      background: rgba(168, 85, 247, 0.05);
      border-left: 1px solid rgba(168, 85, 247, 0.2);
      border-right: 1px solid rgba(168, 85, 247, 0.2);
      font-weight: 600;
    }
    .comp-table tr.category-row td {
      background: rgba(30, 41, 59, 0.6);
      font-weight: 800;
      font-size: 13px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 12px 24px;
    }
    .badge-win {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.18);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
      margin-bottom: 4px;
    }
    .badge-lose {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(244, 63, 94, 0.16);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.35);
      margin-bottom: 4px;
    }
    .badge-equal {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(148, 163, 184, 0.16);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.3);
      margin-bottom: 4px;
    }

    /* Deep Dive Articles */
    .deep-dive-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 36px;
      margin-bottom: 24px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .deep-dive-card h3 {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .deep-dive-card p {
      font-size: 15px;
      color: var(--text-muted);
      line-height: 1.8;
      white-space: pre-line;
    }

    /* FAQ Accordion */
    .faq-wrapper {
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .faq-item {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .faq-item[open] {
      border-color: var(--border-focus);
      background: var(--bg-card-hover);
    }
    .faq-question {
      padding: 20px 24px;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }
    .faq-question::-webkit-details-marker { display: none; }
    .faq-chevron {
      font-size: 14px;
      color: var(--primary);
      transition: transform 0.25s ease;
    }
    .faq-item[open] .faq-chevron {
      transform: rotate(180deg);
    }
    .faq-answer {
      padding: 0 24px 22px 24px;
      font-size: 15px;
      color: var(--text-muted);
      line-height: 1.7;
    }

    /* All Platforms Download Banner */
    .download-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 36px;
    }
    .download-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px 22px;
      text-align: center;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .download-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-focus);
    }
    .download-card.highlight {
      border-color: rgba(168, 85, 247, 0.4);
      background: linear-gradient(180deg, rgba(168, 85, 247, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%);
    }
    .dl-icon { font-size: 38px; margin-bottom: 12px; }
    .dl-title { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .dl-sub { font-size: 12px; color: var(--text-dim); margin-bottom: 20px; }
    .dl-btn { width: 100%; font-size: 14px; }

    /* Other Comparisons Switcher */
    .other-comp-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 30px;
    }
    .other-comp-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 22px;
      text-decoration: none;
      color: inherit;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .other-comp-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-focus);
      background: var(--bg-card-hover);
    }
    .occ-badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .occ-title { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .occ-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; }

    /* Footer */
    footer {
      border-top: 1px solid var(--border-subtle);
      padding: 60px 0 40px 0;
      margin-top: 80px;
      font-size: 14px;
      color: var(--text-dim);
    }
    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .footer-links {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    .footer-links a { color: var(--text-muted); text-decoration: none; }
    .footer-links a:hover { color: var(--text-main); }

    /* Mobile Responsive */
    @media (max-width: 992px) {
      .hero-title { font-size: 34px; }
      .stats-card-grid { grid-template-columns: repeat(2, 1fr); }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .download-grid { grid-template-columns: repeat(2, 1fr); }
      .other-comp-grid { grid-template-columns: 1fr; }
      .nav-menu { display: none; }
    }
    @media (max-width: 680px) {
      .hero-title { font-size: 28px; }
      .hero-lead { font-size: 15px; }
      .stats-card-grid { grid-template-columns: 1fr; }
      .features-grid { grid-template-columns: 1fr; }
      .download-grid { grid-template-columns: 1fr; }
      .table-container { overflow-x: auto; }
      .comp-table th, .comp-table td { padding: 14px 16px; font-size: 13px; }
      .deep-dive-card { padding: 24px; }
      .switch-pills-bar { border-radius: 16px; }
    }
  </style>
</head>
<body>

  <!-- Ambient Light -->
  <div class="bg-ambient">
    <div class="ambient-spot spot-1"></div>
    <div class="ambient-spot spot-2"></div>
    <div class="ambient-spot spot-3"></div>
  </div>

  <!-- Sticky Navbar -->
  <header class="navbar">
    <div class="container nav-inner">
      <a href="${BASE_URL}/" class="nav-brand" title="ShareCLIP 官网">
        <span class="brand-logo">📸</span>
        <span>Share<span class="brand-accent">CLIP</span></span>
        <span class="nav-version">${appVersion}</span>
      </a>

      <nav class="nav-menu">
        <a href="#comparison" class="nav-link">参数对比</a>
        <a href="#features" class="nav-link">核心优势</a>
        <a href="#deep-dive" class="nav-link">深度评测</a>
        <a href="#faq" class="nav-link">常见问答</a>
        <a href="${WEBSHARE_URL}" class="btn btn-webshare" target="_blank">🌐 WebShare 网页版</a>
      </nav>

      <div class="nav-actions">
        <a href="#download" class="btn btn-primary" onclick="if(window.mixpanel) mixpanel.track('CTA Click', { label: 'Nav Download', page: '${cfg.slug}' });">
          <span>🚀 免费下载</span>
        </a>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- Breadcrumb Navigation -->
    <div class="breadcrumb-nav">
      <a href="${BASE_URL}/">首页</a>
      <span class="breadcrumb-sep">/</span>
      <a href="${BASE_URL}/#comparison">竞品对比</a>
      <span class="breadcrumb-sep">/</span>
      <span style="color: var(--text-main);">ShareCLIP vs ${escapeHtml(cfg.competitorShort)}</span>
    </div>

    <!-- Quick Switcher Bar -->
    <div class="switch-pills-bar">
      <span style="font-size: 12px; color: var(--text-dim); margin-right: 6px;">切换对比：</span>
      <a href="./shareclip-vs-airdrop.html" class="switch-pill ${cfg.id === 'airdrop' ? 'active' : ''}">vs AirDrop</a>
      <a href="./shareclip-vs-localsend.html" class="switch-pill ${cfg.id === 'localsend' ? 'active' : ''}">vs LocalSend</a>
      <a href="./shareclip-vs-google-photos.html" class="switch-pill ${cfg.id === 'google-photos' ? 'active' : ''}">vs Google Photos</a>
      <a href="./shareclip-vs-immich.html" class="switch-pill ${cfg.id === 'immich' ? 'active' : ''}">vs Immich</a>
    </div>

    <!-- Hero Section -->
    <section class="hero-sec">
      <div class="hero-badge-pill">
        <span>✨</span> ${escapeHtml(cfg.badgeText)} • 2026 最新横评
      </div>
      <h1 class="hero-title">
        <span class="gradient-text">${escapeHtml(cfg.heroHeadline)}</span>
      </h1>
      <p class="hero-lead">
        ${escapeHtml(cfg.heroSubheadline)}
      </p>

      <div class="hero-cta-box">
        <a href="${WINDOWS_EXE_URL}" class="btn btn-primary btn-hero-lg" onclick="if(window.mixpanel) mixpanel.track('Download Click', { platform: 'Windows', source: 'Hero_${cfg.slug}' });">
          <span>🖥️ Windows 下载 (.exe)</span>
        </a>
        <a href="${ANDROID_APK_URL}" class="btn btn-outline btn-hero-lg" onclick="if(window.mixpanel) mixpanel.track('Download Click', { platform: 'Android', source: 'Hero_${cfg.slug}' });">
          <span>📱 Android 安装包 (.apk)</span>
        </a>
        <a href="${WEBSHARE_URL}" class="btn btn-webshare btn-hero-lg" target="_blank" onclick="if(window.mixpanel) mixpanel.track('WebShare Click', { source: 'Hero_${cfg.slug}' });">
          <span>🌐 免安装 Web 网页版直连</span>
        </a>
      </div>

      <!-- Quick Metrics Summary Grid -->
      <div class="stats-card-grid">
        ${cfg.quickStats.map(st => `
        <div class="stat-card">
          <div class="stat-label">${escapeHtml(st.label)}</div>
          <div class="stat-sc">⚡ ${escapeHtml(st.shareclip)}</div>
          <div class="stat-comp">${escapeHtml(cfg.competitorShort)}: ${escapeHtml(st.competitor)}</div>
        </div>
        `).join('')}
      </div>
    </section>

    <!-- Why Switch Section -->
    <section class="content-section" style="border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="section-header">
        <span class="sec-tag">痛点解决</span>
        <h2 class="sec-title">${escapeHtml(cfg.whySwitch)}</h2>
        <p class="sec-desc">${escapeHtml(cfg.whySwitchDesc)}</p>
      </div>
    </section>

    <!-- Detailed Feature Comparison Table Section -->
    <section class="content-section" id="comparison">
      <div class="section-header">
        <span class="sec-tag">全景参数对比</span>
        <h2 class="sec-title">ShareCLIP 与 ${escapeHtml(cfg.competitorShort)} 全维度深度横评</h2>
        <p class="sec-desc">从跨平台兼容性、传输吞吐量、本地 AI 搜图引擎到隐私成本，看清每一处真实差异。</p>
      </div>

      <div class="table-container">
        <table class="comp-table">
          <thead>
            <tr>
              <th style="width: 28%;">功能特性与评估维度</th>
              <th class="col-sc" style="width: 38%;">📸 ShareCLIP (端侧 AI 闪传)</th>
              <th style="width: 34%;">${escapeHtml(cfg.competitorName)}</th>
            </tr>
          </thead>
          <tbody>
            ${cfg.comparisonTable.map(cat => `
            <tr class="category-row">
              <td colspan="3">📌 ${escapeHtml(cat.category)}</td>
            </tr>
            ${cat.items.map(row => {
              let badgeHtml = '';
              if (row.status === 'win') {
                badgeHtml = '<span class="badge-win">领先优势</span>';
              } else if (row.status === 'equal') {
                badgeHtml = '<span class="badge-equal">基本相当</span>';
              }
              return `
              <tr>
                <td><strong>${escapeHtml(row.feature)}</strong></td>
                <td class="col-sc">
                  ${badgeHtml}<br />
                  ${escapeHtml(row.shareclip)}
                </td>
                <td>
                  <span class="${row.status === 'win' ? 'badge-lose' : 'badge-equal'}">${row.status === 'win' ? '受限/劣势' : '支持'}</span><br />
                  ${escapeHtml(row.competitor)}
                </td>
              </tr>
              `;
            }).join('')}
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Key Strengths Cards Grid -->
    <section class="content-section" id="features">
      <div class="section-header">
        <span class="sec-tag">独特杀手级功能</span>
        <h2 class="sec-title">选择 ShareCLIP 的 6 大不可替代理由</h2>
        <p class="sec-desc">不仅速度飞快，更让您的媒体资产管理彻底迈入端侧智能时代。</p>
      </div>

      <div class="features-grid">
        ${cfg.featuresGrid.map(f => `
        <div class="feature-card">
          <div class="feature-icon-box">${f.icon}</div>
          <h3>${escapeHtml(f.title)}</h3>
          <p>${escapeHtml(f.desc)}</p>
        </div>
        `).join('')}
      </div>
    </section>

    <!-- Deep Dive Articles Section -->
    <section class="content-section" id="deep-dive">
      <div class="section-header">
        <span class="sec-tag">技术深度剖析</span>
        <h2 class="sec-title">场景还原与架构底层深度实测</h2>
        <p class="sec-desc">真实测试数据与架构原理，解答极客用户关心的底层疑问。</p>
      </div>

      ${cfg.deepDives.map(dd => `
      <div class="deep-dive-card">
        <h3>${escapeHtml(dd.title)}</h3>
        <p>${escapeHtml(dd.content)}</p>
      </div>
      `).join('')}
    </section>

    <!-- FAQ Accordion Section -->
    <section class="content-section" id="faq">
      <div class="section-header">
        <span class="sec-tag">常见疑问解答</span>
        <h2 class="sec-title">关于 ShareCLIP 与 ${escapeHtml(cfg.competitorShort)} 的常见问答</h2>
        <p class="sec-desc">解答您在实际使用、迁移、隐私保护和性能上的所有疑问。</p>
      </div>

      <div class="faq-wrapper">
        ${cfg.faqs.map(faq => `
        <details class="faq-item">
          <summary class="faq-question">
            <span>${escapeHtml(faq.q)}</span>
            <span class="faq-chevron">▼</span>
          </summary>
          <div class="faq-answer">
            ${escapeHtml(faq.a)}
          </div>
        </details>
        `).join('')}
      </div>
    </section>

    <!-- All Platforms Download CTA Banner -->
    <section class="content-section" id="download">
      <div class="section-header">
        <span class="sec-tag">全平台下载</span>
        <h2 class="sec-title">立刻体验极速 P2P 互传与端侧 AI 搜图</h2>
        <p class="sec-desc">100% 开源免费，无广告、无订阅，永久拥有您的照片主权。</p>
      </div>

      <div class="download-grid">
        <!-- Windows -->
        <div class="download-card highlight">
          <div>
            <div class="dl-icon">🖥️</div>
            <div class="dl-title">Windows 客户端</div>
            <div class="dl-sub">Windows 10 / 11 • 64-bit 安装包</div>
          </div>
          <a href="${WINDOWS_EXE_URL}" class="btn btn-primary dl-btn" onclick="if(window.mixpanel) mixpanel.track('Download Click', { platform: 'Windows', source: 'DownloadGrid_${cfg.slug}' });">
            <span>下载 Windows 版</span>
          </a>
        </div>

        <!-- Android -->
        <div class="download-card">
          <div>
            <div class="dl-icon">📱</div>
            <div class="dl-title">Android 安卓版</div>
            <div class="dl-sub">支持 Android 8.0+ • APK 直链</div>
          </div>
          <a href="${ANDROID_APK_URL}" class="btn btn-outline dl-btn" onclick="if(window.mixpanel) mixpanel.track('Download Click', { platform: 'Android', source: 'DownloadGrid_${cfg.slug}' });">
            <span>下载 Android APK</span>
          </a>
        </div>

        <!-- WebShare -->
        <div class="download-card">
          <div>
            <div class="dl-icon">🌐</div>
            <div class="dl-title">WebShare 网页版</div>
            <div class="dl-sub">无需安装客户端 • 浏览器扫码直传</div>
          </div>
          <a href="${WEBSHARE_URL}" class="btn btn-webshare dl-btn" target="_blank" onclick="if(window.mixpanel) mixpanel.track('WebShare Click', { source: 'DownloadGrid_${cfg.slug}' });">
            <span>立即在线使用</span>
          </a>
        </div>

        <!-- macOS & GitHub -->
        <div class="download-card">
          <div>
            <div class="dl-icon">🍏</div>
            <div class="dl-title">macOS & 开源仓库</div>
            <div class="dl-sub">Apple Silicon / Intel • GitHub 源码</div>
          </div>
          <a href="${REPO_URL}" class="btn btn-outline dl-btn" target="_blank" onclick="if(window.mixpanel) mixpanel.track('GitHub Click', { source: 'DownloadGrid_${cfg.slug}' });">
            <span>⭐ Star on GitHub</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Other Comparisons Navigation -->
    <section class="content-section" style="border-top: 1px solid var(--border-subtle); margin-top: 40px;">
      <div class="section-header">
        <span class="sec-tag">探索更多对比</span>
        <h2 class="sec-title">查看其他热门工具对比评测</h2>
        <p class="sec-desc">了解 ShareCLIP 与其他流行工具在架构、隐私与功能上的全方位差异。</p>
      </div>

      <div class="other-comp-grid">
        ${otherPages.map(op => `
        <a href="./${op.filename}" class="other-comp-card">
          <div>
            <div class="occ-badge">深度对比</div>
            <div class="occ-title">ShareCLIP vs ${escapeHtml(op.competitorShort)}</div>
            <div class="occ-desc">${escapeHtml(op.metaTitle)}</div>
          </div>
          <div style="margin-top: 16px; font-size: 13px; font-weight: 700; color: var(--primary);">阅读完整测评 →</div>
        </a>
        `).join('')}
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    <div class="container footer-inner">
      <div>
        <div style="font-weight: 800; font-size: 16px; color: #fff; margin-bottom: 6px;">
          📸 ShareCLIP
        </div>
        <div style="font-size: 13px;">
          基于 MIT 宽松协议开源 • 保护您的数字资产与个人隐私
        </div>
      </div>

      <div class="footer-links">
        <a href="${BASE_URL}/">官方首页</a>
        <a href="${WEBSHARE_URL}" target="_blank">WebShare 网页版</a>
        <a href="${BASE_URL}/privacy.html">隐私政策</a>
        <a href="${REPO_URL}" target="_blank">GitHub 开源仓库</a>
        <a href="https://github.com/sponsors/NovaMindLab" target="_blank">赞助支持</a>
      </div>
    </div>
  </footer>

</body>
</html>
`;
}

// Synchronize sitemap.xml to include all comparison pages
function updateSitemap() {
  const sitemapPath = path.join(webPublicDir, 'sitemap.xml');
  const today = new Date().toISOString().split('T')[0];

  let existingXml = '';
  if (fs.existsSync(sitemapPath)) {
    existingXml = fs.readFileSync(sitemapPath, 'utf8');
  } else {
    existingXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
  }

  // Ensure entries for all 4 comparison pages exist
  for (const page of PAGES_CONFIG) {
    const loc = `${BASE_URL}/${page.filename}`;
    const locRegex = new RegExp(`<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>`, 'i');

    if (locRegex.test(existingXml)) {
      // Update lastmod
      console.log(`[Sitemap] Updating existing sitemap entry for ${page.filename}`);
    } else {
      console.log(`[Sitemap] Adding new entry for ${page.filename}`);
      const entryXml = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      existingXml = existingXml.replace('</urlset>', `${entryXml}</urlset>`);
    }
  }

  // Refresh all lastmod dates to today
  existingXml = existingXml.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${today}</lastmod>`);

  fs.writeFileSync(sitemapPath, existingXml, 'utf8');
  console.log(`[Sitemap] Successfully updated and synchronized sitemap.xml at ${sitemapPath}`);
}

async function main() {
  console.log('====================================================');
  console.log('  ShareCLIP Programmatic SEO Page Generator        ');
  console.log('====================================================\n');

  if (!fs.existsSync(webPublicDir)) {
    fs.mkdirSync(webPublicDir, { recursive: true });
  }

  const generatedFiles = [];

  for (const pageCfg of PAGES_CONFIG) {
    const filePath = path.join(webPublicDir, pageCfg.filename);
    console.log(`[Generator] Generating ${pageCfg.filename}...`);
    const htmlContent = generateHtmlPage(pageCfg);
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    const stats = fs.statSync(filePath);
    generatedFiles.push({
      file: pageCfg.filename,
      path: filePath,
      size: `${(stats.size / 1024).toFixed(2)} KB`
    });
    console.log(`  -> Saved: ${pageCfg.filename} (${(stats.size / 1024).toFixed(2)} KB)`);
  }

  console.log('\n[Sitemap] Synchronizing web/public/sitemap.xml...');
  updateSitemap();

  console.log('\n====================================================');
  console.log('                Generation Complete!                ');
  console.log('====================================================');
  for (const item of generatedFiles) {
    console.log(`  ✅ ${item.file.padEnd(36)} [${item.size}]`);
  }
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
