// Windows — fully frameless. No native titleBarOverlay; the renderer paints
// its own min/max/close buttons via window.sable.window.* IPC. This costs us
// the Win 11 snap-layouts hover popup (Electron has no JS API for it) but
// gains a perfectly themed titlebar with no 138 px reserved gutter on the
// right edge of the chrome.

import type { WindowControls } from './window-controls';

const TITLE_BAR_HEIGHT = 38;

export const windowControls: WindowControls = {
  titleBarHeight: TITLE_BAR_HEIGHT,
  nativeWindowButtons: false,
  windowOptions: {
    frame: false,
    titleBarStyle: 'hidden',
  },
};
