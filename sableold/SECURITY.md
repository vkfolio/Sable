# Security policy

Sable is a desktop browser. We take security seriously, but we also want to be honest about the trust model — see [Threat model](#threat-model) below before relying on Sable for hostile workloads.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security bugs.**

Email **security@sable.dev** (replace with the real address before launch) with:

1. A description of the vulnerability and the impact you believe it has.
2. A minimal reproduction (URLs, files, exact steps).
3. Affected version (`git rev-parse HEAD` of the build you tested, or release tag).
4. Your preferred credit / disclosure handle.

We aim to:

- **Acknowledge within 3 business days.**
- **Triage and respond with a plan within 14 days.**
- **Ship a fix or mitigation within 90 days** for confirmed high-severity issues, sooner for actively-exploited ones.

If you don't hear back in 3 business days, please ping again — emails get lost.

We're happy to credit reporters in release notes (or keep the report anonymous, whichever you prefer). Sable does not currently run a paid bug-bounty program, but a coordinated, well-written report will earn our gratitude and a permanent place in the changelog.

## Scope

In scope:

- The Sable desktop app (Electron main process, preload, renderer chrome).
- IPC surfaces exposed via `window.sable.*`.
- Local model loading (`local-model-manager`, `node-llama-cpp` integration).
- Provider key storage (`keytar` / OS keychain) and the way keys leave the machine.
- The HistoryManager + SettingsStore on-disk formats.
- The chat orchestrator's prompt-injection handling for tab content.
- The intent resolver's LLM fallback and the data it sends to providers.

Out of scope:

- Vulnerabilities in upstream Electron / Chromium / Node — please report those to the upstream project. We track and update; see [Threat model](#threat-model).
- Vulnerabilities in third-party AI providers (Anthropic, OpenAI) — report to them.
- Self-XSS from a user pasting attacker-controlled content into the chat composer they own.
- Issues that require physical access to an unlocked machine where Sable is running.
- Social-engineering reports without a technical payload.

## Threat model

We want users to know what Sable is and isn't designed to defend against:

- **Sable inherits Electron's security posture** — and Electron typically lags a few weeks-to-months behind upstream Chromium on security patches. We update Electron promptly on each release; we do not currently auto-update on a daily cadence. **If you're targeted by a sophisticated browser-exploit adversary, use a mainstream browser with rapid auto-update.**
- **Web content runs with `contextIsolation: true` and `nodeIntegration: false`** — pages cannot reach Node APIs. Tab `WebContentsView`s are isolated from the chrome renderer.
- **The chrome renderer is trusted** — it's the React UI we ship; there is no user-controlled HTML in it. The preload exposes a narrow `window.sable.*` API surface.
- **Provider API keys live in the OS keychain via `keytar`** — they are never written to disk in plaintext and never sent to anyone but the provider you configured.
- **Local model inference is fully on-device** — embedded Qwen 3 runs via `node-llama-cpp`; nothing leaves your machine. The hybrid intent resolver only calls a provider when no static rule matches; static rules are evaluated locally.
- **History is local-only**, in `userData/history.json`. Clear it from the History IPC at any time. We do not sync, telemetry, or upload history.
- **Sable is not a hardened browser for hostile sites.** Don't use it as your daily driver for banking, password reset flows, or webmail until we ship a hardened build with code signing, auto-update, and crash reporting.

## Disclosure timeline

For confirmed vulnerabilities, our default is **coordinated disclosure**:

1. We work with the reporter on a fix and a CVE if applicable.
2. We ship the fix in a tagged release.
3. We publish a security advisory on the GitHub repo, crediting the reporter, ~7 days after the fixed release.

If a vulnerability is being actively exploited, we may shorten this timeline. If a reporter asks for longer embargo for legitimate reasons (e.g. dependency coordination), we'll honor it within reason.

## Hall of fame

*(Empty for now — be the first.)*

— *The Sable maintainers*
