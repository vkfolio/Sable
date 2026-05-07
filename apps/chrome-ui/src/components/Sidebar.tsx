import { useShallow } from 'zustand/react/shallow';
import { Omnibar } from './Omnibar';
import { TabList } from './TabList';
import { useTabsStore } from '../state/tabs';
import { useLayoutStore } from '../state/layout';

export function Sidebar() {
  const totalTabs = useTabsStore((s) => s.tabsById.size);
  const panesInTree = useLayoutStore(useShallow((s) => s.leaves.length));
  const sleeping = Math.max(0, totalTabs - panesInTree);

  return (
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
