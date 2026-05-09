# Launch assets

Everything we need to ship Sable into the world. One folder per channel — copy, asset manifests, and reply templates.

## What's here

| Folder | What's in it |
| --- | --- |
| [`producthunt/`](producthunt/) | PH listing copy (title, tagline, description, topics), maker's first comment, gallery image manifest |
| [`reddit/`](reddit/) | One post per target subreddit (r/SideProject, r/opensource, r/LocalLLaMA, r/programming, r/selfhosted), plus a comment-template bank |
| [`x/`](x/) | Launch tweet, full launch thread, reply templates, banner manifest |

## Launch-day order of operations

A loose suggested order. Adjust to your timezone and energy.

1. **T-7 days** — soft prep
   - All copy reviewed and locked
   - Screenshots captured ([`docs/screenshots/`](../docs/screenshots/))
   - Hero / gallery images prepared ([`producthunt/assets/`](producthunt/assets/))
   - GitHub repo polished: pinned issues for `good-first-issue`, README hero image set, `your-org` slug replaced with the real one
   - Launch URL points to a stable build (tag a release)
   - `docs/` site live on GitHub Pages, links work
2. **T-1 day** — schedule
   - Schedule the Product Hunt listing for **12:01 AM PT** (gives you the full PT day)
   - Pre-write Reddit posts in the editor; do **not** post yet
   - Pre-draft the X thread in a scheduler or Notion
3. **Launch day, ~6 AM PT** — go
   - Confirm Product Hunt listing is live, paste the maker's first comment
   - Post the launch tweet + thread on X
   - Post to **r/SideProject** first (lowest stakes, friendliest crowd)
   - Reply to early PH comments quickly; this drives ranking
4. **Launch day, ~10 AM PT** — second wave
   - Post to **r/opensource**
   - Post to **r/LocalLLaMA** (highest-signal audience for the no-API-cost angle)
5. **Launch day, ~2 PM PT** — third wave
   - Post to **r/programming** (technical depth post)
   - Post to **r/selfhosted** (privacy / local angle)
   - Quote-retweet anyone interesting on X
6. **Launch day, evening**
   - Reply to every comment on PH and Reddit
   - Drop a "thanks for the support" tweet at 8 PM PT
7. **T+1 day** — debrief
   - Skim feedback, file issues for legitimate bugs
   - Open Tier 2 / Tier 3 roadmap items as GitHub issues for contributors

## Honesty rules

- **It's a v1.0 alpha.** Don't oversell. Say "alpha" / "early" / "rough edges expected" in every post.
- **Don't fake metrics.** No "thousands of users". No fake testimonials.
- **Disclose the model behaviour.** The on-device model is fast but not GPT-5; say so.
- **The pricing pitch is the truth.** Sable doesn't charge anyone — full stop. BYOK keys go directly to the provider. Repeat this honestly.
- **Credit dependencies.** llama.cpp, Qwen, LangChain, Electron — all called out in the README's "Built on" section. Mention them when relevant.

## Brand voice cheatsheet

- **Tagline:** *A browser that thinks with you, not at you.*
- **One-liner:** An open-source desktop browser where chat and pages share one workspace.
- **Differentiator (when you only get one bullet):** Free out of the box — a fast AI model is built in.
- **Tone:** Calm, specific, slightly nerdy, no hype. Show, don't shout.
- **Words to use:** workspace, citation, splits, groups, on-device, frontier, BYOK, recordable.
- **Words to avoid:** revolutionary, game-changing, AI-powered (it's "AI-first" or just "AI"), unleash, supercharge.
- **Emoji policy:** Sparing. ✨ never. 🪟 / 🧩 / ⚡ acceptable for highlight bullets only.

## Final checks before posting

- [ ] Repo URL is the real one (no `your-org` placeholder)
- [ ] Release is tagged and the install link works
- [ ] Screenshots are captured and committed to the repo
- [ ] Launch site is live at the GitHub Pages URL
- [ ] CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, LICENSE are all in place
- [ ] At least 3 issues tagged `good-first-issue` waiting for contributors
- [ ] You have a quiet 4 hours blocked off for replies
