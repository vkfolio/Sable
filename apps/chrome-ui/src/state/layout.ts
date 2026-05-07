// Zustand store mirroring the layout snapshot from main.
//
// Updated on every layout reflow (tree change or window resize). Components
// read `leaves` to render panes, drop overlays, and (later) dividers.

import { create } from 'zustand';
import type { LayoutSnapshot, SnapshotDivider, SnapshotLeaf } from '../types';

type LayoutStore = {
  leaves: readonly SnapshotLeaf[];
  dividers: readonly SnapshotDivider[];
  paneOrigin: { x: number; y: number };

  apply: (snapshot: LayoutSnapshot) => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  leaves: [],
  dividers: [],
  paneOrigin: { x: 0, y: 0 },
  apply: (snapshot) =>
    set({
      leaves: snapshot.leaves,
      dividers: snapshot.dividers,
      paneOrigin: { x: snapshot.paneOrigin.x, y: snapshot.paneOrigin.y },
    }),
}));
