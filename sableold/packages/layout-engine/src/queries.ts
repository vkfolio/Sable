// queries — read-only tree introspection helpers used by drop/remove ops.

import type { LeafPane, Pane, PaneId, SplitPane, TabId } from './types';

export function isLeaf(node: Pane): node is LeafPane {
  return node.kind === 'leaf';
}

export function isSplit(node: Pane): node is SplitPane {
  return node.kind === 'split';
}

export function leaves(tree: Pane): LeafPane[] {
  const out: LeafPane[] = [];
  collectLeaves(tree, out);
  return out;
}

function collectLeaves(node: Pane, out: LeafPane[]): void {
  if (node.kind === 'leaf') out.push(node);
  else {
    collectLeaves(node.first, out);
    collectLeaves(node.second, out);
  }
}

/** Find the leaf-pane that holds the given tab in its stack, or undefined. */
export function findLeafByTab(tree: Pane, tabId: TabId): LeafPane | undefined {
  if (tree.kind === 'leaf') return tree.tabIds.includes(tabId) ? tree : undefined;
  return findLeafByTab(tree.first, tabId) ?? findLeafByTab(tree.second, tabId);
}

export function findPaneById(tree: Pane, paneId: PaneId): Pane | undefined {
  if (tree.id === paneId) return tree;
  if (tree.kind === 'leaf') return undefined;
  return findPaneById(tree.first, paneId) ?? findPaneById(tree.second, paneId);
}

/** All tab ids in the tree, flattened across every leaf's stack. */
export function tabIds(tree: Pane): TabId[] {
  if (tree.kind === 'leaf') return [...tree.tabIds];
  return [...tabIds(tree.first), ...tabIds(tree.second)];
}

export function paneIds(tree: Pane): PaneId[] {
  if (tree.kind === 'leaf') return [tree.id];
  return [tree.id, ...paneIds(tree.first), ...paneIds(tree.second)];
}
