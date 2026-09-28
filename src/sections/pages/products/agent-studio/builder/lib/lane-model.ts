/**
 * Agent Builder v10 lane topology (LEDGER.md §8.1 — lanes YES).
 *
 * 16 FIXED nodes in 5 dashed lanes. This model owns lane labels, order,
 * per-node colors, and canonical positions only — grading lives in
 * projector.ts. Visual restyle: node cards are 200×100, lanes are dashed
 * hulls; nothing here is derived from data (no invented states possible).
 *
 * Color note (C4): the seven KIND_META colors are reused unchanged for the
 * kind nodes (knowledge/tools/memory/guardrails/evaluation/brand/budget);
 * the new lane nodes carry their own flat colors (C1 — flat, no gradients).
 */

export type LaneId = 'identity' | 'capabilities' | 'cognition' | 'control' | 'delivery';

export const LANE_META: Record<LaneId, { label: string }> = {
  identity: { label: 'IDENTITY' },
  capabilities: { label: 'CAPABILITIES' },
  cognition: { label: 'COGNITION' },
  control: { label: 'CONTROL & STYLE' },
  delivery: { label: 'OUTPUT & DELIVERY' },
};

/** Render order for the five lane groups (palette groups, canvas hulls). */
export const LANE_ORDER: readonly LaneId[] = ['identity', 'capabilities', 'cognition', 'control', 'delivery'];

export type LaneNodeId =
  | 'purpose'
  | 'instructions'
  | 'knowledge'
  | 'tools'
  | 'memory'
  | 'credentials'
  | 'brain'
  | 'context'
  | 'samples'
  | 'guardrails'
  | 'brand'
  | 'budget'
  | 'response'
  | 'evaluation'
  | 'ship'
  | 'try';

export interface LaneNodeSpec {
  id: LaneNodeId;
  lane: LaneId;
  label: string;
  color: string;
  blurb: string;
  x: number;
  y: number;
}

/** Lane column origins (v10 mockup); node x = laneX + 20. */
export const LANE_X: Record<LaneId, number> = {
  identity: 280,
  capabilities: 540,
  cognition: 800,
  control: 1060,
  delivery: 1300,
};

function spec(
  id: LaneNodeId,
  lane: LaneId,
  label: string,
  color: string,
  blurb: string,
  x: number,
  y: number,
): LaneNodeSpec {
  return { id, lane, label, color, blurb, x, y };
}

export const LANE_NODES: Record<LaneNodeId, LaneNodeSpec> = {
  purpose: spec('purpose', 'identity', 'Purpose', '#60A5FA', 'Role, task, rules', 300, 380),
  instructions: spec('instructions', 'identity', 'Instructions', '#38BDF8', 'Directives the agent follows', 300, 550),
  knowledge: spec('knowledge', 'capabilities', 'Knowledge', '#0A84FF', 'Documents this agent may retrieve', 560, 210),
  tools: spec('tools', 'capabilities', 'Tools', '#A78BFA', 'Capabilities this agent may call', 560, 380),
  memory: spec('memory', 'capabilities', 'Memory', '#FF9F0A', 'What this agent remembers', 560, 550),
  credentials: spec('credentials', 'capabilities', 'Credentials', '#E879F9', 'Provider API keys', 560, 720),
  brain: spec('brain', 'cognition', 'Brain', '#818CF8', 'Model policy', 820, 380),
  context: spec('context', 'cognition', 'Context', '#6B7280', 'History · scope · summary', 820, 550),
  samples: spec('samples', 'cognition', 'Samples', '#FACC15', 'Examples that steer replies', 820, 210),
  guardrails: spec('guardrails', 'control', 'Guardrails', '#FF9F0A', 'What this agent may never do', 1080, 380),
  brand: spec('brand', 'control', 'Brand', '#d8b4fe', 'How every reply sounds', 1080, 210),
  budget: spec('budget', 'control', 'Budget', '#64D2FF', 'Cost and time guardrails', 1080, 550),
  response: spec('response', 'delivery', 'Response', '#22D3EE', 'Output composition', 1320, 380),
  evaluation: spec('evaluation', 'delivery', 'Evaluation', '#30D158', 'Proof this agent behaves', 1320, 550),
  ship: spec('ship', 'delivery', 'Ship', '#F97316', 'Gates, then publish', 1320, 720),
  try: spec('try', 'delivery', 'Try', '#2DD4BF', 'Try it before you ship it', 1320, 210),
};

/** Closed node id list (lane order — the projector and re-entry both read this). */
export const LANE_NODE_IDS: readonly LaneNodeId[] = [
  'purpose',
  'instructions',
  'knowledge',
  'tools',
  'memory',
  'credentials',
  'brain',
  'context',
  'samples',
  'guardrails',
  'brand',
  'budget',
  'response',
  'evaluation',
  'ship',
  'try',
];

export function laneOf(id: LaneNodeId): LaneId {
  return LANE_NODES[id].lane;
}

/** Fixed node count — the projector must emit exactly this many. */
export const NODE_COUNT = 16;

/** Dashed lane hulls (mockup: 240 wide, top at y=168, 668 tall). */
export const LANE_HULLS: Record<LaneId, { x: number; y: number; w: number; h: number }> = {
  identity: { x: 280, y: 168, w: 240, h: 668 },
  capabilities: { x: 540, y: 168, w: 240, h: 668 },
  cognition: { x: 800, y: 168, w: 240, h: 668 },
  control: { x: 1060, y: 168, w: 240, h: 668 },
  delivery: { x: 1300, y: 168, w: 240, h: 668 },
};
