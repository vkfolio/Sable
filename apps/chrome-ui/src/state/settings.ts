// Settings store — mirrors SettingsSnapshot from main. Raw API keys never
// land here; only `providerKeyStatus[provider]: boolean` does.

import { create } from 'zustand';
import type { ProviderId, SearchEngineId, SettingsSnapshot } from '../types';

type SettingsStore = {
  loaded: boolean;
  activeProvider: ProviderId;
  selectedModel: string;
  providerKeyStatus: Readonly<Partial<Record<ProviderId, boolean>>>;
  searchEngine: SearchEngineId;
  searchEngineCustomUrl: string;

  refresh: () => Promise<void>;
  setActiveProvider: (id: ProviderId) => Promise<void>;
  setSelectedModel: (model: string) => Promise<void>;
  setApiKey: (provider: ProviderId, key: string) => Promise<void>;
  removeApiKey: (provider: ProviderId) => Promise<void>;
  setSearchEngine: (engine: SearchEngineId, customUrl?: string) => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  loaded: false,
  activeProvider: 'anthropic',
  selectedModel: 'claude-sonnet-4-5',
  providerKeyStatus: {},
  searchEngine: 'duckduckgo',
  searchEngineCustomUrl: '',

  refresh: async () => {
    const snap: SettingsSnapshot = await window.sable.settings.get();
    set({
      loaded: true,
      activeProvider: snap.activeProvider,
      selectedModel: snap.selectedModel,
      providerKeyStatus: snap.providerKeyStatus,
      searchEngine: snap.searchEngine,
      searchEngineCustomUrl: snap.searchEngineCustomUrl,
    });
  },

  setActiveProvider: async (id) => {
    await window.sable.settings.setActiveProvider(id);
    await get().refresh();
  },

  setSelectedModel: async (model) => {
    await window.sable.settings.setSelectedModel(model);
    await get().refresh();
  },

  setApiKey: async (provider, key) => {
    await window.sable.settings.setApiKey(provider, key);
    await get().refresh();
  },

  removeApiKey: async (provider) => {
    await window.sable.settings.removeApiKey(provider);
    await get().refresh();
  },

  setSearchEngine: async (engine, customUrl) => {
    await window.sable.settings.setSearchEngine(engine, customUrl);
    await get().refresh();
  },
}));
