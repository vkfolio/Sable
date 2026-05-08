// Per-pane drop overlay rendered during drag-to-split.
//
// Five zones:
//   left strip   (30% wide, full height of the left side)
//   right strip  (30% wide, full height of the right side)
//   top strip    (30% tall, full width of the top side)
//   bottom strip (30% tall, full width of the bottom side)
//   center       (the rest — replace target tab)
//
// Edge zones overlap the corners; when the pointer is in a corner, last-
// pointer-enter wins (we just track the most recent enter). Center fires
// only when no edge zone is hovered.
//
// We don't draw the zones themselves; we draw the highlighted *region* for
// the currently-hovered zone so the user sees a preview of where their
// drop will land.

import { useDragStore } from '../state/drag';
import type { DropEdge, PaneId } from '../types';

const EDGE_FRACTION = 0.3;

export function DropOverlay({ paneId }: { paneId: PaneId }) {
  const dragging = useDragStore((s) => s.dragging);
  const setHovered = useDragStore((s) => s.setHovered);
  const hovered = useDragStore((s) => s.hovered);

  if (!dragging) return null;

  const isHere = hovered?.paneId === paneId;
  const activeEdge = isHere ? hovered.edge : null;

  const onEnter = (edge: DropEdge) => () => setHovered({ paneId, edge });
  const onLeavePane = () => {
    if (isHere) setHovered(null);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onPointerLeave={onLeavePane}
      style={{ animation: 'drop-zone-fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      {/* Highlight preview rendered first, behind interactive zones */}
      <DropPreview edge={activeEdge} />

      {/* Five interactive zones — pointer-events on, transparent */}
      <Zone
        edge="left"
        onPointerEnter={onEnter('left')}
        style={{
          left: 0,
          top: 0,
          width: `${EDGE_FRACTION * 100}%`,
          height: '100%',
        }}
      />
      <Zone
        edge="right"
        onPointerEnter={onEnter('right')}
        style={{
          right: 0,
          top: 0,
          width: `${EDGE_FRACTION * 100}%`,
          height: '100%',
        }}
      />
      <Zone
        edge="top"
        onPointerEnter={onEnter('top')}
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: `${EDGE_FRACTION * 100}%`,
        }}
      />
      <Zone
        edge="bottom"
        onPointerEnter={onEnter('bottom')}
        style={{
          left: 0,
          bottom: 0,
          width: '100%',
          height: `${EDGE_FRACTION * 100}%`,
        }}
      />
      {/* Center is the inner rectangle; lower z than edges so corners go to edges first. */}
      <Zone
        edge="center"
        onPointerEnter={onEnter('center')}
        style={{
          left: `${EDGE_FRACTION * 100}%`,
          top: `${EDGE_FRACTION * 100}%`,
          right: `${EDGE_FRACTION * 100}%`,
          bottom: `${EDGE_FRACTION * 100}%`,
        }}
      />
    </div>
  );
}

function Zone({
  edge,
  onPointerEnter,
  style,
}: {
  edge: DropEdge;
  onPointerEnter: () => void;
  style: React.CSSProperties;
}) {
  return (
    <div
      data-edge={edge}
      onPointerEnter={onPointerEnter}
      className="absolute"
      style={{ ...style, pointerEvents: 'auto' }}
    />
  );
}

function DropPreview({ edge }: { edge: DropEdge | null }) {
  if (!edge) return null;
  const previewStyle: React.CSSProperties = previewRect(edge);
  return (
    // key={edge} forces a remount when the hovered edge changes, so the
    // spring-in animation fires for the new rect instead of bare CSS-easing
    // between two completely different geometries (which looked liquid-y).
    <div
      key={edge}
      className="absolute pointer-events-none rounded-xl border-2 border-acc bg-acc/10 transition-[inset,width,height,opacity] duration-300 ease-out-quint shadow-[0_0_0_6px_rgb(var(--acc-glow))]"
      style={{
        ...previewStyle,
        animation: 'drop-zone-spring 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    />
  );
}

export function previewRect(edge: DropEdge): React.CSSProperties {
  const half = '50%';
  switch (edge) {
    case 'left':   return { left: 8,    top: 8, width: half, bottom: 8, right: undefined as unknown as number };
    case 'right':  return { right: 8,   top: 8, width: half, bottom: 8, left: undefined as unknown as number };
    case 'top':    return { left: 8,    top: 8, height: half, right: 8, bottom: undefined as unknown as number };
    case 'bottom': return { left: 8, bottom: 8, height: half, right: 8, top: undefined as unknown as number };
    case 'center': return { inset: 8 };
  }
}
