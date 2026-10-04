/**
 * Providers page shared API contract (Phase 5).
 *
 * Thin typed wrappers over the engine console endpoints, mirroring the
 * engine DTOs exactly (engine `src/modules/assistants/` @ 98b5224 — do not
 * guess shapes; these were lifted from the controllers/services). All calls
 * go through the shared `engine<T>()` client (auth, org scoping, ApiError).
 *
 * Waves A/B/C/D all import from here — this file is the integration seam.
 */

import { engine } from '@/lib/engine/client';

// ---------------------------------------------------------------------------
// Shared types (engine DTO mirrors)
// ---------------------------------------------------------------------------

export type OrgModelTier = 'free' | 'payg' | 'enterprise';
export type Supergroup = 'platform' | 'byok';
export type ProviderDirectoryCapability = 'tools' | 'vision' | 'reasoning' | 'structured_output';
export type VerificationStatus = 'unverified' | 'verifying' | 'verified' | 'failed' | 'revoked';

export interface ProviderDirectoryEntry {
  provider: string;
  display_name: string;
  transport?: string;
  model_count: number;
  models: Array<{ model_id: string; display_name: string }>;
  /** Min input price over the provider's models, USD/1M — absent when unpriced, never zero-invented. */
  from_price_per_1m?: string;
  capabilities: ProviderDirectoryCapability[];
  connection: { has_active_credential: boolean; enabled: boolean };
  min_required_product: OrgModelTier;
  min_required_product_label: string;
}

export interface ModelRowView {
  model_id: string;
  display_name: string;
  required_product: OrgModelTier;
  required_product_label: string;
  /** From org_model_toggles; absent row = true. */
  enabled: boolean;
  usable: boolean;
  reasons: string[];
  /** Normalized four-key vocabulary (probed values win for display). */
  capabilities: Record<ProviderDirectoryCapability, boolean>;
  /** Catalog list prices, USD/1M — absent when unpriced. */
  pricing?: { input_per_1m: string; output_per_1m: string };
  pinned_by: Array<{ assistant_id: string; version: number }>;
}

export interface ModelGroupView {
  provider: string;
  provider_display_name: string;
  /** Set only for BYOK groups. */
  credential_id?: string;
  credential_label?: string;
  /** Fingerprint ONLY — secret material never leaves the row. */
  credential_fingerprint?: string;
  models: ModelRowView[];
}

export interface ModelToggleInput {
  supergroup: Supergroup;
  provider: string;
  model_id: string;
  /** Nil UUID for platform rows; real UUID for BYOK rows. */
  credential_id?: string;
  enabled: boolean;
}

export interface ProviderCredentialView {
  id: string;
  provider: string;
  label: string;
  external_ref: string;
  source: string;
  status: string;
  secret_fingerprint: string;
  created_at: string | null;
  rotated_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  compromised: boolean;
  priority: number;
  enabled: boolean;
  allowed_models: string[] | null;
  allowed_assistants: string[] | null;
  shared_capacity_fallback: 'use_shared' | 'never_for_covered_models' | 'never_for_provider';
  transport: string;
  base_url: string | null;
  /** Header NAMES only — values are envelope-sealed and never leave the row. */
  custom_header_names: string[] | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  last_probe_latency_ms: number | null;
  discovered_models: unknown;
  zdr_attestation: string | null;
  region_attestation: string | null;
  attested_by: string | null;
  attested_at: string | null;
}

export interface DiscoveredModel {
  id: string;
  display_name: string;
  context_window_tokens: number;
  max_output_tokens?: number;
  capabilities: { tools: boolean; vision: boolean; reasoning: boolean; structured_output: boolean };
}

export interface ProbeResult {
  status: 'ok' | 'failed';
  latency_ms: number;
  models: DiscoveredModel[];
  error?: string;
  error_code?: string;
}

export interface CredentialUsageView {
  requests: number;
  tokens: { prompt: number; completion: number; total: number };
  spend_usd: string;
  /** Labeled list-price equivalent — never presented as billed. Absent when unpriced. */
  list_price_equivalent_usd?: string;
  pricing_basis: 'settled' | 'list';
  error_breakdown: { '401': number; '403': number; '429': number; '5xx': number };
  window: '7d' | '30d';
}

// ---------------------------------------------------------------------------
// N-4 provider directory
// ---------------------------------------------------------------------------

export async function fetchProviderDirectory(
  orgId: string,
  filters?: { search?: string; tier?: OrgModelTier; capability?: ProviderDirectoryCapability },
): Promise<{ providers: ProviderDirectoryEntry[] }> {
  const query: Record<string, string> = {};
  if (filters?.search) query.search = filters.search;
  if (filters?.tier) query.tier = filters.tier;
  if (filters?.capability) query.capability = filters.capability;
  return engine<{ providers: ProviderDirectoryEntry[] }>(`/console/org/${orgId}/models/providers`, {
    query,
  });
}

// ---------------------------------------------------------------------------
// N-5 grouped models
// ---------------------------------------------------------------------------

export async function fetchGroupedModels(
  orgId: string,
  supergroup?: Supergroup,
): Promise<{ platform: ModelGroupView[]; byok: ModelGroupView[] }> {
  return engine<{ platform: ModelGroupView[]; byok: ModelGroupView[] }>(
    `/console/org/${orgId}/models/grouped`,
    { query: supergroup ? { supergroup } : {} },
  );
}

// ---------------------------------------------------------------------------
// N-6 toggles
// ---------------------------------------------------------------------------

export async function postModelToggles(
  orgId: string,
  toggles: ModelToggleInput[],
): Promise<{ success: true; updated_count: number }> {
  return engine<{ success: true; updated_count: number }>(`/console/org/${orgId}/models/toggles`, {
    method: 'POST',
    body: { toggles },
  });
}

// ---------------------------------------------------------------------------
// Credentials (N-1/N-2/N-3)
// ---------------------------------------------------------------------------

export async function fetchCredentials(orgId: string): Promise<{ credentials: ProviderCredentialView[] }> {
  return engine<{ credentials: ProviderCredentialView[] }>(`/console/org/${orgId}/provider-credentials`);
}

export interface CreateCredentialInput {
  provider: string;
  label: string;
  secret: string;
  transport?: string;
  base_url?: string;
  custom_headers?: Record<string, string>;
  priority?: number;
  /** Engine N-2 accepts `enabled` — `enabled: false` is "Save as Inactive" (controller comment). */
  enabled?: boolean;
  allowed_models?: string[];
  allowed_assistants?: string[];
  shared_capacity_fallback?: ProviderCredentialView['shared_capacity_fallback'];
  zdr_attestation?: string;
  region_attestation?: string;
}

export async function createCredential(
  orgId: string,
  input: CreateCredentialInput,
): Promise<{ credential: ProviderCredentialView }> {
  return engine<{ credential: ProviderCredentialView }>(`/console/org/${orgId}/provider-credentials`, {
    method: 'POST',
    body: input,
  });
}

export async function patchCredential(
  orgId: string,
  id: string,
  patch: Partial<Omit<CreateCredentialInput, 'provider' | 'secret'>> & { enabled?: boolean },
): Promise<{ credential: ProviderCredentialView }> {
  return engine<{ credential: ProviderCredentialView }>(`/console/org/${orgId}/provider-credentials/${id}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function probeCredential(
  orgId: string,
  input: { provider: string; secret?: string; transport?: string; base_url?: string; custom_headers?: Record<string, string> },
  signal?: AbortSignal,
): Promise<ProbeResult> {
  return engine<ProbeResult>(`/console/org/${orgId}/provider-credentials/probe`, {
    method: 'POST',
    body: input,
    signal,
  });
}

export async function verifyCredential(
  orgId: string,
  id: string,
): Promise<{ credential: ProviderCredentialView }> {
  return engine<{ credential: ProviderCredentialView }>(
    `/console/org/${orgId}/provider-credentials/${id}/verify`,
    { method: 'POST' },
  );
}

export async function rotateCredential(
  orgId: string,
  id: string,
  secret: string,
): Promise<{ credential: ProviderCredentialView }> {
  return engine<{ credential: ProviderCredentialView }>(
    `/console/org/${orgId}/provider-credentials/${id}/rotate`,
    { method: 'POST', body: { secret } },
  );
}

export async function revokeCredential(
  orgId: string,
  id: string,
  reason?: string,
): Promise<{ credential: ProviderCredentialView }> {
  return engine<{ credential: ProviderCredentialView }>(
    `/console/org/${orgId}/provider-credentials/${id}/revoke`,
    { method: 'POST', body: reason ? { reason } : {} },
  );
}

// ---------------------------------------------------------------------------
// N-7 usage
// ---------------------------------------------------------------------------

export async function fetchCredentialUsage(
  orgId: string,
  id: string,
  window: '7d' | '30d',
): Promise<CredentialUsageView> {
  return engine<CredentialUsageView>(`/console/org/${orgId}/provider-credentials/${id}/usage`, {
    query: { window },
  });
}
