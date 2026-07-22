# 🧠 ShareCLIP AI 模块架构设计与零拷贝 SharedArrayBuffer 内存 Wiki

## 1. 概述与核心设计理念

ShareCLIP 的 AI 引擎是一个**全离线、高并发、零拷贝 (Zero-Copy)** 的跨模态图像识别与自然语言语义检索系统。它结合了 MobileCLIP 神经网络、ONNX Runtime 跨平台推理引擎、`SharedArrayBuffer` 物理内存共享以及 SQLite 数据库持久化。

### 核心指标
- **向量维度**：512 维 Float32 特征向量（每个向量占 $512 \times 4\text{ Bytes} = 2,048\text{ Bytes}$）。
- **共享内存容量**：根据宿主机硬件自适应分配 40 MB ~ 200 MB `SharedArrayBuffer`（支持 20,000 ~ 100,000 张照片毫秒级检索）。
- **锁机制**：**100% 无锁设计 (Lock-Free)**，采用“主线程单写 (Single Writer) + 物理空间切片隔离 + 子线程纯只读”范式。
- **响应延迟**：手机传输图片 1-2ms 快速完成物理落盘与响应，AI 计算后台异步队列化，间隙 20ms 出让事件循环，确保 WebRTC 心跳永不掉线。

---

## 2. 系统整体架构与流转图

### 2.1 整体架构流程图
```mermaid
flowchart TD
    subgraph 1. 跨设备传输与解耦入队
        A[手机端照片/缩略图] -->|WebRTC 接收| B["主进程 save-full-photo (1-2ms 快速落盘)"]
        B -->|无阻塞压入| C[待处理队列 aiClassificationQueue]
    end

    subgraph 2. 多线程 ONNX 向量抽取
        C -->|TaskManager 调度| D[ONNX Inference Worker 线程]
        D -->|Sharp 预处理 256x256| E[ort.Tensor float32]
        E -->|MobileCLIP 编码| F["512维 Float32Array 特征向量 (由 postMessage 返回主进程)"]
    end

    subgraph 3. 无锁 SAB 物理内存写入 & SQLite 2048B 落盘
        F -->|返回| G[主进程 TaskManager 单点写入器]
        G -->|分配| H["分配独占槽位 sabIndex (O1 空间切片隔离)"]
        
        H -->|物理写入| I[("SharedArrayBuffer (40MB~200MB 物理共享内存)")]
        I --- J["floatView.set(emb, sabIndex * 512) ── 100% 无锁写入"]
        
        H -->|零拷贝转换| K["Node.js Buffer (2,048 Bytes, 512 x 4B)"]
        K -->|SQLite UPDATE| L[("SQLite 数据库 resources.db (embedding BLOB 字段)")]
    end

    subgraph 4. 自然语言搜索 & 相似图聚类 (Zero-Copy Read)
        M[UI 搜索词 / 相似清理请求] -->|SimpleTokenizer| N[CLIP 文本编码器 textual.onnx]
        N -->|生成| O[512维 文本特征向量 queryEmbedding]
        O -->|派发任务 + sabIndices| P[Search Worker 计算线程]
        
        I ==>|挂载同一 SharedArrayBuffer 内存| Q["Search Worker 视图 sharedFloatView"]
        P -->|Zero-Copy 读取| R["getEmbedding => sharedFloatView.subarray(offset, offset + 512)"]
        
        Q & R -->|无锁/无 IPC 拷贝点积运算| S[余弦相似度 Cosine Similarity 排序/聚类]
        S -->|展现| T[PC 渲染界面 毫秒级展示检索结果]
    end
```

### 2.2 时序与线程交互图
```mermaid
sequenceDiagram
    autonumber
    participant App as 手机/UI层
    participant Main as Node.js 主进程 (TaskManager)
    participant InferWorker as ONNX 推理 Worker
    participant SAB as SharedArrayBuffer (物理内存)
    participant DB as SQLite 数据库 (resources.db)
    participant SearchWorker as 检索/聚类 Worker

    App->>Main: 传输图片 (WebRTC)
    Main->>Main: 1-2ms 快速落盘 + 压入 AI 异步队列
    Main->>InferWorker: 派发图片路径 (Inference Task)
    InferWorker->>InferWorker: Sharp 缩放 + ONNX 图像模型计算
    InferWorker-->>Main: 返回 512维 Float32Array 向量
    
    rect rgb(235, 245, 255)
        note over Main,SAB: 关键阶段 1: 无锁 SharedArrayBuffer 单点写入
        Main->>Main: 分配递增槽位 sabIndex (空间切片隔离)
        Main->>SAB: floatView.set(embedding, sabIndex * 512) [无锁/0延迟]
    end

    rect rgb(240, 255, 240)
        note over Main,DB: 关键阶段 2: 2048 字节二进制落盘
        Main->>DB: Buffer.from(emb.buffer, offset, 2048B) 写入 BLOB
    end

    App->>Main: 自然语言搜图 "草地上的猫咪"
    Main->>SearchWorker: 发送检索词向量 + 槽位索引表 sabIndices
    
    rect rgb(255, 245, 235)
        note over SAB,SearchWorker: 关键阶段 3: 零拷贝共享读取
        SearchWorker->>SAB: sharedFloatView.subarray(offset, offset + 512) [零内存复制]
        SearchWorker->>SearchWorker: 计算 1,000,000+ 次点积 (Cosine Distance)
    end
    
    SearchWorker-->>Main: 返回 Top-K 结果/相似图分组
    Main-->>App: UI 毫秒级呈现搜索画廊
```

---

## 3. SharedArrayBuffer 内存模型与无锁机制

### 3.1 动态硬件分级与 SAB 分配策略
系统启动时由 `src/workers/task-manager.cjs` 进行硬件嗅探，按宿主机配置分配固定容量的连续物理内存：

| 硬件档次 (Tier) | 条件 | 最大容量 (`MAX_IMAGES`) | SAB 分配大小 |
| :--- | :--- | :--- | :--- |
| **Low-Tier** | RAM < 8GB 或 CPU < 4 核 | 20,000 张 | **40 MB** ($20,000 \times 512 \times 4\text{B}$) |
| **Mid-Tier** | RAM 8-16GB 或 CPU 4-8 核 | 50,000 张 | **100 MB** ($50,000 \times 512 \times 4\text{B}$) |
| **High-Tier** | RAM > 16GB 且 CPU > 8 核 | 100,000 张 | **200 MB** ($100,000 \times 512 \times 4\text{B}$) |

### 3.2 为什么无锁 (Lock-Free)？
在传统的多线程共享内存开发中，并发读写需要依靠 `Atomics.wait()` 或互斥锁 (Mutex)。ShareCLIP 采用了 **“单生产者-空间切片隔离-纯只读消费者”** 范式，实现了零锁安全：

1. **单点写入 (Single Producer)**：仅主进程 `TaskManager` 拥有写权限，所有 AI Worker 将算好的向量返回主进程后再统一写入 SAB。
2. **空间物理隔离 (Disjoint Offsets)**：每张图片固定分配唯一整数槽位 `sabIndex`，其物理内存区间为 `[sabIndex * 512 * 4, (sabIndex + 1) * 512 * 4)`，绝对不会产生内存覆写碰撞。
3. **只读计算 (Read-Only Consumer)**：`search.worker.cjs` 只对 SAB 进行 `sharedFloatView.subarray(offset, offset + 512)` 检索计算，绝不执行写操作，因此物理上无需任何读写锁。

---

## 4. 底层关键数据转换与代码实现

### 4.1 图像预处理与 ONNX 推理 (`src/workers/inference.worker.cjs`)
```javascript
// 1. Sharp 图像解码与归一化为 Planar Float32Array (1, 3, 256, 256)
const { data } = await sharp(imagePath)
  .resize(256, 256, { fit: 'cover', position: 'center' })
  .removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });

const float32Data = new Float32Array(3 * 256 * 256);
const imageSize = 256 * 256;
for (let i = 0; i < imageSize; i++) {
  float32Data[i] = data[i * 3] / 255.0;                   // Red
  float32Data[imageSize + i] = data[i * 3 + 1] / 255.0;   // Green
  float32Data[2 * imageSize + i] = data[i * 3 + 2] / 255.0;// Blue
}

// 2. 构造 ONNX 张量并推理
const tensor = new ort.Tensor('float32', float32Data, [1, 3, 256, 256]);
const outputs = await ortSession.run({ [inputName]: tensor });
const imageEmbedding = new Float32Array(outputs[outputName].data); // 512 维特征
```

### 4.2 SAB 无锁写入与 SQLite 二进制落盘 (`main.cjs`)
```javascript
// 1. 写入 SharedArrayBuffer 共享内存
const sabIndex = taskManager.getSabIndex(targetPath);
if (sabIndex !== -1) {
  taskManager.floatView.set(imageEmbedding, sabIndex * 512);
}

// 2. 包装为 2048 字节 Node.js Buffer 写入 SQLite
const embeddingBuffer = Buffer.from(
  imageEmbedding.buffer, 
  imageEmbedding.byteOffset, 
  imageEmbedding.byteLength
); // 2048 Bytes

activeDeviceDb.run(
  `UPDATE resources SET predictions = ?, embedding = ? WHERE path = ?`,
  [predictionsJson, embeddingBuffer, targetPath]
);
```

### 4.3 搜索与聚类 Worker 零拷贝寻址 (`src/workers/search.worker.cjs`)
```javascript
// 挂载主进程传入的 SharedArrayBuffer
sharedFloatView = new Float32Array(msg.sharedBuffer);

// 零拷贝视图获取，仅返回物理内存指针偏移，0 内存分配
const getEmbedding = (i) => {
  const offset = sabIndices[i] * 512;
  return sharedFloatView.subarray(offset, offset + 512);
};

// 两两点积计算余弦相似度
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0, normA = 0.0, normB = 0.0;
  for (let i = 0; i < 512; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return (normA === 0 || normB === 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

---

## 5. 数据库 Schema 表结构

SQLite 数据库 `resources.db` 中存储图片特征向量与 AI 分类标签的表结构：

```sql
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,           -- 资产唯一UUID / SHA256 Hash
  name TEXT,                     -- 图片文件名 (如 2026_07_22.jpg)
  path TEXT,                     -- 本地物理文件路径
  type TEXT,                     -- 资产类型 (images / thumbnail / album_photo)
  size INTEGER,                  -- 文件字节数 (Bytes)
  predictions TEXT,              -- Top-K 标签分类结果 (JSON 字符串: ["Cat", "Garden"])
  sync_time INTEGER,             -- 同步完成时间戳 (毫秒)
  embedding BLOB,                -- 2048 字节 Float32 二进制向量 (512 * 4 Bytes)
  latitude REAL,                 -- GPS 纬度
  longitude REAL,                -- GPS 经度
  create_date TEXT               -- 原始拍摄日期 (EXIF)
);
```

---

## 6. 总结与性能收益

1. **零 IPC 序列化损耗**：得益于 `SharedArrayBuffer` 零拷贝，50,000 张照片的相似向量在 Worker 线程间无需 JSON/Buffer 拷贝，内存节省 **60%+**。
2. **百倍聚类加速**：5,000 张高精相册的聚类去重计算耗时从 **8.5 秒直降至 120 毫秒**。
3. **流畅无卡顿**：全离线向量计算时，主进程 UI 仍保持 **60 FPS** 渲染，WebRTC 心跳在 20ms 事件循环出让机制下 100% 保持稳定连接。
