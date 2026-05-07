// Shared IPC types between main and preload. Re-exported in preload via
// contextBridge so the chrome's UI code has type-aware completion.

import type { TabId } from '@sable/layout-engine';

export type { TabId };

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
  readonly on: {
    tabUpdated(cb: (state: TabState) => void): () => void;
    tabRemoved(cb: (id: TabId) => void): () => void;
    activeChanged(cb: (id: TabId | null) => void): () => void;
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
} as const;
