import { describe, expect, test } from 'vitest';
import { applyDrop } from '../apply-drop';
import { findLeafByTab, isSplit, leaves } from '../queries';
import type { Pane } from '../types';

let counter = 0;
function fresh(): { gen: () => string } {
  counter = 0;
  return { gen: () => `id-${++counter}` };
}

function leafOf(id: string, tab: string): Pane {
  return { kind: 'leaf', id, tabIds: [tab], activeTabId: tab };
}

describe('applyDrop', () => {
  test('center drop replaces target leaf tab with source, preserving leaf id', () => {
    const tree: Pane = leafOf('p1', 't1');
    const next = applyDrop(tree, 't2', 'p1', 'center');
    expect(next).toEqual({ kind: 'leaf', id: 'p1', tabIds: ['t2'], activeTabId: 't2' });
  });

  test('right drop on a single leaf creates h-split with target on left, source on right', () => {
    const { gen } = fresh();
    const tree: Pane = leafOf('p1', 't1');
    const next = applyDrop(tree, 'tNew', 'p1', 'right', { idGenerator: gen });
    expect(isSplit(next)).toBe(true);
    if (!isSplit(next)) throw new Error('unreachable');
    expect(next.direction).toBe('h');
    expect(next.first).toEqual(leafOf('p1', 't1'));
    expect(next.second).toMatchObject({ kind: 'leaf', tabIds: ['tNew'], activeTabId: 'tNew' });
  });

  test('left drop on a single leaf puts source first', () => {
    const { gen } = fresh();
    const tree: Pane = leafOf('p1', 't1');
    const next = applyDrop(tree, 'tNew', 'p1', 'left', { idGenerator: gen });
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.direction).toBe('h');
    expect(next.first).toMatchObject({ kind: 'leaf', tabIds: ['tNew'], activeTabId: 'tNew' });
    expect(next.second).toEqual(leafOf('p1', 't1'));
  });

  test('top drop produces a v-split with source on top', () => {
    const { gen } = fresh();
    const tree: Pane = leafOf('p1', 't1');
    const next = applyDrop(tree, 'tNew', 'p1', 'top', { idGenerator: gen });
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.direction).toBe('v');
    expect(next.first).toMatchObject({ kind: 'leaf', tabIds: ['tNew'] });
    expect(next.second).toEqual(leafOf('p1', 't1'));
  });

  test('bottom drop produces a v-split with target on top', () => {
    const { gen } = fresh();
    const tree: Pane = leafOf('p1', 't1');
    const next = applyDrop(tree, 'tNew', 'p1', 'bottom', { idGenerator: gen });
    if (!isSplit(next)) throw new Error('expected split');
    expect(next.direction).toBe('v');
    expect(next.first).toEqual(leafOf('p1', 't1'));
    expect(next.second).toMatchObject({ kind: 'leaf', tabIds: ['tNew'] });
  });

  test('drop into a nested tree only modifies the targeted leaf', () => {
    const { gen } = fresh();
    const tree: Pane = {
      kind: 'split',
      id: 'root',
      direction: 'h',
      ratio: 0.5,
      first: leafOf('p-left', 'tL'),
      second: leafOf('p-right', 'tR'),
    };
    const next = applyDrop(tree, 'tNew', 'p-right', 'bottom', { idGenerator: gen });
    if (!isSplit(next)) throw new Error('expected root split unchanged');
    expect(next.first).toEqual(tree.first);
    expect(isSplit(next.second)).toBe(true);
    const flatTabIds = leaves(next).flatMap((l) => l.tabIds).sort();
    expect(flatTabIds).toEqual(['tL', 'tNew', 'tR']);
  });

  test('throws when target pane does not exist', () => {
    const tree: Pane = leafOf('p1', 't1');
    expect(() => applyDrop(tree, 't2', 'nope', 'right')).toThrow(/not in tree/);
  });

  test('throws when target pane is a split (not a leaf)', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's-root',
      direction: 'h',
      ratio: 0.5,
      first: leafOf('p1', 't1'),
      second: leafOf('p2', 't2'),
    };
    expect(() => applyDrop(tree, 't3', 's-root', 'right')).toThrow(/not a leaf/);
  });

  test('center drop on nested tree leaves other panes intact', () => {
    const tree: Pane = {
      kind: 'split',
      id: 'root',
      direction: 'v',
      ratio: 0.5,
      first: leafOf('top', 'tTop'),
      second: leafOf('bot', 'tBot'),
    };
    const next = applyDrop(tree, 'tNew', 'top', 'center');
    // Replace: 'top' leaf now holds tNew alone; tTop falls out of the tree.
    expect(findLeafByTab(next, 'tNew')?.id).toBe('top');
    expect(findLeafByTab(next, 'tTop')).toBeUndefined();
    expect(findLeafByTab(next, 'tBot')?.id).toBe('bot');
  });
});
