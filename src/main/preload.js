const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('license', {
  register: licenseKey => ipcRenderer.invoke('register-license', licenseKey),
  check: () => ipcRenderer.invoke('check-license'),
});

contextBridge.exposeInMainWorld('aws', {
  credentials: {
    get: () => ipcRenderer.invoke('getCredential'),
    save: credentials => ipcRenderer.invoke('saveCredential', credentials),
  },
  instances: {
    get: () => ipcRenderer.invoke('getInstances'),
  },
});
