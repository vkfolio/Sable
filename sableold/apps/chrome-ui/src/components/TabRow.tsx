// Horizontal tab strip — sits inside the titlebar to the right of the
// space tag. Each tab is a Chrome-style pill ~30px tall with a pastel
// favicon swatch. Active tab raises with a subtle box-shadow ring.

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTabsStore } from '../state/tabs';
import { useDragStore } from '../state/drag';
import { useSpacesStore } from '../state/spaces';
import type { TabId, TabState } from '../types';

const DRAG_THRESHOLD_PX = 4;

const FAVICON_PALETTE = ['#FFB89E', '#FFD49B', '#FFE69A', '#B3E5C9', '#B5D4F2', '#C9BEEE', '#F2BCD0'];
const PALETTE_VAR = ['--p-coral', '--p-peach', '--p-butter', '--p-mint', '--p-sky', '--p-lavender', '--p-rose'];

type ContextMenuState = { x: number; y: number; tab: TabState } | null;

type TabGroupSpec = {
  /** groupId for grouped runs; null for solo / ungrouped tabs. */
  groupId: string | null;
  tabs: TabState[];
  leadTab: TabState;
};

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

  // While a tab drag is active, walk up from the element under the cursor on
  // every pointermove and look for a `data-tab-pill` ancestor. Whichever pill
  // we land on (other than the source) is the current grouping target. This
  // is the authoritative source for `hoveredPill` — onPointerEnter on the
  // pill alone races the dragstart re-render and frequently misses the very
  // first hover after the drag begins.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = useDragStore.getState();
      if (!drag.dragging) return;
      let el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      let pill = el?.closest('[data-tab-pill]') as HTMLElement | null;
      // Match the pointerup projection: if the cursor is anywhere below the
      // strip but within a pill's X column, treat it as if hovering that
      // pill. Gives the hover ring a much bigger effective hit area while
      // dragging — the user can see what they'll group with even when
      // they're in the pane area.
      if (!pill) {
        const STRIP_PROBE_Y = 20;
        el = document.elementFromPoint(e.clientX, STRIP_PROBE_Y) as HTMLElement | null;
        pill = el?.closest('[data-tab-pill]') as HTMLElement | null;
      }
      const pillId = pill?.getAttribute('data-tab-pill') ?? null;
      const next = pillId && pillId !== drag.dragging.tabId ? pillId : null;
      if (next !== drag.hoveredPill) drag.setHoveredPill(next);
    };
    document.addEventListener('pointermove', onMove);
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  // Stable Chrome-like ordering: tabs appear in TabManager insertion order
  // (which is the order the user opened them). The activation state moves
  // the highlight, not the tab's position. computeGroups walks this list and
  // wraps any consecutive tabs that share a groupId — so a 3-tab group built
  // by drag-pill-onto-pill stays bracketed regardless of which tab is active.
  const groups = computeGroups(tabs);

  return (
    <div
      // Default to drag so empty space (between/after tabs) moves the window.
      // Individual tabs override with no-drag so they stay clickable / draggable
      // for split-to-pane.
      onDoubleClick={(e) => {
        // Empty strip space only — bail if the dblclick landed on a tab pill.
        // stopPropagation prevents TitleBar's dblclick→maximize from firing too.
        if (e.target !== e.currentTarget) return;
        e.stopPropagation();
        void window.sable.tabs.create('sable://newtab');
      }}
      className="flex-1 flex items-end gap-2 h-full overflow-x-auto pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {groups.map((group, idx) => (
        <TabGroup
          key={group.groupId ?? `solo-${idx}`}
          group={group}
          activeTabId={activeTabId}
          isActiveGroup={!!group.groupId && group.tabs.some((t) => t.id === activeTabId)}
          onContextMenu={(x, y, tab) => setMenu({ x, y, tab })}
        />
      ))}
      {menu && <TabContextMenu state={menu} onClose={() => setMenu(null)} />}
    </div>
  );
}

/**
 * Walk the (already space-filtered, insertion-ordered) tab list and bucket
 * tabs into groups by `groupId`. The first time a groupId is seen, we
 * create the group at that position — every subsequent member with the
 * same groupId is pulled into that bucket regardless of where it sits in
 * the insertion-ordered list.
 *
 * This lets the user form a group of t1+t3 (skipping t2) and see them
 * collapse into one visual wrap — Chrome's tab-group UX, where adding a
 * tab to a group also moves it adjacent to its group members.
 */
function computeGroups(tabs: readonly TabState[]): TabGroupSpec[] {
  const groups: TabGroupSpec[] = [];
  const groupIdxByGroupId = new Map<string, number>();
  for (const tab of tabs) {
    if (tab.groupId) {
      const idx = groupIdxByGroupId.get(tab.groupId);
      if (idx !== undefined) {
        groups[idx]!.tabs.push(tab);
      } else {
        groupIdxByGroupId.set(tab.groupId, groups.length);
        groups.push({ groupId: tab.groupId, tabs: [tab], leadTab: tab });
      }
    } else {
      groups.push({ groupId: null, tabs: [tab], leadTab: tab });
    }
  }
  return groups;
}

/**
 * Map a tab's faviconUrl host (or first letter fallback) to one of the seven
 * pastel CSS variables. Mirrors the Favicon swatch palette so the bracket
 * color matches the lead tab visually.
 */
function pastelVarForTab(tab: TabState | undefined): string {
  const letter = (tab?.title || tab?.url || '?').charAt(0).toUpperCase();
  const idx = letter.charCodeAt(0) % FAVICON_PALETTE.length;
  return PALETTE_VAR[idx]!;
}

type TabPosition = 'solo' | 'first' | 'middle' | 'last';

function TabGroup({
  group,
  activeTabId,
  isActiveGroup,
  onContextMenu,
}: {
  group: TabGroupSpec;
  activeTabId: TabId | null;
  isActiveGroup: boolean;
  onContextMenu: (x: number, y: number, tab: TabState) => void;
}) {
  const isWrappedGroup = group.groupId !== null && group.tabs.length > 1;
  const colorVar = pastelVarForTab(group.leadTab);

  // Single-tab leaves and the trailing "ungrouped" bucket render plain pills
  // — no wrap. Only multi-tab leaves get the connected-pills + pastel-wash
  // wrap (Chrome / Edge tab-group idiom).
  if (!isWrappedGroup) {
    return (
      <div
        className="flex items-end gap-[2px]"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {group.tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            active={tab.id === activeTabId}
            position="solo"
            onContextMenu={(x, y) => onContextMenu(x, y, tab)}
          />
        ))}
      </div>
    );
  }

  // Wrapped multi-tab group. Background/border tinted with the lead tab's
  // pastel; active pane bumps both opacity and border weight.
  const wrapStyle = {
    background: `rgb(var(${colorVar}) / ${isActiveGroup ? 0.18 : 0.1})`,
    borderColor: `rgb(var(${colorVar}) / ${isActiveGroup ? 0.55 : 0.35})`,
    borderWidth: isActiveGroup ? 2 : 1.5,
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties;

  return (
    <div
      style={wrapStyle}
      className="self-end flex items-stretch gap-0 px-1 pt-[3px] pb-[2px] rounded-[12px] border-solid"
    >
      <GroupChip colorVar={colorVar} count={group.tabs.length} />
      <div className="flex items-end gap-0">
        {group.tabs.map((tab, idx) => {
          const position: TabPosition =
            group.tabs.length === 1
              ? 'solo'
              : idx === 0
              ? 'first'
              : idx === group.tabs.length - 1
              ? 'last'
              : 'middle';
          return (
            <Tab
              key={tab.id}
              tab={tab}
              active={tab.id === activeTabId}
              position={position}
              onContextMenu={(x, y) => onContextMenu(x, y, tab)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Leading "@N" chip on a wrapped group — signals the group is feeding chat
 *  context (auto-context behaviour wired in Chat.tsx). */
function GroupChip({ colorVar, count }: { colorVar: string; count: number }) {
  return (
    <div
      className="self-end mr-1 mb-[1px] inline-flex items-center justify-center h-[22px] min-w-[26px] px-1.5 rounded-full text-[10px] font-mono font-semibold tracking-tight"
      style={{
        background: `rgb(var(${colorVar}) / 0.45)`,
        color: 'rgb(var(--ink-0))',
      }}
      title={`${count} tabs grouped — all sent to chat as context`}
    >
      @{count}
    </div>
  );
}

function Tab({
  tab,
  active,
  position = 'solo',
  onContextMenu,
}: {
  tab: TabState;
  active: boolean;
  position?: TabPosition;
  onContextMenu: (x: number, y: number) => void;
}) {
  const startDrag = useDragStore((s) => s.start);
  const dragging = useDragStore((s) => s.dragging);
  const hoveredPill = useDragStore((s) => s.hoveredPill);
  const isBeingDragged = dragging?.tabId === tab.id;
  const isHoveredPill = hoveredPill === tab.id && !!dragging && dragging.tabId !== tab.id;
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

  // Inside a wrapped group, tabs sit flush — flatten the corners on touching
  // sides so the row reads as one connected unit. Solo tabs keep the full
  // top-rounded silhouette.
  const corner =
    position === 'solo'
      ? 'rounded-t-[8px]'
      : position === 'first'
      ? 'rounded-tl-[8px]'
      : position === 'last'
      ? 'rounded-tr-[8px]'
      : 'rounded-none';

  return (
    <div
      data-tab-pill={tab.id}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY);
      }}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      className={`group h-[30px] inline-flex items-center gap-2 pl-3 pr-2.5 ${corner} cursor-default select-none flex-shrink-0 max-w-[200px] min-w-[90px] text-xs transition-[colors,transform,opacity] ease-out-quint duration-200 ${tone} ${
        isBeingDragged ? 'opacity-40 rotate-[2deg] cursor-grabbing' : ''
      } ${
        isHoveredPill
          ? 'ring-2 ring-acc shadow-[0_0_0_4px_rgb(var(--acc-glow))]'
          : ''
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
        <XMarkIcon className="w-[9px] h-[9px]" strokeWidth={2.5} />
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

  // Groups now live on TabState.groupId (decoupled from BSP). "Ungroup tab"
  // is offered whenever the right-clicked tab has a groupId set.
  const canUngroup = !!state.tab.groupId;

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
  const handleUngroup = () => {
    void window.sable.tabs.leaveGroup(state.tab.id);
    onClose();
  };
  const handleUnsplit = () => {
    void window.sable.tabs.dissolveGroup(state.tab.id);
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
      {canUngroup && (
        <MenuItem label="Ungroup tab" onClick={handleUngroup} />
      )}
      {canUngroup && (
        <MenuItem label="Unsplit" onClick={handleUnsplit} />
      )}
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
