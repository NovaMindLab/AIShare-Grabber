/**
 * ShareCLIP WebShare WebRTC Peer Connection & DataChannel Receiver
 * Fully compatible with ShareCLIP Flutter Android App 16-byte chunked streaming protocol.
 */

export class WebRtcReceiver {
  constructor() {
    this.pc = null;
    this.dataChannel = null;
    this.isConnected = false;
    this.incomingFiles = new Map(); // fileId -> { chunks: [], received: 0, total: 0, meta: {} }
    this.pendingIceCandidates = [];
    
    // Callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onPhotoReceived = null;
    this.onProgress = null;
    this.onLog = null;
    this.onIceCandidate = null;

    // Heartbeat tracking
    this.lastHeartbeatTime = Date.now();
    this.heartbeatInterval = null;

    // Speed tracking
    this.bytesInLastSecond = 0;
    this.currentSpeedKbps = 0;
    this.speedTimer = null;
  }

  async initPeerConnection() {
    this._cleanup();

    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      sdpSemantics: 'unified-plan'
    };

    this.pc = new RTCPeerConnection(config);

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const iceState = this.pc ? this.pc.iceConnectionState : 'closed';
      this._log(`[WebRTC] ICE Connection State: ${iceState}`);
      if (iceState === 'connected' || iceState === 'completed') {
        this._markConnected();
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc ? this.pc.connectionState : 'closed';
      this._log(`[WebRTC] PeerConnection State: ${state}`);
      if (state === 'connected') {
        this._markConnected();
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this._markDisconnected();
      }
    };

    this.pc.ondatachannel = (event) => {
      this._log(`[WebRTC] Remote DataChannel received: label=${event.channel.label}, readyState=${event.channel.readyState}`);
      this._setupDataChannel(event.channel);
    };
  }

  async handleOffer(offerSdp) {
    if (!this.pc) {
      await this.initPeerConnection();
    }

    this._log('[WebRTC] Setting Remote Description (Offer)...');
    await this.pc.setRemoteDescription(new RTCSessionDescription({
      type: 'offer',
      sdp: offerSdp
    }));

    // Drain queued ICE candidates
    if (this.pendingIceCandidates.length > 0) {
      this._log(`[WebRTC] Draining ${this.pendingIceCandidates.length} queued ICE candidates...`);
      for (const cand of this.pendingIceCandidates) {
        try {
          await this.pc.addIceCandidate(cand);
        } catch (_) {}
      }
      this.pendingIceCandidates = [];
    }

    this._log('[WebRTC] Creating SDP Answer...');
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this._log(`[WebRTC] Local SDP Answer ready (${answer.sdp.length}B)`);
    return answer.sdp;
  }

  async addIceCandidate(candidateData) {
    let candidateObj = candidateData;
    if (typeof candidateData === 'string') {
      try {
        candidateObj = JSON.parse(candidateData);
      } catch (_) {}
    }

    const rtcCand = new RTCIceCandidate(candidateObj);

    if (!this.pc || !this.pc.remoteDescription) {
      this.pendingIceCandidates.push(rtcCand);
      return;
    }

    try {
      await this.pc.addIceCandidate(rtcCand);
    } catch (e) {
      this._log(`[WebRTC] Error adding ICE candidate: ${e.message}`);
    }
  }

  _setupDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.binaryType = 'arraybuffer';

    const onChannelOpen = () => {
      this._log('🎉 [WebRTC] DataChannel OPEN! Connection 100% active.');
      this._markConnected();
      this._sendHandshakeResponse();
    };

    if (channel.readyState === 'open') {
      onChannelOpen();
    } else {
      channel.onopen = onChannelOpen;
    }

    channel.onclose = () => {
      this._log('[WebRTC] DataChannel closed.');
      this._markDisconnected();
    };

    channel.onerror = (err) => {
      this._log(`[WebRTC] DataChannel error: ${err.message || err}`);
    };

    channel.onmessage = (event) => {
      this._handleIncomingPacket(event.data);
    };
  }

  _markConnected() {
    if (!this.isConnected) {
      this.isConnected = true;
      this._startHeartbeatGuard();
      this._startSpeedMeter();
      if (this.onConnected) this.onConnected();
    }
  }

  _markDisconnected() {
    if (this.isConnected) {
      this.isConnected = false;
      this._stopHeartbeatGuard();
      this._stopSpeedMeter();
      if (this.onDisconnected) this.onDisconnected();
    }
  }

  _handleIncomingPacket(arrayBuffer) {
    if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 16) {
      return;
    }

    this._markConnected();
    this.lastHeartbeatTime = Date.now();
    this.bytesInLastSecond += arrayBuffer.byteLength;

    const dataView = new DataView(arrayBuffer);
    const fileId = dataView.getInt32(0, false);      // Big-Endian
    const chunkIndex = dataView.getInt32(4, false);
    const totalChunks = dataView.getInt32(8, false);
    const payloadSize = dataView.getInt32(12, false);
    const payload = arrayBuffer.slice(16);

    // Heartbeat Ping -> Send Pong
    if (fileId === -1) {
      this._sendPong();
      return;
    }

    // Heartbeat Pong
    if (fileId === -2) {
      return;
    }

    // Metadata Handshake request
    if (fileId === -3 || fileId === -5) {
      try {
        const text = new TextDecoder().decode(payload);
        this._log(`[WebRTC] Handshake packet: ${text.slice(0, 80)}...`);
      } catch (_) {}
      return;
    }

    // Normal Photo Binary Chunk
    if (!this.incomingFiles.has(fileId)) {
      this.incomingFiles.set(fileId, {
        chunks: new Array(totalChunks),
        received: 0,
        totalChunks,
        totalBytes: 0
      });
    }

    const fileRecord = this.incomingFiles.get(fileId);
    fileRecord.chunks[chunkIndex] = new Uint8Array(payload);
    fileRecord.received++;
    fileRecord.totalBytes += payload.byteLength;

    // Report progress with 150ms throttling to avoid main thread UI lag
    const now = Date.now();
    if (!fileRecord.lastProgressTime || now - fileRecord.lastProgressTime > 150 || fileRecord.received >= totalChunks) {
      fileRecord.lastProgressTime = now;
      if (this.onProgress) {
        this.onProgress({
          fileId,
          chunkIndex,
          totalChunks,
          receivedChunks: fileRecord.received,
          speedKbps: this.currentSpeedKbps
        });
      }
    }

    // All chunks received -> Reassemble
    if (fileRecord.received >= totalChunks) {
      this._log(`📸 [WebRTC] Complete file received (fileId=${fileId}, totalChunks=${totalChunks}, totalBytes=${fileRecord.totalBytes})`);
      
      const completeBuffer = new Uint8Array(fileRecord.totalBytes);
      let offset = 0;
      for (let i = 0; i < totalChunks; i++) {
        const chunk = fileRecord.chunks[i];
        if (chunk) {
          completeBuffer.set(chunk, offset);
          offset += chunk.length;
        }
      }

      this.incomingFiles.delete(fileId);

      // Detect MIME type
      const mime = this._detectMimeType(completeBuffer);
      const filename = `photo_${Date.now()}_${fileId}.${mime.split('/')[1] || 'jpg'}`;

      if (this.onPhotoReceived) {
        this.onPhotoReceived({
          fileId,
          buffer: completeBuffer.buffer,
          mime,
          filename,
          size: fileRecord.totalBytes
        });
      }
    }
  }

  _detectMimeType(uint8) {
    if (uint8.length >= 4) {
      if (uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) return 'image/jpeg';
      if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) return 'image/png';
      if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) return 'image/gif';
      if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46) return 'image/webp';
    }
    return 'image/jpeg';
  }

  _sendPong() {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const pongBuffer = new ArrayBuffer(16);
      const view = new DataView(pongBuffer);
      view.setInt32(0, -2, false); // Pong header
      view.setInt32(4, 0, false);
      view.setInt32(8, 0, false);
      view.setInt32(12, 0, false);
      try {
        this.dataChannel.send(pongBuffer);
      } catch (_) {}
    }
  }

  _sendHandshakeResponse() {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const responsePayload = JSON.stringify({
        status: "ready",
        device: "ShareCLIP WebShare (Chrome)",
        version: "1.0.0",
        synced_ids: []
      });
      const payloadBytes = new TextEncoder().encode(responsePayload);
      const packet = new ArrayBuffer(16 + payloadBytes.length);
      const view = new DataView(packet);
      view.setInt32(0, -4, false); // Handshake response code
      view.setInt32(4, 0, false);
      view.setInt32(8, 1, false);
      view.setInt32(12, payloadBytes.length, false);
      new Uint8Array(packet, 16).set(payloadBytes);
      try {
        this.dataChannel.send(packet);
        this._log('[WebRTC] Sent handshake response (-4) to phone.');
      } catch (_) {}
    }
  }

  requestThumbnailSync() {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const packet = new ArrayBuffer(16);
      const view = new DataView(packet);
      view.setInt32(0, -6, false); // file_id = -6 (Thumbnail sync trigger)
      view.setInt32(4, 0, false);
      view.setInt32(8, 0, false);
      view.setInt32(12, 0, false);
      try {
        this.dataChannel.send(packet);
        this._log('📱 [WebRTC] 触发手机全量相册缩略图同步 (fileId = -6)...');
      } catch (err) {
        this._log(`❌ [WebRTC] 发送同步指令失败: ${err.message}`);
      }
    }
  }

  requestFullAlbumSync() {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const packet = new ArrayBuffer(16);
      const view = new DataView(packet);
      view.setInt32(0, -7, false); // file_id = -7 (Full album sync trigger)
      view.setInt32(4, 0, false);
      view.setInt32(8, 0, false);
      view.setInt32(12, 0, false);
      try {
        this.dataChannel.send(packet);
        this._log('📱 [WebRTC] 触发手机全量高清原图同步 (fileId = -7)...');
      } catch (err) {
        this._log(`❌ [WebRTC] 发送原图同步指令失败: ${err.message}`);
      }
    }
  }

  _startHeartbeatGuard() {
    this._stopHeartbeatGuard();
    this.lastHeartbeatTime = Date.now();
    this.heartbeatInterval = setInterval(() => {
      const elapsed = Date.now() - this.lastHeartbeatTime;
      if (elapsed > 180000) { // 180s threshold
        this._log('⚠️ [WebRTC] Heartbeat timeout (180s without activity).');
      }
    }, 5000);
  }

  _stopHeartbeatGuard() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  _startSpeedMeter() {
    this._stopSpeedMeter();
    this.speedTimer = setInterval(() => {
      this.currentSpeedKbps = Math.round((this.bytesInLastSecond * 8) / 1024);
      this.bytesInLastSecond = 0;
    }, 1000);
  }

  _stopSpeedMeter() {
    if (this.speedTimer) {
      clearInterval(this.speedTimer);
      this.speedTimer = null;
    }
  }

  _log(msg) {
    console.log(msg);
    if (this.onLog) this.onLog(msg);
  }

  _cleanup() {
    this._stopHeartbeatGuard();
    this._stopSpeedMeter();
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch (_) {}
      this.dataChannel = null;
    }
    if (this.pc) {
      try { this.pc.close(); } catch (_) {}
      this.pc = null;
    }
    this.isConnected = false;
    this.incomingFiles.clear();
    this.pendingIceCandidates = [];
  }
}
