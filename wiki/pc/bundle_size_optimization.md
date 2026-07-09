# 包体积优化指南

本文档记录 ShareCLIP PC 客户端（Electron Portable EXE）的体积构成分析、已实施的优化方案、以及未来可选的进阶优化路径。

---

## 📊 体积构成总览（优化前基准：~175 MB）

| 组成部分 | 大小 | 说明 |
|---|---|---|
| Electron / Chromium 框架 | ~70 MB | Electron 30 内嵌 Chromium，固定成本 |
| onnxruntime-node 原生库 | ~62 MB | AI 推理引擎 DLL（其中 36 MB 为 GPU DLL）|
| sqlite3 node_modules | ~47 MB | 含大量编译工具链和跨平台预编译文件 |
| ONNX 模型文件（2 个）| ~85 MB | 图像编码器 44 MB + 文字编码器 41 MB |
| sharp / libvips | ~19 MB | 图片 EXIF 解析（libvips-42.dll 占 18 MB）|
| Electron 系统文件 | ~42 MB | icudtl.dat、libGLESv2、d3dcompiler、pak 等 |
| 其他 node_modules | ~6 MB | vue、qrcode、exif-reader 等 |

> **注意**：部分项目相互重叠（节合计 > 175 MB），因为 portable EXE 以 7-zip 压缩打包，上表为各组件的磁盘原始大小。

---

## ✅ 已实施优化（v1.2.0，2026-07-09）

### 1. 排除 DirectML GPU 加速 DLL（节省 ~36 MB）

**原因**：onnxruntime-node 默认打包了 3 个 DirectML 相关 DLL，合计 36.4 MB：

| DLL | 大小 | 用途 |
|---|---|---|
| `DirectML.dll` | 17.7 MB | Windows DirectX Machine Learning GPU 推理后端 |
| `dxcompiler.dll` | 17.2 MB | DirectX shader 编译器（DirectML 依赖）|
| `dxil.dll` | 1.4 MB | DirectX 中间语言库（dxcompiler 依赖）|

**为什么可以安全删除**：项目中 `InferenceSession.create()` 未传 `executionProviders` 参数，onnxruntime 默认走 CPU 路径。DirectML 只有显式指定 `executionProviders: ['dml']` 才会被加载，当前代码永远不会触发。

```js
// 当前代码（CPU 模式）
ortSession = await ort.InferenceSession.create(modelPath);

// 如需 GPU 加速才需要（将来可选）
ortSession = await ort.InferenceSession.create(modelPath, {
  executionProviders: ['dml']  // 届时需重新包含 DirectML DLL
});
```

**package.json 排除规则**：
```json
"!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/DirectML.dll",
"!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/dxcompiler.dll",
"!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/dxil.dll"
```

**影响**：零影响。AI 分类速度、精度、启动时间均不受影响。

---

### 2. 排除 sqlite3 编译工具链和源码（节省 ~20-25 MB）

sqlite3 的 node_modules 达 47 MB，其中绝大部分是编译时产物，运行时只需要 `.node` 原生绑定（~2 MB）。

**排除内容**：
```json
"!node_modules/sqlite3/deps/**",
"!node_modules/sqlite3/src/**",
"!node_modules/sqlite3/build/deps/**",
"!node_modules/sqlite3/node_modules/**"
```

| 路径 | 说明 |
|---|---|
| `deps/` | 编译时的 SQLite C 源码和头文件 |
| `src/` | Node.js 绑定层 C++ 源码 |
| `build/deps/` | 编译生成的中间依赖 |
| `node_modules/` | sqlite3 自带的子包（node-gyp 等工具链）|

---

### 3. 排除 node-gyp（节省 ~4 MB）

`node-gyp` 是 C++ 原生模块的**编译工具**，只在开发/安装阶段使用，运行时完全不需要。

```json
"!node_modules/node-gyp/**"
```

---

### 4. 排除 sharp / @img 非 Windows 平台文件（节省 ~2-5 MB）

sharp 库的 `@img` 子包会包含多平台的预编译二进制，只保留 Windows x64 即可：

```json
"!node_modules/@img/sharp-linux-x64/**",
"!node_modules/@img/sharp-linux-arm64/**",
"!node_modules/@img/sharp-darwin-x64/**",
"!node_modules/@img/sharp-darwin-arm64/**",
"!node_modules/@img/sharp-win32-arm64/**"
```

---

## 📉 优化效果

| 阶段 | EXE 体积 | 节省 |
|---|---|---|
| 优化前（v1.1.0）| ~175 MB | — |
| 优化后（v1.2.0）| ~107-120 MB（待确认）| ~55-68 MB |

> 实际数据以重新打包后的 EXE 体积为准。

---

## 🚫 结构性限制（不可消除部分）

以下组件是 AI on-device 应用的固有成本，无法进一步削减：

| 组件 | 大小 | 原因 |
|---|---|---|
| Electron / Chromium | ~70 MB | 使用 Electron 框架的必要代价 |
| `onnxruntime.dll`（CPU）| ~25 MB | ONNX 推理核心 |
| `libvips-42.dll`（sharp）| ~18 MB | 图片 EXIF/处理必须 |
| ONNX 文字编码器 | ~41 MB | 已量化，进一步压缩有限 |
| ONNX 图像编码器 | ~44 MB | 暂不优化（见下节）|

---

## ⚠️ 已知坑：electron-builder 重新编译 sqlite3 报错

**现象**：执行 `npm run dist` 时报错：
```
gyp ERR! stack Error: EPERM: operation not permitted,
  unlink '...node_modules\sqlite3\build\Release\node_sqlite3.node'
```

**原因分析**：
1. electron-builder 默认会在打包前自动执行 `npm rebuild`，尝试为 Electron 内置的 Node 版本（NAPI v36）重新编译 sqlite3
2. sqlite3 v6.0.1 没有对应 NAPI v36 的预编译包，触发从源码编译
3. 若此时 ShareCLIP 应用正在运行，`node_sqlite3.node` 被进程锁定，导致 `EPERM` 权限错误

**解决方案（已应用）**：在 `package.json` 的 build 配置中添加：
```json
"npmRebuild": false,
"buildDependenciesFromSource": false
```

这告诉 electron-builder 跳过 native 模块重新编译，直接使用已有的 `.node` 文件。

> **副作用**：如果 sqlite3 的 `.node` 文件是用普通 Node（非 Electron Node）编译的，理论上存在 ABI 不兼容风险。但实践中，由于 Electron 和 Node.js 都遵循 N-API 稳定接口，sqlite3 正常运行无问题。

---

## 🔄 未来可选优化路径

### A. ONNX 图像编码器 INT8 量化（暂不实施）

当前图像编码器为 FP32 格式（44 MB）。INT8 量化可减少 ~30-33 MB：

```bash
python -m onnxruntime.quantization.quantize \
  --input mobileclip_image_encoder.onnx \
  --output mobileclip_image_encoder_int8.onnx \
  --quant_type QInt8
```

预期量化后：11-14 MB，但需要：
1. 验证分类精度损失 < 1-2%
2. 重新验证相似图片检测功能
3. 重新跑 text embedding 对比测试

**暂不实施，等待功能稳定后评估。**

---

### B. 启用 ASAR 压缩（可选，节省 ~5-10 MB）

当前配置 `"asar": false`。启用后 JS/JSON 等文本文件可压缩 30-50%：

```json
"asar": true,
"asarUnpack": [
  "node_modules/onnxruntime-node/**/*.dll",
  "node_modules/onnxruntime-node/**/*.node",
  "node_modules/sqlite3/**/*.node",
  "node_modules/sharp/**/*.dll",
  "node_modules/@img/**/*.dll",
  "node_modules/@img/**/*.node",
  "*.onnx"
]
```

> ⚠️ 注意：所有运行时直接读取的二进制文件（DLL、.node、.onnx）**必须**放在 `asarUnpack` 中，否则 Electron 无法正确加载。

---

### C. 切换到 Tauri 框架（激进，长期选项）

Tauri 使用系统 WebView 替代内嵌 Chromium，可将包体积压缩到 ~10-20 MB。  
但需要重写 Rust 后端，成本极高，不在近期计划内。

---

## 📋 package.json 完整优化配置

```json
"files": [
  "dist/**/*",
  "main.cjs",
  "preload.cjs",
  "tokenizer.cjs",
  "merges.txt",
  "text_embeddings.json",
  "mobileclip_image_encoder.onnx",
  "mobileclip_text_encoder_quant.onnx",
  "package.json",

  "node_modules/**",

  "!node_modules/onnxruntime-node/bin/napi-v6/darwin/**",
  "!node_modules/onnxruntime-node/bin/napi-v6/linux/**",
  "!node_modules/onnxruntime-node/bin/napi-v6/win32/arm64/**",
  "!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/DirectML.dll",
  "!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/dxcompiler.dll",
  "!node_modules/onnxruntime-node/bin/napi-v6/win32/x64/dxil.dll",

  "!node_modules/sqlite3/deps/**",
  "!node_modules/sqlite3/src/**",
  "!node_modules/sqlite3/build/deps/**",
  "!node_modules/sqlite3/node_modules/**",

  "!node_modules/node-gyp/**",

  "!node_modules/@img/sharp-linux-x64/**",
  "!node_modules/@img/sharp-linux-arm64/**",
  "!node_modules/@img/sharp-darwin-x64/**",
  "!node_modules/@img/sharp-darwin-arm64/**",
  "!node_modules/@img/sharp-win32-arm64/**"
]
```

---

## 🔗 相关文件

| 文件 | 说明 |
|---|---|
| [`cp_clip/package.json`](file:///d:/AI_serach_image/image_clip_android/cp_clip/package.json) | electron-builder 打包配置 |
| [`cp_clip/main.cjs`](file:///d:/AI_serach_image/image_clip_android/cp_clip/main.cjs) | ONNX 推理引擎调用（`InferenceSession.create`）|
| [`cp_clip/dist_electron/`](file:///d:/AI_serach_image/image_clip_android/cp_clip/dist_electron/) | 打包输出目录 |
