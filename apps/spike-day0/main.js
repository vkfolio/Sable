// Phase 0 spike — Sable
//
// Goal: confirm a custom MIME type (application/x-sable-quote+json; v=1) survives
// an OS drag between two WebContentsViews inside the same BrowserWindow on this OS.
//
// Result determines the architecture for drag protocol (2) Page->Sidebar.
//   PASS  -> page->sidebar uses real custom MIME via dataTransfer.setData. Clean.
//   FAIL  -> route through main-process DragBroker (token in text/plain + lookup).

const { app, BrowserWindow, WebContentsView } = require('electron');
const path = require('node:path');

const SOURCE_TAG = '[SOURCE]';
const TARGET_TAG = '[TARGET]';

function pipeConsole(view, tag) {
  view.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
    // Surface the renderer's console.log into the terminal so the user can read
    // results without opening DevTools.
    process.stdout.write(`${tag} ${message}\n`);
  });
}

function layoutViews(window, left, right) {
  const { width, height } = window.getContentBounds();
  const half = Math.floor(width / 2);
  // Tiny gap to make the boundary visible during drag.
  const gap = 4;
  left.setBounds({ x: 0, y: 0, width: half - gap, height });
  right.setBounds({ x: half + gap, y: 0, width: width - half - gap, height });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Sable — Phase 0 spike',
    backgroundColor: '#0b0b0c',
  });

  const left = new WebContentsView();
  const right = new WebContentsView();

  win.contentView.addChildView(left);
  win.contentView.addChildView(right);

  pipeConsole(left, SOURCE_TAG);
  pipeConsole(right, TARGET_TAG);

  left.webContents.loadFile(path.join(__dirname, 'source.html'));
  right.webContents.loadFile(path.join(__dirname, 'target.html'));

  layoutViews(win, left, right);
  win.on('resize', () => layoutViews(win, left, right));

  // Keep one DevTools open so we can inspect dataTransfer details if needed.
  // Comment out if it gets noisy.
  // left.webContents.openDevTools({ mode: 'detach' });
  // right.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
