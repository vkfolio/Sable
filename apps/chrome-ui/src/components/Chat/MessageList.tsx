import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../state/settings';
import type { ChatMessage } from '../../state/chat';

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, messages[messages.length - 1]?.text]);

  return (
    <div
      className="flex-1 min-h-0 overflow-auto px-3.5 py-3.5 flex flex-col gap-3.5"
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
        <div className="max-w-[88%] rounded-[14px] rounded-tr-[3px] bg-surface-3 text-ink-0 px-3 py-2 text-base whitespace-pre-wrap leading-snug">
          {renderInline(message.text)}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 text-ink-0">
      <MetaLine />
      <div className="text-base leading-snug whitespace-pre-wrap">
        {renderInline(message.text)}
        {message.streaming && (
          <span className="inline-block w-[7px] h-3 bg-ink-0 ml-0.5 align-[-2px] animate-blink-caret" />
        )}
      </div>
      {message.error && (
        <div className="text-[10px] text-bad">⚠ {message.error}</div>
      )}
    </div>
  );
}

function MetaLine() {
  const provider = useSettingsStore((s) => s.activeProvider);
  const model = useSettingsStore((s) => s.selectedModel);
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-2">
      <span className="inline-block w-[5px] h-[5px] rounded-full bg-ok shadow-[0_0_0_3px_rgb(var(--ok)/0.18)]" />
      <span>{provider} · {model}</span>
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
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
        className="block max-w-full max-h-64 rounded-lg my-1.5 object-contain bg-surface-3 border border-line"
      />,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return parts.length > 0 ? parts : [text];
}
