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
import type { ProbeResult } from '@/sections/pages/products/agent-studio/providers/api';

const hoisted = vi.hoisted(() => ({
  probeCredential: vi.fn(),
  createMutateAsync: vi.fn(),
  patchMutateAsync: vi.fn(),
  verifyMutateAsync: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1' }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials', () => ({
  useCredentialMutations: () => ({
    create: { mutate: vi.fn(), mutateAsync: hoisted.createMutateAsync, isPending: false },
    patch: { mutate: vi.fn(), mutateAsync: hoisted.patchMutateAsync, isPending: false },
    verify: { mutate: vi.fn(), mutateAsync: hoisted.verifyMutateAsync, isPending: false },
    rotate: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    revoke: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
  }),
  useCredentials: () => ({ data: { credentials: [] }, isLoading: false }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/sections/pages/products/agent-studio/providers/api')>();
  return { ...original, probeCredential: hoisted.probeCredential };
});

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => hoisted.navigate,
}));

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <CustomProviderForm />
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
  hoisted.createMutateAsync.mockResolvedValue({ credential: { id: 'new-cred' } });
  hoisted.verifyMutateAsync.mockResolvedValue({ credential: { id: 'new-cred' } });
});

describe('validateBaseUrl', () => {
  it('accepts a public https URL', () => {
    expect(validateBaseUrl('https://vllm.internal.corp/v1').state).toBe('valid');
  });
  it('rejects metadata and private hosts with the SSRF copy', () => {
    for (const host of ['169.254.169.254', '10.0.0.5', '192.168.1.1', '172.16.0.9', '127.0.0.1', 'localhost']) {
      const result = validateBaseUrl(`https://${host}/v1`);
      expect(result.state).toBe('invalid');
      expect(result.message).toBe('Target address resolves to private or metadata network.');
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
  it('maps 429 to the quota copy', () => {
    expect(probeErrorCopy('rate_limited')).toBe('Provider quota exceeded or rate-limited. Try again shortly.');
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
      screen.getByText('Target address resolves to private or metadata network.'),
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
    expect(payload.provider).toBe('eu-vllm');
    expect(payload.base_url).toBe('https://example.com/v1');
    expect(payload.enabled).toBe(true);
    expect(hoisted.verifyMutateAsync).toHaveBeenCalledWith('new-cred');
    expect(hoisted.navigate).toHaveBeenCalledWith({ to: '/agent-studio/providers' });
  });

  it('Save as Inactive works without a probe and skips verification', async () => {
    renderForm();
    fillBasics();
    const saveInactive = screen.getByRole('button', { name: 'Save as Inactive' });
    expect(saveInactive).not.toBeDisabled();
    fireEvent.click(saveInactive);
    await waitFor(() => expect(hoisted.createMutateAsync).toHaveBeenCalled());
    expect(hoisted.createMutateAsync.mock.calls[0][0].enabled).toBe(false);
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
    expect(payload.manual_model_declarations).toEqual([
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
});
