// Splash — full-screen first-launch logo animation. Renders OUTSIDE the
// onboarding modal card (the dialog routes around it when step === 'splash')
// so the mark fills the entire window. Auto-advances after 2.2 s.
//
// Uses the actual Sable icon (resources/icon.svg, copied into the chrome
// asset tree) loaded via Vite's default URL import; no Lottie / no extra
// runtime.

import { useEffect } from 'react';
import iconUrl from '../../assets/sable-icon.svg';

export function SplashStep({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2200);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-0 overflow-hidden">
      {/* Soft pastel ambient glow behind the mark */}
      <div className="splash-glow absolute inset-0 pointer-events-none" />

      <div className="relative flex flex-col items-center gap-8">
        {/* Real Sable icon — black rounded square with the white S glyph.
            Animation scales it in with a small overshoot rotation. */}
        <img
          src={iconUrl}
          alt="Sable"
          className="splash-mark w-[180px] h-[180px] rounded-[36px] shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
          draggable={false}
        />
        <div className="splash-word text-white tracking-[0.42em] text-xl font-light">
          SABLE
        </div>
      </div>
    </div>
  );
}
