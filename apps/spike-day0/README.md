# Phase 0 Spike — cross-WebContentsView custom MIME drag

## Why this exists

The Sable architecture uses a **custom MIME type** (`application/x-sable-quote+json; v=1`) carried by the OS drag system to move a quote payload from a tab `WebContentsView` into the chat sidebar `WebContentsView`. If Electron + the host OS strip this MIME during cross-`WebContentsView` drag, drag protocol (2) Page→Sidebar must be re-routed through a `DragBroker` (ephemeral token in `text/plain` + lookup table in main process).

This spike is a 100-line check that decides which path the architecture takes. **Run it before any other code is written.**

## How to run

From the workspace root (`D:\osp\sable`):

```pwsh
pnpm install
pnpm spike
```

A 1280×800 window opens with two side-by-side WebContentsViews:

- **Left (Source)**: a draggable card and a drop zone (for reverse-direction test)
- **Right (Target)**: a drop zone, a verdict banner, and a draggable card (for reverse-direction test)

## What to do

1. Drag the **card on the left** into the **drop zone on the right**.
2. Read the verdict banner on the right pane.
3. Then drag the **card on the right** into the **drop zone on the left**.
4. Watch the terminal — every dragstart and drop logs all received MIME types and a few hundred chars of each value.

Look for lines like:
- `SPIKE_RESULT=PASS` — custom MIME survived. Architecture path is green.
- `SPIKE_RESULT=FAIL_NO_CUSTOM_MIME` — fall back to `DragBroker`.
- `SPIKE_RESULT=PARTIAL` — present but malformed; investigate.

## Interpretation

| Verdict | Meaning | Action |
|---|---|---|
| PASS in both directions | Custom MIME survives Electron's cross-WebContentsView OS drag on this OS. Drag protocol (2) uses real custom MIME via `dataTransfer.setData()`. | Proceed to Phase 1 (shell skeleton). |
| FAIL or PARTIAL in either direction | OS drag strips custom MIME types. Need `DragBroker` fallback: source-side preload puts an ephemeral token in `text/plain`; main-process broker holds the real payload by token; sidebar-side preload reads the token on drop and asks main for the payload via IPC. | Update `apps/shell/src/main/drag-broker.ts` design to be the *primary* path, not the fallback. Adds 2-3 days of work; doesn't block. |

The spike must be run on **every target OS** because OS drag behavior is platform-specific. User has Mac access → run on macOS too before declaring PASS.

## What this is **not** testing

- `webContents.startDrag` for chat→page file drops (drag protocol 3). That's a separate spike, deferred to Phase 3.
- Drag from a `WebContentsView` into an external app (e.g., Slack desktop). Known to strip custom MIME at the OS boundary — won't work, accept it.
- Frameless chrome behavior. Default frame is fine for this spike.
