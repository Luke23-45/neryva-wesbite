/**
 * C15 pure model — operate banner math, paused wording, lineage, approval
 * urgency, copy. Zero engine imports.
 *
 * Engine binds (verified 2026-09-18, PLAN.md §1):
 * - degraded lifecycle: `degraded_until` + `degraded_reason` (≤512), 7-day
 *   waiver, T-24h warn-once (`degraded_alerted_at`), past-due auto-suspend
 *   via disable (`assistants.service.ts:1684-1700,1717-1773`, `schema.ts:41-43`).
 * - paused rows: `paused_reason` literal `'operator'` (actor in `paused_by`)
 *   vs `burn_rate: …` + actor vs NULL legacy (`rollouts.service.ts:205-207`,
 *   `burn-rate.service.ts:224-226`, `schema.ts:213-221`).
 * - NO resume route — resume = re-set (`releases.controller.ts:34`).
 * - lineage: `parent_version_id` fork/rebase/inherit/restore-as-new
 *   (`assistants.service.ts:343,439-446,773-774,926-927`).
 * - `'ROLLED_BACK'` is enum-historical, never written (`schema.ts:67,284-291).
 */

export type DegradedState = 'none' | 'active' | 'due-24h' | 'past-due-suspended';

const DAY_MS = 86_400_000;

/**
 * Degraded banner state from the assistant row + clock (sweep semantics:
 * overdue AND not disabled suspends; due-soon warns once). Unknown clock
 * input degrades to 'none' — a banner never renders from unparseable time.
 */
export function degradedBannerState(
  input: { degradedUntil: string | null; disabledAt: string | null },
  nowMs = Date.now(),
): DegradedState {
  if (!input.degradedUntil) {
    return 'none';
  }
  const until = Date.parse(input.degradedUntil);
  if (!Number.isFinite(until)) {
    return 'none';
  }
  if (until <= nowMs) {
    return input.disabledAt ? 'past-due-suspended' : 'active';
  }
  if (until - nowMs <= DAY_MS) {
    return 'due-24h';
  }
  return 'active';
}

export type PausedKind = 'operator' | 'burn-rate' | 'legacy';

export interface PausedDescription {
  kind: PausedKind;
  headline: string;
  detail: string | null;
}

/**
 * Single paused wording (OperatePanel adopts this — never two wordings).
 * Manual = reason literal 'operator' + actor; burn = `burn_rate:` prefix +
 * actor; NULL/unknown = operator-paused-legacy.
 */
export function describePausedRollout(input: {
  pausedReason: string | null;
  pausedBy: string | null;
  pausedAt: string | null;
  actorName: (id: string | null) => string | null;
}): PausedDescription {
  const when = input.pausedAt ? input.pausedAt.slice(0, 16).replace('T', ' ') : 'unknown time';
  const by = input.actorName(input.pausedBy) ?? (input.pausedBy ? input.pausedBy.slice(0, 8) : 'unknown operator');
  if (input.pausedReason && input.pausedReason.startsWith('burn_rate:')) {
    return {
      kind: 'burn-rate',
      headline: `Paused by burn-rate guard — ${when}`,
      detail: `${input.pausedReason} · by ${by}. Auto-rollback may follow; investigate before resuming.`,
    };
  }
  if (input.pausedReason === 'operator' || input.pausedReason === null) {
    return {
      kind: input.pausedReason === null ? 'legacy' : 'operator',
      headline: `Paused by ${by} — ${when}`,
      detail:
        input.pausedReason === null
          ? 'Paused before pause attribution existed — resume re-posts the current variants.'
          : 'Serving the pre-rollout fallback; the percentage is preserved for resume.',
    };
  }
  return {
    kind: 'operator',
    headline: `Paused — ${when}`,
    detail: `${input.pausedReason} · by ${by}.`,
  };
}

export type BannerTone = 'error' | 'warning' | 'info';

export interface OperateBanner {
  id: 'disabled' | 'degraded' | 'paused' | 'drift' | 'shadow';
  tone: BannerTone;
  title: string;
  detail: string;
}

export interface BannerStates {
  disabled: { at: string | null; reason: string | null } | null;
  degraded: DegradedState;
  degradedReason: string | null;
  degradedUntil: string | null;
  paused: PausedDescription | null;
  driftAlert: string | null;
  shadowOnly: boolean;
}

/**
 * One banner at a time (R1 — stacking competing banners drowns the most
 * urgent state). Severity: disabled > degraded past-due > degraded due-24h >
 * degraded active > paused > drift > shadow-info. Null = steady state.
 */
export function pickOperateBanner(states: BannerStates): OperateBanner | null {
  if (states.disabled) {
    return {
      id: 'disabled',
      tone: 'error',
      title: 'Serving disabled — run acceptance is stopped',
      detail: states.disabled.reason ? `Reason: ${states.disabled.reason}.` : 'No reason recorded.',
    };
  }
  if (states.degraded === 'past-due-suspended') {
    return {
      id: 'degraded',
      tone: 'error',
      title: 'Degraded waiver past due — serving suspended',
      detail: 'The 7-day waiver expired with pins still unresolved. Map the pins and publish healthy to resume.',
    };
  }
  if (states.degraded === 'due-24h') {
    return {
      id: 'degraded',
      tone: 'warning',
      title: `Degraded waiver expires within 24 hours${states.degradedReason ? ` — ${states.degradedReason}` : ''}`,
      detail: 'A healthy publish clears it; past-due suspends serving.',
    };
  }
  if (states.degraded === 'active') {
    return {
      id: 'degraded',
      tone: 'warning',
      title: `Shipping degraded${states.degradedReason ? ` — ${states.degradedReason}` : ''}`,
      detail: 'The waiver is named, explicit, and expires 7 days after the degraded publish.',
    };
  }
  if (states.paused) {
    return {
      id: 'paused',
      tone: 'warning',
      title: states.paused.headline,
      detail: states.paused.detail ?? 'Resume re-posts the current variants.',
    };
  }
  if (states.driftAlert) {
    return { id: 'drift', tone: 'warning', title: 'Drift signal — pins moved under a published version', detail: states.driftAlert };
  }
  if (states.shadowOnly) {
    return { id: 'shadow', tone: 'info', title: 'Shadow observations only', detail: 'Shadow — never gates. Formal evals decide releases.' };
  }
  return null;
}

export interface LineageNode {
  id: string;
  version: number;
  status: string | null;
  /** e.g. "child of v6", "restored from v5", or null for roots/orphans. */
  parentLabel: string | null;
  isActive: boolean;
  isDraft: boolean;
}

/**
 * Linear chain + rollback forks from `parent_version_id`/`rollbackOf`,
 * oldest first. Orphan-safe: a missing parent renders as a root note,
 * never a crash. Rollback births are labeled, never renumbered.
 */
export function buildLineage(
  versions: Array<{
    id: string;
    version: number;
    status: string | null;
    parentVersionId: string | null;
    rollbackOf: string | null;
  }>,
  activeVersionId: string | null,
): LineageNode[] {
  const byId = new Map(versions.map((v) => [v.id, v]));
  const numberOf = (id: string | null): number | null => {
    if (!id) return null;
    const hit = byId.get(id)?.version;
    return typeof hit === 'number' ? hit : null;
  };
  return [...versions]
    .sort((a, b) => a.version - b.version)
    .map((v) => {
      const restored = v.rollbackOf ? numberOf(v.rollbackOf) : null;
      const parent = !v.rollbackOf && v.parentVersionId ? numberOf(v.parentVersionId) : null;
      return {
        id: v.id,
        version: v.version,
        status: v.status,
        parentLabel:
          restored !== null
            ? `restored from v${restored}`
            : parent !== null
              ? `child of v${parent}`
              : null,
        isActive: v.id === activeVersionId,
        isDraft: v.status === 'DRAFT' || v.status === 'VALID' || v.status === 'VALIDATING',
      };
    });
}

/** Approval queue urgency (listable fields only — reasons live in audit). */
export function describeApprovalExpiry(expiresAt: string | null, nowMs = Date.now()): string {
  if (!expiresAt) return 'no expiry';
  const parsed = Date.parse(expiresAt);
  if (!Number.isFinite(parsed)) return 'no expiry';
  const diff = parsed - nowMs;
  if (diff <= 0) return 'expired';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `expires in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `expires in ${hours}h`;
  const days = Math.ceil(hours / 24);
  return days === 1 ? 'expires tomorrow' : `expires in ${days} days`;
}

export function describeApprovalAge(createdAt: string | null, nowMs = Date.now()): string | null {
  if (!createdAt) return null;
  const parsed = Date.parse(createdAt);
  if (!Number.isFinite(parsed)) return null;
  const minutes = Math.max(0, Math.floor((nowMs - parsed) / 60_000));
  if (minutes < 1) return 'waiting <1 min';
  if (minutes < 60) return `waiting ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `waiting ${hours}h`;
  return `waiting ${Math.floor(hours / 24)}d`;
}

/** Copy constants — every string traces to a bind or a PLAN §2 decision. */
export const OPERATE_COPY = {
  bannerScopeNote: 'Steady state — no banner-worthy condition. Banners render for unresolved states only.',
  pauseConfirmTitle: 'Pause this rollout?',
  pauseConfirmMessage:
    'Serving falls back to the pre-rollout target immediately; the percentage is preserved so resume restarts exactly here. Audited as assistant.rollout_paused.',
  disableConfirmTitle: 'Disable this agent?',
  disableConfirmMessage:
    'Run acceptance stops now; in-flight runs finish. Leave the reason empty to record the engine default (“operator kill switch”). Audited as assistant.disabled.',
  resumeLine: 'Resume re-posts the current variants at the same weights — the pause clears server-side. No separate resume endpoint exists.',
  noAutoAdvance: 'Rollouts advance by hand — there is no automatic schedule to show.',
  stickyConversation: 'Conversations already open stay pinned to the version they started on.',
  trailScopeNote: 'Newest 100 org events, this agent only.',
  trailEmpty: 'No operate events for this agent in the newest 100 org events yet.',
  killScopeNote: 'Day-1 emergency is exactly two toggles — pause the rollout, or disable the agent. Analytics, anomaly detection, and variant sliders are deferred.',
  approveRejectCopy: 'Deny requires a reason — the endpoint stores it with the decision. Approve executes inline; the run resumes.',
  missingRunCopy: 'This approval names a run the API no longer returns — open the audit trail instead of deciding blind.',
  queuesSeparateNote: 'Runtime approvals live here. Memory proposals and escalations stay in their own destinations until their list reads exist — one visual pattern when they land.',
  lineageRootNote: 'First version — nothing before it.',
} as const;
