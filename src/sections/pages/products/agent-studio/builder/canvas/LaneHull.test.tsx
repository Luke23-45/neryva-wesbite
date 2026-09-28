// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import type { NodeProps } from '@xyflow/react';
import { LANE_NODE_TYPE, LaneNode, toLaneNodes, type LaneHullGeom } from './LaneHull';

const HULLS: LaneHullGeom[] = [
  { id: 'identity', label: 'IDENTITY', x: -560, y: -80, width: 320, height: 420 },
  { id: 'output', label: 'OUTPUT & DELIVERY', x: 560, y: -80, width: 320, height: 420 },
];

describe('toLaneNodes', () => {
  it('builds non-interactive lane nodes that sit behind the slot nodes', () => {
    const nodes = toLaneNodes(HULLS);
    expect(nodes.length).toBe(2);
    for (const node of nodes) {
      expect(node.type).toBe(LANE_NODE_TYPE);
      expect(node.selectable).toBe(false);
      expect(node.draggable).toBe(false);
      expect(node.zIndex).toBeLessThan(0);
    }
    expect(nodes[0].id).toBe('lane:identity');
    expect(nodes[0].position).toEqual({ x: -560, y: -80 });
    expect(nodes[1].id).toBe('lane:output');
  });

  it('builds zero nodes from zero hulls (never invents geometry)', () => {
    expect(toLaneNodes([])).toEqual([]);
  });
});

describe('LaneNode', () => {
  it('renders the dashed hull with its label', () => {
    const [node] = toLaneNodes(HULLS);
    render(
      <ThemeProvider theme={theme}>
        <LaneNode {...({ id: node.id, data: node.data } as unknown as NodeProps)} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('lane-hull-identity')).toBeTruthy();
    expect(screen.getByText('IDENTITY')).toBeTruthy();
    const rect = document.querySelector('[data-testid="lane-hull-identity"] rect');
    expect(rect?.getAttribute('stroke-dasharray')).toBe('3 3');
    expect(rect?.getAttribute('rx')).toBe('14');
  });
});
