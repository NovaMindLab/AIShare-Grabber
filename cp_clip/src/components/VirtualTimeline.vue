<template>
  <div ref="outerRef" class="virtual-timeline-outer">
    <div v-bind="containerProps" class="virtual-timeline-container">
      <div v-bind="wrapperProps" class="virtual-timeline-wrapper">
        <div 
          v-for="row in list" 
          :key="row.data.key" 
          class="virtual-timeline-row-box"
          :style="{ height: row.data.height + 'px', marginBottom: (row.data.type === 'header' ? '12px' : gap + 'px') }"
        >
          <!-- 1. Header Row -->
          <div 
            v-if="row.data.type === 'header'" 
            class="video-date-header glass-panel"
          >
            <div class="video-date-title-wrap">
              <div class="video-date-icon-box">📅</div>
              <h4 class="video-date-title">{{ row.data.group.dateKey }}</h4>
              <span class="video-date-meta-pill">
                {{ t?.videos?.dateVideosMeta ? t.videos.dateVideosMeta.replace('{count}', row.data.group.filteredCount).replace('{size}', formatBytes(row.data.group.filteredBytes)) : `${row.data.group.filteredCount} 个视频 • ${formatBytes(row.data.group.filteredBytes)}` }}
              </span>
            </div>

            <!-- Date-level Actions -->
            <div class="video-date-actions" v-if="syncStatus === 'connected' && row.data.group.hasUnsynced">
              <button 
                class="btn-date-select"
                :class="{ 'is-selected': isDateAllSelected(row.data.group) }"
                @click="$emit('toggle-date-selection', row.data.group)"
                :title="isDateAllSelected(row.data.group) ? '取消勾选此日期的所有待同步视频' : '勾选此日期的所有待同步视频'"
              >
                <span class="btn-check-dot">{{ isDateAllSelected(row.data.group) ? '✓' : '' }}</span>
                <span>{{ isDateAllSelected(row.data.group) ? (t?.videos?.clearDate || '取消全选') : (t?.videos?.selectDate ? t.videos.selectDate.replace('{count}', row.data.group.unsyncedCount) : `勾选此日期 (${row.data.group.unsyncedCount})`) }}</span>
              </button>
              <button 
                class="btn-date-sync"
                :disabled="isVideoSyncing"
                @click="$emit('sync-date', row.data.group)"
                title="仅下载此拍摄日期的全部视频"
              >
                <span class="bolt-icon">⚡</span>
                <span>{{ t?.videos?.syncDateBtn ? t.videos.syncDateBtn.replace('{count}', row.data.group.unsyncedCount) : `同步此日期 (${row.data.group.unsyncedCount})` }}</span>
              </button>
            </div>
            <div class="video-date-actions" v-else-if="!row.data.group.hasUnsynced">
              <span class="video-all-synced-badge">
                <span class="check-pill-icon">✓</span>
                <span>{{ t?.videos?.allDateSynced || '全部已备份' }}</span>
              </span>
            </div>
          </div>

          <!-- 2. Video Cards Grid Row -->
          <div 
            v-else-if="row.data.type === 'cards'" 
            class="video-cards-virtual-row"
            :style="{ gap: gap + 'px' }"
          >
            <div 
              v-for="item in row.data.items" 
              :key="item.id || item.path" 
              class="video-card glass-panel-hover"
              :class="{ 
                'card-unsynced': item.isRemoteOnly,
                'card-selected': isVideoSelected(item)
              }"
              @click="item.isSynced ? $emit('play-video', item) : $emit('toggle-selection', item)"
            >
              <!-- 16:9 Thumbnail / Poster Area -->
              <div class="video-poster-box">
                <!-- Real Thumbnail Cover (Base64 from mobile or local video frame capture) -->
                <img 
                  v-if="getVideoPoster(item)" 
                  :src="getVideoPoster(item)" 
                  class="video-poster-media" 
                  loading="lazy" 
                />
                
                <!-- Cyberpunk Indigo Fallback Poster Mesh -->
                <div v-else class="video-poster-placeholder">
                  <div class="cyber-mesh-bg"></div>
                  <div class="cyber-film-watermark">
                    <svg class="cyber-film-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="8" width="36" height="32" rx="6" stroke="url(#filmGrad)" stroke-width="2.5" fill="rgba(15, 23, 42, 0.65)"/>
                      <circle cx="14" cy="15" r="2.2" fill="#a855f7" opacity="0.85"/>
                      <circle cx="24" cy="15" r="2.2" fill="#6366f1" opacity="0.85"/>
                      <circle cx="34" cy="15" r="2.2" fill="#06b6d4" opacity="0.85"/>
                      <circle cx="14" cy="33" r="2.2" fill="#a855f7" opacity="0.85"/>
                      <circle cx="24" cy="33" r="2.2" fill="#6366f1" opacity="0.85"/>
                      <circle cx="34" cy="33" r="2.2" fill="#06b6d4" opacity="0.85"/>
                      <polygon points="21,20 31,24 21,28" fill="url(#playGrad)"/>
                      <defs>
                        <linearGradient id="filmGrad" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#a855f7"/>
                          <stop offset="0.5" stop-color="#6366f1"/>
                          <stop offset="1" stop-color="#06b6d4"/>
                        </linearGradient>
                        <linearGradient id="playGrad" x1="21" y1="20" x2="31" y2="28" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#38bdf8"/>
                          <stop offset="1" stop-color="#c084fc"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <span class="cyber-film-text">ShareCLIP 1080P</span>
                  </div>
                </div>

                <!-- Top-Left Status Pill -->
                <span 
                  class="video-status-tag"
                  :class="item.isSynced ? 'tag-synced' : 'tag-unsynced'"
                >
                  <span class="status-icon-symbol">{{ item.isSynced ? '✓' : '⬇' }}</span>
                  <span>{{ item.isSynced ? (t?.videos?.tagSynced || '已备份') : (t?.videos?.tagUnsynced || '待下载') }}</span>
                </span>

                <!-- Top-Right Custom Checkbox for Multi-Select -->
                <div 
                  v-if="!item.isSynced" 
                  class="video-select-checkbox" 
                  :class="{ 'is-checked': isVideoSelected(item) }"
                  @click.stop="$emit('toggle-selection', item)"
                  title="勾选/取消勾选该视频"
                >
                  <span v-if="isVideoSelected(item)" class="check-icon">✓</span>
                </div>

                <!-- Center Hover Play Overlay for Synced Videos -->
                <div v-if="item.isSynced" class="video-play-center-btn">
                  <span class="play-triangle">▶</span>
                </div>

                <!-- Bottom-Right Duration Badge -->
                <span v-if="item.duration" class="video-duration-pill">
                  {{ formatVideoDuration(item.duration) }}
                </span>
              </div>

              <!-- Video Info Footer -->
              <div class="video-card-footer">
                <div class="video-card-name" :title="item.name">{{ item.name }}</div>
                <div class="video-card-sub">
                  <span class="video-size-badge">{{ formatBytes(item.size) }}</span>
                  <div v-if="item.isSynced" class="video-action-group">
                    <button 
                      class="btn-video-anime-edit" 
                      @click.stop="$emit('open-anime-studio', item)"
                      title="一键将视频转换为二次元动漫风"
                    >
                      🎨 动漫化
                    </button>
                    <button 
                      class="btn-video-play-action" 
                      @click.stop="$emit('play-video', item)"
                      title="播放视频"
                    >
                      <span>▶️</span> {{ t?.videos?.playHint || '播放' }}
                    </button>
                  </div>
                  <div v-else class="video-action-group">
                    <button 
                      class="btn-video-quick-download" 
                      @click.stop="$emit('download-video', item)"
                      :disabled="isVideoSyncing"
                      title="直接下载此视频"
                    >
                      ⬇️ {{ t?.videos?.quickDownload || '下载' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty placeholders to keep grid layout aligned when row has fewer items than columns -->
            <div 
              v-for="emptyIdx in (row.data.columns - row.data.items.length)" 
              :key="'empty_' + emptyIdx" 
              class="video-card-empty-placeholder"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useVirtualList } from '@vueuse/core';

const props = defineProps({
  groups: {
    type: Array,
    required: true
  },
  minItemWidth: {
    type: Number,
    default: 230
  },
  gap: {
    type: Number,
    default: 14
  },
  syncStatus: {
    type: String,
    default: 'idle'
  },
  selectedVideoIds: {
    type: Object,
    default: () => new Set()
  },
  isVideoSyncing: {
    type: Boolean,
    default: false
  },
  t: {
    type: Object,
    default: () => ({})
  },
  getVideoPoster: {
    type: Function,
    required: true
  },
  formatBytes: {
    type: Function,
    required: true
  },
  formatVideoDuration: {
    type: Function,
    required: true
  }
});

defineEmits([
  'toggle-selection',
  'toggle-date-selection',
  'sync-date',
  'play-video',
  'download-video',
  'open-anime-studio'
]);

const outerRef = ref(null);
const containerWidth = ref(0);
let resizeObserver = null;

onMounted(() => {
  if (outerRef.value) {
    containerWidth.value = outerRef.value.clientWidth;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect && entry.contentRect.width > 0) {
          containerWidth.value = entry.contentRect.width;
        }
      }
    });
    resizeObserver.observe(outerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

function isVideoSelected(item) {
  return props.selectedVideoIds?.has ? props.selectedVideoIds.has(item.id) : false;
}

function isDateAllSelected(group) {
  const unsynced = (group.items || []).filter(i => !i.isSynced);
  if (unsynced.length === 0) return false;
  return unsynced.every(i => isVideoSelected(i));
}

const columns = computed(() => {
  if (!containerWidth.value) return 3;
  const cols = Math.floor((containerWidth.value + props.gap) / (props.minItemWidth + props.gap));
  return Math.max(1, cols);
});

const itemWidth = computed(() => {
  if (!containerWidth.value) return props.minItemWidth;
  return (containerWidth.value - (columns.value - 1) * props.gap) / columns.value;
});

const cardRowHeight = computed(() => {
  const w = itemWidth.value;
  const posterH = w / (16 / 9);
  const footerH = 64;
  return Math.round(posterH + footerH);
});

const flattenedRows = computed(() => {
  const rows = [];
  const cols = columns.value;
  const rowH = cardRowHeight.value;

  for (const group of (props.groups || [])) {
    // 1. Header row
    rows.push({
      type: 'header',
      key: `hdr_${group.rawDate}`,
      group,
      height: 52
    });

    // 2. Chunks of video items
    const items = group.items || [];
    for (let i = 0; i < items.length; i += cols) {
      const chunk = items.slice(i, i + cols);
      rows.push({
        type: 'cards',
        key: `row_${group.rawDate}_${i}`,
        group,
        items: chunk,
        columns: cols,
        height: rowH
      });
    }
  }
  return rows;
});

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(flattenedRows, {
  itemHeight: (index) => {
    const item = flattenedRows.value[index];
    if (!item) return 200;
    const margin = item.type === 'header' ? 12 : props.gap;
    return item.height + margin;
  },
  overscan: 6
});

defineExpose({
  scrollTo
});
</script>

<style scoped>
.virtual-timeline-outer {
  width: 100%;
  flex: 1;
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.virtual-timeline-container {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.virtual-timeline-wrapper {
  width: 100%;
}

.virtual-timeline-row-box {
  width: 100%;
  box-sizing: border-box;
}

.video-cards-virtual-row {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

/* 16:9 Video Card Container */
.video-card {
  flex: 1;
  min-width: 0;
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-surface, rgba(18, 24, 38, 0.75));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.28s ease,
              background 0.28s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  position: relative;
}

.video-card:hover {
  transform: translateY(-4px);
  border-color: rgba(168, 85, 247, 0.55);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(168, 85, 247, 0.22);
}

.video-card-empty-placeholder {
  flex: 1;
  min-width: 0;
  visibility: hidden;
}

.card-unsynced {
  border-color: rgba(6, 182, 212, 0.25);
}

.card-unsynced:hover {
  border-color: rgba(6, 182, 212, 0.6);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(6, 182, 212, 0.25);
}

.card-selected {
  border-color: #a855f7 !important;
  background: rgba(168, 85, 247, 0.12) !important;
  box-shadow: 0 0 24px rgba(168, 85, 247, 0.55), 0 8px 24px rgba(0, 0, 0, 0.4) !important;
}

/* 16:9 Poster Area */
.video-poster-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #090d16;
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
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.video-card:hover .video-poster-media {
  transform: scale(1.06);
}

/* Fallback Poster Gradient & Cyber Mesh */
.video-poster-placeholder {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #18132b 0%, #0d1322 50%, #12182b 100%);
  overflow: hidden;
}

.cyber-mesh-bg {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.18) 0%, transparent 65%),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 20px 20px, 20px 20px;
}

.cyber-film-watermark {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.75;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.video-card:hover .cyber-film-watermark {
  opacity: 1;
  transform: scale(1.08);
}

.cyber-film-svg {
  width: 44px;
  height: 44px;
  filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.4));
}

.cyber-film-text {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Center Play Overlay on Hover */
.video-play-center-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.85);
  width: 46px;
  height: 46px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.4);
  z-index: 4;
}

.video-card:hover .video-play-center-btn {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.play-triangle {
  font-size: 17px;
  margin-left: 2px;
  background: linear-gradient(135deg, #38bdf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Top-Right Multi-Select Checkbox */
.video-select-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
}

.video-select-checkbox:hover {
  transform: scale(1.14);
  border-color: #fff;
  background: rgba(15, 23, 42, 0.9);
}

.video-select-checkbox.is-checked {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border-color: #ffffff;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.85);
}

.check-icon {
  color: #fff;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

/* Bottom-Right Duration Badge */
.video-duration-pill {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  backdrop-filter: blur(8px);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  z-index: 3;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.3px;
}

/* Top-Left Status Pill */
.video-status-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: 6px;
  backdrop-filter: blur(8px);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.status-icon-symbol {
  font-size: 10px;
  font-weight: 900;
}

.tag-synced {
  background: rgba(16, 185, 129, 0.22);
  border: 1px solid rgba(16, 185, 129, 0.5);
  color: #34d399;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.tag-unsynced {
  background: rgba(6, 182, 212, 0.22);
  border: 1px solid rgba(6, 182, 212, 0.5);
  color: #38bdf8;
  text-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
}

/* Card Bottom Footer */
.video-card-footer {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  background: transparent;
}

.video-card-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary, #f8fafc);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.video-card-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.video-size-badge {
  color: var(--text-secondary, #94a3b8);
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.video-action-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-video-anime-edit {
  padding: 2.5px 8px;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 6px;
  background: rgba(168, 85, 247, 0.16);
  border: 1px solid rgba(168, 85, 247, 0.45);
  color: #c084fc;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  gap: 3px;
}

.btn-video-anime-edit:hover {
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #fff;
  border-color: #a855f7;
  transform: scale(1.06);
  box-shadow: 0 3px 12px rgba(168, 85, 247, 0.45);
}

.btn-video-play-action {
  padding: 2.5px 9px;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 6px;
  background: rgba(6, 182, 212, 0.16);
  border: 1px solid rgba(6, 182, 212, 0.45);
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  gap: 3px;
}

.btn-video-play-action:hover {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: #fff;
  border-color: #06b6d4;
  transform: scale(1.06);
  box-shadow: 0 3px 12px rgba(6, 182, 212, 0.45);
}

.btn-video-quick-download {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  background: rgba(6, 182, 212, 0.18);
  border: 1px solid rgba(6, 182, 212, 0.5);
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  gap: 3px;
}

.btn-video-quick-download:hover {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: #fff;
  transform: scale(1.06);
  box-shadow: 0 3px 12px rgba(6, 182, 212, 0.45);
}

/* Glassmorphism Date Header */
.video-date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(18, 24, 38, 0.65);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid #a855f7;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.video-date-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.video-date-icon-box {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-date-title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--text-primary, #f8fafc);
  letter-spacing: 0.2px;
}

.video-date-meta-pill {
  font-size: 11.5px;
  color: var(--text-secondary, #94a3b8);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.video-date-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-date-select {
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

.btn-date-select:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}

.btn-date-select.is-selected {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.5);
  color: #c084fc;
}

.btn-check-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
}

.btn-date-select.is-selected .btn-check-dot {
  background: #a855f7;
  border-color: #a855f7;
  color: #fff;
}

.btn-date-sync {
  padding: 4px 14px;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 8px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  border: 1px solid rgba(168, 85, 247, 0.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 10px rgba(168, 85, 247, 0.35);
}

.btn-date-sync:hover:not(:disabled) {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.55);
}

.btn-date-sync:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bolt-icon {
  font-size: 12px;
}

.video-all-synced-badge {
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

.check-pill-icon {
  font-weight: 900;
  font-size: 12px;
}
</style>
