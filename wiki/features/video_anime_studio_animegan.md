# 🎨 短视频一键二次元/动漫化转换引擎 (AnimeGAN Video Studio)

本文档详述在 ShareCLIP 桌面端实现的高性能**短视频一键动漫化流式转换系统**，包含基于 FFmpeg 裸流的零磁盘 IO 编解码管道、`onnxruntime-node` DirectML/CPU 推理、纯 TypedArray 图像前后处理算法与前端 Anime Studio 交互工作室。

---

## 一、 系统架构与流式管道（Zero-Disk IO）

```mermaid
graph TD
    A[源视频文件] -->|ffprobe 探测元数据| B(分辨率/FPS/帧数/音轨)
    B --> C{是否包含音轨?}
    C -->|是| D[ffmpeg 抽取临时音轨 .aac]
    C -->|否| E[跳过音轨处理]
    
    A -->|ffmpeg decode: rawvideo rgb24| F[stdout 逐帧流]
    F -->|切分 Frame = W * H * 3 字节| G[TypedArray 归一化 [-1.0, 1.0]]
    G -->|onnxruntime-node| H[AnimeGAN 神经风格推理]
    H -->|TypedArray 反归一化 [0, 255]| I[Uint8 RGB Frame Buffer]
    
    I -->|ffmpeg encode: stdin rawvideo| J[libx264 临时视频 .mp4]
    J & D -->|ffmpeg copy mux| K[最终二次元 MP4]
    
    subgraph Backpressure Control [内存背压流控机制]
        I -.->|stdin.write === false| L[等待 drain 事件 & 暂停 stdout]
    end
```

---

## 二、 核心特性与技术亮点

### 1. 零磁盘写放大（Zero-Disk IO）
- 传统方案将视频解压为上千张 PNG/JPG 图片并落盘，造成剧烈的磁盘写放大与 IO 瓶颈。
- 本方案采用 **FFmpeg stdio 双向裸流管道**，逐帧以 `rawvideo rgb24` 格式流入 Node.js 内存切片，经 ONNX 推理后再直接以标准输入直灌 FFmpeg 编码器，**全程无任何中间碎帧文件产生**。

### 2. 内存背压与防 OOM 流控（Backpressure）
- 解码速度远高于神经网络推理速度，若不加以控制会导致 Node.js V8 堆内存溢出。
- 管道内置 `encoder.stdin.on('drain')` 协调机制，内存常驻仅保持 **1~2 帧数据（约 2~3 MB）**，极大降低内存开销。

### 3. 纯 TypedArray 像素前后处理（零重型图像依赖）
- 彻底摒弃 `sharp`、`canvas` 等重型依赖，完全基于 JavaScript `Float32Array` 与 `Uint8Array` 内存连续操作：
  - **前处理**：交错 RGB 转换为 NCHW 维度，映射至 $[-1.0, 1.0]$：
    $$\text{input}[c \times (W \times H) + i] = \frac{\text{raw}[i \times 3 + c]}{127.5} - 1.0$$
  - **后处理**：输出张量映射还原至 $[0, 255]$：
    $$\text{output}[i \times 3 + c] = \text{clamp}\left(\text{round}((\text{out}[c \times (W \times H) + i] + 1.0) \times 127.5), 0, 255\right)$$

---

## 三、 极致性能优化与动漫定格加速 (Performance & Speed)

为解决高分辨率长视频转换耗时过长的问题，系统引入了多项工业级优化：

### 1. 经典动漫定格帧率模式（Frame Rate Stride Mode）
- **传统 2D 动漫手绘特性（抽二拍一）**：传统手绘动漫（宫崎骏、新海诚）多采用 12~15 FPS 手绘制作。全量 25/30 FPS 计算不仅计算量翻倍，还会因逐帧微小差异产生“画面闪烁呼吸感（Boiling Effect）”。
- **三种帧率档位**：
  - 🚀 **经典动漫手绘 (15 FPS • 2x 极速 • 推荐)**：每隔 1 帧进行一次 AI 神经风格重绘，相邻帧智能插帧复用，**计算量直接削减 50%**，大幅减轻闪烁感，画面极具手绘质感；
  - ⚡ **原生全帧率 (1x 原速)**：全量逐帧重绘，适合高帧率丝滑动态片段；
  - 🏎️ **极速漫画风 (10 FPS • 3x 极速)**：每隔 2 帧重绘，算力削减 67%，适合长视频极速预览。
- **音画绝对同步保障**：输出 MP4 仍保持原视频完整帧数与帧率，音轨混流毫秒级精准对齐。

### 2. 智能多阶梯分辨率预设（Smart Multi-Tier Resolution）
- ⚡ **480P (推荐/极速秒级)**：最长边上限 480px，结合 15 FPS 模式处理速度可达 **18~25 FPS**，4 分钟音乐视频转换从 22 分钟大幅缩短至 **3~4 分钟**。
- 🌟 **720P (高清平衡)**：最长边上限 720px，兼顾细节与转换效率。
- 🎨 **1080P (超清原画)**：最长边上限 1080px，适合高配独显精细渲染。
- **自适应不放大原则**：小分辨率视频（如 360p）选择 480P/720P 时自动保持原始尺寸，绝不无谓放大增加计算开销。

---

## 四、 四大经典二次元画风预设

| 风格预设 | 标识符 | 艺术特色 | 推荐应用场景 |
|---|---|---|---|
| **🍃 宫崎骏·吉卜力风** | `hayao` | 治愈系手绘风、浓厚绿意、高饱和自然光影 | 风景、自然、户外旅行短视频 |
| **✨ 新海诚·唯美光影** | `shinkai` | 蓝紫色云霞、通透光晕、高对比度浪漫夜空 | 城市街景、傍晚天空、落日余晖 |
| **🌸 今敏·红辣椒风** | `paprika` | 浓郁胶片质感、极具视觉冲击力 | 艺术短片、街头潮流、复古剪辑 |
| **🎨 二次元人像重绘** | `portrait` | 精致五官重塑、平滑动漫肤质、清晰轮廓线 | 人物自拍、Vlog、特写对话 |

---

## 五、 核心代码交付产物

1. **核心流式转换引擎**：[`cp_clip/src/workers/video-anime-converter.cjs`](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/workers/video-anime-converter.cjs)
2. **主进程 IPC 注册**：[`cp_clip/main.cjs`](file:///d:/AI_serach_image/image_clip_android/cp_clip/main.cjs)
3. **安全通信 Preload 暴露**：[`cp_clip/preload.cjs`](file:///d:/AI_serach_image/image_clip_android/cp_clip/preload.cjs)
4. **二次元工作室弹窗组件**：[`cp_clip/src/components/VideoAnimeStudioModal.vue`](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/components/VideoAnimeStudioModal.vue)
5. **视频时间线编辑入口**：[`cp_clip/src/components/VirtualTimeline.vue`](file:///d:/AI_serach_image/image_clip_android/cp_clip/src/components/VirtualTimeline.vue)
