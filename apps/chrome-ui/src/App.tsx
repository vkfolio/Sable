import { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { UrlBar } from './components/UrlBar';
import { PaneArea } from './components/PaneArea';
import { ChatSidebar } from './components/ChatSidebar';
import { useTabsStore } from './state/tabs';
import { useLayoutStore } from './state/layout';
import { useDragStore } from './state/drag';
import { useChatStore } from './state/chat';
import { useSettingsStore } from './state/settings';
import { useLocalModelStore } from './state/local-model';
import { useSpacesStore, selectActiveSpace } from './state/spaces';
import { useSkillsStore } from './state/skills';
import { useChromeStore } from './state/chrome';

export function App() {
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const chatVisible = useChromeStore((s) => s.chatVisible);
  const theme = useChromeStore((s) => s.theme);
  const activeSpace = useSpacesStore(selectActiveSpace);

  // Theme + active-Space accent applied to <html> so all CSS vars rebind.
  // Also tells main to recolor Win 11's native title-bar overlay buttons.
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    void window.sable.chrome.setTheme(theme);
  }, [theme]);
  useEffect(() => {
    if (activeSpace?.accent) {
      // accent is stored as a hex/var name id; map to data-space attribute
      document.documentElement.dataset['space'] = accentSlot(activeSpace.accent);
    } else {
      delete document.documentElement.dataset['space'];
    }
  }, [activeSpace?.accent]);

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
    const offSpaces = window.sable.on.spacesChanged((snap) => {
      useSpacesStore.getState().apply(snap);
    });
    const offSkills = window.sable.on.skillsChanged((skills) => {
      useSkillsStore.getState().apply(skills);
    });

    useTabsStore.getState().setBootstrapped();
    void useSettingsStore.getState().refresh();
    void useLocalModelStore.getState().refresh();
    void useSpacesStore.getState().refresh();
    void useSkillsStore.getState().refresh();

    return () => {
      offUpdate();
      offRemove();
      offActive();
      offLayout();
      offAgent();
      offLocalModel();
      offSpaces();
      offSkills();
    };
  }, []);

  // Global keyboard shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
        void window.sable.tabs.create('sable://newtab');
      } else if (k === 'w' && activeTabId) {
        e.preventDefault();
        void window.sable.tabs.close(activeTabId);
      } else if (k === 'r' && activeTabId) {
        e.preventDefault();
        void window.sable.tabs.reload(activeTabId);
      } else if (k === '.' && !e.shiftKey) {
        e.preventDefault();
        useChromeStore.getState().toggleChat();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeTabId]);

  // Document-wide pointerup ends drag-to-split.
  useEffect(() => {
    const handler = () => {
      const drag = useDragStore.getState();
      if (drag.dragging) drag.end(true);
    };
    document.addEventListener('pointerup', handler);
    return () => document.removeEventListener('pointerup', handler);
  }, []);

  // Whenever chat-visible changes, the pane area's right inset changes.
  // Tell main so it can reposition tab WebContentsViews to the new bounds.
  useEffect(() => {
    void window.sable.chrome.setChatVisible(chatVisible);
  }, [chatVisible]);

  return (
    <div className="h-full flex flex-col">
      <TitleBar />
      <UrlBar />
      <div className="flex-1 flex min-h-0">
        <PaneArea />
        {chatVisible && <ChatSidebar />}
      </div>
    </div>
  );
}

/**
 * Map a stored accent value (hex string from Spaces) to one of the seven
 * pastel slot ids the CSS recognizes via [data-space=...]. Best-effort
 * exact-hex match → fall through to lavender.
 */
function accentSlot(hex: string): string {
  const h = hex.toLowerCase();
  if (h === '#f2bcd0' || h.includes('rose')) return 'rose';
  if (h === '#c9beee' || h.includes('lavender')) return 'lavender';
  if (h === '#b3e5c9' || h.includes('mint')) return 'mint';
  if (h === '#b5d4f2' || h.includes('sky')) return 'sky';
  if (h === '#ffe69a' || h.includes('butter')) return 'butter';
  if (h === '#ffb89e' || h.includes('coral')) return 'coral';
  if (h === '#ffd49b' || h.includes('peach')) return 'peach';
  return 'lavender';
}
