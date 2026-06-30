const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectImages: () => ipcRenderer.invoke('select-images'),
  classifyPhoto: (imagePath) => ipcRenderer.invoke('classify-photo', imagePath),
  searchPhotos: (queryText, imagePaths) => ipcRenderer.invoke('search-photos', { queryText, imagePaths }),
  readImageBytes: (filePath) => ipcRenderer.invoke('read-image-bytes', filePath),
  
  // BLE Signaling & Sync Connection APIs
  startBleServer: () => ipcRenderer.invoke('start-ble-server'),
  stopBleServer: () => ipcRenderer.invoke('stop-ble-server'),
  sendAnswerSdp: (sdp) => ipcRenderer.invoke('send-answer-sdp', sdp),
  sendIceCandidate: (sdpMid, sdpMLineIndex, candidate) => 
    ipcRenderer.invoke('send-ice-candidate', { sdpMid, sdpMLineIndex, candidate }),
  savePhotoChunk: (fileId, chunkIndex, totalChunks, payload, metadata) => 
    ipcRenderer.invoke('save-photo-chunk', { fileId, chunkIndex, totalChunks, payload, metadata }),
  initDeviceSync: (deviceUuid, deviceName) => 
    ipcRenderer.invoke('init-device-sync', { deviceUuid, deviceName }),

  // Event listeners (IPC Notifications)
  onOfferReceived: (callback) => {
    ipcRenderer.removeAllListeners('ble-offer-received');
    ipcRenderer.on('ble-offer-received', (event, sdp) => callback(sdp));
  },
  onRemoteIceReceived: (callback) => {
    ipcRenderer.removeAllListeners('ble-ice-received');
    ipcRenderer.on('ble-ice-received', (event, data) => callback(data));
  },
  onBleStatusChanged: (callback) => {
    ipcRenderer.removeAllListeners('ble-status-changed');
    ipcRenderer.on('ble-status-changed', (event, status) => callback(status));
  },
  onPhotoSynced: (callback) => {
    ipcRenderer.removeAllListeners('photo-synced');
    ipcRenderer.on('photo-synced', (event, imageInfo) => callback(imageInfo));
  },
  onLogReceived: (callback) => {
    ipcRenderer.removeAllListeners('sync-log');
    ipcRenderer.on('sync-log', (event, msg) => callback(msg));
  },

  // Wi-Fi Hotspot APIs
  startHotspot: (ssid, password) => ipcRenderer.invoke('start-hotspot', { ssid, password }),
  stopHotspot: () => ipcRenderer.invoke('stop-hotspot'),
  onHotspotStatusChanged: (callback) => {
    ipcRenderer.removeAllListeners('hotspot-status-changed');
    ipcRenderer.on('hotspot-status-changed', (event, status) => callback(status));
  },

  // UDP P2P Discovery & Signaling APIs
  onDiscoveredDevicesChanged: (callback) => {
    ipcRenderer.removeAllListeners('discovered-devices');
    ipcRenderer.on('discovered-devices', (event, devices) => callback(devices));
  },
  onConnectionRequestReceived: (callback) => {
    ipcRenderer.removeAllListeners('connection-request');
    ipcRenderer.on('connection-request', (event, request) => callback(request));
  },
  onConnectionResponseReceived: (callback) => {
    ipcRenderer.removeAllListeners('connection-response');
    ipcRenderer.on('connection-response', (event, res) => callback(res));
  },
  onDirectSdpReceived: (callback) => {
    ipcRenderer.removeAllListeners('direct-sdp-received');
    ipcRenderer.on('direct-sdp-received', (event, data) => callback(data));
  },
  onDirectIceReceived: (callback) => {
    ipcRenderer.removeAllListeners('direct-ice-received');
    ipcRenderer.on('direct-ice-received', (event, data) => callback(data));
  },
  sendUdpConnectRequest: (ip) => ipcRenderer.invoke('send-udp-connect-request', { ip }),
  respondToConnectionRequest: (ip, accept) => ipcRenderer.invoke('respond-to-connection-request', { ip, accept }),
  sendUdpSdp: (ip, sdp, sdpType) => ipcRenderer.invoke('send-udp-sdp', { ip, sdp, sdpType }),
  sendUdpIce: (ip, candidate) => ipcRenderer.invoke('send-udp-ice', { ip, candidate })
});
