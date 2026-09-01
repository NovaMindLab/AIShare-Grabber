const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectImages: () => ipcRenderer.invoke('select-images'),
  classifyPhoto: (imagePath) => ipcRenderer.invoke('classify-photo', imagePath),
  searchPhotos: (queryText, imagePaths) => ipcRenderer.invoke('search-photos', { queryText, imagePaths }),
  readImageBytes: (filePath) => ipcRenderer.invoke('read-image-bytes', filePath),
  openThumbnailFolder: () => ipcRenderer.invoke('open-thumbnail-folder'),
  requestAlbumSync: () => ipcRenderer.invoke('request-album-sync'),
  openAlbumSyncFolder: () => ipcRenderer.invoke('open-album-sync-folder'),
  cleanMissingResources: () => ipcRenderer.invoke('clean-missing-resources'),

  // Person Album & Face Recognition APIs
  getPersonClusters: () => ipcRenderer.invoke('get-person-clusters'),
  reclusterFaces: () => ipcRenderer.invoke('recluster-faces'),
  recalculateAllFaces: () => ipcRenderer.invoke('recalculate-all-faces'),
  updatePersonName: (personId, name) => ipcRenderer.invoke('update-person-name', { personId, name }),
  getPersonPhotos: (personId) => ipcRenderer.invoke('get-person-photos', personId),

  // BLE Signaling & Sync Connection APIs
  startBleServer: () => ipcRenderer.invoke('start-ble-server'),
  stopBleServer: () => ipcRenderer.invoke('stop-ble-server'),
  getValidPhysicalIps: () => ipcRenderer.invoke('get-valid-physical-ips'),
  getPcSessionId: () => ipcRenderer.invoke('get-pc-session-id'),
  sendAnswerSdp: (sdp) => ipcRenderer.invoke('send-answer-sdp', sdp),
  sendIceCandidate: (sdpMid, sdpMLineIndex, candidate) => 
    ipcRenderer.invoke('send-ice-candidate', { sdpMid, sdpMLineIndex, candidate }),
  saveFullPhoto: (fileId, payload, metadata) => 
    ipcRenderer.invoke('save-full-photo', { fileId, payload, metadata }),
  initDeviceSync: (deviceUuid, deviceName) => 
    ipcRenderer.invoke('init-device-sync', { deviceUuid, deviceName }),
  clearDeviceDatabase: () => ipcRenderer.invoke('clear-device-database'),

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
  sendUdpIce: (ip, candidate) => ipcRenderer.invoke('send-udp-ice', { ip, candidate }),

  // HTTP High-Speed TCP Signaling APIs
  onHttpSignalReceived: (callback) => {
    ipcRenderer.removeAllListeners('http-signal-received');
    ipcRenderer.on('http-signal-received', (event, data) => callback(data));
  },
  respondHttpSignal: (data) => ipcRenderer.invoke('respond-http-signal', data),
  getHttpSignalingPort: () => ipcRenderer.invoke('get-http-signaling-port'),

  // Reclassify AI analysis for photos
  reclassifyAllPhonePhotos: () => ipcRenderer.invoke('reclassify-all-phone-photos'),
  
  // Local Folder Import
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  importLocalFolder: (folderPath) => ipcRenderer.invoke('import-local-folder', { folderPath }),
  onReclassifyProgress: (callback) => {
    ipcRenderer.removeAllListeners('reclassify-progress');
    ipcRenderer.on('reclassify-progress', (event, data) => callback(data));
  },
  onFaceScanProgress: (callback) => {
    ipcRenderer.removeAllListeners('face-scan-progress');
    ipcRenderer.on('face-scan-progress', (event, data) => callback(data));
  },
  onSinglePhotoPredictionsUpdated: (callback) => {
    ipcRenderer.removeAllListeners('single-photo-predictions-updated');
    ipcRenderer.on('single-photo-predictions-updated', (event, data) => callback(data));
  },

  // Similar images analysis
  getSimilarImagesGroups: (imageList, threshold) => ipcRenderer.invoke('get-similar-images-groups', { imageList, threshold }),
  onSimilarProgress: (callback) => {
    ipcRenderer.removeAllListeners('similar-progress');
    ipcRenderer.on('similar-progress', (event, data) => callback(data));
  },
  deleteFiles: (files) => ipcRenderer.invoke('delete-files', files),

  setSyncStatus: (status, deviceUuid) => ipcRenderer.invoke('set-sync-status', { status, deviceUuid }),
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  setDownloadPath: (newPath) => ipcRenderer.invoke('set-download-path', newPath),
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  openDownloadFolder: () => ipcRenderer.invoke('open-download-folder'),
  openFileLocation: (filePath) => ipcRenderer.invoke('open-file-location', filePath),
  openLogFolder: () => ipcRenderer.invoke('open-log-folder'),
  getLogPath: () => ipcRenderer.invoke('get-log-path'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  startUpdateDownload: (downloadUrl) => ipcRenderer.invoke('start-update-download', downloadUrl),
  installUpdate: (filePath) => ipcRenderer.invoke('install-update', filePath),
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.removeAllListeners('update-download-progress');
    ipcRenderer.on('update-download-progress', (event, progress) => callback(progress));
  },
  onAiQueueProgress: (callback) => {
    ipcRenderer.removeAllListeners('ai-queue-progress');
    ipcRenderer.on('ai-queue-progress', (event, data) => callback(data));
  },
  // Main-process driven heartbeat keepalive: ensures pings fire even when renderer is busy with IPC
  onSendHeartbeatPing: (callback) => {
    ipcRenderer.removeAllListeners('send-heartbeat-ping');
    ipcRenderer.on('send-heartbeat-ping', () => callback());
  },

  // YT-DLP Downloader
  getYtVideoInfo: (url) => ipcRenderer.invoke('yt-get-info', url),
  downloadYtVideo: (url, outputDir, formatId) => ipcRenderer.invoke('yt-download', { url, outputDir, formatId }),
  onYtProgress: (callback) => {
    ipcRenderer.removeAllListeners('yt-progress');
    ipcRenderer.on('yt-progress', (event, data) => callback(data));
  },

  // Video AnimeGAN Transformation APIs
  checkVideoAnimeEnv: () => ipcRenderer.invoke('video-anime:check-env'),
  getVideoAnimeInfo: (videoPath) => ipcRenderer.invoke('video-anime:get-info', videoPath),
  getVideoAnimeStyles: () => ipcRenderer.invoke('video-anime:get-styles'),
  startVideoAnime: (params) => ipcRenderer.invoke('video-anime:start', params),
  cancelVideoAnime: () => ipcRenderer.invoke('video-anime:cancel'),
  onVideoAnimeProgress: (callback) => {
    ipcRenderer.removeAllListeners('video-anime:progress');
    ipcRenderer.on('video-anime:progress', (event, data) => callback(data));
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close')
});
