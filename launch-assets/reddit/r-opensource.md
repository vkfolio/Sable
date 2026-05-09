# r/opensource

Lead with licence + contributor opportunity. Don't be salesy — this audience cares about *governance* and *participation*, not features.

## Title

```
Sable — an open-source desktop browser with a built-in offline AI model. MIT, looking for contributors.
```

## Title alternates

- `Open-sourced Sable, an AI-first browser. MIT licence, 41 layout tests, contributor-ready.`
- `Released Sable v1.0-alpha — MIT-licensed AI browser. Tier 2 roadmap is wide open for contributors.`

## Body

```markdown
Released the alpha of **Sable** today. It's a cross-platform desktop browser (Win / macOS / Linux) where chat and pages share one workspace. Open-sourcing it because every piece of it is a good standalone learning project, and because the most interesting parts of the roadmap need more hands than mine.

**Licence and dependencies**

- **MIT** for the app itself
- Bundled local model: **Qwen 3** (Apache 2.0) — picked specifically because it's one of the few capable open-weight models *without* a monthly-active-users clause or attribution requirement. That cleanliness matters when you're shipping a default model in a consumer app.
- Built on **Electron 33**, **node-llama-cpp**, **LangGraph.js**, **AG-UI Protocol**, **react-markdown**. All of those are credited in the README's "Built on" section.
- Provider keys (Anthropic / OpenAI) are BYOK and stored via **keytar** in the OS keychain — never plaintext, never on disk.

**What's already in good shape for contribution**

- The **layout engine** is its own pure-TS package (`packages/layout-engine/`), zero runtime deps, 41 unit tests covering BSP ops, drag-drop, group, split, resize. Self-contained, easy to onboard.
- **Chat orchestration** is a LangGraph StateGraph with provider-agnostic streaming and an AG-UI translator. Adding a fourth provider (Mistral, Cohere, Groq) is an isolated change.
- **CI matrix** runs on Windows × macOS × Linux with typecheck + tests + builds on every PR.
- **`good-first-issue` queue** on the repo — favicon caching, intent-resolver rule packs, settings "clear browsing data" UI, sable://newtab as a real custom protocol, drag-to-rearrange grouped tabs.

**What I'd love help on (medium-large items)**

- **Recordable Skills** — narrate a workflow once, parameterise it, fire later. The composer + chat history is the substrate; the missing piece is the recording / playback layer.
- **Personal knowledge graph** — embeddings + LanceDB + an encrypted-at-rest store keyed off the OS keychain, with a default-deny blocklist for banking / mail / auth origins. The History layer that ships today is the seed.
- **Agentic green-thread tabs** — spawn a hidden tab with a goal, drive via CDP (`webContents.debugger`), with a capability allowlist and human-in-the-loop approval.

These are deliberately ambitious — open issues with design discussions before coding so we align on shape.

**Governance**

It's just me right now. I want to bring on co-maintainers as soon as anyone shows up with two well-shaped PRs. No CLA, no contributor agreement gymnastics — just MIT and a Code of Conduct. PRs needs CI green and a reasonable test for layout-engine changes.

**Caveats**

- v1.0 alpha. There's no auto-update or code signing yet. Building from source today.
- Documentation is honest but not exhaustive. Architecture diagrams in the README, but plenty of internals that warrant their own write-ups.
- Some files I'd love to see refactored — happy to take PRs that improve the chrome-ui state-store layout.

**Repo:** https://github.com/your-org/sable
**Contributing guide:** https://github.com/your-org/sable/blob/main/CONTRIBUTING.md
**Architecture:** in the README

Happy to talk shop on Electron security posture, why I went with LangGraph over a hand-rolled orchestrator, the trade-offs of decoupling tab-groups from the BSP layout, or anything else under the hood.
```

## Things to expect in comments

- **"Why MIT and not GPL / AGPL?"** — Personal preference for permissive. We don't gate features behind a copyleft check; if someone wants to fork it, that's fine. (Some on this sub will push for AGPL — engage politely, don't change your mind on a launch day.)
- **"What about CLA?"** — None. PRs are accepted on the standard MIT + Code-of-Conduct basis.
- **"Will you accept funding?"** — Open to GitHub Sponsors. Not setting up a foundation yet.
- **"How do I help if I don't know Electron?"** — Layout-engine package is pure TS, no Electron knowledge required. Pointer to that.

## Posting checklist

- [ ] Don't lead with screenshots — this sub's algorithm prefers text-first launches
- [ ] CONTRIBUTING.md must be in the repo and referenced in the post
- [ ] Be ready to defend the MIT vs copyleft choice without being defensive
- [ ] Have a list of 5+ `good-first-issue` items already filed
