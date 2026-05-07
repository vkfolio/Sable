// Sable icon set — custom 16px / 20px / 24px grid, 1.5px stroke, round caps.
// Matches Inter regular weight visually. All icons are functional <svg>
// components so they inherit color and accept a size prop.

const Ic = ({ d, size = 16, fill, stroke = 'currentColor', sw = 1.5, children, vb = 24 }) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill || 'none'}
    stroke={fill ? 'none' : stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'block' }}>
    {d ? <path d={d} /> : children}
  </svg>
);

// ── Navigation ───────────────────────────────────────────
const IcBack = (p) => <Ic {...p} d="M15 18l-6-6 6-6" />;
const IcFwd  = (p) => <Ic {...p} d="M9 6l6 6-6 6" />;
const IcReload = (p) => (
  <Ic {...p}><path d="M3.5 4.5v5h5"/><path d="M20.5 19.5v-5h-5"/><path d="M19 9a8 8 0 0 0-14.3-1.5M5 15a8 8 0 0 0 14.3 1.5"/></Ic>
);
const IcStop = (p) => <Ic {...p}><rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/></Ic>;

// ── App actions ──────────────────────────────────────────
const IcPlus  = (p) => <Ic {...p} d="M12 5v14M5 12h14" />;
const IcClose = (p) => <Ic {...p} d="M6 6l12 12M18 6L6 18" />;
const IcSearch = (p) => <Ic {...p}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></Ic>;
const IcCmd = (p) => <Ic {...p}><path d="M9 6h6v12H9z"/><path d="M9 6a3 3 0 1 1-3 3h3M15 6a3 3 0 1 0 3 3h-3M9 18a3 3 0 1 0-3-3h3M15 18a3 3 0 1 1 3-3h-3"/></Ic>;
const IcSettings = (p) => (
  <Ic {...p}><circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Ic>
);
const IcMore = (p) => <Ic {...p}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></Ic>;
const IcChevDown = (p) => <Ic {...p} d="M6 9l6 6 6-6" />;
const IcChevRight = (p) => <Ic {...p} d="M9 6l6 6-6 6" />;
const IcCheck = (p) => <Ic {...p} d="M5 12.5l4.5 4.5L19 7.5" />;

// ── Tabs / browser ───────────────────────────────────────
const IcLock = (p) => <Ic {...p}><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></Ic>;
const IcGlobe = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Ic>;
const IcPin = (p) => <Ic {...p}><path d="M12 17v5"/><path d="M9 4h6l-1 5 3 3H7l3-3-1-5z"/></Ic>;

// ── Chat / AI ────────────────────────────────────────────
const IcSpark = (p) => <Ic {...p} d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" />;
const IcSend  = (p) => <Ic {...p}><path d="M4 12l16-8-5 16-3.5-6.5L4 12z"/></Ic>;
const IcStopSquare = (p) => <Ic {...p}><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none"/></Ic>;
const IcQuote = (p) => <Ic {...p}><path d="M7 8h4v4l-2 5H6l1-5V8zM15 8h4v4l-2 5h-3l1-5V8z" fill="currentColor" stroke="none"/></Ic>;
const IcImage = (p) => <Ic {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l4.5-4.5L13 17l3-3 4 4"/></Ic>;
const IcLink = (p) => <Ic {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7L11.5 7"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.5"/></Ic>;

// ── State ────────────────────────────────────────────────
const IcCheckCircle = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5.5-6"/></Ic>;
const IcAlert = (p) => <Ic {...p}><path d="M12 4l10 17H2L12 4z"/><path d="M12 10v5M12 18v.01"/></Ic>;
const IcInfo = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></Ic>;

// ── Layout ──────────────────────────────────────────────
const IcSplitH = (p) => <Ic {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M12 4.5v15"/></Ic>;
const IcSplitV = (p) => <Ic {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 12h17"/></Ic>;
const IcSidebar = (p) => <Ic {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M9 4.5v15"/></Ic>;
const IcDownload = (p) => <Ic {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></Ic>;
const IcKey = (p) => <Ic {...p}><circle cx="8" cy="14" r="3.5"/><path d="M11 12l9-9 2 2-2 2 2 2-2 2-3-3"/></Ic>;
const IcCpu = (p) => <Ic {...p}><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="0.5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/></Ic>;
const IcCloud = (p) => <Ic {...p}><path d="M7 18a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.5 1.5A4 4 0 0 1 17 18H7z"/></Ic>;

// ── Window ──────────────────────────────────────────────
const IcWinMin = (p) => <svg width={p.size||10} height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>;
const IcWinMax = (p) => <svg width={p.size||10} height={p.size||10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="9" height="9"/></svg>;
const IcWinClose = (p) => <svg width={p.size||10} height={p.size||10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M1 1l8 8M9 1l-8 8"/></svg>;

window.Sicon = {
  Back: IcBack, Fwd: IcFwd, Reload: IcReload, Stop: IcStop,
  Plus: IcPlus, Close: IcClose, Search: IcSearch, Cmd: IcCmd,
  Settings: IcSettings, More: IcMore, ChevDown: IcChevDown, ChevRight: IcChevRight, Check: IcCheck,
  Lock: IcLock, Globe: IcGlobe, Pin: IcPin,
  Spark: IcSpark, Send: IcSend, StopSquare: IcStopSquare, Quote: IcQuote, Image: IcImage, Link: IcLink,
  CheckCircle: IcCheckCircle, Alert: IcAlert, Info: IcInfo,
  SplitH: IcSplitH, SplitV: IcSplitV, Sidebar: IcSidebar, Download: IcDownload, Key: IcKey, Cpu: IcCpu, Cloud: IcCloud,
  WinMin: IcWinMin, WinMax: IcWinMax, WinClose: IcWinClose,
};
