require('module-alias/register');
const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const isDev = process.env.mode === 'dev';

// IPC 핸들러 등록
require('./ipc/firebase');
require('./ipc/aws');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1250,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '..', 'src', 'assets', 'charcoal.ico'),
  });

  // CSP 설정
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com",
        ].join('; '),
      },
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); //개발자 도구 열기
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
