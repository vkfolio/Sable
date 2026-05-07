// Shared IPC types between main and preload. Re-exported in preload via
// contextBridge so the chrome's UI code has type-aware completion.

import type { DropEdge, Pane, PaneId, Rect, TabId } from '@sable/layout-engine';
import type { BaseEvent } from '@ag-ui/core';

export type { DropEdge, Pane, PaneId, Rect, TabId };

// Chat / settings types
export type ProviderId = 'anthropic' | 'openai' | 'ollama' | 'qwen-local';

export type SettingsSnapshot = {
  readonly activeProvider: ProviderId;
  readonly selectedModel: string;
  /** map of provider -> hasKey; raw keys never cross the IPC boundary. */
  readonly providerKeyStatus: Readonly<Partial<Record<ProviderId, boolean>>>;
};

export type ChatHistoryMessage = {
  readonly role: 'user' | 'assistant';
  readonly text: string;
};

/** AG-UI events flow over IPC as plain JSON; ag-ui/core types describe shape. */
export type AgentEvent = BaseEvent;

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
  readonly chrome: {
    /**
     * When true, all tab WebContentsViews are unmounted so chrome-side
     * overlays (modals, drop overlays, etc.) can render fullscreen and
     * receive pointer events without being occluded.
     */
    setOverlay(active: boolean): Promise<void>;
  };
  readonly chat: {
    /** Returns the runId so the UI can correlate stop()/error events. */
    send(conversationId: string, text: string): Promise<string>;
    stop(runId: string): Promise<void>;
    getHistory(conversationId: string): Promise<ChatHistoryMessage[]>;
  };
  readonly settings: {
    get(): Promise<SettingsSnapshot>;
    setActiveProvider(provider: ProviderId): Promise<void>;
    setSelectedModel(model: string): Promise<void>;
    setApiKey(provider: ProviderId, key: string): Promise<void>;
    hasApiKey(provider: ProviderId): Promise<boolean>;
    removeApiKey(provider: ProviderId): Promise<void>;
  };
  readonly on: {
    tabUpdated(cb: (state: TabState) => void): () => void;
    tabRemoved(cb: (id: TabId) => void): () => void;
    activeChanged(cb: (id: TabId | null) => void): () => void;
    layoutChanged(cb: (snapshot: LayoutSnapshot) => void): () => void;
    agentEvent(cb: (event: AgentEvent) => void): () => void;
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
  ChromeSetOverlay: 'chrome:setOverlay',
  // chat / settings
  ChatSend: 'chat:send',
  ChatStop: 'chat:stop',
  ChatGetHistory: 'chat:getHistory',
  ChatAgentEvent: 'chat:agentEvent',
  SettingsGet: 'settings:get',
  SettingsSetActiveProvider: 'settings:setActiveProvider',
  SettingsSetSelectedModel: 'settings:setSelectedModel',
  SettingsSetApiKey: 'settings:setApiKey',
  SettingsHasApiKey: 'settings:hasApiKey',
  SettingsRemoveApiKey: 'settings:removeApiKey',
} as const;
