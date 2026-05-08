// SpacesPopover — switcher dropdown anchored under the SpaceTag in the
// titlebar. Portal'd to body so it can extend over the page-area without
// overflow-clip from any flexbox parent.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { useSpacesStore } from '../state/spaces';
import type { SpaceSummary } from '../types';

/** Pastel palette offered when creating / editing a space. The hex value is
 *  what's stored on `Space.accent`; the matching `data-space="{id}"` block
 *  in index.css drives the per-space shell tint. */
export const SPACE_ACCENTS: ReadonlyArray<{ id: string; label: string; hex: string }> = [
  { id: 'lavender', label: 'Lavender', hex: '#C9BEEE' },
  { id: 'rose', label: 'Rose', hex: '#F2BCD0' },
  { id: 'mint', label: 'Mint', hex: '#B3E5C9' },
  { id: 'sky', label: 'Sky', hex: '#B5D4F2' },
  { id: 'butter', label: 'Butter', hex: '#FFE69A' },
  { id: 'coral', label: 'Coral', hex: '#FFB89E' },
  { id: 'peach', label: 'Peach', hex: '#FFD49B' },
];

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
  const [newAccent, setNewAccent] = useState<string>(SPACE_ACCENTS[0]!.hex);

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
    const accent = newAccent;
    setAdding(false);
    setNewName('');
    setNewAccent(SPACE_ACCENTS[0]!.hex);
    if (!name) return;
    const created = await window.sable.spaces.create(name);
    // The IPC `create` doesn't take an accent yet — set it as a follow-up.
    // Done before setActive so the colour switches in lockstep with focus.
    void window.sable.spaces.setAccent(created.id, accent);
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
      {/* Active space accent picker — change the current space's color in
          one click. The whole shell retints immediately because the active
          space's `accent` is what App.tsx's `data-space` attribute is bound
          to. */}
      {activeSpaceId && (
        <div className="mt-1 pt-1 border-t border-line px-2 py-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-ink-3 uppercase tracking-[0.12em]">Color</span>
          <div className="flex-1 flex items-center justify-between gap-1">
            {SPACE_ACCENTS.map((a) => {
              const active = spaces.find((s) => s.id === activeSpaceId);
              const selected = active && a.hex.toLowerCase() === active.accent.toLowerCase();
              return (
                <button
                  key={a.id}
                  type="button"
                  title={a.label}
                  onClick={() => void window.sable.spaces.setAccent(activeSpaceId, a.hex)}
                  className={`w-5 h-5 rounded-md transition-shadow ${
                    selected
                      ? 'shadow-[0_0_0_2px_rgb(var(--ink-0))]'
                      : 'hover:scale-110'
                  }`}
                  style={{ background: a.hex }}
                />
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-1 pt-1 border-t border-line">
        {adding ? (
          <div className="px-2.5 py-2 flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-block w-[22px] h-[22px] rounded-[7px] shrink-0"
                style={{ background: newAccent }}
              />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitNew();
                  if (e.key === 'Escape') {
                    setNewName('');
                    setAdding(false);
                  }
                }}
                placeholder="Space name…"
                className="flex-1 bg-transparent text-base text-ink-0 outline-none placeholder:text-ink-3"
              />
            </div>
            <div className="flex items-center justify-between gap-1">
              {SPACE_ACCENTS.map((a) => {
                const selected = a.hex.toLowerCase() === newAccent.toLowerCase();
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setNewAccent(a.hex)}
                    title={a.label}
                    className={`w-6 h-6 rounded-[7px] inline-flex items-center justify-center transition-shadow ${
                      selected
                        ? 'shadow-[0_0_0_2px_rgb(var(--ink-0))] ring-0'
                        : 'hover:scale-110'
                    }`}
                    style={{ background: a.hex }}
                  />
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void submitNew()}
              disabled={!newName.trim()}
              className="self-end px-2.5 h-7 rounded-md bg-ink-0 text-ink-inv text-xs font-medium disabled:opacity-30"
            >
              Create
            </button>
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
