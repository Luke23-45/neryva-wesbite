import '@xyflow/react/dist/style.css';
import { useEffect, useMemo, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type EdgeTypes,
  type NodeTypes,
} from '@xyflow/react';
import { Maximize, Minus, Plus, Wand2 } from 'lucide-react';
import { SlotNode, type RuntimeSlotNodeData } from './nodes/SlotNode';
import { DataEdge } from './edges/DataEdge';
import type { BuilderEdge, BuilderNode } from '../lib/projector';
import type { SlotKind } from '../lib/slot-model';
import { CanvasWrap, ToolButton, Toolbar, ZoomStack } from './AgentCanvas.styles';

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
  /** Palette kind dropped on the canvas (ensure + select, same as click). */
  onDropKind: (kind: SlotKind) => void;
  onPortClick: (kind: SlotKind) => void;
  onTidy: () => void;
}

const nodeTypes: NodeTypes = { slot: SlotNode };
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

function FlowCanvas(props: AgentCanvasProps) {
  const { nodes: projectedNodes, edges: projectedEdges, layoutRev, locked, onSelectNode, onPortClick } = props;
  // Seed from the first projection (never an empty flash; the sync effect
  // below owns every update after mount, so fitView measures real nodes).
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNode>(projectedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<BuilderEdge>(projectedEdges);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const lastLayoutRev = useRef(layoutRev);

  // Projector → canvas sync. Drag positions are preserved across semantic
  // re-projects (remote updates must never yank a drag); only a layoutRev
  // bump (Tidy) resets to canonical coordinates.
  useEffect(() => {
    const reset = lastLayoutRev.current !== layoutRev;
    lastLayoutRev.current = layoutRev;
    setNodes((current) => {
      const kept = new Map(current.map((n) => [n.id, n.position]));
      return projectedNodes.map((n) => ({
        ...n,
        position: reset || !kept.has(n.id) ? n.position : (kept.get(n.id) as { x: number; y: number }),
        data: {
          ...n.data,
          onSelectNode,
          onPortClick,
        } satisfies RuntimeSlotNodeData,
      }));
    });
    setEdges(projectedEdges);
  }, [projectedNodes, projectedEdges, layoutRev, onSelectNode, onPortClick, setNodes, setEdges]);

  const minimapColors = useMemo(
    () => ({
      nodeColor: (node: BuilderNode) => MINIMAP_STATUS_COLOR[node.data.status] ?? '#888',
      maskColor: 'rgba(11, 13, 18, 0.7)',
      bgColor: '#0d1016',
    }),
    [],
  );

  return (
    <CanvasWrap role="application" aria-label="Agent circuit canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => props.onSelectNode(node.id)}
        onPaneClick={() => props.onSelectNode(null)}
        onNodeDragStop={(_, node) => {
          props.onNodePosition(node.id, node.position);
          props.onPositionsCommitted();
        }}
        onDrop={(event) => {
          event.preventDefault();
          const kind = event.dataTransfer.getData('application/neryva-slot-kind') as SlotKind;
          if (kind) props.onDropKind(kind);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
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
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="rgba(255,255,255,0.07)" />
        <MiniMap
          pannable
          zoomable
          nodeColor={minimapColors.nodeColor}
          maskColor={minimapColors.maskColor}
          bgColor={minimapColors.bgColor}
          style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}
        />
      </ReactFlow>
      <Toolbar aria-label="Canvas layout">
        <ToolButton type="button" onClick={props.onTidy} title="Restore canonical layout">
          <Wand2 size={13} strokeWidth={1.8} />
          Tidy
        </ToolButton>
      </Toolbar>
      <ZoomStack aria-label="Canvas zoom">
        <ToolButton type="button" onClick={() => void zoomIn()} aria-label="Zoom in">
          <Plus size={14} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton type="button" onClick={() => void zoomOut()} aria-label="Zoom out">
          <Minus size={14} strokeWidth={1.8} />
        </ToolButton>
        <ToolButton type="button" onClick={() => void fitView({ padding: 0.2 })} aria-label="Fit view">
          <Maximize size={13} strokeWidth={1.8} />
        </ToolButton>
      </ZoomStack>
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
