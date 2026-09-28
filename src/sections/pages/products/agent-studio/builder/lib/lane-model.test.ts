import { describe, expect, it } from 'vitest';
import {
  LANE_HULLS,
  LANE_META,
  LANE_NODES,
  LANE_NODE_IDS,
  LANE_X,
  NODE_COUNT,
  laneOf,
  type LaneId,
  type LaneNodeId,
} from './lane-model';

const EXPECTED_COLORS: Record<LaneNodeId, string> = {
  purpose: '#60A5FA',
  instructions: '#38BDF8',
  role: '#F87171',
  knowledge: '#0A84FF',
  tools: '#A78BFA',
  memory: '#FF9F0A',
  credentials: '#E879F9',
  brain: '#818CF8',
  context: '#6B7280',
  samples: '#FACC15',
  guardrails: '#FF9F0A',
  brand: '#d8b4fe',
  budget: '#64D2FF',
  response: '#22D3EE',
  evaluation: '#30D158',
  ship: '#F97316',
  try: '#2DD4BF',
};

const EXPECTED_POSITIONS: Record<LaneNodeId, { x: number; y: number }> = {
  purpose: { x: 300, y: 380 },
  instructions: { x: 300, y: 550 },
  role: { x: 300, y: 720 },
  knowledge: { x: 560, y: 210 },
  tools: { x: 560, y: 380 },
  memory: { x: 560, y: 550 },
  credentials: { x: 560, y: 720 },
  samples: { x: 820, y: 210 },
  brain: { x: 820, y: 380 },
  context: { x: 820, y: 550 },
  brand: { x: 1080, y: 210 },
  guardrails: { x: 1080, y: 380 },
  budget: { x: 1080, y: 550 },
  try: { x: 1320, y: 210 },
  response: { x: 1320, y: 380 },
  evaluation: { x: 1320, y: 550 },
  ship: { x: 1320, y: 720 },
};

describe('lane model (v10 fixed topology)', () => {
  it('defines exactly 17 nodes and NODE_COUNT matches', () => {
    expect(LANE_NODE_IDS).toHaveLength(17);
    expect(new Set(LANE_NODE_IDS).size).toBe(17);
    expect(NODE_COUNT).toBe(17);
    expect(Object.keys(LANE_NODES)).toHaveLength(17);
  });

  it('labels the five lanes', () => {
    expect(LANE_META).toEqual({
      identity: { label: 'IDENTITY' },
      capabilities: { label: 'CAPABILITIES' },
      cognition: { label: 'COGNITION' },
      control: { label: 'CONTROL & STYLE' },
      delivery: { label: 'OUTPUT & DELIVERY' },
    });
  });

  it('pins every node color (C4 — kind colors unchanged)', () => {
    for (const id of LANE_NODE_IDS) {
      expect(LANE_NODES[id].color).toBe(EXPECTED_COLORS[id]);
    }
  });

  it('pins every canonical node position', () => {
    for (const id of LANE_NODE_IDS) {
      expect({ x: LANE_NODES[id].x, y: LANE_NODES[id].y }).toEqual(EXPECTED_POSITIONS[id]);
    }
  });

  it('keeps node x = lane origin + 20', () => {
    for (const id of LANE_NODE_IDS) {
      expect(LANE_NODES[id].x).toBe(LANE_X[LANE_NODES[id].lane] + 20);
    }
  });

  it('assigns every node to a lane and laneOf agrees', () => {
    const lanes: Record<LaneId, LaneNodeId[]> = {
      identity: ['purpose', 'instructions', 'role'],
      capabilities: ['knowledge', 'tools', 'memory', 'credentials'],
      cognition: ['samples', 'brain', 'context'],
      control: ['brand', 'guardrails', 'budget'],
      delivery: ['try', 'response', 'evaluation', 'ship'],
    };
    for (const [lane, ids] of Object.entries(lanes) as Array<[LaneId, LaneNodeId[]]>) {
      for (const id of ids) {
        expect(LANE_NODES[id].lane).toBe(lane);
        expect(laneOf(id)).toBe(lane);
      }
    }
  });

  it('gives every node a label and blurb', () => {
    for (const id of LANE_NODE_IDS) {
      expect(LANE_NODES[id].label.trim()).not.toBe('');
      expect(LANE_NODES[id].blurb.trim()).not.toBe('');
      expect(LANE_NODES[id].id).toBe(id);
    }
  });

  it('defines the five dashed lane hulls', () => {
    const origins: Record<LaneId, number> = {
      identity: 280,
      capabilities: 540,
      cognition: 800,
      control: 1060,
      delivery: 1300,
    };
    for (const [lane, x] of Object.entries(origins) as Array<[LaneId, number]>) {
      expect(LANE_HULLS[lane]).toEqual({ x, y: 168, w: 240, h: 668 });
    }
  });
});
