import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const createWindow = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      devTools: true,
    },
    icon: path.join(__dirname, "..", "src", "assets", "charcoal.ico"),
  });

  if (process.env.mode === "dev") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "renderer", "index.html"));
  }
};

app.whenReady().then(() => {
  createWindow();
});
