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
          {renderInline(message.text)}
        </div>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="max-w-[92%] rounded-lg rounded-tl-sm bg-bg-3 px-3 py-2 text-base text-fg whitespace-pre-wrap">
        {renderInline(message.text)}
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

/**
 * Lightweight inline renderer: handles markdown image syntax `![alt](url)`,
 * which is how Chat.tsx injects user-attached image citations. Everything
 * else renders as plain text. Phase 4+ may swap in react-markdown for
 * richer assistant formatting (code, lists, etc.).
 */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match markdown image ![alt](url). The url can be a long data: URI so we
  // need a non-greedy match that doesn't choke on commas.
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <img
        key={key++}
        src={match[2]}
        alt={match[1]}
        className="block max-w-full max-h-64 rounded my-1.5 object-contain bg-bg-3"
      />,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return parts.length > 0 ? parts : [text];
}
