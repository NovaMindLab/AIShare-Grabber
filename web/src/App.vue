<template>
  <div class="web-layout">
    <!-- Navbar -->
    <header class="navbar">
      <div class="container nav-container">
        <div class="nav-logo">
          <span class="logo-emoji">📸</span>
          <span class="logo-text">Share<span class="purple-highlight">CLIP</span></span>
        </div>
        <nav class="nav-links">
          <a href="#features" class="nav-link">{{ t.nav.features }}</a>
          <a href="#simulator" class="nav-link">{{ t.nav.simulator }}</a>
          <a href="#tech" class="nav-link">{{ t.nav.tech }}</a>
          <a href="#download" class="btn btn-primary nav-btn">{{ t.nav.download }}</a>
          
          <!-- Dropdown Language Selector -->
          <select v-model="currentLocale" class="lang-select">
            <option v-for="(name, code) in languages" :key="code" :value="code">
              {{ name }}
            </option>
          </select>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="badge-new">{{ t.hero.badge }}</div>
          <h1 class="hero-title" style="white-space: pre-line;">
            {{ t.hero.title }}
          </h1>
          <p class="hero-description">
            {{ t.hero.desc }}
          </p>
          <div class="hero-actions">
            <a href="#download" class="btn btn-primary">
              <span>📥</span> {{ t.hero.getClient }}
            </a>
            <a href="#simulator" class="btn btn-outline">
              <span>⚡</span> {{ t.hero.simulate }}
            </a>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-container">
            <!-- Glow Backdrops -->
            <div class="glow glow-purple"></div>
            <div class="glow glow-green"></div>

            <div class="devices-row">
              <!-- PC App Card -->
              <div class="device-card pc-card float-animation">
                <div class="card-header">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                  <span class="header-title">ShareCLIP Desktop</span>
                </div>
                <div class="card-body">
                  <img src="/pc_logo.png" alt="PC Logo" class="app-icon" />
                  <h3>桌面管理端</h3>
                  <p>BLE GATT Server / WebRTC Receiver</p>
                  <span class="status-tag tag-advertising">STATUS: ADVERTISING</span>
                </div>
              </div>

              <!-- Connection Beam -->
              <div class="connection-beam pulse-animation">
                <div class="beam-line"></div>
                <span class="beam-icon">📡</span>
              </div>

              <!-- Mobile App Card -->
              <div class="device-card mobile-card float-animation" style="animation-delay: 1.5s;">
                <div class="card-header">
                  <span class="header-title">ShareCLIP Mobile</span>
                </div>
                <div class="card-body">
                  <img src="/android_logo.png" alt="Android Logo" class="app-icon" />
                  <h3>手机同步端</h3>
                  <p>BLE Scanner / WebRTC Initiator</p>
                  <span class="status-tag tag-scanning">SCANNING...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Features Grid -->
    <section id="features" class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">{{ t.features.title }}</h2>
          <p class="section-subtitle">{{ t.features.subtitle }}</p>
        </div>

        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="glass-panel glass-panel-hover feature-card">
            <span class="feature-emoji">⚡</span>
            <h3>{{ t.features.f1.title }}</h3>
            <p>{{ t.features.f1.desc }}</p>
          </div>

          <!-- Feature 2 -->
          <div class="glass-panel glass-panel-hover feature-card">
            <span class="feature-emoji">🚀</span>
            <h3>{{ t.features.f2.title }}</h3>
            <p>{{ t.features.f2.desc }}</p>
          </div>

          <!-- Feature 3 -->
          <div class="glass-panel glass-panel-hover feature-card">
            <span class="feature-emoji">🧠</span>
            <h3>{{ t.features.f3.title }}</h3>
            <p>{{ t.features.f3.desc }}</p>
          </div>

          <!-- Feature 4 -->
          <div class="glass-panel glass-panel-hover feature-card">
            <span class="feature-emoji">📤</span>
            <h3>{{ t.features.f4.title }}</h3>
            <p>{{ t.features.f4.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Handshake Simulator -->
    <section id="simulator" class="simulator-section">
      <div class="container">
        <div class="section-header">
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

          <!-- Stepper Content -->
          <div class="simulator-content-grid">
            <div class="simulator-view">
              <!-- Step 1 View: QR -->
              <div v-if="currentStep === 1" class="step-view-center">
                <div class="sim-qr-box">
                  <div class="sim-qr-overlay">📸 Scan Me</div>
                  <!-- Mock QR Grid pattern -->
                  <div class="sim-qr-matrix"></div>
                </div>
                <div class="sim-view-text">
                  <h4>{{ t.simulator.qrText }}</h4>
                  <p>{{ t.simulator.qrSub }}</p>
                </div>
              </div>

              <!-- Step 2 View: BLE Logs -->
              <div v-else-if="currentStep === 2" class="step-view-center" style="width: 100%;">
                <div class="phone-log-mock">
                  <div class="log-mock-header">📱 手机端 & 🖥️ 电脑端蓝牙信令通道</div>
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

              <!-- Step 3 View: Connection Success -->
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
                  <!-- Device representation -->
                  <div class="sim-device">
                    <span class="dev-emoji">🖥️</span>
                    <span>电脑端</span>
                  </div>

                  <!-- Flowing packets -->
                  <div class="sim-flow-line">
                    <div class="flow-dot" :class="{ 'flow-left-to-right': flowDir === 'pc-to-phone', 'flow-right-to-left': flowDir === 'phone-to-pc' }">
                      🖼️
                    </div>
                  </div>

                  <div class="sim-device">
                    <span class="dev-emoji">📱</span>
                    <span>手机端</span>
                  </div>
                </div>
                
                <div class="transfer-controls">
                  <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" @click="simulateTransfer('pc-to-phone')">
                    {{ t.simulator.pcToPhone }}
                  </button>
                  <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" @click="simulateTransfer('phone-to-pc')">
                    {{ t.simulator.phoneToPc }}
                  </button>
                </div>

                <div class="sim-view-text" style="margin-top: 12px;">
                  <h4>{{ t.simulator.flowText }}</h4>
                  <p>{{ t.simulator.flowSub }}</p>
                </div>
              </div>
            </div>

            <!-- Explainer text side -->
            <div class="simulator-explainer">
              <h3>流程详情：</h3>
              <div class="explainer-desc">
                <p v-if="currentStep === 1">
                  <strong>💡 {{ t.simulator.s1 }}</strong><br/>
                  {{ t.simulator.qrText }}<br/>
                  <code>{"bleMac": "90:09:DF:CB:0E:66", "serviceUuid": "6e400001", "sessionId": "5546"}</code><br/>
                  {{ t.simulator.qrSub }}
                </p>
                <p v-else-if="currentStep === 2">
                  <strong>💡 {{ t.simulator.s2 }}</strong><br/>
                  {{ t.simulator.bleText }}<br/>
                  {{ t.simulator.bleSub }}
                </p>
                <p v-else-if="currentStep === 3">
                  <strong>💡 {{ t.simulator.s3 }}</strong><br/>
                  {{ t.simulator.connectedText }}<br/>
                  {{ t.simulator.connectedSub }}
                </p>
                <p v-else-if="currentStep === 4">
                  <strong>💡 {{ t.simulator.s4 }}</strong><br/>
                  {{ t.simulator.flowText }}<br/>
                  {{ t.simulator.flowSub }}
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

    <!-- Technical Architecture -->
    <section id="tech" class="tech-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">{{ t.tech.title }}</h2>
          <p class="section-subtitle">{{ t.tech.subtitle }}</p>
        </div>

        <div class="tech-grid">
          <div class="glass-panel tech-card">
            <h4>{{ t.tech.t1.title }}</h4>
            <p>{{ t.tech.t1.desc }}</p>
            <div class="tech-tip">
              {{ t.tech.t1.solution }}
            </div>
          </div>

          <div class="glass-panel tech-card">
            <h4>{{ t.tech.t2.title }}</h4>
            <p>{{ t.tech.t2.desc }}</p>
            <div class="tech-tip">
              {{ t.tech.t2.solution }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Download Section -->
    <section id="download" class="download-section">
      <div class="container download-container glass-panel">
        <div class="glow glow-purple" style="top: -50px; left: -50px;"></div>
        <div class="glow glow-green" style="bottom: -50px; right: -50px;"></div>

        <h2 class="download-title">{{ t.download.title }}</h2>
        <p class="download-subtitle">{{ t.download.subtitle }}</p>
        
        <div class="download-cards-row">
          <!-- PC Download -->
          <div class="download-card">
            <img src="/pc_logo.png" alt="PC App" class="download-icon" />
            <h3>{{ t.download.pc.title }}</h3>
            <p class="download-meta">{{ t.download.pc.meta }}</p>
            <p class="download-desc">{{ t.download.pc.desc }}</p>
            <a href="#" class="btn btn-primary" @click.prevent="showDownloadToast('Windows 桌面端安装包已开始下载 (Mock)')">
              <span>🖥️</span> {{ t.download.pc.btn }}
            </a>
          </div>

          <!-- Android Download -->
          <div class="download-card">
            <img src="/android_logo.png" alt="Android App" class="download-icon" />
            <h3>{{ t.download.android.title }}</h3>
            <p class="download-meta">{{ t.download.android.meta }}</p>
            <p class="download-desc">{{ t.download.android.desc }}</p>
            <!-- Real local path to APK -->
            <a href="/app-release.apk" class="btn btn-secondary" download>
              <span>📱</span> {{ t.download.android.btn }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-content">
        <p>{{ t.footer.copyright }}</p>
        <p>{{ t.footer.privacy }}</p>
      </div>
    </footer>

    <!-- Toast message -->
    <div v-if="toastMessage" class="toast-box">
      <span>🔔</span> {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted, computed, onMounted } from 'vue';
import { locales, languages } from './locales.js';

// Language selection reactive state
const currentLocale = ref('zh');
const t = computed(() => locales[currentLocale.value] || locales.en);

// Auto-detect browser language
onMounted(() => {
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang) {
    const code = browserLang.toLowerCase().split('-')[0];
    if (locales[code]) {
      currentLocale.value = code;
    } else if (locales[browserLang]) {
      currentLocale.value = browserLang;
    }
  }
});

const currentStep = ref(1);
const simLogs = ref([]);
const flowDir = ref('idle');
const toastMessage = ref('');
let logTimer = null;

const stepLogs = {
  1: [
    "[BLE STATUS] 状态变更: advertising",
    "[GATT Service] Service UUID: 6e400001, Char UUID: 6e400002",
    "GATT 广播成功! MAC: 90:09:DF:CB:0E:66, Session: 5546"
  ],
  2: [
    "[BLE STATUS] 状态变更: connected",
    "Received BLE write: START:5546:4",
    "Offer SDP incoming. Expecting 4 chunks.",
    "Received BLE write: CHUNK:5546:0:v=0...",
    "Received BLE write: CHUNK:5546:1:TP webrtc-datachannel...",
    "Received BLE write: END:5546",
    "Successfully reassembled Offer SDP (Length: 470B)",
    "Applied Remote Description (Offer)",
    "Pacing Answer SDP in 4 chunks over BLE notifications queue.",
    "Finished queuing Answer SDP.",
    "Successfully notified BLE: START:5546:4",
    "Successfully notified BLE: CHUNK:5546:0:v=0...",
    "Successfully notified BLE: END:5546",
    "Notified remote ICE Candidate: 192.168.31.100:50000"
  ],
  3: [
    "WebRTC ConnectionState changed to: connecting",
    "WebRTC local ICE candidates exchange complete",
    "WebRTC ConnectionState changed to: connected",
    "🟢 WebRTC 数据通道 'photo_sync' 已开启!"
  ],
  4: [
    "双向通道完全就绪！",
    "提示：你可以点击下方按钮模拟双向图片的分片流控传输过程。"
  ]
};

// Set stepper step
function setStep(step) {
  currentStep.value = step;
  simLogs.value = [];
  clearInterval(logTimer);
  
  if (step === 2) {
    // Stream logs inside simulator log terminal
    let idx = 0;
    const logs = stepLogs[2];
    simLogs.value.push(logs[idx++]);
    
    logTimer = setInterval(() => {
      if (idx < logs.length) {
        simLogs.value.push(logs[idx++]);
      } else {
        clearInterval(logTimer);
      }
    }, 450);
  } else {
    simLogs.value = stepLogs[step] || [];
  }
}

// Auto transition on step change
function nextStep() {
  if (currentStep.value < 4) {
    setStep(currentStep.value + 1);
  } else {
    setStep(1);
  }
}

// Simulate transfer flow dot animation
function simulateTransfer(direction) {
  flowDir.value = 'idle';
  setTimeout(() => {
    flowDir.value = direction;
    showDownloadToast(direction === 'pc-to-phone' ? '📤 正在从 PC 端分片发送图片到手机相册...' : '📥 正在从手机端分片发送图片到 PC Ingestion...');
  }, 50);
}

// Show notification toast
function showDownloadToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 3000);
}

onUnmounted(() => {
  clearInterval(logTimer);
});
</script>

<style>
/* CSS layout and layouts specifics to App.vue */

.web-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(7, 10, 19, 0.7);
  border-bottom: 1px solid var(--border-light);
  height: 70px;
  display: flex;
  align-items: center;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 800;
  color: white;
  letter-spacing: 0.5px;
}

.purple-highlight {
  color: var(--primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease-in-out;
}
.nav-link:hover {
  color: white;
}

.nav-btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 8px;
}

/* Lang Dropdown Select */
.lang-select {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-light);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  margin-left: 12px;
  transition: border-color 0.2s;
}
.lang-select:hover {
  border-color: var(--primary);
}
.lang-select option {
  background: #0f172a;
  color: white;
}

/* Hero Section */
.hero-section {
  padding: 80px 0;
  position: relative;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 48px;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-actions {
    justify-content: center;
  }
}

.badge-new {
  display: inline-block;
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  margin-bottom: 20px;
}

.hero-title {
  font-size: 46px;
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}

.hero-description {
  font-size: 16px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.visual-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 380px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.glow {
  position: absolute;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.45;
}

.glow-purple {
  background: var(--primary);
  top: 10%;
  left: 10%;
}

.glow-green {
  background: var(--secondary);
  bottom: 10%;
  right: 10%;
}

.devices-row {
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1;
  width: 100%;
}

.device-card {
  flex: 1;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
}

.card-header {
  border-bottom: 1px solid var(--border-light);
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.header-title {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  margin-left: 4px;
}

.card-body {
  padding: 20px 12px;
  text-align: center;
}

.app-icon {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.card-body h3 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
}

.card-body p {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.status-tag {
  display: inline-block;
  font-size: 8px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.tag-advertising {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.tag-scanning {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.connection-beam {
  width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.beam-line {
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
  box-shadow: 0 0 8px var(--primary);
}

.beam-icon {
  font-size: 16px;
  margin-top: 4px;
}

/* Features Grid */
.features-section {
  padding: 80px 0;
  background: rgba(15, 23, 42, 0.2);
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px auto;
}

.section-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-card {
  padding: 32px 24px;
  text-align: left;
}

.feature-emoji {
  font-size: 36px;
  display: inline-block;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.feature-card p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* Simulator Section */
.simulator-section {
  padding: 80px 0;
}

.simulator-card {
  padding: 32px;
}

.stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding: 0 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  z-index: 10;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1e293b;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.step-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.step-item.active .step-num {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  box-shadow: 0 0 12px var(--primary-glow);
}

.step-item.active .step-label {
  color: white;
  font-weight: 700;
}

.step-item.completed .step-num {
  background: var(--secondary);
  color: white;
  border-color: var(--secondary);
}

.step-line {
  flex: 1;
  height: 2px;
  background: #1e293b;
  margin: 0 12px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}
.step-line.filled {
  background: var(--secondary);
}

.simulator-content-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 32px;
  align-items: center;
}

@media (max-width: 800px) {
  .simulator-content-grid {
    grid-template-columns: 1fr;
  }
  .stepper-row {
    overflow-x: auto;
  }
}

.simulator-view {
  background: #090d16;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.step-view-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.sim-qr-box {
  width: 110px;
  height: 110px;
  background: white;
  border-radius: 8px;
  padding: 6px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sim-qr-overlay {
  position: absolute;
  background: rgba(0,0,0,0.85);
  color: white;
  font-size: 8px;
  font-weight: 700;
  padding: 4px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.sim-qr-matrix {
  width: 100%;
  height: 100%;
  background-image: radial-gradient(black 30%, transparent 30%);
  background-size: 6px 6px;
  opacity: 0.8;
}

.sim-view-text h4 {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
  color: white;
}

.sim-view-text p {
  font-size: 11px;
  color: var(--text-muted);
}

/* Mock Log Terminal */
.phone-log-mock {
  width: 100%;
  height: 180px;
  background: rgba(0,0,0,0.85);
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.05);
  text-align: left;
  font-family: monospace;
  font-size: 10px;
  display: flex;
  flex-direction: column;
}

.log-mock-header {
  background: #0f172a;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding: 4px 10px;
  font-size: 9px;
  color: var(--text-muted);
}

.log-mock-body {
  padding: 8px;
  flex: 1;
  overflow-y: auto;
  color: #38bdf8;
  line-height: 1.3;
}

.log-line {
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-cursor {
  display: inline-block;
  animation: pulse 1s infinite;
  color: var(--primary);
}

/* Success portal */
.success-portal {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  font-size: 32px;
  z-index: 10;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #10b981;
  opacity: 0;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
}

.ring-1 {
  animation-delay: 0s;
}

.ring-2 {
  animation-delay: 0.6s;
}

@keyframes pulse-ring {
  0% { transform: scale(0.6); opacity: 0; }
  50% { opacity: 0.6; }
  100% { transform: scale(1.3); opacity: 0; }
}

/* Transfer Simulator view */
.transfer-simulator-box {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 280px;
  margin-bottom: 12px;
}

.sim-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.dev-emoji {
  font-size: 28px;
}

.sim-flow-line {
  flex: 1;
  height: 2px;
  background: #1e293b;
  position: relative;
}

.flow-dot {
  position: absolute;
  top: -12px;
  font-size: 16px;
  opacity: 0;
}

@keyframes fly-right {
  0% { left: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 90%; opacity: 0; }
}

@keyframes fly-left {
  0% { left: 90%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 0%; opacity: 0; }
}

.flow-left-to-right {
  animation: fly-right 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.flow-right-to-left {
  animation: fly-left 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.transfer-controls {
  display: flex;
  gap: 12px;
}

.simulator-explainer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  justify-content: space-between;
}

.simulator-explainer h3 {
  font-size: 18px;
  font-weight: 700;
}

.explainer-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.5;
  flex: 1;
}

/* Tech Section */
.tech-section {
  padding: 80px 0;
  background: rgba(15, 23, 42, 0.25);
  border-top: 1px solid var(--border-light);
}

.tech-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 800px) {
  .tech-grid {
    grid-template-columns: 1fr;
  }
}

.tech-card {
  padding: 24px;
  text-align: left;
}

.tech-card h4 {
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.tech-card p {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 16px;
}

.tech-tip {
  background: rgba(139, 92, 246, 0.08);
  border-left: 3px solid var(--primary);
  padding: 10px 14px;
  border-radius: 0 8px 8px 0;
  font-size: 11.5px;
  color: #c084fc;
}

/* Download Section */
.download-section {
  padding: 80px 0 100px 0;
}

.download-container {
  padding: 48px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.download-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  color: white;
}

.download-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 40px;
}

.download-cards-row {
  display: flex;
  gap: 32px;
  justify-content: center;
  flex-wrap: wrap;
}

.download-card {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 32px 24px;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.download-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.download-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}

.download-meta {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 600;
  margin-bottom: 12px;
}

.download-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 24px;
  height: 54px;
}

.download-card .btn {
  width: 100%;
  justify-content: center;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border-light);
  padding: 32px 0;
  background: #05070c;
  text-align: center;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
  color: #64748B;
}

/* Toast Message */
.toast-box {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid var(--primary);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 20px var(--primary-glow);
  z-index: 9999;
  animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-in {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
