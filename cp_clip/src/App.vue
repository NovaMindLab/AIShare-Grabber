<template>
  <div class="app-container" :class="{ 'light-mode': !isDarkMode }">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-icon">📸</span>
        <h1 class="brand-title">ShareCLIP</h1>
      </div>

      <div class="sidebar-section">
        <button class="btn btn-primary" style="width: 100%; margin-bottom: 12px;" @click="handleSelectFolder">
          <span>📁</span> {{ t.sidebar.importFolder }}
        </button>
        <button class="btn btn-secondary" style="width: 100%;" @click="handleSelectImages">
          <span>🖼️</span> {{ t.sidebar.importFiles }}
        </button>
      </div>

      <!-- Connection Manager Navigation -->
      <div class="sidebar-section">
        <h2 class="section-title">{{ t.sidebar.connHeader }}</h2>
        <div class="category-list">
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'link' }"
            @click="currentTab = 'link'"
          >
            <span style="display: flex; align-items: center; gap: 8px;">
              {{ t.sidebar.linkMobile }}
            </span>
            <span v-if="syncStatus === 'connected'" style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--success); display: inline-block; box-shadow: 0 0 6px var(--success);"></span>
          </div>
        </div>
      </div>

      <!-- Local Resources Navigation -->
      <div class="sidebar-section">
        <h2 class="section-title">{{ t.sidebar.localHeader }}</h2>
        <div class="category-list">
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'images' }"
            @click="currentTab = 'images'"
          >
            <span>{{ t.sidebar.tabImages }}</span>
            <span class="category-count">{{ localImages.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'videos' }"
            @click="currentTab = 'videos'"
          >
            <span>{{ t.sidebar.tabVideos }}</span>
            <span class="category-count">{{ localVideos.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'audios' }"
            @click="currentTab = 'audios'"
          >
            <span>{{ t.sidebar.tabAudios }}</span>
            <span class="category-count">{{ localAudios.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'files' }"
            @click="currentTab = 'files'"
          >
            <span>{{ t.sidebar.tabFiles }}</span>
            <span class="category-count">{{ localDocs.length }}</span>
          </div>
        </div>
      </div>

      <!-- Category Filter (Only visible when viewing Images tab) -->
      <div class="sidebar-section" v-if="currentTab === 'images' && localImages.length > 0">
        <h2 class="section-title">{{ t.sidebar.aiFilter }}</h2>
        <div class="category-list">
          <div 
            class="category-item" 
            :class="{ active: selectedCategory === null }" 
            @click="selectedCategory = null"
          >
            <span>{{ t.sidebar.allImages }}</span>
            <span class="category-count">{{ localImages.length }}</span>
          </div>
          <div 
            v-for="(count, cat) in categoryCounts" 
            :key="cat" 
            class="category-item" 
            :class="{ active: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            <span>{{ getShortCategory(cat) }}</span>
            <span class="category-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- App Info / Status Warning -->
      <div class="sidebar-section glass-panel warning-block">
        <div class="warning-title">
          <span>💡</span> {{ t.sidebar.archTitle }}
        </div>
        <div class="warning-desc">
          {{ t.sidebar.archDesc }}
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Top Header Bar -->
      <header class="top-bar">
        <div class="folder-path-display" style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span v-if="currentFolderPath" style="color: var(--text-secondary); font-size: 14px;">
            {{ t.header.currentPath }}<code style="background-color: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{ currentFolderPath }}</code>
          </span>
          <span v-else style="color: var(--text-muted); font-size: 14px;">
            {{ t.header.noPath }}
          </span>
        </div>

        <!-- Global Progress Bar -->
        <div class="global-progress" v-if="isProcessing" style="margin-left: 24px;">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ processedCount }} / {{ totalCount }} 已识别</span>
        </div>

        <div style="display: flex; align-items: center; gap: 16px;">
          <!-- Search Bar -->
          <div class="search-bar-container" v-if="currentTab === 'images' && localImages.length > 0">
            <input 
              type="text" 
              class="search-input" 
              :placeholder="t.header.searchPlaceholder"
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              :disabled="isSearching"
            />
            <button class="btn btn-search" @click="handleSearch" :disabled="isSearching">
              <span v-if="isSearching" class="spinner" style="width: 12px; height: 12px;"></span>
              <span v-else>{{ t.header.searchBtn }}</span>
            </button>
            <button class="btn btn-clear-search" v-if="isSearchActive" @click="handleClearSearch">
              ✕
            </button>
          </div>

          <!-- Language Dropdown -->
          <select v-model="currentLocale" class="lang-select">
            <option v-for="(name, code) in languages" :key="code" :value="code">
              {{ name }}
            </option>
          </select>

          <!-- Theme Toggle Button -->
          <button class="btn btn-secondary theme-toggle-btn" @click="toggleTheme" style="padding: 0; border-radius: 50%; width: 40px; height: 40px; font-size: 18px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--glass-border); background: var(--bg-tertiary);" :title="t.header.themeBtn">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </header>

      <!-- Grid Gallery -->
      <section class="gallery-container">
        <!-- ==================== TABS SWITCH ==================== -->
        
        <!-- 1. LINK TAB -->
        <div v-if="currentTab === 'link'" style="height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; box-sizing: border-box; overflow-y: auto; width: 100%;">
          
          <!-- Mode Tabs (Only when not connected) -->
          <div v-if="syncStatus !== 'connected'" style="display: flex; gap: 8px; margin-bottom: 24px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); padding: 4px; border-radius: 20px;">
            <button 
              class="btn" 
              :class="linkMode === 'qr' ? 'btn-primary' : 'btn-secondary'" 
              style="padding: 6px 16px; font-size: 13px; border-radius: 16px; border: none;"
              @click="linkMode = 'qr'"
              :disabled="isSyncActive || isHotspotActive"
            >
              📱 {{ t.link.qrTab }}
            </button>
            <button 
              class="btn" 
              :class="linkMode === 'hotspot' ? 'btn-primary' : 'btn-secondary'" 
              style="padding: 6px 16px; font-size: 13px; border-radius: 16px; border: none;"
              @click="linkMode = 'hotspot'"
              :disabled="isSyncActive || isHotspotActive"
            >
              ⚡ {{ t.link.hotspotTab }}
            </button>
          </div>

          <!-- A. QR CODE MODE VIEW -->
          <div v-if="linkMode === 'qr' && syncStatus !== 'connected'" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 600px; gap: 20px; margin: auto 0;">
            <div v-if="!isSyncActive" style="display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;">
              <div style="font-size: 72px; animation: float 4s ease-in-out infinite;">📱</div>
              <h2 style="font-size: 24px; font-weight: 700;">{{ t.link.linkTitle }}</h2>
              <p style="color: var(--text-secondary); line-height: 1.6; font-size: 14px;">
                {{ t.link.linkDesc }}
              </p>
              <button class="btn btn-primary" style="padding: 12px 32px; font-size: 15px; border-radius: var(--border-radius-md);" @click="toggleSyncService">
                {{ t.link.startBtn }}
              </button>
            </div>
            
            <div v-else style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%;">
              <div v-if="syncStatus === 'starting'" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <span class="spinner" style="width: 32px; height: 32px;"></span>
                <p style="color: var(--text-secondary);">{{ t.link.initializing }}</p>
              </div>
              
              <div v-else-if="syncStatus === 'advertising'" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <canvas ref="qrCanvas" style="background-color: white; border-radius: 8px; padding: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); width: 180px; height: 180px;"></canvas>
                <h3 style="margin-top: 8px; font-size: 18px; font-weight: 600;">{{ t.link.advertisingTitle }}</h3>
                <p style="color: var(--text-secondary); font-size: 13px; max-width: 400px; line-height: 1.5; text-align: center;">
                  {{ t.link.advertisingDesc }}
                </p>
                <button class="btn btn-danger btn-sm" @click="toggleSyncService">
                  {{ t.link.stopBtn }}
                </button>
              </div>
              
              <div v-else-if="syncStatus === 'handshaking'" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <span class="spinner" style="width: 32px; height: 32px; border-top-color: var(--accent-primary);"></span>
                <p style="color: var(--text-secondary);">{{ t.link.handshaking }}</p>
              </div>
            </div>
          </div>

          <!-- B. WI-FI HOTSPOT MODE VIEW -->
          <div v-else-if="linkMode === 'hotspot' && syncStatus !== 'connected'" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 600px; gap: 20px; margin: auto 0;">
            <div v-if="!isHotspotActive && hotspotStatus !== 'starting'" style="display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;">
              <div style="font-size: 72px; animation: float 4s ease-in-out infinite;">⚡</div>
              <h2 style="font-size: 24px; font-weight: 700;">{{ t.link.hotspotTab }}</h2>
              <p style="color: var(--text-secondary); line-height: 1.6; font-size: 14px;">
                开启本地高速直连热点，手机连上此热点即可在完全离线、或无法使用路由器局域网的环境下进行跨设备同步。支持多重开启技术保障。
              </p>
              <div v-if="hotspotError" style="color: var(--danger); font-size: 13px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px 16px; border-radius: 8px;">
                {{ t.link.hotspotFailed }} ({{ hotspotError }})
              </div>
              <button class="btn btn-primary" style="padding: 12px 32px; font-size: 15px; border-radius: var(--border-radius-md);" @click="toggleHotspot">
                {{ t.link.startHotspot }}
              </button>
            </div>

            <div v-else style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%;">
              <!-- Hotspot Starting state -->
              <div v-if="hotspotStatus === 'starting'" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <span class="spinner" style="width: 32px; height: 32px;"></span>
                <p style="color: var(--text-secondary);">{{ t.link.hotspotStarting }}</p>
              </div>

              <!-- Hotspot Started/Running state -->
              <div v-else-if="hotspotStatus === 'started'" style="display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%;">
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 12px 24px; text-align: center; width: 100%; max-width: 440px;">
                  <h4 style="color: var(--success); font-weight: bold; margin-bottom: 8px;">{{ t.link.hotspotRunning }}</h4>
                  <div style="font-size: 14px; color: var(--text-primary); display: flex; flex-direction: column; gap: 6px; align-items: center;">
                    <div>Wi-Fi SSID: <strong style="color: #38bdf8; font-size: 15px;">{{ hotspotSsid }}</strong></div>
                    <div>Password: <strong style="color: #38bdf8; font-size: 15px;">{{ hotspotPassword }}</strong></div>
                  </div>
                </div>

                <!-- Pairing QR Code canvas when BLE sync is running concurrently -->
                <div v-if="syncStatus === 'advertising'" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <canvas ref="qrCanvas" style="background-color: white; border-radius: 8px; padding: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); width: 150px; height: 150px;"></canvas>
                  <p style="color: var(--text-secondary); font-size: 12px; max-width: 400px; line-height: 1.5; text-align: center; margin-top: 4px;">
                    {{ t.link.hotspotInstructions }}
                  </p>
                </div>
                <div v-else style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <span class="spinner" style="width: 24px; height: 24px;"></span>
                  <p style="color: var(--text-muted); font-size: 12px;">{{ t.link.initializing }}</p>
                </div>

                <button class="btn btn-danger btn-sm" @click="toggleHotspot">
                  {{ t.link.stopHotspot }}
                </button>
              </div>
            </div>
          </div>

          <!-- C. CONNECTED VIEW (Shared by both modes) -->
          <div v-if="syncStatus === 'connected'" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 600px; gap: 20px; margin: auto 0;">
            <div style="font-size: 56px; color: var(--success); filter: drop-shadow(0 0 10px rgba(16,185,129,0.4));">🟢</div>
            <h3 style="color: var(--success); font-size: 18px; font-weight: 600;">{{ t.link.connectedTitle }}</h3>
            <p style="color: var(--text-secondary); font-size: 13px;">{{ t.link.connectedDesc }}</p>
            <button class="btn btn-danger btn-sm" @click="isHotspotActive ? toggleHotspot() : toggleSyncService()">
              {{ isHotspotActive ? t.link.stopHotspot : t.link.disconnectBtn }}
            </button>
          </div>

          <!-- Connection logs panel (Shared by all states) -->
          <div style="margin-top: 24px; border: 1px solid var(--glass-border); border-radius: 8px; background: rgba(0, 0, 0, 0.4); padding: 12px; text-align: left; width: 100%; max-width: 600px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">
              <span>{{ t.link.logsTitle }}</span>
              <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 10px; border-radius: 4px;" @click="syncLogs = []">{{ t.link.clearLogs }}</button>
            </div>
            <div ref="logTerminalRef" style="height: 110px; overflow-y: auto; font-family: monospace; font-size: 11px; color: #38bdf8; line-height: 1.5; white-space: pre-wrap; padding: 4px;">
              <div v-for="(log, idx) in syncLogs" :key="idx">{{ log }}</div>
              <div v-if="syncLogs.length === 0" style="color: var(--text-muted); text-align: center; padding-top: 35px;">{{ t.link.waitingLogs }}</div>
            </div>
          </div>
        </div>

        <!-- 2. IMAGES TAB -->
        <div v-else-if="currentTab === 'images'" style="width: 100%;">
          <!-- Empty State -->
          <div class="empty-state" v-if="localImages.length === 0">
            <div class="empty-state-icon">🖼️</div>
            <h2 class="empty-state-title">{{ t.images.emptyImages }}</h2>
            <p class="empty-state-desc">
              {{ t.images.emptyImagesDesc }}
            </p>
            <button class="btn btn-primary" @click="handleSelectFolder">
              {{ t.images.importImagesBtn }}
            </button>
          </div>

          <!-- Grid display -->
          <div class="image-grid" v-else>
            <div 
              v-for="img in filteredImages" 
              :key="img.path" 
              class="image-card" 
              @click="openDetails(img)"
            >
              <div class="card-img-wrapper">
                <img :src="img.src" class="card-img" loading="lazy" />
                
                <!-- Processing Indicator -->
                <div class="loading-indicator" v-if="img.status === 'processing'">
                  <span class="spinner"></span>
                  <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">{{ t.images.aiAnalyzing }}</span>
                </div>
              </div>
              
              <div class="card-overlay">
                <span class="card-title">{{ img.name }}</span>
                
                <!-- Badges -->
                <span v-if="isSearchActive && img.searchScore !== undefined" class="badge badge-search-match">
                  🎯 {{ t.images.matchScore }} {{ getMatchPercentage(img.searchScore) }}%
                </span>
                <span v-else-if="img.status === 'completed' && img.predictions.length > 0" class="badge badge-classified">
                  {{ getShortCategory(img.predictions[0].category) }} ({{ Math.round(img.predictions[0].score * 100) }}%)
                </span>
                <span v-else-if="img.status === 'processing'" class="badge badge-loading">
                  <span class="spinner"></span> {{ t.images.aiAnalyzing }}
                </span>
                <span v-else class="badge badge-pending">
                  ⏳ {{ t.images.waitingQueue }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. VIDEOS TAB -->
        <div v-else-if="currentTab === 'videos'" style="width: 100%;">
          <!-- Empty State -->
          <div class="empty-state" v-if="localVideos.length === 0">
            <div class="empty-state-icon">🎥</div>
            <h2 class="empty-state-title">{{ t.media.emptyVideos }}</h2>
            <p class="empty-state-desc">
              {{ t.media.emptyVideosDesc }}
            </p>
          </div>

          <!-- Video Grid -->
          <div class="image-grid" v-else>
            <div 
              v-for="video in localVideos" 
              :key="video.path" 
              class="image-card" 
              @click="openDetails(video)"
            >
              <div class="card-img-wrapper" style="display: flex; align-items: center; justify-content: center; background-color: rgba(30, 41, 59, 0.3);">
                <span style="font-size: 48px;">🎬</span>
              </div>
              <div class="card-overlay">
                <span class="card-title">{{ video.name }}</span>
                <span class="badge" style="background-color: rgba(99, 102, 241, 0.15); color: #818cf8; border-color: rgba(99, 102, 241, 0.3); margin-top: 4px;">{{ t.media.fileVideo }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. AUDIOS TAB -->
        <div v-else-if="currentTab === 'audios'" style="width: 100%;">
          <!-- Empty State -->
          <div class="empty-state" v-if="localAudios.length === 0">
            <div class="empty-state-icon">🎵</div>
            <h2 class="empty-state-title">{{ t.media.emptyAudios }}</h2>
            <p class="empty-state-desc">
              {{ t.media.emptyAudiosDesc }}
            </p>
          </div>

          <!-- Audio List -->
          <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 800px; margin: 0 auto;" v-else>
            <div 
              v-for="audio in localAudios" 
              :key="audio.path"
              class="glass-panel"
              style="display: flex; align-items: center; justify-content: space-between; padding: 16px; cursor: pointer; border-radius: var(--border-radius-md);"
              @click="openDetails(audio)"
            >
              <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 32px;">🎵</span>
                <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                  <span style="font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 450px;">{{ audio.name }}</span>
                  <span style="font-size: 11px; color: var(--text-muted); word-break: break-all;">{{ audio.path }}</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" style="border-radius: 50%; width: 36px; height: 36px; padding: 0; display: inline-flex; align-items: center; justify-content: center; background-color: var(--accent-glow); border-color: rgba(99, 102, 241, 0.2);">
                ▶️
              </button>
            </div>
          </div>
        </div>

        <!-- 5. FILES TAB -->
        <div v-else-if="currentTab === 'files'" style="width: 100%;">
          <!-- Empty State -->
          <div class="empty-state" v-if="localDocs.length === 0">
            <div class="empty-state-icon">📄</div>
            <h2 class="empty-state-title">{{ t.media.emptyDocs }}</h2>
            <p class="empty-state-desc">
              {{ t.media.emptyDocsDesc }}
            </p>
          </div>

          <!-- Document List -->
          <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 800px; margin: 0 auto;" v-else>
            <div 
              v-for="doc in localDocs" 
              :key="doc.path"
              class="glass-panel"
              style="display: flex; align-items: center; justify-content: space-between; padding: 16px; cursor: pointer; border-radius: var(--border-radius-md);"
              @click="openDetails(doc)"
            >
              <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 32px;">📄</span>
                <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                  <span style="font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 500px;">{{ doc.name }}</span>
                  <span style="font-size: 11px; color: var(--text-muted); word-break: break-all;">{{ doc.path }}</span>
                </div>
              </div>
              <span class="badge badge-pending">{{ t.media.fileDoc }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Sleek Unified Transfer Dashboard (Sticky bottom when connected) -->
      <div class="transfer-dashboard" v-if="isSyncActive && syncStatus === 'connected'">
        <div class="dashboard-header">
          <div class="connection-status">
            <span class="status-indicator connected"></span>
            <div class="status-details">
              <span class="status-title">{{ t.link.connectedTitle }} (Companion Connected)</span>
              <span class="status-subtitle">GATT channel ready | P2P link active</span>
            </div>
          </div>
          
          <!-- Unified Dashboard Actions -->
          <div class="dashboard-actions">
            <button class="btn btn-primary btn-sm" @click="handleSendImagesToMobile" :disabled="pcActiveTransferName !== null">
              <span>📤</span> {{ t.details.sendToPhone }}
            </button>
            <button class="btn btn-danger btn-sm" @click="toggleSyncService">
              {{ t.link.disconnectBtn }}
            </button>
          </div>
        </div>
        
        <!-- Progress Area -->
        <div class="dashboard-progress-area">
          <!-- Outgoing transfer (PC -> Mobile) -->
          <div v-if="pcActiveTransferName" class="progress-card">
            <div class="progress-info">
              <span class="progress-filename" :title="pcActiveTransferName">📤 Sending: {{ pcActiveTransferName }}</span>
              <span class="progress-pct">{{ Math.round(pcActiveProgress * 100) }}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: (pcActiveProgress * 100) + '%' }"></div>
            </div>
          </div>
          
          <!-- Incoming transfer (Mobile -> PC) -->
          <div v-else-if="incomingTransfer" class="progress-card">
            <div class="progress-info">
              <span class="progress-filename">📥 Receiving: {{ incomingTransfer.name }}</span>
              <span class="progress-pct">{{ Math.round(incomingTransfer.progress * 100) }}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: (incomingTransfer.progress * 100) + '%' }"></div>
            </div>
          </div>
          
          <!-- Idle status -->
          <div v-else class="progress-card">
            <div class="idle-text">
              <span>⚡</span> Channel Idle
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Detailed Modal -->
    <div class="modal-backdrop" v-if="selectedImage" @click.self="closeDetails">
      <div class="modal-content">
        <button class="modal-close" @click="closeDetails">✕</button>
        
        <!-- Preview Side (Left) -->
        <div class="modal-preview-side">
          <img v-if="selectedItemType === 'image'" :src="selectedImage.src" class="modal-preview-img" />
          
          <video 
            v-else-if="selectedItemType === 'video'" 
            :src="selectedImage.src" 
            controls 
            autoplay 
            style="width: 100%; height: 100%; object-fit: contain; max-height: 75vh;"
          ></video>
          
          <div v-else-if="selectedItemType === 'audio'" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; width: 100%; padding: 40px;">
            <span style="font-size: 80px; animation: float 4s ease-in-out infinite;">🎵</span>
            <audio :src="selectedImage.src" controls autoplay style="width: 100%; max-width: 400px;"></audio>
          </div>
          
          <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; width: 100%; padding: 40px;">
            <span style="font-size: 80px;">📄</span>
            <span style="color: var(--text-secondary); font-size: 14px;">Preview not supported</span>
          </div>
        </div>
        
        <!-- Info Side (Right) -->
        <div class="modal-info-side">
          <h2 class="modal-info-title">{{ selectedImage.name }}</h2>
          <p class="modal-info-meta">{{ t.details.imagePath }}: {{ selectedImage.path }}</p>
          
          <!-- AI Predictions only for Images -->
          <div v-if="selectedItemType === 'image'">
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 20px; letter-spacing: 0.5px;">
              {{ t.details.predictionsTitle }}
            </h3>
            
            <!-- Similarity Charts -->
            <div class="prediction-section" v-if="selectedImage.status === 'completed' && selectedImage.predictions.length > 0">
              <!-- Search Match Score inside Modal -->
              <div v-if="isSearchActive && selectedImage.searchScore !== undefined" style="margin-bottom: 20px; padding: 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                  <span style="color: var(--accent-primary);">🔍 {{ t.images.matchScore }}</span>
                  <span style="color: var(--accent-primary);">{{ getMatchPercentage(selectedImage.searchScore) }}%</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary);">
                  Query: "{{ searchQuery }}"
                </div>
              </div>

              <div 
                v-for="(pred, index) in selectedImage.predictions" 
                :key="pred.category" 
                class="prediction-bar-container"
              >
                <div class="prediction-label-row">
                  <span class="prediction-label-name">{{ pred.category }}</span>
                  <span class="prediction-label-score">{{ (pred.score * 100).toFixed(1) }}%</span>
                </div>
                <div class="prediction-bar-bg">
                  <div 
                    class="prediction-bar-fill" 
                    :style="{ width: (pred.score * 100) + '%', transitionDelay: (index * 100) + 'ms' }"
                  ></div>
                </div>
              </div>
            </div>

            <div v-else-if="selectedImage.status === 'processing'" style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
              <span class="spinner" style="width: 24px; height: 24px; margin-bottom: 12px;"></span>
              <p>{{ t.images.aiAnalyzing }}</p>
            </div>

            <div v-else style="text-align: center; padding: 40px 0; color: var(--text-muted);">
              <p>{{ t.images.waitingQueue }}</p>
            </div>
          </div>
          
          <!-- General file description for Non-Images -->
          <div v-else style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
            <h3 style="font-size: 15px; font-weight: 600;">Metadata</h3>
            <div style="font-size: 13px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
              <div>{{ t.details.imageName }}: <code>{{ selectedImage.name }}</code></div>
              <div>Format: <code>{{ getExtensionName(selectedImage.name).toUpperCase() }}</code></div>
              <div>Category: <span class="badge badge-classified" style="margin-left: 6px;">{{ selectedItemType.toUpperCase() }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import { locales, languages } from './locales.js';

// Localization state
const currentLocale = ref('en'); // Defaults to English!
const t = computed(() => locales[currentLocale.value] || locales.en);

// Define double mode: Electron or Web Demo
const hasApi = typeof window !== 'undefined' && window.api !== undefined;

// State Variables
const images = ref([]);
const currentFolderPath = ref('');
const selectedCategory = ref(null);
const selectedImage = ref(null);
const currentTab = ref('images'); // 'link' | 'images' | 'videos' | 'audios' | 'files'
const activeDeviceUuid = ref(null);
const activeMetadata = {}; // fileId -> { assetId, name, size }

const selectedItemType = computed(() => {
  if (!selectedImage.value) return '';
  const ext = getExtensionName(selectedImage.value.name);
  if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'].includes(ext)) return 'image';
  if (['.mp4', '.mkv', '.mov', '.avi', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.m4a', '.ogg', '.flac'].includes(ext)) return 'audio';
  return 'file';
});

function getExtensionName(filename) {
  if (!filename) return '';
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex !== -1 ? filename.substring(dotIndex).toLowerCase() : '';
}

const localImages = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'].includes(ext);
  });
});

const localVideos = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return ['.mp4', '.mkv', '.mov', '.avi', '.webm'].includes(ext);
  });
});

const localAudios = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return ['.mp3', '.wav', '.m4a', '.ogg', '.flac'].includes(ext);
  });
});

const localDocs = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.xlsx', '.pptx'].includes(ext);
  });
});

// BLE Signaling and WebRTC synchronization state
const isSyncActive = ref(false);
const syncStatus = ref('idle'); // 'idle' | 'starting' | 'advertising' | 'handshaking' | 'connected'
const qrPayload = ref(null);
const qrCanvas = ref(null);
const syncLogs = ref([]);
const logTerminalRef = ref(null);

// Hotspot State Variables
const linkMode = ref('qr'); // 'qr' | 'hotspot'
const isHotspotActive = ref(false);
const hotspotStatus = ref('idle'); // 'idle' | 'starting' | 'started' | 'failed'
const hotspotSsid = ref('');
const hotspotPassword = ref('');
const hotspotError = ref('');
const pcActiveTransferName = ref(null);
const pcActiveProgress = ref(0.0);
const incomingTransfer = ref(null);
const isDarkMode = ref(true);

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
}

let peerConnection = null;
let dataChannel = null;
let heartbeatTimer = null;
let lastHeartbeatTime = 0;

// Custom logging function for terminal view
function logSyncEvent(msg) {
  console.log(msg);
  syncLogs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (syncLogs.value.length > 50) {
    syncLogs.value.shift();
  }
  nextTick(() => {
    if (logTerminalRef.value) {
      logTerminalRef.value.scrollTop = logTerminalRef.value.scrollHeight;
    }
  });
}

// Clean up WebRTC connection state
function cleanupWebRtc() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (dataChannel) {
    try { dataChannel.close(); } catch (e) {}
    dataChannel = null;
  }
  if (peerConnection) {
    try { peerConnection.close(); } catch (e) {}
    peerConnection = null;
  }
}

function generateHotspotCredentials() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  hotspotSsid.value = `ShareCLIP_${randomSuffix}`;
  
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  hotspotPassword.value = pass;
}

async function toggleHotspot() {
  if (isHotspotActive.value) {
    hotspotStatus.value = 'idle';
    isHotspotActive.value = false;
    logSyncEvent('[Hotspot] Stopping Wi-Fi hotspot...');
    
    // Stop BLE sync service as well if running
    if (isSyncActive.value) {
      await toggleSyncService();
    }

    try {
      await window.api.stopHotspot();
      logSyncEvent('🟢 [Hotspot] Wi-Fi hotspot stopped.');
    } catch (err) {
      logSyncEvent(`⚠️ [Hotspot] Error stopping: ${err.message}`);
    }
  } else {
    generateHotspotCredentials();
    hotspotStatus.value = 'starting';
    isHotspotActive.value = true;
    hotspotError.value = '';
    logSyncEvent(`[Hotspot] Starting Wi-Fi hotspot (SSID: ${hotspotSsid.value})...`);
    
    try {
      const res = await window.api.startHotspot(hotspotSsid.value, hotspotPassword.value);
      hotspotStatus.value = 'started';
      logSyncEvent(`🟢 [Hotspot] Wi-Fi hotspot active (SSID: ${res.ssid}).`);
      
      // Automatically start BLE sync service if not already active
      if (!isSyncActive.value) {
        logSyncEvent('[Hotspot] Starting BLE sync service concurrently...');
        await toggleSyncService();
      }
    } catch (err) {
      hotspotStatus.value = 'failed';
      isHotspotActive.value = false;
      hotspotError.value = err.message || 'Unknown error';
      logSyncEvent(`❌ [Hotspot] Activation failed: ${err.message}`);
    }
  }
}

// Toggle BLE advertising and sync service
async function toggleSyncService() {
  if (isSyncActive.value) {
    isSyncActive.value = false;
    syncStatus.value = 'idle';
    cleanupWebRtc();
    logSyncEvent("停止手机同步服务，正在关闭蓝牙广播和通道。");
    if (hasApi) {
      await window.api.stopBleServer();
    }
  } else {
    isSyncActive.value = true;
    syncStatus.value = 'starting';
    syncLogs.value = []; // Reset log view
    logSyncEvent("正在开启同步服务，启动本地 BLE GATT 广播...");
    if (hasApi) {
      try {
        const payload = await window.api.startBleServer();
        qrPayload.value = payload;
        syncStatus.value = 'advertising';
        logSyncEvent(`GATT 广播成功! MAC: ${payload.ble_mac}, Session: ${payload.session_id}`);
        await nextTick();
        if (qrCanvas.value) {
          QRCode.toCanvas(qrCanvas.value, JSON.stringify(payload), { width: 140, margin: 1 }, (error) => {
            if (error) logSyncEvent(`⚠️ QR Code error: ${error.message}`);
          });
        }
      } catch (err) {
        logSyncEvent(`❌ BLE GATT 启动失败: ${err.message || err}`);
        isSyncActive.value = false;
        syncStatus.value = 'idle';
      }
    } else {
      // Mock Demo Web fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      qrPayload.value = { ble_mac: '90:09:DF:CB:0E:66', service_uuid: '6e400001', char_uuid: '6e400002', session_id: '9999' };
      syncStatus.value = 'advertising';
      logSyncEvent("Mock 模式: 蓝牙广播模拟中...");
      await nextTick();
      if (qrCanvas.value) {
        QRCode.toCanvas(qrCanvas.value, JSON.stringify(qrPayload.value), { width: 140, margin: 1 });
      }
    }
  }
}

// Set up the WebRTC DataChannel callbacks
function setupDataChannel(channel) {
  channel.binaryType = 'arraybuffer';
  
  channel.onopen = () => {
    logSyncEvent("🟢 WebRTC 数据通道 'photo_sync' 已开启!");
    syncStatus.value = 'connected';
    
    // Start heartbeat timer
    lastHeartbeatTime = Date.now();
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (Date.now() - lastHeartbeatTime > 15000) {
        logSyncEvent("⚠️ 心跳超时：手机端已离线");
        cleanupWebRtc();
        if (isSyncActive.value) {
          syncStatus.value = 'advertising';
          nextTick(() => {
            if (qrCanvas.value && qrPayload.value) {
              QRCode.toCanvas(qrCanvas.value, JSON.stringify(qrPayload.value), { width: 140, margin: 1 });
            }
          });
        }
      }
    }, 3000);
  };
  
  channel.onclose = () => {
    logSyncEvent("🔴 WebRTC 数据通道已关闭。");
    if (isSyncActive.value) {
      syncStatus.value = 'advertising';
      cleanupWebRtc();
      nextTick(() => {
        if (qrCanvas.value && qrPayload.value) {
          QRCode.toCanvas(qrCanvas.value, JSON.stringify(qrPayload.value), { width: 140, margin: 1 });
        }
      });
    }
  };
  
  channel.onmessage = (event) => {
    const arrayBuffer = event.data;
    if (arrayBuffer.byteLength < 16) {
      logSyncEvent("⚠️ 收到异常数据包: 头部小于16字节");
      return;
    }
    
    const view = new DataView(arrayBuffer);
    const fileId = view.getInt32(0, false);
    
    // Heartbeat check: fileId === -1 is Ping from Android
    if (fileId === -1) {
      lastHeartbeatTime = Date.now();
      // Send Pong back (fileId = -2)
      const pongBuffer = new ArrayBuffer(16);
      const pongView = new DataView(pongBuffer);
      pongView.setInt32(0, -2, false);
      pongView.setInt32(4, 0, false);
      pongView.setInt32(8, 0, false);
      pongView.setInt32(12, 0, false);
      if (channel.readyState === 'open') {
        channel.send(pongBuffer);
      }
      return;
    }

    // Pong check
    if (fileId === -2) {
      lastHeartbeatTime = Date.now();
      return;
    }

    // Handshake request from phone (UUID registration)
    if (fileId === -3) {
      const payloadSize = view.getInt32(12, false);
      const payloadBytes = new Uint8Array(arrayBuffer, 16, payloadSize);
      const decoder = new TextDecoder('utf-8');
      const payloadStr = decoder.decode(payloadBytes);
      const handshake = JSON.parse(payloadStr);
      
      const deviceUuid = handshake.device_uuid;
      const deviceName = handshake.device_name;
      
      logSyncEvent(`📱 收到手机握手请求: [${deviceName}] (${deviceUuid})`);
      
      if (hasApi) {
        window.api.initDeviceSync(deviceUuid, deviceName).then((syncInfo) => {
          activeDeviceUuid.value = deviceUuid;
          
          // Clear current media array and populate with the device's SQL catalog
          images.value = syncInfo.resources.map(res => ({
            id: res.id,
            path: res.path,
            name: res.name,
            src: `local:///${res.path.replace(/\\/g, '/')}`,
            status: 'completed',
            predictions: JSON.parse(res.predictions || '[]')
          }));
          
          logSyncEvent(`📊 本地数据库同步成功，已恢复 ${syncInfo.syncedIds.length} 个历史传输资源，发送握手回应包...`);
          
          const responseStr = JSON.stringify({ synced_ids: syncInfo.syncedIds });
          const encoder = new TextEncoder();
          const responseBytes = encoder.encode(responseStr);
          
          const responseBuffer = new ArrayBuffer(16 + responseBytes.byteLength);
          const responseView = new DataView(responseBuffer);
          responseView.setInt32(0, -4, false); // Response type = -4
          responseView.setInt32(4, 0, false);
          responseView.setInt32(8, 0, false);
          responseView.setInt32(12, responseBytes.byteLength, false);
          
          new Uint8Array(responseBuffer, 16).set(responseBytes);
          if (channel.readyState === 'open') {
            channel.send(responseBuffer);
          }
        });
      }
      return;
    }

    // Metadata packet containing filename and asset ID
    if (fileId === -5) {
      const payloadSize = view.getInt32(12, false);
      const payloadBytes = new Uint8Array(arrayBuffer, 16, payloadSize);
      const decoder = new TextDecoder('utf-8');
      const payloadStr = decoder.decode(payloadBytes);
      const metadata = JSON.parse(payloadStr);
      
      activeMetadata[metadata.file_id] = {
        assetId: metadata.asset_id,
        name: metadata.name,
        size: metadata.size
      };
      
      logSyncEvent(`📝 收到文件元数据: [ID: ${metadata.file_id}] ${metadata.name} (${(metadata.size / 1024 / 1024).toFixed(2)} MB)`);
      return;
    }
    
    const chunkIndex = view.getInt32(4, false);
    const totalChunks = view.getInt32(8, false);
    const payloadSize = view.getInt32(12, false);
    
    // Update incoming progress state
    incomingTransfer.value = {
      progress: (chunkIndex + 1) / totalChunks,
      name: activeMetadata[fileId] ? activeMetadata[fileId].name : `文件 ID ${fileId}`
    };

    const payload = new Uint8Array(arrayBuffer, 16, payloadSize);
    logSyncEvent(`📥 接收分片: ${chunkIndex + 1}/${totalChunks} (文件ID: ${fileId})`);
    
    if (hasApi) {
      window.api.savePhotoChunk(fileId, chunkIndex, totalChunks, payload, activeMetadata[fileId]);
    }
  };
}

// Register listeners on mount
onMounted(() => {
  if (hasApi) {
    // 1. Offer SDP received from mobile client
    window.api.onOfferReceived(async (offerSdp) => {
      logSyncEvent("📡 蓝牙信令通道收到 WebRTC Offer SDP!");
      syncStatus.value = 'handshaking';
      
      cleanupWebRtc();
      
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };
      
      peerConnection = new RTCPeerConnection(configuration);
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          logSyncEvent(`📡 收集到本地 ICE Candidate: ${event.candidate.candidate.split(' ')[0]}`);
          window.api.sendIceCandidate(
            event.candidate.sdpMid,
            event.candidate.sdpMLineIndex,
            event.candidate.candidate
          );
        }
      };
      
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription({
          type: 'offer',
          sdp: offerSdp
        }));
        logSyncEvent("📡 成功装载 Remote Description (Offer)");
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        logSyncEvent("📡 成功创建 Answer SDP，写入蓝牙广播通道...");
        await window.api.sendAnswerSdp(answer.sdp);
      } catch (err) {
        logSyncEvent(`❌ WebRTC 协商握手失败: ${err.message || err}`);
        syncStatus.value = 'advertising';
      }
      
      peerConnection.ondatachannel = (event) => {
        if (event.channel.label === 'photo_sync') {
          logSyncEvent("📡 监听到直连数据通道创建请求");
          dataChannel = event.channel;
          setupDataChannel(dataChannel);
        }
      };
    });
    
    // 2. ICE Candidate received from mobile client
    window.api.onRemoteIceReceived((data) => {
      if (peerConnection) {
        logSyncEvent("📡 注入远端 ICE Candidate...");
        peerConnection.addIceCandidate(new RTCIceCandidate({
          sdpMid: data.sdpMid,
          sdpMLineIndex: data.sdpMLineIndex,
          candidate: data.candidate
        })).catch(err => console.error("ICE injection error:", err));
      }
    });
    
    // 3. BLE GATT status update
    window.api.onBleStatusChanged((status) => {
      logSyncEvent(`[BLE STATUS] 状态变更: ${status}`);
      if (status === 'connected') {
        if (syncStatus.value !== 'connected') {
          syncStatus.value = 'handshaking';
        }
      } else if (status === 'disconnected') {
        if (syncStatus.value !== 'connected') {
          cleanupWebRtc();
          if (isSyncActive.value) {
            syncStatus.value = 'advertising';
            nextTick(() => {
              if (qrCanvas.value && qrPayload.value) {
                QRCode.toCanvas(qrCanvas.value, JSON.stringify(qrPayload.value), { width: 140, margin: 1 });
              }
            });
          }
        } else {
          logSyncEvent("📡 蓝牙信令通道断开，但 WebRTC 直连通道依然活跃 (BLE disconnected, keeping WebRTC open)");
        }
      }
    });
    
    // 4. File reassembly completed
    window.api.onPhotoSynced((imageInfo) => {
      logSyncEvent(`🎉 图片接收完成并自动分类: ${imageInfo.name}`);
      incomingTransfer.value = null;
      
      images.value.push({
        path: imageInfo.path,
        name: imageInfo.name,
        src: imageInfo.src,
        status: 'completed',
        predictions: imageInfo.predictions
      });
      
      totalCount.value = images.value.length;
      if (!currentFolderPath.value || currentFolderPath.value === '自定义多图导入') {
        currentFolderPath.value = '同步自移动端相册';
      }
    });

    // 5. System log messages received from BLE Server Process
    window.api.onLogReceived((msg) => {
      logSyncEvent(msg);
    });

    // 6. Wi-Fi Hotspot status changes
    window.api.onHotspotStatusChanged((status) => {
      logSyncEvent(`[Hotspot] Status changed: ${status}`);
      if (status === 'stopped') {
        isHotspotActive.value = false;
        hotspotStatus.value = 'idle';
      }
    });
  }
});

// Send local images on PC to the mobile device
async function handleSendImagesToMobile() {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent("⚠️ 无法发送图片：数据通道未建立或已关闭");
    return;
  }

  try {
    const selectedPaths = await window.api.selectImages();
    if (!selectedPaths || selectedPaths.length === 0) {
      return;
    }

    logSyncEvent(`📤 准备向手机发送 ${selectedPaths.length} 张图片...`);

    let fileIdCounter = Math.floor(1000 + Math.random() * 8000);

    for (const filePath of selectedPaths) {
      const fileName = filePath.split(/[/\\]/).pop();
      logSyncEvent(`📤 正在读取文件: ${fileName}`);
      
      pcActiveTransferName.value = `正在发送 ${fileName}...`;
      pcActiveProgress.value = 0;
      
      const fileBytes = await window.api.readImageBytes(filePath);
      
      const fileId = fileIdCounter++;
      const chunkSize = 32768; // 32KB
      const totalChunks = Math.ceil(fileBytes.length / chunkSize);
      
      logSyncEvent(`📤 开始传输: ${fileName} (ID: ${fileId}), 共 ${totalChunks} 分片`);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileBytes.length);
        const chunkData = fileBytes.subarray(start, end);
        
        // 16-byte header: file_id(4B), chunk_index(4B), total_chunks(4B), payload_size(4B)
        const packet = new Uint8Array(16 + chunkData.length);
        const view = new DataView(packet.buffer);
        
        view.setInt32(0, fileId, false);
        view.setInt32(4, i, false);
        view.setInt32(8, totalChunks, false);
        view.setInt32(12, chunkData.length, false);
        
        packet.set(chunkData, 16);
        
        // Send packet over DataChannel
        dataChannel.send(packet.buffer);

        // Update progress state
        pcActiveProgress.value = (i + 1) / totalChunks;

        // Control flow pacing to avoid buffer overflow
        if (dataChannel.bufferedAmount > 1048576) { // 1MB buffer limit
          await new Promise(resolve => {
            const checkBuffer = () => {
              if (dataChannel.bufferedAmount < 262144) { // wait until < 256KB
                resolve();
              } else {
                setTimeout(checkBuffer, 20);
              }
            };
            checkBuffer();
          });
        }

        // Tiny inter-packet pacing delay (5ms)
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      logSyncEvent(`🎉 文件发送完成: ${fileName}`);
      pcActiveTransferName.value = null;
      pcActiveProgress.value = 0;
    }

  } catch (err) {
    logSyncEvent(`❌ 发送图片出错: ${err.message || err}`);
    pcActiveTransferName.value = null;
    pcActiveProgress.value = 0;
  }
}

onUnmounted(() => {
  cleanupWebRtc();
  if (hasApi) {
    window.api.stopBleServer();
  }
});

// Search State Variables
const searchQuery = ref('');
const isSearchActive = ref(false);
const isSearching = ref(false);

// Queue Processing variables
const queue = ref([]);
const activeCount = ref(0);
const processedCount = ref(0);
const totalCount = ref(0);
const MAX_CONCURRENT = 3;

const isProcessing = computed(() => activeCount.value > 0 || queue.value.length > 0);
const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((processedCount.value / totalCount.value) * 100);
});

// Category counts based on Top-1 predictions
const categoryCounts = computed(() => {
  const counts = {};
  localImages.value.forEach(img => {
    if (img.status === 'completed' && img.predictions.length > 0) {
      const topCat = img.predictions[0].category;
      counts[topCat] = (counts[topCat] || 0) + 1;
    }
  });
  return counts;
});

// Filter and sort images based on sidebar selection and active search
const filteredImages = computed(() => {
  let list = [];
  if (selectedCategory.value === null) {
    list = [...localImages.value];
  } else {
    list = localImages.value.filter(img => 
      img.status === 'completed' && 
      img.predictions.length > 0 && 
      img.predictions[0].category === selectedCategory.value
    );
  }

  // If search is active, sort by searchScore descending
  if (isSearchActive.value) {
    list.sort((a, b) => {
      const scoreA = a.searchScore !== undefined ? a.searchScore : -1;
      const scoreB = b.searchScore !== undefined ? b.searchScore : -1;
      return scoreB - scoreA;
    });
  }

  return list;
});

// Normalize raw cosine similarity to percentage (0% to 100%)
function getMatchPercentage(score) {
  if (score === undefined || score === null || score <= 0) return 0;
  // Map similarity range [0.10, 0.30] to [0.0, 1.0]
  const minSim = 0.10;
  const maxSim = 0.30;
  let normalized = (score - minSim) / (maxSim - minSim);
  normalized = Math.max(0, Math.min(1, normalized));
  return Math.round(normalized * 100);
}

// Helper for extracting clean categories to show in cards
function getShortCategory(fullName) {
  const match = fullName.match(/^([^\(]+)/);
  return match ? match[1].trim() : fullName;
}


// Perform semantic search
async function handleSearch() {
  const query = searchQuery.value.trim();
  if (!query) {
    handleClearSearch();
    return;
  }

  isSearching.value = true;
  selectedCategory.value = null; // Reset category filter to show all search results
  
  try {
    if (hasApi) {
      const paths = images.value.map(img => img.path);
      const results = await window.api.searchPhotos(query, paths);
      
      // Map results path to score
      const scoreMap = {};
      results.forEach(res => {
        scoreMap[res.path] = res.score;
      });
      
      // Assign search score to each image
      images.value.forEach(img => {
        img.searchScore = scoreMap[img.path] !== undefined ? scoreMap[img.path] : -1;
      });
    } else {
      // Web demo mock search
      await new Promise(resolve => setTimeout(resolve, 600));
      images.value.forEach(img => {
        const match = img.name.toLowerCase().includes(query.toLowerCase());
        img.searchScore = match ? 0.25 + Math.random() * 0.10 : 0.05 + Math.random() * 0.05;
      });
    }
    
    isSearchActive.value = true;
  } catch (err) {
    console.error("Search failed:", err);
  } finally {
    isSearching.value = false;
  }
}

// Clear search results
function handleClearSearch() {
  searchQuery.value = '';
  isSearchActive.value = false;
  images.value.forEach(img => {
    img.searchScore = undefined;
  });
}

// Select a folder
async function handleSelectFolder() {
  if (hasApi) {
    const result = await window.api.selectFolder();
    if (result && result.images && result.images.length > 0) {
      currentFolderPath.value = result.folderPath;
      loadFiles(result.images);
    }
  } else {
    // Web Demo Mock Mode
    currentFolderPath.value = '/Mock/User/Pictures/Album';
    const mockImageUrls = getMockData();
    loadFiles(mockImageUrls);
  }
}

// Select specific images
async function handleSelectImages() {
  if (hasApi) {
    const result = await window.api.selectImages();
    if (result && result.length > 0) {
      currentFolderPath.value = '自定义多图导入';
      loadFiles(result);
    }
  } else {
    // Web Demo Mock Mode
    currentFolderPath.value = '自定义多图导入';
    const mockImageUrls = getMockData().slice(0, 4);
    loadFiles(mockImageUrls);
  }
}

// Load list of file paths into state
function loadFiles(filePaths) {
  // Clean old state
  images.value = [];
  queue.value = [];
  processedCount.value = 0;
  totalCount.value = 0;
  activeCount.value = 0;

  // Reset search state
  searchQuery.value = '';
  isSearchActive.value = false;

  const newImages = filePaths.map(filePath => {
    // Extract filename
    let name = '';
    let src = '';
    
    if (hasApi) {
      const slashIndex = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
      name = filePath.substring(slashIndex + 1);
      // use local:// custom protocol and normalize backslashes to forward slashes
      src = `local:///${filePath.replace(/\\/g, '/')}`;
    } else {
      // Mock mode
      name = filePath.name;
      src = filePath.url;
    }

    return {
      path: hasApi ? filePath : filePath.url,
      name: name,
      src: src,
      status: 'pending',
      predictions: []
    };
  });

  images.value = newImages;
  totalCount.value = newImages.length;

  // Add all to the processing queue
  queue.value = [...newImages];
  
  // Kickstart queue processing
  for (let i = 0; i < MAX_CONCURRENT; i++) {
    processNextQueueItem();
  }
}

// Process queue items concurrently
async function processNextQueueItem() {
  if (queue.value.length === 0 || activeCount.value >= MAX_CONCURRENT) {
    return;
  }

  // Pop from queue
  const imgItem = queue.value.shift();

  // Bypass classification for non-images
  const ext = getExtensionName(imgItem.name);
  const isImg = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'].includes(ext);
  
  if (!isImg) {
    imgItem.status = 'completed';
    imgItem.predictions = [];
    processedCount.value++;
    // Trigger next in queue
    processNextQueueItem();
    return;
  }

  imgItem.status = 'processing';
  activeCount.value++;

  try {
    let results = [];
    if (hasApi) {
      // Call main process via preload bridge
      results = await window.api.classifyPhoto(imgItem.path);
    } else {
      // Mock web demo classification delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
      results = getMockClassification(imgItem.src);
    }

    imgItem.predictions = results;
    imgItem.status = 'completed';
  } catch (error) {
    console.error("Failed to classify image:", error);
    imgItem.status = 'failed';
    imgItem.predictions = [{ category: '❌ 识别失败', score: 1.0 }];
  } finally {
    processedCount.value++;
    activeCount.value--;
    // Trigger next in queue
    processNextQueueItem();
  }
}

// Modal Interaction
function openDetails(img) {
  selectedImage.value = img;
}

// Clear search and close modal details
function closeDetails() {
  selectedImage.value = null;
}

// MOCK DATA FOR BROWSER RUNS
function getMockData() {
  return [
    { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', name: '风景_黄石公园.jpg' },
    { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80', name: '城市_金融街.jpg' },
    { url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80', name: '宠物_金毛犬.jpg' },
    { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', name: '美食_牛排意面.jpg' },
    { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', name: '人像_女孩写真.jpg' },
    { url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600&auto=format&fit=crop&q=80', name: '证件_办公报告.jpg' },
    { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80', name: '汽车_公路驰骋.jpg' },
    { url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80', name: '购物_商场橱窗.jpg' }
  ];
}

function getMockClassification(url) {
  const mapping = {
    '506744038136': [
      { category: '🏞️ 乡村与自然风景 (Landscape)', score: 0.92 },
      { category: '🏙️ 城市与建筑 (Cityscape)', score: 0.05 },
      { category: '🐱 宠物与动物 (Pets & Animals)', score: 0.03 }
    ],
    '486406146926': [
      { category: '🏙️ 城市与建筑 (Cityscape)', score: 0.88 },
      { category: '🏞️ 乡村与自然风景 (Landscape)', score: 0.08 },
      { category: '🚗 车辆与交通工具 (Vehicles)', score: 0.04 }
    ],
    '543466835-00a7907e9de1': [
      { category: '🐱 宠物与动物 (Pets & Animals)', score: 0.95 },
      { category: '🧑 人像与自拍 (Portrait)', score: 0.03 },
      { category: '🏞️ 乡村与自然风景 (Landscape)', score: 0.02 }
    ],
    '504674900247': [
      { category: '🍜 美食与饮品 (Food & Drinks)', score: 0.94 },
      { category: '🛍️ 商品与购物 (Shopping)', score: 0.04 },
      { category: '🏞️ 乡村与自然风景 (Landscape)', score: 0.02 }
    ],
    '534528741775': [
      { category: '🧑 人像与自拍 (Portrait)', score: 0.91 },
      { category: '🐱 宠物与动物 (Pets & Animals)', score: 0.06 },
      { category: '🛍️ 商品与购物 (Shopping)', score: 0.03 }
    ],
    '554415707-6e8cfc93fe23': [
      { category: '📄 文档与证件截图 (Document)', score: 0.89 },
      { category: '🛍️ 商品与购物 (Shopping)', score: 0.07 },
      { category: '🏙️ 城市与建筑 (Cityscape)', score: 0.04 }
    ],
    '503376780353': [
      { category: '🚗 车辆与交通工具 (Vehicles)', score: 0.93 },
      { category: '🏙️ 城市与建筑 (Cityscape)', score: 0.05 },
      { category: '🏞️ 乡村与自然风景 (Landscape)', score: 0.02 }
    ],
    '472851294608': [
      { category: '🛍️ 商品与购物 (Shopping)', score: 0.87 },
      { category: '🏙️ 城市与建筑 (Cityscape)', score: 0.09 },
      { category: '🍜 美食与饮品 (Food & Drinks)', score: 0.04 }
    ]
  };

  for (const [key, val] of Object.entries(mapping)) {
    if (url.includes(key)) return val;
  }

  return [
    { category: '🏞️ 乡村与自然风景 (Landscape)', score: 0.60 },
    { category: '🐱 宠物与动物 (Pets & Animals)', score: 0.25 },
    { category: '🏙️ 城市与建筑 (Cityscape)', score: 0.15 }
  ];
}
</script>
