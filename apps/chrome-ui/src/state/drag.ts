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
   * Transient post-drop state. Set briefly after a successful commit so the
   * chrome can play a "drop landed" pulse animation in the matching pane,
   * even though `dragging` has already cleared. Auto-clears after 200ms.
   */
  dropping: { paneId: PaneId; edge: DropEdge } | null;

  start: (tabId: TabId) => void;
  setHovered: (h: { paneId: PaneId; edge: DropEdge } | null) => void;
  /**
   * End drag. If `commit` is true and `hovered` is set at call time, the
   * drop is dispatched to main; otherwise it cancels.
   */
  end: (commit: boolean) => void;
};

const DROP_PULSE_MS = 200;

export const useDragStore = create<DragStore>((set, get) => ({
  dragging: null,
  hovered: null,
  dropping: null,

  start: (tabId) => {
    if (get().dragging) return;
    set({ dragging: { tabId }, hovered: null });
    void window.sable.layout.dragStart();
  },

  setHovered: (h) => set({ hovered: h }),

  end: (commit) => {
    const { dragging, hovered } = get();
    if (!dragging) return;
    if (commit && hovered) {
      void window.sable.layout.drop(dragging.tabId, hovered.paneId, hovered.edge);
      // dragEnd is implicit — applyDrop -> applyLayout re-mounts views.
      // But we still tell main to leave drag mode in case applyDrop early-outs.
      void window.sable.layout.dragEnd();
      const landed = hovered;
      set({ dragging: null, hovered: null, dropping: landed });
      setTimeout(() => {
        if (get().dropping === landed) set({ dropping: null });
      }, DROP_PULSE_MS);
    } else {
      void window.sable.layout.dragEnd();
      set({ dragging: null, hovered: null });
    }
  },
}));
