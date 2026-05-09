# X — launch thread

Quote-reply each tweet to the previous one, manually, with one image per tweet where indicated. Don't use auto-thread tools — manual replies index better in search.

## Tweet 1 — the launch tweet itself

See `launch-tweet.md`. Video or hero image attached.

---

## Tweet 2 — the citation drop gesture (256 chars · attach `screenshots/chat-citation-drop.png`)

```
The core gesture:

You're reading something. You drag a paragraph into the chat sidebar. Sable cites it back as a markdown blockquote with the source URL. Then you ask the question.

No copy-paste. No "what was that quote again?" No tab-switching.
```

---

## Tweet 3 — the local model angle (270 chars · attach `screenshots/usecase-research-drawer.png` or video of streaming)

```
Sable ships with Qwen 3 baked in, runs on your machine via node-llama-cpp.

That means:
· No API key required to start chatting
· Zero outbound network for chat
· Works on a plane

Apache 2.0 weights, MIT app. No catch.
```

---

## Tweet 4 — BYOK is optional, not the default (260 chars · attach `pricing` section screenshot from the launch site)

```
For frontier-quality answers, paste your Anthropic or OpenAI key. Sable streams from them; you're billed by them on your account.

Sable adds zero markup. Sees none of the money. Has no account / no subscription / no upsell.

It's just a browser.
```

---

## Tweet 5 — drag-to-group (236 chars · attach `screenshots/tab-group-drag.png` ideally a GIF/video)

```
Open three articles. Drag tab #2 onto tab #1.

They group, and the layout auto-arranges them side-by-side.

Drag tab #3 to a pane edge → 3-way split. Each pane has its own little URL bar.

Layouts that scale with the conversation.
```

---

## Tweet 6 — multi-tab context (228 chars · attach `screenshots/usecase-diff-articles.png`)

```
Ctrl-click two or three tabs to mark them as context.

Now ask: "Where do these three sources actually disagree?"

Sable pulls the main content from each, packs as much as fits, and tells you what didn't make it. Reply quotes the disagreements inline.
```

---

## Tweet 7 — themed spaces (200 chars · attach `screenshots/themes-grid.png`)

```
Each "space" is a personality.

Lavender. Mint. Coral. Amber. Rose. Sky. Sage.

Pick one and the whole window re-tints. Switching feels like walking into a different room — not flicking a colour-accent toggle.
```

---

## Tweet 8 — open source, contributors welcome (252 chars · no image, or repo screenshot)

```
Everything's MIT. Layout engine is its own pure-TS package with 41 unit tests.

Tier 2 of the roadmap is wide open: recordable Skills, personal knowledge graph, agentic green-thread tabs.

If any of that sounds like the browser you wished existed, come build it.
```

---

## Tweet 9 — the link (170 chars · attach launch-site hero screenshot)

```
v1.0 alpha. Windows / macOS / Linux.

Repo + docs + the full feature list:
🔗 github.com/your-org/sable

Would love your feedback. Bugs especially welcome.
```

---

## Variants

### Shorter thread (5 tweets)

If you don't have visuals for all 9, cut to:
1. Launch tweet
2. Citation drop (Tweet 2 above)
3. Local-model angle (Tweet 3 + 4 merged into one)
4. Drag-to-group (Tweet 5)
5. Link + ask (Tweet 9)

### Visual-first thread (no copy)

If you have a great 30-60s screen recording, just post the launch tweet + the recording, no thread. Reserve the thread for replies if interest is there.

## Reply strategy under the thread

- For supportive comments: thank them, quote one specific thing they said, ask a follow-up. Quality > volume.
- For critical comments: engage seriously, agree where they're right, disagree where they're wrong, never get defensive.
- For "how does this compare to Arc / Dia": see `reply-templates.md`.
- For "why Electron": see `reply-templates.md`.
- For genuine bug reports: ask them to file an issue, link the repo. Don't try to debug in the thread.

## Don't

- Quote-tweet your own thread to "boost" it. Looks desperate.
- Reply to every supportive comment with the same emoji. Looks botted.
- Post the same screenshots in 3 different threads in 3 days. The algorithm punishes repetition.
- Argue with trolls. Mute or ignore.
