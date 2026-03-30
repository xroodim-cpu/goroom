const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '구롬 (GoRoom)',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 개발 모드: Vite 서버 / 프로덕션: 빌드된 파일
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
