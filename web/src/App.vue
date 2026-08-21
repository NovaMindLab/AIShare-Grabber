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
          <span class="version-tag">v1.2.80</span>
        </div>
        
        <nav class="nav-links">
          <a href="#features" class="nav-link">{{ t.nav.features }}</a>
          <a href="#ai-ecosystem" class="nav-link">AI 智能引擎</a>
          <a href="#simulator" class="nav-link">{{ t.nav.simulator }}</a>
          <a href="#comparison" class="nav-link">方案对比</a>
          
          <!-- WebShare Online Entry in Navbar -->
          <a 
            href="./webshare/" 
            class="btn btn-webshare nav-btn" 
            title="免安装，纯浏览器端极速扫码相册互联与WebGPU AI分析"
          >
            🌐 网页互联 (WebShare)
          </a>

          <a href="#download" class="btn btn-primary nav-btn">{{ t.nav.download }}</a>
          
          <!-- GitHub Stars Button -->
          <a 
            href="https://github.com/NovaMindLab/AIShare-Grabber" 
            target="_blank" 
            class="btn btn-github"
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
            <span>✨</span> {{ t.hero.badge }} • v1.2.80 正式发布
          </div>
          
          <h1 class="hero-main-title">
            <span class="gradient-text">打破设备壁垒</span><br />
            本地 AI 赋能的跨端无网照片管理生态
          </h1>
          
          <p class="hero-main-desc">
            {{ t.hero.desc }}
          </p>

          <!-- CTA Buttons -->
          <div class="hero-actions-row">
            <!-- WebShare Hero Online Entry -->
            <a 
              href="./webshare/" 
              class="btn btn-webshare-hero btn-lg"
              title="免安装，纯网页端秒级扫码互联与WebGPU AI分析"
            >
              <span>🌐</span> 在线体验 WebShare 网页版 (免安装)
            </a>
            <a 
              href="https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v1.2.80/ShareCLIP-Setup-1.2.80.exe" 
              class="btn btn-primary btn-lg"
              @click="showDownloadToast('🚀 正在启动 Windows 桌面版 (v1.2.80) 极速下载...')"
            >
              <span>🖥️</span> 下载 Windows 桌面端 (175 MB)
            </a>
            <a 
              href="https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v1.2.80/app-arm64-v8a-release.apk" 
              class="btn btn-secondary btn-lg"
              @click="showDownloadToast('📱 正在启动 Android 手机端 (v1.2.80) 极速下载...')"
            >
              <span>📱</span> 下载 Android APK (35 MB)
            </a>
            <a href="#simulator" class="btn btn-outline btn-lg">
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
            <div class="stat-value gradient-text-cyan">80+ MB/s</div>
            <div class="stat-label">局域网 Wi-Fi Socket 实测吞吐</div>
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

          <!-- Feature 4: 4K Lightbox -->
          <div class="glass-panel glass-panel-hover feature-card">
            <div class="feature-icon-box icon-purple">🖼️</div>
            <h3>渐进式 4K 大图画廊 (Lightbox)</h3>
            <p>0ms 秒开缩略图，手机在线时按需直传 4K 原图无缝热替换，支持键盘左右键快速切图与自由放大旋转。</p>
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
            <h3>智能相似图去重 & 双端同步清理</h3>
            <p>基于余弦相似度质心聚类算法定位重复抓拍，电脑端一键删除并联动通过 WebRTC 信令安全删除手机系统相册原片。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== AI ECOSYSTEM & INTERACTIVE PLAYGROUND ==================== -->
    <section id="ai-ecosystem" class="section-padding" style="background: rgba(10, 15, 30, 0.45);">
      <div class="container">
        <div class="section-header">
          <div class="badge-pill">AI PLAYGROUND</div>
          <h2 class="section-title">端侧多模态 AI 智能相册引擎</h2>
          <p class="section-subtitle">所有 AI 运算均在 PC 端 CPU/GPU 及 WASM SIMD 多线程上本地运行，保障极致速度与绝对隐私</p>
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
              <span>🔍</span> 自然语言语义搜图 (CLIP 512-D)
            </button>
            <button 
              class="playground-tab-btn" 
              :class="{ active: activeAiTab === 'faces' }"
              @click="activeAiTab = 'faces'"
            >
              <span>👥</span> 人脸识别与人物时间轴 (SIMD 聚类)
            </button>
            <button 
              class="playground-tab-btn" 
              :class="{ active: activeAiTab === 'dedup' }"
              @click="activeAiTab = 'dedup'"
            >
              <span>🧹</span> 相似图与连拍去重 (Cosine 质心)
            </button>
          </div>

          <!-- TAB 1: CLIP Search Simulator -->
          <div v-if="activeAiTab === 'search'" class="tab-pane-content">
            <div class="interactive-ai-header">
              <span style="font-size: 22px;">🔍</span>
              <div>
                <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: #fff;">MobileCLIP 512-D 向量空间语义检索</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">输入自然语言或点击测试词，实时感受本地向量语义匹配能力（点击照片可全屏预览）：</p>
              </div>
            </div>

            <!-- Search Bar -->
            <div class="ai-search-bar">
              <span style="font-size: 18px; color: #a855f7;">🔍</span>
              <input 
                v-model="aiSearchQuery" 
                type="text" 
                placeholder="输入如：海边日落、在草地奔跑的金毛、发票收据、城市夜景..."
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
                @click="openLightbox(item)"
              >
                <div class="ai-card-img-wrap">
                  <img :src="item.img" :alt="item.name" class="ai-card-img" />
                  <span class="ai-score-badge" :class="item.score > 0.85 ? 'score-high' : 'score-low'">
                    {{ Math.round(item.score * 100) }}% 相似度
                  </span>
                  <div class="lightbox-hint">🔍 点击 4K 预览</div>
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
                <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: #fff;">WASM SIMD 128位 人脸特征聚类与时间轴</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">SCRFD + MobileFaceNet 本地高精度聚类，点击人物头像筛选专属相册：</p>
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
                <div class="face-count">{{ face.photos.length }} 张照片</div>
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
                  <div class="lightbox-hint">🔍 点击 4K 预览</div>
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
                <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: #fff;">Leader Centroid 连拍与相似图识别</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">毫秒级定位连拍废片与重复抓拍，电脑端一键释放双端存储空间：</p>
              </div>
            </div>

            <!-- Deduplication Controls -->
            <div class="dedup-controls-bar">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 13px; color: var(--text-muted);">相似度阈值：</span>
                <input type="range" min="80" max="98" v-model="simThreshold" class="sim-slider" />
                <span style="font-weight: 700; color: #38bdf8; font-size: 14px;">{{ simThreshold }}%</span>
              </div>
              <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 13px;" @click="simulateDedupCleanup">
                <span>🧹</span> 模拟清理重复项 (释放 48.2 MB)
              </button>
            </div>

            <!-- Duplicate Groups List -->
            <div class="dedup-groups-container">
              <div v-for="(group, gIdx) in mockDuplicateGroups" :key="gIdx" class="dedup-group-card">
                <div class="dedup-group-header">
                  <span class="dedup-group-title">分组 #{{ gIdx + 1 }}: {{ group.title }}</span>
                  <span class="badge-pill" style="font-size: 11px; padding: 2px 10px;">相似度 ≥ {{ group.similarity }}%</span>
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
                      {{ pIdx === 0 ? '🌟 推荐保留最佳' : '🗑️ 建议清理' }}
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
          <div class="badge-pill">ZERO-TRAFFIC PROTOCOL</div>
          <h2 class="section-title">真·局域网 P2P 零流量极速同步架构</h2>
          <p class="section-subtitle">无需数据线、无需公网服务器，近场 BLE 自动握手 + WebRTC DataChannel 千兆级局域网直连</p>
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
                <td class="highlight-col"><span class="badge-green">80+ MB/s Wi-Fi 直连 (千兆级)</span></td>
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
            <div class="badge-pill">OFFICIAL RELEASES (v1.2.80)</div>
            <h2 class="section-title">{{ t.download.title }}</h2>
            <p class="section-subtitle">{{ t.download.subtitle }}</p>
          </div>
          
          <div class="download-cards-row">
            <!-- PC Desktop App -->
            <div class="glass-panel glass-panel-hover download-card">
              <div class="download-badge-tag">Windows 10 / 11</div>
              <div class="download-icon-circle">🖥️</div>
              <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin: 12px 0 6px 0;">ShareCLIP PC 桌面端</h3>
              <p class="download-meta">版本 v1.2.80 • 64-bit Installer • ~175 MB</p>
              <p class="download-desc">内置 MobileCLIP ONNX 引擎、WASM SIMD 聚类加速与 4K Lightbox 画廊。</p>
              <a 
                href="https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v1.2.80/ShareCLIP-Setup-1.2.80.exe" 
                class="btn btn-primary" 
                style="width: 100%; justify-content: center; font-size: 15px;"
                @click="showDownloadToast('🚀 正在启动 Windows 安装包 (175 MB) 下载...')"
              >
                <span>⚡</span> 下载 Windows 安装包 (.exe)
              </a>
            </div>

            <!-- Android Companion App -->
            <div class="glass-panel glass-panel-hover download-card">
              <div class="download-badge-tag">Android 8.0+</div>
              <div class="download-icon-circle" style="background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.35);">📱</div>
              <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin: 12px 0 6px 0;">ShareCLIP Android 移动端</h3>
              <p class="download-meta">版本 v1.2.80 • 64-bit ARMv8/v9 • ~35 MB</p>
              <p class="download-desc">基于 Flutter 构建，支持 BLE 近场扫码、Wi-Fi 直连与后台无感增量对齐。</p>
              <a 
                href="https://github.com/NovaMindLab/AIShare-Grabber/releases/download/v1.2.80/app-arm64-v8a-release.apk" 
                class="btn btn-secondary" 
                style="width: 100%; justify-content: center; font-size: 15px;"
                @click="showDownloadToast('📱 正在启动 Android 安装包 (35 MB) 下载...')"
              >
                <span>⚡</span> 下载 Android 安装包 (.apk)
              </a>
            </div>
          </div>

          <!-- Quick Clone Developer Bar -->
          <div class="quick-install-box">
            <div class="quick-install-header">
              <span>💻 开发者源码极速克隆 (GitHub Clone)</span>
              <button class="btn-copy-code" @click="copyGitClone">
                {{ copySuccess ? '✅ 已复制命令' : '📋 复制命令' }}
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
              <span class="badge-pill" style="font-size: 11px; padding: 2px 10px;">4K RAW ON-DEMAND STREAM</span>
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
              <h4 style="color: #fff; margin-bottom: 12px; font-size: 15px;">📊 EXIF & AI 向量元数据</h4>
              
              <div class="meta-item">
                <span class="meta-label">类别归档:</span>
                <span class="meta-val">{{ activeLightboxPhoto.tag || 'AI 智能分类' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">分辨率:</span>
                <span class="meta-val">4032 × 3024 (4K RAW)</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">传输耗时:</span>
                <span class="meta-val" style="color: #34d399;">38 ms (P2P Wi-Fi Direct)</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">向量空间:</span>
                <span class="meta-val" style="color: #c084fc;">MobileCLIP 512-D Float32</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">安全哈希:</span>
                <span class="meta-val mono">sha256:8f4c...3e1a</span>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 8px; margin-top: 18px;">
                <button class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 12px;" @click="lightboxZoom = Math.min(lightboxZoom + 0.25, 2.5)">
                  🔍 放大
                </button>
                <button class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 12px;" @click="lightboxZoom = Math.max(lightboxZoom - 0.25, 0.75)">
                  🔍 缩小
                </button>
                <button class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 12px;" @click="lightboxRotate = (lightboxRotate + 90) % 360">
                  🔄 旋转
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
          <div class="nav-logo">
            <span class="logo-emoji">📸</span>
            <span class="logo-text">Share<span class="gradient-text-purple">CLIP</span></span>
          </div>
          <p class="footer-desc">
            Next-Gen Local AI Photo Management & P2P Cross-Device Wireless Syncing Ecosystem.
          </p>
        </div>

        <div class="footer-right">
          <a href="https://github.com/NovaMindLab/AIShare-Grabber" target="_blank" class="footer-link">GitHub 仓库</a>
          <a href="https://github.com/NovaMindLab/AIShare-Grabber/releases/tag/v1.2.80" target="_blank" class="footer-link">Release v1.2.80</a>
          <a href="https://github.com/NovaMindLab/AIShare-Grabber/blob/main/LICENSE" target="_blank" class="footer-link">Apache 2.0 开源协议</a>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>{{ t.footer.copyright }}</span>
        <span>100% 本地计算 • 零云端中转 • 绝无隐私泄露</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { languages, messages } from './locales.js';

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
  showDownloadToast('📋 源码仓库地址已复制到剪贴板！');
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
const presetQueries = [
  { icon: '🌅', text: '海边日落' },
  { icon: '🐕', text: '在草地奔跑的金毛' },
  { icon: '🧾', text: '发票与收据' },
  { icon: '🌃', text: '城市夜景建筑' },
  { icon: '🍜', text: '美味拉面美食' }
];

const mockPhotoDatabase = [
  { name: 'IMG_2026_0818_142.jpg', tag: '风景与日落', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&auto=format&fit=crop&q=80', keywords: ['海边', '日落', '沙滩', '海洋', '晚霞'] },
  { name: 'IMG_2026_0815_098.jpg', tag: '宠物与动物', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=700&auto=format&fit=crop&q=80', keywords: ['狗', '金毛', '草地', '奔跑', '宠物'] },
  { name: 'IMG_2026_0812_014.jpg', tag: '文档与发票', img: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=700&auto=format&fit=crop&q=80', keywords: ['发票', '收据', '文档', '票据', '账单'] },
  { name: 'IMG_2026_0809_771.jpg', tag: '城市与建筑', img: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=700&auto=format&fit=crop&q=80', keywords: ['城市', '夜景', '建筑', '大楼', '霓虹'] },
  { name: 'IMG_2026_0802_334.jpg', tag: '美食与餐饮', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=700&auto=format&fit=crop&q=80', keywords: ['美食', '拉面', '面条', '餐饮', '晚餐'] }
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
  showDownloadToast(`🔍 MobileCLIP 512-D 向量空间匹配已完成: "${aiSearchQuery.value}"`);
}

// Face Grouping Mock Data
const mockFaceGroups = [
  {
    name: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    photos: [
      { name: 'ALEX_PORTRAIT_01.jpg', date: '2026-08-10', tag: '人物抓拍', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=80' },
      { name: 'ALEX_BEACH_TRIP.jpg', date: '2026-07-22', tag: '旅行写真', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop&q=80' },
      { name: 'ALEX_GRADUATION.jpg', date: '2026-06-18', tag: '纪念瞬间', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'Emma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    photos: [
      { name: 'EMMA_CAFE_01.jpg', date: '2026-08-14', tag: '日常写真', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&auto=format&fit=crop&q=80' },
      { name: 'EMMA_SUNSET.jpg', date: '2026-07-30', tag: '户外自拍', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop&q=80' }
    ]
  },
  {
    name: 'David',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    photos: [
      { name: 'DAVID_WORK.jpg', date: '2026-08-01', tag: '会议办公', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&auto=format&fit=crop&q=80' },
      { name: 'DAVID_HIKING.jpg', date: '2026-05-12', tag: '徒步户外', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=80' }
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
    title: '海边跳跃 3 连拍',
    similarity: 96,
    photos: [
      { name: 'BURST_01.jpg', tag: '保留最佳', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80' },
      { name: 'BURST_02.jpg', tag: '重复连拍', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80' },
      { name: 'BURST_03.jpg', tag: '重复连拍', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80' }
    ]
  },
  {
    title: '同一场景抓拍',
    similarity: 94,
    photos: [
      { name: 'DOG_RUN_01.jpg', tag: '保留最佳', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&auto=format&fit=crop&q=80' },
      { name: 'DOG_RUN_02.jpg', tag: '重复抓拍', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&auto=format&fit=crop&q=80' }
    ]
  }
];

function simulateDedupCleanup() {
  showDownloadToast('🧹 质心去重完成：已模拟通过 WebRTC 信令同步清理手机与 PC 上的 3 张冗余重复抓拍！');
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

.btn-lg {
  font-size: 16px;
  padding: 14px 28px;
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

/* Stats Matrix */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 40px;
}

.stat-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 24px 18px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 900;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

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

/* AI Playground Tabs */
.interactive-ai-box {
  padding: 32px;
  text-align: left;
}

.playground-nav-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 16px;
  flex-wrap: wrap;
}

.playground-tab-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
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
  margin-bottom: 18px;
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
  font-size: 15px;
  font-family: inherit;
  outline: none;
}

.preset-chips-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.preset-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-main);
  padding: 6px 14px;
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
  gap: 16px;
}

.ai-result-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid var(--border-light);
  border-radius: 14px;
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
  gap: 16px;
  flex-wrap: wrap;
}

.face-avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  border-radius: 16px;
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
  width: 54px;
  height: 54px;
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
  gap: 16px;
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
  gap: 14px;
}

.dedup-photo-item {
  position: relative;
  width: 120px;
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
  padding: 40px;
}

.stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
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
  font-size: 15px;
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
  gap: 40px;
  align-items: center;
}

.simulator-viewport {
  background: rgba(5, 8, 20, 0.8);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 30px;
  min-height: 320px;
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

/* Mock QR Code */
.mock-qr-wrap {
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
}

.mock-qr {
  width: 140px;
  height: 140px;
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
  width: 32px;
  height: 32px;
  border: 5px solid white;
}
.top-left { top: 8px; left: 8px; }
.top-right { top: 8px; right: 8px; }
.bottom-left { bottom: 8px; left: 8px; }

.qr-center-icon {
  font-size: 28px;
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
  to { top: 137px; }
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
  width: 100px;
  height: 100px;
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
  font-size: 40px;
}

/* Transfer Simulator Box */
.transfer-simulator-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 20px 10px;
}

.sim-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.dev-emoji {
  font-size: 36px;
}

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
  top: -14px;
  font-size: 20px;
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
  font-size: 15px;
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
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-muted);
  min-height: 130px;
  margin-bottom: 20px;
}

/* Comparison Table */
.comparison-table-wrap {
  padding: 24px;
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.comparison-table th,
.comparison-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  font-size: 14px;
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
  padding: 50px 40px;
}

.download-cards-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin-bottom: 36px;
}

.download-card {
  padding: 36px 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.download-badge-tag {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 2px 10px;
  border-radius: 99px;
  color: #cbd5e1;
}

.download-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.download-meta {
  font-size: 12px;
  color: #38bdf8;
  font-weight: 700;
  margin-bottom: 10px;
}

.download-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 24px;
  flex: 1;
}

/* Quick Install Bar */
.quick-install-box {
  background: rgba(4, 7, 18, 0.8);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  padding: 16px 20px;
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
  font-size: 13px;
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
  padding: 24px;
}

.lightbox-dialog {
  max-width: 1080px;
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
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.lightbox-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
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
  grid-template-columns: 1fr 300px;
  flex: 1;
  overflow: hidden;
}

.lightbox-image-viewport {
  background: #030712;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
}

.lightbox-img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
}

.lightbox-sidebar {
  padding: 24px 20px;
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
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid #a855f7;
  padding: 12px 24px;
  border-radius: 99px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 10px 40px rgba(168, 85, 247, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border-light);
  padding: 50px 0 30px 0;
  margin-top: auto;
  background: rgba(3, 7, 18, 0.9);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.footer-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
}

.footer-right {
  display: flex;
  gap: 24px;
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
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-subtle);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 20px;
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
@media (max-width: 992px) {
  .hero-main-title { font-size: 38px; }
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
  .hero-main-title { font-size: 32px; }
  .floating-chip { display: none; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
