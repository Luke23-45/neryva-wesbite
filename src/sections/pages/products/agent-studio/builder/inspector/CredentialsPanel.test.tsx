// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import toast from 'react-hot-toast';
import { CredentialsPanel } from './CredentialsPanel';

const createMutate = vi.fn();
const rotateMutate = vi.fn();
const revokeMutate = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

// BYOK is enterprise-only: the enterprise query is hoisted-mutable so the
// pending / error / proven-denial states are testable.
const enterpriseMockState = vi.hoisted(() => ({
  data: true as boolean | undefined,
  isPending: false,
  isError: false,
}));
const enterpriseRefetch = vi.fn();

vi.mock('@hooks/engine/billing', () => ({
  useEnterpriseStatus: () => ({
    data: enterpriseMockState.data,
    isPending: enterpriseMockState.isPending,
    isError: enterpriseMockState.isError,
    refetch: enterpriseRefetch,
  }),
}));

// D6: the credential list is hoisted-mutable so the empty state is testable.
const credentialMockState = vi.hoisted(() => ({
  list: [
    { id: 'k1', provider: 'anthropic', label: 'prod', externalRef: null, source: 'byok', status: 'active', secretFingerprint: '****9f2c', revocationReason: null, compromised: false, createdAt: '2026-08-01T00:00:00Z', rotatedAt: '2026-09-05T00:00:00Z', revokedAt: null },
    { id: 'k2', provider: 'deepseek', label: 'backup', externalRef: null, source: 'byok', status: 'revoked', secretFingerprint: '****41ab', revocationReason: 'leaked in logs', compromised: true, createdAt: '2026-07-01T00:00:00Z', rotatedAt: null, revokedAt: '2026-09-14T00:00:00Z' },
  ] as Array<Record<string, unknown>>,
}));
const seedCredentials = () => credentialMockState.list;

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    useProviderCredentials: () => ({
      data: credentialMockState.list,
      isPending: false,
      isError: false,
    }),
    useCreateProviderCredential: () => ({ mutate: createMutate, isPending: false }),
    useRotateProviderCredential: () => ({ mutate: rotateMutate, isPending: false }),
    useRevokeProviderCredential: () => ({ mutate: revokeMutate, isPending: false }),
  };
});

function shell(props?: Partial<React.ComponentProps<typeof CredentialsPanel>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <CredentialsPanel
          pinnedProviders={['anthropic']}
          canGovern
          canRead
          revokeOpenId={null}
          connectOpen={false}
          onConnectOpenChange={() => undefined}
          onRevokeOpenChange={() => undefined}
          {...props}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

/** Stateful harness: the panel's open-states are controlled upstream by design. */
function interactiveShell(extra?: Partial<React.ComponentProps<typeof CredentialsPanel>>) {
  function Harness() {
    const [connectOpen, setConnectOpen] = useState(false);
    const [revokeOpenId, setRevokeOpenId] = useState<string | null>(null);
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <CredentialsPanel
            pinnedProviders={['anthropic']}
            canGovern
            canRead
            revokeOpenId={revokeOpenId}
            connectOpen={connectOpen}
            onConnectOpenChange={setConnectOpen}
            onRevokeOpenChange={setRevokeOpenId}
            {...extra}
          />
        </QueryClientProvider>
      </ThemeProvider>
    );
  }
  return render(<Harness />);
}

describe('CredentialsPanel provider plane', () => {
  it('lists fingerprints with pinned badges and struck revoked history + reasons', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/prod/)).toBeTruthy();
    expect(screen.getByText(/\*\*\*\*9f2c/)).toBeTruthy();
    expect(screen.getByText('pinned')).toBeTruthy();
    expect(screen.getByText('compromised')).toBeTruthy();
    expect(screen.getByText(/leaked in logs/)).toBeTruthy();
    expect(screen.queryByText('Sealed material')).toBeNull();
  });

  it('validates secrets before step-up (8–4096, never silent)', async () => {
    await act(async () => {
      interactiveShell();
    });
    fireEvent.click(screen.getByText('Connect provider'));
    fireEvent.change(screen.getByPlaceholderText('prod key'), { target: { value: 'my key' } });
    fireEvent.change(screen.getByPlaceholderText(/never displayed again/), { target: { value: 'short' } });
    expect(screen.getByText('Connect with step-up').closest('button')?.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(/never displayed again/), { target: { value: 'long-enough-secret-value' } });
    fireEvent.click(screen.getByText('Connect with step-up'));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'openai', label: 'my key' }),
      expect.anything(),
    );
  });

  it('revokes with reason + compromised flag and pages owners', async () => {
    revokeMutate.mockImplementationOnce((_input: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    await act(async () => {
      interactiveShell();
    });
    const revokeButtons = screen.getAllByText('Revoke');
    fireEvent.click(revokeButtons[0]);
    fireEvent.change(screen.getByPlaceholderText(/Why is this key going away/), { target: { value: 'leaked in CI logs' } });
    fireEvent.click(screen.getByText(/Mark compromised/));
    fireEvent.click(screen.getByText('Revoke now'));
    expect(revokeMutate).toHaveBeenCalledWith(
      { credentialId: 'k1', reason: 'leaked in CI logs', compromised: true },
      expect.anything(),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/owners paged/));
  });

  it('rotates with the replacement secret only', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('Rotate'));
    fireEvent.change(screen.getByPlaceholderText(/replacement secret/), { target: { value: 'brand-new-secret-value' } });
    fireEvent.click(screen.getByText('Rotate with step-up'));
    expect(rotateMutate).toHaveBeenCalledWith(
      { credentialId: 'k1', secret: 'brand-new-secret-value' },
      expect.anything(),
    );
  });

  it('gates mutates behind govern, reads behind the list roles', async () => {
    await act(async () => {
      shell({ canGovern: false });
    });
    expect(screen.queryByText('Connect provider')).toBeNull();
    expect(screen.queryByText('Rotate')).toBeNull();
    expect(screen.getByText(/owner or admin/)).toBeTruthy();
    expect(screen.getByText(/prod/)).toBeTruthy();
  });

  it('denies the list itself without list roles (never a silent empty)', async () => {
    await act(async () => {
      shell({ canRead: false });
    });
    expect(screen.getByText(/visible to owners, admins, and developers/)).toBeTruthy();
    expect(screen.queryByText(/prod/)).toBeNull();
  });
});

describe('CredentialsPanel enterprise gate honesty', () => {
  beforeEach(() => {
    enterpriseMockState.data = true;
    enterpriseMockState.isPending = false;
    enterpriseMockState.isError = false;
    enterpriseRefetch.mockClear();
  });

  it('shows a skeleton — not the denied copy — while enterprise status loads', async () => {
    enterpriseMockState.data = undefined;
    enterpriseMockState.isPending = true;
    await act(async () => {
      shell();
    });
    expect(screen.queryByText(/Bring Your Own API Key is an Enterprise feature/)).toBeNull();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy();
    expect(screen.queryByText('Connect provider')).toBeNull();
  });

  it('shows an honest error with retry — not the denied copy — on failure', async () => {
    enterpriseMockState.data = undefined;
    enterpriseMockState.isError = true;
    await act(async () => {
      shell();
    });
    expect(screen.queryByText(/Bring Your Own API Key is an Enterprise feature/)).toBeNull();
    expect(screen.getByText(/Enterprise status couldn’t be checked/)).toBeTruthy();
    fireEvent.click(screen.getByText('Try again'));
    expect(enterpriseRefetch).toHaveBeenCalledTimes(1);
  });

  it('shows the denied copy only after a proven non-enterprise load', async () => {
    enterpriseMockState.data = false;
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/Bring Your Own API Key is an Enterprise feature/)).toBeTruthy();
    expect(screen.queryByText('Connect provider')).toBeNull();
  });
});

describe('CredentialsPanel enterprise-notice single home', () => {
  beforeEach(() => {
    enterpriseMockState.data = true;
    enterpriseMockState.isPending = false;
    enterpriseMockState.isError = false;
    enterpriseRefetch.mockClear();
  });

  it('suppresses the BYOK notice for embedded mounts — the vault list still renders', async () => {
    enterpriseMockState.data = false;
    await act(async () => {
      shell({ suppressEnterpriseNotice: true });
    });
    expect(screen.queryByText(/Bring Your Own API Key is an Enterprise feature/)).toBeNull();
    // The credential rows are untouched by the suppression.
    expect(screen.getByText(/prod/)).toBeTruthy();
  });

  it('leaves the enterprise connect flow intact when suppression is on', async () => {
    enterpriseMockState.data = true;
    await act(async () => {
      shell({ suppressEnterpriseNotice: true });
    });
    expect(screen.getByText('Connect provider')).toBeTruthy();
    expect(screen.queryByText(/Bring Your Own API Key is an Enterprise feature/)).toBeNull();
  });
});

describe('CredentialsPanel empty state (D6)', () => {
  it('states the Neryva-managed path first — connect is the optional BYOK route', async () => {
    const previous = seedCredentials();
    credentialMockState.list = [];
    try {
      await act(async () => {
        shell();
      });
      expect(screen.getByText(/Neryva-managed platform credentials are available/)).toBeTruthy();
      expect(screen.getByText(/Connect a key only when you want to bring your own/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Connect provider' })).toBeTruthy();
    } finally {
      credentialMockState.list = previous;
    }
  });
});

describe('CredentialsPanel D-BUG2 action hit boxes', () => {
  // The connect/rotate buttons are SUPPOSED to look small (sm/text treatment).
  // The requirement is a 44px *invisible hit area* with visuals unchanged,
  // delivered via ::after expansion. These tests assert the hit-box contract,
  // never the visible size.
  function injectedCss(): string {
    return Array.from(document.head.querySelectorAll('style'))
      .map((tag) => tag.textContent ?? '')
      .join('\n');
  }

  function afterRuleFor(button: HTMLElement): string | null {
    const css = injectedCss().replace(/\s+/g, '');
    const classTokens = (button.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((t) => t && !t.startsWith('sc-'));
    expect(classTokens.length).toBeGreaterThan(0);
    return (
      classTokens
        .map((token) => {
          const idx = css.indexOf(`.${token}::after{`);
          return idx === -1 ? null : css.slice(idx, css.indexOf('}', idx) + 1);
        })
        .find((rule) => rule !== null) ?? null
    );
  }

  it('Connect provider (SmButton) has a 44px hit box via ::after', async () => {
    await act(async () => {
      shell();
    });
    const button = screen.getByRole('button', { name: 'Connect provider' });
    // SmButton renders 24px tall (12px caption at line-height 1 + 6px padding
    // each side); inset -10px top/bottom -> 24 + 20 = 44px hit box.
    expect(getComputedStyle(button).position).toBe('relative');
    const rule = afterRuleFor(button);
    expect(rule).toBeTruthy();
    expect(rule).toMatch(/content:(""|'')/);
    expect(rule).toContain('position:absolute');
    expect(rule).toContain('inset:-10px0');
  });

  it('Rotate / Revoke (TextButton family) have a 44px hit box via ::after', async () => {
    await act(async () => {
      shell();
    });
    // TextButton renders ~33px tall (13px body at 1.6 line-height + 6px padding
    // each side); inset -6px top/bottom -> ~45px hit box. DangerButton
    // (Revoke) extends TextButton and inherits the expansion.
    for (const name of ['Rotate', 'Revoke']) {
      const button = screen.getByRole('button', { name });
      expect(getComputedStyle(button).position).toBe('relative');
      const rule = afterRuleFor(button);
      expect(rule).toBeTruthy();
      expect(rule).toMatch(/content:(""|'')/);
      expect(rule).toContain('position:absolute');
      expect(rule).toContain('inset:-6px-4px');
    }
  });
});
