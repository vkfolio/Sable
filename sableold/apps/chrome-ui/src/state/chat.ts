// Chat store — reduces AG-UI events from main into a flat list of UI
// messages. AG-UI text-message events have an explicit lifecycle
// (TEXT_MESSAGE_START -> ...CONTENT* -> END) so we open a streaming message
// on START and append to it until END. Tool-call / state events arrive in
// V0.2; their reducer branches go here.

import { create } from 'zustand';
import { EventType } from '@ag-ui/core';
import type { AgentEvent, ChatHistoryMessage } from '../types';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  /** AG-UI message id for assistant messages; client-side id for user messages. */
  id: string;
  role: ChatRole;
  text: string;
  /** True while we're still receiving CONTENT events for this message. */
  streaming: boolean;
  /** Set when RUN_ERROR arrives during streaming. */
  error?: string;
};

type ChatStore = {
  conversationId: string;
  messages: ChatMessage[];
  /** Current run, if any. Null when no chat is in flight. */
  activeRunId: string | null;
  inflight: boolean;
  lastError: string | null;

  applyEvent: (event: AgentEvent) => void;
  pushUserMessage: (text: string) => void;
  setActiveRun: (runId: string | null) => void;
  hydrate: (history: ChatHistoryMessage[]) => void;
  clear: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  conversationId: 'default',
  messages: [],
  activeRunId: null,
  inflight: false,
  lastError: null,

  pushUserMessage: (text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: 'user',
          text,
          streaming: false,
        },
      ],
      lastError: null,
    })),

  setActiveRun: (runId) => set({ activeRunId: runId, inflight: !!runId }),

  hydrate: (history) =>
    set({
      messages: history.map((m, idx) => ({
        id: `hydrated-${idx}`,
        role: m.role,
        text: m.text,
        streaming: false,
      })),
      lastError: null,
    }),

  clear: () => set({ messages: [], lastError: null, activeRunId: null, inflight: false }),

  applyEvent: (event) => {
    const t = event.type as EventType;
    switch (t) {
      case EventType.RUN_STARTED:
        set({ inflight: true, lastError: null });
        break;

      case EventType.RUN_FINISHED: {
        // Mark any still-streaming messages as done (defensive — END should
        // already have closed them).
        const cur = get().messages.map((m) =>
          m.streaming ? { ...m, streaming: false } : m,
        );
        set({ messages: cur, inflight: false, activeRunId: null });
        break;
      }

      case EventType.RUN_ERROR: {
        const message = (event as unknown as { message?: string }).message ?? 'Unknown error';
        const cur = get().messages.map((m) =>
          m.streaming ? { ...m, streaming: false, error: message } : m,
        );
        set({ messages: cur, inflight: false, activeRunId: null, lastError: message });
        break;
      }

      case EventType.TEXT_MESSAGE_START: {
        const e = event as unknown as { messageId: string; role?: string };
        const role: ChatRole = e.role === 'user' ? 'user' : 'assistant';
        set((s) => ({
          messages: [
            ...s.messages,
            { id: e.messageId, role, text: '', streaming: true },
          ],
        }));
        break;
      }

      case EventType.TEXT_MESSAGE_CONTENT: {
        const e = event as unknown as { messageId: string; delta: string };
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === e.messageId && m.streaming
              ? { ...m, text: m.text + e.delta }
              : m,
          ),
        }));
        break;
      }

      case EventType.TEXT_MESSAGE_END: {
        const e = event as unknown as { messageId: string };
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === e.messageId ? { ...m, streaming: false } : m,
          ),
        }));
        break;
      }

      // V0.2: TOOL_CALL_*, STATE_*, REASONING_* branches go here.
      default:
        // Ignore unknown event types — AG-UI may add new ones; future-proof.
        break;
    }
  },
}));
