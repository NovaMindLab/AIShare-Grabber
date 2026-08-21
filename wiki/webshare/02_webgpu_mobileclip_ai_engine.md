# 02. WebGPU 端侧 AI 引擎与模型适配

WebShare 将先进的多模态视觉-语言大模型（CLIP）直接搬到了浏览器内，利用 **WebGPU 现代显卡 API** 提供近乎原生 C++ 速度的高性能图像特征提取与零样本分类推理。

---

## 1. 架构概览与 Web Worker 多线程隔离

为了避免耗时的深度学习计算与图像像素预处理阻塞主 UI 线程造成网页卡顿，所有 AI 操作全部运行在独立的 **Web Worker (`ai.worker.js`)** 中：

```mermaid
graph LR
    subgraph UI Main Thread
        A[接收照片 ArrayBuffer] -->|Transferable| B(PostMessage to Worker)
        G[接收 512-D 向量与 Top-3 结果] --> H[更新 UI & 写入 IndexedDB]
    end

    subgraph Web Worker (ai.worker.js)
        B --> C[OffscreenCanvas 预处理 256x256 Planar RGB]
        C --> D[WebGPU ONNX Runtime Session]
        D --> E[提取 512 维图像特征向量]
        E --> F[15 类文本向量 Cosine 对比 + Softmax]
        F --> G
    end
```

---

## 2. 图像预处理流水线（Preprocess Pipeline）

MobileCLIP2 模型要求标准输入尺寸为 `[1, 3, 256, 256]`，通道顺序为 Planar RGB（`RRR...GGG...BBB...`），取值范围归一化至 `[0.0, 1.0]`：

```javascript
async function preprocessImage(blobOrBuffer) {
  const blob = blobOrBuffer instanceof Blob ? blobOrBuffer : new Blob([blobOrBuffer]);
  const bitmap = await createImageBitmap(blob);

  // 利用 OffscreenCanvas 实现硬件加速居中裁剪与缩放
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  const scale = Math.max(256 / bitmap.width, 256 / bitmap.height);
  const scaledWidth = bitmap.width * scale;
  const scaledHeight = bitmap.height * scale;
  const offsetX = (256 - scaledWidth) / 2;
  const offsetY = (256 - scaledHeight) / 2;

  ctx.drawImage(bitmap, offsetX, offsetY, scaledWidth, scaledHeight);
  bitmap.close();

  const imgData = ctx.getImageData(0, 0, 256, 256).data;
  const float32Data = new Float32Array(3 * 256 * 256);
  const imageSize = 256 * 256;

  // 转换为 Planar RGB [0, 1] 浮点张量
  for (let i = 0; i < imageSize; i++) {
    float32Data[i] = imgData[i * 4] / 255.0;                 // R
    float32Data[imageSize + i] = imgData[i * 4 + 1] / 255.0; // G
    float32Data[2 * imageSize + i] = imgData[i * 4 + 2] / 255.0; // B
  }

  return float32Data;
}
```

---

## 3. MobileCLIP2-S0 模型自包含打包

### 3.1 潜在空间对齐（Latent Space Alignment）
- **版本对齐原则**：文本嵌入文件 `text_embeddings.json` 是通过 Apple **MobileCLIP2-S0** 预训练模型生成的；
- **单文件合并**：原本 ONNX 导出的外部权重文件（`.onnx` 与 `.data`）被合并为独立的单一 **47.4 MB** `mobileclip2_s0_image_encoder.onnx` 模型，去除了对多文件的依赖，天然契合 HTTP / CDN / CacheStorage 单一请求加载。

### 3.2 15 场景零样本分类与 Softmax 温度缩放（Temperature = 60.0）
提取出图像 512 维向量 $\mathbf{v}_{img}$ 后，与预设的 15 个类别文本向量 $\mathbf{v}_{text}^{(k)}$ 进行余弦相似度计算：

$$\text{Sim}(\mathbf{v}_{img}, \mathbf{v}_{text}^{(k)}) = \frac{\mathbf{v}_{img} \cdot \mathbf{v}_{text}^{(k)}}{\|\mathbf{v}_{img}\|_2 \|\mathbf{v}_{text}^{(k)}\|_2}$$

通过温度参数 $T = 60.0$ 计算 Softmax 概率分布：

$$P(k) = \frac{\exp(T \cdot \text{Sim}_k)}{\sum_{j=1}^{15} \exp(T \cdot \text{Sim}_j)}$$

```javascript
function classifyEmbedding(imageEmbedding) {
  const similarities = [];
  for (const [category, textEmb] of Object.entries(textEmbeddings)) {
    if (textEmb && textEmb.length > 0) {
      const score = cosineSimilarity(imageEmbedding, textEmb);
      similarities.push({ category, score });
    }
  }

  const temperature = 60.0;
  const expScores = similarities.map(s => ({
    category: s.category,
    exp: Math.exp(s.score * temperature)
  }));
  const sumExp = expScores.reduce((acc, cur) => acc + cur.exp, 0);

  const results = expScores.map(s => ({
    category: s.category,
    score: sumExp > 0 ? (s.exp / sumExp) : 0
  }));

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}
```

---

## 4. 浏览器端二级缓存机制（CacheStorage）

为了防止用户每次刷新页面重复下载 47 MB 模型，WebShare 构建了基于标准 **CacheStorage API** 的离线模型缓存层：
- 缓存命名空间：`webshare-ai-models-v2`；
- **首次访问**：通过 `fetch()` 下载模型并在内存中克隆副本写入 CacheStorage；
- **后续访问**：直接从 CacheStorage 命中二进制 ArrayBuffer，**0 网络请求，秒级初始化**。
