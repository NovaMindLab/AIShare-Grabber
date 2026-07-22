# Worker 多线程架构设计与解耦记录

为了应对日益增长的图片库规模，彻底解决密集计算导致的 Electron 主线程假死问题，本项目采用 Node.js `worker_threads` 进行了深度重构。

本文档记录了系统的多线程架构状态及通信规范。

## 1. 架构演进路线图

系统采用敏捷的“渐进式重构”策略：
- [x] **阶段一：先解耦 (Decouple)** - 剥离 ONNX 推理和聚类算法到独立 Worker。
- [x] **阶段二：定边界 (Structure)** - 引入标准化的 `TaskManager` 进行全局优先级调度与休眠管理。
- [x] **阶段三：再共享 (Optimize)** - 将底层 Worker 数据交换方式重构为 `SharedArrayBuffer`，实现零拷贝。
- [x] **阶段四：终极进化 (Evolve)** - 引入后台静默聚类计算与 SQLite `cluster_id` 落盘，彻底消除前台 $O(N^2)$ 计算，降维至 $O(1)$ 毫秒级查询。

## 2. 线程职责划分

目前系统已将原本耦合在 `main.cjs` 中的核心业务拆分为以下独立执行单元：

### 2.1 主进程 (Main Process / `main.cjs`)
- **职责**：
  - 扮演“交响乐团指挥”，仅负责全局状态管理。
  - 负责 BLE 蓝牙信令、WebRTC 局域网传输以及基础的 SQLite 读写操作。
  - 孵化 Worker Pool，充当 Web 前端与 Worker 之间的 IPC 路由网关。
- **限制**：严禁在 `main.cjs` 内执行任何耗时超过 50ms 的同步计算或阻塞循环。

### 2.2 推理线程 (Inference Worker / `src/workers/inference.worker.cjs`)
- **职责**：专职负责 AI 特征提取。
- **加载项**：独立加载 `onnxruntime-node` 模型及 `sharp` 图像处理库。
- **工作流**：接收图片路径 $\rightarrow$ Sharp 缩放/转张量 $\rightarrow$ ONNX MobileCLIP 推理 $\rightarrow$ 返回 `Float32Array` 特征。

### 2.3 检索计算线程 (Search Worker / `src/workers/search.worker.cjs`)
- **职责**：专职执行高复杂度的数学矩阵计算。
- **工作流**：目前负责相似图片功能的余弦相似度计算与 Leader 聚类分组。在阶段三之后，它会挂载 `SharedArrayBuffer`，根据收到的短整型 `sabIndices` 去直接寻址物理内存，实现零拷贝。

## 3. Worker 通信协议 (Message Protocol)

主进程与 Worker 之间采用基于 `parentPort.postMessage` 的异步消息机制。

### Inference Worker 协议
- **Init**
  - **Req**: `{ type: 'init', physicalModelPath?: string, sharedBuffer?: SharedArrayBuffer }`
  - **Res**: `{ type: 'init_result', success: boolean, error?: string, mock?: boolean }`
- **Compute**
  - **Req**: `{ type: 'compute', reqId: number, imagePath: string }`
  - **Res**: `{ type: 'compute_result', reqId: number, success: boolean, embedding?: Float32Array, error?: string }`

### Search Worker 协议
- **Cluster**
  - **Req**: 
    ```javascript
    { 
      type: 'cluster', 
      payload: { reqId: number, sabIndices: number[], validImages: object[], threshold: number } 
    }
    ```
  - **Res**: `{ type: 'cluster_result', reqId: number, success: boolean, groups?: array, error?: string }`

## 4. 后续性能优化方向 (TODO)

系统已经完成了全部四个阶段的优化！目前在性能上：
1. **进程隔离**：不再阻塞主渲染进程。
2. **零拷贝内存**：通过自适应大小（40MB/100MB/200MB）的 `SharedArrayBuffer` 消除了 IPC 大数据传输开销。
3. **算法降维**：通过手机同步后的 10 秒闲置自动触发 `runBackgroundClustering()`，完成后台静默聚类并将结果 UUID 写回 SQLite 的 `cluster_id`。用户的前台相似图请求被简化为了一条极速 SQL 语句。

若有极高频“全局文本搜图”需求，未来的方向是引入基于 Node.js Addon 的 C++ 本地向量图引擎 (如 USearch 或 hnswlib)。

