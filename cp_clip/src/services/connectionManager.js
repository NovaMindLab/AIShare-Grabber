import { ref } from 'vue';

/**
 * ConnectionManager - 独立的 PC 与手机 WebRTC 直连通信管理器
 * 
 * 职责：
 * 1. 统一管理 RTCPeerConnection 与 RTCDataChannel 生命周期
 * 2. 统一处理 UDP / HTTP 信令交互与 ICE Candidate 缓存入队
 * 3. 统一管理连接看门狗 (25s 握手超时、5s 状态恢复缓冲、3s 双向心跳 Keepalive)
 * 4. 彻底解耦底层通信与上层相册/AI业务，保障连接稳定性
 */
class ConnectionManager {
  constructor() {
    this.status = ref('idle'); // 'idle' | 'advertising' | 'handshaking' | 'connected' | 'disconnected'
    this.activePeerIp = ref('');
    this.peerConnection = null;
    this.dataChannel = null;

    this.isProcessingOffer = false;
    this.hasGeneratedAnswer = false;
    this.pendingDirectIceCandidates = [];

    this.handshakeTimeoutTimer = null;
    this.disconnectGraceTimer = null;
    this.heartbeatTimer = null;
    this.lastHeartbeatTime = Date.now();

    // 回调钩子
    this.logCallback = console.log;
    this.onConnectedCallback = null;
    this.onDisconnectedCallback = null;
    this.onPacketCallback = null;
    this.onHandshakeTimeoutCallback = null;
  }

  log(msg) {
    if (this.logCallback) {
      this.logCallback(msg);
    }
  }

  /**
   * 初始化并绑定系统 API 信令监听
   */
  init({ log, onConnected, onDisconnected, onPacket, onHandshakeTimeout, onDataChannel }) {
    this.logCallback = log || console.log;
    this.onConnectedCallback = onConnected || null;
    this.onDisconnectedCallback = onDisconnected || null;
    this.onPacketCallback = onPacket || null;
    this.onHandshakeTimeoutCallback = onHandshakeTimeout || null;
    this.onDataChannelCallback = onDataChannel || null;

    if (!window.api) return;

    // 1. 监听局域网直连 SDP (UDP 信令通道)
    window.api.onDirectSdpReceived(async ({ ip, sdp, sdpType }) => {
      this.log(`📡 [UDP] 收到 WebRTC SDP ${sdpType} 自 ${ip}`);
      this.activePeerIp.value = ip;
      if (this.status.value !== 'connected') {
        this.status.value = 'handshaking';
        this.startHandshakeTimeout();
      }

      if (sdpType === 'offer') {
        await this.handleIncomingOffer(ip, sdp);
      } else if (sdpType === 'answer') {
        await this.handleIncomingAnswer(ip, sdp);
      }
    });

    // 2. 监听局域网直连 ICE Candidate (UDP 信令通道)
    window.api.onDirectIceReceived(async ({ ip, candidate }) => {
      this.log(`📡 [UDP] 收到 ICE Candidate 自 ${ip}`);
      this.handleIncomingIce(candidate);
    });

    // 3. 监听极速 HTTP 信令通道
    if (window.api.onHttpSignalReceived) {
      window.api.onHttpSignalReceived(async ({ type, sdp, candidates, ip, reqId }) => {
        this.log(`📡 [HTTP] 收到来自 ${ip} 的极速信令 (Type: ${type}, Candidates: ${candidates?.length || 0})`);
        this.activePeerIp.value = ip;
        if (this.status.value !== 'connected') {
          this.status.value = 'handshaking';
          this.startHandshakeTimeout();
        }

        if (type === 'offer') {
          const answer = await this.handleIncomingOffer(ip, sdp, false);
          if (answer) {
            window.api.respondHttpSignal({
              reqId,
              success: true,
              sdp: answer.sdp,
              candidates: answer.candidates || []
            });
          } else {
            window.api.respondHttpSignal({ reqId, success: false, error: 'Failed to generate answer' });
          }

          if (candidates && Array.isArray(candidates)) {
            for (const cand of candidates) {
              this.handleIncomingIce(cand);
            }
          }
        }
      });
    }
  }

  /**
   * 处理对端发来的 Offer SDP 并生成 Answer SDP
   */
  async handleIncomingOffer(ip, sdp, sendUdpResponse = true) {
    if (this.isProcessingOffer || this.hasGeneratedAnswer) {
      this.log(`[WebRTC] 已有 Offer 在处理中或已生成 Answer，跳过重复 Offer`);
      return null;
    }

    if (this.peerConnection && this.dataChannel && this.dataChannel.readyState === 'open') {
      this.log(`[WebRTC] 直连通道已处于 Open 状态，忽略重复 Offer`);
      return null;
    }

    this.isProcessingOffer = true;
    try {
      const savedCandidates = [...this.pendingDirectIceCandidates];
      this.cleanup();
      this.isProcessingOffer = true;
      this.pendingDirectIceCandidates.push(...savedCandidates);

      const configuration = { iceServers: [] };
      this.peerConnection = new RTCPeerConnection(configuration);
      this._setupPeerConnectionListeners(this.peerConnection);

      const gatheredCandidates = [];
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          gatheredCandidates.push(event.candidate);
          if (sendUdpResponse && window.api) {
            window.api.sendUdpIce(ip, JSON.stringify(event.candidate));
          }
        }
      };

      this.peerConnection.ondatachannel = (event) => {
        this.log(`[UDP] 监听到数据通道创建: ${event.channel.label}`);
        if (event.channel.label === 'photo_sync') {
          this.dataChannel = event.channel;
          if (this.onDataChannelCallback) {
            this.onDataChannelCallback(this.dataChannel);
          } else {
            this._bindDataChannel(this.dataChannel);
          }
        }
      };

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.hasGeneratedAnswer = true;

      // 冲刷此前排队的 ICE 候选
      if (this.pendingDirectIceCandidates.length > 0) {
        for (const cand of this.pendingDirectIceCandidates) {
          try { await this.peerConnection.addIceCandidate(cand); } catch (_) {}
        }
        this.pendingDirectIceCandidates.length = 0;
      }

      // 若通过 HTTP 返回，等待短暂 300ms 收集本地网卡 candidate 行
      if (!sendUdpResponse) {
        await new Promise((resolve) => {
          let resolved = false;
          const timer = setTimeout(() => {
            if (!resolved) { resolved = true; resolve(); }
          }, 300);

          if (this.peerConnection.iceGatheringState === 'complete') {
            clearTimeout(timer);
            resolve();
          }
        });
      }

      const finalSdp = this.peerConnection.localDescription?.sdp || answer.sdp;
      this.log(`📡 成功生成 Answer SDP`);
      if (sendUdpResponse && window.api) {
        await window.api.sendUdpSdp(ip, finalSdp, 'answer');
      }
      return { sdp: finalSdp, candidates: gatheredCandidates };
    } catch (err) {
      this.log(`❌ [WebRTC] 处理 Offer 异常: ${err.message}`);
      return null;
    } finally {
      this.isProcessingOffer = false;
    }
  }

  async handleIncomingAnswer(ip, sdp) {
    if (!this.peerConnection) return;
    if (this.peerConnection.signalingState === 'stable') {
      this.log(`[WebRTC] 连接已处于 Stable 状态，忽略重复 Answer`);
      return;
    }
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
      if (this.pendingDirectIceCandidates.length > 0) {
        for (const cand of this.pendingDirectIceCandidates) {
          try { await this.peerConnection.addIceCandidate(cand); } catch (_) {}
        }
        this.pendingDirectIceCandidates.length = 0;
      }
    } catch (e) {
      this.log(`[WebRTC] 应用 Answer SDP 失败: ${e.message}`);
    }
  }

  handleIncomingIce(candidate) {
    try {
      const candidateObj = typeof candidate === 'string' ? JSON.parse(candidate) : candidate;
      if (!candidateObj || !candidateObj.candidate) return;
      const ice = new RTCIceCandidate(candidateObj);

      if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
        this.peerConnection.addIceCandidate(ice).catch(err => {
          this.log(`⚠️ 添加 ICE 候选失败: ${err.message}`);
        });
      } else {
        this.pendingDirectIceCandidates.push(ice);
      }
    } catch (e) {
      this.log(`⚠️ 解析 ICE 候选失败: ${e.message}`);
    }
  }

  _setupPeerConnectionListeners(pc) {
    pc.onconnectionstatechange = () => {
      this.log(`[WebRTC] 连接状态变更为: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        if (this.disconnectGraceTimer) {
          clearTimeout(this.disconnectGraceTimer);
          this.disconnectGraceTimer = null;
        }
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.log(`⚠️ WebRTC 通道中断 (State: ${pc.connectionState})`);
        this.handleDisconnect();
      } else if (pc.connectionState === 'disconnected') {
        if (!this.disconnectGraceTimer) {
          this.disconnectGraceTimer = setTimeout(() => {
            this.disconnectGraceTimer = null;
            if (this.peerConnection && (this.peerConnection.connectionState === 'disconnected' || this.peerConnection.connectionState === 'failed')) {
              this.log(`⚠️ WebRTC 保持超时断开 (State: ${this.peerConnection?.connectionState})`);
              this.handleDisconnect();
            }
          }, 5000);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      this.log(`[WebRTC] ICE 状态变更为: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        if (this.disconnectGraceTimer) {
          clearTimeout(this.disconnectGraceTimer);
          this.disconnectGraceTimer = null;
        }
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        this.log(`⚠️ ICE 状态中断 (State: ${pc.iceConnectionState})`);
        this.handleDisconnect();
      }
    };
  }

  _bindDataChannel(channel) {
    const handleOpen = () => {
      if (this.status.value === 'connected') return;
      this.clearHandshakeTimeout();
      this.status.value = 'connected';
      this.log(`🟢 WebRTC 直连数据通道已就绪 (Open)`);
      this._startHeartbeat(channel);

      if (this.onConnectedCallback) {
        this.onConnectedCallback(channel);
      }
    };

    if (channel.readyState === 'open') {
      handleOpen();
    } else {
      channel.onopen = handleOpen;
      // 容错看门狗：防止 Chromium 事件循环丢失 onopen 触发
      setTimeout(() => {
        if (channel.readyState === 'open' && this.status.value !== 'connected') {
          this.log(`[DataChannel] 补发检测：通道已处 open 状态，强制触发就绪`);
          handleOpen();
        }
      }, 1500);
    }

    channel.onclose = () => {
      this.log(`🔴 WebRTC 数据通道已关闭`);
      this.handleDisconnect();
    };

    channel.onerror = (err) => {
      this.log(`⚠️ WebRTC 数据通道错误: ${err?.message || err}`);
    };

    channel.onmessage = (event) => {
      if (this.status.value !== 'connected') {
        handleOpen();
      }
      this.lastHeartbeatTime = Date.now();

      const arrayBuffer = event.data;
      if (arrayBuffer.byteLength < 16) {
        return;
      }

      const view = new DataView(arrayBuffer);
      const fileId = view.getInt32(0, false);

      // 心跳探测：fileId === -1 为手机端 Ping
      if (fileId === -1) {
        const pongBuffer = new ArrayBuffer(16);
        const pongView = new DataView(pongBuffer);
        pongView.setInt32(0, -2, false);
        pongView.setInt32(4, 0, false);
        pongView.setInt32(8, 0, false);
        pongView.setInt32(12, 0, false);
        if (channel.readyState === 'open') {
          channel.send(pongBuffer);
        }
        return;
      }

      // 对端 Pong 回包
      if (fileId === -2) {
        this.lastHeartbeatTime = Date.now();
        return;
      }

      // 透传业务报文
      if (this.onPacketCallback) {
        this.onPacketCallback(fileId, arrayBuffer, view, channel);
      }
    };
  }

  _startHeartbeat(channel) {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.lastHeartbeatTime = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (!channel || channel.readyState !== 'open') {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
        return;
      }

      const diff = Date.now() - this.lastHeartbeatTime;
      if (diff > 12000) {
        this.log(`⚠️ 心跳超时 (12s 未收到手机响应)，断开并准备重连`);
        this.handleDisconnect();
        return;
      }

      // 发送 Ping 报文
      const pingBuffer = new ArrayBuffer(16);
      const pingView = new DataView(pingBuffer);
      pingView.setInt32(0, -1, false);
      pingView.setInt32(4, 0, false);
      pingView.setInt32(8, 0, false);
      pingView.setInt32(12, 0, false);
      try {
        channel.send(pingBuffer);
      } catch (_) {}
    }, 3000);
  }

  startHandshakeTimeout() {
    this.clearHandshakeTimeout();
    this.handshakeTimeoutTimer = setTimeout(() => {
      this.handshakeTimeoutTimer = null;
      if (this.status.value === 'handshaking') {
        this.log(`⚠️ 连接协商超时：未能在 25 秒内建立 WebRTC 通道，正在重新广播...`);
        this.cleanup();
        if (this.onHandshakeTimeoutCallback) {
          this.onHandshakeTimeoutCallback();
        }
      }
    }, 25000);
  }

  clearHandshakeTimeout() {
    if (this.handshakeTimeoutTimer) {
      clearTimeout(this.handshakeTimeoutTimer);
      this.handshakeTimeoutTimer = null;
    }
  }

  handleDisconnect() {
    this.cleanup();
    if (this.onDisconnectedCallback) {
      this.onDisconnectedCallback();
    }
  }

  cleanup() {
    this.clearHandshakeTimeout();
    if (this.disconnectGraceTimer) {
      clearTimeout(this.disconnectGraceTimer);
      this.disconnectGraceTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch (_) {}
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch (_) {}
      this.peerConnection = null;
    }
    this.isProcessingOffer = false;
    this.hasGeneratedAnswer = false;
    this.pendingDirectIceCandidates = [];
  }

  /**
   * 发送安全分片控制包
   */
  sendSafePacket(channel, realPacketType, dataObj) {
    if (!channel || channel.readyState !== 'open') return false;
    try {
      const payloadStr = JSON.stringify(dataObj);
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(payloadStr);

      const CHUNK_SIZE = 60 * 1024; // 60KB分片
      const totalChunks = Math.ceil(payloadBytes.length / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, payloadBytes.length);
        const chunk = payloadBytes.subarray(start, end);

        const packet = new Uint8Array(16 + chunk.length);
        const view = new DataView(packet.buffer);
        view.setInt32(0, -5, false); // -5 表示分片大包
        view.setInt32(4, realPacketType, false);
        view.setInt32(8, i, false);
        view.setInt32(12, totalChunks, false);

        packet.set(chunk, 16);
        channel.send(packet);
      }
      return true;
    } catch (e) {
      this.log(`❌ 发送分片数据包失败: ${e.message}`);
      return false;
    }
  }
}

export const connectionManager = new ConnectionManager();
