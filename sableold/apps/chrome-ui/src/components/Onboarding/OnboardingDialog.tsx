// First-launch onboarding modal. Mounted by App.tsx when
// `useChromeStore.firstLaunchSeen` is false. Owns a 4-step state machine
// (splash → name → model → done) and the chrome.setOverlay lifecycle so
// tab WebContentsViews retract while the dialog is open (mirrors
// SettingsDialog / SpacesPopover).

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useChromeStore } from '../../state/chrome';
import { SplashStep } from './SplashStep';
import { NameStep } from './NameStep';
import { ModelStep } from './ModelStep';
import { DoneStep } from './DoneStep';

type Step = 'splash' | 'name' | 'model' | 'done';

export function OnboardingDialog() {
  const setFirstLaunchSeen = useChromeStore((s) => s.setFirstLaunchSeen);
  const [step, setStep] = useState<Step>('splash');

  // Tab WCVs would otherwise paint over this modal. setOverlay(true) on
  // mount unmounts them; the cleanup re-mounts on close.
  useEffect(() => {
    void window.sable.chrome.setOverlay(true);
    return () => {
      void window.sable.chrome.setOverlay(false);
    };
  }, []);

  const close = () => {
    setFirstLaunchSeen(true);
  };

  // The splash is full-screen and renders WITHOUT the modal card chrome —
  // it's the cinematic first impression. Subsequent steps (name / model /
  // done) are routine forms and go inside the centered dialog card.
  const node =
    step === 'splash' ? (
      <SplashStep onDone={() => setStep('name')} />
    ) : (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative w-[480px] max-w-[92vw] rounded-2xl bg-surface-2 border border-line shadow-3 overflow-hidden">
          {step === 'name' && <NameStep onContinue={() => setStep('model')} />}
          {step === 'model' && (
            <ModelStep
              onDone={() => setStep('done')}
              onSkip={() => setStep('done')}
            />
          )}
          {step === 'done' && <DoneStep onClose={close} />}
        </div>
      </div>
    );

  return createPortal(node, document.body);
}
