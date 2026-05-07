// Hero screens — Settings, Titlebar/Space switcher, and small-window variant.
// Depends on globals: Sicon, STokens, SComp, SScreens1.

const { WinChrome: WinChromeB, Sidebar: SidebarB, PageStub: PageStubB, navBtn: navBtnB, kbd: kbdB } = SScreens1;
const { Btn: BtnB, Omni: OmniB, TabRow: TabRowB } = SComp;

// ──────────────────────────────────────────────────────────
// Hero 4 · Settings · BYOK + local model
// ──────────────────────────────────────────────────────────
function HeroSettings() {
  const tabs = [
    { fav: 'A', host: 'arxiv.org', title: 'Mixtral of Experts' },
    { fav: 'H', host: 'huggingface', title: 'Qwen3-1.7B' },
  ];
  return (
    <WinChromeB accent="iris" spaceName="Personal" tabCount={2} contextCount={1}>
      <SidebarB width={220} tabs={tabs} contextSet={new Set()} activeIdx={0}/>
      <div style={{ flex: 1, position: 'relative', background: 'var(--ink-2)' }}>
        <PageStubB host="arxiv.org" sub="/abs/2401.04088"/>
        {/* Modal scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,10,0.7)', backdropFilter: 'blur(2px)' }}/>
        {/* Modal */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 720, maxHeight: 'calc(100% - 60px)',
          background: 'var(--ink-2)', borderRadius: 'var(--r-4)',
          boxShadow: 'var(--e-3)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <SettingsHeader/>
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <SettingsNav/>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              <ProvidersBlock/>
              <div style={{ height: 24 }}/>
              <LocalModelBlock/>
            </div>
          </div>
        </div>
      </div>
    </WinChromeB>
  );
}

function SettingsHeader() {
  return (
    <div style={{
      height: 44, padding: '0 16px', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ink-1)',
    }}>
      <span style={{ fontSize: 14, fontWeight: 540, color: 'var(--text-1)' }}>Settings</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', marginLeft: 4 }}>⌘,</span>
      <span style={{ flex: 1 }}/>
      <button style={{ ...navBtnB }}><Sicon.Close size={14} stroke="var(--text-2)"/></button>
    </div>
  );
}

function SettingsNav() {
  const items = [
    ['General', null],
    ['Providers', 'active'],
    ['Spaces', null],
    ['Privacy', null],
    ['Shortcuts', null],
    ['Advanced', null],
    ['About', null],
  ];
  return (
    <div style={{
      width: 180, background: 'var(--ink-1)', borderRight: '1px solid var(--line)',
      padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 1,
    }}>
      {items.map(([n, st]) => (
        <button key={n} style={{
          height: 28, padding: '0 10px', borderRadius: 'var(--r-2)',
          background: st === 'active' ? 'var(--ink-3)' : 'transparent',
          border: 0, color: st === 'active' ? 'var(--text-1)' : 'var(--text-2)',
          fontSize: 12, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
          fontWeight: st === 'active' ? 540 : 400,
          position: 'relative',
        }}>
          {st === 'active' && <span style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 2, borderRadius: 1, background: 'var(--accent)' }}/>}
          {n}
        </button>
      ))}
    </div>
  );
}

function ProvidersBlock() {
  const providers = [
    { name: 'Anthropic', sub: 'Claude · Sonnet 4', state: 'active', dot: 'var(--ok)' },
    { name: 'OpenAI',    sub: 'gpt-5 · gpt-5-mini', state: 'viewed', dot: null },
    { name: 'Local',     sub: 'Qwen3-1.7B',       state: 'viewed', dot: null },
  ];
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 540, color: 'var(--text-1)', marginBottom: 4, letterSpacing: '-0.01em' }}>Providers</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>
        Bring your own key, or run locally. Stored in OS keychain — never plaintext, never exposed to the chrome.
      </div>
      {/* Provider pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {providers.map((p) => (
          <ProviderPill key={p.name} {...p}/>
        ))}
      </div>
      {/* API key field */}
      <div style={{ background: 'var(--ink-3)', borderRadius: 'var(--r-3)', padding: 16, border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sicon.Spark size={16} stroke="var(--accent)"/>
          <span style={{ fontSize: 14, fontWeight: 540, color: 'var(--text-1)' }}>Anthropic</span>
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 540,
            background: 'color-mix(in oklch, var(--ok) 18%, transparent)', color: 'var(--ok)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--ok)' }}/>
            Active
          </span>
          <span style={{ flex: 1 }}/>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>console.anthropic.com</span>
        </div>
        <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>API key</label>
        <div style={{
          height: 32, background: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-2)',
          padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-1)',
        }}>
          <Sicon.Key size={13} stroke="var(--text-3)"/>
          <span style={{ flex: 1 }}>sk-ant-api03-···········w7Yz</span>
          <span style={{ color: 'var(--ok)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sicon.CheckCircle size={12} stroke="var(--ok)"/>Verified
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
          <Sicon.Lock size={11} stroke="var(--ok)"/>
          Stored in macOS Keychain · last used 4m ago
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <BtnB kind="secondary">Replace key</BtnB>
          <BtnB kind="ghost">Remove</BtnB>
          <span style={{ flex: 1 }}/>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
            <span style={{ width: 28, height: 16, borderRadius: 8, background: 'var(--accent)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: 6, background: 'white' }}/>
            </span>
            Default for new chats
          </label>
        </div>
      </div>
    </div>
  );
}

function ProviderPill({ name, sub, state, dot }) {
  const isActive = state === 'active';
  return (
    <div style={{
      flex: 1, padding: '12px 14px',
      background: isActive ? 'var(--ink-3)' : 'var(--ink-2)',
      border: isActive ? '1px solid var(--accent)' : '1px solid var(--line)',
      borderRadius: 'var(--r-3)', position: 'relative', cursor: 'pointer',
      boxShadow: isActive ? '0 0 0 3px var(--accent-soft)' : 'none',
    }}>
      {isActive && <span style={{ position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3, background: 'var(--ok)', boxShadow: '0 0 0 3px color-mix(in oklch, var(--ok) 20%, transparent)' }}/>}
      <div style={{ fontSize: 13, fontWeight: 540, color: isActive ? 'var(--text-1)' : 'var(--text-2)', marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{sub}</div>
    </div>
  );
}

function LocalModelBlock() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 540, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Local model</span>
        <span style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 540,
          background: 'var(--accent-tint)', color: 'var(--accent)',
        }}>OFFLINE-CAPABLE</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>
        Runs on your machine. No network, no key. Slower than hosted models but private.
      </div>
      {/* Recommended row */}
      <div style={{
        background: 'var(--ink-3)', border: '1px solid var(--accent)',
        borderRadius: 'var(--r-3)', padding: 16, marginBottom: 8,
        boxShadow: '0 0 0 3px var(--accent-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Sicon.Cpu size={20} stroke="var(--accent)"/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 540, color: 'var(--text-1)' }}>Qwen3-1.7B</span>
              <span style={{
                fontSize: 9, padding: '2px 5px', borderRadius: 2, fontWeight: 540, letterSpacing: '0.06em',
                background: 'var(--accent)', color: 'var(--accent-ink)',
              }}>RECOMMENDED</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              Q5_K_M · 1.4 GB · 32k context · Apache 2.0
            </div>
          </div>
          <BtnB kind="primary" leading={<Sicon.Download size={13}/>}>Install</BtnB>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
          Best balance of quality and speed for chat-with-page on a 16 GB MacBook. Boots in ~2 s once installed.
        </div>
      </div>
      {/* Other rows */}
      {[
        { name: 'Qwen3-4B',  sub: 'Q4_K_M · 2.5 GB · 32k context', state: 'available' },
        { name: 'Qwen3-7B',  sub: 'Q4_K_M · 4.4 GB · 32k context · needs ≥ 16 GB RAM', state: 'available' },
        { name: 'Llama-3.2-3B', sub: 'Q4_K_M · 1.9 GB · 8k context', state: 'downloading' },
      ].map((m) => (
        <ModelRow key={m.name} {...m}/>
      ))}
    </div>
  );
}

function ModelRow({ name, sub, state }) {
  return (
    <div style={{
      background: 'var(--ink-3)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-3)', padding: '12px 16px', marginTop: 6,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <Sicon.Cpu size={16} stroke="var(--text-3)"/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 540, color: 'var(--text-2)' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{sub}</div>
        {state === 'downloading' && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'var(--ink-1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '64%', height: '100%', background: 'var(--accent)', borderRadius: 2 }}/>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>1.2 / 1.9 GB · 8.4 MB/s</span>
          </div>
        )}
      </div>
      {state === 'available' && <BtnB kind="secondary" leading={<Sicon.Download size={12}/>}>Install</BtnB>}
      {state === 'downloading' && <BtnB kind="ghost">Cancel</BtnB>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Hero 5 · Titlebar + space switcher
// ──────────────────────────────────────────────────────────
function HeroSwitcher() {
  const tabs = [
    { fav: 'A', host: 'arxiv.org', title: 'Mixtral of Experts' },
    { fav: 'W', host: 'wikipedia', title: 'Mixture of experts' },
  ];
  return (
    <WinChromeB accent="rose" spaceName="Personal" tabCount={2}>
      <SidebarB width={220} tabs={tabs} contextSet={new Set()} activeIdx={0}/>
      <div style={{ flex: 1, position: 'relative', background: 'var(--ink-2)' }}>
        <PageStubB host="arxiv.org" sub="/abs/2401.04088"/>
        {/* Switcher dropdown — anchored to titlebar */}
        <div style={{ position: 'absolute', top: 4, left: 76, zIndex: 10 }}>
          <SwitcherDropdown/>
        </div>
        {/* Pointer/leader */}
        <div style={{ position: 'absolute', top: -4, left: 100, width: 8, height: 8, background: 'var(--ink-3)', transform: 'rotate(45deg)', borderTop: '1px solid var(--line)', borderLeft: '1px solid var(--line)' }}/>
      </div>
    </WinChromeB>
  );
}

function SwitcherDropdown() {
  const spaces = [
    { name: 'Personal', accent: 'rose',       tabs: 2, ctx: 0, active: true,  shortcut: '⌃1' },
    { name: 'Research', accent: 'periwinkle', tabs: 8, ctx: 2, active: false, shortcut: '⌃2' },
    { name: 'Work',     accent: 'mint',       tabs: 3, ctx: 3, active: false, shortcut: '⌃3' },
    { name: 'Reading',  accent: 'honey',      tabs: 5, ctx: 0, active: false, shortcut: '⌃4' },
    { name: 'Study',    accent: 'iris',       tabs: 1, ctx: 0, active: false, shortcut: '⌃5' },
    { name: 'Play',     accent: 'coral',      tabs: 0, ctx: 0, active: false, shortcut: '⌃6' },
  ];
  return (
    <div style={{
      width: 320, background: 'var(--ink-3)', borderRadius: 'var(--r-3)',
      boxShadow: 'var(--e-3)', padding: 6, border: '1px solid var(--line)',
    }}>
      <div style={{ padding: '6px 10px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 540, flex: 1 }}>Spaces</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>⌃␣</span>
      </div>
      {spaces.map((s) => (
        <SpaceRow key={s.name} {...s}/>
      ))}
      <div style={{ height: 1, background: 'var(--line)', margin: '6px 0' }}/>
      <button style={{
        height: 30, width: '100%', padding: '0 10px', borderRadius: 'var(--r-2)',
        background: 'transparent', border: 0, color: 'var(--text-2)',
        fontSize: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Sicon.Plus size={13} stroke="var(--text-3)"/>New space
      </button>
    </div>
  );
}

function SpaceRow({ name, accent, tabs, ctx, active, shortcut }) {
  return (
    <button data-space={accent} style={{
      width: '100%', height: 36, padding: '0 10px',
      background: active ? 'var(--ink-4)' : 'transparent', border: 0,
      borderRadius: 'var(--r-2)', color: 'var(--text-1)', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      position: 'relative',
    }}>
      {active && <span style={{ position: 'absolute', left: 2, top: 8, bottom: 8, width: 2, borderRadius: 1, background: 'var(--accent)' }}/>}
      <span style={{
        width: 18, height: 18, borderRadius: 'var(--r-2)',
        background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: 'var(--accent-ink)', fontWeight: 540,
      }}>{name[0]}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 540 : 400, flex: 1, textAlign: 'left' }}>{name}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{tabs}</span>
      {ctx > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', background: 'var(--accent-tint)', padding: '1px 4px', borderRadius: 2 }}>⌘{ctx}</span>}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', width: 26, textAlign: 'right' }}>{shortcut}</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────
// Compact 720×600 — minimum window, tight density
// ──────────────────────────────────────────────────────────
function HeroCompact() {
  const tabs = [
    { fav: 'A', host: 'arxiv.org', title: 'Mixtral of Experts' },
    { fav: 'H', host: 'huggingface', title: 'Qwen3-1.7B' },
  ];
  return (
    <WinChromeB accent="coral" spaceName="Play" tabCount={2}>
      <SidebarB width={180} tabs={tabs} contextSet={new Set([0,1])} activeIdx={0} footerOpen={false}/>
      <PageStubB host="arxiv.org" sub="/abs/2401.04088" accent>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>arXiv:2401.04088</div>
          <div style={{ fontSize: 18, fontWeight: 540, marginBottom: 8, letterSpacing: '-0.01em' }}>Mixtral of Experts</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>Jiang · Sablayrolles · Roux et al.</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Mixtral 8×7B is a Sparse Mixture of Experts language model. Each layer has 8 feedforward experts; a router selects two per token, per layer.
          </div>
        </div>
      </PageStubB>
    </WinChromeB>
  );
}

window.SScreens2 = { HeroSettings, HeroSwitcher, HeroCompact, SwitcherDropdown };
