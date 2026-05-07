// LayoutController — bridges the pure LayoutEngine to Electron's
// WebContentsView positioning.
//
// Inputs:
//   - the BSP tree (set externally; eventually owned by SpaceManager)
//   - window resize events
//   - chrome's reported sidebar width (constant for now, IPC later)
// Outputs:
//   - setBounds() calls on each tab WebContentsView
//   - addChildView / removeChildView so only on-tree tabs are mounted
//
// The chrome WebContentsView always covers the full window. Tab views are
// added on top of it (z-order = add order) but only over the pane area
// (right of sidebar, below titlebar). The chrome's pane region thus
// shows through wherever no tab view covers it (used for split dividers
// and drop overlays once those land).

import { BrowserWindow, WebContentsView } from 'electron';
import { layout, leaves, type Pane, type Rect, type TabId } from '@sable/layout-engine';
import type { TabManager } from './tab-manager';

const SIDEBAR_WIDTH = 280; // mirror of --sidebar-w in chrome.html

export class LayoutController {
  private tree: Pane | null = null;
  private readonly mounted = new Set<TabId>();

  constructor(
    private readonly window: BrowserWindow,
    private readonly tabManager: TabManager,
    private readonly chromeView: WebContentsView,
    private readonly titleBarHeight: number,
  ) {
    const apply = () => this.applyLayout();
    window.on('resize', apply);
    window.on('maximize', apply);
    window.on('unmaximize', apply);
    window.on('enter-full-screen', apply);
    window.on('leave-full-screen', apply);
  }

  setTree(tree: Pane | null): void {
    this.tree = tree;
    this.applyLayout();
  }

  getTree(): Pane | null {
    return this.tree;
  }

  /**
   * Force a re-layout (useful after tab list changes).
   */
  reflow(): void {
    this.applyLayout();
  }

  private applyLayout(): void {
    if (this.window.isDestroyed()) return;
    const { width, height } = this.window.getContentBounds();
    this.chromeView.setBounds({ x: 0, y: 0, width, height });

    const paneViewport: Rect = {
      x: SIDEBAR_WIDTH,
      y: this.titleBarHeight,
      width: Math.max(0, width - SIDEBAR_WIDTH),
      height: Math.max(0, height - this.titleBarHeight),
    };

    if (!this.tree) {
      this.unmountAll();
      return;
    }

    const rects = layout(this.tree, paneViewport);
    const wanted = new Set<TabId>();

    for (const leaf of leaves(this.tree)) {
      const rect = rects.get(leaf.id);
      const view = this.tabManager.getView(leaf.tabId);
      if (!rect || !view) continue;

      if (!this.mounted.has(leaf.tabId)) {
        this.window.contentView.addChildView(view);
        this.mounted.add(leaf.tabId);
      }
      view.setBounds(rect);
      wanted.add(leaf.tabId);
    }

    // Unmount tabs that left the tree (closed or moved out).
    for (const id of [...this.mounted]) {
      if (wanted.has(id)) continue;
      const view = this.tabManager.getView(id);
      if (view) this.safeRemove(view);
      this.mounted.delete(id);
    }
  }

  private unmountAll(): void {
    for (const id of [...this.mounted]) {
      const view = this.tabManager.getView(id);
      if (view) this.safeRemove(view);
    }
    this.mounted.clear();
  }

  private safeRemove(view: WebContentsView): void {
    try {
      this.window.contentView.removeChildView(view);
    } catch {
      // already removed
    }
  }
}
