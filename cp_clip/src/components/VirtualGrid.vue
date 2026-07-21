<template>
  <div ref="containerRef" v-bind="containerProps" class="virtual-grid-container">
    <div v-bind="wrapperProps" class="virtual-grid-wrapper">
      <div 
        v-for="row in list" 
        :key="row.index" 
        class="virtual-grid-row"
        :style="{ gap: gap + 'px' }"
      >
        <div 
          v-for="(item, idx) in row.data" 
          :key="idx" 
          class="virtual-grid-item"
        >
          <slot name="item" :item="item" :index="row.index * columns + idx"></slot>
        </div>
        <!-- empty placeholders to keep grid aligned if row is not full -->
        <div 
          v-for="i in (columns - row.data.length)" 
          :key="'empty-' + i" 
          class="virtual-grid-item empty"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useVirtualList, useElementSize } from '@vueuse/core';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  itemMinWidth: {
    type: Number,
    default: 220,
  },
  gap: {
    type: Number,
    default: 24,
  }
});

const containerRef = ref(null);
const { width: containerWidth } = useElementSize(containerRef);

const columns = computed(() => {
  if (!containerWidth.value) return 1;
  // Account for container padding if any, but let's assume padding is outside or handled by box-sizing
  const cols = Math.floor((containerWidth.value + props.gap) / (props.itemMinWidth + props.gap));
  return Math.max(1, cols);
});

const itemWidth = computed(() => {
  if (!containerWidth.value) return props.itemMinWidth;
  return (containerWidth.value - (columns.value - 1) * props.gap) / columns.value;
});

const itemHeight = computed(() => {
  // Assuming aspect-ratio 1 (square cards) plus gap for the row height
  return itemWidth.value + props.gap;
});

const chunkedItems = computed(() => {
  const chunks = [];
  const source = props.items || [];
  for (let i = 0; i < source.length; i += columns.value) {
    chunks.push(source.slice(i, i + columns.value));
  }
  return chunks;
});

const { list, containerProps, wrapperProps } = useVirtualList(chunkedItems, {
  itemHeight: () => itemHeight.value,
  overscan: 3, // Render 3 rows off-screen for smoother scrolling
});
</script>

<style scoped>
.virtual-grid-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  /* hide scrollbar for elegance if wanted, or leave it */
}

.virtual-grid-wrapper {
  width: 100%;
}

.virtual-grid-row {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

.virtual-grid-item {
  flex: 1;
  /* Maintain aspect ratio internally or just let the slot handle it.
     Since height is strictly set by virtual list row, flex items will stretch to row height. */
  height: 100%;
  min-width: 0; /* prevent flex blowout */
}
.virtual-grid-item.empty {
  visibility: hidden;
}
</style>
