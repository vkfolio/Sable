// Final onboarding step — confirms setup and exits.

import { useChromeStore } from '../../state/chrome';

export function DoneStep({ onClose }: { onClose: () => void }) {
  const userName = useChromeStore((s) => s.userName);
  const greeting = userName ? `You're all set, ${userName}.` : `You're all set.`;

  return (
    <div className="px-7 py-8 flex flex-col gap-5">
      <div className="flex flex-col items-start gap-3">
        <Sparkle />
        <h2 className="text-[22px] font-medium tracking-tight text-ink-0 m-0">
          {greeting}
        </h2>
        <p className="text-sm text-ink-2 leading-snug">
          Sable is ready. Drag tabs to split them, drop on a pill to group,
          and ask the model anything in the chat panel.
        </p>
      </div>
      <div className="flex items-center justify-end">
        <button
          onClick={onClose}
          autoFocus
          className="px-4 h-9 rounded-[10px] bg-ink-0 text-ink-inv text-sm font-medium hover:brightness-110"
        >
          Open Sable
        </button>
      </div>
    </div>
  );
}

function Sparkle() {
  return (
    <span
      className="w-7 h-7 rounded-[8px] inline-flex items-center justify-center text-base"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, rgb(var(--p-coral)), transparent 60%), radial-gradient(circle at 70% 70%, rgb(var(--p-lavender)), transparent 60%), rgb(var(--p-sky))',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.4)',
      }}
    />
  );
}
