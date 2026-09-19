import { describe, expect, it } from 'vitest';
import { deriveBottomAction, type BottomActionInput } from './bottom-action';

function base(overrides: Partial<BottomActionInput> = {}): BottomActionInput {
  return {
    mode: 'build',
    purposeValid: true,
    hasDraft: true,
    brainReady: true,
    instructionsEmpty: false,
    knowledgeAttention: null,
    selectedSkippableUntouched: false,
    selectedSlot: null,
    ...overrides,
  };
}

describe('deriveBottomAction (rules 1–4 + fallback)', () => {
  it('rule 1: pre-create owns the bar with Create', () => {
    const action = deriveBottomAction(base({ mode: 'new', purposeValid: false }));
    expect(action.primary).toEqual({ action: 'create' });
    expect(action.primaryLabel).toBe('Create agent');
    expect(action.showSkip).toBe(false);
  });

  it('rule 2: no draft selects brain', () => {
    const action = deriveBottomAction(base({ hasDraft: false, brainReady: false }));
    expect(action.primary).toEqual({ action: 'select', target: 'brain' });
    expect(action.primaryLabel).toBe('Start configuring');
    expect(action.whisper).toContain('No versions yet');
  });

  it('rule 3: invalid purpose selects purpose (order preserved past rule 2)', () => {
    const action = deriveBottomAction(base({ purposeValid: false }));
    expect(action.primary).toEqual({ action: 'select', target: 'purpose' });
  });

  it('rule 4: brain not ready selects brain with the shipping reason', () => {
    const action = deriveBottomAction(base({ brainReady: false }));
    expect(action.primary).toEqual({ action: 'select', target: 'brain' });
    expect(action.primaryLabel).toBe('Choose a model');
    expect(action.whisper).toContain('usable model');
  });

  it('rule 4b (C02): empty instructions select purpose with the publish reason', () => {
    const action = deriveBottomAction(base({ instructionsEmpty: true }));
    expect(action.primary).toEqual({ action: 'select', target: 'purpose' });
    expect(action.primaryLabel).toBe('Write instructions');
    expect(action.whisper).toContain('Publish refuses');
  });

  it('rule order holds: brain beats instructions (top-down, first match owns)', () => {
    const action = deriveBottomAction(base({ brainReady: false, instructionsEmpty: true }));
    expect(action.primary).toEqual({ action: 'select', target: 'brain' });
  });
  it('rule 4c (C05): knowledge attention selects knowledge with the verdict', () => {
    const action = deriveBottomAction(base({ knowledgeAttention: 'Unresolved pin ghost-slug — publish refuses' }));
    expect(action.primary).toEqual({ action: 'select', target: 'knowledge' });
    expect(action.primaryLabel).toBe('Review knowledge');
    expect(action.whisper).toBe('Unresolved pin ghost-slug — publish refuses');
  });

  it('rule order holds: instructions beat knowledge (top-down, first match owns)', () => {
    const action = deriveBottomAction(
      base({ instructionsEmpty: true, knowledgeAttention: 'Unresolved pin ghost-slug — publish refuses' }),
    );
    expect(action.primary).toEqual({ action: 'select', target: 'purpose' });
  });

  it('past the scaffold: Engine Room fallback keeps the single-action invariant', () => {
    const action = deriveBottomAction(base());
    expect(action.primary).toEqual({ action: 'engine-room' });
    expect(action.primaryLabel).toBe('Open in Engine Room');
    expect(action.whisper).toContain('passes land');
  });

  it('offers Skip only for a selected skippable untouched slot', () => {
    const withSkip = deriveBottomAction(
      base({ hasDraft: false, brainReady: false, selectedSkippableUntouched: true, selectedSlot: 'sat:memory' }),
    );
    expect(withSkip.showSkip).toBe(true);
    expect(withSkip.skipTarget).toBe('sat:memory');
    // …and still owns the primary (rule 2 wins the bar, skip stays secondary).
    expect(withSkip.primary).toEqual({ action: 'select', target: 'brain' });
    expect(deriveBottomAction(base()).showSkip).toBe(false);
  });
});
