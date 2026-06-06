// Pending chat citations — text quotes / images dragged in from web pages
// that will ride along with the next chat message. Owned at the chrome
// level so the chat sidebar's drop handlers and the composer's chip row
// can both touch the same list without prop-drilling.

import { create } from 'zustand';
import type { Citation } from '../types';

type CitationsStore = {
  citations: Citation[];
  add: (c: Citation) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCitationsStore = create<CitationsStore>((set) => ({
  citations: [],
  add: (c) => set((s) => ({ citations: [...s.citations, c] })),
  remove: (id) => set((s) => ({ citations: s.citations.filter((c) => c.id !== id) })),
  clear: () => set({ citations: [] }),
}));
