/**
 * Turn user input into a navigable URL. Heuristics:
 *  - already has a scheme  → use as-is
 *  - looks like a domain   → prepend https://
 *  - anything else         → DuckDuckGo search
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+\-.]*:/i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(trimmed)) return 'https://' + trimmed;
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(trimmed);
}
