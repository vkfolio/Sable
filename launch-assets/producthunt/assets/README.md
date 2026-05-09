# Product Hunt visual assets

PH posts live and die by the first image. This is what we need to capture / make.

## Quick generator

There's an HTML asset generator at [`index.html`](index.html). Open it in a modern browser:

```
launch-assets/producthunt/assets/index.html
```

It uses **reveal.js** for navigation and **html2canvas** for export. Each asset is a slide; each slide has its own **Download PNG** button, plus a **Download all** in the top bar.

- **Toggle theme** (light / dark) in the top bar — swap and re-download for both variants if you want a dark version of any image.
- **Arrow keys** or the on-slide controls navigate between assets.
- **Download all** captures every slide and bundles them into a single ZIP file (`sable-ph-assets-{theme}-{date}.zip`). One download, no per-file prompt — extracts straight into this folder.
- Per-slide **Download PNG** buttons still save individual files for one-off captures.
- All output goes to your **Downloads** folder. **Extract / move the PNGs into this folder** (`launch-assets/producthunt/assets/`) before uploading to PH.

The generator outputs at exact PH spec dimensions:

| Slide | Output filename | Dimensions |
| --- | --- | --- |
| 1 | `thumbnail.png` | 240 × 240 (transparent) |
| 2 | `gallery-1-hero.png` | 1270 × 760 |
| 3 | `gallery-2-tab-group.png` | 1270 × 760 |
| 4 | `gallery-3-citation-drop.png` | 1270 × 760 |
| 5 | `gallery-4-pricing.png` | 1270 × 760 |
| 6 | `gallery-5-themes.png` | 1270 × 760 |

If a slide doesn't capture cleanly, open DevTools → Console and check for html2canvas errors. Common cause: blocked CORS on a webfont. The generator pre-loads everything via `document.fonts.ready` so this shouldn't happen, but if it does, refresh and try once more.

For the demo video (`demo.mp4`) we still need to record it manually — the generator only handles still images.

## Required

| File | Spec | Purpose |
| --- | --- | --- |
| `thumbnail.png` | **240 × 240**, PNG with transparency | The square logo on the leaderboard. Use the Sable mark from `resources/icon.svg` cleanly centered on transparent. **No wordmark.** |
| `gallery-1-hero.png` | **1270 × 760**, PNG | The headline shot. **Most important image.** Full Sable window, default Lavender theme, light mode, 2-3 split panes (article + code + docs), chat sidebar visible with a streaming reply mid-flight. The shot has to read at PH-feed thumbnail size. |
| `gallery-2-tab-group.png` | 1270 × 760 | Mid-drag of a tab pill landing on another pill — caught at the moment the group preview appears. Crop tighter than the hero so the gesture is unmistakable. |
| `gallery-3-citation-drop.png` | 1270 × 760 | Sidebar showing a freshly-dropped paragraph rendered as a markdown blockquote with the source URL. Show the source page on the left for context. |
| `gallery-4-pricing.png` | 1270 × 760 | Composite of the three provider cards (Built-in $0/forever featured, Anthropic BYOK, OpenAI BYOK). Use the launch site at `docs/index.html#pricing` as the source — screenshot the section, no browser chrome. |
| `gallery-5-themes.png` | 1270 × 760 | The 7-cell themes grid from the launch site (or a 7-up of the same Sable window in each theme). Sells the "personalities" angle. |

## Optional but recommended

| File | Spec | Purpose |
| --- | --- | --- |
| `demo.mp4` | **≤ 60s, 1280 × 720 min, ≤ 50MB**, MP4/H.264 | Voice-over-free walkthrough: open Sable → split panes → drop a paragraph → ask a question → reply streams in. Caption every step with on-screen text since most viewers watch muted. |

## Capture guidance

- **Resolution**: capture at 2× and downscale to spec — sharper text. (PH itself shows them at lower res, but a sharp source survives compression better.)
- **Theme**: lead with **Lavender / light** for the hero. Use **Sky / dark** for one variant in the gallery to hint at theme variety.
- **Demo content**: realistic and non-sensitive. Long-form articles (Wikipedia, ArXiv abstracts), GitHub repos, public docs. **No real email addresses, API keys, or personal browsing history visible.**
- **Frame the gesture**: when illustrating drag-to-group / drag-to-split / citation-drop, freeze mid-gesture and add the cursor + ghost preview if your capture tool supports it.
- **No mouse cursor unless the cursor is the subject** (drag captures yes, static page no).

## File naming convention

`gallery-{position}-{slug}.png` — the leading number controls upload order, which controls feed order.

## Where to put final assets

Drop the final exported PNGs / MP4 here, then upload from this folder into the PH form. Keep the source files (Figma, Sketch, raw captures) somewhere outside the repo — these binaries should stay small.
