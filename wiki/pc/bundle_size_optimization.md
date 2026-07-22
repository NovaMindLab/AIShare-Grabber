# PC 客户端体积与优化指南 (Bundle Size & Quantization Guide)

本文档记录 ShareCLIP PC 客户端（Electron Win-x64）的体积构成分析、已实施的体积优化方案、ONNX 图像编码器量化失效的实测论证，以及不可消除的结构性成本。

---

## 📊 1. 磁盘未解压总体积构成 (Uncompressed Size: 362.15 MB)

在通过 `electron-builder` 打包后，输出的未压缩绿色版目录 `win-unpacked` 总大小已从最初的 **398.65 MB** 降低至 **362.15 MB**。其详细体积构成和所扮演的职能组件列表如下：

| 占用体积 | 占比 | 相对路径 / 文件名 | 组件名称 & 描述 | 优化可行性 |
|---|---|---|---|---|
| **168.84 MB** | 46.6% | `ShareCLIP.exe` | **Electron 基础壳程序**<br/>基于 Chromium + Node.js 运行时，提供渲染与原生操作系统交互能力。 | 🔴 **不可优化**。Electron 30+ 引擎的固有底噪开销。 |
| **44.10 MB** | 12.2% | `resources/app.asar.unpacked/mobileclip_image_encoder.onnx` | **MobileCLIP 图像编码器** (FP32)<br/>负责提取同步照片的 512 维高维特征向量。 | 🔴 **不可动态量化**。量化会导致精度完全丧失（详见下文实测）。 |
| **40.92 MB** | 11.3% | `resources/app.asar.unpacked/mobileclip_text_encoder_quant.onnx` | **MobileCLIP 文本编码器** (INT8)<br/>已进行静态量化，用于在搜索时将文本 Token 转化为文本特征向量。 | 🔴 **已是极限**。若强行使用更低比特（如 INT4）量化，将丢失多语言词向量语义。 |
| **24.81 MB** | 6.8% | `resources/app.asar.unpacked/node_modules/onnxruntime-node/.../onnxruntime.dll` | **ONNX Runtime 引擎 DLL** (CPU 版)<br/>负责在 PC 本地高性能、低内存占用运行上述两个 `.onnx` 模型进行特征提取。 | 🔴 **不可优化**。微软官方提供的原生底层 C++ 推理库。 |
| **18.08 MB** | 5.0% | `resources/app.asar.unpacked/node_modules/@img/sharp-win32-x64/lib/libvips-42.dll` | **Sharp / libvips 图像处理库**<br/>用于照片极速解码、居中裁剪（Center Cover）、重排为 Planar 格式等预处理。 | 🔴 **不可优化**。C++ 高性能多核图像处理引擎，缺少它无法在数十毫秒内解码图片。 |
| **13.35 MB** | 3.7% | `resources/app.asar` | **前端应用源码与依赖包**<br/>打包后的 Vue 3 前端页面及 sqlite3/qrcode 等 JS/Node 业务层依赖。 | 🟢 **已是极限**。已通过 ASAR 技术将数千个小文件合并归档。 |
| **10.22 MB** | 2.8% | `icudtl.dat` | **Chromium ICU 字符集数据库**<br/>为渲染引擎提供完整的国际化字符集支持。 | 🔴 **不可优化**。Electron 的固定依赖。 |
| **9.80 MB** | 2.7% | `LICENSES.chromium.html` | **Chromium 开源协议声明文档** | 🔴 **不可优化**。Electron 框架自带，属于合法发布必需文件。 |
| **0.87 MB** | 0.2% | `locales/*.pak` | **Chromium 语言翻译包**<br/>仅保留 `zh-CN.pak` 和 `en-US.pak`。 | 🟢 **已实施裁剪**。通过配置 `electronLanguages` 成功剔除了 50+ 种无用的小语种包（**节省了 36.5MB** 的磁盘空间）。 |
| **30.54 MB** | 8.4% | 根目录下其他 `.dll` 与 `.pak` | **核心图形渲染与音视频库**<br/>如 WebGL 依赖（`libGLESv2.dll` 7.5MB）、音视频解码（`ffmpeg.dll` 2.5MB）、DirectX 编译器等。 | 🔴 **不可优化**。前端界面 GPU 渲染加速所必需。 |

---

## 🚫 2. 图像模型不能直接进行 INT8 动态量化的技术论证

针对图像模型 `mobileclip_image_encoder.onnx`（FP32 格式，大小 44.1 MB），我们曾尝试使用 ONNX 官方工具链进行动态 INT8 量化（Dynamic Quantization）以期望将其体积缩减到 **11.6 MB**（减小 73.6% 空间）。

### 🧪 验证实验与余弦相似度实测
我们在项目中编写了验证测试脚本 `verify_quant.cjs`，直接对比了**同一张测试图片（归一化 Planar Sine 矩阵）**在 **FP32 原始模型** 与 **INT8 量化模型** 中的输出 embeddings（512 维特征向量）：

*   **FP32 图像编码器单次推理耗时**：`276 ms`
*   **INT8 动态量化图像编码器单次推理耗时**：`712 ms`
*   **输出特征向量的夹角余弦相似度 (Cosine Similarity)**：**`8.2014%`**

### ❌ 为什么相似度仅有 8.20%（量化失效分析）？
1.  **激活函数敏感度高**：
    MobileCLIP 的图像编码器使用了注意力机制（Attention Block）和卷积层（Convolution）。这类 Vision Transformer/ResNet 混合模型中，中间层的激活值（Activations）数值分布具有极强的波动性与偏斜性。
2.  **动态量化的天然缺陷**：
    动态量化仅对**权重矩阵 (Weights)** 进行 INT8 压缩，并在每次运行推理时根据输入实时计算缩放因子。因为没有收集真实图片来提前校准（Calibrate）各层激活的动态范围（Dynamic Range），导致量化产生的截断误差与舍入噪声在深层网络中发生**指数级累积放大**。
3.  **推理耗时反向暴增**：
    由于 CPU 缺少针对无规律浮点数动态反量化的专用算力支持，计算反量化缩放的开销超越了 INT8 矩阵乘法的收益，导致单次推理时间从 **276ms 飙升至 712ms**（慢了 2.5 倍）。

> [!CAUTION]
> **结论**：动态量化使模型输出直接退化为无效噪声（8.2% 的相似度无异于随机数），**会导致相似图片查重完全失效，照片分类检索彻底崩塌**。
>
> 图像模型若要进行量化，必须走 **静态量化（Static Quantization / PTQ）** 路线：需要提前搜集至少 1000+ 张覆盖风景、人像、文档等多场景的日常图片作为校准数据集，利用校准集跑前向传播记录每一层的激活值分布，计算出静态量化表。这不仅开发成本高昂，且难以保证模型在边缘情况下的精确度。因此，**保持 FP32 模型是确保图像分类与搜索高可用性的唯一科学选择。**

---

## ✅ 3. 已实施的体积优化方案

在当前版本中，我们已经实施了多项系统层面的体积瘦身手段：

### 3.1 剪裁多国语言 Locales 依赖包 (新增 - 节省 ~36.5 MB 磁盘体积 & ~14 MB 安装包体积)
Chromium 默认自带了 50 多种语言包。由于 ShareCLIP 应用的所有语言资源文件由我们自己在前端（`locales.js`）与手机端独立维护，打包时无需保留 Chromium 自身的其他语种。
我们在 `package.json` 中配置了 `"electronLanguages": ["zh-CN", "en-US"]`。打包时自动删除了包括孟加拉语、卡纳达语、泰米尔语等 50+ 个无用包。
- ** locales 目录大小**：**37.39 MB ➡️ 0.87 MB**。
- **打包安装包实际体积**：**163.3 MB ➡️ 149.2 MB**。

### 3.2 排除 DirectML 显卡加速 DLL (节省 ~36.4 MB)
由于 ShareCLIP 的 AI 推理完全运行在本地 CPU 上（`ort.InferenceSession.create()` 未传 `dml` 参数），我们通过 `package.json` 的 `build.files` 排除规则，从最终包里安全剔除了 DirectX Machine Learning 相关的 DLL：
```json
"!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/DirectML.dll",
"!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/dxcompiler.dll",
"!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/dxil.dll"
```

### 3.3 精确清理本地 C++ 模块的源码与工具链 (节省 ~30 MB)
运行时只需要 Node 原生绑定接口（`.node`）和对应的 JS 封装代码，我们在打包时清空了其编译依赖：
- **Sqlite3**：清空了 C++ 底层源码 `deps/`、绑定代码 `src/` 以及编译 obj 中间文件：
  ```json
  "!node_modules/sqlite3/deps/**",
  "!node_modules/sqlite3/src/**",
  "!node_modules/sqlite3/build/deps/**",
  "!node_modules/sqlite3/build/**/*.obj"
  ```
- **Sharp**：过滤剔除了除 Windows x64 以外的跨平台包：
  ```json
  "!node_modules/@img/sharp-linux-x64/**",
  "!node_modules/@img/sharp-darwin-x64/**",
  "!node_modules/@img/sharp-win32-arm64/**"
  ```
- **Node-GYP**：彻底排除仅在安装期所需的构建工具：
  ```json
  "!node_modules/node-gyp/**"
  ```

### 3.4 开启 ASAR 归档与物理路径兼容
我们开启了 `"asar": true` 归档配置。由于 `onnxruntime-node`、`sharp`、`sqlite3` 等原生二进制和 `.onnx` 无法直接运行在 ASAR 包内，我们在 `package.json` 中配置了 `asarUnpack`，并在主进程 `main.cjs` 顶部新增了自动转换物理路径的 `getPhysicalPath` 辅助函数：
```javascript
function getPhysicalPath(filePath) {
  return filePath.replace(/\bapp\.asar\b/, 'app.asar.unpacked');
}
```
这保证了原生 DLL 加载的正确性，并大幅优化了安装解压时间。

---

## 🚀 4. 未来进一步优化的手段

1.  **向 Tauri 框架迁移（长期选项，可降至 50-60 MB）**：
    由于 Electron Chromium 核心占了近 **170 MB**。未来如需极致体积，可通过 Tauri 框架进行全栈重构，由 Rust 后端调用 Windows 自带的 WebView2，彻底抹去 Chromium 底噪。
