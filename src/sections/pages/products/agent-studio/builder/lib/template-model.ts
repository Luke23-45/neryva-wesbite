/**
 * C11 pure model — template names, install outcomes, updates, drift, counts.
 *
 * Engine binds (verified 2026-09-18, PLAN.md §1):
 * - install = POST assistants {template} (roles owner/admin/developer);
 *   order get → 403 platform-block → validate → name 2–128 → pins →
 *   TX(org 409-block → rows → outbox) → audit `template.installed`;
 *   failures are 400 (validation), 403 (platform block), 409 (org block,
 *   name collision); DRAFT v0 verbatim, instructions nullable, active
 *   pointer untouched, description auto-set and immutable after.
 * - compat 4 codes, COMPATIBLE/INCOMPATIBLE — tool-pin rows BLOCK install
 *   (engine TPL-2.2 gate: 400 `tool_policy: template tool pins unresolved:
 *   <name>: no ENABLED tool_catalog row at this org`); model/knowledge
 *   rows are advisory.
 * - `installed` bool + `update_available` none|minor|major per org.
 * - NO update/migrate endpoint (adoption = re-install-as-new + diff);
 *   NO description route; NO provisioning progress read.
 */
import { ApiError } from '@lib/engine/client';

/** Name bounds — mirrors the install path (`templates.service.ts:230-233`). */
export const TEMPLATE_NAME_MIN = 2;
export const TEMPLATE_NAME_MAX = 128;

export function validateTemplateName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim();
  if (name.length < TEMPLATE_NAME_MIN || name.length > TEMPLATE_NAME_MAX) {
    return { ok: false, error: 'Names are 2–128 characters.' };
  }
  return { ok: true, name };
}

/** Copy constants — every string traces to a bind or a PLAN decision. */
export const TEMPLATE_COPY = {
  neverLive: 'Install copies into a draft — never live. The active pointer is untouched.',
  advisory:
    'Compatibility is checked at install — unresolved tool pins block it. Resolve each row in the checklist first; other rows are advisory.',
  updateMinor: 'Improvements available.',
  updateMajor: 'New major version available.',
  reinstallConfirm: 'Re-install creates ANOTHER assistant — same slug, new draft. Nothing merges.',
  noAutoMigrate: 'Adoption is manual — runs stay pinned, nothing auto-migrates.',
  descriptionImmutable: 'Description is set by the template and cannot be edited later.',
  installedNoRoute: 'Installed in this org. Re-install creates another assistant.',
  provisioningHonest: 'Copies now, fulfills async — the draft is editable immediately. Provisioning seeds tool pins, knowledge, and the eval dataset.',
  auditLink: 'Recorded in Audit ›',
  compatSearchHint: 'Search name, tools, knowledge, evaluators…',
} as const;

export type InstallOutcomeKind =
  | 'renamed'
  | 'platform-blocked'
  | 'org-blocked'
  | 'tool-unresolvable'
  | 'registry-bug'
  | 'unknown';

export interface InstallOutcome {
  kind: InstallOutcomeKind;
  headline: string;
  detail: string;
  /** False for platform blocks — the user cannot retry those. */
  retryable: boolean;
}

function detailsRecord(error: ApiError): Record<string, unknown> {
  return typeof error.details === 'object' && error.details !== null ? (error.details as Record<string, unknown>) : {};
}

function firstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

/**
 * Pull tool names out of the engine's TPL-2.2 detail string:
 * "template tool pins unresolved: <name>: no ENABLED tool_catalog row at
 * this org[; <name>: schema_hash drift — ...]". Each problem is
 * "<tool name>: <reason>"; the name is the segment before the first colon.
 * Returns [] when nothing parseable is present (caller falls back to
 * 'required').
 */
function extractUnresolvedToolNames(toolPolicy: string | null): string[] {
  if (!toolPolicy) {
    return [];
  }
  const afterPrefix = toolPolicy.split(/tool pins unresolved:/i)[1] ?? toolPolicy;
  return afterPrefix
    .split(';')
    .map((segment) => segment.split(':')[0]?.trim() ?? '')
    .filter((name) => name.length > 0 && name.length <= 128);
}

/**
 * Install-time outcome resolver (SPEC I2–I5 + I8-shape errors). Matches
 * status + message/detail keys — copy names fixes, never codes.
 * Min-engine-schema (I6) is a client pre-check, not an error path.
 */
export function describeInstallOutcome(error: unknown): InstallOutcome {
  if (error instanceof ApiError) {
    const details = detailsRecord(error);
    const message = `${error.message} ${firstString(details, ['name', 'template', 'tool', 'definition', 'detail']) ?? ''}`.toLowerCase();
    if (error.status === 409 && message.includes('already taken')) {
      return {
        kind: 'renamed',
        headline: 'Name taken — pick another name.',
        detail: 'Same one-tap rename as a hand-made agent: the overlay stays, nothing was created.',
        retryable: true,
      };
    }
    if (error.status === 403 || message.includes('is blocked')) {
      const reason = firstString(details, ['reason']) ?? null;
      const platform = error.status === 403;
      return {
        kind: platform ? 'platform-blocked' : 'org-blocked',
        headline: platform ? 'Install blocked — platform hold.' : 'Install blocked for this org.',
        detail: `${reason ? `${reason}. ` : ''}Pick another template — this one cannot be retried by you.`,
        retryable: false,
      };
    }
    // Tool pins fail with 400 + details.tool_policy =
    // "template tool pins unresolved: <name>: no ENABLED tool_catalog row
    // at this org[; ...]" (engine TPL-2.2 gate). Match the key and the
    // engine's wording — older shapes used details.tool / 'unknown' /
    // 'disabled' and are still honored below.
    if (error.status === 400) {
      const toolPolicy =
        typeof details.tool_policy === 'string' && details.tool_policy.trim() !== ''
          ? details.tool_policy
          : null;
      const pinsUnresolved = toolPolicy !== null && toolPolicy.toLowerCase().includes('tool pins unresolved');
      const tool = firstString(details, ['tool', 'tool_name']);
      if (tool || pinsUnresolved || message.includes('unknown') || message.includes('disabled')) {
        const names = tool ? [tool] : extractUnresolvedToolNames(toolPolicy);
        const label = names.length > 0 ? names.join(', ') : 'required';
        return {
          kind: 'tool-unresolvable',
          headline: `Tool “${label}” cannot resolve here.`,
          detail: 'Ask an admin to enable it in the catalog, or pick another template. Nothing was created.',
          retryable: true,
        };
      }
      return {
        kind: 'registry-bug',
        headline: 'This template failed validation — a registry bug, not your input.',
        detail: 'Report it. You cannot fix a template; pick another one meanwhile. Nothing was created.',
        retryable: false,
      };
    }
  }
  return {
    kind: 'unknown',
    headline: 'Install failed before creating anything.',
    detail: 'Nothing was created — try again, or pick another template.',
    retryable: true,
  };
}

export type UpdateAction = 'silent' | 'minor' | 'major';

export interface UpdateView {
  action: UpdateAction;
  badge: string | null;
  /** Adoption is always re-install-as-new + diff (Q1 — no update path). */
  cta: string | null;
}

export function describeUpdateAction(updateAvailable: string, latestVersion: string): UpdateView {
  if (updateAvailable === 'major') {
    return {
      action: 'major',
      badge: 'New major version available.',
      cta: `Install v${latestVersion} as new assistant`,
    };
  }
  if (updateAvailable === 'minor') {
    return {
      action: 'minor',
      badge: 'Improvements available.',
      cta: `Install v${latestVersion} as new assistant`,
    };
  }
  return { action: 'silent', badge: null, cta: null };
}

export interface TemplateCounts {
  tools: number;
  knowledge: number;
  models: number;
  evaluators: number;
}

/**
 * "What you get" BOM counts from the entry (SPEC gallery binds — counts,
 * never a data grid).
 */
export function describeTemplateCounts(template: {
  bindings: { tools: { required: unknown[] }; knowledge: { required: unknown[] } };
  definition: { model_policy?: { allowed_models?: unknown } };
  evalRef: { evaluators?: { evaluators?: unknown[] } } | null;
}): TemplateCounts {
  const models = template.definition.model_policy?.allowed_models;
  const evaluators = template.evalRef?.evaluators?.evaluators;
  return {
    tools: template.bindings.tools.required.length,
    knowledge: template.bindings.knowledge.required.length,
    models: Array.isArray(models) ? models.length : 0,
    evaluators: Array.isArray(evaluators) ? evaluators.length : 0,
  };
}

export function formatTemplateCounts(counts: TemplateCounts): string {
  return `${counts.tools} tools · ${counts.knowledge} knowledge · ${counts.models} models · ${counts.evaluators > 0 ? 'seeded evals' : 'no seeded evals'}`;
}

export type TemplateDrift = 'up-to-date' | 'minor' | 'major' | 'unknown';

/**
 * Install-vs-registry drift from the provenance read + live detail row.
 * Compares installed templateVersion against the live row version with
 * semver-major sensitivity; unparseable or missing rows never claim
 * currency (unknown, not up-to-date).
 */
export function checkTemplateDrift(installedVersion: string | null, liveVersion: string | null): TemplateDrift {
  if (!installedVersion || !liveVersion) return 'unknown';
  if (installedVersion === liveVersion) return 'up-to-date';
  const majorOf = (v: string): string | null => {
    const match = v.trim().replace(/^v/i, '').match(/^(\d+)/);
    return match ? match[1] : null;
  };
  const a = majorOf(installedVersion);
  const b = majorOf(liveVersion);
  if (a === null || b === null) return 'unknown';
  return a === b ? 'minor' : 'major';
}
