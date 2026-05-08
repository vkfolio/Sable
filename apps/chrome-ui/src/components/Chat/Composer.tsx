import { useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon, StopIcon as HiStopIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Citation, ImageCitation, TextCitation } from '../../types';

const SABLE_QUOTE_MIME_PREFIX = 'application/x-sable-quote+json';
const SABLE_IMAGE_MIME_PREFIX = 'application/x-sable-image+json';

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
  const [resolveError, setResolveError] = useState<string | null>(null);
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
    if (!hasSableMime(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!hasSableMime(e.dataTransfer)) return;
    e.preventDefault();
    setDragOver(false);
    setResolveError(null);

    const dt = e.dataTransfer;
    const quoteRaw = findMime(dt, SABLE_QUOTE_MIME_PREFIX);
    const imageRaw = findMime(dt, SABLE_IMAGE_MIME_PREFIX);

    if (quoteRaw) {
      try {
        const payload = JSON.parse(quoteRaw) as {
          v: number;
          kind: string;
          text: string;
          url: string;
          title: string;
          anchor: { selector: string | null };
          pickedUpAt: number;
        };
        if (payload.v !== 1 || payload.kind !== 'quote') return;
        const c: TextCitation = {
          kind: 'text',
          id: `cite-${payload.pickedUpAt}-${Math.random().toString(36).slice(2, 8)}`,
          text: payload.text,
          url: payload.url,
          title: payload.title,
          anchor: payload.anchor ?? { selector: null },
          pickedUpAt: payload.pickedUpAt,
        };
        onAddCitation(c);
      } catch {
        // bad payload
      }
      return;
    }

    if (imageRaw) {
      try {
        const payload = JSON.parse(imageRaw) as {
          v: number;
          kind: string;
          srcUrl: string;
          alt: string;
          pageUrl: string;
          pageTitle: string;
          pickedUpAt: number;
        };
        if (payload.v !== 1 || payload.kind !== 'image') return;
        // Resolve image bytes via main (bypasses renderer CORS, gives us a
        // base64 we can ship to the LLM as inline multimodal content).
        const resolved = await window.sable.chat.resolveImage(payload.srcUrl);
        const c: ImageCitation = {
          kind: 'image',
          id: `cite-${payload.pickedUpAt}-${Math.random().toString(36).slice(2, 8)}`,
          mimeType: resolved.mimeType,
          base64: resolved.base64,
          sourceUrl: payload.srcUrl,
          pageUrl: payload.pageUrl,
          pageTitle: payload.pageTitle,
          alt: payload.alt,
          pickedUpAt: payload.pickedUpAt,
        };
        onAddCitation(c);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setResolveError(`Couldn't attach image: ${msg}`);
        setTimeout(() => setResolveError(null), 4000);
      }
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
      {resolveError && (
        <div className="mb-2 px-2.5 py-1.5 bg-bad/10 border border-bad/30 rounded-md text-[11px] text-bad">
          {resolveError}
        </div>
      )}
      {/* Composer card: thick accent border + glow, flush textarea, dark send. */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl bg-surface-2 px-2.5 pt-2.5 pb-2 flex flex-col gap-1.5 transition-shadow ${
          dragOver
            ? 'border-2 border-acc shadow-[0_0_0_6px_rgb(var(--acc-glow))]'
            : 'border-[1.5px] border-acc shadow-[0_0_0_4px_rgb(var(--acc-glow))]'
        }`}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dragOver ? 'Drop to attach' : placeholderHint}
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

function hasSableMime(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  for (let i = 0; i < dt.types.length; i++) {
    const t = dt.types[i]?.toLowerCase();
    if (!t) continue;
    if (t.startsWith(SABLE_QUOTE_MIME_PREFIX) || t.startsWith(SABLE_IMAGE_MIME_PREFIX)) {
      return true;
    }
  }
  return false;
}

function findMime(dt: DataTransfer | null, prefix: string): string | null {
  if (!dt) return null;
  for (let i = 0; i < dt.types.length; i++) {
    const t = dt.types[i];
    if (t && t.toLowerCase().startsWith(prefix)) {
      const v = dt.getData(t);
      if (v) return v;
    }
  }
  return null;
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
