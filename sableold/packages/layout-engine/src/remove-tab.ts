// removeTab — drop a tab from the tree, collapsing degenerate splits.
//
// Stacked-tab semantics: a leaf may hold multiple tabs. Removing a tab pulls
// it from the stack; the leaf collapses (becomes null, propagating the
// collapse upward) only when its stack empties. If the removed tab was the
// active one, the next-to-last in the stack becomes active.
//
// Returns null if the tree is left empty.

import type { LeafPane, Pane, TabId } from './types';

export function removeTab(tree: Pane, tabId: TabId): Pane | null {
  if (tree.kind === 'leaf') {
    if (!tree.tabIds.includes(tabId)) return tree;
    const remaining = tree.tabIds.filter((t) => t !== tabId);
    if (remaining.length === 0) return null;
    const nextActive: TabId =
      tree.activeTabId === tabId
        ? // pick the tab that was most-recently to the right of the removed one,
          // falling back to the last remaining
          (remaining[remaining.length - 1] as TabId)
        : tree.activeTabId;
    const next: LeafPane = {
      ...tree,
      tabIds: remaining,
      activeTabId: nextActive,
    };
    return next;
  }
  const first = removeTab(tree.first, tabId);
  const second = removeTab(tree.second, tabId);
  if (first === null && second === null) return null;
  if (first === null) return second;
  if (second === null) return first;
  if (first === tree.first && second === tree.second) return tree;
  return { ...tree, first, second };
}
