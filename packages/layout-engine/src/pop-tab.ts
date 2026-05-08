// popTab — yank a tab out of its leaf's stack into a new sibling leaf.
//
// Used by "Ungroup tab" in the strip: a multi-tab leaf shrinks by one, and
// the popped tab becomes its own single-tab leaf in a horizontal split next
// to the original pane (default `'right'`).
//
// Composes the existing primitives (removeTab → applyDrop) so the tree-
// invariant logic stays in one place. No new applyDrop semantics.

import { applyDrop, type ApplyDropOptions } from './apply-drop';
import { findLeafByTab, findPaneById, isLeaf } from './queries';
import { removeTab } from './remove-tab';
import type { DropEdge, Pane, PaneId, TabId } from './types';

export type PopTabEdge = Exclude<DropEdge, 'center'>;

export function popTab(
  tree: Pane,
  paneId: PaneId,
  tabId: TabId,
  edge: PopTabEdge = 'right',
  options: ApplyDropOptions = {},
): Pane {
  const target = findPaneById(tree, paneId);
  if (!target || !isLeaf(target)) return tree;
  if (!target.tabIds.includes(tabId)) return tree;
  // Single-tab leaf: nothing to ungroup; no-op.
  if (target.tabIds.length < 2) return tree;
  // Source leaf is also the same paneId — caller is implicitly asking for the
  // popped tab to land beside it. Verify removeTab leaves the leaf intact.
  const without = removeTab(tree, tabId);
  if (without === null) return tree; // shouldn't happen given length check
  const stillThere = findPaneById(without, paneId);
  if (!stillThere) return tree;
  return applyDrop(without, tabId, paneId, edge, options);
}

export { findLeafByTab };
