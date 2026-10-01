/**
 * Free demo provider — pinned interface constants and pure helpers.
 *
 * Build spec v3 (`docs/plans/mock-provider-free-tier.md`): the demo is a
 * deterministic Studio adapter (`providerId: 'mock'`, model `neryva/demo`)
 * governed by Engine policy (catalog, entitlement, quota, publish gate).
 *
 * Everything here is PRESENTATION of that pinned contract — the frontend
 * never decides entitlement. Usability, defaulting, and limits come from
 * the Engine's `availableFor` availability rows; these helpers only
 * recognize the demo's stable identifiers so the UI can label it honestly.
 */

/** Studio model-gateway provider id for the demo adapter (pinned, spec §9). */
export const DEMO_PROVIDER_ID = 'mock';
/** Demo model id (pinned, spec §9). */
export const DEMO_MODEL_ID = 'neryva/demo';
/** Canonical `provider/model` ref for the demo model. */
export const DEMO_MODEL_REF = `${DEMO_PROVIDER_ID}/${DEMO_MODEL_ID}`;
/** Quota product the demo reserves against — never the credit balance (pinned, spec §9). */
export const DEMO_QUOTA_PRODUCT = 'agent_studio_demo';

/** Exact render copy (spec §1) — never paraphrased. */
export const DEMO_DISPLAY_NAME = 'Free demo — mock responses, not AI';
export const DEMO_GROUP_LABEL = 'Free demo';
export const DEMO_TOOLTIP =
  'A free demo model with scripted responses — not AI-generated. Good for trying the builder end to end; usage is limited.';
export const DEMO_TRY_BANNER =
  "You're chatting with a demo model — responses are simulated, not AI-generated.";

/** True for the demo adapter's provider id (pinned). */
export function isDemoProvider(provider: string | null | undefined): boolean {
  return provider === DEMO_PROVIDER_ID;
}

/**
 * True for the demo model's reference. Accepts both the bare model id
 * (`neryva/demo`) and the canonical `provider/model` ref
 * (`mock/neryva/demo`) — the ref is `provider/model` shaped and the model
 * id itself contains a slash, so both spellings are plausible on the wire.
 */
export function isDemoModelRef(ref: string | null | undefined): boolean {
  if (typeof ref !== 'string' || ref.trim() === '') return false;
  return ref === DEMO_MODEL_ID || ref === DEMO_MODEL_REF || ref.endsWith(`/${DEMO_MODEL_ID}`);
}

/** True for the demo quota product (pinned). */
export function isDemoQuotaProduct(product: string | null | undefined): boolean {
  return product === DEMO_QUOTA_PRODUCT;
}

/**
 * Quota product from an engine `quota_exceeded` error's details (wire
 * shape: `{ product: 'agent_studio_demo', ... }`). Null when absent —
 * the caller renders the generic limit copy, never a guess.
 */
export function quotaProductFromDetails(details: unknown): string | null {
  if (typeof details !== 'object' || details === null) return null;
  const product = (details as Record<string, unknown>).product;
  return typeof product === 'string' && product.trim() !== '' ? product : null;
}
