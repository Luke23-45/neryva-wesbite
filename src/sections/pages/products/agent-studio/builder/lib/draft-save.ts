/**
 * Shared draft-save mechanics (C03 PLAN.md §6) — the single debounce constant
 * and the full-payload builder both surfaces write through. Two debounce
 * constants would be config slop; a partial body would be a 422 trap.
 */
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

/** Room parity: every save mints an immutable version — no tight debounce. */
export const AUTOSAVE_MS = 8000;

/**
 * Full draft payload with a field swapped in — NEVER partial (the engine
 * rejects unknown keys and omits blanks itself; the caller owns validity).
 */
export function buildDraftPayload(
  definition: AgentDefinition,
  patch: Partial<AgentDefinition>,
): AgentDefinition {
  return { ...definition, ...patch };
}
