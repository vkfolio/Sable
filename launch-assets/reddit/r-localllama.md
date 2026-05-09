# r/LocalLLaMA

This is the **highest-priority sub** for Sable. The "free out of the box, runs on-device" angle is exactly what this audience wants. They're also brutal about vague claims — be specific.

## Title

```
Sable: a desktop browser with Qwen 3 baked in. Free, MIT, BYOK optional. Works offline.
```

(95 chars — punchy, technical, lead with the model.)

## Title alternates

- `Built a browser around node-llama-cpp + Qwen 3 — drag a passage into chat, get an inline cite. Open source.`
- `An AI-first browser where the local model is the default, not the fallback. Apache-2.0 weights, MIT app.`

## Body

```markdown
Hey r/LocalLLaMA — built something I think this sub will care about.

**Sable** is an open-source desktop browser (Windows / macOS / Linux) where the chat sidebar uses what you're actually browsing. It ships with a fast local model out of the box — **no API key, no subscription, no per-message bill**.

**Why I'm posting here specifically**

Most "AI browsers" are BYOK-only or charge you a sub for the privilege of routing to OpenAI. I wanted the opposite: the local model is the **default**, not the fallback. Frontier providers are optional, and when you do use them you pay them directly — Sable doesn't take a cut and never will.

**The local model details**

- Bundled: **Qwen 3** in three sizes — 0.6B / 1.7B / 4B-Instruct-2507
- Format: **GGUF**, downloaded on demand from HF
- Runtime: [`node-llama-cpp`](https://github.com/withcatai/node-llama-cpp)
- Backends auto-selected: **Vulkan / CUDA on Win/Linux, Metal on Mac, CPU fallback**
- Default size at onboarding: **1.7B** (~1.1 GB, 25-40 tok/s on a CPU baseline laptop, much higher with GPU)
- Why Qwen 3 over Gemma 3 / Llama 3.2: **Apache 2.0**. No MAU clause, no remote-revocation, no attribution requirement. The cleanest licence for shipping a default model in a consumer app. MMLU 65.6 (1.7B) / 84.2 (4B), 256K native context, single chat template across sizes.
- `<think>` tokens are filtered client-side so the bubble shows only the answer.

**What you can do with it**

- Drop a paragraph from any page into the chat sidebar → it cites it back as a markdown blockquote with the source URL
- Drop an image → multimodal pipeline, the model sees it
- Ctrl-click multiple tabs → they become one shared context (token-budgeted greedy-by-recency, telling you what was excluded)
- Drag tabs onto each other to group, drag to a pane edge to split — your view scales with the conversation
- The new-tab page omnibox uses the local model as a fallback intent resolver: type "flight sfo to nrt", get Google Flights with the right query

**What's BYOK-only territory**

Anthropic and OpenAI keys live in the OS keychain (`keytar`); when active, Sable streams from them. Sable adds zero markup — they bill you directly. Use them when you want frontier reasoning, stick with the local model otherwise.

**Roadmap that's relevant to this sub**

- Personal Knowledge Graph from history — embeddings indexed in **LanceDB**, encrypted-at-rest with an OS-keychain-derived key, default-deny blocklist for banking / mail / auth origins, `/recall <topic>` returns ranked passages from past visits with the LLM weaving them into the answer.
- Recordable Skills — narrate a workflow once, fire later. Local-model first.
- Agentic green-thread tabs via CDP — capability allowlist, human-in-the-loop approval.

**Caveats**

- v1.0 alpha. No auto-update yet. Build from source.
- Code signing isn't done — Windows SmartScreen will yell. Working on it.
- 0.6B is genuinely small; for real reasoning use 1.7B at minimum.
- Hybrid intent resolver still has rough edges with very vague queries.

**Repo:** https://github.com/your-org/sable
**Launch site:** https://your-org.github.io/sable
**Architecture:** see the Architecture section of the README — it's drawn out.

Happy to answer anything about the runtime integration, why I picked Qwen 3 over the alternatives, the multimodal pipeline, or the planned LanceDB integration.
```

## Things to expect in comments

- **"Why Qwen 3 over Llama 3.2 / Gemma 3 / Phi 4 / Granite?"** — Apache 2.0 vs the gotchas. See `comment-templates.md`.
- **"What's the quantisation?"** — Q4_K_M by default for the 1.7B; Q5_K_M for 4B. Configurable.
- **"Why not [favourite model]?"** — Honest answer: ship-time licensing checks. PRs welcome to add others.
- **"How does it perform on M1 Max / RTX 4090 / Steam Deck?"** — Metal / CUDA / Vulkan numbers; you can quote tok/s from your own runs.
- **"Can I swap the runtime for ollama / lm-studio / vllm?"** — Tier 2 roadmap item; design notes welcome.
- **"How big is the multimodal pipeline?"** — Currently relies on the active provider's vision capability. Local vision is on the roadmap once a small + permissive vision model lands.

## Posting checklist

- [ ] Account has clear LocalLLaMA history or it'll get filtered
- [ ] Post is **specific** about model details — no marketing fluff, this sub hates it
- [ ] Comment-reply within 15 minutes of posting; this sub gates engagement on responsiveness
- [ ] Be ready to defend Qwen 3 choice; have the licensing comparison handy
