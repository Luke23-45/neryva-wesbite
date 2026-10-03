/**
 * Role field blocks — the website mirror of the engine's
 * src/modules/assistants/role-fields.ts.
 *
 * Every Role field is a modal block: the UI edits { mode, content } and the
 * engine parses it server-side. The website needs the same parse rules for
 * read-only rendering (PersonaCard), the role subtitle, and the caps layer:
 *
 * - text fields (role, goal, communicationStyle): raw = literal text,
 *   markdown = passed through, json = content must parse to a JSON string.
 * - list fields (traits, knowledgeAreas, prohibitedTopics): raw = one item
 *   per line, markdown = strict "- " lines, json = array of strings.
 * - blank content = empty field in ANY mode (clearing a field clears it).
 *
 * These helpers are LENIENT: they return undefined for unparseable blocks
 * (read-side honesty — the engine is the authority and 400s on save).
 */

export type RoleFieldMode = 'raw' | 'markdown' | 'json';

export const ROLE_FIELD_MODES: readonly RoleFieldMode[] = ['raw', 'markdown', 'json'] as const;

export interface RoleFieldBlock {
  mode?: RoleFieldMode;
  content: string;
}

export function isRoleFieldMode(value: unknown): value is RoleFieldMode {
  return value === 'raw' || value === 'markdown' || value === 'json';
}

/** Text fields default to raw; list fields default to json. */
export function defaultRoleFieldMode(isList: boolean): RoleFieldMode {
  return isList ? 'json' : 'raw';
}

/** Lenient block read: garbage shape → undefined (never a guess).
 * Legacy bare strings (pre-block brand/role values) resolve to raw mode —
 * a bare string IS raw text, not a guess. */
export function readRoleBlock(value: unknown): RoleFieldBlock | undefined {
  if (typeof value === 'string') return { mode: 'raw', content: value };
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const b = value as { mode?: unknown; content?: unknown };
  if (typeof b.content !== 'string') return undefined;
  if (b.mode !== undefined && !isRoleFieldMode(b.mode)) return undefined;
  return b.mode === undefined ? { content: b.content } : { mode: b.mode, content: b.content };
}

/** Parse a text field. Blank → '' (empty); unparseable → undefined. */
export function parseRoleTextField(block: RoleFieldBlock): string | undefined {
  const content = block.content;
  if (content.trim() === '') return '';
  const mode = block.mode ?? 'raw';
  if (mode === 'json') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return undefined;
    }
    return typeof parsed === 'string' ? parsed : undefined;
  }
  return content;
}

/** Parse a list field. Blank → [] (empty); unparseable → undefined. */
export function parseRoleListField(block: RoleFieldBlock): string[] | undefined {
  const content = block.content;
  if (content.trim() === '') return [];
  const mode = block.mode ?? 'json';
  if (mode === 'json') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return undefined;
    }
    if (!Array.isArray(parsed) || !parsed.every((e) => typeof e === 'string')) return undefined;
    return parsed.filter((e) => e.trim() !== '').map((e) => e.trim());
  }
  const lines = content.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  if (mode === 'markdown') {
    const items: string[] = [];
    for (const line of lines) {
      if (!line.startsWith('- ')) return undefined;
      const item = line.slice(2).trim();
      if (item === '') return undefined;
      items.push(item);
    }
    return items;
  }
  return lines;
}

/** True when the block is absent or blank (blank in any mode). */
export function isRoleBlockEmpty(block: RoleFieldBlock | undefined): boolean {
  return block === undefined || block.content.trim() === '';
}

/** Parsed-value emptiness for a text field (unparseable reads as empty). */
export function roleTextHasValue(block: RoleFieldBlock | undefined): boolean {
  if (!block) return false;
  const parsed = parseRoleTextField(block);
  return parsed !== undefined && parsed.trim() !== '';
}

/** Parsed-value emptiness for a list field (unparseable reads as empty). */
export function roleListHasValue(block: RoleFieldBlock | undefined): boolean {
  if (!block) return false;
  const parsed = parseRoleListField(block);
  return parsed !== undefined && parsed.length > 0;
}
