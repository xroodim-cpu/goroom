const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeWidget: () => ipcRenderer.invoke('close-widget'),
  openMain: () => ipcRenderer.invoke('open-main'),
  notify: (payload) => ipcRenderer.invoke('notify:show', payload),
});
