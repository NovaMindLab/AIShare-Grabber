<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-icon">📸</span>
        <h1 class="brand-title">MobileCLIP Album</h1>
      </div>

      <div class="sidebar-section">
        <button class="btn btn-primary" style="width: 100%; margin-bottom: 12px;" @click="handleSelectFolder">
          <span>📁</span> 选择相册文件夹
        </button>
        <button class="btn btn-secondary" style="width: 100%;" @click="handleSelectImages">
          <span>🖼️</span> 选择单张/多张图片
        </button>
      </div>

      <!-- Category Filter -->
      <div class="sidebar-section" v-if="images.length > 0">
        <h2 class="section-title">分类过滤 (Categories)</h2>
        <div class="category-list">
          <div 
            class="category-item" 
            :class="{ active: selectedCategory === null }" 
            @click="selectedCategory = null"
          >
            <span>🌐 全部图片 (All)</span>
            <span class="category-count">{{ images.length }}</span>
          </div>
          <div 
            v-for="(count, cat) in categoryCounts" 
            :key="cat" 
            class="category-item" 
            :class="{ active: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            <span class="category-name">{{ cat }}</span>
            <span class="category-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- App Info / Status Warning -->
      <div class="sidebar-section glass-panel warning-block">
        <div class="warning-title">
          <span>💡</span> 架构说明 (Architecture)
        </div>
        <div class="warning-desc">
          本应用采用 <b>“预计算文本特征向量”</b> 架构，在本地纯 Node.js 主进程中使用 <code>onnxruntime-node</code> 运行 MobileCLIP 图像编码器，推理完成后的特征向量与 <code>text_embeddings.json</code> 计算余弦相似度（Cosine Similarity），零依赖纯本地处理。
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Top Header Bar -->
      <header class="top-bar">
        <div class="folder-path-display" style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span v-if="currentFolderPath" style="color: var(--text-secondary); font-size: 14px;">
            当前目录: <code style="background-color: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{ currentFolderPath }}</code>
          </span>
          <span v-else style="color: var(--text-muted); font-size: 14px;">
            未加载任何目录，请选择文件夹或导入图片。
          </span>
        </div>

        <!-- Search Bar -->
        <div class="search-bar-container" v-if="images.length > 0">
          <input 
            type="text" 
            class="search-input" 
            placeholder="输入英文搜索, 如 'a dog', 'sunset'..."
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            :disabled="isSearching"
          />
          <button class="btn btn-search" @click="handleSearch" :disabled="isSearching">
            <span v-if="isSearching" class="spinner" style="width: 12px; height: 12px;"></span>
            <span v-else>搜索</span>
          </button>
          <button class="btn btn-clear-search" v-if="isSearchActive" @click="handleClearSearch">
            ✕
          </button>
        </div>

        <!-- Global Progress Bar -->
        <div class="global-progress" v-if="isProcessing">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ processedCount }} / {{ totalCount }} 已识别</span>
        </div>
      </header>

      <!-- Grid Gallery -->
      <section class="gallery-container">
        <!-- Empty State -->
        <div class="empty-state" v-if="images.length === 0">
          <div class="empty-state-icon">🖼️</div>
          <h2 class="empty-state-title">开启本地相册AI分类</h2>
          <p class="empty-state-desc">
            点击左侧 <b>选择相册文件夹</b> 或 <b>选择图片</b>，系统将利用 MobileCLIP 在本地全自动对您的照片进行分类。完全本地化，无需上传网络，确保您的隐私安全。
          </p>
          <button class="btn btn-primary" @click="handleSelectFolder">
            📁 选择我的照片文件夹
          </button>
        </div>

        <!-- Image Cards Grid -->
        <div class="image-grid" v-else>
          <div 
            v-for="img in filteredImages" 
            :key="img.path" 
            class="image-card" 
            @click="openDetails(img)"
          >
            <div class="card-img-wrapper">
              <img :src="img.src" class="card-img" loading="lazy" />
              
              <!-- Processing Indicator -->
              <div class="loading-indicator" v-if="img.status === 'processing'">
                <span class="spinner"></span>
                <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">AI 分析中...</span>
              </div>
            </div>
            
            <div class="card-overlay">
              <span class="card-title">{{ img.name }}</span>
              
              <!-- Badges -->
              <span v-if="isSearchActive && img.searchScore !== undefined" class="badge badge-search-match">
                🎯 匹配度 {{ getMatchPercentage(img.searchScore) }}%
              </span>
              <span v-else-if="img.status === 'completed' && img.predictions.length > 0" class="badge badge-classified">
                {{ getShortCategory(img.predictions[0].category) }} ({{ Math.round(img.predictions[0].score * 100) }}%)
              </span>
              <span v-else-if="img.status === 'processing'" class="badge badge-loading">
                <span class="spinner"></span> 分析中
              </span>
              <span v-else class="badge badge-pending">
                ⏳ 等待队列
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Detailed Modal -->
    <div class="modal-backdrop" v-if="selectedImage" @click.self="closeDetails">
      <div class="modal-content">
        <button class="modal-close" @click="closeDetails">✕</button>
        
        <div class="modal-preview-side">
          <img :src="selectedImage.src" class="modal-preview-img" />
        </div>
        
        <div class="modal-info-side">
          <h2 class="modal-info-title">{{ selectedImage.name }}</h2>
          <p class="modal-info-meta">本地路径: {{ selectedImage.path }}</p>
          
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 20px; letter-spacing: 0.5px;">
            AI 零样本分类概率分布 (MobileCLIP Preds)
          </h3>
          
          <!-- Similarity Charts -->
          <div class="prediction-section" v-if="selectedImage.status === 'completed' && selectedImage.predictions.length > 0">
            <!-- Search Match Score inside Modal -->
            <div v-if="isSearchActive && selectedImage.searchScore !== undefined" style="margin-bottom: 20px; padding: 12px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                <span style="color: var(--accent-primary);">🔍 搜索匹配度 (Query Match)</span>
                <span style="color: var(--accent-primary);">{{ getMatchPercentage(selectedImage.searchScore) }}%</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">
                当前搜索词: "{{ searchQuery }}"
              </div>
            </div>

            <div 
              v-for="(pred, index) in selectedImage.predictions" 
              :key="pred.category" 
              class="prediction-bar-container"
            >
              <div class="prediction-label-row">
                <span class="prediction-label-name">{{ pred.category }}</span>
                <span class="prediction-label-score">{{ (pred.score * 100).toFixed(1) }}%</span>
              </div>
              <div class="prediction-bar-bg">
                <div 
                  class="prediction-bar-fill" 
                  :style="{ width: (pred.score * 100) + '%', transitionDelay: (index * 100) + 'ms' }"
                ></div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedImage.status === 'processing'" style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
            <span class="spinner" style="width: 24px; height: 24px; margin-bottom: 12px;"></span>
            <p>正在执行 MobileCLIP 模型本地推理，请稍候...</p>
          </div>

          <div v-else style="text-align: center; padding: 40px 0; color: var(--text-muted);">
            <p>等待分类排队中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

// Define double mode: Electron or Web Demo
const hasApi = typeof window !== 'undefined' && window.api !== undefined;

// State Variables
const images = ref([]);
const currentFolderPath = ref('');
const selectedCategory = ref(null);
const selectedImage = ref(null);

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

// Category counts based on Top-1 predictions
const categoryCounts = computed(() => {
  const counts = {};
  images.value.forEach(img => {
    if (img.status === 'completed' && img.predictions.length > 0) {
      const topCat = img.predictions[0].category;
      counts[topCat] = (counts[topCat] || 0) + 1;
    }
  });
  return counts;
});

// Filter and sort images based on sidebar selection and active search
const filteredImages = computed(() => {
  let list = [];
  if (selectedCategory.value === null) {
    list = [...images.value];
  } else {
    list = images.value.filter(img => 
      img.status === 'completed' && 
      img.predictions.length > 0 && 
      img.predictions[0].category === selectedCategory.value
    );
  }

  // If search is active, sort by searchScore descending
  if (isSearchActive.value) {
    list.sort((a, b) => {
      const scoreA = a.searchScore !== undefined ? a.searchScore : -1;
      const scoreB = b.searchScore !== undefined ? b.searchScore : -1;
      return scoreB - scoreA;
    });
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
  imgItem.status = 'processing';
  activeCount.value++;

  try {
    let results = [];
    if (hasApi) {
      // Call main process via preload bridge
      results = await window.api.classifyPhoto(imgItem.path);
    } else {
      // Mock web demo classification delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));
      results = getMockClassification(imgItem.src);
    }

    imgItem.predictions = results;
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

// Modal Interaction
function openDetails(img) {
  selectedImage.value = img;
}

// Clear search and close modal details
function closeDetails() {
  selectedImage.value = null;
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
