import { describe, expect, test } from 'vitest';
import { resize } from '../resize';
import { findPaneById, isSplit } from '../queries';
import type { Pane } from '../types';
import { MAX_RATIO, MIN_RATIO } from '../types';

const tree: Pane = {
  kind: 'split',
  id: 'root',
  direction: 'h',
  ratio: 0.5,
  first: { kind: 'leaf', id: 'p1', tabId: 't1' },
  second: { kind: 'leaf', id: 'p2', tabId: 't2' },
};

describe('resize', () => {
  test('updates the ratio of the targeted split', () => {
    const next = resize(tree, 'root', 0.3);
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.ratio).toBeCloseTo(0.3);
  });

  test('clamps ratios above MAX_RATIO', () => {
    const next = resize(tree, 'root', 0.99);
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.ratio).toBeCloseTo(MAX_RATIO);
  });

  test('clamps ratios below MIN_RATIO', () => {
    const next = resize(tree, 'root', 0.01);
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.ratio).toBeCloseTo(MIN_RATIO);
  });

  test('targeting a non-existent split is a no-op (returns same reference)', () => {
    const next = resize(tree, 'nope', 0.3);
    expect(next).toBe(tree);
  });

  test('updates a deeply nested split without touching siblings', () => {
    const nested: Pane = {
      kind: 'split',
      id: 'root',
      direction: 'h',
      ratio: 0.5,
      first: {
        kind: 'split',
        id: 's-inner',
        direction: 'v',
        ratio: 0.5,
        first: { kind: 'leaf', id: 'a', tabId: 'ta' },
        second: { kind: 'leaf', id: 'b', tabId: 'tb' },
      },
      second: { kind: 'leaf', id: 'c', tabId: 'tc' },
    };
    const next = resize(nested, 's-inner', 0.7);
    const inner = findPaneById(next, 's-inner');
    if (!inner || !isSplit(inner)) throw new Error('expected split');
    expect(inner.ratio).toBeCloseTo(0.7);

    // Root unchanged.
    if (!isSplit(next)) throw new Error('expected root split');
    expect(next.ratio).toBeCloseTo(0.5);
  });
});
