// Per-pane URL bar — slim 36 px row painted at the top of every pane in a
// multi-pane split. Each pane's bar is bound to its own tab so the user can
// navigate panes independently. In single-pane mode the global UrlBar
// handles navigation and this component is not rendered.
//
// The bar's drag region (URL field) doubles as a pane drag handle: holding
// down past the 4 px threshold starts a tab drag, with the same drop targets
// as a strip pill (overlays + cross-pill grouping). `data-tab-pill` is set
// so the existing pointerup-target matching in App.tsx finds this bar the
// same way it finds strip pills.

import { useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTabsStore } from '../state/tabs';
import { useDragStore } from '../state/drag';
import { useSettingsStore } from '../state/settings';
import { normalizeUrl } from '../url';
import type { TabState } from '../types';

const DRAG_THRESHOLD_PX = 4;

export function MiniUrlBar({ tab }: { tab: TabState }) {
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const startDrag = useDragStore((s) => s.start);
  const searchEngine = useSettingsStore((s) => s.searchEngine);
  const searchEngineCustomUrl = useSettingsStore((s) => s.searchEngineCustomUrl);
  const isActive = tab.id === activeTabId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(tab.url);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(tab.url);
  }, [tab.url, editing]);

  const submit = () => {
    const url = normalizeUrl(draft, searchEngine, searchEngineCustomUrl);
    if (url) void window.sable.tabs.navigate(tab.id, url);
    inputRef.current?.blur();
  };

  // Drag handle: pointerdown→threshold→useDragStore.start. Identical to the
  // strip pill's handler so the drop machinery (overlays, joinGroup,
  // applyDrop) works without any extra wiring.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('input,button')) return;
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

  const isHttps = tab.url.startsWith('https://');
  const sub = safeHost(tab.url);

  return (
    <div
      data-tab-pill={tab.id}
      onPointerDown={handlePointerDown}
      onMouseDown={() => {
        // Clicking anywhere on the bar should focus this pane's tab so global
        // shortcuts / chat context bind to it.
        if (!isActive) void window.sable.tabs.setActive(tab.id);
      }}
      className={`flex items-center gap-1 h-9 px-1.5 border-b ${
        isActive ? 'border-acc/60 bg-surface-1' : 'border-line bg-surface-2'
      } cursor-default select-none`}
    >
      <NavBtn title="Back" disabled={!tab.canGoBack} onClick={() => void window.sable.tabs.goBack(tab.id)} Icon={ChevronLeftIcon} />
      <NavBtn title="Forward" disabled={!tab.canGoForward} onClick={() => void window.sable.tabs.goForward(tab.id)} Icon={ChevronRightIcon} />
      <NavBtn title="Reload" onClick={() => void window.sable.tabs.reload(tab.id)} Icon={ArrowPathIcon} />

      <div
        className={`flex-1 min-w-0 h-7 flex items-center gap-1.5 pl-2 pr-1.5 rounded-md cursor-text bg-surface-3 border ${
          editing ? 'border-acc shadow-[0_0_0_3px_rgb(var(--acc-glow))]' : 'border-line'
        }`}
        onClick={() => {
          if (!editing) {
            setEditing(true);
            setTimeout(() => {
              inputRef.current?.focus();
              inputRef.current?.select();
            }, 0);
          }
        }}
      >
        {isHttps && !editing && <LockClosedIcon className="w-3 h-3 text-ok shrink-0" />}
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              else if (e.key === 'Escape') {
                setDraft(tab.url);
                inputRef.current?.blur();
              }
            }}
            placeholder="Search or paste URL…"
            spellCheck={false}
            className="flex-1 min-w-0 border-0 bg-transparent outline-none text-xs text-ink-0 placeholder:text-ink-3"
          />
        ) : (
          <>
            <span className="flex-1 min-w-0 truncate text-xs text-ink-0">
              {tab.title || tab.url || '—'}
            </span>
            <em className="shrink-0 not-italic text-[10px] text-ink-3">{sub}</em>
          </>
        )}
      </div>

      <NavBtn title="Close" onClick={() => void window.sable.tabs.close(tab.id)} Icon={XMarkIcon} />
    </div>
  );
}

function NavBtn({
  title,
  disabled,
  onClick,
  Icon,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-6 h-6 inline-flex items-center justify-center rounded text-ink-2 hover:bg-surface-3 hover:text-ink-0 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-2"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
