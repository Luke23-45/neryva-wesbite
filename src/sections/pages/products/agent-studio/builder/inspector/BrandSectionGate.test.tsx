// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { BrandSection } from './BrandSection';
import { BRAND_LIMIT, countBrandChars, type BrandVoice } from '../lib/brand-model';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: vi.fn(), isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: vi.fn(), isPending: false }),
    useAssistantDefinition: () => ({
      data: {
        definition: { ...defaultConsumer(), brand: undefined },
        versionId: 'v9',
        hash: 'h2',
        status: 'DRAFT',
        isDraft: true,
      },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({ data: [], isPending: false, isError: false }),
}));

vi.mock('@hooks/studio/useSetupTemplates', () => ({
  useAssistantTemplates: () => ({ data: [], isPending: false, isError: false }),
}));

const BASE: AgentDefinition = {
  ...defaultConsumer(),
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
  instructions: '## Role\nConcierge.\n',
  brand: undefined,
};

function shell(brand: BrandVoice | undefined) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BrandSection
          assistantId="agent-main"
          definition={{ ...BASE, brand }}
          versionId="v1"
          versionHash="h1"
          isDraft
          canAuthor
          onDirtyChange={() => undefined}
          saveSignal={0}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('BrandSection save gate (modal: gate measures parsed length)', () => {
  it('countBrandChars counts parsed chars — mode is not content, and raw is not trimmed', () => {
    expect(countBrandChars({ mode: 'raw', content: 'abc   ' })).toBe(6);
    expect(countBrandChars({ mode: 'markdown', content: '**bold**' })).toBe(8);
    // JSON quoting is metadata: the parsed string is what counts.
    expect(countBrandChars({ mode: 'json', content: '"abc"' })).toBe(3);
    expect(countBrandChars({ mode: 'json', content: '["a", "b"]' })).toBe(0);
    expect(countBrandChars(undefined)).toBe(0);
  });

  it('a value within the cap passes the save gate', () => {
    shell({ mode: 'raw', content: 'x'.repeat(BRAND_LIMIT) });

    expect(screen.getByText(`2,000 chars`)).toBeTruthy();
    // The over-cap hold message must NOT render — nothing holds this save.
    expect(screen.queryByText(/over the 2,000 cap — trim to save/)).toBeNull();
  });

  it('a value exceeding the cap fails the save gate', () => {
    shell({ mode: 'raw', content: 'x'.repeat(BRAND_LIMIT + 1) });

    expect(screen.getByText(`2,001 chars`)).toBeTruthy();
    // The over-cap hold message renders → doSave early-returns, autosave held.
    expect(screen.getByText(/1 over the 2,000 cap — trim to save/)).toBeTruthy();
  });

  it('invalid JSON content holds the save with a mode message', () => {
    shell({ mode: 'json', content: 'not json at all' });

    expect(screen.getByText(/not valid in its selected mode/)).toBeTruthy();
  });

  it('a JSON string that parses counts its parsed length', () => {
    shell({ mode: 'json', content: JSON.stringify('x'.repeat(BRAND_LIMIT)) });

    // The card counts parsed chars — JSON quoting is not content.
    expect(screen.getByText(`2,000 chars`)).toBeTruthy();
    expect(screen.queryByText(/over the 2,000 cap — trim to save/)).toBeNull();
  });
});
