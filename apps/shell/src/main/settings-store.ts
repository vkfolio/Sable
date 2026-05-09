// SettingsStore — sensitive (API keys) stored in OS keychain via keytar;
// non-sensitive (active provider, selected model) stored in JSON in
// app.getPath('userData'). The chrome renderer is never given a raw key —
// only `hasKey: boolean` and provider/model identifiers.

import { app } from 'electron';
import keytar from 'keytar';
import fs from 'node:fs/promises';
import path from 'node:path';

const KEYTAR_SERVICE = 'sable';
const SETTINGS_FILENAME = 'settings.json';

export type ProviderId = 'anthropic' | 'openai' | 'ollama' | 'qwen-local';

export type SearchEngineId = 'duckduckgo' | 'google' | 'brave' | 'kagi' | 'custom';

type PersistedSettings = {
  activeProvider: ProviderId;
  selectedModel: string;
  searchEngine: SearchEngineId;
  /** Used only when searchEngine === 'custom'. Must contain a {q} placeholder. */
  searchEngineCustomUrl: string;
};

const DEFAULTS: PersistedSettings = {
  activeProvider: 'anthropic',
  selectedModel: 'claude-sonnet-4-5',
  searchEngine: 'duckduckgo',
  searchEngineCustomUrl: '',
};

export class SettingsStore {
  private cache: PersistedSettings | undefined;

  async load(): Promise<PersistedSettings> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.path(), 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
      this.cache = { ...DEFAULTS, ...parsed };
    } catch {
      this.cache = { ...DEFAULTS };
    }
    return this.cache;
  }

  async getActiveProvider(): Promise<ProviderId> {
    return (await this.load()).activeProvider;
  }

  async setActiveProvider(id: ProviderId): Promise<void> {
    const s = await this.load();
    s.activeProvider = id;
    await this.persist(s);
  }

  async getSelectedModel(): Promise<string> {
    return (await this.load()).selectedModel;
  }

  async setSelectedModel(model: string): Promise<void> {
    const s = await this.load();
    s.selectedModel = model;
    await this.persist(s);
  }

  async getSearchEngine(): Promise<{ engine: SearchEngineId; customUrl: string }> {
    const s = await this.load();
    return { engine: s.searchEngine, customUrl: s.searchEngineCustomUrl };
  }

  async setSearchEngine(engine: SearchEngineId, customUrl?: string): Promise<void> {
    const s = await this.load();
    s.searchEngine = engine;
    if (customUrl !== undefined) s.searchEngineCustomUrl = customUrl;
    await this.persist(s);
  }

  // ---- API keys (keytar) ----

  async setApiKey(provider: ProviderId, key: string): Promise<void> {
    if (!key.trim()) {
      await this.removeApiKey(provider);
      return;
    }
    await keytar.setPassword(KEYTAR_SERVICE, this.account(provider), key.trim());
  }

  async getApiKey(provider: ProviderId): Promise<string | null> {
    return keytar.getPassword(KEYTAR_SERVICE, this.account(provider));
  }

  async hasApiKey(provider: ProviderId): Promise<boolean> {
    const k = await this.getApiKey(provider);
    return !!k && k.length > 0;
  }

  async removeApiKey(provider: ProviderId): Promise<void> {
    await keytar.deletePassword(KEYTAR_SERVICE, this.account(provider));
  }

  // ---- helpers ----

  private path(): string {
    return path.join(app.getPath('userData'), SETTINGS_FILENAME);
  }

  private account(provider: ProviderId): string {
    return `apiKey:${provider}`;
  }

  private async persist(settings: PersistedSettings): Promise<void> {
    this.cache = settings;
    const dir = app.getPath('userData');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.path(), JSON.stringify(settings, null, 2), 'utf8');
  }
}
