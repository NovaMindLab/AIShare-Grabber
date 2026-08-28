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
          <span class="version-tag">{{ appVersion }}</span>
        </div>
        
        <nav class="nav-links">
          <a href="#video-demo" class="nav-link">{{ t.nav.videoDemo }}</a>
          <a href="#features" class="nav-link">{{ t.nav.features }}</a>
          <a href="#ai-ecosystem" class="nav-link">{{ t.nav.ai }}</a>
          <a href="#comparison" class="nav-link">{{ t.nav.comparison }}</a>
          <a href="#simulator" class="nav-link">{{ t.nav.simulator }}</a>
          
          <!-- WebShare Online Entry in Navbar -->
          <a 
            href="./webshare/" 
            class="btn btn-webshare nav-btn" 
            :title="t.hero.btnWebshare"
          >
            {{ t.nav.webshare }}
          </a>

          <a href="#download" class="btn btn-primary nav-btn">{{ t.nav.download }}</a>
          
          <!-- GitHub Stars Button -->
          <a 
            href="https://github.com/NovaMindLab/AIShare-Grabber" 
            target="_blank" 
            class="btn btn-github nav-btn"
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
            <span class="gradient-text">{{ t.hero.titleMain }}</span><br />
            <span class="hero-title-sub">{{ t.hero.titleSub }}</span>
          </h1>
          
          <p class="hero-main-desc">
            {{ t.hero.desc }}
          </p>

          <!-- Hero Action Buttons -->
          <div class="hero-cta-container">
            <!-- Row 1: 3 Primary Download/Experience Cards -->
            <div class="hero-primary-actions">
              <a 
                :href="`https://github.com/NovaMindLab/AIShare-Grabber/releases/download/${appVersion}/ShareCLIP-Setup-${appVersion.replace('v','')}.exe`" 
                class="btn btn-primary-hero"
                @click="showDownloadToast(`🚀 ${t.hero.btnWindows}...`)"
              >
                <span class="btn-icon">🖥️</span>
                <div class="btn-content">
                  <div class="btn-label-main">{{ t.hero.btnWindows }}</div>
                  <div class="btn-label-sub">Windows 10 / 11 • 64-bit Installer</div>
                </div>
              </a>

              <a 
                :href="`https://github.com/NovaMindLab/AIShare-Grabber/releases/download/${appVersion}/app-arm64-v8a-release.apk`" 
                class="btn btn-secondary-hero"
                @click="showDownloadToast(`📱 ${t.hero.btnAndroid}...`)"
              >
                <span class="btn-icon">📱</span>
                <div class="btn-content">
                  <div class="btn-label-main">{{ t.hero.btnAndroid }}</div>
                  <div class="btn-label-sub">Android 8.0+ • APK Installer</div>
                </div>
              </a>

              <a 
                href="./webshare/" 
                class="btn btn-webshare-hero"
                :title="t.hero.btnWebshare"
              >
                <span class="btn-icon">🌐</span>
                <div class="btn-content">
                  <div class="btn-label-main">{{ t.hero.btnWebshare }}</div>
                  <div class="btn-label-sub">WebGPU AI • No Install Required</div>
                </div>
              </a>
            </div>

            <!-- Row 2: Secondary Quick Actions -->
            <div class="hero-secondary-actions">
              <a href="#simulator" class="btn btn-outline-hero">
                <span>⚡</span> {{ t.hero.btnSimulate }}
              </a>
              <a href="https://github.com/NovaMindLab/AIShare-Grabber" target="_blank" class="btn btn-outline-hero">
                <span>⭐</span> {{ t.hero.btnGithub }}
              </a>
            </div>
          </div>
        </div>

        <!-- 3D Hero Banner Showcase Frame -->
        <div class="hero-banner-frame glass-panel">
          <img src="/hero_banner.jpg" alt="ShareCLIP 3D Ecosystem" class="hero-banner-img" />
          
          <!-- Floating Status Chips -->
          <div class="floating-chip chip-1">
            <span class="chip-icon">⚡</span>
            <div>
              <div class="chip-title">{{ t.chips.c1_title }}</div>
              <div class="chip-sub">{{ t.chips.c1_sub }}</div>
            </div>
          </div>

          <div class="floating-chip chip-2">
            <span class="chip-icon">🧠</span>
            <div>
              <div class="chip-title">{{ t.chips.c2_title }}</div>
              <div class="chip-sub">{{ t.chips.c2_sub }}</div>
            </div>
          </div>

          <div class="floating-chip chip-3">
            <span class="chip-icon">🔒</span>
            <div>
              <div class="chip-title">{{ t.chips.c3_title }}</div>
              <div class="chip-sub">{{ t.chips.c3_sub }}</div>
            </div>
          </div>
        </div>

        <!-- Stats Matrix -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value gradient-text-purple">{{ t.stats.s1_val }}</div>
            <div class="stat-label">{{ t.stats.s1_label }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gradient-text-cyan">{{ t.stats.s2_val }}</div>
            <div class="stat-label">{{ t.stats.s2_label }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gradient-text">{{ t.stats.s3_val }}</div>
            <div class="stat-label">{{ t.stats.s3_label }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value gradient-text-purple">{{ t.stats.s4_val }}</div>
            <div class="stat-label">{{ t.stats.s4_label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== PROMOTIONAL & REAL-WORLD VIDEO DEMO ==================== -->
    <section id="video-demo" class="section-padding video-showcase-section">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill pulse-glow">🎬 {{ t.videoSection.badge }}</div>
          <h2 class="section-title">{{ t.videoSection.title }}</h2>
          <p class="section-subtitle">{{ t.videoSection.subtitle }}</p>
        </div>

        <!-- Video Player Master Showcase Card -->
        <div class="glass-panel video-showcase-card">
          <!-- Top Window Header Bar -->
          <div class="video-card-topbar">
            <div class="video-window-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <div class="video-window-title">
              <span style="margin-right: 6px;">🎥</span> {{ t.videoSection.videoTitle }}
            </div>
            <div class="video-hd-badge">
              <span>HD 1080P • 60 FPS</span>
            </div>
          </div>

          <!-- Video Player Core -->
          <div class="video-player-wrapper">
            <video 
              ref="promoVideoRef"
              class="promo-video-player"
              controls
              playsinline
              preload="metadata"
              poster="/hero_banner.jpg"
            >
              <source src="/promo_video.mp4" type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
          </div>

          <!-- Bottom Feature Matrix & Quick CTA -->
          <div class="video-features-footer">
            <div class="video-tag-pills">
              <div class="v-tag-pill">
                <span class="v-tag-icon">⚡</span>
                <span>{{ t.videoSection.t1 }}</span>
              </div>
              <div class="v-tag-pill">
                <span class="v-tag-icon">🔒</span>
                <span>{{ t.videoSection.t2 }}</span>
              </div>
              <div class="v-tag-pill">
                <span class="v-tag-icon">🧠</span>
                <span>{{ t.videoSection.t3 }}</span>
              </div>
              <div class="v-tag-pill">
                <span class="v-tag-icon">📱</span>
                <span>{{ t.videoSection.t4 }}</span>
              </div>
            </div>

            <div class="video-cta-row">
              <a href="./webshare/" class="btn btn-webshare-hero" style="padding: 9px 18px; font-size: 13px;">
                <span>🌐</span> {{ t.hero.btnWebshare }}
              </a>
              <a 
                :href="`https://github.com/NovaMindLab/AIShare-Grabber/releases/download/${appVersion}/ShareCLIP-Setup-${appVersion.replace('v','')}.exe`" 
                class="btn btn-primary-hero"
                style="padding: 9px 18px; font-size: 13px;"
                @click="showDownloadToast(`🚀 ${t.hero.btnWindows}...`)"
              >
                <span>🖥️</span> {{ t.hero.btnWindows }}
              </a>
            </div>
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

          <!-- Feature 4: 4K Lightbox -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-purple">🖼️</div>
            <h3>{{ t.features.f4.title }}</h3>
            <p>{{ t.features.f4.desc }}</p>
          </div>

          <!-- Feature 5: GPS Footprint Map -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-cyan">🗺️</div>
            <h3>{{ t.features.f5.title }}</h3>
            <p>{{ t.features.f5.desc }}</p>
          </div>

          <!-- Feature 6: Deduplication -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-emerald">🧹</div>
            <h3>{{ t.features.f6.title }}</h3>
            <p>{{ t.features.f6.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== AI ECOSYSTEM & INTERACTIVE PLAYGROUND ==================== -->
    <section id="ai-ecosystem" class="section-padding" style="background: rgba(10, 15, 30, 0.45);">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill">{{ t.aiSection.badge }}</div>
          <h2 class="section-title">{{ t.aiSection.title }}</h2>
          <p class="section-subtitle">{{ t.aiSection.subtitle }}</p>
        </div>

        <!-- AI Illustration Banner -->
        <div class="ai-banner-frame glass-panel" style="margin-bottom: 36px;">
          <img src="/ai_features.jpg" alt="ShareCLIP AI Features Showcase" class="ai-banner-img" />
        </div>

        <!-- Interactive AI Playground Card with 3 Tabs -->
        <div class="glass-panel interactive-ai-box">
          <!-- Playground Tabs Navigation -->
          <div class="playground-nav-tabs">
            <button 
              class="playground-tab-btn" 
              :class="{ active: activeAiTab === 'search' }"
              @click="activeAiTab = 'search'"
            >
              <span>🔍</span> {{ t.aiSection.tabSearch }}
            </button>
            <button 
              class="playground-tab-btn" 
              :class="{ active: activeAiTab === 'faces' }"
              @click="activeAiTab = 'faces'"
            >
              <span>👥</span> {{ t.aiSection.tabFaces }}
            </button>
            <button 
              class="playground-tab-btn" 
              :class="{ active: activeAiTab === 'dedup' }"
              @click="activeAiTab = 'dedup'"
            >
              <span>🧹</span> {{ t.aiSection.tabDedup }}
            </button>
          </div>

          <!-- TAB 1: CLIP Search Simulator -->
          <div v-if="activeAiTab === 'search'" class="tab-pane-content">
            <div class="interactive-ai-header">
              <span style="font-size: 22px;">🔍</span>
              <div>
                <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: #fff;">{{ t.aiSection.searchTitle }}</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">{{ t.aiSection.searchSub }}</p>
              </div>
            </div>

            <!-- Search Bar -->
            <div class="ai-search-bar">
              <span style="font-size: 18px; color: #a855f7;">🔍</span>
              <input 
                v-model="aiSearchQuery" 
                type="text" 
                :placeholder="t.aiSection.searchPlaceholder"
                class="ai-search-input"
                @keydown.enter="runAiSearch"
              />
              <button class="btn btn-primary" style="padding: 8px 18px; font-size: 13px;" @click="runAiSearch">
                {{ t.aiSection.searchBtn }}
              </button>
            </div>

            <!-- Preset Chips -->
            <div class="preset-chips-row">
              <span style="font-size: 12px; color: var(--text-muted); align-self: center;">{{ t.aiSection.presetLabel }}</span>
              <button 
                v-for="preset in t.aiSection.presets" 
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
                @click="openLightbox(item)"
              >
                <div class="ai-card-img-wrap">
                  <img :src="item.img" :alt="item.name" class="ai-card-img" />
                  <span class="ai-score-badge" :class="item.score > 0.85 ? 'score-high' : 'score-low'">
                    {{ Math.round(item.score * 100) }}% {{ t.aiSection.similarity }}
                  </span>
                  <div class="lightbox-hint">{{ t.aiSection.clickPreview }}</div>
                </div>
                <div class="ai-card-info">
                  <div class="ai-card-title">{{ item.name }}</div>
                  <div class="ai-card-meta">
                    <span class="ai-card-tag">{{ item.tag }}</span>
                    <span class="ai-card-dim">512-D</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: Face Clustering Simulator -->
          <div v-else-if="activeAiTab === 'faces'" class="tab-pane-content">
            <div class="interactive-ai-header">
              <span style="font-size: 22px;">👥</span>
              <div>
                <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: #fff;">{{ t.aiSection.faceTitle }}</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">{{ t.aiSection.faceSub }}</p>
              </div>
            </div>

            <!-- Face Avatars Row -->
            <div class="face-avatars-row">
              <div 
                v-for="face in mockFaceGroups" 
                :key="face.name"
                class="face-avatar-card"
                :class="{ active: selectedFace === face.name }"
                @click="selectedFace = face.name"
              >
                <img :src="face.avatar" :alt="face.name" class="face-avatar-img" />
                <div class="face-name">{{ face.name }}</div>
                <div class="face-count">{{ face.photos.length }} {{ t.aiSection.photosCount }}</div>
              </div>
            </div>

            <!-- Clustered Photos Grid -->
            <div class="ai-results-grid" style="margin-top: 20px;">
              <div 
                v-for="item in currentFacePhotos" 
                :key="item.name" 
                class="ai-result-card"
                @click="openLightbox(item)"
              >
                <div class="ai-card-img-wrap">
                  <img :src="item.img" :alt="item.name" class="ai-card-img" />
                  <span class="ai-score-badge score-high">
                    👤 {{ selectedFace }}
                  </span>
                  <div class="lightbox-hint">{{ t.aiSection.clickPreview }}</div>
                </div>
                <div class="ai-card-info">
                  <div class="ai-card-title">{{ item.name }}</div>
                  <div class="ai-card-meta">
                    <span class="ai-card-tag">{{ item.date }}</span>
                    <span class="ai-card-dim">0.04ms SIMD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: Duplicate Deduplication Simulator -->
          <div v-else-if="activeAiTab === 'dedup'" class="tab-pane-content">
            <div class="interactive-ai-header">
              <span style="font-size: 22px;">🧹</span>
              <div>
                <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: #fff;">{{ t.aiSection.dedupTitle }}</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">{{ t.aiSection.dedupSub }}</p>
              </div>
            </div>

            <!-- Deduplication Controls -->
            <div class="dedup-controls-bar">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 13px; color: var(--text-muted);">{{ t.aiSection.threshold }}</span>
                <input type="range" min="80" max="98" v-model="simThreshold" class="sim-slider" />
                <span style="font-weight: 700; color: #38bdf8; font-size: 14px;">{{ simThreshold }}%</span>
              </div>
              <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 13px;" @click="simulateDedupCleanup">
                <span>🧹</span> {{ t.aiSection.cleanupBtn }}
              </button>
            </div>

            <!-- Duplicate Groups List -->
            <div class="dedup-groups-container">
              <div v-for="(group, gIdx) in mockDuplicateGroups" :key="gIdx" class="dedup-group-card">
                <div class="dedup-group-header">
                  <span class="dedup-group-title">{{ t.aiSection.group }} #{{ gIdx + 1 }}: {{ group.title }}</span>
                  <span class="badge-pill" style="font-size: 11px; padding: 2px 10px;">{{ t.aiSection.similarity }} ≥ {{ group.similarity }}%</span>
                </div>
                <div class="dedup-photos-row">
                  <div 
                    v-for="(photo, pIdx) in group.photos" 
                    :key="photo.name"
                    class="dedup-photo-item"
                    :class="{ 'to-keep': pIdx === 0, 'to-delete': pIdx > 0 }"
                    @click="openLightbox(photo)"
                  >
                    <img :src="photo.img" :alt="photo.name" />
                    <div class="dedup-status-label" :class="pIdx === 0 ? 'keep-badge' : 'del-badge'">
                      {{ pIdx === 0 ? t.aiSection.bestKeep : t.aiSection.suggestDel }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== HANDSHAKE SIMULATOR & ANIMATED PROTOCOL ==================== -->
    <section id="simulator" class="section-padding">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill">{{ t.simulator.badge }}</div>
          <h2 class="section-title">{{ t.simulator.title }}</h2>
          <p class="section-subtitle">{{ t.simulator.subtitle }}</p>
        </div>

        <!-- Dynamic 60fps Animated P2P Stream Banner -->
        <div class="ai-banner-frame glass-panel" style="margin-bottom: 36px; padding: 6px; background: rgba(5,8,17,0.85); border: 1px solid rgba(56,189,248,0.25); box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
          <img src="/p2p_flow_animated.svg" alt="Direct-Link P2P Signaling & Transmission Animation" style="width: 100%; border-radius: 12px; display: block;" />
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
            <!-- Dynamic Step Visual Area -->
            <div class="simulator-viewport">
              <!-- Step 1 View: QR scan -->
              <div v-if="currentStep === 1" class="step-view-center">
                <div class="mock-qr-wrap">
                  <div class="mock-qr">
                    <div class="qr-corner top-left"></div>
                    <div class="qr-corner top-right"></div>
                    <div class="qr-corner bottom-left"></div>
                    <div class="qr-center-icon">⚡</div>
                    <div class="qr-scan-bar"></div>
                  </div>
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
                    <span>{{ t.simulator.consoleTitle }}</span>
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
                    <span>{{ t.simulator.desktop }}</span>
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
                    <span>{{ t.simulator.mobile }}</span>
                  </div>
                </div>
                
                <div class="transfer-controls">
                  <button 
                    class="btn btn-outline" 
                    :class="{ active: flowDir === 'pc-to-phone' }"
                    @click="simulateTransfer('pc-to-phone')"
                  >
                    {{ t.simulator.pcToPhone }}
                  </button>
                  <button 
                    class="btn btn-outline" 
                    :class="{ active: flowDir === 'phone-to-pc' }"
                    @click="simulateTransfer('phone-to-pc')"
                  >
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
              <h3 style="color: var(--text-main); font-size: 16px; margin-bottom: 12px;">{{ t.simulator.techTitle }}</h3>
              <div class="explainer-desc">
                <p v-if="currentStep === 1">
                  <strong>{{ t.simulator.t1_title }}</strong><br/>
                  {{ t.simulator.t1_desc }}
                </p>
                <p v-else-if="currentStep === 2">
                  <strong>{{ t.simulator.t2_title }}</strong><br/>
                  {{ t.simulator.t2_desc }}
                </p>
                <p v-else-if="currentStep === 3">
                  <strong>{{ t.simulator.t3_title }}</strong><br/>
                  {{ t.simulator.t3_desc }}
                </p>
                <p v-else-if="currentStep === 4">
                  <strong>{{ t.simulator.t4_title }}</strong><br/>
                  {{ t.simulator.t4_desc }}
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
          <div class="badge-pill">{{ t.comparison.badge }}</div>
          <h2 class="section-title">{{ t.comparison.title }}</h2>
          <p class="section-subtitle">{{ t.comparison.subtitle }}</p>
        </div>

        <div class="glass-panel comparison-table-wrap">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>{{ t.comparison.dim }}</th>
                <th class="highlight-col">{{ t.comparison.shareclip }}</th>
                <th>{{ t.comparison.cloud }}</th>
                <th>{{ t.comparison.chat }}</th>
                <th>{{ t.comparison.usb }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>{{ t.comparison.speed_dim }}</strong></td>
                <td class="highlight-col"><span class="badge-green">{{ t.comparison.speed_shareclip }}</span></td>
                <td>{{ t.comparison.speed_cloud }}</td>
                <td>{{ t.comparison.speed_chat }}</td>
                <td>{{ t.comparison.speed_usb }}</td>
              </tr>
              <tr>
                <td><strong>{{ t.comparison.privacy_dim }}</strong></td>
                <td class="highlight-col"><span class="badge-green">{{ t.comparison.privacy_shareclip }}</span></td>
                <td>{{ t.comparison.privacy_cloud }}</td>
                <td>{{ t.comparison.privacy_chat }}</td>
                <td>{{ t.comparison.privacy_usb }}</td>
              </tr>
              <tr>
                <td><strong>{{ t.comparison.ai_dim }}</strong></td>
                <td class="highlight-col"><span class="badge-green">{{ t.comparison.ai_shareclip }}</span></td>
                <td>{{ t.comparison.ai_cloud }}</td>
                <td>{{ t.comparison.ai_chat }}</td>
                <td>{{ t.comparison.ai_usb }}</td>
              </tr>
              <tr>
                <td><strong>{{ t.comparison.face_dim }}</strong></td>
                <td class="highlight-col"><span class="badge-green">{{ t.comparison.face_shareclip }}</span></td>
                <td>{{ t.comparison.face_cloud }}</td>
                <td>{{ t.comparison.face_chat }}</td>
                <td>{{ t.comparison.face_usb }}</td>
              </tr>
              <tr>
                <td><strong>{{ t.comparison.conv_dim }}</strong></td>
                <td class="highlight-col"><span class="badge-green">{{ t.comparison.conv_shareclip }}</span></td>
                <td>{{ t.comparison.conv_cloud }}</td>
                <td>{{ t.comparison.conv_chat }}</td>
                <td>{{ t.comparison.conv_usb }}</td>
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
            <div class="badge-pill">{{ t.download.badge }} ({{ appVersion }})</div>
            <h2 class="section-title">{{ t.download.title }}</h2>
            <p class="section-subtitle">{{ t.download.subtitle }}</p>
          </div>
          
          <div class="download-cards-row">
            <!-- PC Desktop App -->
            <div class="glass-panel glass-panel-hover download-card">
              <div class="download-badge-tag">Windows 10 / 11</div>
              <div class="download-icon-circle">🖥️</div>
              <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin: 12px 0 6px 0;">{{ t.download.pc_title }}</h3>
              <p class="download-meta">{{ t.download.pc_meta }}</p>
              <p class="download-desc">{{ t.download.pc_desc }}</p>
              <a 
                :href="`https://github.com/NovaMindLab/AIShare-Grabber/releases/download/${appVersion}/ShareCLIP-Setup-${appVersion.replace('v','')}.exe`" 
                class="btn btn-primary" 
                style="width: 100%; justify-content: center; font-size: 15px;"
                @click="showDownloadToast(`🚀 ${t.download.pc_btn}...`)"
              >
                <span>⚡</span> {{ t.download.pc_btn }}
              </a>
            </div>

            <!-- Android Companion App -->
            <div class="glass-panel glass-panel-hover download-card">
              <div class="download-badge-tag">Android 8.0+</div>
              <div class="download-icon-circle" style="background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.35);">📱</div>
              <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin: 12px 0 6px 0;">{{ t.download.android_title }}</h3>
              <p class="download-meta">{{ t.download.android_meta }}</p>
              <p class="download-desc">{{ t.download.android_desc }}</p>
              <a 
                :href="`https://github.com/NovaMindLab/AIShare-Grabber/releases/download/${appVersion}/ShareCLIP-Android-${appVersion.replace('v','')}.apk`" 
                class="btn btn-secondary" 
                style="width: 100%; justify-content: center; font-size: 15px;"
                @click="showDownloadToast(`📱 ${t.download.android_btn}...`)"
              >
                <span>⚡</span> {{ t.download.android_btn }}
              </a>
            </div>

            <!-- iOS MShare Companion PWA -->
            <div class="glass-panel glass-panel-hover download-card">
              <div class="download-badge-tag" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.35);">iOS &amp; 移动端 PWA</div>
              <div class="download-icon-circle" style="background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.35);">📲</div>
              <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin: 12px 0 6px 0;">ShareCLIP MShare (iOS)</h3>
              <p class="download-meta">支持 iPhone / iPad • 纯浏览器免证书运行</p>
              <p class="download-desc">专为手机触摸屏打造，内置摄像头扫码器、相册多选直传与 4K 视频流式发送。</p>
              <a 
                href="./webshare/mshare.html" 
                class="btn btn-webshare-hero" 
                style="width: 100%; justify-content: center; font-size: 15px;"
              >
                <span>📱</span> 打开 MShare 手机端
              </a>
            </div>
          </div>

          <!-- Quick Clone Developer Bar -->
          <div class="quick-install-box">
            <div class="quick-install-header">
              <span>{{ t.download.clone_title }}</span>
              <button class="btn-copy-code" @click="copyGitClone">
                {{ copySuccess ? t.download.copied_btn : t.download.copy_btn }}
              </button>
            </div>
            <code class="quick-install-code">git clone https://github.com/NovaMindLab/AIShare-Grabber.git &amp;&amp; cd AIShare-Grabber</code>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== FULL-SCREEN LIGHTBOX MODAL ==================== -->
    <transition name="fade">
      <div v-if="activeLightboxPhoto" class="lightbox-overlay" @click.self="closeLightbox">
        <div class="lightbox-dialog glass-panel">
          <!-- Lightbox Top Bar -->
          <div class="lightbox-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge-pill" style="font-size: 11px; padding: 2px 10px;">{{ t.lightbox.badge }}</span>
              <span style="color: var(--text-muted); font-size: 13px;">{{ activeLightboxPhoto.name }}</span>
            </div>
            <button class="lightbox-close-btn" @click="closeLightbox">✕</button>
          </div>

          <!-- Lightbox Body -->
          <div class="lightbox-body">
            <div class="lightbox-image-viewport">
              <img 
                :src="activeLightboxPhoto.img" 
                :alt="activeLightboxPhoto.name"
                class="lightbox-img"
                :style="{ transform: `scale(${lightboxZoom}) rotate(${lightboxRotate}deg)` }"
              />
            </div>

            <!-- Lightbox Metadata Sidebar -->
            <div class="lightbox-sidebar">
              <h4 style="color: #fff; margin-bottom: 12px; font-size: 15px;">{{ t.lightbox.title }}</h4>
              
              <div class="meta-item">
                <span class="meta-label">{{ t.lightbox.category }}</span>
                <span class="meta-val">{{ activeLightboxPhoto.tag || 'AI Category' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">{{ t.lightbox.resolution }}</span>
                <span class="meta-val">4032 × 3024 (4K RAW)</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">{{ t.lightbox.transferTime }}</span>
                <span class="meta-val" style="color: #34d399;">38 ms (P2P Wi-Fi Direct)</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">{{ t.lightbox.vectorSpace }}</span>
                <span class="meta-val" style="color: #c084fc;">MobileCLIP 512-D Float32</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">{{ t.lightbox.securityHash }}</span>
                <span class="meta-val mono">sha256:8f4c...3e1a</span>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 8px; margin-top: 18px;">
                <button class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 12px;" @click="lightboxZoom = Math.min(lightboxZoom + 0.25, 2.5)">
                  {{ t.lightbox.zoomIn }}
                </button>
                <button class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 12px;" @click="lightboxZoom = Math.max(lightboxZoom - 0.25, 0.75)">
                  {{ t.lightbox.zoomOut }}
                </button>
                <button class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 12px;" @click="lightboxRotate = (lightboxRotate + 90) % 360">
                  {{ t.lightbox.rotate }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

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
          <div class="nav-logo" @click="scrollToTop">
            <span class="logo-emoji">📸</span>
            <span class="logo-text">Share<span class="gradient-text-purple">CLIP</span></span>
          </div>
          <p class="footer-desc">
            {{ t.footer.desc }}
          </p>
        </div>

        <div class="footer-right">
          <a href="https://github.com/NovaMindLab/AIShare-Grabber" target="_blank" class="footer-link">{{ t.footer.repo }}</a>
          <a :href="`https://github.com/NovaMindLab/AIShare-Grabber/releases/tag/${appVersion}`" target="_blank" class="footer-link">{{ t.footer.release }} ({{ appVersion }})</a>
          <a href="https://github.com/NovaMindLab/AIShare-Grabber/blob/main/LICENSE" target="_blank" class="footer-link">{{ t.footer.license }}</a>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>{{ t.footer.copyright }}</span>
        <span>{{ t.footer.bottomNotice }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { languages, messages, locales } from './locales.js';
import pkg from '../package.json';

const appVersion = 'v' + (pkg.version || '1.2.93');
const currentLocale = ref('zh');
const currentStep = ref(1);
const flowDir = ref('pc-to-phone');
const toastMessage = ref('');
const activeAiTab = ref('search');
const selectedFace = ref('Alex');
const simThreshold = ref(92);
const copySuccess = ref(false);

// Lightbox state
const activeLightboxPhoto = ref(null);
const lightboxZoom = ref(1);
const lightboxRotate = ref(0);

const t = computed(() => locales[currentLocale.value] || messages.zh);

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDownloadToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

function openLightbox(photo) {
  activeLightboxPhoto.value = photo;
  lightboxZoom.value = 1;
  lightboxRotate.value = 0;
}

function closeLightbox() {
  activeLightboxPhoto.value = null;
}

function handleKeydown(e) {
  if (e.key === 'Escape' && activeLightboxPhoto.value) {
    closeLightbox();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function copyGitClone() {
  navigator.clipboard.writeText('git clone https://github.com/NovaMindLab/AIShare-Grabber.git');
  copySuccess.value = true;
  showDownloadToast('📋 ' + (t.value.download.copied_btn || 'Copied to clipboard!'));
  setTimeout(() => {
    copySuccess.value = false;
  }, 3000);
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

// AI Semantic Search Simulator Data
const aiSearchQuery = ref('海边日落');

const mockPhotoDatabase = [
  { name: 'IMG_2026_0818_142.jpg', tag: '风景与日落 / Landscape', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80', keywords: ['海边', '日落', '沙滩', '海洋', '晚霞', 'sunset', 'beach', 'ocean'] },
  { name: 'IMG_2026_0815_098.jpg', tag: '宠物与动物 / Animals', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=700&auto=format&fit=crop&q=80', keywords: ['狗', '金毛', '草地', '奔跑', '宠物', 'dog', 'golden', 'retriever', 'grass'] },
  { name: 'IMG_2026_0812_014.jpg', tag: '文档与发票 / Documents', img: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=700&auto=format&fit=crop&q=80', keywords: ['发票', '收据', '文档', '票据', '账单', 'invoice', 'receipt', 'document', 'paper'] },
  { name: 'IMG_2026_0809_771.jpg', tag: '城市与建筑 / Cityscape', img: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=700&auto=format&fit=crop&q=80', keywords: ['城市', '夜景', '建筑', '大楼', '霓虹', 'city', 'night', 'skyline', 'building'] },
  { name: 'IMG_2026_0802_334.jpg', tag: '美食与餐饮 / Food', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=700&auto=format&fit=crop&q=80', keywords: ['美食', '拉面', '面条', '餐饮', '晚餐', 'food', 'ramen', 'noodles', 'dinner'] }
];

const simulatedResults = computed(() => {
  const query = aiSearchQuery.value.trim().toLowerCase();
  return mockPhotoDatabase.map(item => {
    let score = 0.45;
    if (item.keywords.some(k => query.includes(k) || k.includes(query))) {
      score = 0.95 + Math.random() * 0.04;
    } else if (item.tag.toLowerCase().includes(query)) {
      score = 0.89 + Math.random() * 0.04;
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
  showDownloadToast(`🔍 MobileCLIP 512-D: "${aiSearchQuery.value}"`);
}

// Face Grouping Mock Data
const mockFaceGroups = [
  {
    name: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    photos: [
      { name: 'ALEX_PORTRAIT_01.jpg', date: '2026-08-10', tag: '人物写真 / Portrait', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80' },
      { name: 'ALEX_BEACH_TRIP.jpg', date: '2026-07-22', tag: '旅行合影 / Travel', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop&q=80' },
      { name: 'ALEX_GRADUATION.jpg', date: '2026-06-18', tag: '纪念抓拍 / Memories', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'Emma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    photos: [
      { name: 'EMMA_CAFE_01.jpg', date: '2026-08-14', tag: '生活随拍 / Cafe', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&auto=format&fit=crop&q=80' },
      { name: 'EMMA_SUNSET.jpg', date: '2026-07-30', tag: '户外写真 / Sunset', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'David',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    photos: [
      { name: 'DAVID_WORK.jpg', date: '2026-08-01', tag: '商务会议 / Meeting', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&auto=format&fit=crop&q=80' },
      { name: 'DAVID_HIKING.jpg', date: '2026-05-12', tag: '户外徒步 / Hiking', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80' }
    ]
  }
];

const currentFacePhotos = computed(() => {
  const group = mockFaceGroups.find(g => g.name === selectedFace.value);
  return group ? group.photos : [];
});

// Deduplication Mock Data
const mockDuplicateGroups = [
  {
    title: 'Burst Series #1',
    similarity: 96,
    photos: [
      { name: 'BURST_01.jpg', tag: 'Keep Best', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80' },
      { name: 'BURST_02.jpg', tag: 'Duplicate', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80' },
      { name: 'BURST_03.jpg', tag: 'Duplicate', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80' }
    ]
  },
  {
    title: 'Duplicate Snapshots #2',
    similarity: 94,
    photos: [
      { name: 'DOG_RUN_01.jpg', tag: 'Keep Best', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&auto=format&fit=crop&q=80' },
      { name: 'DOG_RUN_02.jpg', tag: 'Duplicate', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&auto=format&fit=crop&q=80' }
    ]
  }
];

function simulateDedupCleanup() {
  showDownloadToast('🧹 ' + (t.value.aiSection.cleanupBtn || 'Cleanup simulated successfully!'));
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
  background: rgba(5, 8, 20, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  padding: 12px 0;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.logo-emoji {
  font-size: 24px;
}

.logo-text {
  font-size: 20px;
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
  gap: 16px;
  flex-wrap: nowrap;
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  transition: color 0.2s;
  white-space: nowrap;
}
.nav-link:hover {
  color: #fff;
}

.nav-btn {
  padding: 8px 16px !important;
  font-size: 13px !important;
  white-space: nowrap;
}

.lang-select-wrapper {
  position: relative;
  flex-shrink: 0;
}

.lang-select {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.lang-select:hover {
  border-color: #a855f7;
}
.lang-select option {
  background: #0f172a;
  color: #fff;
}

/* Hero Section */
.hero-section {
  padding: 60px 0 50px 0;
  text-align: center;
  position: relative;
}

.hero-header-center {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.hero-main-title {
  font-size: 46px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -1.2px;
  color: #fff;
  margin-top: 4px;
}

.hero-title-sub {
  font-size: 34px;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.8px;
}

.hero-main-desc {
  font-size: 16px;
  color: var(--text-muted);
  line-height: 1.65;
  max-width: 820px;
  margin-top: 2px;
}

/* Hero CTA Container */
.hero-cta-container {
  width: 100%;
  max-width: 960px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.hero-primary-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}

.btn-webshare-hero,
.btn-primary-hero,
.btn-secondary-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  user-select: none;
}

.btn-webshare-hero {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 25px rgba(6, 182, 212, 0.35);
}
.btn-webshare-hero:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(139, 92, 246, 0.55);
}

.btn-primary-hero {
  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 25px rgba(147, 51, 234, 0.35);
}
.btn-primary-hero:hover {
  transform: translateY(-3px);
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  box-shadow: 0 12px 35px rgba(168, 85, 247, 0.55);
}

.btn-secondary-hero {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}
.btn-secondary-hero:hover {
  transform: translateY(-3px);
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 12px 35px rgba(16, 185, 129, 0.5);
}

.btn-icon {
  font-size: 26px;
  flex-shrink: 0;
}

.btn-content {
  display: flex;
  flex-direction: column;
}

.btn-label-main {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.btn-label-sub {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 3px;
  font-weight: 500;
}

.hero-secondary-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-outline-hero {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-main);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.btn-outline-hero:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}

/* 3D Hero Banner Frame */
.hero-banner-frame {
  margin-top: 40px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.7);
  position: relative;
}

.hero-banner-img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-banner-frame:hover .hero-banner-img {
  transform: scale(1.012);
}

.floating-chip {
  position: absolute;
  background: rgba(15, 23, 42, 0.88);
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
  font-size: 22px;
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

.chip-1 { top: 20px; left: 20px; animation-delay: 0s; border-color: rgba(56, 189, 248, 0.3); }
.chip-2 { bottom: 20px; left: 20px; animation-delay: 1.5s; border-color: rgba(168, 85, 247, 0.3); }
.chip-3 { top: 20px; right: 20px; animation-delay: 3s; border-color: rgba(16, 185, 129, 0.3); }

/* Stats Matrix */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 36px;
}

.stat-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 22px 16px;
  text-align: center;
  transition: all 0.3s ease;
}
.stat-card:hover {
  border-color: rgba(168, 85, 247, 0.4);
  transform: translateY(-4px);
  background: var(--bg-card-hover);
}

.stat-value {
  font-size: 30px;
  font-weight: 900;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Section Generic */
.section-padding {
  padding: 80px 0;
  position: relative;
}

.section-header {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 40px auto;
}

.section-title {
  font-size: 34px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.8px;
  margin: 12px 0 10px 0;
}

.section-subtitle {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-card {
  padding: 28px 24px;
  text-align: left;
}

.feature-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 18px;
}

.icon-purple { background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); }
.icon-cyan { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); }
.icon-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }

.feature-card h3 {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Video Showcase Section */
.video-showcase-section {
  position: relative;
  background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
}

.video-showcase-card {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.35);
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(139, 92, 246, 0.15);
  background: rgba(10, 15, 30, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.video-card-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(5, 8, 20, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.video-window-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}
.dot-red { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green { background: #10b981; }

.video-window-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 0.2px;
}

.video-hd-badge {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 2px 10px;
  border-radius: 99px;
  letter-spacing: 0.5px;
}

.video-player-wrapper {
  position: relative;
  width: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.promo-video-player {
  width: 100%;
  max-height: 580px;
  object-fit: contain;
  background: #000;
  display: block;
  outline: none;
}

.video-features-footer {
  padding: 18px 24px;
  background: rgba(15, 23, 42, 0.75);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.video-tag-pills {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.v-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 12.5px;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}
.v-tag-pill:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  color: #fff;
  transform: translateY(-1px);
}

.video-cta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 900px) {
  .video-features-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .video-tag-pills {
    justify-content: center;
  }
  .video-cta-row {
    justify-content: center;
  }
}

/* AI Playground Tabs */
.interactive-ai-box {
  padding: 28px;
  text-align: left;
}

.playground-nav-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 14px;
  flex-wrap: wrap;
}

.playground-tab-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  padding: 9px 18px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
}

.playground-tab-btn.active {
  background: rgba(168, 85, 247, 0.2);
  border-color: #a855f7;
  color: #fff;
  box-shadow: 0 4px 18px rgba(168, 85, 247, 0.3);
}

.interactive-ai-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ai-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(4, 7, 18, 0.7);
  border: 1px solid rgba(168, 85, 247, 0.4);
  border-radius: 14px;
  padding: 8px 14px;
  margin-bottom: 14px;
  box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15);
}

.ai-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14.5px;
  font-family: inherit;
  outline: none;
}

.preset-chips-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.preset-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-main);
  padding: 5px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.preset-chip:hover, .preset-chip.active {
  background: rgba(168, 85, 247, 0.25);
  border-color: #a855f7;
  color: #fff;
}

.ai-results-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.ai-result-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}
.ai-result-card:hover {
  transform: translateY(-4px);
  border-color: #a855f7;
  box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
}

.ai-card-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: #000;
}

.ai-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.ai-result-card:hover .ai-card-img {
  transform: scale(1.08);
}

.ai-score-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  backdrop-filter: blur(8px);
}
.score-high {
  background: rgba(16, 185, 129, 0.85);
  color: #fff;
}
.score-low {
  background: rgba(100, 116, 139, 0.75);
  color: #f1f5f9;
}

.lightbox-hint {
  position: absolute;
  bottom: 0;
  inset-inline: 0;
  background: rgba(0,0,0,0.7);
  font-size: 10px;
  text-align: center;
  padding: 4px 0;
  color: #38bdf8;
  opacity: 0;
  transition: opacity 0.2s;
}
.ai-result-card:hover .lightbox-hint {
  opacity: 1;
}

.ai-card-info {
  padding: 10px 12px;
}
.ai-card-title {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ai-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.ai-card-tag {
  font-size: 10px;
  color: var(--text-muted);
}
.ai-card-dim {
  font-size: 9px;
  font-weight: 700;
  color: #a855f7;
  background: rgba(168, 85, 247, 0.12);
  padding: 1px 5px;
  border-radius: 4px;
}

/* Face Avatars Row */
.face-avatars-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.face-avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.25s;
}
.face-avatar-card.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(56, 189, 248, 0.25);
}

.face-avatar-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #38bdf8;
}
.face-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}
.face-count {
  font-size: 11px;
  color: var(--text-muted);
}

/* Dedup Controls */
.dedup-controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(4, 7, 18, 0.6);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 18px;
}

.sim-slider {
  accent-color: #38bdf8;
  cursor: pointer;
}

.dedup-groups-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dedup-group-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  padding: 14px 18px;
}

.dedup-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.dedup-group-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.dedup-photos-row {
  display: flex;
  gap: 12px;
}

.dedup-photo-item {
  position: relative;
  width: 110px;
  aspect-ratio: 4/3;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
}
.dedup-photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dedup-photo-item.to-keep {
  border-color: #10b981;
}
.dedup-photo-item.to-delete {
  border-color: #ef4444;
  opacity: 0.75;
}

.dedup-status-label {
  position: absolute;
  bottom: 0;
  inset-inline: 0;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  padding: 2px 0;
  color: #fff;
}
.keep-badge { background: rgba(16, 185, 129, 0.9); }
.del-badge { background: rgba(239, 68, 68, 0.9); }

/* Handshake Simulator Card */
.simulator-card {
  padding: 36px 30px;
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
  user-select: none;
}

.step-num {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13.5px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.step-item.active .step-num {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  box-shadow: 0 0 15px var(--primary-glow);
}

.step-item.completed .step-num {
  background: var(--secondary);
  border-color: var(--secondary);
  color: white;
}

.step-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  transition: color 0.3s;
}
.step-item.active .step-label {
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 16px;
  position: relative;
}
.step-line.filled {
  background: linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%);
}

.simulator-content-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 36px;
  align-items: center;
}

.simulator-viewport {
  background: rgba(5, 8, 20, 0.8);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 26px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-view-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}

/* Mock QR Code */
.mock-qr-wrap {
  padding: 14px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
}

.mock-qr {
  width: 130px;
  height: 130px;
  background: #0f172a;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 4px solid white;
}
.top-left { top: 6px; left: 6px; }
.top-right { top: 6px; right: 6px; }
.bottom-left { bottom: 6px; left: 6px; }

.qr-center-icon {
  font-size: 26px;
  color: var(--primary);
}

.qr-scan-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #a855f7, transparent);
  box-shadow: 0 0 10px #a855f7;
  animation: qrScan 2s ease-in-out infinite alternate;
}

@keyframes qrScan {
  from { top: 0; }
  to { top: 127px; }
}

/* Phone Log Mock */
.phone-log-mock {
  background: #030712;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 14px;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 11px;
  width: 100%;
}

.log-mock-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e293b;
  color: var(--text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.red { background: #ef4444; }
.yellow { background: #f59e0b; }
.green { background: #10b981; }

.log-line {
  color: #38bdf8;
  margin-bottom: 6px;
}

.log-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: var(--primary);
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

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--secondary);
  animation: portalPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
.ring-2 {
  animation-delay: 1s;
}

@keyframes portalPulse {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

.success-icon {
  font-size: 36px;
}

/* Transfer Simulator Box */
.transfer-simulator-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 8px;
}

.sim-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
}

.dev-emoji {
  font-size: 32px;
}

.sim-flow-line {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 16px;
  position: relative;
  border-radius: 2px;
}

.flow-dot {
  position: absolute;
  top: -14px;
  font-size: 18px;
}

.flow-left-to-right {
  animation: flowLR 1.5s infinite linear;
}
.flow-right-to-left {
  animation: flowRL 1.5s infinite linear;
}

@keyframes flowLR {
  0% { left: 0%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { left: 90%; opacity: 0; }
}

@keyframes flowRL {
  0% { left: 90%; opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { left: 0%; opacity: 0; }
}

.transfer-controls {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.sim-view-text h4 {
  font-size: 14.5px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}
.sim-view-text p {
  font-size: 12px;
  color: var(--text-muted);
}

.simulator-explainer {
  text-align: left;
}

.explainer-desc {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 16px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--text-muted);
  min-height: 130px;
  margin-bottom: 18px;
}

/* Comparison Table */
.comparison-table-wrap {
  padding: 20px;
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.comparison-table th,
.comparison-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-light);
  font-size: 13.5px;
}

.comparison-table th {
  color: #fff;
  font-weight: 700;
  background: rgba(15, 23, 42, 0.5);
}

.highlight-col {
  background: rgba(168, 85, 247, 0.08);
  color: #fff;
  font-weight: 700;
  border-inline: 1px solid rgba(168, 85, 247, 0.25);
}

.badge-green {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399;
  border-radius: 6px;
  font-size: 12px;
}

/* Download Section */
.download-container {
  padding: 44px 36px;
}

.download-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.download-card {
  padding: 32px 26px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.download-badge-tag {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 2px 10px;
  border-radius: 99px;
  color: #cbd5e1;
}

.download-icon-circle {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.download-meta {
  font-size: 12px;
  color: #38bdf8;
  font-weight: 700;
  margin-bottom: 8px;
}

.download-desc {
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
  flex: 1;
}

/* Quick Install Bar */
.quick-install-box {
  background: rgba(4, 7, 18, 0.8);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  padding: 14px 18px;
  text-align: left;
}

.quick-install-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.btn-copy-code {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-copy-code:hover {
  background: rgba(168, 85, 247, 0.3);
  border-color: #a855f7;
  color: #fff;
}

.quick-install-code {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: #38bdf8;
  display: block;
}

/* Lightbox Modal */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-dialog {
  max-width: 1040px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(15, 23, 42, 0.95);
}

.lightbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-light);
}

.lightbox-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.2s;
}
.lightbox-close-btn:hover {
  color: #fff;
}

.lightbox-body {
  display: grid;
  grid-template-columns: 1fr 280px;
  flex: 1;
  overflow: hidden;
}

.lightbox-image-viewport {
  background: #030712;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 18px;
}

.lightbox-img {
  max-width: 100%;
  max-height: 58vh;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
}

.lightbox-sidebar {
  padding: 20px 18px;
  background: rgba(10, 15, 30, 0.8);
  border-left: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  text-align: left;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.meta-label {
  color: var(--text-muted);
}
.meta-val {
  color: #fff;
  font-weight: 600;
}
.meta-val.mono {
  font-family: var(--font-mono);
  font-size: 11px;
}

/* Toast Popup */
.toast-popup {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid #a855f7;
  padding: 10px 22px;
  border-radius: 99px;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  box-shadow: 0 10px 40px rgba(168, 85, 247, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border-light);
  padding: 44px 0 24px 0;
  margin-top: auto;
  background: rgba(3, 7, 18, 0.9);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.footer-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 6px;
  max-width: 480px;
}

.footer-right {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13.5px;
  transition: color 0.2s;
}
.footer-link:hover {
  color: #fff;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--text-subtle);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 18px;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Breakpoints */
@media (max-width: 1024px) {
  .hero-main-title { font-size: 38px; }
  .hero-title-sub { font-size: 28px; }
  .hero-primary-actions { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .ai-results-grid { grid-template-columns: repeat(3, 1fr); }
  .simulator-content-grid { grid-template-columns: 1fr; }
  .download-cards-row { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .lightbox-body { grid-template-columns: 1fr; }
  .lightbox-sidebar { border-left: none; border-top: 1px solid var(--border-light); }
}

@media (max-width: 768px) {
  .features-grid { grid-template-columns: 1fr; }
  .ai-results-grid { grid-template-columns: repeat(2, 1fr); }
  .nav-links { display: none; }
  .hero-main-title { font-size: 30px; }
  .hero-title-sub { font-size: 22px; }
  .floating-chip { display: none; }
  .stats-grid { grid-template-columns: 1fr; }
  .footer-content { flex-direction: column; gap: 16px; text-align: center; }
  .footer-left { display: flex; flex-direction: column; align-items: center; }
  .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
}
</style>
