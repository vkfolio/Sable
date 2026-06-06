import { describe, expect, test } from 'vitest';
import { removeTab } from '../remove-tab';
import { findLeafByTab, isLeaf, isSplit, leaves } from '../queries';
import type { Pane } from '../types';

function leafOf(id: string, tab: string): Pane {
  return { kind: 'leaf', id, tabIds: [tab], activeTabId: tab };
}

describe('removeTab', () => {
  test('removing the only leaf returns null', () => {
    const tree: Pane = leafOf('p1', 't1');
    expect(removeTab(tree, 't1')).toBeNull();
  });

  test('removing a non-existent tab returns the tree unchanged (same reference)', () => {
    const tree: Pane = leafOf('p1', 't1');
    expect(removeTab(tree, 'tX')).toBe(tree);
  });

  test('removing one side of a 2-leaf split collapses to the surviving leaf', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'h',
      ratio: 0.5,
      first: leafOf('p1', 't1'),
      second: leafOf('p2', 't2'),
    };
    const next = removeTab(tree, 't1');
    expect(next).not.toBeNull();
    expect(isLeaf(next!)).toBe(true);
    expect((next as { tabIds: readonly string[] }).tabIds).toEqual(['t2']);
  });

  test('removing one tab from a multi-tab leaf keeps the leaf', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabIds: ['t1', 't2', 't3'], activeTabId: 't2' };
    const next = removeTab(tree, 't2');
    expect(next).toEqual({ kind: 'leaf', id: 'p1', tabIds: ['t1', 't3'], activeTabId: 't3' });
  });

  test('removing a non-active tab from a stack preserves activeTabId', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabIds: ['t1', 't2', 't3'], activeTabId: 't2' };
    const next = removeTab(tree, 't1');
    expect(next).toEqual({ kind: 'leaf', id: 'p1', tabIds: ['t2', 't3'], activeTabId: 't2' });
  });

  test('emptying a stack collapses the leaf', () => {
    const tree: Pane = {
      kind: 'split',
      id: 'root',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: leafOf('p2', 't2'),
    };
    const next = removeTab(tree, 't1');
    if (!next || next.kind !== 'leaf') throw new Error('expected collapse to leaf');
    expect(next.id).toBe('p2');
  });

  test('removing a leaf from a deeply nested tree promotes the surviving sibling', () => {
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
        first: leafOf('a', 'ta'),
        second: leafOf('b', 'tb'),
      },
      second: leafOf('c', 'tc'),
    };
    const next = removeTab(tree, 'ta')!;
    expect(isSplit(next)).toBe(true);
    if (!isSplit(next)) throw new Error('unreachable');
    expect(next.direction).toBe('h');
    expect((next.first as { tabIds: readonly string[] }).tabIds).toEqual(['tb']);
    expect((next.second as { tabIds: readonly string[] }).tabIds).toEqual(['tc']);
    expect(leaves(next).length).toBe(2);
  });

  test('removing every leaf eventually returns null', () => {
    let tree: Pane | null = {
      kind: 'split',
      id: 'root',
      direction: 'h',
      ratio: 0.5,
      first: leafOf('p1', 't1'),
      second: leafOf('p2', 't2'),
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
      first: leafOf('p1', 't1'),
      second: leafOf('p2', 't2'),
    };
    expect(removeTab(tree, 'tX')).toBe(tree);
    expect(findLeafByTab(tree, 't1')).toBeDefined();
  });
});
