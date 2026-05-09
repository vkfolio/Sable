# X — reply templates

Edit each one before sending. Verbatim repetition gets dampened by X's spam classifier.

---

## "How is this different from Arc / Dia?"

```
Three honest differences:

1) MIT-licensed, no account, no signup
2) A local model is the *default* (Qwen 3, runs offline). BYOK Anthropic/OpenAI is opt-in
3) Cross-platform from day one — Linux included

Arc + Dia are excellent and have years of polish on us. We're early.
```

---

## "Why Electron? It's bloated."

```
Real Chromium, real webContents.startDrag, DevTools that work everywhere.

Tauri's WebView-per-platform meant inconsistent rendering and no equivalent drag API.

It's ~150 MB on disk. Honest trade. Layout engine is pure TS so a Tauri/Wry fork could port directly when their drag story matures.
```

---

## "What about extensions?"

```
Not in V1.x — Electron doesn't support MV3, MV2 is sunsetting.

The medium-term plan is Recordable Skills (Tier 2 roadmap):
narrate "scrape these tabs into a markdown table" once → fire later with one click.

Different shape from extensions, covers a lot of what people actually want.
```

---

## "Wait, the AI is actually free?"

```
Yes — Sable bundles a small model that runs entirely on your machine. No API key, no subscription, no per-message bill.

For frontier-quality answers you can paste your Anthropic / OpenAI key; you'll pay them directly. Sable adds zero markup, takes zero cut.

We never bill you.
```

---

## "How big is the local model?"

```
Three sizes — pick at onboarding:

· 0.6B (~400 MB) — older laptops
· 1.7B (~1.1 GB) — default, 8 GB RAM, no GPU
· 4B (~2.5 GB) — 16 GB RAM, higher quality

GPU-accelerated automatically (Vulkan / CUDA / Metal). One-time download, then offline.
```

---

## "Does it phone home?"

```
No telemetry. No analytics. No account.

Outbound only when:
· You actively chat with Anthropic / OpenAI (you've added a key)
· The favicon proxy fetches a tab icon (good-first-issue to swap for a local cache)

History stays local. Settings stay local. Keys live in your OS keychain.
```

---

## "Why Qwen 3 specifically?"

```
Apache 2.0. No MAU clause, no attribution requirement, no remote revocation.

Llama 3.2 has the MAU + attribution thing. Gemma has the prohibited-use policy + revocation language. Phi 4 is fine but Qwen 3's chat template is cleaner across sizes.

Cleanest licensing for shipping a default model.
```

---

## "Is this a startup? VC-backed?"

```
No. It's an MIT side project I've been shipping in evenings + weekends. No funding, no plan to take any.

Sable will never charge users. If we ever change that we'd fork under a new name.

Donations later via GitHub Sponsors. That's the whole monetisation story.
```

---

## "Mobile?"

```
Explicit non-goal for V1.x — desktop-first product.

Pretty different design surface. Maybe later, maybe never.
```

---

## "Will you accept contributions?"

```
Please.

The layout engine is a pure-TS package with 41 unit tests — easiest entry point. Several `good-first-issue` items waiting (favicon caching, intent-resolver rule packs, settings clear-data UI, drag-rearrange grouped tabs).

CONTRIBUTING.md has the full tour.
```

---

## "Roadmap?"

```
Three tiers:

T1 (in flight) — code signing, auto-update, drag-rearrange, OS theme follow
T2 (next) — Recordable Skills, /recall over chat history, tab macros
T3 (exploration) — personal knowledge graph from history, agentic green-thread tabs

Tier 2 + 3 are where contributors most help.
```

---

## "I tried it and [bug]"

```
Thank you — would you mind opening an issue with:
· What you expected vs saw
· Repro steps
· OS + commit hash (`git rev-parse HEAD`)

I read every issue. The faster I can repro, the faster it's fixed.
```

---

## "I love this!" / generic positive

```
Thanks, that means a lot.

If you end up using it: did the citation-drop and tab-group gestures click immediately, or did they need explanation? That's the answer that most shapes what to polish next.
```

---

## "Any plans for Linux?"

```
Linux ships from day one — Win/Mac/Linux all in V1.0-alpha.

CI builds all three on every PR.
```

---

## "How do I install on Mac without code-sign warnings?"

```
Code signing is a Tier 1 roadmap item — alpha builds aren't notarised yet.

For now: build from source (`pnpm install && pnpm shell`).

Signed/notarised builds land with the next minor.
```

---

## "Can I run this with [my custom local LLM stack]?"

```
Today: bundled is Qwen 3 via node-llama-cpp. Swappable runtime (ollama / lm-studio / vllm) is a Tier 2 roadmap item.

If you'd want to take a swing at it, open an issue and we can sketch the interface together — it's a clean abstraction at the chat-models/ layer.
```

---

## "Privacy / threat model?"

```
SECURITY.md has the full threat model. Short version:

· No telemetry, no account
· History local
· Keys in OS keychain
· Inherits Electron's security posture (lags upstream Chromium by ~weeks — not for hostile sites)

Audit-friendly: single repo, no minified vendored deps.
```

---

## When to NOT reply

- Pure trolling or bad-faith ("this is just a chatgpt wrapper") — mute, don't engage.
- Three-word negatives ("electron lol", "yikes") — ignore.
- Threats / harassment — block, screenshot for record.

The reply you don't send is sometimes the best one.
