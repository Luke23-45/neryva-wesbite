import { describe, expect, it } from 'vitest';
import { buildCase, splitCaseLines, EMPTY_CASE } from './eval-cases';

describe('buildCase (HTTP case vocabulary)', () => {
  it('builds a minimal text-only case', () => {
    const result = buildCase({ ...EMPTY_CASE, text: 'What is the refund window?' });
    expect(result.problem).toBeUndefined();
    expect(result.body).toEqual({ input: { text: 'What is the refund window?' } });
  });

  it('builds lexical assertions + rubric with caps', () => {
    const result = buildCase({
      ...EMPTY_CASE,
      text: 'Hi',
      contains: 'hello\nworld',
      notContains: 'bye',
      stateAssertions: 'a\nb',
      documentIds: '12345678-1234-1234-1234-1234567890ab',
      rubricInstructions: 'Be nice',
      minScore: '0.9',
    });
    expect(result.problem).toBeUndefined();
    expect(result.body).toMatchObject({
      input: { text: 'Hi' },
      expected: {
        contains: ['hello', 'world'],
        not_contains: ['bye'],
        state_assertions: ['a', 'b'],
        document_ids: ['12345678-1234-1234-1234-1234567890ab'],
      },
      rubric: { instructions: 'Be nice', min_score: 0.9 },
    });
  });

  it('refuses empty text, oversize text, bad uuids, bad scores', () => {
    expect(buildCase({ ...EMPTY_CASE }).problem).toMatch(/required/);
    expect(buildCase({ ...EMPTY_CASE, text: 'x'.repeat(8193) }).problem).toMatch(/8192/);
    expect(buildCase({ ...EMPTY_CASE, text: 'Hi', documentIds: 'nope' }).problem).toMatch(/uuid/);
    expect(buildCase({ ...EMPTY_CASE, text: 'Hi', rubricInstructions: 'Judge', minScore: '2' }).problem).toMatch(/0–1/);
    expect(buildCase({ ...EMPTY_CASE, text: 'Hi', minScore: '0.5' }).problem).toMatch(/instructions/);
  });

  it('never emits template-vocabulary keys', () => {
    const result = buildCase({ ...EMPTY_CASE, text: 'Hi', contains: 'a' });
    const json = JSON.stringify(result.body);
    expect(json).not.toContain('expected_behavior');
    expect(json).not.toContain('must_not');
    expect(json).not.toContain('tools_expected');
  });
});

describe('splitCaseLines', () => {
  it('trims and drops blanks', () => {
    expect(splitCaseLines(' a \n\nb\n ')).toEqual(['a', 'b']);
  });
});
