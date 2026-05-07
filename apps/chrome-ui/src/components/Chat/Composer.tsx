import { forwardRef, useEffect, useRef, useState } from 'react';
import type { Citation, ImageCitation, TextCitation } from '../../types';
import type { Skill } from '../../state/skills';
import { SkillsPicker } from './SkillsPicker';

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
  const skillsButtonRef = useRef<HTMLButtonElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);

  const handlePickSkill = (skill: Skill) => {
    setSkillsOpen(false);
    // Replace empty composer with the template; otherwise append (cursor
    // ends at the position the user can type into).
    onChange(value.trim() ? `${value}\n\n${skill.template}` : skill.template);
    // Re-focus the textarea after a tick so the picker click doesn't
    // immediately steal focus back.
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }, 0);
  };

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
          <FootBtn
            ref={skillsButtonRef}
            label="Skill"
            onClick={() => setSkillsOpen((v) => !v)}
            active={skillsOpen}
            disabled={disabled}
          >
            <SparkIcon />
          </FootBtn>
          <SkillsPicker
            open={skillsOpen}
            anchorEl={skillsButtonRef.current}
            onPick={handlePickSkill}
            onClose={() => setSkillsOpen(false)}
          />
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

const FootBtn = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }
>(function FootBtn({ label, onClick, active, disabled, children }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-[26px] px-2 rounded-[7px] inline-flex items-center gap-1.5 text-xs font-medium ${
        active ? 'bg-surface-3 text-ink-0' : 'text-ink-2 hover:bg-surface-3 hover:text-ink-0'
      } disabled:opacity-40 disabled:cursor-default`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
});

function SparkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" />
      <path d="M18 17l.6 1.4L20 19l-1.4.6L18 21l-.6-1.4L16 19l1.4-.6z" />
    </svg>
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
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 5l14 14M5 19L19 5" />
        </svg>
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
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 5l14 14M5 19L19 5" />
        </svg>
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

function SkillsIcon() {
  // Sparkle. Three asymmetric stars suggesting prompt composition.
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L13.6 8.4L20 10L13.6 11.6L12 18L10.4 11.6L4 10L10.4 8.4L12 2Z"
        fill="currentColor"
      />
      <path
        d="M19 16L19.6 18.4L22 19L19.6 19.6L19 22L18.4 19.6L16 19L18.4 18.4L19 16Z"
        fill="currentColor"
      />
    </svg>
  );
}
