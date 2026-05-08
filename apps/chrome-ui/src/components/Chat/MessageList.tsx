import { useEffect, useRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 text-ink-0">
      <MetaLine />
      <div className="markdown text-base leading-snug">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {message.text}
        </ReactMarkdown>
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

/**
 * Tailwind-styled overrides for react-markdown's default elements. Tight
 * vertical rhythm (matches the chat's compact density) and Sable colors via
 * CSS vars rather than baked-in hexes.
 */
const mdComponents: Components = {
  p: ({ node: _node, ...props }) => (
    <p className="my-1.5 first:mt-0 last:mb-0" {...props} />
  ),
  a: ({ node: _node, ...props }) => (
    <a
      className="text-acc-ink underline decoration-acc/40 underline-offset-2 hover:decoration-acc"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="my-1.5 pl-5 list-disc marker:text-ink-3" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="my-1.5 pl-5 list-decimal marker:text-ink-3" {...props} />
  ),
  li: ({ node: _node, ...props }) => <li className="my-0.5" {...props} />,
  h1: ({ node: _node, ...props }) => (
    <h1 className="text-lg font-semibold mt-2 mb-1.5 text-ink-0" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2 className="text-base font-semibold mt-2 mb-1.5 text-ink-0" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3 className="text-sm font-semibold mt-2 mb-1 text-ink-0 uppercase tracking-wide" {...props} />
  ),
  strong: ({ node: _node, ...props }) => (
    <strong className="font-semibold text-ink-0" {...props} />
  ),
  em: ({ node: _node, ...props }) => <em className="italic text-ink-1" {...props} />,
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="my-2 border-l-2 border-acc/50 pl-3 text-ink-1"
      {...props}
    />
  ),
  hr: () => <hr className="my-3 border-line" />,
  code: ({ node: _node, className, children, ...props }) => {
    // react-markdown v9 routes both inline and fenced code through this
    // single component. Fenced code is a `<code>` inside a `<pre>` and gets
    // a `language-xxx` class; inline code has none.
    const isFenced = typeof className === 'string' && className.startsWith('language-');
    if (isFenced) {
      return (
        <code className={`${className} font-mono text-[12.5px]`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="font-mono text-[12.5px] bg-surface-3 text-ink-0 px-1 py-[1px] rounded border border-line"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ node: _node, ...props }) => (
    <pre
      className="my-2 p-3 rounded-lg bg-surface-3 border border-line overflow-x-auto text-[12.5px] leading-relaxed font-mono"
      {...props}
    />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => (
    <th className="px-2 py-1 border border-line text-left font-semibold bg-surface-3" {...props} />
  ),
  td: ({ node: _node, ...props }) => (
    <td className="px-2 py-1 border border-line align-top" {...props} />
  ),
  img: ({ node: _node, alt, src, ...props }) => (
    <img
      src={src}
      alt={alt ?? ''}
      className="block max-w-full max-h-64 rounded-lg my-1.5 object-contain bg-surface-3 border border-line"
      {...props}
    />
  ),
};
