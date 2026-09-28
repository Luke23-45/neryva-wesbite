// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Position, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import { DataEdge } from './DataEdge';
import { CanvasSlotNode, type RuntimeSlotNodeData } from '../nodes/SlotNode';
import type { BuilderEdge, BuilderNode } from '../../lib/projector';

/**
 * jsdom has no layout, so React Flow can never measure nodes or handles
 * there. The v12 `measured` + `handles` node props declare the geometry the
 * real browser produces (200×100 card, edge anchors at the card's vertical
 * midline) — the same contract the invisible CanvasSlotNode handles satisfy
 * in production.
 */
function slotNode(id: string, title: string): BuilderNode {
  const data: RuntimeSlotNodeData = {
    slotKey: id,
    nodeType: 'satellite',
    kind: null,
    title,
    subtitle: null,
    hint: null,
    status: 'untouched',
    selected: false,
    lock: false,
    color: '#818CF8',
    portColor: null,
    lane: 'cognition',
  };
  return {
    id,
    type: 'slot',
    position: { x: id === 'a' ? 0 : 400, y: 0 },
    measured: { width: 200, height: 100 },
    handles: [
      { id: 'in', type: 'target', position: Position.Left, x: 0, y: 50 },
      { id: 'out', type: 'source', position: Position.Right, x: 200, y: 50 },
    ],
    data,
  };
}

function renderEdges(edges: BuilderEdge[]) {
  return render(
    <ReactFlowProvider>
      <div style={{ width: 800, height: 600 }}>
        <ReactFlow
          nodes={[slotNode('a', 'A'), slotNode('b', 'B')]}
          edges={edges}
          nodeTypes={{ slot: CanvasSlotNode }}
          edgeTypes={{ data: DataEdge }}
        />
      </div>
    </ReactFlowProvider>,
  );
}

const labeledEdge: BuilderEdge = {
  id: 'e-spend',
  source: 'a',
  target: 'b',
  type: 'data',
  data: { variant: 'verdict', lit: false, label: 'spend cap' },
};

describe('DataEdge', () => {
  it('renders data.label as an italic midpoint label on dashed semantic edges', async () => {
    const { container } = renderEdges([labeledEdge]);
    const label = await screen.findByText('spend cap');
    expect(label).toBeTruthy();
    expect(label.className).toContain('data-edge-label');
    expect(getComputedStyle(label).fontStyle).toBe('italic');
    // The dashed semantic variant is preserved alongside the label.
    const path = container.querySelector('path[id="e-spend"]');
    expect(path?.getAttribute('stroke-dasharray')).toBe('5 4');
  });

  it('renders no label element when the edge carries none', async () => {
    const { container } = renderEdges([
      { id: 'e-flow', source: 'a', target: 'b', type: 'data', data: { variant: 'flow', lit: true } },
    ]);
    // Wait until the edge has painted, then assert the label's absence.
    await waitFor(() => expect(container.querySelector('path[id="e-flow"]')).toBeTruthy());
    expect(container.querySelector('.data-edge-label')).toBeNull();
  });
});
