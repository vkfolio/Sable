import { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { PaneArea } from './components/PaneArea';
import { useTabsStore } from './state/tabs';

export function App() {
  const activeTabId = useTabsStore((s) => s.activeTabId);

  // Subscribe to push events from main on first mount.
  useEffect(() => {
    const upsert = useTabsStore.getState().upsertTab;
    const remove = useTabsStore.getState().removeTab;
    const setActive = useTabsStore.getState().setActive;

    const offUpdate = window.sable.on.tabUpdated(upsert);
    const offRemove = window.sable.on.tabRemoved(remove);
    const offActive = window.sable.on.activeChanged(setActive);

    useTabsStore.getState().setBootstrapped();

    return () => {
      offUpdate();
      offRemove();
      offActive();
    };
  }, []);

  // Global keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (!ctrlOrMeta) return;
      const k = e.key.toLowerCase();
      if (k === 't') {
        e.preventDefault();
        void window.sable.tabs.create('https://duckduckgo.com');
      } else if (k === 'w' && activeTabId) {
        e.preventDefault();
        void window.sable.tabs.close(activeTabId);
      } else if (k === 'r' && activeTabId) {
        e.preventDefault();
        void window.sable.tabs.reload(activeTabId);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeTabId]);

  return (
    <div className="h-full flex flex-col">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <PaneArea />
      </div>
    </div>
  );
}
