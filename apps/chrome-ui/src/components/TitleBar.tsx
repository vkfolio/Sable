// Top-of-window draggable strip. The OS draws min/max/close in the right
// portion via titleBarOverlay (Win) or hiddenInset traffic lights (Mac);
// we reserve their footprint with the leading wordmark padding.

export function TitleBar() {
  return (
    <div
      className="flex items-center px-3 border-b border-border bg-bg z-10"
      style={{
        height: 'var(--titlebar-h)',
        // -webkit-app-region must be applied via inline style for OS drag.
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <span className="ml-20 text-xs font-semibold tracking-wider text-fg">
        Sable
      </span>
      <span
        className="ml-3 px-2.5 py-0.5 text-2xs font-medium text-fg-mute bg-bg-2 border border-border-strong rounded-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        ● coding
      </span>
    </div>
  );
}
