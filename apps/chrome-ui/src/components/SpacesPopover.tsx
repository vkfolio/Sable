// SpacesPopover — switcher dropdown anchored under the SpaceTag in the
// titlebar. Portal'd to body so it can extend over the page-area without
// overflow-clip from any flexbox parent.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { useSpacesStore } from '../state/spaces';
import type { SpaceSummary } from '../types';

export function SpacesPopover({
  open,
  anchor,
  onClose,
}: {
  open: boolean;
  anchor: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const spaces = useSpacesStore(useShallow((s) => s.spaces));
  const activeSpaceId = useSpacesStore((s) => s.activeSpaceId);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const rect = anchor.current.getBoundingClientRect();
    setPos({ left: rect.left, top: rect.bottom + 6 });
  }, [open, anchor]);

  // Tab WebContentsViews always layer above the chrome's React DOM, so a
  // portal'd popover that overlaps the pane area gets occluded as soon as a
  // real site is loaded. setOverlay(true) unmounts every tab view for the
  // popover's lifetime; setOverlay(false) on close re-mounts them. Mirrors
  // SettingsDialog's pattern.
  // (Any future portal'd dropdown that overlaps pane area should follow this.)
  useEffect(() => {
    if (!open) return;
    void window.sable.chrome.setOverlay(true);
    return () => {
      void window.sable.chrome.setOverlay(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchor.current?.contains(t)) return;
      onClose();
      setAdding(false);
      setNewName('');
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, anchor, onClose]);

  if (!open || !pos) return null;

  const handleSwitch = (id: string) => {
    void window.sable.spaces.setActive(id);
    onClose();
  };

  const submitNew = async () => {
    const name = newName.trim();
    setAdding(false);
    setNewName('');
    if (!name) return;
    const created = await window.sable.spaces.create(name);
    void window.sable.spaces.setActive(created.id);
    onClose();
  };

  const node = (
    <div
      ref={ref}
      style={{ position: 'fixed', left: pos.left, top: pos.top, width: 280, zIndex: 60 }}
      className="bg-surface-2 border border-line rounded-[13px] shadow-3 p-1.5"
    >
      <div className="flex justify-between px-2 pt-1.5 pb-1 text-[10px] font-mono text-ink-3 uppercase tracking-[0.12em]">
        <span>Spaces</span>
        <span>⌃␣</span>
      </div>
      <div className="space-y-[1px]">
        {spaces.map((s) => (
          <SpaceRow
            key={s.id}
            space={s}
            active={s.id === activeSpaceId}
            onClick={() => handleSwitch(s.id)}
          />
        ))}
      </div>
      <div className="mt-1 pt-1 border-t border-line">
        {adding ? (
          <div className="flex items-center gap-2.5 px-2.5 h-[38px]">
            <span className="inline-block w-[22px] h-[22px] rounded-[7px] bg-surface-3 flex items-center justify-center text-ink-3 text-xs">
              +
            </span>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => void submitNew()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setNewName('');
                  setAdding(false);
                }
              }}
              placeholder="Name…"
              className="flex-1 bg-transparent text-base text-ink-0 outline-none placeholder:text-ink-3"
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-2.5 px-2.5 h-[38px] rounded-[9px] hover:bg-surface-3 text-base text-ink-1"
          >
            <span className="inline-block w-[22px] h-[22px] rounded-[7px] bg-surface-3 flex items-center justify-center text-ink-3 text-xs">
              +
            </span>
            <span>New space</span>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function SpaceRow({
  space,
  active,
  onClick,
}: {
  space: SpaceSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 h-[38px] rounded-[9px] text-left ${
        active ? 'bg-acc-soft' : 'hover:bg-surface-3'
      }`}
    >
      <span
        className="w-[22px] h-[22px] rounded-[7px] inline-flex items-center justify-center text-[11px] font-semibold"
        style={{ background: space.accent, color: contrastInk(space.accent) }}
      >
        {space.name[0]?.toUpperCase()}
      </span>
      <span className="flex-1 text-base text-ink-0 truncate">{space.name}</span>
      {active && (
        <span className="text-[10px] font-mono text-ink-2">active</span>
      )}
    </button>
  );
}

function contrastInk(hex: string): string {
  // Best-effort dark text on a light pastel; if the hex is missing/odd, default.
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#15120D';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 150 ? '#15120D' : '#FBFAF7';
}
