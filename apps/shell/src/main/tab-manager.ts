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
import type { HistoryManager } from './history-manager';

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
  /** Toggled with Ctrl/Cmd-click in the sidebar. The chat orchestrator
   *  ingests every selected tab's extracted main content as additional
   *  context for the next outgoing message. */
  readonly selectedForContext: boolean;
  /** The space this tab belongs to. Set on creation, can be reassigned via
   *  setSpace() to "move" the tab between spaces. Sidebar filters its tab
   *  list by the active space, so tabs from inactive spaces are hidden. */
  readonly spaceId: string;
  /** Tab group id (Chrome / Edge "tab group" idiom). Tabs sharing a groupId
   *  render together in the strip with a coloured wrap, and feed the chat as
   *  a unit when one of them is the active tab. Undefined = ungrouped. */
  readonly groupId: string | undefined;
};

/** Result of running the in-page content extractor (Phase 4). */
export type ExtractedTabContent = {
  readonly tabId: TabId;
  readonly title: string;
  readonly url: string;
  readonly text: string;
  readonly truncated: boolean;
  readonly extractedAt: number;
};

type UpdateListener = (state: TabState) => void;
type RemoveListener = (id: TabId) => void;
type ReorderListener = (orderedIds: readonly TabId[]) => void;

export class TabManager {
  private readonly tabs = new Map<TabId, { view: WebContentsView; state: TabState }>();
  private readonly updateListeners = new Set<UpdateListener>();
  private readonly removeListeners = new Set<RemoveListener>();
  private readonly reorderListeners = new Set<ReorderListener>();

  constructor(
    private readonly window: BrowserWindow,
    private readonly history?: HistoryManager,
  ) {}

  create(initialUrl: string, spaceId: string): TabId {
    const id = randomUUID();
    const view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: tabPreloadPath(),
      },
    });

    const isNewTab = initialUrl === 'sable://newtab' || !initialUrl;
    const initial: TabState = {
      id,
      url: initialUrl,
      title: isNewTab ? 'New Tab' : initialUrl,
      faviconUrl: undefined,
      loading: !isNewTab,
      canGoBack: false,
      canGoForward: false,
      lastActiveAt: Date.now(),
      selectedForContext: false,
      spaceId,
      groupId: undefined,
    };
    this.tabs.set(id, { view, state: initial });
    this.wireEvents(id, view);
    if (!isNewTab) {
      view.webContents.loadURL(initialUrl).catch((err) => {
        // navigation errors are normal (typo in url, etc); surface as title.
        this.update(id, { loading: false, title: `Failed: ${err.message}` });
      });
    }
    // For sable://newtab the WebContents stays empty and the chrome's NTP
    // component fills the leaf rect (LayoutController skips mounting it).
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
    this.update(id, { lastActiveAt: Date.now(), url, loading: url !== 'sable://newtab' });
    if (url === 'sable://newtab') return;
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

  setSelectedForContext(id: TabId, selected: boolean): void {
    if (!this.tabs.has(id)) return;
    this.update(id, { selectedForContext: selected });
  }

  setSpace(id: TabId, spaceId: string): void {
    if (!this.tabs.has(id)) return;
    this.update(id, { spaceId });
  }

  /**
   * Group two tabs together. If either tab is already in a group, the other
   * joins that existing group; if both are in (different) groups, the source's
   * group merges into the target's. Returns the resulting groupId.
   */
  joinGroup(sourceId: TabId, targetId: TabId): string | null {
    const src = this.tabs.get(sourceId)?.state;
    const tgt = this.tabs.get(targetId)?.state;
    if (!src || !tgt || src.id === tgt.id) return null;
    let groupId = tgt.groupId ?? src.groupId ?? null;
    if (!groupId) groupId = `g-${randomUUID().slice(0, 8)}`;
    // If source's old group differs from target's, fold it in by rewriting
    // every member of source's old group to the target's id.
    if (src.groupId && src.groupId !== groupId) {
      const orphan = src.groupId;
      for (const entry of this.tabs.values()) {
        if (entry.state.groupId === orphan) this.update(entry.state.id, { groupId });
      }
    } else if (src.groupId !== groupId) {
      this.update(sourceId, { groupId });
    }
    if (tgt.groupId !== groupId) this.update(targetId, { groupId });
    return groupId;
  }

  /**
   * Pull a tab out of its group. If the group is left with a single member,
   * dissolve it (a group of one is just a regular tab) so the wrap visual
   * does not linger.
   */
  leaveGroup(id: TabId): void {
    const state = this.tabs.get(id)?.state;
    if (!state || !state.groupId) return;
    const groupId = state.groupId;
    this.update(id, { groupId: undefined });
    const remaining = Array.from(this.tabs.values()).filter(
      (e) => e.state.groupId === groupId,
    );
    if (remaining.length <= 1) {
      for (const e of remaining) this.update(e.state.id, { groupId: undefined });
    }
  }

  /**
   * Dissolve the whole group containing `id` — every member loses its
   * groupId. Used by "Unsplit" to collapse a multi-pane group back to a
   * single-tab layout in one shot.
   */
  dissolveGroup(id: TabId): void {
    const state = this.tabs.get(id)?.state;
    if (!state || !state.groupId) return;
    const groupId = state.groupId;
    for (const entry of this.tabs.values()) {
      if (entry.state.groupId === groupId) {
        this.update(entry.state.id, { groupId: undefined });
      }
    }
  }

  /**
   * Returns every tab id currently sharing a group, in TabManager insertion
   * order, including the queried tab. Empty list if the tab has no group.
   */
  groupMembers(id: TabId): TabId[] {
    const state = this.tabs.get(id)?.state;
    if (!state || !state.groupId) return [];
    const groupId = state.groupId;
    const out: TabId[] = [];
    for (const entry of this.tabs.values()) {
      if (entry.state.groupId === groupId) out.push(entry.state.id);
    }
    return out;
  }

  /**
   * List tabs currently flagged for context, sorted oldest-selected first
   * so callers can apply greedy-by-recency budgeting trivially. (We don't
   * track selection time per tab yet, so the order matches insertion order
   * in the Map. Good enough for V0.1.)
   */
  selectedForContext(): TabState[] {
    const out: TabState[] = [];
    for (const entry of this.tabs.values()) {
      if (entry.state.selectedForContext) out.push(entry.state);
    }
    return out;
  }

  /**
   * Extract main content from a tab's webContents using a self-contained
   * inline JS extractor. Finds the best content block (article, main, or
   * largest text container in body), returns clean text capped at MAX_CHARS.
   *
   * V0.1 heuristic only — Mozilla Readability + Defuddle in V0.2.
   */
  async extractContent(id: TabId): Promise<ExtractedTabContent | null> {
    const entry = this.tabs.get(id);
    if (!entry) return null;
    if (entry.state.loading) {
      // Wait briefly if the page is still loading; otherwise extraction
      // grabs partial DOM. This keeps the UX consistent without making
      // the user pre-load every tab.
      await wait(300);
    }
    try {
      const result = (await entry.view.webContents.executeJavaScript(EXTRACTOR_SOURCE, true)) as {
        text: string;
        truncated: boolean;
      };
      return {
        tabId: id,
        title: entry.state.title || entry.state.url,
        url: entry.state.url,
        text: result.text,
        truncated: result.truncated,
        extractedAt: Date.now(),
      };
    } catch {
      return null;
    }
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

  onReorder(listener: ReorderListener): () => void {
    this.reorderListeners.add(listener);
    return () => {
      this.reorderListeners.delete(listener);
    };
  }

  /**
   * Move `sourceId` to sit immediately after `targetId` in the tabs Map's
   * iteration order. Used to reorder tabs within a group when the user
   * drags a pill onto another pill in the same group. Mutates the Map in
   * place (clear + re-set) and broadcasts the new full ordering.
   */
  reorderAfter(sourceId: TabId, targetId: TabId): void {
    if (sourceId === targetId) return;
    const source = this.tabs.get(sourceId);
    if (!source || !this.tabs.has(targetId)) return;
    const entries = Array.from(this.tabs.entries()).filter(([id]) => id !== sourceId);
    const tIdx = entries.findIndex(([id]) => id === targetId);
    if (tIdx === -1) return;
    entries.splice(tIdx + 1, 0, [sourceId, source]);
    this.tabs.clear();
    for (const [id, entry] of entries) this.tabs.set(id, entry);
    const orderedIds = entries.map(([id]) => id);
    for (const cb of this.reorderListeners) cb(orderedIds);
  }

  private wireEvents(id: TabId, view: WebContentsView): void {
    const wc = view.webContents;
    wc.on('did-start-loading', () => this.update(id, { loading: true }));
    wc.on('did-stop-loading', () => this.update(id, { loading: false, ...this.navState(id) }));
    wc.on('did-navigate', (_e, url) => {
      this.update(id, { url, ...this.navState(id) });
      this.recordHistory(id);
    });
    wc.on('did-navigate-in-page', (_e, url) => {
      this.update(id, { url, ...this.navState(id) });
      this.recordHistory(id);
    });
    wc.on('page-title-updated', (_e, title) => {
      this.update(id, { title });
      this.recordHistory(id);
    });
    wc.on('page-favicon-updated', (_e, favicons) => {
      this.update(id, { faviconUrl: favicons[0] });
    });
  }

  private recordHistory(id: TabId): void {
    if (!this.history) return;
    const state = this.tabs.get(id)?.state;
    if (!state) return;
    this.history.record({ url: state.url, title: state.title });
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

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Self-contained extractor injected via webContents.executeJavaScript. Must
 * not reference any outside symbols. Returns { text, truncated }.
 *
 * Strategy:
 *  1. Prefer document.querySelector('article') or 'main' if present.
 *  2. Otherwise pick the descendant of body with the highest text-density.
 *  3. Trim, collapse whitespace, cap at MAX_CHARS.
 */
const EXTRACTOR_SOURCE = `(() => {
  const MAX_CHARS = 6000;

  function textOf(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);
    // Strip script/style/nav/footer/aside noise.
    clone.querySelectorAll('script,style,noscript,nav,header,footer,aside,form,svg,button').forEach(n => n.remove());
    return (clone.innerText || clone.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  function pickBest() {
    const article = document.querySelector('article');
    if (article && textOf(article).length > 200) return article;
    const main = document.querySelector('main');
    if (main && textOf(main).length > 200) return main;
    // Fall back: scan candidates and pick the densest.
    const candidates = Array.from(document.querySelectorAll('section, div, body'));
    let best = document.body;
    let bestScore = textOf(document.body).length;
    for (const c of candidates) {
      const t = textOf(c).length;
      if (t > bestScore) { best = c; bestScore = t; }
    }
    return best;
  }

  const target = pickBest();
  let text = textOf(target);
  let truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + '…';
    truncated = true;
  }
  return { text, truncated };
})();`;
