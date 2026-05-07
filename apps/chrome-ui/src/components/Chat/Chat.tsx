// Chat — bottom-of-sidebar chat panel. Reduces AG-UI events into a
// scrollable message list with a textarea composer below.

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '../../state/chat';
import { useSettingsStore } from '../../state/settings';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { ChatEmptyState } from './ChatEmptyState';

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

  // Hydrate history once on mount.
  useEffect(() => {
    void window.sable.chat
      .getHistory(conversationId)
      .then((h) => useChatStore.getState().hydrate(h));
  }, [conversationId]);

  const [composerText, setComposerText] = useState('');

  const handleSubmit = async () => {
    const text = composerText.trim();
    if (!text || !hasKey || inflight) return;
    pushUserMessage(text);
    setComposerText('');
    try {
      const runId = await window.sable.chat.send(conversationId, text);
      setActiveRun(runId);
    } catch (err) {
      // RUN_ERROR will normally come through via agent-event; surface ipc-level errors too.
      console.error('chat send failed', err);
    }
  };

  const handleStop = () => {
    if (activeRunId) void window.sable.chat.stop(activeRunId);
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
          !hasKey ? 'Add an API key in Settings to begin…' : 'Ask anything…'
        }
      />
    </div>
  );
}
