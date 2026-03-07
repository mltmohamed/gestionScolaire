const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeDatabase, closeDatabase } = require('./database/db');
const setupIPCHandlers = require('./ipc-handlers');

let mainWindow;

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
    },
    backgroundColor: '#FAFAFA',
    show: false,
    frame: true,
    titleBarStyle: 'default',
  });

  // Charger l'application en développement ou production
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // Essayer plusieurs ports possibles
    mainWindow.loadURL('http://localhost:5173')
      .catch(() => {
        console.log('Port 5173 non disponible, essai 5174...');
        mainWindow.loadURL('http://localhost:5174')
          .catch(() => {
            console.log('Port 5174 non disponible, essai 5175...');
            mainWindow.loadURL('http://localhost:5175');
          });
      });
    mainWindow.webContents.openDevTools();
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
app.whenReady().then(() => {
  try {
    // Initialiser la base de données
    initializeDatabase();
    
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
