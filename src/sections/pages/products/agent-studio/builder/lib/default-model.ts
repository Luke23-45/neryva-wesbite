/**
 * pickDefaultRow — pure match of the org default model ({ provider, model_id })
 * against the builder's flattened catalog rows.
 *
 * Rules (honest, deterministic — never invented):
 * - Only rows the availability gate confirms `usable` are candidates. A
 *   default that is toggled off, plan-gated, or otherwise unusable never
 *   pre-selects.
 * - The default contract carries no credential identity, so when the same
 *   model is served by both Platform Managed and a BYOK key, the platform
 *   row wins (deterministic; the user can switch source in the picker).
 * - No candidate → null: the caller falls back to existing behavior.
 */
import type { BuilderModelRow } from './useGroupedModels';
import type { OrgDefaultModel } from '../../providers/api';

export function pickDefaultRow(
  rows: BuilderModelRow[],
  def: OrgDefaultModel | null | undefined,
): BuilderModelRow | null {
  if (!def) return null;
  const candidates = rows.filter(
    (row) => row.usable && row.provider === def.provider && row.modelId === def.model_id,
  );
  if (candidates.length === 0) return null;
  return candidates.find((row) => row.credentialId === null) ?? candidates[0];
}
