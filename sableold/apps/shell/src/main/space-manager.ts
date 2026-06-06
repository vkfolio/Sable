// SpaceManager — multiple workspaces, each with its own layout tree and
// chat history. V0 scope: bootstrap with a single "Personal" space, allow
// creating more, switching is the headline interaction. Per-space tab
// filtering arrives in the next slice; for V0 tabs are global.
//
// Persistence: userData/spaces.json. Schema-versioned for future migration.

import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Pane } from '@sable/layout-engine';

export type SpaceId = string;

export type SpaceState = {
  id: SpaceId;
  name: string;
  accent: string;
  layoutTree: Pane | null;
  /** Chat history bucket id; ChatOrchestrator keys conversations by this. */
  conversationId: string;
};

type PersistedSpace = {
  id: SpaceId;
  name: string;
  accent: string;
  conversationId: string;
};

type Persisted = {
  schemaVersion: 1;
  activeSpaceId: SpaceId;
  spaces: PersistedSpace[];
};

const DEFAULT_ACCENTS = [
  '#6b7cff', // indigo
  '#7adabf', // teal
  '#f59e0b', // amber
  '#f472b6', // pink
  '#a78bfa', // violet
  '#fb7185', // rose
];

type Listener = () => void;

export class SpaceManager {
  private spaces = new Map<SpaceId, SpaceState>();
  private activeSpaceId: SpaceId = '';
  private listeners = new Set<Listener>();

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.path(), 'utf8');
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed.schemaVersion === 1 && Array.isArray(parsed.spaces)) {
        for (const ps of parsed.spaces) {
          // layoutTree is in-memory only; tabs are per-session and the
          // tree's TabId refs would be stale across restarts.
          this.spaces.set(ps.id, {
            ...ps,
            layoutTree: null,
          });
        }
        if (this.spaces.has(parsed.activeSpaceId)) {
          this.activeSpaceId = parsed.activeSpaceId;
        }
      }
    } catch {
      // first run or unreadable; fall through to bootstrap
    }
    if (this.spaces.size === 0) {
      const personal = this.makeSpace('Personal', DEFAULT_ACCENTS[0]!);
      this.spaces.set(personal.id, personal);
      this.activeSpaceId = personal.id;
      await this.persist();
    } else if (!this.activeSpaceId) {
      this.activeSpaceId = this.list()[0]!.id;
    }
  }

  list(): SpaceState[] {
    return Array.from(this.spaces.values());
  }

  active(): SpaceState {
    const s = this.spaces.get(this.activeSpaceId);
    if (!s) throw new Error('SpaceManager has no active space');
    return s;
  }

  activeId(): SpaceId {
    return this.activeSpaceId;
  }

  setActive(id: SpaceId): boolean {
    if (!this.spaces.has(id) || id === this.activeSpaceId) return false;
    this.activeSpaceId = id;
    this.notify();
    void this.persist();
    return true;
  }

  create(name: string): SpaceState {
    const accent = DEFAULT_ACCENTS[this.spaces.size % DEFAULT_ACCENTS.length]!;
    const space = this.makeSpace(name, accent);
    this.spaces.set(space.id, space);
    this.notify();
    void this.persist();
    return space;
  }

  rename(id: SpaceId, name: string): void {
    const s = this.spaces.get(id);
    if (!s) return;
    s.name = name;
    this.notify();
    void this.persist();
  }

  setAccent(id: SpaceId, accent: string): void {
    const s = this.spaces.get(id);
    if (!s) return;
    s.accent = accent;
    this.notify();
    void this.persist();
  }

  remove(id: SpaceId): void {
    if (this.spaces.size <= 1) return; // never delete the last space
    this.spaces.delete(id);
    if (this.activeSpaceId === id) {
      this.activeSpaceId = this.list()[0]!.id;
    }
    this.notify();
    void this.persist();
  }

  /**
   * Save the active space's layout tree. Called from the LayoutController
   * snapshot listener so any drop / resize / tab-close persists.
   */
  setActiveLayoutTree(tree: Pane | null): void {
    const s = this.spaces.get(this.activeSpaceId);
    if (!s) return;
    if (s.layoutTree === tree) return;
    s.layoutTree = tree;
    // Persist only — don't notify; layout snapshots already drive UI.
    void this.persist();
  }

  onChange(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // ---- internals ----

  private notify(): void {
    for (const cb of this.listeners) {
      try {
        cb();
      } catch {
        // listener errors must not break manager state
      }
    }
  }

  private makeSpace(name: string, accent: string): SpaceState {
    const id = `space-${randomUUID()}`;
    return {
      id,
      name,
      accent,
      layoutTree: null,
      conversationId: `conv-${randomUUID()}`,
    };
  }

  private path(): string {
    return path.join(app.getPath('userData'), 'spaces.json');
  }

  private async persist(): Promise<void> {
    const data: Persisted = {
      schemaVersion: 1,
      activeSpaceId: this.activeSpaceId,
      spaces: this.list().map((s) => ({
        id: s.id,
        name: s.name,
        accent: s.accent,
        conversationId: s.conversationId,
      })),
    };
    try {
      const dir = app.getPath('userData');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.path(), JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      process.stderr.write(`[spaces] persist failed: ${String(err)}\n`);
    }
  }
}
