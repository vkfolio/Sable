import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Omnibar } from './Omnibar';
import { TabList } from './TabList';
import { Chat } from './Chat/Chat';
import { SettingsDialog } from './Settings/SettingsDialog';
import { useTabsStore } from '../state/tabs';
import { useLayoutStore } from '../state/layout';

export function Sidebar() {
  const totalTabs = useTabsStore((s) => s.tabsById.size);
  const panesInTree = useLayoutStore(useShallow((s) => s.leaves.length));
  const sleeping = Math.max(0, totalTabs - panesInTree);

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <aside
        className="flex-shrink-0 flex flex-col bg-bg-2 border-r border-border overflow-hidden"
        style={{ width: 'var(--sidebar-w)' }}
      >
        <Omnibar />

        <SectionLabel
          text={
            sleeping > 0 ? (
              <>
                Tabs <span className="ml-1 text-fg-mute font-normal normal-case tracking-normal">· {sleeping} sleeping</span>
              </>
            ) : (
              'Tabs'
            )
          }
          action={{
            symbol: '+',
            title: 'New tab (Ctrl+T)',
            onClick: () => void window.sable.tabs.create('https://duckduckgo.com'),
          }}
        />
        <TabList />

        <div className="border-t border-border flex flex-col min-h-0" style={{ flexBasis: '45%', flexShrink: 0 }}>
          <div
            className="px-4 pt-2 pb-1 flex items-center justify-between"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <span className="text-2xs font-semibold tracking-wider uppercase text-fg-dim">Chat</span>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className="text-fg-mute hover:text-fg leading-none text-sm"
            >
              ⚙
            </button>
          </div>
          <Chat onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </aside>
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

function SectionLabel({
  text,
  action,
  inline,
}: {
  text: React.ReactNode;
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
