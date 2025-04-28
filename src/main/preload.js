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
  ec2: {
    get: () => ipcRenderer.invoke('getEc2Instances'),
    create: () => ipcRenderer.invoke('createEc2Instance'),
    delete: instanceId => ipcRenderer.invoke('deleteEc2Instance', instanceId),
  },
});
