/**
 * Providers Phase 5 — Wave B: one key card per connected credential (Tab B).
 *
 * Header (provider icon, name, custom label, masked fingerprint, status
 * pill), enabled toggle, priority up/down, shared-capacity fallback
 * selector, scope filters with blast-radius preview, ZDR/residency
 * attestations with actor+timestamp, Sync/Refresh Models, Rotate (MFA
 * step-up is engine-enforced), Revoke (destructive confirm, incident-safe),
 * and N-7 observability pills (7d/30d requests + spend; BYOK list-price
 * equivalent is always labeled, never presented as billed).
 *
 * Design: Apple bar, flat colors, Dropdown kit (never native <select>),
 * no content modals — Rotate/Revoke use the alert-class ConfirmDialog.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dropdown } from '@/components/common/ui/Dropdown';
import { Switch } from '@/components/common/ui/Switch';
import { StatusPill } from '@/components/common/ui/StatusPill';
import { ConfirmDialog } from '@/components/common/ui/ConfirmDialog';
import { TextInput } from '@/components/common/ui/TextInput';
import { statusPillFor } from './statusPill';
import {
  fetchGroupedModels,
  type CredentialUsageView,
  type DiscoveredModel,
  type ProviderCredentialView,
} from '@/sections/pages/products/agent-studio/providers/api';
import {
  useCredentialMutations,
  useCredentialUsage,
} from '@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials';
import {
  bodyText,
  card,
  cardTitle,
  colors,
  dangerBtn,
  disabledBtn,
  errorCallout,
  ghostBtn,
  hintText,
  labelText,
  monogram,
  noticeCallout,
  okCallout,
  primaryBtn,
  row,
  secondaryBtn,
  sectionTitle,
} from './styles';

const FALLBACK_ITEMS = [
  {
    value: 'use_shared',
    label: 'Use shared capacity',
    description: 'Fall back to the Platform Managed pool when this key rate-limits or fails.',
  },
  {
    value: 'never_for_covered_models',
    label: 'Never for models this key covers',
    description: 'Block shared capacity for models covered by this key.',
  },
  {
    value: 'never_for_provider',
    label: 'Never for this provider',
    description: 'Strict BYOK-only enforcement for the entire provider.',
  },
];

const ZDR_ITEMS = [
  { value: 'use_default', label: 'Use Default', description: 'Follow the organization policy.' },
  {
    value: 'account_zdr',
    label: 'My Account has ZDR',
    description: 'Zero-data-retention agreement in place with this provider.',
  },
  { value: 'no_zdr', label: 'No ZDR', description: 'This provider retains request data.' },
];

const REGION_ITEMS = [
  { value: 'global', label: 'Global' },
  { value: 'eu', label: 'EU' },
  { value: 'us', label: 'US' },
];

function asDiscoveredModels(value: unknown): DiscoveredModel[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (m): m is DiscoveredModel =>
      typeof m === 'object' && m !== null && typeof (m as DiscoveredModel).id === 'string',
  ) as DiscoveredModel[];
}

export interface KeyCardProps {
  credential: ProviderCredentialView;
  orgId: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function KeyCard({ credential, orgId, isFirst, isLast, onMoveUp, onMoveDown }: KeyCardProps) {
  const mutations = useCredentialMutations(orgId);
  const revoked = credential.verification_status === 'revoked';
  const [window, setWindow] = useState<'7d' | '30d'>('7d');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [attestOpen, setAttestOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const usage = useCredentialUsage(orgId, credential.id, window);
  const pill = statusPillFor(credential, lastError);
  const discovered = useMemo(() => asDiscoveredModels(credential.discovered_models), [credential.discovered_models]);

  const runVerify = () => {
    setActionError(null);
    mutations.verify.mutate(credential.id, {
      onSuccess: () => setLastError(null),
      onError: (err) => setLastError(err.message),
    });
  };

  const enabledBusy = mutations.patch.isPending;

  return (
    <article aria-label={`API key: ${credential.label}`} style={card}>
      {/* Header */}
      <div style={{ ...row, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ ...row, alignItems: 'center', minWidth: 0 }}>
          <div style={monogram()} aria-hidden="true">
            {(credential.provider || '?').slice(0, 1)}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={cardTitle}>
              {credential.provider}
              <span style={{ color: colors.textDim, fontWeight: 400 }}> — {credential.label}</span>
            </h3>
            <p style={{ ...hintText, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginTop: 4 }}>
              {credential.secret_fingerprint || 'no fingerprint'}
            </p>
          </div>
        </div>
        <StatusPill tone={pill.tone}>{pill.text}</StatusPill>
      </div>

      {credential.verification_status === 'unverified' && (
        <p style={{ ...noticeCallout, marginTop: 14 }}>
          Unroutable until verified — this key cannot serve traffic yet.{' '}
          <button
            type="button"
            onClick={runVerify}
            disabled={mutations.verify.isPending}
            style={{ ...ghostBtn, minHeight: 32, padding: '4px 10px', color: '#e8c06a' }}
          >
            {mutations.verify.isPending ? 'Verifying…' : 'Verify now'}
          </button>
        </p>
      )}

      {/* Enabled + priority */}
      <div style={{ ...row, marginTop: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={row}>
          <Switch
            checked={credential.enabled}
            disabled={revoked || enabledBusy}
            label={credential.enabled ? 'Disable key' : 'Enable key'}
            onChange={(next) => {
              setActionError(null);
              mutations.patch.mutate(
                { id: credential.id, patch: { enabled: next } },
                { onError: (err) => setActionError(err.message) },
              );
            }}
          />
          <span style={bodyText}>{credential.enabled ? 'Enabled' : 'Paused'}</span>
        </div>
        <div style={row} aria-label="Key priority">
          <span style={hintText}>Priority {credential.priority}</span>
          <button
            type="button"
            aria-label={`Move ${credential.label} up`}
            disabled={isFirst || revoked || enabledBusy}
            onClick={onMoveUp}
            style={{ ...secondaryBtn, minHeight: 36, padding: '6px 12px', ...(isFirst || revoked ? disabledBtn : {}) }}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Move ${credential.label} down`}
            disabled={isLast || revoked || enabledBusy}
            onClick={onMoveDown}
            style={{ ...secondaryBtn, minHeight: 36, padding: '6px 12px', ...(isLast || revoked ? disabledBtn : {}) }}
          >
            ↓
          </button>
        </div>
      </div>

      {actionError && (
        <p role="alert" style={{ ...errorCallout, marginTop: 12 }}>
          {actionError}
        </p>
      )}

      {/* Shared-capacity fallback */}
      <div style={{ marginTop: 16, maxWidth: 420 }}>
        <Dropdown
          variant="select"
          label="Shared capacity fallback"
          items={FALLBACK_ITEMS}
          value={credential.shared_capacity_fallback}
          disabled={revoked || enabledBusy}
          onChange={(value) => {
            setActionError(null);
            mutations.patch.mutate(
              {
                id: credential.id,
                patch: {
                  shared_capacity_fallback:
                    value as ProviderCredentialView['shared_capacity_fallback'],
                },
              },
              { onError: (err) => setActionError(err.message) },
            );
          }}
        />
      </div>

      {/* Scope filters + blast radius */}
      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          style={{ ...ghostBtn, padding: '6px 0', minHeight: 32, color: colors.accent }}
        >
          {filtersOpen ? 'Hide' : 'Show'} scope filters (models · assistants)
        </button>
        {filtersOpen && (
          <ScopeFilterEditor
            credential={credential}
            orgId={orgId}
            onError={setActionError}
          />
        )}
      </div>

      {/* Attestations */}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setAttestOpen((v) => !v)}
          aria-expanded={attestOpen}
          style={{ ...ghostBtn, padding: '6px 0', minHeight: 32, color: colors.accent }}
        >
          {attestOpen ? 'Hide' : 'Show'} compliance attestations (ZDR · residency)
        </button>
        {attestOpen && (
          <div style={{ marginTop: 8, display: 'grid', gap: 12, maxWidth: 420 }}>
            <Dropdown
              variant="select"
              label="Zero data retention (ZDR)"
              items={ZDR_ITEMS}
              value={credential.zdr_attestation ?? 'use_default'}
              disabled={revoked || enabledBusy}
              onChange={(value) => {
                setActionError(null);
                mutations.patch.mutate(
                  { id: credential.id, patch: { zdr_attestation: value } },
                  { onError: (err) => setActionError(err.message) },
                );
              }}
            />
            <Dropdown
              variant="select"
              label="Data residency"
              items={REGION_ITEMS}
              value={credential.region_attestation ?? 'global'}
              disabled={revoked || enabledBusy}
              onChange={(value) => {
                setActionError(null);
                mutations.patch.mutate(
                  { id: credential.id, patch: { region_attestation: value } },
                  { onError: (err) => setActionError(err.message) },
                );
              }}
            />
            {credential.attested_by && (
              <p style={hintText}>
                Attested by {credential.attested_by}
                {credential.attested_at
                  ? ` on ${new Date(credential.attested_at).toLocaleString()}`
                  : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Operations */}
      <div style={{ ...row, marginTop: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={runVerify}
          disabled={revoked || mutations.verify.isPending}
          style={{ ...secondaryBtn, ...(revoked ? disabledBtn : {}) }}
          title="Re-probe the upstream endpoint and refresh the discovered model list"
        >
          {mutations.verify.isPending ? 'Syncing…' : 'Sync / Refresh Models'}
        </button>
        <button
          type="button"
          onClick={() => setRotateOpen(true)}
          disabled={revoked || mutations.rotate.isPending}
          style={{ ...secondaryBtn, ...(revoked ? disabledBtn : {}) }}
        >
          Rotate key
        </button>
        <button
          type="button"
          onClick={() => setRevokeOpen(true)}
          disabled={revoked || mutations.revoke.isPending}
          style={{ ...dangerBtn, ...(revoked ? disabledBtn : {}) }}
        >
          Revoke
        </button>
      </div>
      {discovered.length > 0 && (
        <p style={{ ...hintText, marginTop: 8 }}>
          {discovered.length} model{discovered.length === 1 ? '' : 's'} discovered
          {credential.last_probe_latency_ms != null ? ` · last probe ${credential.last_probe_latency_ms}ms` : ''}
        </p>
      )}

      {/* Observability */}
      <UsageSection usage={usage.data} window={window} onWindow={setWindow} loading={usage.isLoading} />

      {/* Rotate dialog (alert-class; MFA step-up is engine-enforced) */}
      <ConfirmDialog
        open={rotateOpen}
        title="Rotate API key"
        message="This replaces the sealed key material in place. The card keeps its ID, priority, and filters. The engine requires MFA step-up for rotation."
        confirmLabel={mutations.rotate.isPending ? 'Rotating…' : 'Rotate key'}
        onCancel={() => {
          setRotateOpen(false);
          setNewSecret('');
        }}
        onConfirm={() => {
          if (!newSecret.trim()) return;
          setActionError(null);
          mutations.rotate.mutate(
            { id: credential.id, secret: newSecret.trim() },
            {
              onSuccess: () => {
                setRotateOpen(false);
                setNewSecret('');
              },
              onError: (err) => {
                setActionError(err.message);
                setRotateOpen(false);
                setNewSecret('');
              },
            },
          );
        }}
      >
        <TextInput
          label="New secret"
          type="password"
          autoComplete="off"
          value={newSecret}
          onChange={(e) => setNewSecret(e.target.value)}
          hint="Write-only. The plaintext is never displayed again."
        />
      </ConfirmDialog>

      {/* Revoke dialog (alert-class; incident-safe, no MFA) */}
      <ConfirmDialog
        open={revokeOpen}
        title="Revoke API key"
        message="Revoking is immediate and terminal — the credential is tombstoned permanently. In-flight runs fail over per this key's fallback setting on their next call; they never hang silently."
        confirmLabel={mutations.revoke.isPending ? 'Revoking…' : 'Revoke key'}
        destructive
        onCancel={() => {
          setRevokeOpen(false);
          setRevokeReason('');
        }}
        onConfirm={() => {
          setActionError(null);
          mutations.revoke.mutate(
            { id: credential.id, reason: revokeReason.trim() || undefined },
            {
              onSuccess: () => {
                setRevokeOpen(false);
                setRevokeReason('');
              },
              onError: (err) => {
                setActionError(err.message);
                setRevokeOpen(false);
              },
            },
          );
        }}
      >
        <TextInput
          label="Reason (optional, recorded in the audit trail)"
          value={revokeReason}
          onChange={(e) => setRevokeReason(e.target.value)}
        />
      </ConfirmDialog>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Scope filters + blast-radius preview                                 */
/* ------------------------------------------------------------------ */

function ScopeFilterEditor({
  credential,
  orgId,
  onError,
}: {
  credential: ProviderCredentialView;
  orgId: string;
  onError: (msg: string | null) => void;
}) {
  const mutations = useCredentialMutations(orgId);
  const discovered = useMemo(() => asDiscoveredModels(credential.discovered_models), [credential.discovered_models]);
  const [selected, setSelected] = useState<string[] | null>(credential.allowed_models);
  const [assistantsText, setAssistantsText] = useState((credential.allowed_assistants ?? []).join(', '));
  const [saving, setSaving] = useState(false);

  // N-5 blast-radius data source: byok groups carry pinned_by per model.
  const grouped = useQuery({
    queryKey: ['org', orgId, 'models', 'grouped', 'byok'],
    queryFn: () => fetchGroupedModels(orgId, 'byok'),
    enabled: true,
    staleTime: 60_000,
  });

  const restricted = selected !== null;
  const affected = useMemo(() => {
    if (!restricted || !grouped.data) return [];
    const group = grouped.data.byok.find((g) => g.credential_id === credential.id);
    if (!group) return [];
    return group.models
      .filter((m) => m.pinned_by.length > 0 && !selected.includes(m.model_id))
      .flatMap((m) => m.pinned_by.map((p) => ({ model: m.model_id, ...p })));
  }, [restricted, grouped.data, credential.id, selected]);

  const dirty =
    JSON.stringify(selected ?? null) !== JSON.stringify(credential.allowed_models ?? null) ||
    assistantsText.trim() !== (credential.allowed_assistants ?? []).join(', ');

  const save = () => {
    setSaving(true);
    onError(null);
    const allowed_assistants = assistantsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    mutations.patch.mutate(
      {
        id: credential.id,
        patch: { allowed_models: selected, allowed_assistants: allowed_assistants.length ? allowed_assistants : null },
      },
      {
        onSettled: () => setSaving(false),
        onError: (err) => onError(err.message),
      },
    );
  };

  return (
    <div
      style={{
        marginTop: 8,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 10,
        padding: 14,
        background: colors.bg,
      }}
    >
      <p style={labelText}>Allowed models</p>
      {discovered.length === 0 ? (
        <p style={hintText}>No discovered models yet — run “Sync / Refresh Models” to populate this list.</p>
      ) : (
        <>
          <label style={{ ...row, gap: 8, cursor: 'pointer', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={!restricted}
              onChange={(e) => setSelected(e.target.checked ? null : discovered.map((m) => m.id))}
            />
            <span style={bodyText}>All discovered models</span>
          </label>
          {restricted && (
            <ul style={{ listStyle: 'none', margin: '0 0 8px', padding: 0, display: 'grid', gap: 6 }}>
              {discovered.map((m) => (
                <li key={m.id}>
                  <label style={{ ...row, gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          prev === null
                            ? prev
                            : e.target.checked
                              ? [...prev, m.id]
                              : prev.filter((id) => id !== m.id),
                        )
                      }
                    />
                    <span style={{ ...bodyText, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {m.id}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <TextInput
          label="Allowed assistants (optional, comma-separated IDs)"
          value={assistantsText}
          onChange={(e) => setAssistantsText(e.target.value)}
          hint="Leave empty to let every assistant use this key. Isolates prod vs experiment spend."
        />
      </div>

      {/* Blast-radius preview — derived from N-5 pinned_by */}
      {restricted && grouped.data && (
        <div style={{ marginTop: 12 }}>
          {affected.length === 0 ? (
            <p style={okCallout}>No published assistants pin these models — safe to save.</p>
          ) : (
            <div style={noticeCallout} role="alert">
              <strong>Blast-radius preview:</strong> restricting to these models would break{' '}
              {affected.length} published assistant pin{affected.length === 1 ? '' : 's'}:
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {affected.slice(0, 10).map((a) => (
                  <li key={`${a.assistant_id}@${a.version}`}>
                    <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {a.assistant_id}@v{a.version}
                    </span>{' '}
                    pins <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{a.model}</span>
                  </li>
                ))}
              </ul>
              {affected.length > 10 && <p style={hintText}>…and {affected.length - 10} more.</p>}
            </div>
          )}
        </div>
      )}

      <div style={{ ...row, marginTop: 12 }}>
        <button type="button" onClick={save} disabled={!dirty || saving} style={{ ...primaryBtn, ...(!dirty ? disabledBtn : {}) }}>
          {saving ? 'Saving…' : 'Save filters'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* N-7 observability                                                   */
/* ------------------------------------------------------------------ */

function UsageSection({
  usage,
  window,
  onWindow,
  loading,
}: {
  usage: CredentialUsageView | undefined;
  window: '7d' | '30d';
  onWindow: (w: '7d' | '30d') => void;
  loading: boolean;
}) {
  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${colors.borderSoft}`, paddingTop: 14 }}>
      <div style={{ ...row, justifyContent: 'space-between' }}>
        <h4 style={sectionTitle}>Usage & health</h4>
        <div style={row} role="group" aria-label="Usage window">
          {(['7d', '30d'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWindow(w)}
              aria-pressed={window === w}
              style={{
                ...ghostBtn,
                minHeight: 32,
                padding: '4px 10px',
                color: window === w ? colors.accent : colors.textDim,
                fontWeight: window === w ? 700 : 400,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p style={hintText}>Loading usage…</p>
      ) : !usage ? (
        <p style={hintText}>Usage data unavailable.</p>
      ) : (
        <>
          <div style={{ ...row, marginTop: 8, flexWrap: 'wrap' }}>
            <Metric label="Requests" value={usage.requests.toLocaleString()} />
            <Metric
              label="Spend"
              value={`$${usage.spend_usd}`}
              sub={
                usage.pricing_basis === 'list' && usage.list_price_equivalent_usd
                  ? `list-price equivalent $${usage.list_price_equivalent_usd} — not billed`
                  : undefined
              }
            />
            <Metric label="Tokens" value={usage.tokens.total.toLocaleString()} />
          </div>
          <div style={{ ...row, marginTop: 10, flexWrap: 'wrap' }} aria-label="Error breakdown">
            {(['401', '403', '429', '5xx'] as const).map((code) => (
              <ErrorPill key={code} code={code} count={usage.error_breakdown[code]} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 110,
      }}
    >
      <div style={{ ...hintText, fontSize: 11 }}>{label}</div>
      <div style={{ ...bodyText, fontWeight: 700, fontSize: 15 }}>{value}</div>
      {sub && <div style={{ ...hintText, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ErrorPill({ code, count }: { code: '401' | '403' | '429' | '5xx'; count: number }) {
  const names = {
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '429': 'Rate limited',
    '5xx': 'Upstream error',
  } as const;
  return (
    <span
      title={`${names[code]}: ${count}`}
      style={{
        border: `1px solid ${count > 0 ? 'rgba(248,81,73,0.4)' : colors.borderSoft}`,
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 12,
        color: count > 0 ? '#ff9d94' : colors.textFaint,
        background: count > 0 ? 'rgba(248,81,73,0.08)' : 'transparent',
      }}
    >
      {code}: {count}
    </span>
  );
}
