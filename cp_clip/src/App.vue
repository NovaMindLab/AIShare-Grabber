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

      <!-- Main Navigation -->
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
            <span class="category-count" :class="{ 'ai-processing-badge': isReclassifying || aiQueueProgress.isProcessing }">{{ picturesBadgeText }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'album' }"
            @click="currentTab = 'album'"
          >
            <span>{{ t.sidebar.tabAlbum }}</span>
            <span class="category-count">{{ albumBackupImages.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'similar' }"
            @click="currentTab = 'similar'"
          >
            <span>{{ t.sidebar.tabSimilar }}</span>
            <span class="category-count" v-if="similarGroups.length > 0">{{ similarGroups.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'map' }"
            @click="currentTab = 'map'"
          >
            <span>{{ t.sidebar.tabMap || '🗺️ 足迹地图' }}</span>
            <span class="category-count">{{ imagesWithGps.length }}</span>
          </div>
          <div 
            class="category-item" 
            :class="{ active: currentTab === 'people' }"
            @click="currentTab = 'people'"
          >
            <span>{{ t.sidebar.tabPeople || '👥 人物相册' }}</span>
            <span class="category-count">{{ personClusters.length }}</span>
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
      <!-- Top Header Bar -->
      <header class="top-bar">
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

        <!-- Scenario B: Other Tabs Header (Images, Settings, etc.) -->
        <div v-else style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="folder-path-display" style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <span v-if="currentFolderPath" style="color: var(--text-secondary); font-size: 13px;">
                {{ t.header.currentPath }}<code style="background-color: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{ currentFolderPath }}</code>
              </span>
              <span v-else style="color: var(--text-muted); font-size: 13px;">
                {{ t.header.noPath }}
              </span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <!-- Search Bar -->
            <div class="search-bar-container" v-if="images.length > 0">
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

        <!-- Live Decoupled AI Queue Progress Banner -->
        <div class="ai-queue-status-banner" v-if="aiQueueProgress.isProcessing">
          <div class="ai-queue-info">
            <span class="ai-pulse-icon">🧠</span>
            <span class="ai-queue-title">AI 照片特征识别中</span>
            <span class="ai-queue-counts">{{ aiQueueProgress.completed }} / {{ aiQueueProgress.total }} (剩余 {{ aiQueueProgress.remaining }} 张)</span>
          </div>
          <div class="ai-queue-bar-track">
            <div class="ai-queue-bar-fill" :style="{ width: aiQueueProgress.percent + '%' }"></div>
          </div>
        </div>
      </header>

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
            <div style="position: relative; padding: 10px; background: white; border-radius: 14px; box-shadow: 0 4px 24px rgba(168, 85, 247, 0.25); display: flex; align-items: center; justify-content: center; width: 160px; height: 160px; box-sizing: border-box; flex-shrink: 0; transition: transform 0.25s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
              <canvas ref="qrCanvas" style="width: 140px; height: 140px; display: block; flex-shrink: 0;"></canvas>
            </div>

            <!-- SSID & Password Credentials card when Local Hotspot is active -->
            <div v-if="isHotspotActive && hotspotStatus === 'started'" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 8px 16px; width: 100%; max-width: 320px; box-sizing: border-box;">
              <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 2px;">📡 {{ t.link.hotspotRunning }}:</div>
              <div style="font-size: 13px; font-weight: 700; color: #38bdf8;">SSID: {{ hotspotSsid }}</div>
              <div style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-top: 2px;">密码: {{ hotspotPassword }}</div>
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
                  <div class="device-signal-bars" title="局域网 Wi-Fi 信号良好">
                    <span class="s-bar s-1"></span>
                    <span class="s-bar s-2"></span>
                    <span class="s-bar s-3"></span>
                    <span class="s-bar s-4"></span>
                  </div>
                  
                  <button 
                    class="btn-device-connect"
                    @click="device.isMock ? logSyncEvent(`🔌 [Mock] 连接至虚拟测试设备 ${device.name}...`) : connectToDevice(device.ip)"
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
              <span>{{ showSyncLogs ? '▾ 收起连接日志' : '▸ 展开连接日志' }}</span>
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
            <h2 class="empty-state-title">暂无备份相册资源</h2>
            <p class="empty-state-desc">
              请在左下角连接手机，并启动“同步相册到PC”开始物理备份并离线浏览相册图片。
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
                    📸 相册备份
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
                🎞️ 全部视频 <span class="filter-count">({{ totalAllVideosCount }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: videoTabFilter === 'synced' }"
                @click="videoTabFilter = 'synced'"
              >
                💾 电脑已备份 <span class="filter-count">({{ localVideos.length }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: videoTabFilter === 'unsynced' }"
                @click="videoTabFilter = 'unsynced'"
              >
                📱 手机待下载 <span class="filter-count">({{ totalUnsyncedVideosCount }})</span>
              </button>
            </div>

            <!-- Quick Action & Collapsible Panel Toggle on Right -->
            <div class="video-compact-actions">
              <button 
                v-if="syncStatus === 'connected'"
                class="btn btn-secondary btn-xs"
                :disabled="isVideoSyncing"
                @click="queryRemoteVideoCatalog"
                title="刷新手机端视频列表"
              >
                🔄 刷新列表
              </button>
              <button 
                class="btn btn-secondary btn-xs" 
                @click="handleImportFolder"
                title="导入本地视频文件夹"
              >
                📁 导入本地
              </button>
              <button 
                class="btn btn-secondary btn-xs btn-panel-toggle" 
                @click="isVideoControlExpanded = !isVideoControlExpanded"
                :title="isVideoControlExpanded ? '收起视频管理面板' : '展开视频管理面板与统计'"
              >
                <span>{{ isVideoControlExpanded ? '▴ 收起面板' : '▾ 展开面板' }}</span>
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
                  :title="selectedVideosCount > 0 ? '下载所有已勾选的视频' : '请在下方勾选要下载的视频'"
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
              <span v-if="videoTabFilter === 'synced'">请在顶部切换至「📱 手机待下载」勾选视频并点击下载。</span>
              <span v-else-if="videoTabFilter === 'unsynced'">手机中所有检测到的视频均已同步至电脑本地。</span>
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
                <!-- Floating Minimalist Close Button Only -->
                <button class="vp-floating-close-btn" @click="closeVideoPlayer" title="关闭视频 (ESC)">✕</button>

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
                🎵 全部音乐 <span class="filter-count">({{ totalAllAudiosCount }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: audioTabFilter === 'synced' }"
                @click="audioTabFilter = 'synced'"
              >
                💾 电脑已备份 <span class="filter-count">({{ localAudios.length }})</span>
              </button>
              <button 
                class="video-filter-btn" 
                :class="{ active: audioTabFilter === 'unsynced' }"
                @click="audioTabFilter = 'unsynced'"
              >
                📱 手机待下载 <span class="filter-count">({{ totalUnsyncedAudiosCount }})</span>
              </button>
            </div>

            <!-- Quick Action & Collapsible Panel Toggle on Right -->
            <div class="video-compact-actions">
              <button 
                v-if="syncStatus === 'connected'"
                class="btn btn-secondary btn-xs" 
                :disabled="isAudioSyncing"
                @click="queryRemoteAudioCatalog"
                title="刷新手机端音乐列表"
              >
                🔄 刷新列表
              </button>
              <button 
                class="btn btn-secondary btn-xs" 
                @click="handleImportFolder"
                title="导入本地音频文件夹"
              >
                📁 导入本地
              </button>
              <button 
                class="btn btn-secondary btn-xs btn-panel-toggle" 
                @click="isAudioControlExpanded = !isAudioControlExpanded"
                :title="isAudioControlExpanded ? '收起音乐管理面板' : '展开音乐管理面板与统计'"
              >
                <span>{{ isAudioControlExpanded ? '▴ 收起面板' : '▾ 展开面板' }}</span>
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
                  :title="selectedAudiosCount > 0 ? '下载所有已勾选的音乐' : '请在下方勾选要下载的音乐'"
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
              {{ audioTabFilter === 'synced' ? '暂无电脑已备份音乐' : (audioTabFilter === 'unsynced' ? '🎉 手机音乐已全部备份！' : (t.audios?.emptyAudios || '暂无音乐资源')) }}
            </h2>
            <p class="empty-state-desc">
              <span v-if="audioTabFilter === 'synced'">请在顶部切换至「📱 手机待下载」勾选音乐并点击下载。</span>
              <span v-else-if="audioTabFilter === 'unsynced'">手机中所有检测到的音乐均已同步至电脑本地。</span>
              <span v-else>{{ syncStatus === 'connected' ? (t.audios?.emptyConnectedDesc || '手机中暂未检测到音频文件，或点击上方「刷新列表」重新扫描。') : (t.audios?.emptyDisconnectedDesc || '请在左下角连接手机以自动发现并按日期同步音乐，或点击上方「导入本地」选取电脑音频。') }}</span>
            </p>
          </div>

          <!-- Cyber Hi-Fi Date-Grouped Music Playlist -->
          <div v-else class="audios-scroll-container">
            <div 
              v-for="group in filteredAudioGroupsByDate" 
              :key="group.rawDate"
              class="audio-date-group"
            >
              <!-- Glassmorphism Audio Date Header -->
              <div class="audio-date-header glass-panel">
                <div class="audio-date-title-wrap">
                  <div class="audio-date-icon-box">📅</div>
                  <h4 class="audio-date-text">{{ group.dateKey }}</h4>
                  <span class="audio-date-meta-pill">{{ group.filteredCount }} 首 • {{ formatBytes(group.filteredBytes) }}</span>
                </div>
                <div class="audio-date-actions" v-if="group.hasUnsynced && syncStatus === 'connected'">
                  <button 
                    class="btn-audio-date-select"
                    :class="{ 'is-selected': isAudioDateAllSelected(group) }"
                    @click="toggleAudioDateSelection(group)"
                    :title="isAudioDateAllSelected(group) ? '取消勾选此日期的所有待同步音乐' : '勾选此日期的所有待同步音乐'"
                  >
                    <span class="btn-check-dot">{{ isAudioDateAllSelected(group) ? '✓' : '' }}</span>
                    <span>{{ isAudioDateAllSelected(group) ? '已全选' : `勾选此日期 (${group.unsyncedCount})` }}</span>
                  </button>
                  <button 
                    class="btn-audio-date-sync"
                    :disabled="isAudioSyncing"
                    @click="requestAudioSync({ targetDate: group.rawDate, targetIds: group.unsyncedIds })"
                    title="仅下载此日期的全部音乐"
                  >
                    <span class="bolt-icon">⚡</span>
                    <span>同步此日期 ({{ group.unsyncedCount }})</span>
                  </button>
                </div>
                <div class="audio-date-actions" v-else-if="!group.hasUnsynced">
                  <span class="audio-all-synced-badge">
                    <span class="check-pill-icon">✓</span>
                    <span>全部已备份</span>
                  </span>
                </div>
              </div>

              <!-- Sleek Cyber Hi-Fi Track Cards -->
              <div class="audio-track-list">
                <div 
                  v-for="track in group.items" 
                  :key="track.id || track.path"
                  class="audio-track-card glass-panel"
                  :class="{ 
                    'track-selected': isAudioSelected(track),
                    'track-synced': track.isSynced,
                    'track-playing': activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path)
                  }"
                  @click="track.isSynced ? openAudioPlayer(track) : toggleAudioSelection(track)"
                >
                  <!-- Left: Checkbox (for unsynced) + Spinning Vinyl Record Art -->
                  <div class="audio-track-left">
                    <!-- Unsynced Multi-Select Checkbox -->
                    <div 
                      v-if="!track.isSynced" 
                      class="hifi-track-checkbox"
                      :class="{ 'is-checked': isAudioSelected(track) }"
                      @click.stop="toggleAudioSelection(track)"
                      title="勾选/取消勾选曲目"
                    >
                      <span v-if="isAudioSelected(track)" class="check-icon">✓</span>
                    </div>

                    <!-- Hi-Fi Vinyl Cover / Equalizer Animation -->
                    <div 
                      class="hifi-vinyl-cover" 
                      :class="{ 'is-playing': activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path) }"
                    >
                      <div class="hifi-vinyl-disc">
                        <div class="vinyl-groove-rings"></div>
                        <div class="vinyl-center-label">
                          <span class="vinyl-icon-symbol">🎵</span>
                        </div>
                      </div>

                      <!-- Equalizer wave jumping animation when playing -->
                      <div v-if="activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path)" class="hifi-eq-bars">
                        <span class="eq-bar bar-1"></span>
                        <span class="eq-bar bar-2"></span>
                        <span class="eq-bar bar-3"></span>
                        <span class="eq-bar bar-4"></span>
                      </div>
                    </div>

                    <!-- Track Metadata Info with Smart Title & Tags -->
                    <div class="hifi-track-meta">
                      <div class="hifi-title-row">
                        <span class="hifi-track-title" :title="track.name">{{ getCleanAudioTitle(track.name) }}</span>
                        <span v-if="getAudioFormatType(track.name) === 'hi-res'" class="hifi-tag hifi-tag-hires">Hi-Res</span>
                      </div>
                      <div class="hifi-track-tags">
                        <span class="hifi-tag" :class="`hifi-tag-${getAudioFormatType(track.name)}`">
                          {{ getAudioFormat(track.name) }}
                        </span>
                        <span v-if="track.duration" class="hifi-tag hifi-tag-duration">
                          ⏱️ {{ formatVideoDuration(track.duration) }}
                        </span>
                        <span class="hifi-tag hifi-tag-size">
                          💾 {{ formatBytes(track.size) }}
                        </span>
                        <span 
                          class="hifi-status-pill" 
                          :class="track.isSynced ? 'pill-synced' : 'pill-unsynced'"
                        >
                          <span class="status-icon-symbol">{{ track.isSynced ? '✓' : '⬇' }}</span>
                          <span>{{ track.isSynced ? '已备份' : '待下载' }}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Action Buttons (Play / Quick Download) -->
                  <div class="hifi-track-actions" @click.stop>
                    <template v-if="track.isSynced">
                      <button 
                        class="btn-hifi-play"
                        :class="{ 'is-active-playing': activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path) }"
                        @click="openAudioPlayer(track)"
                        :title="activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path) ? '正在播放中' : '播放此音乐'"
                      >
                        <span v-if="activePlayingAudio && (activePlayingAudio.id === track.id || activePlayingAudio.path === track.path)">🔊 播放中</span>
                        <span v-else>▶️ 播放</span>
                      </button>
                    </template>
                    <template v-else>
                      <button 
                        class="btn-hifi-download"
                        :disabled="isAudioSyncing"
                        @click="downloadSingleAudio(track)"
                        title="单曲极速下载"
                      >
                        <span>⬇️</span> 下载
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
                <button class="vp-floating-close-btn" @click="closeAudioPlayer" title="关闭播放器 (ESC)">✕</button>

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
                      {{ faceScanProgress.done < faceScanProgress.total ? '正在逐张提取人脸特征...' : '正在进行生物特征聚类...' }}
                    </span>
                    <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 0;">
                      ({{ faceScanProgress.done }} / {{ faceScanProgress.total }})
                    </span>
                  </div>
                  
                  <!-- Timing Badges (Fixed Single Line, No Wrapping) -->
                  <div style="display: flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; flex-shrink: 0; white-space: nowrap;">
                    <span v-if="faceScanDurationMs > 0 || (faceScanProgress && faceScanProgress.durationMs > 0)" style="font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.25); white-space: nowrap;">
                      ⚡ 单张: {{ faceScanDurationMs || faceScanProgress.durationMs }} ms
                    </span>
                    <span v-if="faceScanAvgMs > 0 || (faceScanProgress && faceScanProgress.avgDurationMs > 0)" style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.25); white-space: nowrap;">
                      ⏱️ 平均: {{ faceScanAvgMs || faceScanProgress.avgDurationMs }} ms/张
                    </span>
                    <span v-if="faceScanRemainingTime" style="font-size: 11px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.25); white-space: nowrap;">
                      ⏳ 剩余: {{ faceScanRemainingTime }}
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
                    {{ faceScanProgress.currentName ? `当前处理: ${faceScanProgress.currentName}` : '准备中...' }}
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
                <span>请在左侧点击选择一个人物查看相册照片</span>
              </div>
            </main>
          </div>
        </div>

        <!-- 5.1 YT-DLP DOWNLODER TAB -->
        <div v-else-if="currentTab === 'yt-dlp'" style="width: 100%; box-sizing: border-box; text-align: left; display: flex; flex-direction: column; height: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
            <div>
              <h2 style="font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0; background: linear-gradient(135deg, #ffffff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                {{ t.ytDlp?.title || '📺 视频解析与下载 (YT-DLP)' }}
              </h2>
              <p style="color: var(--text-secondary); font-size: 13px; margin: 0;">
                {{ t.ytDlp?.subtitle || '基于强大的跨平台解析引擎。支持全球数百个主流视频网站的无损解析和一键下载。' }}
              </p>
            </div>
            
            <div style="display: flex; background: rgba(255,255,255,0.05); padding: 4px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
              <div 
                @click="ytMode = 'link'" 
                style="padding: 6px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 6px; transition: all 0.2s;"
                :style="{ background: ytMode === 'link' ? 'var(--primary)' : 'transparent', color: ytMode === 'link' ? '#fff' : 'var(--text-secondary)' }"
              >
                {{ t.ytDlp?.linkMode || '🔗 粘贴链接解析' }}
              </div>
              <div 
                @click="ytMode = 'browser'" 
                style="padding: 6px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 6px; transition: all 0.2s;"
                :style="{ background: ytMode === 'browser' ? 'var(--primary)' : 'transparent', color: ytMode === 'browser' ? '#fff' : 'var(--text-secondary)' }"
              >
                {{ t.ytDlp?.browserMode || '🌐 内嵌浏览器嗅探' }}
              </div>
            </div>
          </div>

          <!-- Link Download Mode -->
          <div v-if="ytMode === 'link'" class="glass-panel" style="padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; gap: 12px; margin-bottom: 16px;">
              <input 
                v-model="ytUrl" 
                type="text" 
                :placeholder="t.ytDlp?.urlPlaceholder || '在此粘贴视频链接 (例如: https://www.youtube.com/watch?v=...)'" 
                style="flex: 1; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color); color: var(--text-primary); padding: 12px 16px; border-radius: var(--border-radius-sm); outline: none; font-size: 14px; transition: all 0.3s;"
                :disabled="ytDownloading"
                @keyup.enter="parseYtVideo"
              />
              <button 
                class="btn btn-primary" 
                style="padding: 12px 24px; font-size: 14px; white-space: nowrap; font-weight: 600;"
                @click="parseYtVideo"
                :disabled="ytDownloading || !ytUrl"
              >
                {{ t.ytDlp?.parseBtn || '⚡ 快速解析' }}
              </button>
            </div>

            <!-- Video Info & Download Options -->
            <div v-if="ytVideoInfo" style="display: flex; gap: 16px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); margin-bottom: 16px;">
              <img v-if="ytVideoInfo.thumbnail" :src="ytVideoInfo.thumbnail" style="width: 160px; height: 90px; object-fit: cover; border-radius: 4px;" />
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    {{ ytVideoInfo.title }}
                  </div>
                  <div style="font-size: 12px; color: var(--text-muted);">时长: {{ Math.floor(ytVideoInfo.duration / 60) }}:{{ String(ytVideoInfo.duration % 60).padStart(2, '0') }}</div>
                </div>
                
                <div style="display: flex; gap: 12px; align-items: center; margin-top: 12px;">
                  <select v-model="ytSelectedFormat" style="background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 4px; outline: none; font-size: 13px; max-width: 250px;">
                    <option v-for="fmt in ytVideoInfo.formats" :key="fmt.format_id" :value="fmt.format_id">
                      {{ fmt.resolution }} ({{ fmt.ext }}) - {{ fmt.note || '有声' }} - {{ fmt.filesize ? (fmt.filesize / 1024 / 1024).toFixed(1) + 'MB' : '未知大小' }}
                    </option>
                  </select>
                  <button class="btn btn-primary" style="padding: 6px 16px; font-size: 13px;" @click="startYtDownload" :disabled="ytDownloading">
                    {{ ytDownloading ? '下载中...' : (t.ytDlp?.downloadBtn || '🚀 开始极速下载') }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="ytProgress" style="background: rgba(0,0,0,0.3); border-radius: var(--border-radius-sm); padding: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
                <span style="color: var(--text-primary); font-weight: 500;">{{ ytProgress.status }}</span>
                <span style="color: var(--primary);" v-if="ytProgress.progress > 0">{{ ytProgress.progress.toFixed(1) }}%</span>
              </div>
              
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                <div 
                  :style="{ width: (ytProgress.progress || 0) + '%', height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }"
                ></div>
              </div>
              
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
                <span>{{ ytProgress.size ? 'Size: ' + ytProgress.size : '' }}</span>
                <div style="display: flex; gap: 16px;">
                  <span>{{ ytProgress.speed ? 'Speed: ' + ytProgress.speed : '' }}</span>
                  <span>{{ ytProgress.eta ? 'ETA: ' + ytProgress.eta : '' }}</span>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
              <button class="btn btn-secondary" @click="window.api.openDownloadFolder()">
                📁 {{ t.settings?.downloadPathOpen || '打开系统下载目录' }}
              </button>
            </div>
          </div>

          <!-- Browser Download Mode -->
          <div v-if="ytMode === 'browser'" class="glass-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0; min-height: 400px;">
            <div style="display: flex; gap: 12px; padding: 12px 16px; background: rgba(0,0,0,0.4); border-bottom: 1px solid var(--border-color); align-items: center;">
              <button class="btn btn-secondary" style="padding: 6px 12px;" @click="goBackWebview">←</button>
              <button class="btn btn-secondary" style="padding: 6px 12px;" @click="goForwardWebview">→</button>
              <button class="btn btn-secondary" style="padding: 6px 12px;" @click="reloadWebview">↻</button>
              <div style="flex: 1; padding: 6px 12px; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                YouTube Mobile (内嵌)
              </div>
              <button class="btn btn-primary" style="padding: 6px 16px; font-weight: 600;" @click="parseCurrentWebview">
                ✨ {{ t.ytDlp?.parseBtn || '解析当前页视频' }}
              </button>
            </div>
            <webview 
              ref="ytWebviewRef" 
              src="https://m.youtube.com" 
              style="flex: 1; width: 100%; height: 100%; border: none;"
              useragent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
            ></webview>
          </div>
        </div>

        <!-- 5.5 SIMILAR IMAGES TAB -->
        <div v-else-if="currentTab === 'similar'" style="width: 100%; box-sizing: border-box; text-align: left; position: relative;">
          <!-- Sticky Control Bar (不随滚动移出视野) -->
          <div style="position: sticky; top: -32px; z-index: 30; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); transition: all 0.25s ease;">
            
            <!-- Threshold Slider -->
            <div style="display: flex; align-items: center; gap: 16px;">
              <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600; white-space: nowrap;">相似度阈值:</span>
              <input 
                type="range" 
                min="70" 
                max="99" 
                v-model="similarityThreshold" 
                style="width: 180px; accent-color: #a855f7; cursor: pointer;"
              />
              <span style="font-size: 14px; font-weight: 700; color: #a855f7; background: rgba(168, 85, 247, 0.1); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.2); min-width: 45px; text-align: center;">
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
                {{ isAnalyzingSimilar ? `分析中... (${similarAnalysisProgress.done}/${similarAnalysisProgress.total})` : '开始分析相似图片' }}
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
                {{ isDeletingDuplicates ? '删除中...' : `删除选中的重复图 (${selectedDuplicateIds.size})` }}
              </button>
            </div>
          </div>

          <!-- Floating Bottom Sticky Action Bar (有选中时悬浮吸底快速删除) -->
          <transition name="modal-fade">
            <div 
              v-if="selectedDuplicateIds.size > 0" 
              style="position: fixed; bottom: 36px; left: 58%; transform: translateX(-50%); z-index: 60; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(239, 68, 68, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 20px rgba(239, 68, 68, 0.2); border-radius: 99px; padding: 10px 24px; display: flex; align-items: center; gap: 20px; animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);"
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🖼️</span>
                <span style="font-size: 13px; font-weight: 700; color: #fff;">已选中 <span style="color: #f87171; font-size: 15px; font-weight: 800;">{{ selectedDuplicateIds.size }}</span> 张重复图片</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button 
                  class="btn btn-secondary" 
                  @click="selectedDuplicateIds.clear(); selectedDuplicateIds = new Set();"
                  style="padding: 7px 16px; font-size: 12px; border-radius: 20px; font-weight: 600; cursor: pointer;"
                >
                  取消选择
                </button>
                <button 
                  class="btn btn-danger" 
                  @click="deleteSelectedDuplicates"
                  :disabled="isDeletingDuplicates"
                  style="display: flex; align-items: center; gap: 6px; padding: 8px 22px; font-size: 13px; border-radius: 20px; font-weight: 700; background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); cursor: pointer;"
                >
                  <span>🗑️</span>
                  <span>{{ isDeletingDuplicates ? '删除中...' : `立即删除 (${selectedDuplicateIds.size})` }}</span>
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
                    MobileCLIP · AI 聚类引擎
                  </span>
                  <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0 0 0; background: linear-gradient(135deg, #ffffff 30%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    正在进行图像特征比对与聚类
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
                    <span>512-D 向量空间余弦计算</span>
                    <span style="color: #38bdf8; font-weight: 700;">
                      {{ similarAnalysisProgress.total > 0 ? Math.round((similarAnalysisProgress.done / similarAnalysisProgress.total) * 100) : 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Current Processing Target Pill -->
                <div style="width: 100%; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; box-sizing: border-box; overflow: hidden;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; flex-shrink: 0; animation: pulse-glow 1.5s infinite;"></span>
                  <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                    {{ similarAnalysisProgress.currentName ? `处理中: ${similarAnalysisProgress.currentName}` : '正在准备多核特征聚类池...' }}
                  </span>
                </div>

                <!-- Real-time Sci-Fi Stats Grid -->
                <div style="width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                  <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); padding: 10px 8px; border-radius: 12px;">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">已比对</span>
                    <span style="font-size: 14px; font-weight: 800; color: #38bdf8; margin-top: 3px;">
                      {{ similarAnalysisProgress.done }} <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">/ {{ similarAnalysisProgress.total }}</span>
                    </span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); padding: 10px 8px; border-radius: 12px;">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">已用时间</span>
                    <span style="font-size: 14px; font-weight: 800; color: #f8fafc; margin-top: 3px;">
                      {{ similarElapsedTime }}
                    </span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); padding: 10px 8px; border-radius: 12px;">
                    <span style="font-size: 10px; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">预估剩余</span>
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
            <span style="font-size: 15px; color: var(--text-primary); font-weight: 700;">未检测到相似图片分组</span>
            <span style="font-size: 12px; color: var(--text-muted); max-width: 380px; text-align: center; line-height: 1.6;">
              请确保已导入本地文件夹或已同步手机图片，点击上方按钮对所有图片进行一键多路关联比对。
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
                  📁 相似分组 #{{ gIdx + 1 }}
                  <span style="font-size: 11px; color: #a855f7; font-weight: 600;">(包含 {{ group.images.length }} 张图片)</span>
                </span>
                
                <!-- Quick Selection Action -->
                <div style="display: flex; align-items: center; gap: 12px;">
                  <button 
                    @click="selectGroupDuplicatesExceptOne(group)" 
                    style="background: transparent; border: 1px solid rgba(168,85,247,0.3); color: #c084fc; border-radius: 8px; padding: 4px 10px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-weight: 600;"
                    onmouseover="this.style.background='rgba(168,85,247,0.1)'"
                    onmouseout="this.style.background='transparent'"
                  >
                    保留一张（自动选中其余图）
                  </button>
                  <button 
                    @click="deselectGroupAll(group)" 
                    style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); border-radius: 8px; padding: 4px 10px; font-size: 12px; cursor: pointer; transition: all 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                    onmouseout="this.style.background='transparent'"
                  >
                    取消选择
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
                      相似度: {{ (img.maxSimWithGroup * 100).toFixed(1) }}%
                    </span>
                  </div>

                  <!-- Image Details -->
                  <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" :title="img.name">
                      {{ img.name }}
                    </span>
                    <span style="font-size: 10px; color: var(--text-muted); display: flex; justify-content: space-between;">
                      <span>大小: {{ formatBytes(img.size || 0) }}</span>
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
        <div v-else-if="currentTab === 'map'" style="width: 100%; display: flex; flex-direction: column; height: calc(100vh - 120px); text-align: left;">
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
                        ⬇️ 立即下载更新
                      </button>
                      <button
                        v-if="updateReadyToInstall"
                        class="dp-btn dp-browse"
                        style="background: linear-gradient(135deg, #f59e0b, #d97706); margin-left: 10px;"
                        @click="installUpdate"
                      >
                        🚀 立即安装并重启
                      </button>
                    </div>

                    <!-- Download progress bar -->
                    <div class="update-download-progress" v-if="updateDownloading" style="margin-top: 10px; width: 100%;">
                      <div class="progress-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px;">
                        <span v-if="updateType === 'differential'" style="color: #c084fc; font-weight: 600;">
                          ⚡ 正在下载差分增量补丁包 (已下载 {{ updateTransferredMB }} MB / {{ updateTotalMB }} MB)
                        </span>
                        <span v-else style="color: #38bdf8; font-weight: 600;">
                          📦 正在下载全量安装包 (已下载 {{ updateTransferredMB }} MB / {{ updateTotalMB }} MB)
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
                        <span class="update-badge-text">新版本已下载完成，点击右侧按钮安装。</span>
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
                  <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button class="dp-btn dp-open" @click="openLogFolder">
                      📄 打开本地运行日志目录 (Open Log Folder)
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
            <div class="update-card-title">发现新版本</div>
            <div class="update-card-subtitle">v{{ currentVersion }} &#x2192; <span class="update-new-ver">v{{ latestVersion }}</span></div>
          </div>
        </div>
        <div class="update-diff-badge">
          <span class="update-diff-icon">&#x26A1;</span>
          <div>
            <div class="update-diff-title">智能差分增量升级</div>
            <div class="update-diff-desc">仅下载变动的数据块，节省 90%+ 流量</div>
          </div>
        </div>
        <div class="update-notes" v-if="updateNotes">
          <div class="update-notes-label">更新说明</div>
          <pre class="update-notes-text">{{ updateNotes }}</pre>
        </div>
        <div class="update-card-actions">
          <button class="update-btn-cancel" @click="showUpdateConfirmModal = false">稍后再说</button>
          <button class="update-btn-confirm" @click="confirmAndStartUpdate">立即升级</button>
        </div>
      </div>
    </div>
    </transition>

    <!-- Update Downloaded & Ready Modal -->
    <transition name="modal-fade">
    <div class="modal-backdrop" v-if="updateReadyToInstall && showUpdateCompleteModal" @click.self="showUpdateCompleteModal = false">
      <div class="update-card">
        <button class="update-card-close" @click="showUpdateCompleteModal = false">&#x2715;</button>
        <div class="update-card-header">
          <div class="update-card-icon-wrap success">
            <span class="update-card-icon">&#x2705;</span>
          </div>
          <div>
            <div class="update-card-title">下载完成，准备升级</div>
            <div class="update-card-subtitle">目标版本 <span class="update-new-ver">v{{ latestVersion }}</span></div>
          </div>
        </div>
        <div class="update-ready-stats">
          <div class="update-stat-item">
            <span class="update-stat-label">升级方式</span>
            <span class="update-stat-val" :class="updateType === 'differential' ? 'diff' : ''">
              {{ updateType === 'differential' ? '差分增量' : '全量安装包' }}
            </span>
          </div>
          <div class="update-stat-item">
            <span class="update-stat-label">下载大小</span>
            <span class="update-stat-val">
              {{ updateTransferredMB }} MB
              <span v-if="updateType === 'differential'" class="update-saved-tag">节省 90%+</span>
            </span>
          </div>
        </div>
        <p class="update-restart-hint">重启后将自动完成安装，数据不会丢失。</p>
        <div class="update-card-actions">
          <button class="update-btn-cancel" @click="showUpdateCompleteModal = false">稍后重启</button>
          <button class="update-btn-confirm" @click="installUpdate">立即重启</button>
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
                正在从手机拉取超清原图...
              </span>

              <!-- Case B: 4K Original Photo Ready -->
              <span 
                v-else-if="isHighResLoaded || selectedImage.type === 'album_photo' || (selectedImage.name && selectedImage.name.startsWith('album_'))" 
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 10px; border-radius: 99px;"
              >
                <span>✨</span> 超清原图
              </span>

              <!-- Case C: Local file -->
              <span 
                v-else-if="!selectedImage.name || !selectedImage.name.startsWith('thumb_')" 
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #a855f7; background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.3); padding: 3px 10px; border-radius: 99px;"
              >
                <span>📁</span> 本地图片
              </span>

              <!-- Case D: Thumbnail only (Phone offline) -->
              <span 
                v-else 
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 3px 10px; border-radius: 99px;"
              >
                <span>⚡</span> 缩略图预览 (手机未连接)
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
            
            <!-- Prominent Lightbox Close Button -->
            <button 
              @click="closeDetails" 
              title="退出大图浏览 (ESC)"
              style="display: flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 99px; background: rgba(239, 68, 68, 0.16); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.background='rgba(239,68,68,0.32)'; this.style.borderColor='rgba(239,68,68,0.6)'; this.style.color='#fff'; this.style.transform='scale(1.04)';"
              onmouseout="this.style.background='rgba(239, 68, 68, 0.16)'; this.style.borderColor='rgba(239, 68, 68, 0.35)'; this.style.color='#fca5a5'; this.style.transform='scale(1)';"
            >
              <span style="font-size: 14px; font-weight: 900;">✕</span>
              <span>关闭大图</span>
              <span style="font-size: 10px; opacity: 0.75; font-family: monospace; background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 3px;">ESC</span>
            </button>

            <!-- Window Minimise/Maximize/Close (if desktop hasApi) -->
            <div v-if="hasApi" style="display: flex; align-items: center; margin-left: 6px; border-left: 1px solid rgba(255,255,255,0.12); padding-left: 6px;">
              <button class="title-bar-btn minimize" @click="minimizeWindow" title="最小化" style="height: 30px; width: 34px; border-radius: 6px;">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10v1H0z" fill="currentColor"/></svg>
              </button>
              <button class="title-bar-btn maximize" @click="maximizeWindow" title="最大化/还原" style="height: 30px; width: 34px; border-radius: 6px;">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor"/></svg>
              </button>
              <button class="title-bar-btn close" @click="closeWindow" title="关闭软件" style="height: 30px; width: 34px; border-radius: 6px;">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Center Viewport Area with Left & Right Nav Chevrons -->
        <div style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 10px 80px; box-sizing: border-box;">
          
          <!-- Previous Button (Left) -->
          <button 
            v-if="currentViewingList.length > 1"
            class="lightbox-nav-btn" 
            @click.stop="prevImage"
            title="上一张 (← 键盘左键)"
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
                    transform: `scale(${currentImageScale}) rotate(${currentImageRotation}deg)`,
                    transition: 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
                    cursor: currentImageScale > 1 ? 'grab' : 'zoom-in'
                  }"
                  @dblclick="currentImageScale = currentImageScale === 1 ? 2 : 1"
                />
                
                <video 
                  v-else-if="selectedItemType === 'video'" 
                  :src="selectedImage.src" 
                  controls 
                  autoplay 
                  style="max-width: 85vw; max-height: 74vh; object-fit: contain; border-radius: 10px; box-shadow: 0 24px 60px rgba(0,0,0,0.75);"
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
            title="下一张 (→ 键盘右键)"
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
            :title="thumb.name || `第 ${tIdx + 1} 张`"
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
              @click="currentImageScale = Math.min(currentImageScale + 0.25, 4)" 
              class="btn-icon-subtle" 
              title="放大"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              🔍+ 放大
            </button>
            <!-- Zoom Out -->
            <button 
              @click="currentImageScale = Math.max(currentImageScale - 0.25, 0.5)" 
              class="btn-icon-subtle" 
              title="缩小"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              🔍- 缩小
            </button>
            <!-- Reset 1:1 -->
            <button 
              @click="currentImageScale = 1; currentImageRotation = 0" 
              class="btn-icon-subtle" 
              title="重置"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              ⟲ 1:1
            </button>
            <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.15); margin: 0 4px;"></div>
            <!-- Rotate -->
            <button 
              @click="currentImageRotation = (currentImageRotation + 90) % 360" 
              class="btn-icon-subtle" 
              title="旋转"
              style="padding: 6px 10px; font-size: 13px; color: #e2e8f0; background: transparent; border: none; cursor: pointer; border-radius: 8px;"
            >
              ↻ 旋转
            </button>
            <!-- Open File Location -->
            <button 
              v-if="selectedImage.path"
              @click="openFileLocation(selectedImage.path)" 
              class="btn-icon-subtle" 
              title="在系统资源管理器中定位文件"
              style="padding: 6px 12px; font-size: 13px; color: #c084fc; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); cursor: pointer; border-radius: 20px; font-weight: 600;"
            >
              📁 定位文件
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Incoming Request Modal -->
    <div class="modal-backdrop" v-if="incomingConnectionRequest" @click.self="handleRespondToRequest(false)">
      <div class="modal-content" style="max-width: 420px; padding: 24px; border-radius: 16px; border: 1px solid rgba(147, 51, 234, 0.2); background: #0f172a; text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center;">
        <div style="font-size: 48px; color: #a855f7; animation: pulse 2s infinite;">🔔</div>
        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary);">收到连接请求</h3>
        <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          设备 <strong style="color: #a855f7;">{{ incomingConnectionRequest.name }}</strong> ({{ incomingConnectionRequest.ip }}) 想要与您建立连接，是否同意？
        </p>
        <div style="display: flex; gap: 12px; width: 100%; margin-top: 8px;">
          <button 
            @click="handleRespondToRequest(false)" 
            style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-primary); font-weight: 600; cursor: pointer; transition: all 0.2s;"
            onmouseover="this.style.background='rgba(255,255,255,0.05)'"
            onmouseout="this.style.background='transparent'"
          >
            拒绝
          </button>
          <button 
            @click="handleRespondToRequest(true)" 
            style="flex: 1; padding: 10px; border-radius: 8px; border: none; background: #7c3aed; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(124,58,237,0.3);"
            onmouseover="this.style.background='#8b5cf6'"
            onmouseout="this.style.background='#7c3aed'"
          >
            同意
          </button>
        </div>
      </div>
    </div>

    <!-- Enter Connection Code Modal -->
    <div class="modal-backdrop" v-if="showEnterCodeModal" @click.self="showEnterCodeModal = false">
      <div class="modal-content" style="max-width: 400px; padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); background: #0f172a; text-align: left; display: flex; flex-direction: column; gap: 16px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">输入配对连接码或 IP</h3>
        <p style="margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          如果您使用的是无摄像头设备，请输入对方显示的 4 位配对连接码（如 3587）或直接输入 IP 地址连接。
        </p>
        <input 
          v-model="enteredCode"
          type="text" 
          placeholder="输入 4 位数字码或 IP 地址 (如 192.168.1.100)"
          style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; font-size: 13px; box-sizing: border-box;"
          @keyup.enter="submitConnectionCode"
        />
        <div style="display: flex; gap: 12px; justify-content: flex-end; width: 100%; margin-top: 4px;">
          <button 
            @click="showEnterCodeModal = false" 
            style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-secondary); font-size: 12px; cursor: pointer;"
          >
            取消
          </button>
          <button 
            @click="submitConnectionCode" 
            style="padding: 8px 18px; border-radius: 6px; border: none; background: #7c3aed; color: white; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(124,58,237,0.2);"
          >
            确定
          </button>
        </div>
      </div>
    </div>

    <!-- Person Photos Gallery Modal -->
    <div class="modal-backdrop" v-if="showPersonModal" @click.self="showPersonModal = false">
      <div class="modal-content" style="max-width: 900px; width: 90%; max-height: 85vh; padding: 24px; border-radius: 16px; display: flex; flex-direction: column; text-align: left;">
        <button class="modal-close" @click="showPersonModal = false">✕</button>
        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">
          👥 {{ selectedPersonName }} 包含的照片 ({{ selectedPersonPhotos.length }} 张)
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
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">如何连接您的手机与电脑?</h3>
        
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">📶 局域网配对方式（推荐）:</strong>
            请确保手机和电脑连接在同一个 Wi-Fi 网络（路由器），且开启了手机的蓝牙以加速协商。直接使用手机扫描 PC 屏幕上的二维码即可建立直连。
          </div>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 4px 0;" />
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">⚡ 热点直连方式（适合断网/限制环境）:</strong>
            如果周围没有路由器或路由器设置了客户端隔离（如公共/校园网），点击 PC 端的“热点”按钮，手机连上 PC 开启的专属 Wi-Fi（SSID 与密码将显示在屏幕上），连接成功后再扫描二维码配对。
          </div>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 4px 0;" />
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 4px;">🌐 P2P 设备搜索方式:</strong>
            在屏幕下方的“附近设备”列表中，只要手机和电脑运行了本软件并接入同一局域网或热点，就会自动搜索出对方。您可以直接在 PC 上点击“连接”请求互联。
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; width: 100%; margin-top: 8px;">
          <button 
            @click="showHowToConnectModal = false" 
            style="padding: 8px 24px; border-radius: 6px; border: none; background: #7c3aed; color: white; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(124,58,237,0.2);"
          >
            知道了
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
    title: '强制重新提取人脸',
    message: '确定要清空所有人脸识别记录，并对全部图片重新进行人脸提取吗？\n如果图片较多，可能需要几分钟时间。',
    confirmText: '开始重新提取',
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
const ytUrl = ref('');
const ytMode = ref('link'); // 'link' | 'browser'
const ytVideoInfo = ref(null);
const ytSelectedFormat = ref('best');
const ytProgress = ref(null);
const ytDownloading = ref(false);
const ytWebviewRef = ref(null);
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

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
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
                <img src="${firstImgSrc}" class="map-cluster-img" />
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
          iconSize: [40, 40],
          iconAnchor: [20, 20]
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
  } else if (newTab === 'videos' && syncStatus.value === 'connected') {
    queryRemoteVideoCatalog();
  } else if (newTab === 'audios' && syncStatus.value === 'connected') {
    queryRemoteAudioCatalog();
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
    let dateKey = '其他日期';
    let rawDate = '1970-01-01';
    if (video.create_date) {
      rawDate = video.create_date.substring(0, 10);
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        dateKey = `${parts[0]}年${parts[1]}月${parts[2]}日`;
      } else {
        dateKey = rawDate;
      }
    } else if (video.sync_time) {
      const d = new Date(video.sync_time);
      rawDate = d.toISOString().substring(0, 10);
      dateKey = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
    }

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
      let dateKey = '其他日期';
      let rawDate = '1970-01-01';
      if (remote.create_date) {
        rawDate = remote.create_date.substring(0, 10);
        const parts = rawDate.split('-');
        if (parts.length === 3) {
          dateKey = `${parts[0]}年${parts[1]}月${parts[2]}日`;
        }
      } else if (remote.timestamp) {
        const d = new Date(remote.timestamp);
        rawDate = d.toISOString().substring(0, 10);
        dateKey = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
      }

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
  let clean = name.replace(/\.(mp3|m4a|flac|wav|aac|ogg|wma|opus|ape|dsf|dff|alac)$/i, '');
  return clean.trim() || name;
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
    let dateKey = '其他日期';
    let rawDate = '1970-01-01';
    if (audio.create_date) {
      rawDate = audio.create_date.substring(0, 10);
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        dateKey = `${parts[0]}年${parts[1]}月${parts[2]}日`;
      } else {
        dateKey = rawDate;
      }
    } else if (audio.sync_time) {
      const d = new Date(audio.sync_time);
      rawDate = d.toISOString().substring(0, 10);
      dateKey = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
    }

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
      let dateKey = '其他日期';
      let rawDate = '1970-01-01';
      if (remote.create_date) {
        rawDate = remote.create_date.substring(0, 10);
        const parts = rawDate.split('-');
        if (parts.length === 3) {
          dateKey = `${parts[0]}年${parts[1]}月${parts[2]}日`;
        }
      } else if (remote.timestamp) {
        const d = new Date(remote.timestamp);
        rawDate = d.toISOString().substring(0, 10);
        dateKey = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
      }

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

// Watch tab and payload changes to render the QR Code reliably
watch([currentTab, qrPayload], async () => {
  if (currentTab.value === 'link' && qrPayload.value) {
    await nextTick();
    if (qrCanvas.value) {
      QRCode.toCanvas(qrCanvas.value, JSON.stringify(qrPayload.value), { width: 140, margin: 1 }, (error) => {
        if (error) console.error("QR Code rendering error:", error);
      });
    }
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

async function openLogFolder() {
  if (hasApi && window.api.openLogFolder) {
    await window.api.openLogFolder();
  }
}

// App Update checks
const updateStatus = ref('idle'); // 'idle' | 'checking' | 'up-to-date' | 'new-available' | 'failed'
const currentVersion = ref('');
const latestVersion = ref('');
const updateUrl = ref('');
const updateDownloadUrl = ref('');
const updateNotes = ref('');
const updateError = ref('');
const updateDownloading = ref(false);
const updateDownloadProgress = ref(0);
const updateReadyToInstall = ref(false);
const updateInstallerPath = ref('');

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
  if (!updateInstallerPath.value) return;
  try {
    await window.api.installUpdate(updateInstallerPath.value);
  } catch (err) {
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
      alert(`所选文件夹中未找到任何图片文件。\n支持格式: JPG, PNG, WEBP, BMP, GIF, HEIC, TIFF`);
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
      alert(`🎉 成功导入 ${result.totalImages} 张图片！\n\n请点击左侧面板的【重新算 AI】按钮开始 AI 分类与人脸识别。`);
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
    ? "确定要清空本地同步数据库及已下载的图片缓存，并请求手机重新传输全部图片重新计算吗？\n\n此操作将重置本地所有相册索引与 AI 特征缓存。" 
    : "手机当前未连接。确定要清空本地已同步缓存记录吗？\n\n清空后，下次手机连接时将重新传输全部图片进行运算。";

  showConfirm({
    icon: '🗑️',
    title: '清空本地数据与缓存',
    message: confirmMsg,
    confirmText: '清空并重置',
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
  const deviceName = activeDeviceName.value || '当前手机';
  const confirmMsg = isConnected
    ? `确定要清空手机 [${deviceName}] 在本电脑上的全部缩略图缓存、相册备份索引与 AI 特征数据库吗？\n\n清空后将重置该手机的已同步状态（不会立即重新下载），释放本地磁盘空间。`
    : "确定要清空当前手机在本地的缓存与同步数据库记录吗？";

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
      alert("⚠️ 无法计算相似图：未导入或同步任何图片。请先在‘图片’主界面导入本地文件夹，或在‘连接手机’界面同步手机图片。");
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

  showConfirm({
    icon: '🗑️',
    title: '确认删除重复图片',
    message: isConnected 
      ? `确定要删除选中的 ${count} 张重复图片吗？\n\n此操作将同时从电脑磁盘和【手机相册】中物理删除原始文件，且不可撤销。`
      : `确定要删除选中的 ${count} 张重复图片吗？\n\n此操作将从电脑磁盘中物理删除文件，并同步更新相册索引，且不可撤销。`,
    confirmText: `确认删除 (${count})`,
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
      logSyncEvent("⚠️ 连接协商超时：未能在 15 秒内建立 WebRTC 通道，正在重新广播...");
      handleWebRtcDisconnect();
    }
  }, 15000);
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
      if (qrCanvas.value && qrPayload.value) {
        QRCode.toCanvas(qrCanvas.value, JSON.stringify(qrPayload.value), { width: 140, margin: 1 });
      }
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
  chatMessages.value = [];
  activeDeviceUuid.value = null;
  activeDeviceName.value = '';
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
  activePlayingVideo.value = video;
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
        if (hotspotSsid.value && hotspotPassword.value) {
          payload.hotspotSsid = hotspotSsid.value;
          payload.hotspotPassword = hotspotPassword.value;
        }
        qrPayload.value = payload;
        syncStatus.value = 'advertising';
        logSyncEvent(`GATT 广播成功! MAC: ${payload.ble_mac}, Session: ${payload.session_id}, HTTP Port: ${httpPort}`);
        await nextTick();
        if (qrCanvas.value) {
          QRCode.toCanvas(qrCanvas.value, JSON.stringify(payload), { width: 140, margin: 1 }, (error) => {
            if (error) logSyncEvent(`⚠️ QR Code error: ${error.message}`);
          });
        }
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
        if (qrCanvas.value) {
          QRCode.toCanvas(qrCanvas.value, JSON.stringify(fallbackPayload), { width: 140, margin: 1 }, (error) => {
            if (error) logSyncEvent(`⚠️ QR Code error: ${error.message}`);
          });
        }
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
  }
  
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

// YT-DLP Download Handler
const parseYtVideo = async () => {
  if (!ytUrl.value) return;
  ytDownloading.value = true;
  ytProgress.value = { status: 'Parsing video information...', progress: 0 };
  ytVideoInfo.value = null;
  const res = await window.api.getYtVideoInfo(ytUrl.value);
  ytDownloading.value = false;
  if (res.success) {
    ytVideoInfo.value = res;
    ytSelectedFormat.value = res.formats[0]?.format_id || 'best';
    ytProgress.value = null;
  } else {
    ytProgress.value = { status: 'Parsing Failed: ' + res.error, progress: 0 };
  }
};

const parseCurrentWebview = () => {
  if (ytWebviewRef.value) {
    const url = ytWebviewRef.value.getURL();
    if (url) {
      ytUrl.value = url;
      ytMode.value = 'link'; // Switch back to link mode to show parse UI
      parseYtVideo();
    }
  }
};

const goBackWebview = () => { if (ytWebviewRef.value && ytWebviewRef.value.canGoBack()) ytWebviewRef.value.goBack(); };
const goForwardWebview = () => { if (ytWebviewRef.value && ytWebviewRef.value.canGoForward()) ytWebviewRef.value.goForward(); };
const reloadWebview = () => { if (ytWebviewRef.value) ytWebviewRef.value.reload(); };

const startYtDownload = async () => {
  if (!ytUrl.value || !ytVideoInfo.value) return;
  ytDownloading.value = true;
  ytProgress.value = { status: 'Initializing...', progress: 0 };
  const res = await window.api.downloadYtVideo(ytUrl.value, '', ytSelectedFormat.value);
  ytDownloading.value = false;
  if (res.success) {
    ytProgress.value = { status: 'Download Complete! Saved to: ' + res.destDir, progress: 100 };
    setTimeout(() => { ytProgress.value = null; ytVideoInfo.value = null; ytUrl.value = ''; }, 5000);
  } else {
    ytProgress.value = { status: 'Failed: ' + res.error, progress: 0 };
  }
};

// Register listeners on mount
onMounted(() => {
  initAnalytics();
  window.addEventListener('keydown', handleGlobalKeydown);
  // Auto-start hotspot and BLE sync on PC startup
  // toggleHotspot();

  if (hasApi) {
    // Load saved download path from main process settings
    window.api.getDownloadPath().then(savedPath => {
      if (savedPath) downloadPath.value = savedPath;
    });

    // Check for updates in the background on startup
    checkAppUpdates();

    // YT-DLP progress listener
    window.api.onYtProgress((data) => {
      ytProgress.value = data;
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
        if (data) {
          const idx = images.value.findIndex(i => (data.id && i.id == data.id) || (data.path && i.path === data.path) || (data.name && i.name === data.name));
          if (idx !== -1) {
            const updated = {
              ...images.value[idx],
              predictions: data.predictions || [],
              status: 'completed'
            };
            images.value.splice(idx, 1, updated);
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
        if (event.channel.label === 'photo_sync') {
          logSyncEvent("📡 监听到直连数据通道创建请求");
          dataChannel = event.channel;
          setupDataChannel(dataChannel);
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
        activePeerType.value = 'Mobile';
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
      
      logSyncEvent(`🎉 图片接收完成并自动分类: ${imageInfo.name}`);
      
      if (imageInfo.isThumbnail) {
        const exists = thumbnailImages.value.some(img => img.name === imageInfo.name);
        if (!exists) {
          const newThumb = {
            src: imageInfo.src,
            name: imageInfo.name,
            path: imageInfo.path,
            predictions: imageInfo.predictions
          };
          thumbnailImages.value.unshift(newThumb);
          
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
        if (thumbSyncTotal.value > 0 && thumbSyncDone.value >= thumbSyncTotal.value) {
          isThumbnailSyncing.value = false;
        }
      } else {
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
          if (event.channel.label === 'photo_sync') {
            dataChannel = event.channel;
            setupDataChannel(dataChannel);
          }
        };
      } else {
        logSyncEvent(`❌ [UDP] 来自 ${ip} 的连接请求已被拒绝。`);
      }
    });

    // 10. Direct SDP received (Consolidated with deduplication & candidate buffering)
    window.api.onDirectSdpReceived(async ({ ip, sdp, sdpType }) => {
      logSyncEvent(`📡 [UDP] 收到 WebRTC SDP ${sdpType} 自 ${ip}`);
      activePeerIp.value = ip;
      if (syncStatus.value !== 'connected') {
        syncStatus.value = 'handshaking';
        startHandshakeTimeout();
      }

      if (sdpType === 'offer') {
        if (isProcessingOffer || hasGeneratedAnswer) {
          logSyncEvent(`[WebRTC] 已有 Offer 在处理中或已生成 Answer，丢弃并发的重复 UDP Offer`);
          return;
        }
        isProcessingOffer = true;
        
        try {
          // If dataChannel is already open and connected, ignore duplicate offer
          if (peerConnection && dataChannel && dataChannel.readyState === 'open') {
            logSyncEvent(`[WebRTC] 直连通道已就绪，忽略重复 Offer`);
            return;
          }

          const savedIceCandidates = [...pendingDirectIceCandidates];
          cleanupWebRtc();
          isProcessingOffer = true; // re-assert: cleanupWebRtc resets this
          pendingDirectIceCandidates.push(...savedIceCandidates);

          const configuration = { iceServers: [] };
          peerConnection = new RTCPeerConnection(configuration);
          setupPeerConnectionListeners(peerConnection);
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              window.api.sendUdpIce(ip, JSON.stringify(event.candidate));
            }
          };
          peerConnection.ondatachannel = (event) => {
            if (event.channel.label === 'photo_sync') {
              dataChannel = event.channel;
              setupDataChannel(dataChannel);
            }
          };

          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            hasGeneratedAnswer = true;

            // Drain queued early ICE candidates
            if (pendingDirectIceCandidates.length > 0) {
              for (const cand of pendingDirectIceCandidates) {
                try { await peerConnection.addIceCandidate(cand); } catch (_) {}
              }
              pendingDirectIceCandidates.length = 0;
            }

            logSyncEvent(`📡 成功生成并发送 Answer SDP 到 ${ip}`);
            await window.api.sendUdpSdp(ip, answer.sdp, 'answer');
          } catch (err) {
            console.warn("[WebRTC] Error setting remote offer / answer:", err);
          }
        } finally {
          isProcessingOffer = false;
        }
      } else if (sdpType === 'answer') {
        if (peerConnection) {
          if (peerConnection.signalingState === 'stable') {
            logSyncEvent(`[WebRTC] 连接已处于 Stable 状态，忽略重复 Answer`);
            return;
          }
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
            if (pendingDirectIceCandidates.length > 0) {
              for (const cand of pendingDirectIceCandidates) {
                try { await peerConnection.addIceCandidate(cand); } catch (_) {}
              }
              pendingDirectIceCandidates.length = 0;
            }
            logSyncEvent(`📡 成功装载远端 Answer SDP`);
          } catch (err) {
            console.warn("[WebRTC] Error setting remote answer:", err);
          }
        }
      }
    });

    // 11. Direct ICE Candidate received
    window.api.onDirectIceReceived((data) => {
      if (!data || !data.candidate) return;
      logSyncEvent(`📡 [UDP] 收到 ICE Candidate 自 ${data.ip || 'unknown'}`);
      try {
        const candidateObj = typeof data.candidate === 'string' ? JSON.parse(data.candidate) : data.candidate;
        const iceCandidate = new RTCIceCandidate(candidateObj);
        if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
          peerConnection.addIceCandidate(iceCandidate).catch(() => {});
        } else {
          pendingDirectIceCandidates.push(iceCandidate);
        }
      } catch (_) {}
    });

    // 11.1 High-Speed HTTP/TCP WebRTC Signaling Received
    if (window.api.onHttpSignalReceived) {
      window.api.onHttpSignalReceived(async ({ reqId, ip, type, sdp, candidates }) => {
        logSyncEvent(`🌐 [HTTP] 收到 WebRTC ${type} 自 ${ip}`);
        activePeerIp.value = ip;
        if (syncStatus.value !== 'connected') {
          syncStatus.value = 'handshaking';
          startHandshakeTimeout();
        }

        if (type === 'offer') {
          if (isProcessingOffer || hasGeneratedAnswer) {
            logSyncEvent(`🌐 [HTTP] 已有 Offer 在处理中或已生成 Answer，跳过重复 HTTP Offer`);
            try {
              await window.api.respondHttpSignal({ reqId, success: false, error: 'Duplicate offer' });
            } catch (_) {}
            return;
          }
          isProcessingOffer = true;
          try {
            const savedIceCandidates = [...pendingDirectIceCandidates];
            cleanupWebRtc();
            isProcessingOffer = true; // re-assert: cleanupWebRtc resets this
            pendingDirectIceCandidates.push(...savedIceCandidates);

            const configuration = { iceServers: [] };
            peerConnection = new RTCPeerConnection(configuration);
            setupPeerConnectionListeners(peerConnection);

            const gatheredCandidates = [];
            peerConnection.onicecandidate = (event) => {
              if (event.candidate) {
                gatheredCandidates.push(event.candidate);
                try { window.api.sendUdpIce(ip, JSON.stringify(event.candidate)); } catch (_) {}
              }
            };
            peerConnection.ondatachannel = (event) => {
              if (event.channel.label === 'photo_sync') {
                dataChannel = event.channel;
                setupDataChannel(dataChannel);
              }
            };

            await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
            
            if (Array.isArray(candidates)) {
              for (const c of candidates) {
                try {
                  const candObj = typeof c === 'string' ? JSON.parse(c) : c;
                  await peerConnection.addIceCandidate(new RTCIceCandidate(candObj));
                } catch (_) {}
              }
            }

            if (pendingDirectIceCandidates.length > 0) {
              for (const cand of pendingDirectIceCandidates) {
                try { await peerConnection.addIceCandidate(cand); } catch (_) {}
              }
              pendingDirectIceCandidates.length = 0;
            }

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            hasGeneratedAnswer = true;

            // Wait briefly for local host ICE candidate gathering so answer contains candidate lines
            await new Promise((resolve) => {
              let resolved = false;
              const timer = setTimeout(() => {
                if (!resolved) { resolved = true; resolve(); }
              }, 300);

              const origIceHandler = peerConnection.onicecandidate;
              peerConnection.onicecandidate = (event) => {
                if (origIceHandler) origIceHandler(event);
                if (!event.candidate) {
                  if (!resolved) { resolved = true; clearTimeout(timer); resolve(); }
                }
              };

              if (peerConnection.iceGatheringState === 'complete') {
                clearTimeout(timer);
                resolve();
              }
            });

            const finalSdp = peerConnection.localDescription?.sdp || answer.sdp;
            logSyncEvent(`🌐 成功通过 HTTP 响应 Answer SDP 到 ${ip} (收集到 ${gatheredCandidates.length} 个 ICE)`);
            await window.api.respondHttpSignal({
              reqId,
              success: true,
              sdp: finalSdp,
              candidates: gatheredCandidates
            });
          } catch (err) {
            console.error("[WebRTC HTTP] Error handling offer:", err);
            logSyncEvent(`❌ [HTTP] 处理 WebRTC Offer 失败: ${err.message || err}`);
            hasGeneratedAnswer = false;
            await window.api.respondHttpSignal({
              reqId,
              success: false,
              error: err.message
            });
          } finally {
            isProcessingOffer = false;
          }
        }
      });
    }

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
                  faceScanRemainingTime.value = `${remSec}秒`;
                } else {
                  const m = Math.floor(remSec / 60);
                  const s = remSec % 60;
                  faceScanRemainingTime.value = `${m}分${s}秒`;
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
      // Find and update the single photo's predictions in images.value
      const idx = images.value.findIndex(img => img.id === data.id || img.name === data.id);
      if (idx !== -1) {
        images.value[idx].predictions = data.predictions;
      }
      // Also update predictions in thumbnailImages if found
      const thumbIdx = thumbnailImages.value.findIndex(t => t.path && t.path.includes(data.id));
      if (thumbIdx !== -1) {
        thumbnailImages.value[thumbIdx].predictions = data.predictions;
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
  currentImageScale.value = 1;
  currentImageRotation.value = 0;
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
  currentImageScale.value = 1;
  currentImageRotation.value = 0;
  isFetchingHighRes.value = false;
}

function prevImage() {
  if (!currentViewingList.value || currentViewingList.value.length <= 1) return;
  lightboxDirection.value = 'prev';
  currentViewingIndex.value = (currentViewingIndex.value - 1 + currentViewingList.value.length) % currentViewingList.value.length;
  const nextImg = currentViewingList.value[currentViewingIndex.value];
  if (nextImg) {
    selectedImage.value = { ...nextImg };
    currentImageScale.value = 1;
    currentImageRotation.value = 0;
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
    currentImageScale.value = 1;
    currentImageRotation.value = 0;
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
    currentImageScale.value = 1;
    currentImageRotation.value = 0;
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

/* Audios Tab (Cyber Hi-Fi Music Station) */
.audios-tab-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
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

.audio-date-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Glassmorphism Audio Date Header */
.audio-date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(18, 24, 38, 0.65);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid #06b6d4;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.audio-date-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.audio-date-icon-box {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-date-text {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-primary, #f8fafc);
  letter-spacing: 0.2px;
}

.audio-date-meta-pill {
  font-size: 11.5px;
  color: var(--text-secondary, #94a3b8);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.audio-date-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-audio-date-select {
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary, #cbd5e1);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-audio-date-select:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}

.btn-audio-date-select.is-selected {
  background: rgba(6, 182, 212, 0.2);
  border-color: rgba(6, 182, 212, 0.5);
  color: #38bdf8;
}

.btn-audio-date-select.is-selected .btn-check-dot {
  background: #06b6d4;
  border-color: #06b6d4;
  color: #fff;
}

.btn-audio-date-sync {
  padding: 4px 14px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 8px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  border: 1px solid rgba(6, 182, 212, 0.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 10px rgba(6, 182, 212, 0.35);
}

.btn-audio-date-sync:hover:not(:disabled) {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.55);
}

.btn-audio-date-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.audio-all-synced-badge {
  font-size: 11.5px;
  color: #34d399;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.15);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Audio Track Cards List */
.audio-track-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audio-track-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--bg-surface, rgba(18, 24, 38, 0.75));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
}

.audio-track-card:hover {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(6, 182, 212, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 20px rgba(6, 182, 212, 0.2);
}

.audio-track-card.track-selected {
  background: rgba(6, 182, 212, 0.14) !important;
  border-color: #06b6d4 !important;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.35), 0 4px 16px rgba(0, 0, 0, 0.3) !important;
}

.audio-track-card.track-playing {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(99, 102, 241, 0.14) 100%) !important;
  border-color: #06b6d4 !important;
  box-shadow: 0 0 26px rgba(6, 182, 212, 0.45), 0 8px 24px rgba(0, 0, 0, 0.4) !important;
}

.audio-track-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

/* Unsynced Track Multi-Select Checkbox */
.hifi-track-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.6);
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.hifi-track-checkbox:hover {
  transform: scale(1.12);
  border-color: #fff;
}

.hifi-track-checkbox.is-checked {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  border-color: #ffffff;
  box-shadow: 0 0 12px rgba(6, 182, 212, 0.85);
}

/* Hi-Fi Vinyl Disc Art Placeholder */
.hifi-vinyl-cover {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, #2d3748 0%, #1a202c 60%, #0d1117 100%);
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  overflow: hidden;
}

.hifi-vinyl-cover.is-playing {
  border-color: #06b6d4;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.65), 0 4px 14px rgba(0, 0, 0, 0.6);
}

.hifi-vinyl-disc {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.hifi-vinyl-cover.is-playing .hifi-vinyl-disc {
  animation: spin 3s linear infinite;
}

.vinyl-groove-rings {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.8);
}

.vinyl-center-label {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
}

.vinyl-icon-symbol {
  font-size: 9px;
}

/* Audio Wave Equalizer Animation (Shown when playing) */
.hifi-eq-bars {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5px;
  z-index: 4;
}

.eq-bar {
  width: 3px;
  background: linear-gradient(to top, #06b6d4, #c084fc);
  border-radius: 2px;
  animation: eq-jump 0.8s ease-in-out infinite alternate;
}

.bar-1 { height: 12px; animation-delay: 0.1s; }
.bar-2 { height: 18px; animation-delay: 0.3s; }
.bar-3 { height: 10px; animation-delay: 0.5s; }
.bar-4 { height: 16px; animation-delay: 0.2s; }
.bar-5 { height: 14px; animation-delay: 0.4s; }
.bar-6 { height: 20px; animation-delay: 0.15s; }
.bar-7 { height: 11px; animation-delay: 0.35s; }
.bar-8 { height: 17px; animation-delay: 0.25s; }

@keyframes eq-jump {
  0% {
    height: 4px;
    opacity: 0.5;
  }
  100% {
    height: 22px;
    opacity: 1;
  }
}

/* Track Metadata Info */
.hifi-track-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  text-align: left;
}

.hifi-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.hifi-track-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary, #f8fafc);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 460px;
  letter-spacing: 0.1px;
}

.hifi-track-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.hifi-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1.5px 7px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.3px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.hifi-tag-hires {
  background: rgba(234, 179, 8, 0.18);
  border: 1px solid rgba(234, 179, 8, 0.5);
  color: #facc15;
  text-shadow: 0 0 8px rgba(234, 179, 8, 0.4);
  font-weight: 900;
}

.hifi-tag-m4a {
  background: rgba(6, 182, 212, 0.18);
  border: 1px solid rgba(6, 182, 212, 0.5);
  color: #22d3ee;
}

.hifi-tag-mp3 {
  background: rgba(168, 85, 247, 0.18);
  border: 1px solid rgba(168, 85, 247, 0.5);
  color: #c084fc;
}

.hifi-tag-ogg {
  background: rgba(16, 185, 129, 0.18);
  border: 1px solid rgba(16, 185, 129, 0.5);
  color: #34d399;
}

.hifi-tag-wav, .hifi-tag-other {
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #60a5fa;
}

.hifi-tag-duration, .hifi-tag-size {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary, #94a3b8);
}

.hifi-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 1.5px 7px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.hifi-track-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 14px;
}

.btn-hifi-play {
  padding: 4.5px 14px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 8px;
  background: linear-gradient(135deg, #06b6d4, #6366f1);
  border: 1px solid rgba(6, 182, 212, 0.5);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 10px rgba(6, 182, 212, 0.35);
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-hifi-play:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.55);
}

.btn-hifi-play.is-active-playing {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  border-color: #10b981;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
}

.btn-hifi-download {
  padding: 4.5px 14px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.16);
  border: 1px solid rgba(6, 182, 212, 0.45);
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-hifi-download:hover:not(:disabled) {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.45);
}

.btn-hifi-download:disabled {
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
  border: 1.5px solid rgba(6, 182, 212, 0.6);
  border-radius: 99px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(6, 182, 212, 0.3);
  min-width: 440px;
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
  background: linear-gradient(135deg, #06b6d4, #3b82f6) !important;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.45) !important;
  display: flex;
  align-items: center;
  gap: 6px;
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
</style>