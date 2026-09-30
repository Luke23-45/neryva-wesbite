/**
 * Structured Instructions v1 — website-side wire/type mirror.
 *
 * This file mirrors `@neryva/mcp-contract`'s `neryva-instructions-v1`
 * schema (`schema.ts`) as plain TypeScript types plus browser-safe helpers.
 * Contract truth lives in the contract package; this file exists so the
 * Agent Studio composer can speak the same document shape without importing
 * Node-only code (the contract's `generateBlockId` uses Node `randomBytes`).
 *
 * HARD RULE: the browser NEVER compiles a document. Preview text comes only
 * from the engine (`POST …/instructions/preview`); the final compiled prompt
 * comes only from the engine's PUT response. Any drift between this mirror
 * and the contract schema surfaces as a server 400 — never as silent
 * client-side "compilation".
 *
 * Mirrored constants (must match the contract):
 * - schemaVersion: 1
 * - modes: 'raw' | 'markdown' | 'json'
 * - block IDs: `ins_` + 12 chars from [A-Za-z0-9]
 * - per-block content cap: 16 KiB
 * - compiled output cap: 32 KiB (server-enforced; the client budget bar
 *   measures the last server preview, never a local guess)
 */

/** Authoring mode for a single block. The schema permits JSON on every block; the UI exposes it only where useful. */
export type InstructionMode = 'raw' | 'markdown' | 'json';

export const INSTRUCTION_MODES: readonly InstructionMode[] = ['raw', 'markdown', 'json'] as const;

/** A singleton block (role / objective / output / refusal): mode + content, no ID. */
export interface SingletonBlock {
  mode: InstructionMode;
  content: string;
}

/** A repeatable block (rules / examples / custom): opaque server-format ID + mode + content. */
export interface RepeatableBlock {
  id: string;
  mode: InstructionMode;
  content: string;
}

/** An example block may carry an optional display title (≤200 chars). */
export interface ExampleBlock extends RepeatableBlock {
  title?: string;
}

/** Canonical Instructions v1 document. Unknown keys are stripped by the server on read; writers pin schemaVersion: 1. */
export interface InstructionsV1 {
  schemaVersion: 1;
  role?: SingletonBlock;
  objective?: SingletonBlock;
  output?: SingletonBlock;
  refusal?: SingletonBlock;
  rules: RepeatableBlock[];
  examples: ExampleBlock[];
  custom: RepeatableBlock[];
}

export const INSTRUCTIONS_SCHEMA_VERSION = 1 as const;

/** Per-block content cap, mirrored from the contract (16 KiB). The server 400s past it. */
export const INSTRUCTIONS_BLOCK_MAX_LENGTH = 16 * 1024;

/** Compiled-output cap, mirrored from the contract (32 KiB). Server-enforced. */
export const INSTRUCTIONS_COMPILED_MAX_BYTES = 32 * 1024;

/** Block-ID shape, mirrored from the contract: `ins_` + 12 alphanumerics. */
export const BLOCK_ID_PATTERN = /^ins_[A-Za-z0-9]{12}$/;

const BLOCK_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Mint an opaque `ins_*` block ID (browser-safe mirror of the contract's
 * `generateBlockId`: same `ins_` prefix, same 12-char [A-Za-z0-9] alphabet,
 * crypto-random via `crypto.getRandomValues`). IDs minted here are
 * format-valid per the contract schema; the server still rejects duplicates
 * across the document's three repeatable lists.
 */
export function generateBlockId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const byte of bytes) {
    suffix += BLOCK_ID_ALPHABET[byte % BLOCK_ID_ALPHABET.length];
  }
  return `ins_${suffix}`;
}

export function isValidBlockId(id: string): boolean {
  return BLOCK_ID_PATTERN.test(id);
}

export function isValidMode(mode: string): mode is InstructionMode {
  return mode === 'raw' || mode === 'markdown' || mode === 'json';
}

/** Singleton slots in canonical compiler order. */
export type SingletonKind = 'role' | 'objective' | 'output' | 'refusal';

/** Repeatable slots in canonical compiler order. */
export type RepeatableKind = 'rules' | 'examples' | 'custom';

export type InstructionBlockKind = SingletonKind | RepeatableKind;

export const SINGLETON_KINDS: readonly SingletonKind[] = ['role', 'objective', 'output', 'refusal'] as const;
export const REPEATABLE_KINDS: readonly RepeatableKind[] = ['rules', 'examples', 'custom'] as const;

export const BLOCK_LABELS: Record<InstructionBlockKind, string> = {
  role: 'Role',
  objective: 'Objective',
  rules: 'Rules',
  examples: 'Examples',
  output: 'Output',
  refusal: 'Refusal',
  custom: 'Custom',
};

/** Short authoring guidance per slot, shown under each block header. */
export const BLOCK_HINTS: Record<InstructionBlockKind, string> = {
  role: 'Who the agent is — persona, voice, and stance.',
  objective: 'The job to be done — what success looks like.',
  rules: 'What the agent must always do, must never do, or should do under specific conditions.',
  examples: 'Show, don’t just tell — a few input/output pairs worth imitating.',
  output: 'The shape of the answer — format, length, and structure.',
  refusal: 'When to say no — and what to say instead.',
  custom: 'Anything that doesn’t fit above — appended last, in order.',
};

/** A blank singleton block. Markdown is the default authoring mode. */
export function blankSingleton(): SingletonBlock {
  return { mode: 'markdown', content: '' };
}

/** A blank document: all four singletons present (empty), repeatable lists empty. */
export function blankInstructionsV1(): InstructionsV1 {
  return {
    schemaVersion: INSTRUCTIONS_SCHEMA_VERSION,
    role: blankSingleton(),
    objective: blankSingleton(),
    output: blankSingleton(),
    refusal: blankSingleton(),
    rules: [],
    examples: [],
    custom: [],
  };
}

/**
 * Fill any missing singleton slots (documents read from the server may omit
 * empty singletons). Never touches repeatable lists or existing content.
 */
export function ensureSingletonsV1(doc: InstructionsV1): InstructionsV1 {
  return {
    ...doc,
    role: doc.role ?? blankSingleton(),
    objective: doc.objective ?? blankSingleton(),
    output: doc.output ?? blankSingleton(),
    refusal: doc.refusal ?? blankSingleton(),
    rules: doc.rules ?? [],
    examples: doc.examples ?? [],
    custom: doc.custom ?? [],
  };
}

/** True when every block in the document is blank (whitespace-only counts as blank). */
export function isEmptyDocumentV1(doc: InstructionsV1): boolean {
  for (const kind of SINGLETON_KINDS) {
    if ((doc[kind]?.content ?? '').trim() !== '') return false;
  }
  for (const kind of REPEATABLE_KINDS) {
    if (doc[kind].some((b) => b.content.trim() !== '')) return false;
  }
  return true;
}

/** Count of non-blank blocks (singletons + repeatable), for honest status copy. */
export function countNonEmptyBlocks(doc: InstructionsV1): number {
  let n = 0;
  for (const kind of SINGLETON_KINDS) {
    if ((doc[kind]?.content ?? '').trim() !== '') n += 1;
  }
  for (const kind of REPEATABLE_KINDS) {
    n += doc[kind].filter((b) => b.content.trim() !== '').length;
  }
  return n;
}

/** Count of non-blank rules — the payload-truth figure the canvas subtitle used to show. */
export function countNonEmptyRules(doc: InstructionsV1): number {
  return doc.rules.filter((b) => b.content.trim() !== '').length;
}

/**
 * Validate a JSON-mode block's content client-side. Returns null when the
 * content parses; otherwise a short human reason. The server re-validates and
 * fails closed — this is UX, not authority.
 */
export function jsonBlockError(content: string): string | null {
  if (content.trim() === '') return null;
  try {
    JSON.parse(content);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid JSON';
    return `Not valid JSON — ${message}. Fix it or switch the block back to Markdown.`;
  }
}

/**
 * Light client-side normalization before PUT: pin schemaVersion, default
 * missing lists, drop unknown top-level keys (the server strips them anyway;
 * sending clean docs keeps the JSON tab honest). Does NOT validate content —
 * the server is the authority and 400s with details.
 */
export function normalizeDocumentForSave(doc: InstructionsV1): InstructionsV1 {
  const cleanSingleton = (b: SingletonBlock | undefined): SingletonBlock | undefined => {
    if (!b) return undefined;
    return { mode: isValidMode(b.mode) ? b.mode : 'markdown', content: typeof b.content === 'string' ? b.content : '' };
  };
  const cleanRepeatable = <T extends RepeatableBlock>(list: T[] | undefined): T[] =>
    (Array.isArray(list) ? list : []).map((b) => {
      const cleaned: RepeatableBlock = {
        id: typeof b.id === 'string' && b.id !== '' ? b.id : generateBlockId(),
        mode: isValidMode(b.mode) ? b.mode : 'markdown',
        content: typeof b.content === 'string' ? b.content : '',
      };
      // Preserve an example title when present and well-formed.
      const title = (b as ExampleBlock).title;
      if (typeof title === 'string' && title.length > 0) {
        return { ...cleaned, title: title.slice(0, 200) } as unknown as T;
      }
      return cleaned as T;
    });
  return {
    schemaVersion: INSTRUCTIONS_SCHEMA_VERSION,
    role: cleanSingleton(doc.role),
    objective: cleanSingleton(doc.objective),
    output: cleanSingleton(doc.output),
    refusal: cleanSingleton(doc.refusal),
    rules: cleanRepeatable(doc.rules),
    examples: cleanRepeatable(doc.examples),
    custom: cleanRepeatable(doc.custom),
  };
}

/**
 * Collect every client-checkable save blocker for a document: invalid JSON in
 * json-mode blocks, per-block 16 KiB overruns, duplicate IDs. Returns short
 * human messages; empty means the client has no objection (the server still
 * validates everything and fails closed).
 */
export function clientSaveBlockers(doc: InstructionsV1): string[] {
  const problems: string[] = [];
  const singletonEntries: Array<[string, SingletonBlock | undefined]> = [
    ['Role', doc.role],
    ['Objective', doc.objective],
    ['Output', doc.output],
    ['Refusal', doc.refusal],
  ];
  for (const [label, block] of singletonEntries) {
    if (!block) continue;
    if (block.mode === 'json') {
      const err = jsonBlockError(block.content);
      if (err) problems.push(`${label}: ${err}`);
    }
    if (block.content.length > INSTRUCTIONS_BLOCK_MAX_LENGTH) {
      problems.push(`${label} is over the 16 KiB block limit — split it or trim it.`);
    }
  }
  const repeatableEntries: Array<[string, RepeatableBlock[]]> = [
    ['Rules', doc.rules],
    ['Examples', doc.examples],
    ['Custom', doc.custom],
  ];
  const seen = new Map<string, string>();
  repeatableEntries.forEach(([label, list]) => {
    list.forEach((block, index) => {
      const where = `${label} #${index + 1}`;
      if (block.mode === 'json') {
        const err = jsonBlockError(block.content);
        if (err) problems.push(`${where}: ${err}`);
      }
      if (block.content.length > INSTRUCTIONS_BLOCK_MAX_LENGTH) {
        problems.push(`${where} is over the 16 KiB block limit — split it or trim it.`);
      }
      if (typeof block.id === 'string' && block.id !== '') {
        const first = seen.get(block.id);
        if (first !== undefined) problems.push(`Duplicate block ID ${block.id} (${first} and ${where}) — IDs must be unique.`);
        else seen.set(block.id, where);
      }
    });
  });
  return problems;
}

/** Token estimate for the budget bar — a rough 4-chars-per-token heuristic, labeled as an estimate in the UI. */
export function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

/** Legacy budget cap (compiled characters) — kept for the budget bar copy. */
export const INSTRUCTIONS_LIMIT = 32_768;

/** `some-slug` → `Some Slug` (sample gallery labels). */
export function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** What the sample gallery / quick-add hands the section: block content without an ID — the section mints real `ins_*` IDs. */
export interface NewInstructionBlock {
  kind: RepeatableKind;
  mode: InstructionMode;
  content: string;
  title?: string;
}

/** Build a repeatable block with a fresh server-format ID. */
export function makeRepeatableBlock(
  kind: 'examples',
  content: string,
  mode?: InstructionMode,
  title?: string,
): ExampleBlock;
export function makeRepeatableBlock(
  kind: 'rules' | 'custom',
  content: string,
  mode?: InstructionMode,
  title?: string,
): RepeatableBlock;
export function makeRepeatableBlock(
  kind: RepeatableKind,
  content: string,
  mode: InstructionMode = 'markdown',
  title?: string,
): RepeatableBlock | ExampleBlock {
  const base = { id: generateBlockId(), mode, content };
  if (kind === 'examples') {
    const block: ExampleBlock = { ...base };
    if (title && title.trim() !== '') block.title = title.trim().slice(0, 200);
    return block;
  }
  return base;
}
