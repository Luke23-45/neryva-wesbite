import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';
import type { BuilderEdge } from '../../lib/projector';

const DIM = '#3A3A3F';
const LIT = '#93c5fd';

/**
 * The single canvas edge component — derived runtime legs only (BUILD_PLAN.md
 * §5). Three variants: `flow` (data feed, lit = accent), `inhibit`
 * (guardrails — flat bar head, never an arrow), `verdict` (evaluation —
 * dashed). Unlit legs render dim: the structure is always visible, the
 * current never implied where it doesn't flow. Markers are self-declared
 * (no global defs to drift).
 */
export const DataEdge = memo(function DataEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<BuilderEdge>) {
  const variant = data?.variant ?? 'flow';
  const lit = data?.lit === true;
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const markerId = `${id}-${variant}`;
  const color = lit ? LIT : DIM;
  const dashed = variant !== 'flow';

  return (
    <>
      <defs>
        {variant === 'inhibit' ? (
          <marker id={markerId} markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
            <path d="M3,1.5 V7.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </marker>
        ) : (
          <marker id={markerId} markerWidth="9" markerHeight="9" refX="6.5" refY="4.5" orient="auto">
            <path
              d="M2.5,1.5 L6.5,4.5 L2.5,7.5"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        )}
      </defs>
      <path
        id={id}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={lit ? 1.8 : 1.5}
        strokeDasharray={dashed ? '5 4' : undefined}
        markerEnd={`url(#${markerId})`}
        style={lit ? { filter: 'drop-shadow(0 0 4px rgba(147, 197, 253, 0.45))' } : undefined}
      />
    </>
  );
});
