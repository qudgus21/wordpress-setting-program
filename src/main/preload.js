// src/main/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  firebase: {
    get: (path) => ipcRenderer.invoke("firebase:get", path),
    set: (path, data) => ipcRenderer.invoke("firebase:set", path, data),
    update: (path, data) => ipcRenderer.invoke("firebase:update", path, data),
  },
});
