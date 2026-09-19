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
    satellites: [],
    positions: {},
    skipped: [],
    paletteFilter: null,
  });
});

describe('builder UI store', () => {
  it('hydrates defaults for a new agent and isolates agents', () => {
    const a = freshAgent();
    useBuilderUI.getState().hydrate(a);
    expect(useBuilderUI.getState().satellites.map((s) => s.kind)).toEqual([
      'knowledge',
      'tools',
      'memory',
      'guardrails',
      'evaluation',
      'brand',
      'budget',
      null,
    ]);
    useBuilderUI.getState().toggleSkip('sat:memory');
    const b = freshAgent();
    useBuilderUI.getState().hydrate(b);
    expect(useBuilderUI.getState().skipped).toEqual([]);
    useBuilderUI.getState().hydrate(a);
    expect(useBuilderUI.getState().skipped).toEqual(['sat:memory']);
  });

  it('adds empty satellites and binds with singleton enforcement', () => {
    useBuilderUI.getState().hydrate(freshAgent());
    const id = useBuilderUI.getState().addSatellite();
    // knowledge is already bound by the default set → duplicate, never cloned.
    expect(useBuilderUI.getState().bindSatellite(id, 'knowledge')).toBe('duplicate');
    // Bound satellites refuse deletion while configured…
    expect(useBuilderUI.getState().deleteSatellite('sat:knowledge')).toBe(false);
    // …but a bound-but-EMPTY kind may leave the working set (rail re-summons),
    // which frees the kind for the empty card.
    expect(useBuilderUI.getState().deleteSatellite('sat:knowledge', { draftEmpty: true })).toBe(true);
    expect(useBuilderUI.getState().bindSatellite(id, 'knowledge')).toBe('ok');
    // …and an empty card deletes cleanly.
    const spare = useBuilderUI.getState().addSatellite();
    expect(useBuilderUI.getState().deleteSatellite(spare)).toBe(true);
    expect(useBuilderUI.getState().bindSatellite(spare, 'knowledge')).toBe('missing');
  });

  it('refuses re-typing an occupied satellite without force', () => {
    useBuilderUI.getState().hydrate(freshAgent());
    // Free the memory kind first so the force-rebind has a legal target.
    expect(useBuilderUI.getState().deleteSatellite('sat:memory', { draftEmpty: true })).toBe(true);
    // sat:tools is bound-but-empty: occupied without force…
    expect(useBuilderUI.getState().bindSatellite('sat:tools', 'memory')).toBe('occupied');
    // …rebindable with force (the caller verified the draft kind is empty).
    expect(useBuilderUI.getState().bindSatellite('sat:tools', 'memory', { force: true })).toBe('ok');
    // Singleton still holds: a newcomer cannot take the rebound kind.
    const id = useBuilderUI.getState().addSatellite();
    expect(useBuilderUI.getState().bindSatellite(id, 'memory')).toBe('duplicate');
  });

  it('rejects untrusted kinds before they reach the projector', () => {
    useBuilderUI.getState().hydrate(freshAgent());
    const id = useBuilderUI.getState().addSatellite();
    expect(useBuilderUI.getState().bindSatellite(id, 'rm -rf' as never)).toBe('invalid');
    expect(useBuilderUI.getState().satellites.find((s) => s.id === id)?.kind).toBe(null);
  });

  it('persists positions/skips and tidies back to canonical', () => {
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
});
