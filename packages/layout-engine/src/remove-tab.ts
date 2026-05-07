// removeTab — drop a tab from the tree, collapsing degenerate splits.
//
// When a leaf is removed, its parent split is left with only one child; we
// promote the surviving child to take the parent's place. Returns null if
// removing the tab leaves the tree empty (the entire BSP was that one leaf).

import type { Pane, TabId } from './types';

export function removeTab(tree: Pane, tabId: TabId): Pane | null {
  if (tree.kind === 'leaf') {
    return tree.tabId === tabId ? null : tree;
  }
  const first = removeTab(tree.first, tabId);
  const second = removeTab(tree.second, tabId);
  if (first === null && second === null) return null;
  if (first === null) return second;
  if (second === null) return first;
  if (first === tree.first && second === tree.second) return tree;
  return { ...tree, first, second };
}
