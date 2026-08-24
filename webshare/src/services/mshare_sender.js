/**
 * ShareCLIP MShare - WebRTC Sender Engine for Mobile & iOS
 * Fully compliant with the 16-byte Big-Endian chunked binary protocol.
 * Features bufferedAmount backpressure control for 4K video and lossless photo streams.
 */

import { SignalingClient, getDefaultSignalingUrl } from './signaling.js';

export class MShareSender {
  constructor() {
    this.pc = null;
    this.dataChannel = null;
    this.signaling = null;
    this.sessionId = null;
    this.isConnected = false;
    this.isConnecting = false;
    
    // File sending queue
    this.fileQueue = [];
    this.isSending = false;
    this.currentSendingFile = null;
    this.nextFileId = 1;

    // Speed tracking
    this.bytesSentSinceLastCheck = 0;
    this.currentSpeedKbps = 0;
    this.speedInterval = null;

    // Heartbeat
    this.heartbeatTimer = null;

    // Callbacks
    this.onConnected = null;
    this.onDisconnected = null;
    this.onLog = null;
    this.onSpeedUpdate = null;
    this.onQueueUpdate = null;
    this.onFileProgress = null;
    this.onFileComplete = null;
    this.onFileError = null;
  }

  _log(msg) {
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${time}] [MShareSender] ${msg}`);
    if (this.onLog) this.onLog(`[${time}] ${msg}`);
  }

  /**
   * Connect to PC using Session ID and optional custom signaling/IP
   */
  async connect(sessionId, customSignalingUrl = '') {
    if (this.isConnecting || this.isConnected) return;
    this.isConnecting = true;
    this.sessionId = sessionId.trim().toUpperCase();
    const sigUrl = customSignalingUrl || getDefaultSignalingUrl();

    this._log(`🚀 Initiating connection to PC Session: [${this.sessionId}] via [${sigUrl}]`);

    this.signaling = new SignalingClient();
    this.signaling.onLog = (l) => this._log(l);

    this.signaling.onAnswer = async (answerSdp) => {
      this._log('📥 Received SDP Answer from PC. Setting Remote Description...');
      try {
        if (this.pc && this.pc.signalingState !== 'closed') {
          await this.pc.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: answerSdp
          }));
          this._log('✅ Remote Description (Answer) set successfully.');
        }
      } catch (err) {
        this._log(`❌ Failed to set Remote Description: ${err.message}`);
      }
    };

    this.signaling.onIceCandidate = async (candidate) => {
      try {
        if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
          this._log('❄️ ICE Candidate added from PC');
        }
      } catch (_) {}
    };

    this.signaling.connect(this.sessionId, sigUrl);

    await this._initPeerConnection();
  }

  async _initPeerConnection() {
    this._cleanupPeer();

    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      sdpSemantics: 'unified-plan'
    };

    this.pc = new RTCPeerConnection(config);

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.signaling) {
        this.signaling.sendIceCandidate(event.candidate);
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

    // Create DataChannel 'fileTransfer' with reliable delivery
    this.dataChannel = this.pc.createDataChannel('fileTransfer', {
      ordered: true
    });
    this.dataChannel.binaryType = 'arraybuffer';
    this.dataChannel.bufferedAmountLowThreshold = 512 * 1024; // 512 KB

    this._setupDataChannel(this.dataChannel);

    // Create and send Offer
    this._log('📤 Creating SDP Offer for PC...');
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.signaling.sendOffer(offer.sdp);
    this._log('📡 SDP Offer dispatched via signaling.');
  }

  _setupDataChannel(dc) {
    dc.onopen = () => {
      this._log('🎉 DataChannel (SCTP) opened successfully!');
      this._markConnected();
      this._sendHandshake();
    };

    dc.onclose = () => {
      this._log('🔌 DataChannel closed.');
      this._markDisconnected();
    };

    dc.onerror = (err) => {
      this._log(`❌ DataChannel error: ${err.message || 'unknown'}`);
    };

    dc.onmessage = (event) => {
      this._handleControlMessage(event.data);
    };
  }

  _markConnected() {
    if (this.isConnected) return;
    this.isConnected = true;
    this.isConnecting = false;
    this._startSpeedTracking();
    this._startHeartbeat();
    if (this.onConnected) this.onConnected({ sessionId: this.sessionId });
    this._processQueue();
  }

  _markDisconnected() {
    this.isConnected = false;
    this.isConnecting = false;
    this._stopSpeedTracking();
    this._stopHeartbeat();
    if (this.onDisconnected) this.onDisconnected();
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        // Send Ping packet (fileId: -1)
        this._sendControlPacket(-1, 'PING');
      }
    }, 3000);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  _sendHandshake() {
    const handshakeData = {
      device: 'iPhone (MShare PWA)',
      platform: 'iOS Web',
      version: '1.2.94',
      timestamp: Date.now()
    };
    this._log(`🤝 Sending Handshake offer to PC...`);
    this._sendControlPacket(-3, JSON.stringify(handshakeData));
  }

  _sendControlPacket(controlId, payloadStr) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payloadStr);
    const packet = new Uint8Array(16 + payloadBytes.length);
    const view = new DataView(packet.buffer);

    view.setInt32(0, controlId, false);
    view.setInt32(4, 0, false);
    view.setInt32(8, 1, false);
    view.setInt32(12, payloadBytes.length, false);
    packet.set(payloadBytes, 16);

    try {
      this.dataChannel.send(packet.buffer);
    } catch (_) {}
  }

  _handleControlMessage(data) {
    if (!(data instanceof ArrayBuffer)) return;
    if (data.byteLength < 16) return;

    const view = new DataView(data);
    const fileId = view.getInt32(0, false);
    const payloadSize = view.getInt32(12, false);
    const payloadBuffer = data.slice(16, 16 + payloadSize);

    if (fileId === -2) {
      // Heartbeat Pong
    } else if (fileId === -4) {
      // Handshake Confirmed
      const str = new TextDecoder().decode(payloadBuffer);
      this._log(`✨ PC confirmed handshake: ${str}`);
    }
  }

  _startSpeedTracking() {
    this._stopSpeedTracking();
    this.speedInterval = setInterval(() => {
      this.currentSpeedKbps = Math.round((this.bytesSentSinceLastCheck * 8) / 1024);
      this.bytesSentSinceLastCheck = 0;
      if (this.onSpeedUpdate) this.onSpeedUpdate(this.currentSpeedKbps);
    }, 1000);
  }

  _stopSpeedTracking() {
    if (this.speedInterval) clearInterval(this.speedInterval);
    this.speedInterval = null;
    this.currentSpeedKbps = 0;
  }

  /**
   * Enqueue files for transmission
   */
  enqueueFiles(files) {
    const newItems = Array.from(files).map(file => {
      const id = this.nextFileId++;
      let previewUrl = '';
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        previewUrl,
        progress: 0,
        bytesSent: 0,
        status: 'pending', // 'pending' | 'sending' | 'completed' | 'error'
        error: null,
        startTime: null,
        durationSec: 0
      };
    });

    this.fileQueue.push(...newItems);
    if (this.onQueueUpdate) this.onQueueUpdate([...this.fileQueue]);
    this._processQueue();
    return newItems;
  }

  cancelFile(id) {
    const idx = this.fileQueue.findIndex(f => f.id === id);
    if (idx !== -1) {
      const item = this.fileQueue[idx];
      if (item.status === 'pending') {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        this.fileQueue.splice(idx, 1);
        if (this.onQueueUpdate) this.onQueueUpdate([...this.fileQueue]);
      }
    }
  }

  clearCompleted() {
    this.fileQueue = this.fileQueue.filter(item => {
      if (item.status === 'completed' || item.status === 'error') {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        return false;
      }
      return true;
    });
    if (this.onQueueUpdate) this.onQueueUpdate([...this.fileQueue]);
  }

  async _processQueue() {
    if (this.isSending || !this.isConnected || this.fileQueue.length === 0) return;

    const nextItem = this.fileQueue.find(item => item.status === 'pending');
    if (!nextItem) return;

    this.isSending = true;
    this.currentSendingFile = nextItem;
    nextItem.status = 'sending';
    nextItem.startTime = Date.now();
    if (this.onQueueUpdate) this.onQueueUpdate([...this.fileQueue]);

    try {
      await this._sendFileChunks(nextItem);
      nextItem.status = 'completed';
      nextItem.progress = 100;
      nextItem.durationSec = ((Date.now() - nextItem.startTime) / 1000).toFixed(1);
      if (this.onFileComplete) this.onFileComplete(nextItem);
    } catch (err) {
      this._log(`❌ Error sending file ${nextItem.name}: ${err.message}`);
      nextItem.status = 'error';
      nextItem.error = err.message;
      if (this.onFileError) this.onFileError(nextItem, err);
    } finally {
      this.isSending = false;
      this.currentSendingFile = null;
      if (this.onQueueUpdate) this.onQueueUpdate([...this.fileQueue]);
      // Process next in line
      setTimeout(() => this._processQueue(), 50);
    }
  }

  /**
   * Stream a single file in 64KB chunks with 16-byte protocol header and backpressure flow control
   */
  async _sendFileChunks(item) {
    const file = item.file;
    const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1;
    const fileId = item.id;

    this._log(`🚀 Starting stream for [${item.name}] (${(file.size / (1024 * 1024)).toFixed(2)} MB, ${totalChunks} chunks)`);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (!this.isConnected || !this.dataChannel || this.dataChannel.readyState !== 'open') {
        throw new Error('Connection lost during transmission');
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const slice = file.slice(start, end);
      const chunkBuffer = await slice.arrayBuffer();

      // Backpressure check: wait if buffer exceeds 2MB
      if (this.dataChannel.bufferedAmount > 2 * 1024 * 1024) {
        await this._waitForBufferDrain();
      }

      // Build 16-byte Big-Endian protocol frame
      const packet = new Uint8Array(16 + chunkBuffer.byteLength);
      const view = new DataView(packet.buffer);

      view.setInt32(0, fileId, false);
      view.setInt32(4, chunkIndex, false);
      view.setInt32(8, totalChunks, false);
      view.setInt32(12, chunkBuffer.byteLength, false);
      packet.set(new Uint8Array(chunkBuffer), 16);

      this.dataChannel.send(packet.buffer);

      // Track progress
      const bytesInThisChunk = chunkBuffer.byteLength;
      this.bytesSentSinceLastCheck += bytesInThisChunk;
      item.bytesSent += bytesInThisChunk;
      item.progress = Math.min(99, Math.round((item.bytesSent / file.size) * 100));

      if (this.onFileProgress) {
        this.onFileProgress(item, item.progress, this.currentSpeedKbps);
      }
    }

    this._log(`✅ All ${totalChunks} chunks sent for [${item.name}]`);
  }

  _waitForBufferDrain() {
    return new Promise((resolve) => {
      const onLow = () => {
        this.dataChannel.removeEventListener('bufferedamountlow', onLow);
        resolve();
      };
      this.dataChannel.addEventListener('bufferedamountlow', onLow);
      // Safety timeout in case event is missed
      setTimeout(onLow, 500);
    });
  }

  disconnect() {
    this._log('Disconnecting MShare sender...');
    this._cleanupPeer();
    if (this.signaling) {
      this.signaling.disconnect();
      this.signaling = null;
    }
    this._markDisconnected();
  }

  _cleanupPeer() {
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch (_) {}
      this.dataChannel = null;
    }
    if (this.pc) {
      try { this.pc.close(); } catch (_) {}
      this.pc = null;
    }
  }
}
