import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../state/chat';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message on every update.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, messages[messages.length - 1]?.text]);

  return (
    <div
      className="flex-1 min-h-0 overflow-auto px-3 py-3 space-y-2.5"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {messages.map((m) => (
        <Bubble key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-lg rounded-tr-sm bg-bg-4 px-3 py-2 text-base text-fg whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="max-w-[92%] rounded-lg rounded-tl-sm bg-bg-3 px-3 py-2 text-base text-fg whitespace-pre-wrap">
        {message.text}
        {message.streaming && (
          <span className="inline-block w-1.5 h-3 bg-fg-mute ml-0.5 align-middle animate-pulse" />
        )}
        {message.error && (
          <div className="mt-1.5 text-2xs text-red-300">⚠ {message.error}</div>
        )}
      </div>
    </div>
  );
}
