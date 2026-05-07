// Sable shell — Electron main entry.
//
// V0.1 first slice. WindowManager opens one BrowserWindow that hosts a single
// chrome WebContents (Sable's UI shell) loaded from renderer/chrome.html.
// Tab WebContentsViews, the layout engine, and the IPC layer arrive next.

import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';

// Single-instance lock — running `pnpm shell` while Sable is already open
// just focuses the existing window instead of spawning a duplicate that
// races for the same userData/cache directory.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  const windowManager = new WindowManager();

  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    } else {
      windowManager.open();
    }
  });

  app.whenReady().then(() => {
    windowManager.open();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) windowManager.open();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
