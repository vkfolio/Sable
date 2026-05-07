import { useEffect, useRef, useState } from 'react';
import type { Citation } from '../../types';

const SABLE_QUOTE_MIME = 'application/x-sable-quote+json; v=1';

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  inflight,
  placeholderHint,
  citations,
  onAddCitation,
  onRemoveCitation,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  disabled: boolean;
  inflight: boolean;
  placeholderHint: string;
  citations: Citation[];
  onAddCitation: (c: Citation) => void;
  onRemoveCitation: (id: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [dragOver, setDragOver] = useState(false);

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

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasSableQuote(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the composer container, not bubbling from a child.
    if (e.currentTarget === e.target) setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!hasSableQuote(e.dataTransfer)) return;
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData(SABLE_QUOTE_MIME);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as {
        v: number;
        kind: string;
        text: string;
        url: string;
        title: string;
        anchor: { selector: string | null };
        pickedUpAt: number;
      };
      if (payload.v !== 1 || payload.kind !== 'quote') return;
      onAddCitation({
        id: `cite-${payload.pickedUpAt}-${Math.random().toString(36).slice(2, 8)}`,
        text: payload.text,
        url: payload.url,
        title: payload.title,
        anchor: payload.anchor ?? { selector: null },
        pickedUpAt: payload.pickedUpAt,
      });
    } catch {
      // Bad payload; silently drop.
    }
  };

  return (
    <div
      className={`border-t border-border p-2.5 transition-colors ${
        dragOver ? 'bg-accent/5' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {citations.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {citations.map((c) => (
            <CitationChip key={c.id} citation={c} onRemove={() => onRemoveCitation(c.id)} />
          ))}
        </div>
      )}
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            dragOver ? 'Drop to attach as a citation' : placeholderHint
          }
          disabled={disabled}
          rows={1}
          spellCheck={false}
          className={`w-full resize-none bg-bg-3 border rounded-md px-3 py-2 pr-9 text-base text-fg outline-none focus:border-accent placeholder:text-fg-dim disabled:opacity-50 disabled:cursor-not-allowed ${
            dragOver ? 'border-accent' : 'border-border-strong'
          }`}
        />
        <button
          type="button"
          onClick={inflight ? onStop : onSubmit}
          disabled={disabled || (!inflight && !value.trim() && citations.length === 0)}
          title={inflight ? 'Stop' : 'Send (Enter)'}
          className="absolute right-1.5 bottom-1.5 w-7 h-7 inline-flex items-center justify-center rounded text-fg-mute enabled:hover:text-accent disabled:opacity-30 disabled:cursor-default"
        >
          {inflight ? <StopIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
}

function CitationChip({
  citation,
  onRemove,
}: {
  citation: Citation;
  onRemove: () => void;
}) {
  const host = safeHost(citation.url);
  const truncatedText = citation.text.length > 140 ? citation.text.slice(0, 140) + '…' : citation.text;

  return (
    <div className="group flex gap-2 px-2.5 py-2 bg-bg-4 border border-border-strong rounded-md text-sm">
      <div className="w-0.5 self-stretch bg-accent/60 rounded shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-fg-mute italic line-clamp-2 leading-snug">"{truncatedText}"</div>
        <div className="mt-1 flex items-center gap-1.5 text-2xs text-fg-dim">
          <span className="truncate">{citation.title || host}</span>
          <span>·</span>
          <span className="truncate font-mono">{host}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        title="Remove citation"
        className="self-start text-fg-dim hover:text-fg leading-none text-base"
      >
        ×
      </button>
    </div>
  );
}

function hasSableQuote(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  for (let i = 0; i < dt.types.length; i++) {
    const t = dt.types[i];
    if (t && t.toLowerCase().startsWith('application/x-sable-quote+json')) return true;
  }
  return false;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
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
