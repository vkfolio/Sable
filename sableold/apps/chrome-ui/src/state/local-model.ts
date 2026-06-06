// Local-model store — mirrors LocalModelStatus[] from main and applies
// LocalModelEvent push updates in-place so the SettingsDialog progress bar
// updates without polling.

import { create } from 'zustand';
import type { LocalModelEvent, LocalModelStatus, LocalModelVariantId } from '../types';

type LocalModelStore = {
  statuses: LocalModelStatus[];
  refresh: () => Promise<void>;
  applyEvent: (event: LocalModelEvent) => void;
};

export const useLocalModelStore = create<LocalModelStore>((set, get) => ({
  statuses: [],

  refresh: async () => {
    const list = await window.sable.localModel.list();
    set({ statuses: list });
  },

  applyEvent: (event) => {
    const cur = get().statuses;
    const updated = cur.map((s): LocalModelStatus => {
      if (s.id !== event.id) return s;
      switch (event.kind) {
        case 'progress':
          return {
            ...s,
            state: 'downloading',
            downloadedBytes: event.downloadedBytes,
            totalBytes: event.totalBytes,
          };
        case 'done':
          return { ...s, state: 'ready', downloadedBytes: undefined, totalBytes: undefined };
        case 'error':
          return { ...s, state: 'error', error: event.error };
        case 'removed':
          return { ...s, state: 'absent', downloadedBytes: undefined, totalBytes: undefined };
        default:
          return s;
      }
    });
    set({ statuses: updated });
  },
}));

export type { LocalModelEvent, LocalModelStatus, LocalModelVariantId };
