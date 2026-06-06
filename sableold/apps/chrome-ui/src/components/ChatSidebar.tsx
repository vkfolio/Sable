// ChatSidebar — right-side panel (340px). Contains the chat header,
// just the chat composer + message list, and
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
import { useCitationsStore } from '../state/citations';
import { hasSableMime, parseDrop, resolveImageCitation } from '../citation-drop';

export function ChatSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeProvider = useSettingsStore((s) => s.activeProvider);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const chatWidth = useChromeStore((s) => s.chatWidth);
  const addCitation = useCitationsStore((s) => s.add);
  const [dragOver, setDragOver] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasSableMime(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear when actually leaving the sidebar root, not when crossing
    // child boundaries (which fire dragleave→dragenter on the same frame).
    if (e.currentTarget === e.target) setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!hasSableMime(e.dataTransfer)) return;
    e.preventDefault();
    setDragOver(false);
    setResolveError(null);
    const parsed = parseDrop(e.dataTransfer);
    if (!parsed) return;
    if (parsed.kind === 'text') {
      addCitation(parsed.citation);
      return;
    }
    try {
      const c = await resolveImageCitation(parsed.payload);
      addCitation(c);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResolveError(`Couldn't attach image: ${msg}`);
      setTimeout(() => setResolveError(null), 4000);
    }
  };

  return (
    <>
      <aside
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative shrink-0 flex flex-col bg-surface-1 border-l border-line min-h-0 ${
          dragOver ? 'outline outline-2 outline-dashed outline-acc -outline-offset-4' : ''
        }`}
        style={{ width: chatWidth }}
      >
        <ResizeHandle />
        <Header onOpenSettings={() => setSettingsOpen(true)} provider={activeProvider} model={selectedModel} />
        <Chat onOpenSettings={() => setSettingsOpen(true)} />
        {dragOver && (
          <div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-2xl bg-acc/15 backdrop-blur-sm">
            <span className="px-4 py-2 rounded-full bg-ink-0 text-ink-inv text-sm font-medium shadow-3">
              Drop to add as chat context
            </span>
          </div>
        )}
        {resolveError && (
          <div className="absolute bottom-3 left-3 right-3 z-30 px-3 py-2 bg-bad/15 border border-bad/40 rounded-md text-xs text-bad shadow-1">
            {resolveError}
          </div>
        )}
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
