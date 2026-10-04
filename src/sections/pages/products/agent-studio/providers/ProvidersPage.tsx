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
  { key: 'my-providers', label: 'My Providers' },
  { key: 'models', label: 'Models' },
  { key: 'spend', label: 'Spend & Budgets' },
];

/**
 * Per-tier tab visibility (doc 18 / spec §2):
 * - Free orgs: "My Providers" hidden — platform keys, nothing to manage.
 *   "Spend & Budgets" stays visible (doc 19 §2: read-only tiny usage).
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

/**
 * Layout-mirroring loading skeleton for the providers surface: a search-bar
 * rectangle, a chip-row of pill rectangles, and card rectangles — the tab
 * chunk is loading, so we mirror the catalog layout the tab opens on.
 */
function ProvidersLoadingFallback() {
  return (
    <div aria-label="Loading providers">
      <Skeleton $h="40px" $r="10px" />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Skeleton $w="96px" $h="32px" $r="999px" />
        <Skeleton $w="96px" $h="32px" $r="999px" />
        <Skeleton $w="128px" $h="32px" $r="999px" />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        <Skeleton $h="150px" $r="14px" />
        <Skeleton $h="150px" $r="14px" />
        <Skeleton $h="150px" $r="14px" />
      </div>
    </div>
  );
}

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
        <Suspense fallback={<ProvidersLoadingFallback />}>
          {current === 'catalog' && <TabCatalog onConnectKey={() => setActive('my-providers')} />}
          {current === 'my-providers' && <TabMyProviders />}
          {current === 'models' && <TabModels />}
          {current === 'spend' && <TabSpend />}
        </Suspense>
      </TabArea>
    </ViewShell>
  );
}
