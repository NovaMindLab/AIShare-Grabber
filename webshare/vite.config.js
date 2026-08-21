import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dgram from 'dgram';
import os from 'os';
import { WebSocketServer } from 'ws';

function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('169.254.') && !iface.address.startsWith('127.')) {
          ips.push(iface.address);
        }
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

// Vite plugin providing UDP 15185 Signaling & /ws WebSocket relay directly inside Vite dev server
function webshareSignalingPlugin() {
  return {
    name: 'webshare-signaling-plugin',
    configureServer(server) {
      const UDP_PORT = 15185;
      const registeredClients = new Map();
      let lastMobileInfo = null;

      const wss = new WebSocketServer({ noServer: true });

      server.httpServer.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname === '/ws') {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
          });
        }
      });

      const udpSocket = dgram.createSocket('udp4');

      udpSocket.on('message', (msg, rinfo) => {
        try {
          const rawStr = msg.toString('utf-8');
          const payload = JSON.parse(rawStr);
          lastMobileInfo = { address: rinfo.address, port: rinfo.port };
          const time = new Date().toISOString().split('T')[1].slice(0, 8);
          console.log(`[${time}] 📱 [UDP In] From ${rinfo.address}:${rinfo.port} -> ${payload.type}`);

          for (const [sessionId, ws] of registeredClients.entries()) {
            if (ws.readyState === 1) {
              if (payload.type === 'ShareCLIP_Direct_Sdp' && payload.sdpType === 'offer') {
                console.log(`[${time}] ➡️ [Relay] Forwarding SDP Offer to PC Chrome (${sessionId})`);
                ws.send(JSON.stringify({
                  type: 'offer',
                  sdp: payload.sdp,
                  sender_uuid: payload.sender_uuid
                }));
              } else if (payload.type === 'ShareCLIP_Direct_Ice') {
                console.log(`[${time}] ➡️ [Relay] Forwarding ICE Candidate to PC Chrome`);
                ws.send(JSON.stringify({
                  type: 'ice',
                  candidate: payload.candidate
                }));
              }
            }
          }
        } catch (_) {}
      });

      udpSocket.on('error', (err) => {
        console.warn('[UDP Signaling Error]:', err.message);
      });

      try {
        udpSocket.bind(UDP_PORT, '0.0.0.0', () => {
          console.log(`📡 [Vite Plugin] UDP Signaling active on 0.0.0.0:${UDP_PORT}`);
        });
      } catch (e) {
        console.warn(`[Vite Plugin] Could not bind UDP ${UDP_PORT}:`, e.message);
      }

      wss.on('connection', (ws) => {
        let clientSessionId = null;
        const localIps = getLocalIps();

        // Send physical LAN IPs to Chrome immediately
        ws.send(JSON.stringify({
          type: 'server_info',
          localIps,
          httpPort: 3000,
          udpPort: UDP_PORT
        }));

        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString('utf-8'));
            if (msg.type === 'register_session') {
              clientSessionId = msg.sessionId;
              registeredClients.set(clientSessionId, ws);
              console.log(`✨ [Signaling] Registered Session: ${clientSessionId}`);
            } else if (msg.type === 'answer') {
              console.log(`⬅️ [Signaling] Forwarding SDP Answer to mobile via UDP...`);
              sendUdpToMobile({
                type: 'ShareCLIP_Direct_Sdp',
                sdp: msg.sdp,
                sdpType: 'answer'
              });
            } else if (msg.type === 'ice') {
              sendUdpToMobile({
                type: 'ShareCLIP_Direct_Ice',
                candidate: msg.candidate
              });
            }
          } catch (_) {}
        });

        ws.on('close', () => {
          if (clientSessionId) registeredClients.delete(clientSessionId);
        });
      });

      function sendUdpToMobile(payload) {
        if (!lastMobileInfo) return;
        const buffer = Buffer.from(JSON.stringify(payload), 'utf-8');
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            try {
              udpSocket.send(buffer, UDP_PORT, lastMobileInfo.address);
              if (lastMobileInfo.port && lastMobileInfo.port !== UDP_PORT) {
                udpSocket.send(buffer, lastMobileInfo.port, lastMobileInfo.address);
              }
            } catch (_) {}
          }, i * 80);
        }
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), webshareSignalingPlugin()],
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  },
  worker: {
    format: 'es'
  },
  build: {
    target: 'esnext'
  }
});
