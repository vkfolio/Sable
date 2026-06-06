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
  /** Re-key the tabsById map so iteration order matches `orderedIds`. Tabs
   *  not in `orderedIds` (shouldn't happen in practice) are dropped. */
  setTabOrder: (orderedIds: readonly TabId[]) => void;
  /** Pull current tab list + active id from main. Necessary on bootstrap
   *  because main eagerly opens the initial tab BEFORE App's useEffect
   *  subscribes — those events would otherwise be missed. */
  refresh: () => Promise<void>;
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
      // Clear stale activeTabId so selectors that look up the tab by id don't
      // hand callers a phantom reference. Main will broadcast the real next
      // active id moments later via TabsActiveChanged — until then, null is
      // the truthful answer and forces navigate() callers down the
      // tabs.create() path instead of tabs.navigate(unknown_id).
      const nextActive = s.activeTabId === id ? null : s.activeTabId;
      return { tabsById: next, activeTabId: nextActive };
    }),

  setActive: (id) => set({ activeTabId: id }),
  setBootstrapped: () => set({ bootstrapped: true }),

  setTabOrder: (orderedIds) =>
    set((s) => {
      const next = new Map<TabId, TabState>();
      for (const id of orderedIds) {
        const t = s.tabsById.get(id);
        if (t) next.set(id, t);
      }
      // Preserve any tabs that weren't in the ordered list (defensive — main
      // is the source of truth, but don't drop entries silently if it skips
      // any).
      for (const [id, t] of s.tabsById) if (!next.has(id)) next.set(id, t);
      return { tabsById: next };
    }),

  refresh: async () => {
    const [list, active] = await Promise.all([
      window.sable.tabs.list(),
      window.sable.tabs.getActive(),
    ]);
    const tabsById = new Map<TabId, TabState>();
    for (const t of list) tabsById.set(t.id, t);
    set({ tabsById, activeTabId: active });
  },
}));

// Selectors — keep components from re-rendering on unrelated state changes.
export const selectTabList = (s: TabsStore) => Array.from(s.tabsById.values());
export const selectActiveTab = (s: TabsStore) =>
  s.activeTabId ? s.tabsById.get(s.activeTabId) : undefined;
