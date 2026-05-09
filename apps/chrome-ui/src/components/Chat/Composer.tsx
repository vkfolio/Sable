import { useEffect, useRef } from 'react';
import { PaperAirplaneIcon, StopIcon as HiStopIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Citation, ImageCitation, TextCitation } from '../../types';

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  inflight,
  placeholderHint,
  citations,
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
  onRemoveCitation: (id: string) => void;
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
      className="px-3 py-2"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {citations.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {citations.map((c) =>
            c.kind === 'text' ? (
              <TextCitationChip key={c.id} citation={c} onRemove={() => onRemoveCitation(c.id)} />
            ) : (
              <ImageCitationChip key={c.id} citation={c} onRemove={() => onRemoveCitation(c.id)} />
            ),
          )}
        </div>
      )}
      {/* Composer card — drop target lives at the sidebar level now. */}
      <div className="rounded-xl bg-surface-2 px-2.5 pt-2.5 pb-2 flex flex-col gap-1.5 border-[1.5px] border-acc shadow-[0_0_0_4px_rgb(var(--acc-glow))]">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderHint}
          disabled={disabled}
          rows={2}
          spellCheck={false}
          className="w-full resize-none border-0 bg-transparent text-base text-ink-0 outline-none placeholder:text-ink-3 leading-snug min-h-[40px] disabled:opacity-50"
        />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={inflight ? onStop : onSubmit}
            disabled={disabled || (!inflight && !value.trim() && citations.length === 0)}
            title={inflight ? 'Stop' : 'Send (Enter)'}
            className="ml-auto w-7 h-[26px] inline-flex items-center justify-center rounded-[7px] bg-ink-0 text-ink-inv hover:brightness-110 disabled:opacity-30 disabled:cursor-default"
          >
            {inflight ? <StopIcon /> : <SendIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextCitationChip({
  citation,
  onRemove,
}: {
  citation: TextCitation;
  onRemove: () => void;
}) {
  const host = safeHost(citation.url);
  const truncatedText =
    citation.text.length > 140 ? citation.text.slice(0, 140) + '…' : citation.text;

  return (
    <div className="group flex gap-2 px-2.5 py-2 bg-surface-2 border border-line rounded-lg text-sm shadow-1">
      <span className="font-mono text-[10.5px] font-semibold text-acc-ink shrink-0">@</span>
      <div className="flex-1 min-w-0">
        <div className="text-ink-1 italic line-clamp-2 leading-snug">"{truncatedText}"</div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-3">
          <span className="truncate">{citation.title || host}</span>
          <span>·</span>
          <span className="truncate font-mono">{host}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        title="Remove citation"
        className="self-start w-3.5 h-3.5 inline-flex items-center justify-center rounded-full text-ink-3 hover:bg-surface-3 hover:text-ink-0"
      >
        <XMarkIcon className="w-2 h-2" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function ImageCitationChip({
  citation,
  onRemove,
}: {
  citation: ImageCitation;
  onRemove: () => void;
}) {
  const host = safeHost(citation.pageUrl);
  return (
    <div className="group flex gap-2 px-2.5 py-2 bg-surface-2 border border-line rounded-lg text-sm shadow-1">
      <img
        src={`data:${citation.mimeType};base64,${citation.base64}`}
        alt={citation.alt}
        className="w-12 h-12 object-cover rounded border border-line shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-ink-0 leading-snug truncate font-medium">{citation.alt || 'Image'}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-3">
          <span className="truncate">{citation.pageTitle || host}</span>
          <span>·</span>
          <span className="truncate font-mono">{host}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        title="Remove image"
        className="self-start w-3.5 h-3.5 inline-flex items-center justify-center rounded-full text-ink-3 hover:bg-surface-3 hover:text-ink-0"
      >
        <XMarkIcon className="w-2 h-2" strokeWidth={2.5} />
      </button>
    </div>
  );
}


function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function SendIcon() {
  return <PaperAirplaneIcon className="w-[14px] h-[14px]" />;
}

function StopIcon() {
  return <HiStopIcon className="w-3 h-3" />;
}
