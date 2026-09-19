// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
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

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    useProviderCredentials: () => ({
      data: [
        { id: 'k1', provider: 'anthropic', label: 'prod', externalRef: null, source: 'byok', status: 'active', secretFingerprint: '****9f2c', revocationReason: null, compromised: false, createdAt: '2026-08-01T00:00:00Z', rotatedAt: '2026-09-05T00:00:00Z', revokedAt: null },
        { id: 'k2', provider: 'deepseek', label: 'backup', externalRef: null, source: 'byok', status: 'revoked', secretFingerprint: '****41ab', revocationReason: 'leaked in logs', compromised: true, createdAt: '2026-07-01T00:00:00Z', rotatedAt: null, revokedAt: '2026-09-14T00:00:00Z' },
      ],
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
