import { memo } from 'react';
import styled from 'styled-components';
import type { Node, NodeProps } from '@xyflow/react';

/**
 * v10 lane hulls (agent-builder-v10 §3 V2, §8 decision 1) — the five dashed
 * lane backgrounds (IDENTITY / CAPABILITIES / COGNITION / CONTROL & STYLE /
 * OUTPUT & DELIVERY) rendered as a custom React Flow node type so they
 * pan/zoom with the canvas. Non-interactive: never selectable, draggable, or
 * focusable, painted behind the slot nodes.
 *
 * Geometry contract: the canvas imports LANE_HULLS from `../lib/lane-model`
 * (WS-A's layout pass owns the coordinates). This module defines the shape
 * it consumes and degrades to zero hulls when the export is absent — a
 * missing hull is honest, an invented one is not.
 */

export const LANE_NODE_TYPE = 'lane' as const;

export interface LaneHullGeom {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaneNodeData extends Record<string, unknown> {
  hull: LaneHullGeom;
}

export type LaneNode = Node<LaneNodeData, typeof LANE_NODE_TYPE>;

const HullBox = styled.div`
  position: relative;
`;

const HullLabel = styled.span`
  position: absolute;
  top: 10px;
  left: 14px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #7c8698;
  white-space: nowrap;
  pointer-events: none;
`;

/** Presentational only: no hooks, no queries — pure geometry in, SVG out. */
export const LaneNode = memo(function LaneNode({ data }: NodeProps) {
  const hull = (data as LaneNodeData).hull;
  return (
    <HullBox data-testid={`lane-hull-${hull.id}`} aria-hidden="true">
      <svg width={hull.width} height={hull.height} aria-hidden="true">
        <rect
          x={0.5}
          y={0.5}
          width={hull.width - 1}
          height={hull.height - 1}
          rx={14}
          fill="rgba(255, 255, 255, 0.015)"
          stroke="#1C2330"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
      <HullLabel>{hull.label}</HullLabel>
    </HullBox>
  );
});

/** Lane hulls → React Flow nodes: behind everything, never interactive. */
export function toLaneNodes(hulls: readonly LaneHullGeom[]): LaneNode[] {
  return hulls.map((hull) => ({
    id: `lane:${hull.id}`,
    type: LANE_NODE_TYPE,
    position: { x: hull.x, y: hull.y },
    width: hull.width,
    height: hull.height,
    data: { hull },
    selectable: false,
    draggable: false,
    focusable: false,
    zIndex: -1,
  }));
}
