// Skills store — mirrors the SkillsManager's persisted set.

import { create } from 'zustand';
import type { Skill } from '../types';

export type { Skill };

type SkillsStore = {
  skills: Skill[];
  loaded: boolean;

  apply: (skills: Skill[]) => void;
  refresh: () => Promise<void>;
};

export const useSkillsStore = create<SkillsStore>((set) => ({
  skills: [],
  loaded: false,

  apply: (skills) => set({ skills, loaded: true }),

  refresh: async () => {
    const skills = await window.sable.skills.list();
    set({ skills, loaded: true });
  },
}));
