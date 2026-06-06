// URL bar — its own row beneath the titlebar. Displays the active tab's
// URL with a HTTPS lock indicator; click to enter edit mode where the user
// can paste a new URL or run a search.
//
// Right-side actions: tab counter pill, chat toggle, menu.

import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  Square2StackIcon,
} from '@heroicons/react/24/outline';
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { useChromeStore } from '../state/chrome';
import { useSettingsStore } from '../state/settings';
import { useSpacesStore } from '../state/spaces';
import { useLayoutStore } from '../state/layout';
import { normalizeUrl } from '../url';
import type { HistoryEntry } from '../types';

/**
 * Outer wrapper: in multi-pane layouts, each pane carries its own MiniUrlBar
 * — the global bar would be ambiguous (which pane is it for?). Hide it then.
 * The actual hook-using body is in `UrlBarBody` to keep the Rules of Hooks
 * satisfied (no conditional hook calls).
 */
export function UrlBar() {
  const leaves = useLayoutStore(useShallow((s) => s.leaves));
  if (leaves.length > 1) return null;
  return <UrlBarBody />;
}

function UrlBarBody() {
  const active = useTabsStore(selectActiveTab);
  const tabsCount = useTabsStore((s) => {
    const space = useSpacesStore.getState().activeSpaceId;
    let n = 0;
    for (const t of s.tabsById.values()) if (!space || t.spaceId === space) n++;
    return n;
  });
  const chatVisible = useChromeStore((s) => s.chatVisible);
  const toggleChat = useChromeStore((s) => s.toggleChat);
  const searchEngine = useSettingsStore((s) => s.searchEngine);
  const searchEngineCustomUrl = useSettingsStore((s) => s.searchEngineCustomUrl);

  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [matches, setMatches] = useState<readonly HistoryEntry[]>([]);
  const [highlight, setHighlight] = useState(-1);

  useEffect(() => {
    if (!editing) setDraft(active?.url ?? '');
  }, [active?.url, editing]);

  // While the dropdown is visible we need to retract the active tab's
  // WebContentsView — Electron always layers tab views above the chrome's
  // React DOM, so without this the dropdown is invisible on a loaded page.
  // setOverlay(true) calls layout.setDragMode(true) which unmountAll()s the
  // tab views; cleanup remounts. Same trick SettingsDialog / SpacesPopover
  // use.
  useEffect(() => {
    if (!editing) return;
    void window.sable.chrome.setOverlay(true);
    return () => {
      void window.sable.chrome.setOverlay(false);
    };
  }, [editing]);

  // Debounced history search while editing — drives the autocomplete
  // dropdown beneath the URL field.
  useEffect(() => {
    if (!editing) {
      setMatches([]);
      setHighlight(-1);
      return;
    }
    const t = draft.trim();
    if (!t) {
      // empty draft → show recent
      let cancelled = false;
      void window.sable.history.recent(5).then((r) => {
        if (!cancelled) setMatches(r);
      });
      return () => {
        cancelled = true;
      };
    }
    const id = setTimeout(async () => {
      const r = await window.sable.history.search(t).catch(() => []);
      setMatches(r.slice(0, 5));
      setHighlight(-1);
    }, 120);
    return () => clearTimeout(id);
  }, [draft, editing]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const navigate = (url: string) => {
    if (!active) void window.sable.tabs.create(url);
    else void window.sable.tabs.navigate(active.id, url);
    inputRef.current?.blur();
  };

  const submit = () => {
    // If a history row is highlighted, commit to it.
    if (highlight >= 0 && highlight < matches.length) {
      navigate(matches[highlight]!.url);
      return;
    }
    const url = normalizeUrl(draft, searchEngine, searchEngineCustomUrl);
    if (url) navigate(url);
  };

  const ttl = active?.title || active?.url || '';
  const sub = active ? safeHost(active.url) : '';
  const isHttps = active ? active.url.startsWith('https://') : false;

  return (
    <div
      className="flex items-center gap-2.5 px-3 bg-surface-1"
      style={{ height: 'var(--urlbar-row-h)' }}
    >
      <NavButtons active={active} />

      <div className="relative flex-1">
        <div
          className={`h-9 flex items-center gap-2.5 pl-3.5 pr-2.5 rounded-[11px] cursor-text bg-surface-2 border ${
            editing ? 'border-acc shadow-[0_0_0_4px_rgb(var(--acc-glow)),var(--shadow-1)]' : 'border-line shadow-1 hover:border-line-strong'
          } transition-colors`}
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
          {isHttps && !editing && (
            <LockClosedIcon className="w-3.5 h-3.5 text-ok shrink-0" />
          )}
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                // Tiny delay so a click on a dropdown row can land before the
                // dropdown unmounts.
                setTimeout(() => setEditing(false), 100);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                else if (e.key === 'Escape') {
                  setDraft(active?.url ?? '');
                  inputRef.current?.blur();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlight((i) => Math.min(matches.length - 1, i + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlight((i) => Math.max(-1, i - 1));
                }
              }}
              placeholder="Search, ask, or paste a link…"
              spellCheck={false}
              className="flex-1 min-w-0 border-0 bg-transparent outline-none text-base text-ink-0 font-medium placeholder:text-ink-3 placeholder:font-normal"
            />
          ) : active ? (
            <>
              <span className="flex-1 min-w-0 truncate text-base font-medium text-ink-0">{ttl}</span>
              <em className="shrink-0 not-italic text-sm text-ink-3 font-normal">{sub}</em>
            </>
          ) : (
            <span className="flex-1 min-w-0 truncate text-base text-ink-3">Search, ask, or paste a link…</span>
          )}
          <kbd className="font-mono text-[10px] text-ink-2 bg-surface-3 px-1.5 py-0.5 rounded border border-line shrink-0">⌘L</kbd>
        </div>
        {editing && matches.length > 0 && (
          <HistoryDropdown
            matches={matches}
            highlight={highlight}
            onPick={(url) => {
              navigate(url);
            }}
            onHover={setHighlight}
          />
        )}
      </div>

      <div className="shrink-0 flex items-center gap-0.5">
        <button
          title="Tab counter"
          className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium bg-acc-soft text-acc-ink rounded-lg"
        >
          <Square2StackIcon className="w-[13px] h-[13px]" />
          <span>{tabsCount}</span>
        </button>
        <button
          title="Toggle chat (Ctrl+.)"
          onClick={toggleChat}
          className={`w-[30px] h-[30px] inline-flex items-center justify-center rounded-lg ${
            chatVisible ? 'bg-acc-soft text-acc-ink' : 'text-ink-2 hover:bg-surface-3 hover:text-ink-0'
          }`}
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function HistoryDropdown({
  matches,
  highlight,
  onPick,
  onHover,
}: {
  matches: readonly HistoryEntry[];
  highlight: number;
  onPick: (url: string) => void;
  onHover: (i: number) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-surface-2 border border-line rounded-[11px] shadow-3 overflow-hidden">
      {matches.map((m, i) => (
        <button
          key={m.url}
          onMouseDown={(e) => {
            // Prevent input blur from firing before the click commits.
            e.preventDefault();
            onPick(m.url);
          }}
          onMouseEnter={() => onHover(i)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
            i === highlight ? 'bg-acc-soft text-ink-0' : 'hover:bg-surface-3'
          }`}
        >
          <Favicon url={m.url} />
          <span className="flex-1 min-w-0 truncate text-ink-0">{m.title || m.url}</span>
          <span className="shrink-0 text-[11px] text-ink-3 font-mono truncate max-w-[200px]">
            {safeHost(m.url)}
          </span>
        </button>
      ))}
    </div>
  );
}

function Favicon({ url }: { url: string }) {
  const host = safeHost(url);
  const src = `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(host)}`;
  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      className="w-4 h-4 rounded-sm shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}

function NavButtons({ active }: { active: ReturnType<typeof selectActiveTab> }) {
  const back = () => active && void window.sable.tabs.goBack(active.id);
  const fwd = () => active && void window.sable.tabs.goForward(active.id);
  const reload = () => active && void window.sable.tabs.reload(active.id);
  return (
    <div className="shrink-0 flex items-center gap-0.5">
      <NavBtn title="Back" disabled={!active?.canGoBack} onClick={back} Icon={ChevronLeftIcon} />
      <NavBtn title="Forward" disabled={!active?.canGoForward} onClick={fwd} Icon={ChevronRightIcon} />
      <NavBtn title="Reload" onClick={reload} Icon={ArrowPathIcon} />
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
      onClick={onClick}
      className="w-[30px] h-[30px] inline-flex items-center justify-center rounded-lg text-ink-2 hover:bg-surface-3 hover:text-ink-0 disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-ink-2"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
