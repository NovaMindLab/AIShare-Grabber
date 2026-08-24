<template>
  <div class="mshare-container">
    <!-- 1. iOS Safe Area Top Navigation -->
    <header class="mshare-header">
      <div class="mshare-brand">
        <img src="/logo.png" alt="ShareCLIP MShare" class="mshare-logo" />
        <div class="mshare-brand-text">
          <span class="mshare-title">Share<span class="gradient-text-purple">CLIP</span></span>
          <span class="mshare-sub-tag">MShare 移动端</span>
        </div>
      </div>

      <div class="mshare-header-actions">
        <!-- Connection Status Pill -->
        <span class="mshare-status-pill" :class="isConnected ? 'status-connected' : (isConnecting ? 'status-connecting' : 'status-disconnected')">
          <span class="status-dot" :class="{ 'pulse-dot': isConnected || isConnecting }"></span>
          {{ isConnected ? `🟢 已连电脑 [${targetSessionId}]` : (isConnecting ? '🟡 正在握手直连...' : '⚪ 未连接电脑') }}
        </span>

        <!-- Switch to PC Receiver Page -->
        <a href="./index.html" class="mshare-link-btn" title="切换到 PC 接收端大屏模式">
          🖥️ PC端
        </a>
      </div>
    </header>

    <!-- 2. Main Viewport -->
    <main class="mshare-main">
      <!-- ==================== VIEW A: DISCONNECTED / SCANNER VIEW ==================== -->
      <section v-if="!isConnected" class="mshare-scanner-section">
        <!-- Scan Guidance Card -->
        <div class="scanner-hero-card glass-panel">
          <div class="scanner-card-header">
            <h2>📷 扫描电脑端二维码直连</h2>
            <p>将 iPhone 摄像头对准电脑屏幕（桌面客户端或 WebShare 网页）上的二维码</p>
          </div>

          <!-- Live WebCam Viewport -->
          <div class="camera-viewport-box">
            <video ref="cameraVideoRef" class="camera-stream" playsinline autoplay muted></video>
            <canvas ref="qrDetectCanvasRef" class="qr-hidden-canvas"></canvas>

            <!-- Overlay Viewfinder Graphics -->
            <div class="scanner-overlay" :class="{ 'scanning-active': isCameraRunning }">
              <div class="viewfinder-frame">
                <div class="corner corner-tl"></div>
                <div class="corner corner-tr"></div>
                <div class="corner corner-bl"></div>
                <div class="corner corner-br"></div>
                <div class="laser-scanner-line" v-if="isCameraRunning"></div>
              </div>
              <div class="scanner-hint-text">
                {{ cameraStatusText }}
              </div>
            </div>

            <!-- Torch / Camera Controls -->
            <div v-if="isCameraRunning" class="camera-controls-bar">
              <button 
                v-if="hasTorch" 
                class="cam-ctrl-btn" 
                :class="{ active: isTorchOn }" 
                @click="toggleTorch"
              >
                {{ isTorchOn ? '🔦 关手电筒' : '💡 开手电筒' }}
              </button>
              <button class="cam-ctrl-btn" @click="restartCamera">
                🔄 重启镜头
              </button>
            </div>
          </div>

          <!-- Camera Toggle Action -->
          <div class="scanner-actions-row">
            <button 
              v-if="!isCameraRunning" 
              class="btn-primary btn-cam-toggle" 
              @click="startCameraScanner"
            >
              <span>📷</span> 开启摄像头扫码
            </button>
            <button 
              v-else 
              class="btn-secondary btn-cam-toggle" 
              @click="stopCameraScanner"
            >
              <span>⏹️</span> 暂停扫码
            </button>
          </div>

          <!-- Divider -->
          <div class="mshare-divider">
            <span>或者手动输入</span>
          </div>

          <!-- Manual 6-Digit Code Input -->
          <div class="manual-code-form">
            <div class="code-input-wrapper">
              <input 
                v-model="manualCodeInput" 
                type="text" 
                placeholder="6 位电脑口令 (如 ABC123)" 
                maxlength="6"
                class="manual-code-input"
                @keyup.enter="handleManualConnect"
              />
              <button 
                class="btn-primary btn-code-submit" 
                :disabled="manualCodeInput.trim().length < 4 || isConnecting"
                @click="handleManualConnect"
              >
                {{ isConnecting ? '连接中...' : '直连 ➔' }}
              </button>
            </div>
          </div>

          <!-- Troubleshooting Settings Toggle -->
          <div class="net-settings-toggle" @click="isSettingsOpen = !isSettingsOpen">
            <span>⚙️ 高级信令与网络设置</span>
            <span class="toggle-arrow">{{ isSettingsOpen ? '▲' : '▼' }}</span>
          </div>

          <div v-if="isSettingsOpen" class="net-settings-panel">
            <div class="setting-item">
              <label>📡 自定义信令服务器 (WebSocket):</label>
              <input 
                v-model="customSignalingUrl" 
                type="text" 
                placeholder="wss://..." 
                class="setting-input"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== VIEW B: CONNECTED MOBILE CONTROLLER ==================== -->
      <section v-else class="mshare-connected-section">
        <!-- Connected Status Banner -->
        <div class="connected-dash-card glass-panel">
          <div class="dash-top-row">
            <div class="dash-device-info">
              <span class="dash-device-icon">💻</span>
              <div>
                <div class="dash-pc-name">已连接电脑: {{ targetSessionId }}</div>
                <div class="dash-pc-meta">局域网 WebRTC DataChannel (千兆直连)</div>
              </div>
            </div>
            <button class="btn-disconnect" @click="handleDisconnect" title="断开连接">
              断开
            </button>
          </div>

          <!-- Speed & Queue Metrics -->
          <div class="dash-metrics-grid">
            <div class="metric-item">
              <span class="metric-label">实时上传速度</span>
              <span class="metric-val text-cyan">{{ formatSpeed(currentSpeedKbps) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">待发送队列</span>
              <span class="metric-val text-purple">{{ pendingCount }} 个</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">已成功传输</span>
              <span class="metric-val text-green">{{ completedCount }} 个</span>
            </div>
          </div>
        </div>

        <!-- 3 Big Action Pickers for iOS Touch -->
        <div class="action-picker-grid">
          <!-- Hidden Native Inputs -->
          <input 
            type="file" 
            ref="photoInputRef" 
            multiple 
            accept="image/*" 
            style="display: none;" 
            @change="handleFilesSelected" 
          />
          <input 
            type="file" 
            ref="videoInputRef" 
            multiple 
            accept="video/*" 
            style="display: none;" 
            @change="handleFilesSelected" 
          />
          <input 
            type="file" 
            ref="fileInputRef" 
            multiple 
            accept="*/*" 
            style="display: none;" 
            @change="handleFilesSelected" 
          />

          <!-- Action Card 1: Photos (Multi-select / Live Photo / RAW) -->
          <div class="picker-card glass-panel" @click="$refs.photoInputRef.click()">
            <div class="picker-icon-box bg-purple-glow">📸</div>
            <div class="picker-content">
              <h3>发送相册照片</h3>
              <p>支持多选、Live Photo 原图与 4K 高清原画直传</p>
            </div>
            <span class="picker-arrow">➔</span>
          </div>

          <!-- Action Card 2: Videos (4K Chunked Streaming) -->
          <div class="picker-card glass-panel" @click="$refs.videoInputRef.click()">
            <div class="picker-icon-box bg-cyan-glow">🎥</div>
            <div class="picker-content">
              <h3>发送高清视频</h3>
              <p>支持 4K 大视频 64KB 流式分块直传，背压保护不卡顿</p>
            </div>
            <span class="picker-arrow">➔</span>
          </div>

          <!-- Action Card 3: Any Documents / Files -->
          <div class="picker-card glass-panel" @click="$refs.fileInputRef.click()">
            <div class="picker-icon-box bg-green-glow">📁</div>
            <div class="picker-content">
              <h3>发送文件 / 压缩包</h3>
              <p>从 iPhone 文件 App 中选取文档、音频或压缩包</p>
            </div>
            <span class="picker-arrow">➔</span>
          </div>
        </div>

        <!-- Realtime Sending Queue Panel -->
        <div v-if="fileQueue.length > 0" class="queue-container glass-panel">
          <div class="queue-header">
            <div class="queue-header-left">
              <h4>📋 传输任务队列 ({{ fileQueue.length }})</h4>
              <span class="queue-total-size">共 {{ formatBytes(totalQueueBytes) }}</span>
            </div>
            <div class="queue-header-actions">
              <button 
                v-if="completedCount > 0" 
                class="btn-text-action" 
                @click="clearCompletedFiles"
              >
                🧹 清理已完成
              </button>
            </div>
          </div>

          <div class="queue-list">
            <div 
              v-for="item in fileQueue" 
              :key="item.id" 
              class="queue-item"
              :class="`status-${item.status}`"
            >
              <!-- Left Thumbnail / Icon -->
              <div class="item-thumb-box">
                <img v-if="item.previewUrl" :src="item.previewUrl" class="item-thumb-img" alt="Preview" />
                <span v-else class="item-type-icon">
                  {{ item.type.startsWith('video/') ? '🎥' : (item.type.startsWith('image/') ? '🖼️' : '📁') }}
                </span>
              </div>

              <!-- Center File Info & Progress -->
              <div class="item-info-center">
                <div class="item-name-row">
                  <span class="item-filename" :title="item.name">{{ item.name }}</span>
                  <span class="item-filesize">{{ formatBytes(item.size) }}</span>
                </div>

                <!-- Progress Bar -->
                <div class="item-progress-track">
                  <div 
                    class="item-progress-bar" 
                    :class="{ 'bar-complete': item.status === 'completed', 'bar-sending': item.status === 'sending' }"
                    :style="{ width: `${item.progress}%` }"
                  ></div>
                </div>

                <!-- Status Row -->
                <div class="item-status-row">
                  <span v-if="item.status === 'sending'" class="status-sending-text">
                    ⚡ 正在发送 {{ item.progress }}% • {{ formatSpeed(currentSpeedKbps) }}
                  </span>
                  <span v-else-if="item.status === 'completed'" class="status-done-text">
                    ✅ 发送成功 (耗时 {{ item.durationSec }}s)
                  </span>
                  <span v-else-if="item.status === 'error'" class="status-error-text">
                    ❌ 传输失败: {{ item.error }}
                  </span>
                  <span v-else class="status-pending-text">
                    ⏳ 排队等待发送...
                  </span>
                </div>
              </div>

              <!-- Right Cancel Action -->
              <div class="item-action-right">
                <button 
                  v-if="item.status === 'pending'" 
                  class="btn-item-cancel" 
                  @click="cancelQueueItem(item.id)" 
                  title="取消任务"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State Prompt -->
        <div v-else class="queue-empty-card glass-panel">
          <span style="font-size: 36px; display: block; margin-bottom: 8px;">✨</span>
          <div style="font-weight: 700; color: #cbd5e1; font-size: 14px;">传输通道已建立就绪</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">点击上方按钮挑选照片或视频，即可毫秒级直传到电脑</div>
        </div>
      </section>

      <!-- Diagnostic Logs Drawer -->
      <div class="mshare-logs-box glass-panel">
        <div class="logs-header" @click="isLogsOpen = !isLogsOpen">
          <span>📡 实时连接与传输日志 ({{ liveLogs.length }})</span>
          <span class="toggle-arrow">{{ isLogsOpen ? '▲' : '▼' }}</span>
        </div>
        <div v-if="isLogsOpen" ref="logContainerRef" class="logs-body">
          <div v-for="(log, idx) in liveLogs" :key="idx" class="log-line">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-text">{{ log.text }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- iOS PWA Guidance Banner -->
    <transition name="fade-slide">
      <div v-if="showIosInstallPrompt" class="ios-install-banner glass-panel">
        <div class="ios-banner-inner">
          <div class="ios-app-icon">
            <img src="/logo.png" alt="App Icon" />
          </div>
          <div class="ios-banner-content">
            <div class="ios-banner-title">
              <span>安装 MShare 到 iPhone 桌面</span>
              <span class="ios-pwa-badge">免证书</span>
            </div>
            <div class="ios-banner-desc">
              点击 Safari 底部 <strong>分享按钮 <span class="share-glyph">⎋</span></strong> ➔ 选择 <strong>「添加到主屏幕」</strong>，随时一键扫码传图！
            </div>
          </div>
          <button class="ios-banner-close" @click="dismissIosPrompt" title="关闭提示">✕</button>
        </div>
        <div class="ios-banner-arrow"></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted, nextTick } from 'vue';
import jsQR from 'jsqr';
import { MShareSender } from './services/mshare_sender.js';
import { getDefaultSignalingUrl } from './services/signaling.js';

// Camera & Scanner States
const cameraVideoRef = ref(null);
const qrDetectCanvasRef = ref(null);
const isCameraRunning = ref(false);
const cameraStatusText = ref('对准电脑屏幕二维码');
const hasTorch = ref(false);
const isTorchOn = ref(false);
let videoTrack = null;
let scanAnimationId = null;

// Connection States
const isConnected = ref(false);
const isConnecting = ref(false);
const targetSessionId = ref('');
const manualCodeInput = ref('');
const customSignalingUrl = ref(getDefaultSignalingUrl());
const isSettingsOpen = ref(false);

// Transmission & Metrics States
const sender = new MShareSender();
const fileQueue = ref([]);
const currentSpeedKbps = ref(0);
const liveLogs = shallowRef([]);
const isLogsOpen = ref(false);
const logContainerRef = ref(null);

// PWA & iOS States
const isIos = ref(false);
const isStandalone = ref(false);
const showIosInstallPrompt = ref(false);

function addLog(text) {
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  const next = [...liveLogs.value, { time, text }];
  if (next.length > 120) next.shift();
  liveLogs.value = next;
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
    }
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(kbps) {
  if (kbps > 1024 * 1024) {
    return `${(kbps / (1024 * 1024)).toFixed(1)} GB/s`;
  } else if (kbps > 1024) {
    return `${(kbps / 1024).toFixed(1)} MB/s`;
  }
  return `${kbps} KB/s`;
}

const pendingCount = computed(() => fileQueue.value.filter(f => f.status === 'pending' || f.status === 'sending').length);
const completedCount = computed(() => fileQueue.value.filter(f => f.status === 'completed').length);
const totalQueueBytes = computed(() => fileQueue.value.reduce((acc, f) => acc + (f.size || 0), 0));

// ==================== CAMERA SCANNER LOGIC ====================
async function startCameraScanner() {
  stopCameraScanner();
  cameraStatusText.value = '正在唤起摄像头...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    if (!cameraVideoRef.value) return;
    cameraVideoRef.value.srcObject = stream;
    await cameraVideoRef.value.play();

    isCameraRunning.value = true;
    cameraStatusText.value = '对准电脑屏幕二维码';
    addLog('📷 后置摄像头启动成功，正在高速识别二维码...');

    // Check torch support
    videoTrack = stream.getVideoTracks()[0];
    const caps = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    hasTorch.value = !!caps.torch;

    // Start 30fps Scan Loop
    scanQrFrameLoop();
  } catch (err) {
    cameraStatusText.value = '无法开启摄像头: ' + err.message;
    addLog(`❌ 开启摄像头失败: ${err.message} (可使用下方手动输入口令)`);
    isCameraRunning.value = false;
  }
}

function stopCameraScanner() {
  if (scanAnimationId) {
    cancelAnimationFrame(scanAnimationId);
    scanAnimationId = null;
  }
  if (cameraVideoRef.value && cameraVideoRef.value.srcObject) {
    const stream = cameraVideoRef.value.srcObject;
    stream.getTracks().forEach(track => track.stop());
    cameraVideoRef.value.srcObject = null;
  }
  isCameraRunning.value = false;
  videoTrack = null;
  isTorchOn.value = false;
}

async function toggleTorch() {
  if (!videoTrack || !hasTorch.value) return;
  try {
    isTorchOn.value = !isTorchOn.value;
    await videoTrack.applyConstraints({
      advanced: [{ torch: isTorchOn.value }]
    });
  } catch (e) {
    console.warn('Failed to toggle torch:', e);
  }
}

function restartCamera() {
  stopCameraScanner();
  setTimeout(() => startCameraScanner(), 300);
}

function scanQrFrameLoop() {
  if (!isCameraRunning.value || !cameraVideoRef.value || !qrDetectCanvasRef.value) return;

  const video = cameraVideoRef.value;
  const canvas = qrDetectCanvasRef.value;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      handleQrCodeDetected(code.data);
      return; // Stop scan loop on success
    }
  }

  scanAnimationId = requestAnimationFrame(scanQrFrameLoop);
}

function handleQrCodeDetected(rawData) {
  addLog(`🎯 扫描到二维码数据: ${rawData}`);
  if (navigator.vibrate) {
    try { navigator.vibrate([50, 50, 50]); } catch (_) {}
  }

  stopCameraScanner();

  // Parse QR content (handles JSON or plain session string)
  let extractedSession = '';
  try {
    const obj = JSON.parse(rawData);
    extractedSession = obj.session_id || obj.web_session_id || obj.code || '';
  } catch (_) {
    // If not JSON, check regex for 6-character session or URL
    const match = rawData.match(/\b([A-Za-z0-9]{4,8})\b/);
    if (match) extractedSession = match[1];
    else extractedSession = rawData.trim();
  }

  if (extractedSession) {
    targetSessionId.value = extractedSession.toUpperCase();
    connectToPc(targetSessionId.value);
  } else {
    alert('无法识别该二维码中的口令，请重试');
    startCameraScanner();
  }
}

// ==================== WEBRTC CONNECTION ====================
function handleManualConnect() {
  const code = manualCodeInput.value.trim().toUpperCase();
  if (!code) return;
  targetSessionId.value = code;
  connectToPc(code);
}

async function connectToPc(code) {
  isConnecting.value = true;
  stopCameraScanner();
  addLog(`🔄 正在与电脑 [${code}] 建立 WebRTC P2P 直连通道...`);

  sender.onLog = (l) => addLog(l);
  sender.onConnected = () => {
    isConnected.value = true;
    isConnecting.value = false;
    addLog(`🎉 与电脑 [${code}] 直连成功！可以开始选取照片与视频。`);
  };
  sender.onDisconnected = () => {
    isConnected.value = false;
    isConnecting.value = false;
    addLog('🔌 与电脑直连通道断开。');
  };
  sender.onSpeedUpdate = (kbps) => {
    currentSpeedKbps.value = kbps;
  };
  sender.onQueueUpdate = (q) => {
    fileQueue.value = q;
  };
  sender.onFileComplete = (item) => {
    addLog(`✅ 文件 [${item.name}] 传输完成！耗时 ${item.durationSec} 秒`);
  };
  sender.onFileError = (item, err) => {
    addLog(`❌ 文件 [${item.name}] 发送失败: ${err.message}`);
  };

  try {
    await sender.connect(code, customSignalingUrl.value);
  } catch (err) {
    isConnecting.value = false;
    addLog(`❌ 连接异常: ${err.message}`);
  }
}

function handleDisconnect() {
  sender.disconnect();
  isConnected.value = false;
  isConnecting.value = false;
  targetSessionId.value = '';
  manualCodeInput.value = '';
  addLog('已手动断开连接。');
}

// ==================== FILE PICKING & QUEUE ====================
function handleFilesSelected(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  addLog(`📥 选中了 ${files.length} 个项目，正在添加至发送队列...`);
  sender.enqueueFiles(files);
  event.target.value = ''; // Reset input for repeated selection
}

function cancelQueueItem(id) {
  sender.cancelFile(id);
}

function clearCompletedFiles() {
  sender.clearCompleted();
}

function dismissIosPrompt() {
  showIosInstallPrompt.value = false;
  try {
    localStorage.setItem('mshare_pwa_dismissed', Date.now().toString());
  } catch (_) {}
}

onMounted(() => {
  // PWA & iOS detection
  try {
    isIos.value = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    isStandalone.value = ('standalone' in window.navigator && window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('mshare_pwa_dismissed');
    if (isIos.value && !isStandalone.value && !dismissed) {
      setTimeout(() => {
        showIosInstallPrompt.value = true;
      }, 1500);
    }
  } catch (_) {}

  // Auto start camera if on mobile device
  setTimeout(() => {
    startCameraScanner();
  }, 400);
});

onUnmounted(() => {
  stopCameraScanner();
  sender.disconnect();
});
</script>

<style scoped>
/* ==================== MSHARE MOBILE LAYOUT ==================== */
.mshare-container {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  background-image: 
    radial-gradient(at 50% 0%, rgba(139, 92, 246, 0.18) 0px, transparent 60%),
    radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.12) 0px, transparent 60%),
    radial-gradient(at 0% 100%, rgba(17, 24, 39, 1) 0px, transparent 100%);
  color: var(--text-primary);
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

/* Header */
.mshare-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: max(14px, env(safe-area-inset-top)) 18px 12px 18px;
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-glass);
}

.mshare-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mshare-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.5);
}

.mshare-brand-text {
  display: flex;
  flex-direction: column;
}

.mshare-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: #fff;
}

.gradient-text-purple {
  background: linear-gradient(135deg, #a855f7 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mshare-sub-tag {
  font-size: 10.5px;
  color: var(--accent-cyan);
  font-weight: 600;
  letter-spacing: 0.2px;
}

.mshare-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mshare-status-pill {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status-connected {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.status-connecting {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.status-disconnected {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.pulse-dot {
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.mshare-link-btn {
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
}

/* Main Body */
.mshare-main {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

/* Scanner Hero Card */
.scanner-hero-card {
  padding: 20px 16px;
  text-align: center;
  border-radius: 22px;
}

.scanner-card-header h2 {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.scanner-card-header p {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 16px;
}

/* Camera Viewport */
.camera-viewport-box {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  max-height: 320px;
  background: #000;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
  margin-bottom: 16px;
}

.camera-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.qr-hidden-canvas {
  display: none;
}

.scanner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.viewfinder-frame {
  position: relative;
  width: 200px;
  height: 200px;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #38bdf8;
  border-style: solid;
}
.corner-tl { top: 0; left: 0; border-width: 3px 0 0 3px; border-top-left-radius: 6px; }
.corner-tr { top: 0; right: 0; border-width: 3px 3px 0 0; border-top-right-radius: 6px; }
.corner-bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-bottom-left-radius: 6px; }
.corner-br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-bottom-right-radius: 6px; }

.laser-scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: linear-gradient(90deg, transparent, #38bdf8, #a855f7, transparent);
  box-shadow: 0 0 12px #38bdf8;
  animation: scan-move 2.2s ease-in-out infinite;
}

@keyframes scan-move {
  0% { top: 4px; opacity: 0.8; }
  50% { top: 190px; opacity: 1; }
  100% { top: 4px; opacity: 0.8; }
}

.scanner-hint-text {
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 12px;
  border-radius: 99px;
  backdrop-filter: blur(8px);
}

.camera-controls-bar {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 10px;
  z-index: 10;
}

.cam-ctrl-btn {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
}
.cam-ctrl-btn.active {
  background: #f59e0b;
  color: #000;
}

.scanner-actions-row {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.btn-cam-toggle {
  width: 100%;
  max-width: 280px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.mshare-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 16px 0;
  color: var(--text-muted);
  font-size: 11.5px;
}
.mshare-divider::before, .mshare-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.mshare-divider span {
  padding: 0 12px;
}

/* Manual Code Input */
.manual-code-form {
  margin-bottom: 12px;
}

.code-input-wrapper {
  display: flex;
  gap: 8px;
}

.manual-code-input {
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.35);
  color: #fff;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  outline: none;
  font-family: var(--font-mono);
}
.manual-code-input:focus {
  border-color: var(--accent-purple);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
}

.btn-code-submit {
  padding: 0 20px;
  font-size: 13.5px;
  font-weight: 700;
  border-radius: 14px;
  white-space: nowrap;
  cursor: pointer;
}

/* Network Settings */
.net-settings-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  font-size: 11.5px;
  color: var(--text-muted);
  cursor: pointer;
  margin-top: 10px;
}
.net-settings-panel {
  margin-top: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  text-align: left;
}
.setting-item label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.setting-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  outline: none;
  font-family: var(--font-mono);
}

/* ==================== CONNECTED CONTROLLER VIEW ==================== */
.connected-dash-card {
  padding: 16px;
  border-radius: 20px;
}

.dash-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dash-device-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dash-device-icon {
  font-size: 24px;
}

.dash-pc-name {
  font-size: 14px;
  font-weight: 800;
  color: #fff;
}

.dash-pc-meta {
  font-size: 11px;
  color: #34d399;
}

.btn-disconnect {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.dash-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
  text-align: center;
}

.metric-item {
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 8px;
  border-radius: 12px;
}

.metric-label {
  display: block;
  font-size: 10.5px;
  color: var(--text-muted);
  margin-bottom: 3px;
}

.metric-val {
  font-size: 14px;
  font-weight: 800;
  font-family: var(--font-mono);
}
.text-cyan { color: #38bdf8; }
.text-purple { color: #c084fc; }
.text-green { color: #34d399; }

/* 3 Big Action Pickers */
.action-picker-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.picker-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.picker-card:hover, .picker-card:active {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(30, 41, 59, 0.7);
}

.picker-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.bg-purple-glow {
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.4);
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.25);
}
.bg-cyan-glow {
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.25);
}
.bg-green-glow {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
}

.picker-content {
  flex: 1;
}
.picker-content h3 {
  font-size: 14.5px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 2px;
}
.picker-content p {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.35;
}

.picker-arrow {
  font-size: 14px;
  color: var(--accent-purple);
  font-weight: 800;
}

/* Queue Container */
.queue-container {
  padding: 16px;
  border-radius: 20px;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.queue-header-left h4 {
  font-size: 13.5px;
  font-weight: 800;
  color: #fff;
}
.queue-total-size {
  font-size: 11px;
  color: var(--text-muted);
}
.btn-text-action {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11.5px;
  cursor: pointer;
}
.btn-text-action:hover {
  color: #fff;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 380px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.item-thumb-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.item-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-type-icon {
  font-size: 20px;
}

.item-info-center {
  flex: 1;
  min-width: 0;
}

.item-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.item-filename {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-filesize {
  font-size: 10.5px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.item-progress-track {
  width: 100%;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 4px;
}
.item-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #38bdf8);
  border-radius: 99px;
  transition: width 0.15s ease-out;
}
.bar-complete {
  background: #10b981 !important;
}

.item-status-row {
  font-size: 10.5px;
}
.status-sending-text { color: #38bdf8; }
.status-done-text { color: #34d399; font-weight: 600; }
.status-error-text { color: #f87171; }
.status-pending-text { color: var(--text-muted); }

.btn-item-cancel {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
}
.btn-item-cancel:hover {
  color: #ef4444;
}

.queue-empty-card {
  padding: 24px 16px;
  text-align: center;
  border-radius: 18px;
}

/* Diagnostic Logs */
.mshare-logs-box {
  padding: 12px 14px;
  border-radius: 16px;
}
.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--text-muted);
  cursor: pointer;
}
.logs-body {
  margin-top: 8px;
  max-height: 140px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 10.5px;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px;
  border-radius: 8px;
}
.log-line {
  margin-bottom: 3px;
  line-height: 1.4;
}
.log-time {
  color: #64748b;
  margin-right: 6px;
}
.log-text {
  color: #cbd5e1;
}

/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: #fff;
  border: none;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  transition: all 0.2s;
}
.btn-primary:active {
  transform: scale(0.98);
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
</style>
