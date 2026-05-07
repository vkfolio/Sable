import { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { PaneArea } from './components/PaneArea';
import { useTabsStore } from './state/tabs';
import { useLayoutStore } from './state/layout';
import { useDragStore } from './state/drag';
import { useChatStore } from './state/chat';
import { useSettingsStore } from './state/settings';
import { useLocalModelStore } from './state/local-model';

export function App() {
  const activeTabId = useTabsStore((s) => s.activeTabId);

  // Subscribe to push events from main on first mount.
  useEffect(() => {
    const upsert = useTabsStore.getState().upsertTab;
    const remove = useTabsStore.getState().removeTab;
    const setActive = useTabsStore.getState().setActive;
    const applyLayout = useLayoutStore.getState().apply;
    const applyAgent = useChatStore.getState().applyEvent;

    const offUpdate = window.sable.on.tabUpdated(upsert);
    const offRemove = window.sable.on.tabRemoved(remove);
    const offActive = window.sable.on.activeChanged(setActive);
    const offLayout = window.sable.on.layoutChanged(applyLayout);
    const offAgent = window.sable.on.agentEvent(applyAgent);
    const offLocalModel = window.sable.on.localModelEvent((evt) => {
      useLocalModelStore.getState().applyEvent(evt);
    });

    useTabsStore.getState().setBootstrapped();
    void useSettingsStore.getState().refresh();
    void useLocalModelStore.getState().refresh();

    return () => {
      offUpdate();
      offRemove();
      offActive();
      offLayout();
      offAgent();
      offLocalModel();
    };
  }, []);

  // Global keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape always cancels an in-progress drag, regardless of focus target.
      if (e.key === 'Escape' && useDragStore.getState().dragging) {
        e.preventDefault();
        useDragStore.getState().end(false);
        return;
      }
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

  // Document-wide pointerup ends drag-to-split. Commits the drop iff a zone
  // is currently hovered. Pointermove keeps drag going (zones handle their
  // own onPointerEnter for hover detection).
  useEffect(() => {
    const handler = () => {
      const drag = useDragStore.getState();
      if (drag.dragging) drag.end(true);
    };
    document.addEventListener('pointerup', handler);
    return () => document.removeEventListener('pointerup', handler);
  }, []);

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
