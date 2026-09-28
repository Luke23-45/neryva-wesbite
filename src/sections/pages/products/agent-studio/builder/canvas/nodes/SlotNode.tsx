import { memo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lock, Settings } from 'lucide-react';
import type { BuilderNodeData } from '../../lib/projector';
import type { SlotKind } from '../../lib/slot-model';
import { glyphFor, StatusChip } from '../../lib/node-chrome';
import {
  CornerSquare,
  Divider,
  EmptyGlyph,
  GearButton,
  Halo,
  IconTile,
  LockGlyph,
  NodeCard,
  NodeHeader,
  NodeHint,
  NodeSubtitle,
  NodeTitle,
  NodeWrap,
  PortDot,
  PortDotInner,
  TitleText,
} from './SlotNode.styles';

/**
 * Runtime callbacks injected by the canvas layer (never serialized — the
 * projector stays pure and unit-tested; this component stays hook-free so it
 * renders in tests without a React Flow provider).
 */
export interface SlotNodeCallbacks {
  onSelectNode: (id: string) => void;
  onPortClick: (kind: SlotKind) => void;
}

export type RuntimeSlotNodeData = BuilderNodeData &
  Partial<SlotNodeCallbacks> & {
    /** True when at least one edge touches this node (canvas-computed). */
    connected?: boolean;
  };

const GHOST_STATUSES = new Set(['untouched', 'locked']);

/**
 * The single canvas node component (BUILD_PLAN.md §13) — v10 card restyle.
 * Presentational: no hooks, no queries, no draft writes, no React Flow
 * provider needed — the edge-geometry anchors live in CanvasSlotNode below,
 * so this card unit-renders standalone. Status dots speak the closed
 * vocabulary; ghosts are dashed and never red (absence is not failure).
 * Projector strings render verbatim — never invented.
 *
 * Glyphs and the status chip live in lib/node-chrome (shared with the
 * inspector header) — the mapping itself is untouched (C4).
 */
export const SlotNode = memo(function SlotNode({ id, data }: NodeProps) {
  const node = data as RuntimeSlotNodeData;
  const ghost = node.nodeType === 'empty' || GHOST_STATUSES.has(node.status);
  const empty = node.nodeType === 'empty';
  const label = node.subtitle ?? node.hint ?? node.title;
  // Spine nodes carry no portColor; the palette renders them in neutral gray.
  const nodeColor = node.portColor ?? '#8E8E93';
  const selected = node.selected === true;

  return (
    <NodeWrap>
      {selected && (
        <>
          <Halo data-testid="node-halo" aria-hidden="true" />
          <CornerSquare data-testid="node-corner" style={{ left: -4, top: -4 }} aria-hidden="true" />
          <CornerSquare data-testid="node-corner" style={{ right: -4, top: -4 }} aria-hidden="true" />
          <CornerSquare data-testid="node-corner" style={{ left: -4, bottom: -4 }} aria-hidden="true" />
          <CornerSquare data-testid="node-corner" style={{ right: -4, bottom: -4 }} aria-hidden="true" />
        </>
      )}
      {node.portColor && node.kind && (
        <PortDot
          type="button"
          aria-label={`Filter rack to ${node.title}`}
          title={`Show ${node.title} in the rack`}
          onClick={(event) => {
            event.stopPropagation();
            node.onPortClick?.(node.kind as SlotKind);
          }}
        >
          {node.connected === true && <PortDotInner data-testid="port-connected" aria-hidden="true" />}
        </PortDot>
      )}
      <NodeCard
        $ghost={ghost}
        $locked={node.status === 'locked'}
        role="button"
        tabIndex={-1}
        aria-label={`${node.title} — ${label}`}
      >
        <NodeHeader>
          <IconTile $color={nodeColor} aria-hidden="true">
            {empty ? <EmptyGlyph>+</EmptyGlyph> : glyphFor(node.slotKey)}
          </IconTile>
          <NodeTitle>
            <TitleText>{node.title}</TitleText>
            {node.lock && (
              <LockGlyph title="Identity is set at creation — the engine has no rename verb">
                <Lock size={12} strokeWidth={1.8} aria-label="Locked: identity cannot be renamed" />
              </LockGlyph>
            )}
          </NodeTitle>
          <StatusChip status={node.status} />
        </NodeHeader>
        <Divider aria-hidden="true" />
        {node.subtitle ? <NodeSubtitle>{node.subtitle}</NodeSubtitle> : null}
        {node.hint ? <NodeHint>{node.hint}</NodeHint> : null}
        <GearButton
          type="button"
          aria-label={`Open ${node.title} in the inspector`}
          title={`Open ${node.title} in the inspector`}
          onClick={(event) => {
            event.stopPropagation();
            node.onSelectNode?.(id);
          }}
        >
          <Settings size={12} strokeWidth={1.8} aria-hidden="true" />
        </GearButton>
      </NodeCard>
    </NodeWrap>
  );
});

const HIDDEN_HANDLE_STYLE: CSSProperties = {
  opacity: 0,
  pointerEvents: 'none',
  width: 8,
  height: 8,
  background: 'transparent',
  border: 0,
};

/**
 * The registered React Flow node type (v10 §3 V9): the presentational card
 * plus invisible edge-geometry anchors. React Flow hides an edge until both
 * endpoint nodes expose handles, so without these the fixed-topology edges
 * (and their labels) never paint. The handles are invisible, take no pointer
 * events, and are not connectable — they start no connections and change no
 * visuals; the port button stays the palette-filter affordance. Split out
 * from SlotNode so the card itself stays provider-free and unit-renderable.
 */
export const CanvasSlotNode = memo(function CanvasSlotNode(props: NodeProps) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        aria-hidden="true"
        style={HIDDEN_HANDLE_STYLE}
      />
      <SlotNode {...props} />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        aria-hidden="true"
        style={HIDDEN_HANDLE_STYLE}
      />
    </>
  );
});
