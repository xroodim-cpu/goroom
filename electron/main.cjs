const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let widgetWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development';
const DEV_PORT = process.env.DEV_PORT || 3000;

/* ── Main Window ── */
function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); return; }

  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    title: '고룸 (GoRoom)',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') },
  });

  if (isDev) mainWindow.loadURL(`http://localhost:${DEV_PORT}`);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  mainWindow.on('close', (e) => {
    // 닫기 버튼 → 트레이로 숨기기 (종료 아님)
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); }
  });
}

/* ── Widget Window ── */
function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) { widgetWindow.show(); widgetWindow.focus(); return; }

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  widgetWindow = new BrowserWindow({
    width: 320, height: 420,
    x: sw - 340, y: sh - 440,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') },
  });

  widgetWindow.loadFile(path.join(__dirname, 'widget.html'));
  widgetWindow.on('closed', () => { widgetWindow = null; });
}

function toggleWidget() {
  if (widgetWindow && !widgetWindow.isDestroyed()) { widgetWindow.close(); widgetWindow = null; }
  else createWidgetWindow();
}

/* ── System Tray ── */
function createTray() {
  // 16x16 간단 아이콘 (없으면 기본)
  let icon;
  try { icon = nativeImage.createFromPath(path.join(__dirname, 'tray-icon.png')).resize({ width: 16, height: 16 }); }
  catch { icon = nativeImage.createEmpty(); }

  tray = new Tray(icon);
  tray.setToolTip('고룸 (GoRoom)');

  const contextMenu = Menu.buildFromTemplate([
    { label: '고룸 열기', click: createMainWindow },
    { label: '오늘의 일정 위젯', click: toggleWidget },
    { type: 'separator' },
    { label: '시작 시 자동실행', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { type: 'separator' },
    { label: '종료', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', createMainWindow);
}

/* ── IPC ── */
ipcMain.handle('close-widget', () => { if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.close(); });
ipcMain.handle('open-main', () => createMainWindow());

/* ── App Lifecycle ── */
app.whenReady().then(() => {
  createMainWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // 트레이가 있으면 종료하지 않음
});

app.on('activate', () => createMainWindow());

app.on('before-quit', () => { app.isQuitting = true; });
