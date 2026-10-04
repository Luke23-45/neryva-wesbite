// @vitest-environment jsdom
/**
 * Providers Phase 5 — Wave B: KeyCard targeted tests.
 * - status pill matrix (verified+latency / unverified / failed / revoked / verifying)
 * - unverified cards marked unroutable
 * - fallback selector writes
 * - attestation writes
 * - N-7 pills render with labeled list-price
 * - enabled toggle + priority buttons
 * - blast-radius preview derived from N-5 pinned_by
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import {
  KeyCard,
  type KeyCardProps,
} from './KeyCard';
import { statusPillFor } from './statusPill';
import type {
  CredentialUsageView,
  ProviderCredentialView,
} from '@/sections/pages/products/agent-studio/providers/api';

const hoisted = vi.hoisted(() => ({
  patchMutate: vi.fn(),
  verifyMutate: vi.fn(),
  rotateMutate: vi.fn(),
  revokeMutate: vi.fn(),
  createMutate: vi.fn(),
  fetchGroupedModels: vi.fn(),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials', () => ({
  useCredentialMutations: () => ({
    create: { mutate: hoisted.createMutate, isPending: false },
    patch: { mutate: hoisted.patchMutate, isPending: false },
    verify: { mutate: hoisted.verifyMutate, isPending: false },
    rotate: { mutate: hoisted.rotateMutate, isPending: false },
    revoke: { mutate: hoisted.revokeMutate, isPending: false },
  }),
  useCredentialUsage: (): { data: CredentialUsageView; isLoading: boolean } => ({
    data: {
      requests: 1200,
      tokens: { prompt: 800000, completion: 200000, total: 1000000 },
      spend_usd: '4.20',
      list_price_equivalent_usd: '12.34',
      pricing_basis: 'list',
      error_breakdown: { '401': 3, '403': 0, '429': 1, '5xx': 0 },
      window: '7d',
    },
    isLoading: false,
  }),
  useCredentials: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/sections/pages/products/agent-studio/providers/api')>();
  return { ...original, fetchGroupedModels: hoisted.fetchGroupedModels };
});

function baseCredential(overrides: Partial<ProviderCredentialView> = {}): ProviderCredentialView {
  return {
    id: 'cred-1',
    provider: 'openai',
    label: 'Production Key',
    external_ref: 'ext-1',
    source: 'byok',
    status: 'active',
    secret_fingerprint: 'sk-…8f9a',
    created_at: '2026-10-01T00:00:00Z',
    rotated_at: null,
    revoked_at: null,
    revocation_reason: null,
    compromised: false,
    priority: 0,
    enabled: true,
    allowed_models: null,
    allowed_assistants: null,
    shared_capacity_fallback: 'use_shared',
    transport: 'openai-compatible',
    base_url: null,
    custom_header_names: null,
    verification_status: 'verified',
    verified_at: '2026-10-01T00:00:00Z',
    last_probe_latency_ms: 124,
    discovered_models: [
      {
        id: 'gpt-4o',
        display_name: 'GPT-4o',
        context_window_tokens: 128000,
        capabilities: { tools: true, vision: true, reasoning: false, structured_output: true },
      },
    ],
    zdr_attestation: 'use_default',
    region_attestation: 'global',
    attested_by: 'owner@example.com',
    attested_at: '2026-10-02T00:00:00Z',
    ...overrides,
  };
}

function renderCard(props: Partial<KeyCardProps> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const full: KeyCardProps = {
    credential: baseCredential(),
    orgId: 'org-1',
    isFirst: true,
    isLast: true,
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    ...props,
  };
  return {
    ...render(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={client}>
          <KeyCard {...full} />
        </QueryClientProvider>
      </ThemeProvider>,
    ),
    props: full,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.fetchGroupedModels.mockResolvedValue({ platform: [], byok: [] });
});

describe('statusPillFor matrix', () => {
  it('renders Verified with latency', () => {
    expect(statusPillFor(baseCredential()).text).toBe('Verified (124ms)');
    expect(statusPillFor(baseCredential()).tone).toBe('success');
  });
  it('renders Verified without latency', () => {
    expect(statusPillFor(baseCredential({ last_probe_latency_ms: null })).text).toBe('Verified');
  });
  it('renders Unverified', () => {
    const pill = statusPillFor(baseCredential({ verification_status: 'unverified' }));
    expect(pill.text).toBe('Unverified');
    expect(pill.tone).toBe('warning');
  });
  it('renders Failed with engine detail', () => {
    const pill = statusPillFor(baseCredential({ verification_status: 'failed' }), '401 Invalid Key');
    expect(pill.text).toBe('Failed: 401 Invalid Key');
    expect(pill.tone).toBe('error');
  });
  it('renders Failed without detail', () => {
    expect(statusPillFor(baseCredential({ verification_status: 'failed' })).text).toBe('Failed');
  });
  it('renders Revoked and Verifying', () => {
    expect(statusPillFor(baseCredential({ verification_status: 'revoked' })).text).toBe('Revoked');
    expect(statusPillFor(baseCredential({ verification_status: 'verifying' })).text).toBe('Verifying…');
  });
});

describe('KeyCard rendering', () => {
  it('shows the pill, masked fingerprint, and label', () => {
    renderCard();
    expect(screen.getByText('Verified (124ms)')).toBeTruthy();
    expect(screen.getByText('sk-…8f9a')).toBeTruthy();
    expect(screen.getByLabelText('API key: Production Key')).toBeTruthy();
  });

  it('marks unverified cards unroutable with a verify action', () => {
    renderCard({ credential: baseCredential({ verification_status: 'unverified' }) });
    expect(screen.getByText('Unverified')).toBeTruthy();
    expect(screen.getByText(/Unroutable until verified/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Verify now' }));
    expect(hoisted.verifyMutate).toHaveBeenCalledWith('cred-1', expect.anything());
  });

  it('disables the enabled toggle on revoked cards', () => {
    renderCard({ credential: baseCredential({ verification_status: 'revoked', enabled: false }) });
    expect(screen.getByText('Revoked')).toBeTruthy();
    expect(screen.getByRole('switch').getAttribute('aria-disabled')).toBe('true');
  });

  it('toggles enabled state via patch', () => {
    renderCard();
    fireEvent.click(screen.getByRole('switch'));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'cred-1', patch: { enabled: false } },
      expect.anything(),
    );
  });

  it('calls onMoveUp/onMoveDown from priority buttons', () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    renderCard({ credential: baseCredential(), isFirst: false, isLast: false, onMoveUp, onMoveDown });
    fireEvent.click(screen.getByRole('button', { name: 'Move Production Key up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move Production Key down' }));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('disables the up button when first', () => {
    renderCard({ isFirst: true, isLast: false });
    expect(screen.getByRole('button', { name: 'Move Production Key up' })).toBeDisabled();
  });
});

describe('fallback selector writes', () => {
  it('patches shared_capacity_fallback on change', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Shared capacity fallback' }));
    fireEvent.click(screen.getByRole('option', { name: /Never for this provider/ }));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'cred-1', patch: { shared_capacity_fallback: 'never_for_provider' } },
      expect.anything(),
    );
  });
});

describe('attestation writes', () => {
  it('patches zdr_attestation on change', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /compliance attestations/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Zero data retention (ZDR)' }));
    fireEvent.click(screen.getByRole('option', { name: /No ZDR/ }));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'cred-1', patch: { zdr_attestation: 'no_zdr' } },
      expect.anything(),
    );
  });

  it('shows actor and timestamp when attested', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /compliance attestations/ }));
    expect(screen.getByText(/Attested by owner@example.com/)).toBeTruthy();
  });
});

describe('N-7 observability pills', () => {
  it('renders requests, spend, and labeled list-price equivalent', () => {
    renderCard();
    expect(screen.getByText('1,200')).toBeTruthy();
    expect(screen.getByText('$4.20')).toBeTruthy();
    expect(screen.getByText(/list-price equivalent \$12\.34 — not billed/)).toBeTruthy();
  });

  it('renders the 401/403/429/5xx error breakdown', () => {
    renderCard();
    expect(screen.getByText('401: 3')).toBeTruthy();
    expect(screen.getByText('403: 0')).toBeTruthy();
    expect(screen.getByText('429: 1')).toBeTruthy();
    expect(screen.getByText('5xx: 0')).toBeTruthy();
  });
});

describe('blast-radius preview', () => {
  it('lists pinned assistants that a model restriction would break', async () => {
    hoisted.fetchGroupedModels.mockResolvedValue({
      platform: [],
      byok: [
        {
          provider: 'openai',
          provider_display_name: 'OpenAI',
          credential_id: 'cred-1',
          credential_label: 'Production Key',
          models: [
            {
              model_id: 'gpt-4o',
              display_name: 'GPT-4o',
              required_product: 'payg',
              required_product_label: 'Pay-as-you-go',
              enabled: true,
              usable: true,
              reasons: [],
              capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
              pinned_by: [{ assistant_id: 'asst-1', version: 3 }],
            },
          ],
        },
      ],
    });
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /scope filters/ }));
    await waitFor(() => expect(hoisted.fetchGroupedModels).toHaveBeenCalled());
    // Restrict: uncheck "All discovered models", then uncheck gpt-4o.
    fireEvent.click(screen.getByRole('checkbox', { name: 'All discovered models' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /gpt-4o/ }));
    await waitFor(() => {
      expect(screen.getByText(/Blast-radius preview/)).toBeTruthy();
      expect(screen.getByText('asst-1@v3')).toBeTruthy();
    });
  });
});
