// resize — change a split's ratio. Clamps to [MIN_RATIO, MAX_RATIO] so a
// pane can never shrink to invisibility.

import { type Pane, type PaneId, MIN_RATIO, MAX_RATIO } from './types';

export function resize(tree: Pane, splitId: PaneId, newRatio: number): Pane {
  const clamped = Math.max(MIN_RATIO, Math.min(MAX_RATIO, newRatio));
  return updateRatio(tree, splitId, clamped);
}

function updateRatio(node: Pane, splitId: PaneId, ratio: number): Pane {
  if (node.kind === 'leaf') return node;
  if (node.id === splitId) return { ...node, ratio };
  const first = updateRatio(node.first, splitId, ratio);
  const second = updateRatio(node.second, splitId, ratio);
  if (first === node.first && second === node.second) return node;
  return { ...node, first, second };
}
