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
  activateTab,
  applyDrop,
  dividers as computeDividers,
  findLeafByTab,
  findPaneById,
  layout,
  leaves,
  popTab,
  removeTab,
  resize,
  type DropEdge,
  type LeafPane,
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
/** Default chat sidebar width — overridden live by `setChatWidth` IPC. */
const CHAT_SIDEBAR_WIDTH_DEFAULT = 340;
const DIVIDER_THICKNESS = 4;
/**
 * Reserved height at the top of every pane in multi-pane mode for the
 * chrome's per-pane mini URL bar. The WCV mounts inset by this much from
 * the top so it doesn't paint over the bar; in single-pane mode the inset
 * is 0 (the global URL bar handles navigation).
 */
const PANE_HEADER_HEIGHT = 36;

export type SnapshotLeaf = {
  readonly paneId: PaneId;
  /** All tabs stacked into this pane, in stack order. The chrome reads this
   *  to render tab-group brackets in the strip. */
  readonly tabIds: readonly TabId[];
  /** Which tab in the stack is actually rendered into the rect (i.e. whose
   *  WebContentsView main has mounted). */
  readonly activeTabId: TabId;
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
  private chatWidth = CHAT_SIDEBAR_WIDTH_DEFAULT;

  /** Last-seen URL per tab — used to detect transitions in/out of
   *  sable://newtab so we can mount/unmount the WebContentsView. */
  private readonly lastUrl = new Map<TabId, string>();

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

    // When a tab transitions across the sable://newtab boundary (either
    // direction), the WebContentsView's mount state must change. Reflow.
    tabManager.onUpdate((state) => {
      const prev = this.lastUrl.get(state.id);
      this.lastUrl.set(state.id, state.url);
      if (prev === undefined) return;
      const wasNewTab = prev === 'sable://newtab';
      const isNewTab = state.url === 'sable://newtab';
      if (wasNewTab !== isNewTab) this.applyLayout();
    });
    tabManager.onRemove((id) => {
      this.lastUrl.delete(id);
    });
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

  /** Update the chat sidebar's pixel width and reflow tab views. Called
   *  every pointermove of the chrome's resize handle so resize feels live.
   *  Bounds are clamped here too — defensive, the chrome already clamps. */
  setChatWidth(width: number): void {
    const clamped = Math.min(900, Math.max(240, Math.round(width)));
    if (this.chatWidth === clamped) return;
    this.chatWidth = clamped;
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
      // No layout yet; drop becomes a single-tab leaf.
      this.tree = singleLeaf(sourceTabId);
      this.applyLayout();
      return;
    }
    // Remove the source from its current position (if present), then drop.
    const without = removeTab(this.tree, sourceTabId);
    if (without === null) {
      // Removed the only leaf in the only pane; just plant the source again.
      this.tree = singleLeaf(sourceTabId);
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

  /**
   * Single-tab placement: replace the tree with a single-leaf for `tabId`.
   * Used for ungrouped tabs and "open new tab" path.
   */
  bringTabIntoView(tabId: TabId, _activeTabId: TabId | null): void {
    this.tree = singleLeaf(tabId);
    this.applyLayout();
  }

  /**
   * Lay out a tab group as a horizontal split — every member becomes its
   * own leaf, side-by-side in the order they appear in `memberIds` (which
   * is TabManager insertion order, matching the strip). Used both when
   * forming a group via drag and when switching back into one of its tabs
   * later (the group's split persists across switches).
   *
   * `activeTabId`, if provided and a member, becomes the focused leaf —
   * just affects which leaf's content is the "primary" focus from the
   * window manager's perspective. The leaves themselves all render their
   * own tab regardless.
   */
  openGroup(memberIds: readonly TabId[]): void {
    if (memberIds.length === 0) {
      this.tree = null;
      this.applyLayout();
      return;
    }
    if (memberIds.length === 1) {
      this.tree = singleLeaf(memberIds[0]!);
      this.applyLayout();
      return;
    }
    this.tree = buildHorizontalSplit(memberIds);
    this.applyLayout();
  }

  /**
   * Remove a tab from the tree. Used when the tab is being closed. Collapses
   * its leaf if it was the last tab in that stack; collapses parent splits
   * if the leaf disappears entirely. Returns the next tab to focus (the new
   * activeTabId of whatever leaf the closed tab was in, or any remaining
   * leaf, or null if the tree empties).
   */
  removeTab(tabId: TabId): TabId | null {
    if (!this.tree) return null;
    const leaf = findLeafByTab(this.tree, tabId);
    this.tree = removeTab(this.tree, tabId);
    this.applyLayout();
    if (!this.tree) return null;
    // Prefer the same leaf's new active tab; otherwise any leaf's active.
    if (leaf) {
      const survivor = findPaneById(this.tree, leaf.id);
      if (survivor && survivor.kind === 'leaf') return survivor.activeTabId;
    }
    const all = leaves(this.tree);
    return all[0]?.activeTabId ?? null;
  }

  /**
   * Activate a tab inside whatever leaf currently holds it. Pure no-op if
   * the tab isn't in the tree. Reflows on success so its WebContentsView
   * gets mounted in place of whichever sibling was active.
   */
  activateTab(tabId: TabId): void {
    if (!this.tree) return;
    const next = activateTab(this.tree, tabId);
    if (next === this.tree) return;
    this.tree = next;
    this.applyLayout();
  }

  /** Returns the leaf containing this tab, or null. */
  findLeafContaining(tabId: TabId): LeafPane | null {
    if (!this.tree) return null;
    return findLeafByTab(this.tree, tabId) ?? null;
  }

  /**
   * "Ungroup" — pull `tabId` out of the leaf at `paneId` into a new sibling
   * leaf to the right (creates a horizontal split). No-op if the leaf has
   * only one tab. Reflows on success.
   */
  popTab(paneId: PaneId, tabId: TabId): void {
    if (!this.tree) return;
    const next = popTab(this.tree, paneId, tabId, 'right');
    if (next === this.tree) return;
    this.tree = next;
    this.applyLayout();
  }

  private applyLayout(): void {
    if (this.window.isDestroyed()) return;
    const { width, height } = this.window.getContentBounds();
    this.chromeView.setBounds({ x: 0, y: 0, width, height });

    // Top-bar layout depends on pane count:
    //   single-pane → titlebar (38) + global URL bar (52) = 90
    //   multi-pane  → titlebar only (38), global URL bar is hidden, every
    //                  pane carries its own 36 px mini URL bar
    // The chrome side mirrors this conditional in `UrlBar` (returns null
    // when leaves.length > 1) and in `PaneArea` (renders MiniUrlBar). Both
    // sides MUST agree — a divergence opens a visible gap between the mini
    // bar and the tab WebContentsView.
    const allLeaves = this.tree ? leaves(this.tree) : [];
    const isMultiPane = allLeaves.length > 1;
    const topInset = isMultiPane ? TITLEBAR_HEIGHT : TOP_BAR_HEIGHT;
    const rightInset = this.chatVisible ? this.chatWidth : 0;
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
      const headerInset = isMultiPane ? PANE_HEADER_HEIGHT : 0;

      for (const leaf of allLeaves) {
        const rect = rects.get(leaf.id);
        if (!rect) continue;
        // Only the leaf's active tab gets mounted; the others sit in the
        // strip waiting to be activated by the user. WCV creation already
        // happened when each tab was created in TabManager.
        const activeTabId = leaf.activeTabId;
        const view = this.tabManager.getView(activeTabId);

        // For sable://newtab pseudo-tabs, leave the WebContentsView
        // unmounted so the chrome's NTP renders into this rect without
        // occlusion. Still record the leaf in the snapshot so the chrome
        // knows the geometry.
        const tabState = this.tabManager.get(activeTabId);
        const isNewTab = tabState?.url === 'sable://newtab';

        if (view && !isNewTab) {
          if (!this.mounted.has(activeTabId)) {
            this.window.contentView.addChildView(view);
            this.mounted.add(activeTabId);
          }
          // WCV mounts under the mini URL bar in multi-pane. Snapshot keeps
          // the full pane rect so the chrome can position the bar.
          view.setBounds({
            x: rect.x,
            y: rect.y + headerInset,
            width: rect.width,
            height: Math.max(0, rect.height - headerInset),
          });
          wanted.add(activeTabId);
        }
        // (If view is missing or it's a new-tab pseudo-tab, we just don't
        // mount; the chrome will render NTP / a placeholder into the slot.)

        snapshotLeaves.push({
          paneId: leaf.id,
          tabIds: leaf.tabIds,
          activeTabId,
          rect,
        });
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

function singleLeaf(tabId: TabId): LeafPane {
  return {
    kind: 'leaf',
    id: `pane-${tabId}-${Math.random().toString(36).slice(2, 8)}`,
    tabIds: [tabId],
    activeTabId: tabId,
  };
}

function makeSplitId(): PaneId {
  return `split-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Build a left-deep horizontal split tree from a list of tab ids. With
 * N tabs each leaf gets 1/N of the viewport. Splits are recursively
 * structured as `[first | rest]` so the strip's leftmost group member
 * lands in the leftmost pane.
 */
function buildHorizontalSplit(memberIds: readonly TabId[]): Pane {
  if (memberIds.length === 1) return singleLeaf(memberIds[0]!);
  const [first, ...rest] = memberIds;
  return {
    kind: 'split',
    id: makeSplitId(),
    direction: 'h',
    ratio: 1 / memberIds.length,
    first: singleLeaf(first!),
    second: buildHorizontalSplit(rest),
  };
}

