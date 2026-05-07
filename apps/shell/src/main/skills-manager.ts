// SkillsManager — persists named prompt templates to disk + serves them
// to the chrome's skill picker. Bootstraps with six bundled defaults on
// first run. Custom skills the user adds live in the same JSON.

import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type SkillId = string;

export type Skill = {
  readonly id: SkillId;
  readonly label: string;
  readonly description: string;
  readonly template: string;
  /** Bundled defaults can't be deleted (only customized via overwrite). */
  readonly builtin?: boolean;
};

type Persisted = {
  schemaVersion: 1;
  skills: Skill[];
};

const DEFAULT_SKILLS: readonly Skill[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    description: '3-bullet summary + a one-line takeaway',
    template:
      'Summarize the following in 3 short bullet points, then end with one sentence stating the most important takeaway.\n\n',
    builtin: true,
  },
  {
    id: 'compare',
    label: 'Compare',
    description: 'Find agreement / disagreement across tabs',
    template:
      'Compare the sources I have provided as context. Structure your reply as:\n' +
      '\n' +
      '1. **Agreement** — points where the sources align\n' +
      '2. **Disagreement** — points where they diverge\n' +
      '3. **Most important differences** — what actually matters\n' +
      '\n' +
      'Cite specifics; avoid generalities.\n\n',
    builtin: true,
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Explain a concept clearly',
    template:
      'Explain this concept assuming I have a technical background but no domain expertise. Be precise and concrete; avoid hedging language. Use a brief example if it helps.\n\n',
    builtin: true,
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    description: 'Rewrite in a different tone or length',
    template:
      'Rewrite the following text. Target style: [more concise / more formal / more casual / more technical — pick one or specify]. Preserve the meaning.\n\n',
    builtin: true,
  },
  {
    id: 'critique',
    label: 'Critique',
    description: 'Honest critique of a draft or argument',
    template:
      'Critique this draft. Be specific and honest. Cover:\n' +
      '\n' +
      '- The strongest claim or section\n' +
      '- The weakest claim or section\n' +
      '- Two concrete improvements\n' +
      '\n' +
      'Avoid generic praise.\n\n',
    builtin: true,
  },
  {
    id: 'translate',
    label: 'Translate',
    description: 'Translate text to another language',
    template:
      'Translate the following to [target language — e.g. English, Spanish, Japanese]. Preserve nuance over literal word-for-word.\n\n',
    builtin: true,
  },
];

type Listener = () => void;

export class SkillsManager {
  private skills: Skill[] = [];
  private listeners = new Set<Listener>();

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.path(), 'utf8');
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed.schemaVersion === 1 && Array.isArray(parsed.skills)) {
        this.skills = parsed.skills;
      }
    } catch {
      // first run, no file
    }
    if (this.skills.length === 0) {
      this.skills = DEFAULT_SKILLS.map((s) => ({ ...s }));
      await this.persist();
    }
  }

  list(): Skill[] {
    return this.skills.slice();
  }

  /**
   * Save (insert or update). If the id collides with an existing skill the
   * existing record is replaced (this is how a user "edits" a builtin —
   * by overwriting it). Returns the saved skill.
   */
  async save(input: Omit<Skill, 'builtin'> & { builtin?: boolean }): Promise<Skill> {
    const id = input.id || `skill-${randomUUID()}`;
    const existing = this.skills.findIndex((s) => s.id === id);
    const next: Skill = {
      id,
      label: input.label.trim() || 'Untitled',
      description: input.description.trim(),
      template: input.template,
      // Preserve builtin flag if overwriting a builtin
      builtin: existing >= 0 ? this.skills[existing]!.builtin : input.builtin,
    };
    if (existing >= 0) this.skills[existing] = next;
    else this.skills.push(next);
    this.notify();
    await this.persist();
    return next;
  }

  async remove(id: SkillId): Promise<void> {
    const idx = this.skills.findIndex((s) => s.id === id);
    if (idx < 0) return;
    if (this.skills[idx]!.builtin) return; // builtins are not removable
    this.skills.splice(idx, 1);
    this.notify();
    await this.persist();
  }

  /** Reset everything to factory defaults. */
  async resetToDefaults(): Promise<void> {
    this.skills = DEFAULT_SKILLS.map((s) => ({ ...s }));
    this.notify();
    await this.persist();
  }

  onChange(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(): void {
    for (const cb of this.listeners) {
      try {
        cb();
      } catch {
        // listener errors must not break manager
      }
    }
  }

  private path(): string {
    return path.join(app.getPath('userData'), 'skills.json');
  }

  private async persist(): Promise<void> {
    const data: Persisted = { schemaVersion: 1, skills: this.skills };
    try {
      const dir = app.getPath('userData');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.path(), JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      process.stderr.write(`[skills] persist failed: ${String(err)}\n`);
    }
  }
}
