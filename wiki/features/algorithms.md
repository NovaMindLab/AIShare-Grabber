# ShareCLIP 核心 AI 算法文档 (Core AI Algorithms)

本 Wiki 详细记录了 ShareCLIP 项目在 PC 桌面端实现的多模态 AI 图像算法架构，包含特征提取、数据预处理、零样本图像分类、相似图片聚类算法以及内存生命周期管理的优化细节。

---

## 🧭 算法架构概览

ShareCLIP 的核心 AI 能力完全运行在 PC 客户端本地（100% 离线），基于微软的 ONNX Runtime (Node.js 绑定) 引擎。主要包含两大独立运行但在底层共享特征向量的算法模块：

1. **零样本分类算法 (Zero-Shot Classification)**：自动分析手机同步过来的图片属于什么类别（如：人像、花卉、美食、风景等），并将分类概率存入 SQLite 数据库。
2. **相似图片聚类 (Image Similarity Clustering)**：分析并自动归类图片库中高度相似或完全重复的图片，辅助用户进行物理清理。

```mermaid
graph TD
    A[输入图像] --> B[图像预处理 256x256 Cover / Planar / ToTensor]
    B --> C[ONNX MobileCLIP S0 Image Encoder]
    C --> D[获取 512 维特征向量 Image Embedding]
    D --> E[克隆 Float32Array 内存块]
    E --> F[写入 imageEmbeddingsCache 缓存]
    
    F --> G[分类按钮 / Sync 逻辑]
    F --> H[相似图片分析按钮]
    
    G --> G1[计算与预设文本向量的余弦相似度]
    G1 --> G2[应用 Logits 温度 60.0 & Softmax 归一化]
    G2 --> G3[保存前 3 预测结果至 SQLite 数据库]
    
    H --> H1[Leader 质心聚类算法]
    H1 --> H2[过滤 singleton, 输出相似度 >= 阈值的组合]
```

---

## 1. 图像特征提取与预处理 (Image Embedding & Preprocessing)

### 1.1 图像预处理规范
MobileCLIP S0 模型的图像输入要求为 `256 × 256` 像素、RGB 3通道的 Planar 格式。
> [!IMPORTANT]
> **预处理标准化差异**：MobileCLIP 与传统的 ImageNet 模型不同，**不需要**进行 ImageNet 的均值（Mean）和标准差（Std）标准化。仅需将像素缩放到 `[0.0, 1.0]` 范围内。

* **尺寸缩放**：采用 `sharp` 库的 `.resize(256, 256, { fit: 'cover', position: 'center' })` 进行裁剪 and 居中对齐。
* **Planar 重排**：将交错的 RGBRGB... 字节流重新排布为 Planar (R 通道区、G 通道区、B 通道区) 的 `Float32Array`：
  ```javascript
  const float32Data = new Float32Array(3 * 256 * 256);
  const imageSize = 256 * 256;
  for (let i = 0; i < imageSize; i++) {
    float32Data[i] = data[i * 3] / 255.0;                      // R channel
    float32Data[imageSize + i] = data[i * 3 + 1] / 255.0;      // G channel
    float32Data[2 * imageSize + i] = data[i * 3 + 2] / 255.0;  // B channel
  }
  ```

### 1.2 ⚠️ 关键 Bug 修复：ONNX 内存分配器重用问题
在 ONNX Runtime 中，运行会话 `ortSession.run()` 返回的 TypedArray (`outputs[outputName].data`) 指向的是引擎内部的 native 内存缓冲区。
* **问题表现**：如果在推理循环中直接缓存该引用，下一次 `ortSession.run` 执行时，引擎会**直接修改并重用同一块内存地址**，导致之前缓存的所有向量值均被覆盖为最后一张图的特征值，计算出来的相似度全部退化为 `100.0%`。
* **修复方法**：在存入缓存前，必须将数据深度克隆到 V8 独立的堆内存中：
  ```javascript
  const imageEmbedding = new Float32Array(outputs[outputName].data); // 内存块深度克隆
  imageEmbeddingsCache[imagePath] = imageEmbedding;
  ```

---

## 2. 零样本图像分类 (Zero-Shot Classification)

零样本分类利用了多模态对比学习的特性。我们预先提取了候选类别的文本特征向量（Text Embeddings），并将图像特征与这些文本特征做点积。

### 2.1 余弦相似度 (Cosine Similarity)
由于特征提取向量已经过 L2 归一化，余弦相似度计算简化为向量的内积（Dot Product）：
$$\text{Similarity}(A, B) = \sum_{i=1}^{512} A_i B_i$$

### 2.2 置信度 Softmax 归一化
为了防止分类的置信度过于扁平，我们引入了 **Logits 温度参数 ($T = 60.0$)**，放大差异后再应用 Softmax：
$$P(\text{Category}_k) = \frac{e^{\text{Similarity}_k \cdot T}}{\sum_j e^{\text{Similarity}_j \cdot T}}$$
系统保存概率值最高的前 3 个类别，并持久化写入 SQLite 数据库的 `predictions` 字段中。

---

## 3. 相似图片聚类算法 (Image Similarity Clustering)

相似图计算与分类计算物理分离，但共享底层的 `imageEmbeddingsCache` 缓存。在用户点击“相似图分析”按钮时触发。

### 3.1 链式效应与 Leader 聚类
> [!WARNING]
> **链式效应 (Chaining Effect)**：若使用连通图（Single-Linkage）进行聚类，A 与 B 相似，B 与 C 相似... Y 与 Z 相似，会把完全不相似 A 和 Z 聚类到同一个“巨无霸”分组中（产生包含上百张图的混杂组）。

为了规避链式效应，ShareCLIP 采用 **Leader (Centroid) 聚类算法**：
1. **核心代表图 (Leader)**：每个分组的第一个元素作为该组的质心/Leader。
2. **入组检查**：新图片在遍历已有分组时，计算其与该组 **Leader 图像的直接相似度**。如果最大相似度 $\ge \text{threshold}$，则将其编入该组；否则，该图片作为 Leader 自立门户创建新组。
3. **阈值控制**：用户可以通过滑块动态调整相似度阈值（建议 $85\% - 95\%$）。

### 3.2 算法实现
```javascript
const clusterGroups = []; // [ [leader_idx, idx1, idx2...], [leader_idx2, ...] ]

for (let i = 0; i < n; i++) {
  const embI = embeddings[i];
  let bestGroupIdx = -1;
  let bestSim = -1;

  // 寻找与其最匹配的已有 Leader
  for (let g = 0; g < clusterGroups.length; g++) {
    const leaderIdx = clusterGroups[g][0];
    const sim = cosineSimilarity(embI, embeddings[leaderIdx]);
    if (sim > bestSim) {
      bestSim = sim;
      bestGroupIdx = g;
    }
  }

  // 必须直接与 Leader 相似才可入组，否则自立为 Leader
  if (bestSim >= threshold) {
    clusterGroups[bestGroupIdx].push(i);
  } else {
    clusterGroups.push([i]);
  }
}
```

---

## 4. 物理删除与数据一致性

当用户在相似图分组中选定多余的重复图片，并点击“删除选中的重复图”时：
1. **磁盘文件同步删除**：使用 `fs.unlinkSync(filePath)` 从磁盘物理擦除文件。
2. **数据库记录剔除**：在 SQLite 数据库中执行 `DELETE FROM resources WHERE id = ? OR path = ?`，确保数据库索引与磁盘文件状态保持绝对的一致性。
3. **主界面状态反应式更新**：渲染进程收到返回结果后重置 `images.value` 并自动触发当前 tab 内图片的重新聚类比对，实现无缝连贯的交互体验。
