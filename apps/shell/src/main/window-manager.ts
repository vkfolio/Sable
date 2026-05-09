// WindowManager — owns the BrowserWindow + chrome WebContents + TabManager
// + LayoutController. Wires IPC between chrome and main.
//
// V0.1 model: one BrowserWindow, one chrome WebContents, N tab WebContentsViews.
// The chrome lives at the bottom of the contentView z-stack; tab views are
// added on top, positioned in the pane area only (right of sidebar, below
// titlebar). The chrome's pane region shows through anywhere a tab view
// doesn't cover (used for split dividers + drop overlays in later slices).

import { BrowserWindow, WebContentsView, app, ipcMain } from 'electron';
import path from 'node:path';
import type { DropEdge, PaneId, TabId } from '@sable/layout-engine';
import { getWindowControls } from './platform/window-controls';
import { TabManager } from './tab-manager';
import { LayoutController } from './layout-controller';
import { ChatOrchestrator, resolveImage } from './chat-orchestrator';
import { HistoryManager } from './history-manager';
import { SettingsStore, type ProviderId } from './settings-store';
import { LocalModelManager, type LocalModelVariantId } from './local-model-manager';
import { SpaceManager, type SpaceId } from './space-manager';
import {
  IpcChannels,
  type ChatSendContent,
  type SettingsSnapshot,
  type SpacesSnapshot,
} from '../shared/ipc-types';

const HOMEPAGE = 'sable://newtab';

export class WindowManager {
  private window: BrowserWindow | undefined;
  private chrome: WebContentsView | undefined;
  private tabs: TabManager | undefined;
  private layout: LayoutController | undefined;
  private chat: ChatOrchestrator | undefined;
  private readonly settings = new SettingsStore();
  private readonly localModels = new LocalModelManager();
  private readonly history = new HistoryManager();
  private readonly spaces = new SpaceManager();
  private spacesLoaded = false;
  private activeTabId: TabId | null = null;
  private ipcRegistered = false;
  /** Single-flight controller for the NTP intent resolver — cancelled when
   *  a new resolve arrives while one is in flight (local Qwen can't handle
   *  concurrent generations). */
  private intentAbort: AbortController | null = null;

  /** Load persistence + native sidecars before showing UI. */
  async preload(): Promise<void> {
    if (!this.spacesLoaded) {
      await this.spaces.load();
      this.spacesLoaded = true;
    }
  }

  open(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      this.focus();
      return this.window;
    }

    const controls = getWindowControls();

    const win = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 720,
      minHeight: 480,
      backgroundColor: '#0b0b0c',
      show: false,
      webPreferences: { contextIsolation: true, sandbox: true },
      ...controls.windowOptions,
    });

    const chrome = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        // sandbox: false is intentional. The chrome WebContents only ever
        // loads our local renderer/chrome.html — no third-party content is
        // ever rendered here. With sandbox: true, the preload cannot resolve
        // relative imports across multiple compiled .js files (it needs to be
        // a single bundled artifact). We can revisit by bundling preload via
        // esbuild in a later slice. Tab WebContentsViews (which DO load
        // arbitrary web content) keep sandbox: true.
        sandbox: false,
        preload: this.preloadPath(),
      },
    });

    win.contentView.addChildView(chrome);

    const tabs = new TabManager(win, this.history);
    const layout = new LayoutController(win, tabs, chrome, controls.titleBarHeight);
    const chat = new ChatOrchestrator(
      this.settings,
      (event) => {
        // AG-UI events forwarded to the chrome over IPC. Plain JSON; preload
        // wraps with `window.sable.on.agentEvent`.
        this.chrome?.webContents.send(IpcChannels.ChatAgentEvent, event);
      },
      this.localModels,
    );

    this.window = win;
    this.chrome = chrome;
    this.tabs = tabs;
    this.layout = layout;
    this.chat = chat;

    chrome.webContents.on('console-message', (_e, _level, message) => {
      process.stdout.write(`[chrome] ${message}\n`);
    });

    // Auto-open DevTools only when SABLE_DEV is set. F12 toggles it
    // anytime regardless.
    if (process.env['SABLE_DEV']) {
      chrome.webContents.openDevTools({ mode: 'detach' });
    }

    // F12 / Ctrl+Shift+I toggle DevTools for the chrome (and tab views in
    // future). before-input-event sees keys before the renderer.
    win.webContents.on('before-input-event', (_e, input) => {
      if (input.type !== 'keyDown') return;
      const key = input.key.toLowerCase();
      if (key === 'f12' || (input.control && input.shift && key === 'i')) {
        if (chrome.webContents.isDevToolsOpened()) chrome.webContents.closeDevTools();
        else chrome.webContents.openDevTools({ mode: 'detach' });
      }
    });
    chrome.webContents.on('before-input-event', (_e, input) => {
      if (input.type !== 'keyDown') return;
      const key = input.key.toLowerCase();
      if (key === 'f12' || (input.control && input.shift && key === 'i')) {
        if (chrome.webContents.isDevToolsOpened()) chrome.webContents.closeDevTools();
        else chrome.webContents.openDevTools({ mode: 'detach' });
      }
    });

    this.registerIpcOnce();
    this.wireTabForwarding();

    chrome.webContents.once('did-finish-load', () => {
      this.broadcastSpacesSnapshot();
      // If the active space already has a layout tree (because we switched
      // back into it within this session), reuse it. Otherwise open the
      // homepage as the seed.
      const seedTree = this.spacesLoaded ? this.spaces.active().layoutTree : null;
      if (seedTree) {
        this.layout?.setTree(seedTree);
      } else {
        this.openTab(HOMEPAGE);
      }
      if (!win.isDestroyed()) win.show();
    });

    void this.loadChromeInto(chrome);

    const broadcastMaximized = () => {
      if (win.isDestroyed()) return;
      this.chrome?.webContents.send(IpcChannels.WindowMaximizedChanged, win.isMaximized());
    };
    win.on('maximize', broadcastMaximized);
    win.on('unmaximize', broadcastMaximized);
    win.on('enter-full-screen', broadcastMaximized);
    win.on('leave-full-screen', broadcastMaximized);

    win.on('closed', () => {
      this.window = undefined;
      this.chrome = undefined;
      this.tabs = undefined;
      this.layout = undefined;
      this.chat = undefined;
      this.activeTabId = null;
    });

    return win;
  }

  focus(): void {
    if (!this.window || this.window.isDestroyed()) return;
    if (this.window.isMinimized()) this.window.restore();
    this.window.focus();
  }

  // ------- tab orchestration -------

  private openTab(url: string): TabId {
    const spaceId = this.spacesLoaded ? this.spaces.activeId() : '';
    const id = this.tabs!.create(url, spaceId);
    // Ctrl+T never auto-joins a group — new tabs always open as a single-
    // tab leaf (replacing whatever the previous solo layout was).
    this.layout!.bringTabIntoView(id, this.activeTabId);
    this.activeTabId = id;
    this.tabs!.markActive(id);
    this.broadcastActiveChanged();
    return id;
  }

  /**
   * Switch to a tab. Handles three cases:
   *   1. Tab is in the current tree → just activate (no relayout — keeps
   *      any persistent split that was built for a group).
   *   2. Tab has a groupId → relay out as the group's split so every group
   *      member is visible at once.
   *   3. Plain background tab → single-tab leaf swap.
   */
  private switchTab(id: TabId): void {
    if (!this.tabs!.get(id)) return;
    const leaf = this.layout!.findLeafContaining(id);
    if (leaf) {
      this.layout!.activateTab(id);
    } else {
      const members = this.tabs!.groupMembers(id);
      if (members.length > 1) {
        this.layout!.openGroup(members);
      } else {
        this.layout!.bringTabIntoView(id, this.activeTabId);
      }
    }
    this.activeTabId = id;
    this.tabs!.markActive(id);
    this.broadcastActiveChanged();
  }

  private closeTab(id: TabId): void {
    const wasActive = this.activeTabId === id;
    this.tabs!.close(id);
    const nextActive = this.layout!.removeTab(id);
    if (wasActive) {
      if (nextActive) {
        this.switchTab(nextActive);
      } else {
        // Tree fully empty: nothing to focus.
        this.activeTabId = null;
        this.broadcastActiveChanged();
      }
    }
  }

  // ------- IPC -------

  private registerIpcOnce(): void {
    if (this.ipcRegistered) return;
    this.ipcRegistered = true;

    ipcMain.handle(IpcChannels.TabsCreate, (_e, url: string) => this.openTab(url));
    ipcMain.handle(IpcChannels.TabsClose, (_e, id: TabId) => this.closeTab(id));
    ipcMain.handle(IpcChannels.TabsSetActive, (_e, id: TabId) => this.switchTab(id));
    ipcMain.handle(IpcChannels.TabsGetActive, () => this.activeTabId);
    ipcMain.handle(IpcChannels.TabsNavigate, (_e, id: TabId, url: string) => {
      this.tabs?.navigate(id, url);
    });
    ipcMain.handle(IpcChannels.TabsGoBack, (_e, id: TabId) => this.tabs?.goBack(id));
    ipcMain.handle(IpcChannels.TabsGoForward, (_e, id: TabId) => this.tabs?.goForward(id));
    ipcMain.handle(IpcChannels.TabsReload, (_e, id: TabId) => this.tabs?.reload(id));
    ipcMain.handle(IpcChannels.TabsList, () => this.tabs?.list() ?? []);
    ipcMain.handle(IpcChannels.TabsSetSelectedForContext, (_e, id: TabId, selected: boolean) => {
      this.tabs?.setSelectedForContext(id, selected);
    });
    ipcMain.handle(IpcChannels.TabsExtractContent, async (_e, id: TabId) => {
      return (await this.tabs?.extractContent(id)) ?? null;
    });
    ipcMain.handle(IpcChannels.TabsSetSpace, (_e, id: TabId, spaceId: SpaceId) => {
      this.tabs?.setSpace(id, spaceId);
    });
    ipcMain.handle(IpcChannels.TabsJoinGroup, (_e, sourceId: TabId, targetId: TabId) => {
      if (!this.tabs) return null;
      const sState = this.tabs.get(sourceId);
      const tState = this.tabs.get(targetId);
      if (!sState || !tState) return null;
      // Already in the same group → reorder: place source right after target
      // and rebuild the split with the new ordering.
      if (sState.groupId && sState.groupId === tState.groupId) {
        this.tabs.reorderAfter(sourceId, targetId);
        const members = this.tabs.groupMembers(sourceId);
        if (members.length > 1) this.layout?.openGroup(members);
        return sState.groupId;
      }
      // Otherwise: form / fold the group and auto-split.
      const gid = this.tabs.joinGroup(sourceId, targetId) ?? null;
      if (gid) {
        const members = this.tabs.groupMembers(sourceId);
        if (members.length > 1) {
          this.layout?.openGroup(members);
          this.activeTabId = sourceId;
          this.tabs.markActive(sourceId);
          this.broadcastActiveChanged();
        }
      }
      return gid;
    });
    ipcMain.handle(IpcChannels.TabsLeaveGroup, (_e, id: TabId) => {
      if (!this.tabs) return;
      this.tabs.leaveGroup(id);
      // After leaving, the just-ungrouped tab should fall out of the split
      // into a single-leaf layout. Remaining group members (if any) stay
      // grouped — re-place them as a smaller split.
      const remaining = this.tabs.groupMembers(this.activeTabId ?? id);
      if (remaining.length > 1) {
        this.layout?.openGroup(remaining);
      } else {
        this.layout?.bringTabIntoView(id, this.activeTabId);
        this.activeTabId = id;
        this.tabs.markActive(id);
        this.broadcastActiveChanged();
      }
    });
    ipcMain.handle(IpcChannels.TabsDissolveGroup, (_e, id: TabId) => {
      if (!this.tabs) return;
      this.tabs.dissolveGroup(id);
      // Group is gone → collapse layout to single-pane on the active tab.
      const focus = this.activeTabId ?? id;
      this.layout?.bringTabIntoView(focus, this.activeTabId);
      this.activeTabId = focus;
      this.tabs.markActive(focus);
      this.broadcastActiveChanged();
    });

    ipcMain.handle(IpcChannels.LayoutDragStart, () => this.layout?.setDragMode(true));
    ipcMain.handle(IpcChannels.LayoutDragEnd, () => this.layout?.setDragMode(false));
    ipcMain.handle(IpcChannels.LayoutDrop,
      (_e, sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge) => {
        if (!this.layout) return;
        this.layout.applyDrop(sourceTabId, targetPaneId, edge);
        // After drop, the source tab should become active so its WebContentsView
        // is the focused one in the new layout.
        this.activeTabId = sourceTabId;
        this.broadcastActiveChanged();
      },
    );
    ipcMain.handle(IpcChannels.LayoutPopTab, (_e, paneId: PaneId, tabId: TabId) => {
      this.layout?.popTab(paneId, tabId);
      // After popping, focus the popped tab so it's the active in its new
      // single-tab leaf and the user sees it immediately.
      this.activeTabId = tabId;
      this.tabs?.markActive(tabId);
      this.broadcastActiveChanged();
    });
    ipcMain.handle(IpcChannels.LayoutResize, (_e, splitId: PaneId, newRatio: number) => {
      this.layout?.applyResize(splitId, newRatio);
    });
    ipcMain.handle(IpcChannels.ChromeSetOverlay, (_e, active: boolean) => {
      // Modals (SettingsDialog, etc) and the drag-to-split protocol both
      // need the tab views temporarily out of the way so the chrome's React
      // layer can render and receive pointer events. setDragMode() is the
      // underlying primitive — name aside, it's exactly the right
      // mechanism here.
      this.layout?.setDragMode(active);
    });
    ipcMain.handle(IpcChannels.ChromeSetChatVisible, (_e, visible: boolean) => {
      this.layout?.setChatVisible(visible);
    });
    ipcMain.handle(IpcChannels.ChromeSetChatWidth, (_e, width: number) => {
      this.layout?.setChatWidth(width);
    });
    ipcMain.handle(IpcChannels.ChromeSetTheme, () => {
      // No-op now that the chrome paints its own min/max/close — there is no
      // native title-bar overlay to recolor. Kept as a stable IPC so the
      // renderer doesn't need a platform branch when applying a theme.
    });

    // ---- custom window controls ----
    ipcMain.handle(IpcChannels.WindowMinimize, () => {
      this.window?.minimize();
    });
    ipcMain.handle(IpcChannels.WindowMaximizeToggle, () => {
      if (!this.window || this.window.isDestroyed()) return;
      if (this.window.isMaximized()) this.window.unmaximize();
      else this.window.maximize();
    });
    ipcMain.handle(IpcChannels.WindowClose, () => {
      this.window?.close();
    });
    ipcMain.handle(IpcChannels.WindowIsMaximized, () => {
      return !!this.window && !this.window.isDestroyed() && this.window.isMaximized();
    });

    // ---- chat ----
    ipcMain.handle(IpcChannels.ChatSend, (_e, conversationId: string, content: ChatSendContent) => {
      if (!this.chat) throw new Error('chat orchestrator not ready');
      return this.chat.send(conversationId, content);
    });
    ipcMain.handle(IpcChannels.ChatStop, (_e, runId: string) => {
      this.chat?.stop(runId);
    });
    ipcMain.handle(IpcChannels.ChatGetHistory, (_e, conversationId: string) => {
      return this.chat?.getMessages(conversationId) ?? [];
    });
    ipcMain.handle(IpcChannels.ChatResolveImage, async (_e, srcUrl: string) => {
      return resolveImage(srcUrl);
    });
    ipcMain.handle(IpcChannels.HistoryRecent, (_e, limit?: number) => {
      return this.history.recent(typeof limit === 'number' ? limit : 5);
    });
    ipcMain.handle(IpcChannels.HistorySearch, (_e, query: string) => {
      return this.history.search(query ?? '', 8);
    });
    ipcMain.handle(IpcChannels.HistoryClear, () => {
      this.history.clear();
    });

    ipcMain.handle(IpcChannels.IntentResolve, async (_e, query: string) => {
      if (!this.chat) return [];
      // Single-flight: cancel any in-flight intent resolve before starting
      // a new one. The local llama.cpp runtime only supports one generation
      // sequence at a time and throws "No sequences left" otherwise; remote
      // providers don't care but burning their tokens on stale typing
      // keystrokes is wasteful too.
      this.intentAbort?.abort();
      const ac = new AbortController();
      this.intentAbort = ac;
      try {
        const raw = await this.chat.oneShot(
          INTENT_SYSTEM_PROMPT,
          `Query: "${query}"`,
          ac.signal,
        );
        if (ac.signal.aborted) return [];
        return parseIntentResponse(raw);
      } catch (err) {
        const aborted =
          ac.signal.aborted ||
          /abort/i.test(String(err)) ||
          /no sequences left/i.test(String(err));
        if (!aborted) {
          process.stdout.write(`[intent] error: ${String(err)}\n`);
        }
        return [];
      } finally {
        if (this.intentAbort === ac) this.intentAbort = null;
      }
    });

    // ---- settings ----
    ipcMain.handle(IpcChannels.SettingsGet, async () => this.settingsSnapshot());
    ipcMain.handle(
      IpcChannels.SettingsSetActiveProvider,
      async (_e, provider: ProviderId) => {
        await this.settings.setActiveProvider(provider);
      },
    );
    ipcMain.handle(IpcChannels.SettingsSetSelectedModel, async (_e, model: string) => {
      await this.settings.setSelectedModel(model);
    });
    ipcMain.handle(
      IpcChannels.SettingsSetApiKey,
      async (_e, provider: ProviderId, key: string) => {
        await this.settings.setApiKey(provider, key);
      },
    );
    ipcMain.handle(IpcChannels.SettingsHasApiKey, async (_e, provider: ProviderId) => {
      return this.settings.hasApiKey(provider);
    });
    ipcMain.handle(IpcChannels.SettingsRemoveApiKey, async (_e, provider: ProviderId) => {
      await this.settings.removeApiKey(provider);
    });

    // ---- local models ----
    ipcMain.handle(IpcChannels.LocalModelList, async () => this.localModels.listStatus());
    ipcMain.handle(IpcChannels.LocalModelDownload, async (_e, id: LocalModelVariantId) => {
      // Fire-and-forget: progress + completion ride the LocalModelEvent push channel.
      void this.localModels.download(id).catch(() => {
        // event already emitted; swallow here so the IPC promise resolves cleanly
      });
    });
    ipcMain.handle(IpcChannels.LocalModelCancel, (_e, id: LocalModelVariantId) => {
      this.localModels.cancel(id);
    });
    ipcMain.handle(IpcChannels.LocalModelRemove, async (_e, id: LocalModelVariantId) => {
      await this.localModels.remove(id);
    });

    // ---- spaces ----
    ipcMain.handle(IpcChannels.SpacesGet, () => this.buildSpacesSnapshot());
    ipcMain.handle(IpcChannels.SpacesCreate, (_e, name: string) => {
      const created = this.spaces.create(name);
      return {
        id: created.id,
        name: created.name,
        accent: created.accent,
        conversationId: created.conversationId,
      };
    });
    ipcMain.handle(IpcChannels.SpacesSetActive, (_e, id: SpaceId) => {
      this.switchSpace(id);
    });
    ipcMain.handle(IpcChannels.SpacesRename, (_e, id: SpaceId, name: string) => {
      this.spaces.rename(id, name);
    });
    ipcMain.handle(IpcChannels.SpacesSetAccent, (_e, id: SpaceId, accent: string) => {
      this.spaces.setAccent(id, accent);
    });
    ipcMain.handle(IpcChannels.SpacesRemove, (_e, id: SpaceId) => {
      this.spaces.remove(id);
    });

  }

  private buildSpacesSnapshot(): SpacesSnapshot {
    return {
      activeSpaceId: this.spacesLoaded ? this.spaces.activeId() : '',
      spaces: this.spacesLoaded
        ? this.spaces.list().map((s) => ({
            id: s.id,
            name: s.name,
            accent: s.accent,
            conversationId: s.conversationId,
          }))
        : [],
    };
  }

  private async settingsSnapshot(): Promise<SettingsSnapshot> {
    const providers: ProviderId[] = ['anthropic', 'openai', 'ollama', 'qwen-local'];
    const status: Partial<Record<ProviderId, boolean>> = {};
    for (const p of providers) status[p] = await this.settings.hasApiKey(p);
    return {
      activeProvider: await this.settings.getActiveProvider(),
      selectedModel: await this.settings.getSelectedModel(),
      providerKeyStatus: status,
    };
  }

  private wireTabForwarding(): void {
    this.tabs!.onUpdate((state) => {
      this.chrome?.webContents.send(IpcChannels.TabsUpdated, state);
    });
    this.tabs!.onRemove((id) => {
      this.chrome?.webContents.send(IpcChannels.TabsRemoved, id);
    });
    this.tabs!.onReorder((orderedIds) => {
      this.chrome?.webContents.send(IpcChannels.TabsReordered, orderedIds);
    });
    this.layout!.onSnapshot((snapshot) => {
      this.chrome?.webContents.send(IpcChannels.LayoutChanged, snapshot);
      // Persist active space's tree on every reflow so layout survives a
      // space switch within the session.
      if (this.spacesLoaded) this.spaces.setActiveLayoutTree(snapshot.tree);
    });
    this.localModels.onEvent((event) => {
      this.chrome?.webContents.send(IpcChannels.LocalModelEvent, event);
    });
    this.spaces.onChange(() => {
      this.broadcastSpacesSnapshot();
    });
  }

  private broadcastSpacesSnapshot(): void {
    if (!this.chrome || !this.spacesLoaded) return;
    const snapshot: SpacesSnapshot = {
      activeSpaceId: this.spaces.activeId(),
      spaces: this.spaces.list().map((s) => ({
        id: s.id,
        name: s.name,
        accent: s.accent,
        conversationId: s.conversationId,
      })),
    };
    this.chrome.webContents.send(IpcChannels.SpacesChanged, snapshot);
  }

  /**
   * Switch to a different space: save current layout tree to old active,
   * pull new active's tree into LayoutController, broadcast.
   */
  private switchSpace(id: SpaceId): void {
    if (!this.spacesLoaded || !this.layout) return;
    // Save current tree to whatever is presently active.
    this.spaces.setActiveLayoutTree(this.layout.getTree());
    if (!this.spaces.setActive(id)) return;
    const newTree = this.spaces.active().layoutTree;
    this.layout.setTree(newTree);
    this.broadcastSpacesSnapshot();
  }

  private broadcastActiveChanged(): void {
    this.chrome?.webContents.send(IpcChannels.TabsActiveChanged, this.activeTabId);
  }

  // ------- paths + chrome loading -------

  /**
   * Dev: load the Vite dev server so we get HMR. Set SABLE_DEV_URL=
   * http://localhost:5173 to opt in.
   * Prod: load the chrome-ui's built dist/index.html.
   */
  private async loadChromeInto(chrome: WebContentsView): Promise<void> {
    // Optional one-shot reset for development. Run with `SABLE_RESET=1` to
    // wipe the chrome's localStorage (including onboarding state) before
    // loading the renderer — useful for re-seeing the splash + onboarding
    // flow without juggling DevTools.
    if (process.env['SABLE_RESET']) {
      try {
        await chrome.webContents.session.clearStorageData({
          storages: ['localstorage'],
        });
        process.stdout.write('[main] SABLE_RESET — chrome localStorage cleared\n');
      } catch (err) {
        process.stderr.write(`[main] SABLE_RESET failed: ${String(err)}\n`);
      }
    }
    const devUrl = process.env['SABLE_DEV_URL'];
    if (devUrl) {
      await chrome.webContents.loadURL(devUrl);
      return;
    }
    await chrome.webContents.loadFile(this.chromeIndexPath());
  }

  private chromeIndexPath(): string {
    // shell app path -> .../apps/shell. Sibling: ../chrome-ui/dist/index.html.
    return path.join(app.getAppPath(), '..', 'chrome-ui', 'dist', 'index.html');
  }

  private preloadPath(): string {
    // Compiled from src/preload/chrome-preload.ts -> dist/preload/chrome-preload.js.
    // __dirname is dist/main, so up one and into preload/.
    return path.join(__dirname, '..', 'preload', 'chrome-preload.js');
  }
}

// ── Intent resolution prompt + parser ────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are a browser address-bar destination resolver for the Sable browser.
Given a user's free-form query, return a JSON list of 3-5 web destinations
that best match what they're trying to do. Each destination must have a
short label and a working URL with the user's query embedded as a search
parameter when applicable.

Rules:
- Use real, well-known sites only (Amazon, YouTube, GitHub, Wikipedia,
  Reddit, Stack Overflow, Reuters, Spotify, Apple/Google Maps, LinkedIn,
  arXiv, Coursera, Booking, Airbnb, etc).
- Always URL-encode the search query in the link.
- Order destinations by relevance — most likely first.
- Keep labels under 18 characters.
- Return ONLY a JSON object with a "destinations" array. No prose, no
  markdown fences. Example:
  {"destinations":[{"label":"Amazon","description":"Search for laptops","url":"https://www.amazon.com/s?k=laptop"}]}`;

type IntentChip = { label: string; description: string; url: string; color?: string };

function parseIntentResponse(raw: string): IntentChip[] {
  if (!raw) return [];

  // Strip markdown code fences the model often emits despite instructions.
  let body = raw.trim();
  body = body.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // Path A — clean JSON. Try the cheap path first.
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(body.slice(start, end + 1)) as { destinations?: unknown };
      const dests = parsed?.destinations;
      if (Array.isArray(dests)) {
        const out = collect(dests);
        if (out.length > 0) return out;
      }
    } catch {
      // fall through to salvage
    }
  }

  // Path B — salvage. The response was truncated mid-URL or otherwise
  // malformed. Grab every `{…}` object that contains both a label and a
  // url field via regex, parse each in isolation, and accept whatever
  // survives. This way a partial response still yields usable chips.
  const objects = body.match(/\{[^{}]*"label"[^{}]*"url"[^{}]*\}/g) ?? [];
  const salvaged: unknown[] = [];
  for (const o of objects) {
    try {
      salvaged.push(JSON.parse(o));
    } catch {
      // try to repair a missing trailing brace
      try {
        salvaged.push(JSON.parse(o + (o.endsWith('}') ? '' : '}')));
      } catch {
        // skip
      }
    }
  }
  return collect(salvaged);
}

function collect(items: readonly unknown[]): IntentChip[] {
  const out: IntentChip[] = [];
  for (const d of items) {
    if (!d || typeof d !== 'object') continue;
    const label = (d as { label?: unknown }).label;
    const url = (d as { url?: unknown }).url;
    const description = (d as { description?: unknown }).description;
    if (typeof label !== 'string' || typeof url !== 'string') continue;
    if (!/^https?:\/\//i.test(url)) continue;
    out.push({
      label: label.slice(0, 24),
      description: typeof description === 'string' ? description.slice(0, 120) : url,
      url,
    });
    if (out.length >= 6) break;
  }
  return out;
}
