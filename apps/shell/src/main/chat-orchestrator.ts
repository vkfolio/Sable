// ChatOrchestrator — owns conversation state + LangGraph runs + AG-UI event
// emission. One orchestrator instance per BrowserWindow.
//
// Phase 2 graph: a single `model` node. START -> model -> END. We use
// graph.streamEvents({ version: 'v2' }) to get token-level chunks, translate
// them to AG-UI events, and emit. Conversation state is in-memory per
// window for V0.1; SqliteSaver checkpointer comes when persistence matters.

import { app } from 'electron';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, AIMessageChunk, type BaseMessage } from '@langchain/core/messages';
import { buildActiveModel } from './llm-factory';
import { SettingsStore } from './settings-store';
import type { LocalModelManager } from './local-model-manager';
import {
  makeRunError,
  makeRunFinished,
  makeRunStarted,
  translateEvent,
  type AGUIEvent,
  type TranslatorContext,
} from './agui-translator';

export type ConversationId = string;
export type RunId = string;

export type ChatEmitter = (event: AGUIEvent) => void;

export type ChatImageAttachment = {
  readonly mimeType: string;
  readonly base64: string;
  readonly sourceUrl?: string;
};

export type ChatSendContent = {
  readonly text: string;
  readonly images?: readonly ChatImageAttachment[];
};

type PersistedMessage = { role: 'user' | 'assistant' | 'system'; text: string };
type PersistedFile = {
  schemaVersion: 1;
  conversations: Record<ConversationId, PersistedMessage[]>;
};

export class ChatOrchestrator {
  private readonly conversations = new Map<ConversationId, BaseMessage[]>();
  private readonly activeRuns = new Map<RunId, AbortController>();
  private persistTimer: NodeJS.Timeout | null = null;
  private loaded = false;

  constructor(
    private readonly settings: SettingsStore,
    private readonly emit: ChatEmitter,
    private readonly localModels: LocalModelManager,
  ) {
    void this.loadFromDisk();
  }

  async send(conversationId: ConversationId, content: ChatSendContent): Promise<RunId> {
    const text = content.text.trim();
    const images = content.images ?? [];
    if (!text && images.length === 0) throw new Error('empty message');

    // Wait for the initial disk load before mutating, so a fast first send
    // doesn't clobber persisted history.
    if (!this.loaded) await this.loadFromDisk();

    const messages = this.conversations.get(conversationId) ?? [];
    messages.push(buildUserMessage(text, images));
    this.conversations.set(conversationId, messages);
    this.schedulePersist();

    const runId = `run-${randomUUID()}`;
    const abort = new AbortController();
    this.activeRuns.set(runId, abort);

    // Fire and forget; events are delivered via this.emit().
    void this.runStream(runId, conversationId, abort.signal).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      this.emit(
        makeRunError({ runId, threadId: conversationId }, `unhandled: ${message}`),
      );
    }).finally(() => {
      this.activeRuns.delete(runId);
    });

    return runId;
  }

  stop(runId: RunId): void {
    this.activeRuns.get(runId)?.abort();
  }

  /** Returns a shallow snapshot of message texts for a conversation, useful for UI restoration. */
  getMessages(conversationId: ConversationId): { role: 'user' | 'assistant'; text: string }[] {
    const msgs = this.conversations.get(conversationId) ?? [];
    return msgs
      .map((m) => {
        const role: 'user' | 'assistant' =
          m instanceof HumanMessage ? 'user' : m instanceof AIMessage ? 'assistant' : 'assistant';
        const text = typeof m.content === 'string' ? m.content : extractText(m.content);
        return { role, text };
      })
      .filter((m) => m.text.length > 0);
  }

  // ---- internals ----

  // ---- persistence ----

  private path(): string {
    return path.join(app.getPath('userData'), 'conversations.json');
  }

  /**
   * Load text-only conversation history from disk. Multimodal images are
   * NOT persisted (base64 data is too large) — V0 limitation; their
   * surrounding text comes back as plain text. Always-completes (sets
   * `loaded` even on file-not-found) so subsequent sends don't block.
   */
  private async loadFromDisk(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.path(), 'utf8');
      const parsed = JSON.parse(raw) as PersistedFile;
      if (parsed.schemaVersion === 1 && parsed.conversations) {
        for (const [convId, msgs] of Object.entries(parsed.conversations)) {
          const reconstructed: BaseMessage[] = [];
          for (const m of msgs) {
            if (m.role === 'user') reconstructed.push(new HumanMessage(m.text));
            else if (m.role === 'assistant') reconstructed.push(new AIMessage(m.text));
          }
          if (reconstructed.length > 0) this.conversations.set(convId, reconstructed);
        }
      }
    } catch {
      // first run, missing or corrupt; fall through with empty state
    }
    this.loaded = true;
  }

  /**
   * Debounced disk save. ~500 ms after the last call, write the full
   * conversations Map to a single JSON file. Single file is fine for V0:
   * a typical user has < 100 conversations, each < 100 KB.
   */
  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.persist();
    }, 500);
  }

  private async persist(): Promise<void> {
    const out: PersistedFile = { schemaVersion: 1, conversations: {} };
    for (const [convId, msgs] of this.conversations) {
      const serialized: PersistedMessage[] = [];
      for (const m of msgs) {
        const role: PersistedMessage['role'] =
          m instanceof HumanMessage
            ? 'user'
            : m instanceof AIMessage || m instanceof AIMessageChunk
            ? 'assistant'
            : 'system';
        const text = extractText(m.content);
        if (text) serialized.push({ role, text });
      }
      if (serialized.length > 0) out.conversations[convId] = serialized;
    }
    try {
      const dir = app.getPath('userData');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.path(), JSON.stringify(out, null, 2), 'utf8');
    } catch (err) {
      process.stderr.write(`[chat] persist failed: ${String(err)}\n`);
    }
  }

  private async runStream(
    runId: RunId,
    conversationId: ConversationId,
    signal: AbortSignal,
  ): Promise<void> {
    const ctx: TranslatorContext = { runId, threadId: conversationId };

    const built = await buildActiveModel(this.settings, this.localModels);
    if (!built.ok) {
      const msg =
        built.error.kind === 'no-key'
          ? `No API key configured for ${built.error.provider}. Add one in Settings.`
          : built.error.kind === 'local-model-missing'
          ? `Local model ${built.error.variantId} is not downloaded. Open Settings to download it.`
          : `Provider ${built.error.provider} is not yet supported.`;
      this.emit(makeRunError(ctx, msg));
      return;
    }
    const model = built.model;

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('model', async (state) => {
        // Use .stream() rather than .invoke() so that token-level chunks
        // bubble up as `on_chat_model_stream` events through streamEvents.
        // (.invoke() only fires start/end events on custom BaseChatModels
        // that don't set `streaming: true`.) We accumulate the chunks here
        // for the graph's resulting messages while the per-chunk events
        // already drive the chrome's streaming UI via the agui translator.
        const stream = await model.stream(state.messages, { signal });
        let aggregated: AIMessageChunk | undefined;
        for await (const chunk of stream) {
          aggregated = aggregated ? aggregated.concat(chunk) : chunk;
        }
        return { messages: [aggregated ?? new AIMessage('')] };
      })
      .addEdge(START, 'model')
      .addEdge('model', END)
      .compile();

    this.emit(makeRunStarted(ctx));

    const messages = this.conversations.get(conversationId) ?? [];

    try {
      const events = graph.streamEvents(
        { messages },
        { version: 'v2', signal },
      );
      for await (const event of events) {
        if (signal.aborted) break;
        // Capture final state on graph completion to keep our conversation
        // store consistent with the model's full reply.
        if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
          const out = (event.data as { output?: { messages?: BaseMessage[] } }).output;
          if (out?.messages) {
            this.conversations.set(conversationId, out.messages);
            this.schedulePersist();
          }
        }
        const translated = translateEvent(event, ctx);
        for (const e of translated) this.emit(e);
      }
      this.emit(makeRunFinished(ctx));
    } catch (err) {
      if (signal.aborted) {
        this.emit(makeRunFinished(ctx));
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[chat] graph threw: ${message}\n`);
      this.emit(makeRunError(ctx, message));
    }
  }
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  let out = '';
  for (const part of content) {
    if (typeof part === 'string') out += part;
    else if (part && typeof part === 'object' && 'text' in part && typeof (part as { text: unknown }).text === 'string') {
      out += (part as { text: string }).text;
    }
  }
  return out;
}

/**
 * Build a HumanMessage from text + image attachments. With images, we use
 * LangChain's MessageContentComplex array form: image blocks first, then the
 * text. Both Anthropic and OpenAI adapters translate this into their native
 * multimodal request shapes.
 */
function buildUserMessage(text: string, images: readonly ChatImageAttachment[]): HumanMessage {
  if (images.length === 0) return new HumanMessage(text);
  const blocks: ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[] = [];
  for (const img of images) {
    blocks.push({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    });
  }
  if (text) blocks.push({ type: 'text', text });
  return new HumanMessage({ content: blocks });
}

/**
 * Fetch an image URL from the main process and return its bytes as base64.
 * Bypasses renderer CORS, lets us inline images into multimodal LLM requests
 * regardless of cross-origin policy on the source page.
 */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

export async function resolveImage(srcUrl: string): Promise<{ mimeType: string; base64: string }> {
  if (!/^https?:/i.test(srcUrl)) {
    if (srcUrl.startsWith('data:')) {
      const m = /^data:([^;,]+)(;base64)?,(.*)$/i.exec(srcUrl);
      if (!m) throw new Error('malformed data: URI');
      const mimeType = m[1] ?? 'application/octet-stream';
      const isBase64 = m[2] === ';base64';
      const data = decodeURIComponent(m[3] ?? '');
      const base64 = isBase64 ? data : Buffer.from(data, 'utf8').toString('base64');
      return { mimeType, base64 };
    }
    throw new Error('only http(s) and data: URIs supported');
  }
  const response = await fetch(srcUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Sable/0.1)',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const rawType = response.headers.get('content-type') ?? '';
  const mimeType = rawType.split(';')[0]!.trim().toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new Error(`unsupported image type: ${mimeType || '(missing)'}`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`image too large: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB > 5 MB`);
  }
  const base64 = Buffer.from(buffer).toString('base64');
  return { mimeType, base64 };
}
