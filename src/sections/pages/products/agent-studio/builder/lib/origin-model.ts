/**
 * C12 pure model — import parsing/validation + clone support.
 *
 * Engine binds (verified 2026-09-18, PLAN.md §1):
 * - import = POST :assistantId/versions/import with the envelope at TOP
 *   level (11 keys); schema_version number-checked only (current 2),
 *   hash+schema stripped pre-compare, zod-parsed, hash re-checked, then
 *   createVersion (unknown-keys + payload + secrets re-enforced).
 *   Failures are 400 (never 422); no-op = success new DRAFT (or 409
 *   draft_exists); idempotent transport, fresh keys per call.
 * - clone = client composition (GETs + POST assistants); new assistant +
 *   DRAFT, original untouched, 2–128 + 409.
 * - client mirrors the tighter-wins contract via checkDefinitionCaps;
 *   the engine re-validates everything (stated, never duplicated zod).
 */
import { ApiError } from '@lib/engine/client';
import { fromEnginePayload, type ConsumerDefinition } from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';

/** The 11-key import envelope vocabulary (`assistants.service.ts:1170-1182`). */
const ENVELOPE_KEYS = new Set([
  'schema_version',
  'instructions',
  'model_params',
  'budget_policy',
  'brand',
  'model_policy',
  'context_policy',
  'tool_policy',
  'knowledge_policy',
  'guardrail_policy',
  'hash',
]);

/** Consumer-only keys — valid drafts, never wire/import payloads. */
const CONSUMER_ONLY_KEYS = new Set([
  'max_context_tokens',
  'retrieval',
  'memory_max_results',
  'hybrid_retrieval',
]);

/** Current engine schema generation (`schema.ts:294`). Display + warn, never gate. */
export const IMPORT_SCHEMA_CURRENT = 2;

/** Copy constants — every string traces to a bind or a PLAN decision. */
export const ORIGIN_COPY = {
  cloneUntouched: 'The original is untouched — edits land on the copy.',
  cloneNoWarnAgain: 'Don’t show again',
  unwrapNote: 'Unwrapped .export — provenance stays in the file.',
  schemaReview: 'Written for a newer schema — validated as-is. Review the definition after import.',
  schemaMissing: 'No schema stamp — validated as-is. Review the definition after import.',
  precheckNote: 'Contract pre-check — the engine re-validates everything.',
  strippedNote: 'Removed before send — the engine would drop it.',
  highlightImported: 'Imported as draft — review then publish.',
  clonedToast: 'Cloned as a new draft — the original was not touched.',
  draftExists: 'A draft already exists here — publish or retire it first, then import again.',
  noAssistants: 'No other agents to clone yet — import a file instead.',
  invalidJson: 'That is not valid JSON — fix the syntax and try again.',
  unreadableFile: 'That file could not be read as text.',
} as const;

export const CLONE_WARN_KEY = 'neryva.clone-copy-warning.dismissed';

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode: the warning simply reappears next time (safe default).
  }
}

/** Persistent dismissible education (NotificationsPopover shape). */
export function shouldShowCloneWarning(): boolean {
  if (typeof window === 'undefined') return true;
  return storageGet(CLONE_WARN_KEY) !== '1';
}

export function dismissCloneWarning(): void {
  if (typeof window === 'undefined') return;
  storageSet(CLONE_WARN_KEY, '1');
}

export function parseImportText(raw: string): { json: unknown } | { syntaxError: string } {
  try {
    return { json: JSON.parse(raw) as unknown };
  } catch {
    return { syntaxError: ORIGIN_COPY.invalidJson };
  }
}

export function unwrapExportEnvelope(json: unknown): { envelope: Record<string, unknown>; wasWrapped: boolean } {
  if (typeof json === 'object' && json !== null) {
    const record = json as Record<string, unknown>;
    const inner = record.export;
    if (typeof inner === 'object' && inner !== null) {
      return { envelope: inner as Record<string, unknown>, wasWrapped: true };
    }
    return { envelope: record, wasWrapped: false };
  }
  return { envelope: {}, wasWrapped: false };
}

export function extractSchemaVersion(envelope: Record<string, unknown>): number | null {
  const value = envelope.schema_version;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export interface ImportIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidatedImport {
  /** Stripped, send-ready envelope (unknown + consumer-only keys removed). */
  payload: Record<string, unknown>;
  issues: ImportIssue[];
  schemaVersion: number | null;
  strippedKeys: string[];
  wasWrapped: boolean;
}

/**
 * Client-first import validation (buildCase shape): envelope handling +
 * contract pre-check with severity. Errors block send; warnings ride
 * along stated. Never throws on programmer-error shapes — those become
 * error rows with paths.
 */
export function validateImportPayload(json: unknown): ValidatedImport {
  const { envelope, wasWrapped } = unwrapExportEnvelope(json);
  const issues: ImportIssue[] = [];
  const strippedKeys: string[] = [];
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(envelope)) {
    if (ENVELOPE_KEYS.has(key)) {
      payload[key] = value;
    } else if (CONSUMER_ONLY_KEYS.has(key)) {
      strippedKeys.push(key);
      issues.push({ path: key, message: `Consumer-only key — ${ORIGIN_COPY.strippedNote}`, severity: 'warning' });
    } else {
      strippedKeys.push(key);
      issues.push({ path: key, message: `Unknown key — ${ORIGIN_COPY.strippedNote}`, severity: 'warning' });
    }
  }

  const schemaVersion = extractSchemaVersion(envelope);

  let definition: ConsumerDefinition;
  try {
    definition = fromEnginePayload(payload);
  } catch (error) {
    issues.push({
      path: 'payload',
      message: error instanceof Error ? error.message : 'The payload could not be read as a definition.',
      severity: 'error',
    });
    return { payload, issues, schemaVersion, strippedKeys, wasWrapped };
  }

  const caps = checkDefinitionCaps(definition);
  for (const issue of caps) {
    issues.push({ path: issue.path, message: issue.message, severity: 'error' });
  }

  return { payload, issues, schemaVersion, strippedKeys, wasWrapped };
}

export function importErrors(issues: ImportIssue[]): ImportIssue[] {
  return issues.filter((issue) => issue.severity === 'error');
}

export function importWarnings(issues: ImportIssue[]): ImportIssue[] {
  return issues.filter((issue) => issue.severity === 'warning');
}

/**
 * 409 draft-exists matcher (same content + existing draft). The engine
 * surfaces the unique-violation as a conflict — match generously on the
 * draft wording, since the exact message is a mapped DB phrase.
 */
export function isDraftExistsError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return false;
  }
  const haystack = `${error.message} ${JSON.stringify(error.details ?? '')}`.toLowerCase();
  return haystack.includes('draft');
}

/** 409 name-taken matcher (shared with the C01 one-tap-rename recovery). */
export function isNameTakenError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return false;
  }
  return error.message.toLowerCase().includes('already taken');
}
