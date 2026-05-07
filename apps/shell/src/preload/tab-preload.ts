// Tab preload — runs inside every tab WebContents BEFORE any page script.
//
// Responsibility for Phase 3: when the user starts dragging a text selection,
// attach a Sable-specific dataTransfer entry alongside the page's standard
// text/plain + text/html. The chat composer (in the chrome WebContents) is
// the drop target.
//
// MIME: application/x-sable-quote+json; v=1
//   {
//     v: 1,
//     kind: 'quote',
//     text: '<the selected text>',
//     url: '<active page url>',
//     title: '<document title>',
//     anchor: { selector: '<css path>' },   // best-effort, may be null
//     pickedUpAt: <epoch ms>
//   }
//
// We DO NOT import from any other module. Sandboxed preloads can't resolve
// relative imports without bundling, and we don't want to pull a bundler
// into the preload pipeline yet.

const SABLE_QUOTE_MIME = 'application/x-sable-quote+json; v=1';
const SABLE_IMAGE_MIME = 'application/x-sable-image+json; v=1';
const MAX_QUOTE_LENGTH = 4000;

type SableQuotePayload = {
  v: 1;
  kind: 'quote';
  text: string;
  url: string;
  title: string;
  anchor: { selector: string | null };
  pickedUpAt: number;
};

type SableImagePayload = {
  v: 1;
  kind: 'image';
  /** Absolute URL of the image asset itself. */
  srcUrl: string;
  /** Alt text from the source page, when available. */
  alt: string;
  /** Page URL the image was found on. */
  pageUrl: string;
  pageTitle: string;
  pickedUpAt: number;
};

document.addEventListener('dragstart', (event) => {
  const dt = event.dataTransfer;
  if (!dt) return;

  // Branch 1: text selection. Highest priority — if the user has text
  // selected and started the drag from a text node, prefer the quote MIME.
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? '';
  if (text) {
    const truncated = text.length > MAX_QUOTE_LENGTH ? text.slice(0, MAX_QUOTE_LENGTH) + '…' : text;
    const payload: SableQuotePayload = {
      v: 1,
      kind: 'quote',
      text: truncated,
      url: location.href,
      title: document.title || location.hostname,
      anchor: { selector: bestEffortSelector(selection) },
      pickedUpAt: Date.now(),
    };
    try {
      dt.setData(SABLE_QUOTE_MIME, JSON.stringify(payload));
      if (!dt.getData('text/plain')) dt.setData('text/plain', truncated);
    } catch {
      // page hijacked dataTransfer; fall through to text drag.
    }
    return;
  }

  // Branch 2: image drag. Source target is an <img> (most common case) or
  // an element with a background-image or that wraps an img. Best-effort —
  // we resolve the closest <img> upward from the drag target, then fall
  // back to the page's own resolved-uri if none found.
  const target = event.target as Element | null;
  const img = closestImage(target);
  if (img && img.src) {
    const payload: SableImagePayload = {
      v: 1,
      kind: 'image',
      srcUrl: img.currentSrc || img.src,
      alt: img.alt ?? '',
      pageUrl: location.href,
      pageTitle: document.title || location.hostname,
      pickedUpAt: Date.now(),
    };
    try {
      dt.setData(SABLE_IMAGE_MIME, JSON.stringify(payload));
      // Fallback for non-Sable drop targets: text/uri-list with the image
      // URL preserves a useful meaning when dropped into a browser address
      // bar or file manager.
      if (!dt.getData('text/uri-list')) {
        dt.setData('text/uri-list', payload.srcUrl);
      }
    } catch {
      // ignore
    }
  }
}, true);  // capture: true — we want first crack at the event before page scripts.

function closestImage(el: Element | null): HTMLImageElement | null {
  let cursor: Element | null = el;
  while (cursor && cursor.nodeType === 1) {
    if (cursor.tagName === 'IMG') return cursor as HTMLImageElement;
    const found = cursor.querySelector?.('img');
    if (found) return found as HTMLImageElement;
    cursor = cursor.parentElement;
  }
  return null;
}

/**
 * Compute a CSS selector path to the selection's common ancestor. This is a
 * best-effort breadcrumb — robust re-anchoring (TextQuoteSelector with fuzzy
 * match) is V0.2 polish. We aim for a selector that's specific enough to
 * locate the rough region but short enough not to balloon payload size.
 */
function bestEffortSelector(selection: Selection | null): string | null {
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (!el) return null;
  return cssPath(el);
}

function cssPath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && parts.length < 6) {
    const here: Element = current;
    let part = here.tagName.toLowerCase();
    if (here.id) {
      part += `#${cssEscape(here.id)}`;
      parts.unshift(part);
      break;
    }
    const className = (here.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((c: string) => `.${cssEscape(c)}`)
      .join('');
    if (className) part += className;
    const parent: Element | null = here.parentElement;
    if (parent) {
      const tagName = here.tagName;
      const siblings: Element[] = Array.from(parent.children).filter(
        (c: Element) => c.tagName === tagName,
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(here);
        if (idx >= 0) part += `:nth-of-type(${idx + 1})`;
      }
    }
    parts.unshift(part);
    current = parent;
  }
  return parts.join(' > ');
}

function cssEscape(value: string): string {
  // Minimal CSS.escape polyfill — strip characters that would break a
  // selector. Sandboxed Chromium does have CSS.escape but defensive anyway.
  return value.replace(/([^\w-])/g, '\\$1');
}
