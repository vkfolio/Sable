// Chrome-level UI state — theme, chat-sidebar visibility, etc. Lightweight;
// this is the renderer's own state that doesn't round-trip through main.

import { create } from 'zustand';

const STORAGE_KEY = 'sable.chrome.v1';

export type Theme = 'light' | 'dark';

type ChromeStore = {
  theme: Theme;
  chatVisible: boolean;

  setTheme: (t: Theme) => void;
  toggleChat: () => void;
  setChatVisible: (v: boolean) => void;
};

function loadInitial(): { theme: Theme; chatVisible: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{ theme: Theme; chatVisible: boolean }>;
      return {
        theme: parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : 'light',
        chatVisible: typeof parsed.chatVisible === 'boolean' ? parsed.chatVisible : true,
      };
    }
  } catch {
    // ignore
  }
  return { theme: 'light', chatVisible: true };
}

function persist(state: { theme: Theme; chatVisible: boolean }): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const initial = loadInitial();

export const useChromeStore = create<ChromeStore>((set, get) => ({
  theme: initial.theme,
  chatVisible: initial.chatVisible,

  setTheme: (t) => {
    set({ theme: t });
    persist({ ...get() });
  },
  toggleChat: () => {
    set({ chatVisible: !get().chatVisible });
    persist({ ...get() });
  },
  setChatVisible: (v) => {
    set({ chatVisible: v });
    persist({ ...get() });
  },
}));
