// Zustand store mirroring tabs/active state from the main process.
// Subscribes to push events on bootstrap; components consume via hooks.

import { create } from 'zustand';
import type { TabId, TabState } from '../types';

type TabsStore = {
  tabsById: ReadonlyMap<TabId, TabState>;
  activeTabId: TabId | null;
  bootstrapped: boolean;

  // mutations (called by event subscriptions, not components directly)
  upsertTab: (state: TabState) => void;
  removeTab: (id: TabId) => void;
  setActive: (id: TabId | null) => void;
  setBootstrapped: () => void;
};

export const useTabsStore = create<TabsStore>((set) => ({
  tabsById: new Map(),
  activeTabId: null,
  bootstrapped: false,

  upsertTab: (state) =>
    set((s) => {
      const next = new Map(s.tabsById);
      next.set(state.id, state);
      return { tabsById: next };
    }),

  removeTab: (id) =>
    set((s) => {
      if (!s.tabsById.has(id)) return s;
      const next = new Map(s.tabsById);
      next.delete(id);
      return { tabsById: next };
    }),

  setActive: (id) => set({ activeTabId: id }),
  setBootstrapped: () => set({ bootstrapped: true }),
}));

// Selectors — keep components from re-rendering on unrelated state changes.
export const selectTabList = (s: TabsStore) => Array.from(s.tabsById.values());
export const selectActiveTab = (s: TabsStore) =>
  s.activeTabId ? s.tabsById.get(s.activeTabId) : undefined;
