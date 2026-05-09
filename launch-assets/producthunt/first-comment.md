# Maker's first comment

Post this within 5 minutes of the listing going live. It opens with a story, says what's working, says what's rough, and ends with a clear ask.

---

Hey Product Hunt 👋

I'm Vignesh, and I've been building **Sable** for the last few months. It's a desktop browser where chat and pages share one workspace — and today's the alpha launch.

**The problem I kept hitting:**

Every browser ships an AI sidebar now, but the sidebar doesn't really *know* anything about what I'm reading. I'd find a passage, copy it, paste it into a chat window, paste it back into a doc. Or I'd want to compare three articles and end up tab-juggling like it was 2014. The "AI" felt bolted on. I wanted a browser that actually *interoperates* with the page.

**What Sable does today:**

- Drop a paragraph from any page into the chat sidebar — it cites it back automatically as a markdown blockquote with the source URL. Same for images: drop them in, they go straight in as multimodal content.
- Drag a tab onto another tab to **group** them — they auto-split side-by-side. Drag a tab to a pane edge for arbitrary nested splits, with mini per-pane URL bars so you always know which pane you're driving.
- Ctrl-click multiple tabs and they become one shared context for the next chat message.
- Each "space" gets its own pastel theme — the whole window re-tints, so it genuinely feels like a different room as you switch.
- A smart new-tab page that resolves what you mean (`flight sfo to nrt` → Google Flights), backed by a static rule pack and falling back to a small on-device LLM.

**The pricing pitch:**

**Sable is free out of the box.** A fast on-device AI model (Qwen 3, Apache 2.0) is built in — no API key, no subscription, no per-message bill. For harder work, paste your Anthropic or OpenAI key and Sable will stream from those instead. You're billed by them on your own account; **Sable itself never charges you anything**, and never will.

**What's rough:**

This is a v1.0 alpha. There's no auto-update yet, code-signing is on the Tier 1 roadmap, and grouped-tab persistence across restarts is the next thing I'm shipping. The on-device model is fast but not GPT-5 — for nuanced reasoning, BYOK is the move. Expect rough edges.

**The roadmap is the most interesting part:**

I want Sable to grow into:
- **Recordable Skills** — narrate a workflow once ("scrape these tabs into a markdown table"), fire later with one click
- **A personal knowledge graph** built from your own browsing history — encrypted at rest, default-deny on banking / mail / auth origins, semantic recall over everything you've read
- **Agentic green-thread tabs** — spawn a hidden tab with a goal, capability allowlist, human-in-the-loop approval

It's MIT-licensed, the layout engine has 41 unit tests, and CI runs on Windows × macOS × Linux on every PR. There are several `good-first-issue` items waiting if you want to help build any of the above.

**What I'd love today:**

Any feedback — what's confusing, what's missing, what would make you switch from Arc / Dia / Chrome. Bugs especially welcome (open an issue, I'll read every one). And if you're a contributor looking for a small but real Electron / TypeScript project to work on, the door is wide open.

GitHub: `https://github.com/your-org/sable`

Thanks for taking a look 🙏

---

## Tone notes

- Don't say "we" if you're a solo maker — be a person.
- The em-dashes are intentional rhythm. Don't strip them.
- Keep "alpha" in there. Don't oversell.
- The roadmap section is what hooks contributors. Don't shorten it.
- End with a real ask ("feedback") not a fake one ("vote please").

## Variants

- **If multiple makers**: Replace "I'm Vignesh" with "We're [name 1] and [name 2]" and adjust pronouns.
- **If you have a demo video**: Add a line above "What Sable does today": "There's a 50-second demo at the top of the listing — that's probably the fastest way to see the core gestures."
- **If you have a Discord**: Add at the bottom: "Discord for early users + contributors: [link]."
