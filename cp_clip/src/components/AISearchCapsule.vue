<template>
  <div class="ai-search-capsule-wrapper max-w-2xl mx-auto flex flex-col items-center justify-center space-y-3">
    <!-- Floating Dynamic Capsule Container -->
    <div class="search-capsule-box w-full relative glow-border rounded-2xl bg-[#121622]/90 backdrop-blur-2xl shadow-2xl p-1.5 flex items-center gap-3">
      <!-- Left Icon: Sparkle / AI Lightning SVG with subtle pulse animation -->
      <div class="capsule-icon-wrap pl-3 flex items-center justify-center text-purple-400 select-none">
        <svg
          class="w-5 h-5 ai-lightning-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <!-- Input: Text input with clean placeholder -->
      <input
        ref="inputRef"
        type="text"
        :value="modelValue"
        @input="handleInput"
        @keydown.enter="handleSearch()"
        :placeholder="displayPlaceholder"
        :disabled="isSearching"
        class="capsule-input bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none flex-1 font-medium"
      />

      <!-- Clear Button: Show when text is present -->
      <button
        v-if="modelValue && modelValue.length > 0"
        type="button"
        class="capsule-clear-btn p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
        :title="t?.common?.clear || '清空搜索词'"
        @click="handleClear"
      >
        <svg
          class="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <!-- Action Button: Gradient button with hover scale effect -->
      <button
        type="button"
        class="capsule-action-btn px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        :disabled="isSearching"
        @click="handleSearch()"
      >
        <span v-if="isSearching" class="capsule-spinner"></span>
        <svg
          v-else
          class="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{{ isSearching ? (t?.gallery?.searching || '检索中...') : (t?.aiGallery?.searchBtn || '⚡ 毫秒搜图') }}</span>
      </button>
    </div>

    <!-- Instant Inspiration Tag Cloud Pills -->
    <div class="capsule-suggestions flex items-center gap-2 flex-wrap text-xs justify-center">
      <span class="suggestion-label text-slate-500 text-[11px] flex items-center gap-1">
        <svg class="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
        </svg>
        <span>{{ t?.aiGallery?.inspiration || '灵感试搜:' }}</span>
      </span>

      <button
        v-for="pill in activeSuggestions"
        :key="pill.label"
        type="button"
        class="suggestion-pill px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.06] hover:border-white/[0.15] transition-all cursor-pointer flex items-center gap-1"
        @click="selectSuggestion(pill.query || pill.label)"
      >
        <span>{{ pill.label }}</span>
      </button>
    </div>

    <!-- Result Statistics / Filter Status Row -->
    <div
      v-if="hasStats"
      class="capsule-stats-row w-full flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs"
    >
      <div class="flex items-center gap-2.5 flex-wrap">
        <span class="stats-text font-medium text-slate-300 flex items-center gap-1.5">
          <span class="stats-dot"></span>
          检索命中 <strong class="stats-number text-blue-400 font-bold font-mono">{{ searchCount }}</strong> 张结果
        </span>
        <span class="stats-divider text-slate-600">·</span>
        <span class="stats-confidence px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px] flex items-center gap-1">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          MobileCLIP2 置信度 &gt; {{ confidence || 85 }}%
        </span>
      </div>

      <button
        v-if="searchCount > 0 || (modelValue && modelValue.length > 0)"
        type="button"
        class="stats-clear-btn text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
        @click="handleClear"
      >
        <span>清空筛选</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isSearching: {
    type: Boolean,
    default: false
  },
  searchCount: {
    type: Number,
    default: null
  },
  confidence: {
    type: [Number, String],
    default: 88
  },
  t: {
    type: Object,
    default: () => ({})
  },
  placeholder: {
    type: String,
    default: ''
  },
  suggestions: {
    type: Array,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'search', 'clear']);

const inputRef = ref(null);

const defaultPills = [
  { label: '🏔️ 雪山跑车', query: '雪山下的红色跑车' },
  { label: '🧾 报销发票', query: '餐厅纸质发票小票' },
  { label: '🐶 沙滩小狗', query: '沙滩上的可爱金毛小狗' },
  { label: '🌧️ 雨夜街道', query: '霓虹灯下的下雨街道' },
  { label: '☕ 咖啡小聚', query: '咖啡馆惬意下午茶' }
];

const activeSuggestions = computed(() => {
  return props.suggestions && props.suggestions.length > 0
    ? props.suggestions
    : defaultPills;
});

const displayPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder;
  if (props.t?.aiGallery?.searchPlaceholder) return props.t.aiGallery.searchPlaceholder;
  if (props.t?.header?.searchPlaceholder) return props.t.header.searchPlaceholder;
  return '输入日常自然语言搜照片 (例如：雨天的发票、戴草帽的女孩、海边晚霞)...';
});

const hasStats = computed(() => {
  return props.searchCount !== undefined && props.searchCount !== null;
});

function handleInput(e) {
  emit('update:modelValue', e.target.value);
}

function handleSearch(customQuery) {
  if (props.isSearching) return;
  const targetQuery = typeof customQuery === 'string' ? customQuery : props.modelValue;
  emit('search', targetQuery);
}

function handleClear() {
  emit('update:modelValue', '');
  emit('clear');
  inputRef.value?.focus();
}

function selectSuggestion(query) {
  emit('update:modelValue', query);
  emit('search', query);
  inputRef.value?.focus();
}

defineExpose({
  inputRef,
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur()
});
</script>

<style scoped>
/* Main Wrapper */
.ai-search-capsule-wrapper {
  width: 100%;
  max-width: 42rem; /* 672px / max-w-2xl */
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-sizing: border-box;
}

/* Floating Capsule Container */
.search-capsule-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem 0.5rem;
  border-radius: 1rem;
  background-color: rgba(18, 22, 34, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px -5px rgba(99, 102, 241, 0.15);
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-capsule-box:focus-within {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 35px 2px rgba(99, 102, 241, 0.25);
}

/* Obsidian Glow Border Effect */
.glow-border {
  position: relative;
}

.glow-border::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(168, 85, 247, 0.3), rgba(255, 255, 255, 0.08));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  transition: background 0.3s ease;
}

.search-capsule-box:focus-within.glow-border::after {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.5), rgba(59, 130, 246, 0.4));
}

/* Left AI Sparkle/Lightning Icon */
.capsule-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 0.75rem;
  color: #c084fc;
  flex-shrink: 0;
}

.ai-lightning-icon {
  width: 1.25rem;
  height: 1.25rem;
  animation: ai-pulse 2.2s infinite ease-in-out;
}

@keyframes ai-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 0 6px rgba(192, 132, 252, 0.6));
  }
  50% {
    opacity: 0.65;
    transform: scale(0.95);
    filter: drop-shadow(0 0 2px rgba(192, 132, 252, 0.2));
  }
}

/* Input Field */
.capsule-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: #ffffff;
  font-family: inherit;
}

.capsule-input::placeholder {
  color: #64748b;
  font-weight: 400;
}

.capsule-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Clear Button */
.capsule-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  border-radius: 9999px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.capsule-clear-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
}

/* Action Button */
.capsule-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  background: linear-gradient(to right, #2563eb, #4f46e5);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.capsule-action-btn:hover:not(:disabled) {
  background: linear-gradient(to right, #3b82f6, #6366f1);
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 6px 12px -2px rgba(59, 130, 246, 0.3);
}

.capsule-action-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.capsule-action-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

/* Spinner */
.capsule-spinner {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: capsule-spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes capsule-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Suggestion Pills Row */
.capsule-suggestions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  justify-content: center;
  width: 100%;
}

.suggestion-label {
  color: #64748b;
  font-size: 0.6875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  user-select: none;
}

.suggestion-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.suggestion-pill:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.suggestion-pill:active {
  background-color: rgba(255, 255, 255, 0.12);
  transform: translateY(0) scale(0.97);
}

/* Stats Row */
.capsule-stats-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.75rem;
  box-sizing: border-box;
}

.stats-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background-color: #3b82f6;
  box-shadow: 0 0 6px #3b82f6;
  display: inline-block;
}

.stats-confidence {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.6875rem;
}

.stats-clear-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.6875rem;
  cursor: pointer;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  transition: color 0.2s ease;
}

.stats-clear-btn:hover {
  color: #f1f5f9;
  text-decoration: underline;
}
</style>
