// Tailwind config snippet card + Open questions card.

const cardC = {
  width: '100%', height: '100%', background: 'var(--ink-1)', color: 'var(--text-1)',
  fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column',
  padding: 'var(--s-8)', boxSizing: 'border-box', overflow: 'hidden',
  fontSize: 'var(--fs-13)', lineHeight: 'var(--lh-body)',
};
const eyebrowC = (t) => (
  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-3)', marginBottom: 12, fontWeight: 540 }}>{t}</div>
);

function TailwindSnippet() {
  const code = `// tailwind.config.ts — derived from Sable tokens
import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        ink: {
          0: 'var(--ink-0)', 1: 'var(--ink-1)', 2: 'var(--ink-2)',
          3: 'var(--ink-3)', 4: 'var(--ink-4)', 5: 'var(--ink-5)',
          6: 'var(--ink-6)',
        },
        text: {
          1: 'var(--text-1)', 2: 'var(--text-2)',
          3: 'var(--text-3)', 4: 'var(--text-4)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft:    'var(--accent-soft)',
          tint:    'var(--accent-tint)',
          press:   'var(--accent-press)',
          ink:     'var(--accent-ink)',
        },
        ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace'],
      },
      fontSize: {
        '10': '10px', '11': '11px', '12': '12px',
        '13': ['13px', { lineHeight: '1.45' }],
        '14': '14px', '15': '15px',
        '18': ['18px', { letterSpacing: '-0.01em' }],
        '22': ['22px', { letterSpacing: '-0.02em' }],
        '28': ['28px', { letterSpacing: '-0.02em' }],
      },
      fontWeight: { r: '400', m: '540' },
      borderRadius: {
        '1': '3px', '2': '5px', '3': '7px', '4': '10px',
      },
      boxShadow: {
        'e1': 'var(--e-1)',
        'e2': 'var(--e-2)',
        'e3': 'var(--e-3)',
        'glow': 'var(--e-glow)',
      },
      transitionDuration: {
        instant: '80ms', fast: '120ms', base: '160ms', slow: '240ms',
      },
      transitionTimingFunction: {
        sable: 'cubic-bezier(.2,0,0,1)',
      },
    },
  },
} satisfies Config`;

  return (
    <div style={cardC}>
      {eyebrowC('Tailwind config · paste-ready')}
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
        Pulls every token from <span style={{ fontFamily: 'var(--font-mono)' }}>tokens.css</span> as CSS variables — change a value there, the whole UI rerenders without a Tailwind rebuild.
      </div>
      <pre style={{
        flex: 1, background: 'var(--ink-3)', borderRadius: 'var(--r-3)',
        padding: 14, overflow: 'auto', margin: 0,
        fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.55,
        color: 'var(--text-2)', border: '1px solid var(--line)',
      }}><code>{code.split('\n').map((ln, i) => {
        const k = ln.match(/^(\s*)(\/\/.*)?(.*)$/);
        const indent = k[1];
        const comment = k[2];
        const rest = k[3];
        const isStr = /'[^']*'/g;
        return (
          <div key={i}>
            {indent}
            {comment && <span style={{ color: 'var(--text-4)' }}>{comment}</span>}
            {!comment && rest.split(isStr).map((p, j) => {
              const matches = rest.match(isStr);
              return (
                <React.Fragment key={j}>
                  <span style={{ color: 'var(--text-1)' }}>{p}</span>
                  {matches && matches[j] && <span style={{ color: 'var(--accent)' }}>{matches[j]}</span>}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}</code></pre>
    </div>
  );
}

function OpenQuestions() {
  const qs = [
    {
      q: 'How saturated should accent get when a Space is active?',
      a: 'Three roles only: (1) active-tab indicator + drop overlay (full strength), (2) hairline accent on focused omnibar / composer (1px + 3px soft glow), (3) divider on hover. Avoid tinting the page chrome itself — the page is the focus, not the chrome.',
    },
    {
      q: 'Per-provider tint on assistant bubble?',
      a: 'No tint. The eyebrow above each bubble carries the provider name + accent spark. Tinting bubbles per provider doubles the visual language with the per-Space accent and gets noisy in mixed-provider conversations.',
    },
    {
      q: 'Tab-row close button — always visible or hover-reveal?',
      a: 'Keep hover-reveal. With ~30 tabs, always-visible × pollutes the row. Add ⌘W as the muscle-memory path; surface "Close 14 inactive tabs" in the ⌘ menu instead of per-row chrome.',
    },
    {
      q: 'Drop zones — persistent outlines or hover-only?',
      a: 'Persistent dashed quadrants during drag (faint accent at ~32% opacity), filled accent-soft + 1.5px ring on the hovered zone. The dashed grid removes the "where can I drop?" guess; the fill confirms commitment.',
    },
    {
      q: 'Sidebar width — fixed 280 or resizable?',
      a: 'Resizable in V0.2; persist to settings. For V0.1 ship 240px (this proposal) — tighter than 280 matches the Linear-density target and earns the page area an extra 40px on a 1280-wide window.',
    },
  ];
  return (
    <div style={cardC}>
      {eyebrowC('Open questions · resolved')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {qs.map((it, i) => (
          <div key={i}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>Q{i+1}</span>
              <span style={{ fontSize: 13, fontWeight: 540, color: 'var(--text-1)' }}>{it.q}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, paddingLeft: 30 }}>{it.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.SExtras = { TailwindSnippet, OpenQuestions };
