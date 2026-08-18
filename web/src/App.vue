<template>
  <div class="web-layout">
    <!-- Ambient Background Lighting -->
    <div class="bg-ambient">
      <div class="ambient-spot spot-purple"></div>
      <div class="ambient-spot spot-cyan"></div>
      <div class="ambient-spot spot-emerald"></div>
    </div>

    <!-- Top Floating Navbar -->
    <header class="navbar">
      <div class="container nav-container">
        <div class="nav-logo" @click="scrollToTop">
          <span class="logo-emoji">📸</span>
          <span class="logo-text">Share<span class="gradient-text-purple">CLIP</span></span>
          <span class="version-tag">v1.2.76</span>
        </div>
        
        <nav class="nav-links">
          <a href="#features" class="nav-link">{{ t.nav.features }}</a>
          <a href="#ai-ecosystem" class="nav-link">{{ t.nav.ai || 'AI 架构' }}</a>
          <a href="#simulator" class="nav-link">{{ t.nav.simulator }}</a>
          <a href="#comparison" class="nav-link">{{ t.nav.comparison || '对比优势' }}</a>
          <a href="#download" class="btn btn-primary nav-btn">{{ t.nav.download }}</a>
          
          <!-- GitHub Stars Button -->
          <a 
            href="https://github.com/NovaMindLab/AIShare-Grabber" 
            target="_blank" 
            class="btn btn-github"
            style="padding: 8px 14px; font-size: 13px;"
            title="Star on GitHub"
          >
            ⭐ <span style="font-weight: 700;">GitHub</span>
          </a>

          <!-- Dropdown Language Selector -->
          <div class="lang-select-wrapper">
            <select v-model="currentLocale" class="lang-select">
              <option v-for="(name, code) in languages" :key="code" :value="code">
                {{ name }}
              </option>
            </select>
          </div>
        </nav>
      </div>
    </header>

    <!-- ==================== HERO SECTION ==================== -->
    <section class="hero-section">
      <div class="container">
        <!-- Hero Header -->
        <div class="hero-header-center">
          <div class="badge-pill pulse-glow">
            <span>✨</span> {{ t.hero.badge }}
          </div>
          
          <h1 class="hero-main-title">
            <span class="gradient-text">打破设备壁垒</span><br />
            本地 AI 赋能的跨端无网照片生态
          </h1>
          
          <p class="hero-main-desc">
            {{ t.hero.desc }}
          </p>

          <!-- CTA Buttons -->
          <div class="hero-actions-row">
            <a href="#download" class="btn btn-primary" style="font-size: 16px; padding: 14px 30px;">
              <span>🖥️</span> {{ t.download.pc.btn || '下载 Windows 桌面端' }}
            </a>
            <a href="#download" class="btn btn-secondary" style="font-size: 16px; padding: 14px 30px;">
              <span>📱</span> {{ t.download.android.btn || '下载 Android APK' }}
            </a>
            <a href="#simulator" class="btn btn-outline" style="font-size: 16px; padding: 14px 26px;">
              <span>⚡</span> {{ t.hero.simulate }}
            </a>
          </div>
        </div>

        <!-- 3D Hero Banner Showcase Frame -->
        <div class="hero-banner-frame glass-panel">
          <img src="/hero_banner.jpg" alt="ShareCLIP 3D Ecosystem" class="hero-banner-img" />
          
          <!-- Floating Status Chips -->
          <div class="floating-chip chip-1">
            <span class="chip-icon">⚡</span>
            <div>
              <div class="chip-title">WebRTC 千兆直连</div>
              <div class="chip-sub">1.2 GB/s 局域网无损互传</div>
            </div>
          </div>

          <div class="floating-chip chip-2">
            <span class="chip-icon">🧠</span>
            <div>
              <div class="chip-title">MobileCLIP-S0 AI</div>
              <div class="chip-sub">512-D 离线多模态语义向量</div>
            </div>
          </div>

          <div class="floating-chip chip-3">
            <span class="chip-icon">🔒</span>
            <div>
              <div class="chip-title">100% 本地隐私安全</div>
              <div class="chip-sub">零云端中转 • 零流量消耗</div>
            </div>
          </div>
        </div>

        <!-- Stats Matrix -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value gradient-text-purple">0 ms</div>
            <div class="stat-label">云端中转延迟 (纯本地 P2P 直连)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gradient-text-cyan">1.2 GB/s</div>
            <div class="stat-label">局域网 Wi-Fi Socket 极限吞吐</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gradient-text">512-D</div>
            <div class="stat-label">MobileCLIP 空间自然语言语义搜索</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gradient-text-purple">100%</div>
            <div class="stat-label">数据本地存储 • 绝无隐私外泄风险</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== CORE FEATURES GRID ==================== -->
    <section id="features" class="section-padding">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill">FEATURES</div>
          <h2 class="section-title">{{ t.features.title }}</h2>
          <p class="section-subtitle">{{ t.features.subtitle }}</p>
        </div>

        <div class="features-grid">
          <!-- Feature 1: BLE Pairing -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-purple">⚡</div>
            <h3>{{ t.features.f1.title }}</h3>
            <p>{{ t.features.f1.desc }}</p>
          </div>

          <!-- Feature 2: WebRTC LAN Direct -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-cyan">🚀</div>
            <h3>{{ t.features.f2.title }}</h3>
            <p>{{ t.features.f2.desc }}</p>
          </div>

          <!-- Feature 3: MobileCLIP AI -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-emerald">🧠</div>
            <h3>{{ t.features.f3.title }}</h3>
            <p>{{ t.features.f3.desc }}</p>
          </div>

          <!-- Feature 4: Two-way chat -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-purple">🖼️</div>
            <h3>渐进式大图画廊 (Lightbox)</h3>
            <p>0ms 秒开缩略图，手机在线时按需直传 4K 原图无缝热替换，支持键盘左右键快速切图与自由放大旋转。</p>
          </div>

          <!-- Feature 5: GPS Footprint Map -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-cyan">🗺️</div>
            <h3>{{ t.features.f5.title }}</h3>
            <p>{{ t.features.f5.desc }}</p>
          </div>

          <!-- Feature 6: Auto Update & Deduplication -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-emerald">🧹</div>
            <h3>智能相似图去重 & 双端同步清理</h3>
            <p>基于余弦相似度质心聚类算法定位重复抓拍，电脑端一键删除并联动通过 WebRTC 信令安全删除手机系统相册原片。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== AI ECOSYSTEM & INTERACTIVE SEARCH ==================== -->
    <section id="ai-ecosystem" class="section-padding" style="background: rgba(10, 15, 30, 0.4);">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill">AI ECOSYSTEM</div>
          <h2 class="section-title">端侧多模态 AI 智能相册引擎</h2>
          <p class="section-subtitle">所有 AI 运算均在 PC 端 CPU/GPU 及 WASM SIMD 多线程上本地运行，保障极致速度与绝对隐私</p>
        </div>

        <!-- AI Illustration Banner -->
        <div class="ai-banner-frame glass-panel" style="margin-bottom: 40px;">
          <img src="/ai_features.jpg" alt="ShareCLIP AI Features Showcase" class="ai-banner-img" />
        </div>

        <!-- Interactive AI Semantic Search Simulator -->
        <div class="glass-panel interactive-ai-box">
          <div class="interactive-ai-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 22px;">🔍</span>
              <div>
                <h3 style="font-size: 18px; font-weight: 700; margin: 0; color: #fff;">自然语言语义搜图体验 (Interactive CLIP Simulation)</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">输入或点击下方预设关键词，体验 MobileCLIP 512-D 向量空间语义检索能力：</p>
              </div>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="ai-search-bar">
            <span style="font-size: 18px; color: #a855f7;">🔍</span>
            <input 
              v-model="aiSearchQuery" 
              type="text" 
              placeholder="输入如：海边日落、在草地奔跑的金毛、发票收据..."
              class="ai-search-input"
              @keydown.enter="runAiSearch"
            />
            <button class="btn btn-primary" style="padding: 8px 18px; font-size: 13px;" @click="runAiSearch">
              语义检索
            </button>
          </div>

          <!-- Preset Chips -->
          <div class="preset-chips-row">
            <span style="font-size: 12px; color: var(--text-muted); align-self: center;">推荐测试词：</span>
            <button 
              v-for="preset in presetQueries" 
              :key="preset.text" 
              class="preset-chip"
              :class="{ active: aiSearchQuery === preset.text }"
              @click="setSearchQuery(preset.text)"
            >
              {{ preset.icon }} {{ preset.text }}
            </button>
          </div>

          <!-- Match Results Grid -->
          <div class="ai-results-grid">
            <div 
              v-for="item in simulatedResults" 
              :key="item.name" 
              class="ai-result-card"
            >
              <div class="ai-card-img-wrap">
                <img :src="item.img" :alt="item.name" class="ai-card-img" />
                <span class="ai-score-badge" :style="{ background: item.score >= 0.85 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(168, 85, 247, 0.85)' }">
                  匹配度: {{ (item.score * 100).toFixed(1) }}%
                </span>
              </div>
              <div class="ai-card-meta">
                <span class="ai-card-name">{{ item.name }}</span>
                <span class="ai-card-tag">🏷️ {{ item.tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== HANDSHAKE SIMULATOR ==================== -->
    <section id="simulator" class="section-padding">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill">INTERACTIVE DEMO</div>
          <h2 class="section-title">{{ t.simulator.title }}</h2>
          <p class="section-subtitle">{{ t.simulator.subtitle }}</p>
        </div>

        <div class="glass-panel simulator-card">
          <!-- Stepper Headers -->
          <div class="stepper-row">
            <div class="step-item" :class="{ active: currentStep >= 1, completed: currentStep > 1 }" @click="setStep(1)">
              <span class="step-num">1</span>
              <span class="step-label">{{ t.simulator.s1 }}</span>
            </div>
            <div class="step-line" :class="{ filled: currentStep > 1 }"></div>
            <div class="step-item" :class="{ active: currentStep >= 2, completed: currentStep > 2 }" @click="setStep(2)">
              <span class="step-num">2</span>
              <span class="step-label">{{ t.simulator.s2 }}</span>
            </div>
            <div class="step-line" :class="{ filled: currentStep > 2 }"></div>
            <div class="step-item" :class="{ active: currentStep >= 3, completed: currentStep > 3 }" @click="setStep(3)">
              <span class="step-num">3</span>
              <span class="step-label">{{ t.simulator.s3 }}</span>
            </div>
            <div class="step-line" :class="{ filled: currentStep > 3 }"></div>
            <div class="step-item" :class="{ active: currentStep >= 4 }" @click="setStep(4)">
              <span class="step-num">4</span>
              <span class="step-label">{{ t.simulator.s4 }}</span>
            </div>
          </div>

          <!-- Stepper Content Grid -->
          <div class="simulator-content-grid">
            <div class="simulator-view">
              <!-- Step 1 View: QR Code -->
              <div v-if="currentStep === 1" class="step-view-center">
                <div class="sim-qr-box">
                  <div class="sim-qr-matrix"></div>
                  <div class="sim-qr-overlay">📸 手机扫码配对</div>
                </div>
                <div class="sim-view-text">
                  <h4>{{ t.simulator.qrText }}</h4>
                  <p>{{ t.simulator.qrSub }}</p>
                </div>
              </div>

              <!-- Step 2 View: BLE Handshake Terminal Logs -->
              <div v-else-if="currentStep === 2" class="step-view-center" style="width: 100%;">
                <div class="phone-log-mock">
                  <div class="log-mock-header">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                    <span>📡 BLE GATT 蓝牙信令通道控制台</span>
                  </div>
                  <div class="log-mock-body">
                    <div v-for="(log, idx) in simLogs" :key="idx" class="log-line">{{ log }}</div>
                    <div class="log-cursor">_</div>
                  </div>
                </div>
                <div class="sim-view-text">
                  <h4>{{ t.simulator.bleText }}</h4>
                  <p>{{ t.simulator.bleSub }}</p>
                </div>
              </div>

              <!-- Step 3 View: Connection Established -->
              <div v-else-if="currentStep === 3" class="step-view-center">
                <div class="success-portal">
                  <div class="pulse-ring ring-1"></div>
                  <div class="pulse-ring ring-2"></div>
                  <span class="success-icon">🟢</span>
                </div>
                <div class="sim-view-text">
                  <h4>{{ t.simulator.connectedText }}</h4>
                  <p>{{ t.simulator.connectedSub }}</p>
                </div>
              </div>

              <!-- Step 4 View: Transfer animation -->
              <div v-else-if="currentStep === 4" class="step-view-center" style="width: 100%;">
                <div class="transfer-simulator-box">
                  <!-- PC Side -->
                  <div class="sim-device">
                    <span class="dev-emoji">🖥️</span>
                    <span>电脑端 (Desktop)</span>
                  </div>

                  <!-- Flowing packets stream -->
                  <div class="sim-flow-line">
                    <div class="flow-dot" :class="{ 'flow-left-to-right': flowDir === 'pc-to-phone', 'flow-right-to-left': flowDir === 'phone-to-pc' }">
                      📦
                    </div>
                  </div>

                  <!-- Phone Side -->
                  <div class="sim-device">
                    <span class="dev-emoji">📱</span>
                    <span>手机端 (Android)</span>
                  </div>
                </div>
                
                <div class="transfer-controls">
                  <button class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;" @click="simulateTransfer('pc-to-phone')">
                    {{ t.simulator.pcToPhone }}
                  </button>
                  <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px;" @click="simulateTransfer('phone-to-pc')">
                    {{ t.simulator.phoneToPc }}
                  </button>
                </div>

                <div class="sim-view-text" style="margin-top: 14px;">
                  <h4>{{ t.simulator.flowText }}</h4>
                  <p>{{ t.simulator.flowSub }}</p>
                </div>
              </div>
            </div>

            <!-- Explainer text side -->
            <div class="simulator-explainer">
              <h3 style="color: var(--text-main); font-size: 16px; margin-bottom: 12px;">💡 核心技术机制：</h3>
              <div class="explainer-desc">
                <p v-if="currentStep === 1">
                  <strong>1. 零配置扫码接入</strong><br/>
                  电脑生成动态二维码，内嵌 PC 的 BLE MAC 地址、GATT Service UUID 及 32-bit 会话密钥。手机扫码即可直接锁定目标，无需繁琐的传统蓝牙配对。
                </p>
                <p v-else-if="currentStep === 2">
                  <strong>2. 蓝牙信令分片规避 MTU 限制</strong><br/>
                  双方通过 GATT 特征值交换 WebRTC SDP Offer/Answer 及 ICE Candidates。内置 80ms 节流队列与分片校验，彻底解决 Windows BLE 丢包痛点。
                </p>
                <p v-else-if="currentStep === 3">
                  <strong>3. 切换千兆 Wi-Fi 局域网传输</strong><br/>
                  P2P 直连通道建立完毕后，蓝牙信令通道自动静默，全速切换至本地 Wi-Fi Socket，彻底释放千兆带宽性能。
                </p>
                <p v-else-if="currentStep === 4">
                  <strong>4. 16-Byte 自定义包头与流式组包</strong><br/>
                  文件切分为 32KB 二进制 Chunk，首部携带 16 字节协议头（FileId, Offset, TotalLen），支持断点保护与背压缓冲控制。
                </p>
              </div>
              <div class="simulator-actions">
                <button class="btn btn-outline" style="width: 100%; justify-content: center;" @click="nextStep">
                  {{ currentStep < 4 ? t.simulator.next : t.simulator.reset }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== COMPARISON SECTION ==================== -->
    <section id="comparison" class="section-padding" style="background: rgba(10, 15, 30, 0.4);">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill">COMPARISON</div>
          <h2 class="section-title">为什么选择 ShareCLIP？</h2>
          <p class="section-subtitle">对比传统公有云相册、社交软件文件传输与物理数据线</p>
        </div>

        <div class="glass-panel comparison-table-wrap">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>对比维度</th>
                <th class="highlight-col">✨ ShareCLIP (本方案)</th>
                <th>☁️ 传统云相册 (iCloud / 百度网盘)</th>
                <th>💬 微信 / QQ 文件传输助手</th>
                <th>🔌 传统 USB 物理数据线</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>传输速度</strong></td>
                <td class="highlight-col"><span class="badge-green">千兆 Wi-Fi 直连 (无上限)</span></td>
                <td>受限于公网带宽与 VIP 限速</td>
                <td>受公网服务器限速 (极慢)</td>
                <td>高速物理直连</td>
              </tr>
              <tr>
                <td><strong>隐私与数据安全</strong></td>
                <td class="highlight-col"><span class="badge-green">100% 本地存储 • 零云端泄露</span></td>
                <td>全量上传第三方云服务器</td>
                <td>数据经过社交平台服务器</td>
                <td>本地存储</td>
              </tr>
              <tr>
                <td><strong>AI 自然语言搜图</strong></td>
                <td class="highlight-col"><span class="badge-green">✅ 本地 MobileCLIP 512-D</span></td>
                <td>需上传云端做 AI 分析</td>
                <td>❌ 无搜图能力</td>
                <td>❌ 仅作为普通 U 盘读取</td>
              </tr>
              <tr>
                <td><strong>人脸聚类与足迹地图</strong></td>
                <td class="highlight-col"><span class="badge-green">✅ 本地 WASM SIMD 聚类</span></td>
                <td>云端分析生物特征</td>
                <td>❌ 无</td>
                <td>❌ 无</td>
              </tr>
              <tr>
                <td><strong>便捷性</strong></td>
                <td class="highlight-col"><span class="badge-green">无线扫码秒连 • 自动同步</span></td>
                <td>需联网登录账号</td>
                <td>需手动逐张点选发送</td>
                <td>需寻找适配数据线连接</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ==================== DOWNLOAD SECTION ==================== -->
    <section id="download" class="section-padding">
      <div class="container">
        <div class="glass-panel download-container">
          <div class="section-header">
            <div class="badge-pill">DOWNLOAD</div>
            <h2 class="section-title">{{ t.download.title }}</h2>
            <p class="section-subtitle">{{ t.download.subtitle }}</p>
          </div>
          
          <div class="download-cards-row">
            <!-- PC Desktop App -->
            <div class="glass-panel glass-panel-hover download-card">
              <img src="/pc_logo.png" alt="ShareCLIP PC" class="download-icon" />
              <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px;">{{ t.download.pc.title }}</h3>
              <p class="download-meta">{{ t.download.pc.meta }}</p>
              <p class="download-desc">{{ t.download.pc.desc }}</p>
              <a 
                href="https://github.com/NovaMindLab/AIShare-Grabber/releases" 
                target="_blank"
                class="btn btn-primary" 
                style="width: 100%; justify-content: center;"
                @click="showDownloadToast('已前往 GitHub Releases 获取 Windows 桌面版')"
              >
                <span>🖥️</span> {{ t.download.pc.btn }}
              </a>
            </div>

            <!-- Android Companion App -->
            <div class="glass-panel glass-panel-hover download-card">
              <img src="/android_logo.png" alt="ShareCLIP Android" class="download-icon" />
              <h3 style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px;">{{ t.download.android.title }}</h3>
              <p class="download-meta">{{ t.download.android.meta }}</p>
              <p class="download-desc">{{ t.download.android.desc }}</p>
              <a 
                href="/app-release.apk" 
                download 
                class="btn btn-secondary" 
                style="width: 100%; justify-content: center;"
                @click="showDownloadToast('Android 安装包 (APK) 已开始极速下载！')"
              >
                <span>📱</span> {{ t.download.android.btn }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Toast Notification -->
    <transition name="fade">
      <div v-if="toastMessage" class="toast-popup glass-panel">
        <span>✨</span> {{ toastMessage }}
      </div>
    </transition>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-content">
        <div class="footer-left">
          <div class="nav-logo">
            <span class="logo-emoji">📸</span>
            <span class="logo-text">Share<span class="gradient-text-purple">CLIP</span></span>
          </div>
          <p class="footer-desc">
            Next-Gen Local AI Photo Management & P2P Cross-Device Wireless Syncing Ecosystem.
          </p>
        </div>

        <div class="footer-right">
          <a href="https://github.com/NovaMindLab/AIShare-Grabber" target="_blank" class="footer-link">GitHub Repository</a>
          <a href="https://github.com/NovaMindLab/AIShare-Grabber/releases" target="_blank" class="footer-link">Releases</a>
          <a href="https://github.com/NovaMindLab/AIShare-Grabber/blob/main/LICENSE" target="_blank" class="footer-link">Apache 2.0 License</a>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>{{ t.footer.copyright }}</span>
        <span>{{ t.footer.privacy }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { languages, messages } from './locales.js';

const currentLocale = ref('zh');
const currentStep = ref(1);
const flowDir = ref('pc-to-phone');
const toastMessage = ref('');

const t = computed(() => messages[currentLocale.value] || messages.zh);

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDownloadToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

// Stepper Simulator Logic
const simLogs = ref([
  "[BLE] PC Server Advertising: 6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  "[BLE] Android Mobile scanned QR & connected via GATT",
  "[SDP] WebRTC Offer generated (1672 bytes) -> chunked into 12 BLE packets",
  "[SDP] Android Answer received -> ICE state: Checking",
  "[P2P] WebRTC DataChannel 'shareclip-data' opened successfully! 🚀"
]);

function setStep(step) {
  currentStep.value = step;
}

function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value++;
  } else {
    currentStep.value = 1;
  }
}

function simulateTransfer(direction) {
  flowDir.value = direction;
}

// AI Semantic Search Simulator Logic
const aiSearchQuery = ref('海边日落');
const presetQueries = [
  { icon: '🌅', text: '海边日落' },
  { icon: '🐕', text: '在草地奔跑的金毛' },
  { icon: '🧾', text: '发票与收据' },
  { icon: '🌃', text: '城市夜景建筑' },
  { icon: '🍜', text: '美味拉面美食' }
];

const mockPhotoDatabase = [
  { name: 'IMG_2026_0818_142.jpg', tag: '风景与日落', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', keywords: ['海边', '日落', '沙滩', '海洋', '晚霞'] },
  { name: 'IMG_2026_0815_098.jpg', tag: '宠物与动物', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&auto=format&fit=crop&q=80', keywords: ['狗', '金毛', '草地', '奔跑', '宠物'] },
  { name: 'IMG_2026_0812_014.jpg', tag: '文档与发票', img: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=80', keywords: ['发票', '收据', '文档', '票据', '账单'] },
  { name: 'IMG_2026_0809_771.jpg', tag: '城市与建筑', img: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop&q=80', keywords: ['城市', '夜景', '建筑', '大楼', '霓虹'] },
  { name: 'IMG_2026_0802_334.jpg', tag: '美食与餐饮', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80', keywords: ['美食', '拉面', '面条', '餐饮', '晚餐'] }
];

const simulatedResults = computed(() => {
  const query = aiSearchQuery.value.trim().toLowerCase();
  return mockPhotoDatabase.map(item => {
    let score = 0.45;
    if (item.keywords.some(k => query.includes(k) || k.includes(query))) {
      score = 0.94 + Math.random() * 0.04;
    } else if (item.tag.toLowerCase().includes(query)) {
      score = 0.88 + Math.random() * 0.05;
    } else {
      score = 0.35 + Math.random() * 0.25;
    }
    return { ...item, score };
  }).sort((a, b) => b.score - a.score);
});

function setSearchQuery(q) {
  aiSearchQuery.value = q;
}

function runAiSearch() {
  // Triggers reactivity
  showDownloadToast(`🔍 MobileCLIP 512-D 向量空间匹配已完成: "${aiSearchQuery.value}"`);
}
</script>

<style scoped>
/* Web Layout Styles */
.web-layout {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5, 8, 20, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  padding: 14px 0;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.logo-emoji {
  font-size: 26px;
}

.logo-text {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #fff;
}

.version-tag {
  font-size: 11px;
  font-weight: 700;
  color: #a855f7;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  padding: 2px 8px;
  border-radius: 99px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s;
}
.nav-link:hover {
  color: #fff;
}

.lang-select-wrapper {
  position: relative;
}

.lang-select {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  font-family: inherit;
}
.lang-select option {
  background: #0f172a;
  color: #fff;
}

/* Hero Section */
.hero-section {
  padding: 80px 0 60px 0;
  text-align: center;
  position: relative;
}

.hero-header-center {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.hero-main-title {
  font-size: 52px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -1.5px;
  color: #fff;
}

.hero-main-desc {
  font-size: 18px;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 760px;
}

.hero-actions-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}

/* 3D Hero Banner Frame */
.hero-banner-frame {
  margin-top: 50px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
  position: relative;
}

.hero-banner-img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-banner-frame:hover .hero-banner-img {
  transform: scale(1.015);
}

.floating-chip {
  position: absolute;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  animation: float 5s ease-in-out infinite;
}

.chip-icon {
  font-size: 24px;
}
.chip-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}
.chip-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.chip-1 { top: 24px; left: 24px; animation-delay: 0s; border-color: rgba(56, 189, 248, 0.3); }
.chip-2 { bottom: 24px; left: 24px; animation-delay: 1.5s; border-color: rgba(168, 85, 247, 0.3); }
.chip-3 { top: 24px; right: 24px; animation-delay: 3s; border-color: rgba(16, 185, 129, 0.3); }

/* Section Generic */
.section-padding {
  padding: 90px 0;
  position: relative;
}

.section-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 50px auto;
}

.section-title {
  font-size: 38px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.8px;
  margin: 14px 0 10px 0;
}

.section-subtitle {
  font-size: 16px;
  color: var(--text-muted);
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  padding: 32px 28px;
  text-align: left;
}

.feature-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 20px;
}

.icon-purple { background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); }
.icon-cyan { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); }
.icon-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }

.feature-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
}

.feature-card p {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* AI Banner & Search Simulator */
.ai-banner-frame {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.ai-banner-img {
  width: 100%;
  height: auto;
  display: block;
}

.interactive-ai-box {
  padding: 32px;
  text-align: left;
}

.ai-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(4, 7, 18, 0.7);
  border: 1px solid rgba(168, 85, 247, 0.4);
  border-radius: 14px;
  padding: 8px 14px;
  margin: 18px 0 14px 0;
  box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15);
}

.ai-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  outline: none;
}

.preset-chips-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.preset-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 5px 12px;
  border-radius: 99px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.preset-chip:hover, .preset-chip.active {
  background: rgba(168, 85, 247, 0.2);
  border-color: #a855f7;
  color: #fff;
}

.ai-results-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.ai-result-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}
.ai-result-card:hover {
  transform: translateY(-4px);
  border-color: rgba(168, 85, 247, 0.35);
}

.ai-card-img-wrap {
  width: 100%;
  height: 120px;
  position: relative;
  overflow: hidden;
}
.ai-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-score-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.ai-card-meta {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ai-card-name {
  font-size: 11px;
  font-weight: 600;
  color: #f8fafc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-card-tag {
  font-size: 10px;
  color: var(--text-muted);
}

/* Simulator Stepper */
.simulator-card {
  padding: 36px;
}

.stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.3s;
}
.step-item.active {
  opacity: 1;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.step-item.active .step-num {
  background: var(--primary);
  border-color: #c084fc;
}

.step-label {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 16px;
  transition: background 0.4s;
}
.step-line.filled {
  background: var(--primary);
}

.simulator-content-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 32px;
  align-items: stretch;
}

.simulator-view {
  background: rgba(5, 8, 20, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-view-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.sim-qr-box {
  width: 140px;
  height: 140px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
}

.sim-qr-matrix {
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(#000 40%, transparent 40%),
    radial-gradient(#000 40%, transparent 40%);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
  opacity: 0.85;
}

.sim-qr-overlay {
  position: absolute;
  bottom: 8px;
  font-size: 11px;
  font-weight: 800;
  background: #a855f7;
  color: #fff;
  padding: 2px 8px;
  border-radius: 99px;
}

/* Terminal Log Mock */
.phone-log-mock {
  width: 100%;
  background: #020617;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 12px;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 12px;
  text-align: left;
}

.log-mock-header {
  background: rgba(255, 255, 255, 0.04);
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 11px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.log-mock-body {
  padding: 14px;
  color: #a7f3d0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-cursor {
  animation: pulse 1s infinite;
  color: #38bdf8;
  font-weight: bold;
}

/* Success Portal */
.success-portal {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  font-size: 44px;
  z-index: 2;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #10b981;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}
.ring-2 { animation-delay: 0.6s; }

@keyframes pulse-ring {
  0% { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(1.8); opacity: 0; }
}

/* Transfer animation */
.transfer-simulator-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 20px;
}

.sim-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}
.dev-emoji { font-size: 38px; }

.sim-flow-line {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 20px;
  position: relative;
  border-radius: 2px;
}

.flow-dot {
  position: absolute;
  top: -12px;
  font-size: 20px;
}
.flow-left-to-right {
  animation: travel-right 1.8s infinite linear;
}
.flow-right-to-left {
  animation: travel-left 1.8s infinite linear;
}

@keyframes travel-right {
  0% { left: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 90%; opacity: 0; }
}
@keyframes travel-left {
  0% { left: 90%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 0%; opacity: 0; }
}

.transfer-controls {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.simulator-explainer {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
}

.explainer-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.7;
}

/* Comparison Table */
.comparison-table-wrap {
  overflow-x: auto;
  padding: 10px;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.comparison-table th, .comparison-table td {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.comparison-table th {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.highlight-col {
  background: rgba(168, 85, 247, 0.08);
  color: #fff;
  font-weight: 700;
  border-left: 1px solid rgba(168, 85, 247, 0.2);
  border-right: 1px solid rgba(168, 85, 247, 0.2);
}

.badge-green {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #34d399;
}

/* Download Section */
.download-container {
  padding: 50px 30px;
  border-radius: 28px;
}

.download-cards-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  max-width: 900px;
  margin: 0 auto;
}

.download-card {
  padding: 36px 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.download-icon {
  width: 72px;
  height: 72px;
  margin-bottom: 18px;
}

.download-meta {
  font-size: 13px;
  color: #a855f7;
  font-weight: 700;
  margin-bottom: 10px;
}

.download-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
  flex: 1;
}

/* Toast */
.toast-popup {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  border-color: #a855f7;
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

/* Footer */
.footer {
  border-top: 1px solid var(--border-light);
  background: #020612;
  padding: 60px 0 30px 0;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 30px;
}

.footer-desc {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 380px;
  margin-top: 10px;
  line-height: 1.6;
}

.footer-right {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.footer-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}
.footer-link:hover {
  color: #fff;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-subtle);
  flex-wrap: wrap;
  gap: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .ai-results-grid { grid-template-columns: repeat(3, 1fr); }
  .simulator-content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .hero-main-title { font-size: 36px; }
  .features-grid { grid-template-columns: 1fr; }
  .download-cards-row { grid-template-columns: 1fr; }
  .ai-results-grid { grid-template-columns: repeat(2, 1fr); }
  .floating-chip { display: none; }
}
</style>
