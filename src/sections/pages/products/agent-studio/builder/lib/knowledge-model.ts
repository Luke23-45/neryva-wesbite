/**
 * Knowledge model (C05 PLAN.md §4) — PURE, zero imports.
 *
 * Engine bounds encoded (re-verify if the engine moves):
 * - pins: `context_policy.knowledge_sources`, contract max 16 kebab slugs
 *   (v1.schema.json knowledge_sources maxItems=16; README correction #9);
 * - slug: 3–64, lowercase/digits/hyphens, starts+ends alnum (source-slug.ts:17;
 *   mirrored by setup-caps checkSourceSlug — parity asserted by test);
 * - retrieval: `retrieval_enabled` default false (deliberate toggle),
 *   `max_results` 1–20 default 5 (validation.ts:88-93);
 * - title ≤256 (knowledge.controller.ts CreateUploadDto);
 * - sessions: CREATED→UPLOADING→UPLOADED→SCANNING→EXTRACTING→INDEXING→READY |
 *   QUARANTINED | FAILED (knowledge/schema.ts:80-81);
 * - documents: processing|ready|failed|retired (chk_documents_state);
 * - coverage is per embedding model; READY document ≠ covered (P0).
 */

export const PINS_MAX = 16;
export const SLUG_MIN = 3;
export const SLUG_MAX = 64;
export const TITLE_MAX = 256;
export const MAX_RESULTS_MIN = 1;
export const MAX_RESULTS_MAX = 20;
export const MAX_RESULTS_DEFAULT = 5;
/** Ingestion worker lease (ingestion.service.ts:48) — sessions older than this
 *  in a non-terminal state are stalled, never silently dead. */
export const SESSION_STALL_AFTER_MS = 5 * 60_000;

const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/** Paste formats: the text subset of the engine media allowlist
 *  (artifacts.service.ts:22-42 — binary types stay upload-only). */
export const PASTE_MEDIA_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json'] as const;
export type PasteMediaType = (typeof PASTE_MEDIA_TYPES)[number];

/** Filename → slug intent (best-effort; empty when underivable — server derives then). */
export function slugifyFilename(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  return base.length >= SLUG_MIN ? base : '';
}

/** Kebab slug check — null = shippable. Mirrors setup-caps checkSourceSlug. */
export function validateSourceSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  if (normalized.length < SLUG_MIN || normalized.length > SLUG_MAX || !SLUG_PATTERN.test(normalized)) {
    return 'Slugs are 3–64 characters: lowercase letters, digits, hyphens; starts and ends with a letter or digit.';
  }
  return null;
}

/** Display title — null = shippable. */
export function validateTitle(title: string): string | null {
  if (title.length > TITLE_MAX) {
    return `Titles must be ≤ ${TITLE_MAX} characters (currently ${title.length}).`;
  }
  return null;
}

export type PasteCheck = { ok: true; mediaType: PasteMediaType } | { ok: false; message: string };

/** Pasted text → session-ready bytes guard. application/json gets a local
 *  parse check with a named message; the engine remains the authority. */
export function validatePaste(text: string, mediaType: string): PasteCheck {
  if (!PASTE_MEDIA_TYPES.includes(mediaType as PasteMediaType)) {
    return { ok: false, message: 'Paste supports plain text, Markdown, CSV, or JSON — other types need file upload.' };
  }
  if (text.trim() === '') {
    return { ok: false, message: 'Nothing to ingest — paste the content first.' };
  }
  if (mediaType === 'application/json') {
    try {
      JSON.parse(text);
    } catch {
      return { ok: false, message: 'Not valid JSON — fix the syntax or choose plain text.' };
    }
  }
  return { ok: true, mediaType: mediaType as PasteMediaType };
}

export type PinsCheck = { ok: true; slugs: string[] } | { ok: false; message: string };

/** Pin list gate — contract max 16, kebab each, deduped (order = declared order). */
export function validatePins(slugs: readonly string[]): PinsCheck {
  const normalized = slugs.map((s) => s.trim().toLowerCase()).filter((s) => s !== '');
  const unique = [...new Set(normalized)];
  for (const slug of unique) {
    const problem = validateSourceSlug(slug);
    if (problem) return { ok: false, message: `Pin “${slug}” is not a valid slug — ${problem}` };
  }
  if (unique.length > PINS_MAX) {
    return { ok: false, message: `At most ${PINS_MAX} pinned sources (currently ${unique.length}) — unmap one first.` };
  }
  return { ok: true, slugs: unique };
}

/** 16-cap hold for the pin affordance (named, never a silent disable). */
export function canPin(pinnedCount: number): { ok: true } | { ok: false; message: string } {
  if (pinnedCount >= PINS_MAX) {
    return { ok: false, message: `Pin limit reached (${PINS_MAX}) — unmap a source to pin another.` };
  }
  return { ok: true };
}

/** max_results gate — integer 1–20. */
export function validateMaxResults(value: unknown): { ok: true; value: number } | { ok: false; message: string } {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < MAX_RESULTS_MIN || value > MAX_RESULTS_MAX) {
    return { ok: false, message: `Max results must be a whole number ${MAX_RESULTS_MIN}–${MAX_RESULTS_MAX}.` };
  }
  return { ok: true, value };
}

export interface InventoryRow {
  id: string;
  sourceSlug: string;
  title: string | null;
  state: string;
  latestVersion: number | null;
}

/** Slug → inventory row, or unresolved (publish refuses these without the ack). */
export function matchPinToDocument(
  slug: string,
  inventory: readonly InventoryRow[],
): { resolved: true; document: InventoryRow } | { resolved: false; slug: string } {
  const row = inventory.find((d) => d.sourceSlug === slug);
  if (!row) return { resolved: false, slug };
  return { resolved: true, document: row };
}

export type SessionState =
  | 'CREATED'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'SCANNING'
  | 'EXTRACTING'
  | 'INDEXING'
  | 'READY'
  | 'QUARANTINED'
  | 'FAILED';

const SESSION_LABEL: Record<SessionState, { word: string; tone: 'info' | 'success' | 'error'; fix: string }> = {
  CREATED: { word: 'Created', tone: 'info', fix: 'Transfer starting — the presigned PUT is authorized.' },
  UPLOADING: { word: 'Uploading', tone: 'info', fix: 'Bytes in flight — upload complete does not mean ready.' },
  UPLOADED: { word: 'Uploaded', tone: 'info', fix: 'Received. The pipeline still scans, extracts, and indexes.' },
  SCANNING: { word: 'Scanning', tone: 'info', fix: 'Safety checks running — the file is not servable yet.' },
  EXTRACTING: { word: 'Extracting', tone: 'info', fix: 'Text extraction running — the file is not servable yet.' },
  INDEXING: { word: 'Indexing', tone: 'info', fix: 'Chunking and embedding — the file is not servable yet.' },
  READY: { word: 'Ready', tone: 'success', fix: 'Ingested. Pin its slug to serve it.' },
  QUARANTINED: { word: 'Quarantined', tone: 'error', fix: 'Held by safety checks — upload a replacement. No retry exists.' },
  FAILED: { word: 'Failed', tone: 'error', fix: 'Ingestion failed — upload a replacement. No retry exists.' },
};

/** Session state → dot+word + fix path. Unknown states degrade truthfully. */
export function sessionStateLabel(state: string): { word: string; tone: 'info' | 'success' | 'error'; fix: string } {
  return (
    (SESSION_LABEL as Record<string, { word: string; tone: 'info' | 'success' | 'error'; fix: string }>)[state] ?? {
      word: state,
      tone: 'info' as const,
      fix: 'Unknown pipeline state — check the library before pinning.',
    }
  );
}

/** Non-terminal session older than the worker lease = stalled (re-upload safe). */
export function isSessionStalled(state: string, updatedAtMs: number | null, nowMs: number): boolean {
  if (state === 'READY' || state === 'QUARANTINED' || state === 'FAILED') return false;
  if (updatedAtMs === null) return false;
  return nowMs - updatedAtMs > SESSION_STALL_AFTER_MS;
}

export const STALLED_COPY = 'Stalled — safe to re-upload; the worker lease re-drives or expires.';

const DOCUMENT_LABEL: Record<string, { word: string; tone: 'success' | 'info' | 'error' | 'warning'; hint: string }> = {
  ready: { word: 'Ready', tone: 'success', hint: 'Indexed and retrievable.' },
  processing: { word: 'Processing', tone: 'info', hint: 'Ingestion running (scan → extract → index).' },
  failed: { word: 'Failed', tone: 'error', hint: 'Ingestion failed — re-upload the source.' },
  retired: { word: 'Retired', tone: 'warning', hint: 'Source deleted upstream (tombstone). Mapping kept, unreachable by retrieval.' },
};

/** Document state → dot+word + hint. Unknown states degrade truthfully. */
export function documentStateLabel(state: string): {
  word: string;
  tone: 'success' | 'info' | 'error' | 'warning';
  hint: string;
} {
  return (
    (DOCUMENT_LABEL as Record<string, { word: string; tone: 'success' | 'info' | 'error' | 'warning'; hint: string }>)[
      state
    ] ?? { word: state, tone: 'info' as const, hint: 'Unknown document state — check the library before pinning.' }
  );
}

export type CoverageState = 'ready' | 're-embedding' | 'incomplete';

/** Per-model coverage whisper — READY document ≠ covered (P0 bind). */
export function coverageLabel(
  state: CoverageState,
  embeddingModel: string,
): { word: string; detail: string } {
  switch (state) {
    case 'ready':
      return { word: 'ready-for-retrieval', detail: `Covered for ${embeddingModel}.` };
    case 're-embedding':
      return { word: 're-embedding-in-progress', detail: `Embedding for ${embeddingModel} — progress below.` };
    case 'incomplete':
      return {
        word: 'coverage-incomplete',
        detail: `Not covered for ${embeddingModel}. Publish will ask for the degraded-knowledge ack.`,
      };
  }
}

export const DEGRADED_ACK_COPY =
  'Acknowledging ships with unresolved or under-covered sources. Recorded in Audit as assistant.publish_degraded_acknowledged.';

export const UNMAP_COPY = 'Removes the pin. The document stays in the library.';
export const SKIP_COPY = 'Skipped is not broken — publish still gates.';
export const RETENTION_NOTE =
  'Documents can’t be deleted from this UI — the engine exposes no delete verb. Retired rows are upstream tombstones; unmap pins in the builder to stop serving them.';
export const NO_RETRY_COPY = 'No retry exists — upload a replacement.';
export const RETRIEVAL_OFF_COPY = 'Off — the agent answers from instructions and model only. Deliberate, not empty.';
