// dividers — compute the rects of draggable split boundaries.
//
// Pairs with layout(): when called with the same `tree`, `viewport`, and
// `thickness`, the divider rects sit exactly in the gaps left between
// adjacent leaf rects. Order in the returned array is depth-first /
// pre-order; consumers shouldn't rely on it.

import type { Pane, PaneId, Rect, SplitDirection } from './types';

export type Divider = {
  readonly splitId: PaneId;
  readonly direction: SplitDirection;
  /** The draggable strip itself (sits in the gap between adjacent leaf rects). */
  readonly rect: Rect;
  /** The full bounds of the split subtree — needed to compute new ratios on drag. */
  readonly parentRect: Rect;
};

export function dividers(tree: Pane, viewport: Rect, thickness = 4): Divider[] {
  const out: Divider[] = [];
  walk(tree, viewport, out, thickness);
  return out;
}

function walk(node: Pane, rect: Rect, out: Divider[], thickness: number): void {
  if (node.kind === 'leaf') return;
  const halfThick = Math.round(thickness / 2);

  if (node.direction === 'h') {
    const firstWidth = Math.round(rect.width * node.ratio);
    out.push({
      splitId: node.id,
      direction: 'h',
      rect: {
        x: rect.x + firstWidth - halfThick,
        y: rect.y,
        width: thickness,
        height: rect.height,
      },
      parentRect: rect,
    });
    walk(
      node.first,
      { ...rect, width: Math.max(0, firstWidth - halfThick) },
      out,
      thickness,
    );
    walk(
      node.second,
      {
        x: rect.x + firstWidth + halfThick,
        y: rect.y,
        width: Math.max(0, rect.width - firstWidth - halfThick),
        height: rect.height,
      },
      out,
      thickness,
    );
  } else {
    const firstHeight = Math.round(rect.height * node.ratio);
    out.push({
      splitId: node.id,
      direction: 'v',
      rect: {
        x: rect.x,
        y: rect.y + firstHeight - halfThick,
        width: rect.width,
        height: thickness,
      },
      parentRect: rect,
    });
    walk(
      node.first,
      { ...rect, height: Math.max(0, firstHeight - halfThick) },
      out,
      thickness,
    );
    walk(
      node.second,
      {
        x: rect.x,
        y: rect.y + firstHeight + halfThick,
        width: rect.width,
        height: Math.max(0, rect.height - firstHeight - halfThick),
      },
      out,
      thickness,
    );
  }
}
