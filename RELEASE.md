# Releasing Sable

Cross-platform builds (Win × Mac × Linux) handled by GitHub Actions on tag push, with a local-build escape hatch for each platform.

## TL;DR — cut a release

```bash
# 1. Bump version in apps/shell/package.json (the version field, currently 0.0.0)
#    e.g. "0.1.0-alpha"
#    Update package.json at the repo root if you want it to match too (optional).

# 2. Commit
git add apps/shell/package.json package.json
git commit -m "chore: bump to v0.1.0-alpha"

# 3. Tag and push
git tag v0.1.0-alpha
git push origin main --tags
```

GitHub Actions picks up the tag, runs the matrix build, and uploads everything as a **draft release** named `v0.1.0-alpha`. Open the draft in *Releases*, write the notes, click **Publish**.

## What gets built

| Platform | Artifact | Notes |
| --- | --- | --- |
| **Windows** | `Sable-X.Y.Z-x64-win.exe` (NSIS installer, one-click) | Unsigned. SmartScreen will prompt — click *More info → Run anyway*. |
| **Windows** | `Sable-X.Y.Z-portable.exe` | Standalone, no install. |
| **macOS** | `Sable-X.Y.Z-x64-mac.dmg` + `Sable-X.Y.Z-arm64-mac.dmg` | Unsigned, unnotarised. First-run users right-click → *Open* once. |
| **macOS** | `Sable-X.Y.Z-x64-mac.zip` + `Sable-X.Y.Z-arm64-mac.zip` | For users who don't want a DMG mount. |
| **Linux** | `Sable-X.Y.Z-x64.AppImage` | Universal Linux binary. `chmod +x` then run. |
| **Linux** | `Sable-X.Y.Z-x64-linux.deb` | Debian / Ubuntu / Pop!_OS. |

Each ships:
- The chrome-ui React renderer (`/resources/chrome-ui/`)
- Rebuilt native modules (`keytar`, `node-llama-cpp`) for Electron's ABI on that platform
- The `node-llama-cpp` prebuilds for the platform (Vulkan / CUDA / Metal / CPU auto-selected)
- Sable's icon, version metadata, copyright

The Qwen 3 weights are **not** bundled — they download from Hugging Face on first launch (~1.1 GB for the default 1.7B variant).

## What's signed / notarised

| Platform | V1.0 alpha | Tier 1 roadmap |
| --- | --- | --- |
| Windows | Unsigned. SmartScreen warns. | EV cert via DigiCert / SSL.com (~$300/yr) |
| macOS | Unsigned. Gatekeeper warns. | Apple Developer ID + notarisation ($99/yr) |
| Linux | N/A — Linux doesn't gate on signatures | N/A |

For now we document the workaround in launch posts. When we add signing, drop the certs as GitHub secrets:
- Windows: `CSC_LINK` (base64'd `.pfx`) + `CSC_KEY_PASSWORD`
- macOS: `CSC_LINK` (base64'd `.p12`) + `CSC_KEY_PASSWORD` + `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID`

The workflow is already shaped for this — just delete the `CSC_IDENTITY_AUTO_DISCOVERY: false` line in `.github/workflows/release.yml` once certs are in place.

## Local builds (no CI)

You can package each platform locally if you have the right OS:

```bash
# All from repo root:
pnpm package:win        # Windows only — runs on Windows, macOS, Linux
pnpm package:mac        # macOS only — must run on macOS hardware
pnpm package:linux      # Linux only — runs on Linux (or Windows via WSL2)
pnpm package:all        # All three — only useful if you're on macOS with Wine + cross-compile setup
```

Output goes to `apps/shell/out/`.

**Cross-compilation caveats:**
- **macOS DMG can only be built on macOS.** electron-builder hard-fails on other OSes.
- **Windows NSIS** can be built on Linux/macOS via Wine, but signing won't work cross-platform — best to build on Windows.
- **Linux AppImage / deb** can be built on any platform.

## How the workflow runs

`.github/workflows/release.yml`:

1. Triggers on `push` of a tag matching `v*`, OR manually via *workflow_dispatch* (the GitHub Actions UI).
2. Matrix: `windows-latest`, `macos-14` (Apple Silicon), `ubuntu-latest`.
3. Each runner:
   - Checks out the repo
   - Installs pnpm 9.15 + Node 22.14
   - On Linux, also installs `libarchive-tools`, `rpm`, `fakeroot`, `dpkg` for the .deb / AppImage builders
   - Runs `pnpm install --frozen-lockfile`
   - Builds chrome-ui (`pnpm chrome-ui:build`)
   - Runs typecheck + tests as a release gate
   - Runs `pnpm --filter @sable/shell run publish:<platform>` if it's a tag push, else `package:<platform>`
   - Uploads everything as a workflow artifact (14-day retention)
4. On a tag push, electron-builder additionally uploads each artifact to a **draft GitHub Release** automatically (via `electron-builder --publish always`). After the matrix finishes, you'll have one draft release with all platforms attached.

## Manual / dry-run

From the GitHub Actions tab, run the workflow manually:
- Set `publish: false` to do a build without touching releases (artifacts still uploaded as workflow artifacts for 14 days).
- Set `publish: true` to also create the draft release. Useful for ad-hoc pre-release testing without pushing a tag.

## Versioning

Keep the version in `apps/shell/package.json` in sync with the git tag. electron-builder reads it from there. If they mismatch, the artifacts will say one version and the GitHub release will say another.

## When a release fails partway

If only one or two platforms fail, the others still publish to the draft release. Re-run **just the failing matrix legs** from the Actions tab — electron-builder is idempotent and will overwrite the artifacts on the same tag.

## Tagging conventions

- **Alpha releases** — `v0.1.0-alpha`, `v0.2.0-alpha`. Mark "Pre-release" in the GitHub UI.
- **Beta releases** — `v0.9.0-beta`. Same.
- **Stable** — `v1.0.0`. Don't mark pre-release.
- Pre-release tags trigger the same workflow; no special config needed.

## Pre-flight checklist

Before tagging a release, run locally:

```bash
pnpm typecheck   # all workspaces green
pnpm test        # 41/41 layout-engine tests
pnpm package:win # smoke test the local Windows build
```

And:

- [ ] Version bumped in `apps/shell/package.json`
- [ ] Recent commits committed and pushed
- [ ] `your-org` placeholders in README + launch site replaced with the real `vkfolio` org slug
- [ ] CHANGELOG entry drafted (or release notes ready to paste into the GitHub UI)
- [ ] No secrets / API keys / personal data in any test fixtures
