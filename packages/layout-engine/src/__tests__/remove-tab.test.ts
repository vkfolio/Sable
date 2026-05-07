import { describe, expect, test } from 'vitest';
import { removeTab } from '../remove-tab';
import { findLeafByTab, isLeaf, isSplit, leaves } from '../queries';
import type { Pane } from '../types';

describe('removeTab', () => {
  test('removing the only leaf returns null', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabId: 't1' };
    expect(removeTab(tree, 't1')).toBeNull();
  });

  test('removing a non-existent tab returns the tree unchanged (same reference)', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabId: 't1' };
    expect(removeTab(tree, 'tX')).toBe(tree);
  });

  test('removing one side of a 2-leaf split collapses to the surviving leaf', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabId: 't2' },
    };
    const next = removeTab(tree, 't1');
    expect(next).not.toBeNull();
    expect(isLeaf(next!)).toBe(true);
    expect((next as { tabId: string }).tabId).toBe('t2');
  });

  test('removing a leaf from a deeply nested tree promotes the surviving sibling', () => {
    // root: H 0.5
    //   first: V 0.5 (a / b)
    //   second: leaf c
    // remove ta -> tree becomes H 0.5 (b / c)
    const tree: Pane = {
      kind: 'split',
      id: 'root',
      direction: 'h',
      ratio: 0.5,
      first: {
        kind: 'split',
        id: 's-left',
        direction: 'v',
        ratio: 0.5,
        first: { kind: 'leaf', id: 'a', tabId: 'ta' },
        second: { kind: 'leaf', id: 'b', tabId: 'tb' },
      },
      second: { kind: 'leaf', id: 'c', tabId: 'tc' },
    };
    const next = removeTab(tree, 'ta')!;
    expect(isSplit(next)).toBe(true);
    if (!isSplit(next)) throw new Error('unreachable');
    expect(next.direction).toBe('h');
    expect((next.first as { tabId: string }).tabId).toBe('tb');
    expect((next.second as { tabId: string }).tabId).toBe('tc');
    expect(leaves(next).length).toBe(2);
  });

  test('removing every leaf eventually returns null', () => {
    let tree: Pane | null = {
      kind: 'split',
      id: 'root',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabId: 't2' },
    };
    tree = removeTab(tree, 't1');
    tree = tree && removeTab(tree, 't2');
    expect(tree).toBeNull();
  });

  test('removing a tab not in tree from a nested tree returns same reference', () => {
    const tree: Pane = {
      kind: 'split',
      id: 'root',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabId: 't2' },
    };
    expect(removeTab(tree, 'tX')).toBe(tree);
    expect(findLeafByTab(tree, 't1')).toBeDefined();
  });
});
