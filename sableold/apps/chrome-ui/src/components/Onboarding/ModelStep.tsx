// Step 3 — pick + download a local Qwen variant. Defaults to the
// recommended one (1.7B) but the user can pick the lighter 0.6B or the
// heavier 4B. While the download is running we render a progress bar
// driven by the LocalModelStatus push events; on completion we set the
// active provider to qwen-local + select the variant so chat works
// immediately, then advance.
//
// A "Skip — I'll bring my own key" link advances without downloading.

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLocalModelStore } from '../../state/local-model';
import { useSettingsStore } from '../../state/settings';
import type { LocalModelStatus, LocalModelVariantId } from '../../types';

const DEFAULT_VARIANT: LocalModelVariantId = 'qwen3-1.7b-q4';

export function ModelStep({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const statuses = useLocalModelStore(useShallow((s) => s.statuses));
  const setActiveProvider = useSettingsStore((s) => s.setActiveProvider);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);
  const [selectedId, setSelectedId] = useState<LocalModelVariantId>(DEFAULT_VARIANT);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => statuses.find((s) => s.id === selectedId),
    [statuses, selectedId],
  );

  // When the chosen model finishes downloading, wire it as the active
  // provider/model and advance to Done. We go through the renderer's
  // Zustand setters (not the raw IPC) so the chat panel's `activeProvider`
  // reactively updates — otherwise it sees the stale default and renders
  // its empty-state asking the user to "configure chat settings".
  useEffect(() => {
    if (!selected) return;
    if (selected.state !== 'ready') return;
    let cancelled = false;
    void (async () => {
      try {
        await setActiveProvider('qwen-local');
        await setSelectedModel(selectedId);
      } catch (err) {
        if (!cancelled) setError(String(err));
        return;
      }
      if (!cancelled) onDone();
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.state, selectedId, onDone, setActiveProvider, setSelectedModel]);

  const startDownload = () => {
    setError(null);
    void window.sable.localModel.download(selectedId);
  };

  return (
    <div className="px-7 py-8 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <SableMark />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          Step 2 of 2
        </span>
      </div>
      <div>
        <h2 className="text-[22px] font-medium tracking-tight text-ink-0 m-0">
          Choose a local AI model.
        </h2>
        <p className="mt-2 mb-0 text-sm text-ink-2 leading-snug">
          Sable runs the AI on your machine — pick a size that fits your hardware.
          You can switch later in Settings.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {statuses.map((s) => (
          <VariantCard
            key={s.id}
            status={s}
            selected={s.id === selectedId}
            onSelect={() => setSelectedId(s.id)}
          />
        ))}
      </div>
      {/* Surface both react-side failures (setError) and main-side download
          failures (status.state === 'error') so a silent 404 / network drop
          doesn't read as "click did nothing". */}
      {error && <div className="text-xs text-bad">{error}</div>}
      {selected?.state === 'error' && (
        <div className="text-xs text-bad whitespace-pre-wrap leading-snug">
          Download failed: {selected.error ?? 'unknown error'}
          <button
            onClick={startDownload}
            className="ml-2 underline underline-offset-2 hover:text-ink-0"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onSkip}
          className="text-sm text-ink-2 hover:text-ink-0 underline-offset-2 hover:underline"
        >
          Skip — I'll bring my own key
        </button>
        <DownloadButton status={selected} onClick={startDownload} />
      </div>
    </div>
  );
}

function VariantCard({
  status,
  selected,
  onSelect,
}: {
  status: LocalModelStatus;
  selected: boolean;
  onSelect: () => void;
}) {
  const downloading = status.state === 'downloading';
  const ready = status.state === 'ready';
  const pct =
    status.totalBytes && status.downloadedBytes
      ? Math.round((status.downloadedBytes / status.totalBytes) * 100)
      : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={downloading}
      className={`relative flex items-start gap-3 px-3.5 py-3 rounded-[12px] border-[1.5px] text-left transition-colors ${
        selected
          ? 'border-acc bg-acc/10'
          : 'border-line bg-surface-3 hover:border-line-strong'
      } disabled:cursor-default`}
    >
      <input
        type="radio"
        readOnly
        checked={selected}
        className="mt-1 accent-[rgb(var(--acc-ink))]"
        tabIndex={-1}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-ink-0">{status.label}</span>
          {status.recommended && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-acc-soft text-acc-ink">
              recommended
            </span>
          )}
          {status.experimental && (
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-warn/15 text-warn"
              title={status.experimentalNote ?? 'May not load on this build.'}
            >
              experimental
            </span>
          )}
          {ready && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-ok/15 text-ok">
              ready
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-ink-2 leading-snug">
          {status.description} · ~{status.approxSizeMb} MB
        </div>
        {status.experimental && status.experimentalNote && selected && (
          <div className="mt-2 text-[11px] text-warn leading-snug">
            ⚠ {status.experimentalNote}
          </div>
        )}
        {downloading && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-surface-4 overflow-hidden">
              <div
                className="h-full bg-acc transition-[width]"
                style={{ width: `${pct ?? 0}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] font-mono text-ink-2">
              {pct !== null ? `${pct}%` : 'starting…'}
              {status.downloadedBytes && status.totalBytes
                ? `  ·  ${formatMb(status.downloadedBytes)} / ${formatMb(status.totalBytes)}`
                : ''}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

function DownloadButton({
  status,
  onClick,
}: {
  status: LocalModelStatus | undefined;
  onClick: () => void;
}) {
  if (!status) return null;
  if (status.state === 'ready') {
    return (
      <span className="px-4 h-9 inline-flex items-center rounded-[10px] bg-ok/20 text-ok text-sm font-medium">
        Continue…
      </span>
    );
  }
  if (status.state === 'downloading') {
    return (
      <button
        onClick={() => void window.sable.localModel.cancel(status.id)}
        className="px-4 h-9 rounded-[10px] bg-surface-3 border border-line text-ink-1 text-sm font-medium hover:bg-surface-4"
      >
        Cancel
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="px-4 h-9 rounded-[10px] bg-ink-0 text-ink-inv text-sm font-medium hover:brightness-110"
    >
      Download
    </button>
  );
}

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

function SableMark() {
  return (
    <div
      className="w-7 h-7 rounded-[8px] inline-flex items-center justify-center text-[12px] font-semibold text-white"
      style={{ background: 'rgb(var(--ink-0))' }}
    >
      S
    </div>
  );
}
