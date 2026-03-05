import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { getDockerConnection } from './dockerConnection';
import { registerContainerHandlers } from './ipc/containerHandlers';
import { registerImageHandlers } from './ipc/imageHandlers';
import { registerNetworkHandlers } from './ipc/networkHandlers';
import { registerComposeHandlers } from './ipc/composeHandlers';
import { registerDockerEventsHandler } from './ipc/dockerEventsHandler';
import { registerKeymapsHandlers } from './ipc/keymapsHandlers';

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  return win;
}

app.whenReady().then(async () => {
  mainWindow = createWindow();

  try {
    const docker = await getDockerConnection();

    registerContainerHandlers(docker);
    registerImageHandlers(docker);
    registerNetworkHandlers(docker);
    registerComposeHandlers(docker);
    registerDockerEventsHandler(docker, mainWindow);
    registerKeymapsHandlers();
  } catch (err) {
    console.error('[Heitor CD] Failed to connect to Docker daemon:', (err as Error).message);
    // The app still opens; Docker-dependent features will be unavailable until resolved.
  }

  app.on('activate', () => {
    // On macOS re-create the window when the dock icon is clicked and no windows are open.
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS it is conventional to keep the app running until the user explicitly quits.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
