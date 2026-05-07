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
  /** Toggled with Ctrl/Cmd-click in the sidebar. The chat orchestrator
   *  ingests every selected tab's extracted main content as additional
   *  context for the next outgoing message. */
  readonly selectedForContext: boolean;
  /** The space this tab belongs to. Set on creation, can be reassigned via
   *  setSpace() to "move" the tab between spaces. Sidebar filters its tab
   *  list by the active space, so tabs from inactive spaces are hidden. */
  readonly spaceId: string;
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

export class TabManager {
  private readonly tabs = new Map<TabId, { view: WebContentsView; state: TabState }>();
  private readonly updateListeners = new Set<UpdateListener>();
  private readonly removeListeners = new Set<RemoveListener>();

  constructor(private readonly window: BrowserWindow) {}

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
