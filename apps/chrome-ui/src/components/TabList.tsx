import { useShallow } from 'zustand/react/shallow';
import { useTabsStore } from '../state/tabs';
import { useDragStore } from '../state/drag';
import type { TabState } from '../types';

const DRAG_THRESHOLD_PX = 4;

export function TabList() {
  // useShallow so a fresh-array result with identical contents doesn't re-render.
  const tabs = useTabsStore(useShallow((s) => Array.from(s.tabsById.values())));
  const activeTabId = useTabsStore((s) => s.activeTabId);

  if (tabs.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-fg-dim">
        No tabs. Press + or Ctrl+T to open one.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      {tabs.map((tab) => (
        <TabRow key={tab.id} tab={tab} active={tab.id === activeTabId} />
      ))}
    </div>
  );
}

function TabRow({ tab, active }: { tab: TabState; active: boolean }) {
  const startDrag = useDragStore((s) => s.start);
  const dragging = useDragStore((s) => s.dragging);
  const isBeingDragged = dragging?.tabId === tab.id;

  // Pointer-down captures position; only enter drag mode after the user moves
  // beyond DRAG_THRESHOLD_PX so a plain click still selects the tab.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // left button only
    const startX = e.clientX;
    const startY = e.clientY;
    const tabId = tab.id;
    let dragStarted = false;

    const onMove = (ev: PointerEvent) => {
      if (dragStarted) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        dragStarted = true;
        startDrag(tabId);
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // If drag never started, this was a click. Selection happens via onClick below.
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleClick = () => {
    void window.sable.tabs.setActive(tab.id);
  };
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    void window.sable.tabs.close(tab.id);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`group flex items-center gap-2.5 px-4 py-1.5 text-base cursor-default transition-colors select-none ${
        active
          ? 'bg-bg-4 text-fg'
          : 'text-fg-mute hover:bg-bg-3 hover:text-fg'
      } ${isBeingDragged ? 'opacity-50' : ''}`}
    >
      {tab.faviconUrl ? (
        <img
          src={tab.faviconUrl}
          alt=""
          className="w-3.5 h-3.5 rounded-sm bg-bg-3 object-contain shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
      ) : (
        <div className="w-3.5 h-3.5 rounded-sm bg-bg-3 shrink-0" />
      )}

      {tab.loading && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
          style={{ animation: 'pulse 1.2s ease-in-out infinite' }}
        />
      )}

      <span className="flex-1 truncate">{tab.title || tab.url || '(loading)'}</span>

      <button
        onClick={handleClose}
        title="Close tab"
        className="invisible group-hover:visible w-[18px] h-[18px] inline-flex items-center justify-center rounded text-fg-dim hover:bg-bg-3 hover:text-fg leading-none"
      >
        ×
      </button>
    </div>
  );
}
