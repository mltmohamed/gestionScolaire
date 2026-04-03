const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeDatabase, closeDatabase } = require('./database/db');
const setupIPCHandlers = require('./ipc-handlers');

let mainWindow;

async function loadDevServerUrl(win) {
  const ports = [5173, 5174, 5175];
  for (let i = 0; i < ports.length; i += 1) {
    const port = ports[i];
    const url = `http://localhost:${port}`;
    try {
      if (!win || win.isDestroyed()) return;
      await win.loadURL(url);
      return;
    } catch {
      if (i < ports.length - 1) {
        console.log(`Port ${port} non disponible, essai ${ports[i + 1]}...`);
      }
    }
  }
}

function getCspHeaderValue({ isDev }) {
  if (isDev) {
    return [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "connect-src 'self' http://localhost:5173 ws://localhost:5173 http://localhost:5174 ws://localhost:5174 http://localhost:5175 ws://localhost:5175"
    ].join('; ');
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "script-src 'self'",
    "connect-src 'self'"
  ].join('; ');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // NOTE: sandbox breaks preload in this project (preload uses require). Keep disabled unless preload is rewritten.
      sandbox: false,
    },
    backgroundColor: '#FAFAFA',
    show: false,
    frame: true,
    titleBarStyle: 'default',
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('did-fail-load:', { errorCode, errorDescription, validatedURL });
  });

  // Charger l'application en développement ou production
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  // CSP via en-têtes (évite de casser Vite en dev tout en durcissant en prod)
  const csp = getCspHeaderValue({ isDev });
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  // Bloquer la navigation vers des URL externes
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const allowedOrigins = isDev
        ? new Set(['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'])
        : new Set([`file://${path.join(__dirname, '../../dist/index.html').replace(/\\/g, '/')}`]);

      const target = new URL(url);
      if (!allowedOrigins.has(target.origin)) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // Bloquer window.open et toute création de fenêtre non contrôlée
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  
  if (isDev) {
    // Essayer plusieurs ports possibles (Vite bascule automatiquement si 5173 est occupé)
    loadDevServerUrl(mainWindow);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialisation de l'application
app.whenReady().then(async () => {
  try {
    // Initialiser la base de données
    await initializeDatabase();
    
    // Configurer les handlers IPC
    setupIPCHandlers(ipcMain);
    
    // Créer la fenêtre principale
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
    app.quit();
  }
});

// Fermeture propre
app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});

// Gestion des erreurs non attrapées
process.on('uncaughtException', (error) => {
  console.error('Exception non attrapée:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Promesse non gérée rejetée:', error);
});
