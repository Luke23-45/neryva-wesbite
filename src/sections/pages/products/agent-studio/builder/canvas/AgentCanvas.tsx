import '@xyflow/react/dist/style.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import { Grid2x2, Map as MapIcon, Maximize, Minus, Plus, ShieldCheck, Wand2 } from 'lucide-react';
import { CanvasSlotNode, type RuntimeSlotNodeData } from './nodes/SlotNode';
import { LANE_NODE_TYPE, LaneNode, toLaneNodes, type LaneHullGeom } from './LaneHull';
import { DataEdge } from './edges/DataEdge';
import { IssuesPill } from './IssuesPill';
import type { BuilderEdge, BuilderNode, BuilderNodeData } from '../lib/projector';
import type { SlotKind } from '../lib/slot-model';
import { LANE_HULLS, LANE_META, LANE_ORDER, type LaneId } from '../lib/lane-model';
import {
  CanvasWrap,
  MinimapCaption,
  MinimapWrap,
  ToolButton,
  Toolbar,
  ToolbarDivider,
  ValidateDot,
  ZoomLabel,
} from './AgentCanvas.styles';

export interface AgentCanvasProps {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  /** Bumped by Tidy — preserved drag positions reset to canonical layout. */
  layoutRev: number;
  /** Origin mode: the scaffold is read-navigable but not rearrangeable. */
  locked: boolean;
  onSelectNode: (id: string | null) => void;
  onNodePosition: (id: string, pos: { x: number; y: number }) => void;
  onPositionsCommitted: () => void;
  onPortClick: (kind: SlotKind) => void;
  onTidy: () => void;
  /** Live readiness counts (same derivation as the palette health card). */
  blockers: number;
  suggestions: number;
  /** Opens the validation/issues surface. */
  onValidate: () => void;
  onReviewIssues: () => void;
}

const nodeTypes: NodeTypes = { slot: CanvasSlotNode, [LANE_NODE_TYPE]: LaneNode };
const edgeTypes: EdgeTypes = { data: DataEdge };

const MINIMAP_STATUS_COLOR: Record<string, string> = {
  ready: '#34d399',
  attention: '#fbbf24',
  error: '#f87171',
  info: '#93c5fd',
  skipped: 'rgba(229, 231, 235, 0.45)',
  untouched: 'rgba(255, 255, 255, 0.16)',
  locked: 'rgba(255, 255, 255, 0.10)',
};

/**
 * Lane hull geometry (agent-builder-v10 §3 V2, §8 decision 1): WS-A's layout
 * pass exports LANE_HULLS as a Record<LaneId, {x, y, w, h}> plus LANE_META
 * labels from `../lib/lane-model`. The Record shape is adapted into
 * LaneHullGeom rows here (canvas concern) — the model is not touched. A
 * lane whose geometry is absent resolves to zero hulls: a missing hull is
 * honest, an invented one is not.
 */
function resolveLaneHulls(): LaneHullGeom[] {
  const hulls: LaneHullGeom[] = [];
  for (const laneId of LANE_ORDER as readonly LaneId[]) {
    const geom = LANE_HULLS[laneId];
    if (!geom) continue;
    hulls.push({
      id: laneId,
      label: LANE_META[laneId]?.label ?? laneId,
      x: geom.x,
      y: geom.y,
      width: geom.w,
      height: geom.h,
    });
  }
  return hulls;
}

/** Live zoom readout — isolated so only this label re-renders on zoom. */
function ZoomReadout() {
  const { zoom } = useViewport();
  return <ZoomLabel aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>{Math.round(zoom * 100)}%</ZoomLabel>;
}

function FlowCanvas(props: AgentCanvasProps) {
  const { nodes: projectedNodes, edges: projectedEdges, layoutRev, locked, onSelectNode, onPortClick } = props;
  // Seed from the first projection (never an empty flash; the sync effect
  // below owns every update after mount, so fitView measures real nodes).
  // Lane hulls are static geometry — they sit outside the projector sync.
  const laneNodes = useMemo(() => toLaneNodes(resolveLaneHulls()), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(projectedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<BuilderEdge>(projectedEdges);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [grid, setGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const lastLayoutRev = useRef(layoutRev);

  // Projector → canvas sync. Drag positions are preserved across semantic
  // re-projects (remote updates must never yank a drag); only a layoutRev
  // bump (Tidy) resets to canonical coordinates. `connected` is derived
  // from the real edge list — the port dot never implies a link it lacks.
  useEffect(() => {
    const reset = lastLayoutRev.current !== layoutRev;
    lastLayoutRev.current = layoutRev;
    const connected = new Set<string>();
    for (const edge of projectedEdges) {
      connected.add(edge.source);
      connected.add(edge.target);
    }
    setNodes((current) => {
      const kept = new Map(current.map((n) => [n.id, n.position]));
      return projectedNodes.map((n) => ({
        ...n,
        position: reset || !kept.has(n.id) ? n.position : (kept.get(n.id) as { x: number; y: number }),
        data: {
          ...n.data,
          onSelectNode,
          onPortClick,
          connected: connected.has(n.id),
        } satisfies RuntimeSlotNodeData,
      }));
    });
    setEdges(projectedEdges);
  }, [projectedNodes, projectedEdges, layoutRev, onSelectNode, onPortClick, setNodes, setEdges]);

  const allNodes = useMemo<Node[]>(() => [...laneNodes, ...nodes], [laneNodes, nodes]);

  const minimapColors = useMemo(
    () => ({
      nodeColor: (node: Node) => {
        if (node.type === LANE_NODE_TYPE) return 'rgba(255, 255, 255, 0.04)';
        return MINIMAP_STATUS_COLOR[(node.data as BuilderNodeData | undefined)?.status as string] ?? '#888';
      },
      maskColor: 'rgba(10, 13, 18, 0.7)',
      bgColor: '#10141B',
    }),
    [],
  );

  return (
    <CanvasWrap role="application" aria-label="Agent circuit canvas">
      <ReactFlow
        nodes={allNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => {
          if (node.type !== LANE_NODE_TYPE) props.onSelectNode(node.id);
        }}
        onPaneClick={() => props.onSelectNode(null)}
        onNodeDragStop={(_, node) => {
          if (node.type === LANE_NODE_TYPE) return;
          props.onNodePosition(node.id, node.position);
          props.onPositionsCommitted();
        }}
        nodesConnectable={false}
        nodesDraggable={!locked}
        edgesFocusable={false}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionOnDrag={false}
        snapToGrid
        snapGrid={[25, 25]}
        minZoom={0.1}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="dark"
      >
        {grid && <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#151B25" />}
        {showMinimap && (
          <MinimapWrap>
            <MiniMap
              pannable
              zoomable
              nodeColor={minimapColors.nodeColor}
              maskColor={minimapColors.maskColor}
              bgColor={minimapColors.bgColor}
              style={{ border: '1px solid #232B39', borderRadius: 10, overflow: 'hidden' }}
            />
            <MinimapCaption aria-hidden="true">OVERVIEW</MinimapCaption>
          </MinimapWrap>
        )}
      </ReactFlow>
      <Toolbar aria-label="Canvas tools">
        <ToolButton type="button" onClick={props.onTidy} title="Restore canonical layout">
          <Wand2 size={13} strokeWidth={1.8} />
          Tidy
        </ToolButton>
        <ToolButton type="button" onClick={() => void fitView({ padding: 0.2 })} title="Fit view" aria-label="Fit view">
          <Maximize size={13} strokeWidth={1.8} />
        </ToolButton>
        <ToolbarDivider aria-hidden="true" />
        <ToolButton type="button" onClick={() => void zoomOut()} title="Zoom out" aria-label="Zoom out">
          <Minus size={14} strokeWidth={1.8} />
        </ToolButton>
        <ZoomReadout />
        <ToolButton type="button" onClick={() => void zoomIn()} title="Zoom in" aria-label="Zoom in">
          <Plus size={14} strokeWidth={1.8} />
        </ToolButton>
        <ToolbarDivider aria-hidden="true" />
        <ToolButton
          type="button"
          $active={grid}
          onClick={() => setGrid((g) => !g)}
          title="Toggle grid"
          aria-label="Toggle grid"
          aria-pressed={grid}
        >
          <Grid2x2 size={14} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton
          type="button"
          $active={showMinimap}
          onClick={() => setShowMinimap((v) => !v)}
          title="Toggle overview"
          aria-label="Toggle overview"
          aria-pressed={showMinimap}
        >
          <MapIcon size={14} strokeWidth={1.8} />
        </ToolButton>
        <ToolbarDivider aria-hidden="true" />
        <ToolButton type="button" onClick={props.onValidate} title="Validate agent">
          <ShieldCheck size={13} strokeWidth={1.8} />
          Validate
          <ValidateDot $blocked={props.blockers > 0} data-testid="validate-dot" aria-hidden="true" />
        </ToolButton>
      </Toolbar>
      <IssuesPill blockers={props.blockers} suggestions={props.suggestions} onReviewIssues={props.onReviewIssues} />
    </CanvasWrap>
  );
}

/**
 * Lazy-loaded canvas shell (BUILD_PLAN.md §13): the @xyflow/react chunk —
 * code, CSS, and provider — loads only with builder routes. List/detail
 * bundles never pay for the circuit.
 */
export function AgentCanvas(props: AgentCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
