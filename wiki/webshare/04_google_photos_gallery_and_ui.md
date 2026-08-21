# 04. Google Photos 风格画廊与全屏沉浸式查看器

WebShare 在前端展现层 100% 参照了 **Google 相册（Google Photos）** 的视觉规范与交互体验，包含两大核心 UI 模块：**等高自适应画廊流（Justified Flex Gallery）** 与 **全屏沉浸式大图查看器（Immersive Lightbox Viewer）**。

---

## 1. Google / Flickr 等高自适应画廊流

### 1.1 核心设计诉求
- 每行照片高度严格一致（固定为 `220px`）；
- 宽度根据照片自身原始宽高比（`aspectRatio`）自然伸缩；
- 避免传统瀑布流高低错落带来的视觉跳跃。

### 1.2 CSS Flexbox 弹性伸缩实现
```html
<div class="justified-gallery">
  <div 
    v-for="item in visiblePhotos" 
    :key="item.id"
    class="justified-item"
    :style="{ 
      flexGrow: item.aspectRatio || 1.33, 
      flexBasis: `${Math.round((item.aspectRatio || 1.33) * 200)}px` 
    }"
    @click="openLightbox(item)"
  >
    <div class="img-box">
      <img :src="item.blobUrl" loading="lazy" decoding="async" @load="handleImageLoad($event, item)" />
      <!-- 场景徽章与悬浮信息 -->
      <div v-if="item.topCategory" class="category-badge">
        {{ item.topCategory.name }} {{ Math.round(item.topCategory.score * 100) }}%
      </div>
      <div class="hover-overlay">
        <span class="photo-name-hover">{{ item.filename }}</span>
        <span class="photo-size-hover">{{ formatTimestampShort(item.takenAt || item.receivedAt) }}</span>
      </div>
    </div>
  </div>

  <!-- 末行防拉伸垫片 -->
  <div class="justified-spacer"></div>
</div>
```

```css
.justified-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.justified-item {
  height: 220px;
  overflow: hidden;
  border-radius: 14px;
}
.justified-spacer {
  flex-grow: 999;
  height: 0;
  min-width: 100px;
}
```

---

## 2. 1:1 Google Photos 全屏沉浸式大图查看器

点击任意照片后，立即进入全屏纯黑背景（`#000000`）沉浸式舞台。

### 2.1 顶部极简毛玻璃浮动工具栏
- **左侧**：`← 返回相册` 圆形图标按钮、拍摄时间与张数计数器（如 `2024年8月15日 14:30 · 1 / 2267`）；
- **右侧**：
  - `⬇ 下载`：一键保存当前原图；
  - `ⓘ 详情`：展开/收起右侧 AI 属性抽屉；
  - `🗑️ 删除`：从本地 IndexedDB 数据库中安全删除当前照片并自动流转至下一张。

### 2.2 双向悬浮大箭头与全键盘快捷键体系
- **屏幕左右两侧**：悬浮半透明毛玻璃切换按钮（`‹ 上一张` / `› 下一张`）；
- **全键盘原生快捷键支持**：
  - `←`（方向键左）：快速无缝切换上一张；
  - `→`（方向键右）：快速无缝切换下一张；
  - `Esc`：一键退出全屏返回相册；
  - `I`：快捷呼出 / 关闭右侧 AI 详情抽屉；
  - `Delete`：快速删除当前照片。

### 2.3 右侧半透明毛玻璃 AI 详情侧边栏（Info Drawer）
抽屉从右侧平滑滑出（`backdrop-filter: blur(24px)`），分三组清晰展示：
1. **📁 照片基本信息**：文件名、拍摄时间、文件体积、MIME 格式、SHA-256 哈希值、IndexedDB 持久化状态；
2. **🧠 WebGPU 场景智能识别**：Top-1 ~ Top-3 场景排行及渐变置信度进度条（如 `#1 乡村与自然风景 98%`）；
3. **🧬 MobileCLIP 向量特征**：512 维 Float32 向量特征与显卡 WebGPU 加速状态。
