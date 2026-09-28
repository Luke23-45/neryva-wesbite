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
import { StatusChip as StatusChipStyle } from '../canvas/nodes/SlotNode.styles';

/**
 * Shared node chrome (v10 inspector I1): the per-kind glyph palette (C4 —
 * untouched) and the status-chip vocabulary (V3/V4 — the chip ALONE carries
 * status). Extracted from SlotNode so the inspector header renders the exact
 * same chip without duplicating the style map.
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

export interface ChipSpec {
  text: string;
  fg: string;
  bg: string;
  border: string;
}

/**
 * Status chip vocabulary (v10 §3 V3/V4, adjustment A3): the chip ALONE
 * carries status — the card border stays uniform 1px #262F3F for every
 * status, including REVIEW (V4 drops the old amber-tinted borders).
 *
 * SYNC is the honest name for `info`: the projector uses `info` for "state
 * not yet known / still loading" (catalogs pending, eval truth absent), so
 * the chip says the node is syncing rather than implying it is ready.
 */
export function chipForStatus(status: SlotStatus): ChipSpec {
  switch (status) {
    case 'ready':
      return { text: 'READY', fg: '#3DD68C', bg: '#123524', border: '#1F6D44' };
    case 'attention':
    case 'error':
      return { text: 'REVIEW', fg: '#F5A524', bg: '#3A2A12', border: '#8A6116' };
    case 'skipped':
      return { text: 'SKIPPED', fg: '#8B94A3', bg: '#1A202B', border: '#2A3342' };
    case 'info':
      return { text: 'SYNC', fg: '#8B94A3', bg: '#1A202B', border: '#2A3342' };
    case 'untouched':
    case 'locked':
    default:
      return { text: 'EMPTY', fg: '#8B94A3', bg: '#1A202B', border: '#2A3342' };
  }
}

/** Shared status chip — the canvas node card and the inspector header render this. */
export function StatusChip({ status }: { status: SlotStatus }) {
  const chip = chipForStatus(status);
  return (
    <StatusChipStyle $fg={chip.fg} $bg={chip.bg} $border={chip.border}>
      {chip.text}
    </StatusChipStyle>
  );
}
