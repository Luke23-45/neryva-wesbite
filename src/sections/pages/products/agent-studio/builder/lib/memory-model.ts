/**
 * C08 memory model — pure scope/history/policy grading (C08 PLAN §4).
 *
 * Engine truth mirrored here (cited, never re-derived per view):
 * - scope enum user|organization|conversation|none, default user
 *   (`engine/src/modules/assistants/validation.ts:63-66`; Studio contract
 *   `v1.schema.json:104-109`);
 * - runtime scope semantics FL-1.5
 *   (`engine/src/modules/conversations/mcp-authority.service.ts:2036-2144`);
 * - served-history clamp min(pinned,20) (:2066-2067);
 * - unconditional compaction (:2089-2107; `summary_enabled` read nowhere);
 * - org policy fail-open (`engine/src/modules/knowledge/memory.service.ts:60-133`).
 */

export type MemoryScope = 'user' | 'conversation' | 'organization' | 'none';

/** Engine enum order — `user` first because it is the default (never omitted). */
export const MEMORY_SCOPE_ORDER: readonly MemoryScope[] = ['user', 'conversation', 'organization', 'none'];

/** Parse wire/unknown scope → engine enum; garbage resolves the default (C06 precedent). */
export function parseMemoryScope(raw: unknown): MemoryScope {
  return raw === 'conversation' || raw === 'organization' || raw === 'none' ? raw : 'user';
}

export type ConsumerScope = 'user' | 'none' | 'conversation' | 'org';

/** Console displays `org`; the wire carries `organization` (agent-payload mapping). */
export function toConsumerScope(scope: MemoryScope): ConsumerScope {
  return scope === 'organization' ? 'org' : scope;
}

export function fromConsumerScope(scope: ConsumerScope): MemoryScope {
  return scope === 'org' ? 'organization' : scope;
}

/**
 * SINGLE consequence source — every scope control, hint, and panel reads this.
 * Each string traces to the FL-1.5 runtime block cited.
 */
export const SCOPE_CONSEQUENCES: Record<MemoryScope, string> = {
  user: 'Only this person\u2019s own memories — never visible across accounts. The engine default.',
  conversation: 'This thread only — nothing carries to the next chat.',
  organization: 'Org-wide memories — every run of this agent sees them.',
  none: 'No memories surface — the agent runs on the thread alone.',
};

export const HISTORY_MIN = 1;
export const HISTORY_MAX = 100;
/** The run serves at most this many recent messages (mcp-authority:2066-2067). */
export const HISTORY_SERVED_MAX = 20;

export function servedHistory(limit: number): number {
  if (!Number.isInteger(limit)) return HISTORY_SERVED_MAX;
  return Math.min(Math.max(HISTORY_MIN, limit), HISTORY_SERVED_MAX);
}

/** Engine accepts 100; the run serves 20 — state, never cap. */
export const SERVED_20_COPY = 'Runs serve the 20 most recent — higher values are stored, not served.';

/** Compaction attaches unconditionally outside the window (read path cited above). */
export const COMPACTION_COPY = 'Older turns arrive as a rolling summary outside the window.';

/** Why the builder never previews user rows (actor resolves per run). */
export const USER_PREVIEW_COPY =
  'User memories resolve per account at run time — no preview here. Service triggers with no account see zero memories, never another scope.';

export interface MemoryPolicyState {
  memory_scope: MemoryScope;
  history_limit: number;
}

export interface MemoryGrade {
  status: 'ready';
  subtitle: string;
  hint: string;
}

/**
 * Projector grading (PLAN §6): memory never degrades — no attention state
 * exists (embedding/proposal health is C10/C15 territory, never invented).
 */
export function gradeMemory(policy: MemoryPolicyState): MemoryGrade {
  if (policy.memory_scope === 'none') {
    return { status: 'ready', subtitle: 'None — thread only', hint: '' };
  }
  const scopeLabel = policy.memory_scope.charAt(0).toUpperCase() + policy.memory_scope.slice(1);
  const subtitle =
    policy.history_limit > HISTORY_SERVED_MAX
      ? `${scopeLabel} · history ${policy.history_limit} (serves ≤${HISTORY_SERVED_MAX})`
      : `${scopeLabel} · history ${policy.history_limit}`;
  return {
    status: 'ready',
    subtitle,
    hint: policy.history_limit > HISTORY_SERVED_MAX ? 'Runs serve the 20 most recent.' : '',
  };
}

// ─── Org policy (fail-open mirror of readMemoryPolicy) ───────────────────────

export type MemoryScrub = 'off' | 'redact' | 'block';

export interface OrgMemoryPolicy {
  scrub: MemoryScrub;
  /** Null = no default TTL (legacy posture). */
  ttlSeconds: number | null;
}

export function parseOrgMemoryPolicy(preferences: Record<string, unknown> | null | undefined): OrgMemoryPolicy {
  const prefs = preferences ?? {};
  const scrubRaw = prefs.memory_pii_scrubbing;
  const scrub: MemoryScrub = scrubRaw === 'redact' || scrubRaw === 'block' ? scrubRaw : 'off';
  const ttlRaw = prefs.memory_ttl_default_seconds;
  const ttlSeconds =
    typeof ttlRaw === 'number' && Number.isInteger(ttlRaw) && ttlRaw >= 3600 && ttlRaw <= 315_360_000
      ? ttlRaw
      : null;
  return { scrub, ttlSeconds };
}

export const SCRUB_COPY: Record<MemoryScrub, string> = {
  off: 'Off — memories store verbatim.',
  redact: 'Redact — PII scrubbed before embedding.',
  block: 'Block — writes with PII refused (422).',
};

export function describeTtl(ttlSeconds: number | null): string {
  if (ttlSeconds === null) return 'No default TTL — kept until deleted.';
  const days = ttlSeconds / 86_400;
  if (Number.isInteger(days)) return days === 1 ? '1 day' : `${days} days`;
  const hours = ttlSeconds / 3600;
  if (Number.isInteger(hours)) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${ttlSeconds} seconds`;
}

// ─── Library helpers ─────────────────────────────────────────────────────────

export interface MemoryRowLike {
  id: string;
  content: string | null;
}

/** Substring search over content (case-insensitive); blank query matches all. */
export function filterMemories<T extends MemoryRowLike>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (q === '') return items;
  return items.filter((item) => (item.content ?? '').toLowerCase().includes(q));
}

/** Relative display for Created/Expires cells; absolute title left to the view. */
export function relativeTime(iso: string | null | undefined, nowMs = Date.now()): string {
  if (!iso) return '—';
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return '—';
  const diffMs = parsed - nowMs;
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  const prefix = diffMs < 0 ? '' : 'in ';
  const suffix = diffMs < 0 ? ' ago' : '';
  if (abs < hour) {
    const minutes = Math.max(1, Math.round(abs / minute));
    return `${prefix}${minutes} min${minutes === 1 ? '' : 's'}${suffix}`;
  }
  if (abs < day) {
    const hours = Math.round(abs / hour);
    return `${prefix}${hours} hour${hours === 1 ? '' : 's'}${suffix}`;
  }
  const days = Math.round(abs / day);
  return `${prefix}${days} day${days === 1 ? '' : 's'}${suffix}`;
}

/** Composer cap: the engine silent-truncates at 8192 (memory.service create). */
export const MEMORY_CONTENT_MAX = 8192;

/** Purge bounds: the engine refuses substrings outside 3–128 (purgeByContent). */
export const PURGE_SUBSTRING_MIN = 3;
export const PURGE_SUBSTRING_MAX = 128;

export function validatePurgeSubstring(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < PURGE_SUBSTRING_MIN || trimmed.length > PURGE_SUBSTRING_MAX) {
    return 'Purge text is 3–128 characters — shorter queries would match the corpus by accident.';
  }
  return null;
}

/** Blast-radius + tombstone + hash-audit honesty (research R2, binds §1). */
export const PURGE_COPY =
  'Every scope. Tombstoned — retrieval stops immediately. The query itself is never stored: the audit keeps a hash, the count, and the ids.';
