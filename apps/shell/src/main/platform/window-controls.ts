// WindowControls — per-OS chrome behavior behind a single interface.
//
// Each OS has different idioms for a "frameless window with native window
// controls." We hide that behind one interface so window-manager.ts can stay
// platform-agnostic. The implementation is selected at module-load time via
// process.platform.

import type { BrowserWindowConstructorOptions } from 'electron';

export interface WindowControls {
  /**
   * BrowserWindow constructor options that produce the platform's frameless
   * chrome. The shell merges these into its own options.
   */
  readonly windowOptions: BrowserWindowConstructorOptions;

  /**
   * The vertical space the chrome's draggable titlebar should reserve at the
   * top of the window in CSS pixels. The renderer uses this to position the
   * sidebar/content beneath the titlebar.
   */
  readonly titleBarHeight: number;

  /**
   * Whether the OS draws min/max/close natively (Windows overlay, macOS traffic
   * lights). If false, the renderer must draw its own buttons (Linux).
   */
  readonly nativeWindowButtons: boolean;
}

let cached: WindowControls | undefined;

export function getWindowControls(): WindowControls {
  if (cached) return cached;
  switch (process.platform) {
    case 'win32': {
      const mod = require('./window-controls.win32') as { windowControls: WindowControls };
      cached = mod.windowControls;
      break;
    }
    case 'darwin': {
      const mod = require('./window-controls.darwin') as { windowControls: WindowControls };
      cached = mod.windowControls;
      break;
    }
    default: {
      const mod = require('./window-controls.linux') as { windowControls: WindowControls };
      cached = mod.windowControls;
      break;
    }
  }
  return cached;
}
