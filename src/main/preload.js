const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("license", {
  register: (licenseKey) => ipcRenderer.invoke("register-license", licenseKey),
  check: () => ipcRenderer.invoke("check-license"),
});
