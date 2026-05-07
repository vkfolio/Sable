import { useState } from 'react';
import { TabList } from './TabList';
import { normalizeUrl } from '../url';

export function Sidebar() {
  const [cmd, setCmd] = useState('');

  const submitCmd = () => {
    const url = normalizeUrl(cmd);
    if (!url) return;
    void window.sable.tabs.create(url);
    setCmd('');
  };

  return (
    <aside
      className="flex-shrink-0 flex flex-col bg-bg-2 border-r border-border overflow-hidden"
      style={{ width: 'var(--sidebar-w)' }}
    >
      <div
        className="flex gap-1.5 p-2.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <input
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitCmd();
          }}
          placeholder="Search or chat…"
          className="flex-1 px-3 py-2 bg-bg-3 border border-border-strong rounded-lg text-base text-fg outline-none focus:border-accent placeholder:text-fg-dim"
        />
      </div>

      <SectionLabel
        text="Tabs"
        action={{
          symbol: '+',
          title: 'New tab (Ctrl+T)',
          onClick: () => void window.sable.tabs.create('https://duckduckgo.com'),
        }}
      />
      <TabList />

      <div
        className="mt-auto border-t border-border px-4 py-3 text-fg-mute"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <SectionLabel text="Chat" inline />
        <p className="text-sm leading-relaxed">
          AI chat lives here. Hooks up in Phase&nbsp;2 with BYOK.
          <br />
          Drag a quote from a page to get a citation.
        </p>
      </div>
    </aside>
  );
}

function SectionLabel({
  text,
  action,
  inline,
}: {
  text: string;
  action?: { symbol: string; title: string; onClick: () => void };
  inline?: boolean;
}) {
  return (
    <div
      className={`text-2xs font-semibold tracking-wider uppercase text-fg-dim flex items-center justify-between ${
        inline ? 'pb-1.5' : 'px-4 pt-2 pb-1'
      }`}
    >
      <span>{text}</span>
      {action && (
        <button
          onClick={action.onClick}
          title={action.title}
          className="text-fg-mute hover:text-fg leading-none text-base"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {action.symbol}
        </button>
      )}
    </div>
  );
}
