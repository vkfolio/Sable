// applyDrop — drop the dragged tab onto a target pane at a given edge.
//
// Conventions:
//   - Drops are only applied to *leaf* targets. The chrome's hit-testing must
//     resolve overlay drops to the leaf under the cursor before calling this.
//   - 'center' replaces the target leaf's tab with the source tab. If the
//     source tab was already in the tree, it must be removed by the caller
//     first (use removeTab) — this keeps applyDrop pure and free of orphan
//     handling.
//   - Edge drops always insert a *new* split node containing the source as
//     a fresh leaf and the original target as the other side.
//
// All transforms return a new tree; never mutate.

import { findPaneById, isLeaf } from './queries';
import type { DropEdge, LeafPane, Pane, PaneId, SplitPane, TabId } from './types';

let paneIdCounter = 0;
/**
 * Default id generator. Layout-engine consumers may override via the
 * `idGenerator` option for deterministic tests or distributed setups.
 */
export function defaultPaneIdGenerator(): PaneId {
  paneIdCounter += 1;
  return `pane-${paneIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export type ApplyDropOptions = {
  readonly idGenerator?: () => PaneId;
};

export function applyDrop(
  tree: Pane,
  sourceTabId: TabId,
  targetPaneId: PaneId,
  edge: DropEdge,
  options: ApplyDropOptions = {},
): Pane {
  const target = findPaneById(tree, targetPaneId);
  if (!target) {
    throw new Error(`applyDrop: target pane ${targetPaneId} not in tree`);
  }
  if (!isLeaf(target)) {
    throw new Error(`applyDrop: target pane ${targetPaneId} is not a leaf`);
  }

  const idGen = options.idGenerator ?? defaultPaneIdGenerator;

  if (edge === 'center') {
    const replaced: LeafPane = { kind: 'leaf', id: target.id, tabId: sourceTabId };
    return replaceNode(tree, targetPaneId, replaced);
  }

  // Edge drops produce a split. Decide direction and which side the new tab
  // goes on.
  const direction = edge === 'left' || edge === 'right' ? 'h' : 'v';
  const sourceFirst = edge === 'left' || edge === 'top';

  const newLeaf: LeafPane = {
    kind: 'leaf',
    id: idGen(),
    tabId: sourceTabId,
  };
  // Re-id the original target leaf — splits carry their own id and the
  // existing target id stays on the leaf, but we want stable identity, so we
  // keep the existing leaf's id on the leaf side. The new split gets a fresh
  // id.
  const split: SplitPane = {
    kind: 'split',
    id: idGen(),
    direction,
    ratio: 0.5,
    first: sourceFirst ? newLeaf : target,
    second: sourceFirst ? target : newLeaf,
  };

  return replaceNode(tree, targetPaneId, split);
}

function replaceNode(node: Pane, targetId: PaneId, replacement: Pane): Pane {
  if (node.id === targetId) return replacement;
  if (node.kind === 'leaf') return node;
  const first = replaceNode(node.first, targetId, replacement);
  const second = replaceNode(node.second, targetId, replacement);
  if (first === node.first && second === node.second) return node;
  return { ...node, first, second };
}
