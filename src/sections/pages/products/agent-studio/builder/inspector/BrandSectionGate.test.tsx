// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { BrandSection } from './BrandSection';
import { BRAND_LIMIT, countBrandChars } from '../lib/brand-model';
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
        definition: { ...defaultConsumer(), brand: '' },
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
  brand: '',
};

function shell(brand: string) {
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

describe('BrandSection save gate (19-81: gate measures trimmed length)', () => {
  it('trims: countBrandChars ignores leading/trailing whitespace', () => {
    expect(countBrandChars('abc   ')).toBe(3);
    expect(countBrandChars('  abc  ')).toBe(3);
    expect(countBrandChars('abc')).toBe(3);
  });

  it('a value whose trimmed length is within the cap passes the save gate', () => {
    // 2000 visible chars + trailing whitespace the wire/caps never store.
    const brand = 'x'.repeat(BRAND_LIMIT) + '\n   ';
    shell(brand);

    expect(screen.getByText(`2,000 / ${BRAND_LIMIT.toLocaleString()} chars`)).toBeTruthy();
    // The over-cap hold message must NOT render — nothing holds this save.
    expect(screen.queryByText(/over the 2,000 cap — trim to save/)).toBeNull();
  });

  it('a value whose trimmed length exceeds the cap fails the save gate', () => {
    const brand = 'x'.repeat(BRAND_LIMIT + 1) + '   ';
    shell(brand);

    expect(screen.getByText(`2,001 / ${BRAND_LIMIT.toLocaleString()} chars`)).toBeTruthy();
    // The over-cap hold message renders → doSave early-returns, autosave held.
    expect(screen.getByText(/1 over the 2,000 cap — trim to save/)).toBeTruthy();
  });
});
