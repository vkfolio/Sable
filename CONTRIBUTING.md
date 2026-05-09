# Contributing to Sable

Thanks for thinking about helping. Sable is an open, ambitious project — a browser where chat and pages are one workspace — and we'd love your patches, ideas, and bug reports.

This guide is short on purpose. If anything is missing, ping us in an issue.

---

## Project tour

```
sable/
├── apps/
│   ├── shell/          Electron main + preload (Node)
│   ├── chrome-ui/      React + Tailwind chrome (renderer)
│   └── spike-day0/     One-off architecture spike kept for regression
├── packages/
│   └── layout-engine/  Pure-TS BSP layout primitives + tests
├── resources/          Icons, brand assets
└── .github/workflows/  CI matrix (win × mac × linux)
```

- **`apps/shell/src/main/`** — `WindowManager` wires every subsystem. Touch `window-manager.ts` if you're adding IPC. `tab-manager.ts`, `layout-controller.ts`, `chat-orchestrator.ts`, `history-manager.ts`, `space-manager.ts`, `local-model-manager.ts`, `settings-store.ts` are the singletons it owns.
- **`apps/chrome-ui/src/`** — React tree. `App.tsx` is the root. `state/` is Zustand stores. `components/` mirrors the visible surface. `ntp-resolver.ts` and `citation-drop.ts` are the standalone helpers.
- **`packages/layout-engine/`** — pure TS, zero runtime deps, 41 unit tests. Edit here for any drag-to-split / drag-to-group / split-resize change. Tests live in `__tests__/` and run on every PR.

---

## Local setup

```bash
git clone https://github.com/your-org/sable.git
cd sable
pnpm install
pnpm shell                 # builds chrome-ui then launches Electron
```

**Other useful scripts:**

```bash
pnpm typecheck             # all workspaces
pnpm test                  # layout-engine: 41 tests
pnpm chrome-ui:dev         # iterate on chrome-ui with HMR
pnpm spike                 # rerun the Phase 0 cross-WebContentsView drag spike
SABLE_DEV=1 pnpm shell     # auto-open chrome DevTools
SABLE_RESET=1 pnpm shell   # wipe chrome localStorage (re-trigger onboarding)
```

**Prerequisites:**

- Node 22.14+ (`.nvmrc` provided)
- pnpm 9.15+
- macOS hardware required for native macOS builds (CI handles Linux)
- `keytar` ships pre-built binaries via `prebuild-install`; no native compiler needed in normal cases
- `node-llama-cpp` ships prebuilds for Vulkan / CUDA / Metal / CPU; auto-selects backend at runtime

---

## PR process

1. **Branch off `main`**, make focused commits. Small PRs land faster.
2. **Run `pnpm typecheck` and `pnpm test`** locally — both must pass.
3. **CI runs the matrix** (Windows × macOS × Linux × {typecheck, tests, build}). All squares must be green.
4. **Layout-engine changes need tests** — `packages/layout-engine/src/__tests__/` is the pattern. New ops add their own file.
5. **Drift is fine.** If the README/CLAUDE.md doesn't reflect current behaviour, fix that as part of the PR or flag it in the description.
6. **One PR ≠ one feature.** A "land an idea" change is welcome to be a stack of small PRs.
7. **Squash-and-merge** is the default.

---

## Areas we'd love help on

Tagged `good-first-issue` on GitHub Issues. A few entry points off the top:

- **Intent resolver rule packs** (`apps/chrome-ui/src/ntp-resolver.ts`) — add more site shortcuts (`gmaps`, `gist`, `mdn`) and intent categories (sports, finance, travel deals).
- **Favicon caching** — current implementation uses Google's favicon proxy on every render; a small in-memory + IndexedDB cache would be a clean first PR.
- **History clear UI in Settings** — the IPC (`window.sable.history.clear`) exists; a confirm dialog and a "Clear browsing data" button in `SettingsDialog.tsx` is missing.
- **`sable://newtab` as a real custom protocol** — currently a string the layout-controller checks for; promoting it to an actual `protocol.handle` in main would make navigation history cleaner.
- **Drag-to-rearrange grouped tabs** — the strip pill drag-onto-pill currently merges; reordering within a group is a follow-up.
- **Per-pane URL-bar drop targets** — drag a tab pill onto another pane's mini URL bar = swap that pane to the dragged tab.
- **Light/dark auto-follow OS** — currently a manual toggle.
- **Tab grouping persistence across restarts** — `groupId`s are persisted on `TabState` but the spaces store doesn't yet round-trip them across launches.

---

## Code style

- **TypeScript strict** — no implicit `any`, no `// @ts-ignore` without an explanatory comment.
- **2-space indent**, single quotes.
- **Composition over abstraction.** Three similar lines beat a premature helper.
- **Don't add error handling for cases that can't happen** at internal boundaries. Validate at user input + external APIs only.
- **Comments explain *why***, not *what*. Skip them unless the why is non-obvious.
- **Tests live next to the code** in `__tests__/` for layout-engine; UI tests are aspirational for now.
- **No emoji in source files** unless explicitly part of a visible string.

---

## Reporting bugs

Open an issue with:

1. What you expected vs what you saw.
2. Reproduction steps.
3. OS + Sable commit hash (`git rev-parse HEAD`).
4. DevTools console output if applicable (F12 inside the chrome).

For security issues, see [`SECURITY.md`](SECURITY.md) — please don't open a public issue.

---

## Code of conduct

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Be kind, assume good intent, leave the project better than you found it.

— *The Sable maintainers*
