<div align="center">

<img src="resources/icon.svg" alt="Sable" width="120" height="120" />

# Sable

**A browser where chat and pages are one workspace.**

<p>
  <img alt="status" src="https://img.shields.io/badge/status-V1.0_alpha-7adabf?style=flat-square" />
  <img alt="platforms" src="https://img.shields.io/badge/platforms-Windows%20·%20macOS%20·%20Linux-6b7cff?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square" />
  <img alt="electron" src="https://img.shields.io/badge/electron-33-9feaf9?style=flat-square" />
  <img alt="typescript" src="https://img.shields.io/badge/typescript-5.7-3178c6?style=flat-square" />
  <img alt="layout-engine tests" src="https://img.shields.io/badge/layout--engine_tests-41%2F41-7adabf?style=flat-square" />
  <img alt="contributions welcome" src="https://img.shields.io/badge/contributions-welcome-ff8fa3?style=flat-square" />
</p>

</div>

---

Sable is an AI-first desktop browser. The chat panel doesn't just *read* the page — it **interoperates** with it. Drop a paragraph anywhere in the chat sidebar for an auto-citation. Drop an image for a multimodal prompt. Ctrl-click multiple tabs to weave them into one unified AI context. Drag a tab pill onto another to **group** them — they auto-split side-by-side. Drag a pill to a pane edge for arbitrary BSP-nested splits.

It's not a Chrome wrapper with a chat button. It's a real browser shell on Electron + `WebContentsView`, a custom binary-space-partitioning layout engine, a LangGraphJS orchestrator emitting open [AG-UI Protocol](https://docs.ag-ui.com) events, embedded Qwen 3 (Apache 2.0, runs offline) plus BYOK Anthropic / OpenAI for higher-quality work, and a roadmap aimed squarely at **recordable workflow skills, learning from your history, and a personal knowledge graph** that turns every page you've ever read into queryable context.

Cross-platform from V0.1: **Windows, macOS, Linux**.

---

## Table of contents

- [Highlights](#highlights)
- [What you can do today](#what-you-can-do-today)
- [Personalities — per-space themes](#personalities--per-space-themes)
- [Onboarding](#onboarding)
- [Quickstart](#quickstart)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Roadmap](#roadmap)
- [Repo layout](#repo-layout)
- [Privacy posture](#privacy-posture)
- [Built on](#built-on)
- [Contributing & license](#contributing--license)

---

## Highlights

| | |
|---|---|
| **Real browser shell** | Frameless chrome, custom titlebar, native window controls per OS |
| **BSP-nested split panes** | Drag a tab pill onto a pane edge → 5-zone drop overlay → splits nest arbitrarily, dividers drag-resize |
| **Tab groups** | Drag pill onto pill → groups them, auto-splits side-by-side. Group decoupled from BSP, persisted on `TabState` |
| **AI chat that *interoperates*** | Drop **anywhere** in the chat sidebar → page text becomes a markdown citation, page images go in as multimodal content |
| **Multi-tab unified AI context** | Ctrl-click tabs to add as context — extracts main content, token-budgets, tells you what was excluded |
| **Hybrid intent resolver** | NTP omnibox uses instant static rules (sites + intent keywords) and falls back to the local LLM for novel phrasing — single-flight cancellation, partial-JSON salvage |
| **History-powered autocomplete** | Recent + frequency-ranked search wired into the global URL bar and the new-tab page |
| **Customizable bookmarks** | Pin & reorder bookmarks on the new-tab page; persisted in chrome state |
| **Markdown chat** | Streamed replies render as full GFM — code blocks, lists, links, tables |
| **3 providers, 1 stream** | Anthropic, OpenAI, embedded Qwen 3 — same LangGraphJS pipeline, same AG-UI events |
| **Embedded model is Apache 2.0** | Qwen 3 (1.7B default, 4B for higher quality, 0.6B for low-end). Runs offline. ~1.1 GB |
| **Spaces with full themes** | Multiple workspaces — each gets its own vibrant pastel theme (lavender / mint / coral / amber / rose / sky / sage), light/dark inside each |
| **First-launch onboarding** | CSS splash → name capture → recommended local-model download (skippable). Re-runnable via `SABLE_RESET=1` |
| **Keys in OS keychain** | Anthropic / OpenAI keys via Windows Credential Manager / macOS Keychain / libsecret. Never plaintext, never reach the renderer |
| **41/41 layout-engine tests** | Pure TS BSP package — drag-drop / split / resize / group logic is provably correct |
| **CI matrix** | GitHub Actions: typecheck + tests + builds on Windows, macOS, Linux on every PR |

---

## What you can do today

### Browse with a real shell

```
+------------------------------------------------------------------+
| ◼ Sable    [ddg ✕] [wiki ✕] [github ✕] [+]          ─  □  ×      |  ← frameless titlebar + horizontal tab strip
+------------------------------------------------------------------+
| ‹ › ↻  https://duckduckgo.com                       [3]  💬  ⋯   |  ← global URL bar (single-pane)
+----------+-------------------------------------------------------+
|          |   active tab WebContentsView                          |
|          |   (drag pill to a pane edge to split,                 |
|   chat   |    drag pill onto another pill to group)              |
|          |                                                       |
+----------+-------------------------------------------------------+
```

- **Horizontal tab strip in the titlebar** (per active space). Drag a pill to a pane edge → 5-zone overlay → split. Drag a pill **onto another pill** → group; the layout auto-splits the two side-by-side.
- **Multi-pane mode shows mini per-pane URL bars.** The global URL bar hides; each pane carries its own focused omnibox so you always know which pane you're driving.
- **Customizable pinned bookmarks** on the new-tab page. Add, rename, reorder.
- **History-powered autocomplete** on both the NTP omnibox and the global URL bar — recent + frequency-weighted.
- **Hybrid intent resolver** on the NTP omnibox. Type `yt some band` and Enter → YouTube. Type `flight sfo to nrt` → Google Flights. Type something the static rules don't know → the embedded LLM resolves it (single-flight, abortable, falls back to a Google search if uncertain).
- Frameless chrome with platform-native controls (Win 11 snap-layouts, Mac traffic lights, Linux custom).
- **Shortcuts:** `Ctrl+T` new tab · `Ctrl+N` new window · `Ctrl+W` close tab · `Ctrl+L` focus URL bar · `Ctrl+R` reload · `Ctrl+.` toggle chat sidebar · `F12` DevTools.

### Chat that *uses* what you're browsing

- **Drop anywhere in the chat sidebar** — text drops become markdown blockquote citations with the source URL; image drops are fetched bypassing renderer CORS and sent as inline multimodal content.
- **Ctrl-click multiple tabs** in the strip → flagged with a `ctx` badge → on send, their main content is extracted, prefixed with `## Tab: <title>` blocks, token-budgeted (greedy-by-recency, hard cap 18 KB), excess shown as "Tab N excluded".
- **All replies render as markdown** — code blocks, lists, links, tables, syntax highlighting.
- **Resizable sidebar** with a draggable left edge.
- Right-click a tab → quick-toggle context, **Move to space →**, close.

### Three providers, one streaming pipeline

| Provider | Setup | Cold start |
|---|---|---|
| **Anthropic** | Paste `sk-ant-…` key in Settings → stored in OS keychain | < 100 ms first token |
| **OpenAI** | Paste `sk-…` key in Settings | < 100 ms first token |
| **Embedded Qwen 3** | Click **Download** in Settings → Qwen 3 (embedded) → ~1.1 GB | 1-5 sec model load on first message |

All three stream through the same `LangGraphJS` `StateGraph`, emit standardized [AG-UI Protocol](https://docs.ag-ui.com) events (`TEXT_MESSAGE_START` / `_CONTENT` / `_END` for now; tool calls + state snapshots reserved for V1.x agentic features), and reduce into the same chat store. The orchestrator also exposes a non-streaming `oneShot()` used by the intent resolver for fast single-turn lookups.

### Embedded model: Qwen 3 (Apache 2.0)

Three variants, user picks at onboarding or in Settings:

| Variant | Size | Use case | Tok/s (CPU baseline) |
|---|---|---|---|
| Qwen 3 0.6B | ~400 MB | Ultra-low-end / Chromebooks | 50+ |
| **Qwen 3 1.7B** *(default)* | ~1.1 GB | 8 GB RAM, no GPU | 25-40 |
| Qwen 3 4B Instruct (2507) | ~2.5 GB | 16 GB RAM, higher quality | 10-18 (60+ on Metal) |

Why Qwen 3 over Gemma 3 / Llama 3.2: **Apache 2.0**. No MAU clause, no remote-revocation, no attribution requirement. The only clean license for a default model in a shipped consumer browser. MMLU 65.6 (1.7B) / 84.2 (4B), 256K native context, single chat template across sizes. Streams via `node-llama-cpp` (Vulkan/CUDA on Win, Metal on Mac, CUDA/Vulkan on Linux). Qwen 3's `<think>` reasoning tokens are filtered out client-side so the chat bubble shows only the answer.

---

## Personalities — per-space themes

Each Space is a **personality**: a vibrant pastel theme that re-tints every chrome surface.

| Theme | Vibe |
|---|---|
| Lavender | Default — calm focus |
| Mint | Fresh, low-stim |
| Coral | Warm, energizing |
| Amber | Notebook / archival |
| Rose | Reading / writing |
| Sky | Light & airy |
| Sage | Earthy, neutral-warm |

Each theme has a light and dark sub-mode. Pastels mix into the bg/surface ladder so the chrome never feels like a one-tag highlight — the whole window adopts the personality.

- Pick a color when creating a space.
- Recolor any time from Settings → Spaces.
- Light/dark toggle is a sub-mode within each theme; a future release will auto-follow OS.

---

## Onboarding

First launch:

1. **Splash** — full-screen CSS animation of the Sable mark.
2. **Name** — what should Sable call you? Used in greetings, persisted to chrome state.
3. **Model** — choose a recommended local model (Qwen 3 1.7B by default). Skip if you're a BYOK user; you can still paste an Anthropic / OpenAI key in Settings.
4. **Done** — straight into your first space.

Re-run any time with `SABLE_RESET=1 pnpm shell` (clears the chrome `localStorage` so the onboarding fires again).

---

## Quickstart

```bash
git clone https://github.com/your-org/sable.git
cd sable
pnpm install
pnpm shell
```

> The `your-org` slug is a placeholder — substitute the real GitHub org once we publish.

A frameless Sable window opens with onboarding. After name + model, send a message — streaming responses arrive token-by-token through the AG-UI pipeline.

**Prerequisites:**

- Node 22.14+ (`.nvmrc` provided)
- pnpm 9.15+
- macOS hardware required for native macOS builds (CI handles Linux)
- `keytar` ships pre-built binaries via `prebuild-install`; no native compiler needed in normal cases
- `node-llama-cpp` ships prebuilds for Vulkan / CUDA / Metal / CPU; auto-selects backend at runtime

**Other commands:**

```bash
pnpm typecheck             # all workspaces
pnpm test                  # layout engine: 41 tests
pnpm chrome-ui:dev         # iterate on chrome-ui with HMR
pnpm spike                 # rerun the Phase 0 cross-WebContentsView drag spike
SABLE_DEV=1 pnpm shell     # auto-open chrome DevTools
SABLE_RESET=1 pnpm shell   # wipe chrome localStorage (re-trigger onboarding)
```

---

## Architecture

```
                                ┌────────────────────────────────────────┐
                                │  Electron main (Node)                  │
                                │                                        │
                                │  WindowManager                         │
                                │   ├─ TabManager · LayoutController     │
                                │   ├─ SpaceManager                      │
                                │   ├─ HistoryManager (recent + search)  │
                                │   ├─ ChatOrchestrator (LangGraphJS)    │
                                │   │   ├─ StateGraph (stream)           │
                                │   │   └─ oneShot() (intent resolver)   │
                                │   │       ├─ ChatAnthropic             │
                                │   │       ├─ ChatOpenAI                │
                                │   │       └─ QwenLocalChatModel        │
                                │   │          (node-llama-cpp)          │
                                │   ├─ LocalModelManager (downloads)     │
                                │   ├─ SettingsStore + keytar            │
                                │   ↓                                    │
                                │   agui-translator                      │
                                │   (LangChain events → AG-UI events)    │
                                │   ↓                                    │
                                │   webContents.send(...)                │
                                └─────────────┬──────────────────────────┘
                                              │ IPC (typed via contextBridge)
                                              ↓
                                ┌────────────────────────────────────────┐
                                │  BrowserWindow (frameless)             │
                                │  ┌──────────────────────────────────┐  │
                                │  │ chrome WebContents (React+TW)    │  │
                                │  │  TitleBar + tab strip · UrlBar   │  │
                                │  │  PaneArea (mini per-pane URL bar)│  │
                                │  │  Chat sidebar (resizable)        │  │
                                │  │  NewTabPage + intent resolver    │  │
                                │  │  Onboarding · SettingsDialog     │  │
                                │  │  citation-drop helper (sidebar)  │  │
                                │  └──────────────────────────────────┘  │
                                │  ┌──────────────────────────────────┐  │
                                │  │ N tab WebContentsViews           │  │
                                │  │  positioned per BSP layout       │  │
                                │  │  tab-preload.ts captures drags   │  │
                                │  └──────────────────────────────────┘  │
                                └────────────────────────────────────────┘
```

**Key design choices:**

- **Layout engine is pure TS** — no Electron deps. 41 unit tests cover BSP ops, drop application, divider geometry, resize clamping, tab activation, pop, and queries. Drag-drop / split / resize / group correctness is provably right.
- **Tab groups are a tab-strip concept, not BSP.** `TabState.groupId` lives on the tab; opening a grouped tab auto-splits the layout via `openGroup`. This decouples grouping semantics from the layout tree, so groups stay coherent across splits and rearrangements.
- **AG-UI Protocol over IPC** — chat events use the standard event schema, future-proofing for tool calls + state snapshots when agentic features land. Translator (~150 LoC) hand-rolled because the JS adapter only targets LangGraph Platform.
- **Hybrid intent resolver** — static rules first (sites: `yt`, `gh`, `wiki`, `mdn`, `npm`, …; intents: buy / watch / flight / weather / …). LLM fallback uses `ChatOrchestrator.oneShot` with a single-flight `AbortController` and partial-JSON salvage for truncated responses.
- **Three drag protocols, separate concerns** — drag-to-split / drag-to-group (React DnD, internal store), page→chat (OS drag + custom MIME via shared `citation-drop.ts`), chat→page (`webContents.startDrag` with temp file). Phase 0 spike confirmed cross-WebContentsView OS drag preserves custom MIME on Win 11.
- **Cross-platform from V0.1** — per-OS chrome modules behind a single `WindowControls` interface. Windows uses `titleBarOverlay` for native snap-layouts; Mac uses `hiddenInset` for traffic lights + vibrancy; Linux uses fully custom titlebar.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Shell | **Electron 33** + `WebContentsView` per tab | Native Windows, real Chromium, `webContents.startDrag`, free DevTools |
| Lang | **TypeScript** end-to-end | |
| Build | **Vite 6** + **electron-vite** + tsc | |
| UI | **React 18** + **Tailwind 3** + **Zustand 5** + **Framer Motion** + **Heroicons** | |
| IPC | typed `contextBridge` + `ipcMain.handle` | end-to-end typed renderer ↔ main |
| Chat orchestration | **LangGraphJS** (StateGraph + streamEvents v2) | extensible for tool calls / RAG / interrupts |
| Provider adapters | `@langchain/anthropic`, `@langchain/openai` | drop-in chat models |
| Event protocol | **[`@ag-ui/core`](https://docs.ag-ui.com)** | standardized agent-frontend events |
| OS keychain | **`keytar`** | Win Credential Manager / macOS Keychain / libsecret |
| Embedded LLM | **`node-llama-cpp`** + **Qwen 3** GGUF | Apache 2.0, multi-backend (Metal / Vulkan / CUDA / CPU) |
| Layout engine | **`@sable/layout-engine`** (pure TS, in-repo) | 41 unit tests, zero deps |
| Markdown | **react-markdown** + **remark-gfm** | streamed chat rendering |
| Tab content extraction | inline JS via `executeJavaScript` (Mozilla Readability + Defuddle planned) | |
| Future agent control | **CDP** via `webContents.debugger` | Playwright-quality |

---

## Roadmap

A deliberately ambitious roadmap. Items are tagged: *shipped*, *in progress*, *next up*, *exploration*. **Tier 2 and Tier 3 are where we'd most love contributors.**

### Tier 1 — V1.0 polish *(in flight)*

- *next up* — Tab grouping persistence across restarts (groupIds round-trip through the spaces store).
- *next up* — Per-pane URL-bar drop targets (drag a tab pill onto another pane's mini URL bar = swap that pane).
- *next up* — Drag-to-rearrange grouped tabs.
- *next up* — Light/dark auto-follow OS preference.
- *next up* — Code signing + auto-update + crash reporting (Win EV cert, Apple notarization, electron-updater, Sentry-electron).

### Tier 2 — Workflow automation & Skills *(next up — pick something here!)*

The "skill" we just removed was a static prompt template. The skill we want is **a recordable workflow that knows what tabs you had, what you typed, and what you wanted back**.

- *next up* — **Recordable Skills.** Open the chat composer's record toggle, narrate the action ("scrape headlines from these tabs into a markdown table"). Sable captures the prompt + tab-context shape + expected output shape into a named, parameterized skill. Fire later with one click.
- *exploration* — **Skill Marketplace.** Share / import skills as a single `@sable/skill-pack` JSON. Opt-in registry for community skills, signed and reviewable.
- *exploration* — **Tab macros.** Record a sequence of pane operations (split this way, group these tabs, run this skill across them) as a one-click macro.
- *next up* — **`/recall`** — semantic search over chat history with citations rendered inline.
- *next up* — **Variable injection** in skills (selection text, current URL, time-of-day, "tabs in this group").
- *exploration* — **Headless skill runner** — run a skill against a set of bookmarked URLs in the background, deliver the result as a notification.

### Tier 3 — Personal knowledge & agentic browsing *(exploration)*

The History layer we shipped in V1.0 is the seed. The endgame is a browser that **learns from what you read and helps you find it again**.

- *exploration* — **Personal Knowledge Graph from history.** Embeddings indexed in **LanceDB**, encrypted-at-rest with an OS-keychain-derived key. **Default-deny blocklist** (banking, mail, auth-flagged origins) — opt in per origin. `/recall <topic>` returns ranked passages from past visits with the LLM weaving them into the answer.
- *exploration* — **Active learning.** Sable learns your patterns: which sites at which times, which prompts you reach for, which tab combinations cluster. Surfaces predictions on the NTP ("you usually open these 4 at 9am — open them all?") and as chip suggestions in chat.
- *exploration* — **Agentic green-thread tabs.** Spawn a hidden tab with a goal ("watch this PR for status changes, ping me when CI passes"). CDP-driven action loop, capability allowlist, human-in-the-loop approval for risky actions.
- *exploration* — **Generative surfaces.** Sandboxed iframes rendering AI-synthesized UI from open tabs ("turn this article + this dataset into an interactive explainer").
- *exploration* — **Multi-window & detach** — drag a pane out of the window to detach it.
- *exploration* — **Mobile** — explicit non-goal for V1.x but tracked.

### Explicit non-goals (V1.x)

- MV3 extensions (Electron limitation)
- Built-in password manager (defer to OS / 1Password browser ext)
- DRM video (Widevine in Electron is a separate licensing track)
- Mobile

---

## Repo layout

```
sable/
├── apps/
│   ├── shell/                     Electron main process + preload
│   │   ├── src/main/
│   │   │   ├── index.ts
│   │   │   ├── window-manager.ts
│   │   │   ├── tab-manager.ts
│   │   │   ├── layout-controller.ts
│   │   │   ├── chat-orchestrator.ts       LangGraphJS StateGraph + AG-UI translator + oneShot
│   │   │   ├── chat-models/
│   │   │   │   └── qwen-local.ts          custom BaseChatModel for node-llama-cpp
│   │   │   ├── llm-factory.ts             builds active ChatModel from settings
│   │   │   ├── settings-store.ts          keytar wrapper + JSON persistence
│   │   │   ├── local-model-manager.ts     GGUF download + registry
│   │   │   ├── space-manager.ts           per-space layout/tabs/chat/theme
│   │   │   ├── history-manager.ts         in-memory + JSON-persisted history (recent + search)
│   │   │   └── platform/
│   │   │       └── window-controls.{ts,win32,darwin,linux}.ts
│   │   └── src/preload/
│   │       ├── chrome-preload.ts          contextBridge for chrome WebContents
│   │       └── tab-preload.ts             dragstart hook + custom scrollbars
│   ├── chrome-ui/                 React + Vite + Tailwind chrome UI
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── ntp-resolver.ts            hybrid static + LLM intent resolver
│   │       ├── citation-drop.ts           shared sidebar-wide drop helper
│   │       ├── url.ts                     URL normalization
│   │       ├── components/
│   │       │   ├── TitleBar.tsx           frameless titlebar + horizontal tab strip + Space switcher
│   │       │   ├── TabStrip.tsx           drag pill→pill (group), pill→edge (split)
│   │       │   ├── UrlBar.tsx             global URL bar w/ history dropdown
│   │       │   ├── MiniUrlBar.tsx         per-pane URL bar (multi-pane mode)
│   │       │   ├── PaneArea.tsx           BSP pane rendering + drop overlays
│   │       │   ├── Divider.tsx            split-resize handle
│   │       │   ├── NewTabPage.tsx         omnibox + intent resolver + bookmarks
│   │       │   ├── DropOverlay.tsx        5-zone drop targets per pane
│   │       │   ├── Chat/
│   │       │   │   ├── Chat.tsx           sidebar-wide drop layer
│   │       │   │   ├── Composer.tsx
│   │       │   │   ├── MessageList.tsx    GFM markdown rendering
│   │       │   │   └── ChatEmptyState.tsx
│   │       │   ├── Onboarding/
│   │       │   │   ├── OnboardingDialog.tsx
│   │       │   │   ├── SplashStep.tsx     CSS-driven full-screen animation
│   │       │   │   ├── NameStep.tsx
│   │       │   │   ├── ModelStep.tsx      Qwen 1.7B default download
│   │       │   │   └── DoneStep.tsx
│   │       │   └── Settings/
│   │       │       └── SettingsDialog.tsx providers + spaces + local model
│   │       ├── state/
│   │       │   ├── tabs.ts                TabState (incl. groupId)
│   │       │   ├── layout.ts
│   │       │   ├── drag.ts
│   │       │   ├── chat.ts                AG-UI event reducer
│   │       │   ├── citations.ts           pending sidebar-drop citations
│   │       │   ├── chrome.ts              theme + chat width + bookmarks + userName
│   │       │   ├── settings.ts
│   │       │   ├── local-model.ts
│   │       │   └── spaces.ts
│   │       └── assets/
│   │           └── sable-icon.svg
│   └── spike-day0/                Phase 0 cross-WebContentsView drag regression spike
├── packages/
│   └── layout-engine/             pure TS BSP — layout, applyDrop, removeTab, resize, dividers, queries
│       └── src/
│           ├── index.ts
│           ├── types.ts
│           ├── layout.ts
│           ├── apply-drop.ts
│           ├── remove-tab.ts
│           ├── activate-tab.ts
│           ├── pop-tab.ts
│           ├── resize.ts
│           ├── dividers.ts
│           ├── queries.ts
│           └── __tests__/        (41 tests)
├── .github/workflows/
│   └── ci.yml                     win × mac × linux × { typecheck, tests, builds }
├── resources/
│   └── icon.svg
└── docs/
    └── (design briefs, architecture notes — reserved)
```

---

## Privacy posture

- **History is local-only.** `userData/history.json`, in-memory ranking, never leaves your machine. Clear at any time via the `history.clear()` IPC (UI in Settings is a `good-first-issue`).
- **Default-deny KG indexing** *(when Tier 3 KG ships)* — banking, mail, auth-flagged origins blocked from embedding without explicit per-origin opt-in.
- **API keys in OS keychain** — `keytar` wraps Windows Credential Manager / macOS Keychain / libsecret. Raw keys never cross the IPC boundary; only `hasKey: boolean` does.
- **No telemetry.** V1.x has zero outbound calls beyond what your active provider needs.
- **Embedded model is offline-capable** — Qwen 3 runs fully local; no internet required after download. The hybrid intent resolver only calls a provider when no static rule matches.
- **Encrypted-at-rest** *(KG / chat history persistence in Tier 3)* — keys derived from OS keychain.
- **Honest disclosure**: Sable inherits Electron's security posture, which lags upstream Chromium by ~weeks. Not a substitute for Edge / Chrome on hostile sites; this is a tool for focused work. See [`SECURITY.md`](SECURITY.md).

---

## Built on

Sable stands on the shoulders of:

- **[LangChain](https://langchain.com)** + **[LangGraph.js](https://langchain-ai.github.io/langgraphjs/)** — chat + agent orchestration
- **[AG-UI Protocol](https://docs.ag-ui.com)** — standardized agent ↔ frontend events
- **[Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)** + **[OpenAI SDK](https://github.com/openai/openai-node)** — BYOK provider adapters via `@langchain/anthropic` and `@langchain/openai`
- **[llama.cpp](https://github.com/ggml-org/llama.cpp)** + **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** — embedded LLM inference (Vulkan / CUDA / Metal / CPU)
- **[Qwen 3](https://qwenlm.github.io)** (Apache 2.0) — bundled embedded model
- **[Mozilla Readability](https://github.com/mozilla/readability)** + **[Defuddle](https://github.com/kepano/defuddle)** — page main-content extraction *(slated)*
- **[LanceDB](https://lancedb.com)** — embedded vector store *(Tier 3)*
- **[Electron](https://electronjs.org)** + **[React](https://react.dev)** + **[Tailwind](https://tailwindcss.com)** + **[Zustand](https://zustand-demo.pmnd.rs)** + **[Vite](https://vitejs.dev)** + **[Heroicons](https://heroicons.com)** — desktop shell & UI

---

## Contributing & license

We'd love your help — especially on **Tier 2 (Workflow automation & Skills)**. The intent-resolver rule packs and a Settings "clear browsing data" button are easy first PRs. See:

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — project tour, local setup, PR process, beginner-friendly issue areas, code style.
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** — be kind, assume good intent.
- **[SECURITY.md](SECURITY.md)** — how to report vulnerabilities.
- **[LICENSE](LICENSE)** — MIT.

Issues tagged `good-first-issue` on GitHub are the easiest entry points. PRs to either tier of the roadmap are welcome — open a discussion first if you're picking up a Tier 2 / Tier 3 item so we can align on the design.

---

<div align="center">

*Building a browser is hard. Building a browser that lets chat and pages talk is harder. Worth it.*

</div>
