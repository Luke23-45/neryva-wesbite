import { describe, expect, it } from 'vitest';
import { EVAL_DATASET_NAME_MAX, EVAL_DATASET_DESC_MAX } from './useSetupEval';

/**
 * E-02: the console's dataset name/description input caps must stay identical
 * to the engine's silent truncation bounds — `eval.service.ts`:
 * `name.trim().slice(0, 128)` and `description?.slice(0, 2048)`.
 * If the engine bounds ever change, these constants (and the DatasetModal
 * inputs that consume them) must move with them — this test is the tripwire.
 */
describe('eval dataset length limits (E-02)', () => {
  it('matches the engine name truncation bound', () => {
    expect(EVAL_DATASET_NAME_MAX).toBe(128);
  });

  it('matches the engine description truncation bound', () => {
    expect(EVAL_DATASET_DESC_MAX).toBe(2048);
  });
});
