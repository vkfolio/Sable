import { describe, expect, test } from 'vitest';
import { dividers } from '../dividers';
import { layout } from '../layout';
import type { Pane, Rect } from '../types';

const VIEWPORT: Rect = { x: 0, y: 0, width: 1000, height: 800 };

describe('dividers', () => {
  test('single leaf has no dividers', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' };
    expect(dividers(tree, VIEWPORT)).toEqual([]);
  });

  test('h-split produces one vertical divider at the boundary', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'h',
      ratio: 0.4,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const divs = dividers(tree, VIEWPORT, 4);
    expect(divs).toHaveLength(1);
    expect(divs[0]).toEqual({
      splitId: 's',
      direction: 'h',
      rect: { x: 400 - 2, y: 0, width: 4, height: 800 },
      parentRect: VIEWPORT,
    });
  });

  test('v-split produces one horizontal divider', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'v',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const divs = dividers(tree, VIEWPORT, 4);
    expect(divs).toHaveLength(1);
    expect(divs[0]).toEqual({
      splitId: 's',
      direction: 'v',
      rect: { x: 0, y: 400 - 2, width: 1000, height: 4 },
      parentRect: VIEWPORT,
    });
  });

  test('nested splits produce one divider per internal node', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's-root',
      direction: 'h',
      ratio: 0.5,
      first: {
        kind: 'split',
        id: 's-left',
        direction: 'v',
        ratio: 0.5,
        first: { kind: 'leaf', id: 'a', tabIds: ['ta'], activeTabId: 'ta' },
        second: { kind: 'leaf', id: 'b', tabIds: ['tb'], activeTabId: 'tb' },
      },
      second: { kind: 'leaf', id: 'c', tabIds: ['tc'], activeTabId: 'tc' },
    };
    const divs = dividers(tree, VIEWPORT, 4);
    expect(divs.map((d) => d.splitId).sort()).toEqual(['s-left', 's-root']);
  });

  test('divider rects align with the gap left between leaf rects', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const leaves = layout(tree, VIEWPORT, 4);
    const divs = dividers(tree, VIEWPORT, 4);

    const left = leaves.get('p1')!;
    const right = leaves.get('p2')!;
    const div = divs[0]!.rect;

    // Left leaf right-edge meets divider left-edge.
    expect(left.x + left.width).toBe(div.x);
    // Divider right-edge meets right leaf left-edge.
    expect(div.x + div.width).toBe(right.x);
    // Combined widths cover viewport exactly.
    expect(left.width + div.width + right.width).toBe(VIEWPORT.width);
  });
});

describe('layout with gap', () => {
  test('gap=0 (default) keeps rects flush', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const r = layout(tree, VIEWPORT, 0);
    expect(r.get('p1')).toEqual({ x: 0, y: 0, width: 500, height: 800 });
    expect(r.get('p2')).toEqual({ x: 500, y: 0, width: 500, height: 800 });
  });

  test('gap=4 shrinks each side by 2px at the boundary', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const r = layout(tree, VIEWPORT, 4);
    expect(r.get('p1')).toEqual({ x: 0, y: 0, width: 498, height: 800 });
    expect(r.get('p2')).toEqual({ x: 502, y: 0, width: 498, height: 800 });
  });
});
