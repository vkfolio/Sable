// URL bar — its own row beneath the titlebar. Displays the active tab's
// URL with a HTTPS lock indicator; click to enter edit mode where the user
// can paste a new URL or run a search.
//
// Right-side actions: tab counter pill, chat toggle, menu.

import { useEffect, useRef, useState } from 'react';
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { useChromeStore } from '../state/chrome';
import { useSpacesStore } from '../state/spaces';
import { normalizeUrl } from '../url';

export function UrlBar() {
  const active = useTabsStore(selectActiveTab);
  const tabsCount = useTabsStore((s) => {
    const space = useSpacesStore.getState().activeSpaceId;
    let n = 0;
    for (const t of s.tabsById.values()) if (!space || t.spaceId === space) n++;
    return n;
  });
  const chatVisible = useChromeStore((s) => s.chatVisible);
  const toggleChat = useChromeStore((s) => s.toggleChat);

  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(active?.url ?? '');
  }, [active?.url, editing]);

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

  const submit = () => {
    if (!active) {
      const url = normalizeUrl(draft);
      if (url) void window.sable.tabs.create(url);
    } else {
      const url = normalizeUrl(draft);
      if (url) void window.sable.tabs.navigate(active.id, url);
    }
    inputRef.current?.blur();
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

      <div
        className={`flex-1 h-9 flex items-center gap-2.5 pl-3.5 pr-2.5 rounded-[11px] cursor-text bg-surface-2 border ${
          editing ? 'border-acc shadow-[0_0_0_4px_rgb(var(--acc-glow)),var(--shadow-1)]' : 'border-line shadow-1 hover:border-line-strong'
        } transition-colors`}
        onClick={() => {
          if (!editing) {
            setEditing(true);
            // give the click time to land before we focus
            setTimeout(() => {
              inputRef.current?.focus();
              inputRef.current?.select();
            }, 0);
          }
        }}
      >
        {isHttps && !editing && (
          <svg className="w-3.5 h-3.5 text-ok shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
        )}
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              else if (e.key === 'Escape') {
                setDraft(active?.url ?? '');
                inputRef.current?.blur();
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

      <div className="shrink-0 flex items-center gap-0.5">
        <button
          title="Tab counter"
          className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium bg-acc-soft text-acc-ink rounded-lg"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>{tabsCount}</span>
        </button>
        <button
          title="Toggle chat (Ctrl+.)"
          onClick={toggleChat}
          className={`w-[30px] h-[30px] inline-flex items-center justify-center rounded-lg ${
            chatVisible ? 'bg-acc-soft text-acc-ink' : 'text-ink-2 hover:bg-surface-3 hover:text-ink-0'
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 4h16v12H8l-4 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function NavButtons({ active }: { active: ReturnType<typeof selectActiveTab> }) {
  const back = () => active && void window.sable.tabs.goBack(active.id);
  const fwd = () => active && void window.sable.tabs.goForward(active.id);
  const reload = () => active && void window.sable.tabs.reload(active.id);
  return (
    <div className="shrink-0 flex items-center gap-0.5">
      <NavBtn title="Back" disabled={!active?.canGoBack} onClick={back}>
        <path d="M15 18l-6-6 6-6" />
      </NavBtn>
      <NavBtn title="Forward" disabled={!active?.canGoForward} onClick={fwd}>
        <path d="M9 6l6 6-6 6" />
      </NavBtn>
      <NavBtn title="Reload" onClick={reload}>
        <path d="M3 5v4h4M21 19v-4h-4M19 8a8 8 0 0 0-14 0M5 16a8 8 0 0 0 14 0" />
      </NavBtn>
    </div>
  );
}

function NavBtn({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="w-[30px] h-[30px] inline-flex items-center justify-center rounded-lg text-ink-2 hover:bg-surface-3 hover:text-ink-0 disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-ink-2"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        {children}
      </svg>
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
