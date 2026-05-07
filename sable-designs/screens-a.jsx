// Hero screens — full-app window mocks at 1280×820.
// Depends on globals: Sicon, STokens, SComp.

const { Btn, TabRow, CiteCompact, Bubble, Splitter, Omni } = SComp;
const { Logomark } = STokens;

// ── Window chrome ─────────────────────────────────────────
function WinChrome({ children, accent = 'periwinkle', spaceName = 'Personal', os = 'mac', tabCount = 2, contextCount = 1 }) {
  return (
    <div data-space={accent} style={{
      width: '100%', height: '100%',
      background: 'var(--ink-0)', color: 'var(--text-1)',
      fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-13)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Titlebar accent={accent} spaceName={spaceName} os={os} tabCount={tabCount} contextCount={contextCount}/>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

function Titlebar({ accent, spaceName, os, tabCount, contextCount, switcherOpen }) {
  return (
    <div style={{
      height: 36, background: 'var(--ink-1)', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative',
      padding: os === 'mac' ? '0 12px 0 80px' : '0 0 0 12px',
    }}>
      {os === 'mac' && (
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 8 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }}/>
          ))}
        </div>
      )}
      <Logomark size={18}/>
      <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 12px' }}/>
      <SpacePill name={spaceName} accent={accent} active/>
      <div style={{ flex: 1, WebkitAppRegion: 'drag' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
        <span><span style={{ color: 'var(--text-2)' }}>{tabCount}</span> tabs</span>
        {contextCount > 0 && <span style={{ color: 'var(--accent)' }}>· ⌘ {contextCount}</span>}
      </div>
      {os !== 'mac' && (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', marginLeft: 12 }}>
          {[Sicon.WinMin, Sicon.WinMax, Sicon.WinClose].map((I, i) => (
            <div key={i} style={{
              width: 46, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === 2 ? 'transparent' : 'transparent', color: 'var(--text-2)', cursor: 'pointer',
            }}><I size={10}/></div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpacePill({ name, accent, active }) {
  return (
    <button style={{
      height: 22, padding: '0 8px 0 6px', background: active ? 'var(--ink-3)' : 'transparent',
      border: '1px solid var(--line)', borderRadius: 'var(--r-pill)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-1)', fontSize: 11, fontFamily: 'inherit', fontWeight: 540,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--accent)' }}/>
      {name}
      <Sicon.ChevDown size={10} stroke="var(--text-3)"/>
    </button>
  );
}

// ── Sidebar (used by all hero screens) ────────────────────
function Sidebar({ width = 240, tabs, contextSet = new Set(), activeIdx = 2, footerOpen = false }) {
  return (
    <div style={{
      width, background: 'var(--ink-1)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Omnibar */}
      <div style={{ padding: 'var(--s-5) var(--s-5) var(--s-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <button style={navBtn}><Sicon.Back size={14} stroke="var(--text-2)"/></button>
        <button style={navBtn}><Sicon.Fwd size={14} stroke="var(--text-2)"/></button>
        <button style={navBtn}><Sicon.Reload size={14} stroke="var(--text-2)"/></button>
        <button style={{ ...navBtn, marginLeft: 'auto' }}><Sicon.Plus size={14} stroke="var(--text-2)"/></button>
      </div>
      <div style={{ padding: '0 var(--s-5) var(--s-4)' }}>
        <Omni state="idle"/>
      </div>
      {/* Tabs */}
      <div style={{ padding: '0 var(--s-3)', display: 'flex', flexDirection: 'column', gap: 0, flex: 1, overflow: 'hidden' }}>
        <SidebarSection title={`TABS · ${tabs.length}`} extra={`⌘ ${contextSet.size}`}/>
        {tabs.map((t, i) => (
          <TabRow key={i} {...t} state={
            i === activeIdx ? 'active' :
            contextSet.has(i) ? 'context' :
            t.state || 'idle'
          }/>
        ))}
      </div>
      {/* Chat panel */}
      <ChatPanel open={footerOpen}/>
    </div>
  );
}

const navBtn = {
  width: 26, height: 26, borderRadius: 'var(--r-2)', background: 'transparent',
  border: '1px solid transparent', color: 'var(--text-2)', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

function SidebarSection({ title, extra }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 24, padding: '0 var(--s-3)',
      fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--text-4)', fontWeight: 540, marginTop: 4,
    }}>
      <span style={{ flex: 1 }}>{title}</span>
      {extra && <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: 0, textTransform: 'none', fontSize: 10 }}>{extra}</span>}
    </div>
  );
}

function ChatPanel({ open }) {
  return (
    <div style={{
      borderTop: '1px solid var(--line)', background: 'var(--ink-2)', flexShrink: 0,
      maxHeight: open ? 220 : 110, transition: 'max-height var(--t-base) var(--ease)',
    }}>
      <div style={{
        height: 28, padding: '0 var(--s-5)', display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 540,
      }}>
        <Sicon.Spark size={11} stroke="var(--accent)"/>
        <span style={{ flex: 1 }}>Chat</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'none', letterSpacing: 0 }}>sonnet 4</span>
        <Sicon.More size={12} stroke="var(--text-3)"/>
      </div>
      <div style={{ padding: '0 var(--s-5) var(--s-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          <CiteCompact title="Mixtral of Experts" host="arxiv.org" idx={1}/>
        </div>
        <div style={{
          background: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)',
          padding: '8px 10px', display: 'flex', alignItems: 'flex-end', gap: 8, minHeight: 36,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1, fontFamily: 'var(--font-mono)' }}>Ask, or drop a tab…</span>
          <button style={{
            width: 22, height: 22, borderRadius: 'var(--r-2)', background: 'var(--accent)',
            color: 'var(--accent-ink)', border: 0, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><Sicon.Send size={11}/></button>
        </div>
      </div>
    </div>
  );
}

// ── Page placeholder ─────────────────────────────────────
function PageStub({ host = 'arxiv.org', title = 'Mixtral of Experts', sub, children, accent }) {
  return (
    <div style={{ flex: 1, background: 'var(--ink-2)', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
      <div style={{
        height: 28, padding: '0 var(--s-5)', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--ink-1)',
      }}>
        <Sicon.Lock size={11} stroke="var(--ok)"/>
        <span style={{ color: 'var(--text-2)' }}>{host}</span>
        <span style={{ color: 'var(--text-4)' }}>· {sub || '/abs/2401.04088'}</span>
        <span style={{ flex: 1 }}/>
        {accent && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent)' }}/>}
      </div>
      <div style={{ flex: 1, padding: 'var(--s-9)', overflow: 'hidden', position: 'relative' }}>
        {children || <PageContent title={title}/>}
      </div>
    </div>
  );
}

function PageContent({ title }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>arXiv:2401.04088 · Jan 2024</div>
      <div style={{ fontSize: 28, fontWeight: 540, letterSpacing: '-0.02em', marginBottom: 12, color: 'var(--text-1)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Albert Q. Jiang · Alexandre Sablayrolles · Antoine Roux · et al.</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0 }}>We introduce Mixtral 8×7B, a Sparse Mixture of Experts (SMoE) language model. Mixtral has the same architecture as Mistral 7B, with the difference that each layer is composed of 8 feedforward blocks (i.e. experts).</p>
        <p style={{ margin: 0, color: 'var(--text-3)' }}>For every token, at each layer, a router network selects two experts to process the current state and combine their outputs. Even though each token only sees two experts, the selected experts can be different at each timestep.</p>
        <div style={{
          background: 'var(--ink-1)', borderRadius: 'var(--r-3)', padding: 16, border: '1px solid var(--line)',
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)',
        }}>
          <div style={{ color: 'var(--text-4)' }}>// figure 2</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', height: 100 }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ width: 24, height: 24 + (i*4)%32, background: i===1||i===5?'var(--accent)':'var(--ink-4)', borderRadius: 2 }}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Hero 1 · Sidebar (anchor)
// ──────────────────────────────────────────────────────────
function HeroSidebar() {
  const tabs = [
    { fav: 'D', host: 'duckduckgo.com', title: 'sparse mixture of experts' },
    { fav: 'W', host: 'wikipedia.org',  title: 'Mixture of experts (ML)' },
    { fav: 'A', host: 'arxiv.org',      title: 'Mixtral of Experts' },
    { fav: 'P', host: 'paperswithcode', title: 'Long-context evals', state: 'unread' },
    { fav: 'H', host: 'huggingface',    title: 'Open weights · trending' },
    { fav: 'G', host: 'github.com',     title: 'qwen3-1.7B / README' },
    { fav: '·', host: 'arxiv.org',      title: 'Switch Transformers', state: 'loading' },
    { fav: 'C', host: 'claude.ai',      title: 'Claude', state: 'pinned' },
  ];
  return (
    <WinChrome accent="periwinkle" spaceName="Research" tabCount={tabs.length} contextCount={2}>
      <Sidebar tabs={tabs} contextSet={new Set([1, 2])} activeIdx={2} footerOpen/>
      <PageStub accent/>
    </WinChrome>
  );
}

// ──────────────────────────────────────────────────────────
// Hero 2 · Chat composer + bubbles + citation chips
// ──────────────────────────────────────────────────────────
function HeroChat() {
  const tabs = [
    { fav: 'A', host: 'arxiv.org', title: 'Mixtral of Experts' },
    { fav: 'H', host: 'huggingface', title: 'Qwen3-1.7B · model card' },
    { fav: 'G', host: 'github.com', title: 'qwen3-1.7B / README' },
  ];
  return (
    <WinChrome accent="mint" spaceName="Work" tabCount={3} contextCount={3}>
      {/* Slim sidebar */}
      <div style={{ width: 200, background: 'var(--ink-1)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 'var(--s-5) var(--s-5) var(--s-3)', display: 'flex', gap: 6 }}>
          <button style={navBtn}><Sicon.Back size={13} stroke="var(--text-2)"/></button>
          <button style={navBtn}><Sicon.Fwd size={13} stroke="var(--text-2)"/></button>
          <button style={navBtn}><Sicon.Reload size={13} stroke="var(--text-2)"/></button>
        </div>
        <div style={{ padding: '0 var(--s-5) var(--s-5)' }}><Omni state="idle"/></div>
        <div style={{ padding: '0 var(--s-3)' }}>
          <SidebarSection title="TABS · 3" extra="⌘ 3"/>
          {tabs.map((t, i) => <TabRow key={i} {...t} state="context"/>)}
        </div>
      </div>
      {/* Page (compressed) + Chat (expanded) */}
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        <div style={{ flex: 1.2, background: 'var(--ink-2)', borderRight: '1px solid var(--line)', overflow: 'hidden' }}>
          <PageStub host="arxiv.org" sub="/abs/2401.04088" accent/>
        </div>
        <div style={{ width: 440, background: 'var(--ink-2)', display: 'flex', flexDirection: 'column' }}>
          <ChatHeader/>
          <div style={{ flex: 1, padding: 'var(--s-7)', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
            <Bubble role="user">Compare Mixtral and Qwen3-1.7B on long-context recall.</Bubble>
            <Bubble role="assistant">
              <div>Both target the long-context regime, but with different trade-offs:</div>
              <ul style={{ margin: '8px 0', paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.7 }}>
                <li><b style={{ color: 'var(--text-1)' }}>Mixtral 8×7B</b> — sparse MoE, top-2 routing.</li>
                <li><b style={{ color: 'var(--text-1)' }}>Qwen3-1.7B</b> — dense, runs locally.</li>
              </ul>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <CiteCompact title="Mixtral of Experts" host="arxiv.org" idx={1}/>
                <CiteCompact title="Qwen3 model card" host="huggingface.co" idx={2}/>
              </div>
            </Bubble>
            <Bubble role="assistant" streaming>
              On RULER at 32k, Mixtral hits 0.94 needle-in-a-haystack
            </Bubble>
          </div>
          <ChatComposer/>
        </div>
      </div>
    </WinChrome>
  );
}

function ChatHeader() {
  return (
    <div style={{
      height: 38, padding: '0 var(--s-5)', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ink-1)',
    }}>
      <Sicon.Spark size={14} stroke="var(--accent)"/>
      <span style={{ fontSize: 13, fontWeight: 540, color: 'var(--text-1)' }}>Chat</span>
      <button style={{
        height: 22, padding: '0 8px', background: 'var(--ink-3)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-pill)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-1)',
        fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Anthropic · Sonnet 4
        <Sicon.ChevDown size={10} stroke="var(--text-3)"/>
      </button>
      <span style={{ flex: 1 }}/>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>3.4k / 200k</span>
      <button style={navBtn}><Sicon.More size={14} stroke="var(--text-3)"/></button>
    </div>
  );
}

function ChatComposer() {
  return (
    <div style={{ padding: 'var(--s-5)', borderTop: '1px solid var(--line)', background: 'var(--ink-1)' }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        <CiteCompact title="Mixtral of Experts" host="arxiv.org" idx={1}/>
        <CiteCompact title="Qwen3 · README" host="github.com" idx={2}/>
        <CiteCompact image title="Architecture diagram" host="arxiv.org" idx={3}/>
      </div>
      <div style={{
        background: 'var(--ink-3)', border: '1px solid var(--accent)', borderRadius: 'var(--r-3)',
        padding: '10px 12px', display: 'flex', alignItems: 'flex-end', gap: 10,
        boxShadow: '0 0 0 3px var(--accent-soft)',
      }}>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-1)', minHeight: 40, lineHeight: 1.45 }}>
          What does the routing network look like in practice?<span style={{ width: 1, height: 14, background: 'var(--accent)', display: 'inline-block', verticalAlign: 'middle', marginLeft: 1, animation: 'cb 1s steps(2) infinite' }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={{
            ...navBtn, color: 'var(--text-3)',
          }}><Sicon.Image size={14}/></button>
          <button style={{
            ...navBtn, color: 'var(--text-3)',
          }}><Sicon.Link size={14}/></button>
          <button style={{
            width: 26, height: 26, borderRadius: 'var(--r-2)', background: 'var(--accent)',
            color: 'var(--accent-ink)', border: 0, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}><Sicon.Send size={12}/></button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
        <span><kbd style={kbd}>↵</kbd> send</span>
        <span><kbd style={kbd}>⇧↵</kbd> newline</span>
        <span style={{ flex: 1 }}/>
        <span style={{ color: 'var(--text-3)' }}>Drop tabs / images / files into composer</span>
      </div>
    </div>
  );
}

const kbd = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)',
  background: 'var(--ink-3)', padding: '1px 4px', borderRadius: 3, border: '1px solid var(--line)',
};

// ──────────────────────────────────────────────────────────
// Hero 3 · Pane area splits + drop overlay
// ──────────────────────────────────────────────────────────
function HeroSplits() {
  const tabs = [
    { fav: 'A', host: 'arxiv.org',     title: 'Mixtral of Experts' },
    { fav: 'H', host: 'huggingface',   title: 'Qwen3-1.7B' },
    { fav: 'P', host: 'paperswithcode',title: 'RULER · 32k' },
  ];
  return (
    <WinChrome accent="honey" spaceName="Reading" tabCount={3} contextCount={2}>
      <Sidebar width={220} tabs={tabs} contextSet={new Set([1,2])} activeIdx={0} footerOpen={false}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--ink-0)' }}>
        {/* Top half: two horizontally-split panes */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
          <div style={{ flex: 1, background: 'var(--ink-2)', minWidth: 0, position: 'relative' }}>
            <PageStub host="arxiv.org" sub="/abs/2401.04088" title="Mixtral of Experts" accent>
              <PageMini title="Mixtral of Experts" host="arxiv.org"/>
            </PageStub>
          </div>
          {/* Splitter */}
          <div style={{ width: 4, background: 'transparent', position: 'relative', cursor: 'col-resize' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'var(--accent-tint)' }}/>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 2, height: 24, borderRadius: 1, background: 'var(--accent)',
            }}/>
          </div>
          <div style={{ flex: 1, background: 'var(--ink-2)', minWidth: 0, position: 'relative' }}>
            <PageStub host="huggingface.co" sub="/Qwen/Qwen3-1.7B">
              <PageMini title="Qwen3-1.7B" host="huggingface.co" variant="modelcard"/>
            </PageStub>
          </div>
        </div>
        {/* Bottom: third pane */}
        <div style={{ height: 4, background: 'var(--accent-tint)' }}/>
        <div style={{ height: 240, background: 'var(--ink-2)', position: 'relative' }}>
          <PageStub host="paperswithcode.com" sub="/sota/long-context-ruler">
            <PageMini title="RULER · 32k context" host="paperswithcode.com" variant="leaderboard"/>
          </PageStub>
          {/* Drop overlay over bottom pane */}
          <DropOverlay/>
        </div>
        {/* Drag chip near cursor */}
        <DragChip/>
      </div>
    </WinChrome>
  );
}

function DropOverlay() {
  // Persistent dashed quadrants + accent-soft hover preview on right half.
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Quadrant grid — persistent faint outlines */}
      <div style={{ position: 'absolute', inset: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            border: '1px dashed color-mix(in oklch, var(--accent) 32%, transparent)',
            borderRadius: 'var(--r-2)',
          }}/>
        ))}
      </div>
      {/* Right-half hover preview */}
      <div style={{
        position: 'absolute', top: 6, right: 6, width: 'calc(50% - 9px)', bottom: 6,
        background: 'var(--accent-soft)',
        border: '1.5px solid var(--accent)',
        borderRadius: 'var(--r-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 12, fontWeight: 540 }}>
          <Sicon.SplitV size={16} stroke="var(--accent)"/>
          <span>Open as right split</span>
        </div>
      </div>
      {/* Center "open as tab" dot */}
      <div style={{
        position: 'absolute', top: '50%', left: '25%', transform: 'translate(-50%,-50%)',
        width: 32, height: 32, borderRadius: '50%', background: 'var(--ink-1)',
        border: '1px dashed color-mix(in oklch, var(--accent) 50%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
      }}><Sicon.Plus size={14}/></div>
    </div>
  );
}

function DragChip() {
  return (
    <div style={{
      position: 'absolute', top: '52%', right: '36%', pointerEvents: 'none',
      transform: 'rotate(-2deg)',
    }}>
      <div style={{
        background: 'var(--ink-3)', border: '1px solid var(--accent)', borderRadius: 'var(--r-2)',
        padding: '6px 10px', boxShadow: 'var(--e-3)',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-1)',
      }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-2)', fontWeight: 540 }}>P</div>
        Long-context evals
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>·paperswithcode</span>
      </div>
      <div style={{ position: 'absolute', top: -10, right: -10, width: 22, height: 22, borderRadius: 11, background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 11, fontWeight: 540, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+1</div>
    </div>
  );
}

function PageMini({ title, host, variant }) {
  if (variant === 'modelcard') {
    return (
      <div style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--text-2)' }}>Qwen</span>/Qwen3-1.7B
          <span style={{
            background: 'var(--ok)', color: '#0B0C10', fontFamily: 'inherit',
            fontSize: 9, padding: '1px 5px', borderRadius: 2, fontWeight: 540,
          }}>RECOMMENDED</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 540, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</div>
        <div style={{
          background: 'var(--ink-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)',
          padding: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px',
        }}>
          <span style={{ color: 'var(--text-3)' }}>params</span><span>1.7B</span>
          <span style={{ color: 'var(--text-3)' }}>context</span><span>32k</span>
          <span style={{ color: 'var(--text-3)' }}>license</span><span>Apache 2.0</span>
          <span style={{ color: 'var(--text-3)' }}>quant</span><span>Q5_K_M · 1.4 GB</span>
        </div>
      </div>
    );
  }
  if (variant === 'leaderboard') {
    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 540, marginBottom: 10 }}>{title}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)',
          display: 'grid', gridTemplateColumns: '20px 1fr 60px 50px', rowGap: 4, columnGap: 12,
        }}>
          <span style={{ color: 'var(--text-4)' }}>#</span>
          <span style={{ color: 'var(--text-4)' }}>model</span>
          <span style={{ color: 'var(--text-4)', textAlign: 'right' }}>recall</span>
          <span style={{ color: 'var(--text-4)', textAlign: 'right' }}>ctx</span>
          {[
            ['1', 'Claude 3.5 Sonnet', '0.97', '200k'],
            ['2', 'GPT-5', '0.96', '128k'],
            ['3', 'Mixtral 8×7B',     '0.94', '32k'],
            ['8', 'Qwen3-1.7B',       '0.81', '32k'],
          ].map((r, i) => (
            <React.Fragment key={i}>
              <span style={{ color: 'var(--text-3)' }}>{r[0]}</span>
              <span style={{ color: 'var(--text-1)' }}>{r[1]}</span>
              <span style={{ textAlign: 'right', color: 'var(--accent)' }}>{r[2]}</span>
              <span style={{ textAlign: 'right', color: 'var(--text-3)' }}>{r[3]}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  return <PageContent title={title}/>;
}

window.SScreens1 = { HeroSidebar, HeroChat, HeroSplits, WinChrome, Sidebar, PageStub, ChatComposer, DropOverlay, navBtn, kbd };
