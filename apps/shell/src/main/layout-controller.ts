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
import {
  applyDrop,
  dividers as computeDividers,
  findPaneById,
  layout,
  leaves,
  removeTab,
  resize,
  type DropEdge,
  type Pane,
  type PaneId,
  type Rect,
  type TabId,
} from '@sable/layout-engine';
import type { TabManager } from './tab-manager';

// New geometry — chrome reorganized into:
//   row 1: titlebar (38px, contains horizontal tab strip)
//   row 2: URL bar row (52px)
//   row 3: page body (tab WebContentsViews here, with optional right chat sidebar)
//
// Mirror these constants in chrome-ui/src/index.css :root.
const TITLEBAR_HEIGHT = 38;
const URLBAR_ROW_HEIGHT = 52;
const TOP_BAR_HEIGHT = TITLEBAR_HEIGHT + URLBAR_ROW_HEIGHT;
const CHAT_SIDEBAR_WIDTH = 340;
const DIVIDER_THICKNESS = 4;

export type SnapshotLeaf = {
  readonly paneId: PaneId;
  readonly tabId: TabId;
  readonly rect: Rect;
};

export type SnapshotDivider = {
  readonly splitId: PaneId;
  readonly direction: 'h' | 'v';
  readonly rect: Rect;
  readonly parentRect: Rect;
};

export type LayoutSnapshot = {
  readonly tree: Pane | null;
  readonly leaves: readonly SnapshotLeaf[];
  readonly dividers: readonly SnapshotDivider[];
  readonly paneOrigin: { readonly x: number; readonly y: number };
};

type SnapshotListener = (snapshot: LayoutSnapshot) => void;

export class LayoutController {
  private tree: Pane | null = null;
  private readonly mounted = new Set<TabId>();
  private readonly snapshotListeners = new Set<SnapshotListener>();
  private chatVisible = true;

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

  /**
   * Subscribe to layout snapshots. Fires on every reflow (tree change or
   * window resize). Returns an unsubscribe function.
   */
  onSnapshot(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener);
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  /**
   * Drag-mode toggling. While active, all tab WebContentsViews are
   * unmounted so the chrome's drop overlays receive pointer events.
   * The tree itself is unchanged.
   */
  setDragMode(active: boolean): void {
    if (active) {
      this.unmountAll();
    } else {
      this.applyLayout();
    }
  }

  /** Right chat sidebar visibility — affects pane viewport width. */
  setChatVisible(visible: boolean): void {
    if (this.chatVisible === visible) return;
    this.chatVisible = visible;
    this.applyLayout();
  }

  /**
   * Apply a drop to the tree. The source tab is plucked from wherever it
   * currently lives in the tree and inserted at the target pane / edge. If
   * the source isn't currently in the tree (e.g., it was a hidden tab), it
   * just gets inserted. Always re-mounts views and emits a snapshot.
   */
  applyDrop(sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge): void {
    if (!this.tree) {
      // No layout yet; drop becomes a single leaf.
      this.tree = { kind: 'leaf', id: `pane-${sourceTabId}`, tabId: sourceTabId };
      this.applyLayout();
      return;
    }
    // Remove the source from its current position (if present), then drop.
    const without = removeTab(this.tree, sourceTabId);
    // If target was the source's pane and we're center-dropping, that's a no-op.
    if (without === null) {
      // Removed the only leaf; result depends on the edge.
      this.tree = { kind: 'leaf', id: `pane-${sourceTabId}`, tabId: sourceTabId };
      this.applyLayout();
      return;
    }
    // If the target pane no longer exists after removal (target == source's
    // pane and that pane collapsed), recover by treating as a single-leaf set.
    const stillHasTarget = findPaneById(without, targetPaneId) !== undefined;
    if (!stillHasTarget) {
      this.tree = without;
      this.applyLayout();
      return;
    }
    this.tree = applyDrop(without, sourceTabId, targetPaneId, edge);
    this.applyLayout();
  }

  private applyLayout(): void {
    if (this.window.isDestroyed()) return;
    const { width, height } = this.window.getContentBounds();
    this.chromeView.setBounds({ x: 0, y: 0, width, height });

    // Top-bar layout: tabs in titlebar (38) + url row (52) = 90.
    // Right chat sidebar (340) when visible.
    const topInset = TOP_BAR_HEIGHT;
    const rightInset = this.chatVisible ? CHAT_SIDEBAR_WIDTH : 0;
    const paneViewport: Rect = {
      x: 0,
      y: topInset,
      width: Math.max(0, width - rightInset),
      height: Math.max(0, height - topInset),
    };

    const snapshotLeaves: SnapshotLeaf[] = [];
    let snapshotDividers: SnapshotDivider[] = [];

    if (!this.tree) {
      this.unmountAll();
    } else {
      const rects = layout(this.tree, paneViewport, DIVIDER_THICKNESS);
      const wanted = new Set<TabId>();

      for (const leaf of leaves(this.tree)) {
        const rect = rects.get(leaf.id);
        const view = this.tabManager.getView(leaf.tabId);
        if (!rect || !view) continue;

        // For sable://newtab pseudo-tabs, leave the WebContentsView
        // unmounted so the chrome's NTP renders into this rect without
        // occlusion. Still record the leaf in the snapshot so the chrome
        // knows the geometry.
        const tabState = this.tabManager.get(leaf.tabId);
        const isNewTab = tabState?.url === 'sable://newtab';

        if (isNewTab) {
          if (this.mounted.has(leaf.tabId)) {
            this.safeRemove(view);
            this.mounted.delete(leaf.tabId);
          }
        } else {
          if (!this.mounted.has(leaf.tabId)) {
            this.window.contentView.addChildView(view);
            this.mounted.add(leaf.tabId);
          }
          view.setBounds(rect);
        }
        wanted.add(leaf.tabId);

        snapshotLeaves.push({ paneId: leaf.id, tabId: leaf.tabId, rect });
      }

      // Unmount tabs that left the tree (closed or moved out).
      for (const id of [...this.mounted]) {
        if (wanted.has(id)) continue;
        const view = this.tabManager.getView(id);
        if (view) this.safeRemove(view);
        this.mounted.delete(id);
      }

      snapshotDividers = computeDividers(this.tree, paneViewport, DIVIDER_THICKNESS);
    }

    this.emitSnapshot({
      tree: this.tree,
      leaves: snapshotLeaves,
      dividers: snapshotDividers,
      paneOrigin: { x: paneViewport.x, y: paneViewport.y },
    });
  }

  /** Resize a split's ratio. Live during divider drag. */
  applyResize(splitId: PaneId, newRatio: number): void {
    if (!this.tree) return;
    this.tree = resize(this.tree, splitId, newRatio);
    this.applyLayout();
  }

  private emitSnapshot(snapshot: LayoutSnapshot): void {
    for (const cb of this.snapshotListeners) {
      try {
        cb(snapshot);
      } catch (err) {
        // Swallow — listener errors must not break layout.
        process.stderr.write(`layout snapshot listener error: ${String(err)}\n`);
      }
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
