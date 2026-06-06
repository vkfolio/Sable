// Linux — fully frameless. No native overlay; renderer draws its own
// min/max/close buttons. Snapping behavior comes from the window manager
// (Wayland or X11) and varies. We keep titlebar-as-drag-region simple.

import type { WindowControls } from './window-controls';

const TITLE_BAR_HEIGHT = 36;

export const windowControls: WindowControls = {
  titleBarHeight: TITLE_BAR_HEIGHT,
  nativeWindowButtons: false,
  windowOptions: {
    frame: false,
  },
};
