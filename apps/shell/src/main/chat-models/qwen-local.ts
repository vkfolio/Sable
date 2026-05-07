// QwenLocalChatModel — thin LangChain BaseChatModel wrapping node-llama-cpp.
//
// V0.1 keeps it deliberately simple:
//   - Singleton Llama + LlamaModel + LlamaContext per loaded GGUF file.
//   - Every chat turn creates a fresh LlamaChatSession with the full
//     conversation history fed via setChatHistory(). The graph drives
//     state; we don't keep parallel session state.
//   - Streaming is bridged from node-llama-cpp's onTextChunk callback to
//     an async iterator via a small producer/consumer queue.
//
// Concurrency: a single LlamaContext serializes requests. We queue if a
// prior generation is still in flight. Multi-sequence parallel chat is
// V0.2 work when generative-surfaces / agentic browsing need it.

import {
  BaseChatModel,
  type BaseChatModelCallOptions,
  type BaseChatModelParams,
} from '@langchain/core/language_models/chat_models';
import {
  AIMessageChunk,
  type BaseMessage,
} from '@langchain/core/messages';
import { ChatGenerationChunk } from '@langchain/core/outputs';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type {
  ChatHistoryItem,
  Llama,
  LlamaContext,
  LlamaModel,
} from 'node-llama-cpp';

// node-llama-cpp v3 is ESM-only. Our shell compiles to CommonJS, and tsc
// rewrites `import()` into `Promise.resolve(require(...))` for CJS output —
// which fails on ESM packages. Wrapping in `new Function(...)` hides the
// import from tsc so it emits a native runtime dynamic import.
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

export type QwenLocalParams = BaseChatModelParams & {
  modelPath: string;
  contextSize?: number;
  /** Default systemPrompt when no SystemMessage is present in the call. */
  defaultSystemPrompt?: string;
};

let sharedLlamaPromise: Promise<Llama> | null = null;
const modelCache = new Map<string, Promise<{ model: LlamaModel; context: LlamaContext }>>();
let inflight: Promise<unknown> | null = null;

async function getOrLoad(modelPath: string, contextSize: number) {
  const mod = await loadLlamaModule();
  if (!sharedLlamaPromise) sharedLlamaPromise = mod.getLlama();
  const llama = await sharedLlamaPromise;

  let cached = modelCache.get(modelPath);
  if (!cached) {
    cached = (async () => {
      const model = await llama.loadModel({ modelPath });
      const context = await model.createContext({ contextSize });
      return { model, context };
    })();
    modelCache.set(modelPath, cached);
  }
  return cached;
}

export class QwenLocalChatModel extends BaseChatModel<BaseChatModelCallOptions> {
  static override lc_name() {
    return 'QwenLocalChatModel';
  }

  override _llmType(): string {
    return 'qwen-local';
  }

  private readonly modelPath: string;
  private readonly contextSize: number;
  private readonly defaultSystemPrompt: string;

  constructor(params: QwenLocalParams) {
    super(params);
    this.modelPath = params.modelPath;
    this.contextSize = params.contextSize ?? 8192;
    this.defaultSystemPrompt =
      params.defaultSystemPrompt ??
      'You are Sable, a concise AI assistant embedded in a desktop browser.';
  }

  override async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun,
  ): AsyncGenerator<ChatGenerationChunk> {
    // Serialize concurrent requests through the single context. A second
    // generation triggered while another is running waits its turn.
    while (inflight) {
      try {
        await inflight;
      } catch {
        // ignore; next iteration will see inflight cleared
      }
    }

    const mod = await loadLlamaModule();
    const { context } = await getOrLoad(this.modelPath, this.contextSize);

    const { systemPrompt, history, lastUserText } = splitMessages(
      messages,
      this.defaultSystemPrompt,
    );

    const sequence = context.getSequence();
    const session = new mod.LlamaChatSession({
      contextSequence: sequence,
      systemPrompt,
    });
    if (history.length > 0) {
      try {
        session.setChatHistory(history);
      } catch (e) {
        process.stderr.write(`[qwen-local] setChatHistory failed: ${String(e)}\n`);
      }
    }

    // Producer / consumer bridge: onTextChunk fills `queue`; the async
    // iterator drains it. Resolves the awaiting promise when chunks arrive.
    const queue: string[] = [];
    let done = false;
    let errored: unknown = null;
    let wake: (() => void) | null = null;

    const wakeIfWaiting = () => {
      const w = wake;
      wake = null;
      if (w) w();
    };

    // Qwen3 emits <think>...</think> reasoning blocks before the actual
    // answer. They render as visible whitespace + jargon in the chat bubble.
    // Strip them inline so streaming UX is preserved for the real reply.
    const thinkFilter = new ThinkBlockFilter();
    const runPromise = session
      .prompt(lastUserText, {
        signal: options.signal,
        onTextChunk(chunk: string) {
          const visible = thinkFilter.process(chunk);
          if (visible) queue.push(visible);
          wakeIfWaiting();
        },
      })
      .then(
        () => {
          done = true;
          wakeIfWaiting();
        },
        (err) => {
          process.stderr.write(`[qwen-local] prompt threw: ${String(err)}\n`);
          done = true;
          errored = err;
          wakeIfWaiting();
        },
      )
      .finally(() => {
        // Free the context sequence so subsequent calls reuse the slot.
        try {
          sequence.dispose();
        } catch {
          // ignore
        }
      });

    inflight = runPromise;

    try {
      while (true) {
        if (queue.length > 0) {
          const chunk = queue.shift()!;
          // handleLLMNewToken is what makes the LangChain runtime emit
          // an `on_chat_model_stream` event. Custom BaseChatModels MUST call
          // this — the framework's auto-emission only kicks in for models
          // with `streaming: true` in their constructor (which routes
          // invoke() through stream() but is the wrong abstraction for us).
          await runManager?.handleLLMNewToken(chunk);
          yield new ChatGenerationChunk({
            message: new AIMessageChunk({ content: chunk }),
            text: chunk,
          });
          continue;
        }
        if (done) break;
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
      if (errored) {
        // Surface the error to the LangGraph runtime; aborts are normal.
        const aborted =
          options.signal?.aborted ||
          (errored instanceof Error && /aborted/i.test(errored.message));
        if (!aborted) throw errored;
      }
    } finally {
      // Make sure the run-promise has settled before clearing inflight, so
      // a subsequent caller doesn't try to dispose() a sequence we haven't
      // released yet.
      await runPromise.catch(() => {});
      if (inflight === runPromise) inflight = null;
    }
  }

  override async _generate(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun,
  ) {
    // _generate is invoked when callers use `.invoke()` instead of `.stream()`.
    // We still iterate _streamResponseChunks for streaming behavior internally
    // (and _streamResponseChunks already calls handleLLMNewToken per chunk).
    let text = '';
    for await (const chunk of this._streamResponseChunks(messages, options, runManager)) {
      text += chunk.text;
    }
    return {
      generations: [
        {
          text,
          message: new AIMessageChunk({ content: text }),
        },
      ],
    };
  }
}

/**
 * Split a LangChain message list into the parts node-llama-cpp wants:
 *  - systemPrompt (string) — the latest SystemMessage, or our default
 *  - history (ChatHistoryItem[]) — every preceding user/assistant turn
 *  - lastUserText — the most recent HumanMessage as the prompt to stream
 */
function splitMessages(
  messages: BaseMessage[],
  defaultSystemPrompt: string,
): { systemPrompt: string; history: ChatHistoryItem[]; lastUserText: string } {
  let systemPrompt = defaultSystemPrompt;
  // Walk backwards to find the last user message; it becomes the prompt.
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?._getType() === 'human') {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx === -1) {
    return { systemPrompt, history: [], lastUserText: '' };
  }

  const history: ChatHistoryItem[] = [];
  for (let i = 0; i < lastUserIdx; i++) {
    const m = messages[i];
    if (!m) continue;
    const type = m._getType();
    if (type === 'system') {
      systemPrompt = extractText(m.content);
    } else if (type === 'human') {
      history.push({ type: 'user', text: extractText(m.content) });
    } else if (type === 'ai') {
      history.push({
        type: 'model',
        response: [extractText(m.content)],
      });
    }
  }
  const lastUserText = extractText(messages[lastUserIdx]?.content);
  return { systemPrompt, history, lastUserText };
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  let out = '';
  for (const part of content) {
    if (typeof part === 'string') out += part;
    else if (
      part &&
      typeof part === 'object' &&
      'text' in part &&
      typeof (part as { text: unknown }).text === 'string'
    ) {
      out += (part as { text: string }).text;
    }
  }
  return out;
}

/**
 * Streaming filter that removes <think>...</think> reasoning blocks from
 * Qwen3 output. Buffers small tail to avoid emitting halves of marker tags
 * that span across chunk boundaries. State machine: outside-think (emitting)
 * vs inside-think (suppressing).
 */
class ThinkBlockFilter {
  private buffer = '';
  private inThink = false;
  private hasEmittedContent = false;
  private static readonly OPEN = '<think>';
  private static readonly CLOSE = '</think>';

  process(input: string): string {
    this.buffer += input;
    let out = '';
    while (this.buffer.length > 0) {
      if (this.inThink) {
        const endIdx = this.buffer.indexOf(ThinkBlockFilter.CLOSE);
        if (endIdx === -1) {
          const keep = ThinkBlockFilter.CLOSE.length - 1;
          if (this.buffer.length > keep) this.buffer = this.buffer.slice(-keep);
          break;
        }
        this.buffer = this.buffer.slice(endIdx + ThinkBlockFilter.CLOSE.length);
        this.inThink = false;
        // Eat any whitespace immediately after </think>.
        this.buffer = this.buffer.replace(/^\s+/, '');
      } else {
        const openIdx = this.buffer.indexOf(ThinkBlockFilter.OPEN);
        if (openIdx === -1) {
          const keep = ThinkBlockFilter.OPEN.length - 1;
          if (this.buffer.length > keep) {
            out += this.buffer.slice(0, -keep);
            this.buffer = this.buffer.slice(-keep);
          }
          break;
        }
        out += this.buffer.slice(0, openIdx);
        this.buffer = this.buffer.slice(openIdx + ThinkBlockFilter.OPEN.length);
        this.inThink = true;
      }
    }

    // Suppress all leading whitespace until we've emitted real content.
    // Models commonly start with a newline or two before any text; without
    // this trim the chat bubble shows visible empty space at the top.
    if (!this.hasEmittedContent) {
      const trimmed = out.replace(/^\s+/, '');
      if (trimmed.length > 0) this.hasEmittedContent = true;
      return trimmed;
    }
    return out;
  }
}
