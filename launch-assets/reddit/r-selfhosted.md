# r/selfhosted

This audience cares about: **what data leaves my machine?** Lead with that. Don't bury the answer.

## Title

```
Sable: an AI browser where the AI runs on your machine. No telemetry, no cloud sync, MIT.
```

## Title alternates

- `Browser with a built-in offline LLM. History stays local. API keys in OS keychain. Self-hosted-friendly.`
- `Built an AI browser that doesn't phone home. Local model default, BYOK direct-to-provider, MIT.`

## Body

```markdown
Hey r/selfhosted — built something with this sub's data-sovereignty values in mind from day one.

**Sable** is an open-source desktop browser (Win / macOS / Linux). Released the v1.0 alpha today. Posting here because the privacy posture is the part I'm most proud of and it deserves a sub that'll actually scrutinise it.

**What stays on your machine**

- **Browsing history** — `userData/history.json`, indexed in memory for the URL-bar / new-tab autocomplete. Never uploaded. Clearable any time via the `history.clear()` IPC. (UI in Settings is on the issue list — `good-first-issue`.)
- **The default AI model** — Qwen 3 (Apache 2.0), runs locally via [`node-llama-cpp`](https://github.com/withcatai/node-llama-cpp). One-time ~1.1 GB download from HF. After that, **zero network calls** for chat.
- **Settings + space data** — JSON in `userData/`. Nothing synced.
- **API keys** (when you bring them) — stored in your OS's keychain via `keytar` (Windows Credential Manager / macOS Keychain / libsecret on Linux). Raw keys never cross the chrome IPC boundary; only `hasKey: boolean` does.

**What does leave your machine, and only when you opt in**

- Outbound to **Anthropic** if you've configured an Anthropic key and they're the active provider — your prompts go to them, you're billed by them, on your account
- Outbound to **OpenAI** under the same condition
- Outbound to **Google's favicon proxy** for tab icons (a `good-first-issue` item to swap for a local cache)
- A standard Chromium DNS / safe-browsing posture inherited from Electron — what you'd expect from any browser

**What never happens**

- **No telemetry.** No analytics SDK, no error reporting, no "anonymous usage stats". Zero outbound calls beyond what your active provider needs.
- **No account.** There is no Sable account. No login, no email signup, no cloud anything.
- **No cloud sync.** Spaces, history, bookmarks, settings — all local. (We may add **encrypted, opt-in** sync later if there's demand. It would not be the default, ever.)
- **No ads.** Never going to be one.

**Pricing model in plain English**

Sable itself is MIT and **free forever**. The built-in model is free. If you BYOK to Anthropic / OpenAI you pay them on your own account at their listed rates — Sable adds zero markup, takes zero cut, sees none of the money. We will never charge for the app, and we will never wedge a paid tier between you and the providers. If we ever change that we'd fork the project under a new name.

**What's coming that you might care about**

- **Personal Knowledge Graph** from your own browsing — embeddings indexed in [LanceDB](https://lancedb.com), encrypted-at-rest with a key derived from your OS keychain, **default-deny blocklist** for banking / mail / auth-flagged origins (you opt in per origin). `/recall <topic>` returns ranked passages from your past visits with the LLM weaving them into the answer. Fully local.
- **Encrypted local chat-history persistence** — same key derivation pattern.
- **OS auto-follow for light/dark theme.**

**Caveats to be honest about**

- v1.0 alpha. No auto-update. Build from source.
- Sable inherits Electron's security posture, which lags upstream Chromium by ~weeks. Not for hostile sites. See [SECURITY.md](https://github.com/your-org/sable/blob/main/SECURITY.md).
- The favicon proxy point above is a real outbound — flagged as `good-first-issue` to fix.

**Repo:** https://github.com/your-org/sable
**SECURITY.md:** https://github.com/your-org/sable/blob/main/SECURITY.md
**Privacy posture (in the README):** linked from the launch site

Open to scrutiny on any of this — the threat model is in SECURITY.md and I'm happy to debate it.
```

## Things to expect in comments

- **"What about WebRTC leaks?"** — Inherited from Electron's Chromium. Disable in Settings is on the roadmap.
- **"Can I block the favicon proxy?"** — Today: edit `chrome-ui/src/components/UrlBar.tsx`. Soon: a setting.
- **"How do I audit there's no telemetry?"** — Grep the repo for `fetch(`, `https://`, etc. The build is fully reproducible from source.
- **"Will you take Bitcoin / Lightning donations?"** — GitHub Sponsors first. Open to other options later.
- **"Can I sync between machines myself?"** — Today: copy `userData/` between machines. Future: opt-in encrypted sync to a self-hosted endpoint.
- **"Does the local model talk to HF?"** — On first download only. After that, zero network.

## Posting checklist

- [ ] Title says "no telemetry" or "stays on your machine" explicitly — this audience scans for it
- [ ] Body is structured "what stays / what leaves only on opt-in / what never happens"
- [ ] SECURITY.md is committed and linked
- [ ] Be ready to defend Electron's security posture — don't dodge it, address it head-on
