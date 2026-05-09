# Reddit launch strategy

Reddit can drive a lot of traffic if the post fits the sub. It will mercilessly downvote anything that smells like marketing. Each post in this folder is hand-tuned to its sub.

## What's here

| File | Subreddit | Audience hook |
| --- | --- | --- |
| [`r-sideproject.md`](r-sideproject.md) | r/SideProject | Build story · founder energy · "look what I made" |
| [`r-opensource.md`](r-opensource.md) | r/opensource | MIT licence · architecture · how to contribute |
| [`r-localllama.md`](r-localllama.md) | r/LocalLLaMA | **Highest-priority sub.** Embedded Qwen 3, no-API-cost angle, runs offline |
| [`r-programming.md`](r-programming.md) | r/programming | Technical depth · BSP layout engine · interesting design choices |
| [`r-selfhosted.md`](r-selfhosted.md) | r/selfhosted | Privacy · keys in OS keychain · no telemetry · runs offline |
| [`comment-templates.md`](comment-templates.md) | All | Pre-written replies to common questions (security, vs Arc/Dia, why Electron, etc.) |

## Order and timing

1. **r/SideProject first** — most forgiving, builds early karma + comment count
2. **r/opensource ~3 hours later** — once the SideProject post has settled, cross-link it
3. **r/LocalLLaMA mid-day** — peak audience activity for ML communities (US afternoon)
4. **r/programming evening** — programming sub peaks around 4-6 PM PT
5. **r/selfhosted next morning** — drip into a different audience the next day

**Never post the same post to multiple subs.** Reddit detects this and shadow-removes you. Each file in this folder is genuinely different in voice, framing, and what it leads with.

## Sub-specific rules to follow

| Sub | Rule |
| --- | --- |
| r/SideProject | OK to self-promote. Mention you're the maker. |
| r/opensource | Must be open-source (we are, MIT). Don't post a paid product. |
| r/LocalLLaMA | Must mention specific local-model details (which model, quantisation, tok/s). They smell vagueness. |
| r/programming | Self-promotion is risky — frame it as "I built this and here's the architecture write-up". Skip if you don't have a real technical write-up. |
| r/selfhosted | Privacy-first framing is mandatory. Mention what data leaves the machine and what doesn't. |

## What gets you removed

- **Editorialised titles** ("amazing new browser") — be flat and factual.
- **Posting too fast** to multiple subs in a window (~24h between cross-posts is safer).
- **Linking to a payment page** — link to GitHub, the launch site, or a video.
- **Begging for upvotes / "If you like this please share"** — instant downvote brigade.

## Other subs to consider (not pre-written)

If a post in one of the above goes well, consider these next:
- **r/InternetIsBeautiful** — if you have a great visual / video. Title needs to lead with the surprise.
- **r/electronjs** — small but on-target; lead with the architecture.
- **r/typescript** — only if you have a deep TS-specific write-up (the layout engine maybe).
- **r/webdev** — lukewarm on launches; skip unless you have a tooling angle.
- **r/coolgithubprojects** — easy win for any well-documented OSS repo.
- **r/MacOS** / **r/windows** / **r/linux** — risky, very off-topic unless you have a per-OS detail to lead with.

Don't blast all of them. 2-3 well-targeted posts beat 10 lazy cross-posts.
