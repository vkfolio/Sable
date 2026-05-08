// Custom drag-to-split state.
//
// Drag is internal to the chrome WebContents (sidebar -> pane area), so we
// don't use HTML5 drag — it has poor visual control and unreliable
// cross-WebContents behavior. Instead, pointer events drive a state machine:
//
//   idle -> (pointerdown on tab row) -> dragging
//                                 |
//   dragging -> (drop zone hover)  -> dragging w/ hovered
//   dragging -> (pointerup w/ hovered) -> drop dispatched -> idle
//   dragging -> (pointerup or escape) -> idle (cancel)
//
// While `dragging` is non-null, main is asked to hide all tab WebContentsViews
// so the chrome's drop overlays can receive pointer events.

import { create } from 'zustand';
import type { DropEdge, PaneId, TabId } from '../types';

type DragStore = {
  dragging: { tabId: TabId } | null;
  hovered: { paneId: PaneId; edge: DropEdge } | null;
  /**
   * The other tab pill the drag is currently hovering over (drag-pill-onto-
   * pill in the strip). Mutually exclusive with pane-edge `hovered`: if both
   * are set when drag ends, the pill target wins because it's the more
   * specific affordance — pill drop = group; pane edge drop = split.
   */
  hoveredPill: TabId | null;
  /**
   * Transient post-drop state. Set briefly after a successful commit so the
   * chrome can play a "drop landed" pulse animation in the matching pane,
   * even though `dragging` has already cleared. Auto-clears after 200ms.
   */
  dropping: { paneId: PaneId; edge: DropEdge } | null;

  start: (tabId: TabId) => void;
  setHovered: (h: { paneId: PaneId; edge: DropEdge } | null) => void;
  setHoveredPill: (tabId: TabId | null) => void;
  /**
   * End drag. If `commit` is true and a target is set at call time, the
   * drop is dispatched to main; otherwise it cancels.
   *
   * `target.pillId` is the pointerup-time pill id from `event.target` and
   * takes precedence over the stored `hoveredPill` (which is move-driven
   * and may have just been cleared by a brief gap-cross).
   */
  end: (commit: boolean, target?: { pillId?: string | null }) => void;
};

const DROP_PULSE_MS = 200;

export const useDragStore = create<DragStore>((set, get) => ({
  dragging: null,
  hovered: null,
  hoveredPill: null,
  dropping: null,

  start: (tabId) => {
    if (get().dragging) return;
    set({ dragging: { tabId }, hovered: null, hoveredPill: null });
    void window.sable.layout.dragStart();
  },

  setHovered: (h) => set({ hovered: h }),
  setHoveredPill: (tabId) => set({ hoveredPill: tabId }),

  end: (commit, target) => {
    const { dragging, hovered, hoveredPill } = get();
    if (!dragging) return;
    const finalPill =
      target && target.pillId !== undefined ? target.pillId : hoveredPill;
    if (commit && finalPill && finalPill !== dragging.tabId) {
      void window.sable.tabs.joinGroup(dragging.tabId, finalPill);
      void window.sable.layout.dragEnd();
      set({ dragging: null, hovered: null, hoveredPill: null });
      return;
    }
    if (commit && hovered) {
      void window.sable.layout.drop(dragging.tabId, hovered.paneId, hovered.edge);
      // dragEnd is implicit — applyDrop -> applyLayout re-mounts views.
      // But we still tell main to leave drag mode in case applyDrop early-outs.
      void window.sable.layout.dragEnd();
      const landed = hovered;
      set({ dragging: null, hovered: null, hoveredPill: null, dropping: landed });
      setTimeout(() => {
        if (get().dropping === landed) set({ dropping: null });
      }, DROP_PULSE_MS);
    } else {
      void window.sable.layout.dragEnd();
      set({ dragging: null, hovered: null, hoveredPill: null });
    }
  },
}));
