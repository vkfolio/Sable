<div align="center">

<img src="resources/icon.svg" alt="Sable" width="120" height="120" />

# Sable

**A browser where chat and pages are one workspace.**

<p>
  <img alt="status" src="https://img.shields.io/badge/status-V0.2_alpha-7adabf?style=flat-square" />
  <img alt="platforms" src="https://img.shields.io/badge/platforms-Windows%20·%20macOS%20·%20Linux-6b7cff?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-TBD-a78bfa?style=flat-square" />
  <img alt="electron" src="https://img.shields.io/badge/electron-33-9feaf9?style=flat-square" />
  <img alt="typescript" src="https://img.shields.io/badge/typescript-5.7-3178c6?style=flat-square" />
  <img alt="layout-engine tests" src="https://img.shields.io/badge/layout--engine_tests-33%2F33-7adabf?style=flat-square" />
</p>

</div>

---

Sable is an AI-first desktop browser. The chat panel doesn't just *read* the page — it **interoperates** with it. Drag a paragraph from a webpage into chat for an auto-citation. Drag an AI-generated image into a webpage upload field. Cmd-click multiple tabs to make them one unified AI context. Drag any tab to any pane edge for arbitrary BSP-nested splits.

It's not a Chrome wrapper with a chat button. It's a real browser shell built on Electron + `WebContentsView`, with a custom binary-space-partitioning layout engine, a LangGraphJS orchestrator emitting open [AG-UI Protocol](https://docs.ag-ui.com) events, embedded Qwen 3 (Apache 2.0, runs offline) plus BYOK Anthropic / OpenAI for higher-quality work, and a privacy-first roadmap for personal knowledge graphs and agentic browsing.

Cross-platform from V0.1: **Windows, macOS, Linux**.

---

## Table of contents

- [Highlights](#highlights)
- [What you can do today](#what-you-can-do-today)
- [Quickstart](#quickstart)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Roadmap](#roadmap)
- [Repo layout](#repo-layout)
- [Privacy posture](#privacy-posture)
- [Inspirations](#inspirations)

---

## Highlights

| | |
|---|---|
| 🪟 **Real browser shell** | Frameless chrome, custom titlebar, native window controls per OS |
| 🧩 **BSP-nested split panes** | Drag any tab to any pane edge — splits nest arbitrarily, dividers drag-resize |
| 💬 **AI chat that *interoperates*** | Drag page text → cite. Drag page image → multimodal prompt. |
| 🧠 **Multi-tab unified AI context** | Ctrl-click tabs to add as context — extracts main content, token-budgets, tells you what was excluded |
| 🌐 **3 providers, 1 stream** | Anthropic, OpenAI, embedded Qwen 3 — same LangGraphJS pipeline, same AG-UI events |
| 🔒 **Embedded model is Apache 2.0** | Qwen 3 (1.7B default, 4B for higher quality, 0.6B for low-end). Runs offline. ~1.1 GB |
| 🪐 **Spaces** | Multiple workspaces — each with its own tabs, layout, chat history, accent color |
| ✨ **Skills** | Named prompt templates (`@summarize`, `@compare`, etc.) — bundled defaults + custom |
| 🔐 **Keys in OS keychain** | Anthropic / OpenAI keys stored via Windows Credential Manager / macOS Keychain / libsecret. Never plaintext, never exposed to renderer |
| 📊 **33/33 layout-engine tests** | Pure TS BSP package — drag-drop / split / resize logic is provably correct |
| 🔁 **CI matrix** | GitHub Actions: typecheck + tests + builds on Windows, macOS, Linux on every PR |

---

## What you can do today

### Browse with a real shell

```
+-------------------------------------------------------------------+
| ◼ Sable  ● Personal ▾                              ─  □  ×        |  ← frameless titlebar
+----------+--------------------------------------------------------+
| ‹ › ↻ [▢]|                                                        |  ← omnibar (URL+chat+search)
| ─── TABS │                                                        |
| ● ddg    │              active tab WebContentsView                |  ← BSP-nested splits
| · wiki   │              (drag to a pane edge to split)            |
| · github │                                                        |
| ─── CHAT │                                                        |
| ▢ msg ▢  │                                                        |
| [...  ▶] │                                                        |
+----------+--------------------------------------------------------+
```

- Vertical tabs in a 280-px sidebar
- Frameless chrome with platform-native controls (Win 11 snap-layouts, Mac traffic lights, Linux custom)
- Drag any tab to a pane edge → 5-zone drop overlay → split (left/right/top/bottom/center)
- Drag the divider between panes to resize, clamped 5%-95%
- Ctrl+T new tab, Ctrl+W close, Ctrl+L focus omnibar, Ctrl+R reload, F12 DevTools

### Chat that *uses* what you're browsing

- **Drag a paragraph from a page → chat composer** → cited as a markdown blockquote with the URL
- **Drag an image from a page → chat composer** → image fetched bypassing renderer CORS, sent as inline multimodal content
- **Ctrl-click multiple tabs** in the sidebar → flagged with a `ctx` badge → on send, their main content is extracted, prefixed with `## Tab: <title>` blocks, token-budgeted (greedy-by-recency, hard cap 18 KB), excess shown as "Tab N excluded"
- Right-click a tab → quick-toggle context, **Move to space →**, close

### Three providers, one streaming pipeline

| Provider | Setup | Cold start |
|---|---|---|
| **Anthropic** | Paste `sk-ant-…` key in Settings → stored in OS keychain | < 100 ms first token |
| **OpenAI** | Paste `sk-…` key in Settings | < 100 ms first token |
| **Embedded Qwen 3** | Click **Download** in Settings → Qwen 3 (embedded) → ~1.1 GB | 1-5 sec model load on first message |

All three stream through the same `LangGraphJS` `StateGraph`, emit standardized [AG-UI Protocol](https://docs.ag-ui.com) events (`TEXT_MESSAGE_START` / `_CONTENT` / `_END` for now; tool calls + state snapshots reserved for V0.2 agentic features), and reduce into the same chat store.

### Embedded model: Qwen 3 (Apache 2.0)

Three variants, user picks:

| Variant | Size | Use case | Tok/s (CPU baseline) |
|---|---|---|---|
| Qwen 3 0.6B | ~400 MB | Ultra-low-end / Chromebooks | 50+ |
| **Qwen 3 1.7B** *(default)* | ~1.1 GB | 8 GB RAM, no GPU | 25-40 |
| Qwen 3 4B Instruct (2507) | ~2.5 GB | 16 GB RAM, higher quality | 10-18 (60+ on Metal) |

Why Qwen 3 over Gemma 3 / Llama 3.2: **Apache 2.0**. No MAU clause, no remote-revocation, no attribution requirement. The only clean license for a default model in a shipped consumer browser. MMLU 65.6 (1.7B) / 84.2 (4B), 256K native context, single chat template across sizes. Streams via `node-llama-cpp` (Vulkan/CUDA on Win, Metal on Mac, CUDA/Vulkan on Linux). Qwen3's `<think>` reasoning tokens are filtered out client-side so the chat bubble shows only the answer.

### Spaces

```
   ◼ Sable  ● Personal ▾
              │
              ├── ● Personal     ←  active
              ├── ● Coding
              ├── ● Research
              └── + New space
```

Each Space owns its own:
- **Tabs** — switching spaces filters the sidebar tab list to that space's tabs
- **Layout tree** — different BSP arrangement per space, persisted within the session
- **Chat history** — separate `conversationId` per space, history isolated
- **Accent color** — picked from a 6-color palette

Manage in Settings → Spaces: rename, change accent, delete (last space protected).
Move a tab between spaces via right-click → **Move to space**.

### Skills

Named prompt templates accessible from a ✨ button in the composer.

| Trigger | Description |
|---|---|
| `@summarize` | 3-bullet summary + a one-line takeaway |
| `@compare` | Find agreement / disagreement across selected tabs |
| `@explain` | Explain a concept clearly to a technical reader |
| `@rewrite` | Rewrite text in a different tone / length |
| `@critique` | Honest critique of a draft or argument |
| `@translate` | Translate to another language |

- Filter by typing, arrow-key nav, Enter to pick
- Picked template fills (or appends to) the composer
- Custom skills + edit/delete in Settings → Skills (built-ins are protected from deletion but can be overwritten; **Reset built-ins** restores)
- Persisted to `userData/skills.json`

---

## Quickstart

```bash
git clone <this-repo>
cd sable
pnpm install
pnpm shell
```

A frameless Sable window opens with a single tab. Click the **⚙** at the top-right of the sidebar's Chat section to open Settings, paste an Anthropic / OpenAI key (or download an embedded Qwen 3 variant), then send a message — streaming responses arrive token-by-token through the AG-UI pipeline.

**Prerequisites:**
- Node 22.14+ (`.nvmrc` provided)
- pnpm 9.15+
- macOS hardware required for native macOS builds (CI handles Linux)
- `keytar` ships pre-built binaries via `prebuild-install`; no native compiler needed in normal cases
- `node-llama-cpp` ships prebuilds for Vulkan/CUDA/Metal/CPU; auto-selects backend at runtime

**Other commands:**

```bash
pnpm typecheck            # all workspaces
pnpm test                 # layout engine: 33 tests
pnpm chrome-ui:dev        # iterate on chrome-ui with HMR
pnpm spike                # rerun the Phase 0 cross-WebContentsView drag spike
SABLE_DEV=1 pnpm shell    # auto-open chrome DevTools
```

---

## Architecture

```
                                ┌─────────────────────────────────────┐
                                │  Electron main (Node)               │
                                │                                     │
                                │  WindowManager                      │
                                │   ├─ TabManager · LayoutController  │
                                │   ├─ SpaceManager · SkillsManager   │
                                │   ├─ ChatOrchestrator (LangGraphJS) │
                                │   │   └─ StateGraph                 │
                                │   │       └─ chat model node        │
                                │   │           ├─ ChatAnthropic      │
                                │   │           ├─ ChatOpenAI         │
                                │   │           └─ QwenLocalChatModel │
                                │   │              (node-llama-cpp)   │
                                │   ├─ LocalModelManager (downloads)  │
                                │   ├─ SettingsStore + keytar         │
                                │   ↓                                 │
                                │   agui-translator                   │
                                │   (LangChain events → AG-UI events) │
                                │   ↓                                 │
                                │   webContents.send(...)             │
                                └─────────────┬───────────────────────┘
                                              │ IPC (typed via contextBridge)
                                              ↓
                                ┌─────────────────────────────────────┐
                                │  BrowserWindow (frameless)          │
                                │  ┌────────────────────────────────┐ │
                                │  │ chrome WebContents (React+TW)  │ │
                                │  │  TitleBar · Sidebar · PaneArea │ │
                                │  │  Chat · SettingsDialog         │ │
                                │  │  drag-protocol (text + image)  │ │
                                │  └────────────────────────────────┘ │
                                │  ┌────────────────────────────────┐ │
                                │  │ N tab WebContentsViews         │ │
                                │  │  positioned per BSP layout     │ │
                                │  │  tab-preload.ts captures drags │ │
                                │  └────────────────────────────────┘ │
                                └─────────────────────────────────────┘
```

**Key design choices:**

- **Layout engine is pure TS** — no Electron deps. Tested with 33 unit tests covering BSP ops, drop application, divider geometry, and resize clamping. Drag-drop / split / resize correctness is provably right.
- **AG-UI Protocol over IPC** — chat events use the standard event schema, future-proofing for tool calls + state snapshots when V0.2 agentic features land. Translator (~150 LoC) hand-rolled because the JS adapter only targets LangGraph Platform.
- **Three drag protocols, separate concerns** — drag-to-split (React DnD, internal store), page→chat (OS drag + custom MIME), chat→page (`webContents.startDrag` with temp file). Phase 0 spike confirmed cross-WebContentsView OS drag preserves custom MIME on Win 11.
- **Cross-platform from V0.1** — per-OS chrome modules behind a single `WindowControls` interface. Windows uses `titleBarOverlay` for native snap-layouts; Mac uses `hiddenInset` for traffic lights + vibrancy; Linux uses fully custom titlebar.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Shell | **Electron 33** + `WebContentsView` per tab | Native Windows, real Chromium, `webContents.startDrag`, free DevTools |
| Lang | **TypeScript** end-to-end | |
| Build | **Vite 6** + **electron-vite** + tsc | |
| UI | **React 18** + **Tailwind 3** + **Zustand** + **Framer Motion** | |
| IPC | typed `contextBridge` + `ipcMain.handle` | end-to-end typed renderer↔main |
| Chat orchestration | **LangGraphJS** (StateGraph + streamEvents v2) | extensible for tool calls / RAG / interrupts |
| Provider adapters | `@langchain/anthropic`, `@langchain/openai` | drop-in chat models |
| Event protocol | **[`@ag-ui/core`](https://docs.ag-ui.com)** | standardized agent-frontend events |
| OS keychain | **`keytar`** | Win Credential Manager / macOS Keychain / libsecret |
| Embedded LLM | **`node-llama-cpp`** + **Qwen 3** GGUF | Apache 2.0, multi-backend (Metal/Vulkan/CUDA/CPU) |
| Layout engine | **`@sable/layout-engine`** (pure TS, in-repo) | 33 unit tests, zero deps |
| Tab content extraction | inline JS via `executeJavaScript` (Mozilla Readability + Defuddle planned) | |
| Future agent control | **CDP** via `webContents.debugger` | Playwright-quality |

---

## Roadmap

### V0.1 — the AI-first browser shell *(complete)*

- [x] **Phase 0** — Day-0 architecture spike (custom-MIME drag verified)
- [x] **Phase 1** — frameless chrome, BSP layout, drag-to-split, splitter dividers
- [x] **Phase 2** — chat sidebar, BYOK Anthropic + OpenAI, AG-UI streaming
- [x] **Phase 3** — drag interop (page→chat: text + image)
- [x] **Phase 4** — multi-tab unified context with token budgeting
- [x] **Phase 5** — embedded Qwen 3 with download manager + multimodal LangGraph

### V0.2 — agents + memory *(in progress)*

- [x] **Spaces** — multiple workspaces with per-Space tabs, layout, chat
- [x] **Skills** — `@`-named prompt templates with custom + Settings editor
- [ ] **Personal KG** — encrypted LanceDB indexing visited pages + `/recall` semantic search (default-deny blocklist for banking / mail / auth)
- [ ] **Agentic green-thread tabs** — spawn a hidden tab with a goal, CDP-driven action loop (capability allowlist, human-in-the-loop approval)
- [ ] **Generative surfaces** — sandboxed iframe rendering AI-synthesized UI from open tabs
- [ ] **Code signing + auto-update + crash reporting** — Win EV cert, Apple notarization, electron-updater, Sentry-electron

### Explicit non-goals for V0.x

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
│   │   │   ├── chat-orchestrator.ts       LangGraphJS StateGraph + AG-UI translator
│   │   │   ├── chat-models/
│   │   │   │   └── qwen-local.ts          custom BaseChatModel for node-llama-cpp
│   │   │   ├── llm-factory.ts             builds active ChatModel from settings
│   │   │   ├── settings-store.ts          keytar wrapper + JSON persistence
│   │   │   ├── local-model-manager.ts     GGUF download + registry
│   │   │   ├── space-manager.ts           per-space layout/tabs/chat
│   │   │   ├── skills-manager.ts          prompt template registry
│   │   │   └── platform/
│   │   │       └── window-controls.{ts,win32,darwin,linux}.ts
│   │   └── src/preload/
│   │       ├── chrome-preload.ts          contextBridge for chrome WebContents
│   │       └── tab-preload.ts             dragstart hook for page→chat citations
│   ├── chrome-ui/                 React + Vite + Tailwind chrome UI
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── TitleBar.tsx           frameless titlebar + Space switcher
│   │       │   ├── Sidebar.tsx
│   │       │   ├── TabList.tsx            drag source + right-click menu
│   │       │   ├── PaneArea.tsx           BSP pane rendering + drop overlays
│   │       │   ├── Divider.tsx            split-resize handle
│   │       │   ├── Omnibar.tsx
│   │       │   ├── DropOverlay.tsx        5-zone drop targets per pane
│   │       │   ├── Chat/
│   │       │   │   ├── Chat.tsx
│   │       │   │   ├── Composer.tsx       drop targets + ✨ skills picker
│   │       │   │   ├── MessageList.tsx
│   │       │   │   ├── ChatEmptyState.tsx
│   │       │   │   └── SkillsPicker.tsx
│   │       │   └── Settings/
│   │       │       └── SettingsDialog.tsx providers + spaces + skills + local model
│   │       └── state/
│   │           ├── tabs.ts
│   │           ├── layout.ts
│   │           ├── drag.ts
│   │           ├── chat.ts                AG-UI event reducer
│   │           ├── settings.ts
│   │           ├── local-model.ts
│   │           ├── spaces.ts
│   │           └── skills.ts
│   └── spike-day0/                Phase 0 cross-WebContentsView drag regression spike
├── packages/
│   └── layout-engine/             pure TS BSP — layout, applyDrop, removeTab, resize, dividers
│       └── src/
│           ├── index.ts
│           ├── types.ts
│           ├── layout.ts
│           ├── apply-drop.ts
│           ├── remove-tab.ts
│           ├── resize.ts
│           ├── dividers.ts
│           ├── queries.ts
│           └── __tests__/        (33 tests)
├── .github/workflows/
│   └── ci.yml                     win × mac × linux × { typecheck, tests, builds }
├── resources/
│   └── icon.svg
└── docs/
    └── (design briefs, architecture notes — reserved)
```

---

## Privacy posture

- **Default-deny KG indexing** *(when V0.2 KG ships)* — banking, mail, auth-flagged origins blocked from embedding without explicit per-origin opt-in
- **API keys in OS keychain** — `keytar` wraps Windows Credential Manager / macOS Keychain / libsecret. Raw keys never cross the IPC boundary; only `hasKey: boolean` does
- **No telemetry** — V0.x has zero outbound calls beyond what your active provider needs
- **Embedded model is offline-capable** — Qwen 3 runs fully local; no internet required after download
- **Encrypted-at-rest** *(KG / chat history persistence in V0.2)* — keys derived from OS keychain
- **Honest disclosure**: Sable inherits Electron's security posture, which lags upstream Chromium by ~weeks. Not a substitute for Edge/Chrome on hostile sites; this is a tool for focused work

---

## Built on

Sable stands on the shoulders of:

- **[LangChain](https://langchain.com)** + **[LangGraph.js](https://langchain-ai.github.io/langgraphjs/)** — chat + agent orchestration
- **[AG-UI Protocol](https://docs.ag-ui.com)** — standardized agent ↔ frontend events
- **[Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)** + **[OpenAI SDK](https://github.com/openai/openai-node)** — BYOK provider adapters via `@langchain/anthropic` and `@langchain/openai`
- **[llama.cpp](https://github.com/ggml-org/llama.cpp)** + **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** — embedded LLM inference (Vulkan / CUDA / Metal / CPU)
- **[Qwen 3](https://qwenlm.github.io)** (Apache 2.0) — bundled embedded model
- **[Mozilla Readability](https://github.com/mozilla/readability)** + **[Defuddle](https://github.com/kepano/defuddle)** — page main-content extraction *(slated)*
- **[LanceDB](https://lancedb.com)** — embedded vector store *(V0.2)*
- **[Electron](https://electronjs.org)** + **[React](https://react.dev)** + **[Tailwind](https://tailwindcss.com)** + **[Zustand](https://zustand-demo.pmnd.rs)** + **[Vite](https://vitejs.dev)** — desktop shell & UI

---

## License

TBD. Will be a permissive open-source license at V0.1 release.

---

<div align="center">

*Building a browser is hard. Building a browser that lets chat and pages talk is harder. Worth it.*

</div>
