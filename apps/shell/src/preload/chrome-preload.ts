// Chrome preload — exposes window.sable.* to the chrome WebContents.
//
// Runs in a sandboxed context with contextIsolation: true. Only contextBridge
// + a restricted ipcRenderer subset is available; this is by design.

import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannels,
  type AgentEvent,
  type ChatHistoryMessage,
  type ChatSendContent,
  type DropEdge,
  type ExtractedTabContent,
  type LayoutSnapshot,
  type LocalModelEvent,
  type LocalModelStatus,
  type LocalModelVariantId,
  type PaneId,
  type ProviderId,
  type ResolvedImage,
  type SableApi,
  type SettingsSnapshot,
  type Skill,
  type SkillId,
  type SpaceId,
  type SpaceSummary,
  type SpacesSnapshot,
  type TabId,
  type TabState,
} from '../shared/ipc-types';

function on<T>(channel: string, cb: (value: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, value: T) => cb(value);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const api: SableApi = {
  tabs: {
    create: (url) => ipcRenderer.invoke(IpcChannels.TabsCreate, url) as Promise<TabId>,
    close: (id) => ipcRenderer.invoke(IpcChannels.TabsClose, id) as Promise<void>,
    navigate: (id, url) => ipcRenderer.invoke(IpcChannels.TabsNavigate, id, url) as Promise<void>,
    setActive: (id) => ipcRenderer.invoke(IpcChannels.TabsSetActive, id) as Promise<void>,
    getActive: () => ipcRenderer.invoke(IpcChannels.TabsGetActive) as Promise<TabId | null>,
    goBack: (id) => ipcRenderer.invoke(IpcChannels.TabsGoBack, id) as Promise<void>,
    goForward: (id) => ipcRenderer.invoke(IpcChannels.TabsGoForward, id) as Promise<void>,
    reload: (id) => ipcRenderer.invoke(IpcChannels.TabsReload, id) as Promise<void>,
    list: () => ipcRenderer.invoke(IpcChannels.TabsList) as Promise<TabState[]>,
    setSelectedForContext: (id: TabId, selected: boolean) =>
      ipcRenderer.invoke(IpcChannels.TabsSetSelectedForContext, id, selected) as Promise<void>,
    setSpace: (id: TabId, spaceId: SpaceId) =>
      ipcRenderer.invoke(IpcChannels.TabsSetSpace, id, spaceId) as Promise<void>,
    extractContent: (id: TabId) =>
      ipcRenderer.invoke(IpcChannels.TabsExtractContent, id) as Promise<ExtractedTabContent | null>,
    joinGroup: (sourceId: TabId, targetId: TabId) =>
      ipcRenderer.invoke(IpcChannels.TabsJoinGroup, sourceId, targetId) as Promise<string | null>,
    leaveGroup: (id: TabId) =>
      ipcRenderer.invoke(IpcChannels.TabsLeaveGroup, id) as Promise<void>,
    dissolveGroup: (id: TabId) =>
      ipcRenderer.invoke(IpcChannels.TabsDissolveGroup, id) as Promise<void>,
  },
  chrome: {
    setOverlay: (active: boolean) =>
      ipcRenderer.invoke(IpcChannels.ChromeSetOverlay, active) as Promise<void>,
    setChatVisible: (visible: boolean) =>
      ipcRenderer.invoke(IpcChannels.ChromeSetChatVisible, visible) as Promise<void>,
    setChatWidth: (width: number) =>
      ipcRenderer.invoke(IpcChannels.ChromeSetChatWidth, width) as Promise<void>,
    setTheme: (theme: 'light' | 'dark') =>
      ipcRenderer.invoke(IpcChannels.ChromeSetTheme, theme) as Promise<void>,
  },
  layout: {
    dragStart: () => ipcRenderer.invoke(IpcChannels.LayoutDragStart) as Promise<void>,
    dragEnd: () => ipcRenderer.invoke(IpcChannels.LayoutDragEnd) as Promise<void>,
    drop: (sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge) =>
      ipcRenderer.invoke(IpcChannels.LayoutDrop, sourceTabId, targetPaneId, edge) as Promise<void>,
    popTab: (paneId: PaneId, tabId: TabId) =>
      ipcRenderer.invoke(IpcChannels.LayoutPopTab, paneId, tabId) as Promise<void>,
    resize: (splitId: PaneId, newRatio: number) =>
      ipcRenderer.invoke(IpcChannels.LayoutResize, splitId, newRatio) as Promise<void>,
  },
  chat: {
    send: (conversationId: string, content: ChatSendContent) =>
      ipcRenderer.invoke(IpcChannels.ChatSend, conversationId, content) as Promise<string>,
    stop: (runId: string) => ipcRenderer.invoke(IpcChannels.ChatStop, runId) as Promise<void>,
    getHistory: (conversationId: string) =>
      ipcRenderer.invoke(IpcChannels.ChatGetHistory, conversationId) as Promise<ChatHistoryMessage[]>,
    resolveImage: (srcUrl: string) =>
      ipcRenderer.invoke(IpcChannels.ChatResolveImage, srcUrl) as Promise<ResolvedImage>,
  },
  intent: {
    resolve: (query: string) =>
      ipcRenderer.invoke(IpcChannels.IntentResolve, query) as Promise<
        readonly { label: string; description: string; url: string; color?: string }[]
      >,
  },
  settings: {
    get: () => ipcRenderer.invoke(IpcChannels.SettingsGet) as Promise<SettingsSnapshot>,
    setActiveProvider: (provider: ProviderId) =>
      ipcRenderer.invoke(IpcChannels.SettingsSetActiveProvider, provider) as Promise<void>,
    setSelectedModel: (model: string) =>
      ipcRenderer.invoke(IpcChannels.SettingsSetSelectedModel, model) as Promise<void>,
    setApiKey: (provider: ProviderId, key: string) =>
      ipcRenderer.invoke(IpcChannels.SettingsSetApiKey, provider, key) as Promise<void>,
    hasApiKey: (provider: ProviderId) =>
      ipcRenderer.invoke(IpcChannels.SettingsHasApiKey, provider) as Promise<boolean>,
    removeApiKey: (provider: ProviderId) =>
      ipcRenderer.invoke(IpcChannels.SettingsRemoveApiKey, provider) as Promise<void>,
  },
  localModel: {
    list: () => ipcRenderer.invoke(IpcChannels.LocalModelList) as Promise<LocalModelStatus[]>,
    download: (id: LocalModelVariantId) =>
      ipcRenderer.invoke(IpcChannels.LocalModelDownload, id) as Promise<void>,
    cancel: (id: LocalModelVariantId) =>
      ipcRenderer.invoke(IpcChannels.LocalModelCancel, id) as Promise<void>,
    remove: (id: LocalModelVariantId) =>
      ipcRenderer.invoke(IpcChannels.LocalModelRemove, id) as Promise<void>,
  },
  spaces: {
    get: () => ipcRenderer.invoke(IpcChannels.SpacesGet) as Promise<SpacesSnapshot>,
    create: (name: string) =>
      ipcRenderer.invoke(IpcChannels.SpacesCreate, name) as Promise<SpaceSummary>,
    setActive: (id: SpaceId) =>
      ipcRenderer.invoke(IpcChannels.SpacesSetActive, id) as Promise<void>,
    rename: (id: SpaceId, name: string) =>
      ipcRenderer.invoke(IpcChannels.SpacesRename, id, name) as Promise<void>,
    setAccent: (id: SpaceId, accent: string) =>
      ipcRenderer.invoke(IpcChannels.SpacesSetAccent, id, accent) as Promise<void>,
    remove: (id: SpaceId) =>
      ipcRenderer.invoke(IpcChannels.SpacesRemove, id) as Promise<void>,
  },
  skills: {
    list: () => ipcRenderer.invoke(IpcChannels.SkillsList) as Promise<Skill[]>,
    save: (skill: Skill) => ipcRenderer.invoke(IpcChannels.SkillsSave, skill) as Promise<Skill>,
    remove: (id: SkillId) => ipcRenderer.invoke(IpcChannels.SkillsRemove, id) as Promise<void>,
    resetDefaults: () => ipcRenderer.invoke(IpcChannels.SkillsResetDefaults) as Promise<void>,
  },
  env: {
    platform: process.platform,
  },
  window: {
    minimize: () => ipcRenderer.invoke(IpcChannels.WindowMinimize) as Promise<void>,
    maximizeToggle: () => ipcRenderer.invoke(IpcChannels.WindowMaximizeToggle) as Promise<void>,
    close: () => ipcRenderer.invoke(IpcChannels.WindowClose) as Promise<void>,
    isMaximized: () => ipcRenderer.invoke(IpcChannels.WindowIsMaximized) as Promise<boolean>,
  },
  on: {
    tabUpdated: (cb) => on<TabState>(IpcChannels.TabsUpdated, cb),
    tabsReordered: (cb) => on<readonly TabId[]>(IpcChannels.TabsReordered, cb),
    maximizedChanged: (cb) => on<boolean>(IpcChannels.WindowMaximizedChanged, cb),
    tabRemoved: (cb) => on<TabId>(IpcChannels.TabsRemoved, cb),
    activeChanged: (cb) => on<TabId | null>(IpcChannels.TabsActiveChanged, cb),
    layoutChanged: (cb) => on<LayoutSnapshot>(IpcChannels.LayoutChanged, cb),
    agentEvent: (cb) => on<AgentEvent>(IpcChannels.ChatAgentEvent, cb),
    localModelEvent: (cb) => on<LocalModelEvent>(IpcChannels.LocalModelEvent, cb),
    spacesChanged: (cb) => on<SpacesSnapshot>(IpcChannels.SpacesChanged, cb),
    skillsChanged: (cb) => on<Skill[]>(IpcChannels.SkillsChanged, cb),
  },
};

contextBridge.exposeInMainWorld('sable', api);
