/**
 * Providers Phase 5 — Wave B: dedicated full-page custom provider form.
 *
 * Mounted by Wave A's enterprise-gated page at
 * `/agent-studio/providers/custom/new` (and `/custom/:id/edit`). Sections
 * per doc 19 §8: 1) Endpoint & transport 2) Auth & custom headers
 * 3) Discovery 4) Governance. No modal anywhere on this surface.
 *
 * PRV-035 — manual model declarations (doc 19 §4.B): the engine persists
 * them on the credential row (N-2/N-3 `manual_model_declarations`,
 * validated strictly server-side). Costs entered here are
 * operator-claimed and served with `pricing_source: 'operator_declared'`
 * — the Spend tab labels them, never presenting them as catalog prices.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useOrg } from '@/Context/OrgContext';
import { Dropdown } from '@/components/common/ui/Dropdown';
import { TextInput } from '@/components/common/ui/TextInput';
import { ApiError, randomIdempotencyKey } from '@/lib/engine/client';
import { cancelStepUpFor, runWithStepUp } from '@/lib/engine/stepup';
import {
  probeCredential,
  type DiscoveredModel,
  type ManualModelDeclarationInput,
  type ProbeResult,
  type ProviderCredentialView,
} from '@/sections/pages/products/agent-studio/providers/api';
import {
  useCredentialMutations,
  useCredentials,
} from '@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials';
import { probeErrorCopy } from '@/sections/pages/products/agent-studio/providers/components/probeCopy';
import { validateBaseUrl } from './validateBaseUrl';
import {
  bodyText,
  card,
  colors,
  disabledBtn,
  errorCallout,
  ghostBtn,
  hintText,
  labelText,
  noticeCallout,
  okCallout,
  primaryBtn,
  row,
  secondaryBtn,
  sectionTitle,
} from '@/sections/pages/products/agent-studio/providers/components/styles';

type Adapter = 'openai-compatible' | 'anthropic' | 'ollama';
type AuthScheme = 'bearer' | 'api_key' | 'custom';

const ADAPTERS: Array<{ value: Adapter; label: string; hint: string }> = [
  { value: 'openai-compatible', label: 'OpenAI-Compatible', hint: 'vLLM, TGI, OpenAI-style /v1' },
  { value: 'anthropic', label: 'Anthropic', hint: 'Anthropic Messages API' },
  { value: 'ollama', label: 'Ollama / Local', hint: 'Ollama /api/tags (dev only)' },
];

const SCHEMES: Array<{ value: AuthScheme; label: string; hint: string }> = [
  { value: 'bearer', label: 'Bearer Token', hint: 'Authorization: Bearer <secret>' },
  { value: 'api_key', label: 'API-Key Header', hint: 'Custom header carrying the key' },
  { value: 'custom', label: 'Custom Scheme', hint: 'Any header name/value pair' },
];

interface HeaderRow {
  // Stable row key (P2): rows are keyed by identity, not position, so
  // deleting row 2 of 3 never scrambles the other rows' input state.
  rowKey: string;
  name: string;
  value: string;
}

interface ManualModel {
  // Stable row key (P2): see HeaderRow.
  rowKey: string;
  id: string;
  displayName: string;
  contextWindow: string;
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  structuredOutput: boolean;
  inputCost: string;
  outputCost: string;
}

// Module-level row-key sequence — keys only need uniqueness within a form.
let rowKeySeq = 0;
const nextRowKey = () => `row-${++rowKeySeq}`;

const emptyManualModel = (): ManualModel => ({
  rowKey: nextRowKey(),
  id: '',
  displayName: '',
  contextWindow: '',
  tools: false,
  vision: false,
  reasoning: false,
  structuredOutput: false,
  inputCost: '',
  outputCost: '',
});

const MANUAL_MODEL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

/**
 * PRV-035 — client-side validation mirroring the engine
 * (`validateManualModelDeclarations`). The engine re-validates strictly;
 * this only gates the Save buttons so the operator gets immediate,
 * field-level feedback instead of a server round-trip.
 */
function manualModelError(m: ManualModel): string | null {
  if (!MANUAL_MODEL_ID_RE.test(m.id.trim())) {
    return 'Model ID: letters, digits, and . _ : / - (1–128 chars).';
  }
  if (m.displayName.trim().length === 0) {
    return 'Display name is required.';
  }
  const ctx = Number(m.contextWindow);
  if (!Number.isInteger(ctx) || ctx < 1 || ctx > 100_000_000) {
    return 'Context window: an integer between 1 and 100,000,000.';
  }
  for (const [field, label] of [
    ['inputCost', 'Input $ / 1M'],
    ['outputCost', 'Output $ / 1M'],
  ] as const) {
    const raw = m[field].trim();
    if (raw === '') continue;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0 || num > 1_000_000) {
      return `${label}: a non-negative number up to 1,000,000.`;
    }
  }
  return null;
}

function manualModelToInput(m: ManualModel): ManualModelDeclarationInput {
  const input: ManualModelDeclarationInput = {
    id: m.id.trim(),
    display_name: m.displayName.trim(),
    context_window_tokens: Number(m.contextWindow),
    capabilities: {
      tools: m.tools,
      vision: m.vision,
      reasoning: m.reasoning,
      structured_output: m.structuredOutput,
    },
  };
  if (m.inputCost.trim() !== '') input.input_cost_per_1m_usd = String(Number(m.inputCost));
  if (m.outputCost.trim() !== '') input.output_cost_per_1m_usd = String(Number(m.outputCost));
  return input;
}

/** Engine view → form row (edit prefill; preserves all four capability flags). */
function manualInputToModel(d: ManualModelDeclarationInput): ManualModel {
  return {
    rowKey: nextRowKey(),
    id: d.id ?? '',
    displayName: d.display_name ?? '',
    contextWindow:
      typeof d.context_window_tokens === 'number' ? String(d.context_window_tokens) : '',
    tools: d.capabilities?.tools === true,
    vision: d.capabilities?.vision === true,
    reasoning: d.capabilities?.reasoning === true,
    structuredOutput: d.capabilities?.structured_output === true,
    inputCost: d.input_cost_per_1m_usd ?? '',
    outputCost: d.output_cost_per_1m_usd ?? '',
  };
}

/** Guarded width hook — jsdom has no matchMedia; never throw there. */
function useNarrow(breakpoint = 640): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);
  return narrow;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function CustomProviderForm({ credentialId }: { credentialId?: string }) {
  const { orgId, role } = useOrg();
  const navigate = useNavigate();
  const mutations = useCredentialMutations(orgId ?? '');
  const { data: creds, isLoading: credsLoading } = useCredentials(orgId);
  const editing: ProviderCredentialView | undefined = credentialId
    ? creds?.credentials.find((c) => c.id === credentialId)
    : undefined;
  const narrow = useNarrow();

  const [label, setLabel] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState('');
  const [adapter, setAdapter] = useState<Adapter>('openai-compatible');
  const [baseUrl, setBaseUrl] = useState('');
  const [scheme, setScheme] = useState<AuthScheme>('bearer');
  const [schemeHeader, setSchemeHeader] = useState('X-API-Key');
  const [secret, setSecret] = useState('');
  const [headers, setHeaders] = useState<HeaderRow[]>([]);
  // Round 2 P0: explicit opt-in to replace the stored header set on edit.
  // custom_headers is replace-on-write server-side — without this gate the
  // edit form would send {} (the untouched editor state) and silently wipe
  // the stored headers.
  const [replaceHeaders, setReplaceHeaders] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState<'auto' | 'manual'>('auto');
  const [probing, setProbing] = useState(false);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [checkedModels, setCheckedModels] = useState<string[] | null>(null);
  const [manualModels, setManualModels] = useState<ManualModel[]>([]);
  const [residency, setResidency] = useState('global');
  const [zdr, setZdr] = useState('use_default');
  const [fallback, setFallback] = useState('use_shared');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const prefilled = useRef(false);
  /**
   * P1-3: one idempotency key per form submit intent. Reused across manual
   * retries of the same create — the engine replays the original instead
   * of duplicating the credential.
   */
  const idempotencyKeyRef = useRef<string | null>(null);
  /**
   * Round 2 P1: probe sequence — same contract as ConnectKeyForm. A probe
   * in flight is identified by its input snapshot; the reset effect below
   * bumps the sequence on every probe-input change, so a probe that
   * resolves after an edit is discarded instead of marking stale inputs
   * "ok".
   */
  const probeSeqRef = useRef(0);

  // Round 2 P0: FULL prefill from the stored credential. The old effect
  // restored only manualModels — label/baseUrl/adapter/headers/residency/
  // zdr/fallback started at defaults, so saving an edit silently reset
  // every untouched field. Every editable field restores here.
  //
  // Two things are deliberately NOT editable on this surface: the sealed
  // secret (N-3 PATCH has no secret field — rotation is the secret-change
  // path, via Rotate on the key card) and the auth scheme (it only
  // controls where a *new* secret is placed; nothing to change without a
  // secret). Headers keep their stored values unless the operator opts
  // into "Replace header set" — the engine only returns header *names*,
  // so the editor can't prefill values it must never invent.
  useEffect(() => {
    if (editing && !prefilled.current) {
      prefilled.current = true;
      setLabel(editing.label);
      // The slug is the routing identity — not editable after creation.
      setSlug(editing.provider);
      setSlugTouched(true);
      const t = editing.transport;
      setAdapter(t === 'anthropic' || t === 'ollama' ? t : 'openai-compatible');
      setBaseUrl(editing.base_url ?? '');
      setResidency(editing.region_attestation ?? 'global');
      setZdr(editing.zdr_attestation ?? 'use_default');
      setFallback(editing.shared_capacity_fallback ?? 'use_shared');
      const existing = Array.isArray(editing.manual_model_declarations)
        ? (editing.manual_model_declarations as ManualModelDeclarationInput[])
        : [];
      if (existing.length > 0) {
        setManualModels(existing.map(manualInputToModel));
        setDiscoveryMode('manual');
      }
    }
  }, [editing]);

  const effectiveSlug = slugTouched ? slug : slugify(label);

  // Header names the engine returns for the stored credential (values are
  // write-only and never returned). Shown read-only on edit.
  const existingHeaderNames = editing?.custom_header_names ?? [];

  /**
   * Round 2 P1: a verified probe belongs to the exact inputs it verified.
   * Editing any probe input invalidates the probe (and the checked-model
   * selection) and retires the idempotency key, so (a) "probe endpoint A,
   * edit the URL/secret, save" can never persist a never-verified
   * endpoint, and (b) "create fails, edit an input, retry" mints a fresh
   * key instead of colliding with the failed attempt's 409. Residency, ZDR,
   * and fallback are not probe inputs and don't invalidate. On create the
   * label feeds the slug until the slug is edited by hand, so label edits
   * invalidate via effectiveSlug; on edit the slug is fixed and label edits
   * don't. The secret/scheme fields are hidden on edit, so there the live
   * deps are the endpoint inputs.
   */
  useEffect(() => {
    setProbe(null);
    setCheckedModels(null);
    idempotencyKeyRef.current = null;
    probeSeqRef.current += 1;
  }, [effectiveSlug, adapter, baseUrl, scheme, schemeHeader, secret, headers]);

  const urlCheck = useMemo(() => validateBaseUrl(baseUrl), [baseUrl]);
  const discovered: DiscoveredModel[] = useMemo(
    () => (probe?.status === 'ok' ? probe.models : []),
    [probe],
  );
  const probedOk = probe?.status === 'ok';

  const slugValid = /^[a-z0-9][a-z0-9-]*$/.test(effectiveSlug);
  const headersValid = headers.every((h) => h.name.trim().length > 0);
  const headerNamesUnique =
    new Set(headers.map((h) => h.name.trim().toLowerCase()).filter(Boolean)).size ===
    headers.filter((h) => h.name.trim()).length;
  const schemeHeaderValid = scheme === 'bearer' || schemeHeader.trim().length > 0;
  const urlOk = urlCheck.state === 'valid' || urlCheck.state === 'warning';
  // PRV-035 — manual declarations are validated client-side for immediate
  // feedback; the engine re-validates strictly on write.
  const manualErrors = manualModels.map(manualModelError);
  const manualModelsValid = manualErrors.every((e) => e === null);
  const manualIds = manualModels.map((m) => m.id.trim()).filter(Boolean);
  const manualIdsUnique = new Set(manualIds).size === manualIds.length;

  const canSave =
    !!orgId &&
    label.trim().length > 0 &&
    slugValid &&
    urlOk &&
    headersValid &&
    headerNamesUnique &&
    schemeHeaderValid &&
    (editing ? true : secret.trim().length > 0) &&
    manualModelsValid &&
    manualIdsUnique &&
    !saving &&
    !mutations.create.isPending &&
    !mutations.patch.isPending;
  // "Save & Connect" additionally requires a live discovery probe in auto
  // mode, or ≥1 valid manual declaration in manual mode.
  const canSaveAndConnect =
    canSave && (discoveryMode === 'manual' ? manualModels.length > 0 : probedOk);

  const runProbe = async () => {
    if (!orgId || probing || !urlOk) return;
    const seq = probeSeqRef.current;
    setProbing(true);
    setProbe(null);
    setCheckedModels(null);
    setSubmitError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const customHeaders: Record<string, string> = {};
    for (const h of headers) {
      if (h.name.trim()) customHeaders[h.name.trim()] = h.value;
    }
    if (scheme !== 'bearer' && secret.trim()) {
      customHeaders[schemeHeader.trim()] = secret.trim();
    }
    try {
      // P2 re-proof: the probe route requires a fresh MFA proof — if it
      // expired, re-prompt and retry rather than surfacing a raw error.
      const result = await runWithStepUp('probe custom endpoint', (proof) =>
        probeCredential(
          orgId,
          {
            provider: effectiveSlug || 'custom',
            secret: secret.trim() || undefined,
            transport: adapter,
            base_url: baseUrl.trim(),
            custom_headers: customHeaders,
          },
          ctrl.signal,
          proof,
        ),
      );
      // Superseded by an input edit while the probe was in flight — the
      // inputs it verified are no longer the current inputs.
      if (seq === probeSeqRef.current) {
        setProbe(result);
        if (result.status === 'ok') {
          setCheckedModels(result.models.map((m) => m.id));
        }
      }
    } catch (err) {
      // Stale-input errors are discarded silently (seq mismatch); only the
      // current inputs' failure surfaces.
      if (seq === probeSeqRef.current && (err as Error).name !== 'AbortError') {
        setProbe({
          status: 'failed',
          latency_ms: 0,
          models: [],
          error: (err as Error).message,
          // P2: engine-imposed 429s get their own copy (not provider quota).
          error_code: err instanceof ApiError ? err.code : undefined,
        });
      }
    } finally {
      // The probe settled — the form is idle again whether the result was
      // applied (seq match) or discarded (superseded by an edit). Only the
      // result above is sequence-gated.
      abortRef.current = null;
      setProbing(false);
    }
  };

  // Round 2 P2: aborting the fetch doesn't settle the step-up modal (the
  // fetch already rejected — that's why the modal opened). Cancel must
  // also fail that pending request so the modal dismisses.
  const cancelProbe = () => {
    abortRef.current?.abort();
    cancelStepUpFor('probe ');
  };

  const buildCustomHeaders = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const h of headers) {
      if (h.name.trim()) out[h.name.trim()] = h.value;
    }
    if (scheme !== 'bearer' && secret.trim()) {
      out[schemeHeader.trim()] = secret.trim();
    }
    return out;
  };

  const submit = async (mode: 'connect' | 'inactive') => {
    // On edit the probe gate doesn't apply (see the footer comment) — a
    // valid form is sufficient; the engine re-verifies endpoint changes.
    if (!orgId || !canSave || (!editing && mode === 'connect' && !canSaveAndConnect)) return;
    setSaving(true);
    setSubmitError(null);
    const allowed =
      discoveryMode === 'auto' && checkedModels && checkedModels.length !== discovered.length
        ? checkedModels
        : undefined;
    // PRV-035 — manual declarations ride the N-2/N-3 payload. On patch
    // the semantics are replace; in auto mode the field is omitted so an
    // edit that never touched the manual section preserves existing
    // declarations (to clear them, switch to manual mode and remove all
    // rows). Costs are operator-claimed; the engine labels them
    // `pricing_source: 'operator_declared'`.
    const manualDeclarations =
      discoveryMode === 'manual' ? manualModels.map(manualModelToInput) : undefined;
    try {
      if (editing) {
        // Round 2 P0: the patch only carries fields the operator changed or
        // explicitly re-confirmed. custom_headers is replace-on-write —
        // sending the untouched editor state ({}) would wipe the stored
        // headers — so it's omitted unless "Replace header set" is on.
        // allowed_models: undefined preserves the stored allow-list (this
        // also fixes the P2 allow-list wipe: the old code sent null
        // whenever discovery was untouched). A fresh probe with a narrowed
        // selection is the only path that sends a new list.
        await mutations.patch.mutateAsync({
          id: editing.id,
          patch: {
            label: label.trim() || editing.label,
            base_url: baseUrl.trim(),
            transport: adapter,
            shared_capacity_fallback: fallback as ProviderCredentialView['shared_capacity_fallback'],
            zdr_attestation: zdr,
            region_attestation: residency,
            ...(replaceHeaders ? { custom_headers: buildCustomHeaders() } : {}),
            ...(allowed !== undefined ? { allowed_models: allowed } : {}),
            ...(manualDeclarations !== undefined
              ? { manual_model_declarations: manualDeclarations }
              : {}),
          },
        });
        await navigate({ to: '/agent-studio/providers' });
      } else {
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = randomIdempotencyKey();
        const { credential } = await mutations.create.mutateAsync({
          input: {
            provider: effectiveSlug,
            label: label.trim(),
            secret: secret.trim(),
            transport: adapter,
            base_url: baseUrl.trim(),
            custom_headers: buildCustomHeaders(),
            allowed_models: allowed,
            shared_capacity_fallback: fallback as ProviderCredentialView['shared_capacity_fallback'],
            zdr_attestation: zdr,
            region_attestation: residency,
            enabled: mode === 'connect',
            ...(manualDeclarations !== undefined
              ? { manual_model_declarations: manualDeclarations }
              : {}),
          },
          idempotencyKey: idempotencyKeyRef.current,
        });
        if (mode === 'connect') {
          // Re-verify server-side so the card lands verified (the probe
          // above ran client-side pre-save; this persists the verified
          // state). Best-effort: the credential already exists, so a verify
          // failure must NOT block navigation — the card renders the
          // outcome and offers "Retry verify" (P0-1).
          try {
            await mutations.verify.mutateAsync(credential.id);
          } catch {
            // Swallowed deliberately — the card surface reports it.
          }
        }
        await navigate({ to: '/agent-studio/providers' });
      }
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => navigate({ to: '/agent-studio/providers' });

  if (!orgId) return null;

  // Round 4 P1: the engine's custom-endpoint create/patch/probe endpoints
  // are owner/admin-only — reader, billing, and developer get 403. A
  // non-privileged role that deep-links here gets this honest gate instead
  // of a form whose every submit 403s. (The tier gate lives one level up
  // on the routed page; this is the role gate.)
  if (role !== 'owner' && role !== 'admin') {
    return (
      <div style={card}>
        <h3 style={sectionTitle}>Custom provider</h3>
        <p style={{ ...bodyText, marginTop: 8 }}>
          Only owners and admins can manage provider keys.
        </p>
        <button type="button" onClick={cancel} style={{ ...secondaryBtn, marginTop: 16 }}>
          Back to My Providers
        </button>
      </div>
    );
  }

  // Round 2 P0: the edit route is directly addressable — a bad or removed
  // credentialId gets an honest not-found, never a blank create form.
  if (credentialId && !credsLoading && !editing) {
    return (
      <div style={card}>
        <h3 style={sectionTitle}>Custom provider not found</h3>
        <p style={{ ...bodyText, marginTop: 8 }}>
          This provider doesn’t exist or was removed. Check My Providers for the current set of
          credentials.
        </p>
        <button type="button" onClick={cancel} style={{ ...secondaryBtn, marginTop: 16 }}>
          Back to My Providers
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 880 }}>
      {/* 1. Endpoint & transport */}
      <section style={card} aria-label="Endpoint and transport">
        <h3 style={sectionTitle}>1. Endpoint &amp; Transport Adapter</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 12, maxWidth: 560 }}>
          <TextInput
            label="Provider Label"
            placeholder="EU Production vLLM"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <TextInput
            label="Provider Slug"
            value={effectiveSlug}
            // The slug is the routing identity — immutable after creation.
            disabled={!!editing}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            error={
              effectiveSlug && !slugValid
                ? 'Lowercase letters, numbers, and dashes only.'
                : undefined
            }
            hint={
              editing
                ? "The provider slug is the routing identity and can't be changed after creation."
                : 'Unique identifier used in routing. Derived from the label until you edit it.'
            }
          />
          <div>
            <span style={labelText}>Adapter</span>
            <div role="radiogroup" aria-label="Transport adapter" style={{ display: 'grid', gap: 8 }}>
              {ADAPTERS.map((a) => (
                <label
                  key={a.value}
                  style={{
                    ...row,
                    gap: 10,
                    border: `1px solid ${adapter === a.value ? colors.accent : colors.borderSoft}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="adapter"
                    checked={adapter === a.value}
                    onChange={() => setAdapter(a.value)}
                  />
                  <span>
                    <span style={bodyText}>{a.label}</span>
                    <br />
                    <span style={hintText}>{a.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <TextInput
              label="Base URL"
              placeholder="https://llm.example.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              error={urlCheck.state === 'invalid' ? urlCheck.message : undefined}
              hint="Must be a publicly reachable HTTPS endpoint — private, loopback, and link-local addresses are blocked."
            />
            {urlCheck.state === 'valid' && (
              <p style={{ ...hintText, color: colors.success, marginTop: 4 }} role="status">
                ✓ {urlCheck.message}
              </p>
            )}
            {urlCheck.state === 'warning' && (
              <p style={{ ...noticeCallout, marginTop: 8 }} role="status">
                {urlCheck.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Auth & custom headers */}
      <section style={card} aria-label="Authentication and custom headers">
        <h3 style={sectionTitle}>2. Authentication &amp; Custom Headers</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 12, maxWidth: 560 }}>
          {editing ? (
            <>
              {/* Round 2 P0: the sealed secret can't be edited here (N-3 PATCH
                  has no secret field — rotation is the secret-change path),
                  so the secret field and auth-scheme selector are hidden on
                  edit. The stored header set is preserved unless the
                  operator explicitly opts into replacing it. */}
              <p style={hintText}>
                To change the secret itself, use Rotate on the key card — editing here keeps the
                existing sealed material.
              </p>
              <div>
                <span style={labelText}>Current header set</span>
                {existingHeaderNames.length > 0 ? (
                  <p style={{ ...bodyText, marginTop: 4 }}>
                    {existingHeaderNames.join(', ')}
                  </p>
                ) : (
                  <p style={{ ...hintText, marginTop: 4 }}>No custom headers stored.</p>
                )}
                <p style={{ ...hintText, marginTop: 4 }}>
                  Header values are write-only — only names are ever shown again.
                </p>
              </div>
              <label style={{ ...row, gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={replaceHeaders}
                  onChange={(e) => setReplaceHeaders(e.target.checked)}
                />
                <span style={bodyText}>Replace the header set</span>
              </label>
              {replaceHeaders && (
                <p style={{ ...noticeCallout, margin: 0 }} role="note">
                  The header set below <strong>replaces</strong> the stored set on save — every
                  header the endpoint needs must be listed, including ones carried over unchanged.
                </p>
              )}
            </>
          ) : (
            <>
              <div>
                <span style={labelText}>Auth Scheme</span>
                <div role="radiogroup" aria-label="Auth scheme" style={{ display: 'grid', gap: 8 }}>
                  {SCHEMES.map((s) => (
                    <label
                      key={s.value}
                      style={{
                        ...row,
                        gap: 10,
                        border: `1px solid ${scheme === s.value ? colors.accent : colors.borderSoft}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="auth-scheme"
                        checked={scheme === s.value}
                        onChange={() => setScheme(s.value)}
                      />
                      <span>
                        <span style={bodyText}>{s.label}</span>
                        <br />
                        <span style={hintText}>{s.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {scheme !== 'bearer' && (
                <TextInput
                  label="Header name"
                  value={schemeHeader}
                  onChange={(e) => setSchemeHeader(e.target.value)}
                  error={!schemeHeaderValid ? 'Header name is required for this scheme.' : undefined}
                />
              )}
              <TextInput
                label="Secret Key"
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                hint="Write-only. Plaintext is never displayed after save."
              />
            </>
          )}

          {(!editing || replaceHeaders) && (
          <div>
            <span style={labelText}>Custom HTTP Headers</span>
            {headers.length > 0 && (
              <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
                {headers.map((h, i) => (
                  <div key={h.rowKey} style={{ ...row, gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        aria-label={`Header ${i + 1} name`}
                        placeholder="X-Gateway-Routing-Key"
                        value={h.name}
                        onChange={(e) =>
                          setHeaders((prev) =>
                            prev.map((r) => (r.rowKey === h.rowKey ? { ...r, name: e.target.value } : r)),
                          )
                        }
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        aria-label={`Header ${i + 1} value`}
                        placeholder="prod-cluster-alpha"
                        value={h.value}
                        onChange={(e) =>
                          setHeaders((prev) =>
                            prev.map((r) => (r.rowKey === h.rowKey ? { ...r, value: e.target.value } : r)),
                          )
                        }
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete header ${h.name || i + 1}`}
                      onClick={() => setHeaders((prev) => prev.filter((r) => r.rowKey !== h.rowKey))}
                      style={{ ...ghostBtn, minHeight: 44, padding: '8px 12px', color: colors.danger }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!headerNamesUnique && (
              <p style={{ ...errorCallout, marginBottom: 8 }} role="alert">
                Header names must be unique.
              </p>
            )}
            <button
              type="button"
              onClick={() => setHeaders((prev) => [...prev, { rowKey: nextRowKey(), name: '', value: '' }])}
              style={secondaryBtn}
            >
              + Add Header
            </button>
            <p style={{ ...hintText, marginTop: 8 }}>
              Header values are write-only after save — only names are ever shown again.
            </p>
          </div>
          )}
        </div>
      </section>

      {/* 3. Discovery */}
      <section style={card} aria-label="Dynamic model discovery">
        <h3 style={sectionTitle}>3. Dynamic Model Discovery &amp; Capabilities Probe</h3>
        <div style={{ marginTop: 12, maxWidth: 640 }}>
          <div>
            <span style={labelText}>Discovery Mode</span>
            <div role="radiogroup" aria-label="Discovery mode" style={{ ...row, gap: 16 }}>
              <label style={{ ...row, gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="discovery-mode"
                  checked={discoveryMode === 'auto'}
                  onChange={() => setDiscoveryMode('auto')}
                />
                <span style={bodyText}>Auto-Discover (GET /models)</span>
              </label>
              <label style={{ ...row, gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="discovery-mode"
                  checked={discoveryMode === 'manual'}
                  onChange={() => setDiscoveryMode('manual')}
                />
                <span style={bodyText}>Manual Declaration</span>
              </label>
            </div>
          </div>

          {discoveryMode === 'auto' ? (
            <div style={{ marginTop: 12 }}>
              {probing ? (
                <div style={{ ...row, gap: 12 }}>
                  <span style={bodyText} role="status">
                    Probing endpoint &amp; discovering models…
                  </span>
                  <button type="button" aria-label="Cancel probe" onClick={cancelProbe} style={ghostBtn}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={runProbe}
                  disabled={!urlOk || !!editing}
                  // Round 3 P2: in edit mode the sealed secret isn't editable,
                  // so the probe would send secret: '' and can only fail with
                  // an auth error — keep the button visible but disabled with
                  // the honest reason, never a live button to nowhere.
                  title={
                    editing
                      ? 'Probing is unavailable while editing — the sealed secret can’t be re-sent for authentication. Use “Sync / Refresh Models” on the key card to re-verify this endpoint with the stored secret.'
                      : !urlOk
                        ? 'Enter a valid base URL first'
                        : undefined
                  }
                  style={{ ...secondaryBtn, ...(!urlOk || editing ? disabledBtn : {}) }}
                >
                  Run Probe &amp; Discover Models
                </button>
              )}
              {probe?.status === 'ok' && (
                <p style={{ ...okCallout, marginTop: 12 }} role="status">
                  Latency: {probe.latency_ms}ms · {discovered.length} model
                  {discovered.length === 1 ? '' : 's'} detected
                </p>
              )}
              {probe?.status === 'failed' && (
                <p style={{ ...errorCallout, marginTop: 12 }} role="alert">
                  {probeErrorCopy(probe.error_code, probe.error)}
                </p>
              )}
              {discovered.length > 0 && (
                <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gap: 6 }}>
                  {discovered.map((m) => (
                    <li key={m.id}>
                      <label style={{ ...row, gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checkedModels?.includes(m.id) ?? true}
                          onChange={(e) =>
                            setCheckedModels((prev) => {
                              const base = prev ?? discovered.map((d) => d.id);
                              return e.target.checked
                                ? [...base, m.id]
                                : base.filter((id) => id !== m.id);
                            })
                          }
                        />
                        <span style={{ ...bodyText, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                          {m.id}
                        </span>
                        <span style={hintText}>
                          {m.context_window_tokens >= 1000
                            ? `${Math.round(m.context_window_tokens / 1000)}k ctx`
                            : `${m.context_window_tokens} ctx`}
                          {m.capabilities.tools ? ' · Tools' : ''}
                          {m.capabilities.vision ? ' · Vision' : ''}
                          {m.capabilities.reasoning ? ' · Reasoning' : ''}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <p style={{ ...noticeCallout, marginBottom: 12 }} role="note">
                Declare models manually when the endpoint&apos;s discovery API is disabled or
                requires elevated permissions. Declared costs are <strong>operator-claimed</strong> —
                they appear in the Models tab and Spend views labeled as operator-declared, never as
                verified catalog prices.
              </p>
              {manualModels.map((m, i) => (
                <div
                  key={m.rowKey}
                  style={{
                    border: `1px solid ${manualErrors[i] ? colors.danger : colors.borderSoft}`,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  {manualErrors[i] && (
                    <p style={{ ...errorCallout, margin: 0 }} role="alert">
                      {manualErrors[i]}
                    </p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 8 }}>
                    <TextInput
                      label="Model ID"
                      placeholder="llama-3.3-70b-instruct"
                      value={m.id}
                      onChange={(e) =>
                        setManualModels((prev) =>
                          prev.map((r) => (r.rowKey === m.rowKey ? { ...r, id: e.target.value } : r)),
                        )
                      }
                    />
                    <TextInput
                      label="Display Name"
                      value={m.displayName}
                      onChange={(e) =>
                        setManualModels((prev) =>
                          prev.map((r) => (r.rowKey === m.rowKey ? { ...r, displayName: e.target.value } : r)),
                        )
                      }
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr 1fr', gap: 8 }}>
                    <TextInput
                      label="Context window (tokens)"
                      inputMode="numeric"
                      placeholder="131072"
                      value={m.contextWindow}
                      onChange={(e) =>
                        setManualModels((prev) =>
                          prev.map((r) => (r.rowKey === m.rowKey ? { ...r, contextWindow: e.target.value } : r)),
                        )
                      }
                    />
                    <TextInput
                      label="Input $ / 1M"
                      inputMode="decimal"
                      value={m.inputCost}
                      onChange={(e) =>
                        setManualModels((prev) =>
                          prev.map((r) => (r.rowKey === m.rowKey ? { ...r, inputCost: e.target.value } : r)),
                        )
                      }
                    />
                    <TextInput
                      label="Output $ / 1M"
                      inputMode="decimal"
                      value={m.outputCost}
                      onChange={(e) =>
                        setManualModels((prev) =>
                          prev.map((r) => (r.rowKey === m.rowKey ? { ...r, outputCost: e.target.value } : r)),
                        )
                      }
                    />
                  </div>
                  <div style={{ ...row, gap: 16, flexWrap: 'wrap' }}>
                    {(
                      [
                        ['tools', 'Tools / Function Calling'],
                        ['vision', 'Vision'],
                        ['reasoning', 'Reasoning / Thinking'],
                        ['structuredOutput', 'Structured Output'],
                      ] as const
                    ).map(([key, capLabel]) => (
                      <label key={key} style={{ ...row, gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={m[key]}
                          onChange={(e) =>
                            setManualModels((prev) =>
                              prev.map((r) => (r.rowKey === m.rowKey ? { ...r, [key]: e.target.checked } : r)),
                            )
                          }
                        />
                        <span style={bodyText}>{capLabel}</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setManualModels((prev) => prev.filter((r) => r.rowKey !== m.rowKey))}
                      style={{ ...ghostBtn, minHeight: 44, padding: '8px 12px', color: colors.danger, marginLeft: 'auto' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setManualModels((prev) => [...prev, emptyManualModel()])} style={secondaryBtn}>
                + Add Custom Model Manually
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Governance */}
      <section style={card} aria-label="Governance, compliance and fallback">
        <h3 style={sectionTitle}>4. Governance, Compliance &amp; Fallback</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 12, maxWidth: 560 }}>
          <Dropdown
            variant="select"
            label="Data Residency Region"
            items={[
              { value: 'global', label: 'Global' },
              { value: 'eu', label: 'EU (Frankfurt)' },
              { value: 'us', label: 'US' },
            ]}
            value={residency}
            onChange={setResidency}
          />
          <Dropdown
            variant="select"
            label="Zero Data Retention (ZDR)"
            items={[
              { value: 'use_default', label: 'Use Default' },
              { value: 'account_zdr', label: 'Account has verified ZDR agreement' },
              { value: 'no_zdr', label: 'No ZDR' },
            ]}
            value={zdr}
            onChange={setZdr}
          />
          <Dropdown
            variant="select"
            label="Shared Capacity Fallback"
            items={[
              { value: 'use_shared', label: 'Use shared capacity' },
              { value: 'never_for_covered_models', label: 'Never for models this key covers' },
              { value: 'never_for_provider', label: 'Never for this provider' },
            ]}
            value={fallback}
            onChange={setFallback}
          />
          <p style={hintText}>
            Attestations record the acting user and timestamp in the audit trail.
          </p>
        </div>
      </section>

      {submitError && (
        <p style={errorCallout} role="alert">
          {submitError}
        </p>
      )}

      {/* Footer.
          On edit the save requires only a valid form (canSave): the
          "Save & Connect" probe gate is a create-mode concern — the edit
          probe can't authenticate (the sealed secret isn't editable here),
          so gating on it would permanently disable saving for bearer-auth
          endpoints. The engine re-verifies endpoint changes server-side
          with the stored secret (N-3). */}
      <div style={{ ...row, flexWrap: 'wrap' }}>
        {editing ? (
          <button
            type="button"
            onClick={() => submit('connect')}
            disabled={!canSave}
            title={
              !manualModelsValid || !manualIdsUnique
                ? 'Fix the invalid manual model declarations above'
                : undefined
            }
            style={{ ...primaryBtn, ...(!canSave ? disabledBtn : {}) }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => submit('connect')}
              disabled={!canSaveAndConnect}
              title={
                !canSaveAndConnect && discoveryMode === 'auto' && !probedOk
                  ? 'Run a successful discovery probe first'
                  : !canSaveAndConnect && discoveryMode === 'manual' && manualModels.length === 0
                    ? 'Add at least one manual model declaration'
                    : !manualModelsValid || !manualIdsUnique
                      ? 'Fix the invalid manual model declarations above'
                      : undefined
              }
              style={{ ...primaryBtn, ...(!canSaveAndConnect ? disabledBtn : {}) }}
            >
              {saving ? 'Saving…' : 'Save & Connect Provider'}
            </button>
            <button
              type="button"
              onClick={() => submit('inactive')}
              disabled={!canSave}
              title={
                !manualModelsValid || !manualIdsUnique
                  ? 'Fix the invalid manual model declarations above'
                  : undefined
              }
              style={{ ...secondaryBtn, ...(!canSave ? disabledBtn : {}) }}
            >
              Save as Inactive
            </button>
          </>
        )}
        <button type="button" onClick={cancel} style={ghostBtn}>
          Cancel
        </button>
      </div>
      {!manualIdsUnique && (
        <p style={{ ...errorCallout, marginTop: -8 }} role="alert">
          Manual model declarations must have unique model IDs.
        </p>
      )}
    </div>
  );
}
