// LayoutEngine — public types.
//
// The pane tree is a binary space partitioning tree. Each leaf references one
// tab; each internal node is a split with two children and a ratio. Arbitrary
// nesting is supported. The engine is pure: every transform returns a new
// tree (or null for "removed last leaf"), never mutates.

export type TabId = string;
export type PaneId = string;

export type SplitDirection = 'h' | 'v';
/**
 * 'h' = horizontal split (left | right). The two children sit side by side.
 * 'v' = vertical split (top / bottom). The two children stack.
 */

/**
 * A pane is a stack of one or more tabs sharing one rectangle. Only the tab
 * matching `activeTabId` is rendered into the rect; the others are kept in
 * the strip for the user to switch between (Chrome-style tab group).
 *
 * Invariants (enforced by all transforms):
 *   - `tabIds` is non-empty
 *   - `activeTabId ∈ tabIds`
 *   - no tab id appears in more than one leaf in a tree
 */
export type LeafPane = {
  readonly kind: 'leaf';
  readonly id: PaneId;
  readonly tabIds: readonly TabId[];
  readonly activeTabId: TabId;
};

export type SplitPane = {
  readonly kind: 'split';
  readonly id: PaneId;
  readonly direction: SplitDirection;
  /** Fraction of the parent rect occupied by `first` (left or top). 0..1. */
  readonly ratio: number;
  readonly first: Pane;
  readonly second: Pane;
};

export type Pane = LeafPane | SplitPane;

export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Where a drag drops on a target pane.
 *  - center  : stack — append source onto the target leaf's tab list and
 *              activate it. (Pre-stack version replaced the target's tab.)
 *  - left    : split horizontally; source on the left, target on the right.
 *  - right   : split horizontally; target on the left, source on the right.
 *  - top     : split vertically;   source on top,    target on the bottom.
 *  - bottom  : split vertically;   target on top,    source on the bottom.
 */
export type DropEdge = 'center' | 'left' | 'right' | 'top' | 'bottom';

export const MIN_RATIO = 0.1;
export const MAX_RATIO = 0.9;
