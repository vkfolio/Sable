import { buildSearchUrl } from './search-engine';
import type { SearchEngineId } from './types';

/**
 * Turn user input into a navigable URL. Heuristics:
 *  - already has a scheme  → use as-is
 *  - looks like a domain   → prepend https://
 *  - anything else         → search via the user's chosen engine
 */
export function normalizeUrl(
  input: string,
  engine: SearchEngineId = 'duckduckgo',
  customUrl: string = '',
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+\-.]*:/i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(trimmed)) return 'https://' + trimmed;
  return buildSearchUrl(trimmed, engine, customUrl);
}
