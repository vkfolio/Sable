import { useEffect, useRef } from 'react';

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  inflight,
  placeholderHint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  disabled: boolean;
  inflight: boolean;
  placeholderHint: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to 6 rows.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 24 * 6 + 16);
    el.style.height = `${next}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (inflight) onStop();
      else onSubmit();
    }
  };

  return (
    <div
      className="border-t border-border p-2.5"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderHint}
          disabled={disabled}
          rows={1}
          spellCheck={false}
          className="w-full resize-none bg-bg-3 border border-border-strong rounded-md px-3 py-2 pr-9 text-base text-fg outline-none focus:border-accent placeholder:text-fg-dim disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={inflight ? onStop : onSubmit}
          disabled={disabled || (!inflight && !value.trim())}
          title={inflight ? 'Stop' : 'Send (Enter)'}
          className="absolute right-1.5 bottom-1.5 w-7 h-7 inline-flex items-center justify-center rounded text-fg-mute enabled:hover:text-accent disabled:opacity-30 disabled:cursor-default"
        >
          {inflight ? <StopIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 21.5L21.5 12L2.5 2.5L2.5 9.5L17 12L2.5 14.5L2.5 21.5Z" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  );
}
