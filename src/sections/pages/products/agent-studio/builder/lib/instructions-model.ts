/**
 * Instructions block model (C02 PLAN.md §3) — PURE, zero imports.
 *
 * Authoring model: typed blocks. Storage/wire model: ONE Markdown string with
 * stable `## ` markers (model-neutral, human-diffable — research consensus over
 * JSON-authoring and Claude-specific XML). The engine sees text only.
 *
 * Losslessness contract:
 * - composer-produced text round-trips byte-identical (property-tested);
 * - foreign text normalizes ONCE on first parse (markers canonicalized, bullets
 *   normalized, continuations joined) and is then stable (fixpoint-tested);
 * - unknown content is NEVER dropped: preamble, unknown headers, and trailing
 *   prose collect verbatim into ONE trailing `custom` block.
 * - fenced code blocks (``` / ~~~) are opaque: marker-looking lines inside
 *   fences are content, never structure.
 */

export type InstructionBlockType =
  | 'role'
  | 'task'
  | 'rule'
  | 'example'
  | 'output'
  | 'refusal'
  | 'custom';

export interface InstructionBlock {
  /** Local key only (`block:<n>`) — never persisted, never sent. */
  id: string;
  type: InstructionBlockType;
  /** Rule title doubles as the `### ` header on compose (see §3). */
  title: string;
  body: string;
}

export interface ComposedDocument {
  blocks: InstructionBlock[];
  overridden: boolean;
  rawOverride: string;
}

/** Engine contract bound (tighter of validation 32,768 vs schema 20,000). */
export const INSTRUCTIONS_LIMIT = 20000;

let blockCounter = 0;

/** Local React keys — uniqueness only, values are meaningless. */
export function newBlockId(): string {
  blockCounter += 1;
  return `block:${blockCounter}`;
}

export function makeBlock(type: InstructionBlockType, body = '', title = ''): InstructionBlock {
  return { id: newBlockId(), type, title, body };
}

/** Canonical compose order (primacy/recency — PLAN.md §3.2). */
const CANONICAL_ORDER: InstructionBlockType[] = ['role', 'task', 'rule', 'example', 'output', 'refusal', 'custom'];

const SINGLETONS: ReadonlySet<InstructionBlockType> = new Set(['role', 'task', 'output', 'refusal']);

const HEADER_NAMES: Record<string, InstructionBlockType> = {
  role: 'role',
  task: 'task',
  rules: 'rule',
  rule: 'rule',
  examples: 'example',
  example: 'example',
  output: 'output',
  refusal: 'refusal',
};

const HEADER_LABEL: Record<InstructionBlockType, string> = {
  role: 'Role',
  task: 'Task',
  rule: 'Rules',
  example: 'Examples',
  output: 'Output',
  refusal: 'Refusal',
  custom: 'Custom',
};

const SECTION_BARE = /^(#{1,3})\s*(role|tasks?|rules?|examples?|output|refusal)\s*:?\s*$/i;
// h1/h2 with trailing content become the section's first body line — EXCEPT
// example(s): `## Example 1` is a separator, never a section (rule 3 below).
const SECTION_INLINE = /^(#{1,2})\s*(role|tasks?|rules?|output|refusal)\s*:?\s*(\S[\s\S]*)$/i;
// Inside Examples, any # line with content divides examples (title = all of it).
const EXAMPLE_DIVIDER = /^#{1,3}\s+(\S[\s\S]*)$/;
const UNKNOWN_H2 = /^#{1,2}\s+\S/;
const BULLET = /^\s*(?:[-*•]|\d{1,3}[.)])(?:\s+\[[ xX]\])?\s+/;
const FENCE = /^\s*(```|~~~)/;

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function stripBullet(line: string): string | null {
  if (!BULLET.test(line)) return null;
  return line.replace(BULLET, '').trim();
}

interface RawSection {
  type: InstructionBlockType | 'preamble' | 'custom';
  title: string;
  lines: string[];
}

/**
 * Parse instructions text into blocks. Foreign (non-composer) text degrades to
 * a single verbatim `custom` block plus whatever typed sections it declares —
 * content is always preserved, structure is best-effort.
 */
export function parseInstructions(text: string): InstructionBlock[] {
  const source = normalizeNewlines(text);
  if (source.trim() === '') return [];

  const sections: RawSection[] = [];
  let current: RawSection = { type: 'preamble', title: '', lines: [] };
  let inFence = false;

  const flush = () => {
    sections.push(current);
  };

  for (const line of source.split('\n')) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      current.lines.push(line);
      continue;
    }
    if (!inFence) {
      // Rule precedence (documented — ambiguous markup resolves top-down):
      // 1. bare known header → typed section (`## Output`, `### Rules:`);
      // 2. h1/h2 known header + inline rest → section + first body line
      //    (`## Role: concierge`), except example(s) — rule 3 owns those;
      // 3. in-Examples, any # line with content → example divider
      //    (`### Example 1`, `## Example 1` — title is all of it);
      // 4. other h1/h2 → foreign structure, preserved verbatim as custom;
      // 5. anything else (incl. h3+ prose subheads) → current section content.
      const bare = SECTION_BARE.exec(line);
      if (bare) {
        flush();
        const kind = HEADER_NAMES[bare[2].toLowerCase()] as InstructionBlockType;
        current = { type: kind, title: '', lines: [] };
        continue;
      }
      const inline = SECTION_INLINE.exec(line);
      if (inline) {
        flush();
        const kind = HEADER_NAMES[inline[2].toLowerCase()] as InstructionBlockType;
        current = { type: kind, title: '', lines: [(inline[3] ?? '').trim()] };
        continue;
      }
      if (current.type === 'example') {
        const divider = EXAMPLE_DIVIDER.exec(line);
        if (divider) {
          flush();
          current = { type: 'example', title: (divider[1] ?? '').trim(), lines: [] };
          continue;
        }
      }
      if (UNKNOWN_H2.test(line)) {
        flush();
        current = { type: 'custom', title: '', lines: [line] };
        continue;
      }
    }
    current.lines.push(line);
  }
  flush();

  const blocks: InstructionBlock[] = [];
  const customLines: string[] = [];
  // Example bodies under construction (blank-line tolerant, §3.4).
  let openExample: { title: string; lines: string[] } | null = null;

  const closeExample = () => {
    if (!openExample) return;
    const body = openExample.lines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
    // Bare ## Examples headers (title '') carry no examples — their stray
    // lines are foreign content, preserved as custom below.
    if (openExample.title === '' && body === '') {
      openExample = null;
      return;
    }
    if (openExample.title === '') {
      pushCustom(openExample.lines);
      openExample = null;
      return;
    }
    blocks.push({ id: newBlockId(), type: 'example', title: openExample.title, body });
    openExample = null;
  };

  const pushCustom = (lines: string[]) => {
    for (const line of lines) customLines.push(line);
  };

  for (const section of sections) {
    if (section.type === 'preamble' || section.type === 'custom') {
      pushCustom(section.lines);
      continue;
    }
    if (section.type === 'example') {
      // A bare `## Examples` header (empty title) opens nothing — its stray
      // lines are foreign content (custom); `### ` children open titled examples.
      if (openExample) closeExample();
      if (section.title === '') {
        pushCustom(section.lines);
      } else {
        openExample = { title: section.title, lines: [...section.lines] };
      }
      continue;
    }
    if (openExample) closeExample();
    if (section.type === 'rule') {
      for (const line of section.lines) {
        if (line.trim() === '') continue;
        const bullet = stripBullet(line);
        if (bullet !== null && bullet !== '') {
          blocks.push({ id: newBlockId(), type: 'rule', title: '', body: bullet });
        } else if (bullet !== null) {
          continue; // bare marker, no content
        } else {
          // Non-bullet line: continuation of the previous rule (joined on
          // compose-normalize), or its own rule when leading.
          const last = [...blocks].reverse().find((b) => b.type === 'rule');
          const content = line.trim();
          if (last && last.id === blocks[blocks.length - 1]?.id) {
            last.body = `${last.body} ${content}`;
          } else {
            blocks.push({ id: newBlockId(), type: 'rule', title: '', body: content });
          }
        }
      }
      continue;
    }
    // Singleton-ish sections: body verbatim, edge blanks trimmed.
    const body = section.lines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
    if (body !== '') {
      blocks.push({ id: newBlockId(), type: section.type, title: section.title, body });
    }
  }
  if (openExample) closeExample();

  // Merge duplicate singletons (foreign text may declare two ## Roles) —
  // content joined, never dropped.
  const merged: InstructionBlock[] = [];
  const seenSingleton = new Map<InstructionBlockType, InstructionBlock>();
  for (const block of blocks) {
    if (SINGLETONS.has(block.type)) {
      const prior = seenSingleton.get(block.type);
      if (prior) {
        prior.body = `${prior.body}\n\n${block.body}`;
        continue;
      }
      seenSingleton.set(block.type, block);
    }
    merged.push(block);
  }

  const customBody = customLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
  if (customBody !== '') {
    merged.push({ id: newBlockId(), type: 'custom', title: '', body: customBody });
  }
  return merged;
}

/**
 * Compose blocks to the wire string. Deterministic: same blocks → same bytes.
 * Empty sections omitted (blank headers are billed tokens on every run).
 */
export function composeInstructions(blocks: InstructionBlock[]): string {
  const parts: string[] = [];
  const byType = new Map<InstructionBlockType, InstructionBlock[]>();
  for (const block of blocks) {
    const list = byType.get(block.type) ?? [];
    list.push(block);
    byType.set(block.type, list);
  }

  const singleton = (type: InstructionBlockType): string | null => {
    const bodies = (byType.get(type) ?? []).map((b) => b.body.trim()).filter((b) => b !== '');
    if (bodies.length === 0) return null;
    return `## ${HEADER_LABEL[type]}\n${bodies.join('\n\n')}`;
  };

  for (const type of ['role', 'task'] as const) {
    const part = singleton(type);
    if (part) parts.push(part);
  }

  const rules = (byType.get('rule') ?? []).map((b) => b.body.trim()).filter((b) => b !== '');
  if (rules.length > 0) {
    parts.push(`## Rules\n${rules.map((r) => `- ${r}`).join('\n')}`);
  }

  const examples = (byType.get('example') ?? []).filter((b) => b.body.trim() !== '' || b.title.trim() !== '');
  if (examples.length > 0) {
    const rendered = examples.map((b, i) => `### ${b.title.trim() || `Example ${i + 1}`}\n${b.body.trim()}`);
    parts.push(`## Examples\n${rendered.join('\n\n')}`);
  }

  for (const type of ['output', 'refusal'] as const) {
    const part = singleton(type);
    if (part) parts.push(part);
  }

  const customs = (byType.get('custom') ?? []).map((b) => b.body).filter((b) => b.trim() !== '');
  if (customs.length > 0) {
    parts.push(customs.join('\n\n'));
  }

  if (parts.length === 0) return '';
  return `${parts.join('\n\n')}\n`;
}

/** Blank authoring state: editable singletons present, lists empty. */
export function blankDocument(): ComposedDocument {
  return {
    blocks: [makeBlock('role'), makeBlock('task'), makeBlock('output'), makeBlock('refusal')],
    overridden: false,
    rawOverride: '',
  };
}

/** Ensure the editable singletons exist (fresh documents, legacy texts). */
export function ensureSingletons(blocks: InstructionBlock[]): InstructionBlock[] {
  const out = [...blocks];
  for (const type of ['role', 'task', 'output', 'refusal'] as const) {
    if (!out.some((b) => b.type === type)) {
      // Singletons edit in canonical position, not append order.
      const anchor = CANONICAL_ORDER.indexOf(type);
      let at = out.length;
      for (let i = 0; i < out.length; i += 1) {
        if (CANONICAL_ORDER.indexOf(out[i].type) > anchor) {
          at = i;
          break;
        }
      }
      out.splice(at, 0, makeBlock(type));
    }
  }
  return out;
}

export function isEmptyDocument(doc: Pick<ComposedDocument, 'blocks'>): boolean {
  if (doc.blocks.length === 0) return true;
  return doc.blocks.every((b) => b.body.trim() === '' && b.title.trim() === '');
}

/** Payload length = composed bytes (what ships, what the cap counts). */
export function countChars(blocks: InstructionBlock[]): number {
  return composeInstructions(blocks).length;
}

/** Token estimate, Room parity (~chars/4), ALWAYS labeled "(est.)" at render. */
export function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

/** Registry slugs (`support-triage`) → card titles (`Support triage`). Pure. */
export function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
