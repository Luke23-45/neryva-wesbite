/**
 * Providers Phase 5 — Wave B: "Connect API Key" inline form (Tab B).
 *
 * Verify-on-create is mandatory: the form probes the credential BEFORE
 * saving (AbortSignal-backed cancel), shows latency + the validated model,
 * and only then enables "Connect". Unverified cards are marked unroutable
 * (doc 19 §1 principle 6).
 */
import { useEffect, useRef, useState } from 'react';
import { Dropdown } from '@/components/common/ui/Dropdown';
import { TextInput } from '@/components/common/ui/TextInput';
import { ApiError, randomIdempotencyKey } from '@/lib/engine/client';
import { cancelStepUpFor, runWithStepUp } from '@/lib/engine/stepup';
import {
  probeCredential,
  type CreateCredentialInput,
  type ProbeResult,
  type ProviderCredentialView,
} from '@/sections/pages/products/agent-studio/providers/api';
import { useCredentialMutations } from '@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials';
import { probeErrorCopy } from './probeCopy';
import {
  bodyText,
  card,
  colors,
  disabledBtn,
  errorCallout,
  ghostBtn,
  hintText,
  okCallout,
  primaryBtn,
  row,
  sectionTitle,
} from './styles';

const TRANSPORT_ITEMS = [
  { value: 'openai-compatible', label: 'OpenAI-Compatible' },
  { value: 'anthropic', label: 'Anthropic' },
];

const FALLBACK_ITEMS = [
  { value: 'use_shared', label: 'Use shared capacity' },
  { value: 'never_for_covered_models', label: 'Never for models this key covers' },
  { value: 'never_for_provider', label: 'Never for this provider' },
];

export function ConnectKeyForm({
  orgId,
  onDone,
  onCancel,
}: {
  orgId: string;
  onDone: (credential: ProviderCredentialView) => void;
  onCancel: () => void;
}) {
  const mutations = useCredentialMutations(orgId);
  const [provider, setProvider] = useState('');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [transport, setTransport] = useState('openai-compatible');
  const [fallback, setFallback] = useState<CreateCredentialInput['shared_capacity_fallback']>('use_shared');
  const [probing, setProbing] = useState(false);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /**
   * P1-3: one idempotency key per form submit intent. Reused across manual
   * retries of the same connect — the engine replays the original create
   * instead of duplicating the credential.
   */
  const idempotencyKeyRef = useRef<string | null>(null);
  /**
   * Round 2 P1: probe sequence — a probe in flight is identified by its
   * input snapshot. The reset effect below bumps the sequence on every
   * probe-input change, so a probe that resolves after the user edited a
   * field is discarded instead of marking a never-verified input "ok".
   */
  const probeSeqRef = useRef(0);

  const valid = provider.trim().length > 0 && label.trim().length > 0 && secret.trim().length > 0;
  const probedOk = probe?.status === 'ok';

  /**
   * Round 2 P1: a verified probe belongs to the exact inputs it verified.
   * Editing any probe input (provider, secret, transport) invalidates the
   * probe and retires the idempotency key, so (a) "probe key A, edit secret
   * to key B, connect" can never persist a never-verified secret, and
   * (b) "create fails, edit an input, retry" mints a fresh key instead of
   * colliding with the failed attempt's 409. Label/fallback are not probe
   * inputs and don't invalidate.
   */
  useEffect(() => {
    setProbe(null);
    idempotencyKeyRef.current = null;
    probeSeqRef.current += 1;
  }, [provider, secret, transport]);

  const runProbe = async () => {
    if (!valid || probing) return;
    const seq = probeSeqRef.current;
    setProbing(true);
    setProbe(null);
    setSaveError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      // P2 re-proof: the probe route requires a fresh MFA proof — if it
      // expired, re-prompt and retry rather than surfacing a raw error.
      const result = await runWithStepUp('probe provider key', (proof) =>
        probeCredential(
          orgId,
          { provider: provider.trim(), secret: secret.trim(), transport },
          ctrl.signal,
          proof,
        ),
      );
      // Superseded by an input edit while the probe was in flight — the
      // inputs it verified are no longer the current inputs.
      if (seq === probeSeqRef.current) setProbe(result);
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

  const connect = () => {
    if (!probedOk) return;
    setSaveError(null);
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = randomIdempotencyKey();
    mutations.create.mutate(
      {
        input: {
          provider: provider.trim(),
          label: label.trim(),
          secret: secret.trim(),
          transport,
          shared_capacity_fallback: fallback,
        },
        idempotencyKey: idempotencyKeyRef.current,
      },
      {
        onSuccess: ({ credential }) => onDone(credential),
        onError: (err) => setSaveError(err.message),
      },
    );
  };

  return (
    <div style={{ ...card, background: colors.bg }} aria-label="Connect API key form">
      <h3 style={sectionTitle}>Connect API key</h3>
      <p style={{ ...hintText, marginTop: 6 }}>
        The key is verified live before it is saved. Secrets are write-only — the plaintext is never
        displayed again.
      </p>

      <div style={{ display: 'grid', gap: 12, marginTop: 14, maxWidth: 520 }}>
        <TextInput
          label="Provider"
          placeholder="openai"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          hint="Provider slug, e.g. openai, anthropic, google."
        />
        <TextInput
          label="Key label"
          placeholder="Production Key"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <TextInput
          label="API key"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Dropdown
            variant="select"
            label="Transport"
            items={TRANSPORT_ITEMS}
            value={transport}
            onChange={setTransport}
          />
          <Dropdown
            variant="select"
            label="Shared capacity fallback"
            items={FALLBACK_ITEMS}
            value={fallback ?? 'use_shared'}
            onChange={(v) =>
              setFallback(v as CreateCredentialInput['shared_capacity_fallback'])
            }
          />
        </div>
      </div>

      {/* Probe state */}
      <div style={{ marginTop: 16 }}>
        {probing ? (
          <div style={{ ...row, gap: 12 }}>
            <span style={bodyText} role="status">
              Probing endpoint & discovering models…
            </span>
            <button type="button" aria-label="Cancel probe" onClick={cancelProbe} style={ghostBtn}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={runProbe}
            disabled={!valid}
            style={{ ...primaryBtn, ...(!valid ? disabledBtn : {}) }}
          >
            Verify key
          </button>
        )}

        {probe?.status === 'ok' && (
          <p style={{ ...okCallout, marginTop: 12 }} role="status">
            Verified — {probe.latency_ms}ms
            {probe.models[0] ? (
              <>
                {' '}· validated model: <strong>{probe.models[0].id}</strong>
                {probe.models.length > 1 ? ` (+${probe.models.length - 1} more discovered)` : ''}
              </>
            ) : (
              ' · no models discovered'
            )}
          </p>
        )}
        {probe?.status === 'failed' && (
          <p style={{ ...errorCallout, marginTop: 12 }} role="alert">
            {probeErrorCopy(probe.error_code, probe.error)}
          </p>
        )}
      </div>

      {saveError && (
        <p style={{ ...errorCallout, marginTop: 12 }} role="alert">
          {saveError}
        </p>
      )}

      <div style={{ ...row, marginTop: 16 }}>
        <button
          type="button"
          onClick={connect}
          disabled={!probedOk || mutations.create.isPending}
          title={probedOk ? undefined : 'Verify the key first'}
          style={{ ...primaryBtn, ...(!probedOk ? disabledBtn : {}) }}
        >
          {mutations.create.isPending ? 'Connecting…' : 'Connect key'}
        </button>
        <button type="button" onClick={onCancel} style={ghostBtn}>
          Cancel
        </button>
      </div>
      {!probedOk && valid && (
        <p style={{ ...hintText, marginTop: 8 }}>
          “Connect key” enables after a successful verification probe.
        </p>
      )}
    </div>
  );
}
