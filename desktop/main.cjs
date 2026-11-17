// Ứng dụng máy tính (Mac / Windows) – bọc bản web đã build trong Electron.
//
// App được phục vụ qua http://localhost thay vì mở file trực tiếp, vì đăng nhập Google của Firebase
// chỉ chạy trên địa chỉ http(s) được phép (Firebase cho phép sẵn "localhost").
const { app, BrowserWindow, shell, Menu } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Cổng cố định để dữ liệu lưu trên máy (localStorage) không bị đổi chỗ giữa các lần mở
const PORT = 47821;
const ROOT = path.join(__dirname, 'app');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Google chặn đăng nhập trong "trình duyệt nhúng" nếu nhận ra Electron, nên bỏ chữ Electron khỏi User-Agent
app.userAgentFallback = app.userAgentFallback
  .replace(/\s?Electron\/\S+/i, '')
  .replace(/\s?Tai ?Chinh\/\S+/i, '')
  .replace(/\s?tai-chinh\/\S+/i, '');

let server;
const startServer = () =>
  new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let file = path.normalize(path.join(ROOT, urlPath));
      if (!file.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end();
      }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.html');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.once('error', reject);
    server.listen(PORT, 'localhost', () => resolve());
  });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 640,
    title: 'Tài Chính',
    backgroundColor: '#ECEEEB',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 18 },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'resources', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}/`);

  // Cửa sổ đăng nhập Google/Firebase mở ngay trong app; các liên kết khác mở bằng trình duyệt
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/firebaseapp\.com|accounts\.google\.com|googleapis\.com/.test(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: { width: 500, height: 680, autoHideMenuBar: true, title: 'Đăng nhập Google' },
      };
    }
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'deny' };
  });
}

// Chỉ chạy một cửa sổ app một lúc (tránh tranh cổng)
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }])
      );
    } else {
      Menu.setApplicationMenu(null);
    }
    await startServer();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('quit', () => server?.close());
}
