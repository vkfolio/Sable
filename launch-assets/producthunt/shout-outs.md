# Product Hunt — shout-outs

Pick 3–5 from the recommended list and paste each blurb into the corresponding shout-out field on PH. Edit the wording so it sounds like you, not a template.

## Recommended five

### 1. Anthropic / Claude

```
Both Sable's BYOK frontier provider and the AI I paired with while building it.
Architecture decisions, edge-case debugging, the entire chat orchestrator design
review — Claude was a thoughtful collaborator on every hard call.
```

### 2. OpenAI

```
Sable's other BYOK frontier provider. Paste a key in Settings and the chat
sidebar streams from GPT exactly as cleanly as it does from Claude or the
on-device model. Same protocol, same citations, same drag-drop interop.
```

### 3. LangChain (LangGraph.js)

```
The chat orchestration backbone. The same StateGraph powers Sable's streaming
sidebar AND the non-streaming intent resolver on the new-tab page. Probably
saved me a month of plumbing — every provider plugs into the same graph.
```

### 4. Claude Code

```
How most of Sable was actually written. Pair-programming with an LLM that can
read the whole repo changed how I think about scope — features that would have
been "next quarter" became "this evening".
```

### 5. Tailwind CSS

```
The chrome UI is Tailwind 3 end-to-end. Made the per-space theme system —
seven pastel personalities × light/dark — take an afternoon instead of a week.
The tokens map cleanly to Sable's design system.
```

---

## Alternates (swap any of the above out)

### Cursor (instead of Claude Code)

```
The dev tool I lived in while shipping Sable's first months — context-aware
edits across the layout-engine package + the chrome UI made cross-cutting
refactors painless.
```

### Linear (if you tracked work there)

```
Where the Sable roadmap actually lives. The three-tier structure in the README
(V1.0 polish · Workflow & Skills · Personal knowledge & agents) maps directly
to Linear cycles.
```

### Raycast (if you use it daily)

```
The launcher I bounced between every day while building Sable. The clipboard
history and snippet system kept the dev loop tight.
```

### Figma (if the design system started there)

```
Where Sable's design system was sketched before it became code. The pastel
palette, the typography scale, the BSP overlay zones — all started as Figma
frames.
```

---

## What to skip on PH (mention in the README instead)

These are real and load-bearing for Sable, but they don't read as PH shout-outs because they're not products in the PH sense:

- **llama.cpp / node-llama-cpp** — runtime for the local model. Credit in README's "Built on" section.
- **Qwen 3** — the bundled model. Same.
- **Electron** — too foundational, not what shout-outs are for.
- **AG-UI Protocol** — credit in the README.
- **Heroicons / Vite / Zustand / React** — same.

## Tone notes

- Each blurb is **first-person, specific, and short**. No "incredible product, love what they're doing" filler.
- Mention **what it actually did for Sable**, not what it does in general. Specificity = signal.
- If you can name the exact feature or moment, do it. ("Made the per-space theme system take an afternoon" beats "great styling tool".)
- Don't shout out a product you didn't actually use. PH founders read these and the inauthenticity is obvious.

## Final list (suggested)

If you want to pick fast:

1. Anthropic / Claude
2. OpenAI
3. LangChain
4. Claude Code
5. Tailwind CSS

Done. Paste the blurbs above, edit one or two phrases to sound like you, and move on.
