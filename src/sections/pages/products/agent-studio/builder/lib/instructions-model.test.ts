import { describe, expect, it } from 'vitest';
import {
  blankDocument,
  composeInstructions,
  countChars,
  ensureSingletons,
  estimateTokens,
  humanizeSlug,
  INSTRUCTIONS_LIMIT,
  isEmptyDocument,
  makeBlock,
  parseInstructions,
  type InstructionBlock,
} from './instructions-model';

const CANONICAL = `## Role
You are a billing concierge.

## Task
Resolve refund questions.

## Rules
- Never promise unverified refunds.
- Cite the policy section.

## Examples
### Example 1
User: refund?
Assistant: Checking policy §4.

### Late escalation
User: I want $900 back.
Assistant: Escalating to a human.

## Output
Verdict + section cite.

## Refusal
Over $500 → escalate.
`;

function bodies(blocks: InstructionBlock[]): Array<[string, string, string]> {
  return blocks.map((b) => [b.type, b.title, b.body]);
}

describe('instructions-model markers', () => {
  it('parses the canonical form with titles, rules, and numbered examples', () => {
    const blocks = parseInstructions(CANONICAL);
    expect(bodies(blocks)).toEqual([
      ['role', '', 'You are a billing concierge.'],
      ['task', '', 'Resolve refund questions.'],
      ['rule', '', 'Never promise unverified refunds.'],
      ['rule', '', 'Cite the policy section.'],
      ['example', 'Example 1', 'User: refund?\nAssistant: Checking policy §4.'],
      ['example', 'Late escalation', 'User: I want $900 back.\nAssistant: Escalating to a human.'],
      ['output', '', 'Verdict + section cite.'],
      ['refusal', '', 'Over $500 → escalate.'],
    ]);
  });

  it('round-trips composer output byte-identically', () => {
    expect(composeInstructions(parseInstructions(CANONICAL))).toBe(CANONICAL);
  });

  it('tolerates marker variants (case, colon, # depth, inline content)', () => {
    const blocks = parseInstructions('## RULES:\n- a\n# task: triage\n### Output\njson\n');
    expect(bodies(blocks)).toEqual([
      ['rule', '', 'a'],
      ['task', '', 'triage'],
      ['output', '', 'json'],
    ]);
    // …and re-emits canonical markers.
    expect(composeInstructions(blocks)).toBe('## Task\ntriage\n\n## Rules\n- a\n\n## Output\njson\n');
  });

  it('normalizes bullet variants and joins continuations (fixpoint)', () => {
    const messy = '## Rules\n* a\n• b\n1. c\n- [ ] d\ncontinued line\n';
    const once = parseInstructions(messy);
    expect(once.filter((b) => b.type === 'rule').map((b) => b.body)).toEqual([
      'a',
      'b',
      'c',
      'd continued line',
    ]);
    const twice = parseInstructions(composeInstructions(once));
    expect(bodies(twice)).toEqual(bodies(once));
  });

  it('preserves foreign prose byte-exactly as one trailing custom block', () => {
    const foreign = 'Just some prose about refunds.\n\nNo markers at all, with  trailing  spaces.';
    const blocks = parseInstructions(foreign);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('custom');
    expect(blocks[0].body).toBe(foreign);
  });

  it('collects preamble and unknown headers into custom, parsing known sections', () => {
    const text = 'Preamble here.\n\n## Mystery\nkept verbatim\n\n## Role\nConcierge.\n';
    const blocks = parseInstructions(text);
    expect(bodies(blocks)).toEqual([
      ['role', '', 'Concierge.'],
      ['custom', '', 'Preamble here.\n\n## Mystery\nkept verbatim'],
    ]);
  });

  it('treats fenced code as opaque (markers inside fences are content)', () => {
    const text = '## Role\nConcierge.\n\n```md\n## Not a section\n- not a rule\n```\n';
    const blocks = parseInstructions(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('role');
    expect(blocks[0].body).toContain('## Not a section');
    expect(composeInstructions(blocks)).toBe(text);
  });

  it('omits empty sections and merges duplicate singletons without loss', () => {
    const blocks = parseInstructions('## Role\nA.\n\n## Task\n\n## Role\nB.\n');
    expect(composeInstructions(blocks)).toBe('## Role\nA.\n\nB.\n');
  });

  it('handles CRLF, empty input, and renumbers examples on compose', () => {
    expect(parseInstructions('')).toEqual([]);
    expect(composeInstructions([])).toBe('');
    const blocks = parseInstructions('## Examples\n### Zed\nz\n### Alpha\na\n');
    expect(composeInstructions(blocks)).toBe('## Examples\n### Zed\nz\n\n### Alpha\na\n');
  });
});

describe('instructions-model document helpers', () => {
  it('blanks, emptiness, singletons, limits, estimates', () => {
    expect(INSTRUCTIONS_LIMIT).toBe(20000);
    expect(isEmptyDocument({ blocks: [] })).toBe(true);
    expect(isEmptyDocument(blankDocument())).toBe(true);
    const doc = blankDocument();
    expect(doc.blocks.map((b) => b.type)).toEqual(['role', 'task', 'output', 'refusal']);
    const withRule = { blocks: [...doc.blocks, makeBlock('rule', 'Be kind.')] };
    expect(isEmptyDocument(withRule)).toBe(false);
    expect(ensureSingletons([makeBlock('rule', 'x')]).map((b) => b.type)).toEqual([
      'role',
      'task',
      'rule',
      'output',
      'refusal',
    ]);
    expect(countChars(parseInstructions(CANONICAL))).toBe(CANONICAL.length);
    expect(estimateTokens(100)).toBe(25);
    expect(estimateTokens(101)).toBe(26);
    expect(humanizeSlug('support-triage')).toBe('Support Triage');
    expect(humanizeSlug('refund_policy_voice')).toBe('Refund Policy Voice');
  });
});
