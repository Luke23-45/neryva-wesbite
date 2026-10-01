/**
 * section-ui — shared types for the section page architecture.
 *
 * Three section pages (Instructions, Role, Brand) share one interaction
 * model: collapsed field cards → focused block editor (no modals, no
 * route change). This module holds the vocabulary every piece speaks.
 */

import type { RoleFieldMode } from '@lib/engine/role-fields';

/** One modal content block: { mode, content }. The unit the editor edits. */
export interface ModalBlock {
  mode: RoleFieldMode;
  content: string;
}

/**
 * Which JSON schema the editor's JSON surface validates against.
 * - 'text': the JSON must parse to a string (Role/Brand text fields).
 * - 'list': the JSON must parse to an array of strings (Role list fields).
 * - 'any':  any valid JSON (Instructions blocks — engine validates shape).
 */
export type BlockJsonKind = 'text' | 'list' | 'any';

/** A field the BlockEditor can open. Sections adapt their model into this. */
export interface EditableBlock {
  /** Stable key for the editor session (e.g. 'instructions:objective'). */
  key: string;
  /** Back-link label — the section page (e.g. 'Instructions'). */
  sectionLabel: string;
  /** Block title shown in the editor sub-header (e.g. 'Objective'). */
  title: string;
  /** JSON-surface schema. */
  jsonKind: BlockJsonKind;
  /** Current value. */
  block: ModalBlock;
  /** Placeholder for empty editor surfaces. */
  placeholder?: string;
  /**
   * D7: restrict the editing surfaces offered for this target. When a single
   * surface is listed, the editor hides the surface switch and stays on it.
   * Absent = all three surfaces (raw/markdown/json), the historical default.
   * Used for JSON-schema targets where leaving the JSON surface is lossy.
   */
  surfaces?: Array<'raw' | 'markdown' | 'json'>;
  /** Parsed-value char cap, shown in the editor status bar. */
  cap?: number;
  /** Item cap for list kinds (shown in the editor status bar). */
  maxItems?: number;
  /** Optional single-line title field (examples). Rendered above the surface. */
  titleField?: { value: string; placeholder?: string };
}

/** What the editor hands back on draft pushes and Done. */
export interface SavedBlock {
  block: ModalBlock;
  /** Present only when the target declared a titleField. */
  title?: string;
}

/** One JSON validation problem, with an optional source position. */
export interface JsonIssue {
  message: string;
  line?: number;
  column?: number;
}

export interface ValidatedJson {
  ok: boolean;
  value: unknown;
  issues: JsonIssue[];
}

/**
 * Validate pasted JSON against the block's schema. Fail closed: any issue
 * means the editor holds Done until it is fixed.
 */
export function validateBlockJson(kind: BlockJsonKind, text: string): ValidatedJson {
  if (text.trim() === '') {
    return { ok: false, value: undefined, issues: [{ message: 'Nothing to validate — paste a JSON value first.' }] };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (err) {
    return { ok: false, value: undefined, issues: [jsonSyntaxIssue(text, err)] };
  }
  if (kind === 'text' && typeof value !== 'string') {
    return {
      ok: false,
      value,
      issues: [{ message: `This field holds a single text value — the JSON must be a string, not ${jsonTypeName(value)}.` }],
    };
  }
  if (kind === 'list') {
    if (!Array.isArray(value)) {
      return {
        ok: false,
        value,
        issues: [{ message: `This field holds a list — the JSON must be an array of strings, not ${jsonTypeName(value)}.` }],
      };
    }
    const bad = value.findIndex((item) => typeof item !== 'string');
    if (bad !== -1) {
      return {
        ok: false,
        value,
        issues: [{ message: `Item ${bad + 1} is ${jsonTypeName(value[bad])} — every item must be a string.` }],
      };
    }
  }
  return { ok: true, value, issues: [] };
}

function jsonTypeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return `a ${typeof value}`;
}

/** Turn a JSON.parse SyntaxError into a positioned issue when possible. */
function jsonSyntaxIssue(text: string, err: unknown): JsonIssue {
  const message = err instanceof Error ? err.message : 'Invalid JSON.';
  const at = /at position (\d+)/.exec(message)?.[1];
  if (at === undefined) return { message: prettifyJsonError(message) };
  const pos = Number(at);
  let line = 1;
  let column = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  // B8: modern V8 embeds its own location ("at position N (line L column C)")
  // in the message — strip it (and any trailing parenthesized location)
  // before appending the canonical one, or the location reads twice.
  const stripped = message
    .replace(/\s*at position \d+\s*(\(line \d+ column \d+\))?/, '')
    .replace(/\s*\(line \d+,? column \d+\)\s*$/, '');
  return { message: `${prettifyJsonError(stripped)} (line ${line}, column ${column})`, line, column };
}

function prettifyJsonError(message: string): string {
  return message
    .replace(/^JSON\.parse:\s*/, '')
    .replace(/^Unexpected token.*in JSON.*$/, 'Unexpected character — check commas, quotes, and brackets.');
}

/** Right-rail "On this page" row. */
export interface OutlineItem {
  key: string;
  label: string;
  /** e.g. '128' for chars, '4' for items, '—' when empty. */
  meta: string;
  done: boolean;
}

/** Right-rail budget row. */
export interface BudgetRow {
  key: string;
  label: string;
  chars: number;
}

/** Character/word/token counts for the editor status bar. */
export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return text.trim() === '' ? 0 : words.length;
}

/** Token estimate, Room parity (~chars/4), always labeled "(est.)" at render. */
export function estimateTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

/** 'just now' / 'Xm ago' for the editor's autosave stamp. */
export function timeAgo(when: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - when) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
