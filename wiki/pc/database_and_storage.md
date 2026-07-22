# ShareCLIP 数据库与存储结构工作原理

本文档详细介绍了 ShareCLIP (Image Clip) 项目在 PC 端如何设计文件存储系统，以及 SQLite 数据库的表结构与运行机制。

## 一、 本地文件存储结构

ShareCLIP 的核心理念是**隔离与不污染**用户的主机文件系统。当用户将手机端资源同步到 PC 端时，所有的文件与数据都严格收敛在安装目录（或用户自定义的下载目录）的专属子文件夹中。

### 1. 目录层级
每个同步的设备（手机）都分配了一个专属的 UUID 进行物理隔离。
主要的目录结构如下：

```text
cp_clip/
├── sync_storage/                     # 完整文件和数据库存放区
│   └── {deviceUuid}/                 # 按设备 UUID 隔离的子文件夹
│       ├── database.sqlite           # 该设备的专属 SQLite 数据库
│       ├── images/                   # 存放同步的高清图片
│       ├── videos/                   # 存放同步的视频
│       ├── audios/                   # 存放音频文件
│       └── files/                    # 存放其他文档和文件
│
└── thumbnail_sync/                   # AI 缩略图极速同步存放区
    └── {deviceUuid}/                 # 按设备隔离的缩略图文件夹
        └── [uuid].jpg                # 400x400 手机端生成的缩略图
```

### 2. 工作原理
- **缩略图分离机制**：为了加速 AI 语义分析并降低传输负担，系统会在移动端生成 `400x400` 的轻量级缩略图并直接发送至 `thumbnail_sync` 目录。
- **防止干扰**：这确保了即便同步几万张相册的缩略图，也不会在 PC 的 "图片库" 中制造垃圾。这些资源仅供 PC 端的 ShareCLIP AI 模型去读取和建立索引。

---

## 二、 SQLite 数据库结构

在 `sync_storage/{deviceUuid}/` 目录下，系统会针对每个设备生成一个 `database.sqlite` 文件。该数据库负责追踪文件状态、存储 AI 向量特征（Embedding）、支持断点续传以及空间地理信息（GPS）。

### 1. `resources` 数据表

项目所有的核心资产信息都在 `resources` 这一张表中管理。其表结构（Schema）如下：

| 字段名称       | 数据类型    | 说明 |
|--------------|------------|------|
| `id`         | TEXT       | 主键 (Primary Key)，资源在系统中的唯一标识符 (通常是 UUID) |
| `name`       | TEXT       | 文件名称 (如 `IMG_2026.jpg`) |
| `path`       | TEXT       | 文件在 PC 本地存储的绝对物理路径 |
| `type`       | TEXT       | 文件类型标记，常见值：`thumbnail` (仅作为 AI 分析的缩略图), `album_photo`, `video`, `file` 等 |
| `size`       | INTEGER    | 文件体积大小 (单位: Bytes) |
| `predictions`| TEXT       | JSON 字符串。存储 MobileCLIP 自动分类系统打的标签（如：`"自然风景"`, `"宠物"`）及置信度 |
| `sync_time`  | INTEGER    | 文件同步到 PC 端的 Unix 时间戳 |
| `embedding`  | BLOB       | **核心 AI 数据**。存放经过 MobileCLIP 提取的 512 维特征向量的二进制数据流 (对应 Float32Array) |
| `latitude`   | REAL       | (v1.2.0 新增) GPS 纬度，从 EXIF 提取 |
| `longitude`  | REAL       | (v1.2.0 新增) GPS 经度，从 EXIF 提取 |
| `create_date`| TEXT       | 照片的原始创建日期，主要用于 Album 批量同步时的断点续传（Breakpoint Resume）机制 |

---

## 三、 数据库工作原理与 AI 交互机制

### 1. 向量缓存与秒级搜索
搜索和比对数万张图片的 512 维浮点数组，如果每次都从硬盘读取会非常慢。因此系统采用了**预加载内存缓存机制**：
- 当用户连接设备（或初始化数据库）时，PC 端 `main.cjs` 会执行 `SELECT id, embedding, path ... FROM resources`。
- 系统从 `BLOB` 字段中读出 Buffer，并直接转换为 Node.js 的 `Float32Array`，装载进内存的 `imageEmbeddingsCache` 字典中。
- 当用户输入搜索词汇时，文字被转化为 512 维向量后，直接在内存中与所有缓存的图片向量进行**余弦相似度 (Cosine Similarity)** 矩阵计算，从而实现毫秒级的搜图体验。

### 2. 逻辑屏蔽与类型控制
因为系统中充斥着大量用于搜索的 `type = 'thumbnail'`（即手机相册缩略图），为了防止这些被压缩的缩略图与用户手动传输的源文件混淆，系统会在前端和逻辑查询中进行过滤：
- 缩略图仅用于 AI 分析、地图展示和相似度查询的封面展示。
- 普通的文件管理面板只会展示常规文件（`images`, `videos` 等），实现体验上的物理和逻辑双重隔离。

### 3. 断点续传 (Breakpoint Resume)
在批量传输手机相册时，若网络意外断开，用户重新连接后不需要从第一张开始传。
数据库会根据 `type = 'album_photo'` 的记录，按照 `create_date` 排序并找到最后一次成功同步的时间戳，作为断点告知手机端。手机端从这个时间节点继续扫描并发送，保证了传输的可靠性。

### 4. 自动 Schema 迁移
在版本的迭代中（如 v1.2.0 引入足迹地图所需 GPS 坐标），Node.js 主进程中使用了柔性 `ALTER TABLE` 方法。
如果旧版数据库缺少 `latitude`，`longitude` 或 `create_date` 列，启动时会忽略 "Column already exists" 错误平滑地注入新列，无需繁琐的数据库迁移脚本。
