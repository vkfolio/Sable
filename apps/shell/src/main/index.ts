// Sable shell — Electron main entry.
//
// V0.1 first slice. WindowManager opens one BrowserWindow that hosts a single
// chrome WebContents (Sable's UI shell) loaded from renderer/chrome.html.
// Tab WebContentsViews, the layout engine, and the IPC layer arrive next.

import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';

// ---- Stability mitigations (Windows / GPU) ----
//
// These have to be applied BEFORE app.whenReady() — Chromium reads them
// during process bootstrap and ignores changes afterwards.
//
//  1. CalculateNativeWinOcclusion → disabled. Long-standing source of
//     0xC0000005 access violations on Windows when minimizing/restoring
//     or when DevTools opens — the occlusion-calc thread races with
//     render handle teardown.
//  2. GPU sandbox → disabled. Some Windows machines crash the GPU process
//     with an access violation when DevTools' inspector UI starts up;
//     disabling the GPU sandbox is the documented workaround until we
//     can ship code-signing + a signed driver allowlist.
//  3. SABLE_NO_GPU=1 escape hatch → disables hardware acceleration
//     entirely. Last-resort for users on broken GPU drivers.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-gpu-sandbox');
if (process.env['SABLE_NO_GPU']) {
  app.disableHardwareAcceleration();
}

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

  app.whenReady().then(async () => {
    await windowManager.preload();
    windowManager.open();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) windowManager.open();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
