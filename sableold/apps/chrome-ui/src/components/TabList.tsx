import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTabsStore } from '../state/tabs';
import { useDragStore } from '../state/drag';
import { useSpacesStore } from '../state/spaces';
import type { TabState } from '../types';

const DRAG_THRESHOLD_PX = 4;

type ContextMenuState = {
  x: number;
  y: number;
  tab: TabState;
} | null;

export function TabList() {
  const activeSpaceId = useSpacesStore((s) => s.activeSpaceId);
  // Filter to active space's tabs only.
  const tabs = useTabsStore(
    useShallow((s) =>
      Array.from(s.tabsById.values()).filter((t) =>
        activeSpaceId ? t.spaceId === activeSpaceId : true,
      ),
    ),
  );
  const activeTabId = useTabsStore((s) => s.activeTabId);

  const [menu, setMenu] = useState<ContextMenuState>(null);

  // Click-away / Escape close. We don't need to retract tab views — the
  // menu is clamped to stay within the sidebar's chrome region (see below).
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

  if (tabs.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-fg-dim">
        No tabs in this space. Press + or Ctrl+T.
      </div>
    );
  }

  return (
    <>
      <div
        className="flex-1 overflow-auto"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {tabs.map((tab) => (
          <TabRow
            key={tab.id}
            tab={tab}
            active={tab.id === activeTabId}
            onContextMenu={(x, y) => setMenu({ x, y, tab })}
          />
        ))}
      </div>
      {menu && <TabContextMenu state={menu} onClose={() => setMenu(null)} />}
    </>
  );
}

function TabRow({
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
  const isSelected = tab.selectedForContext;

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
      void window.sable.tabs.setSelectedForContext(tab.id, !isSelected);
      return;
    }
    void window.sable.tabs.setActive(tab.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e.clientX, e.clientY);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    void window.sable.tabs.close(tab.id);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={
        isSelected
          ? 'Selected for chat context · Ctrl+click to deselect · Right-click for more'
          : 'Right-click for more · Ctrl+click to add as chat context'
      }
      className={`group flex items-center gap-2.5 px-4 py-1.5 text-base cursor-default transition-colors select-none ${
        active
          ? 'bg-bg-4 text-fg'
          : isSelected
          ? 'bg-accent/10 text-fg'
          : 'text-fg-mute hover:bg-bg-3 hover:text-fg'
      } ${isBeingDragged ? 'opacity-50' : ''} ${
        isSelected && !active ? 'border-l-2 border-accent pl-[14px]' : ''
      }`}
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

      {isSelected && (
        <span
          className="text-2xs px-1 py-0.5 rounded bg-accent/20 text-accent leading-none"
          title="Will be sent as context with the next chat message"
        >
          ctx
        </span>
      )}

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

function TabContextMenu({
  state,
  onClose,
}: {
  state: NonNullable<ContextMenuState>;
  onClose: () => void;
}) {
  const spaces = useSpacesStore((s) => s.spaces);
  const otherSpaces = spaces.filter((s) => s.id !== state.tab.spaceId);

  // Clamp menu position to stay inside the sidebar (280px) so it doesn't
  // extend into the pane area where tab WebContentsViews would occlude it.
  // Window CSS variables: --sidebar-w=280px. Menu width ~210px → max left = 70.
  const MENU_WIDTH = 210;
  const SIDEBAR_W = 280;
  const left = Math.max(8, Math.min(state.x, SIDEBAR_W - MENU_WIDTH - 8));
  const top = Math.min(state.y, window.innerHeight - 260);

  const handleMove = (spaceId: string) => {
    void window.sable.tabs.setSpace(state.tab.id, spaceId);
    onClose();
  };

  const handleToggleContext = () => {
    void window.sable.tabs.setSelectedForContext(
      state.tab.id,
      !state.tab.selectedForContext,
    );
    onClose();
  };

  const handleClose = () => {
    void window.sable.tabs.close(state.tab.id);
    onClose();
  };

  // Stop the click-away listener from firing on the menu itself.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onMouseDown={stop}
      onClick={stop}
      style={{
        position: 'fixed',
        left,
        top,
        width: MENU_WIDTH,
        zIndex: 60,
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}
      className="bg-bg-2 border border-border-strong rounded-lg shadow-2xl py-1"
    >
      <MenuItem
        label={state.tab.selectedForContext ? 'Remove from chat context' : 'Add as chat context'}
        onClick={handleToggleContext}
      />
      <div className="border-t border-border my-1" />
      {otherSpaces.length > 0 ? (
        <>
          <MenuLabel text="Move to space" />
          {otherSpaces.map((s) => (
            <MenuItem
              key={s.id}
              label={
                <>
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: s.accent }}
                  />
                  {s.name}
                </>
              }
              onClick={() => handleMove(s.id)}
            />
          ))}
          <div className="border-t border-border my-1" />
        </>
      ) : (
        <MenuLabel text="No other spaces · open Settings to add one" muted />
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
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-bg-3 ${
        variant === 'danger' ? 'text-red-300 hover:text-red-200' : 'text-fg-mute hover:text-fg'
      }`}
    >
      {label}
    </button>
  );
}

function MenuLabel({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <div
      className={`px-3 py-1 text-2xs font-semibold tracking-wider uppercase ${
        muted ? 'text-fg-dim font-normal normal-case tracking-normal' : 'text-fg-dim'
      }`}
    >
      {text}
    </div>
  );
}
