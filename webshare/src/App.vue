<template>
  <div class="webshare-container">
    <!-- 1. Top Navigation Bar -->
    <header class="header-wrapper">
      <div class="brand-logo">
        <img src="/logo.png" alt="ShareCLIP Logo" />
        <span class="brand-title">ShareCLIP WebShare</span>
      </div>

      <div class="header-actions">
        <!-- PWA Install Button (Shown on mobile/iOS when not standalone) -->
        <button 
          v-if="!isStandalone" 
          class="badge-pill btn-pwa-install" 
          @click="showIosInstallPrompt = true" 
          title="添加到手机主屏幕 (PWA)"
        >
          📱 <span class="pwa-label-text">添加到桌面</span>
        </button>

        <!-- AI Engine Status Badge -->
        <span class="badge-pill badge-webgpu" :class="{ 'badge-offline': !aiReady }">
          <span class="status-dot" :class="{ 'pulse-dot': aiReady }"></span>
          {{ aiReady ? `🧠 ${aiProvider.toUpperCase()} 加速 (MobileCLIP-S0)` : '⏳ AI 引擎初始化中...' }}
        </span>

        <!-- WebRTC Connection Badge -->
        <span class="badge-pill" :class="isConnected ? 'badge-online' : 'badge-offline'">
          <span class="status-dot" :class="{ 'pulse-dot': isConnected }"></span>
          {{ isConnected ? '🟢 手机已直连' : '🟡 等待手机扫码' }}
        </span>

        <!-- IndexedDB Storage Info Badge -->
        <span class="badge-pill db-pill" title="本地 IndexedDB 数据持久化">
          💾 本地库: {{ photos.length }} 张
        </span>

        <!-- Clear DB Action -->
        <button class="btn-icon" @click="handleClearData" title="清空本地 IndexedDB 数据">
          🗑️ 清空库
        </button>
      </div>
    </header>

    <!-- 2. Main Body Content -->
    <main class="main-content">
      <!-- Section A: QR Connection Panel (Shown if not connected) -->
      <section v-if="!isConnected" class="qr-hero-card glass-panel pulse-card">
        <div class="qr-hero-left">
          <div class="qr-box">
            <canvas ref="qrCanvas" class="qr-canvas"></canvas>
            <div v-if="!qrReady" class="qr-loading">生成会话中...</div>
          </div>
          <div class="session-code-tag">
            会话口令: <code>{{ sessionId }}</code>
          </div>
          <div v-if="detectedIps.length" class="ip-tag">
            局域网 IP: <code>{{ detectedIps.join(', ') }}</code>
          </div>

          <!-- Network Settings Toggle -->
          <div class="net-settings-toggle" @click="isSettingsOpen = !isSettingsOpen">
            <span>⚙️ 局域网 IP 与信令配置</span>
            <span class="toggle-arrow">{{ isSettingsOpen ? '▲' : '▼' }}</span>
          </div>

          <div v-if="isSettingsOpen" class="net-settings-panel">
            <div class="setting-item">
              <label>🖥️ 电脑局域网 IP (用于手机 Wi-Fi 直连):</label>
              <input 
                v-model="customLanIp" 
                type="text" 
                placeholder="例如: 192.168.1.100" 
                class="setting-input"
                @input="handleIpChange"
              />
            </div>
            <div class="setting-item">
              <label>📡 WebSocket 信令服务器:</label>
              <input 
                v-model="customSignalingUrl" 
                type="text" 
                placeholder="wss://..." 
                class="setting-input"
              />
            </div>
            <button class="btn-primary btn-apply-net" @click="applyNetworkSettings">
              ✓ 应用并刷新二维码
            </button>
          </div>
        </div>

        <div class="qr-hero-right">
          <h2>📱 手机扫码极速互联</h2>
          <p class="subtitle">纯浏览器硬件加速与点对点直连，分析结果自动永久保存至本地 IndexedDB 数据库。</p>

          <div class="step-guide">
            <div class="step-item">
              <span class="step-num">1</span>
              <div>
                <strong>确保手机与电脑在同一个 Wi-Fi 局域网</strong>
                <p>手机与 PC 连接同一路由器或手机热点，以便建立本地高速 P2P 通道</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-num">2</span>
              <div>
                <strong>打开 ShareCLIP 手机 App</strong>
                <p>启动现有 Android 客户端，点击首页「扫码连接电脑」对准左侧二维码</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-num">3</span>
              <div>
                <strong>全自动同步与 WebGPU 秒级分析</strong>
                <p>PC 浏览器 WebGPU 提取 512 维特征并进行 15 类场景分类，持久化存储</p>
              </div>
            </div>
          </div>

          <!-- Mobile / iPhone Fast Action Card -->
          <div class="mobile-fast-actions glass-panel">
            <div class="mobile-fast-info">
              <span style="font-size: 24px;">📸</span>
              <div>
                <div style="font-weight: 700; color: #fff; font-size: 14px;">手机相册直传与本地 AI 分析</div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">直接在手机中选择照片/视频导入，利用端侧 WebGPU 极速分类</div>
              </div>
            </div>
            <input 
              type="file" 
              ref="mobileFileInput" 
              multiple 
              accept="image/*,video/*" 
              style="display: none" 
              @change="handleLocalFiles" 
            />
            <button class="btn-primary btn-mobile-pick-act" @click="$refs.mobileFileInput.click()">
              <span>📁</span> 选取 iPhone 相册照片 / 视频
            </button>
          </div>
        </div>
      </section>

      <!-- Section B: Active Sync & Metrics Dashboard (Shown when connected) -->
      <section v-else class="dashboard-wrapper">
        <!-- Control Actions Header -->
        <div class="action-banner glass-panel">
          <div class="action-left">
            <h3>⚡ 跨端相册同步与 WebGPU 分析控制中心</h3>
            <p>点击下方按钮一键拉取手机相册，或直接在手机 App 中勾选照片发送。</p>
          </div>
          <div class="action-buttons">
            <!-- Re-analyze All Local Photos with new Model -->
            <button class="btn-primary" @click="reanalyzeAllPhotos" :disabled="isAiProcessing && aiQueue.length > 0">
              🔄 重新全量分析全部相册 (WebGPU)
            </button>
            <!-- Trigger Thumbnail Sync -->
            <button class="btn-secondary" @click="triggerMobileThumbnailSync">
              ⚡ 一键全自动同步手机相册 (缩略图)
            </button>
            <!-- Trigger Full Album Sync -->
            <button class="btn-secondary" @click="triggerMobileFullSync">
              📦 同步手机全量高清原图
            </button>
            <!-- Local File Upload -->
            <input 
              type="file" 
              ref="localFileInput" 
              multiple 
              accept="image/*" 
              style="display: none" 
              @change="handleLocalFiles" 
            />
            <button class="btn-secondary" @click="$refs.localFileInput.click()">
              📁 导入电脑本地图片分析
            </button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="metrics-grid">
          <!-- Card 1: Device & Connection State -->
          <div class="metric-card glass-panel">
            <div class="metric-header">
              <span class="metric-title">📱 互联设备</span>
              <span class="badge-pill badge-online">P2P 直连</span>
            </div>
            <div class="metric-value">Android 客户端</div>
            <div class="metric-sub">
              实时传输速率: <strong>{{ formatSpeed(currentSpeedKbps) }}</strong>
            </div>
          </div>

          <!-- Card 2: Photo Receive Progress -->
          <div class="metric-card glass-panel">
            <div class="metric-header">
              <span class="metric-title">📥 接收流水线</span>
              <span class="metric-counter">{{ receivedCount }} 张</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: `${receivePercent}%` }"></div>
            </div>
            <div class="metric-sub">
              状态: {{ activeTransferText || '等待照片传输' }}
            </div>
          </div>

          <!-- Card 3: WebGPU AI Classification Progress -->
          <div class="metric-card glass-panel">
            <div class="metric-header">
              <span class="metric-title">🧠 WebGPU AI 推理</span>
              <span class="metric-counter">{{ aiDoneCount }} / {{ photos.length }}</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ai-fill" :style="{ width: `${aiPercent}%` }"></div>
            </div>
            <div class="metric-sub">
              {{ isAiProcessing ? `正在推理 (${aiQueue.length} 待处理)...` : 'AI 队列就绪 (已存入 IndexedDB)' }}
            </div>
          </div>
        </div>
      </section>

      <!-- Section C: Search Bar & Category Filter -->
      <section v-if="photos.length > 0 || isConnected" class="category-section glass-panel">
        <div class="category-header">
          <div class="search-bar-row">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input 
                v-model="searchQuery" 
                type="text" 
                class="search-input" 
                placeholder="自然语言语义搜索 (如：猫咪、风景、食物、海滩、自拍、建筑、文档...)" 
              />
              <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">✕</button>
            </div>
            <div class="cat-total">
              显示 {{ visiblePhotos.length }} / {{ filteredPhotos.length }} 张（库中共 {{ photos.length }} 张）
            </div>
          </div>

          <div class="filter-actions">
            <button 
              class="cat-chip" 
              :class="{ active: selectedCategory === 'all' }"
              @click="selectedCategory = 'all'"
            >
              全部 ({{ photos.length }})
            </button>
            <button 
              v-for="(count, cat) in categoryCounts" 
              :key="cat"
              class="cat-chip"
              :class="{ active: selectedCategory === cat }"
              @click="selectedCategory = cat"
            >
              {{ cat }} ({{ count }})
            </button>
          </div>
        </div>
      </section>

      <!-- Section D: Virtualized Justified Equal-Height Gallery (Google Photos Style) -->
      <section 
        class="gallery-section"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDropFiles"
      >
        <div v-if="isDragging" class="dropzone-overlay glass-panel">
          <div class="dropzone-text">📂 松开鼠标，立即将图片加入 WebGPU AI 分析流水线</div>
        </div>

        <div v-if="filteredPhotos.length === 0" class="empty-state glass-panel">
          <div class="empty-icon">🖼️</div>
          <h3>暂无照片记录</h3>
          <p>
            {{ isConnected ? '点击上方「⚡ 一键全自动同步手机相册」或在手机端选择照片发送。' : '请先扫码连接手机以同步相册。' }}
          </p>
        </div>

        <!-- Virtual Windowed Gallery: Only render visible chunk for 60fps performance -->
        <div v-else class="justified-gallery">
          <div 
            v-for="item in visiblePhotos" 
            :key="item.id"
            class="justified-item glass-panel"
            :style="{ 
              flexGrow: item.aspectRatio || 1.33, 
              flexBasis: `${Math.round((item.aspectRatio || 1.33) * 200)}px` 
            }"
            @click="openLightbox(item)"
          >
            <div class="img-box">
              <img 
                :src="item.blobUrl" 
                :alt="item.filename" 
                loading="lazy" 
                decoding="async" 
                @load="handleImageLoad($event, item)"
              />
              
              <!-- Top Category Pill Overlay -->
              <div v-if="item.topCategory" class="category-badge">
                <span class="cat-dot"></span>
                {{ item.topCategory.name }} {{ Math.round(item.topCategory.score * 100) }}%
              </div>
              <div v-else-if="item.analyzing" class="analyzing-badge">
                <span class="spinner-mini"></span> AI 分析中...
              </div>

              <!-- Hover Info Strip -->
              <div class="hover-overlay">
                <span class="photo-name-hover">{{ item.filename }}</span>
                <span class="photo-size-hover">{{ formatTimestampShort(item.takenAt || item.receivedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Spacer element to keep last row from overstretching -->
          <div class="justified-spacer"></div>
        </div>

        <!-- Infinite Scroll Sentinel (Loads next batch as user scrolls down) -->
        <div ref="sentinelRef" class="scroll-sentinel">
          <div v-if="hasMore" class="loading-more-pill">
            <span class="spinner-mini"></span> 正在平滑加载更多 ({{ visiblePhotos.length }}/{{ filteredPhotos.length }})...
          </div>
        </div>
      </section>

      <!-- Section E: Real-time Debug Log Console -->
      <section class="log-section glass-panel">
        <div class="log-header" @click="isLogExpanded = !isLogExpanded">
          <div class="log-title">
            <span>📜 实时运行日志 (Live Console)</span>
            <span class="log-badge">{{ liveLogs.length }} 条记录</span>
          </div>
          <div class="log-controls">
            <button class="btn-text" @click.stop="liveLogs = []">清空日志</button>
            <span class="toggle-arrow">{{ isLogExpanded ? '▲' : '▼' }}</span>
          </div>
        </div>
        <div v-if="isLogExpanded" class="log-body" ref="logContainer">
          <div v-for="(log, idx) in liveLogs" :key="idx" class="log-line">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-text">{{ log.text }}</span>
          </div>
          <div v-if="liveLogs.length === 0" class="log-empty">暂无运行日志...</div>
        </div>
      </section>
    </main>

    <!-- 3. Official Google Photos 1:1 Full-Screen Immersive Viewer -->
    <div v-if="activeLightboxItem" class="google-photos-viewer" @click.self="closeLightbox">
      <!-- Top Floating Gradient Bar (Google Photos Style) -->
      <div class="viewer-top-bar">
        <div class="viewer-top-left">
          <!-- Back Button (Arrow Icon) -->
          <button class="g-icon-btn" @click="closeLightbox" title="返回相册 (Esc)">
            <svg viewBox="0 0 24 24" class="svg-icon">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <span class="viewer-date-info">
            {{ formatTimestamp(activeLightboxItem.takenAt || activeLightboxItem.receivedAt) }} · {{ activeLightboxIndex + 1 }} / {{ filteredPhotos.length }}
          </span>
        </div>

        <div class="viewer-top-right">
          <!-- Download Button -->
          <button class="g-icon-btn" @click="downloadPhoto(activeLightboxItem)" title="下载图片">
            <svg viewBox="0 0 24 24" class="svg-icon">
              <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
            </svg>
          </button>

          <!-- Info / AI Details Toggle (ⓘ) -->
          <button 
            class="g-icon-btn" 
            :class="{ active: isInfoPanelOpen }"
            @click="isInfoPanelOpen = !isInfoPanelOpen" 
            title="信息与 AI 分析详情 (I)"
          >
            <svg viewBox="0 0 24 24" class="svg-icon">
              <path fill="currentColor" d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
            </svg>
          </button>

          <!-- Delete Button (🗑️) -->
          <button class="g-icon-btn" @click="deleteCurrentPhoto" title="从数据库删除 (Delete)">
            <svg viewBox="0 0 24 24" class="svg-icon">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Stage: Edge-to-edge Viewport Display & Floating Navigation Arrows -->
      <div class="viewer-stage" @click.self="closeLightbox">
        <!-- Prev Button (Floating Left Arrow) -->
        <button 
          v-if="filteredPhotos.length > 1" 
          class="viewer-nav-btn nav-prev" 
          @click.stop="prevPhoto" 
          title="上一张 (← 键盘左键)"
        >
          <svg viewBox="0 0 24 24" class="nav-svg">
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        <!-- Centered High-Resolution Photo Container -->
        <div class="viewer-img-container" @click.self="closeLightbox">
          <img 
            :key="activeLightboxItem.id"
            :src="activeLightboxItem.blobUrl" 
            :alt="activeLightboxItem.filename" 
            class="viewer-main-img"
          />
        </div>

        <!-- Next Button (Floating Right Arrow) -->
        <button 
          v-if="filteredPhotos.length > 1" 
          class="viewer-nav-btn nav-next" 
          @click.stop="nextPhoto" 
          title="下一张 (→ 键盘右键)"
        >
          <svg viewBox="0 0 24 24" class="nav-svg">
            <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>

      <!-- Google Photos Style Info Sidebar Drawer -->
      <div v-if="isInfoPanelOpen" class="viewer-info-drawer">
        <div class="info-drawer-header">
          <h3>信息</h3>
          <button class="info-close-btn" @click="isInfoPanelOpen = false">
            <svg viewBox="0 0 24 24" class="svg-icon">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="info-drawer-body">
          <!-- Section 1: AI Scene Recognition Top Card -->
          <div class="info-group">
            <h4 class="info-group-title">🧠 WebGPU 场景智能识别</h4>
            <div v-if="activeLightboxItem.categories && activeLightboxItem.categories.length">
              <div 
                v-for="(cat, idx) in activeLightboxItem.categories" 
                :key="idx"
                class="ai-cat-card"
              >
                <div class="ai-cat-header">
                  <span class="ai-cat-name">
                    <span class="cat-rank">#{{ idx + 1 }}</span>
                    {{ cat.category || cat.name }}
                  </span>
                  <span class="ai-cat-score">{{ Math.round((cat.score || 0) * 100) }}%</span>
                </div>
                <div class="ai-score-bar-bg">
                  <div class="ai-score-bar-fill" :style="{ width: `${Math.round((cat.score || 0) * 100)}%` }"></div>
                </div>
              </div>
            </div>
            <div v-else class="info-empty-state">
              <span class="spinner-mini"></span> WebGPU AI 特征提取中...
            </div>
          </div>

          <!-- Section 2: Details & File Metadata -->
          <div class="info-group">
            <h4 class="info-group-title">📁 照片详情</h4>
            <div class="info-row">
              <span class="info-label">文件名</span>
              <span class="info-val" :title="activeLightboxItem.filename">{{ activeLightboxItem.filename }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">拍摄 / 记录时间</span>
              <span class="info-val">{{ formatTimestamp(activeLightboxItem.takenAt || activeLightboxItem.receivedAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">文件大小</span>
              <span class="info-val">{{ formatBytes(activeLightboxItem.size) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">格式 / MIME</span>
              <span class="info-val">{{ activeLightboxItem.mime || 'image/jpeg' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">SHA-256</span>
              <span class="info-val mono">{{ activeLightboxItem.hash?.slice(0, 16) }}...</span>
            </div>
            <div class="info-row">
              <span class="info-label">IndexedDB 存储</span>
              <span class="badge-pill badge-online" style="font-size: 11px; padding: 2px 8px;">已持久化</span>
            </div>
          </div>

          <!-- Section 3: AI Vector Embeddings -->
          <div class="info-group">
            <h4 class="info-group-title">🧬 MobileCLIP 向量特征</h4>
            <div class="info-row">
              <span class="info-label">维度</span>
              <span class="info-val">512 维 Float32</span>
            </div>
            <div class="info-row">
              <span class="info-label">模型</span>
              <span class="info-val">MobileCLIP-S0</span>
            </div>
            <div class="info-row">
              <span class="info-label">加速后端</span>
              <span class="badge-pill badge-webgpu" style="font-size: 11px; padding: 2px 8px;">WebGPU</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== iOS / Mobile PWA Installation Guidance Banner ==================== -->
    <transition name="fade-slide">
      <div v-if="showIosInstallPrompt" class="ios-install-banner glass-panel">
        <div class="ios-banner-inner">
          <div class="ios-app-icon">
            <img src="/logo.png" alt="App Icon" />
          </div>
          <div class="ios-banner-content">
            <div class="ios-banner-title">
              <span>安装 ShareCLIP 到桌面</span>
              <span class="ios-pwa-badge">PWA 免证书</span>
            </div>
            <div class="ios-banner-desc">
              点击 Safari 底部 <strong>分享按钮 <span class="share-glyph">⎋</span></strong> ➔ 选择 <strong>「添加到主屏幕」</strong>，即可像原生 App 一样全屏极速运行！
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
import QRCode from 'qrcode';
import { 
  openDB, 
  savePhoto, 
  getPhotoByHash, 
  getAllPhotos, 
  deletePhoto,
  saveEmbedding, 
  saveAnalysisResult, 
  getAllAnalysisResults, 
  clearDatabase, 
  computeSHA256 
} from './services/indexeddb.js';
import { SignalingClient, getDefaultSignalingUrl } from './services/signaling.js';
import { WebRtcReceiver } from './services/webrtc.js';

// PWA & iOS Platform Detection States
const isIos = ref(false);
const isStandalone = ref(false);
const showIosInstallPrompt = ref(false);
const mobileFileInput = ref(null);

function dismissIosPrompt() {
  showIosInstallPrompt.value = false;
  try {
    localStorage.setItem('shareclip_pwa_dismissed', Date.now().toString());
  } catch (_) {}
}

// Reactive States
const sessionId = ref(generateSessionId());
const qrCanvas = ref(null);
const qrReady = ref(false);
const isConnected = ref(false);
const aiReady = ref(false);
const aiProvider = ref('webgpu');
const isAiProcessing = ref(false);
const isDragging = ref(false);
const searchQuery = ref('');

const customLanIp = ref('');
const customSignalingUrl = ref(getDefaultSignalingUrl());
const isSettingsOpen = ref(false);

const receivedCount = ref(0);
const currentSpeedKbps = ref(0);
const activeTransferText = ref('');
const selectedCategory = ref('all');
const detectedIps = ref([]);
const liveLogs = shallowRef([]);
const isLogExpanded = ref(true);
const logContainer = ref(null);
const localFileInput = ref(null);

// Google Photos Viewer States
const activeLightboxIndex = ref(-1);
const isInfoPanelOpen = ref(false);

// Virtual scrolling / Infinite loading window
const PAGE_SIZE = 40;
const visibleCount = ref(PAGE_SIZE);
const sentinelRef = ref(null);
let intersectionObserver = null;

// High-Performance Shallow Arrays
const photos = shallowRef([]);
let rawPhotos = [];
const aiQueue = [];
const photoBlobUrlMap = new Map();

// Incoming Batch Buffer (Merges rapid arrivals into 120ms UI frames)
let incomingBuffer = [];
let batchFlushTimer = null;

// Engines
let signaling = null;
let webrtc = null;
let aiWorker = null;

function addLog(text) {
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  const next = [...liveLogs.value, { time, text }];
  if (next.length > 150) next.shift();
  liveLogs.value = next;
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
}

function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

const receivePercent = computed(() => {
  if (photos.value.length === 0) return 0;
  return Math.min(100, Math.round((receivedCount.value / (photos.value.length || 1)) * 100));
});

const aiDoneCount = computed(() => {
  return photos.value.filter(p => p.topCategory != null).length;
});

const aiPercent = computed(() => {
  if (photos.value.length === 0) return 0;
  return Math.min(100, Math.round((aiDoneCount.value / photos.value.length) * 100));
});

const categoryCounts = computed(() => {
  const counts = {};
  for (const p of photos.value) {
    if (p.topCategory && p.topCategory.name) {
      counts[p.topCategory.name] = (counts[p.topCategory.name] || 0) + 1;
    }
  }
  return counts;
});

// Dynamic aspect ratio calculation on image load
function handleImageLoad(event, item) {
  const { naturalWidth, naturalHeight } = event.target;
  if (naturalWidth && naturalHeight) {
    item.aspectRatio = Math.max(0.5, Math.min(3.2, naturalWidth / naturalHeight));
  }
}

// Extract EXIF date or filename date
function extractExifTimestampFromBuffer(buffer) {
  if (!buffer || buffer.byteLength < 32) return null;
  try {
    const view = new DataView(buffer);
    if (view.getUint16(0, false) !== 0xFFD8) return null; // Not JPEG
    let offset = 2;
    while (offset < Math.min(view.byteLength - 4, 65536)) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xFFE1) { // APP1 EXIF
        const length = view.getUint16(offset, false);
        offset += 2;
        const text = new TextDecoder('ascii').decode(new Uint8Array(buffer, offset, Math.min(length, 4096)));
        const match = text.match(/\b(19\d\d|20\d\d)[:\-\/](0[1-9]|1[0-2])[:\-\/](0[1-9]|[12]\d|3[01])\s+([01]\d|2[0-3]):([0-5]\d):([0-5]\d)\b/);
        if (match) {
          const d = match[0].split(/[ :]/);
          if (d.length >= 6) {
            const dateObj = new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2]), parseInt(d[3]), parseInt(d[4]), parseInt(d[5]));
            if (!isNaN(dateObj.getTime())) return dateObj.getTime();
          }
        }
        break;
      } else if ((marker & 0xFF00) === 0xFF00) {
        const length = view.getUint16(offset, false);
        offset += length;
      } else {
        break;
      }
    }
  } catch (_) {}
  return null;
}

function extractPhotoTimestamp(buffer, filename, fallbackTime = Date.now()) {
  // 1. Check EXIF
  if (buffer) {
    const exifTime = extractExifTimestampFromBuffer(buffer);
    if (exifTime && !isNaN(exifTime)) return exifTime;
  }
  // 2. Check filename
  if (filename) {
    // Unix millisecond timestamp: e.g. "photo_1787291476557_..."
    const epochMatch = filename.match(/\b(1[6-9]\d{11})\b/);
    if (epochMatch) {
      const val = parseInt(epochMatch[1], 10);
      if (val > 1500000000000 && val < 2500000000000) return val;
    }
    // Formatted date string: e.g. "IMG_20240815_143000" or "2024-08-15 14:30:00"
    const dateMatch = filename.match(/(20\d{2})[-_]?(0[1-9]|1[0-2])[-_]?(0[1-9]|[12]\d|3[01])[-_]?([01]\d|2[0-3])?([0-5]\d)?([0-5]\d)?/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const day = parseInt(dateMatch[3]);
      const hour = dateMatch[4] ? parseInt(dateMatch[4]) : 12;
      const min = dateMatch[5] ? parseInt(dateMatch[5]) : 0;
      const sec = dateMatch[6] ? parseInt(dateMatch[6]) : 0;
      const t = new Date(year, month, day, hour, min, sec).getTime();
      if (!isNaN(t)) return t;
    }
  }
  return fallbackTime || Date.now();
}

// Filtered & Chronologically Sorted Photos (From Newest to Oldest)
const filteredPhotos = computed(() => {
  let list = photos.value;
  if (selectedCategory.value !== 'all') {
    list = list.filter(p => p.topCategory && p.topCategory.name === selectedCategory.value);
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(p => {
      const matchName = p.filename && p.filename.toLowerCase().includes(q);
      const matchCategory = p.categories && p.categories.some(c => (c.category || c.name || '').toLowerCase().includes(q));
      return matchName || matchCategory;
    });
  }
  
  // Sort chronologically: from newest (recent) to oldest
  return [...list].sort((a, b) => {
    const timeA = a.takenAt || a.receivedAt || 0;
    const timeB = b.takenAt || b.receivedAt || 0;
    return timeB - timeA;
  });
});

// Virtual Window Slice (Render only visible items for 60fps)
const visiblePhotos = computed(() => {
  return filteredPhotos.value.slice(0, visibleCount.value);
});

const hasMore = computed(() => {
  return visibleCount.value < filteredPhotos.value.length;
});

// Currently Active Photo in Lightbox Viewer
const activeLightboxItem = computed(() => {
  if (activeLightboxIndex.value >= 0 && activeLightboxIndex.value < filteredPhotos.value.length) {
    return filteredPhotos.value[activeLightboxIndex.value];
  }
  return null;
});

function openLightbox(item) {
  const idx = filteredPhotos.value.findIndex(p => p.id === item.id);
  activeLightboxIndex.value = idx !== -1 ? idx : 0;
}

function closeLightbox() {
  activeLightboxIndex.value = -1;
  isInfoPanelOpen.value = false;
}

function prevPhoto() {
  if (filteredPhotos.value.length <= 1) return;
  if (activeLightboxIndex.value > 0) {
    activeLightboxIndex.value--;
  } else {
    activeLightboxIndex.value = filteredPhotos.value.length - 1; // loop
  }
}

function nextPhoto() {
  if (filteredPhotos.value.length <= 1) return;
  if (activeLightboxIndex.value < filteredPhotos.value.length - 1) {
    activeLightboxIndex.value++;
  } else {
    activeLightboxIndex.value = 0; // loop
  }
}

function downloadPhoto(item) {
  if (!item || !item.blobUrl) return;
  const link = document.createElement('a');
  link.href = item.blobUrl;
  link.download = item.filename || 'photo.jpg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function deleteCurrentPhoto() {
  if (!activeLightboxItem.value) return;
  const item = activeLightboxItem.value;
  if (confirm(`确定要从本地数据库删除照片 "${item.filename}" 吗？`)) {
    await deletePhoto(item.id);
    const idx = rawPhotos.findIndex(p => p.id === item.id);
    if (idx !== -1) {
      rawPhotos.splice(idx, 1);
      photos.value = [...rawPhotos];
      receivedCount.value = rawPhotos.length;
    }
    if (rawPhotos.length === 0) {
      closeLightbox();
    } else if (activeLightboxIndex.value >= rawPhotos.length) {
      activeLightboxIndex.value = rawPhotos.length - 1;
    }
    addLog(`🗑️ 已从 IndexedDB 删除照片: ${item.filename}`);
  }
}

function formatTimestamp(ts) {
  if (!ts) return '未知时间';
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatTimestampShort(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

function handleKeydown(e) {
  if (activeLightboxIndex.value === -1) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevPhoto();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    nextPhoto();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeLightbox();
  } else if (e.key.toLowerCase() === 'i') {
    isInfoPanelOpen.value = !isInfoPanelOpen.value;
  } else if (e.key === 'Delete') {
    deleteCurrentPhoto();
  }
}

onMounted(async () => {
  addLog('🚀 WebShare 挂载完成，正在极速拉取本地 IndexedDB 历史并启动 WebGPU Worker...');
  
  // PWA Standalone & iOS detection
  try {
    isIos.value = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    isStandalone.value = ('standalone' in window.navigator && window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('shareclip_pwa_dismissed');
    if (isIos.value && !isStandalone.value && !dismissed) {
      setTimeout(() => {
        showIosInstallPrompt.value = true;
      }, 1200);
    }
  } catch (_) {}

  generateQrCode();
  await openDB();
  await loadHistoricalPhotos();
  initAiWorker();
  initSignalingAndWebRtc();
  initInfiniteScrollObserver();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  if (signaling) signaling.disconnect();
  if (webrtc) webrtc._cleanup();
  if (aiWorker) aiWorker.terminate();
  if (intersectionObserver) intersectionObserver.disconnect();
  if (batchFlushTimer) clearInterval(batchFlushTimer);
  window.removeEventListener('keydown', handleKeydown);
  photoBlobUrlMap.forEach(url => URL.revokeObjectURL(url));
  photoBlobUrlMap.clear();
});

function initInfiniteScrollObserver() {
  intersectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (visibleCount.value < filteredPhotos.value.length) {
        visibleCount.value += PAGE_SIZE;
      }
    }
  }, { rootMargin: '300px' });

  nextTick(() => {
    if (sentinelRef.value) intersectionObserver.observe(sentinelRef.value);
  });
}

function initAiWorker() {
  try {
    aiWorker = new Worker(new URL('./workers/ai.worker.js', import.meta.url), { type: 'module' });
    aiWorker.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'init_result') {
        if (data.success) {
          aiReady.value = true;
          aiProvider.value = data.provider;
          addLog(`✨ AI Worker 启动成功: 提供者 [${data.provider.toUpperCase()}], 已加载 ${data.categoryCount} 个场景`);
        } else {
          addLog(`❌ AI Worker 初始化失败: ${data.error}`);
        }
      } else if (data.type === 'inference_result') {
        handleInferenceResult(data);
      }
    };

    const modelUrl = new URL('models/mobileclip2_s0_image_encoder.onnx', window.location.href).href;
    const textEmbUrl = new URL('models/text_embeddings.json', window.location.href).href;

    aiWorker.postMessage({
      type: 'init',
      modelUrl,
      textEmbUrl
    });
  } catch (err) {
    addLog(`❌ 创建 AI Worker 失败: ${err.message}`);
  }
}

async function reanalyzeAllPhotos() {
  if (!aiReady.value) {
    alert('AI 模型仍在加载中，请稍候...');
    return;
  }
  if (rawPhotos.length === 0) {
    alert('本地暂无照片需要分析');
    return;
  }
  if (!confirm(`确定要使用最新 MobileCLIP2-S0 模型重新分析库中全部 ${rawPhotos.length} 张照片吗？`)) {
    return;
  }

  addLog(`🧠 开始全量重新分析 ${rawPhotos.length} 张照片...`);
  for (const p of rawPhotos) {
    p.analyzing = true;
    p.categories = [];
    p.topCategory = null;
  }
  photos.value = [...rawPhotos];

  aiQueue.length = 0;
  for (const p of rawPhotos) {
    if (p.blob) {
      const buffer = await p.blob.arrayBuffer();
      aiQueue.push({
        jobId: p.id,
        photoId: p.id,
        buffer
      });
    }
  }

  triggerNextAiJob();
}

async function loadHistoricalPhotos() {
  const dbPhotos = await getAllPhotos();
  const dbResults = await getAllAnalysisResults();
  const resultMap = new Map(dbResults.map(r => [r.photoId, r.categories]));

  rawPhotos = dbPhotos.map(p => {
    let blobUrl = photoBlobUrlMap.get(p.id);
    if (!blobUrl && p.blob) {
      blobUrl = URL.createObjectURL(p.blob);
      photoBlobUrlMap.set(p.id, blobUrl);
    }
    const categories = resultMap.get(p.id) || [];
    const takenAt = p.takenAt || extractPhotoTimestamp(null, p.filename, p.receivedAt);
    return {
      ...p,
      takenAt,
      blobUrl,
      aspectRatio: 1.33,
      categories,
      topCategory: categories.length > 0 ? { name: categories[0].category || categories[0].name, score: categories[0].score } : null
    };
  });
  photos.value = [...rawPhotos];
  receivedCount.value = photos.value.length;
  addLog(`📂 从本地 IndexedDB 载入了 ${photos.value.length} 张历史照片`);
}

async function generateQrCode() {
  await nextTick();
  if (!qrCanvas.value) return;

  const ips = detectedIps.value.length > 0 ? detectedIps.value : [location.hostname];
  const payload = JSON.stringify({
    session_id: sessionId.value,
    type: 'web',
    web_session_id: sessionId.value,
    pc_ips: ips,
    ble_mac: ''
  });

  try {
    await QRCode.toCanvas(qrCanvas.value, payload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    qrReady.value = true;
    addLog(`📱 二维码已渲染，包含 IP: ${ips.join(', ')}`);
  } catch (e) {
    addLog(`❌ 渲染二维码失败: ${e.message}`);
  }
}

function handleIpChange() {
  if (customLanIp.value && customLanIp.value.trim()) {
    detectedIps.value = [customLanIp.value.trim()];
    generateQrCode();
  }
}

function applyNetworkSettings() {
  if (customLanIp.value && customLanIp.value.trim()) {
    detectedIps.value = [customLanIp.value.trim()];
  }
  generateQrCode();
  if (signaling) {
    signaling.connect(sessionId.value, customSignalingUrl.value);
  }
  addLog(`⚙️ 已更新网络配置: IP=[${detectedIps.value.join(', ')}], 信令=[${customSignalingUrl.value}]`);
}

function initSignalingAndWebRtc() {
  signaling = new SignalingClient();
  webrtc = new WebRtcReceiver();

  signaling.onLog = (msg) => addLog(msg);
  webrtc.onLog = (msg) => addLog(msg);

  signaling.onServerInfo = (info) => {
    if (info.localIps && info.localIps.length) {
      detectedIps.value = info.localIps;
      if (!customLanIp.value) {
        customLanIp.value = info.localIps[0];
      }
      generateQrCode();
    }
  };

  signaling.onOffer = async (offerSdp) => {
    addLog(`📥 正在处理手机 SDP Offer，生成本地 Answer...`);
    const answerSdp = await webrtc.handleOffer(offerSdp);
    signaling.sendAnswer(answerSdp);
  };

  signaling.onIce = (candidate) => {
    webrtc.addIceCandidate(candidate);
  };

  webrtc.onIceCandidate = (candidate) => {
    signaling.sendIce(candidate);
  };

  webrtc.onConnected = () => {
    isConnected.value = true;
    addLog('🎉 WebRTC P2P DataChannel 连接成功！');
  };

  webrtc.onDisconnected = () => {
    isConnected.value = false;
    addLog('🔌 WebRTC P2P 连接断开。');
  };

  webrtc.onProgress = (prog) => {
    currentSpeedKbps.value = prog.speedKbps;
    activeTransferText.value = `传输中 (分片 ${prog.chunkIndex + 1}/${prog.totalChunks})`;
  };

  webrtc.onPhotoReceived = async (fileData) => {
    await processIncomingPhoto(fileData);
  };

  signaling.connect(sessionId.value, customSignalingUrl.value);

  // High-performance batch flush timer: commits buffered arrivals once every 120ms
  batchFlushTimer = setInterval(flushIncomingBuffer, 120);
}

function flushIncomingBuffer() {
  if (incomingBuffer.length === 0) return;
  rawPhotos = [...incomingBuffer, ...rawPhotos];
  photos.value = rawPhotos;
  receivedCount.value = rawPhotos.length;
  incomingBuffer = [];
}

// Mobile Sync Triggers
function triggerMobileThumbnailSync() {
  if (!webrtc || !isConnected.value) {
    alert('请先连接手机！');
    return;
  }
  webrtc.requestThumbnailSync();
  addLog('🚀 已向手机发送「一键全自动同步缩略图」指令 (-6)');
}

function triggerMobileFullSync() {
  if (!webrtc || !isConnected.value) {
    alert('请先连接手机！');
    return;
  }
  webrtc.requestFullAlbumSync();
  addLog('🚀 已向手机发送「全量高清原图同步」指令 (-7)');
}

// Local File Upload Handlers
async function handleLocalFiles(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;
  addLog(`📁 正在批量解析 ${files.length} 张本地图片并送入 WebGPU 推理队列...`);

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    await processIncomingPhoto({
      fileId: Math.floor(Math.random() * 100000),
      buffer,
      mime: file.type || 'image/jpeg',
      filename: file.name,
      size: file.size
    });
  }
  event.target.value = '';
}

async function handleDropFiles(event) {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;
  addLog(`📁 拖拽检测到 ${files.length} 张图片，正在批量送入推理队列...`);

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    await processIncomingPhoto({
      fileId: Math.floor(Math.random() * 100000),
      buffer,
      mime: file.type || 'image/jpeg',
      filename: file.name,
      size: file.size
    });
  }
}

// Ingestion Pipeline: Buffer -> SHA-256 -> Deduplicate -> IndexedDB -> AI Inference
async function processIncomingPhoto(fileData) {
  const { fileId, buffer, mime, filename, size } = fileData;
  const hash = await computeSHA256(buffer);
  const takenAt = extractPhotoTimestamp(buffer, filename, Date.now());

  const existingPhoto = await getPhotoByHash(hash);
  const blob = new Blob([buffer], { type: mime });
  const blobUrl = URL.createObjectURL(blob);
  photoBlobUrlMap.set(hash, blobUrl);

  const photoId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const photoRecord = {
    id: photoId,
    hash,
    filename,
    mime,
    size,
    blob,
    takenAt,
    receivedAt: Date.now()
  };

  if (existingPhoto) {
    const existingCategories = existingPhoto.categories || [];
    const photoItem = {
      ...photoRecord,
      blobUrl,
      aspectRatio: 1.33,
      categories: existingCategories,
      topCategory: existingCategories.length > 0 ? { name: existingCategories[0].category || existingCategories[0].name, score: existingCategories[0].score } : null
    };
    savePhoto(photoRecord);
    incomingBuffer.unshift(photoItem);
    return;
  }

  // 1. Asynchronously persist photo in IndexedDB
  savePhoto(photoRecord);

  const photoItem = {
    ...photoRecord,
    blobUrl,
    aspectRatio: 1.33,
    categories: [],
    topCategory: null,
    analyzing: true
  };
  incomingBuffer.unshift(photoItem);

  // 2. Queue for WebGPU AI inference
  aiQueue.push({
    jobId: photoId,
    photoId,
    buffer
  });

  triggerNextAiJob();
}

function triggerNextAiJob() {
  if (isAiProcessing.value || aiQueue.length === 0 || !aiReady.value) return;

  const job = aiQueue.shift();
  isAiProcessing.value = true;

  aiWorker.postMessage({
    type: 'infer',
    jobId: job.jobId,
    photoId: job.photoId,
    buffer: job.buffer
  }, [job.buffer]);
}

async function handleInferenceResult(result) {
  isAiProcessing.value = false;
  const { photoId, success, embedding, categories, timings } = result;

  if (success) {
    // 3. Concurrently persist 512-D embeddings and scene classification results to IndexedDB
    Promise.all([
      saveEmbedding(photoId, new Float32Array(embedding)),
      saveAnalysisResult(photoId, categories)
    ]);

    const target = rawPhotos.find(p => p.id === photoId);
    if (target) {
      target.categories = categories;
      target.topCategory = categories.length > 0 ? { name: categories[0].category || categories[0].name, score: categories[0].score } : null;
      target.analyzing = false;
      photos.value = [...rawPhotos]; // Shallow trigger
    }
  }

  triggerNextAiJob();
}

async function handleClearData() {
  if (confirm('确定要清空本地 IndexedDB 中的所有照片与 AI 分析数据吗？')) {
    await clearDatabase();
    rawPhotos = [];
    photos.value = [];
    receivedCount.value = 0;
    photoBlobUrlMap.forEach(url => URL.revokeObjectURL(url));
    photoBlobUrlMap.clear();
    addLog('🗑️ 已清空本地 IndexedDB 数据库');
  }
}

function formatSpeed(kbps) {
  if (kbps > 1024) return `${(kbps / 1024).toFixed(1)} MB/s`;
  return `${kbps} KB/s`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
</script>

<style scoped>
.webshare-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.pulse-dot {
  animation: pulse-dot-anim 1.5s infinite;
}

@keyframes pulse-dot-anim {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.db-pill {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.btn-icon {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.main-content {
  flex: 1;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Dashboard Action Banner */
.action-banner {
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  margin-bottom: 16px;
  border-radius: 16px;
}

.action-left h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.action-left p {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--accent-gradient);
  border: none;
  color: white;
  padding: 9px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
  padding: 9px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--border-glow);
}

/* Search Bar */
.search-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 600px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  padding: 9px 36px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--accent-purple);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
}

/* QR Hero */
.qr-hero-card {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 40px;
}

.qr-hero-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-box {
  width: 220px;
  height: 220px;
  background: #ffffff;
  border-radius: 16px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  position: relative;
}

.qr-canvas {
  width: 200px !important;
  height: 200px !important;
  display: block;
}

.qr-loading {
  position: absolute;
  inset: 0;
  background: #1e293b;
  color: #c4b5fd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-radius: 16px;
}

.session-code-tag, .ip-tag {
  font-size: 12px;
  color: var(--text-secondary);
}

.session-code-tag code, .ip-tag code {
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-weight: 700;
}

.net-settings-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--accent-cyan);
  cursor: pointer;
  margin-top: 4px;
  user-select: none;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.net-settings-toggle:hover {
  background: rgba(6, 182, 212, 0.15);
}

.net-settings-panel {
  width: 100%;
  max-width: 280px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item label {
  font-size: 11px;
  color: var(--text-muted);
}

.setting-input {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #e2e8f0;
  outline: none;
  font-family: var(--font-mono);
}

.setting-input:focus {
  border-color: var(--accent-cyan);
}

.btn-apply-net {
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 8px;
  align-self: flex-end;
}

.qr-hero-right h2 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
}

.qr-hero-right .subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

.step-guide {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.step-item strong {
  font-size: 14px;
  color: var(--text-primary);
}

.step-item p {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 14px;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-title {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

.metric-counter {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--accent-cyan);
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.progress-bar-bg {
  width: 100%;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
  margin: 4px 0;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.3s ease;
}

.progress-bar-fill.ai-fill {
  background: linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%);
}

/* Category Filter Section */
.category-section {
  padding: 14px 18px;
  border-radius: 14px;
}

.category-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cat-chip:hover {
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border-color: rgba(139, 92, 246, 0.3);
}

.cat-chip.active {
  background: var(--accent-gradient);
  color: white;
  border-color: transparent;
  font-weight: 600;
}

/* Virtualized Justified Equal-Height Gallery */
.gallery-section {
  position: relative;
  min-height: 260px;
}

.dropzone-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  border: 2px dashed var(--accent-purple);
  background: rgba(15, 23, 42, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.dropzone-text {
  font-size: 16px;
  font-weight: 700;
  color: #c4b5fd;
}

.justified-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.justified-item {
  height: 220px;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  content-visibility: auto;
  contain-intrinsic-size: 200px 220px;
}

.justified-item:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
  border-color: rgba(139, 92, 246, 0.5);
  z-index: 2;
}

.img-box {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1e293b;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Category Badge */
.category-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #c4b5fd;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  z-index: 2;
}

.cat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8b5cf6;
}

.analyzing-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(236, 72, 153, 0.85);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.spinner-mini {
  width: 8px;
  height: 8px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Hover Overlay */
.hover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%);
  padding: 24px 10px 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 11px;
}

.justified-item:hover .hover-overlay {
  opacity: 1;
}

.photo-name-hover {
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.photo-size-hover {
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* Spacer to prevent last row from blowing up */
.justified-spacer {
  flex-grow: 999;
  height: 0;
  min-width: 100px;
}

/* Scroll Sentinel */
.scroll-sentinel {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.loading-more-pill {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Empty State */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 13px;
  max-width: 420px;
}

/* Log Console Section */
.log-section {
  padding: 14px 18px;
  border-radius: 14px;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
}

.log-badge {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.log-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-text {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.btn-text:hover {
  color: #ef4444;
}

.toggle-arrow {
  font-size: 11px;
  color: var(--text-muted);
}

.log-body {
  margin-top: 10px;
  max-height: 180px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 10px;
  padding: 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.log-line {
  display: flex;
  gap: 10px;
  line-height: 1.4;
}

.log-time {
  color: var(--text-muted);
  flex-shrink: 0;
}

.log-text {
  color: #d1d5db;
  word-break: break-all;
}

.log-empty {
  color: var(--text-muted);
  text-align: center;
  padding: 10px;
}

/* =========================================================
   3. Official Google Photos 1:1 Full-Screen Immersive Viewer
   ========================================================= */
.google-photos-viewer {
  position: fixed;
  inset: 0;
  background: #000000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  user-select: none;
  animation: viewerFadeIn 0.15s ease-out;
}

@keyframes viewerFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Top Floating Bar with Subtle Gradient */
.viewer-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%);
  z-index: 30;
  pointer-events: auto;
}

.viewer-top-left, .viewer-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.viewer-date-info {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  margin-left: 8px;
}

/* Google Icon Buttons */
.g-icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.g-icon-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(1.05);
}

.g-icon-btn.active {
  background: rgba(139, 92, 246, 0.4);
  color: #c4b5fd;
}

.svg-icon {
  width: 22px;
  height: 22px;
}

/* Fullscreen Center Viewport Stage */
.viewer-stage {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

.viewer-img-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-main-img {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
  display: block;
}

/* Large Floating Ghost Navigation Arrows */
.viewer-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 20;
  opacity: 0.6;
}

.viewer-nav-btn:hover {
  background: rgba(0, 0, 0, 0.85);
  opacity: 1;
  transform: translateY(-50%) scale(1.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-prev {
  left: 24px;
}

.nav-next {
  right: 24px;
}

.nav-svg {
  width: 32px;
  height: 32px;
}

/* Google Photos Style Metadata Info Drawer */
.viewer-info-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  background: rgba(18, 24, 38, 0.95);
  backdrop-filter: blur(24px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -15px 0 35px rgba(0, 0, 0, 0.8);
  z-index: 40;
  display: flex;
  flex-direction: column;
  animation: slideInDrawer 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideInDrawer {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.info-drawer-header {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.info-drawer-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.info-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.info-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-group-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.info-label {
  color: var(--text-muted);
}

.info-val {
  color: var(--text-primary);
  font-weight: 500;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-val.mono {
  font-family: var(--font-mono);
  color: #c4b5fd;
}

.ai-cat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 8px;
}

.ai-cat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 6px;
}

.ai-cat-name {
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.cat-rank {
  font-size: 11px;
  color: var(--accent-purple);
  font-family: var(--font-mono);
  font-weight: 700;
}

.ai-cat-score {
  font-family: var(--font-mono);
  font-weight: 700;
  color: #a78bfa;
}

.ai-score-bar-bg {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.ai-score-bar-fill {
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 2px;
}

.info-empty-state {
  font-size: 12px;
  color: var(--text-muted);
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .qr-hero-card {
    flex-direction: column;
    padding: 24px;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .action-banner {
    flex-direction: column;
    align-items: flex-start;
  }
  .justified-item {
    height: 160px;
  }
  .viewer-info-drawer {
    width: 100%;
  }
  .nav-prev { left: 10px; }
  .nav-next { right: 10px; }
}
</style>
