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
import { useChromeStore } from '../state/chrome';

export function ChatSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeProvider = useSettingsStore((s) => s.activeProvider);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const chatWidth = useChromeStore((s) => s.chatWidth);

  return (
    <>
      <aside
        className="relative shrink-0 flex flex-col bg-surface-1 border-l border-line min-h-0"
        style={{ width: chatWidth }}
      >
        <ResizeHandle />
        <Header onOpenSettings={() => setSettingsOpen(true)} provider={activeProvider} model={selectedModel} />
        <Chat onOpenSettings={() => setSettingsOpen(true)} />
      </aside>
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

/**
 * 4 px wide drag handle pinned to the left edge of the sidebar. Drag right
 * to shrink the chat, left to widen. The chrome store clamps to a sane
 * range; main is told the new width on every move so tab WebContentsViews
 * resize live, not just on release.
 */
function ResizeHandle() {
  const setChatWidth = useChromeStore((s) => s.setChatWidth);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = useChromeStore.getState().chatWidth;
    const onMove = (ev: PointerEvent) => {
      // Sidebar lives on the right — moving the cursor LEFT widens it.
      const delta = startX - ev.clientX;
      setChatWidth(startWidth + delta);
      // Push the new width to main so the tab views' bounds reflow on every
      // frame (cheap — setBounds is essentially a number swap).
      void window.sable.chrome.setChatWidth(useChromeStore.getState().chatWidth);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  return (
    <div
      onPointerDown={onPointerDown}
      title="Drag to resize chat"
      className="absolute top-0 bottom-0 -left-[2px] w-[5px] cursor-ew-resize z-20 hover:bg-acc/30 transition-colors"
    />
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
