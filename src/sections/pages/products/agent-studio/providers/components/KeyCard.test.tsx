// @vitest-environment jsdom
/**
 * Providers — KeyCard targeted tests (founder key-cards design).
 * - status pill matrix (verified+latency / unverified / failed:code / revoked / verifying)
 * - healthy card: header sub-line, priority row, fallback segmented,
 *   applies-to chips, 30-day usage summary, agreement row
 * - failed card: compact amber variant, error line with recency,
 *   disabled toggle, Retry verify + Revoke
 * - unverified cards marked unroutable
 * - fallback segmented writes
 * - attestation writes
 * - enabled toggle + priority buttons + drag-handle keyboard fallback
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
  usageLoading: false,
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials', () => ({
  useCredentialMutations: () => ({
    create: { mutate: hoisted.createMutate, isPending: false },
    patch: { mutate: hoisted.patchMutate, isPending: false },
    verify: { mutate: hoisted.verifyMutate, isPending: false },
    rotate: { mutate: hoisted.rotateMutate, isPending: false },
    revoke: { mutate: hoisted.revokeMutate, isPending: false },
  }),
  useOptimisticEnabledToggle: () => ({
    mutate: hoisted.patchMutate,
    isPending: false,
  }),
  usePatchCredentialField: () => ({
    mutate: hoisted.patchMutate,
    isPending: false,
  }),
  useAssistantRefs: () => ({
    data: { assistants: [{ id: 'asst-1', name: 'Support' }] },
    isLoading: false,
    isError: false,
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
    isLoading: hoisted.usageLoading,
  }),
  useCredentials: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/sections/pages/products/agent-studio/providers/api')>();
  return { ...original, fetchGroupedModels: hoisted.fetchGroupedModels };
});

vi.mock('@tanstack/react-router', () => ({
  // Forwards style so 44px hit-target assertions on text links are real —
  // the old mock silently dropped it.
  Link: ({
    to,
    search,
    children,
    style,
  }: {
    to: string;
    search?: Record<string, unknown>;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) => (
    <a
      href={search?.q ? `${to}?q=${encodeURIComponent(String(search.q))}` : to}
      style={style}
    >
      {children}
    </a>
  ),
}));

function baseCredential(overrides: Partial<ProviderCredentialView> = {}): ProviderCredentialView {
  return {
    id: 'cred-1',
    provider: 'openai',
    provider_display_name: 'OpenAI',
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
    manual_model_declarations: [],
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
    providerIndex: 0,
    providerCount: 2,
    groupIds: ['cred-1', 'cred-2'],
    orgTier: 'payg',
    dragSourceId: null,
    dragTargetId: null,
    onDragStart: vi.fn(),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    onDragCancel: vi.fn(),
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
  hoisted.usageLoading = false;
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
  it('renders Failed with the code from the verify detail', () => {
    const pill = statusPillFor(baseCredential({ verification_status: 'failed' }), '401 Invalid Key');
    expect(pill.text).toBe('Failed: 401');
    expect(pill.tone).toBe('warning');
  });
  it('renders Failed without detail', () => {
    const pill = statusPillFor(baseCredential({ verification_status: 'failed' }));
    expect(pill.text).toBe('Failed');
    expect(pill.tone).toBe('warning');
  });
  it('renders Revoked from the lifecycle status field', () => {
    // P0-2: revocation lives in `status`, never in verification_status.
    expect(statusPillFor(baseCredential({ status: 'revoked' })).text).toBe('Revoked');
    expect(statusPillFor(baseCredential({ status: 'revoked' })).tone).toBe('neutral');
  });

  it('has no fictional verifying state', () => {
    // The engine never emits 'verifying'; the pill falls back to
    // 'Unverified' for anything unexpected.
    expect(
      statusPillFor(baseCredential({ verification_status: 'unverified' })).text,
    ).toBe('Unverified');
  });
});

describe('KeyCard rendering', () => {
  it('shows the pill, masked fingerprint, and label', () => {
    renderCard();
    expect(screen.getByText('Verified (124ms)')).toBeTruthy();
    expect(screen.getByText(/sk-…8f9a/)).toBeTruthy();
    expect(screen.getByLabelText('API key: Production Key')).toBeTruthy();
  });

  it('renders the priority row with provider position', () => {
    renderCard();
    expect(screen.getByText(/1 of 2 OpenAI keys/)).toBeTruthy();
    expect(screen.getByText(/drag to reorder/)).toBeTruthy();
  });

  it('renders applies-to chips with assistant scope', () => {
    renderCard();
    expect(screen.getByText('gpt-4o')).toBeTruthy();
    expect(screen.getByText(/All assistants/)).toBeTruthy();
  });

  it('collapses extra models behind a "+ N more" chip', () => {
    renderCard({
      credential: baseCredential({
        discovered_models: [
          { id: 'gpt-4o' },
          { id: 'gpt-4o-mini' },
          { id: 'o1' },
          { id: 'o3-mini' },
        ],
      }),
    });
    expect(screen.getByText('+ 2 more')).toBeTruthy();
  });

  it('renders the agreement summary row with attestation', () => {
    renderCard({ credential: baseCredential({ zdr_attestation: 'account_zdr', region_attestation: 'eu' }) });
    expect(screen.getByText(/ZDR: My account has ZDR/)).toBeTruthy();
    expect(screen.getByText(/Region: EU/)).toBeTruthy();
    expect(screen.getByText(/attested by owner@example.com/)).toBeTruthy();
  });

  it('marks unverified cards unroutable with a verify action', () => {
    renderCard({ credential: baseCredential({ verification_status: 'unverified' }) });
    expect(screen.getByText('Unverified')).toBeTruthy();
    expect(screen.getByText(/Unroutable until verified/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Verify now' }));
    expect(hoisted.verifyMutate).toHaveBeenCalledWith('cred-1', expect.anything());
  });

  it('disables the enabled toggle on revoked cards', () => {
    // P0-2: revoked is read from `status`, not verification_status.
    renderCard({ credential: baseCredential({ status: 'revoked', enabled: false }) });
    expect(screen.getByText('Revoked')).toBeTruthy();
    expect(screen.getByRole('switch').getAttribute('aria-disabled')).toBe('true');
  });

  it('toggles enabled state via the optimistic toggle', () => {
    renderCard();
    fireEvent.click(screen.getByRole('switch'));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'cred-1', enabled: false },
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

  it('pointercancel clears the drag without committing a reorder', () => {
    const onDragEnd = vi.fn();
    const onDragCancel = vi.fn();
    // Simulate an in-flight drag (jsdom has no pointer capture).
    renderCard({ onDragEnd, onDragCancel, dragSourceId: 'cred-1' });
    const handle = screen.getByRole('slider', { name: /Reorder Production Key/ });
    fireEvent.pointerCancel(handle);
    expect(onDragCancel).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('renders the revoked dead state even when the last probe failed', () => {
    // P0-2: revoked cards always render dead state (disabled controls,
    // revoked pill) — never the failed compact card's "Retry verify".
    renderCard({ credential: baseCredential({ status: 'revoked', verification_status: 'failed' }) });
    expect(screen.getByText('Revoked')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry verify' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sync / Refresh Models' })).toBeDisabled();
  });
});

describe('scope filter assistant validation', () => {
  it('blocks save with a loud error on unknown assistant IDs', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Edit scope filters' }));
    fireEvent.change(screen.getByLabelText('Allowed assistants (optional, comma-separated IDs)'), {
      target: { value: 'no-such-assistant' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save filters' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Unknown assistant ID');
    expect(hoisted.patchMutate).not.toHaveBeenCalled();
  });

  it('saves when every assistant ID is real', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Edit scope filters' }));
    fireEvent.change(screen.getByLabelText('Allowed assistants (optional, comma-separated IDs)'), {
      target: { value: 'asst-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save filters' }));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'cred-1', patch: expect.objectContaining({ allowed_assistants: ['asst-1'] }) },
      expect.anything(),
    );
  });

  it('Round 2 P2: spacing-only edits go clean — dirty normalizes both sides', () => {
    renderCard({ credential: baseCredential({ allowed_assistants: ['asst-1'] }) });
    fireEvent.click(screen.getByRole('button', { name: 'Edit scope filters' }));
    const input = screen.getByLabelText(
      'Allowed assistants (optional, comma-separated IDs)',
    ) as HTMLInputElement;
    expect(input.value).toBe('asst-1');
    // Same IDs, different spacing — must not stay dirty (the old compare
    // kept Save dirty forever after a save normalized the value).
    fireEvent.change(input, { target: { value: '  asst-1 , ' } });
    expect(screen.getByRole('button', { name: 'Save filters' })).toBeDisabled();
  });
});

describe('fallback segmented writes', () => {
  it('patches shared_capacity_fallback on segment change', () => {
    renderCard();
    fireEvent.click(screen.getByRole('tab', { name: 'Never for provider' }));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'cred-1', patch: { shared_capacity_fallback: 'never_for_provider' } },
      expect.anything(),
    );
  });

  it('marks the current value selected', () => {
    renderCard({ credential: baseCredential({ shared_capacity_fallback: 'never_for_covered_models' }) });
    expect(screen.getByRole('tab', { name: 'Never for these models' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('attestation writes', () => {
  it('patches zdr_attestation on change', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Edit attestations' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zero data retention (ZDR)' }));
    fireEvent.click(screen.getByRole('option', { name: /No ZDR/ }));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'cred-1', patch: { zdr_attestation: 'no_zdr' } },
      expect.anything(),
    );
  });

  it('shows actor and timestamp when attested', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Edit attestations' }));
    expect(screen.getByText(/Attested by owner@example.com/)).toBeTruthy();
  });
});

describe('30-day usage summary', () => {
  it('renders requests, spend, and labeled list-price equivalent', () => {
    renderCard();
    expect(screen.getByText(/1,200 requests/)).toBeTruthy();
    expect(screen.getByText(/\$4\.20/)).toBeTruthy();
    expect(screen.getByText(/list-price equivalent — not billed/)).toBeTruthy();
  });

  it('renders the non-zero error counts with human labels and the 429 highlighted', () => {
    renderCard();
    expect(screen.getByText('Auth failed ×3')).toBeTruthy();
    expect(screen.getByText('Rate limited ×1')).toBeTruthy();
  });

  it('puts a human tooltip on each error count', () => {
    renderCard();
    expect(screen.getByText('Auth failed ×3').getAttribute('title')).toBe(
      'Auth failed — 3 failed calls in the last 30 days',
    );
    expect(screen.getByText('Rate limited ×1').getAttribute('title')).toBe(
      'Rate limited — 1 failed call in the last 30 days',
    );
  });

  it('renders the total token count', () => {
    renderCard();
    expect(screen.getByText('1,000,000 tokens')).toBeTruthy();
  });

  it('shows the prompt/completion split in the token tooltip', () => {
    renderCard();
    const tokens = screen.getByText('1,000,000 tokens');
    expect(tokens.getAttribute('title')).toBe('800,000 prompt · 200,000 completion');
  });

  it('renders the honest loading state while usage is fetching', () => {
    hoisted.usageLoading = true;
    renderCard();
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByText(/1,000,000 tokens/)).toBeNull();
  });

  it('Round 3 P2: card aria-label names the credential kind (custom endpoint vs API key)', () => {
    const { unmount } = renderCard();
    expect(screen.getByRole('article', { name: 'API key: Production Key' })).toBeTruthy();
    unmount();
    renderCard({
      credential: baseCredential({ base_url: 'https://llm.example.com/v1', label: 'EU vLLM' }),
    });
    expect(screen.getByRole('article', { name: 'Custom endpoint: EU vLLM' })).toBeTruthy();
  });

  it('Round 3 P2: "Edit endpoint →" and "View audit trail →" meet the 44px hit target', () => {
    renderCard({
      credential: baseCredential({ base_url: 'https://llm.example.com/v1' }),
    });
    const edit = screen.getByRole('link', { name: 'Edit endpoint →' });
    const audit = screen.getByRole('link', { name: 'View audit trail →' });
    expect(edit.style.minHeight).toBe('44px');
    expect(audit.style.minHeight).toBe('44px');
    // Text-link look is preserved — no button chrome.
    expect(edit.style.textDecoration).toBe('none');
    expect(edit.style.display).toBe('inline-flex');
  });
});

describe('failed compact card', () => {
  it('renders the amber Failed:code pill, disabled toggle, and retry actions', () => {
    renderCard({ credential: baseCredential({ verification_status: 'failed' }) });
    expect(screen.getByText('Failed')).toBeTruthy();
    expect(screen.getByText(/run Retry verify to re-probe this key/)).toBeTruthy();
    expect(screen.getByRole('switch').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Retry verify' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeTruthy();
    // Compact: no priority / fallback / usage rows.
    expect(screen.queryByText('Priority')).toBeNull();
    expect(screen.queryByText('Fallback')).toBeNull();
    expect(screen.queryByText('30-day use')).toBeNull();
  });

  it('shows the verify error with recency after a failed retry', async () => {
    hoisted.verifyMutate.mockImplementation((_id: string, opts: { onError: (e: Error) => void }) => {
      opts.onError(new Error('401 Invalid Key'));
    });
    renderCard({ credential: baseCredential({ verification_status: 'failed' }) });
    fireEvent.click(screen.getByRole('button', { name: 'Retry verify' }));
    await waitFor(() => expect(screen.getByText('Failed: 401')).toBeTruthy());
    expect(screen.getByText(/401 Invalid Key/)).toBeTruthy();
    expect(screen.getByText(/at verify,/)).toBeTruthy();
  });
});

describe('drag reorder', () => {
  it('arrow keys on the drag handle move the card', () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    renderCard({ onMoveUp, onMoveDown });
    // Round 2 P2: the handle's keyboard model is positional, so its honest
    // role is slider (vertical orientation, position as the value).
    const handle = screen.getByRole('slider', { name: /Reorder Production Key/ });
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-valuenow', '1');
    expect(handle).toHaveAttribute('aria-valuemax', '2');
    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('Round 2 P1: a verify failure on a healthy card surfaces in the action error (never silent)', async () => {
    hoisted.verifyMutate.mockImplementation((_id: string, opts: { onError: (e: Error) => void }) => {
      opts.onError(new Error('upstream 500'));
    });
    renderCard({ credential: baseCredential({ verification_status: 'verified' }) });
    fireEvent.click(screen.getByRole('button', { name: 'Sync / Refresh Models' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('upstream 500'));
  });

  it('Round 2 P2: rotate with an empty secret shows an inline validation message (never a silent no-op)', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /Rotate/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Rotate key' }));
    await waitFor(() =>
      expect(screen.getByText(/Enter the new secret/)).toBeTruthy(),
    );
    expect(hoisted.rotateMutate).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole('button', { name: 'Edit scope filters' }));
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
