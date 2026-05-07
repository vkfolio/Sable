// SkillsPicker — small dropdown anchored near the Composer's Skills button.
// Filterable by typing; arrow keys navigate; Enter / click selects.
//
// Rendered via a portal to document.body so it escapes the sidebar's
// overflow-hidden clipping. Position-fixed at coordinates computed from
// the anchor button's bounding rect.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { useSkillsStore, type Skill } from '../../state/skills';

const PICKER_WIDTH = 300;
const PICKER_MAX_HEIGHT = 360;

export function SkillsPicker({
  open,
  anchorEl,
  onPick,
  onClose,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  onPick: (skill: Skill) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const allSkills = useSkillsStore(useShallow((s) => s.skills));

  // Compute position from the anchor's rect when opening.
  useLayoutEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    // Anchor: bottom-right of picker aligns with top-right of button.
    let left = rect.right - PICKER_WIDTH;
    const top = rect.top - PICKER_MAX_HEIGHT - 8;
    // Clamp to viewport.
    left = Math.max(8, Math.min(left, window.innerWidth - PICKER_WIDTH - 8));
    setPos({ left, top: Math.max(8, top) });
  }, [open, anchorEl]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    // Slight delay so the click that opened us doesn't immediately blur.
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchorEl?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, anchorEl, onClose]);

  if (!open || !pos) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allSkills.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    : allSkills;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const skill = filtered[activeIdx];
      if (skill) onPick(skill);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const node = (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        width: PICKER_WIDTH,
        maxHeight: PICKER_MAX_HEIGHT,
        zIndex: 60,
      }}
      className="bg-bg-2 border border-border-strong rounded-lg shadow-2xl py-1 flex flex-col"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1.5 border-b border-border shrink-0">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search skills…"
          className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-dim"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-2xs text-fg-dim">
          {allSkills.length === 0 ? 'Loading skills…' : 'No matching skills'}
        </div>
      ) : (
        <ul className="overflow-auto py-1 min-h-0">
          {filtered.map((skill, idx) => (
            <li key={skill.id}>
              <button
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => onPick(skill)}
                className={`w-full text-left px-3 py-1.5 ${
                  idx === activeIdx ? 'bg-accent/15' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-fg font-medium">{skill.label}</span>
                  <span className="text-2xs text-fg-dim font-mono">@{skill.id}</span>
                </div>
                <div className="text-2xs text-fg-mute leading-snug truncate">
                  {skill.description}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return createPortal(node, document.body);
}
