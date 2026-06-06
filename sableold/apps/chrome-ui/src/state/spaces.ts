// Spaces store — mirrors SpacesSnapshot from main. Updated on bootstrap +
// every spacesChanged push event.

import { create } from 'zustand';
import type { SpaceId, SpaceSummary, SpacesSnapshot } from '../types';

type SpacesStore = {
  spaces: readonly SpaceSummary[];
  activeSpaceId: SpaceId | null;

  refresh: () => Promise<void>;
  apply: (snapshot: SpacesSnapshot) => void;
};

export const useSpacesStore = create<SpacesStore>((set) => ({
  spaces: [],
  activeSpaceId: null,

  refresh: async () => {
    const snap = await window.sable.spaces.get();
    set({
      spaces: snap.spaces,
      activeSpaceId: snap.activeSpaceId || null,
    });
  },

  apply: (snapshot) =>
    set({
      spaces: snapshot.spaces,
      activeSpaceId: snapshot.activeSpaceId || null,
    }),
}));

export const selectActiveSpace = (s: SpacesStore): SpaceSummary | undefined => {
  if (!s.activeSpaceId) return undefined;
  return s.spaces.find((x) => x.id === s.activeSpaceId);
};
