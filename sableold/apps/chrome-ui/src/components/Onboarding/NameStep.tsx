// Step 2 — capture the user's display name. Empty input is allowed and
// just falls back to the unnamed greeting in NTP. Enter / Continue both
// commit and advance.

import { useState } from 'react';
import { useChromeStore } from '../../state/chrome';

export function NameStep({ onContinue }: { onContinue: () => void }) {
  const setUserName = useChromeStore((s) => s.setUserName);
  const [value, setValue] = useState('');

  const submit = () => {
    setUserName(value);
    onContinue();
  };

  return (
    <div className="px-7 py-8 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <SableMark />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          Step 1 of 2
        </span>
      </div>
      <div>
        <h2 className="text-[22px] font-medium tracking-tight text-ink-0 m-0">
          Welcome to Sable.
        </h2>
        <p className="mt-2 mb-0 text-sm text-ink-2 leading-snug">
          What should we call you? We'll use it on the new-tab page.
        </p>
      </div>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="Your name"
        spellCheck={false}
        className="w-full h-11 px-3.5 rounded-[10px] bg-surface-3 border border-line text-base text-ink-0 outline-none focus:border-acc focus:shadow-[0_0_0_4px_rgb(var(--acc-glow))] placeholder:text-ink-3"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={submit}
          className="px-4 h-9 rounded-[10px] bg-ink-0 text-ink-inv text-sm font-medium hover:brightness-110"
        >
          Continue
        </button>
      </div>
    </div>
  );
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
