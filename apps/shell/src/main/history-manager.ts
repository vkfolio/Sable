// HistoryManager — in-memory URL/title history, persisted to JSON.
//
// Same-URL visits collapse: every navigation bumps `lastVisitedAt` and
// `visitCount` on the existing entry rather than appending. We skip
// internal pseudo-URLs (sable://newtab, about:blank, chrome://) and any
// empty/placeholder URL.
//
// Persistence is debounced — writes batch every 1 s of idle, so heavy
// browsing doesn't hammer the disk. Loaded once on construction.

import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type HistoryEntry = {
  readonly url: string;
  readonly title: string;
  readonly lastVisitedAt: number;
  readonly visitCount: number;
};

const SKIP_SCHEMES = ['sable:', 'about:', 'chrome:', 'data:', 'javascript:', 'devtools:'];

export class HistoryManager {
  private readonly entries = new Map<string, HistoryEntry>();
  private persistTimer: NodeJS.Timeout | null = null;
  private loaded = false;
  private loading: Promise<void> | null = null;

  constructor() {
    void this.load();
  }

  /**
   * Record a visit. Title is upserted if non-empty; later updates can
   * refine it once `page-title-updated` fires.
   */
  record(input: { url: string; title?: string }): void {
    const url = (input.url || '').trim();
    if (!url) return;
    if (SKIP_SCHEMES.some((s) => url.startsWith(s))) return;
    const existing = this.entries.get(url);
    const title = (input.title ?? existing?.title ?? hostname(url)).slice(0, 280);
    const next: HistoryEntry = existing
      ? {
          url,
          title: input.title?.trim() ? input.title.slice(0, 280) : existing.title,
          lastVisitedAt: Date.now(),
          visitCount: existing.visitCount + 1,
        }
      : {
          url,
          title,
          lastVisitedAt: Date.now(),
          visitCount: 1,
        };
    this.entries.set(url, next);
    this.schedulePersist();
  }

  recent(limit = 5): HistoryEntry[] {
    return [...this.entries.values()]
      .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)
      .slice(0, Math.max(1, limit));
  }

  /**
   * Substring match on title or url, ranked by a simple recency × frequency
   * score. Empty query returns recent. Limit defaults to 8.
   */
  search(query: string, limit = 8): HistoryEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.recent(limit);
    const now = Date.now();
    const HOUR = 1000 * 60 * 60;
    const matches: { entry: HistoryEntry; score: number }[] = [];
    for (const e of this.entries.values()) {
      const title = e.title.toLowerCase();
      const url = e.url.toLowerCase();
      const inTitle = title.includes(q);
      const inUrl = url.includes(q);
      if (!inTitle && !inUrl) continue;
      // Score: recency decay (1 / hours_old) plus a frequency boost, plus
      // a small bonus when the query lands at the start of title or host.
      const ageHours = Math.max(0.5, (now - e.lastVisitedAt) / HOUR);
      const recency = 1 / ageHours;
      const frequency = Math.log2(e.visitCount + 1);
      const startBonus = title.startsWith(q) || url.startsWith(q) ? 0.5 : 0;
      const titleBonus = inTitle ? 0.25 : 0;
      matches.push({ entry: e, score: recency + frequency * 0.3 + startBonus + titleBonus });
    }
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, Math.max(1, limit)).map((m) => m.entry);
  }

  clear(): void {
    this.entries.clear();
    this.schedulePersist();
  }

  // ---- persistence ----

  private path(): string {
    return path.join(app.getPath('userData'), 'history.json');
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const raw = await fs.readFile(this.path(), 'utf8');
        const parsed = JSON.parse(raw) as { entries?: HistoryEntry[] };
        if (Array.isArray(parsed.entries)) {
          for (const e of parsed.entries) {
            if (typeof e?.url === 'string' && e.url) {
              this.entries.set(e.url, {
                url: e.url,
                title: typeof e.title === 'string' ? e.title : hostname(e.url),
                lastVisitedAt:
                  typeof e.lastVisitedAt === 'number' ? e.lastVisitedAt : 0,
                visitCount: typeof e.visitCount === 'number' ? e.visitCount : 1,
              });
            }
          }
        }
      } catch {
        // first launch / no file yet — fine, empty in-memory
      } finally {
        this.loaded = true;
      }
    })();
    return this.loading;
  }

  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => void this.persistNow(), 1000);
  }

  private async persistNow(): Promise<void> {
    try {
      const dir = app.getPath('userData');
      await fs.mkdir(dir, { recursive: true });
      // Cap at 5000 entries to keep the file reasonable; drop oldest.
      const all = [...this.entries.values()].sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
      const capped = all.slice(0, 5000);
      await fs.writeFile(this.path(), JSON.stringify({ entries: capped }, null, 0), 'utf8');
    } catch (err) {
      process.stderr.write(`[history] persist failed: ${String(err)}\n`);
    }
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}
