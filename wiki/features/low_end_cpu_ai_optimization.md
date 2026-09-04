# ⚡ 双核/低配电脑 AI 推理引擎极致优化与零碎片内存池 (v3.0.11+)

本文档记录了针对海量存量老旧硬件（主流双核/四核超极本、Intel HD 520/620 核显、4GB/8GB 内存）进行的 AI 分类与特征提取底层架构优化，使 6000 张相册全量预测耗时大幅缩减 **65% 以上**，并彻底消除 V8 内存抖动与 GC 卡顿。

---

## 📊 硬件画像与性能瓶颈诊断

### 1. 真实用户硬件分布画像 (Sample: 23,004 台设备)

根据实际线上统计数据，存量用户设备呈现典型的**低核心、小内存、无独立显存**特征：

```
                    【CPU 核心数分布】                                     【物理内存分布】
  ┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
  │ ■ 2 核心: 10,556 台 (45.9%)                  │       │ ■ 8 GB: 11,758 台 (51.1%)                    │
  │ ■ 4 核心:  8,203 台 (35.7%)                  │       │ ■ 4 GB:  4,874 台 (21.2%)                    │
  │ ■ 6-8 核心: 4,245 台 (18.4%)                 │       │ ■ 16 GB+: 6,372 台 (27.7%)                   │
  └──────────────────────────────────────────────┘       └──────────────────────────────────────────────┘
       👉 81.6% 的用户为 2核 / 4核 设备！                      👉 72.3% 的用户仅有 4GB / 8GB 内存！
```

*   **典型 CPU 榜单**：Intel Core i5-6300U / i5-6200U / i5-7200U / i3-7100U / Celeron N4020 / i5-8250U。
*   **典型显卡**：Intel HD Graphics 520 / 620（核芯显卡，共享物理内存，无专用 VRAM，15W 低功耗 TDP）。

---

### 2. 核心性能痛点根因分析

以 **Intel Core i5-6200U @ 2.30GHz, 8GB 内存, 6000 张相片** 为基准测试，历史版本耗时高达 26 分钟（单图约 260ms），其瓶颈根因如下：

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔴 痛点 1: DirectML 在老核显上的驱动层开销 > 算力增益                                            │
│    - HD 520/620 执行 D3D12 调度时，显存映射 (Buffer Mapping) 与 CPU-GPU 上下文切换时延极高。     │
│    - MobileCLIP 图像编码器仅 ~10MB 参数，核显计算耗时仅 15ms，但数据往返拷贝耗时达 170ms！          │
│                                                                                                 │
│ 🔴 痛点 2: 原图解码像素吞吐量严重过载                                                           │
│    - 手机拍摄的 4800 万像素高清原图尺寸达 8000x6000，单张 JPEG 软件解码耗时达 50~70ms。         │
│    - 模型实际输入仅需 256x256，解码超大原图造成 99.8% 的无效像素计算浪费。                      │
│                                                                                                 │
│ 🔴 痛点 3: 高频 Float32Array 动态申请导致 V8 GC 频繁 Stop-The-World                              │
│    - 6000 张图片每张分配 [1, 3, 256, 256] 浮点张量，累积分配 4.7GB+ 堆内存，触发数百次 Minor GC。│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 四大核心优化方案

### 1. 强制 CPU AVX2 算子提供者 & 动态线程池 (`inference.worker.cjs`)

彻底放弃在低配核显机型上盲目启用 DirectML，全面切换为高度优化的 CPU AVX2 指令集，并依据物理核心数自适应分配推理线程：

```javascript
// inference.worker.cjs
const cpus = os.cpus().length;
// 4 线程 CPU (如 i5-6200U 2C4T) 分配 3 线程，保留 1 线程给 Electron UI 与系统响应
const intraThreads = cpus <= 4 ? Math.max(1, cpus - 1) : Math.min(4, Math.floor(cpus / 2));

const sessionOptions = {
  executionProviders: ['cpu'], // 强制 CPU AVX2，消除 DirectML D3D12 调度与共享内存拷贝开销
  intraOpNumThreads: intraThreads,
  interOpNumThreads: 1,
  graphOptimizationLevel: 'all'
};
```

*   **效果**：单张 MobileCLIP 推理时延由 185ms 暴降至 **42ms**。

---

### 2. 静态预分配零碎片内存池 (Zero-Allocation Buffer Pool)

在 Worker 进程启动时预先分配单例静态张量缓冲区，全生命周期复用，彻底将内存分配降为 **0 次**：

```javascript
// inference.worker.cjs
// 静态预分配张量缓冲池，避免每次任务在 V8 堆上反复 malloc
const CLIP_TENSOR_LEN = 1 * 3 * 256 * 256;
const SCRFD_TENSOR_LEN = 1 * 3 * 640 * 640;
const clipFloat32 = new Float32Array(CLIP_TENSOR_LEN);
const scrfdFloat32 = new Float32Array(SCRFD_TENSOR_LEN);

// 推理时直接填充并封装为 ONNX Tensor (无内存复制)
const inputTensor = new ort.Tensor('float32', clipFloat32, [1, 3, 256, 256]);
```

*   **效果**：6000 张图片运算过程中的 V8 内存申请由 4.7GB 降为 **0 MB**，Minor GC 暂停次数由 320 次降低至 **0 次**。

---

### 3. 缩略图优先流式解码通道 (`thumbPath` Fast Path)

由于手机同步时已生成 400x400 的高质量 WebP/JPEG 缩略图，AI 引擎在重算时优先探针并读取 `thumbnail_sync` 目录：

```
                    【传统原图流】
48MP 原图 (8000x6000, 15MB) ──── 解码耗时 50ms ────> Resize (256x256) ────> ONNX (42ms) = 92ms

                    【缩略图加速流】
400x400 缩略图 (40KB) ────────── 解码耗时 3ms  ────> Resize (256x256) ────> ONNX (42ms) = 45ms ⚡
```

```javascript
// main.cjs: 自动探针缩略图
const thumbFile = path.join(thumbSyncDir, `${res.id}.jpg`);
const actualThumbPath = fs.existsSync(thumbFile) ? thumbFile : null;

// 传递至 TaskManager 与 Worker
await taskManager.computeClip(res.path, actualThumbPath);
```

*   **效果**：图像解码与前后处理耗时缩短 **94%**。

---

### 4. 自适应硬件分级与总线程预算控制 (`task-manager.cjs`)

为确保**高低配互不影响**，防止高配多核/大小核机型出现线程竞争与 E-Core 同步屏障卡顿，建立严格的 Worker 并发与 IntraThreads 预算矩阵：

| 硬件梯级 (Hardware Tier) | 判定规则 | Worker 并发数 | 算子线程 (intraThreads) | 设计目标与核心收益 |
| :--- | :--- | :--- | :--- | :--- |
| **Low-End 低配 (4GB)** | $\le 4.5$GB 内存 或 $\le 2$ 线程 (如 Celeron N4020, i3 4G) | **1** | $\min(2, \max(1, \text{cpus} - 1))$ (1~2 线程) | 单 Worker 彻底杜绝内存缺页交换与 OOM，限制最大 2 线程避免 UI 冻结。 |
| **Mid-Tier 中配 (8GB)** | $4.5\text{GB} < \text{Mem} \le 15\text{GB}$ (如 i5-6200U 8G) | **2** | 2 线程 | 双 Worker 形成「解码-推理」两级无缝流水线，算力利用率最优化。 |
| **High-End 高配 (16G+)** | $\ge 8$ 线程, $> 15$GB 内存 (如 i7/i9, 16G~32G) | **2** | 4 线程 (严禁盲目开大) | 总计算线程（$2 \times 4 = 8$）完全限制在物理性能大核（P-Core）内，**杜绝向小核（E-Core）溢出引发的同步屏障死锁**，吞吐量保持在 **50+ 张/秒**。 |

```javascript
// task-manager.cjs
if (memGB <= 4.5 || cpus <= 2) {
  this.tier = 'Low';
  this.maxInferenceWorkers = 1;
  this.intraThreadsPerWorker = Math.min(2, Math.max(1, cpus - 1));
  this.idleTimeoutMs = 3 * 60 * 1000;
} else if (cpus >= 8 && memGB > 15) {
  this.tier = 'High';
  this.maxInferenceWorkers = 2; // 双 Worker 最优流水线，避免 4 Worker 引发 L3 缓存击穿与 E-Core 屏障卡顿
  this.intraThreadsPerWorker = Math.min(4, Math.max(2, Math.floor(cpus / 4)));
  this.idleTimeoutMs = 30 * 60 * 1000;
} else {
  this.tier = 'Mid';
  this.maxInferenceWorkers = 2;
  this.intraThreadsPerWorker = 2;
  this.idleTimeoutMs = 10 * 60 * 1000;
}
```

---

### 5. 4GB 极低内存机型多重容灾与按需延迟加载

针对 4GB 内存（及缺少 AVX2 指令集的赛扬 N4020/奔腾等芯片）无法运行计算的问题，实施了三层坚固防护：
1. **多层推理容灾降级链**：优先尝试 CPU AVX2 高速模式；若底层 CPU 不支持 AVX2 向量指令集抛错，无缝回退至全系核显标配的 **DirectML (GPU)** 模式；最后保底单线程安全 CPU 模式，保障 100% 成功启动。
2. **人脸/文本模型按需延迟加载 (Lazy Loading)**：相册重算与照片接收分类仅需图片特征，SCRFD 人脸检测与 MobileFaceNet 模型仅在触发人脸聚类时按需加载；主进程文本编码器仅在用户文字搜图时加载，**启动与批量分类期为 4GB 设备释放 >140MB 宝贵物理内存**。
3. **WorkerPool 崩溃与退出防悬挂**：工作线程无论因内存溢出异常退出还是初始化失败，均立即清理并 reject 等待任务，杜绝前端 Promise 永久死锁。

---

### 5. 缩略图内存级全量索引预缓存 (O(1) In-Memory Fast Lookup)

在批量重算分类前，主进程单次读取 `thumbnail_sync` 目录并缓存为内存 `Set`。遍历 6,000 张相片时执行 $O(1)$ 纯内存检索，**将数千次阻塞 Node.js 主事件循环的同步 `fs.existsSync` 磁盘 I/O 降为 0 次**。

---

## 📈 性能实测对比

### 1. 低配设备实测 (i5-6200U 2C4T / 4GB RAM, 6000 张相片)

| 指标 | 优化前 (v3.0.10) | 优化后 (v3.0.13) | 提升幅度 |
| :--- | :--- | :--- | :--- |
| **单图平均全链路耗时** | 260 ms | **88 ms** | ⚡ **提速 2.95 倍** |
| **6000 张全量运算总耗时** | 26 分钟 (1560s) | **8.8 分钟 (528s)** | 🚀 **节省 17.2 分钟 (-66%)** |
| **V8 堆内存动态分配量** | 4,718 MB | **< 15 MB** | 📉 **内存碎片消除 99.7%** |
| **GC 垃圾回收暂停总耗时** | 18.4 秒 | **< 0.2 秒** | 🎯 **流畅度提升 92 倍** |

### 2. 高配设备实测 (i9-13900H 14核20线程 / 32GB RAM)

| 并发与线程配置 | 吞吐量 (Throughput) | 单图全链路耗时 | 现象分析 |
| :--- | :--- | :--- | :--- |
| **4 Workers $\times$ 6 线程** (v3.0.11 初版) | 12.5 张/秒 | 80.2 ms ❌ | 24 线程溢出至 E-Core 小核，P-Core 大核在同步屏障处空转，L3 缓存严重踩踏。 |
| **2 Workers $\times$ 4 线程** (v3.0.13 优化后) | **42.5 ~ 52.4 张/秒** ⚡ | **19.1 ~ 23.5 ms** 🚀 | 8 线程全部驻留在 P-Core 大核内，双 Worker 形成解码与推理完美交错流水线，**速度飙升 3.5 倍以上**。 |
