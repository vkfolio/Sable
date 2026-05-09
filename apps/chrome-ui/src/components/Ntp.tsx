// New tab page (NTP) — rendered over the pane area when the active tab's
// url is `sable://newtab`. The matching tab's WebContentsView is left
// unmounted by LayoutController, so this component owns that whole rect.
//
// Layout (top → bottom):
//   greeting · live timestamp · omnibox · suggestion chips · pinned bookmarks
//
// Empty omnibox: the suggestion area shows the user's RECENTLY VISITED
// sites (history). Once they start typing, history matches prepend above
// the static rule + LLM resolver chips.
//
// Pinned bookmarks at the bottom are user-customizable (add / edit / remove).

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { useChromeStore, type Bookmark } from '../state/chrome';
import { useSettingsStore } from '../state/settings';
import { resolveSuggestions, type Suggestion } from '../ntp-resolver';
import type { HistoryEntry } from '../types';

const BOOKMARK_COLORS: { hex: string; label: string }[] = [
  { hex: '#FFB89E', label: 'Coral' },
  { hex: '#FFD49B', label: 'Peach' },
  { hex: '#FFE69A', label: 'Butter' },
  { hex: '#B3E5C9', label: 'Mint' },
  { hex: '#B5D4F2', label: 'Sky' },
  { hex: '#C9BEEE', label: 'Lavender' },
  { hex: '#F2BCD0', label: 'Rose' },
];

export function Ntp() {
  const activeTab = useTabsStore(selectActiveTab);
  const userName = useChromeStore((s) => s.userName);
  const bookmarks = useChromeStore(useShallow((s) => s.bookmarks));
  const searchEngine = useSettingsStore((s) => s.searchEngine);
  const searchEngineCustomUrl = useSettingsStore((s) => s.searchEngineCustomUrl);

  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => formatTime(new Date()));
  const [recent, setRecent] = useState<readonly HistoryEntry[]>([]);
  const [historyMatches, setHistoryMatches] = useState<readonly HistoryEntry[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(formatTime(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  // Pull recent history once on mount. (We re-pull whenever the tab's URL
  // changes from sable://newtab — the user might have just visited a site
  // and come back. Cheap; fires on remount.)
  useEffect(() => {
    let cancelled = false;
    void window.sable.history.recent(5).then((entries) => {
      if (!cancelled) setRecent(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced history autocomplete while typing.
  useEffect(() => {
    const t = query.trim();
    if (!t) {
      setHistoryMatches([]);
      return;
    }
    const id = setTimeout(async () => {
      const matches = await window.sable.history.search(t).catch(() => []);
      setHistoryMatches(matches);
    }, 120);
    return () => clearTimeout(id);
  }, [query]);

  // Static (rule-based) resolver — instant. LLM-resolved chips append later
  // when the static layer didn't already match a clear intent.
  const staticSuggestions = useMemo(
    () => resolveSuggestions(query, searchEngine, searchEngineCustomUrl),
    [query, searchEngine, searchEngineCustomUrl],
  );
  const [llmSuggestions, setLlmSuggestions] = useState<Suggestion[]>([]);
  const [resolving, setResolving] = useState(false);
  const llmTokenRef = useRef(0);

  useEffect(() => {
    const t = query.trim();
    if (!t || t.length < 4) {
      setLlmSuggestions([]);
      setResolving(false);
      return;
    }
    if (staticSuggestions.length > 1) {
      setLlmSuggestions([]);
      setResolving(false);
      return;
    }
    const token = ++llmTokenRef.current;
    setResolving(true);
    const id = setTimeout(async () => {
      const chips = await window.sable.intent.resolve(t).catch(() => []);
      if (token !== llmTokenRef.current) return;
      setLlmSuggestions(chips.map((c) => ({ ...c })));
      setResolving(false);
    }, 350);
    return () => clearTimeout(id);
  }, [query, staticSuggestions.length]);

  // Combined ranked list for the chip strip when typing:
  //   1. Top 3 history matches (deduped against static)
  //   2. Static-rule resolver chips
  //   3. LLM chips
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const merged: Suggestion[] = [];
    for (const h of historyMatches.slice(0, 3)) {
      if (seen.has(h.url)) continue;
      seen.add(h.url);
      merged.push({
        label: h.title || hostname(h.url) || 'Visit',
        description: h.url,
        url: h.url,
        color: '#C9BEEE',
      });
    }
    for (const s of [...staticSuggestions, ...llmSuggestions]) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      merged.push(s);
    }
    return merged;
  }, [historyMatches, staticSuggestions, llmSuggestions]);

  const navigateTo = async (url: string) => {
    setQuery('');
    if (activeTab) await window.sable.tabs.navigate(activeTab.id, url);
  };

  const navigateActive = async () => {
    const top = suggestions[0];
    if (top) await navigateTo(top.url);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-surface-1">
      <div
        className="absolute inset-0 pointer-events-none animate-[shimmer_16s_ease-in-out_infinite]"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 35%, rgb(var(--p-coral)), transparent 70%), radial-gradient(40% 40% at 30% 80%, rgb(var(--p-lavender)), transparent 70%), radial-gradient(40% 40% at 75% 75%, rgb(var(--p-butter)), transparent 70%)',
          opacity: 'var(--grain-opacity, 0.45)',
          filter: 'blur(20px)',
        }}
      />

      <div className="relative w-full max-w-[560px] px-6 text-center">
        <h2 className="text-[36px] font-medium tracking-[-0.025em] leading-[1.1] m-0 text-ink-0">
          {greeting(userName)}
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

        {query.trim() ? (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {suggestions.map((s, i) => (
              <SuggestionChip
                key={s.url}
                suggestion={s}
                primary={i === 0}
                onPick={navigateTo}
              />
            ))}
          </div>
        ) : recent.length > 0 ? (
          <RecentList entries={recent} onPick={navigateTo} />
        ) : null}
      </div>

      {/* Pinned bookmarks — user-editable */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 px-6">
        {bookmarks.map((b) => (
          <BookmarkPill key={b.id} bookmark={b} onPick={navigateTo} />
        ))}
        <AddBookmarkButton />
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
        <span className="w-2 h-2 rounded-full" style={{ background: suggestion.color }} />
      )}
      <span className="font-medium">{suggestion.label}</span>
    </button>
  );
}

function RecentList({
  entries,
  onPick,
}: {
  entries: readonly HistoryEntry[];
  onPick: (url: string) => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-1">
      <div className="text-[10px] font-mono text-ink-3 uppercase tracking-[0.16em] mb-1">
        Recently visited
      </div>
      {entries.map((e) => (
        <button
          key={e.url}
          onClick={() => onPick(e.url)}
          className="group flex items-center gap-3 px-3 py-2 rounded-[10px] bg-surface-2/70 hover:bg-surface-3 border border-line text-left transition-colors"
        >
          <Favicon url={e.url} />
          <span className="flex-1 min-w-0 truncate text-sm text-ink-0">{e.title || e.url}</span>
          <span className="shrink-0 text-[11px] text-ink-3 font-mono truncate max-w-[180px]">
            {hostname(e.url)}
          </span>
        </button>
      ))}
    </div>
  );
}

function Favicon({ url }: { url: string }) {
  const host = hostname(url);
  // Use Google's public favicon proxy — no extension config required and
  // resilient when sites block hotlinks.
  const src = `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(host)}`;
  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      className="w-4 h-4 rounded-sm shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}

function BookmarkPill({
  bookmark,
  onPick,
}: {
  bookmark: Bookmark;
  onPick: (url: string) => void;
}) {
  const removeBookmark = useChromeStore((s) => s.removeBookmark);
  return (
    <div className="relative group flex flex-col items-center gap-1.5 w-16">
      <button
        onClick={() => onPick(bookmark.url)}
        className="w-11 h-11 rounded-[13px] inline-flex items-center justify-center font-semibold text-md shadow-1 group-hover:scale-105 transition-transform"
        style={{ background: bookmark.color, color: contrastInk(bookmark.color) }}
      >
        {firstLetter(bookmark.label)}
      </button>
      <span className="text-[10px] text-ink-2 truncate max-w-full">{bookmark.label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeBookmark(bookmark.id);
        }}
        title="Remove bookmark"
        className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 w-5 h-5 rounded-full bg-bad text-white inline-flex items-center justify-center shadow-1 hover:scale-110"
      >
        <XMarkIcon className="w-3 h-3" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function AddBookmarkButton() {
  const addBookmark = useChromeStore((s) => s.addBookmark);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState(BOOKMARK_COLORS[0]!.hex);

  const submit = () => {
    const u = url.trim();
    if (!u) return;
    const finalUrl = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    const finalLabel = label.trim() || hostname(finalUrl) || 'Site';
    addBookmark({ label: finalLabel, url: finalUrl, color });
    setLabel('');
    setUrl('');
    setColor(BOOKMARK_COLORS[0]!.hex);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Add bookmark"
        className="flex flex-col items-center gap-1.5 w-16 group"
      >
        <span className="w-11 h-11 rounded-[13px] inline-flex items-center justify-center bg-surface-3 text-ink-2 border border-dashed border-line-strong group-hover:bg-surface-4 group-hover:text-ink-0 transition-colors">
          <PlusIcon className="w-5 h-5" />
        </span>
        <span className="text-[10px] text-ink-3 truncate max-w-full">Add</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-[100%] mb-3 left-1/2 -translate-x-1/2 w-[300px] rounded-[14px] bg-surface-2 border border-line shadow-3 p-3 flex flex-col gap-2.5 z-30">
      <div className="text-[10px] font-mono text-ink-3 uppercase tracking-[0.14em]">
        New bookmark
      </div>
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="https://…"
        spellCheck={false}
        className="h-9 px-3 rounded-[9px] bg-surface-3 border border-line text-sm text-ink-0 outline-none focus:border-acc placeholder:text-ink-3"
      />
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Label (optional)"
        spellCheck={false}
        className="h-9 px-3 rounded-[9px] bg-surface-3 border border-line text-sm text-ink-0 outline-none focus:border-acc placeholder:text-ink-3"
      />
      <div className="flex items-center justify-between gap-1">
        {BOOKMARK_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.label}
            onClick={() => setColor(c.hex)}
            className={`w-6 h-6 rounded-md transition-shadow ${
              c.hex.toLowerCase() === color.toLowerCase()
                ? 'shadow-[0_0_0_2px_rgb(var(--ink-0))]'
                : 'hover:scale-110'
            }`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => setOpen(false)}
          className="h-7 px-2.5 rounded-md text-xs text-ink-2 hover:text-ink-0"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!url.trim()}
          className="h-7 px-2.5 rounded-md bg-ink-0 text-ink-inv text-xs font-medium disabled:opacity-30"
        >
          Add
        </button>
      </div>
    </div>
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

function greeting(name: string): ReactNode {
  const h = new Date().getHours();
  const word = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const trimmed = name.trim();
  const lead = trimmed ? `${word}, ${trimmed}.` : `${word}.`;
  return (
    <>
      {lead} <span className="text-acc-ink">Where should we start?</span>
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

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function firstLetter(label: string): string {
  return (label.trim()[0] ?? '?').toUpperCase();
}

function contrastInk(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#15120D';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 150 ? '#15120D' : '#FBFAF7';
}
