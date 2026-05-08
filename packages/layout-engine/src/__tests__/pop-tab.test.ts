import { describe, expect, test } from 'vitest';
import { popTab } from '../pop-tab';
import { findLeafByTab, isSplit, leaves } from '../queries';
import type { Pane } from '../types';

let counter = 0;
function fresh(): { gen: () => string } {
  counter = 0;
  return { gen: () => `id-${++counter}` };
}

describe('popTab', () => {
  test('single-tab leaf is a no-op (returns same reference)', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' };
    expect(popTab(tree, 'p1', 't1')).toBe(tree);
  });

  test('3-tab leaf, pop middle: source shrinks to 2, sibling holds popped tab', () => {
    const { gen } = fresh();
    const tree: Pane = {
      kind: 'leaf',
      id: 'p1',
      tabIds: ['t1', 't2', 't3'],
      activeTabId: 't1',
    };
    const next = popTab(tree, 'p1', 't2', 'right', { idGenerator: gen });
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.direction).toBe('h');
    // Original leaf retains its id and the remaining tabs
    expect(next.first).toMatchObject({
      kind: 'leaf',
      id: 'p1',
      tabIds: ['t1', 't3'],
      activeTabId: 't1',
    });
    // New sibling holds the popped tab
    expect(next.second).toMatchObject({ kind: 'leaf', tabIds: ['t2'], activeTabId: 't2' });
  });

  test('2-tab leaf, pop one: both leaves are single-tab', () => {
    const { gen } = fresh();
    const tree: Pane = {
      kind: 'leaf',
      id: 'p1',
      tabIds: ['t1', 't2'],
      activeTabId: 't2',
    };
    const next = popTab(tree, 'p1', 't1', 'right', { idGenerator: gen });
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.first).toMatchObject({ kind: 'leaf', id: 'p1', tabIds: ['t2'], activeTabId: 't2' });
    expect(next.second).toMatchObject({ kind: 'leaf', tabIds: ['t1'], activeTabId: 't1' });
    expect(leaves(next).length).toBe(2);
  });

  test('popping the activeTabId reassigns active to a remaining tab', () => {
    const tree: Pane = {
      kind: 'leaf',
      id: 'p1',
      tabIds: ['t1', 't2', 't3'],
      activeTabId: 't2',
    };
    const next = popTab(tree, 'p1', 't2');
    if (!isSplit(next)) throw new Error('expected split');
    const survivor = next.first;
    if (survivor.kind !== 'leaf') throw new Error('expected leaf');
    expect(survivor.tabIds).toEqual(['t1', 't3']);
    // Per remove-tab semantics: active falls to the last remaining tab.
    expect(survivor.activeTabId).toBe('t3');
    // And the popped tab is the active in the new sibling.
    expect(findLeafByTab(next, 't2')?.activeTabId).toBe('t2');
  });

  test('targeting a non-leaf or unknown pane returns the tree unchanged', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's-root',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1', 't2'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t3'], activeTabId: 't3' },
    };
    expect(popTab(tree, 's-root', 't1')).toBe(tree); // root is a split, not a leaf
    expect(popTab(tree, 'unknown', 't1')).toBe(tree);
    expect(popTab(tree, 'p2', 'tx')).toBe(tree); // tab not in target
  });
});
