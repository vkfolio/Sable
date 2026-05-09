# Sable — launch video script

One video, two homes: the PH demo (`producthunt/assets/demo.mp4`) and the X launch tweet (`x/assets/launch-video.mp4`). Same content. Different upload limits.

## Specs

| Field | Value |
| --- | --- |
| **Primary length** | 60 seconds |
| **Cut-down length** | 30 seconds (X-only version, optional) |
| **Resolution** | 1920 × 1080 (or 1280 × 720 minimum) |
| **Format** | MP4 / H.264 with AAC audio |
| **Frame rate** | 30 fps (record screens at 60, conform on export) |
| **Captions** | **Required.** Most viewers watch muted. Burned in, not sidecar. |
| **Voiceover** | Optional but adds personality. If you skip, tighten the captions. |
| **Background music** | Optional. Soft, instrumental, low-volume. Avoid copyright. Try Epidemic Sound or YouTube Audio Library. |
| **End card** | 4-5s static logo + tagline + URL |

## The arc

Eight beats, each 6–10 seconds. The first three carry the most weight — most viewers bail at 15s.

| # | Beat | Time | Owns |
| --- | --- | --- | --- |
| 1 | Hook | 0:00–0:03 | The tagline lands |
| 2 | Citation drop | 0:03–0:10 | The core gesture |
| 3 | Tab group + split | 0:10–0:19 | The layout |
| 4 | Multi-tab chat | 0:19–0:28 | What chat *does* with the page |
| 5 | Free out of the box | 0:28–0:37 | Local model · $0/forever |
| 6 | BYOK | 0:37–0:45 | Optional frontier path |
| 7 | Smart new-tab | 0:45–0:53 | The intent resolver |
| 8 | Outro | 0:53–1:00 | Logo · URL · CTA |

---

## Full script (60 seconds)

### Beat 1 · Hook · 0:00–0:03

**ACTION**
Cold open. Full Sable window, default **Lavender** theme, light mode, no tabs yet — just the new-tab page with its breathing pastel gradient. Hold completely still for the first beat. No cursor on screen.

**CAPTION** *(fades in 0.5s, holds 2s, fades out 0.5s)*
> A browser that *thinks*<br/>with you, not at you.

> The word *thinks* in **Instrument Serif italic**, warm peach gradient (`#FFB37A → #FF7A55`). Match the launch site's hero exactly. Everything else in Inter 500.

**VO** *(optional)*
> "Sable. A browser where chat and pages share one workspace."

**NOTES**
- Frame absolutely still. Resist the urge to animate.
- Caption position: lower-left third, away from the breathing gradient.
- Avoid OS chrome (Dock, taskbar). Hide it before recording.

---

### Beat 2 · Citation drop · 0:03–0:10 *(7s · the most important beat)*

**ACTION**
1. Cursor enters from the right, clicks a tab pre-loaded with the **Mixtral arxiv abstract**.
2. Page renders.
3. Cursor selects this paragraph: *"each layer is composed of 8 feedforward blocks (i.e. experts)"*.
4. Selection drag → drops into the chat sidebar.
5. The dropped paragraph appears as a markdown blockquote with the source URL beneath it.
6. Cursor types: `Explain like I'm new to this`. Pause on the keystrokes for 1s.

**CAPTION**
> **Drop a paragraph** → instant citation.

**VO** *(optional)*
> "Drop a paragraph from any page into the chat sidebar — Sable cites it back automatically."

**NOTES**
- The drag-drop motion is the hero shot. **Slow it down by 20%** in post if it feels rushed.
- Highlight the citation pill with a 1-frame flash on commit.

---

### Beat 3 · Tab group + auto-split · 0:10–0:19 *(9s · the layout shot)*

**ACTION**
1. Open a second tab — the **Qwen3 model card**.
2. Drag the new tab pill **onto the existing Mixtral pill** in the strip.
3. They snap together → the layout auto-splits side-by-side.
4. The "MoE · group" bracket label fades in above both pills.
5. Each pane gets its own little URL bar.

**CAPTION** *(two-part, swaps mid-beat)*
> *0:10–0:14 →* **Drag a tab onto a tab → group.**
> *0:14–0:19 →* They auto-arrange side-by-side.

**VO** *(optional)*
> "Drag a tab onto another tab to group them. Sable auto-arranges the layout."

**NOTES**
- Stage with both tabs already open before recording.
- Make the drag motion slow and deliberate — viewers need to *see* the gesture.
- Cursor with the drag-ghost preview is critical. Use a screen recorder that captures it.

---

### Beat 4 · Multi-tab chat · 0:19–0:28 *(9s)*

**ACTION**
1. Cursor Ctrl-clicks both tabs in the strip — they get the `@` context badge.
2. Click in the chat composer.
3. Type: `Compare these two on long-context recall`.
4. Hit Enter.
5. Reply streams in token-by-token, citing both panes inline as `[1]` `[2]` chips.

**CAPTION**
> **Ctrl-click tabs** → one shared context.

**VO** *(optional)*
> "Ctrl-click tabs to make them one shared context. The reply cites them inline."

**NOTES**
- The streaming-in animation is gold — don't speed it up. Let the tokens land.
- Highlight the `[1]` `[2]` citation pills with a subtle glow when they appear.

---

### Beat 5 · Free out of the box · 0:28–0:37 *(9s · the cost story)*

**ACTION**
1. Camera cuts to a tight crop of the chat sidebar header.
2. Zoom slowly into the model badge: **`local · qwen3`**.
3. A floating sticker fades in next to it: **`$0 / forever`** in mono.
4. A second sticker fades in below: **`no API key · runs offline`**.

**CAPTION**
> **Free out of the box.** A small AI runs on your machine.

**VO** *(optional)*
> "A small AI model runs entirely on your machine. No API key. No subscription."

**NOTES**
- This beat is the differentiator vs. every other AI browser. **Don't rush it.**
- The mono stickers should look like the launch site's chips — `JetBrains Mono`, soft pastel pill background.

---

### Beat 6 · BYOK · 0:37–0:45 *(8s · the upgrade path)*

**ACTION**
1. Cut to Settings → Providers.
2. Three provider cards: Built-in *(active)*, Anthropic, OpenAI.
3. Cursor clicks Anthropic → a key field slides out.
4. Paste an `sk-ant-…` key (use a fake/blurred one in editing).
5. Click "Set active". The active dot moves to Anthropic.
6. Cut back to chat — same conversation, but the badge now reads `claude · sonnet 4`.

**CAPTION**
> **Want frontier quality?** Paste your Anthropic or OpenAI key. Pay them direct. Sable adds zero markup.

**VO** *(optional)*
> "For frontier-quality answers, paste your own key. You pay your provider directly — Sable never charges you."

**NOTES**
- Blur or replace the key in post. Never show a real key.
- The "active dot moves" detail is small but sells the seamlessness.

---

### Beat 7 · Smart new-tab · 0:45–0:53 *(8s)*

**ACTION**
1. Cmd/Ctrl-T → new tab.
2. Cursor clicks the new-tab omnibox.
3. Type: `flight sfo to nrt may 30`.
4. Tap Enter.
5. Google Flights opens with the right query pre-filled.

**CAPTION**
> Type what you mean. Sable picks the destination.

**VO** *(optional)*
> "Type what you want, hit Enter. Sable picks the destination — even if you didn't type a URL."

**NOTES**
- Pause for one beat *after* the user hits Enter, *before* the page loads — let the resolver moment register.

---

### Beat 8 · Outro · 0:53–1:00 *(7s)*

**ACTION**
1. Cut to the Sable logo, centered, on the warm-cream background.
2. Tagline fades in below: *A browser that thinks with you, not at you.*
3. URL fades in below the tagline: `your-org.github.io/sable`
4. Hold for 3 seconds.

**CAPTION** *(reinforces the URL)*
> Free · Open source · MIT · your-org.github.io/sable

**VO** *(optional)*
> "Sable. Free, open source, on Windows, Mac and Linux. Try the alpha today."

**NOTES**
- The end card lives on screen long enough to read **and** screenshot. Don't cut it short.

---

## Cut-down (30s) for X — optional

If the 60s feels long for X, cut to the four beats that carry the whole pitch:

1. **0:00–0:03** Hook (same as above)
2. **0:03–0:10** Citation drop
3. **0:10–0:19** Tab group + auto-split
4. **0:19–0:25** Free out of the box (compressed Beat 5)
5. **0:25–0:30** Outro

Skip beats 4, 6, 7 entirely. The thread under the launch tweet covers them.

---

## Production checklist

**Before recording**

- [ ] Sable built fresh from `main`, no DevTools open, no half-typed text in inputs
- [ ] Demo content prepared: Mixtral arxiv abstract + Qwen3 HF model card pre-loaded as bookmarks
- [ ] OS chrome hidden (taskbar / Dock / menu bar in autohide)
- [ ] Display set to 1920 × 1080 native scaling
- [ ] Cursor visible in the recorder; trail enabled if your tool supports it
- [ ] Notification Do-Not-Disturb on
- [ ] Default theme: Lavender, light mode
- [ ] **Provider preconfigured to Built-in (qwen3 1.7B)** — so Beat 5 reads correctly

**While recording**

- [ ] Record each beat in its own clip — easier to retake
- [ ] Move the cursor *deliberately*, never frantically
- [ ] Pause for half a second between actions — gives editing room
- [ ] Audio: separate track if doing voiceover; record in a quiet room with a real mic

**In post**

- [ ] Conform 60fps captures to 30fps for export
- [ ] Burn captions in (`Inter 500`, drop shadow, lower-third placement)
- [ ] Slow drag-drop and click moments by 15–20% for clarity
- [ ] Add a 1-frame white flash on key commits (citation lands, group forms, theme swap)
- [ ] Music ducks to -18 dB under voiceover
- [ ] Final mix: -14 LUFS integrated (spec for X / web)

**Before publishing**

- [ ] Watch the whole thing **muted**. If it doesn't make sense without sound, captions need work.
- [ ] Watch on a phone. If the captions are unreadable, increase size.
- [ ] Replace the placeholder URL (`your-org`) with the real one in the end card.
- [ ] Export two versions: `launch-video.mp4` (X, ≤ 50 MB) and `demo.mp4` (PH, ≤ 50 MB). Same source, different bitrates if needed.

---

## Caption-only version (no VO)

If you skip voiceover entirely, the captions need to do more work. Tighter wording per beat:

| Beat | Caption-only line |
| --- | --- |
| 1 | A browser that *thinks* with you, not at you. |
| 2 | Drop a paragraph → instant citation. |
| 3 | Drag tab onto tab → group. Auto-splits side-by-side. |
| 4 | Ctrl-click tabs → one shared context for chat. |
| 5 | Free out of the box. AI runs on your machine. |
| 6 | Want frontier quality? BYOK Anthropic / OpenAI. Pay them direct. |
| 7 | Type what you mean. Sable resolves the rest. |
| 8 | your-org.github.io/sable · MIT |

Each caption holds for the **full beat duration** with one fade-in / fade-out. Don't snake-text it line by line; viewers can't track that.

---

## Tools

- **Screen recording**: ScreenStudio (Mac), OBS, or Loom-export-MP4 (cross-platform)
- **Editing**: DaVinci Resolve (free), Premiere, CapCut Desktop
- **Captions**: Descript or CapCut auto-caption + manual review (it'll mis-spell "Sable")
- **Music**: Epidemic Sound, YouTube Audio Library, Pixabay Music

## What the script doesn't cover

- **Themes** (the per-space pastel personalities). Cut for runtime — gets shown in the launch site and on the threaded X post.
- **Drag-from-page-to-page-as-multimodal**. Fold this into the citation-drop beat if you have an extra second; otherwise skip.
- **Onboarding / model download**. Belongs in a "first-launch" video, not the pitch video.

## Final note

The script is a starting point. **Watch your first cut and rewrite.** If a beat feels boring, it is. If a caption needs a re-read, shorten it. The best launch videos are the ones that have been re-edited 6 times.
