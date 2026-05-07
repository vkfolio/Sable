// SettingsDialog — multi-provider BYOK + per-provider model selection.
// Each provider keeps its own API key in the OS keychain. The "active"
// provider is what the chat orchestrator uses.

import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../state/settings';
import type { ProviderId } from '../../types';

type ProviderMeta = {
  id: ProviderId;
  label: string;
  models: { id: string; label: string }[];
  defaultModel: string;
  keyHint: string;
  available: boolean;
  disabledReason?: string;
};

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
      { id: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
    defaultModel: 'claude-sonnet-4-5',
    keyHint: 'sk-ant-…',
    available: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'gpt-5', label: 'GPT-5' },
      { id: 'gpt-5-mini', label: 'GPT-5 mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    ],
    defaultModel: 'gpt-5-mini',
    keyHint: 'sk-…',
    available: true,
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    models: [],
    defaultModel: 'llama3.2',
    keyHint: '—',
    available: false,
    disabledReason: 'Coming next slice',
  },
  {
    id: 'qwen-local',
    label: 'Qwen 3 (embedded)',
    models: [],
    defaultModel: 'qwen3-4b-instruct-2507',
    keyHint: '—',
    available: false,
    disabledReason: 'Phase 5',
  },
];

const PROVIDERS_BY_ID = Object.fromEntries(PROVIDERS.map((p) => [p.id, p])) as Record<
  ProviderId,
  ProviderMeta
>;

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const activeProvider = useSettingsStore((s) => s.activeProvider);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const providerKeyStatus = useSettingsStore((s) => s.providerKeyStatus);
  const setActiveProvider = useSettingsStore((s) => s.setActiveProvider);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const removeApiKey = useSettingsStore((s) => s.removeApiKey);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);

  // The dialog tracks a "viewed" provider that may differ from activeProvider
  // until the user clicks "Make active". This way the user can configure a
  // key for one provider without changing what the chat is talking to.
  const [viewedProvider, setViewedProvider] = useState<ProviderId>(activeProvider);
  const meta = PROVIDERS_BY_ID[viewedProvider];

  const [keyInput, setKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Tab WebContentsViews sit above the chrome in z-order; without this,
  // the centered modal renders behind whatever tab is mounted in the pane
  // area. Acquire the overlay on mount, release on unmount.
  useEffect(() => {
    void window.sable.chrome.setOverlay(true);
    return () => {
      void window.sable.chrome.setOverlay(false);
    };
  }, []);

  // Reset key input when switching providers.
  useEffect(() => {
    setKeyInput('');
    setKeySaved(false);
  }, [viewedProvider]);

  const hasKey = !!providerKeyStatus[viewedProvider];
  const isActiveView = viewedProvider === activeProvider;

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await setApiKey(viewedProvider, keyInput.trim());
      setKeyInput('');
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    setSaving(true);
    try {
      await removeApiKey(viewedProvider);
    } finally {
      setSaving(false);
    }
  };

  const handleMakeActive = async () => {
    setSaving(true);
    try {
      await setActiveProvider(viewedProvider);
      // If the currently-selected model isn't valid for this provider, switch
      // to the provider's default. Heuristic: model id doesn't appear in any
      // of the provider's listed defaults.
      const known = meta.models.some((m) => m.id === selectedModel);
      if (!known) await setSelectedModel(meta.defaultModel);
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = async (id: string) => {
    if (isActiveView) await setSelectedModel(id);
    // If the user is configuring a non-active provider, model selection only
    // applies once they click "Make active". Future improvement: per-provider
    // selectedModel persistence.
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div
        className="w-[480px] bg-bg-2 border border-border-strong rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-semibold text-fg">Settings</span>
          <button
            onClick={onClose}
            className="text-fg-mute hover:text-fg text-base leading-none"
            title="Close"
          >
            ×
          </button>
        </header>

        <section className="px-5 py-4 space-y-4">
          {/* Provider tabs */}
          <div>
            <label className="block text-2xs font-semibold tracking-wider uppercase text-fg-dim mb-1.5">
              Provider
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PROVIDERS.map((p) => (
                <ProviderPill
                  key={p.id}
                  meta={p}
                  isViewed={p.id === viewedProvider}
                  isActive={p.id === activeProvider}
                  hasKey={!!providerKeyStatus[p.id]}
                  onClick={() => p.available && setViewedProvider(p.id)}
                />
              ))}
            </div>
          </div>

          {!isActiveView && meta.available && (
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-3 border border-border-strong rounded-md text-sm text-fg-mute">
              <span className="flex-1">
                {meta.label} is configured but not active.
              </span>
              <button
                onClick={() => void handleMakeActive()}
                disabled={saving}
                className="px-2.5 py-1 text-2xs font-medium text-accent-fg bg-accent rounded hover:opacity-90 disabled:opacity-40"
              >
                Make active
              </button>
            </div>
          )}

          {meta.available && meta.models.length > 0 && (
            <div>
              <label className="block text-2xs font-semibold tracking-wider uppercase text-fg-dim mb-1.5">
                Model
              </label>
              <select
                value={isActiveView ? selectedModel : meta.defaultModel}
                onChange={(e) => void handleModelChange(e.target.value)}
                disabled={!isActiveView}
                className="w-full px-3 py-2 bg-bg-3 border border-border-strong rounded-md text-base text-fg outline-none focus:border-accent disabled:opacity-50"
              >
                {meta.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
                {isActiveView &&
                  !meta.models.find((m) => m.id === selectedModel) && (
                    <option value={selectedModel}>{selectedModel} (custom)</option>
                  )}
              </select>
              <p className="mt-1 text-2xs text-fg-dim">
                Custom model ids accepted; type any current model name supported by the provider.
              </p>
            </div>
          )}

          {meta.available && (
            <div>
              <label className="block text-2xs font-semibold tracking-wider uppercase text-fg-dim mb-1.5">
                API Key
              </label>
              {hasKey ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-bg-3 border border-border-strong rounded-md text-base text-fg-mute">
                    ●●●●●●●● <span className="text-2xs ml-1.5">stored in OS keychain</span>
                  </div>
                  <button
                    onClick={() => void handleRemoveKey()}
                    disabled={saving}
                    className="px-3 py-2 text-sm text-fg-mute bg-bg-3 border border-border-strong rounded-md hover:text-fg disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={meta.keyHint}
                    className="flex-1 px-3 py-2 bg-bg-3 border border-border-strong rounded-md text-base text-fg outline-none focus:border-accent placeholder:text-fg-dim font-mono"
                  />
                  <button
                    onClick={() => void handleSaveKey()}
                    disabled={saving || !keyInput.trim()}
                    className="px-3 py-2 text-sm text-accent-fg bg-accent rounded-md hover:opacity-90 disabled:opacity-30 disabled:cursor-default"
                  >
                    Save
                  </button>
                </div>
              )}
              {keySaved && (
                <p className="mt-1.5 text-2xs text-emerald-400">Saved to OS keychain.</p>
              )}
              <ProviderKeyHint provider={meta.id} />
            </div>
          )}

          {!meta.available && (
            <div className="px-3 py-3 bg-bg-3 border border-border-strong rounded-md text-sm text-fg-mute">
              {meta.label}: {meta.disabledReason ?? 'Not yet supported'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProviderPill({
  meta,
  isViewed,
  isActive,
  hasKey,
  onClick,
}: {
  meta: ProviderMeta;
  isViewed: boolean;
  isActive: boolean;
  hasKey: boolean;
  onClick: () => void;
}) {
  const base =
    'px-3 py-2 rounded-md border text-sm text-left transition-colors flex items-center gap-2 cursor-pointer';
  const tone = !meta.available
    ? 'bg-bg-3 border-border-strong text-fg-dim cursor-not-allowed'
    : isViewed
    ? 'bg-accent/15 border-accent text-fg'
    : 'bg-bg-3 border-border-strong text-fg-mute hover:text-fg hover:border-fg-dim';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!meta.available}
      className={`${base} ${tone}`}
    >
      <span className="flex-1 truncate">{meta.label}</span>
      {hasKey && (
        <span className="text-2xs px-1 py-0.5 rounded bg-bg-4 text-fg-mute" title="API key set">key</span>
      )}
      {isActive && (
        <span className="text-2xs px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300" title="Active provider">●</span>
      )}
    </button>
  );
}

function ProviderKeyHint({ provider }: { provider: ProviderId }) {
  if (provider === 'anthropic') {
    return (
      <p className="mt-1.5 text-2xs text-fg-dim">
        Get a key at <code className="text-fg-mute">console.anthropic.com</code>. Stored via OS
        keychain — never plaintext, never exposed to the chrome.
      </p>
    );
  }
  if (provider === 'openai') {
    return (
      <p className="mt-1.5 text-2xs text-fg-dim">
        Get a key at <code className="text-fg-mute">platform.openai.com/api-keys</code>. Stored via
        OS keychain — never plaintext, never exposed to the chrome.
      </p>
    );
  }
  return null;
}
