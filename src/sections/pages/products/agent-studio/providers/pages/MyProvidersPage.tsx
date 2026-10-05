/**
 * Providers — "My Providers" page (routed; the tab system is retired).
 *
 * Key-card list with "Connect API Key" + "Connect Custom Endpoint
 * (Enterprise)" actions, and an empty state with the same two primary
 * actions. Per-tier surface (doc 19 §2): the Free tier has nothing to
 * manage (platform keys) — the page renders an honest note instead of the
 * management UI.
 */
import { Fragment, useMemo, useState, type CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { useOrg } from '@/Context/OrgContext';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { KeyCard } from '@/sections/pages/products/agent-studio/providers/components/KeyCard';
import { ConnectKeyForm } from '@/sections/pages/products/agent-studio/providers/components/ConnectKeyForm';
import { providerDisplayName } from '@/sections/pages/products/agent-studio/providers/lib/provider-display-names';
import {
  useCredentials,
  useReorderPriorities,
} from '@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials';
import { useOrgTier } from '@/sections/pages/products/agent-studio/providers/hooks/useOrgTier';
import type { ProviderCredentialView } from '@/sections/pages/products/agent-studio/providers/api';
import {
  bodyText,
  card,
  colors,
  errorCallout,
  ghostBtn,
  hintText,
  primaryBtn,
  row,
  secondaryBtn,
} from '@/sections/pages/products/agent-studio/providers/components/styles';

const enterprisePill: CSSProperties = {
  marginLeft: 8,
  fontSize: 11,
  fontWeight: 700,
  // Solid warning on near-black text — ~7:1 contrast (WCAG AA). The old
  // translucent white-on-surface2 treatment fell below AA.
  background: colors.warning,
  color: '#0d1117',
  borderRadius: 999,
  padding: '2px 8px',
};

/**
 * Tier-resolution / list-loading skeleton (P1-4): while `useOrgTier()`
 * reports 'unknown' — or the credential list is still loading — the page
 * renders this instead of the management UI / bare loading text, so a
 * slow entitlement cache can never flash the wrong surface and refetches
 * never cause a layout shift.
 */
function CredentialListSkeleton() {
  // Round 3 P2: role="status" + aria-hidden blocks, mirroring ModelsPage —
  // aria-busy on a role-less div is inert, so the loading state was never
  // announced to assistive tech.
  return (
    <div role="status" aria-label="Loading providers">
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            ...card,
            marginBottom: 16,
            minHeight: 120,
            // Flat color — no gradients on console surfaces (standing rule).
          }}
        />
      ))}
    </div>
  );
}

/**
 * Provider subgroup subheader — full-width label row above each provider's
 * key cards. Mirrors the ModelsPage ProviderSubHeadCell tinted treatment
 * (uppercase 11px faint on a tint surface), adapted from the table cell to
 * the card layout.
 */
const providerSubHeader: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.textFaint,
  background: colors.surface2,
  border: `1px solid ${colors.borderSoft}`,
  borderRadius: 8,
  padding: '8px 12px',
};

/**
 * The two connect actions in one place: "+ Connect a key" (primary, opens
 * the inline key form) and "Connect Custom Endpoint" (secondary, routed —
 * Enterprise). Used identically by the top-right actions and the
 * empty-state card so the labels and emphasis never drift apart.
 */
function ConnectActions({
  showApiKey,
  onConnectKey,
  isEnterprise,
}: {
  showApiKey: boolean;
  onConnectKey: () => void;
  isEnterprise: boolean;
}) {
  return (
    <>
      <Link
        to="/agent-studio/providers/custom/new"
        style={{ ...secondaryBtn, textDecoration: 'none', display: 'inline-block', lineHeight: '26px' }}
      >
        Connect Custom Endpoint
        {!isEnterprise && <span style={enterprisePill}>Enterprise</span>}
      </Link>
      {showApiKey && (
        <button type="button" onClick={onConnectKey} style={primaryBtn}>
          + Connect a key
        </button>
      )}
    </>
  );
}

export function MyProvidersPage() {
  const { orgId } = useOrg();
  const tier = useOrgTier();
  const { data, isLoading, isError, refetch } = useCredentials(orgId);
  const [connectOpen, setConnectOpen] = useState(false);

  const credentials = useMemo(() => {
    const list = data?.credentials ?? [];
    return [...list].sort(
      (a, b) =>
        a.provider.localeCompare(b.provider) ||
        a.priority - b.priority ||
        (a.created_at ?? '').localeCompare(b.created_at ?? ''),
    );
  }, [data]);

  // Provider groups back the "N of M {Provider} keys" label, render the
  // subgroup subheaders, and constrain drag-to-reorder drops to the same
  // provider.
  const groups = useMemo(() => {
    const map = new Map<string, ProviderCredentialView[]>();
    for (const c of credentials) {
      const list = map.get(c.provider) ?? [];
      list.push(c);
      map.set(c.provider, list);
    }
    return map;
  }, [credentials]);

  // Group entries in stable alphabetical order by display name. Within a
  // group the existing provider-then-priority sort is preserved (the groups
  // are built from the already-sorted credentials array).
  const groupEntries = useMemo(() => {
    return [...groups.entries()]
      .map(([provider, list]) => ({
        provider,
        // All cards in a group share one provider; the engine computes the
        // display name canonically, so the first card's is representative.
        // Falls back to the client map on older engines.
        displayName: list[0]?.provider_display_name ?? providerDisplayName(provider),
        list,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [groups]);

  // Pointer-drag state: { sourceId, targetId } while a drag is in flight.
  const [drag, setDrag] = useState<{ sourceId: string; targetId: string | null } | null>(null);
  // Priority-reorder failure (P1-3): the atomic request failed; the hook
  // rolled the optimistic reorder back and the surviving error renders
  // here, never swallowed.
  const [swapError, setSwapError] = useState<string | null>(null);
  const reorder = useReorderPriorities(orgId ?? '');

  if (!orgId) return null;

  // Tier unknown (still resolving) — render the skeleton, never the
  // management UI. Gating only on 'free' flashed the wrong surface while
  // the entitlement cache was loading (P1-4).
  if (tier === 'unknown') {
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>My Providers</ViewTitle>
          <ViewSubtitle>Your connected API keys and custom endpoints.</ViewSubtitle>
        </ViewHeader>
        <CredentialListSkeleton />
      </ViewShell>
    );
  }

  // Free tier: platform keys only, nothing to manage (doc 19 §2).
  if (tier === 'free') {
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>My Providers</ViewTitle>
          <ViewSubtitle>Your connected API keys and custom endpoints.</ViewSubtitle>
        </ViewHeader>
        <div style={card}>
          <p style={{ ...bodyText, margin: 0 }}>
            Your organization runs on Neryva’s Platform Managed keys — there is nothing to connect
            or manage here. Bring your own API keys with a Pay-as-you-go plan, or a custom endpoint
            with Enterprise.
          </p>
        </div>
      </ViewShell>
    );
  }

  /**
   * Priority reorder (P1-3, Round 2 fix): ONE atomic request applies the
   * group's full new order — the engine persists it in a single
   * transaction (all-or-nothing), replacing the old two-PATCH swap that
   * could half-apply.
   *
   * The group list preserves the page's display order (provider, then
   * priority, then created_at) — index into it directly. Re-sorting by a
   * different key here would target a different pair than the one the
   * user sees.
   *
   * Priorities are re-based from the new display order (0..n-1). Every
   * UI-created credential shares the engine default priority 0, so
   * trading the two cards' old values would re-send an identical map —
   * a silent no-op the engine happily 200s. Distinct index-based
   * priorities make the new order actually persist; the engine accepts
   * arbitrary values. The hook applies the order optimistically and
   * rolls back on failure; the error surfaces in the alert below, never
   * swallowed.
   */
  const swapPriorities = (aId: string, bId: string) => {
    const a = credentials.find((c) => c.id === aId);
    const b = credentials.find((c) => c.id === bId);
    if (!a || !b || a.id === b.id || a.provider !== b.provider) return;
    const ordered = [...(groups.get(a.provider) ?? [])];
    const ai = ordered.findIndex((c) => c.id === aId);
    const bi = ordered.findIndex((c) => c.id === bId);
    if (ai === -1 || bi === -1) return;
    [ordered[ai], ordered[bi]] = [ordered[bi], ordered[ai]];
    const items = ordered.map((c, i) => ({ id: c.id, priority: i }));
    setSwapError(null);
    reorder.mutate(items, {
      onError: (err) =>
        setSwapError(
          err instanceof Error && err.message
            ? `Reorder failed and was rolled back: ${err.message}`
            : 'Reorder failed and was rolled back. Reload the page to see the current order.',
        ),
    });
  };

  // Keyboard/arrow-button reorder is group-relative, matching the
  // pointer-drag constraint (drops are limited to the same provider).
  // Priority stays a global engine number; the UI keeps interpreting it
  // per-provider (unchanged semantics).
  const move = (provider: string, index: number, direction: 'up' | 'down') => {
    const group = groups.get(provider) ?? [];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= group.length) return;
    swapPriorities(group[index].id, group[target].id);
  };

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>My Providers</ViewTitle>
        <ViewSubtitle>
          Your organization’s connected keys — verify, order, scope, and rotate them here.
        </ViewSubtitle>
      </ViewHeader>
      <div style={{ ...row, justifyContent: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <ConnectActions
          showApiKey={!connectOpen}
          onConnectKey={() => setConnectOpen(true)}
          isEnterprise={tier === 'enterprise'}
        />
      </div>

      {swapError && (
        <div style={{ ...errorCallout, marginBottom: 16 }} role="alert">
          {swapError}{' '}
          <button
            type="button"
            onClick={() => setSwapError(null)}
            style={{ ...ghostBtn, minHeight: 44, padding: '8px 14px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {connectOpen && (
        <div style={{ marginBottom: 16 }}>
          <ConnectKeyForm
            orgId={orgId}
            onDone={() => setConnectOpen(false)}
            onCancel={() => setConnectOpen(false)}
          />
        </div>
      )}

      {/* Skeleton instead of bare loading text (P2): keeps the list layout
          stable while the query loads or refetches. */}
      {isLoading && <CredentialListSkeleton />}
      {isError && (
        <div style={errorCallout} role="alert">
          Couldn’t load your credentials.{' '}
          <button type="button" onClick={() => refetch()} style={{ ...ghostBtn, minHeight: 44, padding: '8px 14px' }}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && credentials.length === 0 && !connectOpen && (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: colors.text }}>
            No providers connected
          </h3>
          <p style={{ ...bodyText, maxWidth: 480, margin: '0 auto 20px' }}>
            Connect your own provider keys to route traffic through your accounts and agreements,
            or point Neryva at a custom inference endpoint.
          </p>
          <div style={{ ...row, justifyContent: 'center' }}>
            <ConnectActions
              showApiKey
              onConnectKey={() => setConnectOpen(true)}
              isEnterprise={tier === 'enterprise'}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {groupEntries.map((group) => (
          <Fragment key={group.provider}>
            <div style={providerSubHeader} role="heading" aria-level={2}>
              {group.displayName} · {group.list.length} {group.list.length === 1 ? 'key' : 'keys'}
            </div>
            {group.list.map((cred, index) => (
              <KeyCard
                key={cred.id}
                credential={cred}
                orgId={orgId}
                isFirst={index === 0}
                isLast={index === group.list.length - 1}
                onMoveUp={() => move(group.provider, index, 'up')}
                onMoveDown={() => move(group.provider, index, 'down')}
                providerIndex={index}
                providerCount={group.list.length}
                groupIds={group.list.map((c) => c.id)}
                orgTier={tier}
                dragSourceId={drag?.sourceId ?? null}
                dragTargetId={drag?.targetId ?? null}
                onDragStart={(id) => setDrag({ sourceId: id, targetId: null })}
                onDragMove={(id) => setDrag((d) => (d ? { ...d, targetId: id } : d))}
                onDragEnd={(sourceId, targetId) => {
                  setDrag(null);
                  if (targetId && targetId !== sourceId) swapPriorities(sourceId, targetId);
                }}
                // P2: a cancelled pointer gesture must NOT commit a
                // reorder — it only clears the drag state.
                onDragCancel={() => setDrag(null)}
              />
            ))}
          </Fragment>
        ))}
      </div>

      {!isLoading && !isError && credentials.length > 0 && (
        <p style={{ ...hintText, marginTop: 20 }}>
          Keys are org-scoped and sealed · rotation keeps card identity · revocation is instant and
          audited
        </p>
      )}
    </ViewShell>
  );
}
