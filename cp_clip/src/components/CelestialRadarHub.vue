<template>
  <div class="celestial-radar-hub glass-panel glow-border">
    <!-- Background Radial Ambient Glow & Concentric Radar Wave Rings -->
    <div class="radar-background" aria-hidden="true">
      <div class="radial-ambient-glow"></div>
      <div class="radar-ring radar-ring-1"></div>
      <div class="radar-ring radar-ring-2"></div>
      <div class="radar-ring radar-ring-3"></div>
      <div class="radar-dashed-orbit"></div>
    </div>

    <!-- Top Command Bar: Status, IP, Hotspot & Controls -->
    <div class="hub-header">
      <div class="header-left">
        <div class="udp-badge">
          <span class="ping-dot">
            <span class="ping-dot-wave"></span>
            <span class="ping-dot-core"></span>
          </span>
          <span>{{ t.radar?.broadcasting || '局域网广播连接中 · UDP 15185' }}</span>
        </div>
        <h2 class="hub-title shimmer-text">
          {{ t.radar?.title || '极速扫码直连中枢' }}
        </h2>
        <p class="hub-subtitle">
          {{ t.radar?.subtitle || '拿起手机对准屏幕二维码，0.1 秒极速握手 · 纯本地千兆 WebRTC · 80+ MB/s 高速无损直连' }}
        </p>
      </div>

      <div class="header-right">
        <!-- Local IP Pill -->
        <div class="ip-pill">
          <span class="ip-label">{{ t.radar?.localIpLabel || '本机 IP:' }}</span>
          <strong class="ip-val">{{ localIp || '192.168.1.108' }}</strong>
        </div>

        <!-- Hotspot Mode Button -->
        <button
          type="button"
          class="btn-hotspot"
          :class="{ 'is-active': isHotspotActive }"
          @click="emit('toggle-hotspot')"
          :title="isHotspotActive ? (t.radar?.hotspotActiveTitle || '点击切换随身热点模式') : (t.radar?.hotspotInactiveTitle || '开启随身热点供手机直连')"
        >
          <span class="hotspot-dot"></span>
          <span>{{ isHotspotActive ? (t.radar?.hotspotActive || '随身热点就绪') : (t.radar?.hotspotMode || '随身热点模式') }}</span>
        </button>

        <!-- Refresh QR Code Button -->
        <button
          type="button"
          class="btn-refresh"
          @click="emit('refresh-qr')"
          :title="t.radar?.refreshQrTip || '重新生成配对二维码与会话密钥'"
        >
          <svg class="icon-refresh" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ t.radar?.refreshQr || '刷新配对码' }}</span>
        </button>
      </div>
    </div>

    <!-- Center Solar Orbit Canvas: Satellites + Core QR Podium -->
    <div class="center-orbit-area">
      <!-- West Orbit: Primary Connected or Discovered Peer -->
      <div class="satellite-wrap orbit-float-1">
        <div
          class="satellite-card west"
          @click="handleSendToPeer(primaryPeer)"
          :title="t.radar?.clickToSend || '点击向该设备闪电投送文件'"
        >
          <div class="peer-header">
            <div class="peer-icon-box">
              <svg class="peer-icon-svg emerald-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span class="peer-status-dot emerald"></span>
            </div>
            <div class="peer-meta">
              <span class="peer-name">{{ primaryPeer.name }}</span>
              <span class="peer-stat-text">{{ primaryPeer.speed }}</span>
            </div>
          </div>
          <div class="peer-footer">
            <span class="peer-type-tag">{{ primaryPeer.type }}</span>
            <button
              type="button"
              class="peer-action-link"
              @click.stop="handleSendToPeer(primaryPeer)"
            >
              <span>{{ t.radar?.lightningSend || '闪电投送' }} ➔</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ABSOLUTE CENTERPIECE CORE: 240px High-End Ultra-Contrast QR Podium -->
      <div class="podium-center-col">
        <div class="core-qr-podium">
          <!-- Inner High-Contrast QR Plate (230x230) -->
          <div class="qr-plate">
            <img
              v-if="qrCodeDataUrl"
              :src="qrCodeDataUrl"
              alt="ShareCLIP QR Code"
              class="qr-image"
            />
            <!-- High Density Crisp Vector QR Mockup fallback when dataUrl is pending -->
            <svg
              v-else
              class="qr-svg"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <!-- Top-Left Finder -->
              <rect x="0" y="0" width="28" height="28" rx="6" fill="#090d16" />
              <rect x="4" y="4" width="20" height="20" rx="4" fill="#ffffff" />
              <rect x="8" y="8" width="12" height="12" rx="3" fill="#2563eb" />

              <!-- Top-Right Finder -->
              <rect x="72" y="0" width="28" height="28" rx="6" fill="#090d16" />
              <rect x="76" y="4" width="20" height="20" rx="4" fill="#ffffff" />
              <rect x="80" y="8" width="12" height="12" rx="3" fill="#2563eb" />

              <!-- Bottom-Left Finder -->
              <rect x="0" y="72" width="28" height="28" rx="6" fill="#090d16" />
              <rect x="4" y="76" width="20" height="20" rx="4" fill="#ffffff" />
              <rect x="8" y="80" width="12" height="12" rx="3" fill="#2563eb" />

              <!-- Timing Lines -->
              <rect x="32" y="10" width="4" height="4" rx="1" fill="#090d16" />
              <rect x="40" y="10" width="4" height="4" rx="1" fill="#090d16" />
              <rect x="48" y="10" width="4" height="4" rx="1" fill="#2563eb" />
              <rect x="56" y="10" width="4" height="4" rx="1" fill="#090d16" />
              <rect x="64" y="10" width="4" height="4" rx="1" fill="#090d16" />
              <rect x="10" y="32" width="4" height="4" rx="1" fill="#090d16" />
              <rect x="10" y="40" width="4" height="4" rx="1" fill="#090d16" />
              <rect x="10" y="48" width="4" height="4" rx="1" fill="#2563eb" />
              <rect x="10" y="56" width="4" height="4" rx="1" fill="#090d16" />
              <rect x="10" y="64" width="4" height="4" rx="1" fill="#090d16" />

              <!-- High Density Data Matrix Modules -->
              <rect x="34" y="20" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="44" y="22" width="6" height="4" rx="1.5" fill="#090d16" />
              <rect x="54" y="18" width="5" height="7" rx="1.5" fill="#2563eb" />
              <rect x="62" y="24" width="6" height="6" rx="1.5" fill="#090d16" />

              <rect x="2" y="36" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="18" y="36" width="8" height="5" rx="1.5" fill="#090d16" />
              <rect x="22" y="46" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="32" y="34" width="6" height="8" rx="1.5" fill="#090d16" />
              <rect x="64" y="34" width="8" height="6" rx="1.5" fill="#090d16" />
              <rect x="76" y="36" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="88" y="34" width="8" height="6" rx="1.5" fill="#090d16" />

              <rect x="74" y="46" width="6" height="6" rx="1.5" fill="#2563eb" />
              <rect x="84" y="48" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="92" y="44" width="6" height="6" rx="1.5" fill="#090d16" />

              <rect x="34" y="64" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="44" y="62" width="8" height="6" rx="1.5" fill="#090d16" />
              <rect x="56" y="64" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="66" y="62" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="78" y="60" width="8" height="6" rx="1.5" fill="#2563eb" />
              <rect x="90" y="62" width="6" height="6" rx="1.5" fill="#090d16" />

              <rect x="34" y="74" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="44" y="78" width="6" height="6" rx="1.5" fill="#2563eb" />
              <rect x="54" y="74" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="64" y="76" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="76" y="74" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="86" y="78" width="8" height="6" rx="1.5" fill="#090d16" />

              <rect x="36" y="88" width="8" height="6" rx="1.5" fill="#090d16" />
              <rect x="48" y="86" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="60" y="88" width="6" height="6" rx="1.5" fill="#2563eb" />
              <rect x="72" y="86" width="6" height="6" rx="1.5" fill="#090d16" />
              <rect x="84" y="88" width="6" height="6" rx="1.5" fill="#090d16" />

              <!-- Center Logo Emblem Badge -->
              <circle cx="50" cy="50" r="14" fill="#ffffff" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.15))" />
              <circle cx="50" cy="50" r="11" fill="#2563eb" />
              <path d="M47 45L53 50L47 55" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </svg>
          </div>

          <!-- PIN Code Row below QR Code -->
          <div class="pin-row">
            <span class="pin-label">{{ t.radar?.sessionPinLabel || '会话配对码:' }}</span>
            <span class="pin-badge">{{ activeSessionPin }}</span>
            <button
              type="button"
              class="pin-copy-btn"
              @click="copySessionPin"
              :title="t.radar?.copyPinTip || '复制配对码到剪贴板'"
            >
              <svg v-if="!pinCopied" class="icon-copy" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="icon-check" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <span v-if="pinCopied" class="copy-feedback-toast">
              {{ t.radar?.copied || '已复制' }}
            </span>
          </div>
        </div>

        <!-- Explanatory Footnotes below QR -->
        <div class="qr-caption-block">
          <p class="caption-main">
            {{ t.radar?.scanGuide || '支持手机原生相机 / 微信 / ShareCLIP 扫码即连' }}
          </p>
          <p class="caption-sub">
            {{ t.radar?.webShareNote || '⚡ iOS / 他人设备免装客户端 · 扫码直连 WebShare' }}
          </p>
        </div>
      </div>

      <!-- East Orbit: WebShare / Secondary Peer -->
      <div class="satellite-wrap orbit-float-2">
        <div
          class="satellite-card east"
          @click="handleSendToPeer(secondaryPeer)"
          :title="t.radar?.clickToSendMedia || '免装客户端 WebShare 极速通道'"
        >
          <div class="peer-header">
            <div class="peer-icon-box">
              <svg class="peer-icon-svg purple-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span class="peer-status-dot blue"></span>
            </div>
            <div class="peer-meta">
              <span class="peer-name">{{ secondaryPeer.name }}</span>
              <span class="peer-stat-text purple">{{ secondaryPeer.speed }}</span>
            </div>
          </div>
          <div class="peer-footer">
            <span class="peer-type-tag">{{ secondaryPeer.type }}</span>
            <button
              type="button"
              class="peer-action-link purple"
              @click.stop="handleSendToPeer(secondaryPeer)"
            >
              <span>{{ t.radar?.sendMedia || '投送媒体' }} ➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Feature Pillars Bar -->
    <div class="hub-footer">
      <div class="methods-group">
        <div class="method-item">
          <svg class="method-check emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span><strong>方式 1:</strong> {{ t.radar?.method1 || '手机原生相机直接扫（免装App）' }}</span>
        </div>
        <div class="method-item">
          <svg class="method-check blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span><strong>方式 2:</strong> {{ t.radar?.method2 || 'ShareCLIP 移动端一键闪传' }}</span>
        </div>
        <div class="method-item">
          <svg class="method-check purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span><strong>方式 3:</strong> {{ t.radar?.method3 || '局域网雷达直接投送' }}</span>
        </div>
      </div>

      <!-- Main Action CTA Button -->
      <button
        type="button"
        class="btn-main-cta"
        @click="emit('select-files')"
      >
        <svg class="icon-cta" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>{{ t.radar?.selectFilesToDevice || '选择文件闪传给设备' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  qrCodeDataUrl: {
    type: String,
    default: ''
  },
  sessionPin: {
    type: String,
    default: ''
  },
  connectedDeviceName: {
    type: String,
    default: ''
  },
  isHotspotActive: {
    type: Boolean,
    default: false
  },
  localIp: {
    type: String,
    default: '192.168.1.108'
  },
  activePeers: {
    type: Array,
    default: () => []
  },
  t: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'refresh-qr',
  'toggle-hotspot',
  'select-files',
  'copy-pin',
  'send-to-peer'
])

const pinCopied = ref(false)
let copyTimer = null

const activeSessionPin = computed(() => {
  return props.sessionPin || 'RQLPVZ'
})

// West Orbit Peer (First connected / active peer or fallback)
const primaryPeer = computed(() => {
  if (props.activePeers && props.activePeers.length > 0) {
    const peer = props.activePeers[0]
    return {
      name: peer.name || peer.deviceName || '已连接设备',
      speed: peer.speed || peer.status || '82 MB/s · 已握手',
      type: peer.type || '已配对设备',
      raw: peer
    }
  }
  if (props.connectedDeviceName) {
    return {
      name: props.connectedDeviceName,
      speed: '82 MB/s · 已握手',
      type: '已配对设备',
      raw: { name: props.connectedDeviceName }
    }
  }
  return {
    name: 'Xiaomi 14 Pro',
    speed: '82 MB/s · 已握手',
    type: '已配对设备',
    raw: { name: 'Xiaomi 14 Pro' }
  }
})

// East Orbit Peer (WebShare or secondary connected peer)
const secondaryPeer = computed(() => {
  if (props.activePeers && props.activePeers.length > 1) {
    const peer = props.activePeers[1]
    return {
      name: peer.name || peer.deviceName || 'iPhone 15 Pro',
      speed: peer.speed || 'WebShare 在线',
      type: peer.type || '免装极速通道',
      raw: peer
    }
  }
  return {
    name: 'iPhone 15 Pro',
    speed: 'WebShare 在线',
    type: '免装极速通道',
    raw: { name: 'iPhone 15 Pro', type: 'webshare' }
  }
})

function copySessionPin() {
  const pin = activeSessionPin.value
  emit('copy-pin', pin)
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(pin).catch(() => {})
  }
  pinCopied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    pinCopied.value = false
  }, 1800)
}

function handleSendToPeer(peer) {
  emit('send-to-peer', peer?.raw || peer)
}
</script>

<style scoped>
/* Obsidian Glass Panel Container */
.celestial-radar-hub {
  position: relative;
  background: rgba(18, 22, 33, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 28px;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #e2e8f0;
}

/* Glow Border Perimeter */
.glow-border {
  position: relative;
}
.glow-border::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.55), rgba(168, 85, 247, 0.22), rgba(255, 255, 255, 0.06));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Radar Pulse Animations & Glowing Rings */
.radar-background {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
}

.radial-ambient-glow {
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.16) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%);
  filter: blur(85px);
}

@keyframes radarPulse {
  0% {
    transform: scale(0.85);
    opacity: 0.75;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.2;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.radar-ring {
  position: absolute;
  border-radius: 9999px;
  border: 1px solid rgba(59, 130, 246, 0.32);
  pointer-events: none;
  animation: radarPulse 4s infinite cubic-bezier(0.2, 0.8, 0.2, 1);
}

.radar-ring-1 {
  width: 256px;
  height: 256px;
}

.radar-ring-2 {
  width: 440px;
  height: 440px;
  animation-delay: 1.3s;
}

.radar-ring-3 {
  width: 640px;
  height: 640px;
  animation-delay: 2.6s;
}

.radar-dashed-orbit {
  position: absolute;
  width: 860px;
  height: 860px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.05);
}

/* Top Command Bar */
.hub-header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.udp-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.22);
  color: #60a5fa;
  font-size: 11.5px;
  font-weight: 600;
  margin-bottom: 8px;
  width: fit-content;
}

.ping-dot {
  position: relative;
  display: inline-flex;
  width: 8px;
  height: 8px;
}

.ping-dot-wave {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #60a5fa;
  animation: pingDotWave 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
  opacity: 0.75;
}

.ping-dot-core {
  position: relative;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
}

@keyframes pingDotWave {
  75%, 100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.hub-title {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.25;
}

.shimmer-text {
  background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 40%, #93c5fd 60%, #ffffff 100%);
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shimmer 6s infinite linear;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.hub-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
  margin-bottom: 0;
  line-height: 1.5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ip-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #94a3b8;
}

.ip-val {
  color: #f1f5f9;
  font-weight: 600;
}

.btn-hotspot {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: #94a3b8;
}
.btn-hotspot:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}
.btn-hotspot.is-active {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.35);
  color: #34d399;
}

.hotspot-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}
.btn-hotspot.is-active .hotspot-dot {
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.8);
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-refresh:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}
.icon-refresh {
  width: 14px;
  height: 14px;
}

/* Center Solar Orbit Canvas */
.center-orbit-area {
  position: relative;
  z-index: 20;
  margin: 18px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 8px;
}
@media (min-width: 768px) {
  .center-orbit-area {
    padding: 0 28px;
  }
}

/* Orbit Floating Satellites */
.satellite-wrap {
  width: 210px;
  flex-shrink: 0;
}

@keyframes orbitFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.orbit-float-1 {
  animation: orbitFloat 5s ease-in-out infinite;
}

.orbit-float-2 {
  animation: orbitFloat 6s ease-in-out infinite 2.5s;
}

.satellite-card {
  background: rgba(13, 18, 31, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}
.satellite-card:hover {
  border-color: rgba(59, 130, 246, 0.45);
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(59, 130, 246, 0.15);
}
.satellite-card.east:hover {
  border-color: rgba(168, 85, 247, 0.45);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(168, 85, 247, 0.15);
}

.peer-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.peer-icon-box {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.peer-icon-svg {
  width: 22px;
  height: 22px;
}
.emerald-icon {
  color: #34d399;
}
.purple-icon {
  color: #c084fc;
}

.peer-status-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid #090b10;
}
.peer-status-dot.emerald {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulseDot 2s infinite ease-in-out;
}
.peer-status-dot.blue {
  background: #3b82f6;
  box-shadow: 0 0 8px #3b82f6;
}

@keyframes pulseDot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

.peer-meta {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.peer-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.peer-stat-text {
  font-size: 11px;
  color: #34d399;
  font-family: ui-monospace, SFMono-Regular, monospace;
  margin-top: 2px;
}
.peer-stat-text.purple {
  color: #c084fc;
}

.peer-footer {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.peer-type-tag {
  font-size: 11px;
  color: #94a3b8;
}

.peer-action-link {
  font-size: 11.5px;
  font-weight: 600;
  color: #60a5fa;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0;
  transition: color 0.15s ease;
}
.peer-action-link:hover {
  color: #93c5fd;
}
.peer-action-link.purple {
  color: #c084fc;
}
.peer-action-link.purple:hover {
  color: #e9d5ff;
}

/* ABSOLUTE CENTERPIECE CORE PODIUM */
.podium-center-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@keyframes coreGlow {
  0%, 100% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.28), 0 0 70px rgba(59, 130, 246, 0.12), 0 20px 40px rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 55px rgba(59, 130, 246, 0.5), 0 0 110px rgba(168, 85, 247, 0.28), 0 25px 50px rgba(0, 0, 0, 0.8);
    border-color: rgba(96, 165, 250, 0.45);
  }
}

.core-qr-podium {
  position: relative;
  padding: 14px;
  border-radius: 26px;
  background: rgba(14, 18, 29, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: coreGlow 4s ease-in-out infinite;
  transition: transform 0.3s ease;
}
.core-qr-podium:hover {
  transform: scale(1.02);
}

.qr-plate {
  width: 230px;
  height: 230px;
  background: #ffffff;
  border-radius: 18px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.08);
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.qr-svg {
  width: 100%;
  height: 100%;
}

.pin-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pin-label {
  font-size: 11px;
  color: #94a3b8;
}

.pin-badge {
  padding: 2px 10px;
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.25);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-size: 13px;
}

.pin-copy-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s ease;
}
.pin-copy-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.icon-copy {
  width: 14px;
  height: 14px;
}

.icon-check {
  width: 14px;
  height: 14px;
}

.copy-feedback-toast {
  font-size: 11px;
  color: #34d399;
  font-weight: 600;
}

.qr-caption-block {
  margin-top: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.caption-main {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.caption-sub {
  font-size: 11.5px;
  font-weight: 500;
  color: #60a5fa;
  margin: 0;
}

/* Bottom Feature Pillars Bar */
.hub-footer {
  position: relative;
  z-index: 20;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.methods-group {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.method-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #cbd5e1;
}

.method-item strong {
  color: #f8fafc;
}

.method-check {
  width: 16px;
  height: 16px;
}
.method-check.emerald {
  color: #34d399;
}
.method-check.blue {
  color: #60a5fa;
}
.method-check.purple {
  color: #c084fc;
}

.btn-main-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-main-cta:hover {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.45);
  transform: translateY(-1px);
}
.btn-main-cta:active {
  transform: translateY(0);
}

.icon-cta {
  width: 16px;
  height: 16px;
}

/* Light mode adaptation */
:global(.light-mode) .celestial-radar-hub {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.06);
  color: #1e293b;
}

:global(.light-mode) .hub-title {
  color: #0f172a;
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:global(.light-mode) .hub-subtitle {
  color: #64748b;
}

:global(.light-mode) .udp-badge {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
  color: #2563eb;
}

:global(.light-mode) .ip-pill {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.08);
}

:global(.light-mode) .ip-label {
  color: #64748b;
}

:global(.light-mode) .ip-val {
  color: #0f172a;
}

:global(.light-mode) .btn-hotspot,
:global(.light-mode) .btn-refresh {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.08);
  color: #334155;
}

:global(.light-mode) .btn-hotspot:hover,
:global(.light-mode) .btn-refresh:hover {
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

:global(.light-mode) .satellite-card {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

:global(.light-mode) .satellite-title {
  color: #0f172a;
}

:global(.light-mode) .feature-item {
  color: #475569;
}

:global(.light-mode) .pin-display {
  background: rgba(15, 23, 42, 0.05);
  border-color: rgba(15, 23, 42, 0.08);
}

:global(.light-mode) .pin-code {
  color: #2563eb;
}

:global(.light-mode) .qr-tip-main {
  color: #334155;
}

:global(.light-mode) .qr-tip-sub {
  color: #64748b;
}

:global(.light-mode) .radar-ring {
  border-color: rgba(59, 130, 246, 0.15);
}

:global(.light-mode) .radar-dashed-orbit {
  border-color: rgba(15, 23, 42, 0.06);
}
</style>
