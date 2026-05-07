// Icon catalog + Component catalog cards.
// Depends on globals: Sicon (icons), STokens (Logomark).

const cardStyle = {
  width: '100%', height: '100%', background: 'var(--ink-1)', color: 'var(--text-1)',
  fontFamily: 'var(--font-ui)', display: 'flex', flexDirection: 'column',
  padding: 'var(--s-8)', boxSizing: 'border-box', overflow: 'hidden',
  fontSize: 'var(--fs-13)', lineHeight: 'var(--lh-body)',
};
const eyebrow = (t) => (
  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-3)', marginBottom: 12, fontWeight: 540 }}>{t}</div>
);

// ── Icon catalog ───────────────────────────────────────────
function IconCatalog() {
  const groups = [
    ['Navigation', ['Back', 'Fwd', 'Reload', 'Stop']],
    ['App', ['Plus', 'Close', 'Search', 'Cmd', 'Settings', 'More', 'ChevDown', 'ChevRight', 'Check']],
    ['Web', ['Lock', 'Globe', 'Pin']],
    ['AI · chat', ['Spark', 'Send', 'StopSquare', 'Quote', 'Image', 'Link']],
    ['State', ['CheckCircle', 'Alert', 'Info']],
    ['Layout', ['SplitH', 'SplitV', 'Sidebar', 'Download', 'Key', 'Cpu', 'Cloud']],
  ];
  return (
    <div style={cardStyle}>
      {eyebrow('Iconography · 1.5px stroke · matches Inter regular')}
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 18, marginTop: -4, lineHeight: 1.5 }}>
        Custom set. Stroke-only at 24px grid; flat at 16px embedded contexts.
        Replaces the ad-hoc Unicode glyphs (› ‹ ↻ × + ⚙ ▾) with consistent line weight.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {groups.map(([title, names]) => (
          <div key={title}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8, fontWeight: 540 }}>{title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {names.map((n) => {
                const I = Sicon[n];
                return (
                  <div key={n} style={{ aspectRatio: '1', background: 'var(--ink-3)', borderRadius: 'var(--r-2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    border: '1px solid var(--line)' }}>
                    <I size={20} stroke="var(--text-1)"/>
                    <span style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Buttons ────────────────────────────────────────────────
const Btn = ({ kind = 'primary', state = 'idle', children, leading, trailing }) => {
  const styles = {
    primary: {
      idle:    { background: 'var(--accent)', color: 'var(--accent-ink)', border: '1px solid transparent' },
      hover:   { background: 'color-mix(in oklch, var(--accent) 92%, white 8%)', color: 'var(--accent-ink)', border: '1px solid transparent' },
      pressed: { background: 'var(--accent-press)', color: 'var(--accent-ink)', border: '1px solid transparent', boxShadow: 'inset 0 1px 0 rgba(0,0,0,.1)' },
      focus:   { background: 'var(--accent)', color: 'var(--accent-ink)', border: '1px solid transparent', boxShadow: '0 0 0 2px var(--ink-1), 0 0 0 4px var(--accent)' },
      disabled:{ background: 'var(--ink-4)', color: 'var(--text-4)', border: '1px solid transparent', cursor: 'not-allowed' },
      loading: { background: 'var(--accent)', color: 'transparent', border: '1px solid transparent' },
    },
    secondary: {
      idle:    { background: 'var(--ink-3)', color: 'var(--text-1)', border: '1px solid var(--line)' },
      hover:   { background: 'var(--ink-4)', color: 'var(--text-1)', border: '1px solid var(--line-strong)' },
      pressed: { background: 'var(--ink-5)', color: 'var(--text-1)', border: '1px solid var(--line-strong)' },
      focus:   { background: 'var(--ink-3)', color: 'var(--text-1)', border: '1px solid var(--line)', boxShadow: '0 0 0 2px var(--ink-1), 0 0 0 4px var(--accent)' },
      disabled:{ background: 'var(--ink-2)', color: 'var(--text-4)', border: '1px solid var(--line-soft)', cursor: 'not-allowed' },
      loading: { background: 'var(--ink-3)', color: 'transparent', border: '1px solid var(--line)' },
    },
    ghost: {
      idle:    { background: 'transparent', color: 'var(--text-2)', border: '1px solid transparent' },
      hover:   { background: 'var(--ink-4)', color: 'var(--text-1)', border: '1px solid transparent' },
      pressed: { background: 'var(--ink-5)', color: 'var(--text-1)', border: '1px solid transparent' },
      focus:   { background: 'transparent', color: 'var(--text-1)', border: '1px solid transparent', boxShadow: '0 0 0 2px var(--ink-1), 0 0 0 4px var(--accent)' },
      disabled:{ background: 'transparent', color: 'var(--text-4)', border: '1px solid transparent', cursor: 'not-allowed' },
      loading: { background: 'transparent', color: 'transparent', border: '1px solid transparent' },
    },
  };
  const s = styles[kind][state];
  return (
    <button style={{
      ...s, height: 28, padding: '0 12px', borderRadius: 'var(--r-2)',
      fontSize: 13, fontWeight: 540, fontFamily: 'inherit', display: 'inline-flex',
      alignItems: 'center', gap: 6, cursor: 'pointer', position: 'relative',
      transition: 'background 120ms ease',
    }}>
      {leading}{children}{trailing}
      {state === 'loading' && (
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 12, height: 12, border: `1.5px solid ${kind==='primary'?'var(--accent-ink)':'var(--text-2)'}`, borderTopColor: 'transparent', borderRadius: 6, animation: 'spin 700ms linear infinite' }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </span>
      )}
    </button>
  );
};

function ButtonsCard() {
  const states = ['idle', 'hover', 'pressed', 'focus', 'disabled', 'loading'];
  return (
    <div style={cardStyle}>
      {eyebrow('Buttons · primary / secondary / ghost · 6 states')}
      <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(6, 1fr)', alignItems: 'center', gap: 8, fontSize: 11 }}>
        <span/>
        {states.map((s) => <span key={s} style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{s}</span>)}
        {['primary', 'secondary', 'ghost'].map((kind) => (
          <React.Fragment key={kind}>
            <span style={{ color: 'var(--text-2)', fontWeight: 540 }}>{kind}</span>
            {states.map((s) => (
              <div key={s}><Btn kind={kind} state={s} leading={<Sicon.Send size={14}/>}>Send</Btn></div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div style={{ height: 22 }}/>
      {eyebrow('Icon button')}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {['idle', 'hover', 'pressed'].map((st) => (
          <button key={st} style={{
            width: 28, height: 28, borderRadius: 'var(--r-2)',
            background: st==='idle'?'transparent':st==='hover'?'var(--ink-4)':'var(--ink-5)',
            color: 'var(--text-2)', border: '1px solid transparent', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}><Sicon.More size={16}/></button>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', marginLeft: 8 }}>idle · hover · pressed</span>
      </div>
      <div style={{ height: 22 }}/>
      {eyebrow('Per-Space accent · primary')}
      <div style={{ display: 'flex', gap: 6 }}>
        {['periwinkle', 'mint', 'honey', 'rose', 'iris', 'coral'].map((sp) => (
          <div key={sp} data-space={sp}><Btn kind="primary">{sp}</Btn></div>
        ))}
      </div>
    </div>
  );
}

// ── Inputs / Omnibar ────────────────────────────────────────
function InputsCard() {
  return (
    <div style={cardStyle}>
      {eyebrow('Inputs · 32px · idle / focus / filled / error')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Idle" state="idle" placeholder="https://"/>
        <Field label="Focus" state="focus" placeholder="https://"/>
        <Field label="Filled" state="filled" value="arxiv.org/abs/2401.04088"/>
        <Field label="Error" state="error" value="not-a-url" hint="That doesn't look like a URL or query."/>
      </div>
      <div style={{ height: 18 }}/>
      {eyebrow('Omnibar · idle / focused / AI mode')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Omni state="idle"/>
        <Omni state="focus"/>
        <Omni state="ai"/>
      </div>
    </div>
  );
}

function Field({ label, state, placeholder, value, hint }) {
  const ring = state === 'focus' ? '0 0 0 2px var(--ink-1), 0 0 0 4px var(--accent)' :
               state === 'error' ? '0 0 0 2px var(--ink-1), 0 0 0 4px var(--err)' : 'none';
  const border = state === 'error' ? '1px solid var(--err)' : state === 'focus' ? '1px solid var(--accent)' : '1px solid var(--line)';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', width: 50 }}>{label}</span>
        <div style={{
          flex: 1, height: 32, background: 'var(--ink-2)', border, borderRadius: 'var(--r-2)',
          padding: '0 10px', display: 'flex', alignItems: 'center', boxShadow: ring,
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: value ? 'var(--text-1)' : 'var(--text-4)',
        }}>{value || placeholder}{state === 'focus' && <span style={{ width: 1, height: 14, background: 'var(--accent)', marginLeft: 1, animation: 'cb 1s steps(2) infinite' }}/>}</div>
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--err)', marginLeft: 58, marginTop: 4 }}>{hint}</div>}
      <style>{`@keyframes cb { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

function Omni({ state }) {
  const ring = state === 'focus' ? '0 0 0 1px var(--accent), 0 0 0 4px var(--accent-soft)' :
               state === 'ai' ? '0 0 0 1px var(--accent), 0 0 0 4px var(--accent-soft)' : 'none';
  return (
    <div style={{
      height: 36, background: state==='idle'?'var(--ink-3)':'var(--ink-2)',
      border: state==='idle'?'1px solid var(--line)':'1px solid var(--accent)',
      borderRadius: 'var(--r-3)', padding: '0 4px 0 10px', display: 'flex', alignItems: 'center',
      gap: 8, boxShadow: ring,
    }}>
      {state === 'ai' ? <Sicon.Spark size={14} stroke="var(--accent)"/> : <Sicon.Search size={14} stroke="var(--text-3)"/>}
      <span style={{
        flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12,
        color: state === 'idle' ? 'var(--text-4)' : 'var(--text-1)',
      }}>
        {state === 'idle' && 'Search or type a URL'}
        {state === 'focus' && <>arxiv.org/abs/240<span style={{ width: 1, height: 12, background: 'var(--accent)', display: 'inline-block', verticalAlign: 'middle', animation: 'cb 1s steps(2) infinite' }}/></>}
        {state === 'ai' && <span><span style={{ color: 'var(--text-3)' }}>ask </span>summarize the open tabs</span>}
      </span>
      {state === 'ai' && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)',
          background: 'var(--accent-soft)', padding: '2px 6px', borderRadius: 3, fontWeight: 540,
        }}>AI</span>
      )}
      <kbd style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)',
        background: 'var(--ink-4)', padding: '2px 5px', borderRadius: 3, border: '1px solid var(--line)',
      }}>⌘K</kbd>
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────
function TabsCard() {
  const tabs = [
    { state: 'idle',     fav: 'D', host: 'duckduckgo.com', title: 'Search results' },
    { state: 'hover',    fav: 'W', host: 'wikipedia.org', title: 'Mistral (model)' },
    { state: 'active',   fav: 'A', host: 'arxiv.org',    title: 'Mixtral of Experts' },
    { state: 'context',  fav: 'G', host: 'github.com',   title: 'qwen3-1.7B / README' },
    { state: 'loading',  fav: '·', host: 'paperswithcode', title: 'Long-context evals' },
    { state: 'unread',   fav: 'H', host: 'huggingface',  title: 'Open weights · trending' },
    { state: 'pinned',   fav: 'C', host: 'claude.ai',    title: 'Claude' },
  ];
  return (
    <div style={cardStyle}>
      {eyebrow('Tab row · 28px · 7 states')}
      <div style={{ background: 'var(--ink-1)', borderRadius: 'var(--r-3)', padding: 6, border: '1px solid var(--line)' }}>
        {tabs.map((t, i) => <TabRow key={i} {...t}/>)}
      </div>
      <div style={{ height: 18 }}/>
      <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
        <div><b style={{ color: 'var(--text-2)' }}>active</b> · 2px accent indicator on left edge, ink-3 fill</div>
        <div><b style={{ color: 'var(--text-2)' }}>context</b> · accent-tint fill, ⌘ handle visible — selected for chat</div>
        <div><b style={{ color: 'var(--text-2)' }}>unread</b> · accent dot left of favicon</div>
        <div><b style={{ color: 'var(--text-2)' }}>close</b> · revealed on hover only (per spec)</div>
      </div>
    </div>
  );
}

function TabRow({ state, fav, host, title }) {
  const isActive = state === 'active';
  const isContext = state === 'context';
  const isHover = state === 'hover';
  const bg = isActive ? 'var(--ink-3)' : isContext ? 'var(--accent-tint)' : isHover ? 'var(--ink-2)' : 'transparent';
  const indicator = isActive ? 'var(--accent)' : 'transparent';
  const titleColor = isActive ? 'var(--text-1)' : state === 'unread' ? 'var(--text-1)' : 'var(--text-2)';
  return (
    <div style={{
      height: 28, display: 'flex', alignItems: 'center', borderRadius: 'var(--r-1)',
      paddingLeft: 8, paddingRight: 6, gap: 8, background: bg, position: 'relative',
      marginBottom: 1, border: isContext ? '1px solid var(--accent-soft)' : '1px solid transparent',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 2, borderRadius: 1, background: indicator }}/>
      {state === 'unread' && <div style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--accent)', flexShrink: 0, marginLeft: -3 }}/>}
      {state === 'pinned' && <Sicon.Pin size={12} stroke="var(--text-3)"/>}
      <div style={{
        width: 14, height: 14, borderRadius: 3, background: 'var(--ink-4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-2)', fontWeight: 540,
        flexShrink: 0,
        animation: state === 'loading' ? 'spin 1.4s linear infinite' : 'none',
      }}>
        {state === 'loading' ? <span style={{ width: 10, height: 10, border: '1.2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: 5 }}/> : fav}
      </div>
      <span style={{ fontSize: 12, color: titleColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: state==='unread'?540:400 }}>{title}</span>
      {isContext && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
          background: 'transparent', padding: '1px 4px', borderRadius: 2, fontWeight: 540,
          border: '1px solid var(--accent-soft)',
        }}>⌘</span>
      )}
      {isHover && <Sicon.Close size={12} stroke="var(--text-3)"/>}
    </div>
  );
}

// ── Citation chips ─────────────────────────────────────────
function ChipsCard() {
  return (
    <div style={cardStyle}>
      {eyebrow('Citation chips · same family · text + image')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <CiteText/>
        <CiteImage/>
        <CiteText hover/>
      </div>
      <div style={{ height: 22 }}/>
      {eyebrow('Compact (in chat)')}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <CiteCompact title="Mixtral of Experts" host="arxiv.org" idx={1}/>
        <CiteCompact title="The MoE primer" host="huggingface.co" idx={2}/>
        <CiteCompact image title="Architecture diagram" host="arxiv.org" idx={3}/>
      </div>
      <div style={{ height: 22 }}/>
      {eyebrow('Streaming / error states')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CiteCompact loading title="Loading…" host="arxiv.org"/>
        <CiteCompact error title="Page failed to load" host="paperswithcode.com"/>
      </div>
    </div>
  );
}

function CiteText({ hover }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: 10, background: 'var(--ink-3)',
      borderRadius: 'var(--r-3)', border: '1px solid var(--line)', position: 'relative',
      boxShadow: hover ? 'var(--e-2)' : 'none',
    }}>
      <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--accent)', borderRadius: 1, flexShrink: 0 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Sicon.Quote size={12} stroke="var(--accent)"/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>arxiv.org/abs/2401.04088 · §3.2</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
          Mixtral 8×7B is a Sparse Mixture of Experts model that routes each token to two of eight experts at every layer.
        </div>
      </div>
      {hover && <button style={{
        width: 22, height: 22, borderRadius: 'var(--r-2)', background: 'var(--ink-4)',
        border: '1px solid var(--line)', color: 'var(--text-2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}><Sicon.Close size={12}/></button>}
    </div>
  );
}

function CiteImage() {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: 10, background: 'var(--ink-3)',
      borderRadius: 'var(--r-3)', border: '1px solid var(--line)',
    }}>
      <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--accent)', borderRadius: 1, flexShrink: 0 }}/>
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--r-2)', background: 'linear-gradient(135deg, #2A2D38, #181A22)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)',
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="9" cy="13" r="3" stroke="var(--text-3)" strokeWidth="1.5"/>
          <circle cx="27" cy="13" r="3" stroke="var(--text-3)" strokeWidth="1.5"/>
          <circle cx="18" cy="25" r="3" stroke="var(--accent)" strokeWidth="1.5"/>
          <path d="M11 14l5 9M25 14l-5 9" stroke="var(--text-3)" strokeWidth="1.2"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Sicon.Image size={12} stroke="var(--accent)"/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>arxiv.org · figure 2</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 540, marginBottom: 2 }}>Top-2 expert routing per token</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.45 }}>1024 × 768 · screenshot · attached 0:14 ago</div>
      </div>
    </div>
  );
}

function CiteCompact({ title, host, idx, image, loading, error }) {
  const c = error ? 'var(--err)' : loading ? 'var(--text-3)' : 'var(--accent)';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 22,
      padding: '0 8px 0 4px', background: 'var(--ink-3)', borderRadius: 'var(--r-pill)',
      border: `1px solid ${error ? 'var(--err)' : 'var(--line)'}`,
      maxWidth: 240, fontSize: 11,
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 7, background: 'var(--ink-1)',
        color: c, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 540, fontFamily: 'var(--font-mono)',
      }}>
        {loading ? <span style={{ width: 8, height: 8, border: '1px solid var(--text-3)', borderTopColor: 'transparent', borderRadius: 4, animation: 'spin 700ms linear infinite' }}/> :
         error ? '!' : idx}
      </span>
      {image && <Sicon.Image size={11} stroke={c}/>}
      <span style={{ color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>· {host}</span>
    </div>
  );
}

// ── Message bubbles ────────────────────────────────────────
function BubblesCard() {
  return (
    <div style={cardStyle}>
      {eyebrow('Message bubbles · user / assistant / streaming / error')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Bubble role="user">Compare Mixtral and Qwen3-1.7B on long-context recall.</Bubble>
        <Bubble role="assistant">
          <div>Both target the long-context regime, but with different trade-offs:</div>
          <ul style={{ margin: '8px 0', paddingLeft: 18, color: 'var(--text-2)' }}>
            <li><b style={{ color: 'var(--text-1)' }}>Mixtral 8×7B</b> — sparse MoE, top-2 routing, ~13B active params.</li>
            <li><b style={{ color: 'var(--text-1)' }}>Qwen3-1.7B</b> — dense, runs locally on Apple Silicon, 32k context.</li>
          </ul>
          <div style={{
            background: 'var(--ink-1)', borderRadius: 'var(--r-2)', padding: 10,
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', border: '1px solid var(--line)',
            marginTop: 6,
          }}>
            <span style={{ color: 'var(--text-3)' }}>// recall@needle, 32k tokens</span>
            <div>Mixtral: <span style={{ color: 'var(--accent)' }}>0.94</span></div>
            <div>Qwen3-1.7B: <span style={{ color: 'var(--accent)' }}>0.81</span></div>
          </div>
        </Bubble>
        <Bubble role="assistant" streaming>
          The third consideration is inference cost
        </Bubble>
        <Bubble role="assistant" error>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--err)', fontWeight: 540, marginBottom: 4 }}>
            <Sicon.Alert size={14} stroke="var(--err)"/>Provider error · 429
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: 12 }}>Anthropic rate limit hit. Retry, or switch to local Qwen3-1.7B.</div>
        </Bubble>
      </div>
    </div>
  );
}

function Bubble({ role, streaming, error, children }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)',
        marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {isUser ? 'You' : <><Sicon.Spark size={10} stroke="var(--accent)"/>Anthropic · Sonnet 4</>}
      </div>
      <div style={{
        maxWidth: '85%',
        background: isUser ? 'var(--ink-3)' : 'transparent',
        border: error ? '1px solid color-mix(in oklch, var(--err) 40%, transparent)' : isUser ? '1px solid var(--line)' : 'none',
        borderRadius: 'var(--r-3)',
        padding: isUser ? '8px 12px' : '0',
        fontSize: 13, color: 'var(--text-1)', lineHeight: 1.55,
      }}>
        {children}
        {streaming && <span style={{
          display: 'inline-block', width: 7, height: 7, marginLeft: 4, marginBottom: -1,
          borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s ease-in-out infinite',
        }}/>}
        <style>{`@keyframes pulse { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }`}</style>
      </div>
    </div>
  );
}

// ── Drop overlay / Splitter / Modal-Dropdown ──────────────
function OverlaysCard() {
  return (
    <div style={cardStyle}>
      {eyebrow('Drop overlay · BSP split preview')}
      <div style={{
        position: 'relative', height: 200, background: 'var(--ink-2)',
        borderRadius: 'var(--r-3)', border: '1px solid var(--line)', overflow: 'hidden',
      }}>
        {/* persistent faint grid */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', pointerEvents: 'none' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              border: '1px dashed color-mix(in oklch, var(--accent) 24%, transparent)',
              margin: -0.5,
            }}/>
          ))}
        </div>
        {/* hover preview — left half */}
        <div style={{
          position: 'absolute', top: 6, left: 6, width: 'calc(50% - 9px)', bottom: 6,
          background: 'var(--accent-soft)',
          border: '1.5px solid var(--accent)',
          borderRadius: 'var(--r-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 540 }}>
            <Sicon.SplitH size={14} stroke="var(--accent)"/> Open as left split
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
        Persistent dashed quadrants appear during drag — discoverable hit-targets. The hovered zone fills with accent-soft + 1.5px ring.
      </div>
      <div style={{ height: 18 }}/>
      {eyebrow('Splitter · grippy on hover')}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', width: 50 }}>idle</span>
        <Splitter state="idle"/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', width: 50 }}>hover</span>
        <Splitter state="hover"/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', width: 50 }}>drag</span>
        <Splitter state="drag"/>
      </div>
      <div style={{ height: 18 }}/>
      {eyebrow('Dropdown · provider selector')}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, height: 32, background: 'var(--ink-3)', borderRadius: 'var(--r-2)', border: '1px solid var(--line)', padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sicon.Spark size={14} stroke="var(--accent)"/>
          <span style={{ fontSize: 12, color: 'var(--text-1)', flex: 1 }}>Anthropic · Sonnet 4</span>
          <Sicon.ChevDown size={12} stroke="var(--text-3)"/>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ height: 32, background: 'var(--ink-3)', borderRadius: 'var(--r-2)', border: '1px solid var(--accent)', padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 0 3px var(--accent-soft)' }}>
            <Sicon.Spark size={14} stroke="var(--accent)"/>
            <span style={{ fontSize: 12, color: 'var(--text-1)', flex: 1 }}>Anthropic · Sonnet 4</span>
            <Sicon.ChevDown size={12} stroke="var(--text-1)"/>
          </div>
          <div style={{
            position: 'absolute', top: 36, left: 0, right: 0,
            background: 'var(--ink-3)', borderRadius: 'var(--r-3)', boxShadow: 'var(--e-2)',
            padding: 4, fontSize: 12,
          }}>
            {[['Anthropic · Sonnet 4', true], ['OpenAI · gpt-5', false], ['Local · Qwen3-1.7B', false]].map(([n, sel]) => (
              <div key={n} style={{
                height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 8,
                background: sel ? 'var(--ink-4)' : 'transparent', borderRadius: 3, color: 'var(--text-1)',
              }}>
                {sel ? <Sicon.Check size={14} stroke="var(--accent)"/> : <span style={{ width: 14 }}/>}
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Splitter({ state }) {
  const isHover = state === 'hover' || state === 'drag';
  return (
    <div style={{
      flex: 1, height: 80, background: 'var(--ink-2)', display: 'grid',
      gridTemplateColumns: '1fr 4px 1fr', borderRadius: 'var(--r-2)', overflow: 'hidden',
      border: '1px solid var(--line)',
    }}>
      <div style={{ background: 'var(--ink-3)' }}/>
      <div style={{
        background: state === 'drag' ? 'var(--accent)' : isHover ? 'var(--accent-tint)' : 'transparent',
        position: 'relative', cursor: 'col-resize',
      }}>
        {isHover && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 2, height: 20, background: state==='drag'?'var(--accent-ink)':'var(--accent)',
            borderRadius: 1, opacity: state === 'drag' ? 0.6 : 1,
          }}/>
        )}
      </div>
      <div style={{ background: 'var(--ink-3)' }}/>
    </div>
  );
}

window.SComp = {
  IconCatalog, ButtonsCard, InputsCard, TabsCard, ChipsCard, BubblesCard, OverlaysCard,
  Btn, TabRow, CiteCompact, CiteText, CiteImage, Bubble, Splitter, Omni,
};
