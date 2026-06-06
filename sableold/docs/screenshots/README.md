# Screenshots

This directory holds the images referenced from the root [`README.md`](../../README.md). Drop PNGs here with the **exact filenames** below — the README's `<img src="docs/screenshots/...">` references will pick them up automatically once committed.

## Capture guidance

- **Resolution**: 1× capture at the chrome's native size, then scale down — don't capture 2× / Retina (file size balloons, GitHub doesn't care).
- **Format**: PNG. JPEG kills the chrome's pastel gradients.
- **Chrome state**: clean — no DevTools open, no half-typed text in inputs, no mouse cursor in the frame.
- **Demo data**: use realistic-looking but non-sensitive content. Avoid real email addresses, API keys, personal browser history.
- **Frame the subject**: crop tight when the screenshot is illustrating one feature; full window for the hero.
- **Theme for hero**: default Lavender (light). The themes-grid screenshot is the place to show variety.

## Manifest

| Filename | Where it appears | What to capture | Suggested width |
|---|---|---|---|
| `hero.png` | Top of README, right after the intro paragraph | Full Sable window: 2-3 split panes (one with a long-form article, one with code, one with docs), chat sidebar visible on the right with a streaming reply mid-flight. Default Lavender theme. | 1800 px → display at 900 |
| `tab-group-drag.png` | "Browse with a real shell" — feature grid | Mid-drag of a tab pill landing on another pill, with the visual indicator that says "group". Slight ghost / drop affordance visible. | 840 px → display at 420 |
| `bsp-split.png` | "Browse with a real shell" — feature grid | A 3-pane BSP layout (one large, two stacked), each pane showing its mini per-pane URL bar. | 840 px → display at 420 |
| `ntp-intent-resolver.png` | "Browse with a real shell" — feature grid | New-tab page with a query like `flights sfo to nrt` typed into the omnibox, intent suggestion chip surfaced beneath. Pinned bookmark grid visible. | 840 px → display at 420 |
| `url-history-autocomplete.png` | "Browse with a real shell" — feature grid | Global URL bar in edit state with a 5-row history dropdown, one row keyboard-highlighted. | 840 px → display at 420 |
| `chat-citation-drop.png` | "Chat that uses what you're browsing" | Sidebar showing a freshly-dropped paragraph rendered as a markdown blockquote with the source URL hyperlinked beneath. | 1560 px → display at 780 |
| `usecase-diff-articles.png` | Use case #1 — Diff three articles | Three news articles in a tri-pane split, all three pills `ctx`-badged in the strip, chat reply showing a "Where they disagree" markdown section. | 1640 px → display at 820 |
| `usecase-research-drawer.png` | Use case #5 — Research drawer | Long sidebar with 6-8 stacked blockquote citations from different sources, ending with a synthesis reply. | 1640 px → display at 820 |
| `themes-grid.png` | "Personalities — per-space themes" | A 7-cell grid (one per theme: Lavender, Mint, Coral, Amber, Rose, Sky, Sage) showing the same chrome shot recolored. Can be assembled in any image editor — doesn't need to be a single live screenshot. | 1800 px → display at 900 |
| `onboarding-splash.png` | Onboarding section | Full-screen splash mid-animation with the Sable mark. | 560 px → display at 280 |
| `onboarding-name.png` | Onboarding section | Name capture step with a typed example name. | 560 px → display at 280 |
| `onboarding-model.png` | Onboarding section | Model selection step, Qwen 3 1.7B selected. Show the download progress bar partway if you can — it sells the local-model story. | 560 px → display at 280 |

## Adding a new screenshot

1. Capture the PNG and name it descriptively (e.g. `usecase-trip-planning.png`).
2. Add the file to this directory.
3. Reference it from the relevant section of the root README:

   ```markdown
   <div align="center">
     <img src="docs/screenshots/usecase-trip-planning.png" alt="Trip planning in a single space" width="820" />
   </div>
   ```

4. Add a row to the manifest above so future contributors know what was intended.

## License

Screenshots committed here are MIT-licensed alongside the rest of the repository. Make sure you have rights to redistribute any third-party content visible in the frame.
