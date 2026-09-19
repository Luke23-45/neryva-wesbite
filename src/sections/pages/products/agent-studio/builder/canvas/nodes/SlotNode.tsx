import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Lock } from 'lucide-react';
import type { BuilderNodeData } from '../../lib/projector';
import type { SlotKind } from '../../lib/slot-model';
import {
  EmptyAdd,
  LockGlyph,
  NodeCard,
  NodeHeader,
  NodeHint,
  NodeSubtitle,
  NodeTitle,
  NodeWrap,
  PortButton,
  StatusDot,
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

export type RuntimeSlotNodeData = BuilderNodeData & Partial<SlotNodeCallbacks>;

const GHOST_STATUSES = new Set(['untouched', 'locked']);

/**
 * The single canvas node component (BUILD_PLAN.md §13) — all ten slots plus
 * empty typed cards render through here, variant-driven. Presentational only:
 * no hooks, no queries, no draft writes. Status dots speak the closed
 * five-word vocabulary (+ locked/skipped pre-states); ghosts are dashed and
 * never red (absence is not failure).
 */
export const SlotNode = memo(function SlotNode({ data }: NodeProps) {
  const node = data as RuntimeSlotNodeData;
  const ghost = node.nodeType === 'empty' || GHOST_STATUSES.has(node.status);
  const label = node.subtitle ?? node.hint ?? node.title;

  return (
    <NodeWrap>
      {node.portColor && node.kind && (
        <PortButton
          type="button"
          $color={node.portColor}
          aria-label={`Filter rack to ${node.title}`}
          title={`Show ${node.title} in the rack`}
          onClick={(event) => {
            event.stopPropagation();
            node.onPortClick?.(node.kind as SlotKind);
          }}
        >
          +
        </PortButton>
      )}
      <NodeCard
        $status={node.status}
        $selected={node.selected === true}
        $ghost={ghost}
        role="button"
        tabIndex={-1}
        aria-label={`${node.title} — ${label}`}
      >
        <NodeHeader>
          <NodeTitle>{node.title}</NodeTitle>
          {node.lock && (
            <LockGlyph title="Identity is set at creation — the engine has no rename verb">
              <Lock size={12} strokeWidth={1.8} aria-label="Locked: identity cannot be renamed" />
            </LockGlyph>
          )}
          <StatusDot $status={node.status} aria-hidden="true" />
        </NodeHeader>
        {node.nodeType === 'empty' ? (
          <EmptyAdd>
            <span aria-hidden="true">+</span>
            <span>{node.hint ?? 'Choose a type'}</span>
          </EmptyAdd>
        ) : node.subtitle ? (
          <NodeSubtitle>{node.subtitle}</NodeSubtitle>
        ) : node.hint ? (
          <NodeHint>{node.hint}</NodeHint>
        ) : null}
      </NodeCard>
    </NodeWrap>
  );
});
