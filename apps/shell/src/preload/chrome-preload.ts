// Chrome preload — exposes window.sable.* to the chrome WebContents.
//
// Runs in a sandboxed context with contextIsolation: true. Only contextBridge
// + a restricted ipcRenderer subset is available; this is by design.

import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannels,
  type AgentEvent,
  type ChatHistoryMessage,
  type DropEdge,
  type LayoutSnapshot,
  type PaneId,
  type ProviderId,
  type SableApi,
  type SettingsSnapshot,
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
  },
  chrome: {
    setOverlay: (active: boolean) =>
      ipcRenderer.invoke(IpcChannels.ChromeSetOverlay, active) as Promise<void>,
  },
  layout: {
    dragStart: () => ipcRenderer.invoke(IpcChannels.LayoutDragStart) as Promise<void>,
    dragEnd: () => ipcRenderer.invoke(IpcChannels.LayoutDragEnd) as Promise<void>,
    drop: (sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge) =>
      ipcRenderer.invoke(IpcChannels.LayoutDrop, sourceTabId, targetPaneId, edge) as Promise<void>,
    resize: (splitId: PaneId, newRatio: number) =>
      ipcRenderer.invoke(IpcChannels.LayoutResize, splitId, newRatio) as Promise<void>,
  },
  chat: {
    send: (conversationId: string, text: string) =>
      ipcRenderer.invoke(IpcChannels.ChatSend, conversationId, text) as Promise<string>,
    stop: (runId: string) => ipcRenderer.invoke(IpcChannels.ChatStop, runId) as Promise<void>,
    getHistory: (conversationId: string) =>
      ipcRenderer.invoke(IpcChannels.ChatGetHistory, conversationId) as Promise<ChatHistoryMessage[]>,
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
  on: {
    tabUpdated: (cb) => on<TabState>(IpcChannels.TabsUpdated, cb),
    tabRemoved: (cb) => on<TabId>(IpcChannels.TabsRemoved, cb),
    activeChanged: (cb) => on<TabId | null>(IpcChannels.TabsActiveChanged, cb),
    layoutChanged: (cb) => on<LayoutSnapshot>(IpcChannels.LayoutChanged, cb),
    agentEvent: (cb) => on<AgentEvent>(IpcChannels.ChatAgentEvent, cb),
  },
};

contextBridge.exposeInMainWorld('sable', api);
