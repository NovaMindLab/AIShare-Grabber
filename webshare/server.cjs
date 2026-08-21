/**
 * ShareCLIP WebShare Local Server & Signaling Bridge
 * Serves static web assets + listens on UDP 15185 + bridges WebSocket to PC Chrome.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const os = require('os');
const { WebSocketServer } = require('ws');

const HTTP_PORT = process.env.PORT || 3000;
const UDP_PORT = 15185;

// MIME types for static hosting
const MIME_MAP = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.map': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.ico': 'image/x-icon'
};

// 1. Get Physical Local IPv4 Addresses
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

// 2. Create HTTP Server
const publicDir = path.join(__dirname, 'dist');
const fallbackDir = path.join(__dirname, 'public');

const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(publicDir, reqPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(fallbackDir, reqPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('WebShare: Please run "npm run build" first to generate the frontend dist.');
    }
  }
});

// 3. Create WebSocket Server on /ws
const wss = new WebSocketServer({ noServer: true });
let registeredClients = new Map(); // sessionId -> WebSocket

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

function logWithTime(tag, message) {
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${time}] ${tag} ${message}`);
  // Broadcast log to Chrome frontend
  for (const ws of registeredClients.values()) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'log', message: `${tag} ${message}` }));
    }
  }
}

// 4. Create UDP 15185 Signaling Socket (for Android App)
const udpSocket = dgram.createSocket('udp4');
let lastMobileInfo = null;

udpSocket.on('message', (msg, rinfo) => {
  try {
    const rawStr = msg.toString('utf-8');
    const payload = JSON.parse(rawStr);
    lastMobileInfo = { address: rinfo.address, port: rinfo.port };

    logWithTime('📱 [UDP In]', `From ${rinfo.address}:${rinfo.port} -> Type: ${payload.type} (Length: ${msg.length}B)`);

    // Route to active PC Chrome WebSocket clients
    for (const [sessionId, ws] of registeredClients.entries()) {
      if (ws.readyState === 1) {
        if (payload.type === 'ShareCLIP_Direct_Sdp' && payload.sdpType === 'offer') {
          logWithTime('➡️ [Relay]', `Routing SDP Offer (${payload.sdp.length}B) to PC Chrome Session: ${sessionId}`);
          ws.send(JSON.stringify({
            type: 'offer',
            sdp: payload.sdp,
            sender_uuid: payload.sender_uuid
          }));
        } else if (payload.type === 'ShareCLIP_Direct_Ice') {
          logWithTime('➡️ [Relay]', `Routing remote ICE Candidate to PC Chrome`);
          ws.send(JSON.stringify({
            type: 'ice',
            candidate: payload.candidate
          }));
        } else if (payload.type === 'ShareCLIP_Discovery_Ping') {
          // Reply to discovery ping with host info
          const discResp = Buffer.from(JSON.stringify({
            type: 'ShareCLIP_Discovery_Pong',
            device_uuid: 'webshare-chrome',
            device_name: 'ShareCLIP WebShare (PC)',
            pc_ips: getLocalIps()
          }));
          udpSocket.send(discResp, rinfo.port, rinfo.address);
          udpSocket.send(discResp, UDP_PORT, rinfo.address);
        }
      }
    }
  } catch (err) {
    // Non-JSON UDP packet or broadcast noise
  }
});

udpSocket.on('error', (err) => {
  logWithTime('❌ [UDP Err]', err.message);
});

try {
  udpSocket.bind(UDP_PORT, '0.0.0.0', () => {
    logWithTime('📡 [UDP Server]', `Listening on 0.0.0.0:${UDP_PORT} for Android App packets.`);
  });
} catch (e) {
  logWithTime('⚠️ [UDP Bind]', `Could not bind port ${UDP_PORT}: ${e.message}`);
}

// 5. WebSocket Client Handling (PC Chrome)
wss.on('connection', (ws) => {
  let clientSessionId = null;
  const localIps = getLocalIps();

  // Send server info and local IPs immediately to PC Chrome
  ws.send(JSON.stringify({
    type: 'server_info',
    localIps,
    httpPort: HTTP_PORT,
    udpPort: UDP_PORT
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString('utf-8'));

      if (msg.type === 'register_session') {
        clientSessionId = msg.sessionId;
        registeredClients.set(clientSessionId, ws);
        logWithTime('✨ [WS Client]', `PC Chrome registered Session ID: ${clientSessionId}`);
      } else if (msg.type === 'answer') {
        logWithTime('⬅️ [WS Client]', `Received SDP Answer (${msg.sdp.length}B) from Chrome. Sending UDP to mobile...`);
        sendUdpToMobile({
          type: 'ShareCLIP_Direct_Sdp',
          sdp: msg.sdp,
          sdpType: 'answer'
        });
      } else if (msg.type === 'ice') {
        logWithTime('⬅️ [WS Client]', `Sending ICE Candidate to mobile via UDP...`);
        sendUdpToMobile({
          type: 'ShareCLIP_Direct_Ice',
          candidate: msg.candidate
        });
      }
    } catch (e) {
      logWithTime('❌ [WS Err]', e.message);
    }
  });

  ws.on('close', () => {
    if (clientSessionId) {
      registeredClients.delete(clientSessionId);
      logWithTime('🔌 [WS Client]', `Session closed: ${clientSessionId}`);
    }
  });
});

function sendUdpToMobile(payload) {
  if (!lastMobileInfo) {
    logWithTime('⚠️ [UDP Out]', 'No mobile address recorded yet! Make sure phone scanned the QR code.');
    return;
  }
  const jsonStr = JSON.stringify(payload);
  const buffer = Buffer.from(jsonStr, 'utf-8');

  // Retransmit 3 times with 80ms interval to both 15185 and source port
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      try {
        udpSocket.send(buffer, UDP_PORT, lastMobileInfo.address);
        if (lastMobileInfo.port && lastMobileInfo.port !== UDP_PORT) {
          udpSocket.send(buffer, lastMobileInfo.port, lastMobileInfo.address);
        }
      } catch (err) {
        logWithTime('❌ [UDP Send Err]', err.message);
      }
    }, i * 80);
  }
}

// 6. Start HTTP Server
server.listen(HTTP_PORT, '0.0.0.0', () => {
  const localIps = getLocalIps();
  console.log('\n==================================================');
  console.log('🚀 ShareCLIP WebShare Server Started Successfully!');
  console.log('==================================================');
  console.log(`🌐 Local Web:    http://localhost:${HTTP_PORT}`);
  localIps.forEach(ip => {
    console.log(`📱 LAN Web:      http://${ip}:${HTTP_PORT}`);
  });
  console.log(`📡 UDP Signal:   0.0.0.0:${UDP_PORT}`);
  console.log('==================================================\n');
});
