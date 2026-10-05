// @vitest-environment jsdom
/**
 * Providers Phase 5 — Wave B: CustomProviderForm targeted tests.
 * - validateBaseUrl: https ok, SSRF hosts rejected client-side, garbage rejected
 * - SSRF-blocked probe failure shows the remediation copy
 * - 401 probe failure shows the invalid-key copy
 * - probe cancel returns the form to idle
 * - successful probe enables Save & Connect and lists discovered models
 * - PRV-035 manual declarations persist: valid entries enable Save + ride the payload,
 *   invalid entries show field errors, zero declarations keep Save & Connect disabled
 * - Save as Inactive works without a probe; Save & Connect verifies after create
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { CustomProviderForm } from './CustomProviderForm';
import { validateBaseUrl } from './validateBaseUrl';
import { probeErrorCopy } from '@/sections/pages/products/agent-studio/providers/components/probeCopy';
import type { ProbeResult, ProviderCredentialView } from '@/sections/pages/products/agent-studio/providers/api';

const hoisted = vi.hoisted(() => ({
  probeCredential: vi.fn(),
  createMutateAsync: vi.fn(),
  patchMutateAsync: vi.fn(),
  verifyMutateAsync: vi.fn(),
  navigate: vi.fn(),
  credentials: [] as ProviderCredentialView[],
  role: 'owner' as string | null,
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1', role: hoisted.role }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials', () => ({
  useCredentialMutations: () => ({
    create: { mutate: vi.fn(), mutateAsync: hoisted.createMutateAsync, isPending: false },
    patch: { mutate: vi.fn(), mutateAsync: hoisted.patchMutateAsync, isPending: false },
    verify: { mutate: vi.fn(), mutateAsync: hoisted.verifyMutateAsync, isPending: false },
    rotate: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    revoke: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
  }),
  useCredentials: () => ({ data: { credentials: hoisted.credentials }, isLoading: false }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/sections/pages/products/agent-studio/providers/api')>();
  return { ...original, probeCredential: hoisted.probeCredential };
});

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => hoisted.navigate,
}));

function renderForm(credentialId?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <CustomProviderForm credentialId={credentialId} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

function fillBasics() {
  fireEvent.change(screen.getByLabelText('Provider Label'), { target: { value: 'EU vLLM' } });
  fireEvent.change(screen.getByLabelText('Base URL'), { target: { value: 'https://example.com/v1' } });
  fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'secret-123' } });
}

const okProbe: ProbeResult = {
  status: 'ok',
  latency_ms: 142,
  models: [
    {
      id: 'llama-3.3-70b-instruct',
      display_name: 'Llama 3.3 70B',
      context_window_tokens: 131072,
      capabilities: { tools: true, vision: false, reasoning: false, structured_output: true },
    },
    {
      id: 'deepseek-r1-distill-qwen-32b',
      display_name: 'DeepSeek R1 Distill',
      context_window_tokens: 65536,
      capabilities: { tools: true, vision: false, reasoning: true, structured_output: false },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.credentials = [];
  hoisted.role = 'owner';
  hoisted.createMutateAsync.mockResolvedValue({ credential: { id: 'new-cred' } });
  hoisted.verifyMutateAsync.mockResolvedValue({ credential: { id: 'new-cred' } });
  hoisted.patchMutateAsync.mockResolvedValue({ credential: { id: 'cred-1' } });
});

describe('validateBaseUrl', () => {
  it('accepts a public https URL', () => {
    expect(validateBaseUrl('https://vllm.internal.corp/v1').state).toBe('valid');
  });
  it('rejects metadata and private hosts with the SSRF copy', () => {
    for (const host of ['169.254.169.254', '10.0.0.5', '192.168.1.1', '172.16.0.9', '127.0.0.1', 'localhost']) {
      const result = validateBaseUrl(`https://${host}/v1`);
      expect(result.state).toBe('invalid');
      expect(result.message).toBe(
        'Private, loopback, and link-local addresses are blocked — use a publicly reachable HTTPS endpoint.',
      );
    }
  });
  it('rejects garbage input', () => {
    expect(validateBaseUrl('not a url').state).toBe('invalid');
  });
  it('is idle on empty input', () => {
    expect(validateBaseUrl('').state).toBe('idle');
  });
});

describe('probeErrorCopy', () => {
  it('maps ssrf_blocked to the private-network copy', () => {
    expect(probeErrorCopy('ssrf_blocked')).toBe(
      'Target address resolves to private or metadata network. Use a publicly reachable HTTPS endpoint.',
    );
  });
  it('maps 401 codes to the invalid-key copy', () => {
    expect(probeErrorCopy('invalid_api_key')).toBe(
      'Invalid API key. Check key permissions or generate a new key.',
    );
  });
  it('maps 403 to the scopes copy', () => {
    expect(probeErrorCopy('forbidden', '403 Forbidden')).toBe(
      'Key lacks model-read permissions. Use manual model declaration or expand key scopes.',
    );
  });
  it('maps engine-imposed 429 (rate_limited) to the platform-limit copy, not provider quota', () => {
    expect(probeErrorCopy('rate_limited')).toBe(
      'Neryva’s verification limit is exhausted for now — the provider itself was not the problem. Try again shortly.',
    );
  });

  it('maps provider 429/quota messages to the provider quota copy', () => {
    expect(probeErrorCopy('upstream_429', 'provider returned 429 quota exceeded')).toBe(
      'Provider quota exceeded or rate-limited. Try again shortly.',
    );
  });
});

describe('CustomProviderForm', () => {
  it('disables both save buttons until the form is valid', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /Save & Connect Provider/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save as Inactive' })).toBeDisabled();
  });

  it('shows the SSRF copy on the field for private/metadata URLs and blocks probing', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Base URL'), {
      target: { value: 'https://169.254.169.254/latest/meta-data' },
    });
    expect(
      screen.getByText(
        'Private, loopback, and link-local addresses are blocked — use a publicly reachable HTTPS endpoint.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /Run Probe/ })).toBeDisabled();
  });

  it('shows the SSRF remediation copy when the probe fails server-side', async () => {
    hoisted.probeCredential.mockResolvedValue({
      status: 'failed',
      latency_ms: 0,
      models: [],
      error_code: 'ssrf_blocked',
    } satisfies ProbeResult);
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Run Probe & Discover Models/ }));
    await waitFor(() => {
      expect(
        screen.getByText(/Target address resolves to private or metadata network\. Use a publicly reachable HTTPS endpoint\./),
      ).toBeTruthy();
    });
  });

  it('shows the invalid-key copy on a 401 probe failure', async () => {
    hoisted.probeCredential.mockResolvedValue({
      status: 'failed',
      latency_ms: 0,
      models: [],
      error_code: 'invalid_api_key',
    } satisfies ProbeResult);
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Run Probe & Discover Models/ }));
    await waitFor(() => {
      expect(screen.getByText(/Invalid API key\. Check key permissions or generate a new key\./)).toBeTruthy();
    });
  });

  it('cancel returns the probe UI to idle', async () => {
    hoisted.probeCredential.mockImplementation(
      (_org: string, _input: unknown, signal?: AbortSignal) =>
        new Promise<ProbeResult>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        }),
    );
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Run Probe & Discover Models/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel probe' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel probe' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run Probe & Discover Models/ })).toBeTruthy();
    });
    expect(screen.queryByText(/Probing endpoint/)).toBeNull();
  });

  it('a successful probe enables Save & Connect and lists discovered models', async () => {
    hoisted.probeCredential.mockResolvedValue(okProbe);
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Run Probe & Discover Models/ }));
    await waitFor(() => {
      expect(screen.getByText(/Latency: 142ms/)).toBeTruthy();
      expect(screen.getByText('llama-3.3-70b-instruct')).toBeTruthy();
      expect(screen.getByText('deepseek-r1-distill-qwen-32b')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /Save & Connect Provider/ })).not.toBeDisabled();
  });

  it('Save & Connect creates, verifies, and navigates', async () => {
    hoisted.probeCredential.mockResolvedValue(okProbe);
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Run Probe & Discover Models/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Save & Connect Provider/ })).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Save & Connect Provider/ }));
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalled());
    const payload = hoisted.createMutateAsync.mock.calls[0][0];
    // P1-3: the create rides { input, idempotencyKey } — one key per submit
    // intent so a manual retry replays instead of duplicating.
    expect(payload.input.provider).toBe('eu-vllm');
    expect(payload.input.base_url).toBe('https://example.com/v1');
    expect(payload.input.enabled).toBe(true);
    expect(typeof payload.idempotencyKey).toBe('string');
    expect(payload.idempotencyKey.length).toBeGreaterThanOrEqual(8);
    expect(hoisted.verifyMutateAsync).toHaveBeenCalledWith('new-cred');
    expect(hoisted.navigate).toHaveBeenCalledWith({ to: '/agent-studio/providers' });
  });

  it('navigates even when the post-create verify fails (best-effort verify)', async () => {
    hoisted.probeCredential.mockResolvedValue(okProbe);
    hoisted.verifyMutateAsync.mockRejectedValueOnce(new Error('probe exploded'));
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Run Probe & Discover Models/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Save & Connect Provider/ })).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Save & Connect Provider/ }));
    await waitFor(() => expect(hoisted.navigate).toHaveBeenCalledWith({ to: '/agent-studio/providers' }));
    // The failure is swallowed deliberately — the card surface reports it
    // and offers "Retry verify".
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Save as Inactive works without a probe and skips verification', async () => {
    renderForm();
    fillBasics();
    const saveInactive = screen.getByRole('button', { name: 'Save as Inactive' });
    expect(saveInactive).not.toBeDisabled();
    fireEvent.click(saveInactive);
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalled());
    expect(hoisted.createMutateAsync.mock.calls[0][0].input.enabled).toBe(false);
    expect(hoisted.verifyMutateAsync).not.toHaveBeenCalled();
  });

  it('PRV-035: manual declarations persist - valid entries enable Save and ride the create payload', async () => {
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('radio', { name: /Manual Declaration/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add Custom Model Manually/ }));
    fireEvent.change(screen.getByLabelText('Model ID'), {
      target: { value: 'llama-3.3-70b-instruct' },
    });
    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'Llama 3.3 70B Instruct' },
    });
    fireEvent.change(screen.getByLabelText('Context window (tokens)'), {
      target: { value: '131072' },
    });
    fireEvent.change(screen.getByLabelText('Input $ / 1M'), {
      target: { value: '0.35' },
    });
    // No "engine does not persist" copy anymore - declarations are stored.
    expect(screen.queryByText(/engine does not persist them yet/)).toBeNull();
    // Operator-claimed cost labeling is honest.
    expect(screen.getByText(/operator-claimed/)).toBeTruthy();
    const saveConnect = screen.getByRole('button', { name: /Save & Connect Provider/ });
    expect(saveConnect).not.toBeDisabled();
    fireEvent.click(saveConnect);
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalled());
    const payload = hoisted.createMutateAsync.mock.calls[0][0];
    expect(payload.input.manual_model_declarations).toEqual([
      {
        id: 'llama-3.3-70b-instruct',
        display_name: 'Llama 3.3 70B Instruct',
        context_window_tokens: 131072,
        capabilities: { tools: false, vision: false, reasoning: false, structured_output: false },
        input_cost_per_1m_usd: '0.35',
      },
    ]);
  });

  it('PRV-035: invalid manual declarations show field errors and disable Save', () => {
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('radio', { name: /Manual Declaration/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add Custom Model Manually/ }));
    // Empty row: id + display name + context window all invalid.
    expect(screen.getByRole('button', { name: /Save & Connect Provider/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save as Inactive' })).toBeDisabled();
    expect(screen.getByText(/Model ID: letters, digits/)).toBeTruthy();
  });

  it('PRV-035: manual mode with zero declarations keeps Save & Connect disabled', () => {
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('radio', { name: /Manual Declaration/ }));
    const saveConnect = screen.getByRole('button', { name: /Save & Connect Provider/ });
    expect(saveConnect).toBeDisabled();
    expect(saveConnect.getAttribute('title')).toMatch(/at least one manual model declaration/);
    // Save as Inactive stays available (declarations can be added on edit).
    expect(screen.getByRole('button', { name: 'Save as Inactive' })).not.toBeDisabled();
  });

  it('header add/delete works and values stay editable pre-save', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Add Header/ }));
    fireEvent.change(screen.getByLabelText('Header 1 name'), {
      target: { value: 'X-Gateway-Routing-Key' },
    });
    fireEvent.change(screen.getByLabelText('Header 1 value'), {
      target: { value: 'prod-cluster-alpha' },
    });
    expect((screen.getByLabelText('Header 1 name') as HTMLInputElement).value).toBe(
      'X-Gateway-Routing-Key',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete header X-Gateway-Routing-Key' }));
    expect(screen.queryByLabelText('Header 1 name')).toBeNull();
  });

  it('Round 2 P1: editing a probe input invalidates the probe — a stale verify can never gate connect', async () => {
    hoisted.probeCredential.mockResolvedValue(okProbe);
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Run Probe & Discover Models/ }));
    await waitFor(() => {
      expect(screen.getByText(/Latency: 142ms/)).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /Save & Connect Provider/ })).not.toBeDisabled();
    // Edit the secret AFTER the probe: the probe verified the old secret.
    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'secret-456' } });
    // The stale probe result is gone and Connect is gated again.
    expect(screen.queryByText(/Latency: 142ms/)).toBeNull();
    expect(screen.getByRole('button', { name: /Save & Connect Provider/ })).toBeDisabled();
  });

  it('Round 2 P1: create fails, input edited, retry mints a fresh idempotency key (no 409)', async () => {
    hoisted.createMutateAsync.mockRejectedValueOnce(new Error('boom'));
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'Save as Inactive' }));
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
    const firstKey = hoisted.createMutateAsync.mock.calls[0][0].idempotencyKey as string;
    // Edit an input, then retry: the failed attempt's key is retired.
    fireEvent.change(screen.getByLabelText('Provider Label'), { target: { value: 'EU vLLM 2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save as Inactive' }));
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalledTimes(2));
    const secondKey = hoisted.createMutateAsync.mock.calls[1][0].idempotencyKey as string;
    expect(secondKey).not.toBe(firstKey);
  });

  it('Round 2 P1: identical-payload retry reuses the idempotency key (engine replays)', async () => {
    hoisted.createMutateAsync.mockRejectedValueOnce(new Error('boom'));
    renderForm();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'Save as Inactive' }));
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalledTimes(1));
    const firstKey = hoisted.createMutateAsync.mock.calls[0][0].idempotencyKey as string;
    // Retry WITHOUT editing: the same key is reused so the engine replays
    // the original attempt instead of duplicating the credential.
    fireEvent.click(screen.getByRole('button', { name: 'Save as Inactive' }));
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalledTimes(2));
    expect(hoisted.createMutateAsync.mock.calls[1][0].idempotencyKey).toBe(firstKey);
  });
});

function editCred(overrides: Partial<ProviderCredentialView> = {}): ProviderCredentialView {
  return {
    id: 'cred-1',
    provider: 'acme-vllm',
    provider_display_name: 'Acme vLLM',
    label: 'EU Production vLLM',
    external_ref: 'cred-1',
    source: 'byok',
    status: 'active',
    secret_fingerprint: 'sk-…1234',
    created_at: '2026-10-01T00:00:00Z',
    rotated_at: null,
    revoked_at: null,
    revocation_reason: null,
    compromised: false,
    priority: 0,
    enabled: true,
    allowed_models: ['llama-3.3-70b-instruct', 'deepseek-r1-distill-qwen-32b'],
    allowed_assistants: null,
    shared_capacity_fallback: 'never_for_provider',
    transport: 'anthropic',
    base_url: 'https://llm.example.com/v1',
    custom_header_names: ['X-Gateway-Key'],
    verification_status: 'verified',
    verified_at: '2026-10-01T00:00:00Z',
    last_probe_latency_ms: 100,
    discovered_models: [],
    zdr_attestation: 'no_zdr',
    region_attestation: 'eu',
    attested_by: null,
    attested_at: null,
    manual_model_declarations: [],
    ...overrides,
  };
}

describe('CustomProviderForm edit mode', () => {
  it('shows a not-found state for an unknown credential id', () => {
    renderForm('nope');
    expect(screen.getByText('Custom provider not found')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to My Providers' })).toBeTruthy();
  });

  it('Round 2 P0: prefills every field and save preserves untouched fields (no silent resets)', async () => {
    hoisted.credentials = [editCred()];
    renderForm('cred-1');
    // Full prefill — every editable field restores from the stored row.
    expect((screen.getByLabelText('Provider Label') as HTMLInputElement).value).toBe(
      'EU Production vLLM',
    );
    expect((screen.getByLabelText('Base URL') as HTMLInputElement).value).toBe(
      'https://llm.example.com/v1',
    );
    const slug = screen.getByLabelText('Provider Slug') as HTMLInputElement;
    expect(slug.value).toBe('acme-vllm');
    expect(slug).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Anthropic/ })).toBeChecked();
    // The sealed secret and auth-scheme selector are not editable here.
    expect(screen.queryByLabelText('Secret Key')).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: 'Auth scheme' })).toBeNull();
    // Existing header names are shown read-only; values are never invented.
    expect(screen.getByText('X-Gateway-Key')).toBeTruthy();
    // Save is NOT permanently disabled — the prefilled URL validates.
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).not.toBeDisabled();
    fireEvent.click(save);
    await waitFor(() => expect(hoisted.patchMutateAsync).toHaveBeenCalledTimes(1));
    const { id, patch } = hoisted.patchMutateAsync.mock.calls[0][0] as {
      id: string;
      patch: Record<string, unknown>;
    };
    expect(id).toBe('cred-1');
    expect(patch.label).toBe('EU Production vLLM');
    expect(patch.base_url).toBe('https://llm.example.com/v1');
    expect(patch.transport).toBe('anthropic');
    expect(patch.shared_capacity_fallback).toBe('never_for_provider');
    expect(patch.zdr_attestation).toBe('no_zdr');
    expect(patch.region_attestation).toBe('eu');
    // Untouched fields are omitted — never sent as null/{} (the old code
    // wiped custom_headers and allowed_models on every edit).
    expect('custom_headers' in patch).toBe(false);
    expect('allowed_models' in patch).toBe(false);
    expect('manual_model_declarations' in patch).toBe(false);
    expect(hoisted.navigate).toHaveBeenCalledWith({ to: '/agent-studio/providers' });
  });

  it('Round 3 P2: edit-mode probe button is disabled with an honest reason (sealed secret can’t authenticate)', () => {
    hoisted.credentials = [editCred()];
    renderForm('cred-1');
    const probe = screen.getByRole('button', { name: /Run Probe & Discover Models/ });
    expect(probe).toBeDisabled();
    expect(probe.getAttribute('title')).toMatch(/sealed secret can’t be re-sent/);
    expect(probe.getAttribute('title')).toMatch(/Sync \/ Refresh Models/);
  });

  it('Round 2 P0: "Replace the header set" sends the full new set, nothing else changes', async () => {    hoisted.credentials = [editCred()];
    renderForm('cred-1');
    // The header editor is hidden until the operator opts in.
    expect(screen.queryByRole('button', { name: /Add Header/ })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /Replace the header set/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add Header/ }));
    fireEvent.change(screen.getByLabelText('Header 1 name'), { target: { value: 'X-New-Key' } });
    fireEvent.change(screen.getByLabelText('Header 1 value'), { target: { value: 'v2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(hoisted.patchMutateAsync).toHaveBeenCalledTimes(1));
    const { patch } = hoisted.patchMutateAsync.mock.calls[0][0] as {
      patch: Record<string, unknown>;
    };
    expect(patch.custom_headers).toEqual({ 'X-New-Key': 'v2' });
    // The allow-list is still untouched — still omitted.
    expect('allowed_models' in patch).toBe(false);
  });

  it('Round 2 P0: prefilled manual declarations ride the patch (never wiped)', async () => {
    hoisted.credentials = [
      editCred({
        manual_model_declarations: [
          {
            id: 'llama-3.3-70b-instruct',
            display_name: 'Llama 3.3 70B',
            context_window_tokens: 131072,
            capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
          },
        ],
      }),
    ];
    renderForm('cred-1');
    // Prefill switched to manual mode and restored the row.
    expect((screen.getByLabelText('Model ID') as HTMLInputElement).value).toBe(
      'llama-3.3-70b-instruct',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(hoisted.patchMutateAsync).toHaveBeenCalledTimes(1));
    const { patch } = hoisted.patchMutateAsync.mock.calls[0][0] as {
      patch: Record<string, unknown>;
    };
    expect(patch.manual_model_declarations).toEqual([
      {
        id: 'llama-3.3-70b-instruct',
        display_name: 'Llama 3.3 70B',
        context_window_tokens: 131072,
        capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
      },
    ]);
  });
});

describe('Round 4 P1: role gating', () => {
  it('non-privileged roles get an honest gate instead of a form that would 403', () => {
    hoisted.role = 'billing';
    renderForm();
    expect(screen.getByText('Only owners and admins can manage provider keys.')).toBeTruthy();
    // No form fields render — nothing to fill, nothing to submit.
    expect(screen.queryByLabelText('Provider Label')).toBeNull();
    expect(screen.queryByLabelText('Base URL')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save & Connect Provider' })).toBeNull();
  });

  it('developer role is also gated (Round 4 P1)', () => {
    hoisted.role = 'developer';
    renderForm('cred-1');
    expect(screen.getByText('Only owners and admins can manage provider keys.')).toBeTruthy();
  });
});
