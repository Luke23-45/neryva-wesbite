/**
 * Providers — "My Providers" page (routed; the tab system is retired).
 *
 * Key-card list with "Connect API Key" + "Connect Custom Endpoint
 * (Enterprise)" actions, and an empty state with the same two primary
 * actions. Per-tier surface (doc 19 §2): the Free tier has nothing to
 * manage (platform keys) — the page renders an honest note instead of the
 * management UI.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { useOrg } from '@/Context/OrgContext';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { KeyCard } from '@/sections/pages/products/agent-studio/providers/components/KeyCard';
import { ConnectKeyForm } from '@/sections/pages/products/agent-studio/providers/components/ConnectKeyForm';
import {
  useCredentialMutations,
  useCredentials,
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
  background: 'rgba(255,255,255,0.2)',
  borderRadius: 999,
  padding: '2px 8px',
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
  const mutations = useCredentialMutations(orgId ?? '');
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

  // Provider groups back the "N of M {Provider} keys" label and constrain
  // drag-to-reorder drops to the same provider.
  const groups = useMemo(() => {
    const map = new Map<string, ProviderCredentialView[]>();
    for (const c of credentials) {
      const list = map.get(c.provider) ?? [];
      list.push(c);
      map.set(c.provider, list);
    }
    return map;
  }, [credentials]);

  // Pointer-drag state: { sourceId, targetId } while a drag is in flight.
  const [drag, setDrag] = useState<{ sourceId: string; targetId: string | null } | null>(null);

  if (!orgId) return null;

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

  const swapPriorities = (aId: string, bId: string) => {
    const a = credentials.find((c) => c.id === aId);
    const b = credentials.find((c) => c.id === bId);
    if (!a || !b || a.id === b.id) return;
    // Swap priorities so ordering stays a strict sequence.
    mutations.patch.mutate(
      { id: a.id, patch: { priority: b.priority } },
      {
        onSuccess: () =>
          mutations.patch.mutate({ id: b.id, patch: { priority: a.priority } }),
      },
    );
  };

  const move = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= credentials.length) return;
    swapPriorities(credentials[index].id, credentials[target].id);
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

      {connectOpen && (
        <div style={{ marginBottom: 16 }}>
          <ConnectKeyForm
            orgId={orgId}
            onDone={() => setConnectOpen(false)}
            onCancel={() => setConnectOpen(false)}
          />
        </div>
      )}

      {isLoading && <p style={hintText}>Loading credentials…</p>}
      {isError && (
        <div style={errorCallout} role="alert">
          Couldn’t load your credentials.{' '}
          <button type="button" onClick={() => refetch()} style={{ ...ghostBtn, minHeight: 32, padding: '4px 10px' }}>
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
        {credentials.map((cred, index) => {
          const group = groups.get(cred.provider) ?? [];
          return (
            <KeyCard
              key={cred.id}
              credential={cred}
              orgId={orgId}
              isFirst={index === 0}
              isLast={index === credentials.length - 1}
              onMoveUp={() => move(index, 'up')}
              onMoveDown={() => move(index, 'down')}
              providerIndex={group.findIndex((c) => c.id === cred.id)}
              providerCount={group.length}
              groupIds={group.map((c) => c.id)}
              orgTier={tier}
              dragSourceId={drag?.sourceId ?? null}
              dragTargetId={drag?.targetId ?? null}
              onDragStart={(id) => setDrag({ sourceId: id, targetId: null })}
              onDragMove={(id) => setDrag((d) => (d ? { ...d, targetId: id } : d))}
              onDragEnd={(sourceId, targetId) => {
                setDrag(null);
                if (targetId && targetId !== sourceId) swapPriorities(sourceId, targetId);
              }}
            />
          );
        })}
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
