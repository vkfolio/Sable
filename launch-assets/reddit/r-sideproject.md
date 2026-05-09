# r/SideProject

## Title

```
I built Sable — a desktop browser where chat and pages share one workspace. Free out of the box, MIT-licensed.
```

(120 chars — under the 300 cap, scannable.)

## Title alternates

- `Sable: a browser where dragging a paragraph into chat auto-cites it. Open-source, free out of the box.`
- `8 months in: an AI-first browser with a built-in offline model. Drag-to-split, drag-to-group, BYOK optional.`

## Body

```markdown
Hey r/SideProject — long-time lurker, first launch.

I've been building Sable for the last few months. It's a desktop browser where the chat sidebar actually *uses* what you're browsing instead of being a generic LLM box bolted on the side.

**What it does today**

- Drop a paragraph from any page into the chat sidebar → it cites it back as a markdown blockquote with the source URL
- Drop an image → goes in as multimodal content, the AI can actually see it
- Drag a tab onto another tab to **group** them — they auto-arrange side-by-side
- Drag a tab to a pane edge for arbitrary nested splits, with mini per-pane URL bars
- Ctrl-click multiple tabs and they become one shared context for the next message
- Each "space" gets its own pastel theme — the whole window re-tints, not just an accent

**The pricing pitch (the thing I'm proudest of)**

Sable is **free out of the box**. A small AI model (Qwen 3, Apache 2.0) runs entirely on your machine — no API key, no subscription, no per-message bill. For frontier-quality answers you can paste your Anthropic or OpenAI key and Sable will stream from those instead. You're billed by them on your own account; **Sable itself never charges you anything, and never will**. MIT-licensed, the whole thing.

**What's rough (because it's a v1.0 alpha)**

- No auto-update yet — you build from source for now
- Code-signing is on the Tier 1 roadmap
- The on-device model is fast but not GPT-5; for nuanced reasoning, BYOK is the move
- Tab grouping doesn't yet persist across restarts (next on the list)

**What I want to grow it into**

- Recordable Skills — narrate "scrape these tabs into a markdown table" once, fire later with one click
- A personal knowledge graph from your history — semantic recall over everything you've read, encrypted at rest
- Agentic green-thread tabs — spawn a hidden tab with a goal, capability allowlist, human-in-the-loop

Cross-platform from day one (Windows / macOS / Linux). Layout engine is a pure-TS package with 41 unit tests, CI matrix runs on every PR.

**Repo:** https://github.com/your-org/sable
**Launch site:** https://your-org.github.io/sable

Would love any feedback — what's confusing, what's missing, what would make you switch from Arc / Dia / Chrome. And if you want a real Electron / TypeScript side-project to contribute to, there are several `good-first-issue` items waiting.
```

## Comment to pin (post yourself, then sticky)

```markdown
Happy to answer architecture / build questions in the comments — IPC layout, the BSP layout engine, how the chat orchestrator unifies streaming across providers, etc. AMA-style.
```

## Things to expect in comments

- **"Why Electron?"** — see comment-templates.md
- **"What about Arc?"** — see comment-templates.md
- **"Will it have extensions?"** — short answer: not in V1.x (Electron limitation). See comment-templates.md.
- **"Privacy?"** — see comment-templates.md (history is local, keys in OS keychain, no telemetry)
- **"What does on-device cost in RAM?"** — Qwen 3 1.7B is ~2 GB RAM in use; 4B is ~6 GB.

## Posting checklist

- [ ] Use a personal account with prior comment history (new accounts get auto-removed)
- [ ] Post body has no images — Reddit's text+link layout penalises image-heavy posts in r/SideProject
- [ ] Reply to the first 3 comments within 30 minutes
- [ ] Don't reply with the exact same text in multiple comments — Reddit's spam filter catches that
