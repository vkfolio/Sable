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
import { SettingsStore, type ProviderId } from './settings-store';
import { LocalModelManager, type LocalModelVariantId } from './local-model-manager';
import { IpcChannels, type ChatSendContent, type SettingsSnapshot } from '../shared/ipc-types';

const HOMEPAGE = 'https://duckduckgo.com';

export class WindowManager {
  private window: BrowserWindow | undefined;
  private chrome: WebContentsView | undefined;
  private tabs: TabManager | undefined;
  private layout: LayoutController | undefined;
  private chat: ChatOrchestrator | undefined;
  private readonly settings = new SettingsStore();
  private readonly localModels = new LocalModelManager();
  private activeTabId: TabId | null = null;
  private ipcRegistered = false;

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

    const tabs = new TabManager(win);
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

    this.registerIpcOnce();
    this.wireTabForwarding();

    chrome.webContents.once('did-finish-load', () => {
      // Open the first tab AFTER the chrome's preload + initial render is up,
      // so the chrome's tab list reflects it.
      this.openTab(HOMEPAGE);
      if (!win.isDestroyed()) win.show();
    });

    void this.loadChromeInto(chrome);

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
    const id = this.tabs!.create(url);
    this.layout!.setTree({ kind: 'leaf', id: `pane-${id}`, tabId: id });
    this.activeTabId = id;
    this.tabs!.markActive(id);
    this.broadcastActiveChanged();
    return id;
  }

  private switchTab(id: TabId): void {
    if (!this.tabs!.get(id)) return;
    this.layout!.setTree({ kind: 'leaf', id: `pane-${id}`, tabId: id });
    this.activeTabId = id;
    this.tabs!.markActive(id);
    this.broadcastActiveChanged();
  }

  private closeTab(id: TabId): void {
    const wasActive = this.activeTabId === id;
    this.tabs!.close(id);
    if (wasActive) {
      const remaining = this.tabs!.list();
      const next = remaining[remaining.length - 1];
      if (next) {
        this.switchTab(next.id);
      } else {
        this.layout!.setTree(null);
        this.activeTabId = null;
        this.broadcastActiveChanged();
      }
    } else {
      this.layout!.reflow();
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
    this.layout!.onSnapshot((snapshot) => {
      this.chrome?.webContents.send(IpcChannels.LayoutChanged, snapshot);
    });
    this.localModels.onEvent((event) => {
      this.chrome?.webContents.send(IpcChannels.LocalModelEvent, event);
    });
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
