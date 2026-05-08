// Dia-style omnibar — single command bar that handles URL navigation +
// search + (later) chat. Lives in the sidebar; replaces the
// previous "URL bar in pane area + cmd input in sidebar" duplication.
//
// Behavior:
//  - Display: shows the active tab's URL when not focused.
//  - Focus: selects all so the user can type to replace.
//  - Enter: navigates the active tab; if no active tab, creates one.
//  - Escape: blurs + resets to current URL.
//  - Cmd/Ctrl-L: focus + select (registered globally).

import { useEffect, useRef, useState } from 'react';
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { normalizeUrl } from '../url';

export function Omnibar() {
  const active = useTabsStore(selectActiveTab);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  // Sync displayed URL with active tab when not editing.
  useEffect(() => {
    if (!editing) setDraft(active?.url ?? '');
  }, [active?.url, editing]);

  // Cmd/Ctrl-L focus + select.
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
    const url = normalizeUrl(draft);
    if (!url) return;
    if (active) {
      void window.sable.tabs.navigate(active.id, url);
    } else {
      void window.sable.tabs.create(url);
    }
    inputRef.current?.blur();
  };

  return (
    <div
      className="flex items-center gap-1 px-2.5 py-2.5 border-b border-border"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <NavBtn
        symbol="‹"
        title="Back (Alt+Left)"
        disabled={!active?.canGoBack}
        onClick={() => active && void window.sable.tabs.goBack(active.id)}
      />
      <NavBtn
        symbol="›"
        title="Forward (Alt+Right)"
        disabled={!active?.canGoForward}
        onClick={() => active && void window.sable.tabs.goForward(active.id)}
      />
      <NavBtn
        symbol="↻"
        title="Reload (Ctrl+R)"
        onClick={() => active && void window.sable.tabs.reload(active.id)}
      />
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => {
          setEditing(true);
          e.currentTarget.select();
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          else if (e.key === 'Escape') {
            setDraft(active?.url ?? '');
            inputRef.current?.blur();
          }
        }}
        placeholder={active ? 'Search or URL…' : 'New tab — search or URL'}
        spellCheck={false}
        className="flex-1 min-w-0 px-2.5 py-1.5 bg-bg-3 border border-border-strong rounded-md text-sm text-fg outline-none focus:border-accent placeholder:text-fg-dim"
      />
    </div>
  );
}

function NavBtn({
  symbol,
  title,
  disabled,
  onClick,
}: {
  symbol: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="w-6 h-6 inline-flex items-center justify-center bg-transparent rounded-md text-fg-mute leading-none disabled:opacity-30 disabled:cursor-default enabled:hover:text-fg enabled:hover:bg-bg-3"
    >
      {symbol}
    </button>
  );
}
