# r/programming

This sub punishes self-promo. The only post format that survives is **"I built X and here's what was interesting about how"**. Lead with the engineering, not the product. If you don't have a real architecture write-up, **skip this sub** — a flat launch post will get nuked.

## Title

```
I built an AI-native browser and decoupled tab-groups from the layout tree — here's why
```

## Title alternates (all engineering-led, no marketing)

- `BSP layout engine for an Electron browser as a pure-TS package — 41 tests, design notes`
- `Cross-WebContentsView OS drag-and-drop with custom MIME types — what I learned shipping a browser on Electron`
- `Adding a non-streaming oneShot() to a LangGraph chat orchestrator — design notes from Sable`

## Body

```markdown
I shipped the v1.0 alpha of [**Sable**](https://github.com/your-org/sable) today — an AI-native desktop browser on Electron. Two design choices that I think are worth a programming-sub conversation, and one mistake I made and reversed:

---

**1. Tab groups are a tab-strip concept, not a BSP-tree concept**

The first version coupled grouping to the layout: a "group" was a multi-tab leaf in the BSP tree. It looked clean on paper but degenerated immediately — every tab started in its own leaf, so dragging tab A onto tab B was indistinguishable from a user just clicking a tab. Worse, splits broke groups: dragging a grouped tab to a pane edge meant either the group splits with it (surprising) or the tab leaves the group (also surprising).

Reverted to: `groupId` lives on the **TabState**, fully decoupled from the BSP tree. The strip pill is the source of truth for grouping; the layout is just where the active tab in each group is rendered. Opening a grouped tab calls `openGroup(...)` which auto-splits the layout via the existing apply-drop primitives. Splits and groups now compose cleanly.

The lesson: when two domains feel like they should share a representation but their lifecycles diverge, *they shouldn't*. Group lifetime ≠ split lifetime.

---

**2. The BSP layout engine is its own pure-TS package**

`packages/layout-engine/` is zero-dep TypeScript. No Electron, no React, no DOM. Just types + functions: `applyDrop`, `removeTab`, `activateTab`, `popTab`, `resize`, `dividers`, `queries`. 41 unit tests cover the algebra.

The win: every drag-drop / split-resize bug is reproducible in a Vitest run in milliseconds, no Electron, no React. The chrome UI is a thin renderer over the engine. CI's per-PR layout-engine test suite has caught regressions four times already.

---

**3. The chat orchestrator unifies streaming and non-streaming with one StateGraph**

LangGraph.js is the orchestrator. `streamEvents v2` powers the chat sidebar (token-by-token via [AG-UI Protocol](https://docs.ag-ui.com)), but the new-tab-page intent resolver wants a *non-streaming* answer in 1-2 turns. Same provider config, different consumption pattern.

The shape:
```ts
class ChatOrchestrator {
  async *stream(input): AsyncIterable<AGUIEvent> { /* uses streamEvents v2 */ }
  async oneShot(input, opts: { maxTokens, signal }): Promise<string> { /* invoke + abort */ }
}
```

The intent resolver wraps `oneShot` in a single-flight `AbortController` so rapid keystrokes cancel in-flight calls. Embedded Qwen 3 (the local model) can't handle concurrent generations — it'd error with "No sequences left" — so the abort is load-bearing for correctness, not just UX.

A salvage step parses partial JSON with a regex when the model truncates mid-response. Not pretty. Robust enough.

---

**Stack** (in case you care)

- Electron 33 + WebContentsView per tab
- React 18 + Tailwind 3 + Zustand 5 + Vite 6 (chrome UI)
- LangGraph.js + AG-UI Protocol over typed `contextBridge` IPC
- node-llama-cpp + Qwen 3 (Apache 2.0) for the on-device path; Anthropic / OpenAI BYOK
- keytar for OS keychain
- pure-TS layout-engine package

CI matrix: Windows × macOS × Linux × {typecheck, tests, build}. MIT.

Repo: https://github.com/your-org/sable

Happy to dig into any of the three above, or anything else under the hood. Especially curious if anyone has a cleaner pattern for the streaming/non-streaming dual API on a single LangGraph.
```

## Things to expect in comments

- **"Why Electron?"** — Real Chromium, real `webContents.startDrag`, free DevTools, multi-platform from day one. The honest answer + acknowledgement of the size cost. See `comment-templates.md`.
- **"Why not Tauri?"** — WebView per platform = inconsistent rendering, no `webContents.startDrag`. Considered. Decided against for this product.
- **"Token budgeting algorithm?"** — Greedy by recency, hard cap 18 KB. Simple, predictable, tells the user what was excluded.
- **"How is the Linux titlebar?"** — Custom; native fallback didn't ship clean.
- **"Why LangGraph and not just calling the SDK directly?"** — Tool calls / interrupts / state snapshots in V1.x. Worth the abstraction.

## Posting checklist

- [ ] Title is engineering-led, no superlatives
- [ ] Body has at least 2 specific design decisions with the trade-off articulated
- [ ] Don't post a "launch tweet" body here — it dies. The body above is intentionally a tech write-up.
- [ ] Reply to first 2 comments within 30 minutes (this sub's mod tools nuke unanswered self-posts)
- [ ] If response is lukewarm, **don't push it**. Cross-post to r/electronjs or r/typescript instead.
