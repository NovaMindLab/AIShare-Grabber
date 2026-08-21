/**
 * ShareCLIP WebShare Signaling Client
 * Bridges WebRTC signaling between PC Chrome and the Android client.
 * Supports both local development (Vite/Node) and public static hosting (GitHub Pages / Cloudflare).
 */

export function getDefaultSignalingUrl() {
  const host = typeof location !== 'undefined' ? location.hostname : 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
  
  if (isLocal) {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}/ws`;
  }
  
  // Public High-Availability WebSocket Relay for GitHub Pages
  return `wss://free.blr2.piesocket.com/v3/shareclip-webshare?api_key=VC3oafD3mufaKZkJxmUyQwOZZM6XXSVjWkgDxRVu&notify_self=0`;
}

export class SignalingClient {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.relayUrl = null;
    this.isConnected = false;
    this.onOffer = null;
    this.onIce = null;
    this.onStatusChange = null;
    this.onServerInfo = null;
    this.onLog = null;
  }

  connect(sessionId, customWsUrl = null) {
    this.disconnect();
    this.sessionId = sessionId;
    this.relayUrl = customWsUrl || getDefaultSignalingUrl();

    this._log(`[Signaling] 正在连接信令服务器: ${this.relayUrl}...`);

    try {
      this.ws = new WebSocket(this.relayUrl);
    } catch (e) {
      this._log(`[Signaling] 创建 WebSocket 失败: ${e.message}`);
      if (this.onStatusChange) this.onStatusChange('error');
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this._log(`[Signaling] 🟢 信令通道已连接！注册会话口令: ${this.sessionId}`);
      this._send({
        type: 'register_session',
        sessionId: this.sessionId
      });
      if (this.onStatusChange) this.onStatusChange('ready');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch (err) {
        this._log(`[Signaling] 消息解析异常: ${err.message}`);
      }
    };

    this.ws.onclose = () => {
      const wasConnected = this.isConnected;
      this.isConnected = false;
      if (wasConnected) {
        this._log('[Signaling] 信令通道已断开。');
      }
      if (this.onStatusChange) this.onStatusChange('disconnected');
    };

    this.ws.onerror = (err) => {
      this._log(`[Signaling] ⚠️ 信令通道连接异常 (若为公网环境，可在下方配置中填入自定义信令或局域网IP)`);
    };
  }

  _handleMessage(msg) {
    // Filter session ID if present
    if (msg.sessionId && msg.sessionId !== this.sessionId) {
      return;
    }

    if (msg.type === 'server_info') {
      this._log(`[Signaling] 收到服务器配置. 局域网 IP: ${msg.localIps?.join(', ')}`);
      if (this.onServerInfo) this.onServerInfo(msg);
    } else if (msg.type === 'offer' || (msg.type === 'ShareCLIP_Direct_Sdp' && msg.sdpType === 'offer')) {
      const sdp = msg.sdp;
      if (sdp) {
        this._log(`[Signaling] 📥 收到手机端 SDP Offer (${sdp.length} 字节)`);
        if (this.onOffer) this.onOffer(sdp);
      }
    } else if (msg.type === 'ice' || msg.type === 'ShareCLIP_Direct_Ice') {
      const candidate = msg.candidate;
      if (candidate) {
        this._log(`[Signaling] 📥 收到手机端 ICE 候选信息`);
        if (this.onIce) this.onIce(candidate);
      }
    } else if (msg.type === 'log') {
      this._log(msg.message);
    }
  }

  sendAnswer(sdp) {
    this._log(`[Signaling] 📤 发送 SDP Answer 到手机 (${sdp.length} 字节)...`);
    this._send({
      type: 'answer',
      sessionId: this.sessionId,
      sdp
    });
  }

  sendIce(candidate) {
    this._log(`[Signaling] 📤 发送 ICE 候选信息到手机...`);
    this._send({
      type: 'ice',
      sessionId: this.sessionId,
      candidate: typeof candidate === 'string' ? candidate : JSON.stringify(candidate)
    });
  }

  _send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  _log(text) {
    console.log(text);
    if (this.onLog) this.onLog(text);
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
  }
}
