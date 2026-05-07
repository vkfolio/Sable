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

/**
 * Citation captured from a tab WebContents and dropped into the chat composer.
 * Discriminated union: text (from selection) or image (from <img> drag).
 */
export type TextCitation = {
  readonly kind: 'text';
  readonly id: string;
  readonly text: string;
  readonly url: string;
  readonly title: string;
  readonly anchor: { selector: string | null };
  readonly pickedUpAt: number;
};

export type ImageCitation = {
  readonly kind: 'image';
  readonly id: string;
  readonly mimeType: string;
  readonly base64: string;
  readonly sourceUrl: string;
  readonly pageUrl: string;
  readonly pageTitle: string;
  readonly alt: string;
  readonly pickedUpAt: number;
};

export type Citation = TextCitation | ImageCitation;

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
  readonly selectedForContext: boolean;
  readonly spaceId: string;
};

export type ExtractedTabContent = {
  readonly tabId: TabId;
  readonly title: string;
  readonly url: string;
  readonly text: string;
  readonly truncated: boolean;
  readonly extractedAt: number;
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
    setSelectedForContext(id: TabId, selected: boolean): Promise<void>;
    setSpace(id: TabId, spaceId: SpaceId): Promise<void>;
    extractContent(id: TabId): Promise<ExtractedTabContent | null>;
  };
  readonly layout: {
    dragStart(): Promise<void>;
    dragEnd(): Promise<void>;
    drop(sourceTabId: TabId, targetPaneId: PaneId, edge: DropEdge): Promise<void>;
    resize(splitId: PaneId, newRatio: number): Promise<void>;
  };
  readonly chrome: {
    setOverlay(active: boolean): Promise<void>;
    setChatVisible(visible: boolean): Promise<void>;
    setTheme(theme: 'light' | 'dark'): Promise<void>;
  };
  readonly chat: {
    send(conversationId: string, content: ChatSendContent): Promise<string>;
    stop(runId: string): Promise<void>;
    getHistory(conversationId: string): Promise<ChatHistoryMessage[]>;
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
    /** 'win32' | 'darwin' | 'linux' | 'aix' | 'freebsd' | 'openbsd' | 'sunos' | 'cygwin' | 'netbsd' | 'haiku' | 'android' */
    readonly platform: string;
  };
  readonly window: {
    minimize(): Promise<void>;
    maximizeToggle(): Promise<void>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
  };
  readonly on: {
    tabUpdated(cb: (state: TabState) => void): () => void;
    tabRemoved(cb: (id: TabId) => void): () => void;
    activeChanged(cb: (id: TabId | null) => void): () => void;
    layoutChanged(cb: (snapshot: LayoutSnapshot) => void): () => void;
    agentEvent(cb: (event: AgentEvent) => void): () => void;
    localModelEvent(cb: (event: LocalModelEvent) => void): () => void;
    spacesChanged(cb: (snapshot: SpacesSnapshot) => void): () => void;
    skillsChanged(cb: (skills: Skill[]) => void): () => void;
    maximizedChanged(cb: (maximized: boolean) => void): () => void;
  };
};
