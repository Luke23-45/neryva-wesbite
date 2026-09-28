import type { ReactNode } from 'react';
import {
  BookOpen,
  Brain,
  Component,
  FlaskConical,
  History,
  KeyRound,
  Layers,
  ListOrdered,
  MemoryStick,
  MessageSquare,
  Mic,
  Play,
  Rocket,
  ShieldCheck,
  Target,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { SlotStatus } from './slot-model';
import { StatusIconWrap } from '../canvas/nodes/SlotNode.styles';

/**
 * Shared node chrome (v10 inspector I1): the per-kind glyph palette (C4 —
 * untouched) and the status-icon vocabulary — small hand-drawn SVG badges
 * that carry node status on the canvas card. Extracted from SlotNode so the
 * vocabulary lives in one place.
 */

export const SLOT_GLYPHS: Record<string, ReactNode> = {
  purpose: <Target size={16} strokeWidth={1.8} />,
  instructions: <ListOrdered size={16} strokeWidth={1.8} />,
  knowledge: <BookOpen size={16} strokeWidth={1.8} />,
  tools: <Wrench size={16} strokeWidth={1.8} />,
  memory: <MemoryStick size={16} strokeWidth={1.8} />,
  credentials: <KeyRound size={16} strokeWidth={1.8} />,
  brain: <Brain size={16} strokeWidth={1.8} />,
  context: <History size={16} strokeWidth={1.8} />,
  samples: <Layers size={16} strokeWidth={1.8} />,
  guardrails: <ShieldCheck size={16} strokeWidth={1.8} />,
  brand: <Mic size={16} strokeWidth={1.8} />,
  budget: <Wallet size={16} strokeWidth={1.8} />,
  response: <MessageSquare size={16} strokeWidth={1.8} />,
  evaluation: <FlaskConical size={16} strokeWidth={1.8} />,
  ship: <Rocket size={16} strokeWidth={1.8} />,
  try: <Play size={16} strokeWidth={1.8} />,
};

export function glyphFor(slotKey: string): ReactNode {
  const key = slotKey.startsWith('sat:') ? slotKey.slice(4) : slotKey;
  return SLOT_GLYPHS[key] ?? <Component size={16} strokeWidth={1.8} />;
}

/**
 * Status icon vocabulary — five hand-drawn SVG badges (14px) that carry node
 * status on the canvas card, replacing the old all-caps text chips.
 *
 * Design language: filled badges = resolved states (ready, attention); line
 * glyphs = neutral or transient states (skipped, syncing, not configured).
 * The card border stays uniform 1px #262F3F for every status, including
 * attention (V4 drops the old amber-tinted borders).
 *
 * Labels use professional language — "Not configured" instead of EMPTY,
 * "Needs attention" instead of REVIEW. The syncing icon rotates gently
 * (disabled under prefers-reduced-motion) because the status means an
 * ongoing process; a static icon would misrepresent it.
 *
 * SYNC is the honest name for `info`: the projector uses `info` for "state
 * not yet known / still loading" (catalogs pending, eval truth absent), so
 * the icon says the node is syncing rather than implying it is ready.
 */
const READY_FILL = '#3DD68C';
const READY_GLYPH = '#052E1B';
const ATTN_FILL = '#F5A524';
const ATTN_GLYPH = '#2E2004';
const NEUTRAL = '#8B94A3';

function ReadyIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill={READY_FILL} />
      <path
        d="M5.1 8.3l2.1 2.1 3.9-4.9"
        fill="none"
        stroke={READY_GLYPH}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AttentionIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill={ATTN_FILL} />
      <path
        d="M8 4.7v4.4"
        fill="none"
        stroke={ATTN_GLYPH}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.6" r="1.15" fill={ATTN_GLYPH} />
    </svg>
  );
}

function SkippedIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="3.4" y="5" width="1.9" height="6" rx="0.95" fill={NEUTRAL} />
      <path
        d="M6.9 5.4L12.2 8l-5.3 2.6z"
        fill={NEUTRAL}
        stroke={NEUTRAL}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SyncingIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M12.1 3.9A5.8 5.8 0 1 1 3.9 3.9"
        fill="none"
        stroke={NEUTRAL}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M2.8 7.1L3.9 3.9L0.7 5"
        fill="none"
        stroke={NEUTRAL}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotConfiguredIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle
        cx="8"
        cy="8"
        r="6.1"
        fill="none"
        stroke={NEUTRAL}
        strokeWidth="1.6"
        strokeDasharray="3.1 2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface StatusIconSpec {
  /** Professional label — tooltip and screen-reader text. */
  label: string;
  /** True when the icon represents an ongoing process (gentle rotation). */
  spin?: boolean;
  icon: ReactNode;
}

const STATUS_ICONS: Record<SlotStatus, StatusIconSpec> = {
  ready: { label: 'Configured', icon: <ReadyIcon /> },
  attention: { label: 'Needs attention', icon: <AttentionIcon /> },
  error: { label: 'Needs attention', icon: <AttentionIcon /> },
  skipped: { label: 'Skipped', icon: <SkippedIcon /> },
  info: { label: 'Syncing', spin: true, icon: <SyncingIcon /> },
  untouched: { label: 'Not configured', icon: <NotConfiguredIcon /> },
  locked: { label: 'Not configured', icon: <NotConfiguredIcon /> },
};

/** Status dot color for non-card indicators (e.g. the inspector next-steps list). */
export function statusDotColor(status: SlotStatus): string {
  switch (status) {
    case 'ready':
      return READY_FILL;
    case 'attention':
    case 'error':
      return ATTN_FILL;
    default:
      return NEUTRAL;
  }
}

/** Status icon — the canvas node card renders this in place of the old text chip. */
export function NodeStatusIcon({ status }: { status: SlotStatus }) {
  const spec = STATUS_ICONS[status] ?? STATUS_ICONS.untouched;
  return (
    <StatusIconWrap
      data-spin={spec.spin === true ? 'true' : undefined}
      role="img"
      aria-label={spec.label}
      title={spec.label}
    >
      {spec.icon}
    </StatusIconWrap>
  );
}
