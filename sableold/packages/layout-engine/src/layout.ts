// layout — pure tree -> rect mapping.

import type { Pane, PaneId, Rect } from './types';

/**
 * Walk the BSP tree and produce the rect for every leaf pane.
 *
 * Internal split nodes do not appear in the output map. Splits divide the
 * parent rect along their direction by `ratio`. We round at every step so
 * adjacent panes share an integer pixel boundary (no half-pixel gaps).
 *
 * `gap` (default 0) is a divider thickness in pixels. When gap > 0, leaf
 * rects are inset by `gap/2` at every internal split boundary so a gap of
 * `gap` pixels exists between any two neighboring panes. Use this in the
 * shell to leave room for draggable splitter dividers.
 */
export function layout(tree: Pane, viewport: Rect, gap = 0): Map<PaneId, Rect> {
  const out = new Map<PaneId, Rect>();
  walk(tree, viewport, out, gap);
  return out;
}

function walk(node: Pane, rect: Rect, out: Map<PaneId, Rect>, gap: number): void {
  if (node.kind === 'leaf') {
    out.set(node.id, rect);
    return;
  }

  const halfGap = Math.round(gap / 2);

  if (node.direction === 'h') {
    const firstWidth = Math.round(rect.width * node.ratio);
    walk(
      node.first,
      { ...rect, width: Math.max(0, firstWidth - halfGap) },
      out,
      gap,
    );
    walk(
      node.second,
      {
        x: rect.x + firstWidth + halfGap,
        y: rect.y,
        width: Math.max(0, rect.width - firstWidth - halfGap),
        height: rect.height,
      },
      out,
      gap,
    );
  } else {
    const firstHeight = Math.round(rect.height * node.ratio);
    walk(
      node.first,
      { ...rect, height: Math.max(0, firstHeight - halfGap) },
      out,
      gap,
    );
    walk(
      node.second,
      {
        x: rect.x,
        y: rect.y + firstHeight + halfGap,
        width: rect.width,
        height: Math.max(0, rect.height - firstHeight - halfGap),
      },
      out,
      gap,
    );
  }
}
