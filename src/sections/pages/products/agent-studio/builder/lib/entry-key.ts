/**
 * Pipeline entry key — the single identity for a (model ref, credential pin)
 * pair across the builder (Phase 6, doc 20 §3.1 / PRV-075).
 *
 * Mirrors the engine's pin index exactly
 * (engine `model-catalog.service.ts` groupedModels: `byok|<provider>/<model>|<credentialId>`
 * for pinned entries, `platform|<provider>/<model>|` for unpinned ones), so a
 * catalog picker row key and a pipeline entry key for the same selection are
 * the same string and matching is trivial. `credential_id: null`/absent is the
 * platform pool (PRV-024) — never a guess at an org default.
 */
export function pipelineEntryKey(ref: string, credentialId: string | null | undefined): string {
  return credentialId ? `byok|${ref}|${credentialId}` : `platform|${ref}|`;
}
