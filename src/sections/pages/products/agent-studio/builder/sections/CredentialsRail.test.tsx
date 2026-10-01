import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { CredentialsRail } from './CredentialsRail';

const { mockCredentials, mockEnterprise } = vi.hoisted(() => ({
  mockCredentials: vi.fn(),
  mockEnterprise: vi.fn(),
}));

vi.mock('@hooks/studio/useSetupProviders', () => ({
  useProviderCredentials: (...args: unknown[]) => mockCredentials(...args),
}));
vi.mock('@hooks/engine/billing', () => ({
  useEnterpriseStatus: (...args: unknown[]) => mockEnterprise(...args),
}));

beforeEach(() => {
  mockCredentials.mockReset();
  mockEnterprise.mockReset();
  mockCredentials.mockReturnValue({ data: undefined, isError: false });
  mockEnterprise.mockReturnValue({ data: undefined, isError: false });
});

function state(over: { creds?: unknown; credsError?: boolean; ent?: unknown; entError?: boolean } = {}) {
  mockCredentials.mockReturnValue({
    data: over.creds,
    isError: over.credsError ?? false,
  });
  mockEnterprise.mockReturnValue({
    data: over.ent,
    isError: over.entError ?? false,
  });
}

function renderRail(canRead: boolean) {
  return render(
    <ThemeProvider theme={theme}>
      <CredentialsRail canRead={canRead} />
    </ThemeProvider>
  );
}

describe('CredentialsRail', () => {
  it('shows configured count and Neryva-managed for a non-enterprise org', () => {
    state({ creds: [{ id: 'a' }, { id: 'b' }], ent: false });
    renderRail(true);
    expect(screen.getByText('2 configured')).toBeTruthy();
    expect(screen.getByText('Neryva-managed')).toBeTruthy();
  });

  it('reads "0 configured" for an empty list — an honest zero, never "none"', () => {
    state({ creds: [], ent: false });
    renderRail(true);
    expect(screen.getByText('0 configured')).toBeTruthy();
    expect(screen.queryByText('none')).toBeNull();
  });

  it('reads "unavailable" on query error — never a fake empty', () => {
    state({ credsError: true, entError: true });
    renderRail(true);
    expect(screen.getAllByText('unavailable')).toHaveLength(2);
  });

  it('reads "Enterprise BYOK" when the org is enterprise', () => {
    state({ creds: [], ent: true });
    renderRail(true);
    expect(screen.getByText('Enterprise BYOK')).toBeTruthy();
  });

  it('hides values behind a dash when the role cannot read', () => {
    renderRail(false);
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(mockCredentials).toHaveBeenCalledWith({ enabled: false });
  });
});
