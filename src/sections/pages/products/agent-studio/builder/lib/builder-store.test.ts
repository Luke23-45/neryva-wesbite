import { beforeEach, describe, expect, it } from 'vitest';
import { useBuilderUI } from './builder-store';

let agentSeq = 0;
function freshAgent(): string {
  agentSeq += 1;
  return `builder-store-test-${agentSeq}`;
}

beforeEach(() => {
  window.localStorage.clear();
  useBuilderUI.setState({
    agentId: null,
    selectedId: null,
    positions: {},
    paletteFilter: null,
  });
});

describe('builder UI store (v10 fixed topology)', () => {
  it('hydrates defaults for a new agent and isolates agents', () => {
    const a = freshAgent();
    useBuilderUI.getState().hydrate(a);
    expect(useBuilderUI.getState().agentId).toBe(a);
    expect(useBuilderUI.getState().selectedId).toBeNull();
    expect(useBuilderUI.getState().positions).toEqual({});
    // Selection is per-agent UI state — hydrating another agent resets it.
    useBuilderUI.getState().select('brain');
    const b = freshAgent();
    useBuilderUI.getState().hydrate(b);
    expect(useBuilderUI.getState().selectedId).toBeNull();
    useBuilderUI.getState().hydrate(a);
    expect(useBuilderUI.getState().selectedId).toBeNull();
  });

  it('selects and deselects node ids', () => {
    useBuilderUI.getState().hydrate(freshAgent());
    useBuilderUI.getState().select('instructions');
    expect(useBuilderUI.getState().selectedId).toBe('instructions');
    useBuilderUI.getState().select(null);
    expect(useBuilderUI.getState().selectedId).toBeNull();
  });

  it('persists positions and tidies back to canonical', () => {
    const agent = freshAgent();
    useBuilderUI.getState().hydrate(agent);
    useBuilderUI.getState().setPosition('brain', { x: 11, y: 22 });
    useBuilderUI.getState().persistPositions();
    useBuilderUI.getState().hydrate(freshAgent());
    useBuilderUI.getState().hydrate(agent);
    expect(useBuilderUI.getState().positions.brain).toEqual({ x: 11, y: 22 });
    useBuilderUI.getState().tidy();
    expect(useBuilderUI.getState().positions).toEqual({});
  });

  it('tracks the palette filter', () => {
    useBuilderUI.getState().hydrate(freshAgent());
    expect(useBuilderUI.getState().paletteFilter).toBeNull();
    useBuilderUI.getState().setPaletteFilter('tools');
    expect(useBuilderUI.getState().paletteFilter).toBe('tools');
    useBuilderUI.getState().setPaletteFilter(null);
    expect(useBuilderUI.getState().paletteFilter).toBeNull();
  });
});
