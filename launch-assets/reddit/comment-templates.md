# Reddit comment templates

Pre-written replies for the questions you'll definitely get. **Do not paste verbatim** — Reddit detects copy-paste replies as spam. Use these as starting points, edit each one for the specific commenter.

---

## "Why Electron? Bloat, RAM, etc."

> Honest answer: I needed real Chromium (not WebView), `webContents.startDrag` for the chat-to-page drag, and DevTools that work on every page out of the box. Tauri's WebView per platform meant inconsistent rendering and no equivalent drag API.
>
> Yes, it's ~150 MB on disk. Memory in practice tracks Chromium for the tabs (which you'd pay anyway in any browser) plus ~80 MB for the chrome renderer, plus whatever the local model holds (~2 GB for the 1.7B Qwen).
>
> If someone wants to fork it on top of Tauri or Wry once their drag-and-drop story matures, MIT and the layout engine is its own pure-TS package — it'd port directly.

---

## "What about Arc / Dia / Comet?"

> Arc / Dia are excellent and clearly inspirational here. The differences I care about:
>
> 1. **Sable is open source (MIT).** You can fork it, audit it, run a build with the telemetry stripped (there isn't any to strip, but you could check). Arc and Dia are closed.
> 2. **Free out of the box, no account.** A local model is the default; no signup, no email, no "free tier" cliff. BYOK is opt-in for frontier-quality.
> 3. **Cross-platform from day one.** Linux included.
> 4. **It's the early alpha** — Arc has years of polish on us. We're not pretending parity.

---

## "Will it have extensions?"

> Not in V1.x — Electron doesn't support MV3, and MV2 is being phased out. It's an explicit non-goal for now.
>
> The medium-term play is **Recordable Skills** (Tier 2 roadmap): you narrate a workflow once ("scrape these tabs into a markdown table"), Sable captures the prompt + tab context + expected output as a parameterised skill. Not the same thing as extensions — but covers a lot of what people actually want.

---

## "How do I trust it with my Anthropic / OpenAI key?"

> Keys go through the preload's narrow `window.sable.*` API into the main process, where they're stored in your OS's keychain (Windows Credential Manager / macOS Keychain / libsecret on Linux) via `keytar`. They're never written to disk in plaintext, never sent to anyone but the provider you configured, and never exposed to the chrome renderer (only `hasKey: boolean` is).
>
> Audit it: the relevant code is `apps/shell/src/main/settings-store.ts`. Single file. No clever indirection.

---

## "What's actually local vs cloud?"

> **Local-only:**
> - Browsing history (`userData/history.json`)
> - Settings, spaces, bookmarks
> - The default AI model (Qwen 3, runs via node-llama-cpp)
> - API keys (in OS keychain)
>
> **Outbound only when active:**
> - Anthropic API if you've set an Anthropic key and made it active
> - OpenAI API ditto
> - Google favicon proxy for tab icons (`good-first-issue` to fix with a local cache)
> - Chromium's standard DNS / safe-browsing
>
> **Never:** telemetry, analytics, account/login, cloud sync.

---

## "Why Qwen 3 over Llama 3.2 / Gemma 3 / Phi 4?"

> Apache 2.0 license. That's the headline.
>
> - **Llama 3.2** has the MAU clause + attribution requirement. Fine for a side project, awkward for a default model in a shipped consumer browser.
> - **Gemma 3** has the prohibited-use policy and remote revocation language. Same problem.
> - **Phi 4** is permissively licensed but the chat template story across sizes is rougher than Qwen 3's.
> - **Qwen 3** is Apache 2.0 across all sizes (0.6B / 1.7B / 4B / etc.), single chat template, MMLU 65.6 (1.7B) / 84.2 (4B), 256K native context. The cleanest licensing for default-model territory.
>
> Adding more local options is a Tier 2 roadmap item. PR welcome.

---

## "Performance / tok/s / does it work on [X]?"

> Rough numbers on the 1.7B Q4_K_M:
> - **CPU baseline laptop (M1 Air / mid-tier Intel):** 25-40 tok/s
> - **Metal (M2 Max / M3 Pro):** 60-100+ tok/s
> - **CUDA RTX 30/40 series:** similar to Metal or higher
> - **Vulkan on AMD / Intel Arc:** 30-60 tok/s, hardware-dependent
>
> 4B is roughly half those numbers. 0.6B is much faster but genuinely small — for real reasoning use 1.7B at minimum. node-llama-cpp picks the backend automatically.

---

## "Why not just a Chrome extension?"

> Two things that need to live in the browser process, not the page:
> 1. The drag-from-page-to-chat protocol (custom MIME on `webContents.startDrag` — you can't do this from an extension).
> 2. The BSP layout with split panes per tab. Extensions can't repaint the chrome.
>
> Plus the on-device model lives in the main process; extensions can't sustain a multi-GB resident process.

---

## "Will the on-device model be enough for daily use?"

> Honest answer: depends on what you use it for.
>
> - **Yes** for citations, summaries, simple comparisons, the new-tab intent resolver, drafting short replies, code questions on small snippets.
> - **Maybe** for nuanced multi-tab comparisons or longer reasoning chains — 1.7B is small.
> - **No** for the kind of work where you'd pick GPT-5 / Claude Opus today. That's what the BYOK path is for.
>
> The combo I actually use: local model for 80% of fast-turn questions, BYOK Claude for the 20% where I want frontier reasoning.

---

## "How do I contribute?"

> [`CONTRIBUTING.md`](https://github.com/your-org/sable/blob/main/CONTRIBUTING.md) has the full tour, but tl;dr:
>
> - Layout-engine package (`packages/layout-engine/`) is pure TS, zero deps, 41 tests — easiest entry point. The `good-first-issue` items there are real bugs / features.
> - Intent-resolver rule packs (`apps/chrome-ui/src/ntp-resolver.ts`) — adding more sites and intent categories is a clean PR.
> - Settings "clear browsing data" UI — IPC exists, the dialog doesn't. Self-contained.
>
> No CLA. PR + green CI + reasonable test for layout-engine changes.

---

## "Roadmap timeline?"

> Trying not to commit to dates I'd miss:
>
> - **Tier 1 (V1.0 polish)** — weeks. Code signing, auto-update, drag-rearrange grouped tabs.
> - **Tier 2 (Workflow / Skills)** — quarters. Recordable Skills is the next big swing.
> - **Tier 3 (Knowledge graph / agents)** — when the right contributors show up. The history layer is already in place as the seed.
>
> If you want any of these on a faster timeline, the contributor door is wide open.

---

## "It's not on Snap / Flatpak / Homebrew / winget yet"

> Correct — alpha doesn't have signed/distributed builds. The release after Tier 1 wraps will be the first one with proper packaging. Tracking it on the roadmap.
>
> Today: build from source, runs cleanly with `pnpm install && pnpm shell`.

---

## Generic "this is cool!"

> Thanks! If you end up trying it, the things I'd most love to know:
> 1. Did the citation drop and tab-grouping gestures click immediately, or did they need explanation?
> 2. Did you stick with the local model or BYOK on day one?
>
> Either answer helps shape what to polish next.

---

## "What about my pet feature [X]?"

> Open an issue with a brief description and one screenshot/sketch — I read every issue. No promises on timeline, but feature requests with use-cases are how the roadmap actually moves.
