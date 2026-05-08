// Chrome-level UI state — theme, chat-sidebar visibility, etc. Lightweight;
// this is the renderer's own state that doesn't round-trip through main.

import { create } from 'zustand';

const STORAGE_KEY = 'sable.chrome.v1';

export type Theme = 'light' | 'dark';

const CHAT_WIDTH_MIN = 280;
const CHAT_WIDTH_MAX = 720;
const CHAT_WIDTH_DEFAULT = 340;

type ChromeStore = {
  theme: Theme;
  chatVisible: boolean;
  /** Pixel width of the chat sidebar. Clamped to [280, 720] on set. */
  chatWidth: number;

  setTheme: (t: Theme) => void;
  toggleChat: () => void;
  setChatVisible: (v: boolean) => void;
  setChatWidth: (w: number) => void;
};

type Persisted = {
  theme?: Theme;
  chatVisible?: boolean;
  chatWidth?: number;
};

function clampWidth(w: number): number {
  if (!Number.isFinite(w)) return CHAT_WIDTH_DEFAULT;
  return Math.min(CHAT_WIDTH_MAX, Math.max(CHAT_WIDTH_MIN, Math.round(w)));
}

function loadInitial(): { theme: Theme; chatVisible: boolean; chatWidth: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      return {
        theme: parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : 'light',
        chatVisible: typeof parsed.chatVisible === 'boolean' ? parsed.chatVisible : true,
        chatWidth: clampWidth(typeof parsed.chatWidth === 'number' ? parsed.chatWidth : CHAT_WIDTH_DEFAULT),
      };
    }
  } catch {
    // ignore
  }
  return { theme: 'light', chatVisible: true, chatWidth: CHAT_WIDTH_DEFAULT };
}

function persist(state: { theme: Theme; chatVisible: boolean; chatWidth: number }): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: state.theme,
        chatVisible: state.chatVisible,
        chatWidth: state.chatWidth,
      }),
    );
  } catch {
    // ignore
  }
}

const initial = loadInitial();

export const useChromeStore = create<ChromeStore>((set, get) => ({
  theme: initial.theme,
  chatVisible: initial.chatVisible,
  chatWidth: initial.chatWidth,

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
  setChatWidth: (w) => {
    set({ chatWidth: clampWidth(w) });
    persist({ ...get() });
  },
}));
