const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Définir userData AVANT require('./database/db') (sinon mauvais chemin pour schoolmanage.db).
//
// Dev : …/app-gestion-scolaire-dev  → ne mélange pas avec l’exe installé.
// Installé : …/app-gestion-scolaire/schoolmanage-files  → ignore l’ancienne …/schoolmanage.db
// à la racine du userData (celle que l’exe utilisait avant), donc même sensation « comme neuf » qu’en dev.
if (!app.isPackaged) {
  const base = app.getPath('userData');
  app.setPath('userData', `${base}-dev`);
  console.log('Mode développement : données utilisateur dans', app.getPath('userData'));
} else {
  const root = app.getPath('userData');
  app.setPath('userData', path.join(root, 'schoolmanage-files'));
  console.log('Application packagée : données dans', app.getPath('userData'));
}

const { initializeDatabase, closeDatabase } = require('./database/db');
const setupIPCHandlers = require('./ipc-handlers');

let mainWindow;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadDevServerUrl(win) {
  // Vite peut être lent à démarrer: on retente plusieurs fois avant de changer de port.
  const ports = [5173, 5174, 5175];
  const retriesPerPort = 60; // 60 * 500ms = ~30s
  const retryDelayMs = 500;

  for (let i = 0; i < ports.length; i += 1) {
    const port = ports[i];
    const url = `http://localhost:${port}`;

    for (let attempt = 0; attempt < retriesPerPort; attempt += 1) {
      try {
        if (!win || win.isDestroyed()) return;
        await win.loadURL(url);
        return;
      } catch {
        if (!win || win.isDestroyed()) return;
        await wait(retryDelayMs);
      }
    }

    if (i < ports.length - 1) {
      console.log(`Port ${port} non disponible, essai ${ports[i + 1]}...`);
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

async function createWindow() {
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
    await loadDevServerUrl(mainWindow);
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
    console.log('[SchoolManage] userData =', app.getPath('userData'), '| packagé =', app.isPackaged);
    // Initialiser la base de données
    await initializeDatabase();
    
    // Configurer les handlers IPC
    setupIPCHandlers(ipcMain);
    
    // Créer la fenêtre principale
    await createWindow();

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
