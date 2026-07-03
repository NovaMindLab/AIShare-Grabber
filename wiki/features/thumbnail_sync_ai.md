# 📱→🖥️ 手机缩略图批量同步 + AI 运算功能

> **Feature**: thumbnail-sync-ai  
> **状态**: ✅ 已实现 (Implemented in v1.0.2)  
> **涉及平台**: Android (Flutter) + PC (Electron/Vue 3)

---

## 📋 功能描述

在手机与 PC 成功建立 WebRTC 连接后，双端均支持进行手机端图片缩略图的批量同步与本地 AI 类别推理分类：

1. **发起同步**：
   - **PC 端**：在“连接手机 (Link Mobile)”控制面板中点击 `🧠 同步手机图片到 AI 分析` / `🧠 继续 AI 同步`。
   - **手机端**：在“媒体 (Media)”选项卡顶部点击 `同步全部图片到AI` / `继续同步到AI`。
2. **生成并压缩**：手机端在内存中将相册图片快速生成为 **400×400 JPEG (Quality = 85)** 的高保真缩略图。
3. **流式传输**：使用 WebRTC DataChannel，通过 32KB 分片块及 Backpressure 流量控制技术将字节流发送至 PC。
4. **归档落盘**：PC 端将收到的缩略图保存到专有目录 `cp_clip/thumbnail_sync/{deviceUuid}/`。
5. **AI 推理分类**：自动调用本地 ONNX 格式的 MobileCLIP 分类模型进行推理分类。
6. **SQLite 入库隔离**：将推理出的分类类别、百分比置信度连同路径写入 SQLite 数据库，并将其 `type` 标记为 `'thumbnail'`，保证主画廊不被缩略图污染。
7. **历史重连恢复**：相同的手机重新连接时，PC 侧自动从数据库加载该设备已有的缩略图，瞬间渲染到 UI 历史网格。
8. **断点续传（继续同步）**：根据已同步资源 ID 列表，发送前自动跳过已同步的缩略图，实现断点续传与极速增量更新。
9. **一键打开目录**：PC 端控制面板右上角常驻 `📁 打开缩略图文件夹` 按钮，点击即可快速呼出本地资源管理器定位同步文件夹。

---

## 🏗️ 架构实现

```
手机端 (Flutter)                         PC 端 (Electron & Vue)
─────────────────────────────────────────────────────────
[SyncViewModel]                          [App.vue]
  ├─ syncThumbnailsToAI()                  ├─ requestThumbnailSync() ──发送 fileId = -6 ──┐
  │   (检测已同步 ID 并跳过)                 │  (触发手机端批量同步)                         │
  └─ 监听 fileId == -6 信号 <──────────────┴──────────────────────────────────────────────┘
      │
      ▼
[PhotoStreamer]                           [main.cjs]
  └─ streamThumbnail()                       ├─ save-photo-chunk handler
      │  1. entity.thumbnailDataWithSize     │  └─ 识别 thumb_ 前缀
      │     (400x400 JPEG, q=85)             │  └─ 保存到 thumbnail_sync/{uuid}/
      │  2. 发送 Metadata 包 (fileId: -5)      ├─ classifyPhotoInternal() 运行推理
      │  3. 内存分片 _streamBytesInternal()    ├─ 存入 SQLite 并标记 type='thumbnail'
      │     (Backpressure: 限制缓冲 < 1MB)   └─ 通过 photo-synced 推送至渲染器
      ▼                                         │
[WebRtcSyncEngine.sendBinary()] ── 数据块 ──────┘
```

---

## 📐 关键技术点

### 1. 缩略图生成与内存流发送 (Mobile)
在 [photo_streamer.dart](file:///mnt/d/AI_serach_image/image_clip_android/android/lib/services/photo_streamer.dart) 中：
- 使用 `entity.thumbnailDataWithSize` 产生内存 `Uint8List`，绕过磁盘 I/O 写入。
- 引入 `_streamBytesInternal`，对内存字节进行 32KB 分片，并在循环中添加 Backpressure 校验：
  ```dart
  while (syncEngine!.getBufferedAmount() > 1000000) {
    await Future.delayed(const Duration(milliseconds: 30));
  }
  ```
  防止瞬时发送数千张缩略图导致直连通道缓冲区溢出。

### 2. 物理目录与数据库标记 (PC)
在 [main.cjs](file:///mnt/d/AI_serach_image/image_clip_android/cp_clip/main.cjs) 中：
- 识别 `thumb_` 开头的文件并将其落盘至 `thumbnail_sync/` 目录下。
- 使用 SQL 插入时标记 `type = 'thumbnail'`，在加载主画廊时执行 `type !== 'thumbnail'` 过滤；并在加载 AI 缩略图网格时单独执行 `type === 'thumbnail'` 过滤，实现完美的物理与逻辑双隔离。

### 3. 断点续传 (Resume / Incremental Sync)
- 握手阶段，PC 端将该设备已成功接收的所有资源 ID（包含缩略图 ID）汇总在 `synced_ids` 中传给手机端。
- 手机端 `SyncViewModel` 在同步开始前校验 `pcSyncedIds`：
  ```dart
  final String thumbName = 'thumb_${entity.id}.jpg';
  if (pcSyncedIds.contains(entity.id) || pcSyncedIds.contains(thumbName)) {
    logMessage("Skip sending thumbnail for ${entity.title} (already synced)");
    thumbnailSyncDone++;
    continue;
  }
  ```
  该逻辑实现了秒级的增量续传，即便上次同步中途断开，点击继续也只会同步新增的图片。

---

## 📂 涉及文件及变更明细

| 文件路径 | 修改说明 |
| :--- | :--- |
| [photo_streamer.dart](file:///mnt/d/AI_serach_image/image_clip_android/android/lib/services/photo_streamer.dart) | 实现内存分片 `_streamBytesInternal`、WebRTC 缓冲控制、`streamThumbnail` 400x400 JPEG 压缩方法。 |
| [sync_viewmodel.dart](file:///mnt/d/AI_serach_image/image_clip_android/android/lib/viewmodels/sync_viewmodel.dart) | 新增批量缩略图发送机制 `syncThumbnailsToAI`、已同步 ID 去重检测、以及 `-6` 指令包的握手与响应接收。 |
| [transfer_console_view.dart](file:///mnt/d/AI_serach_image/image_clip_android/android/lib/views/transfer_console_view.dart) | 新增手机端 Media 顶部的同步操作栏，展示当前同步状态或断点续传文案。 |
| [main.cjs](file:///mnt/d/AI_serach_image/image_clip_android/cp_clip/main.cjs) | 新增 `open-thumbnail-folder` IPC 处理；在分片保存中截获缩略图，定向存入 `thumbnail_sync/` 目录，执行 MobileCLIP ONNX 分类，并以 `type = 'thumbnail'` 入库。 |
| [preload.cjs](file:///mnt/d/AI_serach_image/image_clip_android/cp_clip/preload.cjs) | 暴露 `openThumbnailFolder` 桥接 API 至渲染环境。 |
| [App.vue](file:///mnt/d/AI_serach_image/image_clip_android/cp_clip/src/App.vue) | 在连接页顶部右侧添加 `📁 打开缩略图文件夹` 按钮；实现 `requestThumbnailSync` 发送端；在重连时查询并载入本地 `thumbnail` 历史数据；并在面板底部渲染带置信度与类别的专属网格。 |
| [locales.js](file:///mnt/d/AI_serach_image/image_clip_android/cp_clip/src/locales.js) | 补全中英文 locales 在同步、继续、分类与文件夹打开操作上的文案键值。 |
