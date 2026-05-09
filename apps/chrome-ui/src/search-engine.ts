// Default-search-engine builder. Used by the URL bar and the NTP intent
// resolver's last-resort fallback. The user picks their preferred engine in
// Settings → Search engine; this module converts a query + chosen engine
// into a navigable URL.

import type { SearchEngineId } from './types';

/** Hard-coded templates for built-in engines. `custom` is resolved separately. */
const ENGINE_TEMPLATES: Record<Exclude<SearchEngineId, 'custom'>, string> = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  brave: 'https://search.brave.com/search?q=',
  kagi: 'https://kagi.com/search?q=',
};

/**
 * Build a search URL for the given query using the user's chosen engine.
 * Custom engines use the customUrl as a template — must include {q} as the
 * placeholder for the URL-encoded query. If `custom` is chosen but the URL
 * is malformed, falls back to DuckDuckGo silently.
 */
export function buildSearchUrl(
  query: string,
  engine: SearchEngineId,
  customUrl: string,
): string {
  const q = encodeURIComponent(query);
  if (engine === 'custom') {
    if (customUrl.includes('{q}')) return customUrl.replace('{q}', q);
    // malformed custom — fall back to DDG
    return ENGINE_TEMPLATES.duckduckgo + q;
  }
  return (ENGINE_TEMPLATES[engine] ?? ENGINE_TEMPLATES.duckduckgo) + q;
}

/** Display name for a search engine — for chips, labels, dropdowns. */
export function searchEngineLabel(engine: SearchEngineId): string {
  switch (engine) {
    case 'duckduckgo':
      return 'DuckDuckGo';
    case 'google':
      return 'Google';
    case 'brave':
      return 'Brave';
    case 'kagi':
      return 'Kagi';
    case 'custom':
      return 'Custom';
  }
}
