# X visual assets

X is a visual platform. The launch tweet without a visual gets ~10% of the engagement of one with.

## Required

| File | Spec | Purpose |
| --- | --- | --- |
| `launch-video.mp4` | **30-60s, 1280 × 720 min, ≤ 50 MB**, MP4/H.264 with AAC audio | The launch-tweet video. **Mute-friendly with on-screen captions** — most people watch with sound off. Walk through: open Sable → drop a paragraph into chat → drag a tab onto another to group → drag to a pane edge to split. Caption every step. |
| `hero-1600x900.png` | 1600 × 900 (X feed-friendly 16:9) | Fallback for the launch tweet if no video. Use the same hero shot as PH gallery 1, cropped wider. |

## Per-thread tweets

| File | Maps to | Notes |
| --- | --- | --- |
| `t2-citation-drop.png` | Thread tweet 2 | Sidebar with a freshly-dropped citation. Reuse `docs/screenshots/chat-citation-drop.png` if it's already captured. |
| `t3-local-model.gif` or `.mp4` | Thread tweet 3 | A streaming reply from the local model — short, looped. Sells "it's actually responsive". |
| `t4-pricing.png` | Thread tweet 4 | Screenshot of the launch site's pricing section (`docs/index.html#pricing`). |
| `t5-tab-group.gif` or `.mp4` | Thread tweet 5 | Drag-pill-onto-pill in motion. **Critical** to communicate the gesture. |
| `t6-multi-tab-context.png` | Thread tweet 6 | Three context-marked tabs + a chat reply with disagreements. Reuse `docs/screenshots/usecase-diff-articles.png`. |
| `t7-themes.png` | Thread tweet 7 | The 7-theme grid. Reuse `docs/screenshots/themes-grid.png`. |
| `t9-link-preview.png` | Thread tweet 9 | The launch-site hero shot. Reuse `docs/screenshots/hero.png`. |

## Banner / OG / profile

| File | Spec | Purpose |
| --- | --- | --- |
| `og-1200x630.png` | **1200 × 630**, PNG | Open Graph / X card preview when someone shares the launch site URL. Already referenced by `docs/index.html`'s `og:` meta tags — make sure the launch site references this filename if you commit it. |
| `profile-banner-1500x500.png` | **1500 × 500**, PNG | X profile header during launch week. Same hero shot, wider crop, with the tagline overlaid: "A browser that thinks with you, not at you." |
| `avatar-400x400.png` | 400 × 400 | Profile pic. Just the Sable mark on a clean background — readable at 32 × 32. |

## Capture guidance

- **Captions are mandatory** on the launch video. Tools like Descript / CapCut / Premiere all auto-caption — review for "Sable" being mis-spelled (it'll guess "Stable" or "Sabel").
- **No mouse cursor** unless the cursor is the subject (drag captures yes, static screens no).
- **Ditch the Chrome titlebar** in screenshots — capture from inside Sable's chrome, not your screenshot tool's frame.
- **Use Lavender / light** for the hero/launch-tweet visuals. Mix in Sky / dark for one or two thread tweets to hint at theme variety.

## File naming convention

`{tweet-slot}-{slug}.{ext}`. The tweet slot prefix matches the order in `thread.md`.

## Where to put these

This folder. Keep source files (Premiere projects, Figma boards, raw recordings) outside the repo — only commit the final exports.

## Don't

- Don't post 9 separate single-image tweets and call it a thread without copy. Each tweet needs its own caption.
- Don't use stock-style hero images. Real screenshots of the actual app, every time.
- Don't add watermarks. The tagline overlay on the banner is the only place text-on-image is OK.
