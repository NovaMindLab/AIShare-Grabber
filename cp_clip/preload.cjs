const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectImages: () => ipcRenderer.invoke('select-images'),
  classifyPhoto: (imagePath) => ipcRenderer.invoke('classify-photo', imagePath),
  searchPhotos: (queryText, imagePaths) => ipcRenderer.invoke('search-photos', { queryText, imagePaths })
});
