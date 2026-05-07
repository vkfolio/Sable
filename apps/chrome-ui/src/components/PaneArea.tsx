// Pane area — right side of the chrome where tab WebContentsViews are
// positioned by main. Renders a transparent "pane" element per leaf in the
// layout snapshot, anchored to the same window-coordinate rect main uses.
// During drag-to-split, each pane shows its 5-zone drop overlay.
//
// Coordinate space: rects in the snapshot are in WINDOW coords. This
// component is itself positioned at `paneOrigin` within the window
// (sidebar + titlebar offset). To render absolutely-positioned panes inside
// it, we subtract paneOrigin from each rect.

import { useShallow } from 'zustand/react/shallow';
import { useLayoutStore } from '../state/layout';
import { useDragStore } from '../state/drag';
import { DropOverlay } from './DropOverlay';
import { Divider } from './Divider';
import type { Rect, SnapshotLeaf } from '../types';

export function PaneArea() {
  const leaves = useLayoutStore(useShallow((s) => s.leaves));
  const dividers = useLayoutStore(useShallow((s) => s.dividers));
  const paneOrigin = useLayoutStore((s) => s.paneOrigin);
  const dragging = useDragStore((s) => s.dragging);

  if (leaves.length === 0) {
    return <main className="flex-1 bg-bg" />;
  }

  return (
    <main className="relative flex-1 bg-bg">
      {leaves.map((leaf) => (
        <PaneSlot
          key={leaf.paneId}
          leaf={leaf}
          origin={paneOrigin}
          dragActive={!!dragging}
        />
      ))}
      {dividers.map((divider) => (
        <Divider key={divider.splitId} divider={divider} origin={paneOrigin} />
      ))}
    </main>
  );
}

function PaneSlot({
  leaf,
  origin,
  dragActive,
}: {
  leaf: SnapshotLeaf;
  origin: { x: number; y: number };
  dragActive: boolean;
}) {
  const localStyle: React.CSSProperties = {
    position: 'absolute',
    left: leaf.rect.x - origin.x,
    top: leaf.rect.y - origin.y,
    width: leaf.rect.width,
    height: leaf.rect.height,
  };

  return (
    <div
      style={localStyle}
      data-pane-id={leaf.paneId}
      className={dragActive ? 'ring-1 ring-border-strong rounded-lg' : ''}
    >
      {dragActive && <DropOverlay paneId={leaf.paneId} />}
    </div>
  );
}

// re-export for any other modules that need them
export type { Rect, SnapshotLeaf };
