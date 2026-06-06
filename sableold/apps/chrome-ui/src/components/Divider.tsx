// Divider — a thin draggable strip between two pane subtrees.
//
// Pointer events: pointerdown captures, document pointermove computes the
// new ratio from cursor position relative to the parent split's bounds,
// pointerup commits.
//
// We send live IPC resize() during the drag (~60Hz) for responsive feel.
// Each call mutates the tree in main, applies setBounds() on tab views,
// and re-emits the snapshot.
//
// Tab WebContentsViews are above the chrome in z-order and would normally
// swallow pointer events. We rely on the divider rect sitting in the gap
// between leaves where no tab view covers — that's why layout-engine's
// `gap` parameter exists and matches DIVIDER_THICKNESS in main.

import { useRef } from 'react';
import { useDragStore } from '../state/drag';
import type { SnapshotDivider } from '../types';

export function Divider({
  divider,
  origin,
}: {
  divider: SnapshotDivider;
  origin: { x: number; y: number };
}) {
  const draggingTab = useDragStore((s) => s.dragging);
  const dragStateRef = useRef<{ active: boolean }>({ active: false });

  // Hide divider while a tab is being drag-dropped — drop overlays own the
  // pointer surface during that mode.
  if (draggingTab) return null;

  const { rect, parentRect, direction, splitId } = divider;
  const local: React.CSSProperties = {
    position: 'absolute',
    left: rect.x - origin.x,
    top: rect.y - origin.y,
    width: rect.width,
    height: rect.height,
    cursor: direction === 'h' ? 'col-resize' : 'row-resize',
    zIndex: 5,
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragStateRef.current.active = true;
    e.currentTarget.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      if (!dragStateRef.current.active) return;
      // Cursor coordinates are window-relative (PointerEvent.clientX/Y are
      // viewport coords; the chrome WebContents fills the window so they
      // align). The parentRect is also in window coords.
      const ratio =
        direction === 'h'
          ? (ev.clientX - parentRect.x) / parentRect.width
          : (ev.clientY - parentRect.y) / parentRect.height;
      void window.sable.layout.resize(splitId, clamp(ratio));
    };

    const onUp = (ev: PointerEvent) => {
      dragStateRef.current.active = false;
      try {
        (ev.target as Element).releasePointerCapture?.(ev.pointerId);
      } catch {
        // ignore
      }
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  return (
    <div
      data-divider-id={splitId}
      style={local}
      onPointerDown={handlePointerDown}
      className="hover:bg-accent/40 transition-colors"
    />
  );
}

function clamp(v: number): number {
  if (v < 0.05) return 0.05;
  if (v > 0.95) return 0.95;
  return v;
}
