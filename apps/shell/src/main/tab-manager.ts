// TabManager — owns the lifecycle of tab WebContentsViews.
//
// Responsibilities:
//  - create / close / navigate tabs
//  - track per-tab state (url, title, favicon, loading)
//  - emit updates so the chrome can re-render the sidebar tab list
//
// What this does NOT do:
//  - position the views (LayoutController's job)
//  - own the BSP layout tree (LayoutController's job)
//  - hibernate inactive tabs (Phase 1 next-slice)

import { BrowserWindow, WebContentsView } from 'electron';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { TabId } from '@sable/layout-engine';

/**
 * Path to the compiled tab preload. Resolved relative to dist/main where
 * this file ends up after tsc. Mirrors the chrome-preload pattern in
 * window-manager.ts.
 */
function tabPreloadPath(): string {
  return path.join(__dirname, '..', 'preload', 'tab-preload.js');
}

export type TabState = {
  readonly id: TabId;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | undefined;
  readonly loading: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  /** Epoch ms; updated on focus, navigate, and creation. Drives LRU
   *  eviction in V0.2 when active-pane cap is enforced. */
  readonly lastActiveAt: number;
};

type UpdateListener = (state: TabState) => void;
type RemoveListener = (id: TabId) => void;

export class TabManager {
  private readonly tabs = new Map<TabId, { view: WebContentsView; state: TabState }>();
  private readonly updateListeners = new Set<UpdateListener>();
  private readonly removeListeners = new Set<RemoveListener>();

  constructor(private readonly window: BrowserWindow) {}

  create(initialUrl: string): TabId {
    const id = randomUUID();
    const view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: tabPreloadPath(),
      },
    });

    const initial: TabState = {
      id,
      url: initialUrl,
      title: initialUrl,
      faviconUrl: undefined,
      loading: true,
      canGoBack: false,
      canGoForward: false,
      lastActiveAt: Date.now(),
    };
    this.tabs.set(id, { view, state: initial });
    this.wireEvents(id, view);
    view.webContents.loadURL(initialUrl).catch((err) => {
      // navigation errors are normal (typo in url, etc); surface as title.
      this.update(id, { loading: false, title: `Failed: ${err.message}` });
    });
    this.emit(initial);
    return id;
  }

  close(id: TabId): void {
    const entry = this.tabs.get(id);
    if (!entry) return;
    try {
      this.window.contentView.removeChildView(entry.view);
    } catch {
      // view may already be unmounted; ignore.
    }
    this.tabs.delete(id);
    for (const cb of this.removeListeners) cb(id);
  }

  navigate(id: TabId, url: string): void {
    const entry = this.tabs.get(id);
    if (!entry) return;
    this.update(id, { lastActiveAt: Date.now() });
    entry.view.webContents.loadURL(url).catch((err) => {
      this.update(id, { loading: false, title: `Failed: ${err.message}` });
    });
  }

  /** Mark a tab as the active focus — bumps lastActiveAt for LRU tracking. */
  markActive(id: TabId): void {
    if (!this.tabs.has(id)) return;
    this.update(id, { lastActiveAt: Date.now() });
  }

  goBack(id: TabId): void {
    this.tabs.get(id)?.view.webContents.navigationHistory.goBack();
  }

  goForward(id: TabId): void {
    this.tabs.get(id)?.view.webContents.navigationHistory.goForward();
  }

  reload(id: TabId): void {
    this.tabs.get(id)?.view.webContents.reload();
  }

  getView(id: TabId): WebContentsView | undefined {
    return this.tabs.get(id)?.view;
  }

  list(): TabState[] {
    return Array.from(this.tabs.values()).map((t) => t.state);
  }

  get(id: TabId): TabState | undefined {
    return this.tabs.get(id)?.state;
  }

  onUpdate(listener: UpdateListener): () => void {
    this.updateListeners.add(listener);
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  onRemove(listener: RemoveListener): () => void {
    this.removeListeners.add(listener);
    return () => {
      this.removeListeners.delete(listener);
    };
  }

  private wireEvents(id: TabId, view: WebContentsView): void {
    const wc = view.webContents;
    wc.on('did-start-loading', () => this.update(id, { loading: true }));
    wc.on('did-stop-loading', () => this.update(id, { loading: false, ...this.navState(id) }));
    wc.on('did-navigate', (_e, url) => this.update(id, { url, ...this.navState(id) }));
    wc.on('did-navigate-in-page', (_e, url) => this.update(id, { url, ...this.navState(id) }));
    wc.on('page-title-updated', (_e, title) => this.update(id, { title }));
    wc.on('page-favicon-updated', (_e, favicons) => {
      this.update(id, { faviconUrl: favicons[0] });
    });
  }

  private navState(id: TabId): { canGoBack: boolean; canGoForward: boolean } {
    const wc = this.tabs.get(id)?.view.webContents;
    if (!wc) return { canGoBack: false, canGoForward: false };
    return {
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
    };
  }

  private update(id: TabId, patch: Partial<TabState>): void {
    const entry = this.tabs.get(id);
    if (!entry) return;
    entry.state = { ...entry.state, ...patch, id };
    this.emit(entry.state);
  }

  private emit(state: TabState): void {
    for (const cb of this.updateListeners) cb(state);
  }
}
