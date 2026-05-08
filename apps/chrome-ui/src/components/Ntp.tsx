// New tab page (NTP) — rendered over the pane area when the active tab's
// url is `sable://newtab`. The matching tab's WebContentsView is left
// unmounted by LayoutController, so this component owns that whole rect.
//
// Pulls patterns from "Hero · 02 — new tab" in v3 design system:
//   greeting · live timestamp · omnibox · suggestion chips · pinned shortcuts
//
// Hitting Enter in the omnibox always navigates the active tab — typed
// URLs go directly, plain text becomes a Google search. Suggestion chips
// remain the explicit AI-prompt path (they go to chat).

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useChatStore } from '../state/chat';
import { useSpacesStore, selectActiveSpace } from '../state/spaces';
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { resolveSuggestions, type Suggestion } from '../ntp-resolver';

const SUGGESTIONS = [
  'summarize selected tabs',
  'compare these sources',
  'draft follow-up questions',
  'turn this into a brief',
];

const PINS: { label: string; letter: string; color: string; ink: string; url: string }[] = [
  { label: 'arXiv',  letter: 'A', color: 'rgb(var(--p-coral))',    ink: '#4a1d0c', url: 'https://arxiv.org' },
  { label: 'GitHub', letter: 'G', color: 'rgb(var(--p-mint))',     ink: '#0e3920', url: 'https://github.com' },
  { label: 'Linear', letter: 'L', color: 'rgb(var(--p-sky))',      ink: '#142f4a', url: 'https://linear.app' },
  { label: 'Notion', letter: 'N', color: 'rgb(var(--p-butter))',   ink: '#4a3308', url: 'https://notion.so' },
  { label: 'Figma',  letter: 'F', color: 'rgb(var(--p-rose))',     ink: '#4d1530', url: 'https://figma.com' },
];

export function Ntp() {
  const activeSpace = useSpacesStore(selectActiveSpace);
  const activeTab = useTabsStore(selectActiveTab);
  const conversationId = activeSpace?.conversationId ?? 'default';
  const pushUserMessage = useChatStore((s) => s.pushUserMessage);
  const setActiveRun = useChatStore((s) => s.setActiveRun);

  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setNow(formatTime(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  /**
   * Static resolver results — instant, synchronous, rule-based. Always the
   * first chip(s) the user sees. The LLM-resolved list (below) merges in
   * after a brief debounce when the active model is configured.
   */
  const staticSuggestions = useMemo(() => resolveSuggestions(query), [query]);
  const [llmSuggestions, setLlmSuggestions] = useState<Suggestion[]>([]);
  const [resolving, setResolving] = useState(false);
  const llmTokenRef = useRef(0);

  // Hybrid resolver: kick off an LLM call ~350 ms after the user stops
  // typing. We only call when the static layer doesn't already have a
  // strong answer (a site shortcut hit, a URL, or any intent-rule match
  // beyond the bare Google fallback). On any failure we silently keep the
  // static list — `intent.resolve` returns [] on errors.
  useEffect(() => {
    const t = query.trim();
    if (!t || t.length < 4) {
      setLlmSuggestions([]);
      setResolving(false);
      return;
    }
    // If the static layer already produced multiple chips (intent matched),
    // skip the LLM — rules cover this case instantly.
    if (staticSuggestions.length > 1) {
      setLlmSuggestions([]);
      setResolving(false);
      return;
    }
    const token = ++llmTokenRef.current;
    setResolving(true);
    const id = setTimeout(async () => {
      const chips = await window.sable.intent.resolve(t).catch(() => []);
      if (token !== llmTokenRef.current) return; // stale
      setLlmSuggestions(chips.map((c) => ({ ...c })));
      setResolving(false);
    }, 350);
    return () => clearTimeout(id);
  }, [query, staticSuggestions.length]);

  // The full ordered list shown to the user. Static chips come first,
  // LLM chips append after, deduped by URL.
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const merged: Suggestion[] = [];
    for (const s of [...staticSuggestions, ...llmSuggestions]) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      merged.push(s);
    }
    return merged;
  }, [staticSuggestions, llmSuggestions]);

  const navigateTo = async (url: string) => {
    setQuery('');
    if (activeTab) await window.sable.tabs.navigate(activeTab.id, url);
  };

  /**
   * Enter on the omnibox commits to the top suggestion if one exists,
   * else does nothing (empty query).
   */
  const navigateActive = async () => {
    const top = suggestions[0];
    if (top) await navigateTo(top.url);
  };

  /**
   * Suggestion chips are explicit AI prompts — they bypass navigation and
   * push the user's message into the chat conversation. Used by the chips
   * row below the omnibox.
   */
  const askChat = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    pushUserMessage(t);
    try {
      const runId = await window.sable.chat.send(conversationId, { text: t });
      setActiveRun(runId);
    } catch (err) {
      // surfaced via RUN_ERROR; nothing to do here
      void err;
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-surface-1">
      {/* Soft pastel ambient blur */}
      <div
        className="absolute inset-0 pointer-events-none animate-[shimmer_16s_ease-in-out_infinite]"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 35%, rgb(var(--p-coral)), transparent 70%), radial-gradient(40% 40% at 30% 80%, rgb(var(--p-lavender)), transparent 70%), radial-gradient(40% 40% at 75% 75%, rgb(var(--p-butter)), transparent 70%)',
          opacity: 'var(--grain-opacity, 0.45)',
          filter: 'blur(20px)',
        }}
      />
      {/* Greeting + cmd + suggestions (centered) */}
      <div className="relative w-full max-w-[560px] px-6 text-center">
        <h2 className="text-[36px] font-medium tracking-[-0.025em] leading-[1.1] m-0 text-ink-0">
          {greeting()}
        </h2>
        <p className="mt-3 mb-0 text-sm leading-6 text-ink-2">
          Open a page, ask across selected tabs, or turn the current space into something usable.
        </p>
        <div className="font-mono text-[11px] text-ink-2 mt-3 tracking-[0.04em] uppercase">
          {now}
        </div>
        <div
          className="mt-8 h-[54px] flex items-center gap-3 px-[18px] rounded-[14px] bg-surface-2 border-[1.5px] border-acc text-base text-ink-0 text-left"
          style={{ boxShadow: '0 0 0 6px rgb(var(--acc-glow)), var(--shadow-2)' }}
        >
          <AiGlyph />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void navigateActive();
            }}
            placeholder="Search, enter URL, or describe what you want…"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-ink-0 placeholder:text-ink-3"
          />
          {resolving && (
            <span
              title="Asking the model for smarter destinations…"
              className="w-3.5 h-3.5 rounded-full border-2 border-acc/40 border-t-acc"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          )}
          <kbd className="font-mono text-[10px] text-ink-2 bg-surface-3 px-1.5 py-0.5 rounded-md border border-line">Enter</kbd>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {query.trim()
            ? suggestions.map((s, i) => (
                <SuggestionChip key={s.url} suggestion={s} primary={i === 0} onPick={navigateTo} />
              ))
            : SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void askChat(s)}
                  title="Send to Sable chat"
                  className="inline-flex items-center gap-1.5 px-3 py-[5px] text-xs text-ink-1 bg-surface-2 border border-line rounded-full hover:bg-surface-3"
                >
                  {s}
                </button>
              ))}
        </div>
      </div>
      {/* Pinned shortcuts — bottom row */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5">
        {PINS.map((p) => (
          <button
            key={p.label}
            onClick={() => navigateTo(p.url)}
            className="flex flex-col items-center gap-1.5 w-16 group"
          >
            <span
              className="w-11 h-11 rounded-[13px] inline-flex items-center justify-center font-semibold text-md shadow-1 group-hover:scale-105 transition-transform"
              style={{ background: p.color, color: p.ink }}
            >
              {p.letter}
            </span>
            <span className="text-[10px] text-ink-2 truncate max-w-full">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SuggestionChip({
  suggestion,
  primary,
  onPick,
}: {
  suggestion: Suggestion;
  primary: boolean;
  onPick: (url: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(suggestion.url)}
      title={suggestion.description}
      className={`inline-flex items-center gap-1.5 px-3 py-[5px] text-xs rounded-full border transition-colors ${
        primary
          ? 'bg-ink-0 text-ink-inv border-ink-0 shadow-[0_0_0_3px_rgb(var(--acc-glow))]'
          : 'text-ink-1 bg-surface-2 border-line hover:bg-surface-3 hover:text-ink-0'
      }`}
    >
      {suggestion.color && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: suggestion.color }}
        />
      )}
      <span className="font-medium">{suggestion.label}</span>
    </button>
  );
}

function AiGlyph() {
  return (
    <span
      className="w-6 h-6 rounded-lg shrink-0"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, rgb(var(--p-coral)), transparent 60%), radial-gradient(circle at 70% 70%, rgb(var(--p-lavender)), transparent 60%), rgb(var(--p-sky))',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.4)',
      }}
    />
  );
}

function greeting(): ReactNode {
  const h = new Date().getHours();
  const word = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <>
      {word}. <span className="text-acc-ink">Where should we start?</span>
    </>
  );
}

function formatTime(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hr = d.getHours().toString().padStart(2, '0');
  const mn = d.getMinutes().toString().padStart(2, '0');
  return `${days[d.getDay()]} / ${mons[d.getMonth()]} ${d.getDate()} / ${hr}:${mn}`;
}

