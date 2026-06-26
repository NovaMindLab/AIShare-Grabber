# Role: Senior Android Systems & WebRTC Architect

## Context & Objective
当前项目根目录下需要新建一个工程目录 `./android`，实现一个 Android 原生 App。
该 App 的核心作用是：作为 PC 端的“近场数据伴侣”，通过手机摄像头扫描 PC 端展示的二维码，利用 **Bluetooth (BLE) 作为信令通道** 建立连接，完成 WebRTC SDP 握手，随后通过 **WebRTC DataChannel** 将手机相册中的图片流式同步到 PC 端。

请采用 **现代 Android 开发标准（AI-Friendly 纯代码架构）** 为我初始化该 Android 工程并编写核心模块。

---

## Technical Stack Mandates
1. **Language & UI**: Kotlin + Jetpack Compose (Material 3), 单 Activity 架构。
2. **Async & State**: Coroutines + Kotlin Flow + ViewModel。
3. **Camera & QR**: CameraX + Google ML Kit (Barcode Scanning)。
4. **Bluetooth**: Android 原生 `BluetoothLeScanner` / `BluetoothGatt` (App 作为 GATT Client / Central)。
5. **WebRTC**: `io.getstream:stream-webrtc-android` (或官方最新维护的 webrtc 依赖)。
6. **Media**: Android `MediaStore` API（需完美适配 Android 13/14 的 Read Media Images 权限）。

---

## Core Workflow & Protocol Specification

### Phase 1: 扫码解析阶段
* PC 端生成的二维码 Payload 格式约定为 JSON：
  `{ "ble_mac": "XX:XX:XX:XX:XX:XX", "service_uuid": "xxxx...", "char_uuid": "xxxx...", "session_id": "1001" }`
* 使用 CameraX 配合 ML Kit 拿到该 JSON，解析出 BLE 的目标 MAC 地址和 GATT 特征值。

### Phase 2: BLE 信令握手阶段 (Signaling over BLE)
1. 手机开启 BLE 扫描，定向连接 PC 端的 `ble_mac`（GATT Server）。
2. 连接成功后，App 本地初始化 `PeerConnectionFactory`，生成 WebRTC 的 **Offer SDP**。
3. 通过 BLE GATT Write 将 Offer 发送给 PC（**注意**：BLE MTU 默认限制为 20~512 字节，SDP 字符串通常有 2KB+，你的代码**必须实现 BLE 数据包的简单分片发送与组装逻辑**）。
4. 监听 PC 端回传的 Answer SDP 和 ICE Candidates，注入到本地 `PeerConnection`。

### Phase 3: WebRTC DataChannel 建立与同步阶段
1. 当 `DataChannel` 的 `state == OPEN` 时，UI 切换至“传输控制台”，允许用户选择相册同步。
2. **图片传输协议（重点避坑）：** WebRTC DataChannel 单 message 发送上限通常为 16KB~64KB，绝不能直接 send 整张图片的 byte[]。
   必须实现**应用层分片流传输协议**，单包结构约定为：
   * **Header (16 Bytes)**: 
     * `file_id` (Int, 4B) 
     * `chunk_index` (Int, 4B) 
     * `total_chunks` (Int, 4B) 
     * `payload_size` (Int, 4B)
   * **Payload (Max 32KB)**: 图片二进制碎片数据。
   * **发送策略**：使用协程读取 MediaStore 图片 -> 压缩/转成二进制 -> 按 32KB 切片 -> 检查 `dataChannel.bufferedAmount`（实现 Backpressure 流控，当 bufferedAmount > 1MB 时暂停发送协程，防止内存谷底溢出 OOM）。

---

## Execution Steps for AI (Please implement step-by-step)

请不要一次性把所有细节堆在一起，按以下任务清单 **分步给出方案与代码**：

1. **Step 1: 工程结构与权限配置**
   * 给出 `android/app/build.gradle.kts` 的完整核心依赖清单。
   * 给出 `AndroidManifest.xml`，必须包含 Android 12+ (BLUETOOTH_SCAN, BLUETOOTH_CONNECT) 及 Android 13+ 媒体读取权限的精确声明。

2. **Step 2: 扫码与基础 UI 框架**
   * 编写基于 CameraX + ML Kit 的 `QrScannerScreen.kt`。

3. **Step 3: BLE 信令客户端封装**
   * 编写 `BleSignalingClient.kt`，实现连接指定 MAC、以及**长文本（SDP）基于 BLE MTU 的分片发送/接收逻辑**。

4. **Step 4: WebRTC 与分片同步引擎**
   * 编写 `WebRtcSyncEngine.kt`，包含 `PeerConnection` 初始化、DataChannel 创建，以及带有 **Backpressure 流控机制**的相册二进制分片发送器 `PhotoStreamer.kt`。

*Let's start with Step 1 and Step 2 first.*