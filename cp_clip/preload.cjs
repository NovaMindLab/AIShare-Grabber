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
  }
});
