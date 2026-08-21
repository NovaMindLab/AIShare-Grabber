你现在负责为现有项目 AIShare-Grabber 增加一个全新的 WebShare 功能。

==================================================
【最高优先级要求】
==================================================

现有 AIShare-Grabber 项目必须保持完全不变。

这是一个“新增功能”，不是重构现有项目。

我已经在项目中创建好了：

webshare/

所有本次新增功能，原则上全部放在：

webshare/

目录中实现。

==================================================
【绝对禁止】
==================================================

禁止修改、删除、重构现有项目代码。

禁止修改现有 Electron 功能。

禁止修改现有 Electron UI。

禁止修改现有 Electron AI。

禁止修改现有数据库。

禁止修改现有图片传输逻辑。

禁止修改现有构建流程。

禁止为了 WebShare 去重构已有模块。

禁止把现有 Electron 功能迁移到 WebShare。

禁止让 WebShare 依赖 Electron API。

如果现有项目中存在可以复用的代码：

优先复制必要的最小代码到 webshare，

不要为了复用而修改原有代码。

核心原则：

【Existing Project = 不动】

【webshare = 全新功能】

==================================================
一、WebShare 是独立功能
==================================================

新增功能名称：

WebShare

目录：

webshare/

WebShare 是 AIShare-Grabber 的一个独立 Web 功能。

最终：

AIShare-Grabber
│
├── 原有 Electron 项目
│   └── 完全保持不变
│
└── webshare/
    └── 新增 WebShare 功能

两者共存。

==================================================
二、WebShare 的目标
==================================================

实现：

PC Chrome
    ↓
打开 WebShare
    ↓
显示二维码
    ↓
手机扫码
    ↓
手机浏览器打开 WebShare
    ↓
WebRTC 建立连接
    ↓
手机选择照片
    ↓
照片通过 WebRTC 发送到 PC
    ↓
PC Chrome 接收照片
    ↓
PC Chrome 浏览器本地 AI 分析
    ↓
MobileCLIP-S0
    ↓
ONNX Runtime Web
    ↓
WebGPU
    ↓
图片分类 / Embedding
    ↓
IndexedDB 保存分析结果

==================================================
三、非常重要：AI 在 PC 浏览器运行
==================================================

MobileCLIP-S0：

必须运行在：

PC Chrome

不是手机。

手机端：

不运行 MobileCLIP。

不运行 ONNX Runtime。

不运行 WebGPU AI 推理。

手机只负责：

1. 扫码
2. 建立 WebRTC
3. 选择照片
4. 发送照片

PC Chrome 负责：

1. 接收照片
2. 图片预处理
3. MobileCLIP 推理
4. 图片分类
5. Embedding
6. IndexedDB 存储
7. AI 搜索

==================================================
四、WebShare 技术架构
==================================================

PC Chrome：

┌───────────────────────────────┐
│          WebShare             │
│                               │
│ QR Code                       │
│                               │
│ WebRTC                        │
│                               │
│ Photo Receiver                │
│                               │
│ Web Worker                    │
│       ↓                       │
│ ONNX Runtime Web              │
│       ↓                       │
│ WebGPU                        │
│       ↓                       │
│ MobileCLIP-S0                 │
│                               │
│ IndexedDB                     │
└───────────────────────────────┘

手机：

┌───────────────────────────────┐
│ Mobile Browser                │
│                               │
│ QR Scan                       │
│       ↓                       │
│ WebRTC                        │
│       ↓                       │
│ Photo Picker                  │
│       ↓                       │
│ DataChannel                   │
└───────────────────────────────┘

==================================================
五、二维码
==================================================

PC WebShare 页面生成：

Session ID

例如：

8F3K9A

生成：

https://domain.com/webshare/join/8F3K9A

二维码只保存 Join URL。

不要把 SDP / ICE Candidate 放进二维码。

二维码：

PC
 ↓
手机扫描
 ↓
Join Session
 ↓
Signaling
 ↓
WebRTC
 ↓
P2P

==================================================
六、WebRTC
==================================================

使用：

RTCPeerConnection

RTCDataChannel

PC：

Receiver

手机：

Sender

照片必须通过：

WebRTC DataChannel

直接：

手机 → PC

服务器不得接收照片。

服务器只负责：

Session
Signaling
Pairing

==================================================
七、照片选择
==================================================

手机端使用标准 Web API：

<input
    type="file"
    accept="image/*"
    multiple
>

用户主动选择照片。

浏览器不能尝试偷偷读取整个手机相册。

流程：

扫码
↓
连接
↓
点击“选择照片”
↓
手机系统相册
↓
用户选择
↓
发送

==================================================
八、照片传输协议
==================================================

不要直接：

channel.send(file)

实现独立的 WebShare Protocol。

消息：

photo-meta

例如：

{
    type: "photo-meta",
    id: "...",
    filename: "IMG_001.jpg",
    mime: "image/jpeg",
    size: 1234567,
    width: 4032,
    height: 3024,
    index: 1,
    total: 100
}

然后：

photo-chunk

使用：

ArrayBuffer
Uint8Array

进行二进制传输。

必须处理：

DataChannel backpressure。

使用：

bufferedAmount
bufferedAmountLowThreshold
bufferedamountlow

避免一次性发送大量数据导致内存爆炸。

==================================================
九、PC 浏览器 AI
==================================================

图片进入 PC：

ArrayBuffer
↓
Blob
↓
createImageBitmap
↓
resize
↓
MobileCLIP-S0
↓
Image Embedding
↓
分类
↓
IndexedDB

AI 使用：

ONNX Runtime Web

优先：

WebGPU

Fallback：

WASM

检测：

navigator.gpu

如果 WebGPU 不支持：

允许使用 WASM。

但 WebGPU 是主要实现。

==================================================
十、Web Worker
==================================================

MobileCLIP 不能运行在 Main Thread。

必须：

Main Thread
    │
    └── Web Worker
           │
           └── ONNX Runtime Web
                  │
                  └── WebGPU
                       │
                       └── MobileCLIP-S0

Worker 负责：

- 模型加载
- 图片预处理
- AI inference
- embedding
- 分类

Main Thread：

- UI
- WebRTC
- 图片接收
- IndexedDB
- 进度显示

使用：

postMessage

以及：

Transferable ArrayBuffer

减少数据复制。

==================================================
十一、MobileCLIP-S0
==================================================

使用：

MobileCLIP-S0

ONNX 模型。

不要在运行时加载 PyTorch。

模型文件放：

webshare/

对应的静态资源目录。

模型应该：

首次使用时 lazy load。

加载后使用 Cache Storage 缓存。

不要每次刷新页面重新下载模型。

==================================================
十二、分类
==================================================

MobileCLIP 使用 Zero-shot Classification。

默认分类：

人物
风景
动物
食物
汽车
建筑
文档
截图
自拍
旅行
夜景

通过：

Text Embedding
+
Image Embedding

计算：

Cosine Similarity

保存 Top-K。

例如：

{
    photoId: "...",
    categories: [
        {
            name: "person",
            score: 0.92
        },
        {
            name: "travel",
            score: 0.83
        }
    ]
}

==================================================
十三、IndexedDB
==================================================

WebShare 使用：

IndexedDB

不要使用：

localStorage

数据库名称：

webshare-ai

Stores：

photos
embeddings
analysis_results
sessions

photos：

{
    id,
    hash,
    filename,
    mime,
    size,
    width,
    height,
    createdAt,
    receivedAt,
    analyzedAt
}

embeddings：

{
    photoId,
    model: "MobileCLIP-S0",
    modelVersion,
    dimension: 512,
    vector: Float32Array
}

analysis_results：

{
    photoId,
    categories,
    analyzedAt
}

==================================================
十四、图片去重
==================================================

PC 收到图片以后：

SHA-256

使用：

crypto.subtle.digest()

保存：

hash

如果 IndexedDB 已经存在相同 hash：

不要重复执行 MobileCLIP。

直接复用：

embedding
classification

==================================================
十五、WebShare UI
==================================================

PC：

--------------------------------

AIShare WebShare

手机扫码导入照片

[ QR CODE ]

等待手机连接...

--------------------------------

连接以后：

--------------------------------

手机已连接

设备：

iPhone

--------------------------------

接收：

1823 / 3000

--------------------------------

AI 分析：

1542 / 1823

--------------------------------

分类：

人物       821
风景       523
动物       182
食物        92
文档        63
截图       119

--------------------------------

手机：

--------------------------------

AIShare WebShare

已连接到：

PC

[选择照片]

已选择：

3281 张

[开始发送]

--------------------------------

==================================================
十六、处理流水线
==================================================

不要：

所有照片接收完成
↓
再开始 AI

应该：

手机发送
 ↓
PC 接收
 ↓
Hash
 ↓
IndexedDB 查询
 ↓
AI Worker
 ↓
MobileCLIP
 ↓
保存结果
 ↓
继续下一张

形成：

Receive Queue
       ↓
AI Queue
       ↓
IndexedDB

==================================================
十七、性能
==================================================

必须：

1. Web Worker
2. WebGPU
3. ImageBitmap
4. Batch inference
5. Transferable ArrayBuffer
6. DataChannel backpressure
7. 控制队列大小
8. 控制内存
9. 避免重复 decode
10. 避免重复 inference

默认：

batch size = 4

根据实际性能再调整。

==================================================
十八、WebShare 与 Electron 的边界
==================================================

这是整个任务最重要的原则。

Electron：

保持原样。

WebShare：

完全独立。

不要：

Electron → WebShare

强依赖。

不要：

WebShare → Electron

强依赖。

允许：

公共 TypeScript 类型 / 常量复制或共享。

但是不能为了共享而修改现有 Electron。

==================================================
十九、开发顺序
==================================================

严格按照下面顺序开发。

Phase 1：

webshare/

PC Chrome
↓
QR
↓
手机扫码
↓
WebRTC
↓
手机选择 10 张图片
↓
PC Chrome 收到
↓
显示图片

先不做 AI。

Phase 2：

IndexedDB
+
SHA-256
+
Photo Metadata

Phase 3：

Web Worker
+
ONNX Runtime Web
+
WebGPU

Phase 4：

MobileCLIP-S0
+
Embedding
+
Zero-shot Classification

Phase 5：

性能优化
+
批量推理
+
断线恢复
+
重复照片检测

==================================================
二十、开发原则
==================================================

开始编码前：

先分析当前项目。

但是：

不要修改现有项目。

只允许新增：

webshare/

以及运行 WebShare 所绝对必要的最小配置。

如果确实必须修改项目根目录配置：

必须先说明原因。

优先采用：

webshare/

内部自包含的实现。

==================================================
二十一、最终验收标准
==================================================

最终必须能够完成：

PC Chrome
↓
打开 WebShare
↓
显示二维码
↓
手机扫码
↓
手机浏览器打开 WebShare
↓
WebRTC 建立连接
↓
手机选择 10 张照片
↓
照片通过 WebRTC 到 PC
↓
PC Chrome 显示照片
↓
PC Chrome Web Worker
↓
ONNX Runtime Web
↓
WebGPU
↓
MobileCLIP-S0
↓
分类
↓
IndexedDB 保存：

hash
embedding
category
score

整个过程中：

Electron 原有功能完全不受影响。

==================================================
二十二、最终报告
==================================================

完成后输出：

1. webshare 新增文件列表
2. 是否修改了现有项目
3. 如果修改，为什么
4. WebRTC 架构
5. QR 配对流程
6. MobileCLIP 架构
7. WebGPU 架构
8. IndexedDB 结构
9. 如何启动 WebShare
10. 如何测试
11. 当前限制
12. 后续优化建议

再次强调：

【现有 AIShare-Grabber 完全保持不变】

【只新增 webshare 功能】

【Electron 和 WebShare 两条路线长期共存】

【不要混淆两条路线】