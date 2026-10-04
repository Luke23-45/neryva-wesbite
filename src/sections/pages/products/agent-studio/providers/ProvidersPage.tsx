import { Suspense, lazy, useState } from 'react';
import styled from 'styled-components';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Segmented } from '@components/common/ui/Segmented';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { useOrgTier, type OrgTier } from './hooks/useOrgTier';

// Tabs lazy-load; Tab D (spend) is now enabled (Phase 7).
const TabCatalog = lazy(() => import('./tabs/TabCatalog'));
const TabMyProviders = lazy(() => import('./tabs/TabMyProviders'));
const TabModels = lazy(() => import('./tabs/TabModels'));
const TabSpend = lazy(() => import('./tabs/TabSpend'));

type TabKey = 'catalog' | 'my-providers' | 'models' | 'spend';

const TAB_META: Array<{ key: TabKey; label: string }> = [
  { key: 'catalog', label: 'Catalog' },
  { key: 'my-providers', label: 'My providers' },
  { key: 'models', label: 'Models' },
  { key: 'spend', label: 'Spend & budgets' },
];

/**
 * Per-tier tab visibility (doc 18 / spec §2):
 * - Free orgs: "My providers" hidden — platform keys, nothing to manage.
 *   "Spend & budgets" stays visible (doc 19 §2: read-only tiny usage).
 * - 'unknown' (still resolving): render the full set and let the server gate
 *   actions, rather than hiding affordances on a guess.
 */
function visibleTabs(tier: OrgTier): TabKey[] {
  const keys: TabKey[] = ['catalog', 'models', 'spend'];
  if (tier !== 'free') keys.splice(1, 0, 'my-providers');
  return keys;
}

const TabArea = styled.div`
  margin-top: 20px;
`;

export function ProvidersPage() {
  const tier = useOrgTier();
  const tabs = visibleTabs(tier);
  const [active, setActive] = useState<TabKey>('catalog');

  // If the active tab disappears under the current tier, fall back to Catalog.
  const current: TabKey = tabs.includes(active) ? active : 'catalog';

  const segmentedOptions = tabs.map((t) => ({
    value: t,
    label: TAB_META.find((m) => m.key === t)?.label ?? t,
  }));

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Providers</ViewTitle>
        <ViewSubtitle>
          Browse the model catalog, connect your own keys, and govern which models
          your agents can use.
        </ViewSubtitle>
      </ViewHeader>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Segmented<TabKey>
          options={segmentedOptions}
          value={current}
          onChange={(v) => setActive(v)}
          size="md"
          ariaLabel="Providers sections"
        />
      </div>

      <TabArea>
        <Suspense fallback={<Skeleton $h="280px" $r="14px" />}>
          {current === 'catalog' && <TabCatalog onConnectKey={() => setActive('my-providers')} />}
          {current === 'my-providers' && <TabMyProviders />}
          {current === 'models' && <TabModels />}
          {current === 'spend' && <TabSpend />}
        </Suspense>
      </TabArea>
    </ViewShell>
  );
}
