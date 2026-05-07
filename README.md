<div align="center">

<img src="resources/icon.svg" alt="Sable" width="96" height="96" />

# Sable

**A browser where chat and pages are one workspace.**

[ Status: early development · Phase 2 of 6 complete ]

</div>

---

Sable is an AI-first desktop browser inspired by Dia. The chat panel isn't a bolted-on sidebar that *reads* the page — it *interoperates* with it. Drag a paragraph into chat for a citation. Drag an AI-generated image into a webpage upload field. Drag any tab to any pane edge to split the workspace. Cmd-click several tabs to make them one unified AI context.

It's not a wrapper around Chrome with a chat button. It's a real browser shell built on Electron + `WebContentsView`, with a custom binary-space-partitioning layout engine, a LangGraphJS chat orchestrator emitting open [AG-UI Protocol](https://docs.ag-ui.com) events, and a deliberate roadmap toward agentic background tabs, generative UI from open tabs, and a privacy-respecting personal knowledge graph.

Cross-platform from V0.1: Windows, macOS, Linux.

---

## What works today

| Phase | Status |
|---|---|
| 0 — Day-0 architectural spike | ✅ Cross-WebContentsView OS drag with custom MIME confirmed on Win 11 |
| 1 — Shell skeleton | ✅ Frameless chrome (per-OS), BSP layout, drag-to-split, splitter dividers, vertical tabs, omnibar, soft tab hibernation, CI matrix |
| 2 — AI sidebar with BYOK | ✅ LangGraphJS + AG-UI streaming, Anthropic & OpenAI providers, OS-keychain BYOK |
| 3 — Drag interop (page ↔ chat) | 🟡 In progress |
| 4 — Multi-tab unified context | ⚪ Roadmap |
| 5 — Embedded Qwen 3 default | ⚪ Roadmap |
| 6 — Polish + dogfood | ⚪ Roadmap |

The pure layout engine has **33/33 unit tests passing**. The shell builds and typechecks across Win/Mac/Linux on every PR via GitHub Actions.

---

## Quickstart

```pwsh
git clone <this-repo>
cd sable
pnpm install
pnpm shell
```

A frameless Sable window opens with a single tab loaded. Click the **⚙** in the bottom-right of the sidebar's Chat section to open Settings, paste an Anthropic (`sk-ant-…`) or OpenAI (`sk-…`) key, and send a message — streaming responses arrive token-by-token through the AG-UI event pipeline.

### Prerequisites

- Node 22.14+ (`.nvmrc` provided)
- pnpm 9.15+
- macOS hardware required for native macOS builds; CI handles Linux
- `keytar` ships pre-built binaries via `prebuild-install` — no native compiler needed in normal cases

### Other commands

```pwsh
pnpm typecheck            # all workspaces
pnpm test                 # layout engine: 33 tests
pnpm chrome-ui:dev        # iterate on chrome-ui with HMR (set SABLE_DEV_URL when launching shell)
pnpm spike                # rerun the Phase 0 cross-WebContentsView drag spike
```

---

## What it looks like

```
┌─────────────────────────────────────────────────────────────────────┐
│ ◼ Sable   ● coding                                       ─  □  ×   │
├──────────────────┬──────────────────────────────────────────────────┤
│ ‹  ›  ↻  search  │                                                  │
│ ───────────────  │                                                  │
│  TABS         +  │                                                  │
│   ● duckduckgo   │            active tab WebContentsView             │
│   ·  wikipedia   │            (split-able by drag-to-edge)           │
│   ·  github      │                                                  │
│ ───────────────  │                                                  │
│  CHAT          ⚙ │                                                  │
│  > "the browser  │                                                  │
│    is the OS"    │                                                  │
│  ┌─ assistant ─┐ │                                                  │
│  │ streaming…│ │                                                  │
│  └────────────┘ │                                                  │
│  ┌─ Ask… ────┐  │                                                  │
└──────────────────┴──────────────────────────────────────────────────┘
```

Drag any tab from the sidebar onto a pane edge: 5 drop zones (left/right/top/bottom/center) appear; drop on an edge to split, drop in the center to replace. Drag the gap between two panes to resize. Splits nest arbitrarily.

---

## What makes Sable different

### Splits with arbitrary BSP nesting

The layout engine is pure TypeScript: a binary-space-partitioning tree, four operations (`layout`, `applyDrop`, `removeTab`, `resize`), zero Electron dependencies, fully unit-tested. The Electron-side `LayoutController` is a thin bridge that calls `webContentsView.setBounds()` per leaf rect. Splits can nest as deep as you want.

### Drag content between chat and pages *(Phase 3)*

Three drag protocols, each with a clean separation of concerns:

| | Source | Target | Mechanism |
|---|---|---|---|
| **drag-to-split** | Tab in sidebar | Pane edge | React DnD, internal store |
| **page → chat** | Selection in tab | Sidebar chat | OS drag + custom MIME `application/x-sable-quote+json; v=1` |
| **chat → page** | Image in chat | `<input type=file>` | `webContents.startDrag()` with real file handle |

The Day-0 spike confirmed that custom MIME types survive cross-`WebContentsView` OS drag on Windows 11 + Electron 33. The protocol is versioned (`v=1`) so future schema changes don't break stored citations.

### Multi-tab unified AI context *(Phase 4)*

Ctrl-click tabs to flag them as context. The chat orchestrator extracts main content (Mozilla Readability + Defuddle), token-budgets greedy-by-recency, and surfaces "Tab N excluded — click to swap" when a tab won't fit. Visible failure beats invisible degradation.

### Open AG-UI Protocol over IPC

Chat events use the [Agent-User Interaction Protocol](https://docs.ag-ui.com)'s 17 event types: `RUN_STARTED`, `TEXT_MESSAGE_*`, `TOOL_CALL_*`, `STATE_*`, `REASONING_*`, `RUN_FINISHED`. Adopting the standard now means tool calls, state snapshots, and human-in-the-loop interrupts slot in without re-plumbing IPC. The translator (~150 LoC) converts LangGraphJS `streamEvents({ version: 'v2' })` to AG-UI events; events ride over Electron IPC as plain JSON.

### Embedded local model coming *(Phase 5)*

Sable will ship **Qwen3-4B-Instruct-2507** (Q4_K_M, ~2.5 GB) as the default model — Apache 2.0, MMLU 84.2, IFEval 83.4, 256K native context. A 1.7B fallback (Apache 2.0) handles low-RAM machines. Runs via `node-llama-cpp` with platform-native backends (Vulkan/CUDA on Win, Metal on Mac, CUDA/Vulkan on Linux). BYOK upgrades you to Claude / GPT-5 for higher-quality work.

Why Qwen 3 over Gemma 3 / Llama 3.2 — the original candidates? **License hygiene**. Apache 2.0 has no MAU clause, no remote-revocation, no attribution requirement. Gemma's TOU lets Google "remotely or otherwise restrict use"; Llama needs visible "Built with Llama" attribution. For a default in a shipped consumer browser, Apache wins clean.

### Privacy by construction

- API keys live in the OS keychain (Windows Credential Manager / macOS Keychain / libsecret) via `keytar`. The chrome renderer is never given a raw key — only `hasKey: boolean`.
- The personal knowledge graph (V0.2) is **default-deny**: no banking, mail, or auth-flagged origins indexed without explicit per-origin opt-in. Encrypted at rest with a key derived from the OS keychain.
- No telemetry. No "anonymous usage stats." V0.1 has zero outbound calls beyond what your active provider needs.

---

## Architecture

```
┌──────────────────── Electron main (Node) ──────────────────────┐
│                                                                 │
│  WindowManager · TabManager · LayoutController · ChatOrchestrator│
│      │              │              │                  │         │
│      └──────────────┴──────────────┴──────────────────┘         │
│                            │                                    │
│                            ▼                                    │
│  StateGraph (LangGraphJS) · llm-factory(Settings) · keytar      │
│                            │                                    │
│                            ▼                                    │
│         agui-translator: LC events → AG-UI events                │
│                            │                                    │
│                            ▼                                    │
│         webContents.send('chat:agentEvent', event)              │
│                                                                 │
│  ┌─ BrowserWindow (frameless, custom titlebar) ──────────────┐  │
│  │  • chrome WebContents (React + Tailwind + Zustand)        │  │
│  │  • N tab WebContentsViews (positioned by LayoutController)│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Repo layout

```
apps/
  shell/              Electron main process + preload + per-OS chrome modules
  chrome-ui/          React + Vite + Tailwind chrome UI (sidebar, panes, chat, settings)
  spike-day0/         Phase 0 regression spike (custom-MIME drag check)
packages/
  layout-engine/      Pure BSP tree ops (layout, applyDrop, removeTab, resize, dividers)
.github/workflows/
  ci.yml              win × mac × linux × { typecheck, test, build }
resources/
  icon.svg            Source-of-truth icon (Vite bundles for chrome; electron-builder generates ICO/ICNS in V0.2)
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Shell | Electron 33 + `WebContentsView` per tab |
| Lang | TypeScript end-to-end |
| Build | electron-vite, Vite 6, tsc |
| UI | React 18, Tailwind 3, Zustand 5, Framer Motion |
| IPC | Typed `contextBridge` + `ipcMain.handle` channels |
| Chat orchestration | LangGraphJS (StateGraph + streamEvents v2) |
| Provider adapters | `@langchain/anthropic`, `@langchain/openai`, more on roadmap |
| Event protocol | [`@ag-ui/core`](https://docs.ag-ui.com) — open Agent-User Interaction Protocol |
| OS keychain | `keytar` |
| Vector store *(V0.2)* | LanceDB (file-based, Rust, encrypted at rest) |
| Embedded LLM *(Phase 5)* | `node-llama-cpp` + Qwen3-4B-Instruct-2507 GGUF |
| Page extraction *(Phase 4)* | Mozilla Readability + Defuddle |
| Future agent control *(V0.2)* | CDP via `webContents.debugger` |

---

## Roadmap

### V0.1 — the AI-first browser shell *(in progress)*

- ✅ **Phase 0** — architecture spike
- ✅ **Phase 1** — shell skeleton: frameless chrome, BSP layout, drag-to-split, dividers
- ✅ **Phase 2** — chat sidebar: LangGraphJS + AG-UI + Anthropic + OpenAI BYOK
- 🟡 **Phase 3** — drag interop: page→chat citation, chat→page file drop
- ⚪ **Phase 4** — multi-tab unified context + token budgeting
- ⚪ **Phase 5** — embedded Qwen 3 default model
- ⚪ **Phase 6** — polish + week-long dogfood

### V0.2 — agents + memory

- **Spaces** (multiple workspaces with persistence)
- **Skills** (`@`-named prompt templates)
- **Personal KG** (encrypted LanceDB, default-deny indexing, `/recall` semantic search)
- **Agentic green-thread tabs** — spawn a hidden tab with a goal, watch it work, dispose
- **Generative surfaces** — sandboxed iframe rendering AI-synthesized UI from open tabs
- Code signing (Win EV cert + Apple notarization), auto-update, crash reporting
- Multi-profile

### Explicit non-goals for V0.1

- MV3 extensions (Electron limitation)
- Built-in password manager (defer to OS / 1Password browser ext)
- DRM video (Widevine in Electron is a separate licensing track)
- Mobile

---

## Why "Sable"

A *sable* is a small, fast mustelid. *Sable* is also a deep-black tincture in heraldry. Both fit a fast, dark, focused browser.

## Inspirations

Sable stands on the shoulders of [Dia](https://www.diabrowser.com), [Arc](https://arc.net), [Linear](https://linear.app), and [Raycast](https://raycast.com) for design language; [LangChain](https://langchain.com) and the [AG-UI Protocol](https://docs.ag-ui.com) for agent orchestration; [Mozilla Readability](https://github.com/mozilla/readability), [Defuddle](https://github.com/kepano/defuddle), [llama.cpp](https://github.com/ggml-org/llama.cpp), and the [Qwen team](https://qwenlm.github.io) for the local-AI stack.

## License

TBD. Will be a permissive open-source license at V0.1 release.

---

<div align="center">

*Building a browser is hard. Building a browser that lets chat and pages talk is harder. Worth it.*

</div>
