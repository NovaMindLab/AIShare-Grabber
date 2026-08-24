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
            class="video-date-header"
          >
            <div class="video-date-title-wrap">
              <span class="video-date-icon">📅</span>
              <h4 class="video-date-title">{{ row.data.group.dateKey }}</h4>
              <span class="video-date-meta">
                {{ t?.videos?.dateVideosMeta ? t.videos.dateVideosMeta.replace('{count}', row.data.group.filteredCount).replace('{size}', formatBytes(row.data.group.filteredBytes)) : `(${row.data.group.filteredCount} 个视频 • ${formatBytes(row.data.group.filteredBytes)})` }}
              </span>
            </div>

            <!-- Date-level Actions -->
            <div class="video-date-actions" v-if="syncStatus === 'connected' && row.data.group.hasUnsynced">
              <button 
                class="btn btn-secondary btn-xs"
                @click="$emit('toggle-date-selection', row.data.group)"
                :title="isDateAllSelected(row.data.group) ? '取消勾选此日期的所有待同步视频' : '勾选此日期的所有待同步视频'"
              >
                {{ isDateAllSelected(row.data.group) ? (t?.videos?.clearDate || '⬜ 取消勾选此日期') : (t?.videos?.selectDate ? t.videos.selectDate.replace('{count}', row.data.group.unsyncedCount) : `☑️ 勾选此日期 (${row.data.group.unsyncedCount})`) }}
              </button>
              <button 
                class="btn btn-primary btn-xs"
                :disabled="isVideoSyncing"
                @click="$emit('sync-date', row.data.group)"
                title="仅下载此拍摄日期的全部视频"
              >
                <span>⚡</span> {{ t?.videos?.syncDateBtn ? t.videos.syncDateBtn.replace('{count}', row.data.group.unsyncedCount) : `同步此日期 (${row.data.group.unsyncedCount})` }}
              </button>
            </div>
            <div class="video-date-actions" v-else-if="!row.data.group.hasUnsynced">
              <span class="video-all-synced-badge">{{ t?.videos?.allDateSynced || '✅ 全部已备份' }}</span>
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
              <!-- Thumbnail / Poster Area -->
              <div class="video-poster-box">
                <!-- Real Thumbnail Cover (Base64 from mobile or local video frame capture) -->
                <img 
                  v-if="getVideoPoster(item)" 
                  :src="getVideoPoster(item)" 
                  class="video-poster-media" 
                  loading="lazy" 
                />
                <div v-else class="video-poster-placeholder">
                  <span class="video-poster-icon">🎬</span>
                </div>

                <!-- Top-Left Status Pill -->
                <span 
                  class="video-status-tag"
                  :class="item.isSynced ? 'tag-synced' : 'tag-unsynced'"
                >
                  {{ item.isSynced ? (t?.videos?.tagSynced || '🟢 已备份') : (t?.videos?.tagUnsynced || '⏳ 待下载') }}
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
                  <span>▶</span>
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
                  <span>{{ formatBytes(item.size) }}</span>
                  <span v-if="item.isSynced" class="video-play-hint">{{ t?.videos?.playHint || '▶️ 点击播放' }}</span>
                  <div v-else style="display: flex; align-items: center; gap: 6px;">
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
    default: 220
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
  'download-video'
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
  const posterH = w / (16 / 9.5);
  const footerH = 58;
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
      height: 48
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
  overscan: 5
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

.video-card {
  flex: 1;
  min-width: 0;
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

.video-card-empty-placeholder {
  flex: 1;
  min-width: 0;
  visibility: hidden;
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

.video-date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--bg-surface, rgba(255, 255, 255, 0.04));
  border-radius: 10px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
  border-left: 3.5px solid #a855f7;
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
</style>
