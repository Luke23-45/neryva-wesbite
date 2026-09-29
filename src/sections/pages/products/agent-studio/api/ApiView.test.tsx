// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { ApiView } from './ApiView';

/**
 * P1-3: the try-it must send the pasted org key the way the engine consumes
 * it — `X-API-Key` against the ENGINE base — and the copyable curl must
 * agree on scheme and target. The runtime (`/runtime`) has no org-key
 * consumer, and `Authorization: Bearer` is not how the engine resolves
 * `nrv_live_` keys (engine/src/common/auth/auth.guard.ts: `x-api-key`).
 */

function shell() {
  return render(
    <ThemeProvider theme={theme}>
      <ApiView />
    </ThemeProvider>,
  );
}

const okResponse = () =>
  Promise.resolve({
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve('{"ok":true}'),
  });

type FetchArgs = [input: string, init?: RequestInit];

const stubFetch = () => {
  const fetchMock = vi.fn((..._args: FetchArgs) => okResponse());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ApiView try-it key flow (P1-3)', () => {
  it('sends the pasted key as X-API-Key to the engine base, never /runtime', async () => {
    const fetchMock = stubFetch();
    shell();

    // Default active endpoint is a GET (get /api/v1/gateway/circuit-breakers).
    fireEvent.change(screen.getByPlaceholderText(/Paste an org API key/), {
      target: { value: 'nrv_live_test-key-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send request/i }));

    await screen.findByText(/HTTP 200 OK/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(init).toBeDefined();
    expect(url.startsWith('/engine')).toBe(true);
    expect(url).not.toContain('/runtime');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('nrv_live_test-key-123');
    expect(headers['authorization'] ?? headers['Authorization']).toBeUndefined();
  });

  it('sends no X-API-Key header when no key was pasted', async () => {
    const fetchMock = stubFetch();
    shell();

    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    await screen.findByText(/HTTP 200 OK/);

    const [, init] = fetchMock.mock.calls[0];
    expect(init).toBeDefined();
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect('X-API-Key' in headers).toBe(false);
  });

  it('curl agrees with try-it: X-API-Key against the engine host, no Bearer scheme', () => {
    shell();
    // Request tab is default; the curl renders one element per line.
    expect(screen.getByText(/engine\.neryva\.com/)).toBeTruthy();
    expect(screen.getByText(/X-API-Key: nrv_live_/)).toBeTruthy();
    expect(document.body.textContent).not.toContain('Authorization: Bearer');
    expect(document.body.textContent).not.toContain('api.neryva.ai');
  });

  it('mutating endpoints disable try-it and point at the curl', () => {
    shell();
    // Select a POST endpoint from the sidebar.
    const postItem = screen.getByRole('button', {
      name: /post\/api\/v1\/gateway\/circuit-breakers\/reset/i,
    });
    fireEvent.click(postItem);

    const sendButton = screen.getByRole('button', { name: /send request/i });
    expect(sendButton).toBeDisabled();
    expect(screen.getByText(/Mutating calls show the exact curl/)).toBeTruthy();

    // The request tab for a POST endpoint shows the -d body form of the curl.
    expect(screen.getByText(/curl -X POST/)).toBeTruthy();
  });
});
