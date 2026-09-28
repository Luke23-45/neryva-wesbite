import { forwardRef, useMemo, useState, type RefObject } from 'react';
import {
  BookOpen,
  Brain,
  Component,
  Contact,
  FlaskConical,
  History,
  KeyRound,
  Layers,
  ListOrdered,
  MemoryStick,
  MessageSquare,
  Mic,
  PanelLeftClose,
  Play,
  Rocket,
  ShieldCheck,
  Target,
  Wallet,
  Wrench,
} from 'lucide-react';
import { LANE_META, LANE_ORDER, type LaneId } from '../lib/lane-model';
import type { SlotStatus } from '../lib/slot-model';
import { ResizeHandle } from '../ResizeHandle';
import {
  ClearFilter,
  CollapseButton,
  CountChip,
  FilterRow,
  GroupLabel,
  HeaderActions,
  HeaderRow,
  HealthCard,
  HealthInner,
  HealthRow,
  HealthSub,
  HealthTitle,
  HealthTop,
  IconTile,
  LockedNote,
  NextHint,
  Rail,
  RailTitle,
  ReviewButton,
  Row,
  RowLabel,
  RowMain,
  SearchInput,
  SearchWrap,
  StatusDot,
} from './ComponentPalette.styles';

export interface PaletteNodeEntry {
  id: string;
  label: string;
  color: string;
  /** Honest subtitle/hint from the projector (never invented). */
  statusText: string;
  status: SlotStatus;
  lane: LaneId;
}

export interface PaletteHealth {
  configured: number;
  total: number;
  blockers: number;
  suggestions: number;
  nextStep: { label: string; nodeId: string } | null;
}

export interface ComponentPaletteProps {
  /** 17 nodes in lane order (projector-wired). */
  nodes: PaletteNodeEntry[];
  selectedId: string | null;
  /** Port-click filter (node/kind id or null). */
  filter: string | null;
  onFilterChange: (filter: string | null) => void;
  /** Click selects the existing node — all nodes are bound now; no add/drag path. */
  onSelectNode: (id: string) => void;
  locked: boolean;
  canAuthor: boolean;
  health: PaletteHealth;
  /** Selects the ship node (issues surface). */
  onHealthReview: () => void;
  onHealthNext: (nodeId: string) => void;
  /**
   * T15 — resizable/collapsible sidebar. Controlled width in px; the parent
   * mutates the aside's style.width directly mid-drag (via asideRef) and
   * commits on pointer-up, so dragging never re-renders at 60fps.
   */
  width?: number;
  /** Ref to the Rail aside for direct width mutation during drags. */
  asideRef?: RefObject<HTMLElement | null>;
  /** Live drag deltas (px, positive = pointer moved right). */
  onResizeDelta?: (dx: number) => void;
  /** Drag/keyboard resize finished — commit + persist. */
  onResizeEnd?: () => void;
  /** Hide the palette; a restore button appears in the topbar (width kept). */
  onCollapse?: () => void;
}

/** Node glyphs (lucide). The 7 pre-v10 kinds keep their existing icons (C4). */
const NODE_ICONS: Record<string, React.ReactNode> = {
  purpose: <Target size={13} strokeWidth={1.8} />,
  instructions: <ListOrdered size={13} strokeWidth={1.8} />,
  knowledge: <BookOpen size={13} strokeWidth={1.8} />,
  tools: <Wrench size={13} strokeWidth={1.8} />,
  memory: <MemoryStick size={13} strokeWidth={1.8} />,
  credentials: <KeyRound size={13} strokeWidth={1.8} />,
  brain: <Brain size={13} strokeWidth={1.8} />,
  context: <History size={13} strokeWidth={1.8} />,
  samples: <Layers size={13} strokeWidth={1.8} />,
  guardrails: <ShieldCheck size={13} strokeWidth={1.8} />,
  brand: <Mic size={13} strokeWidth={1.8} />,
  budget: <Wallet size={13} strokeWidth={1.8} />,
  response: <MessageSquare size={13} strokeWidth={1.8} />,
  role: <Contact size={13} strokeWidth={1.8} />,
  evaluation: <FlaskConical size={13} strokeWidth={1.8} />,
  ship: <Rocket size={13} strokeWidth={1.8} />,
  try: <Play size={13} strokeWidth={1.8} />,
};

function nodeIcon(id: string): React.ReactNode {
  // Interim projector ids carry a `sat:` prefix (e.g. `sat:knowledge`);
  // strip it so the kind glyph resolves until the coordinator's 16-node mapping lands.
  const key = id.startsWith('sat:') ? id.slice(4) : id;
  return NODE_ICONS[key] ?? <Component size={13} strokeWidth={1.8} />;
}

function ProgressRing({ pct }: { pct: number }) {
  const clamped = Number.isFinite(pct) ? Math.min(1, Math.max(0, pct)) : 0;
  const r = 15.5;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" role="img" aria-label={`${Math.round(clamped * 100)} percent configured`}>
      <circle cx={20} cy={20} r={r} fill="none" stroke="#232B39" strokeWidth={4} />
      <circle
        cx={20}
        cy={20}
        r={r}
        fill="none"
        stroke="#3DD68C"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        transform="rotate(-90 20 20)"
      />
      <text x={20} y={20} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="#E9EDF3">
        {`${Math.round(clamped * 100)}%`}
      </text>
    </svg>
  );
}

/**
 * v10 component palette: a directory of the 16 builder nodes grouped by lane.
 * Click selects the existing node (all nodes are bound now — there is no
 * add/drag path). Status text and dots come from the projector; the health
 * card derives from the real readiness derivation. Nothing is invented.
 */
export const ComponentPalette = forwardRef<HTMLInputElement, ComponentPaletteProps>(function ComponentPalette(
  {
    nodes,
    selectedId,
    filter,
    onFilterChange,
    onSelectNode,
    locked,
    canAuthor,
    health,
    onHealthReview,
    onHealthNext,
    width,
    asideRef,
    onResizeDelta,
    onResizeEnd,
    onCollapse,
  },
  searchRef,
) {
  const [query, setQuery] = useState('');
  const inert = locked || !canAuthor;
  const inertReason = locked
    ? 'Name the agent first — the palette unlocks on create.'
    : 'Viewing only — an owner, admin, or developer edits this agent.';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nodes.filter((node) => {
      if (filter && node.id !== filter && node.id !== `sat:${filter}`) return false;
      if (!q) return true;
      return node.label.toLowerCase().includes(q);
    });
  }, [nodes, filter, query]);

  const filterLabel = useMemo(() => {
    if (!filter) return null;
    return nodes.find((node) => node.id === filter || node.id === `sat:${filter}`)?.label ?? filter;
  }, [nodes, filter]);

  const ringPct = health.total > 0 ? health.configured / health.total : 0;

  return (
    <Rail aria-label="Component palette" ref={asideRef} style={width != null ? { width } : undefined}>
      <HeaderRow>
        <RailTitle>COMPONENTS</RailTitle>
        <HeaderActions>
          <CountChip aria-label={`${nodes.length} components`}>{nodes.length}</CountChip>
          {onCollapse && (
            <CollapseButton
              type="button"
              onClick={onCollapse}
              title="Hide component palette"
              aria-label="Hide component palette"
            >
              <PanelLeftClose size={14} aria-hidden="true" />
            </CollapseButton>
          )}
        </HeaderActions>
      </HeaderRow>
      <SearchWrap>
        <SearchInput
          ref={searchRef}
          id="builder-palette-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search components…"
          aria-label="Search components"
        />
      </SearchWrap>
      {filter && (
        <FilterRow>
          <span>
            Showing <strong>{filterLabel}</strong> (port filter)
          </span>
          <ClearFilter type="button" onClick={() => onFilterChange(null)}>
            Clear
          </ClearFilter>
        </FilterRow>
      )}
      {LANE_ORDER.map((lane) => {
        const laneNodes = visible.filter((node) => node.lane === lane);
        if (laneNodes.length === 0) return null;
        return (
          <div key={lane}>
            <GroupLabel>{LANE_META[lane].label}</GroupLabel>
            {laneNodes.map((node) => (
              <Row
                key={node.id}
                type="button"
                $selected={selectedId === node.id}
                $dimmed={inert}
                disabled={inert}
                title={inert ? inertReason : `Select ${node.label}`}
                onClick={inert ? undefined : () => onSelectNode(node.id)}
              >
                <IconTile $color={node.color}>{nodeIcon(node.id)}</IconTile>
                <RowMain>
                  <RowLabel>{node.label}</RowLabel>
                </RowMain>
              </Row>
            ))}
          </div>
        );
      })}
      {locked && (
        <LockedNote>The palette wakes up the moment the agent exists — name it first.</LockedNote>
      )}
      {!locked && !canAuthor && (
        <LockedNote>Viewing only — the palette is a directory. Rows stay inert.</LockedNote>
      )}
      <HealthCard aria-label="Setup progress">
        <HealthInner>
          <HealthTop>
            <ProgressRing pct={ringPct} />
            <div>
              <HealthTitle>Setup progress</HealthTitle>
              <HealthSub>
                {health.configured} of {health.total} configured
              </HealthSub>
            </div>
          </HealthTop>
          {health.suggestions > 0 && (
            <HealthRow>
              <StatusDot $color="#58A6FF" />
              <span>
                {health.suggestions} suggestion{health.suggestions === 1 ? '' : 's'}
              </span>
            </HealthRow>
          )}
          {health.blockers > 0 && (
            <HealthRow>
              <StatusDot $color="#F5A524" />
              <span>
                {health.blockers} blocking issue{health.blockers === 1 ? '' : 's'}
              </span>
              <ReviewButton type="button" disabled={inert} title={inert ? inertReason : 'Open the ship issues'} onClick={onHealthReview}>
                review
              </ReviewButton>
            </HealthRow>
          )}
          {health.nextStep ? (
            <NextHint
              type="button"
              disabled={inert}
              title={inert ? inertReason : `Continue with ${health.nextStep.label}`}
              onClick={() => onHealthNext(health.nextStep!.nodeId)}
            >
              Next: {health.nextStep.label}
            </NextHint>
          ) : (
            <NextHint type="button" disabled={inert} title={inert ? inertReason : 'Review the ship node'} onClick={onHealthReview}>
              Ready to publish — review the Ship node.
            </NextHint>
          )}
        </HealthInner>
      </HealthCard>
      <ResizeHandle
        side="left"
        label="Resize component palette"
        onDelta={(dx) => onResizeDelta?.(dx)}
        onResizeEnd={() => onResizeEnd?.()}
        onCollapse={() => onCollapse?.()}
      />
    </Rail>
  );
});
