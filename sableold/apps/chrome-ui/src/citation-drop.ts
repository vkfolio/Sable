// Shared helpers for the cross-WebContents drag protocol that produces
// chat citations. Both the sidebar-wide drop target and (legacy) composer
// drop wiring call into here so the parsing rules live in exactly one place.

import type { Citation, ImageCitation, TextCitation } from './types';

export const SABLE_QUOTE_MIME_PREFIX = 'application/x-sable-quote+json';
export const SABLE_IMAGE_MIME_PREFIX = 'application/x-sable-image+json';

/** Truthy when the dataTransfer carries either of our custom MIMEs. */
export function hasSableMime(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  for (const t of dt.types) {
    if (t.startsWith(SABLE_QUOTE_MIME_PREFIX) || t.startsWith(SABLE_IMAGE_MIME_PREFIX)) {
      return true;
    }
  }
  return false;
}

/** Get the first dataTransfer entry whose type starts with `prefix`. */
export function findMime(dt: DataTransfer, prefix: string): string | null {
  for (const t of dt.types) {
    if (t.startsWith(prefix)) return dt.getData(t);
  }
  return null;
}

export type ParsedDrop =
  | { kind: 'text'; citation: TextCitation }
  | { kind: 'image-pending'; payload: ImagePayload }
  | null;

type QuotePayload = {
  v: number;
  kind: string;
  text: string;
  url: string;
  title: string;
  anchor: { selector: string | null };
  pickedUpAt: number;
};

type ImagePayload = {
  v: number;
  kind: string;
  srcUrl: string;
  alt: string;
  pageUrl: string;
  pageTitle: string;
  pickedUpAt: number;
};

/**
 * Parse a drop event's payload. Text quotes resolve immediately; image
 * payloads need an async fetch via main (`window.sable.chat.resolveImage`)
 * before becoming citations, so they're returned as a "pending" record
 * the caller awaits.
 */
export function parseDrop(dt: DataTransfer): ParsedDrop {
  const quoteRaw = findMime(dt, SABLE_QUOTE_MIME_PREFIX);
  if (quoteRaw) {
    try {
      const payload = JSON.parse(quoteRaw) as QuotePayload;
      if (payload.v !== 1 || payload.kind !== 'quote') return null;
      const c: TextCitation = {
        kind: 'text',
        id: `cite-${payload.pickedUpAt}-${Math.random().toString(36).slice(2, 8)}`,
        text: payload.text,
        url: payload.url,
        title: payload.title,
        anchor: payload.anchor ?? { selector: null },
        pickedUpAt: payload.pickedUpAt,
      };
      return { kind: 'text', citation: c };
    } catch {
      return null;
    }
  }
  const imageRaw = findMime(dt, SABLE_IMAGE_MIME_PREFIX);
  if (imageRaw) {
    try {
      const payload = JSON.parse(imageRaw) as ImagePayload;
      if (payload.v !== 1 || payload.kind !== 'image') return null;
      return { kind: 'image-pending', payload };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Finish an image drop: fetch bytes via main and return the resulting
 * citation (or throw with a friendly message).
 */
export async function resolveImageCitation(payload: ImagePayload): Promise<ImageCitation> {
  const resolved = await window.sable.chat.resolveImage(payload.srcUrl);
  return {
    kind: 'image',
    id: `cite-${payload.pickedUpAt}-${Math.random().toString(36).slice(2, 8)}`,
    mimeType: resolved.mimeType,
    base64: resolved.base64,
    sourceUrl: payload.srcUrl,
    pageUrl: payload.pageUrl,
    pageTitle: payload.pageTitle,
    alt: payload.alt,
    pickedUpAt: payload.pickedUpAt,
  };
}

/** Convenience: full async drop pipeline returning a Citation or null. */
export async function citationFromDrop(dt: DataTransfer): Promise<Citation | null> {
  const parsed = parseDrop(dt);
  if (!parsed) return null;
  if (parsed.kind === 'text') return parsed.citation;
  return resolveImageCitation(parsed.payload);
}
