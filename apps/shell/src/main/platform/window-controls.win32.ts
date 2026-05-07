// Windows — frameless with native min/max/close overlay.
//
// titleBarStyle: 'hidden' removes the OS titlebar; titleBarOverlay paints
// system-rendered window controls on the right side. Win 11 snap-layouts
// hover and DPI-aware controls come for free — no WM_NCHITTEST native code.
//
// We pick neutral colors that survive the user toggling system dark/light;
// final theming will be wired through a settings broadcast in Phase 1+.

import type { WindowControls } from './window-controls';

const TITLE_BAR_HEIGHT = 36;

export const windowControls: WindowControls = {
  titleBarHeight: TITLE_BAR_HEIGHT,
  nativeWindowButtons: true,
  windowOptions: {
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0b0b0c',
      symbolColor: '#e7e7e9',
      height: TITLE_BAR_HEIGHT,
    },
  },
};
