// layout — pure tree -> rect mapping.

import type { Pane, PaneId, Rect } from './types';

/**
 * Walk the BSP tree and produce the rect for every leaf pane.
 *
 * Internal split nodes do not appear in the output map. Splits divide the
 * parent rect along their direction by `ratio`. We round at every step so
 * adjacent panes share an integer pixel boundary (no half-pixel gaps).
 */
export function layout(tree: Pane, viewport: Rect): Map<PaneId, Rect> {
  const out = new Map<PaneId, Rect>();
  walk(tree, viewport, out);
  return out;
}

function walk(node: Pane, rect: Rect, out: Map<PaneId, Rect>): void {
  if (node.kind === 'leaf') {
    out.set(node.id, rect);
    return;
  }

  if (node.direction === 'h') {
    const firstWidth = Math.round(rect.width * node.ratio);
    walk(node.first, { ...rect, width: firstWidth }, out);
    walk(
      node.second,
      { x: rect.x + firstWidth, y: rect.y, width: rect.width - firstWidth, height: rect.height },
      out,
    );
  } else {
    const firstHeight = Math.round(rect.height * node.ratio);
    walk(node.first, { ...rect, height: firstHeight }, out);
    walk(
      node.second,
      { x: rect.x, y: rect.y + firstHeight, width: rect.width, height: rect.height - firstHeight },
      out,
    );
  }
}
