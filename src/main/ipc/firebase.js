// src/main/ipc/firebase.js
const { ipcMain } = require("electron");
const {
  firebaseGet,
  firebaseSet,
  firebaseUpdate,
} = require("../core/firebase");

ipcMain.handle("firebase:get", async (_, path) => {
  return await firebaseGet(path);
});

ipcMain.handle("firebase:set", async (_, path, data) => {
  return await firebaseSet(path, data);
});

ipcMain.handle("firebase:update", async (_, path, data) => {
  return await firebaseUpdate(path, data);
});
