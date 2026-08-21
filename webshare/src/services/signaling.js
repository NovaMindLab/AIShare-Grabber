/**
 * ShareCLIP WebShare Signaling Client
 * Bridges signaling messages between PC Chrome and the local Node.js relay server.
 */

export class SignalingClient {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.isConnected = false;
    this.onOffer = null;
    this.onIce = null;
    this.onStatusChange = null;
    this.onServerInfo = null;
    this.onLog = null;
  }

  connect(sessionId, wsUrl = null) {
    this.sessionId = sessionId;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultUrl = `${protocol}//${location.host}/ws`;
    const targetUrl = wsUrl || defaultUrl;

    this._log(`[Signaling] Connecting to relay: ${targetUrl}...`);

    try {
      this.ws = new WebSocket(targetUrl);
    } catch (e) {
      this._log(`[Signaling] Failed to construct WebSocket: ${e.message}`);
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this._log(`[Signaling] Connected to local relay. Registering Session: ${this.sessionId}`);
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
        this._log(`[Signaling] Message parse error: ${err.message}`);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this._log('[Signaling] Disconnected from relay.');
      if (this.onStatusChange) this.onStatusChange('disconnected');
    };

    this.ws.onerror = (err) => {
      this._log(`[Signaling] WebSocket error: ${err.message || 'Connection refused'}`);
    };
  }

  _handleMessage(msg) {
    if (msg.type === 'server_info') {
      this._log(`[Signaling] Received server info. Detected LAN IPs: ${msg.localIps?.join(', ')}`);
      if (this.onServerInfo) this.onServerInfo(msg);
    } else if (msg.type === 'offer') {
      this._log(`[Signaling] 📥 Received SDP Offer from phone (${msg.sdp.length} bytes)`);
      if (this.onOffer) this.onOffer(msg.sdp);
    } else if (msg.type === 'ice') {
      this._log(`[Signaling] 📥 Received ICE candidate from phone`);
      if (this.onIce) this.onIce(msg.candidate);
    } else if (msg.type === 'log') {
      this._log(msg.message);
    }
  }

  sendAnswer(sdp) {
    this._log(`[Signaling] 📤 Sending SDP Answer to phone (${sdp.length} bytes)...`);
    this._send({
      type: 'answer',
      sessionId: this.sessionId,
      sdp
    });
  }

  sendIce(candidate) {
    this._log(`[Signaling] 📤 Sending ICE Candidate to phone...`);
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
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
