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
      ? "Add your Anthropic API key — it's stored in your OS keychain, never in plaintext."
      : provider === 'openai'
      ? "Add your OpenAI API key — it's stored in your OS keychain, never in plaintext."
      : "Configure a provider in Settings to begin.";

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div className="text-sm text-fg-mute leading-relaxed mb-4">
        Sable's chat needs a model to begin.
        <br />
        {message}
      </div>
      <button
        onClick={onOpenSettings}
        className="px-3 py-1.5 text-sm text-accent-fg bg-accent rounded-md hover:opacity-90"
      >
        Open Settings
      </button>
    </div>
  );
}
