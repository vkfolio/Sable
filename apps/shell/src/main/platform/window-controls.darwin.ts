// macOS — frameless with hiddenInset traffic lights.
//
// hiddenInset hides the titlebar but keeps the traffic-light buttons inset
// from the top-left corner. We pad the renderer's titlebar so the buttons
// don't overlap our content. Vibrancy + native fullscreen come for free.

import type { WindowControls } from './window-controls';

const TITLE_BAR_HEIGHT = 36;

export const windowControls: WindowControls = {
  titleBarHeight: TITLE_BAR_HEIGHT,
  nativeWindowButtons: true,
  windowOptions: {
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 11 },
    vibrancy: 'sidebar',
  },
};
