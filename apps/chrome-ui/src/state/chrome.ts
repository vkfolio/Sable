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
  /** Display name captured during onboarding — used for NTP greeting and
   *  any future "Hi, {name}" affordances. Empty string means unset. */
  userName: string;
  /** False on the very first launch — drives the onboarding modal. Flipped
   *  to true when the user finishes the onboarding flow. */
  firstLaunchSeen: boolean;

  setTheme: (t: Theme) => void;
  toggleChat: () => void;
  setChatVisible: (v: boolean) => void;
  setChatWidth: (w: number) => void;
  setUserName: (s: string) => void;
  setFirstLaunchSeen: (v: boolean) => void;
};

type Persisted = {
  theme?: Theme;
  chatVisible?: boolean;
  chatWidth?: number;
  userName?: string;
  firstLaunchSeen?: boolean;
};

function clampWidth(w: number): number {
  if (!Number.isFinite(w)) return CHAT_WIDTH_DEFAULT;
  return Math.min(CHAT_WIDTH_MAX, Math.max(CHAT_WIDTH_MIN, Math.round(w)));
}

type Initial = {
  theme: Theme;
  chatVisible: boolean;
  chatWidth: number;
  userName: string;
  firstLaunchSeen: boolean;
};

function loadInitial(): Initial {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      return {
        theme: parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : 'light',
        chatVisible: typeof parsed.chatVisible === 'boolean' ? parsed.chatVisible : true,
        chatWidth: clampWidth(typeof parsed.chatWidth === 'number' ? parsed.chatWidth : CHAT_WIDTH_DEFAULT),
        userName: typeof parsed.userName === 'string' ? parsed.userName : '',
        firstLaunchSeen: parsed.firstLaunchSeen === true,
      };
    }
  } catch {
    // ignore
  }
  return {
    theme: 'light',
    chatVisible: true,
    chatWidth: CHAT_WIDTH_DEFAULT,
    userName: '',
    firstLaunchSeen: false,
  };
}

function persist(state: Initial): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: state.theme,
        chatVisible: state.chatVisible,
        chatWidth: state.chatWidth,
        userName: state.userName,
        firstLaunchSeen: state.firstLaunchSeen,
      } satisfies Persisted),
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
  userName: initial.userName,
  firstLaunchSeen: initial.firstLaunchSeen,

  setTheme: (t) => {
    set({ theme: t });
    persist(snapshot(get()));
  },
  toggleChat: () => {
    set({ chatVisible: !get().chatVisible });
    persist(snapshot(get()));
  },
  setChatVisible: (v) => {
    set({ chatVisible: v });
    persist(snapshot(get()));
  },
  setChatWidth: (w) => {
    set({ chatWidth: clampWidth(w) });
    persist(snapshot(get()));
  },
  setUserName: (s) => {
    set({ userName: s.trim().slice(0, 60) });
    persist(snapshot(get()));
  },
  setFirstLaunchSeen: (v) => {
    set({ firstLaunchSeen: v });
    persist(snapshot(get()));
  },
}));

function snapshot(s: ChromeStore): Initial {
  return {
    theme: s.theme,
    chatVisible: s.chatVisible,
    chatWidth: s.chatWidth,
    userName: s.userName,
    firstLaunchSeen: s.firstLaunchSeen,
  };
}
