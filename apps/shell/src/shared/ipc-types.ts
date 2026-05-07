// Shared IPC types between main and preload. Re-exported in preload via
// contextBridge so the chrome's UI code has type-aware completion.

import type { DropEdge, Pane, PaneId, Rect, TabId } from '@sable/layout-engine';

export type { DropEdge, Pane, PaneId, Rect, TabId };

/** A single leaf pane with its tab and current screen rect. */
export type SnapshotLeaf = {
  readonly paneId: PaneId;
  readonly tabId: TabId;
  readonly rect: Rect;
};

/** A draggable divider strip between two pane subtrees. */
export type SnapshotDivider = {
  readonly splitId: PaneId;
  readonly direction: 'h' | 'v';
  readonly rect: Rect;
  readonly parentRect: Rect;
};

/**
 * Broadcasted to the chrome on every layout reflow. We ship a pre-computed
 * leaf + divider list so the chrome doesn't have to walk the BSP tree
 * (which would require importing layout-engine functions across the Vite
 * bundling boundary). The full `tree` is included for future features.
 */
export type LayoutSnapshot = {
  readonly tree: Pane | null;
  readonly leaves: readonly SnapshotLeaf[];
  readonly dividers: readonly SnapshotDivider[];
  /** Window-coordinate origin of the pane area (sidebar+titlebar offset). */
  readonly paneOrigin: { readonly x: number; readonly y: number };
};

export type TabState = {
  readonly id: TabId;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | undefined;
  readonly loading: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
};

export type SableApi = {
  readonly tabs: {
    create(url: string): Promise<TabId>;
    close(id: TabId): Promise<void>;
    navigate(id: TabId, url: string): Promise<void>;
    setActive(id: TabId): Promise<void>;
    getActive(): Promise<TabId | null>;
    goBack(id: TabId): Promise<void>;
    goForward(id: TabId): Promise<void>;
    reload(id: TabId): Promise<void>;
    list(): Promise<TabState[]>;
  };
  readonly layout: {
    /** Hide all tab WebContentsViews so chrome-side drop overlays receive events. */
    dragStart(): Promise<void>;
    /** Restore tab WebContentsViews to their tree-derived positions. */
    dragEnd(): Promise<void>;
    /** Apply a drop to the tree and reflow. */
    drop(sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge): Promise<void>;
    /** Resize a split's ratio (live during divider drag). */
    resize(splitId: PaneId, newRatio: number): Promise<void>;
  };
  readonly on: {
    tabUpdated(cb: (state: TabState) => void): () => void;
    tabRemoved(cb: (id: TabId) => void): () => void;
    activeChanged(cb: (id: TabId | null) => void): () => void;
    layoutChanged(cb: (snapshot: LayoutSnapshot) => void): () => void;
  };
};

export const IpcChannels = {
  TabsCreate: 'tabs:create',
  TabsClose: 'tabs:close',
  TabsNavigate: 'tabs:navigate',
  TabsSetActive: 'tabs:setActive',
  TabsGetActive: 'tabs:getActive',
  TabsGoBack: 'tabs:goBack',
  TabsGoForward: 'tabs:goForward',
  TabsReload: 'tabs:reload',
  TabsList: 'tabs:list',
  TabsUpdated: 'tabs:updated',
  TabsRemoved: 'tabs:removed',
  TabsActiveChanged: 'tabs:activeChanged',
  LayoutChanged: 'layout:changed',
  LayoutDragStart: 'layout:dragStart',
  LayoutDragEnd: 'layout:dragEnd',
  LayoutDrop: 'layout:drop',
  LayoutResize: 'layout:resize',
} as const;
