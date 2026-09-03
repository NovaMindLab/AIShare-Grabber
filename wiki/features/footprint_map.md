# 足迹地图（GPS 图片聚类）

本文档说明 ShareCLIP 中地理位置图片聚类功能的完整实现方案：从手机相册中读取照片的 GPS 元数据，通过 WebRTC 传输到 PC 端，写入本地数据库，并在 Leaflet 地图 UI 上以聚类缩略图气泡进行可视化展示。

---

## 📐 功能架构概览

```
Android 手机
  ↓ photo_manager.AssetEntity.latitude / longitude
  ↓ _sendMetadataPacket() — 写入 16字节 header + JSON payload
  ↓ WebRTC DataChannel
PC Electron 主进程 (main.cjs)
  ↓ save-photo-chunk IPC handler
  ↓ INSERT INTO resources (latitude, longitude)
  ↓ init-device-sync → 读取并返回坐标
Vue 前端 (App.vue)
  ↓ imagesWithGps = localImages.filter(has lat/lng)
  ↓ Leaflet + MarkerCluster 渲染
  ↓ 点击缩略图 → openDetails(img)
```

---

## 📱 Android 移动端

### 1. 地理位置权限（`ACCESS_MEDIA_LOCATION`）

Android 10（API 29）起，系统会对从 MediaStore 读取的 EXIF 地理坐标进行隐私清除，除非 APP 显式声明并运行时申请 `ACCESS_MEDIA_LOCATION` 权限。

**`android/app/src/main/AndroidManifest.xml`**：
```xml
<uses-permission android:name="android.permission.ACCESS_MEDIA_LOCATION" />
```

**`lib/main.dart`** 运行时申请（Stage 2 媒体权限列表中添加）：
```dart
await [
  Permission.photos,
  Permission.videos,
  Permission.audio,
  Permission.storage,
  Permission.accessMediaLocation,  // 新增
].request();
```

> ⚠️ **注意**：截屏生成的图片（截图）**永远不包含 GPS 坐标**。只有使用相机拍摄（且已授权相机使用位置信息）的原始照片才有坐标。

---

### 2. GPS 坐标传输协议

GPS 坐标通过 `photo_streamer.dart` 中的 `_sendMetadataPacket` 方法写入每张照片的元数据 JSON payload，在图片数据块发送前先行传输。

**`lib/services/photo_streamer.dart`**：

```dart
await _sendMetadataPacket(
  fileId: fileId,
  assetId: entity.id,
  name: cleanName,
  size: size,
  latitude: entity.latitude,   // photo_manager 提供，单位: 十进制度 (DD)
  longitude: entity.longitude,
);
```

`entity.latitude` / `entity.longitude` 由 `photo_manager` 包从 EXIF 中解析，原始格式为 DMS（度分秒），经 `photo_manager` 自动转换为十进制度（DD）返回。

缩略图传输（`streamThumbnail`）同样携带 GPS 坐标：
```dart
await _sendMetadataPacket(
  fileId: fileId,
  assetId: entity.id,
  name: name,
  size: thumbData.length,
  latitude: entity.latitude,
  longitude: entity.longitude,
);
```

---

## 🖥️ PC 端主进程 (main.cjs)

### 1. 本地 EXIF 解析（本地文件夹导入时）

本地导入时（用户从文件夹拖入照片），通过 `sharp` + `exif-reader` 包解析 EXIF GPS 字段：

```js
const sharp = require('sharp');
const exifReader = require('exif-reader');

async function extractImageGPS(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    if (metadata && metadata.exif) {
      const exifData = exifReader(metadata.exif);
      if (exifData && exifData.gps) {
        const lat = convertDMSToDD(exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef);
        const lon = convertDMSToDD(exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef);
        if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
          return { latitude: lat, longitude: lon };
        }
      }
    }
  } catch (err) {
    console.warn(`[EXIF] Failed to parse GPS for ${imagePath}:`, err.message);
  }
  return null;
}
```

DMS → 十进制度转换（WGS84 标准公式）：
```js
function convertDMSToDD(dms, ref) {
  if (!dms || dms.length < 3) return null;
  const [deg, min, sec] = dms;
  let dd = deg + (min / 60.0) + (sec / 3600.0);
  if (ref === 'S' || ref === 'W') dd = -dd;
  return dd;
}
```

### 2. 数据库 Schema 迁移

```sql
ALTER TABLE resources ADD COLUMN latitude REAL;
ALTER TABLE resources ADD COLUMN longitude REAL;
```

该迁移语句在 `init-device-sync` IPC 处理函数中自动执行，对已有数据库兼容升级。

### 3. 写入坐标

`save-photo-chunk` IPC 处理函数完成文件落盘后，将 metadata 中的坐标一并写入：

```js
activeDeviceDb.run(`
  INSERT OR REPLACE INTO resources
  (id, name, path, type, size, predictions, sync_time, embedding, latitude, longitude)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  assetId, filename, targetPath, type, size, predictionsStr, syncTime, embeddingBuffer,
  metadata?.latitude ?? null,
  metadata?.longitude ?? null
]);
```

### 4. 读取坐标

`init-device-sync` 加载历史资源时，完整返回坐标字段：
```sql
SELECT id, name, path, type, size, predictions, embedding, latitude, longitude FROM resources
```

---

## 🗺️ PC 前端地图实现 (App.vue + index.html)

### 1. Leaflet CDN 资源注入

**`cp_clip/index.html`**：
```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" crossorigin="" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" crossorigin="" />

<!-- Leaflet JS（在 main.js 之前加载，确保 window.L 可用） -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js" crossorigin=""></script>
```

### 2. 侧边栏标签页

在导航中添加"🗺️ 足迹地图"选项卡，标签上实时显示已有 GPS 照片数量：
```html
<div class="category-item" :class="{ active: currentTab === 'map' }" @click="currentTab = 'map'">
  <span>{{ t.sidebar.tabMap || '🗺️ 足迹地图' }}</span>
  <span class="category-count">{{ imagesWithGps.length }}</span>
</div>
```

### 3. 带 GPS 照片过滤

```js
const imagesWithGps = computed(() =>
  localImages.value.filter(file =>
    file.latitude != null && file.longitude != null
  )
);
```

### 4. Leaflet 地图初始化

当用户切换到 `'map'` 标签页时触发：

```js
watch(currentTab, (newTab) => {
  if (newTab === 'map') initMap();
});

function initMap() {
  mapLoadError.value = typeof L === 'undefined';
  if (mapLoadError.value) return;

  nextTick(() => {
    // 销毁旧实例
    if (leafletMap) { leafletMap.remove(); leafletMap = null; }

    // 使用 CartoDB Dark Matter 暗色地图瓦片
    leafletMap = L.map('map-container').setView([gpsList[0].latitude, gpsList[0].longitude], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd', maxZoom: 20
    }).addTo(leafletMap);

    // 初始化聚类组
    markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => L.divIcon({
        html: `<div class="map-cluster-marker">
          <img src="${markers[0].options.imgSrc}" class="map-cluster-img" />
          <span class="map-cluster-count">${cluster.getChildCount()}</span>
        </div>`,
        className: 'custom-cluster-icon',
        iconSize: [46, 46], iconAnchor: [23, 23]
      })
    });

    // 逐张添加标记
    gpsList.forEach(img => {
      const marker = L.marker([img.latitude, img.longitude], {
        icon: L.divIcon({
          html: `<div class="map-thumbnail-marker"><img src="${img.src}" /></div>`,
          className: 'custom-marker-icon', iconSize: [40, 40], iconAnchor: [20, 20]
        }),
        imgSrc: img.src
      });
      const popup = document.createElement('div');
      popup.innerHTML = `<img src="${img.src}" style="width:100px;height:100px;..." /><div>${img.name}</div>`;
      popup.addEventListener('click', () => openDetails(img));
      marker.bindPopup(popup, { closeButton: false, offset: [0, -10] });
      markerClusterGroup.addLayer(marker);
    });

    leafletMap.addLayer(markerClusterGroup);

    // 自动将视图缩放至所有照片的边界范围
    if (gpsList.length > 1) {
      leafletMap.fitBounds(L.latLngBounds(gpsList.map(img => [img.latitude, img.longitude])), { padding: [40, 40] });
    }
  });
}
```

### 5. 离线回退与空状态处理

- **离线/CDN 加载失败**：`mapLoadError.value = true`，显示提示卡片，引导用户检查网络。
- **无 GPS 数据**：当 `imagesWithGps.length === 0` 时显示引导说明，提示用户同步相机照片。

---

## 🎨 视觉样式设计

聚类气泡与单张照片标记均采用紫色玻璃拟态风格：

| 元素 | 样式 |
|---|---|
| 单张照片标记 | 40×40px 圆形，紫色边框，阴影 |
| 聚类气泡 | 46×46px，代表图缩略图 + 右上角数字徽章 |
| Popup 背景 | `rgba(15, 23, 42, 0.9)` + 毛玻璃效果 |
| 地图底图 | CartoDB Dark Matter 暗色瓦片（匹配整体深色主题） |

---

## 🔄 重新下载并运算

当本地图片缓存被删除或数据库记录需要重置时，可使用连接面板中的"🗑️ **重新下载并运算**"按钮：

1. 调用 `window.api.clearDeviceDatabase()` → 主进程 `clear-device-database` IPC：
   - DELETE FROM resources（清空数据库）
   - 删除内存 embeddings 缓存
   - 物理删除 `thumbnail_sync/<uuid>/` 和 `sync_storage/<uuid>/` 目录
2. 若手机在线（WebRTC 连接存在），通过 DataChannel 发送：
   - `fileId = -4`（handshake response）：`synced_ids: []`，重置手机的"已同步"过滤列表
   - `fileId = -6`（sync request）：触发手机重新调用 `syncThumbnailsToAI()`，从零开始完整传输

---

## 📦 相关文件

| 文件 | 说明 |
|---|---|
| [`android/android/app/src/main/AndroidManifest.xml`](file:///d:/AI_serach_image/image_clip_android/android/android/app/src/main/AndroidManifest.xml) | 权限声明 |
| [`android/lib/main.dart`](file:///d:/AI_serach_image/image_clip_android/android/lib/main.dart) | 权限运行时申请 |
| [`android/lib/services/photo_streamer.dart`](file:///d:/AI_serach_image/image_clip_android/android/lib/services/photo_streamer.dart) | GPS 坐标传输元数据包 |
| [`cp_clip/main.cjs`](file:///d:/AI_serach_image/image_clip_android/cp_clip/main.cjs) | EXIF 解析、数据库迁移、坐标存储与查询 |
| [`cp_clip/preload.cjs`](file:///d:/AI_serach_image/image_clip_android/cp_clip/preload.cjs) | IPC API 暴露 |
| [`cp_clip/index.html`](file:///d:/AI_serach_image/image_clip_android/cp_clip/index.html) | Leaflet CDN 资源注入 |
| [`cp_clip/src/App.vue`](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/App.vue) | 地图 UI、标签切换、坐标绑定、数据映射 |
| [`cp_clip/src/style.css`](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/style.css) | 地图标记与聚类样式 |
| [`cp_clip/src/locales.js`](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/locales.js) | 多语言：`tabMap` 翻译键 |

## 4. 地图底图免费开源化与暗黑模式魔法 (v2.1.17)

### 4.1 CARTO API 限制危机
在 v2.1.17 之前的版本中，足迹地图默认采用 CARTO DarkMatter 作为暗黑风格的瓦片地图源。然而，CARTO 官方近期收紧了免费策略，开始对未提供 API Key 的匿名请求进行拦截，并在所有地图瓦片上强制覆盖刺眼的 \API KEY REQUIRED\ 水印，导致地图功能近乎瘫痪。

### 4.2 零成本替换与 CSS 滤镜反色方案
为了坚持项目的完全免费开源性质并绕过复杂的 API 密钥管理，我们彻底弃用了 CARTO，并将瓦片数据源切换为全球最权威、且永久免费无限制的 **标准 OpenStreetMap (OSM)**。

然而，标准 OSM 瓦片是典型的“亮色白底”风格，与 ShareCLIP 极客风的赛博暗黑 UI 严重割裂。为此，我们在前端（\App.vue\）采用了一种轻量且巧妙的纯 CSS 视觉欺骗方案：

\\\css
/* 针对 Leaflet 专门负责瓦片底图的图层面板进行反色处理 */
.leaflet-tile-pane {
  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
}
\\\

**该方案的绝妙之处在于：**
1. **精准反色，不伤无辜**：由于只针对 \.leaflet-tile-pane\ 层应用 \invert(100%)\，地图背景完美变成了深邃的暗黑色，而在此之上的 \.leaflet-marker-pane\（包含用户的照片头像标记点）完全不受影响，色彩依旧真实鲜艳。
2. **色相还原**：通过 \hue-rotate(180deg)\，原本被反相的绿地（紫色）、蓝水（橙色）再次被拉回到正常的蓝绿色系，使得暗黑地图依然保持自然的地理色彩认知。
3. **高缩放支持**：OSM 标准瓦片最高支持至 \zoom: 19\ 级别，比之前 CARTO 的放大极限更深，更有利于查看精准到街道级别的照片分布。
