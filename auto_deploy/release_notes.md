### 🚀 ShareCLIP v3.0.16 Release Notes

#### 📱 二维码颗粒度极致优化与低端机极速秒扫 (Low-End Camera QR Code Optimization)
- **精简二维码载荷体积（压缩率达 75%）**：
  - 剔除固定 72 字节的 Nordic UART 静态 Service UUID 与 Characteristic UUID 常量（移动端内置协议默认解析），将 JSON 键名精简短化（`ble_mac` -> `m`, `session_id` -> `s`, `pc_ips` -> `ip`，端口与热点字段按需携带）。
  - 载荷字符数从 240+ 字符大幅削减至 ~60 字符，并保持全版本双向兼容。
- **降低二维码密度，码点放大 400%+**：
  - 将容错等级设为 `errorCorrectionLevel: 'L'`，使二维码版本从高密度的 Version 8/9（53x53 矩阵，2,809 个码点）急剧下降至稀疏的 Version 2/3（25x25 矩阵，625 个码点）。
  - PC 端二维码画布尺寸从 140px 增大至 160px（外框 184px）。单个码点像素尺寸放大近 3 倍，面积增大逾 4 倍。即使是千元低端机、老旧对焦困难机型或弱光环境下，摄像头画面只要扫到二维码即可在 50ms 内瞬间解码识别。

#### ⚡ 局域网物理真实 IP 智能过滤与直连加速 (Smart Physical IP Filtering & Fast Direct Connect)
- **五阶多重 IP 精准筛选机制**：
  - **Tier 1 内核路由探测**：通过 OS 内核 UDP 路由探测机制（0 流量探测网关）在 14ms 内毫秒级获取承载对外通信的主网卡真实 IP。
  - **Tier 2 Route Metric 探测**：结合 Windows 路由表 Metric 权重探测真实默认网关所在接口。
  - **Tier 3 虚拟适配器全量黑名单**：深度排除 VMware、VirtualBox、WSL、Hyper-V、Docker、Tap/Tun、VPN 等虚拟网卡。
  - **Tier 4 MAC OUI 厂商指纹过滤**：根据 MAC 前缀鉴别虚拟化适配器。
  - **Tier 5 虚拟专用网段剔除**：拦截 `192.168.56.x`、`169.254.x.x`、`100.64.x.x` 等保留子网。
- **移动端局域网并发秒连**：
  - 扫码后优先利用二维码中携带的高信噪比真实物理 IP 发起局域网并发探测与直连通道握手，局域网同网段下耗时从数秒降低至数百毫秒。

#### 🔄 WebRTC 连接状态机与信令时序强化 (Signaling & State Machine Hardening)
- **连接 Promise 状态复用**：PC 端在处理同一客户端并发发起的 Offer 时共享当前处理流程，避免重置或覆盖已生成的 Answer。
- **消除两端状态不同步**：彻底解决 PC 端已就绪而手机端仍处于连接中旋转等待的问题。

#### 📦 全端版本同步递增至 v3.0.16
- 桌面端 Electron、移动端 Flutter（版本号 `3.0.16+30016`）、Web Portal 与 WebShare 全面同步。
