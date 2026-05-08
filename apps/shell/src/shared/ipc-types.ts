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

export type ChatImageAttachment = {
  readonly mimeType: string;
  readonly base64: string;
  readonly sourceUrl?: string;
};

export type ChatSendContent = {
  readonly text: string;
  readonly images?: readonly ChatImageAttachment[];
};

export type ResolvedImage = {
  readonly mimeType: string;
  readonly base64: string;
};

// ---- local models ----
export type LocalModelVariantId =
  | 'qwen3-0.6b-q4'
  | 'qwen3-1.7b-q4'
  | 'qwen3-4b-instruct-2507-q4';

export type LocalModelStatus = {
  readonly id: LocalModelVariantId;
  readonly label: string;
  readonly description: string;
  readonly approxSizeMb: number;
  readonly recommended: boolean;
  readonly state: 'absent' | 'downloading' | 'ready' | 'error';
  readonly downloadedBytes?: number;
  readonly totalBytes?: number;
  readonly error?: string;
};

export type LocalModelEvent =
  | { kind: 'progress'; id: LocalModelVariantId; downloadedBytes: number; totalBytes: number }
  | { kind: 'done'; id: LocalModelVariantId }
  | { kind: 'error'; id: LocalModelVariantId; error: string }
  | { kind: 'removed'; id: LocalModelVariantId };

// ---- spaces ----
export type SpaceId = string;

export type SpaceSummary = {
  readonly id: SpaceId;
  readonly name: string;
  readonly accent: string;
  /** chat conversation bucket; the chrome's chat store hydrates from this. */
  readonly conversationId: string;
};

export type SpacesSnapshot = {
  readonly activeSpaceId: SpaceId;
  readonly spaces: readonly SpaceSummary[];
};

// ---- skills ----
export type SkillId = string;

export type Skill = {
  readonly id: SkillId;
  readonly label: string;
  readonly description: string;
  readonly template: string;
  readonly builtin?: boolean;
};

/** AG-UI events flow over IPC as plain JSON; ag-ui/core types describe shape. */
export type AgentEvent = BaseEvent;

/** A single leaf pane with its tab and current screen rect. */
export type SnapshotLeaf = {
  readonly paneId: PaneId;
  /** Every tab stacked into this pane (one rect, multiple tabs). */
  readonly tabIds: readonly TabId[];
  /** The tab whose WebContentsView is currently mounted into the rect. */
  readonly activeTabId: TabId;
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
  readonly lastActiveAt: number;
  readonly selectedForContext: boolean;
  readonly spaceId: string;
  readonly groupId: string | undefined;
};

export type ExtractedTabContent = {
  readonly tabId: TabId;
  readonly title: string;
  readonly url: string;
  readonly text: string;
  readonly truncated: boolean;
  readonly extractedAt: number;
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
    setSelectedForContext(id: TabId, selected: boolean): Promise<void>;
    setSpace(id: TabId, spaceId: SpaceId): Promise<void>;
    extractContent(id: TabId): Promise<ExtractedTabContent | null>;
    /** Group two tabs together (or fold one into the other's existing group).
     *  Returns the resulting groupId, or null if the operation failed. */
    joinGroup(sourceId: TabId, targetId: TabId): Promise<string | null>;
    /** Pull a tab out of its group. Dissolves the group if only one tab is
     *  left. */
    leaveGroup(id: TabId): Promise<void>;
    /** Dissolve the entire group containing this tab — every member becomes
     *  ungrouped and the layout collapses to single-pane. */
    dissolveGroup(id: TabId): Promise<void>;
  };
  readonly layout: {
    /** Hide all tab WebContentsViews so chrome-side drop overlays receive events. */
    dragStart(): Promise<void>;
    /** Restore tab WebContentsViews to their tree-derived positions. */
    dragEnd(): Promise<void>;
    /** Apply a drop to the tree and reflow. */
    drop(sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge): Promise<void>;
    /** Pop a tab out of its multi-tab leaf into a new sibling pane to the
     *  right. No-op if the leaf has only one tab. */
    popTab(paneId: PaneId, tabId: TabId): Promise<void>;
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
    /** Chrome reports whether the chat sidebar (right) is visible so main
     *  recomputes pane WebContentsView bounds (rightInset = chat-w vs 0). */
    setChatVisible(visible: boolean): Promise<void>;
    /** Recolor the Win 11 titleBarOverlay min/max/close buttons to match
     *  the current chrome theme. No-op on macOS / Linux. */
    setTheme(theme: 'light' | 'dark'): Promise<void>;
  };
  readonly chat: {
    /** Returns the runId so the UI can correlate stop()/error events. */
    send(conversationId: string, content: ChatSendContent): Promise<string>;
    stop(runId: string): Promise<void>;
    getHistory(conversationId: string): Promise<ChatHistoryMessage[]>;
    /** Fetch an image url in main (bypasses renderer CORS), return base64. */
    resolveImage(srcUrl: string): Promise<ResolvedImage>;
  };
  readonly settings: {
    get(): Promise<SettingsSnapshot>;
    setActiveProvider(provider: ProviderId): Promise<void>;
    setSelectedModel(model: string): Promise<void>;
    setApiKey(provider: ProviderId, key: string): Promise<void>;
    hasApiKey(provider: ProviderId): Promise<boolean>;
    removeApiKey(provider: ProviderId): Promise<void>;
  };
  readonly localModel: {
    list(): Promise<LocalModelStatus[]>;
    download(id: LocalModelVariantId): Promise<void>;
    cancel(id: LocalModelVariantId): Promise<void>;
    remove(id: LocalModelVariantId): Promise<void>;
  };
  readonly spaces: {
    get(): Promise<SpacesSnapshot>;
    create(name: string): Promise<SpaceSummary>;
    setActive(id: SpaceId): Promise<void>;
    rename(id: SpaceId, name: string): Promise<void>;
    setAccent(id: SpaceId, accent: string): Promise<void>;
    remove(id: SpaceId): Promise<void>;
  };
  readonly skills: {
    list(): Promise<Skill[]>;
    save(skill: Skill): Promise<Skill>;
    remove(id: SkillId): Promise<void>;
    resetDefaults(): Promise<void>;
  };
  readonly env: {
    /** 'win32' | 'darwin' | 'linux' (NodeJS.Platform). Read once at preload. */
    readonly platform: NodeJS.Platform;
  };
  /** Custom window controls — Windows + Linux render their own min/max/close
   *  in the React titlebar (no native overlay). macOS keeps native traffic
   *  lights (hiddenInset titleBarStyle). */
  readonly window: {
    minimize(): Promise<void>;
    maximizeToggle(): Promise<void>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
  };
  readonly on: {
    tabUpdated(cb: (state: TabState) => void): () => void;
    /** Window maximize/restore state changed (push). */
    maximizedChanged(cb: (maximized: boolean) => void): () => void;
    tabRemoved(cb: (id: TabId) => void): () => void;
    activeChanged(cb: (id: TabId | null) => void): () => void;
    layoutChanged(cb: (snapshot: LayoutSnapshot) => void): () => void;
    agentEvent(cb: (event: AgentEvent) => void): () => void;
    localModelEvent(cb: (event: LocalModelEvent) => void): () => void;
    spacesChanged(cb: (snapshot: SpacesSnapshot) => void): () => void;
    skillsChanged(cb: (skills: Skill[]) => void): () => void;
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
  TabsSetSelectedForContext: 'tabs:setSelectedForContext',
  TabsSetSpace: 'tabs:setSpace',
  TabsExtractContent: 'tabs:extractContent',
  TabsJoinGroup: 'tabs:joinGroup',
  TabsLeaveGroup: 'tabs:leaveGroup',
  TabsDissolveGroup: 'tabs:dissolveGroup',
  TabsUpdated: 'tabs:updated',
  TabsRemoved: 'tabs:removed',
  TabsActiveChanged: 'tabs:activeChanged',
  LayoutChanged: 'layout:changed',
  LayoutDragStart: 'layout:dragStart',
  LayoutDragEnd: 'layout:dragEnd',
  LayoutDrop: 'layout:drop',
  LayoutPopTab: 'layout:popTab',
  LayoutResize: 'layout:resize',
  ChromeSetOverlay: 'chrome:setOverlay',
  ChromeSetChatVisible: 'chrome:setChatVisible',
  ChromeSetTheme: 'chrome:setTheme',
  // window controls (custom min/max/close — no native overlay)
  WindowMinimize: 'window:minimize',
  WindowMaximizeToggle: 'window:maximizeToggle',
  WindowClose: 'window:close',
  WindowIsMaximized: 'window:isMaximized',
  WindowMaximizedChanged: 'window:maximizedChanged',
  // chat / settings
  ChatSend: 'chat:send',
  ChatStop: 'chat:stop',
  ChatGetHistory: 'chat:getHistory',
  ChatResolveImage: 'chat:resolveImage',
  ChatAgentEvent: 'chat:agentEvent',
  SettingsGet: 'settings:get',
  SettingsSetActiveProvider: 'settings:setActiveProvider',
  SettingsSetSelectedModel: 'settings:setSelectedModel',
  SettingsSetApiKey: 'settings:setApiKey',
  SettingsHasApiKey: 'settings:hasApiKey',
  SettingsRemoveApiKey: 'settings:removeApiKey',
  // local model
  LocalModelList: 'localModel:list',
  LocalModelDownload: 'localModel:download',
  LocalModelCancel: 'localModel:cancel',
  LocalModelRemove: 'localModel:remove',
  LocalModelEvent: 'localModel:event',
  // spaces
  SpacesGet: 'spaces:get',
  SpacesCreate: 'spaces:create',
  SpacesSetActive: 'spaces:setActive',
  SpacesRename: 'spaces:rename',
  SpacesSetAccent: 'spaces:setAccent',
  SpacesRemove: 'spaces:remove',
  SpacesChanged: 'spaces:changed',
  // skills
  SkillsList: 'skills:list',
  SkillsSave: 'skills:save',
  SkillsRemove: 'skills:remove',
  SkillsResetDefaults: 'skills:resetDefaults',
  SkillsChanged: 'skills:changed',
} as const;
