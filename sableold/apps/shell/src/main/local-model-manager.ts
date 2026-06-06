// LocalModelManager — owns the lifecycle of embedded GGUF model files.
//
// Phase 5 V0 ships Qwen3-1.7B as the on-by-default low-end-friendly model
// and Qwen3-4B-Instruct-2507 as the user-opt-in upgrade. Both Apache 2.0,
// same chat template, single Sable-side template implementation.
//
// node-llama-cpp's createModelDownloader handles HuggingFace URLs, range
// requests for resume, and progress callbacks. We just wrap it with our
// own variant registry and IPC-friendly event emitter.

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

// node-llama-cpp v3 is ESM-only; our shell is CJS. tsc rewrites `import()`
// to require() under CommonJS — we hide the import from tsc via Function so
// the runtime gets a native dynamic ESM import.
type LlamaModule = typeof import('node-llama-cpp');
let llamaModulePromise: Promise<LlamaModule> | null = null;
function loadLlamaModule(): Promise<LlamaModule> {
  if (!llamaModulePromise) {
    llamaModulePromise = new Function(
      'return import("node-llama-cpp")',
    )() as Promise<LlamaModule>;
  }
  return llamaModulePromise;
}

export type LocalModelVariantId =
  // Qwen 3 — Apache 2.0, the licensing-clean default family
  | 'qwen3-0.6b-q4'
  | 'qwen3-1.7b-q4'
  | 'qwen3-4b-instruct-2507-q4'
  // Qwen 3.6 — latest dense (Apr 2026), Apache 2.0, beats 397B MoE on coding
  | 'qwen3.6-27b-q4';
// Gemma 4 entries are pulled out until node-llama-cpp ships a bundled
// llama.cpp build with the gemma4 architecture. Add them back when the
// upstream release lands — type union, registry entries, and the UI all
// pick them up automatically.

export type LocalModelVariant = {
  readonly id: LocalModelVariantId;
  readonly label: string;
  readonly description: string;
  readonly approxSizeMb: number;
  readonly url: string;
  readonly recommended?: boolean;
  /** Architecture is too new for the bundled llama.cpp prebuilds — the
   *  download succeeds but loading throws "unknown model architecture".
   *  UI surfaces a warning so users know before they pull GBs. */
  readonly experimental?: boolean;
  /** Free-text reason shown in the UI alongside the experimental badge. */
  readonly experimentalNote?: string;
};

// Q4_K_M GGUF quants live in the `unsloth/` community repos — the official
// `Qwen/` and `google/` repos ship higher-quality but heavier baseline quants.
// URLs verified against unsloth's HF org as of 2026-05.
export const LOCAL_MODEL_REGISTRY: readonly LocalModelVariant[] = [
  {
    id: 'qwen3-0.6b-q4',
    label: 'Qwen 3 0.6B',
    description: 'Ultra-lightweight · runs anywhere · weakest quality',
    approxSizeMb: 397,
    url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf',
  },
  {
    id: 'qwen3-1.7b-q4',
    label: 'Qwen 3 1.7B',
    description: 'Default · 8 GB RAM ok · fast',
    approxSizeMb: 1110,
    url: 'https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf',
    recommended: true,
  },
  {
    id: 'qwen3-4b-instruct-2507-q4',
    label: 'Qwen 3 4B (Instruct 2507)',
    description: 'Higher quality · 16 GB RAM recommended',
    approxSizeMb: 2500,
    url: 'https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf',
  },
  {
    id: 'qwen3.6-27b-q4',
    label: 'Qwen 3.6 27B',
    description: 'Frontier dense · Apache 2.0 · 24+ GB RAM recommended',
    approxSizeMb: 16000,
    url: 'https://huggingface.co/unsloth/Qwen3.6-27B-GGUF/resolve/main/Qwen3.6-27B-Q4_K_M.gguf',
  },
];

export type LocalModelStatus = {
  readonly id: LocalModelVariantId;
  readonly label: string;
  readonly description: string;
  readonly approxSizeMb: number;
  readonly recommended: boolean;
  readonly experimental: boolean;
  readonly experimentalNote?: string;
  readonly state: 'absent' | 'downloading' | 'ready' | 'error';
  readonly downloadedBytes?: number;
  readonly totalBytes?: number;
  readonly error?: string;
};

export type LocalModelEvent =
  | { kind: 'progress'; id: LocalModelVariantId; downloadedBytes: number; totalBytes: number }
  | { kind: 'done'; id: LocalModelVariantId }
  | { kind: 'error'; id: LocalModelVariantId; error: string }
  | { kind: 'removed'; id: LocalModelVariantId };

type Listener = (event: LocalModelEvent) => void;

type DownloadState = {
  abort: AbortController;
  downloadedBytes: number;
  totalBytes: number;
};

export class LocalModelManager {
  private readonly active = new Map<LocalModelVariantId, DownloadState>();
  private readonly listeners = new Set<Listener>();

  /** Subscribe to download lifecycle events. */
  onEvent(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** Snapshot of every registered variant's current state. */
  async listStatus(): Promise<LocalModelStatus[]> {
    const out: LocalModelStatus[] = [];
    for (const v of LOCAL_MODEL_REGISTRY) {
      const exists = await this.exists(this.modelPath(v.id));
      const inflight = this.active.get(v.id);
      const state: LocalModelStatus['state'] = inflight
        ? 'downloading'
        : exists
        ? 'ready'
        : 'absent';
      out.push({
        id: v.id,
        label: v.label,
        description: v.description,
        approxSizeMb: v.approxSizeMb,
        recommended: !!v.recommended,
        experimental: !!v.experimental,
        experimentalNote: v.experimentalNote,
        state,
        downloadedBytes: inflight?.downloadedBytes,
        totalBytes: inflight?.totalBytes,
      });
    }
    return out;
  }

  /** Returns the absolute file path if the variant is fully downloaded, else null. */
  async getReadyPath(id: LocalModelVariantId): Promise<string | null> {
    const p = this.modelPath(id);
    return (await this.exists(p)) ? p : null;
  }

  async download(id: LocalModelVariantId): Promise<void> {
    const variant = LOCAL_MODEL_REGISTRY.find((v) => v.id === id);
    if (!variant) throw new Error(`unknown variant ${id}`);
    if (this.active.has(id)) return; // already downloading
    if (await this.exists(this.modelPath(id))) {
      this.emit({ kind: 'done', id });
      return;
    }

    const abort = new AbortController();
    const state: DownloadState = { abort, downloadedBytes: 0, totalBytes: 0 };
    this.active.set(id, state);

    const dirPath = path.dirname(this.modelPath(id));
    await fs.mkdir(dirPath, { recursive: true });

    try {
      const mod = await loadLlamaModule();
      const downloader = await mod.createModelDownloader({
        modelUri: variant.url,
        dirPath,
        fileName: this.fileName(id),
        // node-llama-cpp's downloader handles HF URLs and supports progress.
        // We'd love an onProgress here, but the v3 API exposes it via the
        // `downloader` object — we sample it on a ticker.
      });

      // Sample progress every 250ms until the download promise resolves.
      const progressTimer = setInterval(() => {
        const inflight = this.active.get(id);
        if (!inflight) return;
        inflight.downloadedBytes = downloader.downloadedSize;
        inflight.totalBytes = downloader.totalSize;
        this.emit({
          kind: 'progress',
          id,
          downloadedBytes: downloader.downloadedSize,
          totalBytes: downloader.totalSize,
        });
      }, 250);

      // Racing the abort — node-llama-cpp's downloader doesn't accept
      // AbortSignal in v3, so we cancel via downloader.cancel() if asked.
      const aborted = new Promise<never>((_, reject) => {
        if (abort.signal.aborted) return reject(new Error('aborted'));
        abort.signal.addEventListener('abort', () => {
          downloader.cancel().catch(() => {});
          reject(new Error('aborted'));
        });
      });

      try {
        await Promise.race([downloader.download(), aborted]);
      } finally {
        clearInterval(progressTimer);
      }

      this.emit({ kind: 'done', id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ kind: 'error', id, error: msg });
      throw err;
    } finally {
      this.active.delete(id);
    }
  }

  cancel(id: LocalModelVariantId): void {
    const state = this.active.get(id);
    if (state) state.abort.abort();
  }

  async remove(id: LocalModelVariantId): Promise<void> {
    this.cancel(id);
    const p = this.modelPath(id);
    try {
      await fs.unlink(p);
    } catch {
      // not present, ignore
    }
    this.emit({ kind: 'removed', id });
  }

  // ---- helpers ----

  private modelPath(id: LocalModelVariantId): string {
    return path.join(this.dir(), this.fileName(id));
  }

  private fileName(id: LocalModelVariantId): string {
    return `${id}.gguf`;
  }

  private dir(): string {
    return path.join(app.getPath('userData'), 'models');
  }

  private async exists(p: string): Promise<boolean> {
    try {
      const st = await fs.stat(p);
      return st.isFile() && st.size > 0;
    } catch {
      return false;
    }
  }

  private emit(event: LocalModelEvent): void {
    for (const cb of this.listeners) {
      try {
        cb(event);
      } catch {
        // listener errors must not break manager state
      }
    }
  }
}
