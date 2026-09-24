/**
 * Eval case builder (G8) — form state → HTTP-vocabulary case bodies
 * (engine evalCaseSchema, strict). Extracted from the evaluations view so
 * the translation is unit-tested: input.text required; expected carries
 * contains/not_contains/state_assertions/document_ids (capped, uuid-checked);
 * rubric carries instructions + 0–1 min_score. Unknown keys never emitted.
 */

export interface CaseDraft {
  text: string;
  contains: string;
  notContains: string;
  stateAssertions: string;
  documentIds: string;
  rubricInstructions: string;
  minScore: string;
}

export const EMPTY_CASE: CaseDraft = {
  text: '',
  contains: '',
  notContains: '',
  stateAssertions: '',
  documentIds: '',
  rubricInstructions: '',
  minScore: '',
};

export function splitCaseLines(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Builds a draft prefilled from a listed engine case (A4-41 edit flow). */
export function draftFromCase(c: {
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
  rubric: Record<string, unknown> | null;
}): CaseDraft {
  const lines = (v: unknown): string =>
    Array.isArray(v) ? v.map((x) => String(x)).join('\n') : '';
  const rubric = c.rubric ?? {};
  const minScore = typeof rubric.min_score === 'number' ? String(rubric.min_score) : '';
  return {
    text: typeof c.input.text === 'string' ? c.input.text : '',
    contains: lines(c.expected.contains),
    notContains: lines(c.expected.not_contains),
    stateAssertions: lines(c.expected.state_assertions),
    documentIds: lines(c.expected.document_ids),
    rubricInstructions: typeof rubric.instructions === 'string' ? rubric.instructions : '',
    minScore,
  };
}

/** Builds one HTTP-vocabulary case body, or the reason it cannot be built. */
export function buildCase(draft: CaseDraft): { body?: Record<string, unknown>; problem?: string } {
  const text = draft.text.trim();
  if (!text) {
    return { problem: 'Case text is required (1–8192 chars).' };
  }
  if (text.length > 8192) {
    return { problem: 'Case text must be ≤ 8192 chars.' };
  }
  const body: Record<string, unknown> = { input: { text } };
  const expected: Record<string, unknown> = {};
  const contains = splitCaseLines(draft.contains);
  const notContains = splitCaseLines(draft.notContains);
  const assertions = splitCaseLines(draft.stateAssertions);
  const docIds = splitCaseLines(draft.documentIds);
  if (contains.length > 0) {
    expected.contains = contains.slice(0, 20);
  }
  if (notContains.length > 0) {
    expected.not_contains = notContains.slice(0, 20);
  }
  if (assertions.length > 0) {
    expected.state_assertions = assertions.slice(0, 20);
  }
  if (docIds.length > 0) {
    const bad = docIds.find((id) => !UUID_RE.test(id));
    if (bad) {
      return { problem: `Document ids must be uuids — "${bad.slice(0, 24)}" is not.` };
    }
    expected.document_ids = docIds.slice(0, 20);
  }
  if (Object.keys(expected).length > 0) {
    body.expected = expected;
  }
  if (draft.rubricInstructions.trim() || draft.minScore.trim()) {
    const instructions = draft.rubricInstructions.trim();
    if (!instructions) {
      return { problem: 'Rubric needs instructions when a minimum score is set.' };
    }
    if (instructions.length > 2048) {
      return { problem: 'Rubric instructions must be ≤ 2048 chars.' };
    }
    const min = draft.minScore.trim() === '' ? 0.7 : Number(draft.minScore);
    if (!Number.isFinite(min) || min < 0 || min > 1) {
      return { problem: 'Minimum score must be 0–1.' };
    }
    body.rubric = { instructions, min_score: min };
  }
  return { body };
}
