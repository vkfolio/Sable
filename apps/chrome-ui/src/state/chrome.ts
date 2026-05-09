// Chrome-level UI state — theme, chat-sidebar visibility, etc. Lightweight;
// this is the renderer's own state that doesn't round-trip through main.

import { create } from 'zustand';

const STORAGE_KEY = 'sable.chrome.v1';

export type Theme = 'light' | 'dark';

const CHAT_WIDTH_MIN = 280;
const CHAT_WIDTH_MAX = 720;
const CHAT_WIDTH_DEFAULT = 340;

export type Bookmark = {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  /** CSS color string (hex or rgb expression) for the pastel pill. */
  readonly color: string;
};

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
  /** User-customizable bookmarks displayed as pastel pills on the NTP. */
  bookmarks: Bookmark[];

  setTheme: (t: Theme) => void;
  toggleChat: () => void;
  setChatVisible: (v: boolean) => void;
  setChatWidth: (w: number) => void;
  setUserName: (s: string) => void;
  setFirstLaunchSeen: (v: boolean) => void;
  addBookmark: (b: Omit<Bookmark, 'id'>) => void;
  removeBookmark: (id: string) => void;
  updateBookmark: (id: string, patch: Partial<Omit<Bookmark, 'id'>>) => void;
  reorderBookmarks: (ids: readonly string[]) => void;
};

type Persisted = {
  theme?: Theme;
  chatVisible?: boolean;
  chatWidth?: number;
  userName?: string;
  firstLaunchSeen?: boolean;
  bookmarks?: Bookmark[];
};

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: 'bm-arxiv',  label: 'arXiv',  url: 'https://arxiv.org',    color: '#FFB89E' },
  { id: 'bm-github', label: 'GitHub', url: 'https://github.com',   color: '#B3E5C9' },
  { id: 'bm-linear', label: 'Linear', url: 'https://linear.app',   color: '#B5D4F2' },
  { id: 'bm-notion', label: 'Notion', url: 'https://notion.so',    color: '#FFE69A' },
  { id: 'bm-figma',  label: 'Figma',  url: 'https://figma.com',    color: '#F2BCD0' },
];

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
  bookmarks: Bookmark[];
};

function sanitizeBookmarks(input: unknown): Bookmark[] {
  if (!Array.isArray(input)) return DEFAULT_BOOKMARKS.slice();
  const out: Bookmark[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Partial<Bookmark>;
    if (typeof r.id !== 'string' || typeof r.label !== 'string' || typeof r.url !== 'string' || typeof r.color !== 'string') continue;
    out.push({ id: r.id, label: r.label, url: r.url, color: r.color });
  }
  return out;
}

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
        bookmarks: parsed.bookmarks
          ? sanitizeBookmarks(parsed.bookmarks)
          : DEFAULT_BOOKMARKS.slice(),
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
    bookmarks: DEFAULT_BOOKMARKS.slice(),
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
        bookmarks: state.bookmarks,
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
  bookmarks: initial.bookmarks,

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
  addBookmark: (b) => {
    const id = `bm-${Math.random().toString(36).slice(2, 10)}`;
    set({
      bookmarks: [
        ...get().bookmarks,
        { id, label: b.label.slice(0, 32), url: b.url, color: b.color },
      ],
    });
    persist(snapshot(get()));
  },
  removeBookmark: (id) => {
    set({ bookmarks: get().bookmarks.filter((b) => b.id !== id) });
    persist(snapshot(get()));
  },
  updateBookmark: (id, patch) => {
    set({
      bookmarks: get().bookmarks.map((b) =>
        b.id === id
          ? {
              ...b,
              ...(patch.label !== undefined ? { label: patch.label.slice(0, 32) } : null),
              ...(patch.url !== undefined ? { url: patch.url } : null),
              ...(patch.color !== undefined ? { color: patch.color } : null),
            }
          : b,
      ),
    });
    persist(snapshot(get()));
  },
  reorderBookmarks: (ids) => {
    const byId = new Map(get().bookmarks.map((b) => [b.id, b]));
    const next: Bookmark[] = [];
    for (const id of ids) {
      const b = byId.get(id);
      if (b) {
        next.push(b);
        byId.delete(id);
      }
    }
    // append any orphans the caller forgot about so we never silently drop
    for (const b of byId.values()) next.push(b);
    set({ bookmarks: next });
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
    bookmarks: s.bookmarks,
  };
}
