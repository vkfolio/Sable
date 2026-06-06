import type { ProviderId } from '../../types';

export function ChatEmptyState({
  onOpenSettings,
  provider,
}: {
  onOpenSettings: () => void;
  provider: ProviderId;
}) {
  const message =
    provider === 'qwen-local'
      ? 'Sable can run a local model offline. Download Qwen 3 1.7B (~1.1 GB) — stored on disk, never leaves your machine.'
      : provider === 'anthropic'
      ? "Add your Anthropic API key — stored in your OS keychain, never plaintext."
      : provider === 'openai'
      ? "Add your OpenAI API key — stored in your OS keychain, never plaintext."
      : "Configure a provider in Settings to begin.";

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-4"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Soft pastel gradient orb echoing the AI glyph */}
      <div
        className="w-12 h-12 rounded-2xl shadow-2"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgb(var(--p-coral)), transparent 60%), radial-gradient(circle at 70% 70%, rgb(var(--p-lavender)), transparent 60%), rgb(var(--p-sky))',
        }}
      />
      <div className="text-base text-ink-1 leading-relaxed max-w-[260px]">
        Sable's chat needs a model to begin.
        <br />
        <span className="text-ink-2 text-sm">{message}</span>
      </div>
      <button
        onClick={onOpenSettings}
        className="px-3.5 h-[30px] text-sm font-medium text-ink-inv bg-ink-0 rounded-lg hover:brightness-110"
      >
        Open Settings
      </button>
    </div>
  );
}
