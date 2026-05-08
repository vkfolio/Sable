// activateTab — set the activeTabId of the leaf containing the given tab.
//
// No-op (returns same tree by reference) if the tab isn't found, or if it's
// already active in its leaf. Used when the chrome clicks a tab in the strip
// and main needs to swap which WebContentsView is mounted in that leaf.

import type { Pane, TabId } from './types';

export function activateTab(tree: Pane, tabId: TabId): Pane {
  if (tree.kind === 'leaf') {
    if (!tree.tabIds.includes(tabId)) return tree;
    if (tree.activeTabId === tabId) return tree;
    return { ...tree, activeTabId: tabId };
  }
  const first = activateTab(tree.first, tabId);
  const second = activateTab(tree.second, tabId);
  if (first === tree.first && second === tree.second) return tree;
  return { ...tree, first, second };
}
