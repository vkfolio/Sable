// Chat — bottom-of-sidebar chat panel. Reduces AG-UI events into a
// scrollable message list with a textarea composer below.

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '../../state/chat';
import { useSettingsStore } from '../../state/settings';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { ChatEmptyState } from './ChatEmptyState';
import type { Citation } from '../../types';

/**
 * Format a user message that includes attached citations. The LLM sees a
 * markdown-quoted block per citation followed by the user's own text. We
 * keep this client-side for V0.1 — Phase 4 will move citation handling
 * into the chat orchestrator's StateGraph as part of a retrieve node.
 */
function formatMessageWithCitations(text: string, citations: Citation[]): string {
  if (citations.length === 0) return text;
  const parts: string[] = [];
  for (const c of citations) {
    parts.push(`> ${c.text}`);
    parts.push(`> — [${c.title || c.url}](${c.url})`);
    parts.push('');
  }
  parts.push(text);
  return parts.join('\n');
}

export function Chat({ onOpenSettings }: { onOpenSettings: () => void }) {
  const conversationId = useChatStore((s) => s.conversationId);
  const messages = useChatStore(useShallow((s) => s.messages));
  const inflight = useChatStore((s) => s.inflight);
  const lastError = useChatStore((s) => s.lastError);
  const activeRunId = useChatStore((s) => s.activeRunId);
  const pushUserMessage = useChatStore((s) => s.pushUserMessage);
  const setActiveRun = useChatStore((s) => s.setActiveRun);

  const activeProvider = useSettingsStore((s) => s.activeProvider);
  const providerKeyStatus = useSettingsStore((s) => s.providerKeyStatus);
  const hasKey = !!providerKeyStatus[activeProvider];

  const [composerText, setComposerText] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);

  // Hydrate history once on mount.
  useEffect(() => {
    void window.sable.chat
      .getHistory(conversationId)
      .then((h) => useChatStore.getState().hydrate(h));
  }, [conversationId]);

  const handleSubmit = async () => {
    const userText = composerText.trim();
    // Allow send if there's at least typed text OR attached citations.
    if (!hasKey || inflight) return;
    if (!userText && citations.length === 0) return;

    const formatted = formatMessageWithCitations(
      userText || '(see citation above)',
      citations,
    );
    pushUserMessage(formatted);
    setComposerText('');
    setCitations([]);

    try {
      const runId = await window.sable.chat.send(conversationId, formatted);
      setActiveRun(runId);
    } catch (err) {
      console.error('chat send failed', err);
    }
  };

  const handleStop = () => {
    if (activeRunId) void window.sable.chat.stop(activeRunId);
  };

  const handleAddCitation = (c: Citation) => {
    setCitations((prev) => [...prev, c]);
  };

  const handleRemoveCitation = (id: string) => {
    setCitations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {messages.length === 0 && !hasKey ? (
        <ChatEmptyState onOpenSettings={onOpenSettings} />
      ) : (
        <MessageList messages={messages} />
      )}
      {lastError && (
        <div className="px-4 py-2 text-2xs text-red-300 bg-red-900/20 border-t border-red-900/40">
          {lastError}
        </div>
      )}
      <Composer
        value={composerText}
        onChange={setComposerText}
        onSubmit={handleSubmit}
        onStop={handleStop}
        disabled={!hasKey}
        inflight={inflight}
        placeholderHint={
          !hasKey
            ? 'Add an API key in Settings to begin…'
            : citations.length > 0
            ? 'Ask about the citation…'
            : 'Ask anything · drag a paragraph here to cite'
        }
        citations={citations}
        onAddCitation={handleAddCitation}
        onRemoveCitation={handleRemoveCitation}
      />
    </div>
  );
}
