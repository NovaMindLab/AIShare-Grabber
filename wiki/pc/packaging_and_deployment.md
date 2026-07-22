# 打包与发布：构建 Standalone Portable EXE

相册分类应用在优化分类质量后，需要交付给最终用户使用。由于本项目是一个本地 AI 离线应用，包含了原生二进制 Node 模块（如 `sharp` 和 `onnxruntime-node`）以及大型模型权重文件（`.onnx`），我们在打包 Windows 便携版可执行程序（`.exe`）时实施了针对性优化配置。

---

## 📦 打包工具与配置

我们采用 **`electron-builder`** 将基于 Vite 编译的前端代码和基于 Node.js 的 Electron 后端进行融合打包。主要的配置文件为 [package.json](file:///d:/AI_serach_image/image_clip/package.json) 中的 `build` 节点。

### package.json 中的打包配置
```json
  "build": {
    "appId": "com.image.clip.classifier",
    "productName": "ImageClipClassifier",
    "directories": {
      "output": "dist_electron"
    },
    "files": [
      "dist/**/*",
      "main.cjs",
      "preload.cjs",
      "text_embeddings.json",
      "mobileclip_image_encoder.onnx",
      "package.json",
      "!node_modules/onnxruntime-node/bin/napi-v6/darwin/**/*",
      "!node_modules/onnxruntime-node/bin/napi-v6/linux/**/*",
      "!node_modules/onnxruntime-node/bin/napi-v6/win32/arm64/**/*"
    ],
    "asar": false,
    "win": {
      "target": [
        "portable"
      ]
    }
  }
```

---

## 🛠️ 打包关键技术要点

### 1. 禁用 ASAR 压缩（`"asar": false`）
*   **什么是 ASAR**：Electron 默认会将所有应用代码打包进一个虚拟归档文件 `app.asar` 中，以加快读取速度并防止源代码泄露。
*   **为什么要禁用**：
    *   **原生模块加载问题**：`onnxruntime-node` 和 `sharp` 分别依赖底层的 C++ DLL 动态链接库（例如 Windows 上的 `onnxruntime.dll`、`DirectML.dll` 以及 `libvips`）。Node 无法在 ASAR 虚拟文件系统内直接执行 C++ 原生 DLL 代码，通常会触发找不到 DLL 或路径无效的崩溃。
    *   **ONNX 路径访问**：`onnxruntime-node` 在通过 `InferenceSession.create(modelPath)` 初始化 ONNX 会话时，必须使用宿主操作系统的真实物理文件路径。如果模型文件位于虚拟的 ASAR 文件内，加载器将报错退出。
*   **结果**：禁用 ASAR 后，程序释放到临时目录时，所有的原生库、依赖文件夹和大型 `.onnx` 文件都会原样保留在物理硬盘目录中，确保 C++ 库 and 加载器可以 100% 正确加载。

### 2. 跨平台二进制库排除（体积优化核心）
*   **背景**：`onnxruntime-node` 默认打包了针对 macOS (darwin/arm64)、Linux (linux/arm64, linux/x64)、Windows ARM64 (win32/arm64) 以及 Windows x64 (win32/x64) 等所有支持平台的二进制 C++ 库，整个依赖项高达 270 MB。
*   **优化**：我们在 `"files"` 配置中使用了**负向 Glob 匹配（`!` 开头）**，显式地将 macOS, Linux 以及 Windows ARM64 平台的库彻底剔除，只保留了当前 Windows x64 实机所需的 `win32/x64`。
*   **成效**：成功删除了 **206 MB** 的无用二进制垃圾文件，使应用未压缩时的解压体积直接缩减了 1/3，体积控制极佳。

### 3. 扁平化 ONNX 模型打包
*   我们将权重完全融合成了一个单文件自包含的 `mobileclip_image_encoder.onnx`（46.2 MB），并将其包含在 `"files"` 中。
*   这保证了打包后的可执行程序不需要再在同级目录携带庞大的外部 `.onnx.data` 权重数据文件，实现了真正的单文件零依赖随处拷贝。

### 4. 构建 Portable 便携版
*   我们将 Windows 端的输出目标设为了 `"portable"`。
*   `electron-builder` 会生成一个自解压的可执行文件 `dist_electron/ImageClipClassifier 1.0.0.exe`。
*   当用户双击运行此 `.exe` 时，它会瞬间自动解压到系统的 Temp 目录并直接加载界面，完全不需要安装，非常轻量且易于分发。

---

## 🚀 构建与验证命令

### 1. 编译前端静态文件
每次修改前端（如 App.vue）后，需使用 Vite 编译最新生产包：
```bash
npm run build
```

### 2. 构建独立免安装 exe
编译完成后，运行以下命令开始打包：
```bash
npm run dist
```
由于禁用了 ASAR，`electron-builder` 在打包过程中会针对 native 依赖包调用 `@electron/rebuild`。打包成功后，输出的单文件可执行文件将放置在：
*   `dist_electron/ImageClipClassifier 1.0.0.exe`（文件大小约为 136.7 MB，此体积包含了全部原生 C++ 核心、Chromium 内核以及 46MB 的 CLIP AI 图像编码器）。

### 3. 运行验证
双击该 exe 后即可一键打开应用。由于重参数化、前处理逻辑和 15 分类特征向量全部被完整静态打包在内，应用可在断网环境下实现 100% 本地离线高精度相册分类。
