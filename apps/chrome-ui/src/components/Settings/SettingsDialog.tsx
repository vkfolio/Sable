// SettingsDialog — multi-provider BYOK + local-model download/select.
//
// Each remote provider keeps its own API key in the OS keychain. The local
// provider doesn't use a key — it manages a registry of GGUF model variants
// downloaded into userData/models. The "active" provider is what the chat
// orchestrator uses; for qwen-local the selectedModel is the variant id.

import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../state/settings';
import { useLocalModelStore } from '../../state/local-model';
import { useSpacesStore } from '../../state/spaces';
import type {
  LocalModelStatus,
  LocalModelVariantId,
  ProviderId,
  SpaceSummary,
} from '../../types';

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
    id: 'qwen-local',
    label: 'Qwen 3 (embedded)',
    models: [],
    defaultModel: 'qwen3-1.7b-q4',
    keyHint: '—',
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

  const localStatuses = useLocalModelStore(useShallow((s) => s.statuses));
  const refreshLocal = useLocalModelStore((s) => s.refresh);

  const [viewedProvider, setViewedProvider] = useState<ProviderId>(activeProvider);
  const meta = PROVIDERS_BY_ID[viewedProvider];

  const [keyInput, setKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    void window.sable.chrome.setOverlay(true);
    void refreshLocal();
    return () => {
      void window.sable.chrome.setOverlay(false);
    };
  }, [refreshLocal]);

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
      const known =
        viewedProvider === 'qwen-local'
          ? localStatuses.some((s) => s.id === selectedModel)
          : meta.models.some((m) => m.id === selectedModel);
      if (!known) await setSelectedModel(meta.defaultModel);
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = async (id: string) => {
    if (isActiveView) await setSelectedModel(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <div
        className="w-[520px] max-h-[88vh] bg-bg-2 border border-border-strong rounded-xl shadow-2xl overflow-hidden flex flex-col"
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

        <section className="px-5 py-4 space-y-4 overflow-auto">
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
                  hasLocal={
                    p.id === 'qwen-local' && localStatuses.some((s) => s.state === 'ready')
                  }
                  onClick={() => p.available && setViewedProvider(p.id)}
                />
              ))}
            </div>
          </div>

          {!isActiveView && meta.available && (
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-3 border border-border-strong rounded-md text-sm text-fg-mute">
              <span className="flex-1">{meta.label} is configured but not active.</span>
              <button
                onClick={() => void handleMakeActive()}
                disabled={saving}
                className="px-2.5 py-1 text-2xs font-medium text-accent-fg bg-accent rounded hover:opacity-90 disabled:opacity-40"
              >
                Make active
              </button>
            </div>
          )}

          {viewedProvider === 'qwen-local' ? (
            <QwenLocalSection
              statuses={localStatuses}
              isActiveProvider={isActiveView}
              selectedVariantId={isActiveView ? (selectedModel as LocalModelVariantId) : undefined}
              onSelect={(id) => void handleModelChange(id)}
            />
          ) : (
            <RemoteProviderSection
              meta={meta}
              isActiveView={isActiveView}
              selectedModel={selectedModel}
              hasKey={hasKey}
              keyInput={keyInput}
              setKeyInput={setKeyInput}
              keySaved={keySaved}
              saving={saving}
              onSaveKey={() => void handleSaveKey()}
              onRemoveKey={() => void handleRemoveKey()}
              onModelChange={(id) => void handleModelChange(id)}
            />
          )}

          {!meta.available && (
            <div className="px-3 py-3 bg-bg-3 border border-border-strong rounded-md text-sm text-fg-mute">
              {meta.label}: {meta.disabledReason ?? 'Not yet supported'}
            </div>
          )}

          <div className="border-t border-border pt-4">
            <SpacesSection />
          </div>
        </section>
      </div>
    </div>
  );
}

// ---- Spaces management ----

const ACCENT_OPTIONS = [
  '#6b7cff',
  '#7adabf',
  '#f59e0b',
  '#f472b6',
  '#a78bfa',
  '#fb7185',
];

function SpacesSection() {
  const spaces = useSpacesStore(useShallow((s) => s.spaces));
  const activeSpaceId = useSpacesStore((s) => s.activeSpaceId);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const submitNew = async () => {
    const name = newName.trim();
    setAdding(false);
    setNewName('');
    if (name) await window.sable.spaces.create(name);
  };

  return (
    <div>
      <label className="block text-2xs font-semibold tracking-wider uppercase text-fg-dim mb-1.5">
        Spaces
      </label>
      <p className="text-2xs text-fg-dim mb-2">
        Each space has its own tabs, layout, and chat history. Switch from the titlebar.
      </p>
      <div className="space-y-1.5">
        {spaces.map((s) => (
          <SpaceRow
            key={s.id}
            space={s}
            canDelete={spaces.length > 1}
            isActive={s.id === activeSpaceId}
          />
        ))}
        {adding ? (
          <div className="flex items-center gap-2 px-2.5 py-2 bg-bg-3 border border-accent rounded-md">
            <span className="inline-block w-3 h-3 rounded-full bg-fg-dim" />
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => void submitNew()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setNewName('');
                  setAdding(false);
                }
              }}
              placeholder="Space name…"
              className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-dim"
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-bg-3 border border-border-strong rounded-md text-sm text-fg-mute hover:text-fg hover:border-fg-dim"
          >
            <span className="text-base leading-none">+</span>
            <span>New space</span>
          </button>
        )}
      </div>
    </div>
  );
}

function SpaceRow({
  space,
  canDelete,
  isActive,
}: {
  space: SpaceSummary;
  canDelete: boolean;
  isActive: boolean;
}) {
  const [name, setName] = useState(space.name);
  const [accentOpen, setAccentOpen] = useState(false);
  const accentRef = useRef<HTMLDivElement>(null);

  useEffect(() => setName(space.name), [space.name]);

  // Click-away for accent picker
  useEffect(() => {
    if (!accentOpen) return;
    const handler = (e: MouseEvent) => {
      if (accentRef.current && !accentRef.current.contains(e.target as Node)) {
        setAccentOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accentOpen]);

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== space.name) {
      void window.sable.spaces.rename(space.id, trimmed);
    } else {
      setName(space.name);
    }
  };

  const handlePickAccent = (color: string) => {
    void window.sable.spaces.setAccent(space.id, color);
    setAccentOpen(false);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    void window.sable.spaces.remove(space.id);
  };

  return (
    <div className="flex items-center gap-2 px-2.5 py-2 bg-bg-3 border border-border-strong rounded-md">
      <div ref={accentRef} className="relative shrink-0">
        <button
          onClick={() => setAccentOpen((v) => !v)}
          title="Change accent"
          className="w-3 h-3 rounded-full ring-1 ring-border-strong hover:ring-fg-dim"
          style={{ background: space.accent }}
        />
        {accentOpen && (
          <div className="absolute top-full left-0 mt-1.5 z-10 flex gap-1.5 bg-bg-2 border border-border-strong rounded-lg p-2 shadow-lg">
            {ACCENT_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => handlePickAccent(c)}
                className={`w-5 h-5 rounded-full ring-1 transition-all ${
                  c === space.accent ? 'ring-fg' : 'ring-border-strong hover:ring-fg-dim'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        )}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setName(space.name);
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="flex-1 px-2 py-0.5 bg-transparent border border-transparent rounded text-sm text-fg outline-none focus:bg-bg-2 focus:border-border-strong"
      />
      {isActive && (
        <span className="text-2xs px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
          active
        </span>
      )}
      <button
        onClick={handleDelete}
        disabled={!canDelete}
        title={canDelete ? 'Delete space' : 'Cannot delete the last space'}
        className="text-fg-dim hover:text-red-300 disabled:opacity-30 disabled:cursor-default leading-none px-1 text-base"
      >
        ×
      </button>
    </div>
  );
}

// ---- subcomponents ----

function ProviderPill({
  meta,
  isViewed,
  isActive,
  hasKey,
  hasLocal,
  onClick,
}: {
  meta: ProviderMeta;
  isViewed: boolean;
  isActive: boolean;
  hasKey: boolean;
  hasLocal: boolean;
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
    <button type="button" onClick={onClick} disabled={!meta.available} className={`${base} ${tone}`}>
      <span className="flex-1 truncate">{meta.label}</span>
      {hasKey && (
        <span className="text-2xs px-1 py-0.5 rounded bg-bg-4 text-fg-mute" title="API key set">
          key
        </span>
      )}
      {hasLocal && (
        <span
          className="text-2xs px-1 py-0.5 rounded bg-bg-4 text-fg-mute"
          title="At least one model downloaded"
        >
          gguf
        </span>
      )}
      {isActive && (
        <span
          className="text-2xs px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300"
          title="Active provider"
        >
          ●
        </span>
      )}
    </button>
  );
}

function RemoteProviderSection({
  meta,
  isActiveView,
  selectedModel,
  hasKey,
  keyInput,
  setKeyInput,
  keySaved,
  saving,
  onSaveKey,
  onRemoveKey,
  onModelChange,
}: {
  meta: ProviderMeta;
  isActiveView: boolean;
  selectedModel: string;
  hasKey: boolean;
  keyInput: string;
  setKeyInput: (s: string) => void;
  keySaved: boolean;
  saving: boolean;
  onSaveKey: () => void;
  onRemoveKey: () => void;
  onModelChange: (id: string) => void;
}) {
  return (
    <>
      {meta.models.length > 0 && (
        <div>
          <label className="block text-2xs font-semibold tracking-wider uppercase text-fg-dim mb-1.5">
            Model
          </label>
          <select
            value={isActiveView ? selectedModel : meta.defaultModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={!isActiveView}
            className="w-full px-3 py-2 bg-bg-3 border border-border-strong rounded-md text-base text-fg outline-none focus:border-accent disabled:opacity-50"
          >
            {meta.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
            {isActiveView && !meta.models.find((m) => m.id === selectedModel) && (
              <option value={selectedModel}>{selectedModel} (custom)</option>
            )}
          </select>
        </div>
      )}

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
              onClick={onRemoveKey}
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
              onClick={onSaveKey}
              disabled={saving || !keyInput.trim()}
              className="px-3 py-2 text-sm text-accent-fg bg-accent rounded-md hover:opacity-90 disabled:opacity-30 disabled:cursor-default"
            >
              Save
            </button>
          </div>
        )}
        {keySaved && <p className="mt-1.5 text-2xs text-emerald-400">Saved to OS keychain.</p>}
        <p className="mt-1.5 text-2xs text-fg-dim">
          {meta.id === 'anthropic' && (
            <>
              Get a key at <code className="text-fg-mute">console.anthropic.com</code>.
            </>
          )}
          {meta.id === 'openai' && (
            <>
              Get a key at <code className="text-fg-mute">platform.openai.com/api-keys</code>.
            </>
          )}{' '}
          Stored via OS keychain — never plaintext, never exposed to the chrome.
        </p>
      </div>
    </>
  );
}

function QwenLocalSection({
  statuses,
  isActiveProvider,
  selectedVariantId,
  onSelect,
}: {
  statuses: LocalModelStatus[];
  isActiveProvider: boolean;
  selectedVariantId?: LocalModelVariantId;
  onSelect: (id: LocalModelVariantId) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-2xs font-semibold tracking-wider uppercase text-fg-dim mb-1.5">
          Embedded models
        </label>
        <p className="text-2xs text-fg-dim mb-2">
          Apache 2.0 · stored in app data · runs offline. The 1.7B model is recommended for first
          run; the 4B is higher quality but ~2× larger.
        </p>
      </div>
      <div className="space-y-1.5">
        {statuses.map((s) => (
          <LocalModelRow
            key={s.id}
            status={s}
            isActiveProvider={isActiveProvider}
            isSelected={selectedVariantId === s.id}
            onSelect={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LocalModelRow({
  status,
  isActiveProvider,
  isSelected,
  onSelect,
}: {
  status: LocalModelStatus;
  isActiveProvider: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const handleDownload = () => {
    void window.sable.localModel.download(status.id);
  };
  const handleCancel = () => {
    void window.sable.localModel.cancel(status.id);
  };
  const handleRemove = () => {
    void window.sable.localModel.remove(status.id);
  };

  const progressPct =
    status.totalBytes && status.downloadedBytes
      ? Math.round((status.downloadedBytes / status.totalBytes) * 100)
      : null;

  return (
    <div
      className={`px-3 py-2.5 border rounded-md transition-colors ${
        isSelected ? 'border-accent bg-accent/10' : 'border-border-strong bg-bg-3'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={status.state === 'ready' && isActiveProvider ? onSelect : undefined}
          disabled={!(status.state === 'ready' && isActiveProvider)}
          className="flex-1 text-left disabled:cursor-default"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg font-medium">{status.label}</span>
            {status.recommended && (
              <span className="text-2xs px-1 py-0.5 rounded bg-accent/20 text-accent leading-none">
                recommended
              </span>
            )}
            {status.state === 'ready' && (
              <span className="text-2xs px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 leading-none">
                ready
              </span>
            )}
            {isSelected && (
              <span className="text-2xs px-1 py-0.5 rounded bg-accent/20 text-accent leading-none">
                ✓ selected
              </span>
            )}
          </div>
          <div className="text-2xs text-fg-mute mt-0.5">
            {status.description} · ~{status.approxSizeMb} MB
          </div>
        </button>
        <div className="shrink-0">
          {status.state === 'absent' && (
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 text-2xs text-accent-fg bg-accent rounded hover:opacity-90"
            >
              Download
            </button>
          )}
          {status.state === 'downloading' && (
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 text-2xs text-fg-mute bg-bg-4 border border-border-strong rounded hover:text-fg"
            >
              Cancel
            </button>
          )}
          {status.state === 'ready' && (
            <button
              onClick={handleRemove}
              title="Remove from disk"
              className="px-2 py-1 text-2xs text-fg-dim hover:text-red-300"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {status.state === 'downloading' && (
        <div className="mt-2">
          <div className="h-1 bg-bg-4 rounded overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: progressPct !== null ? `${progressPct}%` : '5%' }}
            />
          </div>
          <div className="text-2xs text-fg-dim mt-1">
            {status.downloadedBytes !== undefined && status.totalBytes
              ? `${formatMB(status.downloadedBytes)} / ${formatMB(status.totalBytes)}${
                  progressPct !== null ? ` · ${progressPct}%` : ''
                }`
              : 'Connecting…'}
          </div>
        </div>
      )}
      {status.state === 'error' && status.error && (
        <div className="mt-1.5 text-2xs text-red-300">{status.error}</div>
      )}
    </div>
  );
}

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
