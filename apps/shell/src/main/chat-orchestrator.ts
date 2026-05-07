// ChatOrchestrator — owns conversation state + LangGraph runs + AG-UI event
// emission. One orchestrator instance per BrowserWindow.
//
// Phase 2 graph: a single `model` node. START -> model -> END. We use
// graph.streamEvents({ version: 'v2' }) to get token-level chunks, translate
// them to AG-UI events, and emit. Conversation state is in-memory per
// window for V0.1; SqliteSaver checkpointer comes when persistence matters.

import { randomUUID } from 'node:crypto';
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, type BaseMessage } from '@langchain/core/messages';
import { buildActiveModel } from './llm-factory';
import { SettingsStore } from './settings-store';
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

export class ChatOrchestrator {
  private readonly conversations = new Map<ConversationId, BaseMessage[]>();
  private readonly activeRuns = new Map<RunId, AbortController>();

  constructor(
    private readonly settings: SettingsStore,
    private readonly emit: ChatEmitter,
  ) {}

  async send(conversationId: ConversationId, userText: string): Promise<RunId> {
    const text = userText.trim();
    if (!text) throw new Error('empty message');

    const messages = this.conversations.get(conversationId) ?? [];
    messages.push(new HumanMessage(text));
    this.conversations.set(conversationId, messages);

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

  private async runStream(
    runId: RunId,
    conversationId: ConversationId,
    signal: AbortSignal,
  ): Promise<void> {
    const ctx: TranslatorContext = { runId, threadId: conversationId };

    const built = await buildActiveModel(this.settings);
    if (!built.ok) {
      const msg =
        built.error.kind === 'no-key'
          ? `No API key configured for ${built.error.provider}. Add one in Settings.`
          : `Provider ${built.error.provider} is not yet supported.`;
      this.emit(makeRunError(ctx, msg));
      return;
    }
    const model = built.model;

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('model', async (state) => {
        const reply = await model.invoke(state.messages, { signal });
        return { messages: [reply] };
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
          if (out?.messages) this.conversations.set(conversationId, out.messages);
        }
        const translated = translateEvent(event, ctx);
        for (const e of translated) this.emit(e);
      }
      this.emit(makeRunFinished(ctx));
    } catch (err) {
      if (signal.aborted) {
        // Cancel emits a finished event so the UI clears its loading state.
        this.emit(makeRunFinished(ctx));
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
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
