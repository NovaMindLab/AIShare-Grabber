# 图像预处理修正：移除均值/标准差标准化

相册分类应用在部署真实 ONNX 模型后，曾面临分类极其混乱、答非所问的情况。经深入排查，发现导致该现象的根本原因在于对输入张量（Tensor）执行了错误的 ImageNet 均值和标准差归一化（Standardization）。

---

## 🔍 问题分析

### 1. 传统的 ImageNet 归一化
大多数传统的 Vision Transformers (ViT) 以及大部分 CLIP 模型（如 OpenAI 的 `ViT-B/32`），其图像预处理流均包含一个标准化层（Normalize），将像素转换到以 `[0.4814, 0.4578, 0.4082]` 为均值、以 `[0.2686, 0.2613, 0.2757]` 为标准差的分布上。

因此，主进程 `main.cjs` 的早期代码按照此规范对 Sharp 读取的像素执行了以下变换：
```javascript
// ❌ 错误的前处理代码
const mean = [0.48145466, 0.4578275, 0.40821073];
const std = [0.26862954, 0.26130258, 0.27577711];

for (let i = 0; i < imageSize; i++) {
  const r = data[i * 3] / 255.0;
  const g = data[i * 3 + 1] / 255.0;
  const b = data[i * 3 + 2] / 255.0;

  float32Data[i] = (r - mean[0]) / std[0];                   // R 通道归一化
  float32Data[imageSize + i] = (g - mean[1]) / std[1];       // G 通道归一化
  float32Data[2 * imageSize + i] = (b - mean[2]) / std[2];   // B 通道归一化
}
```

### 2. 发现 MobileCLIP S0 的独特性
我们通过 Python 打印出 MobileCLIP S0 模型的 `preprocess`（预处理管道）对象，得到了极其意外的结果：
```python
# 打印 preprocess 的输出：
Compose(
    Resize(size=256, interpolation=bilinear, max_size=None, antialias=True)
    CenterCrop(size=(256, 256))
    ToTensor()
)
```
从输出可以看出：**MobileCLIP S0 模型的预处理管道中完全没有 `Normalize` 这一步骤！** 

它只经过了 `ToTensor()`，这意味着：
*   模型在训练时，输入图像像素被直接缩放到了 `[0.0, 1.0]` 范围内。
*   **模型没有进行减均值和除以标准差的处理**。
*   如果我们把经过 ImageNet 均值/标准差处理后的数据（数值范围在 `-1.79` 到 `2.14` 之间）送入模型，相当于送入了彻底扭曲的、模型未见过的无效图像，导致模型提取出毫无价值的图像特征，引发分类的灾难性混乱。

---

## 🛠️ 解决方案

修改主进程 `main.cjs` 的图像数据变换代码，**完全移除减去均值和除以标准差的计算**。只将像素缩放至 `[0.0, 1.0]`，并重新整理成 ONNX 要求的 Planar 格式（即 `R R R... G G G... B B B...`）：

```javascript
// ✅ 正确的前处理代码
// Reshape to Planar format and scale to [0, 1] (MobileCLIP does not use mean/std standardization)
const float32Data = new Float32Array(3 * 256 * 256);
const imageSize = 256 * 256;

for (let i = 0; i < imageSize; i++) {
  // data 包含交错的 R,G,B 数据，我们将它拆分放入 Planar 平面
  float32Data[i] = data[i * 3] / 255.0;                      // R 平面
  float32Data[imageSize + i] = data[i * 3 + 1] / 255.0;      // G 平面
  float32Data[2 * imageSize + i] = data[i * 3 + 2] / 255.0;  // B 平面
}
```

---

## 📈 对比与效果

我们在相同的测试环境和相同的图片（马桶图片）下进行了输入输出的一致性对比：

*   **输入张量差异**：
    *   **错误预处理**：输入范围 `[-1.79, 2.14]`，与 PyTorch 原版输入相差极大（欧氏距离 Norm 达 `396.5`）。
    *   **正确预处理**：输入范围 `[0.0, 1.0]`，与 PyTorch 原始输入完全一致（误差近乎于 0）。
*   **ONNX 推理特征向量（Embedding）**：
    *   移除归一化后，ONNX 模型提取的 512 维特征向量与 PyTorch 的输出**余弦相似度直接达到 1.0000**。
    *   这也成功使后续与文本嵌入的计算结果完全恢复正常。
