import { describe, expect, test } from 'vitest';
import { layout } from '../layout';
import type { Pane, Rect } from '../types';

const VIEWPORT: Rect = { x: 0, y: 0, width: 1000, height: 800 };

describe('layout', () => {
  test('single leaf occupies the entire viewport', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' };
    const result = layout(tree, VIEWPORT);
    expect(result.size).toBe(1);
    expect(result.get('p1')).toEqual(VIEWPORT);
  });

  test('horizontal split splits the width by ratio', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's1',
      direction: 'h',
      ratio: 0.4,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const result = layout(tree, VIEWPORT);
    expect(result.get('p1')).toEqual({ x: 0, y: 0, width: 400, height: 800 });
    expect(result.get('p2')).toEqual({ x: 400, y: 0, width: 600, height: 800 });
  });

  test('vertical split splits the height by ratio', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's1',
      direction: 'v',
      ratio: 0.25,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const result = layout(tree, VIEWPORT);
    expect(result.get('p1')).toEqual({ x: 0, y: 0, width: 1000, height: 200 });
    expect(result.get('p2')).toEqual({ x: 0, y: 200, width: 1000, height: 600 });
  });

  test('nested splits preserve viewport coverage with no half-pixel gaps', () => {
    // Tree:
    //   horizontal 0.5
    //     left:  vertical 0.5 (a / b)
    //     right: leaf c
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
    const result = layout(tree, VIEWPORT);
    expect(result.get('a')).toEqual({ x: 0, y: 0, width: 500, height: 400 });
    expect(result.get('b')).toEqual({ x: 0, y: 400, width: 500, height: 400 });
    expect(result.get('c')).toEqual({ x: 500, y: 0, width: 500, height: 800 });

    // Sanity: total area covered equals viewport area.
    let total = 0;
    for (const r of result.values()) total += r.width * r.height;
    expect(total).toBe(VIEWPORT.width * VIEWPORT.height);
  });

  test('odd viewport widths split without losing pixels', () => {
    const tree: Pane = {
      kind: 'split',
      id: 's',
      direction: 'h',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' },
      second: { kind: 'leaf', id: 'p2', tabIds: ['t2'], activeTabId: 't2' },
    };
    const odd: Rect = { x: 0, y: 0, width: 1001, height: 800 };
    const result = layout(tree, odd);
    const a = result.get('p1')!;
    const b = result.get('p2')!;
    expect(a.x + a.width).toBe(b.x);
    expect(a.width + b.width).toBe(odd.width);
  });

  test('layout respects viewport offset (titlebar + sidebar)', () => {
    const tree: Pane = { kind: 'leaf', id: 'p1', tabIds: ['t1'], activeTabId: 't1' };
    const offset: Rect = { x: 280, y: 36, width: 720, height: 564 };
    expect(layout(tree, offset).get('p1')).toEqual(offset);
  });
});
