// New tab page (NTP) — rendered over the pane area when the active tab's
// url is `sable://newtab`. The matching tab's WebContentsView is left
// unmounted by LayoutController, so this component owns that whole rect.
//
// Pulls patterns from "Hero · 02 — new tab" in v3 design system:
//   greeting · live timestamp · AI command card · suggestion chips · pinned shortcuts
//
// Hitting Enter in the cmd input or clicking a suggestion sends the query
// to chat; clicking a pin navigates the active tab.

import { useEffect, useState } from 'react';
import { useChatStore } from '../state/chat';
import { useSpacesStore, selectActiveSpace } from '../state/spaces';
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { normalizeUrl } from '../url';

const SUGGESTIONS = [
  "summarize today's news",
  "what's on my calendar",
  '/dailypicks',
  'finish my email',
];

const PINS: { label: string; letter: string; color: string; ink: string; url: string }[] = [
  { label: 'arxiv',  letter: 'A', color: 'rgb(var(--p-coral))',    ink: '#4a1d0c', url: 'https://arxiv.org' },
  { label: 'github', letter: 'G', color: 'rgb(var(--p-mint))',     ink: '#0e3920', url: 'https://github.com' },
  { label: 'linear', letter: 'L', color: 'rgb(var(--p-sky))',      ink: '#142f4a', url: 'https://linear.app' },
  { label: 'notion', letter: 'N', color: 'rgb(var(--p-butter))',   ink: '#4a3308', url: 'https://notion.so' },
  { label: 'figma',  letter: 'F', color: 'rgb(var(--p-rose))',     ink: '#4d1530', url: 'https://figma.com' },
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

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setQuery('');
    if (looksLikeUrl(t)) {
      // navigate the active (this) tab
      if (activeTab) await window.sable.tabs.navigate(activeTab.id, normalizeUrl(t) ?? t);
      return;
    }
    // ask chat — push locally, dispatch over IPC
    pushUserMessage(t);
    try {
      const runId = await window.sable.chat.send(conversationId, { text: t });
      setActiveRun(runId);
    } catch (err) {
      // surfaced via RUN_ERROR; nothing to do here
      void err;
    }
  };

  const navigateTo = (url: string) => {
    if (activeTab) void window.sable.tabs.navigate(activeTab.id, url);
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
          {/* No name personalization yet — V0 keeps it generic */}
        </h2>
        <div className="font-mono text-[11px] text-ink-2 mt-2 tracking-[0.04em] uppercase">
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
              if (e.key === 'Enter') void submit(query);
            }}
            placeholder="explain mixture of experts in a paragraph"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base text-ink-0 placeholder:text-ink-3"
          />
          <kbd className="font-mono text-[10px] text-ink-2 bg-surface-3 px-1.5 py-0.5 rounded-md border border-line">⏎</kbd>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => void submit(s)}
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

function greeting(): React.ReactNode {
  const h = new Date().getHours();
  const word = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <>
      {word}, <span className="text-acc-ink">friend</span>
    </>
  );
}

function formatTime(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hr = d.getHours().toString().padStart(2, '0');
  const mn = d.getMinutes().toString().padStart(2, '0');
  return `${days[d.getDay()]} · ${mons[d.getMonth()]} ${d.getDate()} · ${hr}:${mn}`;
}

function looksLikeUrl(s: string): boolean {
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(s.trim()) || /^https?:\/\//i.test(s.trim());
}
