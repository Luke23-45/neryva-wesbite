/**
 * Providers — key cards (My Providers page), founder key-cards design.
 *
 * Two variants:
 * - Healthy (verified / verifying / unverified): expanded card with
 *   labeled rows — PRIORITY (position + drag-to-reorder handle), FALLBACK
 *   (segmented control), APPLIES TO (model chips + assistant scope),
 *   30-DAY USE (requests · tokens · spend · error counts), AGREEMENT (ZDR +
 *   residency summary with actor + timestamp).
 * - Failed: compact amber card — "Failed: {code}" pill, error line with
 *   verify recency, disabled toggle, Retry verify + Revoke.
 *
 * Every behavior from the previous card is preserved: enabled toggle,
 * priority reorder (pointer drag + up/down buttons as the
 * keyboard-accessible fallback), shared-capacity fallback, scope filters
 * with blast-radius preview, ZDR/residency attestations with
 * actor+timestamp, Sync/Refresh Models, Rotate (MFA step-up is
 * engine-enforced), Revoke (destructive confirm, incident-safe), and N-7
 * usage observability. "View audit trail →" links to the console
 * activity feed pre-filtered to this key's label.
 *
 * Design: Apple bar, flat colors, Segmented kit (never native <select>),
 * no content modals — Rotate/Revoke use the alert-class ConfirmDialog.
 * Missing data renders as "—", never invented.
 */
import {
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Dropdown } from '@/components/common/ui/Dropdown';
import { Segmented } from '@/components/common/ui/Segmented';
import { Switch } from '@/components/common/ui/Switch';
import { StatusPill } from '@/components/common/ui/StatusPill';
import { ConfirmDialog } from '@/components/common/ui/ConfirmDialog';
import { providerDisplayName } from '@/sections/pages/products/agent-studio/providers/lib/provider-display-names';
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
  useOptimisticEnabledToggle,
  usePatchCredentialField,
  useAssistantRefs,
} from '@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials';
import type { OrgTier } from '@/sections/pages/products/agent-studio/providers/hooks/useOrgTier';
import { errorCodeLabel } from '@/sections/pages/products/agent-studio/providers/lib/error-code-labels';
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
} from './styles';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const FALLBACK_SEGMENTS = [
  {
    value: 'use_shared',
    label: 'Use shared',
    description: 'Fall back to the Platform Managed pool when this key rate-limits or fails.',
  },
  {
    value: 'never_for_covered_models',
    label: 'Never for these models',
    description: 'Block shared capacity for models covered by this key.',
  },
  {
    value: 'never_for_provider',
    label: 'Never for provider',
    description: 'Strict BYOK-only enforcement for the entire provider.',
  },
] as const;

type FallbackValue = (typeof FALLBACK_SEGMENTS)[number]['value'];

const ZDR_ITEMS = [
  { value: 'use_default', label: 'Use Default', description: 'Follow the organization policy.' },
  {
    value: 'account_zdr',
    label: 'My account has ZDR',
    description: 'Zero-data-retention agreement in place with this provider.',
  },
  { value: 'no_zdr', label: 'No ZDR', description: 'This provider retains request data.' },
];

const REGION_ITEMS = [
  { value: 'global', label: 'Global' },
  { value: 'eu', label: 'EU' },
  { value: 'us', label: 'US' },
];

function tierLabelFor(tier: OrgTier): string | null {
  switch (tier) {
    case 'enterprise':
      return 'Enterprise';
    case 'payg':
      return 'Pay-as-you-go';
    case 'free':
      return 'Free';
    default:
      return null;
  }
}

/** "Nov 12" — matches the design's attestation recency format; pinned to
 * en-US so the shape never shifts with the viewer's locale. */
function formatShortDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Relative recency for the failed card's verify line, e.g. "2 min ago". */
function formatAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s} sec`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr`;
  return `${Math.round(h / 24)} day${Math.round(h / 24) === 1 ? '' : 's'}`;
}

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
  /** 0-based position of this card within its provider group. */
  providerIndex: number;
  /** Number of cards in this card's provider group. */
  providerCount: number;
  /** Credential ids of the same-provider group — the only valid drop targets. */
  groupIds: string[];
  orgTier: OrgTier;
  dragSourceId: string | null;
  dragTargetId: string | null;
  onDragStart: (id: string) => void;
  onDragMove: (id: string | null) => void;
  onDragEnd: (sourceId: string, targetId: string | null) => void;
  /**
   * A cancelled pointer gesture (pointercancel) clears the drag state
   * WITHOUT committing a reorder — it is not a drop.
   */
  onDragCancel: () => void;
}

export function KeyCard({
  credential,
  orgId,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  providerIndex,
  providerCount,
  groupIds,
  orgTier,
  dragSourceId,
  dragTargetId,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: KeyCardProps) {
  const mutations = useCredentialMutations(orgId);
  // P0-2: revocation lives in the separate lifecycle `status` field — the
  // engine never emits 'revoked' as a verification_status, so every
  // revoked-gated treatment keyed on verification_status was dead code.
  const revoked = credential.status === 'revoked';
  const failed = credential.verification_status === 'failed';
  // P1-6: per-concern patch mutations. The enable toggle is optimistic
  // with rollback; fallback/attestations/scope filters each get an
  // independent mutation so one in-flight patch no longer freezes the
  // whole card.
  const enableToggle = useOptimisticEnabledToggle(orgId);
  const fallbackPatch = usePatchCredentialField(orgId);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [attestOpen, setAttestOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  // Inline validation for the rotate dialog (P2): an empty confirm must say
  // so in the dialog, never silently no-op.
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastErrorAt, setLastErrorAt] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 30-DAY USE row is always the 30d window (the design's fixed window).
  const usage = useCredentialUsage(orgId, credential.id, '30d');
  const pill = statusPillFor(credential, lastError);
  const discovered = useMemo(() => asDiscoveredModels(credential.discovered_models), [credential.discovered_models]);

  const runVerify = () => {
    setActionError(null);
    mutations.verify.mutate(credential.id, {
      onSuccess: () => {
        setLastError(null);
        setLastErrorAt(null);
      },
      onError: (err) => {
        // A verify failure on a healthy card must be visible (P1): the
        // failed card's summary already shows lastError, but the healthy
        // card never surfaces it — actionError announces it to assistive
        // tech there. Scoped to !failed so the failed card doesn't render
        // the same message twice.
        const message =
          err instanceof Error && err.message ? err.message : 'Verification failed. Try again.';
        setLastError(message);
        setLastErrorAt(Date.now());
        if (!failed) setActionError(message);
      },
    });
  };

  const enabledBusy = enableToggle.isPending;
  const toggleDisabled = revoked || failed || enabledBusy;
  const isDragSource = dragSourceId === credential.id;
  const isDropTarget = dragTargetId === credential.id;

  const patchEnabled = (next: boolean) => {
    setActionError(null);
    // Optimistic with rollback (hook handles both); the inline error is
    // the loud failure signal.
    enableToggle.mutate(
      { id: credential.id, enabled: next },
      { onError: (err) => setActionError(err.message) },
    );
  };

  const patchFallback = (value: FallbackValue) => {
    setActionError(null);
    fallbackPatch.mutate(
      { id: credential.id, patch: { shared_capacity_fallback: value } },
      { onError: (err) => setActionError(err.message) },
    );
  };

  const cardStyle: CSSProperties = {
    ...card,
    ...(failed ? { border: '1px solid rgba(210,153,34,0.45)' } : {}),
    ...(isDropTarget ? { borderColor: colors.accent, boxShadow: `0 0 0 1px ${colors.accent}` } : {}),
    ...(isDragSource ? { opacity: 0.55 } : {}),
  };

  const header = (
    <div style={{ ...row, justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ ...row, alignItems: 'center', minWidth: 0 }}>
        <div style={monogram()} aria-hidden="true">
          {(credential.provider || '?').slice(0, 1).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={cardTitle}>{credential.label}</h3>
          <p style={{ ...hintText, fontFamily: MONO, marginTop: 4 }}>
            {credential.provider} · {credential.secret_fingerprint || 'no fingerprint'}
            {credential.verification_status === 'verified' && credential.last_probe_latency_ms != null
              ? ` · verified ${credential.last_probe_latency_ms}ms`
              : ''}
          </p>
        </div>
      </div>
      <div style={{ ...row, flexShrink: 0 }}>
        <StatusPill tone={pill.tone}>{pill.text}</StatusPill>
        <Switch
          checked={credential.enabled}
          disabled={toggleDisabled}
          label={credential.enabled ? 'Disable key' : 'Enable key'}
          onChange={patchEnabled}
        />
      </div>
    </div>
  );

  const revokeDialog = (
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
  );

  /* ---------------------------------------------------------------- */
  /* Failed: compact amber card (never for revoked — revoked cards always */
  /* render the dead state below, even if their last probe failed)        */
  /* ---------------------------------------------------------------- */
  // Round 3 P2: the card's accessible name names the credential kind —
  // custom endpoints (base_url present) are not API keys.
  const cardKindLabel = credential.base_url != null ? 'Custom endpoint' : 'API key';
  if (failed && !revoked) {
    return (
      <article aria-label={`${cardKindLabel}: ${credential.label}`} data-key-card-id={credential.id} style={cardStyle}>
        {header}
        <p style={{ ...bodyText, marginTop: 14 }}>
          {lastError ?? 'The last verification failed'}
          {lastError && lastErrorAt != null && (
            <span style={{ color: colors.textFaint }}> (at verify, {formatAgo(lastErrorAt)} ago)</span>
          )}
          {!lastError && (
            <span style={{ color: colors.textFaint }}> — run Retry verify to re-probe this key.</span>
          )}
        </p>
        {actionError && (
          <p role="alert" style={{ ...errorCallout, marginTop: 12 }}>
            {actionError}
          </p>
        )}
        <div style={{ ...row, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={runVerify}
            disabled={mutations.verify.isPending}
            style={{ ...secondaryBtn, ...(mutations.verify.isPending ? disabledBtn : {}) }}
          >
            {mutations.verify.isPending ? 'Verifying…' : 'Retry verify'}
          </button>
          <button
            type="button"
            onClick={() => setRevokeOpen(true)}
            disabled={mutations.revoke.isPending}
            style={{ ...dangerBtn, ...(mutations.revoke.isPending ? disabledBtn : {}) }}
          >
            Revoke
          </button>
        </div>
        {revokeDialog}
      </article>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Healthy: expanded card with labeled rows                          */
  /* ---------------------------------------------------------------- */

  const fallbackDesc =
    FALLBACK_SEGMENTS.find((s) => s.value === credential.shared_capacity_fallback)?.description ?? '';

  // Effective model scope: explicit allow-list, else every discovered model.
  const scopeModels = credential.allowed_models ?? discovered.map((m) => m.id);
  const visibleModels = scopeModels.slice(0, 2);
  const extraModelCount = scopeModels.length - visibleModels.length;
  const assistantScope =
    credential.allowed_assistants && credential.allowed_assistants.length > 0
      ? `${credential.allowed_assistants.length} assistant${credential.allowed_assistants.length === 1 ? '' : 's'}`
      : 'All assistants';

  const zdrLabel = ZDR_ITEMS.find((i) => i.value === credential.zdr_attestation)?.label;
  const regionLabel = REGION_ITEMS.find((i) => i.value === credential.region_attestation)?.label;
  const attestedDate = credential.attested_at ? formatShortDate(credential.attested_at) : null;
  const tierLabel = tierLabelFor(orgTier);

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || revoked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart(credential.id);
  };
  const onHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragSourceId !== credential.id) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cardEl = el?.closest?.('[data-key-card-id]');
    const id = cardEl?.getAttribute('data-key-card-id') ?? null;
    onDragMove(id && id !== credential.id && groupIds.includes(id) ? id : null);
  };
  const onHandlePointerUp = () => {
    if (dragSourceId !== credential.id) return;
    onDragEnd(credential.id, dragTargetId);
  };
  /**
   * P2: a cancelled gesture (touch interrupted, alert appearing, etc.) is
   * NOT a drop — it clears the drag state without committing a reorder.
   * Previously this called the same handler as pointer-up and committed.
   */
  const onHandlePointerCancel = () => {
    if (dragSourceId !== credential.id) return;
    onDragCancel();
  };
  const onHandleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMoveUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onMoveDown();
    }
  };

  return (
    <article aria-label={`${cardKindLabel}: ${credential.label}`} data-key-card-id={credential.id} style={cardStyle}>
      {header}

      {credential.verification_status === 'unverified' && (
        <p style={{ ...noticeCallout, marginTop: 14 }}>
          Unroutable until verified — this key cannot serve traffic yet.{' '}
          <button
            type="button"
            onClick={runVerify}
            disabled={mutations.verify.isPending}
            style={{ ...ghostBtn, minHeight: 44, padding: '8px 12px', color: '#e8c06a' }}
          >
            {mutations.verify.isPending ? 'Verifying…' : 'Verify now'}
          </button>
        </p>
      )}

      <div style={{ borderTop: `1px solid ${colors.borderSoft}`, margin: '16px 0 6px' }} />

      {/* PRIORITY */}
      <KeyRow label="Priority">
        <div style={{ ...row, flexWrap: 'wrap' }}>
          <div
            // The handle's keyboard model is positional (ArrowUp/ArrowDown move
            // the card within its provider group), so slider with a vertical
            // orientation and the position as its value is the honest role —
            // not button, which would imply activation.
            role="slider"
            aria-orientation="vertical"
            aria-valuemin={1}
            aria-valuemax={providerCount}
            aria-valuenow={providerIndex + 1}
            tabIndex={revoked ? -1 : 0}
            aria-label={`Reorder ${credential.label}: position ${providerIndex + 1} of ${providerCount}. Drag, or press arrow keys.`}
            aria-disabled={revoked}
            onPointerDown={revoked ? undefined : onHandlePointerDown}
            onPointerMove={revoked ? undefined : onHandlePointerMove}
            onPointerUp={revoked ? undefined : onHandlePointerUp}
            onPointerCancel={revoked ? undefined : onHandlePointerCancel}
            onKeyDown={revoked ? undefined : onHandleKeyDown}
            style={{
              cursor: revoked ? 'default' : 'grab',
              touchAction: 'none',
              padding: '8px 6px',
              borderRadius: 6,
              display: 'flex',
              gap: 3,
              opacity: revoked ? 0.35 : 1,
            }}
          >
            {[0, 1].map((col) => (
              <span key={col} style={{ display: 'flex', flexDirection: 'column', gap: 3 }} aria-hidden="true">
                {[0, 1, 2].map((r) => (
                  <span key={r} style={{ width: 4, height: 4, borderRadius: 2, background: colors.textFaint }} />
                ))}
              </span>
            ))}
          </div>
          <span style={bodyText}>
            {providerIndex + 1} of {providerCount}{' '}
            {credential.provider_display_name ?? providerDisplayName(credential.provider)} keys
            <span style={{ color: colors.textFaint }}> — drag to reorder</span>
          </span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            aria-label={`Move ${credential.label} up`}
            disabled={isFirst || revoked || enabledBusy}
            onClick={onMoveUp}
            style={{ ...secondaryBtn, minHeight: 44, padding: '8px 12px', ...(isFirst || revoked ? disabledBtn : {}) }}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Move ${credential.label} down`}
            disabled={isLast || revoked || enabledBusy}
            onClick={onMoveDown}
            style={{ ...secondaryBtn, minHeight: 44, padding: '8px 12px', ...(isLast || revoked ? disabledBtn : {}) }}
          >
            ↓
          </button>
        </div>
      </KeyRow>

      {actionError && (
        <p role="alert" style={{ ...errorCallout, marginTop: 4 }}>
          {actionError}
        </p>
      )}

      {/* FALLBACK */}
      <KeyRow label="Fallback">
        <div aria-disabled={revoked} style={revoked ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
          <Segmented
            size="sm"
            ariaLabel="Shared capacity fallback"
            options={FALLBACK_SEGMENTS.map((s) => ({ value: s.value, label: s.label }))}
            value={credential.shared_capacity_fallback}
            onChange={patchFallback}
          />
        </div>
        {fallbackDesc && <p style={{ ...hintText, marginTop: 6 }}>{fallbackDesc}</p>}
      </KeyRow>

      {/* APPLIES TO */}
      <KeyRow label="Applies to">
        <div style={{ ...row, flexWrap: 'wrap' }}>
          {scopeModels.length === 0 ? (
            <span style={hintText}>No models discovered yet — run “Sync / Refresh Models” below.</span>
          ) : (
            <>
              {visibleModels.map((id) => (
                <span key={id} style={chip}>
                  {id}
                </span>
              ))}
              {extraModelCount > 0 && <span style={chipDashed}>+ {extraModelCount} more</span>}
              <span style={{ ...hintText, fontSize: 12 }}>· {assistantScope}</span>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-label={filtersOpen ? 'Done editing scope filters' : 'Edit scope filters'}
            style={{ ...ghostBtn, padding: '8px 12px', minHeight: 44, color: colors.accent }}
          >
            {filtersOpen ? 'Done' : 'Edit'}
          </button>
        </div>
        {filtersOpen && (
          <ScopeFilterEditor credential={credential} orgId={orgId} onError={setActionError} />
        )}
      </KeyRow>

      {/* 30-DAY USE */}
      <KeyRow label="30-day use">
        <UsageSummary usage={usage.data} loading={usage.isLoading} />
      </KeyRow>

      {/* AGREEMENT */}
      <KeyRow label="Agreement">
        <div style={{ ...row, flexWrap: 'wrap' }}>
          {zdrLabel || regionLabel || credential.attested_by ? (
            <span style={bodyText}>
              ZDR: {zdrLabel ?? '—'} · Region: {regionLabel ?? '—'}
              {credential.attested_by && (
                <span style={{ color: colors.textFaint }}>
                  {' '}
                  · attested by {credential.attested_by}
                  {attestedDate ? ` ${attestedDate}` : ''}
                  {tierLabel ? ` (${tierLabel})` : ''}
                </span>
              )}
            </span>
          ) : (
            <span style={hintText}>Not attested yet.</span>
          )}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setAttestOpen((v) => !v)}
            aria-expanded={attestOpen}
            aria-label={attestOpen ? 'Done editing attestations' : 'Edit attestations'}
            style={{ ...ghostBtn, padding: '8px 12px', minHeight: 44, color: colors.accent }}
          >
            {attestOpen ? 'Done' : 'Edit'}
          </button>
        </div>
        {attestOpen && (
          <div style={{ marginTop: 8, display: 'grid', gap: 12, maxWidth: 420 }}>
            <AttestationEditor
              credential={credential}
              orgId={orgId}
              disabled={revoked || enabledBusy}
              onError={setActionError}
            />
          </div>
        )}
      </KeyRow>

      {/* Operations */}
      <div style={{ ...row, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setRotateOpen(true)}
          disabled={revoked || mutations.rotate.isPending}
          style={{ ...secondaryBtn, ...(revoked ? disabledBtn : {}) }}
        >
          Rotate…
        </button>
        <button
          type="button"
          onClick={() => setRevokeOpen(true)}
          disabled={revoked || mutations.revoke.isPending}
          style={{ ...dangerBtn, ...(revoked ? disabledBtn : {}) }}
        >
          Revoke
        </button>
        <button
          type="button"
          onClick={runVerify}
          disabled={revoked || mutations.verify.isPending}
          style={{ ...secondaryBtn, ...(revoked ? disabledBtn : {}) }}
          title="Re-probe the upstream endpoint and refresh the discovered model list"
        >
          {mutations.verify.isPending ? 'Syncing…' : 'Sync / Refresh Models'}
        </button>
        <span style={{ flex: 1 }} />
        {/* Round 2 P0: wire up the orphaned custom-provider edit route. Shown
            for custom-endpoint credentials (base_url present) that aren't
            revoked; revoked rows are never mutated. */}
        {credential.base_url != null && !revoked && (
          <Link
            to="/agent-studio/providers/custom/$credentialId/edit"
            params={{ credentialId: credential.id }}
            style={{
              color: colors.accent,
              fontSize: 13,
              textDecoration: 'none',
              // Round 3 P2: text-link look, 44px hit target — the links sit in
              // an operations row of 44px buttons, so they get the same bar.
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
            }}
          >
            Edit endpoint →
          </Link>
        )}
        <Link
          to="/agent-studio/activity"
          search={{ q: credential.label }}
          style={{
            color: colors.accent,
            fontSize: 13,
            textDecoration: 'none',
            // Round 3 P2: text-link look, 44px hit target (see above).
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
          }}
        >
          View audit trail →
        </Link>
      </div>

      {/* Rotate dialog (alert-class; MFA step-up is engine-enforced) */}
      <ConfirmDialog
        open={rotateOpen}
        title="Rotate API key"
        message="This replaces the sealed key material in place. The card keeps its ID, priority, and filters. The engine requires MFA step-up for rotation."
        confirmLabel={mutations.rotate.isPending ? 'Rotating…' : 'Rotate key'}
        onCancel={() => {
          setRotateOpen(false);
          setNewSecret('');
          setRotateError(null);
        }}
        onConfirm={() => {
          // Empty secret must fail loudly inside the dialog (P2) — never a
          // silent no-op on confirm.
          if (!newSecret.trim()) {
            setRotateError('Enter the new secret — rotation can’t proceed with an empty key.');
            return;
          }
          setActionError(null);
          mutations.rotate.mutate(
            { id: credential.id, secret: newSecret.trim() },
            {
              onSuccess: () => {
                setRotateOpen(false);
                setNewSecret('');
                setRotateError(null);
              },
              onError: (err) => {
                setActionError(err.message);
                setRotateOpen(false);
                setNewSecret('');
                setRotateError(null);
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
          onChange={(e) => {
            setNewSecret(e.target.value);
            if (rotateError) setRotateError(null);
          }}
          hint="Write-only. The plaintext is never displayed again."
        />
        {rotateError && (
          <p role="alert" style={{ ...errorCallout, marginTop: 8 }}>
            {rotateError}
          </p>
        )}
      </ConfirmDialog>

      {revokeDialog}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Labeled row                                                         */
/* ------------------------------------------------------------------ */

const rowLabel: CSSProperties = {
  width: 104,
  flexShrink: 0,
  paddingTop: 4,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colors.textFaint,
};

function KeyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '9px 0', alignItems: 'flex-start' }}>
      <span style={rowLabel}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

const chip: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  color: colors.textDim,
  background: colors.surface2,
  fontFamily: MONO,
};

const chipDashed: CSSProperties = {
  ...chip,
  borderStyle: 'dashed',
  background: 'transparent',
  color: colors.textFaint,
  fontFamily: 'inherit',
};

/* ------------------------------------------------------------------ */
/* 30-day usage summary (N-7) — missing data renders "—", never        */
/* invented. BYOK spend stays labeled as list-price, never billed.     */
/* ------------------------------------------------------------------ */

function UsageSummary({
  usage,
  loading,
}: {
  usage: CredentialUsageView | undefined;
  loading: boolean;
}) {
  if (loading) return <span style={hintText}>Loading…</span>;
  if (!usage) return <span style={bodyText}>—</span>;

  const codes = ['401', '403', '429', '5xx'] as const;
  const nonZero = codes.filter((c) => usage.error_breakdown[c] > 0);

  return (
    <p style={{ ...bodyText, margin: 0 }}>
      {usage.requests.toLocaleString('en-US')} requests ·{' '}
      <span
        title={`${usage.tokens.prompt.toLocaleString('en-US')} prompt · ${usage.tokens.completion.toLocaleString('en-US')} completion`}
      >
        {usage.tokens.total.toLocaleString('en-US')} tokens
      </span>{' '}
      · ${usage.spend_usd}
      {usage.pricing_basis === 'list' && (
        <span style={{ color: colors.textFaint }}> (list-price equivalent — not billed)</span>
      )}{' '}
      · errors{' '}
      {nonZero.length === 0 ? (
        <span style={{ color: colors.textFaint }}>none</span>
      ) : (
        nonZero.map((code, i) => (
          <span key={code}>
            {i > 0 && <span style={{ color: colors.textFaint }}> · </span>}
            <span
              title={`${errorCodeLabel(code)} — ${usage.error_breakdown[code]} failed call${usage.error_breakdown[code] === 1 ? '' : 's'} in the last 30 days`}
              style={{
                color: code === '429' ? colors.warning : colors.textDim,
                fontWeight: code === '429' ? 700 : 400,
              }}
            >
              {errorCodeLabel(code)} ×{usage.error_breakdown[code]}
            </span>
          </span>
        ))
      )}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Attestation editor (ZDR + residency, actor+timestamp preserved)      */
/* ------------------------------------------------------------------ */

function AttestationEditor({
  credential,
  orgId,
  disabled,
  onError,
}: {
  credential: ProviderCredentialView;
  orgId: string;
  disabled: boolean;
  onError: (msg: string | null) => void;
}) {
  // P1-6: independent mutation — an attestation save in flight no longer
  // freezes the enable toggle, fallback, or scope filters.
  const attestPatch = usePatchCredentialField(orgId);
  const busy = attestPatch.isPending;
  return (
    <>
      <Dropdown
        variant="select"
        label="Zero data retention (ZDR)"
        items={ZDR_ITEMS}
        value={credential.zdr_attestation ?? 'use_default'}
        disabled={disabled || busy}
        onChange={(value) => {
          onError(null);
          attestPatch.mutate(
            { id: credential.id, patch: { zdr_attestation: value } },
            { onError: (err) => onError(err.message) },
          );
        }}
      />
      <Dropdown
        variant="select"
        label="Data residency"
        items={REGION_ITEMS}
        value={credential.region_attestation ?? 'global'}
        disabled={disabled || busy}
        onChange={(value) => {
          onError(null);
          attestPatch.mutate(
            { id: credential.id, patch: { region_attestation: value } },
            { onError: (err) => onError(err.message) },
          );
        }}
      />
      {credential.attested_by && (
        <p style={hintText}>
          Attested by {credential.attested_by}
          {credential.attested_at ? ` on ${formatShortDate(credential.attested_at) ?? 'an unknown date'}` : ''}
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Scope filters + blast-radius preview (unchanged behavior)            */
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
  // P1-6: independent mutation — a filter save in flight no longer freezes
  // the enable toggle, fallback, or attestations.
  const scopePatch = usePatchCredentialField(orgId);
  // P2: real assistant IDs for scope validation (typo = loud error, never
  // a silent empty scope).
  const assistantRefs = useAssistantRefs(orgId);
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

  // Normalize both sides (split/trim/join) before comparing: without it,
  // "a, b" vs "a,b" keeps Save dirty forever after a save normalizes the
  // server value.
  const assistantsNormalized = assistantsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
  const credentialAssistantsNormalized = (credential.allowed_assistants ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');

  const dirty =
    JSON.stringify(selected ?? null) !== JSON.stringify(credential.allowed_models ?? null) ||
    assistantsNormalized !== credentialAssistantsNormalized;

  const save = () => {
    setSaving(true);
    onError(null);
    const allowed_assistants = assistantsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    // P2: validate assistant IDs against the org's real assistants before
    // saving. A typo must fail loudly here — never silently scope the key
    // to nobody. While the list is still loading the save is blocked
    // (also loud) rather than validated against nothing.
    if (allowed_assistants.length > 0) {
      if (assistantRefs.isLoading) {
        setSaving(false);
        onError('Still loading your assistants — wait a moment, then save again.');
        return;
      }
      if (assistantRefs.isError || !assistantRefs.data) {
        setSaving(false);
        onError('Couldn’t load your assistants to validate the scope — try again.');
        return;
      }
      const known = new Set(assistantRefs.data.assistants.map((a) => a.id));
      const unknown = allowed_assistants.filter((id) => !known.has(id));
      if (unknown.length > 0) {
        setSaving(false);
        onError(
          `Unknown assistant ID${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')} — check the IDs and try again.`,
        );
        return;
      }
    }
    scopePatch.mutate(
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
                    <span style={{ ...bodyText, fontFamily: MONO }}>{m.id}</span>
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
          // P2: typeahead of the org's real assistant IDs — reduces typos;
          // anything not in the list is still rejected loudly at save time.
          list={`assistant-ids-${credential.id}`}
        />
        {assistantRefs.data && assistantRefs.data.assistants.length > 0 && (
          <datalist id={`assistant-ids-${credential.id}`}>
            {assistantRefs.data.assistants.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.id}
              </option>
            ))}
          </datalist>
        )}
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
                    <span style={{ fontFamily: MONO }}>
                      {a.assistant_id}@v{a.version}
                    </span>{' '}
                    pins <span style={{ fontFamily: MONO }}>{a.model}</span>
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
