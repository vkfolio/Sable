// agui-translator — convert LangGraphJS streamEvents (v2) into AG-UI events.
//
// AG-UI is the Agent-User Interaction Protocol (https://docs.ag-ui.com).
// We adopt its event schema instead of inventing a custom one — gets us
// tool calls, state snapshots, and human-in-the-loop event types for free
// when V0.2 lands. For Phase 2 we only emit the lifecycle + text-message
// subset; the translator gains tool/state branches as we add features.
//
// This is hand-rolled because @ag-ui/langgraph (the npm adapter) targets
// LangGraph Platform (cloud), not local LangGraphJS run in-process.
// 100-ish lines is a clean trade vs that adapter's transitive deps.

import type { StreamEvent } from '@langchain/core/tracers/log_stream';
import {
  EventType,
  type RunStartedEvent,
  type RunFinishedEvent,
  type RunErrorEvent,
  type TextMessageStartEvent,
  type TextMessageContentEvent,
  type TextMessageEndEvent,
  type BaseEvent,
} from '@ag-ui/core';

export type AGUIEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | BaseEvent;

export type TranslatorContext = {
  threadId: string;
  runId: string;
  /**
   * Bookkeeping the translator owns: the messageId for the currently-open
   * assistant message (if any). One LangGraph run can produce multiple
   * messages (e.g., a tool-call sequence produces tool messages then a
   * follow-up assistant message); we open/close them as model events fire.
   */
  openMessageId?: string;
};

/**
 * Translate one LangChain stream event into zero or more AG-UI events.
 * Mutates `ctx` to track in-flight message IDs across calls.
 */
export function translateEvent(
  event: StreamEvent,
  ctx: TranslatorContext,
): AGUIEvent[] {
  switch (event.event) {
    case 'on_chat_model_start': {
      const messageId = newMessageId();
      ctx.openMessageId = messageId;
      const start: TextMessageStartEvent = {
        type: EventType.TEXT_MESSAGE_START,
        messageId,
        role: 'assistant',
      };
      return [start];
    }

    case 'on_chat_model_stream': {
      const messageId = ctx.openMessageId;
      if (!messageId) return [];
      const chunk = (event.data as { chunk?: { content?: unknown } }).chunk;
      const delta = extractText(chunk?.content);
      if (!delta) return [];
      const evt: TextMessageContentEvent = {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta,
      };
      return [evt];
    }

    case 'on_chat_model_end': {
      const messageId = ctx.openMessageId;
      if (!messageId) return [];
      ctx.openMessageId = undefined;
      const evt: TextMessageEndEvent = {
        type: EventType.TEXT_MESSAGE_END,
        messageId,
      };
      return [evt];
    }

    default:
      // Ignore other events for Phase 2. on_tool_start, on_tool_end,
      // on_chain_end branches arrive when we add tool calling and
      // state-snapshot emissions.
      return [];
  }
}

export function makeRunStarted(ctx: TranslatorContext): RunStartedEvent {
  return {
    type: EventType.RUN_STARTED,
    threadId: ctx.threadId,
    runId: ctx.runId,
  };
}

export function makeRunFinished(ctx: TranslatorContext): RunFinishedEvent {
  return {
    type: EventType.RUN_FINISHED,
    threadId: ctx.threadId,
    runId: ctx.runId,
  };
}

export function makeRunError(ctx: TranslatorContext, message: string): RunErrorEvent {
  return {
    type: EventType.RUN_ERROR,
    message,
  };
}

// ---- helpers ----

function newMessageId(): string {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** LangChain message content can be string | MessageContentComplex[]; coerce to text. */
function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    let out = '';
    for (const part of content) {
      if (typeof part === 'string') out += part;
      else if (part && typeof part === 'object' && 'text' in part && typeof (part as { text: unknown }).text === 'string') {
        out += (part as { text: string }).text;
      }
    }
    return out;
  }
  return '';
}
