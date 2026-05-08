// Intent resolver for the NTP omnibox.
//
// Two layers of "intelligence" on top of plain Google search:
//
//  1. **Site shortcuts** (top priority). When the first token of the query
//     matches a known site keyword (`youtube`, `gh`, `amazon`...), the rest
//     of the query is sent as that site's search URL. Power-user prefix:
//     "youtube cars" → YouTube search for "cars".
//
//  2. **Intent suggestions**. When the query contains a verb / topic
//     keyword (`buy`, `watch`, `flight`, `code`...), we surface a row of
//     destination chips relevant to that intent. The user picks one to
//     navigate. The first chip is also what Enter commits to.
//
// All resolution is local and synchronous — no network, no LLM, no async.
// This is purposefully a static rule set so it's predictable and instant.
// LLM-driven semantic resolution is a follow-up.

export type Suggestion = {
  /** Short visible label on the chip. */
  readonly label: string;
  /** One-line subtitle shown beneath / next to the label. */
  readonly description: string;
  /** Final URL to navigate to. */
  readonly url: string;
  /** Optional pastel color hint for the chip. */
  readonly color?: string;
};

type SiteShortcut = {
  readonly name: string;
  readonly search: string;
  readonly color?: string;
};

const SITE_SHORTCUTS: Record<string, SiteShortcut> = {
  yt:        { name: 'YouTube',    search: 'https://www.youtube.com/results?search_query=', color: '#FFB89E' },
  youtube:   { name: 'YouTube',    search: 'https://www.youtube.com/results?search_query=', color: '#FFB89E' },
  gh:        { name: 'GitHub',     search: 'https://github.com/search?q=',                   color: '#B3E5C9' },
  github:    { name: 'GitHub',     search: 'https://github.com/search?q=',                   color: '#B3E5C9' },
  npm:       { name: 'npm',        search: 'https://www.npmjs.com/search?q=',                color: '#FFB89E' },
  reddit:    { name: 'Reddit',     search: 'https://www.reddit.com/search/?q=',              color: '#FFB89E' },
  r:         { name: 'Reddit',     search: 'https://www.reddit.com/search/?q=',              color: '#FFB89E' },
  twitter:   { name: 'X',          search: 'https://x.com/search?q=',                        color: '#B5D4F2' },
  x:         { name: 'X',          search: 'https://x.com/search?q=',                        color: '#B5D4F2' },
  google:    { name: 'Google',     search: 'https://www.google.com/search?q=',               color: '#B5D4F2' },
  g:         { name: 'Google',     search: 'https://www.google.com/search?q=',               color: '#B5D4F2' },
  wikipedia: { name: 'Wikipedia',  search: 'https://en.wikipedia.org/wiki/Special:Search?search=', color: '#C9BEEE' },
  wiki:      { name: 'Wikipedia',  search: 'https://en.wikipedia.org/wiki/Special:Search?search=', color: '#C9BEEE' },
  w:         { name: 'Wikipedia',  search: 'https://en.wikipedia.org/wiki/Special:Search?search=', color: '#C9BEEE' },
  amazon:    { name: 'Amazon',     search: 'https://www.amazon.com/s?k=',                    color: '#FFE69A' },
  az:        { name: 'Amazon',     search: 'https://www.amazon.com/s?k=',                    color: '#FFE69A' },
  hn:        { name: 'Hacker News',search: 'https://hn.algolia.com/?q=',                     color: '#FFB89E' },
  spotify:   { name: 'Spotify',    search: 'https://open.spotify.com/search/',               color: '#B3E5C9' },
  arxiv:     { name: 'arXiv',      search: 'https://arxiv.org/search/?searchtype=all&query=',color: '#FFD49B' },
  arx:       { name: 'arXiv',      search: 'https://arxiv.org/search/?searchtype=all&query=',color: '#FFD49B' },
  mdn:       { name: 'MDN',        search: 'https://developer.mozilla.org/en-US/search?q=',  color: '#B5D4F2' },
};

type IntentRule = {
  /** Lowercase keywords that trigger this intent. Whole-word match. */
  readonly keywords: readonly string[];
  readonly sites: readonly Suggestion[];
};

/** Build a chip for a destination — query is appended, site name leads. */
function chip(name: string, search: string, query: string, color: string): Suggestion {
  return {
    label: name,
    description: query ? `Search ${name} for "${query}"` : `Open ${name}`,
    url: search + encodeURIComponent(query || ''),
    color,
  };
}

/** Define an intent: keywords + a list of destination factories. */
function intent(
  keywords: string[],
  factories: ReadonlyArray<(q: string) => Suggestion>,
): IntentRule {
  return { keywords, sites: factories.map((f) => f('')) };
}
// keywords are kept lowercased
const INTENT_RULES: ReadonlyArray<{
  keywords: readonly string[];
  factories: ReadonlyArray<(q: string) => Suggestion>;
}> = [
  {
    keywords: ['buy', 'shop', 'shopping', 'order', 'purchase', 'price', 'cheap'],
    factories: [
      (q) => chip('Amazon',   'https://www.amazon.com/s?k=',                    q, '#FFE69A'),
      (q) => chip('Best Buy', 'https://www.bestbuy.com/site/searchpage.jsp?st=',q, '#B5D4F2'),
      (q) => chip('eBay',     'https://www.ebay.com/sch/i.html?_nkw=',          q, '#FFB89E'),
      (q) => chip('Walmart',  'https://www.walmart.com/search?q=',              q, '#B5D4F2'),
    ],
  },
  {
    keywords: ['watch', 'video', 'movie', 'film', 'episode', 'show', 'series', 'stream'],
    factories: [
      (q) => chip('YouTube',     'https://www.youtube.com/results?search_query=', q, '#FFB89E'),
      (q) => chip('Netflix',     'https://www.netflix.com/search?q=',             q, '#FFB89E'),
      (q) => chip('Prime Video', 'https://www.primevideo.com/region/eu/search/ref=atv_sr_sug_0?phrase=', q, '#B5D4F2'),
    ],
  },
  {
    keywords: ['music', 'song', 'album', 'listen', 'playlist'],
    factories: [
      (q) => chip('Spotify',       'https://open.spotify.com/search/',             q, '#B3E5C9'),
      (q) => chip('YouTube Music', 'https://music.youtube.com/search?q=',          q, '#FFB89E'),
      (q) => chip('SoundCloud',    'https://soundcloud.com/search?q=',             q, '#FFD49B'),
    ],
  },
  {
    keywords: ['news', 'headline'],
    factories: [
      (q) => chip('Hacker News', 'https://hn.algolia.com/?q=',                              q, '#FFB89E'),
      (q) => chip('Reuters',     'https://www.reuters.com/site-search/?query=',             q, '#B5D4F2'),
      (q) => chip('BBC',         'https://www.bbc.co.uk/search?q=',                         q, '#F2BCD0'),
      (q) => chip('AP',          'https://apnews.com/search?q=',                            q, '#B3E5C9'),
    ],
  },
  {
    keywords: ['code', 'repo', 'library', 'package', 'stackoverflow', 'docs', 'documentation', 'api'],
    factories: [
      (q) => chip('GitHub',        'https://github.com/search?q=',                          q, '#B3E5C9'),
      (q) => chip('Stack Overflow','https://stackoverflow.com/search?q=',                   q, '#FFB89E'),
      (q) => chip('MDN',           'https://developer.mozilla.org/en-US/search?q=',         q, '#B5D4F2'),
      (q) => chip('npm',           'https://www.npmjs.com/search?q=',                       q, '#FFB89E'),
    ],
  },
  {
    keywords: ['learn', 'tutorial', 'course', 'how-to'],
    factories: [
      (q) => chip('YouTube',     'https://www.youtube.com/results?search_query=',         q, '#FFB89E'),
      (q) => chip('Coursera',    'https://www.coursera.org/search?query=',                q, '#B5D4F2'),
      (q) => chip('freeCodeCamp','https://www.freecodecamp.org/news/search/?query=',      q, '#B3E5C9'),
    ],
  },
  {
    keywords: ['flight', 'flights', 'travel', 'trip', 'fly'],
    factories: [
      (q) => chip('Google Flights', 'https://www.google.com/travel/flights?q=',           q, '#B5D4F2'),
      (q) => chip('Kayak',          'https://www.kayak.com/flights?text=',                q, '#FFB89E'),
      (q) => chip('Skyscanner',     'https://www.skyscanner.com/transport/flights/?q=',   q, '#B3E5C9'),
    ],
  },
  {
    keywords: ['hotel', 'stay', 'booking'],
    factories: [
      (q) => chip('Booking',  'https://www.booking.com/searchresults.html?ss=',  q, '#B5D4F2'),
      (q) => chip('Airbnb',   'https://www.airbnb.com/s/',                       q, '#F2BCD0'),
      (q) => chip('Hotels',   'https://www.hotels.com/search.do?q=',             q, '#FFE69A'),
    ],
  },
  {
    keywords: ['food', 'restaurant', 'eat', 'lunch', 'dinner'],
    factories: [
      (q) => chip('Google Maps', 'https://www.google.com/maps/search/',           q, '#B3E5C9'),
      (q) => chip('Yelp',        'https://www.yelp.com/search?find_desc=',       q, '#FFB89E'),
      (q) => chip('DoorDash',    'https://www.doordash.com/search/store/',       q, '#FFB89E'),
    ],
  },
  {
    keywords: ['job', 'jobs', 'hiring', 'career'],
    factories: [
      (q) => chip('LinkedIn',  'https://www.linkedin.com/jobs/search/?keywords=',  q, '#B5D4F2'),
      (q) => chip('Indeed',    'https://www.indeed.com/jobs?q=',                   q, '#B3E5C9'),
      (q) => chip('Glassdoor', 'https://www.glassdoor.com/Search/results.htm?keyword=', q, '#B3E5C9'),
    ],
  },
  {
    keywords: ['weather'],
    factories: [
      (q) => chip('Weather.com', 'https://weather.com/search/enhancedlocalsearch?where=', q, '#B5D4F2'),
      (q) => chip('AccuWeather', 'https://www.accuweather.com/en/search-locations?query=', q, '#B5D4F2'),
    ],
  },
  {
    keywords: ['map', 'maps', 'directions', 'navigate'],
    factories: [
      (q) => chip('Google Maps', 'https://www.google.com/maps/search/',         q, '#B3E5C9'),
      (q) => chip('Apple Maps',  'https://maps.apple.com/?q=',                  q, '#B5D4F2'),
    ],
  },
  {
    keywords: ['paper', 'research', 'cite', 'arxiv'],
    factories: [
      (q) => chip('arXiv',          'https://arxiv.org/search/?searchtype=all&query=', q, '#FFD49B'),
      (q) => chip('Google Scholar', 'https://scholar.google.com/scholar?q=',           q, '#B5D4F2'),
      (q) => chip('Semantic Scholar','https://www.semanticscholar.org/search?q=',      q, '#C9BEEE'),
    ],
  },
];

const URL_PATTERN = /^[\w-]+(\.[\w-]+)+(\/.*)?$/i;
const SCHEME_PATTERN = /^https?:\/\//i;

/**
 * Resolve a free-form query into a list of navigation suggestions, ordered
 * with the most likely intent first. The first item is what Enter commits.
 */
export function resolveSuggestions(text: string): Suggestion[] {
  const t = text.trim();
  if (!t) return [];

  // Already a URL → "Open <url>" as the only chip.
  if (SCHEME_PATTERN.test(t) || URL_PATTERN.test(t)) {
    const url = SCHEME_PATTERN.test(t) ? t : 'https://' + t;
    return [{ label: 'Open', description: url, url, color: '#B5D4F2' }];
  }

  // Site shortcut: first token is a known site keyword.
  const tokens = t.split(/\s+/);
  const headLower = tokens[0]?.toLowerCase() ?? '';
  const shortcut = SITE_SHORTCUTS[headLower];
  if (shortcut && tokens.length > 1) {
    const q = tokens.slice(1).join(' ');
    return [
      chip(shortcut.name, shortcut.search, q, shortcut.color ?? '#B5D4F2'),
    ];
  }

  // Intent rules — match if ANY keyword occurs as a whole-word substring.
  const lower = t.toLowerCase();
  const matches: Suggestion[] = [];
  const seen = new Set<string>();
  for (const rule of INTENT_RULES) {
    const hit = rule.keywords.some((kw) =>
      new RegExp(`(^|\\W)${escapeRegExp(kw)}(\\W|$)`, 'i').test(lower),
    );
    if (!hit) continue;
    for (const factory of rule.factories) {
      const sug = factory(t);
      if (seen.has(sug.url)) continue;
      seen.add(sug.url);
      matches.push(sug);
    }
  }
  if (matches.length > 0) {
    // Always close with a Google fallback so Enter has a sensible last
    // resort if none of the chip destinations cover the query.
    matches.push({
      label: 'Google',
      description: `Search Google for "${t}"`,
      url: 'https://www.google.com/search?q=' + encodeURIComponent(t),
      color: '#C9BEEE',
    });
    return matches.slice(0, 6);
  }

  // No site / no intent: single Google search chip.
  return [
    {
      label: 'Google',
      description: `Search Google for "${t}"`,
      url: 'https://www.google.com/search?q=' + encodeURIComponent(t),
      color: '#C9BEEE',
    },
  ];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// `intent()` is unused now (we inline factories above). Tag it with `void`
// so the symbol stays exported-discoverable for future expansion.
void intent;
