import { useEffect, useRef, useState } from 'react';
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { normalizeUrl } from '../url';

export function UrlBar() {
  const active = useTabsStore(selectActiveTab);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  // Sync displayed URL with active tab when not actively editing.
  useEffect(() => {
    if (!editing) setDraft(active?.url ?? '');
  }, [active?.url, editing]);

  // Ctrl/Cmd-L focus + select.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (ctrlOrMeta && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const submit = () => {
    if (!active) return;
    const url = normalizeUrl(draft);
    if (url) void window.sable.tabs.navigate(active.id, url);
    inputRef.current?.blur();
  };

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 border-b border-border"
      style={{
        height: 'var(--urlbar-h)',
        WebkitAppRegion: 'no-drag',
      } as React.CSSProperties}
    >
      <NavButton
        symbol="‹"
        title="Back"
        disabled={!active?.canGoBack}
        onClick={() => active && void window.sable.tabs.goBack(active.id)}
      />
      <NavButton
        symbol="›"
        title="Forward"
        disabled={!active?.canGoForward}
        onClick={() => active && void window.sable.tabs.goForward(active.id)}
      />
      <NavButton
        symbol="↻"
        title="Reload"
        onClick={() => active && void window.sable.tabs.reload(active.id)}
      />
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          else if (e.key === 'Escape') {
            setDraft(active?.url ?? '');
            inputRef.current?.blur();
          }
        }}
        placeholder="Enter URL or search…"
        className="flex-1 px-3 py-1.5 bg-bg-2 border border-border-strong rounded-lg text-fg outline-none focus:border-accent placeholder:text-fg-dim"
        style={{ fontSize: '12.5px' }}
      />
    </div>
  );
}

function NavButton({
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
      className="w-8 h-8 inline-flex items-center justify-center bg-bg-3 border border-border-strong rounded-lg text-fg-mute leading-none disabled:opacity-40 disabled:cursor-default enabled:hover:text-fg enabled:hover:border-fg-dim"
    >
      {symbol}
    </button>
  );
}
