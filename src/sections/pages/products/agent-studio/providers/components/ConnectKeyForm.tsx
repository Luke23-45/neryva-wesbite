/**
 * Providers Phase 5 — Wave B: "Connect API Key" inline form (Tab B).
 *
 * Verify-on-create is mandatory: the form probes the credential BEFORE
 * saving (AbortSignal-backed cancel), shows latency + the validated model,
 * and only then enables "Connect". Unverified cards are marked unroutable
 * (doc 19 §1 principle 6).
 */
import { useRef, useState } from 'react';
import { Dropdown } from '@/components/common/ui/Dropdown';
import { TextInput } from '@/components/common/ui/TextInput';
import { ApiError, randomIdempotencyKey } from '@/lib/engine/client';
import { runWithStepUp } from '@/lib/engine/stepup';
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

  const valid = provider.trim().length > 0 && label.trim().length > 0 && secret.trim().length > 0;
  const probedOk = probe?.status === 'ok';

  const runProbe = async () => {
    if (!valid || probing) return;
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
      setProbe(result);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
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
      abortRef.current = null;
      setProbing(false);
    }
  };

  const cancelProbe = () => abortRef.current?.abort();

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
