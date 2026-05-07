import { useEffect, useState } from 'react';

// Custom Windows/Linux min/max/close buttons. Rendered into the right edge
// of the titlebar — replaces Win 11's native titleBarOverlay so the chrome
// owns 100% of the titlebar's pixels and theming.
//
// macOS hides this component because the OS still draws traffic-light
// buttons via titleBarStyle: 'hiddenInset'.
export function WindowControls() {
  const platform = window.sable.env.platform;
  if (platform === 'darwin') return null;

  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void window.sable.window.isMaximized().then((m) => {
      if (!cancelled) setMaximized(m);
    });
    const off = window.sable.on.maximizedChanged((m) => setMaximized(m));
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  return (
    <div
      className="flex items-stretch h-full"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <CtrlButton title="Minimize" onClick={() => void window.sable.window.minimize()}>
        <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2 6h8" />
        </svg>
      </CtrlButton>
      <CtrlButton
        title={maximized ? 'Restore' : 'Maximize'}
        onClick={() => void window.sable.window.maximizeToggle()}
      >
        {maximized ? (
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="3" y="1.5" width="7.5" height="7.5" />
            <rect x="1.5" y="3" width="7.5" height="7.5" fill="currentColor" fillOpacity="0" />
            <path d="M1.5 3h7.5v7.5h-7.5z" fill="var(--bg-fill,transparent)" />
            <path d="M1.5 3h7.5v7.5h-7.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2" y="2" width="8" height="8" />
          </svg>
        )}
      </CtrlButton>
      <CtrlButton title="Close" close onClick={() => void window.sable.window.close()}>
        <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
        </svg>
      </CtrlButton>
    </div>
  );
}

function CtrlButton({
  title,
  onClick,
  close,
  children,
}: {
  title: string;
  onClick: () => void;
  close?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-[46px] h-full inline-flex items-center justify-center text-ink-2 transition-colors ${
        close
          ? 'hover:bg-[#E81123] hover:text-white'
          : 'hover:bg-surface-3 hover:text-ink-0'
      }`}
    >
      {children}
    </button>
  );
}
