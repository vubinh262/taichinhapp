// Ứng dụng máy tính (Mac / Windows) – bọc bản web đã build trong Electron.
//
// App được phục vụ qua http://localhost thay vì mở file trực tiếp, vì đăng nhập Google của Firebase
// chỉ chạy trên địa chỉ http(s) được phép (Firebase cho phép sẵn "localhost").
const { app, BrowserWindow, shell, Menu, dialog, net } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Cổng cố định để dữ liệu lưu trên máy (localStorage) không bị đổi chỗ giữa các lần mở
const PORT = 47821;
const BUNDLED_ROOT = path.join(__dirname, 'app');
let ROOT = BUNDLED_ROOT;

// ---------- Tự cập nhật giao diện ----------
// Mỗi lần code được đẩy lên GitHub, bản giao diện mới được đăng ở bản phát hành "web-latest".
// App tải về, giải nén vào thư mục dữ liệu của người dùng và dùng bản đó – không cần cài lại.
const REPO = 'vubinh262/taichinhapp';
const UPDATE_BASE = `https://github.com/${REPO}/releases/download/web-latest`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;
const WEB_DIR = path.join(app.getPath('userData'), 'web');
const CURRENT_FILE = path.join(WEB_DIR, 'current.json');

const readJSON = (f) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return null;
  }
};
const cmpVer = (a, b) => {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
};
const bundledVersion = () => readJSON(path.join(BUNDLED_ROOT, 'version.json'))?.version || 0;

/** Chọn bản giao diện mới nhất đang có trên máy (bản kèm theo app hoặc bản đã tải) */
const pickRoot = () => {
  const cur = readJSON(CURRENT_FILE);
  if (cur && cur.version > bundledVersion() && fs.existsSync(path.join(cur.dir, 'index.html'))) {
    ROOT = cur.dir;
    return cur.version;
  }
  ROOT = BUNDLED_ROOT;
  return bundledVersion();
};
let activeVersion = 0;
let checking = false;

async function checkForUpdate(manual = false) {
  if (checking) return;
  checking = true;
  try {
    const res = await net.fetch(`${UPDATE_BASE}/version.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const remote = await res.json();
    if (!(remote.version > activeVersion)) {
      if (manual) dialog.showMessageBox(mainWindow, { message: 'Bạn đang dùng bản mới nhất.', buttons: ['OK'] });
      return;
    }
    // Bản mới cần khung app mới hơn → mời tải bản cài
    if (remote.minShell && cmpVer(app.getVersion(), remote.minShell) < 0) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: 'Có bản cài mới của Tài Chính',
        detail: `Bản này cần cài lại một lần (phiên bản ${remote.minShell} trở lên). Sau đó app sẽ tự cập nhật.`,
        buttons: ['Mở trang tải', 'Để sau'],
        defaultId: 0,
      });
      if (response === 0) shell.openExternal(RELEASES_PAGE);
      return;
    }
    const zipRes = await net.fetch(`${UPDATE_BASE}/TaiChinh-web-desktop.zip?t=${Date.now()}`);
    if (!zipRes.ok) throw new Error(`HTTP ${zipRes.status}`);
    const buf = Buffer.from(await zipRes.arrayBuffer());
    const AdmZip = require('adm-zip');
    const target = path.join(WEB_DIR, `v${remote.version}`);
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(target, { recursive: true });
    new AdmZip(buf).extractAllTo(target, true);
    if (!fs.existsSync(path.join(target, 'index.html'))) throw new Error('Gói cập nhật thiếu index.html');
    const old = readJSON(CURRENT_FILE);
    fs.writeFileSync(CURRENT_FILE, JSON.stringify({ version: remote.version, dir: target }));
    // dọn bản cũ
    if (old?.dir && old.dir !== target) fs.rmSync(old.dir, { recursive: true, force: true });

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      message: 'Đã tải bản cập nhật mới',
      detail: remote.notes || 'Tải lại để dùng ngay, hoặc bản mới sẽ tự dùng ở lần mở app sau.',
      buttons: ['Tải lại ngay', 'Để sau'],
      defaultId: 0,
    });
    if (response === 0) {
      activeVersion = pickRoot();
      mainWindow?.webContents.reloadIgnoringCache();
    }
  } catch (err) {
    console.warn('Không kiểm tra được bản cập nhật:', err);
    if (manual) dialog.showMessageBox(mainWindow, { type: 'warning', message: 'Chưa kiểm tra được bản cập nhật', detail: String(err?.message || err), buttons: ['OK'] });
  } finally {
    checking = false;
  }
}
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
        Menu.buildFromTemplate([
          {
            label: app.name,
            submenu: [
              { role: 'about', label: 'Giới thiệu Tài Chính' },
              { label: 'Kiểm tra cập nhật…', click: () => checkForUpdate(true) },
              { type: 'separator' },
              { role: 'hide', label: 'Ẩn Tài Chính' },
              { role: 'quit', label: 'Thoát Tài Chính' },
            ],
          },
          { role: 'editMenu' },
          { role: 'viewMenu' },
          { role: 'windowMenu' },
        ])
      );
    } else {
      Menu.setApplicationMenu(null);
    }
    activeVersion = pickRoot();
    await startServer();
    createWindow();
    // Kiểm tra bản mới sau khi mở app vài giây, và mỗi 6 tiếng
    setTimeout(() => checkForUpdate(false), 4000);
    setInterval(() => checkForUpdate(false), 6 * 60 * 60 * 1000);
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('quit', () => server?.close());
}
