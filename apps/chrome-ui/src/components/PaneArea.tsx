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
import { useTabsStore, selectActiveTab } from '../state/tabs';
import { DropOverlay } from './DropOverlay';
import { Divider } from './Divider';
import { Ntp } from './Ntp';
import type { Rect, SnapshotLeaf } from '../types';

export const NEW_TAB_URL = 'sable://newtab';

export function PaneArea() {
  const leaves = useLayoutStore(useShallow((s) => s.leaves));
  const dividers = useLayoutStore(useShallow((s) => s.dividers));
  const paneOrigin = useLayoutStore((s) => s.paneOrigin);
  const dragging = useDragStore((s) => s.dragging);
  const activeTab = useTabsStore(selectActiveTab);
  const tabsById = useTabsStore((s) => s.tabsById);

  // The whole pane is empty (no tabs in this space): show NTP full-bleed.
  if (leaves.length === 0) {
    return (
      <main className="relative flex-1 bg-bg">
        <Ntp />
      </main>
    );
  }

  return (
    <main className="relative flex-1 bg-bg">
      {leaves.map((leaf) => {
        const tab = tabsById.get(leaf.tabId);
        const isNewTab = tab?.url === NEW_TAB_URL;
        return (
          <PaneSlot
            key={leaf.paneId}
            leaf={leaf}
            origin={paneOrigin}
            dragActive={!!dragging}
            isNewTab={isNewTab}
          />
        );
      })}
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
  isNewTab,
}: {
  leaf: SnapshotLeaf;
  origin: { x: number; y: number };
  dragActive: boolean;
  isNewTab: boolean;
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
      className={dragActive ? 'ring-1 ring-line-strong rounded-lg' : ''}
    >
      {/* When the leaf is a new-tab pseudo-tab, render the NTP into the
          slot. The matching WebContentsView is left unmounted by main, so
          the chrome's NTP fully owns this rect. */}
      {isNewTab && !dragActive && <Ntp />}
      {dragActive && <DropOverlay paneId={leaf.paneId} />}
    </div>
  );
}

// re-export for any other modules that need them
export type { Rect, SnapshotLeaf };
