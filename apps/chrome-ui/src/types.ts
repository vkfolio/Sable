// Local mirror of the IPC types the chrome consumes. Kept in sync with
// apps/shell/src/shared/ipc-types.ts. We don't depend on the shell package
// directly — the boundary is the SableApi exposed via contextBridge.

import type { DropEdge, LeafPane, Pane, PaneId, Rect, SplitPane } from '@sable/layout-engine';
import type { BaseEvent } from '@ag-ui/core';

export type { DropEdge, LeafPane, Pane, PaneId, Rect, SplitPane };
export type TabId = string;

// ---- chat / settings ----
export type ProviderId = 'anthropic' | 'openai' | 'ollama' | 'qwen-local';

export type SettingsSnapshot = {
  readonly activeProvider: ProviderId;
  readonly selectedModel: string;
  readonly providerKeyStatus: Readonly<Partial<Record<ProviderId, boolean>>>;
};

export type ChatHistoryMessage = {
  readonly role: 'user' | 'assistant';
  readonly text: string;
};

export type AgentEvent = BaseEvent;

export type TabState = {
  readonly id: TabId;
  readonly url: string;
  readonly title: string;
  readonly faviconUrl: string | undefined;
  readonly loading: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly lastActiveAt: number;
};

export type SnapshotLeaf = {
  readonly paneId: PaneId;
  readonly tabId: TabId;
  readonly rect: Rect;
};

export type SnapshotDivider = {
  readonly splitId: PaneId;
  readonly direction: 'h' | 'v';
  readonly rect: Rect;
  readonly parentRect: Rect;
};

export type LayoutSnapshot = {
  readonly tree: Pane | null;
  readonly leaves: readonly SnapshotLeaf[];
  readonly dividers: readonly SnapshotDivider[];
  readonly paneOrigin: { readonly x: number; readonly y: number };
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
    dragStart(): Promise<void>;
    dragEnd(): Promise<void>;
    drop(sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge): Promise<void>;
    resize(splitId: PaneId, newRatio: number): Promise<void>;
  };
  readonly chrome: {
    setOverlay(active: boolean): Promise<void>;
  };
  readonly chat: {
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
