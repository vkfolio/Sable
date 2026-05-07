import { useRef, useState } from 'react';
import { selectActiveSpace, useSpacesStore } from '../state/spaces';
import { useChromeStore, type Theme } from '../state/chrome';
import { TabRow } from './TabRow';
import { SpacesPopover } from './SpacesPopover';
import { WindowControls } from './WindowControls';
import type { SpaceSummary } from '../types';

// Top row — frameless titlebar (38 px high). Layout per Sable App.html:
//
//   ┌── platform gutter ──┬─ space tag ─ tab strip ─┬─ tools ─┬─ window controls ──┐
//   │   78 px on macOS    │  draggable empty space  │ no-drag │  Win/Linux: custom │
//   │   (traffic-lights)  │                         │         │  macOS: hidden     │
//   └─────────────────────┴─────────────────────────┴─────────┴────────────────────┘
//
// macOS keeps OS-drawn traffic lights at the left via titleBarStyle:
// 'hiddenInset' — we just pad 78 px so they don't overlap content. On
// Windows/Linux we paint our own min/max/close at the right (no native
// overlay), so the chrome owns 100% of the titlebar's pixels and theming.
const PLATFORM = window.sable.env.platform;
const LEFT_GUTTER = PLATFORM === 'darwin' ? 78 : 0;

export function TitleBar() {
  // Double-click on the bare drag region toggles maximize (OS-standard).
  // Walk up from the click target until we either reach the titlebar root
  // (good — fire) or hit a no-drag element (bail — that widget owns the
  // dblclick).
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const root = e.currentTarget;
    let el: HTMLElement | null = e.target as HTMLElement;
    while (el && el !== root) {
      if (window.getComputedStyle(el).getPropertyValue('-webkit-app-region') === 'no-drag') {
        return;
      }
      el = el.parentElement;
    }
    void window.sable.window.maximizeToggle();
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="relative flex items-center gap-2 bg-bg border-b border-line-strong"
      style={{
        height: 'var(--titlebar-h)',
        paddingLeft: LEFT_GUTTER,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <SpaceTag />
      <TabRow />
      <Tools />
      <WindowControls />
    </div>
  );
}

function SpaceTag() {
  const activeSpace = useSpacesStore(selectActiveSpace);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  if (!activeSpace) {
    return (
      <span
        className="ml-3 inline-flex items-center px-2.5 h-6 text-xs text-ink-2 rounded-md"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        loading…
      </span>
    );
  }

  return (
    <>
      <button
        ref={ref}
        onClick={() => setOpen((v) => !v)}
        className="ml-3 shrink-0 inline-flex items-center gap-1.5 px-2.5 h-6 text-xs text-ink-1 rounded-md hover:bg-surface-3 hover:text-ink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span
          className="inline-block w-2.5 h-2.5 rounded-[3px]"
          style={{ background: spaceAccentSwatch(activeSpace) }}
        />
        <span className="font-medium">{activeSpace.name}</span>
        <Chevron />
      </button>
      <SpacesPopover open={open} anchor={ref} onClose={() => setOpen(false)} />
    </>
  );
}

function Tools() {
  const theme = useChromeStore((s) => s.theme);
  const setTheme = useChromeStore((s) => s.setTheme);

  // tab-tools layout from design: gap-1, 8px padding-left, hairline left
  // border that visually separates the tools from the tab row.
  return (
    <div
      className="pl-2 shrink-0 flex items-center gap-1 border-l border-line h-[28px]"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        title="New tab (Ctrl+T)"
        onClick={() => void window.sable.tabs.create('sable://newtab')}
        className="w-[26px] h-[26px] inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-surface-3 hover:text-ink-0"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <ThemeToggle theme={theme} onChange={setTheme} />
    </div>
  );
}

// Compact pill toggle for the titlebar — icon-only at 22 px to fit alongside
// the + button and tab strip in 38 px of vertical space. (The text-labelled
// variant from Design System v3 is reserved for the masthead, not the chrome.)
function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  return (
    <div className="inline-flex items-center p-[2px] rounded-full bg-surface-2 border border-line shadow-1">
      <ThemeBtn label="Light" active={theme === 'light'} onClick={() => onChange('light')}>
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
        </svg>
      </ThemeBtn>
      <ThemeBtn label="Dark" active={theme === 'dark'} onClick={() => onChange('dark')}>
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
        </svg>
      </ThemeBtn>
    </div>
  );
}

function ThemeBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-[22px] h-[22px] inline-flex items-center justify-center rounded-full transition-colors ${
        active ? 'bg-ink-0 text-ink-inv' : 'text-ink-2 hover:text-ink-0'
      }`}
    >
      {children}
    </button>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function spaceAccentSwatch(s: SpaceSummary): string {
  return s.accent || '#C9BEEE';
}
