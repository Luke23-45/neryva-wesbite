import type { ConsumerDefinition } from '@lib/engine/agent-payload';

/**
 * Honest "changed since" attribution for the Overview version card
 * (redesign ledger D-R7).
 *
 * The engine keeps no changed-sections column, so the count is derived
 * client-side by deep-comparing the working draft definition against the
 * live version's definition. Both are console-shaped (`fromEnginePayload`
 * normalizes every version row), so the comparison is shape-consistent.
 *
 * Key → section attribution (documented, unit-tested — fuzzy attribution
 * would be a Law VII violation):
 *   instructions → instructions
 *   brand → brand
 *   role → role
 *   model_policy → model
 *   model_params.reasoning_effort → brain (the Brain section owns the
 *     reasoning profile); every other model_params member → model
 *   context_policy.knowledge_sources → knowledge (the Knowledge section
 *     pins sources there); every other context_policy member → context
 *     (history, summary, scope, and the v1.15 max_context_tokens budget)
 *   knowledge_policy → knowledge
 *   guardrails → guardrails
 *   tools → tools
 *   budget → budget
 *   response_policy → response
 *   retrieval → EXCLUDED: derived display data (`fromEnginePayload`
 *     computes it from the row), not authored in the builder.
 */

/** Order matches the section navigation. */
const SECTION_ORDER = [
  'purpose',
  'instructions',
  'role',
  'brand',
  'model',
  'brain',
  'knowledge',
  'context',
  'memory',
  'tools',
  'credentials',
  'guardrails',
  'response',
  'budget',
  'samples',
  'try',
  'evaluation',
  'ship',
] as const;

/** Key-order-insensitive deep equality for JSON-shaped values. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj).sort();
    const bKeys = Object.keys(bObj).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key, index) => key === bKeys[index] && deepEqual(aObj[key], bObj[key]));
  }
  return false;
}

function pickChanged<T extends Record<string, unknown>>(
  draftPart: T | undefined,
  livePart: T | undefined,
  memberToSection: (member: string) => string,
  changed: Set<string>,
): void {
  const members = new Set([...Object.keys(draftPart ?? {}), ...Object.keys(livePart ?? {})]);
  for (const member of members) {
    if (!deepEqual(draftPart?.[member], livePart?.[member])) {
      changed.add(memberToSection(member));
    }
  }
}

/**
 * Returns the section ids whose authored content differs between the draft
 * and the live version, in navigation order. Either side may be null (no
 * draft / never published) — then there is nothing honest to report and the
 * result is empty; the caller hides the count line instead of faking it.
 */
export function diffChangedSections(
  draft: ConsumerDefinition | null | undefined,
  live: ConsumerDefinition | null | undefined,
): string[] {
  if (!draft || !live) return [];
  const changed = new Set<string>();
  const d = draft as unknown as Record<string, unknown>;
  const l = live as unknown as Record<string, unknown>;

  const wholeKey = (key: string, section: string): void => {
    if (!deepEqual(d[key], l[key])) changed.add(section);
  };

  wholeKey('instructions', 'instructions');
  wholeKey('brand', 'brand');
  wholeKey('role', 'role');
  wholeKey('model_policy', 'model');
  wholeKey('knowledge_policy', 'knowledge');
  wholeKey('guardrails', 'guardrails');
  wholeKey('tools', 'tools');
  wholeKey('budget', 'budget');
  wholeKey('response_policy', 'response');

  pickChanged(
    d.model_params as Record<string, unknown> | undefined,
    l.model_params as Record<string, unknown> | undefined,
    (member) => (member === 'reasoning_effort' ? 'brain' : 'model'),
    changed,
  );
  pickChanged(
    d.context_policy as Record<string, unknown> | undefined,
    l.context_policy as Record<string, unknown> | undefined,
    (member) => (member === 'knowledge_sources' ? 'knowledge' : 'context'),
    changed,
  );

  return SECTION_ORDER.filter((section) => changed.has(section));
}
