# MobileCLIP Album AI Classifier - Project Wiki

欢迎来到本项目 Wiki！本知识库详细记录了在开发和优化本地 AI 相册分类应用（基于 Electron + Vue 3 + Vite + ONNX Runtime）过程中遇到的关键技术问题、根本原因分析以及最终的解决方案。

---

## 📂 Wiki 目录

### 1. [本地图片加载修复：协议处理器路径解析](file:///d:/AI_serach_image/image_clip/wiki/broken_image_fix.md)
*   **内容**：分析本地图片在 Electron 中显示为“烂图”的根源，如何通过调整自定义 `local://` 协议的 URL 构造（三斜杠 `local:///`）与后端路径解析来解决 Windows 盘符丢失的问题。

### 2. [模型重参数化与导出：解决 RepMixer 崩溃](file:///d:/AI_serach_image/image_clip/wiki/model_reparameterization.md)
*   **内容**：探讨 Apple 官方 `ml-mobileclip` 库在重参数化过程中的 `AttributeError` 崩溃。提供通用的 `safe_reparameterize_model` 绕过方案，并说明如何将模型导出并扁平化为单一自包含的 ONNX 文件。

### 3. [图像预处理修正：移除均值/标准差标准化](file:///d:/AI_serach_image/image_clip/wiki/preprocessing_and_normalization.md)
*   **内容**：揭示模型分类混乱的头号原因。详细说明为什么 MobileCLIP S0 模型的图像输入**不能**进行传统的 ImageNet 均值和标准差标准化，以及将输入像素缩放至 `[0, 1]` 如何将余弦相似度对齐至 `1.0`。

### 4. [分类优化：类别扩展与 Softmax 温度调节](file:///d:/AI_serach_image/image_clip/wiki/categories_and_temperature.md)
*   **内容**：如何通过将零样本分类类别从 8 类扩展至 15 类（覆盖日常高频场景）以及将 Softmax 温度从 `100.0` 调低至 `60.0`，从而提升分类准确度、解决分类强行“指鹿为马”并优化概率分布。

### 5. [打包与发布：构建 Standalone Portable EXE](file:///d:/AI_serach_image/image_clip/wiki/packaging_and_deployment.md)
*   **内容**：使用 `electron-builder` 构建 Windows 绿色免安装版单文件 `.exe` 的配置说明，如何不使用 ASAR 解决原生模块 (`onnxruntime-node`、`sharp`) 以及权重文件的运行时加载问题。

---

## 🏗️ 整体系统架构图

应用基于纯本地离线架构，核心逻辑运行在 Electron 主进程中，具体流程如下：

```mermaid
graph TD
    A[用户选择相册文件夹/图片] --> B(前端渲染等待队列)
    B --> C{主进程排队进行 AI 推理}
    C -->|1. 用 Sharp 裁剪并缩放到 256x256| D[提取 [0, 1] Planar RGB Tensor]
    D -->|2. 运行 ONNX Runtime 图像编码器| E[提取 512 维特征向量 Image Embedding]
    E -->|3. L2 归一化并与 text_embeddings.json 进行矩阵乘| F[计算 15 个类别的余弦相似度]
    F -->|4. Softmax 温度 60.0 缩放| G[生成分类概率分布并排序]
    G --> H[返回结果渲染前端视图与分类过滤器]
```
