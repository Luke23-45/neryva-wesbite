// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  BLOCK_ID_PATTERN,
  INSTRUCTIONS_BLOCK_MAX_LENGTH,
  INSTRUCTIONS_COMPILED_MAX_BYTES,
  INSTRUCTIONS_SCHEMA_VERSION,
  blankInstructionsV1,
  clientSaveBlockers,
  countNonEmptyBlocks,
  ensureSingletonsV1,
  estimateTokens,
  generateBlockId,
  humanizeSlug,
  isEmptyDocumentV1,
  isValidBlockId,
  isValidMode,
  jsonBlockError,
  makeRepeatableBlock,
  normalizeDocumentForSave,
  type ExampleBlock,
  type InstructionsV1,
  type RepeatableBlock,
} from './instructions-v1';

const ID_PATTERN = /^ins_[A-Za-z0-9]{12}$/;

function rule(content: string, mode: 'raw' | 'markdown' | 'json' = 'markdown'): RepeatableBlock {
  return { id: generateBlockId(), mode, content };
}

describe('generateBlockId', () => {
  it('mints IDs in the contract ins_* format', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(generateBlockId()).toMatch(ID_PATTERN);
      expect(generateBlockId()).toMatch(BLOCK_ID_PATTERN);
    }
  });

  it('mints 200 unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 200; i += 1) ids.add(generateBlockId());
    expect(ids.size).toBe(200);
  });
});

describe('isValidBlockId / isValidMode', () => {
  it('accepts well-formed IDs and modes', () => {
    expect(isValidBlockId('ins_abcDEF123456')).toBe(true);
    expect(isValidMode('raw')).toBe(true);
    expect(isValidMode('markdown')).toBe(true);
    expect(isValidMode('json')).toBe(true);
  });

  it('rejects malformed IDs and modes', () => {
    expect(isValidBlockId('')).toBe(false);
    expect(isValidBlockId('ins_short')).toBe(false);
    expect(isValidBlockId('ins_abcDEF1234567')).toBe(false);
    expect(isValidBlockId('blk_abcDEF123456')).toBe(false);
    expect(isValidBlockId('ins_abc-def_1234')).toBe(false);
    expect(isValidMode('')).toBe(false);
    expect(isValidMode('yaml')).toBe(false);
    expect(isValidMode('Markdown')).toBe(false);
  });
});

describe('contract constants', () => {
  it('mirrors the contract schema constants', () => {
    expect(INSTRUCTIONS_SCHEMA_VERSION).toBe(1);
    expect(INSTRUCTIONS_BLOCK_MAX_LENGTH).toBe(16 * 1024);
    expect(INSTRUCTIONS_COMPILED_MAX_BYTES).toBe(32 * 1024);
  });
});

describe('blankInstructionsV1', () => {
  it('builds a blank schemaVersion-1 document', () => {
    const doc = blankInstructionsV1();
    expect(doc.schemaVersion).toBe(1);
    for (const kind of ['role', 'objective', 'output', 'refusal'] as const) {
      expect(doc[kind]).toEqual({ mode: 'markdown', content: '' });
    }
    expect(doc.rules).toEqual([]);
    expect(doc.examples).toEqual([]);
    expect(doc.custom).toEqual([]);
  });
});

describe('ensureSingletonsV1', () => {
  it('fills a missing singleton without touching existing content', () => {
    const doc = blankInstructionsV1();
    doc.objective = undefined;
    doc.role = { mode: 'raw', content: 'Concierge.' };
    const fixed = ensureSingletonsV1(doc);
    expect(fixed.objective).toEqual({ mode: 'markdown', content: '' });
    expect(fixed.role).toEqual({ mode: 'raw', content: 'Concierge.' });
  });

  it('defaults missing repeatable lists to []', () => {
    const sparse = { schemaVersion: 1 } as unknown as InstructionsV1;
    const fixed = ensureSingletonsV1(sparse);
    expect(fixed.rules).toEqual([]);
    expect(fixed.examples).toEqual([]);
    expect(fixed.custom).toEqual([]);
    expect(fixed.role).toEqual({ mode: 'markdown', content: '' });
  });
});

describe('isEmptyDocumentV1 / countNonEmptyBlocks', () => {
  it('treats a blank document as empty with count 0', () => {
    const doc = blankInstructionsV1();
    expect(isEmptyDocumentV1(doc)).toBe(true);
    expect(countNonEmptyBlocks(doc)).toBe(0);
  });

  it('treats whitespace-only content as blank', () => {
    const doc = blankInstructionsV1();
    doc.role = { mode: 'markdown', content: '   \n\t ' };
    doc.rules = [rule('  ')];
    expect(isEmptyDocumentV1(doc)).toBe(true);
    expect(countNonEmptyBlocks(doc)).toBe(0);
  });

  it('counts one filled rule as one non-empty block', () => {
    const doc = blankInstructionsV1();
    doc.rules = [rule('Be kind.'), rule('   ')];
    expect(isEmptyDocumentV1(doc)).toBe(false);
    expect(countNonEmptyBlocks(doc)).toBe(1);
  });

  it('counts singletons and repeatable blocks together', () => {
    const doc = blankInstructionsV1();
    doc.role = { mode: 'markdown', content: 'Concierge.' };
    doc.rules = [rule('Be kind.')];
    doc.custom = [{ id: generateBlockId(), mode: 'raw', content: 'x' }];
    expect(countNonEmptyBlocks(doc)).toBe(3);
  });
});

describe('jsonBlockError', () => {
  it('returns null for empty or valid JSON', () => {
    expect(jsonBlockError('')).toBeNull();
    expect(jsonBlockError('   ')).toBeNull();
    expect(jsonBlockError('{"a": 1}')).toBeNull();
    expect(jsonBlockError('[1, 2]')).toBeNull();
  });

  it('returns a message for invalid JSON', () => {
    const err = jsonBlockError('{oops');
    expect(typeof err).toBe('string');
    expect((err as string).length).toBeGreaterThan(0);
  });
});

describe('normalizeDocumentForSave', () => {
  it('pins schemaVersion 1 and defaults missing lists', () => {
    const raw = { schemaVersion: 99, role: { mode: 'raw', content: 'x' } } as unknown as InstructionsV1;
    const clean = normalizeDocumentForSave(raw);
    expect(clean.schemaVersion).toBe(1);
    expect(clean.rules).toEqual([]);
    expect(clean.examples).toEqual([]);
    expect(clean.custom).toEqual([]);
    expect(clean.role).toEqual({ mode: 'raw', content: 'x' });
  });

  it('strips unknown top-level keys', () => {
    const raw = { ...blankInstructionsV1(), bogus: 'nope', nested: { a: 1 } } as unknown as Record<string, unknown>;
    const clean = normalizeDocumentForSave(raw as unknown as InstructionsV1);
    expect(clean).not.toHaveProperty('bogus');
    expect(clean).not.toHaveProperty('nested');
    expect(Object.keys(clean).sort()).toEqual(
      ['custom', 'examples', 'objective', 'output', 'refusal', 'role', 'rules', 'schemaVersion'].sort(),
    );
  });

  it('preserves a valid example title and truncates one over 200 chars', () => {
    const doc = blankInstructionsV1();
    const longTitle = 't'.repeat(250);
    doc.examples = [
      { id: generateBlockId(), mode: 'markdown', content: 'a', title: 'Fine title' },
      { id: generateBlockId(), mode: 'markdown', content: 'b', title: longTitle },
    ];
    const clean = normalizeDocumentForSave(doc);
    expect((clean.examples[0] as ExampleBlock).title).toBe('Fine title');
    expect((clean.examples[1] as ExampleBlock).title).toHaveLength(200);
  });

  it('keeps valid block IDs and mints replacements for blank ones', () => {
    const doc = blankInstructionsV1();
    const valid = generateBlockId();
    doc.rules = [
      { id: valid, mode: 'markdown', content: 'a' },
      { id: '', mode: 'markdown', content: 'b' },
    ];
    const clean = normalizeDocumentForSave(doc);
    expect(clean.rules[0].id).toBe(valid);
    expect(clean.rules[1].id).toMatch(ID_PATTERN);
    expect(clean.rules[1].id).not.toBe(valid);
  });

  it('repairs an invalid mode instead of passing it through', () => {
    const doc = blankInstructionsV1();
    doc.role = { mode: 'yaml', content: 'x' } as unknown as { mode: 'markdown'; content: string };
    const clean = normalizeDocumentForSave(doc);
    expect(clean.role?.mode).toBe('markdown');
  });
});

describe('clientSaveBlockers', () => {
  it('returns [] for a clean document', () => {
    const doc = blankInstructionsV1();
    doc.role = { mode: 'markdown', content: 'Concierge.' };
    doc.rules = [rule('Be kind.')];
    doc.examples = [{ id: generateBlockId(), mode: 'json', content: '{"in":"hi","out":"hello"}', title: 'Greeting' }];
    expect(clientSaveBlockers(doc)).toEqual([]);
  });

  it('flags invalid JSON in a json-mode block, naming the block', () => {
    const doc = blankInstructionsV1();
    doc.rules = [rule('{broken', 'json')];
    const blockers = clientSaveBlockers(doc);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain('Rules #1');
    expect(blockers[0]).toContain('Not valid JSON');
  });

  it('flags invalid JSON in a json-mode singleton by label', () => {
    const doc = blankInstructionsV1();
    doc.output = { mode: 'json', content: 'nope' };
    const blockers = clientSaveBlockers(doc);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain('Output');
  });

  it('does not flag invalid content in non-json modes', () => {
    const doc = blankInstructionsV1();
    doc.rules = [rule('{not json at all', 'markdown')];
    expect(clientSaveBlockers(doc)).toEqual([]);
  });

  it('flags content over the 16 KiB block cap', () => {
    const doc = blankInstructionsV1();
    doc.rules = [rule('x'.repeat(INSTRUCTIONS_BLOCK_MAX_LENGTH + 1))];
    const blockers = clientSaveBlockers(doc);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain('16 KiB');
  });

  it('flags duplicate IDs across the rules and custom lists', () => {
    const doc = blankInstructionsV1();
    const dup = generateBlockId();
    doc.rules = [{ id: dup, mode: 'markdown', content: 'a' }];
    doc.custom = [{ id: dup, mode: 'markdown', content: 'b' }];
    const blockers = clientSaveBlockers(doc);
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain(dup);
    expect(blockers[0]).toContain('Rules #1');
    expect(blockers[0]).toContain('Custom #1');
  });
});

describe('makeRepeatableBlock', () => {
  it('returns a format-valid ID with the requested mode and content', () => {
    const block = makeRepeatableBlock('rules', 'Be kind.', 'raw');
    expect(block.id).toMatch(ID_PATTERN);
    expect(block.mode).toBe('raw');
    expect(block.content).toBe('Be kind.');
  });

  it('defaults to markdown mode', () => {
    expect(makeRepeatableBlock('custom', 'x').mode).toBe('markdown');
  });

  it('preserves a trimmed title on examples', () => {
    const block = makeRepeatableBlock('examples', 'content', 'markdown', '  Greeting  ') as ExampleBlock;
    expect(block.title).toBe('Greeting');
  });

  it('truncates an over-long example title to 200 chars', () => {
    const block = makeRepeatableBlock('examples', 'content', 'markdown', 't'.repeat(250)) as ExampleBlock;
    expect(block.title).toHaveLength(200);
  });

  it('omits the title key entirely for rules', () => {
    const block = makeRepeatableBlock('rules', 'Be kind.', 'markdown', 'ignored');
    expect('title' in block).toBe(false);
  });
});

describe('small helpers', () => {
  it('estimateTokens uses the 4-chars-per-token heuristic', () => {
    expect(estimateTokens(0)).toBe(0);
    expect(estimateTokens(4)).toBe(1);
    expect(estimateTokens(5)).toBe(2);
  });

  it('humanizeSlug turns slugs into labels', () => {
    expect(humanizeSlug('customer-support')).toBe('Customer Support');
    expect(humanizeSlug('sales_rep')).toBe('Sales Rep');
  });
});
