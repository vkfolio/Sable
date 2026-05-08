// ChatSidebar — right-side panel (340px). Contains the chat header,
// sub-tabs (Chat / History / Skills — only Chat is wired in V0), and
// the existing Chat composer + message list.
//
// Toggleable via UrlBar's chat button or Ctrl+.. The chrome reports
// visibility to main so tab WebContentsViews shrink/expand to match.

import { useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Chat } from './Chat/Chat';
import { SettingsDialog } from './Settings/SettingsDialog';
import { useSettingsStore } from '../state/settings';

type SubTab = 'chat' | 'history' | 'skills';

export function ChatSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('chat');
  const activeProvider = useSettingsStore((s) => s.activeProvider);
  const selectedModel = useSettingsStore((s) => s.selectedModel);

  return (
    <>
      <aside
        className="shrink-0 flex flex-col bg-surface-1 border-l border-line min-h-0"
        style={{ width: 'var(--chat-w)' }}
      >
        <Header onOpenSettings={() => setSettingsOpen(true)} provider={activeProvider} model={selectedModel} />
        <SubTabs active={subTab} onChange={setSubTab} />
        {subTab === 'chat' ? (
          <Chat onOpenSettings={() => setSettingsOpen(true)} />
        ) : (
          <div className="flex-1 px-4 py-6 text-base text-ink-2">
            {subTab === 'history'
              ? 'History view — coming soon. (Conversations persist; switching spaces shows that space’s history.)'
              : 'Skills are managed inline in the composer (✨ button) and in Settings.'}
          </div>
        )}
      </aside>
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

function Header({
  onOpenSettings,
  provider,
  model,
}: {
  onOpenSettings: () => void;
  provider: string;
  model: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-line">
      <AiGlyph />
      <h4 className="flex-1 text-base font-medium text-ink-0 m-0">Chat</h4>
      <span className="font-mono text-[10px] text-ink-2 truncate max-w-[140px]" title={`${provider} · ${model}`}>
        {model}
      </span>
      <button
        onClick={onOpenSettings}
        title="Settings"
        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 hover:text-ink-0"
      >
        <Cog6ToothIcon className="w-[14px] h-[14px]" />
      </button>
    </div>
  );
}

function SubTabs({ active, onChange }: { active: SubTab; onChange: (t: SubTab) => void }) {
  const items: { id: SubTab; label: string }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'history', label: 'History' },
    { id: 'skills', label: 'Skills' },
  ];
  return (
    <div className="flex gap-0 px-2 pt-2 border-b border-line">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={`flex-1 py-2 text-sm font-medium rounded-t-md ${
            active === it.id
              ? 'text-ink-0 shadow-[inset_0_-2px_0_rgb(var(--acc-ink))]'
              : 'text-ink-2 hover:text-ink-0'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function AiGlyph() {
  // Soft gradient orb; matches the design's pastel-blend aesthetic.
  return (
    <span
      className="inline-block w-[22px] h-[22px] rounded-[7px] shadow-1 shrink-0"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, rgb(var(--p-coral)), transparent 60%), radial-gradient(circle at 70% 70%, rgb(var(--p-lavender)), transparent 60%), rgb(var(--p-sky))',
      }}
    />
  );
}
