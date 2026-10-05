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

import { engine, engineDownload } from '@/lib/engine/client';

// ---------------------------------------------------------------------------
// Shared types (engine DTO mirrors)
// ---------------------------------------------------------------------------

export type OrgModelTier = 'free' | 'payg' | 'enterprise';
export type Supergroup = 'platform' | 'byok';
export type ProviderDirectoryCapability = 'tools' | 'vision' | 'reasoning' | 'structured_output';
export type VerificationStatus = 'unverified' | 'verifying' | 'verified' | 'failed' | 'revoked';

export type ProviderPricingMode = 'per_model' | 'varies' | 'custom' | 'pass_through';
export type DataQuality = 'complete' | 'incomplete';

export interface ProviderDirectoryEntry {
  provider: string;
  display_name: string;
  transport?: string;
  model_count: number;
  /** Display label for model count (e.g., "300+" for OpenRouter). */
  model_count_label?: string;
  models: Array<{ model_id: string; display_name: string }>;
  /** Min input price over the provider's models, USD/1M — absent when unpriced, never zero-invented. */
  from_price_per_1m?: string;
  /** Min output price over the provider's models, USD/1M — absent when unpriced, never zero-invented. */
  to_price_per_1m?: string;
  /** Max context window over the provider's models — absent when unknown. */
  max_context_tokens?: number;
  /** Display label for context (e.g., "Varies", "1M"). */
  context_label?: string;
  /**
   * Effective serving door for this org: 'byok' when the org holds a
   * verified active credential for the provider, else 'platform'.
   * The row's source line names this door.
   */
  door: 'platform' | 'byok';
  /** BYOK door only: the serving credential's label + fingerprint (never secret material). */
  credential_label?: string;
  credential_fingerprint?: string;
  /** Catalog section header — server-side grouping from the provider registry. */
  section: string;
  /** Pricing vocabulary for the row (registry-backed; default 'per_model'). */
  pricing_mode: ProviderPricingMode;
  /**
   * 'incomplete' when data_quality_reasons is non-empty — the console
   * renders the honest incomplete treatment, never as healthy.
   */
  data_quality: DataQuality;
  data_quality_reasons: string[];
  /**
   * True when ≥1 of the provider's models is staff-attested ZDR-capable.
   * Absent = unknown — never presented as incapable.
   */
  zdr_capable?: boolean;
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
  /**
   * PRV-035 — where the pricing came from. `operator_declared` = the
   * credential operator's manual declaration (Law VII: labeled, never
   * presented as a verified catalog price).
   */
  pricing_source?: 'catalog' | 'operator_declared';
  /**
   * Catalog context window, tokens. Served by N-5; absent/null = unknown —
   * the console renders "—", never an invented value.
   */
  context_window_tokens?: number | null;
  pinned_by: Array<{ assistant_id: string; version: number }>;
}

/** The org's default model for new assistants (engine N-5/N-8). */
export interface OrgDefaultModel {
  provider: string;
  model_id: string;
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
  /**
   * Engine-served display name (additive). Absent on older engines — the UI
   * falls back to the client-side providerDisplayName map.
   */
  provider_display_name: string;
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
  /**
   * PRV-035 — operator-declared models (doc 19 §4.B), normalized on read.
   * Costs inside are operator-claimed (N-5 serves `pricing_source:
   * 'operator_declared'`).
   */
  manual_model_declarations: unknown;
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
  filters?: {
    search?: string;
    tier?: OrgModelTier;
    capability?: ProviderDirectoryCapability;
    /** Keep priced providers whose min input price (USD/1M) is at or under the cap. */
    maxInputPricePer1m?: number;
    /** Keep only providers with ≥1 staff-attested ZDR-capable model. */
    zdr?: boolean;
  },
): Promise<{ providers: ProviderDirectoryEntry[] }> {
  const query: Record<string, string> = {};
  if (filters?.search) query.search = filters.search;
  if (filters?.tier) query.tier = filters.tier;
  if (filters?.capability) query.capability = filters.capability;
  if (filters?.maxInputPricePer1m !== undefined)
    query.max_input_price_per_1m = String(filters.maxInputPricePer1m);
  if (filters?.zdr !== undefined) query.zdr = filters.zdr ? 'true' : 'false';
  return engine<{ providers: ProviderDirectoryEntry[] }>(`/console/org/${orgId}/models/providers`, {
    query,
  });
}

/**
 * Workspace access toggle for one provider row (the catalog's ACCESS column).
 * Per-provider enablement — matches the SVG's one-toggle-per-row; the engine
 * upserts the provider_enablement row (owner/admin only, audited).
 */
export async function setProviderEnabled(
  orgId: string,
  provider: string,
  enabled: boolean,
): Promise<{ enablement: { provider: string; enabled: boolean } }> {
  return engine<{ enablement: { provider: string; enabled: boolean } }>(
    `/console/org/${orgId}/provider-credentials/providers/${provider}`,
    { method: 'POST', body: { enabled } },
  );
}

// ---------------------------------------------------------------------------
// N-5 grouped models
// ---------------------------------------------------------------------------

export async function fetchGroupedModels(
  orgId: string,
  supergroup?: Supergroup,
): Promise<{
  platform: ModelGroupView[];
  byok: ModelGroupView[];
  /**
   * The org's default model for new assistants. Optional until the engine
   * ships it (parallel team) — absent means "no default known", never
   * "no default set"; the page renders all radios unchecked.
   */
  default_model?: OrgDefaultModel | null;
}> {
  return engine<{
    platform: ModelGroupView[];
    byok: ModelGroupView[];
    default_model?: OrgDefaultModel | null;
  }>(`/console/org/${orgId}/models/grouped`, { query: supergroup ? { supergroup } : {} });
}

// ---------------------------------------------------------------------------
// N-8 org default model
// ---------------------------------------------------------------------------

/**
 * The engine is adding `GET /models/default` in parallel — this wrapper
 * matches that exact contract. The Models page reads `default_model` from
 * the grouped payload instead; this stays for direct reads.
 */
export async function fetchModelDefault(
  orgId: string,
): Promise<{ default: OrgDefaultModel | null }> {
  return engine<{ default: OrgDefaultModel | null }>(`/console/org/${orgId}/models/default`);
}

/**
 * `PUT /console/org/:orgId/models/default` — body `{ default: {...} | null }`.
 * 200 returns the same shape; 422 when the model isn't enabled+usable for
 * the org (the page rolls back and toasts honestly on 422).
 */
export async function setModelDefault(
  orgId: string,
  def: OrgDefaultModel | null,
): Promise<{ default: OrgDefaultModel | null }> {
  return engine<{ default: OrgDefaultModel | null }>(`/console/org/${orgId}/models/default`, {
    method: 'PUT',
    body: { default: def },
  });
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
  /**
   * PRV-035 — operator-declared models (doc 19 §4.B). Validated strictly
   * by the engine (`validateManualModelDeclarations`); costs are
   * operator-claimed and served with `pricing_source: 'operator_declared'`.
   */
  manual_model_declarations?: ManualModelDeclarationInput[];
}

/**
 * PRV-035 — wire shape for a manual model declaration (mirrors the engine
 * `ManualModelDeclaration`; costs as decimal strings).
 */
export interface ManualModelDeclarationInput {
  id: string;
  display_name: string;
  context_window_tokens: number;
  max_output_tokens?: number;
  capabilities: { tools: boolean; vision: boolean; reasoning: boolean; structured_output: boolean };
  input_cost_per_1m_usd?: string;
  output_cost_per_1m_usd?: string;
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

// ---------------------------------------------------------------------------
// Tab D — Spend & budgets (Phase 7; engine waves E1/E2)
//
// Exact contract given to the engine waves — do not guess shapes. Every
// money figure is an engine string (USD); nothing is invented client-side.
// ---------------------------------------------------------------------------

export type SpendWindow = '7d' | '30d';

/**
 * Per-provider spend breakdown — mirrors the engine `ProviderSpendBreakdown`
 * (spend-budget.service.ts) exactly. `byok_list_price_equivalent_usd` is
 * labeled list-price, never billed. Absent when the provider has no priced
 * BYOK rows (never zero-invented).
 */
export interface SpendProviderBreakdown {
  provider: string;
  platform_spend_usd: string;
  byok_settled_usd: string;
  byok_list_price_equivalent_usd?: string;
  pricing_basis: 'settled' | 'list';
}

export interface SpendBudgetView {
  /** Integer cents; null = unlimited. */
  cap_usd_cents: number | null;
  used_usd: string;
  include_byok_spend: boolean;
}

export interface SpendFeeConfig {
  /** Engine truth — never hardcoded in the UI. */
  byok_fee_credits_per_call: number;
  /** Provisional policy copy — labeled as such wherever rendered. */
  payg_margin_note: string;
}

/**
 * Org spend summary — mirrors the engine `SpendSummaryView`
 * (spend-budget.service.ts) exactly. The engine is the authority on shape;
 * the nested `byok` object carries the labeled list-price equivalent and
 * the actual fee settlement (calls × per_call_credits — no invented USD
 * conversion).
 */
export interface SpendSummaryView {
  window: '7d' | '30d';
  requests: number;
  /** Settled platform spend over the window, exact decimal string. */
  platform_spend_usd: string;
  byok: {
    /** Settled BYOK spend (flat platform-fee settlements), exact decimal string. */
    settled_usd: string;
    calls: number;
    /** Tokens × catalog list rates — 'list-price equivalent — not billed'. Absent when unpriced. */
    list_price_equivalent_usd?: string;
    /** The actual settlement math: calls × per_call_credits. */
    fee: { calls: number; per_call_credits: number };
  };
  providers: SpendProviderBreakdown[];
  budget: SpendBudgetView;
  fee_config: SpendFeeConfig;
}

export async function fetchSpendSummary(
  orgId: string,
  window: SpendWindow,
): Promise<SpendSummaryView> {
  return engine<SpendSummaryView>(`/console/org/${orgId}/spend/summary`, {
    query: { window },
  });
}

export async function patchSpendBudget(
  orgId: string,
  cap_usd_cents: number | null,
): Promise<{ cap_usd_cents: number | null }> {
  return engine<{ cap_usd_cents: number | null }>(`/console/org/${orgId}/spend/budget`, {
    method: 'PATCH',
    body: { cap_usd_cents },
  });
}

/**
 * The include_byok_spend toggle rides the existing
 * PATCH /console/org/:orgId/settings preferences (contract per E1 wave).
 * The response is the org settings record; the summary query is the source
 * of truth for the current toggle value.
 */
export async function patchIncludeByokSpend(
  orgId: string,
  include: boolean,
): Promise<Record<string, unknown>> {
  return engine<Record<string, unknown>>(`/console/org/${orgId}/settings`, {
    method: 'PATCH',
    body: { preferences: { include_byok_spend: include } },
  });
}

/** Enterprise audit export — step-up auth is engine-enforced; the download streams via engineDownload. */
export async function downloadSpendExport(orgId: string, format: 'csv' | 'json'): Promise<void> {
  return engineDownload(`/console/org/${orgId}/spend/export`, { format });
}

// ---------------------------------------------------------------------------
// Per-model spend (engine per-model spend API).
//
// Exact contract — do not guess shapes. Every money figure is an engine
// string (USD); `spend_usd` is the settled USD for 'platform' rows and the
// list-price equivalent (never billed) for 'byok' rows. `vs_last_window_pct`
// is null when the model had no prior-window data ("new").
// ---------------------------------------------------------------------------

/** One model-spend row — mirrors the engine `ModelSpendRow` exactly. */
export interface ModelSpendRow {
  provider: string;
  provider_display_name: string;
  model_id: string;
  model_display_name: string;
  source: 'platform' | 'byok';
  credential_id?: string | null;
  credential_label?: string | null;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  /** Exact decimal string. Settled USD for platform; list-price equivalent for BYOK. */
  spend_usd: string;
  /** 'list' = BYOK list-price equivalent — never presented as billed. */
  pricing_basis: 'settled' | 'list';
  /** % change vs the prior window; null = new (no prior-window data). */
  vs_last_window_pct: number | null;
}

/** Per-model spend for a window — mirrors the engine `ModelSpendResponse` exactly. Rows are sorted by spend desc. */
export interface ModelSpendResponse {
  window: '7d' | '30d';
  /** Exact decimal string — the denominator for SHARE. */
  total_spend_usd: string;
  rows: ModelSpendRow[];
}

export async function fetchModelSpend(
  orgId: string,
  window: SpendWindow,
): Promise<ModelSpendResponse> {
  return engine<ModelSpendResponse>(`/console/org/${orgId}/spend/models`, {
    query: { window },
  });
}
