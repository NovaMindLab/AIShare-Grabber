<template>
  <div class="app-container" :class="{ 'light-mode': !isDarkMode }">
    <!-- Custom Windows Window Title Bar -->
    <div class="custom-title-bar" v-if="hasApi">
      <div class="title-bar-left">
        <span class="title-bar-icon">📸</span>
        <span class="title-bar-text">ShareCLIP</span>
      </div>
      <div class="title-bar-drag-area"></div>
      <div class="title-bar-actions">
        <button 
          class="title-bar-btn settings-top-btn" 
          :class="{ active: currentTab === 'settings' }"
          @click="currentTab = 'settings'" 
          :title="t.titlebar?.settingsTitle || t.sidebar?.settings"
        >
          <span style="font-size: 13px;">⚙️</span>
          <span style="font-size: 12px; font-weight: 600; margin-left: 4px;">{{ t.titlebar?.settings || t.sidebar?.settings }}</span>
        </button>
        <button class="title-bar-btn minimize" @click="minimizeWindow" :title="t.titlebar?.minimize || 'Minimize'">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10v1H0z" fill="currentColor"/></svg>
        </button>
        <button class="title-bar-btn maximize" @click="maximizeWindow" :title="t.titlebar?.maximize || 'Maximize'">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/></svg>
        </button>
        <button class="title-bar-btn close" @click="closeWindow" :title="t.titlebar?.close || 'Close'">
          <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
        </button>
      </div>
    </div>

    <!-- Custom Confirm Modal -->
    <Transition name="modal-fade">
      <div v-if="confirmModal.visible" style="position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px);" @click.self="confirmModal.visible = false">
        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 28px 32px; max-width: 440px; width: 90%; box-shadow: 0 25px 60px rgba(0,0,0,0.6); position: relative;">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
            <div :style="{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: confirmModal.danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(168, 85, 247, 0.15)',
              border: confirmModal.danger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }">{{ confirmModal.icon }}</div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: var(--text-primary);">{{ confirmModal.title }}</h3>
          </div>
          <p style="margin: 0 0 24px 0; font-size: 13.5px; line-height: 1.7; color: var(--text-secondary); white-space: pre-line;">{{ confirmModal.message }}</p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button @click="confirmModal.onCancel && confirmModal.onCancel(); confirmModal.visible = false" style="padding: 9px 22px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">{{ t.confirm?.cancel || 'Cancel' }}</button>
            <button @click="confirmModal.onConfirm && confirmModal.onConfirm(); confirmModal.visible = false" :style="{
              padding: '9px 22px',
              borderRadius: '10px',
              border: 'none',
              background: confirmModal.danger ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: confirmModal.danger ? '0 4px 16px rgba(239,68,68,0.45)' : '0 4px 16px rgba(168,85,247,0.45)',
              transition: 'all 0.2s'
            }">{{ confirmModal.confirmText || t.confirm?.confirm || 'Confirm' }}</button>
          </div>
        </div>
      </div>
    </Transition>

        <!-- Main App Body -->
    <div class="app-body">
      <!-- Sidebar -->
      <aside class="sidebar">
      <div class="brand" style="display: flex; align-items: center; gap: 10px;">
        <span class="brand-icon">📸</span>
        <div style="display: flex; flex-direction: column; text-align: left;">
          <h1 class="brand-title" style="margin: 0; line-height: 1.1;">ShareCLIP</h1>
          <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); opacity: 0.75; letter-spacing: 0.5px; margin-top: 3px;">v{{ currentVersion || '1.2.50' }}</span>
        </div>
      </div>

      <!-- 1. Interconnection / Connect -->
      <div class="sidebar-section">
        <h2 class="section-title">{{ t.sidebar.connHeader || '互联互传' }}</h2>
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

      <!-- 2. Photos & AI Albums -->
      <div class="sidebar-section">
        <h2 class="section-title">{{ t.sidebar.photosHeader || '照片与相册' }}</h2>
        <div class="category-list">
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'images' }"
            @click="currentTab = 'images'"
          >
            <span>{{ t.sidebar.tabImages }}</span>
            <span class="category-count" v-if="localImages.length > 0 || isReclassifying || aiQueueProgress.isProcessing" :class="{ 'ai-processing-badge': isReclassifying || aiQueueProgress.isProcessing }">{{ picturesBadgeText }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'album' }"
            @click="currentTab = 'album'"
          >
            <span>{{ t.sidebar.tabAlbum }}</span>
            <span class="category-count" v-if="albumBackupImages.length > 0">{{ albumBackupImages.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'people' }"
            @click="currentTab = 'people'"
          >
            <span>{{ t.sidebar.tabPeople || '👥 人物相册' }}</span>
            <span class="category-count" v-if="personClusters.length > 0">{{ personClusters.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'map' }"
            @click="currentTab = 'map'"
          >
            <span>{{ t.sidebar.tabMap || '🗺️ 足迹地图' }}</span>
            <span class="category-count" v-if="imagesWithGps.length > 0">{{ imagesWithGps.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'similar' }"
            @click="currentTab = 'similar'"
          >
            <span>{{ t.sidebar.tabSimilar }}</span>
            <span class="category-count" v-if="similarGroups.length > 0">{{ similarGroups.length }}</span>
          </div>
        </div>
      </div>

      <!-- 3. Media & Files -->
      <div class="sidebar-section">
        <h2 class="section-title">{{ t.sidebar.mediaHeader || '影音与文件' }}</h2>
        <div class="category-list">
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'videos' }"
            @click="currentTab = 'videos'"
          >
            <span>{{ t.sidebar.tabVideos }}</span>
            <span class="category-count" v-if="localVideos.length > 0">{{ localVideos.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'audios' }"
            @click="currentTab = 'audios'"
          >
            <span>{{ t.sidebar.tabAudios }}</span>
            <span class="category-count" v-if="localAudios.length > 0">{{ localAudios.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'files' }"
            @click="currentTab = 'files'"
          >
            <span>{{ t.sidebar.tabFiles }}</span>
            <span class="category-count" v-if="localDocs.length > 0">{{ localDocs.length }}</span>
          </div>
        </div>
      </div>

      <!-- 4. Tools -->
      <div class="sidebar-section">
        <h2 class="section-title">{{ t.sidebar.toolsHeader || '扩展工具' }}</h2>
        <div class="category-list">
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'yt-dlp' }"
            @click="currentTab = 'yt-dlp'"
          >
            <span>{{ t.sidebar.tabYtDlp || '📺 视频下载' }}</span>
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
            @click="selectCategory(null)"
          >
            <span>{{ t.sidebar.allImages }}</span>
            <span class="category-count" :class="{ 'ai-processing-badge': isReclassifying || aiQueueProgress.isProcessing }">{{ picturesBadgeText }}</span>
          </div>
          <div 
            v-for="(count, cat) in categoryCounts" 
            :key="cat" 
            class="category-item" 
            :class="{ active: selectedCategory === cat }"
            @click="selectCategory(cat)"
          >
            <span>{{ getShortCategory(cat) }}</span>
            <span class="category-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Top Header Bar (Shown only in 'link' tab or in 'images' tab when images exist) -->
      <header class="top-bar" v-if="currentTab === 'link' || (currentTab === 'images' && localImages.length > 0)">
        <!-- Scenario A: Link Mobile Tab Header -->
        <div v-if="currentTab === 'link'" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <!-- Left Title & Device Connection Badge -->
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="display: flex; flex-direction: column; text-align: left;">
              <h2 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                <span>📱</span>
                <span style="background: linear-gradient(135deg, #ffffff, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{{ t.link.linkTitle }}</span>
              </h2>
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">{{ t.link.linkSub }}</span>
            </div>

            <!-- Connected Badge in Top Header -->
            <div v-if="syncStatus === 'connected'" class="header-device-status" style="display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 4px 12px; border-radius: 99px; margin-left: 8px;">
              <span style="font-size: 12px; font-weight: 700; color: var(--text-primary); display: inline-flex; align-items: center; gap: 4px;">
                📱 {{ activeDeviceName }}
              </span>
              <span style="font-size: 9px; font-weight: 600; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 6px; border-radius: 20px; display: inline-flex; align-items: center; gap: 3px;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: #10b981; animation: pulse-glow 1.5s infinite;"></span>
                {{ t.link.statusConnected }}
              </span>
              <div style="width: 1px; height: 10px; background: rgba(255,255,255,0.15); margin: 0 4px;"></div>
              <button 
                @click="cleanupWebRtc"
                style="background: transparent; border: none; color: #ef4444; font-size: 11px; font-weight: 700; cursor: pointer; padding: 2px 4px; margin: 0; display: flex; align-items: center; gap: 2px; transition: color 0.2s;"
                onmouseover="this.style.color='#f87171'"
                onmouseout="this.style.color='#ef4444'"
              >
                🔴 {{ t.link.disconnectBtn }}
              </button>
            </div>
          </div>

          <!-- Right Action Pill Buttons -->
          <div style="display: flex; align-items: center; gap: 10px;" v-if="syncStatus !== 'connected'">
            <button 
              @click="handleOpenThumbnailFolder" 
              class="top-nav-btn top-btn-accent"
            >
              📁 {{ t.link.openThumbnailFolder }}
            </button>

            <button 
              @click="showHowToConnectModal = true" 
              class="top-nav-btn top-btn-glass"
            >
              ❓ {{ t.link.howToConnect }}
            </button>

            <button 
              @click="showEnterCodeModal = true" 
              class="top-nav-btn top-btn-outline"
            >
              ⌨️ {{ t.link.enterCodeBtn }}
            </button>
          </div>
        </div>

        <!-- Scenario B: Images Tab Header (Search Bar Only) -->
        <div v-else-if="currentTab === 'images' && localImages.length > 0" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <span>🖼️</span> {{ selectedCategory ? (getShortCategory(selectedCategory) || selectedCategory) : (t.sidebar?.allImages || '全部照片') }}
              <span class="category-count" style="font-size: 11.5px; opacity: 0.8;">({{ filteredImages.length }})</span>
            </h3>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <!-- Search Bar -->
            <div class="search-bar-container">
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
          </div>
        </div>
      </header>

      <!-- Live Decoupled AI Queue Progress Banner -->
      <div class="ai-queue-status-banner" v-if="aiQueueProgress.isProcessing" style="margin: 8px 20px 0 20px;">
        <div class="ai-queue-info">
          <span class="ai-pulse-icon">🧠</span>
          <span class="ai-queue-title">{{ t.aiQueue?.processingTitle || 'AI 照片特征识别中' }}</span>
          <span class="ai-queue-counts">{{ aiQueueProgress.completed }} / {{ aiQueueProgress.total }} ({{ t.aiQueue?.remaining ? t.aiQueue.remaining.replace('{count}', aiQueueProgress.remaining) : `剩余 ${aiQueueProgress.remaining} 张` }})</span>
        </div>
        <div class="ai-queue-bar-track">
          <div class="ai-queue-bar-fill" :style="{ width: aiQueueProgress.percent + '%' }"></div>
        </div>
      </div>

      <!-- Grid Gallery -->
      <section class="gallery-container" ref="galleryContainerRef">
        <!-- ==================== TABS SWITCH ==================== -->
        
        <div v-if="currentTab === 'link'" style="display: flex; flex-direction: column; width: 100%; gap: 14px;">

          <!-- Main Simplified Pairing Card (Clean & Focused) -->
          <div v-if="syncStatus !== 'connected'" style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(147, 51, 234, 0.2); box-shadow: 0 8px 32px rgba(147, 51, 234, 0.05); border-radius: 16px; padding: 28px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; width: 100%; box-sizing: border-box; flex-shrink: 0; position: relative; backdrop-filter: blur(12px);">
            
            <!-- Card Header -->
            <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #a855f7; box-shadow: 0 0 10px #a855f7;"></span>
              {{ t.link.qrTitle }}
            </h4>
            
            <!-- QR Code Block with glow -->
            <div style="position: relative; padding: 12px; background: white; border-radius: 14px; box-shadow: 0 4px 24px rgba(168, 85, 247, 0.25); display: flex; align-items: center; justify-content: center; width: 184px; height: 184px; box-sizing: border-box; flex-shrink: 0; transition: transform 0.25s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
              <canvas ref="qrCanvas" style="width: 160px; height: 160px; display: block; flex-shrink: 0;"></canvas>
            </div>

            <!-- SSID & Password Credentials card when Local Hotspot is active -->
            <div v-if="isHotspotActive && hotspotStatus === 'started'" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 8px 16px; width: 100%; max-width: 320px; box-sizing: border-box;">
              <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 2px;">📡 {{ t.link.hotspotRunning }}:</div>
              <div style="font-size: 13px; font-weight: 700; color: #38bdf8;">SSID: {{ hotspotSsid }}</div>
              <div style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-top: 2px;">{{ t.link?.hotspotPassword || '密码' }}: {{ hotspotPassword }}</div>
            </div>
            <div v-if="qrPayload?.pc_ips && qrPayload.pc_ips.length > 0" style="display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 11px; color: #10b981; font-weight: 500; margin-top: -4px;">
              <span>⚡</span> {{ t.link?.lanDirectIp || '局域网直连 IP' }}: {{ qrPayload.pc_ips.join(', ') }}
            </div>
            <p v-else style="color: var(--text-secondary); font-size: 12px; margin: 0; max-width: 320px;">{{ t.link.qrSub }}</p>

            <!-- Status Pills Row -->
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 2px;">
              <!-- BLE Status Pill -->
              <button 
                @click="toggleSyncService"
                style="display: flex; align-items: center; gap: 6px; padding: 6px 16px; font-size: 12px; border-radius: 20px; cursor: pointer; transition: all 0.2s; border: none; font-weight: 600;"
                :style="isSyncActive ? 'background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);'"
              >
                <span style="width: 6px; height: 6px; border-radius: 50%;" :style="isSyncActive ? 'background: #10b981; box-shadow: 0 0 8px #10b981;' : 'background: #94a3b8;'"></span>
                {{ t.link.bleLabel }}: {{ isSyncActive ? t.link.enabled : t.link.disabled }}
              </button>

              <!-- Wi-Fi/Hotspot Status Pill -->
              <button 
                @click="toggleHotspot"
                style="display: flex; align-items: center; gap: 6px; padding: 6px 16px; font-size: 12px; border-radius: 20px; cursor: pointer; transition: all 0.2s; border: none; font-weight: 600;"
                :style="isHotspotActive ? 'background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.3); color: #38bdf8;' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);'"
              >
                <span style="width: 6px; height: 6px; border-radius: 50%;" :style="isHotspotActive ? 'background: #38bdf8; box-shadow: 0 0 8px #38bdf8;' : 'background: #94a3b8;'"></span>
                {{ t.link.hotspotLabel }}: {{ isHotspotActive ? t.link.enabled : t.link.disabled }}
              </button>
            </div>
          </div>

          <!-- C. CONNECTED VIEW (Shared by both modes) -->
          <div v-else class="connected-dashboard-layout" style="display: flex; gap: 24px; width: 100%; align-items: stretch; height: 580px; box-sizing: border-box;">
            
            <!-- Left Column: Mobile Workspace (Device info + AI sync + Album backup) -->
            <div class="device-dashboard-panel" style="width: 320px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; flex-shrink: 0; overflow-y: auto; scrollbar-width: none;">
              
              <!-- Card 1: System & Storage Info -->
              <div style="padding: 14px 16px; border-radius: 16px; background: rgba(255, 255, 255, 0.015); border: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; backdrop-filter: blur(20px);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">{{ t.link.deviceStatus || '设备状态' }}</span>
                  <span style="font-size: 10px; color: var(--text-secondary); font-weight: 600;">
                    {{ activeDeviceSystemInfo ? `Android ${activeDeviceSystemInfo.version || ''}` : 'Android' }}
                  </span>
                </div>
                <!-- Brand & Model -->
                <div style="font-size: 13px; color: var(--text-primary); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: -2px;">
                  {{ activeDeviceSystemInfo ? `${activeDeviceSystemInfo.brand || ''} ${activeDeviceSystemInfo.model || ''}` : (t.link.unnamedDevice || 'Android Device') }}
                </div>

                <!-- Storage Info Card -->
                <div v-if="activeDeviceSystemInfo && activeDeviceSystemInfo.total_storage" style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; margin-top: 2px;">
                  <div style="display: flex; justify-content: space-between; font-size: 10px;">
                    <span style="color: var(--text-muted);">{{ t.link.storageUsed || '已使用存储' }}</span>
                    <span style="color: var(--text-secondary); font-weight: 600;">
                      {{ formatBytes(activeDeviceSystemInfo.used_storage) }} / {{ formatBytes(activeDeviceSystemInfo.total_storage) }}
                    </span>
                  </div>
                  <!-- Custom Progress Bar -->
                  <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
                    <div 
                      style="height: 100%; background: linear-gradient(90deg, #a855f7, #3b82f6); border-radius: 3px;" 
                      :style="{ width: ((activeDeviceSystemInfo.used_storage / activeDeviceSystemInfo.total_storage) * 100) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- Clear Current Phone Cache Button -->
                <button
                  class="btn btn-secondary"
                  @click="handleClearPhoneCacheOnly"
                  :disabled="isThumbnailSyncing || isReclassifying || isAlbumSyncing"
                  style="margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px; font-size: 11px; border-radius: 8px; font-weight: 600; cursor: pointer; border: 1px solid rgba(239,68,68,0.2); background: rgba(239,68,68,0.05); color: #f87171; transition: all 0.2s;"
                  onmouseover="this.style.background='rgba(239,68,68,0.12)'; this.style.borderColor='rgba(239,68,68,0.35)'"
                  onmouseout="this.style.background='rgba(239,68,68,0.05)'; this.style.borderColor='rgba(239,68,68,0.2)'"
                >
                  <span>🗑️</span>
                  <span>{{ t.link.clearPhoneCacheBtn || '清空当前手机缓存' }}</span>
                </button>
              </div>

              <!-- Card 2: AI Sync Center -->
              <div v-if="activePeerType !== 'PC'" style="padding: 14px 16px; border-radius: 16px; background: rgba(168, 85, 247, 0.02); border: 1px solid rgba(168, 85, 247, 0.15); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.02); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; backdrop-filter: blur(20px);">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                  <span style="font-size: 12px;">🧠</span>
                  <span style="font-size: 11px; color: #c084fc; font-weight: 700; letter-spacing: 0.5px;">{{ t.link.aiManagement || '管理与同步 (AI 智能处理)' }}</span>
                </div>
                
                <!-- Batch AI Sync Button -->
                <button 
                  class="btn btn-primary" 
                  :disabled="isThumbnailSyncing || isAlbumSyncing"
                  @click="requestThumbnailSync"
                  style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; font-size: 12px; border-radius: 10px; font-weight: 600; width: 100%; cursor: pointer;"
                >
                  <span>🧠</span>
                  {{ isThumbnailSyncing 
                    ? (t.link.thumbnailSyncing ? t.link.thumbnailSyncing.replace('{done}', thumbSyncDone).replace('{total}', thumbSyncTotal) : `AI 同步中 ${thumbSyncDone}/${thumbSyncTotal}`)
                    : (thumbnailImages.length > 0 ? (t.link.thumbnailSyncContinue || '继续 AI 同步') : (t.link.thumbnailSyncBtn || '同步手机图片到 AI')) }}
                </button>

                <!-- Actions row side-by-side -->
                <div style="display: flex; gap: 8px; width: 100%;">
                  <!-- Re-run AI Button -->
                  <button 
                    class="btn btn-secondary" 
                    @click="handleReclassifyAllPhotos" 
                    :disabled="isReclassifying || isThumbnailSyncing || isAlbumSyncing"
                    style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid rgba(16,185,129,0.15); background: rgba(16,185,129,0.03); color: #10b981;"
                    onmouseover="this.style.background='rgba(16,185,129,0.08)'"
                    onmouseout="this.style.background='rgba(16,185,129,0.03)'"
                  >
                    <span>🔄</span>
                    <span>{{ isReclassifying ? (t.link.reclassifying || '正在重算') : (t.link.reclassifyBtn || '重新算 AI') }}</span>
                  </button>

                  <!-- Clear and Re-download Button -->
                  <button 
                    class="btn btn-secondary" 
                    @click="handleClearAndResync" 
                    :disabled="isThumbnailSyncing || isReclassifying || isAlbumSyncing"
                    style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid rgba(239,68,68,0.15); background: rgba(239,68,68,0.03); color: #ef4444;"
                    onmouseover="this.style.background='rgba(239,68,68,0.08)'"
                    onmouseout="this.style.background='rgba(239,68,68,0.03)'"
                  >
                    <span>🗑️</span>
                    <span>{{ t.link.resyncPhotos || '重新下载' }}</span>
                  </button>
                </div>

                <!-- Reclassify progress details & Latency Stats -->
                <div 
                  v-if="isReclassifying || reclassifyStats.completedAt" 
                  style="font-size: 10px; color: var(--text-muted); text-align: left; display: flex; flex-direction: column; gap: 4px; background: rgba(16, 185, 129, 0.04); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.18); width: 100%; box-sizing: border-box; transition: all 0.3s ease;"
                >
                  <!-- Row 1: Title & Progress Counter -->
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; font-size: 10px;">
                      <span v-if="isReclassifying" class="spinner" style="width: 10px; height: 10px; border-width: 1.5px; border-color: #10b981; border-top-color: transparent;"></span>
                      <span v-else style="font-size: 11px;">✅</span>
                      <span>{{ isReclassifying ? (t.link.reclassifyingTitle || 'AI 重算分析中') : (t.link.reclassifyDone || 'AI 计算已完成') }}</span>
                    </span>
                    <span style="color: #10b981; font-weight: 700; font-family: monospace; font-size: 11px;">
                      {{ reclassifyProgress.done }} / {{ reclassifyProgress.total || reclassifyStats.totalCount }}
                    </span>
                  </div>

                  <!-- Row 2: Mini Progress Bar -->
                  <div v-if="isReclassifying" style="width: 100%; height: 3px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; overflow: hidden; margin: 1px 0;">
                    <div 
                      style="height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); transition: width 0.2s;" 
                      :style="{ width: ((reclassifyProgress.done / (reclassifyProgress.total || 1)) * 100) + '%' }"
                    ></div>
                  </div>

                  <!-- Row 3: Latency stats (单张 ms & 平均 ms) -->
                  <div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 9.5px; background: rgba(0, 0, 0, 0.25); padding: 4px 8px; border-radius: 5px; border: 1px solid rgba(255, 255, 255, 0.04);">
                    <span style="color: var(--text-secondary);">
                      ⚡ {{ t.link.singleLatency || '单张' }}: <strong style="color: #38bdf8;">{{ reclassifyProgress.singleMs || reclassifyStats.lastSingleMs || 0 }} ms</strong>
                    </span>
                    <span style="color: var(--text-secondary);">
                      📊 {{ t.link.avgLatency || '平均' }}: <strong style="color: #34d399;">{{ reclassifyProgress.avgMs || reclassifyStats.avgMs || 0 }} ms</strong>
                    </span>
                  </div>

                  <!-- Row 4: Elapsed & Total time -->
                  <div style="display: flex; justify-content: space-between; font-size: 9.5px; padding: 0 2px;">
                    <span v-if="isReclassifying" style="color: var(--text-muted);">
                      ⏱️ {{ t.link.elapsedTime || '已用' }}: <strong style="color: #10b981;">{{ reclassifyElapsedTime }}</strong>
                    </span>
                    <span v-else style="color: var(--text-muted);">
                      ⏱️ {{ t.link.totalTimeSpent || '总计花费时间' }}: <strong style="color: #10b981; font-weight: 700;">{{ reclassifyStats.totalTimeText }}</strong>
                    </span>
                    <span v-if="isReclassifying" style="color: var(--text-muted);">
                      {{ t.link.estRemaining || '预计剩余' }}: <strong style="color: #f59e0b;">{{ reclassifyRemainingTime }}</strong>
                    </span>
                    <span v-else style="color: var(--text-muted); font-size: 9px;">
                      {{ t.link.completedAt || '完成于' }} {{ reclassifyStats.completedAt }}
                    </span>
                  </div>
                </div>

                <!-- Open Thumbnail Folder -->
                <button 
                  class="btn btn-secondary" 
                  @click="handleOpenThumbnailFolder"
                  style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; width: 100%; cursor: pointer; border: 1px solid rgba(168,85,247,0.15); background: rgba(168,85,247,0.03); color: #c084fc;"
                  onmouseover="this.style.background='rgba(168,85,247,0.08)'"
                  onmouseout="this.style.background='rgba(168,85,247,0.03)'"
                >
                  <span>📁</span> {{ t.link.openThumbnailFolder || '打开缩略图文件夹' }}
                </button>
              </div>

              <!-- Card 3: Album Backup Center -->
              <div v-if="activePeerType !== 'PC'" style="padding: 14px 16px; border-radius: 16px; background: rgba(16, 185, 129, 0.02); border: 1px solid rgba(16, 185, 129, 0.15); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.02); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; backdrop-filter: blur(20px);">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                  <span style="font-size: 12px;">📸</span>
                  <span style="font-size: 11px; color: #34d399; font-weight: 700; letter-spacing: 0.5px;">{{ t.link.albumSyncTitle || '相册备份到PC (物理备份)' }}</span>
                </div>

                <!-- Sync Album to PC Controls -->
                <div v-if="isAlbumSyncing" style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                  <!-- Status & Remaining count -->
                  <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-primary); font-weight: 600;">
                    <span>{{ t.link.albumSyncedText ? t.link.albumSyncedText.replace('{done}', albumSyncDone).replace('{total}', albumSyncTotal) : `已同步: ${albumSyncDone} / ${albumSyncTotal}` }}</span>
                    <span style="color: #10b981;">{{ t.link.albumRemainingText ? t.link.albumRemainingText.replace('{count}', albumSyncTotal - albumSyncDone) : `剩余: ${albumSyncTotal - albumSyncDone} 张` }}</span>
                  </div>

                  <!-- Progress Bar -->
                  <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;">
                    <div :style="{ width: (albumSyncTotal > 0 ? (albumSyncDone / albumSyncTotal) * 100 : 0) + '%', height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '999px', transition: 'width 0.3s ease' }"></div>
                  </div>

                  <!-- Control Buttons Row -->
                  <div style="display: flex; gap: 6px; width: 100%;">
                    <button
                      v-if="!isAlbumSyncPaused"
                      class="btn"
                      @click="pauseAlbumSync"
                      style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid rgba(250,204,21,0.15); background: rgba(250,204,21,0.03); color: #facc15;"
                      onmouseover="this.style.background='rgba(250,204,21,0.08)'"
                      onmouseout="this.style.background='rgba(250,204,21,0.03)'"
                    >
                      <span>⏸️</span> {{ t.link.pause || '暂停' }}
                    </button>
                    <button
                      v-else
                      class="btn"
                      @click="resumeAlbumSync"
                      style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid rgba(16,185,129,0.15); background: rgba(16,185,129,0.03); color: #10b981;"
                      onmouseover="this.style.background='rgba(16,185,129,0.08)'"
                      onmouseout="this.style.background='rgba(16,185,129,0.03)'"
                    >
                      <span>▶️</span> {{ t.link.resume || '继续' }}
                    </button>
                    <button
                      class="btn"
                      @click="stopAlbumSync"
                      style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid rgba(239,68,68,0.15); background: rgba(239,68,68,0.03); color: #ef4444;"
                      onmouseover="this.style.background='rgba(239,68,68,0.08)'"
                      onmouseout="this.style.background='rgba(239,68,68,0.03)'"
                    >
                      <span>⏹️</span> {{ t.link.stop || '停止' }}
                    </button>
                  </div>
                </div>

                <div v-else style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                  <!-- Normal Sync Button -->
                  <button
                    class="btn btn-primary"
                    @click="requestAlbumSync"
                    :disabled="isAlbumSyncing || isThumbnailSyncing || isReclassifying"
                    style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; font-size: 12px; border-radius: 10px; font-weight: 600; width: 100%; cursor: pointer; background: linear-gradient(135deg, #10b981, #059669);"
                  >
                    <span>📸</span>
                    <span>{{ albumSyncDone > 0 ? (t.link.albumSyncContinue || '继续同步相册到PC') : (t.link.albumSyncToPc || '同步相册到PC') }}</span>
                  </button>

                  <!-- Actions Row for Album Sync -->
                  <div style="display: flex; gap: 6px; width: 100%;">
                    <!-- Re-sync / Integrity check Button -->
                    <button
                      class="btn btn-secondary"
                      @click="reSyncAlbum"
                      :disabled="isAlbumSyncing || isThumbnailSyncing || isReclassifying"
                      style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid rgba(245,158,11,0.15); background: rgba(245,158,11,0.03); color: #f59e0b;"
                      onmouseover="this.style.background='rgba(245,158,11,0.08)'"
                      onmouseout="this.style.background='rgba(245,158,11,0.03)'"
                    >
                      <span>🔄</span> {{ t.link.checkMissing || '检查补漏' }}
                    </button>

                    <!-- Open Album Sync Folder -->
                    <button
                      class="btn btn-secondary"
                      @click="handleOpenAlbumSyncFolder"
                      style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; font-size: 11px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid rgba(16,185,129,0.15); background: rgba(16,185,129,0.03); color: #10b981;"
                      onmouseover="this.style.background='rgba(16,185,129,0.08)'"
                      onmouseout="this.style.background='rgba(16,185,129,0.03)'"
                    >
                      <span>📂</span> {{ t.link.openFolder || '打开文件夹' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: P2P Chat/Transfer Zone -->
            <div class="chat-container" style="flex: 1; display: flex; flex-direction: column; height: 100%; border-radius: 20px; background: rgba(255,255,255,0.015); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); box-sizing: border-box; overflow: hidden;">
              <!-- Chat Header -->
              <div class="chat-header" style="padding: 16px 24px; border-bottom: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.01);">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="font-weight: 700; color: var(--text-primary); font-size: 14px; display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                    {{ t.link.p2pTunnelTitle || 'P2P 极速直连通道 (WebRTC Tunnel)' }}
                  </span>
                  <span style="font-size: 11px; color: var(--text-muted);">{{ t.link.gattChannelReady || 'GATT channel ready | P2P link active' }}</span>
                </div>
                <!-- Mini status info -->
                <div style="font-size: 11px; color: var(--text-muted); background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                  <span v-if="pcActiveTransferName" style="color: #3b82f6; display: flex; align-items: center; gap: 4px;">
                    <span class="spinner" style="width: 10px; height: 10px; border-width: 1.5px; border-top-color: #3b82f6;"></span>
                    📤 {{ t.link.sendingFile || '发送中' }}: {{ pcActiveTransferName }}
                  </span>
                  <span v-else-if="incomingTransfer" style="color: #a855f7; display: flex; align-items: center; gap: 4px;">
                    <span class="spinner" style="width: 10px; height: 10px; border-width: 1.5px; border-top-color: #a855f7;"></span>
                    📥 {{ t.link.receivingFile || '接收中' }}: {{ incomingTransfer.name }}
                  </span>
                  <span v-else>{{ t.link.channelIdle || '⚡ 通道空闲 (Idle)' }}</span>
                </div>
              </div>

              <!-- Chat Messages Area -->
              <div 
                class="chat-messages" 
                ref="chatMessagesRef" 
                @dragenter.prevent="dragActive = true"
                @dragover.prevent="onDragOver"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="handleDragDrop"
                :class="{ 'drag-active': dragActive }"
                style="flex: 1; overflow-y: auto; padding: 24px; box-sizing: border-box;"
              >
                <!-- Empty State -->
                <div v-if="chatMessages.length === 0" class="chat-empty-state" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.85;">
                  <span style="font-size: 48px; margin-bottom: 12px; display: block; filter: drop-shadow(0 0 12px rgba(168,85,247,0.3));">📦</span>
                  <span style="color: var(--text-primary); font-size: 15px; font-weight: 700; margin-bottom: 6px;">{{ t.link.chatReadyTitle || '数据双向传输就绪' }}</span>
                  <span style="color: var(--text-muted); font-size: 12px; max-width: 320px; line-height: 1.6; text-align: center;">{{ t.link.chatReadyDesc || '点击下方按钮发送文件，或将任何格式的文件直接拖拽拖放到本区域内。' }}</span>
                </div>

                <!-- Message Bubble List -->
                <div 
                  v-for="msg in visibleChatMessages" 
                  :key="msg.id" 
                  class="chat-message-row"
                  :class="msg.type"
                >
                  <!-- Left Avatar for mobile -->
                  <div v-if="msg.type === 'incoming'" class="chat-avatar mobile-avatar" :title="t.link.senderMobile || '手机端'">📱</div>

                  <!-- Message bubble -->
                  <div class="chat-message-bubble">
                    <!-- Meta row -->
                    <div class="chat-message-meta">
                      <span class="chat-sender-name">{{ msg.type === 'incoming' ? (t.link.senderMobile || '手机端') : (t.link.senderPc || '我的电脑') }}</span>
                      <span class="chat-time">{{ msg.time }}</span>
                    </div>

                    <!-- File card -->
                    <div class="chat-file-card">
                      <!-- Image preview -->
                      <div v-if="msg.isImage && msg.src" class="chat-file-preview">
                        <img :src="msg.src" class="chat-preview-img" @click="openDetails({ src: msg.src, name: msg.name, path: msg.src })" />
                      </div>

                      <!-- Icon & details -->
                      <div class="chat-file-info">
                        <span class="chat-file-icon">{{ getFileIcon(msg.name) }}</span>
                        <div class="chat-file-text">
                          <span class="chat-filename" :title="msg.name">{{ msg.name }}</span>
                          <span class="chat-filesize">{{ formatBytes(msg.size) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Status/Progress -->
                    <div v-if="msg.status === 'transferring'" class="chat-progress-container">
                      <div class="chat-progress-bar">
                        <div class="chat-progress-fill" :style="{ width: (msg.progress * 100) + '%' }"></div>
                      </div>
                      <span class="chat-progress-text">{{ t.link.msgTransferring ? t.link.msgTransferring.replace('{pct}', Math.round(msg.progress * 100)) : `正在传输: ${Math.round(msg.progress * 100)}%` }}</span>
                    </div>
                    
                    <div v-else-if="msg.status === 'processing'" class="chat-progress-container">
                      <span class="chat-progress-text text-processing">{{ t.link.msgProcessing || '🔄 AI 分析归类中...' }}</span>
                    </div>

                    <div v-else-if="msg.status === 'completed'" class="chat-status-text success">
                      <span style="display: flex; align-items: center; gap: 4px;">{{ t.link.msgCompleted || '🟢 已完成' }}</span>
                      <!-- AI Prediction tag -->
                      <span v-if="msg.predictions && msg.predictions[0]" class="chat-pred-badge">
                        {{ getShortCategory(msg.predictions[0].category) }} ({{ Math.round(msg.predictions[0].score * 100) }}%)
                      </span>
                    </div>

                    <div v-else-if="msg.status === 'failed'" class="chat-status-text error">
                      <span>{{ t.link.msgFailed || '🔴 传输失败' }}</span>
                    </div>
                  </div>

                  <!-- Right Avatar for PC -->
                  <div v-if="msg.type === 'outgoing'" class="chat-avatar pc-avatar" :title="t.link.senderPc || '我的电脑'">💻</div>
                </div>
              </div>

              <!-- Chat Input Area -->
              <div class="chat-input-area" style="padding: 16px 24px; border-top: 1px solid var(--glass-border); background: rgba(255,255,255,0.01);">
                <button 
                  class="btn btn-accent btn-send-file" 
                  @click="handleSendImagesToMobile"
                  :disabled="pcActiveTransferName !== null"
                  style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer;"
                >
                  <span>📤</span> {{ t.link.sendLocalFileBtn || '选择本地文件发送到手机 (支持任意格式拖放)' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Lower P2P Discovery Container (Compact Refined) -->
          <div v-if="syncStatus !== 'connected'" style="background: rgba(30, 41, 59, 0.2); border: 1px solid var(--glass-border); border-radius: 14px; padding: 14px 20px; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <h4 style="margin: 0; font-size: 13.5px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <span class="spinner" style="width: 12px; height: 12px; border-width: 2px; border-color: rgba(255,255,255,0.2); border-top-color: #a855f7;"></span>
                {{ t.link.discoveryTitle || '正在自动搜索附近设备...' }}
              </h4>
              <button 
                @click="refreshDevices" 
                style="background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: var(--text-primary); padding: 4px 10px; font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s;"
                onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                onmouseout="this.style.background='transparent'"
              >
                🔄 {{ t.link.refreshBtn || '刷新' }}
              </button>
            </div>

            <!-- Device list in compact multi-column Grid -->
            <div class="nearby-devices-grid">
              <div 
                v-for="device in displayDevices" 
                :key="device.uuid"
                class="nearby-device-card"
              >
                <!-- Info Section -->
                <div class="device-card-left">
                  <div class="device-type-icon">
                    {{ device.type === 'PC' ? '💻' : '📱' }}
                  </div>
                  <div class="device-card-meta">
                    <div class="device-card-title-row">
                      <span class="device-card-name" :title="device.name">{{ device.name }}</span>
                      <span class="device-type-badge">{{ device.type === 'PC' ? (t.link.deviceTypePc || '电脑') : (t.link.deviceTypeMobile || '手机') }}</span>
                    </div>
                    <span class="device-card-ip">{{ device.ip }} · Wi-Fi</span>
                  </div>
                </div>

                <!-- Actions Section -->
                <div class="device-card-right">
                  <!-- Signal Bars -->
                  <div class="device-signal-bars" :title="t.link?.signalGood || '局域网 Wi-Fi 信号良好'">
                    <span class="s-bar s-1"></span>
                    <span class="s-bar s-2"></span>
                    <span class="s-bar s-3"></span>
                    <span class="s-bar s-4"></span>
                  </div>
                  
                  <button 
                    class="btn-device-connect"
                    @click="device.isMock ? logSyncEvent(`🔌 [Mock] Connecting to test device ${device.name}...`) : connectToDevice(device.ip)"
                    :disabled="connectingIp === device.ip"
                  >
                    {{ connectingIp === device.ip ? t.link.waitingAccept : t.link.connectBtn }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer hint -->
            <div style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 2px; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>ℹ️</span>
              {{ t.link.noDevicesFooter }}
            </div>
          </div>

          <!-- Collapsible Connection Logs Panel Toggle (Hidden by default in release) -->
          <div v-if="syncStatus !== 'connected'" style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <button 
              @click="showSyncLogs = !showSyncLogs"
              style="background: transparent; border: none; font-size: 11px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 4px; transition: color 0.2s;"
              onmouseover="this.style.color='var(--text-secondary)'"
              onmouseout="this.style.color='var(--text-muted)'"
            >
              <span>{{ showSyncLogs ? (t.link?.hideLogs || '▾ 收起连接日志') : (t.link?.showLogs || '▸ 展开连接日志') }}</span>
            </button>

            <div v-if="showSyncLogs" style="border: 1px solid var(--glass-border); border-radius: 12px; background: rgba(0, 0, 0, 0.4); padding: 16px; text-align: left; width: 100%; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px;">
                <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;">📝 {{ t.link.logsTitle }}</span>
                <button 
                  style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 2px 8px; font-size: 10px; color: var(--text-secondary); cursor: pointer;"
                  @click="syncLogs = []"
                >
                  {{ t.link.clearLogs }}
                </button>
              </div>
              <div ref="logTerminalRef" style="height: 100px; overflow-y: auto; font-family: monospace; font-size: 11px; color: #38bdf8; line-height: 1.5; white-space: pre-wrap; padding: 4px;">
                <div v-if="syncLogs.length === 0" style="color: var(--text-muted);">{{ t.link.waitingLogs }}</div>
                <div v-for="(log, idx) in syncLogs" :key="idx">{{ log }}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- 2. IMAGES TAB -->
        <div v-else-if="currentTab === 'images'" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
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

          <!-- Virtual Grid display -->
          <VirtualGrid ref="virtualGridRef" v-else :items="filteredImages" :itemMinWidth="220" :gap="24" style="flex: 1;">
            <template #item="{ item: img }">
              <div 
                class="image-card" 
                @click="openDetails(img, filteredImages)"
              >
                <div class="card-img-wrapper">
                  <img :src="img.src" class="card-img" loading="lazy" />
                  
                  <!-- Processing Indicator -->
                  <div class="loading-indicator" v-if="(!img.predictions || img.predictions.length === 0) && img.status === 'processing'">
                    <span class="spinner"></span>
                    <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">{{ t.images.aiAnalyzing }}</span>
                  </div>
                </div>
                
                <div class="card-overlay">
                  <span class="card-title">{{ img.name }}</span>
                  
                  <!-- Badges -->
                  <span v-if="isSearchActive && img.searchScore !== undefined && getMatchPercentage(img.searchScore) > 0" class="badge badge-search-match">
                    🎯 {{ t.images.matchScore }} {{ getMatchPercentage(img.searchScore) }}%
                  </span>
                  <span v-else-if="img.predictions && img.predictions.length > 0" class="badge badge-classified">
                    {{ getShortCategory(img.predictions[0].category || img.predictions[0].label || img.predictions[0].name) }} ({{ Math.round((img.predictions[0].score || 0) * 100) }}%)
                  </span>
                  <span v-else-if="img.status === 'processing'" class="badge badge-loading">
                    <span class="spinner"></span> {{ t.images.aiAnalyzing }}
                  </span>
                  <span v-else class="badge badge-pending">
                    ⏳ {{ t.images.waitingQueue }}
                  </span>
                </div>
              </div>
            </template>
          </VirtualGrid>
        </div>

        <!-- 2.5 ALBUM BACKUP TAB -->
        <div v-else-if="currentTab === 'album'" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
          <!-- Empty State -->
          <div class="empty-state" v-if="albumBackupImages.length === 0">
            <div class="empty-state-icon">📸</div>
            <h2 class="empty-state-title">{{ t.emptyStates?.albumEmptyTitle || '暂无备份相册资源' }}</h2>
            <p class="empty-state-desc">
              {{ t.emptyStates?.albumEmptyDesc || '请在左下角连接手机，并启动“同步相册到PC”开始物理备份并离线浏览相册图片。' }}
            </p>
          </div>

          <!-- Virtual Grid display for Album -->
          <VirtualGrid v-else :items="albumBackupImages" :itemMinWidth="220" :gap="24" style="flex: 1;">
            <template #item="{ item: img }">
              <div 
                class="image-card" 
                @click="openDetails(img, albumBackupImages)"
              >
                <div class="card-img-wrapper">
                  <img :src="img.src" class="card-img" loading="lazy" />
                </div>
                
                <div class="card-overlay">
                  <span class="card-title">{{ img.name }}</span>
                  <span class="badge badge-classified" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);">
                    📸 {{ t.sidebar?.tabAlbum || '相册备份' }}
                  </span>
                </div>
              </div>
            </template>
          </VirtualGrid>
        </div>

        <!-- 3. VIDEOS TAB (Remote Video Sync & Date Grouped Timeline with Virtual Scrolling) -->
        <div v-else-if="currentTab === 'videos'" class="videos-tab-container">
          <!-- Compact View Filter & Control Bar -->
          <div class="video-compact-top-bar glass-panel">
            <!-- Filter Tabs on Left -->
            <div class="video-filter-tabs">
              <button 
                class="video-filter-btn" 
                :class="{ active: videoTabFilter === 'all' }"
                @click="videoTabFilter = 'all'"
              >
                🎞️ {{ t.videos?.allVideos || '全部视频' }} <span class="filter-count">({{ totalAllVideosCount }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: videoTabFilter === 'synced' }"
                @click="videoTabFilter = 'synced'"
              >
                💾 {{ t.videos?.syncedVideos || '电脑已备份' }} <span class="filter-count">({{ localVideos.length }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: videoTabFilter === 'unsynced' }"
                @click="videoTabFilter = 'unsynced'"
              >
                📱 {{ t.videos?.unsyncedVideos || '手机待下载' }} <span class="filter-count">({{ totalUnsyncedVideosCount }})</span>
              </button>
            </div>

            <!-- Quick Action & Collapsible Panel Toggle on Right -->
            <div class="video-compact-actions">
              <button 
                v-if="syncStatus === 'connected'"
                class="btn btn-secondary btn-xs"
                :disabled="isVideoSyncing"
                @click="queryRemoteVideoCatalog"
                :title="t.videos?.refreshListBtn || '刷新视频列表'"
              >
                {{ t.videos?.refreshListBtn || '🔄 刷新列表' }}
              </button>
              <button 
                class="btn btn-secondary btn-xs" 
                @click="handleImportFolder"
                :title="t.videos?.importLocalBtn || '导入本地视频文件夹'"
              >
                {{ t.videos?.importLocalBtn || '📁 导入本地' }}
              </button>
              <button 
                class="btn btn-secondary btn-xs btn-panel-toggle" 
                @click="isVideoControlExpanded = !isVideoControlExpanded"
                :title="isVideoControlExpanded ? (t.videos?.collapsePanel || '收起视频管理面板') : (t.videos?.expandPanel || '展开视频管理面板与统计')"
              >
                <span>{{ isVideoControlExpanded ? (t.videos?.collapsePanel || '▴ 收起面板') : (t.videos?.expandPanel || '▾ 展开面板') }}</span>
              </button>
            </div>
          </div>

          <!-- Expandable Video Control Action Banner -->
          <transition name="modal-fade">
            <div v-if="isVideoControlExpanded" class="glass-panel video-control-banner">
              <div class="video-control-left">
                <div class="video-control-title-row">
                  <h3>{{ t.videos?.title || '🎥 视频同步与管理' }}</h3>
                  <span class="badge-pill" :class="syncStatus === 'connected' ? 'badge-online' : 'badge-offline'">
                    <span class="status-dot" :class="{ 'pulse-dot': syncStatus === 'connected' }"></span>
                    {{ syncStatus === 'connected' ? (t.videos?.mobileConnected ? t.videos.mobileConnected.replace('{name}', activeDeviceName || '设备') : `🟢 手机已直连 [${activeDeviceName || '设备'}]`) : (t.videos?.mobileNotConnected || '⚪ 手机未连接') }}
                  </span>
                  <span v-if="totalUnsyncedVideosCount > 0" class="badge-pill badge-unsynced-pulse">
                    {{ t.videos?.unsyncedFound ? t.videos.unsyncedFound.replace('{count}', totalUnsyncedVideosCount) : `⚡ 发现 ${totalUnsyncedVideosCount} 个新视频待同步` }}
                  </span>
                </div>
                <p class="video-control-subtitle">
                  {{ t.videos?.subtitle || '支持按拍摄日期浏览手机视频，勾选后一键极速传输下载。' }}
                  <span style="color: var(--text-primary); font-weight: 600;">
                    {{ t.videos?.totalStats ? t.videos.totalStats.replace('{total}', totalAllVideosCount).replace('{synced}', localVideos.length) : `(共 ${totalAllVideosCount} 个视频 • 已备份 ${localVideos.length} 个)` }}
                  </span>
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="video-control-actions">
                <!-- Download Selected Videos Button -->
                <button 
                  v-if="syncStatus === 'connected'"
                  class="btn btn-primary"
                  :class="{ 'btn-glow-pulse': selectedVideosCount > 0 }"
                  :disabled="isVideoSyncing || selectedVideosCount === 0"
                  @click="downloadSelectedVideos"
                  :title="selectedVideosCount > 0 ? (t.videos?.downloadSelectedBtn ? t.videos.downloadSelectedBtn.replace('{count}', selectedVideosCount) : '下载所有已勾选的视频') : (t.videos?.noSelectedBtn || '请在下方勾选要下载的视频')"
                >
                  <span>⬇️</span> {{ selectedVideosCount > 0 ? (t.videos?.downloadSelectedBtn ? t.videos.downloadSelectedBtn.replace('{count}', selectedVideosCount) : `下载选中视频 (${selectedVideosCount})`) : (t.videos?.noSelectedBtn || '请勾选视频下载') }}
                </button>

                <!-- Select All / Clear Selection Button -->
                <button 
                  v-if="syncStatus === 'connected' && totalUnsyncedVideosCount > 0"
                  class="btn btn-secondary btn-sm"
                  @click="selectedVideosCount === totalUnsyncedVideosCount ? clearVideoSelection() : selectAllUnsyncedVideos()"
                >
                  {{ selectedVideosCount === totalUnsyncedVideosCount ? (t.videos?.clearSelection || '⬜ 取消全选') : (t.videos?.selectAllUnsynced ? t.videos.selectAllUnsynced.replace('{count}', totalUnsyncedVideosCount) : `☑️ 全选待同步 (${totalUnsyncedVideosCount})`) }}
                </button>

                <!-- Open Videos Sync Folder -->
                <button v-if="hasApi" class="btn btn-secondary btn-sm" @click="openDownloadFolder">
                  {{ t.videos?.openDirBtn || '📂 打开目录' }}
                </button>
              </div>
            </div>
          </transition>

          <!-- Video Syncing Progress Bar Banner -->
          <div v-if="isVideoSyncing" class="glass-panel video-sync-progress-banner">
            <div class="sync-progress-info">
              <span class="spinner"></span>
              <div class="sync-progress-text">
                <div class="sync-progress-title">
                  <span>{{ currentVideoSyncTitle }}</span>
                  <span class="sync-percent">{{ currentVideoSyncPercent }}%</span>
                </div>
                <div class="sync-progress-track">
                  <div class="sync-progress-bar" :style="{ width: `${currentVideoSyncPercent}%` }"></div>
                </div>
              </div>
            </div>
            <div class="sync-progress-controls">
              <button v-if="!isVideoSyncPaused" class="btn btn-secondary btn-xs" @click="pauseVideoSync">{{ t.videos?.pauseBtn || '⏸️ 暂停' }}</button>
              <button v-else class="btn btn-primary btn-xs" @click="resumeVideoSync">{{ t.videos?.resumeBtn || '▶️ 继续' }}</button>
              <button class="btn btn-secondary btn-xs" style="color: #ef4444;" @click="stopVideoSync">{{ t.videos?.cancelBtn || '⏹️ 取消' }}</button>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" v-if="filteredVideoGroupsByDate.length === 0">
            <div class="empty-state-icon">🎥</div>
            <h2 class="empty-state-title">
              {{ videoTabFilter === 'synced' ? '暂无电脑已备份视频' : (videoTabFilter === 'unsynced' ? '🎉 手机视频已全部备份！' : (t.videos?.emptyVideos || '暂无视频资源')) }}
            </h2>
            <p class="empty-state-desc">
              <span v-if="videoTabFilter === 'synced'">{{ t.emptyStates?.videoSyncedEmptyDesc || '请在顶部切换至「📱 手机待下载」勾选视频并点击下载。' }}</span>
              <span v-else-if="videoTabFilter === 'unsynced'">{{ t.emptyStates?.videoUnsyncedAllDesc || '手机中所有检测到的视频均已同步至电脑本地。' }}</span>
              <span v-else>{{ syncStatus === 'connected' ? (t.videos?.emptyConnectedDesc || '手机中暂未检测到视频文件，或点击上方「刷新列表」重新扫描。') : (t.videos?.emptyDisconnectedDesc || '请在左下角连接手机以自动发现并按日期同步视频，或点击上方「导入本地」选取电脑视频。') }}</span>
            </p>
          </div>

          <!-- High-Performance Virtual Timeline Display -->
          <VirtualTimeline
            ref="virtualTimelineRef"
            v-else
            :groups="filteredVideoGroupsByDate"
            :minItemWidth="220"
            :gap="14"
            :syncStatus="syncStatus"
            :selectedVideoIds="selectedVideoIds"
            :isVideoSyncing="isVideoSyncing"
            :t="t"
            :getVideoPoster="getVideoPoster"
            :formatBytes="formatBytes"
            :formatVideoDuration="formatVideoDuration"
            @toggle-selection="toggleVideoSelection"
            @toggle-date-selection="toggleDateSelection"
            @sync-date="group => requestVideoSync({ targetDate: group.rawDate, targetIds: group.unsyncedIds })"
            @play-video="openVideoPlayer"
            @download-video="downloadSingleVideo"
            @open-anime-studio="openAnimeStudio"
            style="flex: 1;"
          />

          <!-- Floating Bottom Sticky Bar for Multi-Select Download -->
          <transition name="modal-fade">
            <div 
              v-if="selectedVideosCount > 0" 
              class="video-floating-bar"
            >
              <div class="video-floating-info">
                <span style="font-size: 18px;">🎥</span>
                <span>
                  {{ t.videos?.floatingSelected ? t.videos.floatingSelected.replace('{count}', selectedVideosCount) : `已勾选 ${selectedVideosCount} 个视频` }}
                  <span style="color: var(--text-muted); font-size: 12px; margin-left: 6px;">
                    ({{ t.videos?.floatingTotalSize ? t.videos.floatingTotalSize.replace('{size}', formatBytes(selectedVideosTotalBytes)) : `共 ${formatBytes(selectedVideosTotalBytes)}` }})
                  </span>
                </span>
              </div>
              <div class="video-floating-actions">
                <button 
                  class="btn btn-secondary btn-sm" 
                  @click="clearVideoSelection"
                  style="border-radius: 20px; padding: 7px 18px;"
                >
                  {{ t.videos?.floatingClear || '✕ 取消勾选' }}
                </button>
                <button 
                  class="btn btn-primary" 
                  @click="downloadSelectedVideos"
                  :disabled="isVideoSyncing"
                  style="border-radius: 20px; padding: 8px 24px; font-weight: 700; box-shadow: 0 4px 16px rgba(168, 85, 247, 0.45);"
                >
                  <span>⬇️</span>
                  <span>{{ isVideoSyncing ? '正在下载...' : (t.videos?.floatingDownload ? t.videos.floatingDownload.replace('{count}', selectedVideosCount) : `立即下载 (${selectedVideosCount})`) }}</span>
                </button>
              </div>
            </div>
          </transition>

          <!-- Video Fullscreen Player Lightbox Modal (Clean, No Top Name, No Locate Button) -->
          <transition name="modal-fade">
            <div v-if="activePlayingVideo" class="video-player-overlay" @click.self="closeVideoPlayer">
              <div class="video-player-modal glass-panel">
                <!-- Floating Buttons -->
                <button 
                  v-if="hasApi && window.api?.openVideoWindow" 
                  class="vp-floating-close-btn" 
                  style="right: 56px; font-size: 14px;" 
                  @click="popOutVideoPlayer" 
                  :title="t.lightbox?.detachedPlay || '在独立窗口中播放'"
                >
                  🗗
                </button>
                <button class="vp-floating-close-btn" @click="closeVideoPlayer" :title="t.lightbox?.closeApp || '关闭视频 (ESC)'">✕</button>

                <!-- Video Viewport -->
                <div class="video-player-body">
                  <video 
                    :src="activePlayingVideo.src || `local:///${activePlayingVideo.path.replace(/\\/g, '/')}`" 
                    controls 
                    autoplay 
                    class="video-native-element"
                  ></video>
                </div>
              </div>
            </div>
          </transition>

          <!-- Video AnimeGAN Studio Modal -->
          <VideoAnimeStudioModal 
            :video="animeStudioVideo" 
            :t="t"
            @close="closeAnimeStudio"
            @play-video="openVideoPlayer"
          />
        </div>

        <!-- 4. AUDIOS TAB (Cyber Hi-Fi Music Station & Date Grouped Playlist) -->
        <div v-else-if="currentTab === 'audios'" class="videos-tab-container audios-tab-container">
          <!-- Compact View Filter & Control Bar -->
          <div class="video-compact-top-bar glass-panel">
            <!-- Filter Tabs on Left -->
            <div class="video-filter-tabs">
              <button 
                class="video-filter-btn" 
                :class="{ active: audioTabFilter === 'all' }"
                @click="audioTabFilter = 'all'"
              >
                🎵 {{ t.audios?.allAudios || '全部音乐' }} <span class="filter-count">({{ totalAllAudiosCount }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: audioTabFilter === 'synced' }"
                @click="audioTabFilter = 'synced'"
              >
                💾 {{ t.audios?.syncedAudios || '电脑已备份' }} <span class="filter-count">({{ localAudios.length }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: audioTabFilter === 'unsynced' }"
                @click="audioTabFilter = 'unsynced'"
              >
                📱 {{ t.audios?.unsyncedAudios || '手机待下载' }} <span class="filter-count">({{ totalUnsyncedAudiosCount }})</span>
              </button>
            </div>

            <!-- Quick Action & Collapsible Panel Toggle on Right -->
            <div class="video-compact-actions">
              <button 
                v-if="syncStatus === 'connected'"
                class="btn btn-secondary btn-xs" 
                :disabled="isAudioSyncing"
                @click="queryRemoteAudioCatalog"
                :title="t.audios?.refreshListBtn || '刷新音乐列表'"
              >
                {{ t.audios?.refreshListBtn || '🔄 刷新列表' }}
              </button>
              <button 
                class="btn btn-secondary btn-xs" 
                @click="handleImportFolder"
                :title="t.audios?.importLocalBtn || '导入本地音频文件夹'"
              >
                {{ t.audios?.importLocalBtn || '📁 导入本地' }}
              </button>
              <button 
                class="btn btn-secondary btn-xs btn-panel-toggle" 
                @click="isAudioControlExpanded = !isAudioControlExpanded"
                :title="isAudioControlExpanded ? (t.audios?.collapsePanel || '收起音乐管理面板') : (t.audios?.expandPanel || '展开音乐管理面板与统计')"
              >
                <span>{{ isAudioControlExpanded ? (t.audios?.collapsePanel || '▴ 收起面板') : (t.audios?.expandPanel || '▾ 展开面板') }}</span>
              </button>
            </div>
          </div>

          <!-- Expandable Audio Control Action Banner -->
          <transition name="modal-fade">
            <div v-if="isAudioControlExpanded" class="glass-panel video-control-banner">
              <div class="video-control-left">
                <div class="video-control-title-row">
                  <h3>{{ t.audios?.title || '🎵 音乐同步与管理' }}</h3>
                  <span class="badge-pill" :class="syncStatus === 'connected' ? 'badge-online' : 'badge-offline'">
                    <span class="status-dot" :class="{ 'pulse-dot': syncStatus === 'connected' }"></span>
                    {{ syncStatus === 'connected' ? (t.audios?.mobileConnected ? t.audios.mobileConnected.replace('{name}', activeDeviceName || '设备') : `🟢 手机已直连 [${activeDeviceName || '设备'}]`) : (t.audios?.mobileNotConnected || '⚪ 手机未连接') }}
                  </span>
                  <span v-if="totalUnsyncedAudiosCount > 0" class="badge-pill badge-unsynced-pulse">
                    {{ t.audios?.unsyncedFound ? t.audios.unsyncedFound.replace('{count}', totalUnsyncedAudiosCount) : `⚡ 发现 ${totalUnsyncedAudiosCount} 首新音乐待同步` }}
                  </span>
                </div>
                <p class="video-control-subtitle">
                  {{ t.audios?.subtitle || '支持按日期与曲目浏览手机音乐，勾选后一键极速传输下载。' }}
                  <span style="color: var(--text-primary); font-weight: 600;">
                    {{ t.audios?.totalStats ? t.audios.totalStats.replace('{total}', totalAllAudiosCount).replace('{synced}', localAudios.length) : `(共 ${totalAllAudiosCount} 首音乐 • 已备份 ${localAudios.length} 首)` }}
                  </span>
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="video-control-actions">
                <!-- Download Selected Audios Button -->
                <button 
                  v-if="syncStatus === 'connected'"
                  class="btn btn-primary"
                  :class="{ 'btn-glow-pulse': selectedAudiosCount > 0 }"
                  :disabled="isAudioSyncing || selectedAudiosCount === 0"
                  @click="downloadSelectedAudios"
                  :title="selectedAudiosCount > 0 ? (t.audios?.downloadSelectedBtn ? t.audios.downloadSelectedBtn.replace('{count}', selectedAudiosCount) : '下载所有已勾选的音乐') : (t.audios?.noSelectedBtn || '请在下方勾选要下载的音乐')"
                >
                  <span>⬇️</span> {{ selectedAudiosCount > 0 ? (t.audios?.downloadSelectedBtn ? t.audios.downloadSelectedBtn.replace('{count}', selectedAudiosCount) : `下载选中音乐 (${selectedAudiosCount})`) : (t.audios?.noSelectedBtn || '请勾选音乐下载') }}
                </button>

                <!-- Select All / Clear Selection Button -->
                <button 
                  v-if="syncStatus === 'connected' && totalUnsyncedAudiosCount > 0"
                  class="btn btn-secondary btn-sm"
                  @click="selectedAudiosCount === totalUnsyncedAudiosCount ? clearAudioSelection() : selectAllUnsyncedAudios()"
                >
                  {{ selectedAudiosCount === totalUnsyncedAudiosCount ? (t.audios?.clearSelection || '⬜ 取消全选') : (t.audios?.selectAllUnsynced ? t.audios.selectAllUnsynced.replace('{count}', totalUnsyncedAudiosCount) : `☑️ 全选待同步 (${totalUnsyncedAudiosCount})`) }}
                </button>

                <!-- Open Audio Sync Folder -->
                <button v-if="hasApi" class="btn btn-secondary btn-sm" @click="openDownloadFolder">
                  {{ t.audios?.openDirBtn || '📂 打开目录' }}
                </button>
              </div>
            </div>
          </transition>

          <!-- Audio Syncing Progress Bar Banner -->
          <div v-if="isAudioSyncing" class="glass-panel video-sync-progress-banner">
            <div class="sync-progress-info">
              <span class="spinner"></span>
              <div class="sync-progress-text">
                <div class="sync-progress-title">
                  <span>{{ currentAudioSyncTitle }}</span>
                  <span class="sync-percent">{{ currentAudioSyncPercent }}%</span>
                </div>
                <div class="sync-progress-track">
                  <div class="sync-progress-bar" :style="{ width: `${currentAudioSyncPercent}%` }"></div>
                </div>
              </div>
            </div>
            <div class="sync-progress-controls">
              <button v-if="!isAudioSyncPaused" class="btn btn-secondary btn-xs" @click="pauseAudioSync">{{ t.audios?.pauseBtn || '⏸️ 暂停' }}</button>
              <button v-else class="btn btn-primary btn-xs" @click="resumeAudioSync">{{ t.audios?.resumeBtn || '▶️ 继续' }}</button>
              <button class="btn btn-secondary btn-xs" style="color: #ef4444;" @click="stopAudioSync">{{ t.audios?.cancelBtn || '⏹️ 取消' }}</button>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" v-if="filteredAudioGroupsByDate.length === 0">
            <div class="empty-state-icon">🎵</div>
            <h2 class="empty-state-title">
              {{ audioTabFilter === 'synced' ? (t.emptyStates?.audioSyncedEmpty || '暂无电脑已备份音乐') : (audioTabFilter === 'unsynced' ? (t.emptyStates?.videoUnsyncedAll || '🎉 手机音乐已全部备份！') : (t.audios?.emptyAudios || '暂无音乐资源')) }}
            </h2>
            <p class="empty-state-desc">
              <span v-if="audioTabFilter === 'synced'">{{ t.emptyStates?.audioSyncedEmptyDesc || '请在顶部切换至「📱 手机待下载」勾选音乐并点击下载。' }}</span>
              <span v-else-if="audioTabFilter === 'unsynced'">{{ t.emptyStates?.videoUnsyncedAllDesc || '手机中所有检测到的音乐均已同步至电脑本地。' }}</span>
              <span v-else>{{ syncStatus === 'connected' ? (t.audios?.emptyConnectedDesc || '手机中暂未检测到音频文件，或点击上方「刷新列表」重新扫描。') : (t.audios?.emptyDisconnectedDesc || '请在左下角连接手机以自动发现并按日期同步音乐，或点击上方「导入本地」选取电脑音频。') }}</span>
            </p>
          </div>

          <!-- Modern Playlist Card Grouped by Date -->
          <div v-else class="audios-scroll-container">
            <div 
              v-for="group in filteredAudioGroupsByDate" 
              :key="group.rawDate"
              class="audio-playlist-card"
            >
              <!-- Sleek Date Header inside Playlist Card -->
              <div class="playlist-header">
                <div class="playlist-header-left">
                  <span class="playlist-calendar-icon">📅</span>
                  <span class="playlist-date-title">{{ group.dateKey }}</span>
                  <span class="playlist-meta-dot">·</span>
                  <span class="playlist-meta-pill">{{ group.filteredCount }} {{ currentLocale === 'zh' || currentLocale === 'zh-TW' ? '首' : 'tracks' }}</span>
                  <span class="playlist-meta-dot">·</span>
                  <span class="playlist-meta-pill">{{ formatBytes(group.filteredBytes) }}</span>
                </div>

                <div class="playlist-header-right">
                  <template v-if="group.hasUnsynced && syncStatus === 'connected'">
                    <button 
                      class="btn-date-select"
                      :class="{ 'is-selected': isAudioDateAllSelected(group) }"
                      @click="toggleAudioDateSelection(group)"
                      :title="isAudioDateAllSelected(group) ? (t.audios?.clearDate || '取消全选') : (t.audios?.selectDate ? t.audios.selectDate.replace('{count}', group.unsyncedCount) : `全选此日期 (${group.unsyncedCount})`)"
                    >
                      <span class="btn-check-dot">{{ isAudioDateAllSelected(group) ? '✓' : '' }}</span>
                      <span>{{ isAudioDateAllSelected(group) ? (t.audios?.clearDate || '取消全选') : (t.audios?.selectDate ? t.audios.selectDate.replace('{count}', group.unsyncedCount) : `全选 (${group.unsyncedCount})`) }}</span>
                    </button>
                    <button 
                      class="btn-date-sync"
                      :disabled="isAudioSyncing"
                      @click="requestAudioSync({ targetDate: group.rawDate, targetIds: group.unsyncedIds })"
                      :title="t.audios?.syncDateBtn ? t.audios.syncDateBtn.replace('{count}', group.unsyncedCount) : '下载此日期的全部音乐'"
                    >
                      <span class="bolt-icon">⚡</span>
                      <span>{{ t.audios?.syncDateBtn ? t.audios.syncDateBtn.replace('{count}', group.unsyncedCount).replace(/^⚡\s*/, '') : `下载 (${group.unsyncedCount})` }}</span>
                    </button>
                  </template>
                  <template v-else-if="!group.hasUnsynced">
                    <span class="audio-all-synced-badge">
                      <span class="check-pill-icon">✓</span>
                      <span>{{ t.audios?.allDateSynced || '已全部备份' }}</span>
                    </span>
                  </template>
                </div>
              </div>

              <!-- Sleek Playlist Track Rows -->
              <div class="playlist-rows">
                <div 
                  v-for="track in group.items" 
                  :key="track.id || track.path"
                  class="playlist-row"
                  :class="{ 
                    'track-selected': isAudioSelected(track),
                    'track-playing': activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path)
                  }"
                  @click="track.isSynced ? openAudioPlayer(track) : toggleAudioSelection(track)"
                >
                  <!-- Left: Checkbox (for unsynced) + Vinyl Cover Art with Hover Play -->
                  <div class="playlist-row-left">
                    <!-- Unsynced Multi-Select Checkbox -->
                    <div 
                      v-if="!track.isSynced" 
                      class="row-checkbox"
                      :class="{ 'is-checked': isAudioSelected(track) }"
                      @click.stop="toggleAudioSelection(track)"
                      :title="t.audios?.selectTrackHint || '勾选/取消勾选曲目'"
                    >
                      <span v-if="isAudioSelected(track)" class="check-icon">✓</span>
                    </div>

                    <!-- Vinyl Disc Art (Hover to show Play / Equalizer when playing) -->
                    <div 
                      class="row-cover-disc" 
                      :class="{ 'is-playing': activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path) }"
                      @click.stop="track.isSynced ? openAudioPlayer(track) : toggleAudioSelection(track)"
                    >
                      <span class="disc-icon">🎵</span>
                      
                      <!-- Hover Play Icon for synced tracks -->
                      <div v-if="track.isSynced" class="disc-hover-play">
                        <span v-if="activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path)">🔊</span>
                        <span v-else>▶</span>
                      </div>

                      <!-- Mini Equalizer jumping animation when playing -->
                      <div v-if="activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path)" class="disc-eq-bars">
                        <span class="disc-eq-bar bar-1"></span>
                        <span class="disc-eq-bar bar-2"></span>
                        <span class="disc-eq-bar bar-3"></span>
                      </div>
                    </div>

                    <!-- Track Metadata Info: Smart Title & Clean Single-Line Typography -->
                    <div class="row-meta">
                      <div class="row-title-line">
                        <span class="row-track-title" :title="track.name">{{ getCleanAudioTitle(track.name) }}</span>
                        <span v-if="getAudioFormatType(track.name) === 'hi-res'" class="row-hires-badge">Hi-Res</span>
                      </div>
                      <div class="row-sub-line">
                        <span class="row-fmt-tag" :class="`fmt-${getAudioFormatType(track.name)}`">
                          {{ getAudioFormat(track.name) }}
                        </span>
                        <template v-if="track.duration">
                          <span class="sub-sep">·</span>
                          <span class="sub-duration">{{ formatVideoDuration(track.duration) }}</span>
                        </template>
                        <span class="sub-sep">·</span>
                        <span class="sub-size">{{ formatBytes(track.size) }}</span>
                        <span class="sub-sep">·</span>
                        <span 
                          class="row-status-pill" 
                          :class="track.isSynced ? 'status-synced' : 'status-unsynced'"
                        >
                          <span class="status-dot"></span>
                          <span>{{ track.isSynced ? (t.audios?.tagSynced || '已备份') : (t.audios?.tagUnsynced || '待下载') }}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Actions (Locate in Folder + Play / Download) -->
                  <div class="playlist-row-actions" @click.stop>
                    <template v-if="track.isSynced">
                      <!-- Locate in Folder Button (revealed on hover) -->
                      <button 
                        v-if="hasApi && track.path"
                        class="btn-row-locate"
                        @click="openAudioFolder(track.path)"
                        :title="t.audios?.locateFileBtn || '在文件夹中定位文件'"
                      >
                        📂
                      </button>

                      <!-- Play / Playing Button -->
                      <button 
                        class="btn-row-play"
                        :class="{ 'is-active-playing': activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path) }"
                        @click="openAudioPlayer(track)"
                        :title="activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path) ? (t.audios?.playing || '正在播放中') : (t.audios?.playHint || '播放此音乐')"
                      >
                        <span v-if="activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path)">
                          <span class="icon-playing">🔊</span> {{ t.audios?.playing || '播放中' }}
                        </span>
                        <span v-else>
                          <span>▶</span> {{ currentLocale === 'zh' || currentLocale === 'zh-TW' ? '播放' : 'Play' }}
                        </span>
                      </button>
                    </template>
                    <template v-else>
                      <button 
                        class="btn-row-download"
                        :disabled="isAudioSyncing"
                        @click="downloadSingleAudio(track)"
                        :title="t.audios?.quickDownload || '单曲下载'"
                      >
                        <span>⬇</span> {{ t.audios?.quickDownload || '下载' }}
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Floating Bottom Sticky Bar for Multi-Select Download -->
          <transition name="modal-fade">
            <div 
              v-if="selectedAudiosCount > 0" 
              class="audio-floating-bar glass-panel"
            >
              <div class="audio-floating-info">
                <span class="floating-music-icon">🎵</span>
                <span>
                  {{ t.audios?.floatingSelected ? t.audios.floatingSelected.replace('{count}', selectedAudiosCount) : `已勾选 ${selectedAudiosCount} 首音乐` }}
                  <span class="floating-size-hint">
                    ({{ t.audios?.floatingTotalSize ? t.audios.floatingTotalSize.replace('{size}', formatBytes(selectedAudiosTotalBytes)) : `共 ${formatBytes(selectedAudiosTotalBytes)}` }})
                  </span>
                </span>
              </div>
              <div class="audio-floating-actions">
                <button 
                  class="btn btn-secondary btn-sm btn-floating-clear" 
                  @click="clearAudioSelection"
                >
                  {{ t.audios?.floatingClear || '✕ 取消勾选' }}
                </button>
                <button 
                  class="btn btn-primary btn-floating-download" 
                  @click="downloadSelectedAudios"
                  :disabled="isAudioSyncing"
                >
                  <span>⬇️</span>
                  <span>{{ isAudioSyncing ? '正在下载...' : (t.audios?.floatingDownload ? t.audios.floatingDownload.replace('{count}', selectedAudiosCount) : `立即下载 (${selectedAudiosCount})`) }}</span>
                </button>
              </div>
            </div>
          </transition>

          <!-- Modern Cyber Hi-Fi Audio Player Lightbox Modal -->
          <transition name="modal-fade">
            <div v-if="activePlayingAudio" class="video-player-overlay" @click.self="closeAudioPlayer">
              <div class="audio-player-modal glass-panel">
                <button class="vp-floating-close-btn" @click="closeAudioPlayer" :title="t.lightbox?.closeApp || '关闭播放器 (ESC)'">✕</button>

                <div class="audio-player-content">
                  <!-- Modern Cyber Hi-Fi Vinyl Deck -->
                  <div class="hifi-player-deck">
                    <div class="vinyl-record spinning">
                      <div class="vinyl-groove-rings"></div>
                      <div class="vinyl-inner">
                        <span style="font-size: 28px;">🎵</span>
                      </div>
                    </div>
                  </div>

                  <!-- Dynamic Equalizer Frequency Wave in Player -->
                  <div class="hifi-player-equalizer">
                    <span class="eq-bar bar-1"></span>
                    <span class="eq-bar bar-2"></span>
                    <span class="eq-bar bar-3"></span>
                    <span class="eq-bar bar-4"></span>
                    <span class="eq-bar bar-5"></span>
                    <span class="eq-bar bar-6"></span>
                    <span class="eq-bar bar-7"></span>
                    <span class="eq-bar bar-8"></span>
                  </div>

                  <!-- Track Info -->
                  <div class="audio-player-info">
                    <h3 class="audio-player-title">{{ getCleanAudioTitle(activePlayingAudio.name) }}</h3>
                    <div class="audio-player-specs">
                      <span class="hifi-tag" :class="`hifi-tag-${getAudioFormatType(activePlayingAudio.name)}`">
                        {{ getAudioFormat(activePlayingAudio.name) }}
                      </span>
                      <span v-if="activePlayingAudio.duration" class="hifi-player-spec-pill">
                        ⏱️ {{ formatVideoDuration(activePlayingAudio.duration) }}
                      </span>
                      <span class="hifi-player-spec-pill">
                        💾 {{ formatBytes(activePlayingAudio.size) }}
                      </span>
                    </div>
                    <p class="audio-player-raw-name" :title="activePlayingAudio.name">
                      {{ activePlayingAudio.name }}
                    </p>
                  </div>

                  <!-- Native Audio Player -->
                  <audio 
                    :src="activePlayingAudio.src || `local:///${activePlayingAudio.path.replace(/\\/g, '/')}`" 
                    controls 
                    autoplay 
                    class="audio-native-element"
                  ></audio>
                </div>
              </div>
            </div>
          </transition>
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

        <!-- 5.0 PEOPLE ALBUM TAB -->
        <div v-else-if="currentTab === 'people'" style="width: 100%; height: 100%; display: flex; text-align: left; box-sizing: border-box; overflow: hidden;">
          <!-- Empty State -->
          <div class="empty-state" v-if="personClusters.length === 0" style="width: 100%;">
            <div class="empty-state-icon">👥</div>
            <h2 class="empty-state-title">{{ t.people?.emptyPeople || '暂无人物相册' }}</h2>
            <p class="empty-state-desc">
              {{ t.people?.emptyPeopleDesc || '导入含有清晰人脸的照片或同步相册后，系统将自动进行面部提取与归类。' }}
            </p>
            <button class="btn btn-primary" @click="handleReclusterPeople" :disabled="isClusteringPeople" style="margin-top: 16px;">
              {{ t.people?.reclusterBtn || '🔄 智能计算/刷新人物聚类' }}
            </button>
          </div>

          <!-- Split People Album View (Left Avatars Sidebar + Right Timeline Gallery) -->
          <div v-else style="display: flex; width: 100%; height: 100%; gap: 16px; overflow: hidden;">
            <!-- Left Avatars Sidebar Column -->
            <aside style="width: 110px; display: flex; flex-direction: column; align-items: center; gap: 22px; padding: 16px 8px; border-right: 1px solid var(--border-color); overflow-y: auto; flex-shrink: 0; scrollbar-width: none;">
              <div 
                v-for="person in personClusters" 
                :key="person.id" 
                style="display: flex; flex-direction: column; align-items: center; cursor: pointer; position: relative; width: 100%; transition: transform 0.2s;"
                :style="{ transform: selectedPersonId === person.id ? 'scale(1.06)' : 'scale(1)' }"
                @click="selectPerson(person)"
              >
                <!-- Circular Avatar Ring -->
                <div style="width: 76px; height: 76px; border-radius: 50%; overflow: hidden; background: #0f172a; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                  :style="{ border: selectedPersonId === person.id ? '3px solid #10b981' : '3px solid rgba(255,255,255,0.1)', boxShadow: selectedPersonId === person.id ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 4px 10px rgba(0,0,0,0.3)' }"
                >
                  <img v-if="person.cover_path" :src="getPersonCoverUrl(person)" style="width: 100%; height: 100%; object-fit: cover;" />
                  <span v-else style="font-size: 32px;">🧑</span>
                </div>
                <!-- Dark Pill Badge beneath Avatar -->
                <div style="position: relative; margin-top: -12px; background: #1e293b; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 2px 6px rgba(0,0,0,0.4); white-space: nowrap; z-index: 2;">
                  {{ person.face_count }}
                </div>
              </div>
            </aside>

            <!-- Right Main Area: Timeline Gallery -->
            <main style="flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 12px 20px 24px 12px; height: 100%; box-sizing: border-box;">
              <!-- Header Bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0;">
                    👥 {{ currentSelectedPerson ? currentSelectedPerson.name : (t.people?.unnamed || '选择人物') }} ({{ t.people?.photoCount ? t.people.photoCount.replace('{count}', selectedPersonPhotos.length) : `${selectedPersonPhotos.length} 张照片` }})
                  </h2>
                  <button v-if="currentSelectedPerson" class="btn btn-secondary" @click="promptRenamePerson(currentSelectedPerson)" style="padding: 4px 10px; font-size: 11px; border-radius: 6px;">
                    ✏️ {{ t.people?.renameHint || '重命名' }}
                  </button>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button 
                    class="btn" 
                    @click="handleRecalculateFaces" 
                    :disabled="isClusteringPeople"
                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-primary); cursor: pointer;"
                  >
                    <span v-if="isClusteringPeople" class="spinner" style="width: 12px; height: 12px; border-color: var(--text-primary); border-top-color: transparent;"></span>
                    <span v-else>♻️</span>
                    <span>{{ t.people?.recalculateBtn || '⚡ 深度重算所有人脸特征' }}</span>
                  </button>
                  <button 
                    class="btn btn-primary" 
                    @click="handleReclusterPeople" 
                    :disabled="isClusteringPeople"
                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #7c3aed); cursor: pointer;"
                  >
                    <span v-if="isClusteringPeople" class="spinner" style="width: 12px; height: 12px;"></span>
                    <span v-else>🔄</span>
                    <span>{{ isClusteringPeople ? (faceScanProgress.total > 0 && faceScanProgress.done < faceScanProgress.total ? '提取人脸中 (' + faceScanProgress.done + '/' + faceScanProgress.total + ')' : '计算聚类中...') : (t.people?.reclusterBtn || '刷新聚类') }}</span>
                  </button>
                </div>
              </div>

              <!-- Real-time Face Extraction Progress Banner with Per-Image Timing (Anti-jitter Layout) -->
              <div 
                v-if="isClusteringPeople && faceScanProgress.total > 0" 
                style="display: flex; flex-direction: column; justify-content: space-between; min-height: 88px; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); box-sizing: border-box; overflow: hidden;"
              >
                <!-- Top Row: Status Text on Left (Nowrap) + Timing Badges on Right (Nowrap) -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex-shrink: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    <span class="spinner" style="width: 14px; height: 14px; border: 2px solid #a855f7; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite; flex-shrink: 0;"></span>
                    <span style="font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap;">
                      {{ faceScanProgress.done < faceScanProgress.total ? (t.people?.extractingFaces || '正在逐张提取人脸特征...') : (t.people?.clusteringFaces || '正在进行生物特征聚类...') }}
                    </span>
                    <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 0;">
                      ({{ faceScanProgress.done }} / {{ faceScanProgress.total }})
                    </span>
                  </div>
                  
                  <!-- Timing Badges (Fixed Single Line, No Wrapping) -->
                  <div style="display: flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; flex-shrink: 0; white-space: nowrap;">
                    <span v-if="faceScanDurationMs > 0 || (faceScanProgress && faceScanProgress.durationMs > 0)" style="font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.25); white-space: nowrap;">
                      ⚡ {{ t.people?.singleFaceLatency || '单张:' }} {{ faceScanDurationMs || faceScanProgress.durationMs }} ms
                    </span>
                    <span v-if="faceScanAvgMs > 0 || (faceScanProgress && faceScanProgress.avgDurationMs > 0)" style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.25); white-space: nowrap;">
                      ⏱️ {{ t.people?.avgFaceLatency || '平均:' }} {{ faceScanAvgMs || faceScanProgress.avgDurationMs }} ms
                    </span>
                    <span v-if="faceScanRemainingTime" style="font-size: 11px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.25); white-space: nowrap;">
                      ⏳ {{ t.people?.remainingFaceTime || '剩余:' }} {{ faceScanRemainingTime }}
                    </span>
                  </div>
                </div>

                <!-- Middle Row: Progress Bar Track -->
                <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; position: relative; margin: 6px 0;">
                  <div 
                    style="height: 100%; background: linear-gradient(90deg, #a855f7, #38bdf8); transition: width 0.1s linear; border-radius: 4px;"
                    :style="{ width: `${Math.min(100, Math.round((faceScanProgress.done / faceScanProgress.total) * 100))}%` }"
                  ></div>
                </div>

                <!-- Bottom Row: Current File Path + Percentage -->
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary); min-height: 16px;">
                  <span style="max-width: 80%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ faceScanProgress.currentName ? `${t.people?.processing || '当前处理:'} ${faceScanProgress.currentName}` : (t.people?.preparing || '准备中...') }}
                  </span>
                  <span style="font-variant-numeric: tabular-nums; font-weight: 600; flex-shrink: 0; margin-left: 8px;">
                    {{ Math.min(100, Math.round((faceScanProgress.done / faceScanProgress.total) * 100)) }}%
                  </span>
                </div>
              </div>

              <!-- Date Grouped Timeline Photo Grids -->
              <div v-if="Object.keys(groupedPersonPhotos).length > 0" style="display: flex; flex-direction: column; gap: 24px;">
                <div v-for="(photos, dateStr) in groupedPersonPhotos" :key="dateStr" style="display: flex; flex-direction: column; gap: 12px;">
                  <!-- Date Header -->
                  <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: var(--text-secondary);">
                    <input type="checkbox" style="cursor: pointer;" />
                    <span>{{ dateStr }}</span>
                  </div>

                  <!-- Photos Grid for this date -->
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;">
                    <div 
                      v-for="img in photos" 
                      :key="img.path" 
                      class="image-card" 
                      style="border-radius: 12px; overflow: hidden; aspect-ratio: 1; cursor: pointer;"
                      @click="openDetails(img, selectedPersonPhotos)"
                    >
                      <div class="card-img-wrapper" style="width: 100%; height: 100%;">
                        <img :src="img.src" class="card-img" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No Person Selected Fallback -->
              <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--text-muted);">
                <span style="font-size: 40px; margin-bottom: 12px;">📸</span>
                <span>{{ t.people?.selectPersonHint || '请在左侧点击选择一个人物查看相册照片' }}</span>
              </div>
            </main>
          </div>
        </div>

        <!-- 5.1 YT-DLP DOWNLOADER TAB -->
        <div v-else-if="currentTab === 'yt-dlp'" class="yt-page-wrapper">
          
          <!-- Modern Top Bar: Segmented Tabs on Left, Context Actions on Right -->
          <div class="yt-top-header">
            <!-- Three Primary Tabs: Parse / Downloading / Completed -->
            <div class="yt-segmented-tabs">
              <button 
                @click="ytSubTab = 'parse'" 
                class="yt-tab-btn"
                :class="{ active: ytSubTab === 'parse' }"
              >
                <span>{{ t.ytDlp?.tabParse || '🔗 视频解析' }}</span>
              </button>

              <button 
                @click="ytSubTab = 'downloading'" 
                class="yt-tab-btn"
                :class="{ active: ytSubTab === 'downloading' }"
              >
                <span>{{ t.ytDlp?.tabDownloading || '⏳ 正在下载' }}</span>
                <span v-if="ytActiveTasks.length > 0" class="yt-tab-badge yt-tab-badge-danger">{{ ytActiveTasks.length }}</span>
              </button>

              <button 
                @click="ytSubTab = 'completed'" 
                class="yt-tab-btn"
                :class="{ active: ytSubTab === 'completed' }"
              >
                <span>{{ t.ytDlp?.tabCompleted || '✅ 已完成' }}</span>
                <span v-if="ytHistory.length > 0" class="yt-tab-badge" :class="ytSubTab === 'completed' ? 'yt-tab-badge-active' : 'yt-tab-badge-inactive'">{{ ytHistory.length }}</span>
              </button>
            </div>

            <!-- Right Controls: Cookie Sync Dropdown + Context Actions -->
            <div style="display: flex; gap: 10px; align-items: center;">
              <!-- 🔐 YouTube Cookie & Login Sync Dropdown -->
              <div class="yt-cookie-sync-wrapper" ref="ytCookieWrapperRef">
                <button 
                  class="yt-cookie-btn" 
                  :class="{ 'yt-cookie-active': ytCookieConfig.mode !== 'none' }"
                  @click.stop="showYtCookieMenu = !showYtCookieMenu"
                  :title="t.videoDownloader?.cookieMenuTitle || 'YouTube 登录同步设置'"
                  :disabled="ytCookieSyncing"
                >
                  <span v-if="ytCookieSyncing" class="yt-cookie-spinner"></span>
                  <span v-else class="yt-cookie-dot" :class="ytCookieConfig.mode !== 'none' ? 'dot-active' : 'dot-inactive'"></span>
                  <span>🔐 {{ ytCookieSyncing ? (ytSyncStatusText || (t.ytDlp?.syncingFrom || '同步中...')) : ytCookieSummaryLabel }}</span>
                  <span class="yt-cookie-arrow">▼</span>
                </button>

                <!-- Dropdown Popup -->
                <div v-if="showYtCookieMenu" class="yt-cookie-menu" @click.stop>
                  <div class="yt-cookie-menu-header">
                    <div class="yt-cookie-menu-title">
                      <span>🔐</span>
                      <span>{{ t.videoDownloader?.cookieMenuTitle || 'YouTube 登录同步' }}</span>
                    </div>
                    <div class="yt-cookie-menu-desc">
                      {{ t.videoDownloader?.cookieMenuDesc || '同步浏览器或内嵌登录态，解锁 18+ 年龄受限视频、高码率与会员专享视频。' }}
                    </div>
                  </div>

                  <!-- Loading Banner -->
                  <div v-if="ytCookieSyncing" class="yt-sync-loading-banner">
                    <span class="yt-cookie-spinner"></span>
                    <span>{{ ytSyncStatusText || (t.ytDlp?.syncingFrom || '正在同步浏览器登录凭据...') }}</span>
                  </div>

                  <div class="yt-cookie-options">
                    <!-- Option 1: None (Disabled) -->
                    <div 
                      class="yt-cookie-option" 
                      :class="{ selected: ytCookieConfig.mode === 'none' }"
                      @click="changeYtCookieMode('none')"
                    >
                      <span class="option-icon">🚫</span>
                      <div class="option-info">
                        <span>{{ t.videoDownloader?.syncNone || '未开启 (匿名解析)' }}</span>
                      </div>
                      <span v-if="ytCookieConfig.mode === 'none'" class="option-check">✓</span>
                    </div>

                    <!-- Option 2: Microsoft Edge (Recommended) -->
                    <div 
                      class="yt-cookie-option" 
                      :class="{ selected: ytCookieConfig.mode === 'edge' }"
                      @click="changeYtCookieMode('edge')"
                    >
                      <span class="option-icon">🌊</span>
                      <div class="option-info">
                        <span>{{ t.videoDownloader?.syncEdge || 'Microsoft Edge' }}</span>
                        <span class="option-badge">{{ t.videoDownloader?.fastSyncBadge || '免密秒同步 · 推荐' }}</span>
                      </div>
                      <span v-if="ytCookieConfig.mode === 'edge'" class="option-check">✓</span>
                    </div>

                    <!-- Option 3: Google Chrome -->
                    <div 
                      class="yt-cookie-option" 
                      :class="{ selected: ytCookieConfig.mode === 'chrome' }"
                      @click="changeYtCookieMode('chrome')"
                    >
                      <span class="option-icon">🌐</span>
                      <div class="option-info">
                        <span>{{ t.videoDownloader?.syncChrome || 'Google Chrome' }}</span>
                      </div>
                      <span v-if="ytCookieConfig.mode === 'chrome'" class="option-check">✓</span>
                    </div>

                    <!-- Option 4: Firefox -->
                    <div 
                      class="yt-cookie-option" 
                      :class="{ selected: ytCookieConfig.mode === 'firefox' }"
                      @click="changeYtCookieMode('firefox')"
                    >
                      <span class="option-icon">🦊</span>
                      <div class="option-info">
                        <span>{{ t.videoDownloader?.syncFirefox || 'Mozilla Firefox' }}</span>
                      </div>
                      <span v-if="ytCookieConfig.mode === 'firefox'" class="option-check">✓</span>
                    </div>

                    <!-- Option 5: Brave -->
                    <div 
                      class="yt-cookie-option" 
                      :class="{ selected: ytCookieConfig.mode === 'brave' }"
                      @click="changeYtCookieMode('brave')"
                    >
                      <span class="option-icon">🦁</span>
                      <div class="option-info">
                        <span>{{ t.videoDownloader?.syncBrave || 'Brave Browser' }}</span>
                      </div>
                      <span v-if="ytCookieConfig.mode === 'brave'" class="option-check">✓</span>
                    </div>

                    <!-- Option 6: In-App Embedded Account -->
                    <div 
                      class="yt-cookie-option" 
                      :class="{ selected: ytCookieConfig.mode === 'embedded' }"
                      @click="changeYtCookieMode('embedded')"
                    >
                      <span class="option-icon">🔑</span>
                      <div class="option-info">
                        <span>{{ t.videoDownloader?.syncEmbedded || '内嵌独立登录' }}</span>
                        <span v-if="ytCookieConfig.hasEmbeddedCookies" class="option-badge option-badge-success">{{ t.videoDownloader?.savedBadge || '已保存' }}</span>
                      </div>
                      <span v-if="ytCookieConfig.mode === 'embedded'" class="option-check">✓</span>
                    </div>

                    <!-- Option 7: Import cookies.txt -->
                    <div 
                      class="yt-cookie-option" 
                      @click="importYtCookiesFile"
                    >
                      <span class="option-icon">📁</span>
                      <div class="option-info">
                        <span>{{ t.videoDownloader?.syncFile || '导入 cookies.txt 文件' }}</span>
                      </div>
                    </div>
                  </div>

                  <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; padding: 4px 6px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
                    💡 {{ t.videoDownloader?.cookieLockedTip || 'Chrome 运行中锁定了数据库？推荐一键选择【Microsoft Edge】免密秒同步！' }}
                  </div>

                  <div class="yt-cookie-menu-divider"></div>

                  <!-- Actions: Open login window or clear cookies -->
                  <div class="yt-cookie-actions">
                    <button class="btn btn-primary yt-action-btn" @click="openYtLoginWindow" :disabled="ytCookieSyncing">
                      <span>🔑</span>
                      <span>{{ ytCookieConfig.hasEmbeddedCookies ? '重新登录 YouTube' : (t.videoDownloader?.embeddedLoginBtn || '内嵌一键登录') }}</span>
                    </button>
                    <button v-if="ytCookieConfig.hasEmbeddedCookies || ytCookieConfig.mode !== 'none'" class="btn btn-secondary yt-action-btn yt-action-logout" @click="clearYtCookies" :disabled="ytCookieSyncing">
                      <span>🚪</span>
                      <span>{{ t.videoDownloader?.clearLoginBtn || '退出登录 / 清除凭据' }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- If Parse Tab: Direct Trigger Button for Sniffer Window -->
              <div v-if="ytSubTab === 'parse'" style="display: flex; align-items: center; gap: 8px;">
                <button 
                  @click="openSnifferBrowser()" 
                  class="yt-mode-btn active"
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; font-size: 13px; font-weight: 600; box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35); cursor: pointer;"
                  :title="snifferWindowStatus.isOpen ? (t.ytDlp?.focusWindow || '独立嗅探窗口已打开，点击立即聚焦前台') : (t.ytDlp?.openSnifferBtn || '点击直接弹出独立嗅探浏览器窗口')"
                >
                  <span>🌐</span>
                  <span>{{ snifferWindowStatus.isOpen ? `${t.ytDlp?.openSnifferBtn || '独立嗅探窗口'} (${t.ytDlp?.windowReady || '已开启'})` : (t.ytDlp?.openSnifferBtn || '独立嗅探窗口') }}</span>
                  <span v-if="snifferWindowStatus.isOpen" class="sniffer-online-dot"></span>
                </button>
                <button 
                  @click="openSnifferWithMoreSites()" 
                  class="yt-mode-btn"
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); color: #cbd5e1;"
                  :title="t.videoDownloader?.moreSitesTooltip || t.ytDlp?.moreSitesTooltip || '查看全部 1800+ 支持视频解析的网站名录'"
                >
                  <span>📋</span>
                  <span>{{ t.videoDownloader?.moreSitesBtn || t.ytDlp?.moreSitesBtn || '全部支持站点 (1800+)' }}</span>
                </button>
              </div>

              <!-- If Downloading or Completed Tab: Directory and Manage Actions -->
              <div v-else style="display: flex; gap: 8px; align-items: center;">
                <!-- Category Mode Switcher (Time vs Source) when in Completed tab and has items -->
                <div v-if="ytSubTab === 'completed' && ytHistory.length > 0" class="cat-mode-toggle" style="display: flex; background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 8px; padding: 2px;">
                  <button 
                    type="button"
                    @click="setYtCategoryMode('time')"
                    :class="{ active: ytCategoryMode === 'time' }"
                    style="border: none; background: transparent; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; transition: all 0.15s ease;"
                    :style="ytCategoryMode === 'time' ? 'background: var(--accent-primary); color: #fff; font-weight: 600; box-shadow: 0 2px 6px rgba(99,102,241,0.3);' : 'color: var(--text-secondary);'"
                    :title="t.ytDlp?.byTime || '按时间分类'"
                  >
                    <span>⏱️</span> <span>{{ t.ytDlp?.byTime || '按时间' }}</span>
                  </button>
                  <button 
                    type="button"
                    @click="setYtCategoryMode('source')"
                    :class="{ active: ytCategoryMode === 'source' }"
                    style="border: none; background: transparent; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; transition: all 0.15s ease;"
                    :style="ytCategoryMode === 'source' ? 'background: var(--accent-primary); color: #fff; font-weight: 600; box-shadow: 0 2px 6px rgba(99,102,241,0.3);' : 'color: var(--text-secondary);'"
                    :title="t.ytDlp?.bySource || '按来源分类'"
                  >
                    <span>🏷️</span> <span>{{ t.ytDlp?.bySource || '按来源' }}</span>
                  </button>
                </div>

                <!-- View Mode Switcher (Grid / List) when in Completed tab and has items -->
                <div v-if="ytSubTab === 'completed' && ytHistory.length > 0" class="view-mode-toggle" style="display: flex; background: var(--bg-tertiary); border: 1px solid var(--glass-border); border-radius: 8px; padding: 2px;">
                  <button 
                    type="button"
                    @click="setYtViewMode('grid')"
                    :class="{ active: ytViewMode === 'grid' }"
                    style="border: none; background: transparent; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; transition: all 0.15s ease;"
                    :style="ytViewMode === 'grid' ? 'background: var(--accent-primary); color: #fff; font-weight: 600; box-shadow: 0 2px 6px rgba(99,102,241,0.3);' : 'color: var(--text-secondary);'"
                    :title="t.ytDlp?.gridView || '网格视图'"
                  >
                    <span>☵</span> <span>{{ t.ytDlp?.gridView || '网格' }}</span>
                  </button>
                  <button 
                    type="button"
                    @click="setYtViewMode('list')"
                    :class="{ active: ytViewMode === 'list' }"
                    style="border: none; background: transparent; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; transition: all 0.15s ease;"
                    :style="ytViewMode === 'list' ? 'background: var(--accent-primary); color: #fff; font-weight: 600; box-shadow: 0 2px 6px rgba(99,102,241,0.3);' : 'color: var(--text-secondary);'"
                    :title="t.ytDlp?.listView || '列表视图'"
                  >
                    <span>☰</span> <span>{{ t.ytDlp?.listView || '列表' }}</span>
                  </button>
                </div>

                <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 12px; display: flex; align-items: center; gap: 6px;" @click="window.api.openDownloadFolder()">
                  <span>📁 {{ t.ytDlp?.openFolder || '打开下载文件夹' }}</span>
                </button>
                <button v-if="ytSubTab === 'completed' && ytHistory.length > 0" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; color: var(--text-muted);" @click="clearAllYtHistory" :title="t.ytDlp?.deleteHistory || '清空全部已完成记录'">
                  <span>🧹 {{ t.ytDlp?.deleteHistory || '清空记录' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 1: PARSE & DOWNLOAD -->
          <div v-if="ytSubTab === 'parse'" style="display: flex; flex-direction: column; flex: 1;">
            <!-- Live Sniffer Window Banner if open -->
            <div v-if="snifferWindowStatus.isOpen" style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 12px; padding: 10px 16px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
              <div style="min-width: 0; flex: 1; display: flex; align-items: center; gap: 10px;">
                <span class="sniffer-online-dot"></span>
                <span style="font-size: 12px; font-weight: 700; color: #818cf8; white-space: nowrap;">{{ t.ytDlp?.windowReady || '独立嗅探窗口就绪:' }}</span>
                <span style="font-size: 12px; color: var(--text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ snifferWindowStatus.title || (t.ytDlp?.windowReady || '正在浏览网页...') }}
                </span>
              </div>
              <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 11px; border-radius: 7px; display: flex; align-items: center; gap: 4px;" @click="parseSnifferCurrentUrl" :title="t.ytDlp?.pullToParse || '拉取独立窗口正在浏览的视频网址到下方解析框'">
                  <span>📥</span>
                  <span>{{ t.ytDlp?.pullToParse || '拉取至解析' }}</span>
                </button>
                <button class="btn btn-primary" style="padding: 5px 14px; font-size: 11px; border-radius: 7px; font-weight: 600;" @click="focusSnifferBrowser">
                  🪟 {{ t.ytDlp?.focusWindow || '聚焦窗口' }}
                </button>
                <button class="btn btn-secondary" style="padding: 5px 9px; font-size: 11px; border-radius: 7px; color: #ef4444;" @click="closeSnifferBrowser" :title="t.ytDlp?.closeWindow || '关闭独立嗅探窗口'">
                  ✕
                </button>
              </div>
            </div>
              <!-- Sleek Search/URL Input Box -->
              <div class="yt-input-card">
                <span style="font-size: 16px; margin-right: 12px; opacity: 0.6;">🔗</span>
                <input 
                  v-model="ytUrl" 
                  type="text" 
                  :placeholder="t.ytDlp?.urlPlaceholder || '在此粘贴视频链接 (支持 Bilibili、抖音、快手、YouTube、Twitter/X、小红书等 1000+ 平台)...'" 
                  class="yt-url-input"
                  :disabled="ytParsing"
                  @keyup.enter="parseYtVideo"
                />
                <div style="display: flex; gap: 8px; align-items: center;">
                  <button 
                    class="btn btn-secondary" 
                    style="padding: 8px 14px; font-size: 12px; font-weight: 600; border-radius: 8px;"
                    @click="pasteFromClipboard"
                    :title="t.ytDlp?.pasteBtn || '从剪贴板粘贴'"
                  >
                    📋 {{ t.ytDlp?.pasteBtn || '粘贴' }}
                  </button>
                  <button 
                    class="btn btn-primary" 
                    style="padding: 9px 22px; font-size: 13px; font-weight: 600; border-radius: 8px; display: flex; align-items: center; gap: 6px;"
                    @click="parseYtVideo"
                    :disabled="ytParsing || !ytUrl"
                  >
                    <span v-if="ytParsing" class="spinner" style="width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                    <span>{{ ytParsing ? (t.ytDlp?.parsingBtn || '正在解析...') : (t.ytDlp?.parseBtn || '⚡ 快速解析') }}</span>
                  </button>
                </div>
              </div>

              <!-- Parsing Status Feedback -->
              <div v-if="ytProgress && ytParsing" class="yt-card" style="padding: 12px 18px; margin-bottom: 18px; display: flex; align-items: center; gap: 12px; border-color: rgba(99, 102, 241, 0.35);">
                <span class="spinner" style="width: 16px; height: 16px; border: 2px solid var(--accent-primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                <span style="color: var(--text-primary); font-size: 13px; font-weight: 500;">{{ ytProgress.status }}</span>
              </div>

              <div v-if="ytParseError" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; font-weight: 500;">
                <span>⚠️ {{ ytParseError }}</span>
              </div>

              <!-- Video Detail & Resolution Selector Card -->
              <div v-if="ytVideoInfo" class="yt-card" style="padding: 22px; margin-bottom: 20px; display: flex; gap: 24px; flex-wrap: wrap;">
                <!-- Left: Video Cover Poster -->
                <div style="position: relative; width: 260px; height: 146px; flex-shrink: 0; border-radius: 10px; overflow: hidden; background: var(--bg-tertiary); box-shadow: 0 8px 24px rgba(0,0,0,0.25); border: 1px solid var(--glass-border);">
                  <img v-if="ytVideoInfo.thumbnail" :src="getYtMediaSrc(ytVideoInfo.thumbnail)" style="width: 100%; height: 100%; object-fit: cover;" />
                  <div v-if="ytVideoInfo.duration" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
                    {{ formatDuration(ytVideoInfo.duration) }}
                  </div>
                </div>

                <!-- Right: Metadata & Resolution Chips -->
                <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 class="yt-card-title" style="font-size: 17px; margin: 0 0 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      {{ ytVideoInfo.title }}
                    </h3>
                    <div style="display: flex; gap: 12px; align-items: center; font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; flex-wrap: wrap;">
                      <span 
                        v-if="getPlatformBadge(ytVideoInfo?.webpage_url || ytUrl)" 
                        :style="getPlatformBadge(ytVideoInfo?.webpage_url || ytUrl).style"
                        style="padding: 2px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;"
                      >
                        <span>{{ getPlatformBadge(ytVideoInfo?.webpage_url || ytUrl).icon }}</span>
                        <span>{{ getPlatformBadge(ytVideoInfo?.webpage_url || ytUrl).name }}</span>
                      </span>
                      <span v-if="ytVideoInfo.uploader">👤 {{ ytVideoInfo.uploader }}</span>
                      <span v-if="ytVideoInfo.duration">⏱️ {{ t.ytDlp?.duration || '时长:' }} {{ formatDuration(ytVideoInfo.duration) }}</span>
                    </div>

                    <!-- Resolution Pill Selection Grid -->
                    <div style="margin-bottom: 16px;">
                      <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span>🎯 {{ t.ytDlp?.selectResolution || '选择清晰度 / 下载规格:' }}</span>
                        <span style="color: var(--accent-primary); font-weight: 700;">{{ ytSelectedResolution?.label }}</span>
                      </div>

                      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <button 
                          v-for="res in ytVideoInfo.resolutions" 
                          :key="res.id"
                          type="button"
                          @click="ytSelectedResolution = res"
                          class="yt-res-pill"
                          :class="{ active: ytSelectedResolution?.id === res.id }"
                        >
                          <span>{{ res.label }}</span>
                          <span v-if="res.filesize > 0" style="font-size: 10px; opacity: 0.8; font-weight: normal;">
                            ({{ formatFileSize(res.filesize) }})
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Download Button Bar -->
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--glass-border);">
                    <span style="font-size: 12px; color: var(--text-secondary);">
                      🖼️ {{ t.ytDlp?.coverAutoEmbed || '下载将自动内嵌高清海报封面至 MP4 视频' }}
                    </span>
                    <button 
                      class="btn btn-primary" 
                      style="padding: 10px 26px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; border-radius: 8px;"
                      @click="startYtDownload"
                    >
                      <span>🚀 {{ t.ytDlp?.downloadBtn || '开始极速下载' }}</span>
                    </button>
                  </div>
                </div>
              </div>
          </div>

          <!-- TAB 2: DOWNLOADING TASKS LIST -->
          <div v-else-if="ytSubTab === 'downloading'" style="flex: 1; display: flex; flex-direction: column;">
            <!-- Empty State -->
            <div v-if="ytActiveTasks.length === 0" class="yt-empty-container">
              <div class="yt-empty-icon">⏳</div>
              <div class="yt-empty-title">
                {{ t.ytDlp?.emptyDownloading || '暂无正在下载的任务' }}
              </div>
              <p class="yt-empty-desc">
                {{ t.ytDlp?.emptyDownloadingDesc || '点击上方视频解析标签，粘贴视频链接并选择清晰度，即可在此实时监控下载进度！' }}
              </p>
              <button class="btn btn-primary" style="padding: 8px 22px; font-size: 13px; border-radius: 8px;" @click="ytSubTab = 'parse'">
                {{ t.ytDlp?.tabParse || '前往添加下载任务' }}
              </button>
            </div>

            <!-- Task List -->
            <div v-else style="display: flex; flex-direction: column; gap: 14px; overflow-y: auto;">
              <div 
                v-for="task in ytActiveTasks" 
                :key="task.id"
                class="yt-card"
                style="display: flex; gap: 18px; align-items: center; padding: 16px;"
              >
                <!-- Thumbnail -->
                <div style="position: relative; width: 140px; height: 78px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: var(--bg-tertiary); border: 1px solid var(--glass-border);">
                  <img v-if="task.thumbnail" :src="getYtMediaSrc(task.thumbnail)" style="width: 100%; height: 100%; object-fit: cover;" />
                  <div style="position: absolute; top: 4px; left: 4px; background: var(--accent-primary); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px;">
                    {{ task.resolution }}
                  </div>
                </div>

                <!-- Info & Progress Bar -->
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div class="yt-card-title" style="font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">
                      {{ task.title }}
                    </div>
                    <span style="font-size: 13px; font-weight: 700; color: var(--accent-primary);">
                      {{ (task.progress || 0).toFixed(1) }}%
                    </span>
                  </div>

                  <!-- Progress Track -->
                  <div class="yt-progress-track">
                    <div 
                      class="yt-progress-fill"
                      :class="{ error: task.error }"
                      :style="{
                        width: (task.progress || 0) + '%'
                      }"
                    ></div>
                  </div>

                  <!-- Details row (Status, Size, Speed, ETA) -->
                  <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap; gap: 8px;">
                    <span :style="{ color: task.error ? '#ef4444' : 'var(--text-secondary)', fontWeight: task.error ? '600' : 'normal' }">{{ task.status || (t.ytDlp?.hudDownloading || '下载中...') }}</span>
                    <div v-if="!task.error" style="display: flex; gap: 14px; color: var(--text-secondary); font-weight: 500;">
                      <span v-if="task.size">📦 {{ task.size }}</span>
                      <span v-if="task.speed">⚡ {{ task.speed }}</span>
                      <span v-if="task.eta">⏱️ {{ t.details?.remaining || '剩余' }} {{ task.eta }}</span>
                    </div>
                  </div>
                </div>

                <!-- Action: Cancel Button -->
                <div>
                  <button 
                    class="btn-danger-subtle" 
                    @click="cancelYtTask(task.id)"
                    :title="task.error ? (t.details?.deleteBtn || '移除记录') : (t.ytDlp?.cancelTask || '取消下载')"
                  >
                    {{ task.error ? (t.details?.deleteBtn ? '✕ ' + t.details.deleteBtn : '✕ 移除') : (t.ytDlp?.cancelTask ? '✕ ' + t.ytDlp.cancelTask : '✕ 取消') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: COMPLETED DOWNLOADS LIST -->
          <div v-else-if="ytSubTab === 'completed'" style="flex: 1; display: flex; flex-direction: column;">
            <!-- Empty State -->
            <div v-if="ytHistory.length === 0" class="yt-empty-container">
              <div class="yt-empty-icon">🎬</div>
              <div class="yt-empty-title">
                {{ t.ytDlp?.emptyCompleted || '暂无已完成的下载记录' }}
              </div>
              <p class="yt-empty-desc">
                {{ t.ytDlp?.emptyCompletedDesc || '下载完成后的视频会在此处生成海报卡片，点击即可在独立播放器窗口中播放。' }}
              </p>
              <button class="btn btn-primary" style="padding: 8px 22px; font-size: 13px; border-radius: 8px;" @click="ytSubTab = 'parse'">
                {{ t.ytDlp?.tabParse || '前往下载视频' }}
              </button>
            </div>

            <!-- Completed View: List or Grid with Categories (Time / Source) -->
            <div v-else style="flex: 1; display: flex; flex-direction: column; overflow-y: auto;">
              <!-- Category Sub-filter Pills Bar -->
              <div 
                v-if="currentCategoryPills.length > 1" 
                style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; flex-shrink: 0;"
              >
                <button
                  v-for="pill in currentCategoryPills"
                  :key="pill.key"
                  @click="setCategoryFilter(pill.key)"
                  style="border: 1px solid var(--glass-border); padding: 4px 12px; border-radius: 16px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s ease; white-space: nowrap;"
                  :style="isCategoryFilterActive(pill.key) 
                    ? 'background: var(--accent-primary); color: #fff; font-weight: 600; border-color: var(--accent-primary); box-shadow: 0 2px 8px rgba(99,102,241,0.3);' 
                    : 'background: var(--bg-tertiary); color: var(--text-secondary);'"
                >
                  <span v-if="pill.icon">{{ pill.icon }}</span>
                  <span>{{ pill.name }}</span>
                  <span 
                    style="font-size: 10px; padding: 1px 5px; border-radius: 8px; font-weight: 700;"
                    :style="isCategoryFilterActive(pill.key) ? 'background: rgba(255,255,255,0.25); color: #fff;' : 'background: rgba(255,255,255,0.08); color: var(--text-muted);'"
                  >
                    {{ pill.count }}
                  </span>
                </button>
              </div>

              <!-- Loop through category groups -->
              <div v-for="group in displayedCategoryGroups" :key="group.key" style="display: flex; flex-direction: column; margin-bottom: 16px;">
                <!-- Group Section Header -->
                <div 
                  v-if="displayedCategoryGroups.length > 1 || currentCategoryPills.length > 2"
                  style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; font-weight: 600; color: var(--text-secondary);"
                >
                  <span style="font-size: 14px;">{{ group.icon }}</span>
                  <span>{{ group.name }}</span>
                  <span style="font-size: 11px; padding: 1px 6px; border-radius: 10px; background: rgba(255,255,255,0.08); color: var(--text-muted);">{{ group.items.length }}</span>
                </div>

                <!-- 1. Grid View Mode (Default) -->
                <div 
                  v-if="ytViewMode === 'grid'" 
                  class="yt-grid-container"
                  style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 16px;"
                >
                  <div 
                    v-for="item in group.items" 
                    :key="item.id"
                    class="yt-card yt-grid-card"
                    style="padding: 0; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid var(--glass-border);"
                  >
                    <!-- 16:9 Cover Thumbnail Poster with Hover Play Overlay (No Source Badge) -->
                    <div 
                      @click="openYtFile(item.filePath)"
                      style="position: relative; width: 100%; aspect-ratio: 16 / 9; background: var(--bg-tertiary); cursor: pointer; overflow: hidden; display: flex; align-items: center; justify-content: center;"
                      :title="t.ytDlp?.playVideo || '点击播放视频'"
                    >
                      <img 
                        v-if="item.thumbnail" 
                        :src="getYtMediaSrc(item.thumbnail)" 
                        @error="onThumbnailError($event, item)" 
                        style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" 
                        class="yt-grid-thumb"
                      />
                      <span v-else style="font-size: 36px; color: var(--text-muted);">🎬</span>

                      <!-- Duration Badge (Bottom Right Corner) -->
                      <div v-if="item.duration" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); color: #fff; font-size: 11px; padding: 2px 7px; border-radius: 5px; font-weight: 600; z-index: 2;">
                        {{ formatDuration(item.duration) }}
                      </div>

                      <!-- Hover Play Button Overlay -->
                      <div class="yt-grid-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease;">
                        <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(99, 102, 241, 0.7); transform: scale(0.9); transition: transform 0.2s;">
                          <span style="font-size: 18px; color: #fff; margin-left: 3px;">▶</span>
                        </div>
                      </div>
                    </div>

                    <!-- Grid Card Body -->
                    <div style="padding: 12px 14px; display: flex; flex-direction: column; flex: 1; justify-content: space-between; gap: 8px;">
                      <div>
                        <!-- Title strictly 1 line -->
                        <div 
                          @click="openYtFile(item.filePath)"
                          class="yt-card-title"
                          style="font-size: 14px; font-weight: 600; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; margin-bottom: 6px;"
                          :title="item.title"
                        >
                          {{ item.title }}
                        </div>

                        <!-- Tags: Concise Resolution & Size -->
                        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                          <span 
                            style="padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 10px;"
                            :style="getResBadgeStyle(item.resolution)"
                          >
                            {{ formatSimpleResolution(item.resolution) }}
                          </span>
                          <span v-if="item.fileSize > 0" style="color: var(--text-secondary); font-size: 11px; font-weight: 500; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px;">
                            💾 {{ formatFileSize(item.fileSize) }}
                          </span>
                        </div>
                      </div>

                      <!-- Actions Bar: Sleek & Clean (No redundant play button) -->
                      <div style="display: flex; gap: 6px; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--glass-border);">
                        <div style="display: flex; gap: 6px; align-items: center; min-width: 0;">
                          <!-- Send to Mobile Button -->
                          <button 
                            v-if="syncStatus === 'connected'"
                            class="btn btn-secondary"
                            style="padding: 4px 9px; font-size: 11px; font-weight: 600; border-radius: 6px; display: flex; align-items: center; gap: 4px; border-color: rgba(16, 185, 129, 0.4); color: #10b981; background: rgba(16, 185, 129, 0.1);"
                            @click="sendYtVideoToPhone(item)"
                            :title="t.ytDlp?.sendToPhone || '通过 P2P 极速发送到手机相册'"
                          >
                            <span>📱</span>
                            <span>{{ t.ytDlp?.sendToPhone || '发至手机' }}</span>
                          </button>
                          <!-- Folder button -->
                          <button 
                            class="yt-action-icon-btn" 
                            style="padding: 4px 8px; font-size: 11px; display: flex; align-items: center; gap: 4px; height: auto;"
                            @click="openYtFolder(item.filePath)"
                            :title="t.ytDlp?.openFolder || '在文件夹中显示'"
                          >
                            <span>📁</span>
                            <span>{{ t.ytDlp?.openFolder || '目录' }}</span>
                          </button>
                        </div>

                        <!-- Delete button -->
                        <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                          <button 
                            class="yt-action-icon-btn danger" 
                            style="width: 28px; height: 28px; font-size: 11px; padding: 0; display: flex; align-items: center; justify-content: center;"
                            @click="deleteYtHistoryItem(item.id)"
                            :title="t.ytDlp?.deleteHistory || '删除记录'"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. List View Mode -->
                <div v-else style="display: flex; flex-direction: column; gap: 10px;">
                  <div 
                    v-for="item in group.items" 
                    :key="item.id"
                    class="yt-card"
                    style="padding: 12px 16px; display: flex; gap: 16px; align-items: center; border-radius: 12px;"
                  >
                    <!-- Cover Image Poster with Play Overlay -->
                    <div 
                      @click="openYtFile(item.filePath)"
                      style="position: relative; width: 130px; height: 74px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: var(--bg-tertiary); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid var(--glass-border);"
                      :title="t.ytDlp?.playVideo || '点击播放'"
                    >
                      <img 
                        v-if="item.thumbnail" 
                        :src="getYtMediaSrc(item.thumbnail)" 
                        @error="onThumbnailError($event, item)" 
                        style="width: 100%; height: 100%; object-fit: cover;" 
                      />
                      <span v-else style="font-size: 26px; color: var(--text-muted);">🎬</span>
                      <!-- Play Hover Mask Overlay -->
                      <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--accent-primary); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);">
                          <span style="font-size: 15px; color: #fff; margin-left: 2px;">▶</span>
                        </div>
                      </div>
                      <!-- Duration Pill in Corner -->
                      <div v-if="item.duration" style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 600;">
                        {{ formatDuration(item.duration) }}
                      </div>
                    </div>

                    <!-- Video Title & Meta (Cleaned up: No source badge, simplified res, no path, no time) -->
                    <div style="flex: 1; min-width: 0;">
                      <div 
                        @click="openYtFile(item.filePath)"
                        class="yt-card-title"
                        style="font-size: 15px; font-weight: 600; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; transition: color 0.15s;"
                        :title="item.title"
                      >
                        {{ item.title }}
                      </div>
                      <div style="display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap;">
                        <span 
                          style="padding: 2px 7px; border-radius: 5px; font-weight: 700; font-size: 11px;"
                          :style="getResBadgeStyle(item.resolution)"
                        >
                          {{ formatSimpleResolution(item.resolution) }}
                        </span>
                        <span v-if="item.fileSize > 0" style="color: var(--text-secondary); font-weight: 500; font-size: 11px;">💾 {{ formatFileSize(item.fileSize) }}</span>
                      </div>
                    </div>

                    <!-- Action Buttons (Thumbnail and Title are clickable to play) -->
                    <div style="display: flex; gap: 8px; flex-shrink: 0; align-items: center;">
                      <!-- Send to Mobile Button (Only when connected!) -->
                      <button 
                        v-if="syncStatus === 'connected'"
                        class="btn btn-secondary"
                        style="padding: 7px 13px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 5px; border-radius: 8px; border-color: rgba(16, 185, 129, 0.4); color: #10b981; background: rgba(16, 185, 129, 0.1);"
                        @click="sendYtVideoToPhone(item)"
                        :title="t.ytDlp?.sendToPhone || '通过 P2P 极速发送到手机相册'"
                      >
                        <span>📱 {{ t.ytDlp?.sendToPhone || '发送到手机' }}</span>
                      </button>
                      <button 
                        class="yt-action-icon-btn" 
                        @click="openYtFolder(item.filePath)"
                        :title="t.ytDlp?.openFolder || '在文件夹中显示'"
                      >
                        📁 {{ t.ytDlp?.openFolder || '目录' }}
                      </button>
                      <button 
                        class="yt-action-icon-btn danger" 
                        @click="deleteYtHistoryItem(item.id)"
                        :title="t.ytDlp?.deleteHistory || '删除记录'"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5.5 SIMILAR IMAGES TAB -->
        <div v-else-if="currentTab === 'similar'" style="width: 100%; box-sizing: border-box; text-align: left; position: relative;">
          <!-- Sticky Control Bar (不随滚动移出视野) -->
          <div class="similar-control-bar">
            
            <!-- Threshold Slider -->
            <div style="display: flex; align-items: center; gap: 16px;">
              <span class="similar-threshold-label">{{ t.similar?.similarityThreshold || '相似度阈值:' }}</span>
              <input 
                type="range" 
                min="70" 
                max="99" 
                v-model="similarityThreshold" 
                class="similar-slider"
              />
              <span class="similar-threshold-badge">
                {{ similarityThreshold }}%
              </span>
            </div>

            <!-- Action buttons -->
            <div style="display: flex; align-items: center; gap: 16px;">
              <button 
                class="btn btn-primary" 
                @click="analyzeSimilarImages" 
                :disabled="isAnalyzingSimilar"
                style="display: flex; align-items: center; gap: 8px; padding: 10px 20px; font-size: 13px; border-radius: 12px; font-weight: 700; cursor: pointer;"
              >
                <span v-if="isAnalyzingSimilar" class="spinner" style="width: 12px; height: 12px;"></span>
                <span v-else>🔍</span>
                {{ isAnalyzingSimilar ? `${t.similar?.analyzing || '分析中...'} (${similarAnalysisProgress.done}/${similarAnalysisProgress.total})` : (t.similar?.startAnalysis || '开始分析相似图片') }}
              </button>

              <button 
                v-if="similarGroups.length > 0"
                class="btn btn-danger" 
                @click="deleteSelectedDuplicates"
                :disabled="selectedDuplicateIds.size === 0 || isDeletingDuplicates"
                :style="{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: selectedDuplicateIds.size > 0 ? 'pointer' : 'not-allowed',
                  background: selectedDuplicateIds.size > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(239, 68, 68, 0.25)',
                  border: selectedDuplicateIds.size > 0 ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: selectedDuplicateIds.size > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: selectedDuplicateIds.size > 0 ? '0 4px 16px rgba(239, 68, 68, 0.45)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: selectedDuplicateIds.size > 0 ? 'scale(1.02)' : 'scale(1)'
                }"
              >
                <span>🗑️</span>
                {{ isDeletingDuplicates ? (t.similar?.deleting || '删除中...') : (t.similar?.deleteDuplicates ? t.similar.deleteDuplicates.replace('{count}', selectedDuplicateIds.size) : `删除选中的重复图 (${selectedDuplicateIds.size})`) }}
              </button>
            </div>
          </div>

          <!-- Floating Bottom Sticky Action Bar (有选中时悬浮吸底快速删除) -->
          <transition name="modal-fade">
            <div 
              v-if="selectedDuplicateIds.size > 0" 
              class="similar-floating-bar"
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🖼️</span>
                <span style="font-size: 13px; font-weight: 700;">{{ t.similar?.selectedCount ? t.similar.selectedCount.replace('{count}', selectedDuplicateIds.size) : `已选中 ${selectedDuplicateIds.size} 张重复图片` }}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button 
                  class="btn btn-secondary" 
                  @click="selectedDuplicateIds.clear(); selectedDuplicateIds = new Set();"
                  style="padding: 7px 16px; font-size: 12px; border-radius: 20px; font-weight: 600; cursor: pointer;"
                >
                  {{ t.similar?.deselectAll || '取消选择' }}
                </button>
                <button 
                  class="btn btn-danger" 
                  @click="deleteSelectedDuplicates"
                  :disabled="isDeletingDuplicates"
                  style="display: flex; align-items: center; gap: 6px; padding: 8px 22px; font-size: 13px; border-radius: 20px; font-weight: 700; background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); cursor: pointer;"
                >
                  <span>🗑️</span>
                  <span>{{ isDeletingDuplicates ? (t.similar?.deleting || '删除中...') : (t.similar?.deleteNow ? t.similar.deleteNow.replace('{count}', selectedDuplicateIds.size) : `立即删除 (${selectedDuplicateIds.size})`) }}</span>
                </button>
              </div>
            </div>
          </transition>

          <!-- Sci-Fi Cyber AI Transparent Modal with Backdrop Mask for Analysis -->
          <transition name="modal-fade">
            <div 
              v-if="isAnalyzingSimilar" 
              style="position: fixed; inset: 0; z-index: 999; display: flex; align-items: center; justify-content: center; background: rgba(8, 12, 24, 0.75); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);"
            >
              <div 
                style="width: 480px; max-width: 90vw; background: linear-gradient(145deg, rgba(26, 32, 54, 0.85) 0%, rgba(13, 17, 34, 0.95) 100%); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 24px; padding: 36px 30px; box-shadow: 0 28px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(168, 85, 247, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.2); display: flex; flex-direction: column; align-items: center; gap: 22px; position: relative; overflow: hidden; animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);"
              >
                <!-- Glowing Ambient Light in Background -->
                <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 220px; height: 120px; background: radial-gradient(ellipse, rgba(168, 85, 247, 0.35), transparent 70%); pointer-events: none; filter: blur(20px);"></div>

                <!-- Sci-Fi Orbital Spinner & Radar Pulse -->
                <div style="position: relative; width: 76px; height: 76px; display: flex; align-items: center; justify-content: center; margin-top: 4px;">
                  <!-- Outer dashed spinning ring -->
                  <div style="position: absolute; inset: 0; border: 2px dashed rgba(168, 85, 247, 0.55); border-radius: 50%; animation: spin 10s linear infinite;"></div>
                  <!-- Inner counter-spinning gradient glow ring -->
                  <div style="position: absolute; inset: 6px; border: 2.5px solid transparent; border-top-color: #38bdf8; border-bottom-color: #c084fc; border-radius: 50%; animation: spin 2s linear infinite reverse; box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);"></div>
                  <!-- Core AI Pulse Icon -->
                  <span style="font-size: 26px; filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.85)); animation: pulse-glow 2s infinite ease-in-out;">🧠</span>
                </div>

                <!-- Modal Title & Subtitle -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;">
                  <span style="font-size: 10px; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.25); padding: 3px 12px; border-radius: 99px; letter-spacing: 1.2px; text-transform: uppercase;">
                    MobileCLIP · {{ t.similar?.aiClusterEngine || 'AI 聚类引擎' }}
                  </span>
                  <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0 0 0; background: linear-gradient(135deg, #ffffff 30%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    {{ t.similar?.comparingAndClustering || '正在进行图像特征比对与聚类' }}
                  </h3>
                </div>

                <!-- Futuristic Progress Bar Track -->
                <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
                  <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.06); border-radius: 99px; overflow: hidden; position: relative; border: 1px solid rgba(255, 255, 255, 0.08);">
                    <div 
                      style="height: 100%; background: linear-gradient(90deg, #a855f7, #38bdf8); border-radius: 99px; transition: width 0.3s ease; box-shadow: 0 0 14px rgba(56, 189, 248, 0.6);"
                      :style="{ width: (similarAnalysisProgress.total > 0 ? Math.round((similarAnalysisProgress.done / similarAnalysisProgress.total) * 100) : 5) + '%' }"
                    ></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600; padding: 0 2px;">
                    <span>{{ t.similar?.cosineMetric || '512-D 向量空间余弦计算' }}</span>
                    <span style="color: #38bdf8; font-weight: 700;">
                      {{ similarAnalysisProgress.total > 0 ? Math.round((similarAnalysisProgress.done / similarAnalysisProgress.total) * 100) : 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Current Processing Target Pill -->
                <div style="width: 100%; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; box-sizing: border-box; overflow: hidden;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; flex-shrink: 0; animation: pulse-glow 1.5s infinite;"></span>
                  <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                    {{ similarAnalysisProgress.currentName ? `${t.similar?.processing || '处理中:'} ${similarAnalysisProgress.currentName}` : (t.similar?.preparingPool || '正在准备多核特征聚类池...') }}
                  </span>
                </div>

                <!-- Real-time Sci-Fi Stats Grid -->
                <div style="width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                  <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); padding: 10px 8px; border-radius: 12px;">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">{{ t.similar?.comparedCount || '已比对' }}</span>
                    <span style="font-size: 14px; font-weight: 800; color: #38bdf8; margin-top: 3px;">
                      {{ similarAnalysisProgress.done }} <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">/ {{ similarAnalysisProgress.total }}</span>
                    </span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); padding: 10px 8px; border-radius: 12px;">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">{{ t.link?.elapsedTime || '已用时间' }}</span>
                    <span style="font-size: 14px; font-weight: 800; color: #f8fafc; margin-top: 3px;">
                      {{ similarElapsedTime }}
                    </span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); padding: 10px 8px; border-radius: 12px;">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">{{ t.link?.estRemaining || '预估剩余' }}</span>
                    <span style="font-size: 14px; font-weight: 800; color: #c084fc; margin-top: 3px;">
                      {{ similarRemainingTime }}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </transition>

          <!-- Empty State / No Analysis Done -->
          <div v-if="similarGroups.length === 0" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; background: rgba(255,255,255,0.015); border: 1px solid var(--glass-border); border-radius: 20px; gap: 16px;">
            <span style="font-size: 64px; filter: drop-shadow(0 0 12px rgba(168,85,247,0.25));">🔍</span>
            <span style="font-size: 15px; color: var(--text-primary); font-weight: 700;">{{ t.similar?.emptyTitle || '未检测到相似图片分组' }}</span>
            <span style="font-size: 12px; color: var(--text-muted); max-width: 380px; text-align: center; line-height: 1.6;">
              {{ t.similar?.emptyDesc || '请确保已导入本地文件夹或已同步手机图片，点击上方按钮对所有图片进行一键多路关联比对。' }}
            </span>
          </div>

          <!-- Grouped Results -->
          <div v-else style="display: flex; flex-direction: column; gap: 20px;">
            <div 
              v-for="(group, gIdx) in similarGroups" 
              :key="gIdx" 
              style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box;"
            >
              <!-- Group Header -->
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); background: rgba(255,255,255,0.04); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 6px;">
                  📁 {{ t.similar?.groupTitle ? t.similar.groupTitle.replace('{index}', gIdx + 1) : `相似分组 #${gIdx + 1}` }}
                  <span style="font-size: 11px; color: #a855f7; font-weight: 600;">{{ t.similar?.photosCount ? t.similar.photosCount.replace('{count}', group.images.length) : `(包含 ${group.images.length} 张图片)` }}</span>
                </span>
                
                <!-- Quick Selection Action -->
                <div style="display: flex; align-items: center; gap: 12px;">
                  <button 
                    @click="selectGroupDuplicatesExceptOne(group)" 
                    style="background: transparent; border: 1px solid rgba(168,85,247,0.3); color: #c084fc; border-radius: 8px; padding: 4px 10px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-weight: 600;"
                    onmouseover="this.style.background='rgba(168,85,247,0.1)'"
                    onmouseout="this.style.background='transparent'"
                  >
                    {{ t.similar?.keepOneAutoSelect || '保留一张（自动选中其余图）' }}
                  </button>
                  <button 
                    @click="deselectGroupAll(group)" 
                    style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); border-radius: 8px; padding: 4px 10px; font-size: 12px; cursor: pointer; transition: all 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                    onmouseout="this.style.background='transparent'"
                  >
                    {{ t.similar?.deselectAll || '取消选择' }}
                  </button>
                </div>
              </div>

              <!-- Group Image Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; width: 100%;">
                <div 
                  v-for="img in group.images" 
                  :key="img.id || img.path" 
                  style="border-radius: 12px; border: 1px solid var(--glass-border); padding: 12px; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; transition: all 0.2s; position: relative;"
                  :style="{ background: selectedDuplicateIds.has(img.id || img.path) ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.015)', borderColor: selectedDuplicateIds.has(img.id || img.path) ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)' }"
                >
                  <!-- Checkbox Selection Overlay -->
                  <div style="position: absolute; top: 12px; left: 12px; z-index: 5;">
                    <input 
                      type="checkbox" 
                      :checked="selectedDuplicateIds.has(img.id || img.path)"
                      @change="toggleDuplicateSelection(img.id || img.path)"
                      style="width: 18px; height: 18px; cursor: pointer; accent-color: #ef4444;"
                    />
                  </div>

                  <!-- Image Preview -->
                  <div style="width: 100%; height: 140px; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.2); position: relative; border: 1px solid rgba(255,255,255,0.03);">
                    <img 
                      :src="img.src" 
                      style="width: 100%; height: 100%; object-fit: contain; cursor: pointer;"
                      @click="openDetails(img, group.images)" 
                    />
                    <!-- Max similarity marker within group -->
                    <span 
                      v-if="img.maxSimWithGroup !== undefined" 
                      style="position: absolute; bottom: 8px; right: 8px; font-size: 10px; font-weight: 700; color: white; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; backdrop-filter: blur(4px);"
                    >
                      {{ t.similar?.similarity || '相似度: ' }}{{ (img.maxSimWithGroup * 100).toFixed(1) }}%
                    </span>
                  </div>

                  <!-- Image Details -->
                  <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" :title="img.name">
                      {{ img.name }}
                    </span>
                    <span style="font-size: 10px; color: var(--text-muted); display: flex; justify-content: space-between;">
                      <span>{{ t.similar?.imageSize || '大小: ' }}{{ formatBytes(img.size || 0) }}</span>
                      <span v-if="img.predictions && img.predictions[0]" style="color: #a855f7;">
                        {{ getShortCategory(img.predictions[0].category) }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5.6 FOOTPRINT MAP TAB -->
        <div v-else-if="currentTab === 'map'" style="width: 100%; display: flex; flex-direction: column; height: 100%; flex: 1; min-height: 0; text-align: left;">
          <h2 style="font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0; background: linear-gradient(135deg, #ffffff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            {{ t.map?.title || t.sidebar?.tabMap || '🗺️ 足迹地图' }}
          </h2>
          <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 16px 0;">
            {{ t.map?.subtitle || '根据照片拍摄地理位置（GPS EXIF 数据）在地图上聚类呈现您的足迹，点击图片可查看原图。' }}
          </p>

          <div style="flex: 1; min-height: 400px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--glass-border); border-radius: 16px; overflow: hidden; position: relative;">
            <div id="map-container" style="width: 100%; height: 100%; z-index: 1;"></div>
            
            <!-- Fallback banner if Leaflet is not loaded or offline -->
            <div v-if="mapLoadError" style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; z-index: 10; padding: 24px; text-align: center;">
              <span style="font-size: 48px;">🌐</span>
              <h3 style="color: var(--text-primary); margin: 0; font-size: 16px;">{{ t.map?.mapLoadError || '地图加载失败，请检查网络连接' }}</h3>
              <p style="color: var(--text-secondary); margin: 0; font-size: 12px; max-width: 320px; line-height: 1.6;">
                {{ t.map?.mapLoadErrorDesc || '足迹地图需要加载在线地图服务瓦片及脚本资源。请确保您的电脑处于联网状态。' }}
              </p>
            </div>
            
            <!-- Empty state if no images have GPS -->
            <div v-if="!mapLoadError && imagesWithGps.length === 0" style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; z-index: 5; padding: 24px; text-align: center;">
              <span style="font-size: 48px;">🗺️</span>
              <h3 style="color: var(--text-primary); margin: 0; font-size: 16px;">{{ t.map?.emptyMap || '暂无地理位置数据' }}</h3>
              <p style="color: var(--text-secondary); margin: 0; font-size: 12px; max-width: 320px; line-height: 1.6;">
                {{ t.map?.emptyMapDesc || '当前加载的照片中没有包含 GPS 地理坐标的图片。请尝试同步包含 GPS 信息的手机照片或导入包含相机地理信息的原图文件夹。' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 6. SETTINGS TAB -->
        <div v-else-if="currentTab === 'settings'" class="settings-tab-wrapper">
          <div class="settings-container">
            <h2 class="settings-title">{{ t.settings.title }}</h2>
            <p class="settings-subtitle">{{ t.settings.subtitle }}</p>
            
            <div class="settings-grid">
              <!-- Card: Language Settings -->
              <div class="settings-card">
                <div class="settings-card-header">
                  <span class="settings-card-icon">🌐</span>
                  <div>
                    <h3 class="settings-card-title">{{ t.settings.languageTitle }}</h3>
                    <p class="settings-card-desc">{{ t.settings.languageDesc }}</p>
                  </div>
                </div>
                <div class="settings-card-body">
                  <select v-model="currentLocale" class="settings-select">
                    <option v-for="(name, code) in languages" :key="code" :value="code">
                      {{ name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Card: Theme Settings -->
              <div class="settings-card">
                <div class="settings-card-header">
                  <span class="settings-card-icon">{{ isDarkMode ? '🌙' : '☀️' }}</span>
                  <div>
                    <h3 class="settings-card-title">{{ t.settings.themeTitle }}</h3>
                    <p class="settings-card-desc">{{ t.settings.themeDesc }}</p>
                  </div>
                </div>
                <div class="settings-card-body theme-options-grid">
                  <div 
                    class="theme-option-card" 
                    :class="{ active: isDarkMode }"
                    @click="isDarkMode = true"
                  >
                    <div class="theme-option-preview dark-preview">
                      <div class="preview-bubble incoming"></div>
                      <div class="preview-bubble outgoing"></div>
                    </div>
                    <span class="theme-option-label">{{ t.settings.themeDark }}</span>
                  </div>
                  
                  <div 
                    class="theme-option-card" 
                    :class="{ active: !isDarkMode }"
                    @click="isDarkMode = false"
                  >
                    <div class="theme-option-preview light-preview">
                      <div class="preview-bubble incoming"></div>
                      <div class="preview-bubble outgoing"></div>
                    </div>
                    <span class="theme-option-label">{{ t.settings.themeLight }}</span>
                  </div>
                </div>
              </div>

              <!-- Card: Download Save Path -->
              <div class="settings-card full-width">
                <div class="settings-card-header">
                  <span class="settings-card-icon">📁</span>
                  <div>
                    <h3 class="settings-card-title">{{ t.settings.downloadPathTitle }}</h3>
                    <p class="settings-card-desc">{{ t.settings.downloadPathDesc }}</p>
                  </div>
                </div>
                <div class="settings-card-body">
                  <div class="download-path-row">
                    <div class="download-path-display" :title="downloadPath || t.settings.downloadPathDefault">
                      <span class="download-path-icon">📂</span>
                      <span class="download-path-text">{{ downloadPath || t.settings.downloadPathDefault }}</span>
                    </div>
                    <div class="download-path-actions">
                      <button class="dp-btn dp-browse" @click="browseDownloadFolder">{{ t.settings.downloadPathBrowse }}</button>
                      <button class="dp-btn dp-open" @click="openDownloadFolder" :disabled="!downloadPath">{{ t.settings.downloadPathOpen }}</button>
                      <button class="dp-btn dp-reset" @click="resetDownloadPath" :disabled="!downloadPath">{{ t.settings.downloadPathReset }}</button>
                    </div>
                  </div>
                  <div class="download-path-saved" v-if="downloadPathSaved">
                    <span>{{ t.settings.downloadPathSaved }}</span>
                  </div>
                </div>
              </div>

              <!-- Card: Prevent System Sleep -->
              <div class="settings-card full-width">
                <div class="settings-card-header">
                  <span class="settings-card-icon">⚡</span>
                  <div>
                    <h3 class="settings-card-title">{{ t.settings.preventSleepTitle || '运行期间阻止系统休眠' }}</h3>
                    <p class="settings-card-desc">{{ t.settings.preventSleepDesc || '当 ShareCLIP 处于打开运行状态时，阻止计算机进入睡眠/挂起，保障 P2P 传输、后台下载和 AI 计算不中断（屏幕仍可按系统设定正常关闭）。' }}</p>
                  </div>
                </div>
                <div class="settings-card-body">
                  <div class="download-path-row">
                    <div class="download-path-display" style="cursor: pointer;" @click="togglePreventSleep">
                      <span class="download-path-icon">{{ preventSleep ? '🟢' : '⚪' }}</span>
                      <span class="download-path-text" :style="{ color: preventSleep ? '#10b981' : 'inherit', fontWeight: preventSleep ? '600' : 'normal' }">
                        {{ preventSleep ? (t.settings.preventSleepEnabled || '已启用（软件运行期间 PC 保持唤醒）') : (t.settings.preventSleepDisabled || '已停用（遵循系统默认睡眠设定）') }}
                      </span>
                    </div>
                    <div class="download-path-actions">
                      <button 
                        class="dp-btn" 
                        :class="preventSleep ? 'dp-reset' : 'dp-browse'"
                        @click="togglePreventSleep"
                      >
                        {{ preventSleep ? (t.settings.preventSleepBtnDisable || '允许系统休眠') : (t.settings.preventSleepBtnEnable || '开启休眠阻止') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card: App Updates -->
              <div class="settings-card full-width">
                <div class="settings-card-header">
                  <span class="settings-card-icon">🔄</span>
                  <div>
                    <h3 class="settings-card-title">{{ t.settings.updateCheckTitle }}</h3>
                    <p class="settings-card-desc">{{ t.settings.updateCheckDesc }}</p>
                  </div>
                </div>
                <div class="settings-card-body">
                  <div class="update-check-row">
                    <div class="update-check-actions">
                      <button class="dp-btn dp-browse" :disabled="updateStatus === 'checking' || updateDownloading" @click="() => checkAppUpdates(true)">
                        <span v-if="updateStatus === 'checking'">⏳ {{ t.settings.updateChecking }}</span>
                        <span v-else>{{ t.settings.updateBtnCheck }}</span>
                      </button>
                      <button
                        v-if="updateStatus === 'new-available' && updateDownloadUrl && !updateDownloading && !updateReadyToInstall"
                        class="dp-btn dp-browse"
                        style="background: linear-gradient(135deg, #10b981, #059669); margin-left: 10px;"
                        @click="startDownloadUpdate"
                      >
                        {{ t.update?.downloadUpdateBtn || '⬇️ 立即下载更新' }}
                      </button>
                      <button
                        v-if="updateReadyToInstall"
                        class="dp-btn dp-browse"
                        style="background: linear-gradient(135deg, #f59e0b, #d97706); margin-left: 10px;"
                        :disabled="isRestartingForUpdate"
                        @click="installUpdate"
                      >
                        <span v-if="isRestartingForUpdate">⏳ {{ t.update?.restarting || '正在准备安装并重启...' }}</span>
                        <span v-else>{{ t.update?.installAndRestartBtn || '🚀 立即安装并重启' }}</span>
                      </button>
                    </div>

                    <!-- Download progress bar -->
                    <div class="update-download-progress" v-if="updateDownloading" style="margin-top: 10px; width: 100%;">
                      <div class="progress-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px;">
                        <span v-if="updateType === 'differential'" style="color: #c084fc; font-weight: 600;">
                          {{ t.update?.downloadingDiff ? t.update.downloadingDiff.replace('{transferred}', updateTransferredMB).replace('{total}', updateTotalMB) : `⚡ 正在下载差分增量补丁包 (已下载 ${updateTransferredMB} MB / ${updateTotalMB} MB)` }}
                        </span>
                        <span v-else style="color: #38bdf8; font-weight: 600;">
                          {{ t.update?.downloadingFull ? t.update.downloadingFull.replace('{transferred}', updateTransferredMB).replace('{total}', updateTotalMB) : `📦 正在下载全量安装包 (已下载 ${updateTransferredMB} MB / ${updateTotalMB} MB)` }}
                        </span>
                        <span style="font-weight: 700; color: var(--text-primary);">{{ updateDownloadProgress }}%</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill" :style="{ width: updateDownloadProgress + '%' }"></div>
                      </div>
                    </div>

                    <!-- Ready to install badge -->
                    <div class="update-result-msg" v-if="updateReadyToInstall">
                      <div class="update-badge-container new-available">
                        <span class="update-badge-icon">✅</span>
                        <span class="update-badge-text">{{ t.update?.readyToInstallBadge || '新版本已下载完成，点击右侧按钮安装。' }}</span>
                      </div>
                    </div>

                    <div class="update-result-msg" v-else-if="updateStatus !== 'idle' && updateStatus !== 'checking' && !updateDownloading">
                      <div class="update-badge-container" :class="updateStatus">
                        <span class="update-badge-icon" v-if="updateStatus === 'up-to-date'">✅</span>
                        <span class="update-badge-icon" v-else-if="updateStatus === 'new-available'">🎉</span>
                        <span class="update-badge-icon" v-else-if="updateStatus === 'failed'">⚠️</span>
                        
                        <span class="update-badge-text" v-if="updateStatus === 'up-to-date'">
                          {{ t.settings.updateUpToDate.replace('{version}', currentVersion) }}
                        </span>
                        <span class="update-badge-text cursor-pointer hover-underline font-semibold" v-else-if="updateStatus === 'new-available'">
                          {{ t.settings.updateNewAvailable.replace('{version}', latestVersion) }}
                        </span>
                        <span class="update-badge-text error" v-else-if="updateStatus === 'failed'">
                          {{ t.settings.updateFailed.replace('{error}', updateError) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card: System Information -->
              <div class="settings-card full-width" @vue:mounted="fetchSystemInfo">
                <div class="settings-card-header">
                  <span class="settings-card-icon">🖥️</span>
                  <div>
                    <h3 class="settings-card-title">{{ t.settings.sysInfoTitle || '系统环境信息' }}</h3>
                    <p class="settings-card-desc">{{ t.settings.sysInfoDesc || '当前运行环境的硬件与软件配置，可用于排查兼容性问题。' }}</p>
                  </div>
                </div>
                <div class="settings-card-body">
                  <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
                    <button class="dp-btn dp-browse" :disabled="systemInfoLoading" @click="fetchSystemInfo">
                      <span v-if="systemInfoLoading">⏳ {{ t.settings.sysInfoRefreshing || '读取中...' }}</span>
                      <span v-else>🔄 {{ t.settings.sysInfoRefresh || '刷新信息' }}</span>
                    </button>
                  </div>

                  <div v-if="!systemInfo && !systemInfoLoading" style="color:var(--text-muted); font-size:13px;">
                    {{ t.settings.sysInfoNotLoaded || '点击"刷新信息"加载系统信息' }}
                  </div>

                  <div v-else-if="systemInfo && !systemInfo.ok" style="color:#f87171; font-size:13px;">
                    ⚠️ {{ systemInfo.error }}
                  </div>

                  <div v-else-if="systemInfo && systemInfo.ok" class="sysinfo-grid">
                    <!-- OS / Hardware -->
                    <div class="sysinfo-section">
                      <div class="sysinfo-section-title">{{ t.settings.sysInfoHardware || '硬件 & 操作系统' }}</div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoOs || '操作系统' }}</span>
                        <span class="sysinfo-val">{{ systemInfo.system.os }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoOsRaw || '内核版本' }}</span>
                        <span class="sysinfo-val mono">{{ systemInfo.system.osRaw }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoArch || '架构' }}</span>
                        <span class="sysinfo-val mono">{{ systemInfo.system.arch }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoCpu || 'CPU' }}</span>
                        <span class="sysinfo-val" style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" :title="systemInfo.system.cpu">{{ systemInfo.system.cpu }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoCpuCores || '逻辑核心' }}</span>
                        <span class="sysinfo-val mono">{{ systemInfo.system.cpuCores }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoMem || '内存' }}</span>
                        <span class="sysinfo-val mono">{{ systemInfo.system.freeMemGB }} GB 可用 / {{ systemInfo.system.totalMemGB }} GB 总计</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoHostname || '主机名' }}</span>
                        <span class="sysinfo-val mono">{{ systemInfo.system.hostname }}</span>
                      </div>
                    </div>

                    <!-- Runtime Versions -->
                    <div class="sysinfo-section">
                      <div class="sysinfo-section-title">{{ t.settings.sysInfoRuntime || '运行时版本' }}</div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoAppVer || '应用版本' }}</span>
                        <span class="sysinfo-val mono">v{{ systemInfo.runtime.appVersion }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">Electron</span>
                        <span class="sysinfo-val mono">{{ systemInfo.runtime.electron }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">Node.js</span>
                        <span class="sysinfo-val mono">{{ systemInfo.runtime.node }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">Chromium</span>
                        <span class="sysinfo-val mono">{{ systemInfo.runtime.chrome }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">V8</span>
                        <span class="sysinfo-val mono">{{ systemInfo.runtime.v8 }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoUserData || '数据目录' }}</span>
                        <span class="sysinfo-val mono" style="font-size:11px; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" :title="systemInfo.runtime.userData">{{ systemInfo.runtime.userData }}</span>
                      </div>
                    </div>

                    <!-- AI Engine -->
                    <div class="sysinfo-section">
                      <div class="sysinfo-section-title">{{ t.settings.sysInfoAi || 'AI 引擎状态' }}</div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoAiStatus || 'AI 可用性' }}</span>
                        <span class="sysinfo-val">
                          <span v-if="systemInfo.ai.available" style="color:#34d399; font-weight:600;">✅ {{ t.settings.sysInfoAiOk || '正常' }}</span>
                          <span v-else style="color:#f87171; font-weight:600;">❌ {{ t.settings.sysInfoAiFail || '不可用 (初始化失败)' }}</span>
                        </span>
                      </div>
                      <div class="sysinfo-row" v-if="!systemInfo.ai.available && systemInfo.ai.initError">
                        <span class="sysinfo-key" style="color:#f87171;">{{ t.settings.sysInfoAiError || '失败原因' }}</span>
                        <span class="sysinfo-val" style="color:#f87171; font-size:11px; word-break:break-all;" :title="systemInfo.ai.initError">{{ systemInfo.ai.initError }}</span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoAiTier || '硬件档位' }}</span>
                        <span class="sysinfo-val mono">
                          <span v-if="systemInfo.ai.tier === 'High'" style="color:#a78bfa;">{{ systemInfo.ai.tier }} 🚀</span>
                          <span v-else-if="systemInfo.ai.tier === 'Mid'" style="color:#38bdf8;">{{ systemInfo.ai.tier }} ⚡</span>
                          <span v-else>{{ systemInfo.ai.tier }}</span>
                        </span>
                      </div>
                      <div class="sysinfo-row">
                        <span class="sysinfo-key">{{ t.settings.sysInfoAiWorkers || 'AI Workers' }}</span>
                        <span class="sysinfo-val mono">{{ systemInfo.ai.maxWorkers }} × {{ systemInfo.ai.intraThreads }} 线程</span>
                      </div>
                      <template v-if="systemInfo.ai.redistExists !== null">
                        <div class="sysinfo-row">
                          <span class="sysinfo-key">{{ t.settings.sysInfoDll || 'MSVC Redist DLL' }}</span>
                          <span class="sysinfo-val">
                            <span v-if="systemInfo.ai.redistExists" style="color:#34d399;">✅ {{ t.settings.sysInfoDllFound || '已就绪' }}</span>
                            <span v-else style="color:#f87171;">⚠️ {{ t.settings.sysInfoDllMissing || '目录缺失' }}</span>
                          </span>
                        </div>
                        <div class="sysinfo-row">
                          <span class="sysinfo-key">{{ t.settings.sysInfoOrtDll || 'ONNX Runtime DLL' }}</span>
                          <span class="sysinfo-val">
                            <span v-if="systemInfo.ai.ortDllFound" style="color:#34d399;">✅ {{ t.settings.sysInfoDllFound || '已就绪' }}</span>
                            <span v-else style="color:#f59e0b;">⚠️ {{ t.settings.sysInfoOrtDllMissing || '目录未找到' }}</span>
                          </span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card: About / App Info -->
              <div class="settings-card full-width">
                <div class="settings-card-header">
                  <span class="settings-card-icon">ℹ️</span>
                  <div>
                    <h3 class="settings-card-title">{{ t.settings.aboutTitle }}</h3>
                    <p class="settings-card-desc">ShareCLIP v{{ currentVersion || '1.2.0' }}</p>
                  </div>
                </div>
                <div class="settings-card-body about-info">
                  <p>{{ t.sidebar.archDesc }}</p>
                  <div class="info-badges">
                    <span class="info-badge">Electron 30</span>
                    <span class="info-badge">Vue 3</span>
                    <span class="info-badge">Vite 8</span>
                    <span class="info-badge">ONNX Runtime Node</span>
                  </div>
                  <div style="margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="dp-btn dp-open" @click="openLogFolder">
                      {{ t.update?.openLogsBtn || '📄 打开本地运行日志 (Open Logs)' }}
                    </button>
                    <button 
                      class="dp-btn" 
                      style="background: rgba(244, 63, 94, 0.16); border: 1px solid rgba(244, 63, 94, 0.35); color: #fda4af;"
                      @click="window.open('https://github.com/sponsors/NovaMindLab', '_blank')"
                      title="Sponsor on GitHub"
                    >
                      {{ t.update?.sponsorBtn || '💖 赞助项目 (Sponsor)' }}
                    </button>
                    <button 
                      class="dp-btn" 
                      style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc;"
                      @click="window.open('https://github.com/NovaMindLab/AIShare-Grabber', '_blank')"
                      title="Star on GitHub"
                    >
                      ⭐ Star on GitHub
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>


    <!-- Update Confirmation Modal -->
    <transition name="modal-fade">
    <div class="modal-backdrop" v-if="showUpdateConfirmModal" @click.self="showUpdateConfirmModal = false">
      <div class="update-card">
        <button class="update-card-close" @click="showUpdateConfirmModal = false">&#x2715;</button>
        <div class="update-card-header">
          <div class="update-card-icon-wrap">
            <span class="update-card-icon">&#x1F680;</span>
          </div>
          <div>
            <div class="update-card-title">{{ t.update?.foundNewVersion || '发现新版本' }}</div>
            <div class="update-card-subtitle">v{{ currentVersion }} &#x2192; <span class="update-new-ver">v{{ latestVersion }}</span></div>
          </div>
        </div>
        <div class="update-diff-badge">
          <span class="update-diff-icon">&#x26A1;</span>
          <div>
            <div class="update-diff-title">{{ t.update?.diffTitle || '智能差分增量升级' }}</div>
            <div class="update-diff-desc">{{ t.update?.diffDesc || '仅下载变动的数据块，节省 90%+ 流量' }}</div>
          </div>
        </div>
        <div class="update-notes" v-if="displayUpdateNotes">
          <div class="update-notes-label">{{ t.update?.notesLabel || '更新说明' }}</div>
          <pre class="update-notes-text">{{ displayUpdateNotes }}</pre>
        </div>
        <div class="update-card-actions">
          <button class="update-btn-cancel" @click="showUpdateConfirmModal = false">{{ t.update?.later || '稍后再说' }}</button>
          <button class="update-btn-confirm" @click="confirmAndStartUpdate">{{ t.update?.upgradeNow || '立即升级' }}</button>
        </div>
      </div>
    </div>
    </transition>

    <!-- Update Downloaded & Ready Modal -->
    <transition name="modal-fade">
    <div class="modal-backdrop" v-if="updateReadyToInstall && showUpdateCompleteModal" @click.self="!isRestartingForUpdate && (showUpdateCompleteModal = false)">
      <div class="update-card">
        <button class="update-card-close" :disabled="isRestartingForUpdate" @click="showUpdateCompleteModal = false">&#x2715;</button>
        <div class="update-card-header">
          <div class="update-card-icon-wrap success">
            <span class="update-card-icon">&#x2705;</span>
          </div>
          <div>
            <div class="update-card-title">{{ t.update?.downloadCompleted || '下载完成，准备升级' }}</div>
            <div class="update-card-subtitle">{{ t.update?.targetVersion || '目标版本' }} <span class="update-new-ver">v{{ latestVersion }}</span></div>
          </div>
        </div>
        <div class="update-ready-stats">
          <div class="update-stat-item">
            <span class="update-stat-label">{{ t.update?.upgradeType || '升级方式' }}</span>
            <span class="update-stat-val" :class="updateType === 'differential' ? 'diff' : ''">
              {{ updateType === 'differential' ? (t.update?.diffType || '差分增量') : (t.update?.fullType || '全量安装包') }}
            </span>
          </div>
          <div class="update-stat-item">
            <span class="update-stat-label">{{ t.update?.downloadSize || '下载大小' }}</span>
            <span class="update-stat-val">
              {{ updateTransferredMB }} MB
              <span v-if="updateType === 'differential'" class="update-saved-tag">{{ t.update?.savedBandwidth || '节省 90%+' }}</span>
            </span>
          </div>
        </div>
        <p class="update-restart-hint" style="color: #c084fc; font-weight: 600;" v-if="isRestartingForUpdate">
          {{ t.update?.restartingHint || '🚀 正在启动更新安装程序，即将显示安装进度...' }}
        </p>
        <p class="update-restart-hint" v-else>{{ t.update?.restartNotice || '重启后将弹出安装向导显示进度，完成后点击【完成】即可启动新版本，数据不会丢失。' }}</p>
        <div class="update-card-actions">
          <button class="update-btn-cancel" :disabled="isRestartingForUpdate" @click="showUpdateCompleteModal = false">{{ t.update?.later || '稍后重启' }}</button>
          <button class="update-btn-confirm" :disabled="isRestartingForUpdate" @click="installUpdate">
            <span v-if="isRestartingForUpdate">⏳ {{ t.update?.restarting || '正在准备安装并重启...' }}</span>
            <span v-else>{{ t.update?.restartNow || '立即重启并更新' }}</span>
          </button>
        </div>
      </div>
    </div>
    </transition>

    <!-- Toast Notification -->
    <transition name="toast-slide">
    <div class="app-toast" :class="toastType" v-if="toastVisible">
      <span class="toast-msg">{{ toastMessage }}</span>
      <button class="toast-close" @click="toastVisible = false">&#x2715;</button>
    </div>
    </transition>

    <!-- ==================== IMMERSIVE FULL-SCREEN LIGHTBOX GALLERY VIEWER ==================== -->
    <transition name="modal-fade">
      <div 
        class="lightbox-backdrop" 
        v-if="selectedImage" 
        @click.self="closeDetails"
        tabindex="0"
        style="position: fixed; inset: 0; z-index: 10000; display: flex; flex-direction: column; background: rgba(4, 7, 16, 0.96); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); user-select: none; outline: none;"
      >
        <!-- Top Floating Header -->
        <div style="height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px 0 24px; z-index: 30; background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%); border-bottom: 1px solid rgba(255,255,255,0.06);">
          <!-- Left: Title & High-Res Status Badge -->
          <div style="display: flex; align-items: center; gap: 14px; max-width: 50%; -webkit-app-region: no-drag;">
            <div style="display: flex; flex-direction: column; text-align: left; overflow: hidden;">
              <span style="font-size: 14px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="selectedImage.name">
                {{ selectedImage.name }}
              </span>
              <span v-if="selectedImage.path" style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.75;" :title="selectedImage.path">
                {{ selectedImage.path }}
              </span>
            </div>

            <!-- Quality Badge -->
            <div v-if="selectedItemType === 'image'" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
              <!-- Case A: Loading from phone -->
              <span 
                v-if="isFetchingHighRes" 
                style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); padding: 3px 10px; border-radius: 99px; animation: pulse-glow 1.5s infinite;"
              >
                <span class="spinner" style="width: 10px; height: 10px; border-color: #38bdf8; border-top-color: transparent;"></span>
                {{ t.lightbox?.fetchingUltra || '正在从手机拉取超清原图...' }}
              </span>

              <!-- Case B: 4K Original Photo Ready -->
              <span 
                v-else-if="isHighResLoaded || selectedImage.type === 'album_photo' || (selectedImage.name && selectedImage.name.startsWith('album_'))" 
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 10px; border-radius: 99px;"
              >
                <span>✨</span> {{ t.lightbox?.ultraHighRes || '超清原图' }}
              </span>

              <!-- Case C: Local file -->
              <span 
                v-else-if="!selectedImage.name || !selectedImage.name.startsWith('thumb_')" 
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #a855f7; background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.3); padding: 3px 10px; border-radius: 99px;"
              >
                <span>📁</span> {{ t.lightbox?.localImage || '本地图片' }}
              </span>

              <!-- Case D: Thumbnail only (Phone offline) -->
              <span 
                v-else 
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 3px 10px; border-radius: 99px;"
              >
                <span>⚡</span> {{ t.lightbox?.thumbnailPreview || '缩略图预览 (手机未连接)' }}
              </span>
            </div>
          </div>

          <!-- Middle: Window Drag Area -->
          <div style="flex: 1; height: 100%; -webkit-app-region: drag;"></div>

          <!-- Right: Counter, Lightbox Close & Window Controls -->
          <div style="display: flex; align-items: center; gap: 10px; -webkit-app-region: no-drag;">
            <span v-if="currentViewingList.length > 0" style="font-size: 12px; font-weight: 700; color: var(--text-secondary); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 3px 12px; border-radius: 99px;">
              {{ currentViewingIndex + 1 }} / {{ currentViewingList.length }}
            </span>
            
            <!-- Independent Window Play Button for Videos -->
            <button 
              v-if="selectedItemType === 'video'"
              @click="openVideoPlayer(selectedImage); closeDetails()" 
              :title="t.lightbox?.detachedPlay || '在独立窗口中播放此视频'"
              style="display: flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 99px; background: rgba(99, 102, 241, 0.16); border: 1px solid rgba(99, 102, 241, 0.35); color: #c7d2fe; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.background='rgba(99,102,241,0.32)'; this.style.borderColor='rgba(99,102,241,0.6)'; this.style.color='#fff'; this.style.transform='scale(1.04)';"
              onmouseout="this.style.background='rgba(99, 102, 241, 0.16)'; this.style.borderColor='rgba(99, 102, 241, 0.35)'; this.style.color='#c7d2fe'; this.style.transform='scale(1)';"
            >
              <span>🗗</span>
              <span>{{ t.lightbox?.detachedPlay || '独立窗口播放' }}</span>
            </button>

            <!-- Prominent Lightbox Close Button -->
            <button 
              @click="closeDetails" 
              :title="t.lightbox?.closeLightboxTitle || '退出大图浏览 (ESC)'"
              style="display: flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 99px; background: rgba(239, 68, 68, 0.16); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.background='rgba(239,68,68,0.32)'; this.style.borderColor='rgba(239,68,68,0.6)'; this.style.color='#fff'; this.style.transform='scale(1.04)';"
              onmouseout="this.style.background='rgba(239, 68, 68, 0.16)'; this.style.borderColor='rgba(239, 68, 68, 0.35)'; this.style.color='#fca5a5'; this.style.transform='scale(1)';"
            >
              <span style="font-size: 14px; font-weight: 900;">✕</span>
              <span>{{ t.lightbox?.closeLightbox || '关闭大图' }}</span>
              <span style="font-size: 10px; opacity: 0.75; font-family: monospace; background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 3px;">ESC</span>
            </button>

            <!-- Window Minimise/Maximize/Close (if desktop hasApi) -->
            <div v-if="hasApi" style="display: flex; align-items: center; margin-left: 6px; border-left: 1px solid rgba(255,255,255,0.12); padding-left: 6px;">
              <button class="title-bar-btn minimize" @click="minimizeWindow" :title="t.lightbox?.minimize || '最小化'" style="height: 30px; width: 34px; border-radius: 6px;">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10v1H0z" fill="currentColor"/></svg>
              </button>
              <button class="title-bar-btn maximize" @click="maximizeWindow" :title="t.lightbox?.maximize || '最大化/还原'" style="height: 30px; width: 34px; border-radius: 6px;">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/></svg>
              </button>
              <button class="title-bar-btn close" @click="closeWindow" :title="t.lightbox?.closeApp || '关闭软件'" style="height: 30px; width: 34px; border-radius: 6px;">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Center Viewport Area with Left & Right Nav Chevrons -->
        <div 
          ref="lightboxViewportRef"
          @wheel="handleLightboxWheel"
          @mousedown="handleLightboxMouseDown"
          style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 10px 80px; box-sizing: border-box;"
        >
          
          <!-- Previous Button (Left) -->
          <button 
            v-if="currentViewingList.length > 1"
            class="lightbox-nav-btn" 
            @click.stop="prevImage"
            :title="t.lightbox?.prev || '上一张 (← 键盘左键)'"
            style="position: absolute; left: 24px; top: 50%; transform: translateY(-50%); width: 52px; height: 52px; border-radius: 50%; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; font-size: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); z-index: 30; box-shadow: 0 8px 24px rgba(0,0,0,0.5);"
            onmouseover="this.style.background='rgba(168,85,247,0.3)'; this.style.borderColor='rgba(168,85,247,0.6)'; this.style.transform='translateY(-50%) scale(1.1)';"
            onmouseout="this.style.background='rgba(15, 23, 42, 0.7)'; this.style.borderColor='rgba(255, 255, 255, 0.15)'; this.style.transform='translateY(-50%) scale(1)';"
          >
            ‹
          </button>

          <!-- Main Image / Video / Audio Container with Directional Transition -->
          <div style="max-width: 100%; max-height: 100%; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
            <transition :name="`lightbox-slide-${lightboxDirection}`" mode="out-in">
              <div 
                :key="selectedImage.id || selectedImage.path || selectedImage.src" 
                style="display: flex; align-items: center; justify-content: center; max-width: 100%; max-height: 100%; will-change: transform, opacity;"
              >
                <img 
                  v-if="selectedItemType === 'image'" 
                  :src="selectedImage.src" 
                  :style="{
                    maxWidth: '85vw',
                    maxHeight: '74vh',
                    objectFit: 'contain',
                    borderRadius: '10px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.75)',
                    transform: `translate(${currentImageTranslateX}px, ${currentImageTranslateY}px) scale(${currentImageScale}) rotate(${currentImageRotation}deg)`,
                    transition: isDraggingImage ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)',
                    cursor: isDraggingImage ? 'grabbing' : (currentImageScale > 1 ? 'grab' : 'zoom-in'),
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }"
                  @dragstart.prevent
                  @dblclick="handleImageDoubleClick"
                />
                
                <video 
                  v-else-if="selectedItemType === 'video'" 
                  :src="selectedImage.src" 
                  controls 
                  autoplay 
                  @dblclick="openVideoPlayer(selectedImage)"
                  :title="t.lightbox?.doubleClickPlay || '双击在独立窗口中播放'"
                  style="max-width: 85vw; max-height: 74vh; object-fit: contain; border-radius: 10px; box-shadow: 0 24px 60px rgba(0,0,0,0.75); cursor: pointer;"
                ></video>
                
                <div v-else-if="selectedItemType === 'audio'" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; width: 100%; padding: 40px;">
                  <span style="font-size: 80px; animation: float 4s ease-in-out infinite;">🎵</span>
                  <span style="color: #fff; font-size: 16px; font-weight: 700;">{{ selectedImage.name }}</span>
                  <audio :src="selectedImage.src" controls autoplay style="width: 100%; max-width: 450px;"></audio>
                </div>
                
                <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; width: 100%; padding: 40px;">
                  <span style="font-size: 80px;">📄</span>
                  <span style="color: var(--text-secondary); font-size: 14px;">{{ selectedImage.name }}</span>
                </div>
              </div>
            </transition>
          </div>

          <!-- Next Button (Right) -->
          <button 
            v-if="currentViewingList.length > 1"
            class="lightbox-nav-btn" 
            @click.stop="nextImage"
            :title="t.lightbox?.next || '下一张 (→ 键盘右键)'"
            style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); width: 52px; height: 52px; border-radius: 50%; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; font-size: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); z-index: 30; box-shadow: 0 8px 24px rgba(0,0,0,0.5);"
            onmouseover="this.style.background='rgba(168,85,247,0.3)'; this.style.borderColor='rgba(168,85,247,0.6)'; this.style.transform='translateY(-50%) scale(1.1)';"
            onmouseout="this.style.background='rgba(15, 23, 42, 0.7)'; this.style.borderColor='rgba(255, 255, 255, 0.15)'; this.style.transform='translateY(-50%) scale(1)';"
          >
            ›
          </button>
        </div>

        <!-- Bottom Floating Thumbnails Filmstrip (When viewing multiple assets) -->
        <div 
          v-if="currentViewingList.length > 1" 
          ref="filmstripContainerRef"
          style="max-width: 85vw; margin: 0 auto 4px auto; display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 6px 14px; z-index: 20; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; scrollbar-width: none; -ms-overflow-style: none;"
        >
          <div
            v-for="(thumb, tIdx) in currentViewingList"
            :key="thumb.id || thumb.path || tIdx"
            :class="['filmstrip-thumb-item', tIdx === currentViewingIndex ? 'filmstrip-item-active' : '']"
            @click.stop="selectLightboxImageByIndex(tIdx)"
            :style="{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              borderRadius: '6px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: tIdx === currentViewingIndex ? '2px solid #a855f7' : '1.5px solid rgba(255,255,255,0.15)',
              opacity: tIdx === currentViewingIndex ? '1' : '0.45',
              transform: tIdx === currentViewingIndex ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
              boxShadow: tIdx === currentViewingIndex ? '0 0 14px rgba(168,85,247,0.6)' : 'none',
              background: '#1e293b'
            }"
            :title="thumb.name || (t.lightbox?.photoIndex ? t.lightbox.photoIndex.replace('{index}', tIdx + 1) : `第 ${tIdx + 1} 张`)"
          >
            <img 
              :src="thumb.src || thumb.url" 
              style="width: 100%; height: 100%; object-fit: cover;"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Bottom Floating Action Toolbar -->
        <div style="height: 56px; display: flex; align-items: center; justify-content: center; z-index: 20; background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%); margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 99px; padding: 5px 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
            <!-- Zoom In -->
            <button 
              @click="zoomIn" 
              class="btn-icon-subtle" 
              :title="t.lightbox?.zoomIn || '放大 (+)'"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              🔍+ {{ t.lightbox?.zoomIn || '放大' }}
            </button>
            <!-- Zoom Percentage Indicator / Click to reset -->
            <button 
              @click="resetImageView" 
              class="btn-icon-subtle" 
              :title="t.lightbox?.reset || '重置 1:1'"
              style="padding: 4px 8px; font-size: 11px; font-weight: 700; color: #c084fc; background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.3); cursor: pointer; border-radius: 6px; min-width: 46px;"
            >
              {{ Math.round(currentImageScale * 100) }}%
            </button>
            <!-- Zoom Out -->
            <button 
              @click="zoomOut" 
              class="btn-icon-subtle" 
              :title="t.lightbox?.zoomOut || '缩小 (-)'"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              🔍- {{ t.lightbox?.zoomOut || '缩小' }}
            </button>
            <!-- Reset 1:1 -->
            <button 
              @click="resetImageView" 
              class="btn-icon-subtle" 
              :title="t.lightbox?.reset || '重置'"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              ⟲ 1:1
            </button>
            <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.15); margin: 0 4px;"></div>
            <!-- Rotate -->
            <button 
              @click="currentImageRotation = (currentImageRotation + 90) % 360" 
              class="btn-icon-subtle" 
              :title="t.lightbox?.rotate || '旋转'"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              ↻ {{ t.lightbox?.rotate || '旋转' }}
            </button>
            <!-- Open File Location -->
            <button 
              v-if="selectedImage.path"
              @click="openFileLocation(selectedImage.path)" 
              class="btn-icon-subtle" 
              :title="t.lightbox?.locateFileTitle || '在系统资源管理器中定位文件'"
              style="padding: 6px 12px; font-size: 13px; color: #c084fc; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); cursor: pointer; border-radius: 20px; font-weight: 600;"
            >
              📁 {{ t.lightbox?.locateFile || '定位文件' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Incoming Request Modal -->
    <div class="modal-backdrop" v-if="incomingConnectionRequest" @click.self="handleRespondToRequest(false)">
      <div class="modal-content" style="max-width: 420px; padding: 24px; border-radius: 16px; border: 1px solid rgba(147, 51, 234, 0.2); background: #0f172a; text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center;">
        <div style="font-size: 48px; color: #a855f7; animation: pulse 2s infinite;">🔔</div>
        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary);">{{ t.modals?.connReqTitle || '收到连接请求' }}</h3>
        <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          {{ t.modals?.connReqDesc ? t.modals.connReqDesc.replace('{name}', incomingConnectionRequest.name).replace('{ip}', incomingConnectionRequest.ip) : `设备 ${incomingConnectionRequest.name} (${incomingConnectionRequest.ip}) 想要与您建立连接，是否同意？` }}
        </p>
        <div style="display: flex; gap: 12px; width: 100%; margin-top: 8px;">
          <button 
            @click="handleRespondToRequest(false)" 
            style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-primary); font-weight: 600; cursor: pointer; transition: all 0.2s;"
            onmouseover="this.style.background='rgba(255,255,255,0.05)'"
            onmouseout="this.style.background='transparent'"
          >
            {{ t.modals?.reject || '拒绝' }}
          </button>
          <button 
            @click="handleRespondToRequest(true)" 
            style="flex: 1; padding: 10px; border-radius: 8px; border: none; background: #7c3aed; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(124,58,237,0.3);"
            onmouseover="this.style.background='#8b5cf6'"
            onmouseout="this.style.background='#7c3aed'"
          >
            {{ t.modals?.accept || '同意' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Enter Connection Code Modal -->
    <div class="modal-backdrop" v-if="showEnterCodeModal" @click.self="showEnterCodeModal = false">
      <div class="modal-content" style="max-width: 400px; padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); background: #0f172a; text-align: left; display: flex; flex-direction: column; gap: 16px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">{{ t.modals?.pinTitle || '输入配对连接码或 IP' }}</h3>
        <p style="margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          {{ t.modals?.pinDesc || '如果您使用的是无摄像头设备，请输入对方显示的 4 位配对连接码（如 3587）或直接输入 IP 地址连接。' }}
        </p>
        <input 
          v-model="enteredCode"
          type="text" 
          :placeholder="t.modals?.pinPlaceholder || '输入 4 位数字码或 IP 地址 (如 192.168.1.100)'"
          style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; font-size: 13px; box-sizing: border-box;"
          @keyup.enter="submitConnectionCode"
        />
        <div style="display: flex; gap: 12px; justify-content: flex-end; width: 100%; margin-top: 4px;">
          <button 
            @click="showEnterCodeModal = false" 
            style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer;"
          >
            {{ t.modals?.cancel || '取消' }}
          </button>
          <button 
            @click="submitConnectionCode" 
            style="padding: 8px 18px; border-radius: 6px; border: none; background: #7c3aed; color: white; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(124,58,237,0.2);"
          >
            {{ t.modals?.confirm || '确定' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Person Photos Gallery Modal -->
    <div class="modal-backdrop" v-if="showPersonModal" @click.self="showPersonModal = false">
      <div class="modal-content" style="max-width: 900px; width: 90%; max-height: 85vh; padding: 24px; border-radius: 16px; display: flex; flex-direction: column; text-align: left;">
        <button class="modal-close" @click="showPersonModal = false">✕</button>
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">
          👥 {{ t.modals?.personPhotosTitle ? t.modals.personPhotosTitle.replace('{name}', selectedPersonName).replace('{count}', selectedPersonPhotos.length) : `${selectedPersonName} 包含的照片 (${selectedPersonPhotos.length} 张)` }}
        </h3>
        <div style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;">
          <div 
            v-for="img in selectedPersonPhotos" 
            :key="img.path" 
            class="image-card" 
            @click="openDetails(img, selectedPersonPhotos)"
          >
            <div class="card-img-wrapper">
              <img :src="img.src" class="card-img" loading="lazy" />
            </div>
            <div class="card-overlay">
              <span class="card-title">{{ img.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- How to Connect Modal -->
    <div class="modal-backdrop" v-if="showHowToConnectModal" @click.self="showHowToConnectModal = false">
      <div class="modal-content" style="max-width: 480px; padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); background: #0f172a; text-align: left; display: flex; flex-direction: column; gap: 16px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">{{ t.modals?.guideTitle || '如何连接您的手机与电脑?' }}</h3>
        
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">{{ t.modals?.lanModeTitle || '📶 局域网配对方式（推荐）:' }}</strong>
            {{ t.modals?.lanModeDesc || '请确保手机和电脑连接在同一个 Wi-Fi 网络（路由器），且开启了手机的蓝牙以加速协商。直接使用手机扫描 PC 屏幕上的二维码即可建立直连。' }}
          </div>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 4px 0;" />
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">{{ t.modals?.hotspotModeTitle || '⚡ 热点直连方式（适合断网/限制环境）:' }}</strong>
            {{ t.modals?.hotspotModeDesc || '如果周围没有路由器或路由器设置了客户端隔离（如公共/校园网），点击 PC 端的“热点”按钮，手机连上 PC 开启的专属 Wi-Fi（SSID 与密码将显示在屏幕上），连接成功后再扫描二维码配对。' }}
          </div>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 4px 0;" />
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">{{ t.modals?.p2pModeTitle || '🌐 P2P 设备搜索方式:' }}</strong>
            {{ t.modals?.p2pModeDesc || '在屏幕下方的“附近设备”列表中，只要手机和电脑运行了本软件并接入同一局域网或热点，就会自动搜索出对方。您可以直接在 PC 上点击“连接”请求互联。' }}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; width: 100%; margin-top: 8px;">
          <button 
            @click="showHowToConnectModal = false" 
            style="padding: 8px 24px; border-radius: 6px; border: none; background: #7c3aed; color: white; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(124,58,237,0.2);"
          >
            {{ t.modals?.gotIt || '知道了' }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, nextTick, onMounted, onUnmounted, watch, reactive } from 'vue';
import { useVirtualList, useElementSize } from '@vueuse/core';
import VirtualGrid from './components/VirtualGrid.vue';
import VirtualTimeline from './components/VirtualTimeline.vue';
import VideoAnimeStudioModal from './components/VideoAnimeStudioModal.vue';
import QRCode from 'qrcode';
import { locales, languages } from './locales.js';
import { initAnalytics, trackEvent, trackFeatureUse, identifyUser, setTelemetryOptOut, isTelemetryEnabled } from './analytics.js';
import { connectionManager } from './services/connectionManager.js';

// Localization state (Defaults to system language or 'zh')
function getInitialLocale() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('shareclip_locale') : null;
  if (saved && locales[saved]) return saved;
  if (typeof navigator !== 'undefined' && navigator.language) {
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith('zh')) {
      if (navLang.includes('tw') || navLang.includes('hk') || navLang.includes('hant') || navLang.includes('mo')) {
        return 'zh-TW';
      }
      return 'zh';
    }
    if (navLang.startsWith('ja')) return 'ja';
    if (navLang.startsWith('ko')) return 'ko';
    if (navLang.startsWith('es')) return 'es';
    if (navLang.startsWith('fr')) return 'fr';
    if (navLang.startsWith('de')) return 'de';
    if (navLang.startsWith('ru')) return 'ru';
    if (navLang.startsWith('en')) return 'en';
  }
  return 'zh'; // Default to Chinese
}

const currentLocale = ref(getInitialLocale());
const t = computed(() => locales[currentLocale.value] || locales.en);

watch(currentLocale, (newLoc) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('shareclip_locale', newLoc);
  }
  if (hasApi && window.api?.setSnifferLocale) {
    window.api.setSnifferLocale(newLoc);
  }
});

// Define double mode: Electron or Web Demo
const hasApi = typeof window !== 'undefined' && window.api !== undefined;

// Window control handlers for custom title bar
function minimizeWindow() {
  if (hasApi) window.api.minimizeWindow();
}
function maximizeWindow() {
  if (hasApi) window.api.maximizeWindow();
}
function closeWindow() {
  if (hasApi) window.api.closeWindow();
}

// State Variables
const images = ref([]);
const currentFolderPath = ref('');
const selectedCategory = ref(null);
const galleryContainerRef = ref(null);
const virtualGridRef = ref(null);
const virtualTimelineRef = ref(null);
const showSyncLogs = ref(false);
const isVideoControlExpanded = ref(false);
const animeStudioVideo = ref(null);

function openAnimeStudio(item) {
  animeStudioVideo.value = item;
}
function closeAnimeStudio() {
  animeStudioVideo.value = null;
}

function selectCategory(cat) {
  selectedCategory.value = cat;
  handleClearSearch();
  nextTick(() => {
    if (virtualGridRef.value) {
      virtualGridRef.value.scrollTo(0);
    } else if (galleryContainerRef.value) {
      galleryContainerRef.value.scrollTop = 0;
    }
  });
}
const selectedImage = ref(null);
const currentViewingList = ref([]);
const currentViewingIndex = ref(0);
const lightboxDirection = ref('next');
const filmstripContainerRef = ref(null);
const isFetchingHighRes = ref(false);
const isHighResLoaded = ref(false);
const currentImageScale = ref(1);
const currentImageRotation = ref(0);
const currentImageTranslateX = ref(0);
const currentImageTranslateY = ref(0);
const isDraggingImage = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const lightboxViewportRef = ref(null);

function resetImageView() {
  currentImageScale.value = 1;
  currentImageRotation.value = 0;
  currentImageTranslateX.value = 0;
  currentImageTranslateY.value = 0;
}

function zoomIn() {
  const oldScale = currentImageScale.value;
  const newScale = Math.min(Number((oldScale * 1.25).toFixed(2)), 8);
  currentImageScale.value = newScale;
}

function zoomOut() {
  const oldScale = currentImageScale.value;
  const newScale = Math.max(Number((oldScale / 1.25).toFixed(2)), 0.3);
  currentImageScale.value = newScale;
  if (newScale <= 1) {
    currentImageTranslateX.value = 0;
    currentImageTranslateY.value = 0;
  }
}

function handleLightboxWheel(event) {
  if (selectedItemType.value !== 'image') return;
  event.preventDefault();
  
  const oldScale = currentImageScale.value;
  // Zoom factor: 15% per wheel tick
  const zoomFactor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
  let newScale = oldScale * zoomFactor;
  
  // Clamp scale between 0.3x and 8x
  if (newScale < 0.3) newScale = 0.3;
  if (newScale > 8) newScale = 8;
  
  // Snap smoothly to 1.0 when zooming out close to unity
  if (Math.abs(newScale - 1) < 0.06 && zoomFactor < 1) {
    newScale = 1;
  }
  
  if (!lightboxViewportRef.value) {
    currentImageScale.value = Number(newScale.toFixed(3));
    if (newScale <= 1) {
      currentImageTranslateX.value = 0;
      currentImageTranslateY.value = 0;
    }
    return;
  }
  
  const rect = lightboxViewportRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = event.clientX - cx;
  const dy = event.clientY - cy;
  
  if (newScale <= 1) {
    currentImageTranslateX.value = 0;
    currentImageTranslateY.value = 0;
  } else {
    // Map-like focal zoom: cursor position anchors the expansion
    const ratio = newScale / oldScale;
    currentImageTranslateX.value = currentImageTranslateX.value - (dx - currentImageTranslateX.value) * (ratio - 1);
    currentImageTranslateY.value = currentImageTranslateY.value - (dy - currentImageTranslateY.value) * (ratio - 1);
  }
  
  currentImageScale.value = Number(newScale.toFixed(3));
}

function handleLightboxMouseDown(event) {
  if (selectedItemType.value !== 'image' || event.button !== 0) return;
  if (event.target.closest('button') || event.target.closest('.lightbox-nav-btn')) return;
  
  isDraggingImage.value = true;
  dragStartX.value = event.clientX - currentImageTranslateX.value;
  dragStartY.value = event.clientY - currentImageTranslateY.value;
  
  window.addEventListener('mousemove', handleLightboxMouseMove);
  window.addEventListener('mouseup', handleLightboxMouseUp);
}

function handleLightboxMouseMove(event) {
  if (!isDraggingImage.value) return;
  currentImageTranslateX.value = event.clientX - dragStartX.value;
  currentImageTranslateY.value = event.clientY - dragStartY.value;
}

function handleLightboxMouseUp() {
  if (isDraggingImage.value) {
    isDraggingImage.value = false;
    window.removeEventListener('mousemove', handleLightboxMouseMove);
    window.removeEventListener('mouseup', handleLightboxMouseUp);
  }
}

function handleImageDoubleClick(event) {
  if (selectedItemType.value !== 'image') return;
  if (currentImageScale.value > 1.2) {
    resetImageView();
  } else {
    const oldScale = currentImageScale.value;
    const newScale = 2.5;
    if (lightboxViewportRef.value) {
      const rect = lightboxViewportRef.value.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const ratio = newScale / oldScale;
      currentImageTranslateX.value = currentImageTranslateX.value - (dx - currentImageTranslateX.value) * (ratio - 1);
      currentImageTranslateY.value = currentImageTranslateY.value - (dy - currentImageTranslateY.value) * (ratio - 1);
    }
    currentImageScale.value = newScale;
  }
}
const currentTab = ref('images'); // 'link' | 'images' | 'album' | 'similar' | 'map' | 'people' | 'videos' | 'audios' | 'files' | 'yt-dlp'

// Person Clusters & Face Recognition State
const personClusters = ref([]);
const selectedPersonPhotos = ref([]);
const selectedPersonName = ref('');
const showPersonModal = ref(false);
const isClusteringPeople = ref(false);
const confirmModal = ref({ visible: false, icon: '⚠️', title: '', message: '', confirmText: '确定', danger: false, onConfirm: null, onCancel: null });

function showConfirm({ icon, title, message, confirmText, danger, onConfirm, onCancel } = {}) {
  confirmModal.value = { visible: true, icon: icon || '⚠️', title: title || '确认', message, confirmText: confirmText || '确定', danger: !!danger, onConfirm: onConfirm || null, onCancel: onCancel || null };
}
const faceScanProgress = ref({ done: 0, total: 0 });
const faceScanDurationMs = ref(0);
const faceScanAvgMs = ref(0);
const faceScanRemainingTime = ref('');
let faceScanStartTime = null;
let lastFaceScanDone = 0;
let lastFaceScanTimestamp = 0;
const selectedPersonId = ref(null);

const currentSelectedPerson = computed(() => 
  personClusters.value.find(p => p.id === selectedPersonId.value) || personClusters.value[0]
);

function getPersonCoverUrl(person) {
  if (!person || !person.cover_path) return '';
  const cleanPath = person.cover_path.replace(/\\/g, '/');
  if (person.cover_bbox) {
    try {
      const bbox = typeof person.cover_bbox === 'string' ? JSON.parse(person.cover_bbox) : person.cover_bbox;
      if (Array.isArray(bbox) && bbox.length === 4) {
        return `local:///${cleanPath}?crop=${bbox.join(',')}`;
      }
    } catch (_) {}
  }
  return `local:///${cleanPath}`;
}

async function selectPerson(person) {
  if (!person) return;
  selectedPersonId.value = person.id;
  selectedPersonName.value = person.name;
  if (hasApi && window.api.getPersonPhotos) {
    try {
      const photos = await window.api.getPersonPhotos(person.id);
      selectedPersonPhotos.value = photos.map(p => ({
        ...p,
        src: `local:///${p.path.replace(/\\/g, '/')}`
      }));
    } catch (e) {
      console.error('[People] Failed to load person photos:', e);
    }
  }
}

const groupedPersonPhotos = computed(() => {
  const groups = {};
  selectedPersonPhotos.value.forEach(p => {
    let dateStr = '2025/1/23';
    if (p.create_date) {
      dateStr = p.create_date.split('T')[0].replace(/-/g, '/');
    }
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(p);
  });
  return groups;
});

async function loadPersonClusters() {
  if (hasApi && window.api.getPersonClusters) {
    try {
      const clusters = await window.api.getPersonClusters();
      personClusters.value = clusters;
      if (clusters.length > 0) {
        if (!selectedPersonId.value || !clusters.some(c => c.id === selectedPersonId.value)) {
          selectPerson(clusters[0]);
        }
      }
    } catch (e) {
      console.error('[People] Failed to load person clusters:', e);
    }
  }
}

async function handleRecalculateFaces() {
  if (!hasApi || !window.api.recalculateAllFaces) return;
  showConfirm({
    icon: '♻️',
    title: t.value?.modals?.reextractFacesTitle || '强制重新提取人脸',
    message: t.value?.modals?.reextractFacesMessage || '确定要清空所有人脸识别记录，并对全部图片重新进行人脸提取吗？\n如果图片较多，可能需要几分钟时间。',
    confirmText: t.value?.modals?.reextractFacesConfirm || '开始重新提取',
    danger: false,
    onConfirm: async () => {
      isClusteringPeople.value = true;
      faceScanProgress.value = { done: 0, total: 0 };
      faceScanStartTime = Date.now();
      lastFaceScanDone = 0;
      lastFaceScanTimestamp = Date.now();
      faceScanDurationMs.value = 0;
      faceScanAvgMs.value = 0;
      faceScanRemainingTime.value = '';
      try {
        const clusters = await window.api.recalculateAllFaces();
        personClusters.value = clusters;
        if (clusters.length > 0) {
          selectPerson(clusters[0]);
        } else {
          selectedPerson.value = null;
        }
      } catch (e) {
        console.error('[People] Failed to recalculate faces:', e);
      } finally {
        isClusteringPeople.value = false;
      }
    }
  });
}

async function handleReclusterPeople() {
  if (!hasApi || !window.api.reclusterFaces) return;
  isClusteringPeople.value = true;
  faceScanProgress.value = { done: 0, total: 0 };
  faceScanStartTime = Date.now();
  lastFaceScanDone = 0;
  lastFaceScanTimestamp = Date.now();
  faceScanDurationMs.value = 0;
  faceScanAvgMs.value = 0;
  faceScanRemainingTime.value = '';
  try {
    const clusters = await window.api.reclusterFaces();
    personClusters.value = clusters;
    if (clusters.length > 0) {
      selectPerson(clusters[0]);
    }
  } catch (e) {
    console.error('[People] Failed to recluster faces:', e);
  } finally {
    isClusteringPeople.value = false;
  }
}

async function promptRenamePerson(person) {
  if (!person) return;
  const newName = prompt('请输入人物名称：', person.name);
  if (newName && newName.trim() && newName !== person.name) {
    if (hasApi && window.api.updatePersonName) {
      await window.api.updatePersonName(person.id, newName.trim());
      loadPersonClusters();
    }
  }
}

watch(currentTab, (newTab) => {
  if (newTab === 'people') {
    loadPersonClusters();
  }
});

// YT-DLP State
const ytSubTab = ref('parse'); // 'parse' | 'downloading' | 'completed'
const ytUrl = ref('');
const ytMode = ref('link'); // 'link' | 'browser'
const ytParsing = ref(false);
const ytParseError = ref('');
const ytVideoInfo = ref(null);
const ytSelectedResolution = ref(null);
const ytProgress = ref(null);
const ytDownloading = ref(false);
const ytActiveTasks = ref([]);
const ytHistory = ref([]);
const ytViewMode = ref(localStorage.getItem('shareclip_yt_view_mode') || 'grid'); // 'grid' | 'list'
const setYtViewMode = (mode) => {
  ytViewMode.value = mode;
  try {
    localStorage.setItem('shareclip_yt_view_mode', mode);
  } catch (_) {}
};
const ytWebviewRef = ref(null);
const ytCookieConfig = ref({ mode: 'none', hasEmbeddedCookies: false });
const ytCookieSyncing = ref(false);
const ytSyncStatusText = ref('');
const showYtCookieMenu = ref(false);
const ytCookieWrapperRef = ref(null);
const snifferWindowStatus = ref({ isOpen: false, url: '', title: '' });

const ytCookieSummaryLabel = computed(() => {
  const mode = ytCookieConfig.value?.mode || 'none';
  const vd = t.value?.videoDownloader;
  switch (mode) {
    case 'edge':
      return vd?.syncEdge || 'Microsoft Edge';
    case 'chrome':
      return vd?.syncChrome || 'Google Chrome';
    case 'firefox':
      return vd?.syncFirefox || 'Mozilla Firefox';
    case 'brave':
      return vd?.syncBrave || 'Brave Browser';
    case 'file':
      return vd?.syncFile || 'cookies.txt';
    case 'embedded':
      return ytCookieConfig.value?.hasEmbeddedCookies ? (vd?.syncEmbedded || '内嵌已登录') : (vd?.syncEmbedded || '内嵌账号');
    case 'none':
    default:
      return vd?.loginSync || '登录同步';
  }
});
const activeDeviceUuid = ref(null);
const activeDeviceName = ref('');
const activeDeviceSystemInfo = ref(null);
const connectingIp = ref(null);
const activePeerType = ref('Mobile');
const activeMetadata = {}; // fileId -> { assetId, name, size }

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.heic', '.heif', '.dng', '.raw'];

const selectedItemType = computed(() => {
  if (!selectedImage.value) return '';
  const ext = getExtensionName(selectedImage.value.name);
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
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
    return IMAGE_EXTENSIONS.includes(ext) && file.type !== 'album_photo';
  });
});

const albumBackupImages = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return IMAGE_EXTENSIONS.includes(ext) && file.type === 'album_photo';
  });
});

const mapLoadError = ref(false);
let leafletMap = null;
let markerClusterGroup = null;

const imagesWithGps = computed(() => {
  return localImages.value.filter(file => file.latitude !== undefined && file.latitude !== null && file.longitude !== undefined && file.longitude !== null);
});

function initMap() {
  mapLoadError.value = typeof L === 'undefined';
  if (mapLoadError.value) {
    console.error("Leaflet mapping library not loaded.");
    return;
  }

  nextTick(() => {
    try {
      const container = document.getElementById('map-container');
      if (!container) return;

      // Clean up previous map instance if it exists
      if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
      }

      const gpsList = imagesWithGps.value;
      if (gpsList.length === 0) return;

      let initialCenter = [gpsList[0].latitude, gpsList[0].longitude];
      let initialZoom = 13;

      leafletMap = L.map('map-container').setView(initialCenter, initialZoom);

      // Switched to standard OSM due to CARTO API Key enforcement. We use CSS invert to make it dark.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(leafletMap);

      markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
          const markers = cluster.getAllChildMarkers();
          const count = markers.length;
          const firstImgSrc = markers[0].options.imgSrc;
          return L.divIcon({
            html: `
              <div class="map-cluster-marker">
                <div class="map-cluster-avatar">
                  <img src="${firstImgSrc}" class="map-cluster-img" />
                </div>
                <span class="map-cluster-count">${count}</span>
              </div>
            `,
            className: 'custom-cluster-icon',
            iconSize: [46, 46],
            iconAnchor: [23, 23]
          });
        }
      });

      gpsList.forEach(img => {
        const customIcon = L.divIcon({
          html: `
            <div class="map-thumbnail-marker">
              <img src="${img.src}" />
            </div>
          `,
          className: 'custom-marker-icon',
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        });

        const marker = L.marker([img.latitude, img.longitude], { 
          icon: customIcon,
          imgSrc: img.src
        });

        const popupContent = document.createElement('div');
        popupContent.className = 'map-popup-card';
        popupContent.style.textAlign = 'center';
        popupContent.style.padding = '4px';
        popupContent.style.cursor = 'pointer';
        popupContent.innerHTML = `
          <img src="${img.src}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 6px; display: block;" />
          <div style="font-size: 11px; font-weight: 600; color: #fff; max-width: 100px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${img.name}</div>
        `;
        
        popupContent.addEventListener('click', () => {
          openDetails(img);
        });

        marker.bindPopup(popupContent, {
          closeButton: false,
          offset: [0, -10]
        });

        markerClusterGroup.addLayer(marker);
      });

      leafletMap.addLayer(markerClusterGroup);

      if (gpsList.length > 1) {
        const bounds = L.latLngBounds(gpsList.map(img => [img.latitude, img.longitude]));
        leafletMap.fitBounds(bounds, { padding: [40, 40] });
      }

    } catch (err) {
      console.error("Failed to initialize Leaflet Map:", err);
      mapLoadError.value = true;
    }
  });
}

watch(currentTab, (newTab) => {
  if (newTab === 'map') {
    initMap();
  } else if (newTab === 'videos') {
    if (syncStatus.value === 'connected') {
      queryRemoteVideoCatalog();
    } else if (videoTabFilter.value === 'unsynced') {
      videoTabFilter.value = 'synced';
    }
  } else if (newTab === 'audios') {
    if (syncStatus.value === 'connected') {
      queryRemoteAudioCatalog();
    } else if (audioTabFilter.value === 'unsynced') {
      audioTabFilter.value = 'synced';
    }
  }
});

function formatVideoDuration(seconds) {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const localVideos = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return ['.mp4', '.mkv', '.mov', '.avi', '.webm'].includes(ext) || file.type === 'video';
  });
});

const remoteVideoCatalog = ref([]);
const isVideoSyncing = ref(false);
const isVideoSyncPaused = ref(false);
const videoSyncDone = ref(0);
const videoSyncTotal = ref(0);
const activePlayingVideo = ref(null);

const currentVideoSyncPercent = computed(() => {
  if (videoSyncTotal.value <= 0) return 0;
  let activeProg = 0;
  if (incomingTransfer.value && incomingTransfer.value.name) {
    const isVid = incomingTransfer.value.name.startsWith('video_') || /\.(mp4|mkv|mov|avi|webm)$/i.test(incomingTransfer.value.name);
    if (isVid && incomingTransfer.value.progress > 0) {
      activeProg = Math.min(0.99, incomingTransfer.value.progress);
    }
  }
  const effective = videoSyncDone.value + activeProg;
  return Math.min(100, Math.round((effective / videoSyncTotal.value) * 100));
});

const currentVideoSyncTitle = computed(() => {
  if (!isVideoSyncing.value) return '';
  if (incomingTransfer.value && incomingTransfer.value.name) {
    const isVid = incomingTransfer.value.name.startsWith('video_') || /\.(mp4|mkv|mov|avi|webm)$/i.test(incomingTransfer.value.name);
    if (isVid && incomingTransfer.value.progress > 0) {
      const chunkPct = Math.round(incomingTransfer.value.progress * 100);
      return `正在传输视频: ${incomingTransfer.value.name} (${videoSyncDone.value}/${videoSyncTotal.value}) · ${chunkPct}%`;
    }
  }
  return t.value?.videos?.syncingTitle
    ? t.value.videos.syncingTitle.replace('{done}', videoSyncDone.value).replace('{total}', videoSyncTotal.value)
    : `正在高速下载视频... (${videoSyncDone.value} / ${videoSyncTotal.value})`;
});

const videoGroupsByDate = computed(() => {
  const groupsMap = {};

  // 1. Process local synced/imported videos
  for (const video of localVideos.value) {
    let rawDate = '1970-01-01';
    if (video.create_date) {
      rawDate = video.create_date.substring(0, 10);
    } else if (video.sync_time) {
      const d = new Date(video.sync_time);
      rawDate = d.toISOString().substring(0, 10);
    }
    const isZh = currentLocale.value === 'zh' || currentLocale.value === 'zh-TW';
    const parts = rawDate.split('-');
    const dateKey = rawDate === '1970-01-01' ? (t.value?.dates?.otherDate || '其他日期') : (isZh && parts.length === 3 ? `${parts[0]}年${parts[1]}月${parts[2]}日` : rawDate);

    if (!groupsMap[rawDate]) {
      groupsMap[rawDate] = {
        dateKey,
        rawDate,
        items: []
      };
    }
    groupsMap[rawDate].items.push({
      ...video,
      isRemoteOnly: false,
      isSynced: true
    });
  }

  // 2. Process remote videos from remoteVideoCatalog (if not already in localVideos)
  const localIds = new Set(localVideos.value.map(v => v.id));
  const localNames = new Set(localVideos.value.map(v => v.name));

  for (const remote of remoteVideoCatalog.value) {
    if (!localIds.has(remote.id) && !localIds.has(`video_${remote.id}`) && !localNames.has(remote.name)) {
      let rawDate = '1970-01-01';
      if (remote.create_date) {
        rawDate = remote.create_date.substring(0, 10);
      } else if (remote.timestamp) {
        const d = new Date(remote.timestamp);
        rawDate = d.toISOString().substring(0, 10);
      }
      const isZh = currentLocale.value === 'zh' || currentLocale.value === 'zh-TW';
      const parts = rawDate.split('-');
      const dateKey = rawDate === '1970-01-01' ? (t.value?.dates?.otherDate || '其他日期') : (isZh && parts.length === 3 ? `${parts[0]}年${parts[1]}月${parts[2]}日` : rawDate);

      if (!groupsMap[rawDate]) {
        groupsMap[rawDate] = {
          dateKey,
          rawDate,
          items: []
        };
      }
      groupsMap[rawDate].items.push({
        id: remote.id,
        name: remote.name,
        size: remote.size,
        duration: remote.duration,
        create_date: remote.create_date,
        thumb: remote.thumb || '',
        isRemoteOnly: true,
        isSynced: false
      });
    }
  }

  // 3. Sort groups in descending chronological order (newest first)
  const sortedKeys = Object.keys(groupsMap).sort((a, b) => (a < b ? 1 : -1));
  return sortedKeys.map(key => {
    const grp = groupsMap[key];
    const unsyncedItems = grp.items.filter(i => i.isRemoteOnly);
    const totalBytes = grp.items.reduce((acc, i) => acc + (i.size || 0), 0);
    return {
      dateKey: grp.dateKey,
      rawDate: grp.rawDate,
      items: grp.items,
      totalCount: grp.items.length,
      totalBytes,
      unsyncedCount: unsyncedItems.length,
      unsyncedIds: unsyncedItems.map(i => i.id),
      hasUnsynced: unsyncedItems.length > 0
    };
  });
});

const videoTabFilter = ref('all'); // 'all' | 'synced' | 'unsynced'

const filteredVideoGroupsByDate = computed(() => {
  return videoGroupsByDate.value.map(group => {
    let filteredItems = group.items;
    if (videoTabFilter.value === 'synced') {
      filteredItems = group.items.filter(i => i.isSynced);
    } else if (videoTabFilter.value === 'unsynced') {
      filteredItems = group.items.filter(i => !i.isSynced);
    }
    const unsyncedInGroup = filteredItems.filter(i => !i.isSynced);
    return {
      ...group,
      items: filteredItems,
      filteredCount: filteredItems.length,
      filteredBytes: filteredItems.reduce((sum, i) => sum + (i.size || 0), 0),
      hasUnsynced: unsyncedInGroup.length > 0,
      unsyncedCount: unsyncedInGroup.length,
      unsyncedIds: unsyncedInGroup.map(i => i.id)
    };
  }).filter(group => group.filteredCount > 0);
});

const totalUnsyncedVideosCount = computed(() => {
  return videoGroupsByDate.value.reduce((sum, g) => sum + g.unsyncedCount, 0);
});

const totalAllVideosCount = computed(() => {
  return videoGroupsByDate.value.reduce((sum, g) => sum + g.totalCount, 0);
});

// Manual Video Multi-Select & Batch Download State
const selectedVideoIds = ref(new Set());

const selectedVideosCount = computed(() => selectedVideoIds.value.size);

const selectedVideosTotalBytes = computed(() => {
  let sum = 0;
  for (const group of videoGroupsByDate.value) {
    for (const item of group.items) {
      if (selectedVideoIds.value.has(item.id)) {
        sum += item.size || 0;
      }
    }
  }
  return sum;
});

function isVideoSelected(item) {
  return selectedVideoIds.value.has(item.id);
}

function toggleVideoSelection(item) {
  if (item.isSynced) return;
  const newSet = new Set(selectedVideoIds.value);
  if (newSet.has(item.id)) {
    newSet.delete(item.id);
  } else {
    newSet.add(item.id);
  }
  selectedVideoIds.value = newSet;
}

function toggleDateSelection(group) {
  const unsynced = group.items.filter(i => !i.isSynced);
  if (unsynced.length === 0) return;
  const newSet = new Set(selectedVideoIds.value);
  const allInGroupSelected = unsynced.every(i => newSet.has(i.id));
  if (allInGroupSelected) {
    unsynced.forEach(i => newSet.delete(i.id));
  } else {
    unsynced.forEach(i => newSet.add(i.id));
  }
  selectedVideoIds.value = newSet;
}

function isDateAllSelected(group) {
  const unsynced = group.items.filter(i => !i.isSynced);
  if (unsynced.length === 0) return false;
  return unsynced.every(i => selectedVideoIds.value.has(i.id));
}

function selectAllUnsyncedVideos() {
  const newSet = new Set(selectedVideoIds.value);
  for (const group of videoGroupsByDate.value) {
    for (const item of group.items) {
      if (!item.isSynced) {
        newSet.add(item.id);
      }
    }
  }
  selectedVideoIds.value = newSet;
}

function clearVideoSelection() {
  selectedVideoIds.value = new Set();
}

function downloadSelectedVideos() {
  if (selectedVideoIds.value.size === 0) return;
  const ids = Array.from(selectedVideoIds.value);
  requestVideoSync({ targetIds: ids });
}

function downloadSingleVideo(item) {
  requestVideoSync({ targetIds: [item.id] });
}

// Video thumbnail extraction & caching for PC-side local videos (Lightweight Sequential Queue)
const videoPosterCache = shallowRef(new Map());
const posterQueue = [];
let isGeneratingPoster = false;

function getVideoPoster(item) {
  if (item.thumb) {
    return item.thumb.startsWith('data:') ? item.thumb : `data:image/jpeg;base64,${item.thumb}`;
  }
  const key = item.path || item.id || item.name;
  if (videoPosterCache.value.has(key)) {
    return videoPosterCache.value.get(key);
  }
  if (item.isSynced || item.path || item.src) {
    queueVideoPosterGeneration(item);
  }
  return null;
}

function queueVideoPosterGeneration(item) {
  const key = item.path || item.id || item.name;
  if (videoPosterCache.value.has(key) || posterQueue.some(i => (i.path || i.id || i.name) === key)) {
    return;
  }
  posterQueue.push(item);
  processPosterQueue();
}

function processPosterQueue() {
  if (isGeneratingPoster || posterQueue.length === 0) return;
  const item = posterQueue.shift();
  if (!item) return;

  const url = item.src || (item.path ? `local:///${item.path.replace(/\\/g, '/')}` : null);
  const key = item.path || item.id || item.name;
  if (!url || videoPosterCache.value.has(key)) {
    processPosterQueue();
    return;
  }

  isGeneratingPoster = true;
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = url;
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;

  let timeoutId = setTimeout(() => {
    cleanup();
    processPosterQueue();
  }, 2500);

  function cleanup() {
    clearTimeout(timeoutId);
    video.onloadeddata = null;
    video.onseeked = null;
    video.onerror = null;
    video.src = '';
    video.load();
    isGeneratingPoster = false;
  }

  video.onloadeddata = () => {
    video.currentTime = Math.min(1.0, (video.duration || 1) * 0.1);
  };

  video.onseeked = () => {
    try {
      const canvas = document.createElement('canvas');
      const w = 240;
      const h = Math.round(w * ((video.videoHeight || 135) / (video.videoWidth || 240)));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        const newMap = new Map(videoPosterCache.value);
        newMap.set(key, dataUrl);
        videoPosterCache.value = newMap;
      }
    } catch (e) {
      console.warn('Canvas poster capture error for', item.name, e);
    } finally {
      cleanup();
      // Delay 40ms to yield CPU to main thread & smooth UI scrolling
      setTimeout(processPosterQueue, 40);
    }
  };

  video.onerror = () => {
    cleanup();
    setTimeout(processPosterQueue, 40);
  };
}

function getCleanAudioTitle(name) {
  if (!name) return '未知曲目';
  let clean = name.replace(/\.(mp3|m4a|flac|wav|aac|ogg|wma|opus|ape|dsf|dff|alac)$/i, '').trim();

  // If it already has Chinese / Japanese characters or readable words with spaces, keep it
  if (/[\u4e00-\u9fa5\u3040-\u30ff]/.test(clean)) return clean;
  if (/\s+/.test(clean) && !/^[a-f0-9\s-]+$/i.test(clean)) return clean;

  // Cryptic patterns: pure numbers/underscores, hex hashes, UUIDs, long hash-like strings
  const isCryptic = /^[0-9_-]+$/.test(clean) || 
                    /^[a-f0-9]{20,}/i.test(clean) ||
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(clean) ||
                    (clean.length > 20 && /^[\w-]+$/.test(clean) && (clean.match(/\d/g) || []).length > 8);

  if (isCryptic) {
    const isZh = currentLocale.value === 'zh' || currentLocale.value === 'zh-TW';
    const voicePrefix = isZh ? '语音录音' : 'Voice Note';

    // 13-digit timestamp (ms) between 2018 and 2035
    const match13 = clean.match(/1[5-9]\d{11}|20\d{11}/);
    if (match13) {
      const ts = parseInt(match13[0], 10);
      const d = new Date(ts);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2018 && d.getFullYear() <= 2035) {
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        return `${voicePrefix} ${dateStr} ${timeStr}`;
      }
    }

    // 10-digit timestamp (seconds) between 2018 and 2035
    const match10 = clean.match(/1[5-9]\d{8}|20\d{8}/);
    if (match10) {
      const ts = parseInt(match10[0], 10) * 1000;
      const d = new Date(ts);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2018 && d.getFullYear() <= 2035) {
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        return `${voicePrefix} ${dateStr} ${timeStr}`;
      }
    }

    // Hex or UUID shortened
    if (clean.length > 18) {
      const clipPrefix = isZh ? '音频片段' : 'Audio Clip';
      return `${clipPrefix} #${clean.slice(-6)}`;
    }
  }

  return clean || name;
}

function getAudioFormat(name) {
  if (!name) return 'AUDIO';
  const parts = name.split('.');
  if (parts.length <= 1) return 'AUDIO';
  return parts.pop().toUpperCase();
}

function getAudioFormatType(name) {
  const fmt = getAudioFormat(name);
  if (['FLAC', 'APE', 'DSF', 'DFF', 'ALAC', 'WAV'].includes(fmt)) return 'hi-res';
  if (['M4A', 'AAC'].includes(fmt)) return 'm4a';
  if (['MP3'].includes(fmt)) return 'mp3';
  if (['OGG', 'OPUS'].includes(fmt)) return 'ogg';
  return 'other';
}

const localAudios = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma'].includes(ext) || file.type === 'audios' || file.type === 'audio';
  });
});

const remoteAudioCatalog = ref([]);
const isAudioSyncing = ref(false);
const isAudioSyncPaused = ref(false);
const audioSyncDone = ref(0);
const audioSyncTotal = ref(0);
const activePlayingAudio = ref(null);
const isAudioControlExpanded = ref(false);

const currentAudioSyncPercent = computed(() => {
  if (audioSyncTotal.value <= 0) return 0;
  let activeProg = 0;
  if (incomingTransfer.value && incomingTransfer.value.name) {
    const isAud = incomingTransfer.value.name.startsWith('audio_') || /\.(mp3|wav|m4a|ogg|flac|aac|wma|opus)$/i.test(incomingTransfer.value.name);
    if (isAud && incomingTransfer.value.progress > 0) {
      activeProg = Math.min(0.99, incomingTransfer.value.progress);
    }
  }
  const effective = audioSyncDone.value + activeProg;
  return Math.min(100, Math.round((effective / audioSyncTotal.value) * 100));
});

const currentAudioSyncTitle = computed(() => {
  if (!isAudioSyncing.value) return '';
  if (incomingTransfer.value && incomingTransfer.value.name) {
    const isAud = incomingTransfer.value.name.startsWith('audio_') || /\.(mp3|wav|m4a|ogg|flac|aac|wma|opus)$/i.test(incomingTransfer.value.name);
    if (isAud && incomingTransfer.value.progress > 0) {
      const chunkPct = Math.round(incomingTransfer.value.progress * 100);
      return `正在传输音频: ${incomingTransfer.value.name} (${audioSyncDone.value}/${audioSyncTotal.value}) · ${chunkPct}%`;
    }
  }
  return `正在高速下载音频... (${audioSyncDone.value} / ${audioSyncTotal.value})`;
});

const audioGroupsByDate = computed(() => {
  const groupsMap = {};

  // 1. Process local synced/imported audios
  for (const audio of localAudios.value) {
    let rawDate = '1970-01-01';
    if (audio.create_date) {
      rawDate = audio.create_date.substring(0, 10);
    } else if (audio.sync_time) {
      const d = new Date(audio.sync_time);
      rawDate = d.toISOString().substring(0, 10);
    }
    const isZh = currentLocale.value === 'zh' || currentLocale.value === 'zh-TW';
    const parts = rawDate.split('-');
    const dateKey = rawDate === '1970-01-01' ? (t.value?.dates?.otherDate || '其他日期') : (isZh && parts.length === 3 ? `${parts[0]}年${parts[1]}月${parts[2]}日` : rawDate);

    if (!groupsMap[rawDate]) {
      groupsMap[rawDate] = {
        dateKey,
        rawDate,
        items: []
      };
    }
    groupsMap[rawDate].items.push({
      ...audio,
      isRemoteOnly: false,
      isSynced: true
    });
  }

  // 2. Process remote audios from remoteAudioCatalog (if not already in localAudios)
  const localIds = new Set(localAudios.value.map(a => a.id));
  const localNames = new Set(localAudios.value.map(a => a.name));

  for (const remote of remoteAudioCatalog.value) {
    if (!localIds.has(remote.id) && !localIds.has(`audio_${remote.id}`) && !localNames.has(remote.name)) {
      let rawDate = '1970-01-01';
      if (remote.create_date) {
        rawDate = remote.create_date.substring(0, 10);
      } else if (remote.timestamp) {
        const d = new Date(remote.timestamp);
        rawDate = d.toISOString().substring(0, 10);
      }
      const isZh = currentLocale.value === 'zh' || currentLocale.value === 'zh-TW';
      const parts = rawDate.split('-');
      const dateKey = rawDate === '1970-01-01' ? (t.value?.dates?.otherDate || '其他日期') : (isZh && parts.length === 3 ? `${parts[0]}年${parts[1]}月${parts[2]}日` : rawDate);

      if (!groupsMap[rawDate]) {
        groupsMap[rawDate] = {
          dateKey,
          rawDate,
          items: []
        };
      }
      groupsMap[rawDate].items.push({
        id: remote.id,
        name: remote.name,
        size: remote.size,
        duration: remote.duration,
        create_date: remote.create_date,
        isRemoteOnly: true,
        isSynced: false
      });
    }
  }

  // 3. Sort groups in descending chronological order (newest first)
  const sortedKeys = Object.keys(groupsMap).sort((a, b) => (a < b ? 1 : -1));
  return sortedKeys.map(key => {
    const grp = groupsMap[key];
    const unsyncedItems = grp.items.filter(i => i.isRemoteOnly);
    const totalBytes = grp.items.reduce((acc, i) => acc + (i.size || 0), 0);
    return {
      dateKey: grp.dateKey,
      rawDate: grp.rawDate,
      items: grp.items,
      totalCount: grp.items.length,
      totalBytes,
      unsyncedCount: unsyncedItems.length,
      unsyncedIds: unsyncedItems.map(i => i.id),
      hasUnsynced: unsyncedItems.length > 0
    };
  });
});

const audioTabFilter = ref('all'); // 'all' | 'synced' | 'unsynced'

const filteredAudioGroupsByDate = computed(() => {
  return audioGroupsByDate.value.map(group => {
    let filteredItems = group.items;
    if (audioTabFilter.value === 'synced') {
      filteredItems = group.items.filter(i => i.isSynced);
    } else if (audioTabFilter.value === 'unsynced') {
      filteredItems = group.items.filter(i => !i.isSynced);
    }
    const unsyncedInGroup = filteredItems.filter(i => !i.isSynced);
    return {
      ...group,
      items: filteredItems,
      filteredCount: filteredItems.length,
      filteredBytes: filteredItems.reduce((sum, i) => sum + (i.size || 0), 0),
      hasUnsynced: unsyncedInGroup.length > 0,
      unsyncedCount: unsyncedInGroup.length,
      unsyncedIds: unsyncedInGroup.map(i => i.id)
    };
  }).filter(group => group.filteredCount > 0);
});

const totalUnsyncedAudiosCount = computed(() => {
  return audioGroupsByDate.value.reduce((sum, g) => sum + g.unsyncedCount, 0);
});

const totalAllAudiosCount = computed(() => {
  return audioGroupsByDate.value.reduce((sum, g) => sum + g.totalCount, 0);
});

// Manual Audio Multi-Select & Batch Download State
const selectedAudioIds = ref(new Set());

const selectedAudiosCount = computed(() => selectedAudioIds.value.size);

const selectedAudiosTotalBytes = computed(() => {
  let sum = 0;
  for (const group of audioGroupsByDate.value) {
    for (const item of group.items) {
      if (selectedAudioIds.value.has(item.id)) {
        sum += item.size || 0;
      }
    }
  }
  return sum;
});

function isAudioSelected(item) {
  return selectedAudioIds.value.has(item.id);
}

function toggleAudioSelection(item) {
  if (item.isSynced) return;
  const newSet = new Set(selectedAudioIds.value);
  if (newSet.has(item.id)) {
    newSet.delete(item.id);
  } else {
    newSet.add(item.id);
  }
  selectedAudioIds.value = newSet;
}

function toggleAudioDateSelection(group) {
  const unsynced = group.items.filter(i => !i.isSynced);
  if (unsynced.length === 0) return;
  const newSet = new Set(selectedAudioIds.value);
  const allInGroupSelected = unsynced.every(i => newSet.has(i.id));
  if (allInGroupSelected) {
    unsynced.forEach(i => newSet.delete(i.id));
  } else {
    unsynced.forEach(i => newSet.add(i.id));
  }
  selectedAudioIds.value = newSet;
}

function isAudioDateAllSelected(group) {
  const unsynced = group.items.filter(i => !i.isSynced);
  if (unsynced.length === 0) return false;
  return unsynced.every(i => selectedAudioIds.value.has(i.id));
}

function selectAllUnsyncedAudios() {
  const newSet = new Set(selectedAudioIds.value);
  for (const group of audioGroupsByDate.value) {
    for (const item of group.items) {
      if (!item.isSynced) {
        newSet.add(item.id);
      }
    }
  }
  selectedAudioIds.value = newSet;
}

function clearAudioSelection() {
  selectedAudioIds.value = new Set();
}

function downloadSelectedAudios() {
  if (selectedAudioIds.value.size === 0) return;
  const ids = Array.from(selectedAudioIds.value);
  requestAudioSync({ targetIds: ids });
}

function downloadSingleAudio(item) {
  requestAudioSync({ targetIds: [item.id] });
}

function openAudioPlayer(audio) {
  activePlayingAudio.value = audio;
}

function closeAudioPlayer() {
  activePlayingAudio.value = null;
}

function openAudioFolder(filePath) {
  if (filePath && window.api?.openFileLocation) {
    window.api.openFileLocation(filePath);
  }
}

const localDocs = computed(() => {
  return images.value.filter(file => {
    const ext = getExtensionName(file.name);
    return ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.xlsx', '.pptx'].includes(ext);
  });
});

// BLE Signaling and WebRTC synchronization state
const isSyncActive = ref(false);
const syncStatus = connectionManager.status;
const qrPayload = ref(null);
const qrCanvas = ref(null);
const syncLogs = ref([]);
const logTerminalRef = ref(null);

// Compress QR payload to minimum bytes and set low error correction for largest dots / lowest granularity
function formatQrPayload(payload) {
  if (!payload) return '';
  let obj = payload;
  if (typeof payload === 'string') {
    try {
      obj = JSON.parse(payload);
    } catch (_) {
      return payload;
    }
  }
  const compact = {};
  if (obj.ble_mac || obj.m) compact.m = obj.ble_mac || obj.m;
  if (obj.session_id || obj.s) compact.s = obj.session_id || obj.s;
  
  const ips = obj.pc_ips || obj.ip;
  if (Array.isArray(ips)) {
    if (ips.length > 0) compact.ip = ips;
  } else if (ips) {
    compact.ip = ips;
  }

  const port = obj.http_port || obj.p || obj.port;
  if (port && port !== 15186) compact.p = port;

  const ssid = obj.hotspotSsid || obj.hs;
  if (ssid) compact.hs = ssid;

  const pwd = obj.hotspotPassword || obj.hp;
  if (pwd) compact.hp = pwd;

  return JSON.stringify(compact);
}

function renderQrCode(payload) {
  if (!qrCanvas.value) return;
  const targetPayload = payload || qrPayload.value;
  if (!targetPayload) return;
  const content = formatQrPayload(targetPayload);
  QRCode.toCanvas(
    qrCanvas.value,
    content,
    {
      width: 160,
      margin: 1,
      errorCorrectionLevel: 'L'
    },
    (error) => {
      if (error) console.error("QR Code rendering error:", error);
    }
  );
}

// Watch tab and payload changes to render the QR Code reliably
watch([currentTab, qrPayload], async () => {
  if (currentTab.value === 'link' && qrPayload.value) {
    await nextTick();
    renderQrCode(qrPayload.value);
  }
}, { immediate: true });

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
const thumbnailImages = ref([]);
const knownThumbNames = new Set();
function rebuildKnownThumbNames() {
  knownThumbNames.clear();
  const arr = thumbnailImages.value;
  if (Array.isArray(arr)) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]?.name) knownThumbNames.add(arr[i].name);
    }
  }
}
watch(thumbnailImages, () => {
  rebuildKnownThumbNames();
}, { deep: false });
const isThumbnailSyncing = ref(false);
const thumbSyncDone = ref(0);
const thumbSyncTotal = ref(0);
let thumbnailSyncTimeoutTimer = null;
let albumSyncTimeoutTimer = null;
const isDarkMode = ref(localStorage.getItem('theme-dark') !== 'false');

// Decoupled Background AI Queue Progress
const aiQueueProgress = ref({
  isProcessing: false,
  total: 0,
  completed: 0,
  remaining: 0,
  percent: 0
});

const picturesBadgeText = computed(() => {
  if (isReclassifying.value) {
    const done = reclassifyProgress.value.done || 0;
    const total = reclassifyProgress.value.total || localImages.value.length;
    return `🧠 ${done} / ${total}`;
  }
  if (aiQueueProgress.value.isProcessing && aiQueueProgress.value.total > 0) {
    return `🧠 ${aiQueueProgress.value.completed} / ${aiQueueProgress.value.total}`;
  }
  return `${localImages.value.length}`;
});

watch(isDarkMode, (newVal) => {
  localStorage.setItem('theme-dark', newVal ? 'true' : 'false');
});

watch(syncStatus, (newStatus) => {
  if (hasApi && window.api.setSyncStatus) {
    window.api.setSyncStatus(newStatus, activeDeviceUuid.value);
  }
  if (newStatus !== 'connected') {
    // When disconnected from mobile, automatically switch off the "Phone Pending Download" filter
    // so users immediately see their local downloaded/backed-up media on PC!
    if (videoTabFilter.value === 'unsynced') {
      videoTabFilter.value = 'synced';
    }
    if (audioTabFilter.value === 'unsynced') {
      audioTabFilter.value = 'synced';
    }
  }
});

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
}

// Download path settings
const downloadPath = ref('');
const downloadPathSaved = ref(false);
let downloadPathSavedTimer = null;

async function browseDownloadFolder() {
  const selected = await window.api.selectDownloadFolder();
  if (selected) {
    downloadPath.value = selected;
    showDownloadPathSaved();
  }
}

async function resetDownloadPath() {
  await window.api.setDownloadPath(null);
  downloadPath.value = '';
  showDownloadPathSaved();
}

function showDownloadPathSaved() {
  downloadPathSaved.value = true;
  clearTimeout(downloadPathSavedTimer);
  downloadPathSavedTimer = setTimeout(() => {
    downloadPathSaved.value = false;
  }, 2500);
}

async function openDownloadFolder() {
  await window.api.openDownloadFolder();
}

// Prevent sleep settings
const preventSleep = ref(true);

async function togglePreventSleep() {
  if (hasApi && window.api.setPreventSleep) {
    const newState = !preventSleep.value;
    const res = await window.api.setPreventSleep(newState);
    preventSleep.value = res;
  } else {
    preventSleep.value = !preventSleep.value;
  }
}

async function openLogFolder() {
  if (hasApi && window.api.openLogFolder) {
    await window.api.openLogFolder();
  }
}

// System Information
const systemInfo = ref(null);
const systemInfoLoading = ref(false);
async function fetchSystemInfo() {
  systemInfoLoading.value = true;
  try {
    if (window.api && window.api.getSystemInfo) {
      const info = await window.api.getSystemInfo();
      systemInfo.value = info;
    } else {
      systemInfo.value = { ok: false, error: 'API not available in current environment' };
    }
  } catch (e) {
    systemInfo.value = { ok: false, error: String(e.message || e) };
  } finally {
    systemInfoLoading.value = false;
  }
}

// App Update checks
const updateStatus = ref('idle'); // 'idle' | 'checking' | 'up-to-date' | 'new-available' | 'failed'
const currentVersion = ref('');
const latestVersion = ref('');
const updateUrl = ref('');
const updateDownloadUrl = ref('');
const updateNotes = ref('');

const displayUpdateNotes = computed(() => {
  if (!updateNotes.value) return '';
  let raw = updateNotes.value.trim();
  
  // Check if it's GitHub's generic changelog format
  const isGenericChangelog = /Full Changelog/i.test(raw);
  
  // Clean raw HTML tags into clean text
  let cleaned = raw
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
  
  // Translate standard GitHub release phrases based on current UI language
  const labelChangelog = t.value?.update?.fullChangelog || '完整更新日志';
  const defaultDesc = t.value?.update?.defaultNotes || '✨ 包含最新的功能增强、跨端连接优化及已知问题修复。';
  
  cleaned = cleaned.replace(/Full Changelog/gi, labelChangelog);
  cleaned = cleaned.replace(/What's Changed/gi, t.value?.update?.whatsChanged || '更新内容');
  cleaned = cleaned.replace(/Bug Fixes/gi, t.value?.update?.bugFixes || '问题修复');
  cleaned = cleaned.replace(/New Features/gi, t.value?.update?.newFeatures || '新功能');
  
  // If it's a generic commit comparison line (e.g. "Full Changelog: v4.0.4...v4.1.0"), prepend friendly localized description
  if (isGenericChangelog && cleaned.split('\n').length <= 2) {
    return `${defaultDesc}\n\n• ${cleaned}`;
  }
  
  return cleaned || defaultDesc;
});

const updateError = ref('');
const updateDownloading = ref(false);
const updateDownloadProgress = ref(0);
const updateReadyToInstall = ref(false);
const updateInstallerPath = ref('');
const isRestartingForUpdate = ref(false);

// Differential & Full update stats
const showUpdateConfirmModal = ref(false);
const showUpdateCompleteModal = ref(false);
const updateType = ref('full'); // 'differential' | 'full'
const updateTransferredMB = ref('0.00');
const updateTotalMB = ref('0.00');

// Toast notification
const toastVisible = ref(false);
const toastMessage = ref('');
const toastType = ref('info');
let toastTimer = null;
function showAppToast(msg, type = 'info', duration = 3500) {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  toastTimer = setTimeout(() => { toastVisible.value = false; }, duration);
}

async function checkAppUpdates(showToast = false) {
  if (updateStatus.value === 'checking') return;
  updateStatus.value = 'checking';
  updateError.value = '';
  updateDownloading.value = false;
  updateDownloadProgress.value = 0;
  updateReadyToInstall.value = false;
  
  try {
    const result = await window.api.checkForUpdates();
    currentVersion.value = result.currentVersion || '1.2.0';
    latestVersion.value = result.latestVersion || '';
    updateUrl.value = result.url || '';
    updateDownloadUrl.value = result.downloadUrl || '';
    updateNotes.value = result.body || '';
    
    if (result.error) {
      updateStatus.value = 'failed';
      updateError.value = result.error;
      if (showToast) showAppToast('检查更新失败: ' + result.error, 'error');
    } else if (result.available) {
      updateStatus.value = 'new-available';
      // Prompt user with interactive modal asking whether to upgrade!
      showUpdateConfirmModal.value = true;
    } else {
      updateStatus.value = 'up-to-date';
      if (showToast) showAppToast('已是最新版本 v' + currentVersion.value, 'success');
    }
  } catch (err) {
    updateStatus.value = 'failed';
    updateError.value = err.message || err;
    if (showToast) showAppToast('检查更新失败: ' + (err.message || err), 'error');
  }
}

async function confirmAndStartUpdate() {
  showUpdateConfirmModal.value = false;
  await startDownloadUpdate();
}

async function startDownloadUpdate() {
  if (!updateDownloadUrl.value || updateDownloading.value) return;
  updateDownloading.value = true;
  updateDownloadProgress.value = 0;
  
  // Register progress listener with detailed differential info
  window.api.onUpdateDownloadProgress((progressInfo) => {
    if (typeof progressInfo === 'object') {
      updateDownloadProgress.value = progressInfo.percent || 0;
      updateTransferredMB.value = progressInfo.transferredMB || '0.00';
      updateTotalMB.value = progressInfo.totalMB || '0.00';
      updateType.value = progressInfo.updateType || (progressInfo.isDifferential ? 'differential' : 'full');
    } else {
      updateDownloadProgress.value = progressInfo;
    }
  });
  
  try {
    const result = await window.api.startUpdateDownload(updateDownloadUrl.value);
    if (result.success) {
      updateInstallerPath.value = result.filePath;
      updateReadyToInstall.value = true;
      if (result.updateType) updateType.value = result.updateType;
      if (result.transferredMB) updateTransferredMB.value = result.transferredMB;
      if (result.totalMB) updateTotalMB.value = result.totalMB;
      
      // Open completed confirmation modal showing differential vs full stats!
      showUpdateCompleteModal.value = true;
    } else {
      alert('下载升级包失败: ' + result.error);
    }
  } catch (err) {
    alert('下载升级包发生错误: ' + (err.message || err));
  } finally {
    updateDownloading.value = false;
  }
}

async function installUpdate() {
  if (!updateInstallerPath.value || isRestartingForUpdate.value) return;
  isRestartingForUpdate.value = true;
  try {
    await window.api.installUpdate(updateInstallerPath.value);
  } catch (err) {
    isRestartingForUpdate.value = false;
    alert('安装失败: ' + (err.message || err));
  }
}

function openUpdateRelease() {
  if (updateUrl.value) {
    window.open(updateUrl.value, '_blank');
  } else {
    window.open('https://github.com/NovaMindLab/AIShare-Grabber/releases/latest', '_blank');
  }
}



const isImportingFolder = ref(false);

const isReclassifying = ref(false);
const reclassifyProgress = ref({ 
  done: 0, 
  total: 0, 
  currentName: '',
  singleMs: 0,
  avgMs: 0,
  elapsedMs: 0,
  remainingMs: 0,
  totalTimeMs: 0,
  isComplete: false
});
const reclassifyStats = ref({
  totalCount: 0,
  lastSingleMs: 0,
  avgMs: 0,
  totalTimeText: '',
  totalTimeMs: 0,
  completedAt: null
});
let reclassifyStartTime = 0;
const reclassifyElapsedTime = ref('0s');
const reclassifyRemainingTime = ref('计算中...');

function formatTimeDuration(ms) {
  if (isNaN(ms) || ms < 0) return '计算中...';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

async function handleReclassifyAllPhotos() {
  if (isReclassifying.value) return;
  isReclassifying.value = true;
  reclassifyProgress.value = { 
    done: 0, 
    total: 0, 
    currentName: '',
    singleMs: 0,
    avgMs: 0,
    elapsedMs: 0,
    remainingMs: 0,
    totalTimeMs: 0,
    isComplete: false
  };
  reclassifyStartTime = Date.now();
  reclassifyElapsedTime.value = '0.0s';
  logSyncEvent("🔄 开始对当前手机的所有图片重新做 AI 分析...");
  
  // Instantly clear old predictions so left sidebar category counts reset & update live!
  images.value.forEach(img => {
    img.predictions = [];
    img.status = 'processing';
  });
  
  try {
    const updatedResources = await window.api.reclassifyAllPhonePhotos();
    
    // Fully refresh the local image predictions
    images.value = updatedResources.map(res => ({
      id: res.id,
      path: res.path,
      name: res.name,
      size: res.size,
      src: `local:///${res.path.replace(/\\/g, '/')}`,
      status: 'completed',
      predictions: JSON.parse(res.predictions || '[]'),
      type: res.type,
      latitude: res.latitude,
      longitude: res.longitude
    }));
    
    logSyncEvent("🎉 数据库资源列表已完全同步更新。");
    await loadPersonClusters();
  } catch (err) {
    logSyncEvent(`❌ AI 重新分析失败: ${err.message}`);
    isReclassifying.value = false;
  }
}

async function handleImportLocalFolder() {
  if (!window.api || !window.api.openFolderDialog) return;
  
  const folderPath = await window.api.openFolderDialog();
  if (!folderPath) return;

  isImportingFolder.value = true;
  logSyncEvent(`📂 正在导入本地文件夹: ${folderPath}`);
  
  try {
    const result = await window.api.importLocalFolder(folderPath);
    
    if (!result || result.totalImages === 0) {
      alert(t.value?.images?.noImagesInFolder || `所选文件夹中未找到任何图片文件。\n支持格式: JPG, PNG, WEBP, BMP, GIF, HEIC, TIFF`);
      return;
    }

    // Populate the gallery with imported resources
    images.value = result.resources;
    thumbnailImages.value = result.resources;
    activeDeviceUuid.value = result.uuid;
    syncStatus.value = 'connected';
    
    logSyncEvent(`✅ 成功导入 ${result.totalImages} 张图片！来自: ${result.name}`);
    
    // Switch to images tab to show the gallery
    currentTab.value = 'images';
    
    // Remind user to run AI
    setTimeout(() => {
      alert((t.value?.images?.importSuccess || `🎉 成功导入 {total} 张图片！\n\n请点击左侧面板的【重新算 AI】按钮开始 AI 分类与人脸识别。`).replace('{total}', result.totalImages));
    }, 300);

  } catch (err) {
    logSyncEvent(`❌ 导入失败: ${err.message}`);
    alert(`导入失败: ${err.message}`);
  } finally {
    isImportingFolder.value = false;
  }
}

async function handleClearAndResync() {
  const isConnected = syncStatus.value === 'connected';
  const confirmMsg = isConnected
    ? (t.value?.modals?.clearCacheConfirmMsg || "确定要清空本地同步数据库及已下载的图片缓存，并请求手机重新传输全部图片重新计算吗？\n\n此操作将重置本地所有相册索引与 AI 特征缓存。")
    : (t.value?.modals?.clearCacheConfirmMsgNotConnected || "手机当前未连接。确定要清空本地已同步缓存记录吗？\n\n清空后，下次手机连接时将重新传输全部图片进行运算。");

  showConfirm({
    icon: '🗑️',
    title: t.value?.modals?.clearCacheTitle || '清空本地数据与缓存',
    message: confirmMsg,
    confirmText: t.value?.modals?.clearCacheConfirmBtn || '清空并重置',
    danger: true,
    onConfirm: async () => {
      logSyncEvent("🗑️ 正在清空本地数据库及图片缓存...");
      try {
        const success = await window.api.clearDeviceDatabase();
        if (success) {
          // 1. Reset frontend states
          images.value = [];
          thumbnailImages.value = [];
          chatMessages.value = [];
          queue.value = [];
          processedCount.value = 0;
          totalCount.value = 0;
          activeCount.value = 0;
          similarGroups.value = [];
          selectedDuplicateIds.value.clear();
          
          logSyncEvent("🗑️ 本地已清空。");

          // 2. If connected, notify phone to re-sync
          if (syncStatus.value === 'connected' && dataChannel) {
            logSyncEvent("📤 正在向手机发送重置指令，请求重新同步图片...");
            
            // Send type = -4 (handshake response) with empty synced_ids to update phone's synced list
            sendSafeDataChannelPacket(dataChannel, -4, {
              synced_ids: [],
              synced_thumbnail_ids: [],
              last_album_sync_date: ''
            });

            // Send type = -6 (request thumbnail sync to AI) to trigger phone auto sync with force_resync
            sendSafeDataChannelPacket(dataChannel, -6, {
              synced_thumbnail_ids: [],
              force_resync: true
            });

            logSyncEvent("🟢 已成功请求手机重新发送图片进行运算。");
          }
        } else {
          logSyncEvent("❌ 清空本地数据库失败，请检查数据库连接。");
        }
      } catch (err) {
        logSyncEvent(`❌ 清空并重置失败: ${err.message}`);
      }
    }
  });
}

async function handleClearPhoneCacheOnly() {
  const isConnected = syncStatus.value === 'connected';
  const deviceName = activeDeviceName.value || (t.value?.link?.currentPhone || '当前手机');
  const confirmMsg = isConnected
    ? (t.value?.link?.clearDeviceCacheConnectedMsg ? t.value.link.clearDeviceCacheConnectedMsg.replace('{deviceName}', deviceName) : `确定要清空手机 [${deviceName}] 在本电脑上的全部缩略图缓存、相册备份索引与 AI 特征数据库吗？\n\n清空后将重置该手机的已同步状态（不会立即重新下载），释放本地磁盘空间。`)
    : (t.value?.link?.clearDeviceCacheDisconnectedMsg || "确定要清空当前手机在本地的缓存与同步数据库记录吗？");

  showConfirm({
    icon: '🗑️',
    title: t.value.link?.clearPhoneCacheTitle || '清空当前手机缓存',
    message: confirmMsg,
    confirmText: t.value.link?.clearCacheConfirmBtn || '确认清空',
    danger: true,
    onConfirm: async () => {
      logSyncEvent(`🗑️ 正在清空设备 [${deviceName}] 的本地数据库与缓存文件...`);
      try {
        const success = await window.api.clearDeviceDatabase();
        if (success) {
          // 1. Reset frontend states
          images.value = [];
          thumbnailImages.value = [];
          albumBackupImages.value = [];
          chatMessages.value = [];
          queue.value = [];
          processedCount.value = 0;
          totalCount.value = 0;
          activeCount.value = 0;
          similarGroups.value = [];
          selectedDuplicateIds.value.clear();
          thumbSyncDone.value = 0;
          thumbSyncTotal.value = 0;
          albumSyncDone.value = 0;
          albumSyncTotal.value = 0;
          
          logSyncEvent(`✅ 设备 [${deviceName}] 本地缓存与数据库已彻底清空。`);

          // 2. If connected, inform phone that synced_ids and synced_thumbnail_ids are reset to []
          if (syncStatus.value === 'connected' && dataChannel && dataChannel.readyState === 'open') {
            try {
              sendSafeDataChannelPacket(dataChannel, -4, {
                synced_ids: [],
                synced_thumbnail_ids: [],
                last_album_sync_date: ''
              });
              logSyncEvent("📤 已通知手机端重置同步状态记录。");
            } catch (err) {
              console.error("Failed to notify phone of cache clear:", err);
            }
          }
        } else {
          logSyncEvent("⚠️ 清空设备缓存失败，请检查数据库连接。");
        }
      } catch (e) {
        console.error('[Database] Failed to clear device cache:', e);
        logSyncEvent(`❌ 清空缓存异常: ${e.message || e}`);
      }
    }
  });
}

const similarityThreshold = ref(85);
const isAnalyzingSimilar = ref(false);
const similarAnalysisProgress = ref({ done: 0, total: 0, currentName: '' });
const similarGroups = ref([]);
const selectedDuplicateIds = ref(new Set());
const isDeletingDuplicates = ref(false);
let similarStartTime = 0;
const similarElapsedTime = ref('0s');
const similarRemainingTime = ref('计算中...');

async function analyzeSimilarImages() {
  if (isAnalyzingSimilar.value) return;
  isAnalyzingSimilar.value = true;
  similarAnalysisProgress.value = { done: 0, total: 0, currentName: '' };
  similarGroups.value = [];
  selectedDuplicateIds.value.clear();
  similarStartTime = Date.now();
  similarElapsedTime.value = '0s';
  similarRemainingTime.value = '计算中...';

  try {
    // Collect only image resources (excluding other files).
    // ONLY copy serializable primitive values (id, name, path, size) to avoid Vue Proxy clone issues.
    const imageList = images.value
      .filter(img => {
        const ext = getExtensionName(img.name);
        return IMAGE_EXTENSIONS.includes(ext);
      })
      .map(img => ({
        id: img.id || img.path,
        name: img.name,
        path: img.path,
        size: img.size
      }));

    if (imageList.length === 0) {
      alert(t.value?.similar?.noImagesForSimilar || "⚠️ 无法计算相似图：未导入或同步任何图片。请先在‘图片’主界面导入本地文件夹，或在‘连接手机’界面同步手机图片。");
      isAnalyzingSimilar.value = false;
      return;
    }

    const thresholdVal = similarityThreshold.value / 100.0;
    
    if (!window.api || !window.api.getSimilarImagesGroups) {
      throw new Error("检测到新代码尚未加载生效。请完全退出桌面应用并重新运行 npm run dev 或重新启动以加载最新的底层 API 绑定。");
    }

    const groups = await window.api.getSimilarImagesGroups(imageList, thresholdVal);
    
    // Attach reactive src and predictions on the renderer side
    similarGroups.value = groups.map(group => ({
      images: group.images.map(img => {
        const originalImg = images.value.find(item => item.id === img.id || item.path === img.path);
        return {
          ...img,
          src: originalImg ? originalImg.src : `local:///${img.path.replace(/\\/g, '/')}`,
          predictions: originalImg ? originalImg.predictions : []
        };
      })
    }));

    logSyncEvent(`🎉 相似图片分析完成，检测到 ${groups.length} 组相似图片。`);
    if (groups.length === 0) {
      alert("💡 相似度比对完成！未在当前图片库中发现符合此阈值的相似图片。");
    }
  } catch (err) {
    alert(`❌ 相似图分析发生错误:\n${err.message}`);
    logSyncEvent(`❌ 相似图片分析失败: ${err.message}`);
  } finally {
    isAnalyzingSimilar.value = false;
  }
}

function toggleDuplicateSelection(id) {
  if (selectedDuplicateIds.value.has(id)) {
    selectedDuplicateIds.value.delete(id);
  } else {
    selectedDuplicateIds.value.add(id);
  }
  // Trigger reactivity by reassignment
  selectedDuplicateIds.value = new Set(selectedDuplicateIds.value);
}

function selectGroupDuplicatesExceptOne(group) {
  group.images.forEach((img, idx) => {
    const id = img.id || img.path;
    if (idx > 0) {
      selectedDuplicateIds.value.add(id);
    } else {
      selectedDuplicateIds.value.delete(id);
    }
  });
  selectedDuplicateIds.value = new Set(selectedDuplicateIds.value);
}

function deselectGroupAll(group) {
  group.images.forEach(img => {
    selectedDuplicateIds.value.delete(img.id || img.path);
  });
  selectedDuplicateIds.value = new Set(selectedDuplicateIds.value);
}

async function deleteSelectedDuplicates() {
  if (selectedDuplicateIds.value.size === 0 || isDeletingDuplicates.value) return;
  const count = selectedDuplicateIds.value.size;
  const isConnected = syncStatus.value === 'connected';

  const confirmMsg = isConnected 
    ? (t.value?.similar?.deleteConfirmConnected ? t.value.similar.deleteConfirmConnected.replace('{count}', count) : `确定要删除选中的 ${count} 张重复图片吗？\n\n此操作将同时从电脑磁盘和【手机相册】中物理删除原始文件，且不可撤销。`)
    : (t.value?.similar?.deleteConfirmDisconnected ? t.value.similar.deleteConfirmDisconnected.replace('{count}', count) : `确定要删除选中的 ${count} 张重复图片吗？\n\n此操作将从电脑磁盘中物理删除文件，并同步更新相册索引，且不可撤销。`);

  showConfirm({
    icon: '🗑️',
    title: t.value?.similar?.deleteConfirmTitle || '确认删除重复图片',
    message: confirmMsg,
    confirmText: t.value?.similar?.deleteConfirmBtn ? t.value.similar.deleteConfirmBtn.replace('{count}', count) : `确认删除 (${count})`,
    danger: true,
    onConfirm: async () => {
      isDeletingDuplicates.value = true;
      try {
        const filesToDelete = [];
        const deletedIds = new Set();
        selectedDuplicateIds.value.forEach(id => {
          const img = images.value.find(item => item.id === id || item.path === id);
          if (img) {
            filesToDelete.push({ id: img.id, path: img.path });
            deletedIds.add(img.id || img.path);
          }
        });

        const updatedResources = await window.api.deleteFiles(filesToDelete);

        // 📤 若手机在线，通过 WebRTC DataChannel 向手机发送 -12 删除请求，同步删除手机端相册原图
        if (syncStatus.value === 'connected' && dataChannel) {
          const mobileAssetIds = filesToDelete
            .filter(f => f.id && !f.id.startsWith('face_') && !f.id.startsWith('synced_'))
            .map(f => f.id);

          if (mobileAssetIds.length > 0) {
            try {
              const payloadStr = JSON.stringify({ asset_ids: mobileAssetIds });
              const encoder = new TextEncoder();
              const payloadBytes = encoder.encode(payloadStr);
              const packetBuffer = new ArrayBuffer(16 + payloadBytes.byteLength);
              const view = new DataView(packetBuffer);
              view.setInt32(0, -12, false); // file_id = -12 (Delete Assets Request)
              view.setInt32(4, 0, false);
              view.setInt32(8, 0, false);
              view.setInt32(12, payloadBytes.byteLength, false);
              const packetBytes = new Uint8Array(packetBuffer);
              packetBytes.set(payloadBytes, 16);
              dataChannel.send(packetBuffer);
              logSyncEvent(`📤 已向手机端发送同步删除 ${mobileAssetIds.length} 张照片指令。`);
            } catch (sendErr) {
              console.error("[Sync] Error sending delete packet to mobile:", sendErr);
            }
          }
        }

        // Refresh images list
        images.value = updatedResources.map(res => ({
          id: res.id,
          path: res.path,
          name: res.name,
          size: res.size,
          src: `local:///${res.path.replace(/\\/g, '/')}`,
          status: 'completed',
          predictions: JSON.parse(res.predictions || '[]'),
          type: res.type,
          latitude: res.latitude,
          longitude: res.longitude
        }));

        // Refresh count
        totalCount.value = images.value.length;
        
        // Clear selection
        selectedDuplicateIds.value.clear();
        
        // ⚡ 优化：局部响应式剪枝，无需重新进行数万张图片的全量比对与重绘
        const updatedGroups = [];
        for (const group of similarGroups.value) {
          const remainingImages = group.images.filter(img => {
            const id = img.id || img.path;
            return !deletedIds.has(id);
          });
          // 仅保留仍然存在 2 张及以上相似图的分组
          if (remainingImages.length >= 2) {
            updatedGroups.push({
              images: remainingImages
            });
          }
        }
        similarGroups.value = updatedGroups;
        
        logSyncEvent(`🎉 成功删除了 ${filesToDelete.length} 张重复图片，已同步清理 PC 缓存与手机相册。`);
      } catch (err) {
        logSyncEvent(`❌ 删除重复图片失败: ${err.message}`);
      } finally {
        isDeletingDuplicates.value = false;
      }
    }
  });
}

// Chat Window state & helpers
const chatMessages = ref([]);
const visibleChatMessages = computed(() => {
  // Virtual slice: keep only the last 100 transfer history rows in DOM to avoid browser lag and WebRTC dropouts
  return chatMessages.value.slice(-100);
});
const chatMessagesRef = ref(null);
const dragActive = ref(false);

async function scrollToBottom() {
  await nextTick();
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return '0 B';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return '🖼️';
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext)) return '🎥';
  if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext)) return '🎵';
  if (['pdf'].includes(ext)) return '📕';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (['xls', 'xlsx'].includes(ext)) return '📗';
  if (['zip', 'rar', '7z'].includes(ext)) return '📦';
  return '📄';
}

function onDragOver(e) {
  dragActive.value = true;
}

function onDragLeave(e) {
  dragActive.value = false;
}

async function handleDragDrop(event) {
  dragActive.value = false;
  const files = event.dataTransfer.files;
  if (!files || files.length === 0) return;

  const filePaths = [];
  for (let i = 0; i < files.length; i++) {
    if (files[i].path) {
      filePaths.push(files[i].path);
    }
  }

  if (filePaths.length > 0) {
    await sendFilesByPaths(filePaths);
  }
}

let peerConnection = null;
let dataChannel = null;
let heartbeatTimer = null;
let lastHeartbeatTime = 0;
let handshakeTimeoutTimer = null;
let disconnectGraceTimer = null;
const pendingDirectIceCandidates = [];
let hasGeneratedAnswer = false;
let isProcessingOffer = false;

function startHandshakeTimeout() {
  if (handshakeTimeoutTimer) clearTimeout(handshakeTimeoutTimer);
  handshakeTimeoutTimer = setTimeout(() => {
    if (syncStatus.value === 'handshaking') {
      logSyncEvent("⚠️ 连接协商超时：未能在 25 秒内建立 WebRTC 通道，正在重新广播...");
      handleWebRtcDisconnect();
    }
  }, 25000);
}

function clearHandshakeTimeout() {
  if (handshakeTimeoutTimer) {
    clearTimeout(handshakeTimeoutTimer);
    handshakeTimeoutTimer = null;
  }
}

function handleWebRtcDisconnect() {
  cleanupWebRtc();
  if (isSyncActive.value) {
    syncStatus.value = 'advertising';
    nextTick(() => {
      renderQrCode(qrPayload.value);
    });
  } else {
    syncStatus.value = 'idle';
  }
}

function setupPeerConnectionListeners(pc) {
  pc.onconnectionstatechange = () => {
    console.log(`[WebRTC] Connection State Changed: ${pc.connectionState}`);
    if (pc.connectionState === 'connected') {
      if (disconnectGraceTimer) {
        clearTimeout(disconnectGraceTimer);
        disconnectGraceTimer = null;
      }
    } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      logSyncEvent(`⚠️ WebRTC 连接断开或失败 (State: ${pc.connectionState})`);
      handleWebRtcDisconnect();
    } else if (pc.connectionState === 'disconnected') {
      if (!disconnectGraceTimer) {
        disconnectGraceTimer = setTimeout(() => {
          disconnectGraceTimer = null;
          if (peerConnection && (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed')) {
            logSyncEvent(`⚠️ WebRTC 连接超时断开 (State: ${peerConnection?.connectionState})`);
            handleWebRtcDisconnect();
          }
        }, 5000);
      }
    }
  };
  
  pc.oniceconnectionstatechange = () => {
    console.log(`[WebRTC] ICE Connection State Changed: ${pc.iceConnectionState}`);
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      if (disconnectGraceTimer) {
        clearTimeout(disconnectGraceTimer);
        disconnectGraceTimer = null;
      }
    } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
      logSyncEvent(`⚠️ ICE 连接断开或失败 (State: ${pc.iceConnectionState})`);
      handleWebRtcDisconnect();
    } else if (pc.iceConnectionState === 'disconnected') {
      if (!disconnectGraceTimer) {
        disconnectGraceTimer = setTimeout(() => {
          disconnectGraceTimer = null;
          if (peerConnection && (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed')) {
            logSyncEvent(`⚠️ ICE 连接超时断开 (State: ${peerConnection?.iceConnectionState})`);
            handleWebRtcDisconnect();
          }
        }, 5000);
      }
    }
  };
}

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
  connectionManager.cleanup();
  if (disconnectGraceTimer) {
    clearTimeout(disconnectGraceTimer);
    disconnectGraceTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (thumbnailSyncTimeoutTimer) {
    clearTimeout(thumbnailSyncTimeoutTimer);
    thumbnailSyncTimeoutTimer = null;
  }
  if (albumSyncTimeoutTimer) {
    clearTimeout(albumSyncTimeoutTimer);
    albumSyncTimeoutTimer = null;
  }
  clearHandshakeTimeout();
  if (dataChannel) {
    try { dataChannel.close(); } catch (e) {}
    dataChannel = null;
  }
  if (peerConnection) {
    try { peerConnection.close(); } catch (e) {}
    peerConnection = null;
  }
  activePeerIp.value = null;
  isThumbnailSyncing.value = false;
  isAlbumSyncing.value = false;
  isVideoSyncing.value = false;
  isAudioSyncing.value = false;
  chatMessages.value = [];
  // Retain activeDeviceUuid.value and activeDeviceName.value so offline viewing of downloaded videos,
  // audios, album photos, and person clusters continues seamlessly!
  activeDeviceSystemInfo.value = null;
  hasGeneratedAnswer = false;
  isProcessingOffer = false;
  pendingDirectIceCandidates.length = 0;
}

function requestThumbnailSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent("❌ WebRTC 直连通道未建立，无法发送同步请求");
    return;
  }
  
  logSyncEvent("🧠 正在发送 AI 缩略图批量同步请求到手机...");
  
  isThumbnailSyncing.value = true;
  const isCacheEmpty = thumbnailImages.value.length === 0;
  thumbSyncDone.value = isCacheEmpty ? 0 : thumbnailImages.value.length;
  thumbSyncTotal.value = isCacheEmpty ? 0 : thumbnailImages.value.length;

  // Send compact 16-byte -6 packet (never chunked, never dropped, instant reception)
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -6, false); // file_id = -6
  view.setInt32(4, 0, false);
  view.setInt32(8, isCacheEmpty ? -2 : 0, false); // -2 = force resync flag
  view.setInt32(12, 0, false);
  
  dataChannel.send(buffer);

  if (thumbnailSyncTimeoutTimer) clearTimeout(thumbnailSyncTimeoutTimer);
  thumbnailSyncTimeoutTimer = setTimeout(() => {
    if (isThumbnailSyncing.value && thumbSyncTotal.value === 0) {
      isThumbnailSyncing.value = false;
      logSyncEvent('ℹ️ 手机端相册尚未加载完成或暂无可同步图片，已自动重置状态');
    }
  }, 10000);
}

function handleOpenThumbnailFolder() {
  if (hasApi) {
    window.api.openThumbnailFolder();
  }
}

// ── Album Sync State & Functions ──────────────────────────────────────────
const isAlbumSyncing = ref(false);
const isAlbumSyncPaused = ref(false);
const albumSyncDone = ref(0);
const albumSyncTotal = ref(0);

function sendSafeDataChannelPacket(channel, packetType, payloadObj) {
  if (!channel || channel.readyState !== 'open') return;
  const jsonStr = JSON.stringify(payloadObj);
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(jsonStr);
  
  const CHUNK_SIZE = 16384; // 16 KB chunks to safely fit under WebRTC DataChannel MTU
  const totalLength = payloadBytes.byteLength;

  if (totalLength <= CHUNK_SIZE) {
    const buffer = new ArrayBuffer(16 + totalLength);
    const view = new DataView(buffer);
    view.setInt32(0, packetType, false);
    view.setInt32(4, 0, false);
    view.setInt32(8, 0, false);
    view.setInt32(12, totalLength, false);
    new Uint8Array(buffer, 16).set(payloadBytes);
    channel.send(buffer);
  } else {
    let offset = 0;
    let chunkIndex = 0;
    const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);
    
    while (offset < totalLength) {
      const end = Math.min(offset + CHUNK_SIZE, totalLength);
      const chunkBytes = payloadBytes.subarray(offset, end);
      
      const buffer = new ArrayBuffer(16 + chunkBytes.byteLength);
      const view = new DataView(buffer);
      view.setInt32(0, -5, false);         // -5 = Chunked Packet
      view.setInt32(4, packetType, false); // Real Packet Type = -4
      view.setInt32(8, chunkIndex, false);
      view.setInt32(12, totalChunks, false);
      new Uint8Array(buffer, 16).set(chunkBytes);
      
      channel.send(buffer);
      offset = end;
      chunkIndex++;
    }
  }
}

async function reSyncAlbum() {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent('❌ WebRTC 直连通道未建立，无法发送相册重新同步请求');
    return;
  }
  
  logSyncEvent('🔄 正在检查本地文件完整性，清理丢失文件记录...');
  if (hasApi) {
    try {
      const res = await window.api.cleanMissingResources();
      if (res && res.count > 0) {
        logSyncEvent(`🧹 已清理 ${res.count} 个失效的本地照片数据库记录`);
      } else {
        logSyncEvent('✨ 本地物理文件完整，未发现丢失的照片');
      }
      
      // Reload database sync info to get updated synced_ids
      const uuid = activeDeviceUuid.value;
      const name = activeDeviceName.value;
      const syncInfo = await window.api.initDeviceSync(uuid, name);
      
      // Update local images list in memory
      images.value = syncInfo.resources.map(res => ({
        id: res.id,
        path: res.path,
        name: res.name,
        size: res.size,
        src: `local:///${res.path.replace(/\\/g, '/')}`,
        status: 'completed',
        predictions: JSON.parse(res.predictions || '[]'),
        type: res.type,
        latitude: res.latitude,
        longitude: res.longitude
      }));

      // Send updated synced IDs to phone via a handshake response update (-4)
      const nonThumbSyncedIds = syncInfo.resources.filter(r => r.type !== 'thumbnail').map(r => r.id);
      const thumbSyncedIds = syncInfo.resources.filter(r => r.type === 'thumbnail').map(r => r.id);
      sendSafeDataChannelPacket(dataChannel, -4, { 
        synced_ids: nonThumbSyncedIds, 
        synced_thumbnail_ids: thumbSyncedIds,
        last_album_sync_date: syncInfo.lastAlbumSyncDate || '' 
      });
      
    } catch (e) {
      logSyncEvent(`⚠️ 检查文件完整性失败: ${e.message}`);
    }
  }

  logSyncEvent('📸 正在向手机发送全量重新同步命令(补漏模式)...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -11, false); // file_id = -11: request full scan re-sync (fill gaps)
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);

  isAlbumSyncing.value = true;
  isAlbumSyncPaused.value = false;
  albumSyncDone.value = 0;
  albumSyncTotal.value = 0;
}

function requestAlbumSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent('❌ WebRTC 直连通道未建立，无法发送相册同步请求');
    return;
  }
  
  if (isAlbumSyncing.value && isAlbumSyncPaused.value) {
    resumeAlbumSync();
    return;
  }

  logSyncEvent('📸 正在发送相册同步请求到手机...');

  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -7, false); // file_id = -7: request/resume album sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);

  isAlbumSyncing.value = true;
  isAlbumSyncPaused.value = false;
  albumSyncDone.value = 0;
  albumSyncTotal.value = 0;

  if (albumSyncTimeoutTimer) clearTimeout(albumSyncTimeoutTimer);
  albumSyncTimeoutTimer = setTimeout(() => {
    if (isAlbumSyncing.value && albumSyncTotal.value === 0 && albumSyncDone.value === 0) {
      isAlbumSyncing.value = false;
      logSyncEvent('ℹ️ 手机端未发现需同步的新相册照片，或手机端相册尚未就绪');
    }
  }, 8000);
}

function pauseAlbumSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('⏸️ 正在请求暂停相册同步...');
  
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -9, false); // file_id = -9: pause album sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  
  isAlbumSyncPaused.value = true;
}

function resumeAlbumSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('▶️ 正在请求恢复相册同步...');
  
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -7, false); // file_id = -7: resume/start album sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  
  isAlbumSyncPaused.value = false;
}

function stopAlbumSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('⏹️ 正在请求停止并取消相册同步...');
  
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -10, false); // file_id = -10: stop album sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  
  isAlbumSyncing.value = false;
  isAlbumSyncPaused.value = false;
}

function handleOpenAlbumSyncFolder() {
  if (hasApi) {
    window.api.openAlbumSyncFolder();
  }
}

// ── Video Sync Functions ──────────────────────────────────────────
let videoSyncTimeoutTimer = null;

function requestVideoSync(options = {}) {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent('❌ WebRTC 直连通道未建立，无法发送视频同步请求');
    return;
  }
  
  if (isVideoSyncing.value && isVideoSyncPaused.value) {
    resumeVideoSync();
    return;
  }

  const { forceFullScan = false, targetDate = null, targetIds = null } = options;
  logSyncEvent(`🎥 正在向手机发送视频同步请求 (日期: ${targetDate || '全部'}, 目标数: ${targetIds ? targetIds.length : '自动增量'})...`);

  sendSafeDataChannelPacket(dataChannel, -15, {
    force_full_scan: forceFullScan,
    target_date: targetDate,
    target_ids: targetIds
  });

  isVideoSyncing.value = true;
  isVideoSyncPaused.value = false;
  videoSyncDone.value = 0;
  videoSyncTotal.value = targetIds ? targetIds.length : (targetDate ? 1 : 0);

  if (videoSyncTimeoutTimer) clearTimeout(videoSyncTimeoutTimer);
  videoSyncTimeoutTimer = setTimeout(() => {
    if (isVideoSyncing.value && videoSyncTotal.value === 0 && videoSyncDone.value === 0) {
      isVideoSyncing.value = false;
      logSyncEvent('ℹ️ 手机端未发现需同步的新视频，或请确保手机端 ShareCLIP App 已更新到最新版本。');
    }
  }, 6000);
}

function queryRemoteVideoCatalog() {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent('❌ WebRTC 直连通道未建立，无法查询手机视频目录');
    return;
  }
  logSyncEvent('🔍 正在向手机查询远程视频目录与拍摄日期...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -19, false); // fileId = -19: query video catalog
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
}

function pauseVideoSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('⏸️ 正在向手机发送暂停视频同步指令...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -17, false); // fileId = -17: pause video sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  isVideoSyncPaused.value = true;
}

function resumeVideoSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('▶️ 正在向手机发送恢复视频同步指令...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -15, false);
  view.setInt32(4, 0, false);
  view.setInt32(8, videoSyncTotal.value, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  isVideoSyncPaused.value = false;
}

function stopVideoSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('⏹️ 正在向手机发送停止视频同步指令...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -18, false); // fileId = -18: stop video sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  isVideoSyncing.value = false;
  isVideoSyncPaused.value = false;
}

function openVideoPlayer(video) {
  const v = (video && video.value) ? video.value : video;
  if (hasApi && window.api?.openVideoWindow && v) {
    const filePath = v.path || v.fullPath || v.src || '';
    const title = v.name || v.title || '视频播放';
    const poster = v.thumbnail || v.poster || '';
    window.api.openVideoWindow({ filePath, title, poster });
    return;
  }
  activePlayingVideo.value = v;
}

function popOutVideoPlayer() {
  if (activePlayingVideo.value && window.api?.openVideoWindow) {
    const video = activePlayingVideo.value;
    window.api.openVideoWindow({
      filePath: video.path || video.fullPath || video.src || '',
      title: video.name || video.title || '视频播放',
      poster: video.thumbnail || video.poster || ''
    });
    closeVideoPlayer();
  }
}

function closeVideoPlayer() {
  activePlayingVideo.value = null;
}

// ── Audio Sync Functions ──────────────────────────────────────────
let audioSyncTimeoutTimer = null;

function requestAudioSync(options = {}) {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent('❌ WebRTC 直连通道未建立，无法发送音乐同步请求');
    return;
  }
  
  if (isAudioSyncing.value && isAudioSyncPaused.value) {
    resumeAudioSync();
    return;
  }

  const { forceFullScan = false, targetDate = null, targetIds = null } = options;
  logSyncEvent(`🎵 正在向手机发送音乐同步请求 (日期: ${targetDate || '全部'}, 目标数: ${targetIds ? targetIds.length : '自动增量'})...`);

  sendSafeDataChannelPacket(dataChannel, -21, {
    force_full_scan: forceFullScan,
    target_date: targetDate,
    target_ids: targetIds
  });

  isAudioSyncing.value = true;
  isAudioSyncPaused.value = false;
  audioSyncDone.value = 0;
  audioSyncTotal.value = targetIds ? targetIds.length : (targetDate ? 1 : 0);

  if (audioSyncTimeoutTimer) clearTimeout(audioSyncTimeoutTimer);
  audioSyncTimeoutTimer = setTimeout(() => {
    if (isAudioSyncing.value && audioSyncTotal.value === 0 && audioSyncDone.value === 0) {
      isAudioSyncing.value = false;
      logSyncEvent('ℹ️ 手机端未发现需同步的新音乐，或请确保手机端 ShareCLIP App 已更新到最新版本。');
    }
  }, 6000);
}

function queryRemoteAudioCatalog() {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent('❌ WebRTC 直连通道未建立，无法查询手机音乐目录');
    return;
  }
  logSyncEvent('🔍 正在向手机查询远程音乐目录...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -25, false); // fileId = -25: query audio catalog
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
}

function pauseAudioSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('⏸️ 正在向手机发送暂停音乐同步指令...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -23, false); // fileId = -23: pause audio sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  isAudioSyncPaused.value = true;
}

function resumeAudioSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('▶️ 正在向手机发送恢复音乐同步指令...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -21, false);
  view.setInt32(4, 0, false);
  view.setInt32(8, audioSyncTotal.value, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  isAudioSyncPaused.value = false;
}

function stopAudioSync() {
  if (!dataChannel || dataChannel.readyState !== 'open') return;
  logSyncEvent('⏹️ 正在向手机发送停止音乐同步指令...');
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setInt32(0, -24, false); // fileId = -24: stop audio sync
  view.setInt32(4, 0, false);
  view.setInt32(8, 0, false);
  view.setInt32(12, 0, false);
  dataChannel.send(buffer);
  isAudioSyncing.value = false;
  isAudioSyncPaused.value = false;
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
      let httpPort = 15186;
      try {
        httpPort = await window.api.getHttpSignalingPort();
      } catch (_) {}

      try {
        const payload = await window.api.startBleServer();
        payload.http_port = httpPort;
        let validIps = payload.pc_ips;
        if (!validIps || validIps.length === 0) {
          try {
            validIps = await window.api.getValidPhysicalIps();
            payload.pc_ips = validIps;
          } catch (_) {}
        }
        if (hotspotSsid.value && hotspotPassword.value) {
          payload.hotspotSsid = hotspotSsid.value;
          payload.hotspotPassword = hotspotPassword.value;
        }
        qrPayload.value = payload;
        syncStatus.value = 'advertising';
        logSyncEvent(`GATT 广播成功! MAC: ${payload.ble_mac}, Session: ${payload.session_id}, 直连IP: ${(payload.pc_ips || []).join(', ') || '局域网自动探测'}, HTTP Port: ${httpPort}`);
        await nextTick();
        renderQrCode(payload);
      } catch (err) {
        logSyncEvent(`⚠️ BLE GATT 广播受限: ${err.message || err}`);
        logSyncEvent('⚡ 自动降级为【高速局域网 Wi-Fi 直连模式】，生成直连二维码...');
        
        let localIps = [];
        let sessId = '1001';
        try {
          localIps = await window.api.getValidPhysicalIps();
        } catch (_) {}
        try {
          sessId = await window.api.getPcSessionId();
        } catch (_) {}

        const fallbackPayload = {
          ble_mac: '',
          service_uuid: '',
          char_uuid: '',
          session_id: sessId || '1001',
          pc_ips: localIps,
          http_port: httpPort,
          hotspotSsid: hotspotSsid.value || '',
          hotspotPassword: hotspotPassword.value || ''
        };
        qrPayload.value = fallbackPayload;
        syncStatus.value = 'advertising'; // Keep active to render QR code for mobile scanning
        logSyncEvent(`Wi-Fi 直连二维码已就绪! IP: ${localIps.join(', ') || '局域网自动探测'} (HTTP Port: ${httpPort})`);
        await nextTick();
        renderQrCode(fallbackPayload);
      }
    } else {
      // Mock Demo Web fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      qrPayload.value = { ble_mac: '90:09:DF:CB:0E:66', service_uuid: '6e400001', char_uuid: '6e400002', session_id: '9999' };
      syncStatus.value = 'advertising';
      logSyncEvent("Mock 模式: 蓝牙广播模拟中...");
      await nextTick();
      renderQrCode(qrPayload.value);
    }
  }
}

// UDP Direct Connect variables and computed
const discoveredDevicesList = ref([]);
const showEnterCodeModal = ref(false);
const showHowToConnectModal = ref(false);
const enteredCode = ref('');
const incomingConnectionRequest = ref(null);
const activePeerIp = ref(null);

const displayDevices = computed(() => {
  if (discoveredDevicesList.value.length > 0) {
    return discoveredDevicesList.value;
  }
  if (!hasApi) {
    // Only return mock data in web preview mode
    return [
      { uuid: 'mock-1', name: 'Galaxy S24 Ultra', ip: '192.168.1.105', type: 'Mobile', isMock: true },
      { uuid: 'mock-2', name: 'Xiaomi 14 Pro', ip: '192.168.1.106', type: 'Mobile', isMock: true },
      { uuid: 'mock-3', name: 'OnePlus 12', ip: '192.168.1.107', type: 'Mobile', isMock: true }
    ];
  }
  return [];
});

async function connectToDevice(ip) {
  connectingIp.value = ip;
  logSyncEvent(`📡 [UDP] 发送连接请求到 ${ip}...`);
  await window.api.sendUdpConnectRequest(ip);
  setTimeout(() => { if (connectingIp.value === ip) connectingIp.value = null; }, 15000);
}

async function handleRespondToRequest(accept) {
  if (!incomingConnectionRequest.value) return;
  const { ip, name } = incomingConnectionRequest.value;
  logSyncEvent(`📡 [UDP] ${accept ? '同意' : '拒绝'} 来自 ${name} (${ip}) 的连接请求`);
  
  await window.api.respondToConnectionRequest(ip, accept);
  incomingConnectionRequest.value = null;

  if (accept) {
    activePeerIp.value = ip;
    syncStatus.value = 'handshaking';
    startHandshakeTimeout();
    cleanupWebRtc();

    const configuration = { iceServers: [] };
    peerConnection = new RTCPeerConnection(configuration);
    setupPeerConnectionListeners(peerConnection);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        window.api.sendUdpIce(ip, JSON.stringify(event.candidate));
      }
    };

    dataChannel = peerConnection.createDataChannel('photo_sync');
    setupDataChannel(dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    window.api.sendUdpSdp(ip, offer.sdp, 'offer');
  }
}

function refreshDevices() {
  logSyncEvent("🔄 [UDP] 正在扫描本地局域网附近设备...");
  discoveredDevicesList.value = [];
}

async function submitConnectionCode() {
  if (!enteredCode.value) return;
  const target = enteredCode.value.trim();
  showEnterCodeModal.value = false;
  
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipRegex.test(target)) {
    await connectToDevice(target);
  } else {
    const found = displayDevices.value.find(d => d.sessionId === target || d.uuid.includes(target));
    if (found && !found.isMock) {
      await connectToDevice(found.ip);
    } else {
      logSyncEvent(`⚠️ 未能在发现列表中找到配对码 ${target}，尝试作为 IP 直接连接...`);
      logSyncEvent("❌ 配对失败，未找到该设备。");
    }
  }
  enteredCode.value = '';
}

// Set up the WebRTC DataChannel callbacks
function setupDataChannel(channel) {
  dataChannel = channel;
  channel.binaryType = 'arraybuffer';
  logSyncEvent("[DataChannel] setupDataChannel invoked, channel readyState: " + channel.readyState);
  
  const handleOpen = () => {
    if (syncStatus.value === 'connected') return;
    logSyncEvent("🟢 WebRTC 数据通道 'photo_sync' 已开启! 连接成功");
    syncStatus.value = 'connected';
    activePeerType.value = 'Mobile';
    if (!activeDeviceName.value) {
      activeDeviceName.value = 'Android Device';
    }
    clearHandshakeTimeout();
    trackEvent('webrtc_channel_opened', { method: 'qr_ble' });
    
    // Auto-fetch remote video & audio catalog list (metadata only, no auto download)
    setTimeout(() => {
      queryRemoteVideoCatalog();
      queryRemoteAudioCatalog();
    }, 500);
    
    // Start heartbeat timer: proactively send Ping every 3 seconds to keep DataChannel alive
    lastHeartbeatTime = Date.now();
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (channel && channel.readyState === 'open') {
        const pingHeader = new ArrayBuffer(16);
        const view = new DataView(pingHeader);
        view.setInt32(0, -1, false);
        view.setInt32(4, 0, false);
        view.setInt32(8, 0, false);
        view.setInt32(12, 0, false);
        try {
          channel.send(pingHeader);
        } catch (_) {}
      }
    }, 3000);
  };

  if (channel.readyState === 'open') {
    handleOpen();
  } else {
    channel.onopen = handleOpen;
    // Safety fallback
    setTimeout(() => {
      if (channel.readyState === 'open' && syncStatus.value !== 'connected') {
        logSyncEvent("[DataChannel] Fallback: channel is open but onopen didn't fire");
        handleOpen();
      }
    }, 2000);
  }
  
  channel.onclose = () => {
    logSyncEvent("🔴 WebRTC 数据通道已关闭。");
    if (isSyncActive.value) {
      syncStatus.value = 'advertising';
      cleanupWebRtc();
      nextTick(() => {
        renderQrCode(qrPayload.value);
      });
    }
  };
  
  channel.onmessage = (event) => {
    if (syncStatus.value !== 'connected') {
      logSyncEvent("⚠️ DataChannel 收到消息但未标记为 connected，强制进入已连接状态！");
      handleOpen();
    }

    // 任何数据包（无论是心跳还是真实文件）都意味着连接存活
    lastHeartbeatTime = Date.now();
    
    const arrayBuffer = event.data;
    if (arrayBuffer.byteLength < 16) {
      logSyncEvent("⚠️ 收到异常数据包: 头部小于16字节");
      return;
    }
    
    const view = new DataView(arrayBuffer);
    const fileId = view.getInt32(0, false);
    
    // Heartbeat check: fileId === -1 is Ping from Android
    if (fileId === -1) {
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
      
      activeDeviceName.value = deviceName;
      if (handshake.system_info) {
        activeDeviceSystemInfo.value = handshake.system_info;
      }
      
      logSyncEvent(`📱 收到手机握手请求: [${deviceName}] (${deviceUuid})`);
      
      if (hasApi) {
        window.api.initDeviceSync(deviceUuid, deviceName).then((syncInfo) => {
          activeDeviceUuid.value = deviceUuid;
          
          // Populate images.value with both original files AND thumbnails so they can be browsed and searched in the main gallery
          images.value = syncInfo.resources
            .map(res => ({
              id: res.id,
              path: res.path,
              name: res.name,
              size: res.size,
              src: `local:///${res.path.replace(/\\/g, '/')}`,
              status: 'completed',
              predictions: JSON.parse(res.predictions || '[]'),
              type: res.type,
              latitude: res.latitude,
              longitude: res.longitude
            }));

          // Load previously synced AI thumbnails
          thumbnailImages.value = syncInfo.resources
            .filter(res => res.type === 'thumbnail')
            .map(res => ({
              src: `local:///${res.path.replace(/\\/g, '/')}`,
              name: res.name,
              path: res.path,
              predictions: JSON.parse(res.predictions || '[]')
            }));

          // Map historical assets into chat messages (exclude AI thumbnails and album sync photos)
          chatMessages.value = syncInfo.resources
            .filter(res => res.type !== 'thumbnail' && res.type !== 'album_photo')
            .map(res => ({
              id: res.id,
              type: 'incoming',
              name: res.name,
              size: res.size || 0,
              progress: 1,
              status: 'completed',
              time: res.sync_time ? new Date(res.sync_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '历史记录',
              isImage: /\.(jpg|jpeg|png|gif|webp)$/i.test(res.name),
              src: `local:///${res.path.replace(/\\/g, '/')}`,
              predictions: JSON.parse(res.predictions || '[]')
            }));
          scrollToBottom();
          
          logSyncEvent(`📊 本地数据库同步成功，已恢复 ${images.value.length} 个历史传输资源，${thumbnailImages.value.length} 个 AI 缩略图，发送握手回应包...`);
          
          const nonThumbSyncedIds = syncInfo.resources.filter(r => r.type !== 'thumbnail').map(r => r.id);
          const thumbSyncedIds = syncInfo.resources.filter(r => r.type === 'thumbnail').map(r => r.id);
          sendSafeDataChannelPacket(channel, -4, { 
            synced_ids: nonThumbSyncedIds, 
            synced_thumbnail_ids: thumbSyncedIds,
            last_album_sync_date: syncInfo.lastAlbumSyncDate || '' 
          });
        }).catch((err) => {
          logSyncEvent(`⚠️ 初始化设备数据库失败: ${err?.message || err}，向手机补发保底握手确认包...`);
          activeDeviceUuid.value = deviceUuid;
          sendSafeDataChannelPacket(channel, -4, { 
            synced_ids: [], 
            synced_thumbnail_ids: [],
            last_album_sync_date: '' 
          });
        });
      } else {
        activeDeviceUuid.value = deviceUuid;
        sendSafeDataChannelPacket(channel, -4, { 
          synced_ids: [], 
          synced_thumbnail_ids: [],
          last_album_sync_date: '' 
        });
      }
      return;
    }

    // fileId = -7: Phone started or resumed album sync, tells PC the total count
    if (fileId === -7) {
      if (albumSyncTimeoutTimer) { clearTimeout(albumSyncTimeoutTimer); albumSyncTimeoutTimer = null; }
      const totalCount = view.getInt32(8, false);
      albumSyncTotal.value = totalCount;
      isAlbumSyncing.value = true;
      isAlbumSyncPaused.value = false;
      logSyncEvent(`📸 手机开始/恢复相册同步，共 ${totalCount} 张原图将传输到PC`);
      return;
    }

    // fileId = -8: Phone finished album sync
    if (fileId === -8) {
      if (albumSyncTimeoutTimer) { clearTimeout(albumSyncTimeoutTimer); albumSyncTimeoutTimer = null; }
      const done = view.getInt32(4, false);
      const total = view.getInt32(8, false);
      isAlbumSyncing.value = false;
      isAlbumSyncPaused.value = false;
      albumSyncDone.value = done;
      albumSyncTotal.value = total;
      logSyncEvent(`✅ 相册同步完成！共同步 ${done}/${total} 张原图到PC`);
      return;
    }

    // fileId = -9: Phone paused album sync
    if (fileId === -9) {
      isAlbumSyncPaused.value = true;
      logSyncEvent(`⏸️ 手机端已暂停相册同步`);
      return;
    }

    // fileId = -10: Phone stopped album sync
    if (fileId === -10) {
      isAlbumSyncing.value = false;
      isAlbumSyncPaused.value = false;
      logSyncEvent(`⏹️ 手机端已停止并取消相册同步`);
      return;
    }

    // fileId = -15: Phone started or resumed video sync
    if (fileId === -15) {
      if (videoSyncTimeoutTimer) { clearTimeout(videoSyncTimeoutTimer); videoSyncTimeoutTimer = null; }
      const totalCount = view.getInt32(8, false);
      videoSyncTotal.value = totalCount;
      isVideoSyncing.value = true;
      isVideoSyncPaused.value = false;
      logSyncEvent(`🎥 手机开始/恢复视频同步，共 ${totalCount} 个视频将传输到PC`);
      return;
    }

    // fileId = -16: Phone video sync progress or finish
    if (fileId === -16) {
      if (videoSyncTimeoutTimer) { clearTimeout(videoSyncTimeoutTimer); videoSyncTimeoutTimer = null; }
      const done = view.getInt32(4, false);
      const total = view.getInt32(8, false);
      const isFinished = view.getInt32(12, false) === 1;
      videoSyncDone.value = done;
      videoSyncTotal.value = total;
      if (isFinished || (total > 0 && done >= total)) {
        isVideoSyncing.value = false;
        isVideoSyncPaused.value = false;
        logSyncEvent(`✅ 视频同步完成！共同步 ${done}/${total} 个视频到PC`);
      }
      return;
    }

    // fileId = -17: Phone paused video sync
    if (fileId === -17) {
      isVideoSyncPaused.value = true;
      logSyncEvent(`⏸️ 手机端已暂停视频同步`);
      return;
    }

    // fileId = -18: Phone stopped video sync
    if (fileId === -18) {
      isVideoSyncing.value = false;
      isVideoSyncPaused.value = false;
      logSyncEvent(`⏹️ 手机端已停止并取消视频同步`);
      return;
    }

    // fileId = -19: Remote video catalog response (supports single packet and multi-chunk packet)
    if (fileId === -19) {
      const chunkIndex = view.getInt32(4, false);
      const totalChunks = view.getInt32(8, false);
      const payloadSize = view.getInt32(12, false);
      const payloadBytes = new Uint8Array(arrayBuffer, 16, payloadSize);
      const decoder = new TextDecoder('utf-8');
      const payloadStr = decoder.decode(payloadBytes);
      try {
        const data = JSON.parse(payloadStr);
        const incomingVideos = data.videos || [];
        
        // Use Map to preserve all existing videos and merge/update properties (thumb, size, duration)
        const catalogMap = new Map(remoteVideoCatalog.value.map(v => [v.id, v]));
        for (const inv of incomingVideos) {
          if (catalogMap.has(inv.id)) {
            Object.assign(catalogMap.get(inv.id), inv);
          } else {
            catalogMap.set(inv.id, inv);
          }
        }
        remoteVideoCatalog.value = Array.from(catalogMap.values());
        logSyncEvent(`📋 收到手机端视频目录 [${chunkIndex + 1}/${Math.max(totalChunks, 1)}]，共发现 ${remoteVideoCatalog.value.length} 个视频`);
      } catch (err) {
        console.error("Failed to parse video catalog:", err);
      }
      return;
    }

    // fileId = -22: Phone finished audio sync
    if (fileId === -22) {
      isAudioSyncing.value = false;
      isAudioSyncPaused.value = false;
      logSyncEvent(`✅ 手机端已完成音乐同步传输`);
      return;
    }

    // fileId = -23: Phone paused audio sync
    if (fileId === -23) {
      isAudioSyncPaused.value = true;
      logSyncEvent(`⏸️ 手机端已暂停音乐同步`);
      return;
    }

    // fileId = -24: Phone stopped audio sync
    if (fileId === -24) {
      isAudioSyncing.value = false;
      isAudioSyncPaused.value = false;
      logSyncEvent(`⏹️ 手机端已停止并取消音乐同步`);
      return;
    }

    // fileId = -25: Remote audio catalog response (supports single packet and multi-chunk packet)
    if (fileId === -25) {
      const chunkIndex = view.getInt32(4, false);
      const totalChunks = view.getInt32(8, false);
      const payloadSize = view.getInt32(12, false);
      const payloadBytes = new Uint8Array(arrayBuffer, 16, payloadSize);
      const decoder = new TextDecoder('utf-8');
      const payloadStr = decoder.decode(payloadBytes);
      try {
        const data = JSON.parse(payloadStr);
        const incomingAudios = data.audios || [];
        
        const catalogMap = new Map(remoteAudioCatalog.value.map(a => [a.id, a]));
        for (const ina of incomingAudios) {
          if (catalogMap.has(ina.id)) {
            Object.assign(catalogMap.get(ina.id), ina);
          } else {
            catalogMap.set(ina.id, ina);
          }
        }
        remoteAudioCatalog.value = Array.from(catalogMap.values());
        logSyncEvent(`📋 收到手机端音乐目录 [${chunkIndex + 1}/${Math.max(totalChunks, 1)}]，共发现 ${remoteAudioCatalog.value.length} 首音乐`);
      } catch (err) {
        console.error("Failed to parse audio catalog:", err);
      }
      return;
    }

    // Metadata packet containing filename and asset ID
    if (fileId === -6) {
      if (thumbnailSyncTimeoutTimer) {
        clearTimeout(thumbnailSyncTimeoutTimer);
        thumbnailSyncTimeoutTimer = null;
      }
      const totalCount = view.getInt32(8, false);
      // totalCount === -1 is a completion sentinel sent by Android
      if (totalCount === -1) {
        if (thumbSyncTotal.value > 0) {
          thumbSyncDone.value = thumbSyncTotal.value;
        }
        isThumbnailSyncing.value = false;
        logSyncEvent(`✅ 收到手机端 AI 同步完成信号，已全部同步完成并释放互斥锁`);
        return;
      }
      if (totalCount === 0) {
        isThumbnailSyncing.value = false;
        logSyncEvent(`ℹ️ 手机相册中暂无可同步的图片`);
        return;
      }
      thumbSyncTotal.value = totalCount;
      thumbSyncDone.value = Math.min(thumbnailImages.value.length, totalCount);
      isThumbnailSyncing.value = true;
      logSyncEvent(`🧠 收到手机端 AI 缩略图同步开始通知，共 ${totalCount} 张图片，本地已缓存 ${thumbSyncDone.value} 张`);
      return;
    }

    if (fileId === -5) {
      const payloadSize = view.getInt32(12, false);
      const payloadBytes = new Uint8Array(arrayBuffer, 16, payloadSize);
      const decoder = new TextDecoder('utf-8');
      const payloadStr = decoder.decode(payloadBytes);
      try {
        const metadata = JSON.parse(payloadStr);
        
        activeMetadata[metadata.file_id] = {
          assetId: metadata.asset_id,
          name: metadata.name,
          size: metadata.size,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          create_date: metadata.create_date || null,
          duration: metadata.duration || null
        };

        // Add to chatMessages only for regular files (not thumbnails, album originals, videos, or audios)
        const isThumb = metadata.name.startsWith('thumb_');
        const isAlbum = metadata.name.startsWith('album_') || (isAlbumSyncing.value && !isThumb);
        const isVid = metadata.name.startsWith('video_') || /\.(mp4|mkv|mov|avi|webm)$/i.test(metadata.name);
        const isAud = metadata.name.startsWith('audio_') || /\.(mp3|wav|m4a|ogg|flac|aac|wma)$/i.test(metadata.name);
        if (!isThumb && !isAlbum && !isVid && !isAud && !chatMessages.value.some(m => m.id === metadata.file_id)) {
          chatMessages.value.push({
            id: metadata.file_id,
            type: 'incoming',
            name: metadata.name,
            size: metadata.size,
            progress: 0,
            status: 'transferring',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isImage: /\.(jpg|jpeg|png|gif|webp)$/i.test(metadata.name),
            src: ''
          });
          scrollToBottom();
        }

        // Update album sync counter when album metadata arrives
        if (isAlbum) {
          albumSyncDone.value++;
        }
        
        logSyncEvent(`📝 收到文件元数据: [ID: ${metadata.file_id}] ${metadata.name} (${(metadata.size / 1024 / 1024).toFixed(2)} MB)`);
      } catch (err) {
        console.error("Failed to parse incoming file metadata (-5 packet):", err);
      }
      return;
    }
    
    const chunkIndex = view.getInt32(4, false);
    const totalChunks = view.getInt32(8, false);
    const payloadSize = view.getInt32(12, false);
    
    // Update incoming progress state
    const isThumb = activeMetadata[fileId] && activeMetadata[fileId].name.startsWith('thumb_');
    if (!isThumb) {
      incomingTransfer.value = {
        progress: (chunkIndex + 1) / totalChunks,
        name: activeMetadata[fileId] ? activeMetadata[fileId].name : `文件 ID ${fileId}`
      };

      // Update chatMessage progress
      const msg = chatMessages.value.find(m => m.id === fileId);
      if (msg) {
        msg.progress = (chunkIndex + 1) / totalChunks;
        if (msg.progress >= 1) {
          msg.status = 'processing';
        }
      }
    }

    // Accumulate chunks in the renderer process to avoid flooding Electron IPC queue and causing OOM crashes
    if (!window.activeIncomingTransfers) {
      window.activeIncomingTransfers = {};
    }
    
    if (!window.activeIncomingTransfers[fileId]) {
      window.activeIncomingTransfers[fileId] = {
        chunks: new Array(totalChunks),
        received: 0,
        total: totalChunks
      };
    }
    
    const transfer = window.activeIncomingTransfers[fileId];
    // Copy the payload bytes so the original arrayBuffer can be garbage collected safely
    const chunkData = new Uint8Array(payloadSize);
    chunkData.set(new Uint8Array(arrayBuffer, 16, payloadSize));
    
    if (!transfer.chunks[chunkIndex]) {
      transfer.chunks[chunkIndex] = chunkData;
      transfer.received++;
    }
    
    if (chunkIndex === 0 || chunkIndex === Math.floor(totalChunks / 2)) {
      logSyncEvent(`📥 正在接收: ${Math.round(((chunkIndex + 1) / totalChunks) * 100)}% (文件ID: ${fileId})`);
    }
    
    if (transfer.received === transfer.total) {
      // Reassemble the full file in renderer process
      let totalBytes = 0;
      for (let i = 0; i < transfer.total; i++) {
        if (transfer.chunks[i]) {
          totalBytes += transfer.chunks[i].length;
        }
      }
      
      const fullBuffer = new Uint8Array(totalBytes);
      let offset = 0;
      for (let i = 0; i < transfer.total; i++) {
        if (transfer.chunks[i]) {
          fullBuffer.set(transfer.chunks[i], offset);
          offset += transfer.chunks[i].length;
        }
      }
      
      delete window.activeIncomingTransfers[fileId];
      
      // Send the completed file to the main process in one single IPC call!
      if (hasApi) {
        window.api.saveFullPhoto(fileId, fullBuffer, activeMetadata[fileId]);
      }
    }
  };
}

// YT-DLP Download & Task Management Handlers
const getYtMediaSrc = (thumb) => {
  if (!thumb) return '';
  if (thumb.startsWith('http://') || thumb.startsWith('https://') || thumb.startsWith('data:')) {
    return thumb;
  }
  if (thumb.startsWith('local://')) return thumb;
  let cleanPath = thumb.replace(/^file:\/\/\/?/i, '');
  cleanPath = cleanPath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `local:///${encodeURI(cleanPath)}`;
};

const onThumbnailError = (event, item) => {
  if (!event || !event.target) return;
  if (item && item.webThumbnail && event.target.src !== item.webThumbnail) {
    event.target.src = item.webThumbnail;
    return;
  }
  if (item && item.url && !event.target.dataset.triedYt) {
    event.target.dataset.triedYt = 'true';
    const match = item.url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (match && match[1]) {
      event.target.src = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
      return;
    }
  }
  event.target.style.display = 'none';
};

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function extractVideoUrl(text) {
  if (!text) return '';
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : text.trim();
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      ytUrl.value = extractVideoUrl(text);
    }
  } catch (e) {
    console.warn('Failed to read clipboard:', e);
  }
};

const parseYtVideo = async () => {
  if (!ytUrl.value || ytParsing.value) return;

  const cleanUrl = extractVideoUrl(ytUrl.value);
  if (cleanUrl !== ytUrl.value) {
    ytUrl.value = cleanUrl;
  }

  ytParsing.value = true;
  ytParseError.value = '';
  ytProgress.value = { status: '正在探测与分析视频流地址及元数据...', progress: 0 };
  ytVideoInfo.value = null;
  ytSelectedResolution.value = null;

  try {
    const res = await window.api.getYtVideoInfo(cleanUrl);
    if (res && res.success) {
      ytVideoInfo.value = res;
      // Default to recommended resolution or first resolution
      if (res.resolutions && res.resolutions.length > 0) {
        ytSelectedResolution.value = res.resolutions.find(r => r.isRecommended || r.recommended) || res.resolutions[0];
      }
      ytProgress.value = null;
    } else {
      ytParseError.value = (res && res.error) ? res.error : '解析失败，请检查视频链接或网络连接';
      ytProgress.value = null;
    }
  } catch (err) {
    ytParseError.value = err.message || '解析请求出现异常';
    ytProgress.value = null;
  } finally {
    ytParsing.value = false;
  }
};

const openSnifferBrowser = async (url) => {
  if (!window.api?.openSnifferBrowser) return;
  try {
    await window.api.openSnifferBrowser({
      url: url || snifferWindowStatus.value.url || 'https://m.youtube.com',
      lang: currentLocale.value
    });
    snifferWindowStatus.value.isOpen = true;
    if (url) snifferWindowStatus.value.url = url;
  } catch (e) {
    console.error('Failed to open sniffer browser:', e);
  }
};

const openSnifferWithMoreSites = async () => {
  if (!window.api?.openSnifferBrowser) return;
  try {
    await window.api.openSnifferBrowser({
      url: snifferWindowStatus.value.url || 'https://m.youtube.com',
      lang: currentLocale.value,
      openMoreSites: true
    });
    snifferWindowStatus.value.isOpen = true;
  } catch (e) {
    console.error('Failed to open sniffer browser with more sites:', e);
  }
};

const switchYtModeToBrowser = async () => {
  ytMode.value = 'browser';
  if (!snifferWindowStatus.value.isOpen) {
    await openSnifferBrowser();
  } else {
    await focusSnifferBrowser();
  }
};

const focusSnifferBrowser = async () => {
  if (window.api?.focusSnifferBrowser) {
    await window.api.focusSnifferBrowser();
  }
};

const closeSnifferBrowser = async () => {
  if (window.api?.closeSnifferBrowser) {
    await window.api.closeSnifferBrowser();
    snifferWindowStatus.value.isOpen = false;
  }
};

const parseSnifferCurrentUrl = () => {
  if (snifferWindowStatus.value.url) {
    ytUrl.value = snifferWindowStatus.value.url;
    ytMode.value = 'link';
    parseYtVideo();
  }
};

const ytDownloadVideoDirect = async (targetUrl, targetTitle, targetResolution = null, videoMeta = null) => {
  if (!targetUrl) return;
  const cleanUrl = extractVideoUrl(targetUrl);
  ytUrl.value = cleanUrl;

  // 1. Direct download when resolution was already selected in sniffer window
  if (targetResolution) {
    const taskId = `yt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTask = {
      id: taskId,
      url: cleanUrl,
      title: targetTitle || videoMeta?.title || '正在下载网络视频...',
      thumbnail: videoMeta?.thumbnail || '',
      duration: videoMeta?.duration || 0,
      resolution: targetResolution.label || targetResolution.id || '1080p',
      progress: 0,
      status: '正在连接下载节点...',
      size: targetResolution.filesize > 0 ? formatFileSize(targetResolution.filesize) : '',
      speed: '',
      eta: '',
      error: null
    };
    ytActiveTasks.value.unshift(newTask);
    ytSubTab.value = 'downloading';

    try {
      const res = await window.api.downloadYtVideo({
        taskId,
        url: cleanUrl,
        extractor: String(videoMeta?.extractor || ''),
        resolution: {
          id: targetResolution.id,
          label: targetResolution.label,
          formatSpec: targetResolution.formatSpec,
          filesize: targetResolution.filesize,
          type: targetResolution.type,
          height: targetResolution.height
        },
        title: String(newTask.title || ''),
        thumbnail: String(newTask.thumbnail || ''),
        duration: Number(newTask.duration || 0),
        info: videoMeta || null
      });

      if (res && res.success) {
        ytActiveTasks.value = ytActiveTasks.value.filter(t => t.id !== taskId);
        await loadYtHistory();
      } else {
        const errMsg = (res && res.error) ? res.error : '下载未能正常完成';
        const task = ytActiveTasks.value.find(t => t.id === taskId);
        if (task) {
          task.status = `❌ 下载失败: ${errMsg}`;
          task.error = errMsg;
        }
      }
    } catch (err) {
      const task = ytActiveTasks.value.find(t => t.id === taskId);
      if (task) {
        task.status = `❌ 异常: ${err.message || err}`;
        task.error = err.message || String(err);
      }
    }
    return;
  }

  // 2. Fallback when resolution is not yet selected: parse and let user choose resolution (do NOT auto-download)
  try {
    const res = await window.api.getYtVideoInfo(cleanUrl);
    if (res && res.success) {
      ytVideoInfo.value = res;
      if (res.resolutions && res.resolutions.length > 0) {
        ytSelectedResolution.value = res.resolutions.find(r => r.isRecommended || r.recommended) || res.resolutions[0];
      }
      ytSubTab.value = 'parse';
      showAppToast(t.value?.ytDlp?.selectQualityDesc || '视频已解析完成，请在下方选择目标清晰度后点击下载', 'info', 4000);
      return;
    } else {
      ytSubTab.value = 'parse';
      ytParseError.value = res?.error || '无法解析视频清晰度，请检查链接或网络后重试。';
      showAppToast('视频解析失败，请检查链接', 'error', 4000);
      return;
    }
  } catch (e) {
    console.warn('Direct parse failed:', e);
    ytSubTab.value = 'parse';
    ytParseError.value = `解析异常: ${e.message || e}`;
    showAppToast(`解析失败: ${e.message || e}`, 'error', 4000);
    return;
  }
};

const parseCurrentWebview = () => parseSnifferCurrentUrl();
const goBackWebview = () => {};
const goForwardWebview = () => {};
const reloadWebview = () => {};

const startYtDownload = async () => {
  if (!ytUrl.value || !ytVideoInfo.value) return;

  // Auto fallback to first resolution if not selected
  if (!ytSelectedResolution.value && ytVideoInfo.value?.resolutions?.length > 0) {
    ytSelectedResolution.value = ytVideoInfo.value.resolutions[0];
  }
  if (!ytSelectedResolution.value) return;

  const taskId = `yt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const resolution = ytSelectedResolution.value;
  const videoInfo = ytVideoInfo.value;

  const newTask = {
    id: taskId,
    url: ytUrl.value.trim(),
    title: videoInfo.title || 'Video',
    thumbnail: videoInfo.thumbnail || '',
    duration: videoInfo.duration || 0,
    resolution: resolution.label || '1080p',
    progress: 0,
    status: '正在连接下载节点...',
    size: resolution.filesize > 0 ? formatFileSize(resolution.filesize) : '',
    speed: '',
    eta: '',
    error: null
  };

  ytActiveTasks.value.unshift(newTask);
  // Auto switch to downloading tab to give instant visual feedback
  ytSubTab.value = 'downloading';

  // Sanitize payload to pure POJO to prevent Vue reactive Proxy clone errors across Electron IPC
  const cleanPayload = {
    taskId,
    url: newTask.url,
    extractor: String(videoInfo.extractor || ''),
    resolution: {
      id: resolution.id,
      label: resolution.label,
      formatSpec: resolution.formatSpec,
      filesize: resolution.filesize,
      type: resolution.type,
      height: resolution.height
    },
    title: String(newTask.title || ''),
    thumbnail: String(newTask.thumbnail || ''),
    duration: Number(newTask.duration || 0)
  };

  try {
    const res = await window.api.downloadYtVideo(cleanPayload);

    if (res && res.success) {
      ytActiveTasks.value = ytActiveTasks.value.filter(t => t.id !== taskId);
      await loadYtHistory();
    } else {
      const errMsg = (res && res.error) ? res.error : '下载未能正常完成';
      console.error('Download error:', errMsg);
      const task = ytActiveTasks.value.find(t => t.id === taskId);
      if (task) {
        task.status = `❌ 下载失败: ${errMsg}`;
        task.error = errMsg;
      }
    }
  } catch (err) {
    console.error('Download exception:', err);
    const task = ytActiveTasks.value.find(t => t.id === taskId);
    if (task) {
      task.status = `❌ 异常: ${err.message || err}`;
      task.error = err.message || String(err);
    }
  }
};

const cancelYtTask = async (taskId) => {
  try {
    await window.api.cancelYtDownload(taskId);
  } catch (e) {
    console.warn('Failed to cancel task:', e);
  }
  ytActiveTasks.value = ytActiveTasks.value.filter(t => t.id !== taskId);
};

const loadYtHistory = async () => {
  if (!window.api?.getYtHistory) return;
  try {
    const history = await window.api.getYtHistory();
    if (Array.isArray(history)) {
      ytHistory.value = history;
    }
  } catch (e) {
    console.warn('Failed to load yt history:', e);
  }
};

const deleteYtHistoryItem = async (id) => {
  if (!window.api?.deleteYtHistory) return;
  try {
    const res = await window.api.deleteYtHistory(id, false);
    if (res && res.success && res.history) {
      ytHistory.value = res.history;
    } else {
      ytHistory.value = ytHistory.value.filter(h => h.id !== id);
    }
  } catch (e) {
    console.warn('Failed to delete yt history:', e);
  }
};

const clearAllYtHistory = async () => {
  for (const item of [...ytHistory.value]) {
    await deleteYtHistoryItem(item.id);
  }
  ytHistory.value = [];
};

const openYtFile = async (filePath) => {
  if (!filePath) return;
  if (hasApi && window.api?.openVideoWindow) {
    const item = ytHistory.value.find(h => h.filePath === filePath);
    const title = item?.title || filePath.split(/[\\/]/).pop();
    const poster = item?.thumbnail || '';
    window.api.openVideoWindow({ filePath, title, poster });
    return;
  }
  if (window.api?.openYtVideoFile) {
    await window.api.openYtVideoFile(filePath);
  }
};

const openYtFolder = async (filePath) => {
  if (!window.api?.openYtVideoFolder) return;
  await window.api.openYtVideoFolder(filePath);
};

const sendYtVideoToPhone = async (item) => {
  if (!item || !item.filePath) {
    showAppToast('视频文件路径不存在', 'error', 3000);
    return;
  }
  if (syncStatus.value !== 'connected' || !dataChannel || dataChannel.readyState !== 'open') {
    showAppToast(t.value?.link?.tipText || '手机当前未连接，请先在左侧连接手机', 'warning', 3500);
    return;
  }
  try {
    showAppToast(`${t.value?.ytDlp?.sendingToPhone || '正在向手机发送视频:'} ${item.title || '视频'}`, 'info', 3000);
    await sendFilesByPaths([item.filePath]);
  } catch (err) {
    console.error('Failed to send video to phone:', err);
    showAppToast(`发送失败: ${err.message || err}`, 'error', 4000);
  }
};

const changeYtCookieMode = async (mode) => {
  if (!window.api?.ytSetCookieMode) return;
  if (ytCookieSyncing.value) return;

  if (mode === 'none') {
    try {
      const res = await window.api.ytSetCookieMode('none');
      if (res && res.success) {
        ytCookieConfig.value = res.config;
        showAppToast('已关闭 YouTube 登录同步', 'info');
      }
    } catch (e) {}
    showYtCookieMenu.value = false;
    return;
  }

  try {
    ytCookieSyncing.value = true;
    ytSyncStatusText.value = `正在从 ${mode.toUpperCase()} 同步凭据...`;
    
    const res = await window.api.ytSetCookieMode(mode);
    ytCookieSyncing.value = false;

    if (res && res.success) {
      ytCookieConfig.value = res.config;
      showAppToast(res.message || `🎉 成功同步 ${mode.toUpperCase()} 登录态！已激活高清画质`, 'success', 4000);
      showYtCookieMenu.value = false;
      if (ytWebviewRef.value) {
        try { ytWebviewRef.value.reload(); } catch (e) {}
      }
    } else {
      const msg = res?.message || '同步凭据失败';
      if (res?.code === 'LOCKED' && mode === 'chrome') {
        const confirmEdge = confirm(`${msg}\n\n是否立即尝试使用【Microsoft Edge】一键免密同步？`);
        if (confirmEdge) {
          await changeYtCookieMode('edge');
          return;
        }
      } else {
        alert(msg);
      }
    }
  } catch (e) {
    ytCookieSyncing.value = false;
    console.error('Failed to set cookie mode:', e);
    alert('同步失败: ' + (e.message || e));
  }
};

const importYtCookiesFile = async () => {
  if (!window.api?.ytImportCookiesFile) return;
  try {
    showYtCookieMenu.value = false;
    const res = await window.api.ytImportCookiesFile();
    if (res && res.success) {
      ytCookieConfig.value = res.config;
      showAppToast(res.message || '🎉 成功导入 cookies.txt 凭据！', 'success', 4000);
      if (ytWebviewRef.value) {
        try { ytWebviewRef.value.reload(); } catch (e) {}
      }
    } else if (res && res.message && !res.message.includes('取消')) {
      alert(res.message);
    }
  } catch (e) {
    alert('导入失败: ' + (e.message || e));
  }
};

const openYtLoginWindow = async () => {
  if (!window.api?.ytOpenLoginWindow) return;
  try {
    showYtCookieMenu.value = false;
    showAppToast('正在打开登录窗口，建议优先使用 Edge 一键免密秒同步', 'info', 4500);
    await window.api.ytOpenLoginWindow();
  } catch (e) {
    console.error('Failed to open login window:', e);
  }
};

const clearYtCookies = async () => {
  if (!window.api?.ytClearCookies) return;
  try {
    const res = await window.api.ytClearCookies();
    if (res && res.success) {
      ytCookieConfig.value = res.config;
      showAppToast('已退出登录并清除所有凭据', 'info', 3000);
      if (ytWebviewRef.value) {
        try { ytWebviewRef.value.reload(); } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Failed to clear cookies:', e);
  }
};

const handleCookieMenuClickOutside = (event) => {
  if (showYtCookieMenu.value && ytCookieWrapperRef.value && !ytCookieWrapperRef.value.contains(event.target)) {
    showYtCookieMenu.value = false;
  }
};

const getResBadgeStyle = (res) => {
  const s = String(res || '').toLowerCase();
  if (s.includes('4k') || s.includes('2160')) return 'background: rgba(234, 179, 8, 0.18); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.35);';
  if (s.includes('2k') || s.includes('1440') || s.includes('1080')) return 'background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.35);';
  if (s.includes('mp3') || s.includes('audio') || s.includes('音频')) return 'background: rgba(34, 197, 94, 0.18); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.35);';
  return 'background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35);';
};

const getPlatformBadge = (itemOrUrl) => {
  if (!itemOrUrl) return null;
  let url = '';
  let title = '';
  if (typeof itemOrUrl === 'string') {
    url = itemOrUrl;
  } else if (typeof itemOrUrl === 'object') {
    url = itemOrUrl.url || itemOrUrl.webpage_url || itemOrUrl.sourceUrl || itemOrUrl.webThumbnail || '';
    title = itemOrUrl.title || itemOrUrl.name || '';
  }
  const extractor = (typeof itemOrUrl === 'object' && itemOrUrl?.extractor) ? itemOrUrl.extractor : '';
  const target = `${url} ${title} ${extractor}`.toLowerCase();

  let badge = null;
  if (target.includes('bilibili.com') || target.includes('b23.tv') || target.includes('b站') || target.includes('bilibili')) {
    badge = { name: 'Bilibili', icon: '📺', color: '#fb7299', bg: 'rgba(251, 114, 153, 0.15)', border: 'rgba(251, 114, 153, 0.35)' };
  } else if (target.includes('youtube.com') || target.includes('youtu.be') || target.includes('油管')) {
    badge = { name: 'YouTube', icon: '▶️', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)' };
  } else if (target.includes('douyin.com') || target.includes('iesdouyin.com') || target.includes('tiktok.com') || target.includes('抖音')) {
    badge = { name: '抖音 / TikTok', icon: '🎵', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.15)', border: 'rgba(34, 211, 238, 0.35)' };
  } else if (target.includes('kuaishou.com') || target.includes('gifshow.com') || target.includes('chenzhongtech.com') || target.includes('快手')) {
    badge = { name: '快手', icon: '⚡', color: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.35)' };
  } else if (target.includes('twitter.com') || target.includes('x.com') || target.includes('t.co')) {
    badge = { name: 'Twitter / X', icon: '𝕏', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)' };
  } else if (target.includes('xiaohongshu.com') || target.includes('xhslink.com') || target.includes('小红书')) {
    badge = { name: '小红书', icon: '📕', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.35)' };
  } else if (target.includes('weibo.com') || target.includes('weibo.cn') || target.includes('微博')) {
    badge = { name: '微博', icon: '👁️', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' };
  } else if (target.includes('instagram.com')) {
    badge = { name: 'Instagram', icon: '📷', color: '#e879f9', bg: 'rgba(232, 121, 249, 0.15)', border: 'rgba(232, 121, 249, 0.35)' };
  } else if (target.includes('facebook.com') || target.includes('fb.watch')) {
    badge = { name: 'Facebook', icon: '🌐', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.35)' };
  } else if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    badge = { name: '网络视频', icon: '🌐', color: '#a5b4fc', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.35)' };
  }
  
  if (badge) {
    badge.style = `background: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border};`;
  }
  return badge;
};

const formatItemTime = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch (e) { return ''; }
};

// Categorization and Filtering for Completed Downloads
const ytCategoryMode = ref(localStorage.getItem('shareclip_yt_cat_mode') || 'time'); // 'time' | 'source'
const ytSelectedTimeFilter = ref('all');
const ytSelectedSourceFilter = ref('all');

const setYtCategoryMode = (mode) => {
  ytCategoryMode.value = mode;
  try {
    localStorage.setItem('shareclip_yt_cat_mode', mode);
  } catch (_) {}
  ytSelectedTimeFilter.value = 'all';
  ytSelectedSourceFilter.value = 'all';
};

const setCategoryFilter = (key) => {
  if (ytCategoryMode.value === 'time') {
    ytSelectedTimeFilter.value = key;
  } else {
    ytSelectedSourceFilter.value = key;
  }
};

const isCategoryFilterActive = (key) => {
  if (ytCategoryMode.value === 'time') {
    return ytSelectedTimeFilter.value === key;
  }
  return ytSelectedSourceFilter.value === key;
};

// Extract calendar day key: YYYY-MM-DD
const getItemDayKey = (completedAt) => {
  if (!completedAt) return 'earlier';
  try {
    const d = new Date(completedAt);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (_) {
    return 'earlier';
  }
};

// Formats friendly day display name
const formatDayGroupName = (dayKey) => {
  if (dayKey === 'earlier') {
    return { name: t.value?.ytDlp?.timeEarlier || '更早', pillName: t.value?.ytDlp?.timeEarlier || '更早', icon: '📦' };
  }
  try {
    const parts = dayKey.split('-').map(Number);
    const itemYear = parts[0];
    const itemMonth = parts[1];
    const itemDay = parts[2];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(itemYear, itemMonth - 1, itemDay);
    
    const diffDays = Math.round((today - targetDate) / (1000 * 3600 * 24));
    
    if (diffDays === 0) {
      const todayText = t.value?.ytDlp?.timeToday || '今天';
      return { 
        name: `${todayText} · ${itemMonth}月${itemDay}日`, 
        pillName: `${todayText} (${itemMonth}/${itemDay})`, 
        icon: '📅' 
      };
    } else if (diffDays === 1) {
      const yesterdayText = t.value?.ytDlp?.timeYesterday || '昨天';
      return { 
        name: `${yesterdayText} · ${itemMonth}月${itemDay}日`, 
        pillName: `${yesterdayText} (${itemMonth}/${itemDay})`, 
        icon: '🕒' 
      };
    } else if (itemYear === now.getFullYear()) {
      return { 
        name: `${itemMonth}月${itemDay}日`, 
        pillName: `${itemMonth}月${itemDay}日`, 
        icon: '📅' 
      };
    } else {
      return { 
        name: `${itemYear}年${itemMonth}月${itemDay}日`, 
        pillName: `${itemYear}/${itemMonth}/${itemDay}`, 
        icon: '📅' 
      };
    }
  } catch (_) {
    return { name: dayKey, pillName: dayKey, icon: '📅' };
  }
};

const timeCategoryGroups = computed(() => {
  const map = new Map();
  
  for (const item of (ytHistory.value || [])) {
    const dayKey = getItemDayKey(item.completedAt);
    if (!map.has(dayKey)) {
      map.set(dayKey, []);
    }
    map.get(dayKey).push(item);
  }
  
  // Sort date keys descending: latest day first
  const sortedKeys = Array.from(map.keys()).sort((a, b) => {
    if (a === 'earlier') return 1;
    if (b === 'earlier') return -1;
    return b.localeCompare(a);
  });
  
  const groups = [];
  for (const dayKey of sortedKeys) {
    const items = map.get(dayKey) || [];
    items.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    
    const info = formatDayGroupName(dayKey);
    groups.push({
      key: dayKey,
      name: info.name,
      pillName: info.pillName,
      icon: info.icon,
      items
    });
  }
  return groups;
});

const sourceCategoryGroups = computed(() => {
  const map = new Map();
  for (const item of (ytHistory.value || [])) {
    const badge = getPlatformBadge(item);
    const key = badge?.name || '其他网页';
    const icon = badge?.icon || '🌐';
    if (!map.has(key)) {
      map.set(key, { key, name: key, icon, items: [] });
    }
    map.get(key).items.push(item);
  }
  return Array.from(map.values());
});

const currentCategoryPills = computed(() => {
  if (ytCategoryMode.value === 'time') {
    const pills = [
      { key: 'all', name: t.value?.ytDlp?.allCategories || '全部', icon: '✨', count: (ytHistory.value || []).length }
    ];
    for (const g of timeCategoryGroups.value) {
      pills.push({ key: g.key, name: g.pillName || g.name, icon: g.icon, count: g.items.length });
    }
    return pills;
  } else {
    const pills = [
      { key: 'all', name: t.value?.ytDlp?.allCategories || '全部', icon: '✨', count: (ytHistory.value || []).length }
    ];
    for (const g of sourceCategoryGroups.value) {
      pills.push({ key: g.key, name: g.name, icon: g.icon, count: g.items.length });
    }
    return pills;
  }
});

const displayedCategoryGroups = computed(() => {
  const allGroups = ytCategoryMode.value === 'time' ? timeCategoryGroups.value : sourceCategoryGroups.value;
  const currentFilter = ytCategoryMode.value === 'time' ? ytSelectedTimeFilter.value : ytSelectedSourceFilter.value;
  
  if (currentFilter === 'all') {
    return allGroups;
  }
  return allGroups.filter(g => g.key === currentFilter);
});

const formatSimpleResolution = (res) => {
  if (!res) return '1080p';
  const s = String(res).toLowerCase();
  if (s.includes('4k') || s.includes('2160')) return '4K';
  if (s.includes('2k') || s.includes('1440')) return '2K';
  if (s.includes('1080')) return '1080p';
  if (s.includes('720')) return '720p';
  if (s.includes('480')) return '480p';
  if (s.includes('360')) return '360p';
  if (s.includes('240')) return '240p';
  if (s.includes('144')) return '144p';
  if (s.includes('mp3') || s.includes('audio') || s.includes('音频')) return 'MP3';
  const match = s.match(/\b\d{3,4}p\b/);
  if (match) return match[0];
  if (res.length <= 6) return res;
  return 'HD';
};

// Register listeners on mount
onMounted(() => {
  initAnalytics();
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('click', handleCookieMenuClickOutside);
  // Auto-start hotspot and BLE sync on PC startup
  // toggleHotspot();

  if (hasApi) {
    // Load saved download path from main process settings
    window.api.getDownloadPath().then(savedPath => {
      if (savedPath) downloadPath.value = savedPath;
    });

    // Load saved preventSleep setting
    if (window.api.getPreventSleep) {
      window.api.getPreventSleep().then(enabled => {
        if (typeof enabled === 'boolean') {
          preventSleep.value = enabled;
        }
      });
    }

    // Automatically load the offline device database on PC startup
    if (window.api && window.api.loadInitialDeviceSync) {
      window.api.loadInitialDeviceSync().then((syncInfo) => {
        if (syncInfo && syncInfo.resources && syncInfo.resources.length > 0) {
          console.log(`[Offline Sync] Loaded ${syncInfo.resources.length} resources for device: ${syncInfo.deviceUuid}`);
          if (syncInfo.deviceUuid && !activeDeviceUuid.value) {
            activeDeviceUuid.value = syncInfo.deviceUuid;
            activeDeviceName.value = syncInfo.deviceName || '离线设备相册';
          }
          // Populate images.value with all resources
          images.value = syncInfo.resources.map(res => ({
            id: res.id,
            path: res.path,
            name: res.name,
            size: res.size,
            duration: res.duration,
            create_date: res.create_date,
            src: `local:///${res.path.replace(/\\/g, '/')}`,
            status: 'completed',
            predictions: typeof res.predictions === 'string' ? JSON.parse(res.predictions || '[]') : (res.predictions || []),
            type: res.type,
            latitude: res.latitude,
            longitude: res.longitude
          }));

          thumbnailImages.value = syncInfo.resources
            .filter(res => res.type === 'thumbnail')
            .map(res => ({
              src: `local:///${res.path.replace(/\\/g, '/')}`,
              name: res.name,
              path: res.path,
              predictions: typeof res.predictions === 'string' ? JSON.parse(res.predictions || '[]') : (res.predictions || [])
            }));

          loadPersonClusters();
        }
      }).catch(err => {
        console.warn('[Offline Sync] Failed to load initial offline device sync:', err);
      });
    }

    // Check for updates in the background on startup
    checkAppUpdates();

    // Load YT-DLP history
    loadYtHistory();

    // Load YouTube Cookie & Login config
    if (window.api.ytGetCookieConfig) {
      window.api.ytGetCookieConfig().then(cfg => {
        if (cfg) ytCookieConfig.value = cfg;
      });
    }

    if (window.api.onYtLoginSuccess) {
      window.api.onYtLoginSuccess((cfg) => {
        if (cfg) ytCookieConfig.value = cfg;
        showAppToast('🎉 YouTube 登录凭据已生效，嗅探浏览器已自动刷新！', 'success', 3500);
        if (ytWebviewRef.value) {
          try { ytWebviewRef.value.reload(); } catch (e) {}
        }
      });
    }

    watch(ytWebviewRef, (wv) => {
      if (!wv) return;
      try {
        wv.addEventListener('will-navigate', (e) => {
          if (e.url && (e.url.includes('accounts.google.com') || e.url.includes('ServiceLogin'))) {
            showAppToast('💡 Google 限制在内嵌网页中输入密码，请在右上角【🔐 登录同步】一键同步 Edge/Chrome 登录态！', 'info', 5000);
            showYtCookieMenu.value = true;
          }
        });
      } catch (e) {}
    });

    // Standalone Sniffer Window status listener
    if (window.api?.onSnifferWindowStatus) {
      window.api.onSnifferWindowStatus((status) => {
        if (status) {
          snifferWindowStatus.value = {
            isOpen: !!status.isOpen,
            url: status.url || snifferWindowStatus.value.url,
            title: status.title || snifferWindowStatus.value.title
          };
        }
      });
    }

    // Remote download enqueue listener from standalone sniffer window
    if (window.api?.onRemoteEnqueueDownload) {
      window.api.onRemoteEnqueueDownload((data) => {
        if (data && data.url) {
          console.log('[App] Remote enqueue download requested:', data);
          const resLabel = data.resolution?.label ? ` (${data.resolution.label})` : '';
          showAppToast(`🚀 已接收独立嗅探窗口指令${resLabel}，正在拉取: ${data.title || data.url}`, 'info', 3500);
          ytDownloadVideoDirect(data.url, data.title, data.resolution, data.videoInfo || data);
        }
      });
    }

    // YT-DLP progress listener
    window.api.onYtProgress((data) => {
      if (data && data.taskId) {
        const task = ytActiveTasks.value.find(t => t.id === data.taskId);
        if (task) {
          if (data.progress !== undefined) task.progress = data.progress;
          if (data.status) task.status = data.status;
          if (data.size) task.size = data.size;
          if (data.speed) task.speed = data.speed;
          if (data.eta) task.eta = data.eta;
        }
        if (data.status === 'Completed' && data.record) {
          ytActiveTasks.value = ytActiveTasks.value.filter(t => t.id !== data.taskId);
          loadYtHistory();
        }
      } else {
        ytProgress.value = data;
      }
    });

    // Decoupled background AI queue progress listener
    if (window.api.onAiQueueProgress) {
      window.api.onAiQueueProgress((data) => {
        const total = data.total || 0;
        const completed = data.completed || 0;
        const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
        aiQueueProgress.value = {
          isProcessing: data.isProcessing && data.remaining > 0,
          total,
          completed,
          remaining: data.remaining || 0,
          percent
        };
      });
    }

    // Live single photo prediction update listener during reclassify & background AI queue
    if (window.api.onSinglePhotoPredictionsUpdated) {
      window.api.onSinglePhotoPredictionsUpdated((data) => {
        // Support both single object (legacy) and batched array (optimized)
        const items = Array.isArray(data) ? data : (data ? [data] : []);
        if (items.length === 0) return;

        // Build Map for O(1) lookup by id
        const updateMap = new Map();
        for (const item of items) {
          if (item.id) updateMap.set(String(item.id), item.predictions || []);
        }

        // Single pass over images array — O(n) instead of O(n × batch)
        for (let i = 0; i < images.value.length; i++) {
          const img = images.value[i];
          const preds = updateMap.get(String(img.id));
          if (preds !== undefined) {
            images.value.splice(i, 1, { ...img, predictions: preds, status: 'completed' });
            updateMap.delete(String(img.id));
            if (updateMap.size === 0) break;
          }
        }
      });
    }

    // Main-process driven heartbeat keepalive listener: ensures pings are transmitted even when renderer is heavily loaded
    if (window.api.onSendHeartbeatPing) {
      window.api.onSendHeartbeatPing(() => {
        if (dataChannel && dataChannel.readyState === 'open') {
          try {
            const pingHeader = new ArrayBuffer(16);
            const view = new DataView(pingHeader);
            view.setInt32(0, -1, false);
            view.setInt32(4, 0, false);
            view.setInt32(8, 0, false);
            view.setInt32(12, 0, false);
            dataChannel.send(pingHeader);
          } catch (_) {}
        }
      });
    }

    // 1. Offer SDP received from mobile client
    window.api.onOfferReceived(async (offerSdp) => {
      logSyncEvent("📡 蓝牙信令通道收到 WebRTC Offer SDP!");
      syncStatus.value = 'handshaking';
      startHandshakeTimeout();
      
      const savedIceCandidates = [...pendingDirectIceCandidates];
      cleanupWebRtc();
      pendingDirectIceCandidates.push(...savedIceCandidates);
      
      const configuration = {
        iceServers: []
      };
      
      peerConnection = new RTCPeerConnection(configuration);
      setupPeerConnectionListeners(peerConnection);
      
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

      peerConnection.ondatachannel = (event) => {
        logSyncEvent("[UDP] 监听到直连数据通道创建请求: " + event.channel.label);
            if (event.channel.label === 'photo_sync') {
          dataChannel = event.channel;
          setupDataChannel(dataChannel);
        }

          peerConnection.onconnectionstatechange = () => {
            logSyncEvent("[WebRTC] 连接状态: " + peerConnection.connectionState);
          };
          peerConnection.oniceconnectionstatechange = () => {
            logSyncEvent("[WebRTC] ICE状态: " + peerConnection.iceConnectionState);
          };
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
    });
    
    // 2. ICE Candidate received from mobile client
    window.api.onRemoteIceReceived((data) => {
      if (peerConnection) {
        logSyncEvent("📡 注入远端 ICE Candidate...");
        if (syncStatus.value === 'handshaking') {
          startHandshakeTimeout();
        }
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
        activePeerType.value = 'Mobile';
        if (syncStatus.value !== 'connected') {
          syncStatus.value = 'handshaking';
          startHandshakeTimeout();
        }
      } else if (status === 'disconnected') {
        if (syncStatus.value !== 'connected') {
          cleanupWebRtc();
          if (isSyncActive.value) {
            syncStatus.value = 'advertising';
            nextTick(() => {
              renderQrCode(qrPayload.value);
            });
          }
        } else {
          logSyncEvent("📡 蓝牙信令通道断开，但 WebRTC 直连通道依然活跃 (BLE disconnected, keeping WebRTC open)");
        }
      }
    });


    
    window.api.onPhotoSynced((imageInfo) => {
      const isAudio = imageInfo.type === 'audio' || imageInfo.type === 'audios' || /\.(mp3|wav|m4a|ogg|flac|aac|wma|opus)$/i.test(imageInfo.name);
      if (isAudio) {
        if (isAudioSyncing.value) {
          audioSyncDone.value++;
          if (audioSyncTotal.value > 0 && audioSyncDone.value >= audioSyncTotal.value) {
            isAudioSyncing.value = false;
          }
        }
        logSyncEvent(`🎉 音乐已成功同步并归档: ${imageInfo.name}`);
        const targetId = imageInfo.id || imageInfo.assetId;
        if (targetId && selectedAudioIds.value.has(targetId)) {
          const newSet = new Set(selectedAudioIds.value);
          newSet.delete(targetId);
          selectedAudioIds.value = newSet;
        }
        const existingIdx = images.value.findIndex(item => item.id === imageInfo.id || item.path === imageInfo.path || item.name === imageInfo.name);
        if (existingIdx >= 0) {
          images.value[existingIdx] = {
            ...images.value[existingIdx],
            ...imageInfo,
            status: 'completed',
            type: 'audio'
          };
        } else {
          images.value.push({
            id: imageInfo.id || imageInfo.assetId,
            path: imageInfo.path,
            name: imageInfo.name,
            size: imageInfo.size,
            duration: imageInfo.duration,
            create_date: imageInfo.create_date,
            src: imageInfo.src,
            status: 'completed',
            type: 'audio'
          });
        }
        return;
      }

      const isVideo = imageInfo.type === 'video' || /\.(mp4|mkv|mov|avi|webm)$/i.test(imageInfo.name);
      if (isVideo) {
        if (isVideoSyncing.value) {
          videoSyncDone.value++;
          if (videoSyncTotal.value > 0 && videoSyncDone.value >= videoSyncTotal.value) {
            isVideoSyncing.value = false;
          }
        }
        logSyncEvent(`🎉 视频已成功同步并归档: ${imageInfo.name}`);
        const targetId = imageInfo.id || imageInfo.assetId;
        if (targetId && selectedVideoIds.value.has(targetId)) {
          const newSet = new Set(selectedVideoIds.value);
          newSet.delete(targetId);
          selectedVideoIds.value = newSet;
        }
        const existingIdx = images.value.findIndex(item => item.id === imageInfo.id || item.path === imageInfo.path || item.name === imageInfo.name);
        if (existingIdx >= 0) {
          images.value[existingIdx] = {
            ...images.value[existingIdx],
            ...imageInfo,
            status: 'completed',
            type: 'video'
          };
        } else {
          images.value.push({
            id: imageInfo.id || imageInfo.assetId,
            path: imageInfo.path,
            name: imageInfo.name,
            size: imageInfo.size,
            duration: imageInfo.duration,
            create_date: imageInfo.create_date,
            src: imageInfo.src,
            status: 'completed',
            type: 'video'
          });
        }
        return;
      }

      const isAlbum = imageInfo.name.startsWith('album_') || imageInfo.type === 'album_photo';
      if (isAlbum) {
        logSyncEvent(`🎉 相册原图已同步: ${imageInfo.name}`);
        
        const rawAssetId = imageInfo.assetId || imageInfo.name.replace(/^album_/, '').replace(/\.[^.]+$/, '');
        const existingIdx = images.value.findIndex(item => item.id === rawAssetId || item.id === `album_${rawAssetId}` || item.name === imageInfo.name);
        if (existingIdx >= 0) {
          images.value[existingIdx].src = imageInfo.src;
          images.value[existingIdx].path = imageInfo.path;
          images.value[existingIdx].type = 'album_photo';
        } else {
          images.value.push({
            id: rawAssetId,
            path: imageInfo.path,
            name: imageInfo.name,
            src: imageInfo.src,
            status: 'completed',
            predictions: imageInfo.predictions || [],
            type: 'album_photo',
            latitude: imageInfo.latitude,
            longitude: imageInfo.longitude
          });
        }

        // Live upgrade open lightbox if currently viewing this exact photo
        if (selectedImage.value) {
          const currentViewingId = selectedImage.value.id || selectedImage.value.name?.replace(/^thumb_/, '').replace(/\.[^.]+$/, '');
          if (currentViewingId === rawAssetId || selectedImage.value.name === imageInfo.name) {
            selectedImage.value.src = imageInfo.src;
            selectedImage.value.path = imageInfo.path;
            selectedImage.value.type = 'album_photo';
            isHighResLoaded.value = true;
            isFetchingHighRes.value = false;
            logSyncEvent(`✨ 正在浏览的照片已无缝呈现 4K 超清原图: ${imageInfo.name}`);
          }
        }
        return;
      }
      
      if (imageInfo.isThumbnail) {
        const isKnown = knownThumbNames.has(imageInfo.name);
        if (!isKnown) {
          knownThumbNames.add(imageInfo.name);
          const newThumb = {
            src: imageInfo.src,
            name: imageInfo.name,
            path: imageInfo.path,
            predictions: imageInfo.predictions
          };
          thumbnailImages.value.push(newThumb);
          
          // Also push to images.value for main gallery browsing
          images.value.push({
            id: imageInfo.name,
            path: imageInfo.path,
            name: imageInfo.name,
            src: imageInfo.src,
            status: 'completed',
            predictions: imageInfo.predictions,
            type: 'thumbnail',
            latitude: imageInfo.latitude,
            longitude: imageInfo.longitude
          });
        } else {
          const idx = thumbnailImages.value.findIndex(img => img.name === imageInfo.name);
          if (idx !== -1) {
            thumbnailImages.value[idx].predictions = imageInfo.predictions;
            thumbnailImages.value[idx].latitude = imageInfo.latitude;
            thumbnailImages.value[idx].longitude = imageInfo.longitude;
          }
          // Also update predictions in images.value if found with reactive splice
          const imgIdx = images.value.findIndex(img => img.name === imageInfo.name || img.path === imageInfo.path);
          if (imgIdx !== -1) {
            const updated = {
              ...images.value[imgIdx],
              predictions: imageInfo.predictions || [],
              status: 'completed',
              latitude: imageInfo.latitude,
              longitude: imageInfo.longitude
            };
            images.value.splice(imgIdx, 1, updated);
          }
        }
        // Always increment counter regardless of whether thumbnail was new or already existed
        thumbSyncDone.value++;
        if (thumbSyncDone.value % 50 === 0 || (thumbSyncTotal.value > 0 && thumbSyncDone.value >= thumbSyncTotal.value)) {
          logSyncEvent(`🧠 AI 同步中 (${thumbSyncDone.value}/${thumbSyncTotal.value || '...'}): ${imageInfo.name}`);
        }
        if (thumbSyncTotal.value > 0 && thumbSyncDone.value >= thumbSyncTotal.value) {
          isThumbnailSyncing.value = false;
        }
      } else {
        logSyncEvent(`🎉 图片接收完成: ${imageInfo.name}`);
        incomingTransfer.value = null;

        // Update chatMessage to completed
        const msg = chatMessages.value.find(m => m.name === imageInfo.name);
        if (msg) {
          msg.status = 'completed';
          msg.progress = 1;
          msg.src = imageInfo.src;
          msg.predictions = imageInfo.predictions;
        } else {
          // fallback
          chatMessages.value.push({
            id: Date.now(),
            type: 'incoming',
            name: imageInfo.name,
            size: 0,
            progress: 1,
            status: 'completed',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isImage: true,
            src: imageInfo.src,
            predictions: imageInfo.predictions
          });
          scrollToBottom();
        }

        images.value.push({
          id: imageInfo.id || imageInfo.name,
          path: imageInfo.path,
          name: imageInfo.name,
          src: imageInfo.src,
          status: 'completed',
          predictions: imageInfo.predictions,
          type: imageInfo.type || (imageInfo.name.startsWith('album_') ? 'album_photo' : 'image'),
          latitude: imageInfo.latitude,
          longitude: imageInfo.longitude
        });
        
        totalCount.value = images.value.length;
        if (!currentFolderPath.value || currentFolderPath.value === '自定义多图导入') {
          currentFolderPath.value = '同步自移动端相册';
        }
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

    // 7. Discovered devices list changed
    window.api.onDiscoveredDevicesChanged((devices) => {
      discoveredDevicesList.value = devices;
    });

    // 8. Connection request received
    window.api.onConnectionRequestReceived((request) => {
      logSyncEvent(`📡 [UDP] 收到来自 ${request.name} (${request.ip}) 的连接请求!`);
      incomingConnectionRequest.value = request;
    });

    // 9. Connection response received (accept/reject)
    window.api.onConnectionResponseReceived(async ({ ip, accept }) => {
      connectingIp.value = null;
      if (accept) {
        logSyncEvent(`📡 [UDP] 来自 ${ip} 的连接已被接受! 正在等待 SDP Offer...`);
        const found = discoveredDevicesList.value.find(d => d.ip === ip);
        activePeerType.value = found ? found.type : 'PC';
        activePeerIp.value = ip;
        syncStatus.value = 'handshaking';
        startHandshakeTimeout();
        cleanupWebRtc();
        
        const configuration = { iceServers: [] };
        peerConnection = new RTCPeerConnection(configuration);
        setupPeerConnectionListeners(peerConnection);
        
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            window.api.sendUdpIce(ip, JSON.stringify(event.candidate));
          }
        };

        peerConnection.ondatachannel = (event) => {
          logSyncEvent("[UDP] 监听到直连数据通道创建请求: " + event.channel.label);
            if (event.channel.label === 'photo_sync') {
            dataChannel = event.channel;
            setupDataChannel(dataChannel);
          }

          peerConnection.onconnectionstatechange = () => {
            logSyncEvent("[WebRTC] 连接状态: " + peerConnection.connectionState);
          };
          peerConnection.oniceconnectionstatechange = () => {
            logSyncEvent("[WebRTC] ICE状态: " + peerConnection.iceConnectionState);
          };
        };
      } else {
        logSyncEvent(`❌ [UDP] 来自 ${ip} 的连接请求已被拒绝。`);
      }
    });

    // 10. Direct WebRTC / UDP / HTTP Signaling (Delegated to standalone ConnectionManager)
    connectionManager.init({
      log: logSyncEvent,
      onDataChannel: (channel) => {
        dataChannel = channel;
        peerConnection = connectionManager.peerConnection;
        setupDataChannel(channel);
      },
      onHandshakeTimeout: () => {
        handleWebRtcDisconnect();
      }
    });

    // 12. Face Scan progress (Throttled via RAF for silky smooth 60fps rendering)
    let pendingFaceProgressData = null;
    let faceProgressRaf = null;

    if (window.api.onFaceScanProgress) {
      window.api.onFaceScanProgress((data) => {
        pendingFaceProgressData = data;
        if (!faceProgressRaf) {
          faceProgressRaf = requestAnimationFrame(() => {
            faceProgressRaf = null;
            if (!pendingFaceProgressData) return;
            const curData = pendingFaceProgressData;
            faceScanProgress.value = curData;

            const now = Date.now();
            if (curData.durationMs) {
              faceScanDurationMs.value = curData.durationMs;
            } else if (lastFaceScanTimestamp > 0 && curData.done > lastFaceScanDone) {
              const deltaMs = now - lastFaceScanTimestamp;
              const deltaCount = curData.done - lastFaceScanDone;
              faceScanDurationMs.value = Math.round(deltaMs / (deltaCount || 1));
            }
            lastFaceScanDone = curData.done;
            lastFaceScanTimestamp = now;

            if (!faceScanStartTime && curData.done > 0) {
              faceScanStartTime = now;
            }
            if (faceScanStartTime && curData.done > 0) {
              const elapsedMs = now - faceScanStartTime;
              const avg = Math.round(elapsedMs / curData.done);
              faceScanAvgMs.value = curData.avgDurationMs || avg;
              if (curData.total > curData.done) {
                const remainingMs = avg * (curData.total - curData.done);
                const remSec = Math.round(remainingMs / 1000);
                if (remSec < 60) {
                  faceScanRemainingTime.value = `${remSec}${t.value?.people?.seconds || 's'}`;
                } else {
                  const m = Math.floor(remSec / 60);
                  const s = remSec % 60;
                  faceScanRemainingTime.value = `${m}${t.value?.people?.minutes || 'm '}${s}${t.value?.people?.seconds || 's'}`;
                }
              } else {
                faceScanRemainingTime.value = '';
              }
            }
          });
        }
      });
    }

    // 13. Reclassify AI progress & predictions updated events
    window.api.onReclassifyProgress((data) => {
      reclassifyProgress.value = data;
      
      if (data.elapsedMs !== undefined) {
        reclassifyElapsedTime.value = formatTimeDuration(data.elapsedMs);
      } else if (reclassifyStartTime) {
        const elapsedMs = Date.now() - reclassifyStartTime;
        reclassifyElapsedTime.value = formatTimeDuration(elapsedMs);
      }

      if (data.remainingMs !== undefined) {
        reclassifyRemainingTime.value = formatTimeDuration(data.remainingMs);
      } else if (reclassifyStartTime && data.done > 0) {
        const elapsedMs = Date.now() - reclassifyStartTime;
        const remainingMs = (elapsedMs / data.done) * (data.total - data.done);
        reclassifyRemainingTime.value = formatTimeDuration(remainingMs);
      }

      if (data.done === data.total || data.isComplete) {
        isReclassifying.value = false;
        const finalTotalTime = data.totalTimeMs ? formatTimeDuration(data.totalTimeMs) : reclassifyElapsedTime.value;
        reclassifyStats.value = {
          totalCount: data.total,
          lastSingleMs: data.singleMs || 0,
          avgMs: data.avgMs || 0,
          totalTimeText: finalTotalTime,
          totalTimeMs: data.totalTimeMs || 0,
          completedAt: new Date().toLocaleTimeString()
        };
        logSyncEvent(`🎉 手机图片 AI 重新分析完成！共处理 ${data.total} 张图片，总计耗时 ${finalTotalTime}，平均 ${data.avgMs || 0} ms/张。`);
      }
    });

    window.api.onSinglePhotoPredictionsUpdated((data) => {
      // Support both single object (legacy) and batched array (optimized)
      const items = Array.isArray(data) ? data : (data ? [data] : []);
      if (items.length === 0) return;

      // Build Map for O(1) lookup by id
      const updateMap = new Map();
      for (const item of items) {
        if (item.id) updateMap.set(String(item.id), item.predictions || []);
      }

      // Single pass over images — O(n) instead of O(n × batch)
      for (let i = 0; i < images.value.length; i++) {
        const preds = updateMap.get(String(images.value[i].id));
        if (preds !== undefined) {
          images.value[i].predictions = preds;
        }
      }
      // Single pass over thumbnailImages
      for (let i = 0; i < thumbnailImages.value.length; i++) {
        const preds = updateMap.get(String(thumbnailImages.value[i].id));
        if (preds !== undefined) {
          thumbnailImages.value[i].predictions = preds;
        }
      }
    });

    // 13. Similar images progress event
    window.api.onSimilarProgress((data) => {
      similarAnalysisProgress.value = data;
      
      if (similarStartTime) {
        const elapsedMs = Date.now() - similarStartTime;
        similarElapsedTime.value = formatTimeDuration(elapsedMs);
        if (data.done > 0) {
          const remainingMs = (elapsedMs / data.done) * (data.total - data.done);
          similarRemainingTime.value = formatTimeDuration(remainingMs);
        }
      }
    });

    // Auto-start sync service on mount so the QR Code is immediately shown!
    if (!isSyncActive.value) {
      toggleSyncService();
    }
  }
});

// Send files by absolute paths over the DataChannel
async function sendFilesByPaths(filePaths) {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent("⚠️ 无法发送文件：数据通道未建立或已关闭");
    return;
  }

  try {
    logSyncEvent(`📤 准备向手机发送 ${filePaths.length} 个文件...`);

    let fileIdCounter = Math.floor(1000 + Math.random() * 8000);

    for (const filePath of filePaths) {
      const fileName = filePath.split(/[/\\]/).pop();
      logSyncEvent(`📤 正在读取文件: ${fileName}`);
      
      pcActiveTransferName.value = `正在发送 ${fileName}...`;
      pcActiveProgress.value = 0;
      
      const fileBytes = await window.api.readImageBytes(filePath);
      
      const fileId = fileIdCounter++;
      const chunkSize = 32768; // 32KB
      const totalChunks = Math.ceil(fileBytes.length / chunkSize);
      
      // Add outgoing message bubble
      const newMsg = reactive({
        id: fileId,
        type: 'outgoing',
        name: fileName,
        size: fileBytes.length,
        progress: 0,
        status: 'transferring',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isImage: /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName),
        src: /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName) ? `local:///${filePath.replace(/\\/g, '/')}` : ''
      });
      chatMessages.value.push(newMsg);
      scrollToBottom();
      
      logSyncEvent(`📤 开始传输: ${fileName} (ID: ${fileId}), 共 ${totalChunks} 分片`);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileBytes.length);
        const chunkData = fileBytes.subarray(start, end);
        
        const packet = new Uint8Array(16 + chunkData.length);
        const view = new DataView(packet.buffer);
        
        view.setInt32(0, fileId, false);
        view.setInt32(4, i, false);
        view.setInt32(8, totalChunks, false);
        view.setInt32(12, chunkData.length, false);
        
        packet.set(chunkData, 16);
        
        dataChannel.send(packet.buffer);

        pcActiveProgress.value = (i + 1) / totalChunks;
        newMsg.progress = (i + 1) / totalChunks;

        if (dataChannel.bufferedAmount > 1048576) {
          await new Promise(resolve => {
            const checkBuffer = () => {
              if (dataChannel.bufferedAmount < 262144) {
                resolve();
              } else {
                setTimeout(checkBuffer, 20);
              }
            };
            checkBuffer();
          });
        }

        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      newMsg.status = 'completed';
      newMsg.progress = 1.0;
      logSyncEvent(`🎉 文件发送完成: ${fileName}`);
      pcActiveTransferName.value = null;
      pcActiveProgress.value = 0;
    }

  } catch (err) {
    logSyncEvent(`❌ 发送文件出错: ${err.message || err}`);
    pcActiveTransferName.value = null;
    pcActiveProgress.value = 0;
    const currentMsg = chatMessages.value.find(m => m.status === 'transferring' && m.type === 'outgoing');
    if (currentMsg) {
      currentMsg.status = 'failed';
    }
  }
}

// Send local images on PC to the mobile device
async function handleSendImagesToMobile() {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    logSyncEvent("⚠️ 无法发送图片：数据通道未建立或已关闭");
    return;
  }
  
  const selectedPaths = await window.api.selectImages();
  if (!selectedPaths || selectedPaths.length === 0) {
    return;
  }
  await sendFilesByPaths(selectedPaths);
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('click', handleCookieMenuClickOutside);
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

// Category counts based on Top-1 predictions with score >= 0.40 threshold
const categoryCounts = computed(() => {
  const counts = {};
  localImages.value.forEach(img => {
    if (img.predictions && Array.isArray(img.predictions) && img.predictions.length > 0) {
      const topPred = img.predictions[0];
      const catName = topPred.category || topPred.label || topPred.name;
      const score = topPred.score !== undefined ? topPred.score : 1.0;
      if (score >= 0.40 && catName && !catName.includes('⚠️') && !catName.includes('💻') && !catName.includes('❌')) {
        counts[catName] = (counts[catName] || 0) + 1;
      }
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
    const categoryGroup = localImages.value.filter(img => {
      if (!img.predictions || img.predictions.length === 0) return false;
      const topPred = img.predictions[0];
      const catName = topPred.category || topPred.label || topPred.name;
      const score = topPred.score !== undefined ? topPred.score : 1.0;
      return catName === selectedCategory.value && score >= 0.40;
    });
    categoryGroup.sort((a, b) => (b.predictions[0].score || 0) - (a.predictions[0].score || 0));
    list = categoryGroup;
  }

  // If search is active, apply search filtering and sorting
  if (isSearchActive.value) {
    list.sort((a, b) => {
      const scoreA = a.searchScore !== undefined ? a.searchScore : -1;
      const scoreB = b.searchScore !== undefined ? b.searchScore : -1;
      return scoreB - scoreA;
    });
    
    const searchFiltered = list.filter(img => img.searchScore !== undefined && getMatchPercentage(img.searchScore) >= 40);
    if (searchFiltered.length < 10) {
      // If we don't have enough high confidence results, take up to 10 best results
      // filter out items with no searchScore (undefined or <=0)
      const validSearch = list.filter(img => img.searchScore !== undefined && img.searchScore > 0);
      list = validSearch.slice(0, 10);
    } else {
      list = searchFiltered;
    }
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
  trackFeatureUse('semantic_search', { query_length: query.length });
  
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
    nextTick(() => {
      if (virtualGridRef.value) {
        virtualGridRef.value.scrollTo(0);
      } else if (galleryContainerRef.value) {
        galleryContainerRef.value.scrollTop = 0;
      }
    });
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
  const isImg = IMAGE_EXTENSIONS.includes(ext);
  
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
    if (hasApi) {
      // Call main process via preload bridge
      const data = await window.api.classifyPhoto(imgItem.path);
      imgItem.predictions = data.predictions || [];
      imgItem.latitude = data.latitude;
      imgItem.longitude = data.longitude;
    } else {
      // Mock web demo classification delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
      imgItem.predictions = getMockClassification(imgItem.src);
      // Generate some mock GPS coordinates for demo purposes in browser sandbox
      if (Math.random() > 0.4) {
        imgItem.latitude = 39.9042 + (Math.random() - 0.5) * 0.3; // Beijing area
        imgItem.longitude = 116.4074 + (Math.random() - 0.5) * 0.3;
      }
    }

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

// Modal Interaction & Lightbox Navigation
function preloadAdjacentImages() {
  if (!currentViewingList.value || currentViewingList.value.length <= 1) return;
  const len = currentViewingList.value.length;
  const nextIdx = (currentViewingIndex.value + 1) % len;
  const prevIdx = (currentViewingIndex.value - 1 + len) % len;

  const nextItem = currentViewingList.value[nextIdx];
  const prevItem = currentViewingList.value[prevIdx];

  if (nextItem && nextItem.src) {
    const img1 = new Image();
    img1.src = nextItem.src;
  }
  if (prevItem && prevItem.src) {
    const img2 = new Image();
    img2.src = prevItem.src;
  }
}

function scrollFilmstripToActive() {
  nextTick(() => {
    if (!filmstripContainerRef.value) return;
    const activeEl = filmstripContainerRef.value.querySelector('.filmstrip-item-active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });
}

function openDetails(img, contextList = null) {
  if (!img) return;
  selectedImage.value = { ...img };
  resetImageView();
  isHighResLoaded.value = false;
  isFetchingHighRes.value = false;
  lightboxDirection.value = 'next';

  if (Array.isArray(contextList) && contextList.length > 0) {
    currentViewingList.value = contextList;
  } else {
    currentViewingList.value = images.value;
  }

  const targetId = img.id || img.path;
  const idx = currentViewingList.value.findIndex(item => (item.id || item.path) === targetId);
  currentViewingIndex.value = idx >= 0 ? idx : 0;

  checkAndFetchHighRes(img);
  preloadAdjacentImages();
  scrollFilmstripToActive();
}

function closeDetails() {
  selectedImage.value = null;
  resetImageView();
  isFetchingHighRes.value = false;
  if (isDraggingImage.value) {
    isDraggingImage.value = false;
    window.removeEventListener('mousemove', handleLightboxMouseMove);
    window.removeEventListener('mouseup', handleLightboxMouseUp);
  }
}

function prevImage() {
  if (!currentViewingList.value || currentViewingList.value.length <= 1) return;
  lightboxDirection.value = 'prev';
  currentViewingIndex.value = (currentViewingIndex.value - 1 + currentViewingList.value.length) % currentViewingList.value.length;
  const nextImg = currentViewingList.value[currentViewingIndex.value];
  if (nextImg) {
    selectedImage.value = { ...nextImg };
    resetImageView();
    isHighResLoaded.value = false;
    isFetchingHighRes.value = false;
    checkAndFetchHighRes(nextImg);
    preloadAdjacentImages();
    scrollFilmstripToActive();
  }
}

function nextImage() {
  if (!currentViewingList.value || currentViewingList.value.length <= 1) return;
  lightboxDirection.value = 'next';
  currentViewingIndex.value = (currentViewingIndex.value + 1) % currentViewingList.value.length;
  const nextImg = currentViewingList.value[currentViewingIndex.value];
  if (nextImg) {
    selectedImage.value = { ...nextImg };
    resetImageView();
    isHighResLoaded.value = false;
    isFetchingHighRes.value = false;
    checkAndFetchHighRes(nextImg);
    preloadAdjacentImages();
    scrollFilmstripToActive();
  }
}

function selectLightboxImageByIndex(idx) {
  if (!currentViewingList.value || idx < 0 || idx >= currentViewingList.value.length) return;
  if (idx === currentViewingIndex.value) return;
  lightboxDirection.value = idx > currentViewingIndex.value ? 'next' : 'prev';
  currentViewingIndex.value = idx;
  const nextImg = currentViewingList.value[idx];
  if (nextImg) {
    selectedImage.value = { ...nextImg };
    resetImageView();
    isHighResLoaded.value = false;
    isFetchingHighRes.value = false;
    checkAndFetchHighRes(nextImg);
    preloadAdjacentImages();
    scrollFilmstripToActive();
  }
}

function checkAndFetchHighRes(img) {
  if (!img) return;

  const isThumb = img.type === 'thumbnail' || (img.name && img.name.startsWith('thumb_'));
  
  if (!isThumb) {
    isHighResLoaded.value = true;
    isFetchingHighRes.value = false;
    return;
  }

  // 1. Check if PC already has the synced original photo for this assetId
  const assetId = img.id;
  if (assetId) {
    const existingOriginal = images.value.find(item => 
      item.type === 'album_photo' && (item.id === assetId || item.id === `album_${assetId}` || item.name === `album_${assetId}.jpg`)
    );
    if (existingOriginal && existingOriginal.src) {
      selectedImage.value.src = existingOriginal.src;
      selectedImage.value.path = existingOriginal.path;
      selectedImage.value.type = 'album_photo';
      isHighResLoaded.value = true;
      isFetchingHighRes.value = false;
      return;
    }
  }

  // 2. If phone is connected, send on-demand request (-14) to phone
  if (syncStatus.value === 'connected' && dataChannel && assetId) {
    isFetchingHighRes.value = true;
    isHighResLoaded.value = false;
    try {
      const payloadStr = JSON.stringify({ asset_id: assetId });
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(payloadStr);
      const packetBuffer = new ArrayBuffer(16 + payloadBytes.byteLength);
      const view = new DataView(packetBuffer);
      view.setInt32(0, -14, false); // file_id = -14 (On-Demand Single Photo Request)
      view.setInt32(4, 0, false);
      view.setInt32(8, 0, false);
      view.setInt32(12, payloadBytes.byteLength, false);
      const packetBytes = new Uint8Array(packetBuffer);
      packetBytes.set(payloadBytes, 16);
      dataChannel.send(packetBuffer);
      logSyncEvent(`📥 正在向手机请求直传超清原图: ${img.name || assetId}`);
    } catch (e) {
      console.error("[Sync] Failed to send on-demand photo request:", e);
      isFetchingHighRes.value = false;
    }
  } else {
    isFetchingHighRes.value = false;
  }
}

async function openFileLocation(filePath) {
  if (!filePath) return;
  try {
    if (window.api && window.api.openFileLocation) {
      await window.api.openFileLocation(filePath);
    }
  } catch (err) {
    console.error("[Lightbox] Failed to open file location:", err);
  }
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape') {
    if (activePlayingAudio.value) {
      e.preventDefault();
      closeAudioPlayer();
      return;
    }
    if (activePlayingVideo.value) {
      e.preventDefault();
      closeVideoPlayer();
      return;
    }
  }
  if (!selectedImage.value) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    prevImage();
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    nextImage();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeDetails();
  } else if (selectedItemType.value === 'image') {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomIn();
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      resetImageView();
    }
  }
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

<style>
@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.92) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.22s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* Lightbox Smooth Directional Slide & Crossfade */
.lightbox-slide-next-enter-active,
.lightbox-slide-next-leave-active,
.lightbox-slide-prev-enter-active,
.lightbox-slide-prev-leave-active {
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), 
              opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1),
              filter 0.22s ease;
  will-change: transform, opacity, filter;
}

/* Next (向后切图): 新图从右侧滑入，旧图向左滑出 */
.lightbox-slide-next-enter-from {
  opacity: 0;
  transform: translateX(42px) scale(0.96);
  filter: blur(4px);
}
.lightbox-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-42px) scale(0.96);
  filter: blur(4px);
}

/* Prev (向前切图): 新图从左侧滑入，旧图向右滑出 */
.lightbox-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-42px) scale(0.96);
  filter: blur(4px);
}
.lightbox-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(42px) scale(0.96);
  filter: blur(4px);
}

/* Filmstrip Custom Scrollbar */
.filmstrip-thumb-item:hover {
  opacity: 0.85 !important;
  transform: scale(1.05) !important;
}
.filmstrip-thumb-item:active {
  transform: scale(0.98) !important;
}

/* Nearby Devices Grid Layout */
.nearby-devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px 10px;
  width: 100%;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 2px;
}

.nearby-device-card {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}
.nearby-device-card:hover {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(168, 85, 247, 0.35);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.device-card-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.device-type-icon {
  font-size: 18px;
  color: #a855f7;
  flex-shrink: 0;
}

.device-card-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: left;
  min-width: 0;
  flex: 1;
}

.device-card-title-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.device-card-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-type-badge {
  font-size: 9px;
  font-weight: 600;
  color: #a855f7;
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.25);
  padding: 0 4px;
  border-radius: 3px;
  flex-shrink: 0;
}

.device-card-ip {
  font-size: 10.5px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-card-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.device-signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 11px;
}
.s-bar {
  width: 2px;
  border-radius: 1px;
  background: #22c55e;
}
.s-1 { height: 3px; }
.s-2 { height: 5.5px; }
.s-3 { height: 8px; }
.s-4 { height: 11px; }

.btn-device-connect {
  background: #7c3aed;
  border: none;
  border-radius: 6px;
  color: white;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.25);
  white-space: nowrap;
}
.btn-device-connect:hover {
  background: #8b5cf6;
  box-shadow: 0 3px 10px rgba(124, 58, 237, 0.4);
}

/* ==================== VIDEOS TAB STYLES ==================== */
.videos-tab-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.video-control-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--border-radius-lg);
}

.video-control-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-control-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.video-control-title-row h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary);
}

.badge-unsynced-pulse {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
  animation: pulse-glow 1.8s infinite;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
  50% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.35); }
  100% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
}

.video-control-subtitle {
  font-size: 11.5px;
  color: var(--text-muted);
  margin: 0;
}

.video-control-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-glow-pulse {
  background: linear-gradient(135deg, #a855f7 0%, #38bdf8 100%) !important;
  box-shadow: 0 0 15px rgba(168, 85, 247, 0.5) !important;
  animation: btn-pulse 1.8s infinite;
}

@keyframes btn-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

/* Video Syncing Progress Banner */
.video-sync-progress-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-radius: 12px;
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(15, 23, 42, 0.6);
}

.sync-progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 500px;
}

.sync-progress-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.sync-progress-title {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.sync-percent {
  color: #38bdf8;
  font-family: var(--font-mono);
}

.sync-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  overflow: hidden;
}

.sync-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #38bdf8);
  border-radius: 99px;
  transition: width 0.2s ease-out;
}

.sync-progress-controls {
  display: flex;
  gap: 6px;
}

/* Video View Filter Tabs */
.video-filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.video-filter-tabs {
  display: inline-flex;
  background: var(--bg-surface, rgba(15, 23, 42, 0.5));
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  gap: 4px;
}

.video-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.video-filter-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.video-filter-btn.active {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.35);
}

.video-filter-btn .filter-count {
  font-size: 11px;
  opacity: 0.85;
  font-family: var(--font-mono);
}

.light-mode .video-filter-tabs {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.light-mode .video-filter-btn {
  color: #64748b;
}

.light-mode .video-filter-btn:hover {
  color: #0f172a;
  background: rgba(0, 0, 0, 0.05);
}

.light-mode .video-filter-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.28);
}

/* Date Timeline */
.video-timeline-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.video-date-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--bg-surface, rgba(255, 255, 255, 0.04));
  border-radius: 10px;
  border-left: 3.5px solid #a855f7;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
  border-left-width: 3.5px;
  border-left-color: #a855f7;
}

.video-date-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-date-icon {
  font-size: 16px;
}

.video-date-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 800;
  color: var(--text-primary);
}

.video-date-meta {
  font-size: 11.5px;
  color: var(--text-secondary);
  font-weight: 600;
}

.video-date-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-all-synced-badge {
  font-size: 11.5px;
  color: #10b981;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.12);
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

/* Video Grid Cards */
.video-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.video-card {
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-surface, rgba(30, 41, 59, 0.7));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.video-card:hover {
  transform: translateY(-3px);
  border-color: rgba(168, 85, 247, 0.5);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
}

.card-unsynced {
  border-color: rgba(245, 158, 11, 0.25);
}

.card-selected {
  border-color: #a855f7 !important;
  background: rgba(168, 85, 247, 0.08) !important;
  box-shadow: 0 0 18px rgba(168, 85, 247, 0.4) !important;
}

.video-poster-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9.5;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-poster-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.video-card:hover .video-poster-media {
  transform: scale(1.05);
}

.video-poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
}

.video-poster-icon {
  font-size: 32px;
  opacity: 0.6;
}

/* Hover Center Play Button */
.video-play-center-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.85);
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  z-index: 3;
}

.video-card:hover .video-play-center-btn {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.video-select-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  border: 2px solid rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
}

.video-select-checkbox:hover {
  transform: scale(1.12);
  border-color: #fff;
}

.video-select-checkbox.is-checked {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-color: #ffffff;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.8);
}

.check-icon {
  color: #fff;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.video-duration-pill {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  backdrop-filter: blur(6px);
  font-family: var(--font-mono);
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.video-status-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  backdrop-filter: blur(6px);
  z-index: 2;
}

.tag-synced {
  background: rgba(16, 185, 129, 0.85);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
}

.tag-unsynced {
  background: rgba(245, 158, 11, 0.85);
  color: #fff;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
}

.video-card-footer {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  background: transparent;
}

.video-card-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-card-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.video-play-hint {
  color: #38bdf8;
  font-weight: 700;
  font-size: 11px;
}

.btn-video-quick-download {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #f59e0b;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-video-quick-download:hover {
  background: #f59e0b;
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
}

/* Floating Bottom Sticky Bar for Multi-Select Download */
.video-floating-bar {
  position: fixed;
  bottom: 28px;
  left: 55%;
  transform: translateX(-50%);
  z-index: 999;
  background: #0f172a;
  border: 1.5px solid rgba(168, 85, 247, 0.6);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(168, 85, 247, 0.3);
  border-radius: 99px;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  color: #ffffff;
}

.video-floating-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.video-floating-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Compact Video Top Bar */
.video-compact-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: var(--border-radius-md, 12px);
  gap: 12px;
}

.video-compact-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-panel-toggle {
  background: rgba(168, 85, 247, 0.12) !important;
  color: #c084fc !important;
  border: 1px solid rgba(168, 85, 247, 0.3) !important;
  font-weight: 700 !important;
}
.btn-panel-toggle:hover {
  background: rgba(168, 85, 247, 0.25) !important;
  color: #fff !important;
}

/* Fullscreen Video Player Modal */
.video-player-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(16px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.video-player-modal {
  position: relative;
  width: 100%;
  max-width: 1020px;
  background: #000;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9);
}

.vp-floating-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
}
.vp-floating-close-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  transform: scale(1.1);
}

.video-player-body {
  width: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 80vh;
}

.video-native-element {
  width: 100%;
  max-height: 80vh;
  outline: none;
}

/* Audios Tab (Hi-Fi Music Station) */
.audios-tab-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.audios-scroll-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 6px;
}

/* Audio Playlist Card (Unified Container per Date Group) */
.audio-playlist-card {
  background: var(--bg-secondary, #131a2c);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.audio-playlist-card:hover {
  border-color: var(--glass-border, rgba(255, 255, 255, 0.14));
}

/* Playlist Header (Date + Meta + Actions) */
.playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 18px;
  background: rgba(15, 23, 42, 0.45);
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.06));
}

.playlist-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playlist-calendar-icon {
  font-size: 14px;
  opacity: 0.85;
}

.playlist-date-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.2px;
}

.playlist-meta-dot {
  color: var(--text-muted, #64748b);
  opacity: 0.6;
  font-weight: bold;
}

.playlist-meta-pill {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.playlist-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-date-select {
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  background: var(--glass-hover, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.12));
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.18s ease;
}

.btn-date-select:hover {
  background: var(--glass-border, rgba(255, 255, 255, 0.12));
  color: var(--text-primary);
}

.btn-date-select.is-selected {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.5);
  color: var(--primary, #6366f1);
}

.btn-date-select .btn-check-dot {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  border: 1.2px solid currentColor;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  line-height: 1;
}

.btn-date-select.is-selected .btn-check-dot {
  background: var(--primary, #6366f1);
  border-color: var(--primary, #6366f1);
  color: #fff;
}

.btn-date-sync {
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.btn-date-sync:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.45);
}

.btn-date-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.audio-all-synced-badge {
  font-size: 11.5px;
  color: #10b981;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.1);
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Playlist Rows */
.playlist-rows {
  display: flex;
  flex-direction: column;
}

.playlist-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.04));
  transition: background 0.15s ease, transform 0.15s ease;
  cursor: pointer;
}

.playlist-row:last-child {
  border-bottom: none;
}

.playlist-row:hover {
  background: rgba(255, 255, 255, 0.035);
}

.playlist-row.track-selected {
  background: rgba(99, 102, 241, 0.08) !important;
}

.playlist-row.track-playing {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%) !important;
}

.playlist-row-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

/* Row Checkbox */
.row-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.4);
  border: 1.5px solid var(--glass-border, rgba(255, 255, 255, 0.35));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-right: 12px;
  font-size: 11px;
}

.row-checkbox:hover {
  border-color: var(--primary, #6366f1);
  transform: scale(1.08);
}

.row-checkbox.is-checked {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: #ffffff;
  color: #fff;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
}

/* Cover Art Disc */
.row-cover-disc {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, #334155 0%, #1e293b 65%, #0f172a 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  margin-right: 14px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.row-cover-disc.is-playing {
  border-color: #6366f1;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.45);
}

.disc-icon {
  font-size: 15px;
  opacity: 0.85;
  transition: opacity 0.15s ease;
}

.disc-hover-play {
  position: absolute;
  inset: 0;
  background: rgba(99, 102, 241, 0.85);
  backdrop-filter: blur(2px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 2;
}

.playlist-row:hover .disc-hover-play {
  opacity: 1;
}

.playlist-row:hover .disc-icon {
  opacity: 0;
}

/* Mini Equalizer inside Disc when playing */
.disc-eq-bars {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  z-index: 3;
}

.disc-eq-bar {
  width: 2.5px;
  background: linear-gradient(to top, #6366f1, #c084fc);
  border-radius: 2px;
  animation: eq-jump 0.7s ease-in-out infinite alternate;
}

.disc-eq-bar.bar-1 { height: 10px; animation-delay: 0.1s; }
.disc-eq-bar.bar-2 { height: 16px; animation-delay: 0.3s; }
.disc-eq-bar.bar-3 { height: 8px; animation-delay: 0.5s; }

/* Track Metadata Info */
.row-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
  text-align: left;
}

.row-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.row-track-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 520px;
  letter-spacing: 0.1px;
}

.row-hires-badge {
  font-size: 9.5px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.35);
  color: #fbbf24;
  line-height: 1.2;
}

.row-sub-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.row-fmt-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.row-fmt-tag.fmt-mp3 {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.row-fmt-tag.fmt-m4a {
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
}

.row-fmt-tag.fmt-hi-res {
  background: rgba(234, 179, 8, 0.15);
  color: #fbbf24;
}

.row-fmt-tag.fmt-ogg {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.row-fmt-tag.fmt-other {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
}

.sub-sep {
  opacity: 0.4;
  font-size: 10px;
}

.sub-duration, .sub-size {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
}

.row-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4.5px;
  font-size: 11px;
  font-weight: 500;
}

.row-status-pill .status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.row-status-pill.status-synced {
  color: #10b981;
}

.row-status-pill.status-synced .status-dot {
  background: #10b981;
}

.row-status-pill.status-unsynced {
  color: #f59e0b;
}

.row-status-pill.status-unsynced .status-dot {
  background: #f59e0b;
}

/* Playlist Row Action Buttons */
.playlist-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 14px;
}

.btn-row-locate {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.18s ease;
}

.playlist-row:hover .btn-row-locate {
  opacity: 0.75;
}

.btn-row-locate:hover {
  opacity: 1 !important;
  background: var(--glass-hover, rgba(255, 255, 255, 0.08));
  border-color: var(--glass-border, rgba(255, 255, 255, 0.15));
  color: var(--text-primary);
  transform: scale(1.08);
}

.btn-row-play {
  padding: 4.5px 12px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #818cf8;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-row-play:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
}

.btn-row-play.is-active-playing {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.btn-row-download {
  padding: 4.5px 12px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-row-download:hover:not(:disabled) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: transparent;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
}

.btn-row-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Floating Bottom Sticky Bar for Multi-Select Download */
.audio-floating-bar {
  position: fixed;
  bottom: 28px;
  left: 55%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 24px;
  background: #0f172a;
  backdrop-filter: blur(16px);
  border: 1.5px solid rgba(99, 102, 241, 0.5);
  border-radius: 99px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.25);
  min-width: 420px;
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  color: #ffffff;
}

.audio-floating-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
}

.floating-music-icon {
  font-size: 18px;
}

.floating-size-hint {
  color: var(--text-muted, #94a3b8);
  font-size: 12px;
  margin-left: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.audio-floating-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-floating-clear {
  border-radius: 20px !important;
  padding: 6px 16px !important;
  font-weight: 600 !important;
}

.btn-floating-download {
  border-radius: 20px !important;
  padding: 7px 22px !important;
  font-weight: 800 !important;
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.45) !important;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Light Mode Overrides for Audios Tab */
.light-mode .audio-playlist-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.light-mode .audio-playlist-card:hover {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
}

.light-mode .playlist-header {
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.light-mode .playlist-date-title {
  color: #0f172a;
}

.light-mode .playlist-meta-pill {
  color: #64748b;
}

.light-mode .btn-date-select {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #475569;
}

.light-mode .btn-date-select:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.light-mode .btn-date-select.is-selected {
  background: rgba(99, 102, 241, 0.08);
  border-color: #6366f1;
  color: #4f46e5;
}

.light-mode .audio-all-synced-badge {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
  color: #059669;
}

.light-mode .playlist-row {
  border-bottom: 1px solid #f1f5f9;
}

.light-mode .playlist-row:hover {
  background: #f8fafc;
}

.light-mode .playlist-row.track-selected {
  background: rgba(99, 102, 241, 0.04) !important;
}

.light-mode .playlist-row.track-playing {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%) !important;
}

.light-mode .row-checkbox {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
}

.light-mode .row-checkbox:hover {
  border-color: #6366f1;
}

.light-mode .row-checkbox.is-checked {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: #6366f1;
  color: #fff;
  box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
}

.light-mode .row-cover-disc {
  background: radial-gradient(circle, #ffffff 0%, #f1f5f9 65%, #e2e8f0 100%);
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.light-mode .row-cover-disc.is-playing {
  border-color: #6366f1;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.light-mode .row-track-title {
  color: #0f172a;
}

.light-mode .row-sub-line {
  color: #64748b;
}

.light-mode .row-fmt-tag.fmt-mp3 {
  background: rgba(168, 85, 247, 0.08);
  color: #7e22ce;
}

.light-mode .row-fmt-tag.fmt-m4a {
  background: rgba(14, 165, 233, 0.08);
  color: #0284c7;
}

.light-mode .row-fmt-tag.fmt-hi-res {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
}

.light-mode .row-fmt-tag.fmt-ogg {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

.light-mode .row-fmt-tag.fmt-other {
  background: rgba(99, 102, 241, 0.08);
  color: #4f46e5;
}

.light-mode .btn-row-locate {
  color: #64748b;
}

.light-mode .btn-row-locate:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.light-mode .btn-row-play {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.25);
  color: #4f46e5;
}

.light-mode .btn-row-play:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: #ffffff;
}

.light-mode .btn-row-play.is-active-playing {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

.light-mode .btn-row-download {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: #4f46e5;
}

.light-mode .btn-row-download:hover:not(:disabled) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
}

.light-mode .audio-floating-bar {
  background: #ffffff;
  border: 1px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12), 0 0 16px rgba(99, 102, 241, 0.12);
  color: #0f172a;
}

.light-mode .audio-floating-info {
  color: #0f172a;
}

.light-mode .floating-size-hint {
  color: #64748b;
}

/* Modern Cyber Hi-Fi Audio Player Lightbox Modal */
.audio-player-modal {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: linear-gradient(145deg, #111827 0%, #0b0f19 100%);
  border: 1.5px solid rgba(6, 182, 212, 0.35);
  border-radius: 24px;
  overflow: hidden;
  padding: 36px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(6, 182, 212, 0.25);
}

.audio-player-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.hifi-player-deck {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vinyl-record {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: radial-gradient(circle, #334155 0%, #0f172a 65%, #020617 100%);
  border: 4px solid #1e293b;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.7), 0 0 25px rgba(6, 182, 212, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.vinyl-record.spinning {
  animation: spin 5s linear infinite;
}

.vinyl-inner {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
  z-index: 2;
}

.hifi-player-equalizer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 24px;
  width: 100%;
}

.audio-player-info {
  text-align: center;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.audio-player-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-primary, #f8fafc);
  margin: 0;
  word-break: break-word;
}

.audio-player-specs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hifi-player-spec-pill {
  font-size: 11px;
  color: var(--text-secondary, #94a3b8);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.audio-player-raw-name {
  font-size: 11px;
  color: var(--text-muted, #64748b);
  margin: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-native-element {
  width: 100%;
  border-radius: 12px;
  outline: none;
}

/* YouTube / Web Downloader Grid & List View Enhancements */
.yt-grid-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.yt-grid-card:hover {
  transform: translateY(-3px);
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}
.yt-grid-card:hover .yt-grid-overlay {
  opacity: 1 !important;
}
.yt-grid-card:hover .yt-grid-thumb {
  transform: scale(1.05);
}
.view-mode-toggle button:hover {
  opacity: 0.9;
}

/* Map Dark Theme override for standard OSM tiles */
.leaflet-tile-pane {
  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
}
</style>



