import { useEffect, useRef, useState } from 'react';
import iconUrl from '../assets/icon.svg?url';
import { selectActiveSpace, useSpacesStore } from '../state/spaces';
import type { SpaceSummary } from '../types';

// Top-of-window draggable strip. The OS draws min/max/close in the right
// portion via titleBarOverlay (Win) or hiddenInset traffic lights (Mac);
// we reserve their footprint with the leading wordmark padding. The space
// switcher sits next to the wordmark — the only interactive thing in the
// drag region.
export function TitleBar() {
  const spaces = useSpacesStore((s) => s.spaces);
  const active = useSpacesStore(selectActiveSpace);

  return (
    <div
      className="flex items-center px-3 border-b border-border bg-bg z-10"
      style={{
        height: 'var(--titlebar-h)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <div className="ml-20 flex items-center gap-2">
        <img
          src={iconUrl}
          alt=""
          width={20}
          height={20}
          className="rounded-[5px] shrink-0"
          draggable={false}
        />
        <span className="text-xs font-semibold tracking-wider text-fg">Sable</span>
      </div>
      <SpaceSwitcher spaces={spaces} active={active} />
    </div>
  );
}

function SpaceSwitcher({
  spaces,
  active,
}: {
  spaces: readonly SpaceSummary[];
  active: SpaceSummary | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click-away close. Both refs (the trigger pill and the dropdown panel)
  // count as "inside" — the dropdown panel is position:fixed so it's not a
  // descendant of the trigger ref.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideTrigger = ref.current?.contains(t);
      const insideDropdown = dropdownRef.current?.contains(t);
      if (!insideTrigger && !insideDropdown) {
        setOpen(false);
        setAdding(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!active) {
    return (
      <span
        className="ml-3 px-2.5 py-0.5 text-2xs font-medium text-fg-mute bg-bg-2 border border-border-strong rounded-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        loading…
      </span>
    );
  }

  const handleSwitch = (id: string) => {
    void window.sable.spaces.setActive(id);
    setOpen(false);
  };

  const submitNew = async () => {
    const name = newName.trim();
    setAdding(false);
    setNewName('');
    if (!name) return;
    const created = await window.sable.spaces.create(name);
    void window.sable.spaces.setActive(created.id);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      className="relative ml-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-0.5 text-2xs font-medium text-fg bg-bg-2 border border-border-strong rounded-full hover:border-fg-dim"
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: active.accent }}
        />
        <span>{active.name}</span>
        <span className="text-fg-dim ml-0.5">▾</span>
      </button>
      {open && (
        <div
          ref={dropdownRef}
          // Position-fixed within the sidebar's 280px so we never extend
          // into the pane area where tab WebContentsViews would occlude us.
          // Top is just below the titlebar (var(--titlebar-h) = 36px) +
          // a small gap; left aligns with the wordmark's leading padding.
          style={{
            position: 'fixed',
            top: 'calc(var(--titlebar-h) + 4px)',
            left: 12,
            width: 248,
            zIndex: 50,
          }}
          className="bg-bg-2 border border-border-strong rounded-lg shadow-2xl py-1"
        >
          {spaces.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSwitch(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-bg-3 ${
                s.id === active.id ? 'text-fg' : 'text-fg-mute'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ background: s.accent }}
              />
              <span className="flex-1 truncate">{s.name}</span>
              {s.id === active.id && (
                <span className="text-2xs text-emerald-400">●</span>
              )}
            </button>
          ))}
          <div className="border-t border-border my-1" />
          {adding ? (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-fg-dim" />
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
                placeholder="Space name…"
                className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-dim"
              />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-fg-mute hover:bg-bg-3 hover:text-fg"
            >
              <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-fg-dim" />
              <span className="flex-1">+ New space</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
