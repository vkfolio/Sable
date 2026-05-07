// Horizontal tab strip — sits inside the titlebar to the right of the
// space tag. Each tab is a Chrome-style pill ~30px tall with a pastel
// favicon swatch. Active tab raises with a subtle box-shadow ring.

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTabsStore } from '../state/tabs';
import { useDragStore } from '../state/drag';
import { useSpacesStore } from '../state/spaces';
import type { TabState } from '../types';

const DRAG_THRESHOLD_PX = 4;

type ContextMenuState = { x: number; y: number; tab: TabState } | null;

export function TabRow() {
  const activeSpaceId = useSpacesStore((s) => s.activeSpaceId);
  const tabs = useTabsStore(
    useShallow((s) =>
      Array.from(s.tabsById.values()).filter((t) =>
        activeSpaceId ? t.spaceId === activeSpaceId : true,
      ),
    ),
  );
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const [menu, setMenu] = useState<ContextMenuState>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  return (
    <div
      // Default to drag so empty space (between/after tabs) moves the window.
      // Individual tabs override with no-drag so they stay clickable / draggable
      // for split-to-pane.
      className="flex-1 flex items-end gap-[2px] h-full overflow-x-auto pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          onContextMenu={(x, y) => setMenu({ x, y, tab })}
        />
      ))}
      {menu && <TabContextMenu state={menu} onClose={() => setMenu(null)} />}
    </div>
  );
}

function Tab({
  tab,
  active,
  onContextMenu,
}: {
  tab: TabState;
  active: boolean;
  onContextMenu: (x: number, y: number) => void;
}) {
  const startDrag = useDragStore((s) => s.start);
  const dragging = useDragStore((s) => s.dragging);
  const isBeingDragged = dragging?.tabId === tab.id;
  const isCtx = tab.selectedForContext;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (e.ctrlKey || e.metaKey) return;
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
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      void window.sable.tabs.setSelectedForContext(tab.id, !isCtx);
      return;
    }
    void window.sable.tabs.setActive(tab.id);
  };

  const tone = active
    ? 'bg-surface-1 text-ink-0 font-medium shadow-[0_0_0_1px_rgb(var(--line-strong))]'
    : isCtx
    ? 'bg-acc-soft text-ink-0'
    : 'text-ink-1 hover:bg-surface-3 hover:text-ink-0';

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY);
      }}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      className={`group h-[30px] inline-flex items-center gap-2 pl-3 pr-2.5 rounded-t-[8px] cursor-default select-none flex-shrink-0 max-w-[200px] min-w-[90px] text-xs transition-colors ${tone} ${
        isBeingDragged ? 'opacity-40' : ''
      }`}
    >
      {isCtx && <span className="font-mono text-[10px] font-semibold text-acc-ink -mr-0.5">@</span>}
      <Favicon tab={tab} />
      <span className="flex-1 truncate">{tab.title || tab.url || 'loading'}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          void window.sable.tabs.close(tab.id);
        }}
        title="Close"
        className="opacity-0 group-hover:opacity-100 w-4 h-4 inline-flex items-center justify-center rounded text-ink-3 hover:bg-surface-3 hover:text-ink-0"
      >
        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 5l14 14M5 19L19 5" />
        </svg>
      </button>
    </div>
  );
}

function Favicon({ tab }: { tab: TabState }) {
  if (tab.loading) {
    return (
      <div
        className="w-3.5 h-3.5 rounded-full border-[1.5px] border-ink-3 border-t-transparent shrink-0"
        style={{ animation: 'spin 0.8s linear infinite' }}
      />
    );
  }
  if (tab.faviconUrl) {
    return (
      <img
        src={tab.faviconUrl}
        alt=""
        className="w-3.5 h-3.5 rounded shrink-0 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
        }}
      />
    );
  }
  // Pastel swatch fallback based on URL host first letter
  const letter = (tab.title || tab.url || '?').charAt(0).toUpperCase();
  const palette = ['#FFB89E', '#FFD49B', '#FFE69A', '#B3E5C9', '#B5D4F2', '#C9BEEE', '#F2BCD0'];
  const idx = letter.charCodeAt(0) % palette.length;
  return (
    <div
      className="w-3.5 h-3.5 rounded shrink-0 inline-flex items-center justify-center text-[8px] font-semibold"
      style={{ background: palette[idx], color: '#3a2a18' }}
    >
      {letter}
    </div>
  );
}

function TabContextMenu({ state, onClose }: { state: NonNullable<ContextMenuState>; onClose: () => void }) {
  const spaces = useSpacesStore((s) => s.spaces);
  const otherSpaces = spaces.filter((s) => s.id !== state.tab.spaceId);

  // Tab is in the titlebar at the top; the menu drops below the cursor.
  // Clamp to viewport.
  const MENU_W = 220;
  const left = Math.max(8, Math.min(state.x, window.innerWidth - MENU_W - 8));
  const top = Math.min(state.y, window.innerHeight - 280);

  const handleMove = (spaceId: string) => {
    void window.sable.tabs.setSpace(state.tab.id, spaceId);
    onClose();
  };
  const handleToggleContext = () => {
    void window.sable.tabs.setSelectedForContext(state.tab.id, !state.tab.selectedForContext);
    onClose();
  };
  const handleClose = () => {
    void window.sable.tabs.close(state.tab.id);
    onClose();
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left,
        top,
        width: MENU_W,
        zIndex: 70,
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}
      className="bg-surface-2 border border-line rounded-xl shadow-3 p-1"
    >
      <MenuItem
        label={state.tab.selectedForContext ? 'Remove from chat context' : 'Add as chat context'}
        onClick={handleToggleContext}
      />
      <Sep />
      {otherSpaces.length > 0 ? (
        <>
          <MenuLabel text="Move to space" />
          {otherSpaces.map((s) => (
            <MenuItem
              key={s.id}
              label={
                <>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.accent }} />
                  {s.name}
                </>
              }
              onClick={() => handleMove(s.id)}
            />
          ))}
          <Sep />
        </>
      ) : (
        <MenuLabel text="No other spaces" muted />
      )}
      <MenuItem label="Close tab" onClick={handleClose} variant="danger" />
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  variant,
}: {
  label: React.ReactNode;
  onClick: () => void;
  variant?: 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-base ${
        variant === 'danger' ? 'text-bad hover:bg-surface-3' : 'text-ink-0 hover:bg-surface-3'
      }`}
    >
      {label}
    </button>
  );
}

function MenuLabel({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <div
      className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] ${
        muted ? 'text-ink-3 normal-case tracking-normal font-normal' : 'text-ink-3'
      }`}
    >
      {text}
    </div>
  );
}

function Sep() {
  return <div className="my-1 border-t border-line" />;
}
