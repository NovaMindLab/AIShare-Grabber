<template>
  <transition name="modal-fade">
    <div v-if="video" class="anime-studio-overlay" @click.self="handleClose">
      <div class="anime-studio-modal glass-panel">
        <!-- Floating Close Button -->
        <button class="anime-close-btn" @click="handleClose" title="关闭工作室 (ESC)">✕</button>

        <!-- Header -->
        <div class="anime-studio-header">
          <div class="header-icon-wrap">
            <span class="header-icon">🎨</span>
          </div>
          <div>
            <h3 class="header-title">短视频一键二次元 / 动漫化转换工作室</h3>
            <p class="header-desc">基于 AnimeGAN 神经网络与 FFmpeg 裸流管道，无损提取原声并逐帧重绘为唯美二次元画风</p>
          </div>
        </div>

        <div class="anime-studio-content">
          <!-- Environment Warning Banner (if FFmpeg missing) -->
          <div v-if="envChecked && !ffmpegAvailable" class="anime-env-alert">
            <div class="env-alert-icon">⚠️</div>
            <div class="env-alert-content">
              <div class="env-alert-title">未检测到 FFmpeg 视频编解码组件（无法直接转换视频）</div>
              <div class="env-alert-desc">
                视频逐帧动漫化与音轨混流依赖 FFmpeg。请通过以下方式之一快速启用：
              </div>
              <div class="env-alert-cmd-row">
                <code>winget install Gyan.FFmpeg</code>
                <button class="copy-cmd-btn" @click="copyFfmpegCmd">
                  {{ copiedCmd ? '✓ 已复制命令' : '📋 复制安装命令 (PowerShell)' }}
                </button>
                <button class="recheck-btn" @click="checkEnvironment">
                  🔄 重新检测
                </button>
              </div>
              <div class="env-alert-tip">
                💡 也可以直接下载 <code>ffmpeg.exe</code> 和 <code>ffprobe.exe</code> 放入本软件安装目录下的 <code>bin/</code> 文件夹。
              </div>
            </div>
          </div>

          <!-- Left Column: Source Video Info & Preview -->
          <div class="anime-left-panel">
            <div class="video-preview-card">
              <video 
                v-if="video.src || video.path" 
                :src="video.src || `local:///${video.path.replace(/\\/g, '/')}`" 
                class="preview-video-element"
                controls 
                muted
              ></video>
              <div v-else class="preview-placeholder">
                <span>🎬</span>
              </div>
            </div>

            <!-- Video Metadata Card -->
            <div class="video-meta-box">
              <div class="meta-row">
                <span class="meta-label">文件名称:</span>
                <span class="meta-val filename-truncate" :title="video.name">{{ video.name }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">原始尺寸:</span>
                <span class="meta-val">{{ videoInfo ? `${videoInfo.width} × ${videoInfo.height}` : '探测中...' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">视频帧率:</span>
                <span class="meta-val">{{ videoInfo ? `${videoInfo.fps} FPS` : '探测中...' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">预估帧数:</span>
                <span class="meta-val">{{ videoInfo ? `${videoInfo.totalFrames} 帧` : '计算中...' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">音轨状态:</span>
                <span class="meta-val" :style="{ color: videoInfo?.hasAudio ? '#10b981' : 'var(--text-muted)' }">
                  {{ videoInfo ? (videoInfo.hasAudio ? '🔊 包含原声音轨 (自动混流)' : '🔇 无音轨') : '探测中...' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right Column: Style & Resolution Configuration -->
          <div class="anime-right-panel">
            <!-- 1. Style Preset Selector -->
            <div class="config-section">
              <label class="section-label">🎨 1. 选择二次元艺术画风</label>
              <div class="style-cards-grid">
                <div 
                  v-for="st in styles" 
                  :key="st.id" 
                  class="style-card"
                  :class="{ active: selectedStyle === st.id }"
                  @click="!isConverting && (selectedStyle = st.id)"
                >
                  <div class="style-icon-wrap" :style="{ background: st.previewGradient }">
                    <span>{{ st.icon }}</span>
                  </div>
                  <div class="style-info">
                    <div class="style-name">{{ st.name }}</div>
                    <div class="style-desc">{{ st.desc }}</div>
                  </div>
                  <div v-if="selectedStyle === st.id" class="style-check-badge">✓</div>
                </div>
              </div>
            </div>

            <!-- 2. Anime Frame Rate Mode Selector -->
            <div class="config-section">
              <div class="section-label-row">
                <label class="section-label">⚡ 2. 动漫帧率与速度优化</label>
                <span class="section-tip">✨ 传统2D动漫采用定格手绘帧率，大幅提速且减少闪烁</span>
              </div>
              <div class="frame-rate-options">
                <button 
                  class="fr-btn" 
                  :class="{ active: frameRateMode === 'anime15' }"
                  @click="!isConverting && (frameRateMode = 'anime15')"
                  :disabled="isConverting"
                >
                  <div class="fr-header">
                    <span class="fr-title">🚀 经典动漫手绘 (15 FPS)</span>
                    <span class="fr-badge badge-rec">2x 极速 • 推荐</span>
                  </div>
                  <span class="fr-sub">吉卜力/新海诚手绘定格质感，算力减半，画面最稳</span>
                </button>
                <button 
                  class="fr-btn" 
                  :class="{ active: frameRateMode === 'full' }"
                  @click="!isConverting && (frameRateMode = 'full')"
                  :disabled="isConverting"
                >
                  <div class="fr-header">
                    <span class="fr-title">⚡ 原生全帧率 ({{ videoInfo ? `${videoInfo.fps} FPS` : '全量' }})</span>
                    <span class="fr-badge badge-normal">1x 原速</span>
                  </div>
                  <span class="fr-sub">逐帧全量重绘，适合高帧率丝滑动作片段</span>
                </button>
                <button 
                  class="fr-btn" 
                  :class="{ active: frameRateMode === 'anime10' }"
                  @click="!isConverting && (frameRateMode = 'anime10')"
                  :disabled="isConverting"
                >
                  <div class="fr-header">
                    <span class="fr-title">🏎️ 极速漫画风 (10 FPS)</span>
                    <span class="fr-badge badge-turbo">3x 极速</span>
                  </div>
                  <span class="fr-sub">漫画定格风，算力削减 67%，长视频极速出片</span>
                </button>
              </div>
            </div>

            <!-- 3. Resolution Mode Selector -->
            <div class="config-section">
              <label class="section-label">📐 3. 输出分辨率与渲染画质</label>
              <div class="resolution-options">
                <button 
                  class="res-btn" 
                  :class="{ active: resolutionMode === 480 }"
                  @click="!isConverting && (resolutionMode = 480)"
                  :disabled="isConverting"
                >
                  <span class="res-title">⚡ 480P (推荐/极速秒级)</span>
                  <span class="res-sub">最长边 480px • 18~25 FPS 极速渲染</span>
                </button>
                <button 
                  class="res-btn" 
                  :class="{ active: resolutionMode === 720 }"
                  @click="!isConverting && (resolutionMode = 720)"
                  :disabled="isConverting"
                >
                  <span class="res-title">🌟 720P (高清平衡)</span>
                  <span class="res-sub">最长边 720px • 画质与速度均衡</span>
                </button>
                <button 
                  class="res-btn" 
                  :class="{ active: resolutionMode === 1080 }"
                  @click="!isConverting && (resolutionMode = 1080)"
                  :disabled="isConverting"
                >
                  <span class="res-title">🎨 1080P (超清原画)</span>
                  <span class="res-sub">最长边 1080px • 细节精致</span>
                </button>
              </div>
            </div>

            <!-- Estimated Time Hint -->
            <div v-if="!isConverting && !convertResult && videoInfo" class="speed-hint-banner">
              <span>💡 预估处理速度: <strong>{{ estimatedFpsText }}</strong> · 预估总耗时: <strong>{{ estimatedTimeText }}</strong></span>
            </div>

            <!-- 4. Real-time Progress & Status Banner (When converting or completed) -->
            <div v-if="isConverting || convertResult" class="progress-status-panel">
              <div class="progress-header">
                <span class="stage-tag" :class="isConverting ? 'stage-running' : 'stage-done'">
                  {{ isConverting ? `⚡ ${progressData.stage === 'muxing' ? '正在混流音视频...' : 'AI 逐帧动漫化重绘中'}` : '🎉 动漫化转换完成！' }}
                </span>
                <span class="percent-text">{{ progressData.percent }}%</span>
              </div>

              <!-- Animated Progress Track -->
              <div class="progress-track">
                <div class="progress-bar-fill" :style="{ width: `${progressData.percent}%` }"></div>
              </div>

              <!-- Progress Metrics -->
              <div class="progress-metrics" v-if="isConverting">
                <span>已处理: <strong>{{ progressData.currentFrame || 0 }}</strong> / {{ progressData.totalFrames || videoInfo?.totalFrames || 0 }} 帧</span>
                <span>处理速度: <strong>{{ progressData.fps || 0 }}</strong> FPS</span>
                <span>剩余时间: <strong>{{ progressData.etaSeconds > 0 ? `约 ${progressData.etaSeconds} 秒` : '计算中...' }}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="anime-studio-footer">
          <div class="footer-left">
            <span v-if="statusMessage" class="status-msg" :class="{ 'status-error': isError }">
              {{ statusMessage }}
            </span>
          </div>

          <div class="footer-right">
            <!-- Cancel Button -->
            <button 
              v-if="isConverting" 
              class="btn btn-secondary btn-cancel" 
              @click="cancelConversion"
            >
              ⏹️ 终止任务
            </button>

            <!-- Play & Open Result Buttons (When completed) -->
            <template v-else-if="convertResult">
              <button class="btn btn-secondary" @click="openOutputFileLocation">
                📂 打开所在目录
              </button>
              <button class="btn btn-primary btn-glow" @click="playResultVideo">
                ▶️ 立即播放动漫视频
              </button>
            </template>

            <!-- Start Button -->
            <button 
              v-else 
              class="btn btn-primary btn-glow" 
              @click="startConversion"
              :disabled="isLoadingInfo"
            >
              <span>🚀</span> 启动一键二次元转换
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  video: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'play-video']);

const videoInfo = ref(null);
const isLoadingInfo = ref(false);
const selectedStyle = ref('hayao');
const frameRateMode = ref('anime15');
const resolutionMode = ref(480);
const isConverting = ref(false);
const isError = ref(false);
const statusMessage = ref('');
const convertResult = ref(null);

// FFmpeg Environment state
const envChecked = ref(false);
const ffmpegAvailable = ref(true);
const copiedCmd = ref(false);

const progressData = ref({
  currentFrame: 0,
  totalFrames: 0,
  percent: 0,
  fps: 0,
  etaSeconds: 0,
  stage: 'idle',
  isGpuMode: false
});

const estimatedFpsText = computed(() => {
  if (resolutionMode.value === 480) {
    if (frameRateMode.value === 'anime10') return '25 ~ 35 FPS (极速)';
    if (frameRateMode.value === 'anime15') return '18 ~ 25 FPS (秒级)';
    return '9 ~ 12 FPS';
  } else if (resolutionMode.value === 720) {
    if (frameRateMode.value === 'anime10') return '10 ~ 15 FPS';
    if (frameRateMode.value === 'anime15') return '6 ~ 10 FPS';
    return '3 ~ 5 FPS';
  } else {
    if (frameRateMode.value === 'anime10') return '4 ~ 6 FPS';
    if (frameRateMode.value === 'anime15') return '2.5 ~ 4 FPS';
    return '1 ~ 2 FPS';
  }
});

const estimatedTimeText = computed(() => {
  if (!videoInfo.value?.totalFrames) return '计算中...';
  const total = videoInfo.value.totalFrames;
  let fpsEst = 20;
  if (resolutionMode.value === 480) {
    fpsEst = frameRateMode.value === 'anime10' ? 30 : (frameRateMode.value === 'anime15' ? 20 : 10);
  } else if (resolutionMode.value === 720) {
    fpsEst = frameRateMode.value === 'anime10' ? 12 : (frameRateMode.value === 'anime15' ? 8 : 4);
  } else {
    fpsEst = frameRateMode.value === 'anime10' ? 5 : (frameRateMode.value === 'anime15' ? 3 : 1.5);
  }
  const sec = Math.max(1, Math.round(total / fpsEst));
  if (sec < 60) return `约 ${sec} 秒`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `约 ${min} 分 ${remSec} 秒`;
});

const styles = ref([
  { 
    id: 'hayao', 
    name: '🍃 宫崎骏·吉卜力油画风 (Hayao & Oil Painting)', 
    desc: '蓝天白云、青翠草甸、治愈系手绘与厚涂油画质感', 
    icon: '🍃',
    previewGradient: 'linear-gradient(135deg, #10b981, #059669)'
  },
  { 
    id: 'shinkai', 
    name: '✨ 新海诚·唯美光影风 (Shinkai)', 
    desc: '秒速五厘米/天气之子浪漫蓝紫云霞光晕', 
    icon: '✨',
    previewGradient: 'linear-gradient(135deg, #38bdf8, #818cf8)'
  },
  { 
    id: 'paprika', 
    name: '🌸 今敏·红辣椒浓烈奇幻风 (Paprika)', 
    desc: '浓厚色彩胶片质感、极具视觉冲击力', 
    icon: '🌸',
    previewGradient: 'linear-gradient(135deg, #f43f5e, #e11d48)'
  },
  { 
    id: 'portrait', 
    name: '🎨 二次元人像重绘 (Portrait V3)', 
    desc: '人脸五官精细动漫化、适合人物特写', 
    icon: '🎨',
    previewGradient: 'linear-gradient(135deg, #a855f7, #ec4899)'
  }
]);

async function checkEnvironment() {
  if (window.api?.checkVideoAnimeEnv) {
    try {
      const res = await window.api.checkVideoAnimeEnv();
      envChecked.value = true;
      if (res && res.success) {
        ffmpegAvailable.value = !!res.ffmpegReady;
      }
    } catch (_) {
      envChecked.value = true;
    }
  }
}

function copyFfmpegCmd() {
  const cmd = 'winget install Gyan.FFmpeg';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(cmd);
    copiedCmd.value = true;
    setTimeout(() => { copiedCmd.value = false; }, 3000);
  }
}

// Watch for video prop changes to load metadata
watch(() => props.video, async (newVal) => {
  if (newVal) {
    resetState();
    await checkEnvironment();
    await loadVideoMetadata();
  }
}, { immediate: true });

async function loadVideoMetadata() {
  if (!props.video || !window.api?.getVideoAnimeInfo) return;
  isLoadingInfo.value = true;
  statusMessage.value = '正在探测视频参数与音轨...';
  try {
    const res = await window.api.getVideoAnimeInfo(props.video.path);
    if (res && res.success) {
      videoInfo.value = res.data;
      statusMessage.value = '';
    } else {
      statusMessage.value = res?.error || '无法读取视频元数据';
      if (res?.error && (res.error.includes('ENOENT') || res.error.includes('spawn'))) {
        ffmpegAvailable.value = false;
        envChecked.value = true;
      }
    }
  } catch (err) {
    statusMessage.value = '探测失败: ' + err.message;
    if (err.message && (err.message.includes('ENOENT') || err.message.includes('spawn'))) {
      ffmpegAvailable.value = false;
      envChecked.value = true;
    }
  } finally {
    isLoadingInfo.value = false;
  }
}

function resetState() {
  videoInfo.value = null;
  isConverting.value = false;
  isError.value = false;
  statusMessage.value = '';
  convertResult.value = null;
  progressData.value = {
    currentFrame: 0,
    totalFrames: 0,
    percent: 0,
    fps: 0,
    etaSeconds: 0,
    stage: 'idle',
    isGpuMode: false
  };
}

// Progress listener registration
onMounted(() => {
  checkEnvironment();
  if (window.api?.onVideoAnimeProgress) {
    window.api.onVideoAnimeProgress((data) => {
      if (data) {
        progressData.value = { ...progressData.value, ...data };
      }
    });
  }
});

async function startConversion() {
  if (!props.video?.path || !window.api?.startVideoAnime) return;
  if (!ffmpegAvailable.value) {
    alert('未检测到 FFmpeg 视频编解码器，请先根据提示安装或配置 FFmpeg 后再进行转换。');
    return;
  }

  isConverting.value = true;
  isError.value = false;
  statusMessage.value = '🚀 正在初始化神经网络模型与编码管道...';
  convertResult.value = null;

  // Generate output path in same directory with _anime tag
  const srcPath = props.video.path;
  const lastDot = srcPath.lastIndexOf('.');
  const outputPath = lastDot !== -1 
    ? `${srcPath.substring(0, lastDot)}_anime_${selectedStyle.value}.mp4`
    : `${srcPath}_anime_${selectedStyle.value}.mp4`;

  try {
    const res = await window.api.startVideoAnime({
      inputPath: srcPath,
      outputPath,
      style: selectedStyle.value,
      maxDimension: resolutionMode.value,
      frameRateMode: frameRateMode.value
    });

    if (res && res.success) {
      isConverting.value = false;
      convertResult.value = res.data;
      statusMessage.value = '🎉 动漫化视频输出成功: ' + outputPath;
    } else {
      isConverting.value = false;
      isError.value = true;
      statusMessage.value = '转换中断或失败: ' + (res?.error || '未知错误');
    }
  } catch (e) {
    isConverting.value = false;
    isError.value = true;
    statusMessage.value = '转换失败: ' + e.message;
  }
}

async function cancelConversion() {
  if (window.api?.cancelVideoAnime) {
    await window.api.cancelVideoAnime();
    isConverting.value = false;
    statusMessage.value = '任务已由用户主动取消';
  }
}

function playResultVideo() {
  if (convertResult.value?.outputPath) {
    emit('play-video', {
      name: `Anime_${props.video.name}`,
      path: convertResult.value.outputPath
    });
    emit('close');
  }
}

function openOutputFileLocation() {
  if (convertResult.value?.outputPath && window.api?.openFileLocation) {
    window.api.openFileLocation(convertResult.value.outputPath);
  }
}

function handleClose() {
  if (isConverting.value) {
    if (!confirm('当前动漫化任务正在处理中，确定要终止并关闭吗？')) {
      return;
    }
    cancelConversion();
  }
  emit('close');
}
</script>

<style scoped>
.anime-studio-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(18px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.anime-studio-modal {
  position: relative;
  width: 100%;
  max-width: 980px;
  background: rgba(15, 23, 42, 0.95);
  border: 1.5px solid rgba(168, 85, 247, 0.35);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.2);
}

.anime-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.anime-close-btn:hover {
  background: #ef4444;
  border-color: #ef4444;
  transform: scale(1.1);
}

.anime-studio-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.header-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.4);
}
.header-icon {
  font-size: 22px;
}

.header-title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #fff;
}
.header-desc {
  margin: 2px 0 0 0;
  font-size: 11.5px;
  color: var(--text-secondary, #94a3b8);
}

.anime-studio-content {
  display: flex;
  gap: 20px;
  padding: 22px 24px;
  max-height: 65vh;
  overflow-y: auto;
}

.anime-left-panel {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.video-preview-card {
  width: 100%;
  aspect-ratio: 16 / 9.5;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  font-size: 36px;
  opacity: 0.5;
}

.video-meta-box {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11.5px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.meta-label {
  color: var(--text-secondary, #94a3b8);
  font-weight: 500;
}
.meta-val {
  color: #fff;
  font-weight: 700;
}
.filename-truncate {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.anime-right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.style-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.style-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.style-card:hover {
  border-color: rgba(168, 85, 247, 0.5);
  background: rgba(30, 41, 59, 0.8);
  transform: translateY(-2px);
}
.style-card.active {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.12);
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.35);
}

.style-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.style-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.style-name {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.style-desc {
  font-size: 10px;
  color: var(--text-secondary, #94a3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.style-check-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 11px;
  color: #a855f7;
  font-weight: 900;
}

.section-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.section-tip {
  font-size: 11px;
  color: #c084fc;
  font-weight: 500;
}

.frame-rate-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.fr-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fr-btn:hover {
  border-color: rgba(168, 85, 247, 0.5);
  transform: translateY(-2px);
}
.fr-btn.active {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.14);
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.35);
}

.fr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fr-title {
  font-size: 11.5px;
  font-weight: 700;
  color: #fff;
}

.fr-badge {
  font-size: 9.5px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 6px;
}
.badge-rec {
  background: rgba(16, 185, 129, 0.25);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}
.badge-normal {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}
.badge-turbo {
  background: rgba(245, 158, 11, 0.25);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.fr-sub {
  font-size: 10px;
  color: var(--text-secondary, #94a3b8);
  line-height: 1.35;
}

.resolution-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.res-btn {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.res-btn:hover {
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-2px);
}
.res-btn.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
}
.res-title {
  font-size: 11.5px;
  font-weight: 700;
  color: #fff;
}
.res-sub {
  font-size: 10px;
  color: var(--text-secondary, #94a3b8);
}

.speed-hint-banner {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 10px;
  font-size: 11.5px;
  color: #38bdf8;
}

.progress-status-panel {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: modalFadeIn 0.3s ease;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stage-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}
.stage-running {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}
.stage-done {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.percent-text {
  font-size: 14px;
  font-weight: 800;
  color: #38bdf8;
  font-family: var(--font-mono);
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #a855f7, #38bdf8);
  border-radius: 99px;
  transition: width 0.2s ease;
}

.progress-metrics {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--text-secondary, #94a3b8);
}

.anime-studio-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.status-msg {
  font-size: 11.5px;
  color: var(--text-secondary, #94a3b8);
  font-weight: 600;
}
.status-error {
  color: #ef4444 !important;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-glow {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%) !important;
  box-shadow: 0 4px 18px rgba(168, 85, 247, 0.45) !important;
}

.btn-cancel {
  background: rgba(239, 68, 68, 0.15) !important;
  color: #ef4444 !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
}
.btn-cancel:hover {
  background: #ef4444 !important;
  color: #fff !important;
}

/* Environment Warning Banner */
.anime-env-alert {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 14px;
  margin-bottom: 8px;
  align-items: flex-start;
}
.env-alert-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
}
.env-alert-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.env-alert-title {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
}
.env-alert-desc {
  font-size: 11.5px;
  color: #e2e8f0;
  line-height: 1.4;
}
.env-alert-cmd-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 4px 0;
}
.env-alert-cmd-row code {
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 8px;
  border-radius: 6px;
  color: #38bdf8;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}
.copy-cmd-btn {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.copy-cmd-btn:hover {
  background: #38bdf8;
  color: #0f172a;
}
.recheck-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.recheck-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.env-alert-tip {
  font-size: 10.5px;
  color: var(--text-secondary, #94a3b8);
}
</style>
