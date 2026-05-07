// SkillsPicker — small dropdown anchored above the Composer's Skills button.
// Filterable by typing; arrow keys navigate; Enter / click selects.

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_SKILLS, type Skill } from '../../state/skills';

export function SkillsPicker({
  open,
  onPick,
  onClose,
}: {
  open: boolean;
  onPick: (skill: Skill) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? DEFAULT_SKILLS.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    : DEFAULT_SKILLS;

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

  return (
    <div
      ref={ref}
      className="absolute right-0 bottom-full mb-1.5 w-[300px] bg-bg-2 border border-border-strong rounded-lg shadow-2xl py-1 z-30"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-2.5 py-1.5 border-b border-border">
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
        <div className="px-3 py-2 text-2xs text-fg-dim">No matching skills</div>
      ) : (
        <ul className="max-h-[280px] overflow-auto py-1">
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
}
