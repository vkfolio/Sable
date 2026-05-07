// Token cards — visual reference for color, type, spacing, radius, motion, elevation.

const card = {
  width: '100%', height: '100%', background: 'var(--ink-1)', color: 'var(--text-1)',
  fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column',
  padding: 'var(--s-8)', boxSizing: 'border-box', overflow: 'hidden',
  fontSize: 'var(--fs-13)', lineHeight: 'var(--lh-body)',
};

const sectionLabel = (t) => (
  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-3)', marginBottom: 12, fontWeight: 540 }}>{t}</div>
);

// ── Brand ──────────────────────────────────────────────────────
function BrandWordmark() {
  return (
    <div style={{ ...card, gap: 'var(--s-9)', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-5)', marginTop: 'var(--s-7)' }}>
        <Logomark size={56} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 56, fontWeight: 540, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-1)' }}>sable</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 6, letterSpacing: '0.04em' }}>focus.browser /v0.1</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)', width: '100%' }}>
        {sectionLabel('Wordmark')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)' }}>
          {[
            { bg: 'var(--ink-1)', fg: 'var(--text-1)', name: 'on ink-1' },
            { bg: 'var(--ink-3)', fg: 'var(--text-1)', name: 'on ink-3' },
            { bg: 'var(--accent)', fg: 'var(--accent-ink)', name: 'on accent' },
            { bg: '#fff', fg: '#0B0C10', name: 'on light' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, padding: '14px 16px', borderRadius: 'var(--r-3)', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: 22, fontWeight: 540, letterSpacing: '-0.03em', color: s.fg }}>sable</span>
              <div style={{ fontSize: 10, color: s.fg, opacity: 0.5, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{s.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Logomark({ size = 32, accent = 'var(--accent)' }) {
  // The 's' as a stacked split: two panes joined at a 4px gap, accent edge.
  // Reads as "split panes" and the letter s simultaneously.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--ink-3)" stroke="var(--line-strong)"/>
      <rect x="7" y="7" width="8" height="8" rx="1.5" fill={accent}/>
      <rect x="17" y="7" width="8" height="8" rx="1.5" fill="var(--ink-5)"/>
      <rect x="7" y="17" width="8" height="8" rx="1.5" fill="var(--ink-5)"/>
      <rect x="17" y="17" width="8" height="8" rx="1.5" fill={accent} opacity="0.4"/>
    </svg>
  );
}

// ── Color · Neutrals ──────────────────────────────────────────
function ColorNeutrals() {
  const inks = [
    ['ink-0', '--ink-0', '#07070A', 'page void'],
    ['ink-1', '--ink-1', '#0B0C10', 'sidebar'],
    ['ink-2', '--ink-2', '#111218', 'chat panel'],
    ['ink-3', '--ink-3', '#181A22', 'card'],
    ['ink-4', '--ink-4', '#20232C', 'hover'],
    ['ink-5', '--ink-5', '#2A2D38', 'pressed'],
    ['ink-6', '--ink-6', '#353846', 'divider'],
  ];
  const text = [
    ['text-1', '#ECEDF1', 'primary', 'AAA'],
    ['text-2', '#B5B7C0', 'secondary', 'AAA'],
    ['text-3', '#80828D', 'tertiary', 'AA'],
    ['text-4', '#565862', 'disabled', '–'],
  ];
  return (
    <div style={card}>
      {sectionLabel('Ink scale · surfaces')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 'var(--r-3)', overflow: 'hidden', border: '1px solid var(--line)' }}>
        {inks.map(([n, v, hex, use]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', height: 38, background: `var(${v})`, padding: '0 14px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-1)', flex: 1 }}>{n}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', flex: 1 }}>{hex}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{use}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 18 }}/>
      {sectionLabel('Text · contrast on ink-1')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {text.map(([n, hex, use, ratio]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ color: hex, fontSize: 22, fontWeight: 540, letterSpacing: '-0.01em', flex: 1 }}>The quick fox</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', width: 50 }}>{n}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', width: 60 }}>{hex}</span>
            <span style={{ fontSize: 10, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>{ratio}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 18 }}/>
      {sectionLabel('Hairlines')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[['line-soft', 'rgba(255,255,255,.04)'], ['line', 'rgba(255,255,255,.07)'], ['line-strong', 'rgba(255,255,255,.12)']].map(([n, v]) => (
          <div key={n} style={{ background: 'var(--ink-3)', padding: 12, borderRadius: 'var(--r-2)', border: `1px solid ${v}` }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)' }}>{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Color · Space accents ─────────────────────────────────────
function ColorAccents() {
  const accents = [
    ['Periwinkle', '--acc-periwinkle', '#8C97FF', 'default'],
    ['Mint',       '--acc-mint',       '#5BE6CC', 'work'],
    ['Honey',      '--acc-honey',      '#F2A93B', 'reading'],
    ['Rose',       '--acc-rose',       '#F389BD', 'social'],
    ['Iris',       '--acc-iris',       '#B49BFF', 'study'],
    ['Coral',      '--acc-coral',      '#FB8284', 'play'],
  ];
  return (
    <div style={card}>
      {sectionLabel('Space accents · 6-color rotation')}
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, marginTop: -4, lineHeight: 1.5 }}>
        Tuned to <span style={{ fontFamily: 'var(--font-mono)' }}>oklch(~0.78 ~0.14 h)</span> — equal perceived
        brightness so any one feels equally present as the active accent.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {accents.map(([name, v, hex, role]) => (
          <div key={name} style={{ background: 'var(--ink-3)', borderRadius: 'var(--r-3)', padding: 12, border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--r-2)', background: `var(${v})`, boxShadow: `0 0 0 1px ${hex}66` }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 540, color: 'var(--text-1)' }}>{name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{hex}</div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{role}</div>
            </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 8, height: 4, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ flex: 1, background: `color-mix(in oklch, ${hex} 100%, black 20%)` }}/>
              <div style={{ flex: 1, background: hex }}/>
              <div style={{ flex: 1, background: `color-mix(in oklch, ${hex} 60%, transparent)` }}/>
              <div style={{ flex: 1, background: `color-mix(in oklch, ${hex} 18%, transparent)` }}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 18 }}/>
      {sectionLabel('Accent surface roles · derived from --accent')}
      <div data-space="periwinkle" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['accent', 'var(--accent)', 'Primary CTA · active tab indicator · focus ring'],
          ['accent-soft', 'var(--accent-soft)', 'Drop overlay · selected row · message bubble border'],
          ['accent-tint', 'var(--accent-tint)', 'Persistent drop hint · hover divider'],
          ['accent-press', 'var(--accent-press)', 'Pressed CTA'],
        ].map(([n, v, use]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
            <div style={{ width: 36, height: 22, borderRadius: 'var(--r-2)', background: v, border: '1px solid var(--line)' }}/>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', width: 100 }}>{n}</span>
            <span style={{ color: 'var(--text-3)', flex: 1 }}>{use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Type ──────────────────────────────────────────────────────
function TypeRamp() {
  const ramp = [
    [28, 540, 'Display', 'Title', 'fs-28 / fw-m'],
    [22, 540, 'Heading L', 'Section heading', 'fs-22 / fw-m'],
    [18, 540, 'Heading M', 'Modal title', 'fs-18 / fw-m'],
    [15, 540, 'Heading S', 'Card heading', 'fs-15 / fw-m'],
    [14, 400, 'Body L', 'Chat message', 'fs-14 / fw-r'],
    [13, 400, 'Body', 'UI text · default', 'fs-13 / fw-r'],
    [12, 400, 'Tab', 'Tab label · meta', 'fs-12 / fw-r'],
    [11, 540, 'Eyebrow', 'Section eyebrow', 'fs-11 / fw-m / 0.08em'],
  ];
  return (
    <div style={card}>
      {sectionLabel('Type ramp · Inter · 2-weight (400 · 540)')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ramp.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '1px solid var(--line-soft)', paddingBottom: 12 }}>
            <span style={{ fontSize: r[0], fontWeight: r[1], color: 'var(--text-1)', letterSpacing: r[0] >= 18 ? '-0.02em' : (r[0] === 11 ? '0.08em' : '-0.005em'), textTransform: r[0] === 11 ? 'uppercase' : 'none', flex: 1 }}>{r[3]}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', width: 80 }}>{r[2]}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', width: 130, textAlign: 'right' }}>{r[4]}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 18 }}/>
      {sectionLabel('Mono · JetBrains Mono')}
      <div style={{ background: 'var(--ink-3)', padding: 12, borderRadius: 'var(--r-2)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', border: '1px solid var(--line)' }}>
        <div><span style={{ color: 'var(--accent)' }}>https://</span>arxiv.org/abs/<span style={{ color: 'var(--text-1)' }}>2401.04088</span></div>
        <div style={{ marginTop: 6 }}>const <span style={{ color: 'var(--accent)' }}>tab</span> = await sable.openTab(url)</div>
      </div>
    </div>
  );
}

// ── Spacing / Radius ──────────────────────────────────────────
function SpacingRadius() {
  const sp = [['s-1','2'],['s-2','4'],['s-3','6'],['s-4','8'],['s-5','12'],['s-6','16'],['s-7','20'],['s-8','24'],['s-9','32'],['s-10','40']];
  const rd = [['r-0','0'],['r-1','3'],['r-2','5'],['r-3','7'],['r-4','10'],['r-pill','999']];
  return (
    <div style={card}>
      {sectionLabel('Spacing · 4-base')}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
        {sp.map(([n, v]) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: parseInt(v), height: parseInt(v), background: 'var(--accent)' }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 24 }}/>
      {sectionLabel('Radius')}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {rd.map(([n, v]) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 56, height: 36, background: 'var(--ink-4)', borderRadius: v === '999' ? 999 : `${v}px`, border: '1px solid var(--line)' }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)' }}>{n}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 24 }}/>
      {sectionLabel('Density · row heights')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--ink-3)', borderRadius: 'var(--r-2)', overflow: 'hidden', border: '1px solid var(--line)' }}>
        {[['Tab row', 28], ['Menu item', 30], ['Input field', 32], ['Button (md)', 28], ['Settings row', 44]].map(([l, h]) => (
          <div key={l} style={{ height: h, display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--ink-2)', fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ flex: 1 }}>{l}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{h}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Elevation / Motion ────────────────────────────────────────
function ElevationMotion() {
  const els = [
    ['e-0', 'none', 'Inline'],
    ['e-1', '0 1px 0 rgba(0,0,0,.4) + inset highlight', 'Raised row'],
    ['e-2', '0 4px 16px / 1px line', 'Dropdown · popover'],
    ['e-3', '0 16px 40px / 1px strong line', 'Modal'],
  ];
  const ms = [
    ['t-instant', 80, 'Hover tint, divider grip'],
    ['t-fast', 120, 'Button press, chip dismiss'],
    ['t-base', 160, 'Drop overlay fade, tab swap'],
    ['t-slow', 240, 'Modal open, sidebar resize'],
  ];
  return (
    <div style={card}>
      {sectionLabel('Elevation')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {els.map(([n, d, use], i) => (
          <div key={n} style={{
            background: 'var(--ink-3)', borderRadius: 'var(--r-3)', padding: 14,
            boxShadow: i === 0 ? 'none' : `var(--${n})`, border: i === 0 ? '1px solid var(--line)' : 'none',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-1)' }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{use}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 22 }}/>
      {sectionLabel('Motion · economy first')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ms.map(([n, ms, use]) => (
          <MotionRow key={n} name={n} ms={ms} use={use}/>
        ))}
      </div>
      <div style={{ height: 18 }}/>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
        ease: cubic-bezier(.2, 0, 0, 1) — sharp departure, soft arrival. No spring overshoot.
      </div>
    </div>
  );
}

function MotionRow({ name, ms, use }) {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', width: 70 }}>{name}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', width: 40 }}>{ms}ms</span>
      <div style={{ flex: 1, height: 18, background: 'var(--ink-3)', borderRadius: 9, position: 'relative', overflow: 'hidden' }}>
        <div key={t} style={{
          position: 'absolute', top: 3, left: 3, width: 12, height: 12, background: 'var(--accent)',
          borderRadius: 6, animation: `mtr-${ms} ${ms}ms cubic-bezier(.2,0,0,1) forwards`,
        }}/>
        <style>{`@keyframes mtr-${ms} { from { transform: translateX(0); } to { transform: translateX(calc(100% - 18px)); } }`}</style>
      </div>
      <span style={{ color: 'var(--text-3)', flex: 1 }}>{use}</span>
    </div>
  );
}

window.STokens = { BrandWordmark, ColorNeutrals, ColorAccents, TypeRamp, SpacingRadius, ElevationMotion, Logomark };
