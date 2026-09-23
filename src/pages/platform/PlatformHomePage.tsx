/**
 * /platform home: the console-home payload — org header summary, seat cards,
 * and one card per registered product with its entitlement state per the
 * access-model (owned → summary; none → brief + trial CTA).
 */
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Rocket } from 'lucide-react';
import { engine } from '@lib/engine/client';
import { useSessionStore } from '@lib/engine/auth';
import { clearInviteBanner, readInviteBanner } from '@lib/engine/invite-stash';
import { useOrg } from '@/Context/OrgContext';
import { useOrgSummary, useEntitlements } from '@hooks/engine/queries';
import { useStartTrial } from '@hooks/engine/mutations';
import { Panel } from '@components/common/ui/Panel/Panel';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { StatusPill } from '@components/common/ui/StatusPill/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { QueryView, ErrorState } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, KpiGrid } from '@components/common/ui/ViewLayout';

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  margin-top: 20px;
`;

const ProductCard = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(255, 255, 255, 0.02);
`;

const CardTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
`;

const CardBrief = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.65;
  line-height: 1.5;
`;

const CardFooter = styled.div`
  margin-top: auto;
  display: flex;
  gap: 8px;
`;

// Invite-join context banner (first-run ledger F2-5): one-shot, written by the
// invite page on redeem success. Shown only while it names the current org;
// explicit dismiss, never auto.
const InviteBanner = styled.div`
  border: 1px solid rgba(5, 227, 164, 0.35);
  background: rgba(5, 227, 164, 0.07);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 13.5px;
  line-height: 1.5;
  margin-bottom: 4px;
`;

const InviteBannerDismiss = styled.button`
  flex-shrink: 0;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: inherit;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
`;

const toneFor = (state: string) =>
  state === 'active' ? 'success' : state === 'trial' ? 'azure' : state === 'past_due' ? 'warning' : state === 'suspended' ? 'error' : state === 'expired' ? 'neutral' : 'neutral';

interface HomeProduct {
  key: string;
  display_name: string;
  brief: string;
  stage: string;
  entitlement_state: string;
  portal_path: string | null;
  /**
   * Engine access-model CTA kind (`resolveCta` in manifest.schema.ts:
   * manage | start_trial | ask_admin | resolve_billing | renew | coming_soon).
   * The footer honors this verbatim — the console never re-derives purchase
   * policy from entitlement_state (D1-04: that divergence offered "Start
   * trial" on pre-GA products the engine marks coming_soon).
   */
  cta: string | null;
}

type ProductCtaKind = 'manage' | 'start_trial' | 'ask_admin' | 'resolve_billing' | 'renew' | 'coming_soon';
const CTA_KINDS: ReadonlySet<string> = new Set([
  'manage',
  'start_trial',
  'ask_admin',
  'resolve_billing',
  'renew',
  'coming_soon',
]);

/**
 * Footer CTA for a product card (D1-04). The engine already folds stage +
 * entitlement state + role into `product.cta`, so the server kind wins.
 * Unrecognized shapes fall back to the legacy entitlement_state policy —
 * never worse than today, never a crash on drift.
 */
function footerCtaKind(product: HomeProduct, role: string | null): ProductCtaKind {
  if (product.cta && CTA_KINDS.has(product.cta)) {
    return product.cta as ProductCtaKind;
  }
  if (product.entitlement_state === 'none' || product.entitlement_state === 'expired') {
    if (role === 'owner' || role === 'billing') {
      return product.entitlement_state === 'expired' ? 'renew' : 'start_trial';
    }
    return 'ask_admin';
  }
  return product.portal_path ? 'manage' : 'coming_soon';
}

export default function PlatformHomePage() {
  const status = useSessionStore((s) => s.status);
  const accountId = useSessionStore((s) => s.account?.id ?? null);
  const { orgId, name, role } = useOrg();
  const summary = useOrgSummary();
  const entitlements = useEntitlements();
  const startTrial = useStartTrial();

  const home = useQuery({
    // D1-05: orgId + accountId in the key — the grid must re-resolve on org
    // switch AND on account switch (the ['org']-prefix invalidation on switch
    // and the ['auth']-prefix invalidation on session death never matched the
    // old bare key, so the previous org's / account's cards lingered ≤5min).
    queryKey: ['engine', 'home', 'products', orgId, accountId],
    queryFn: () => engine<{ products: HomeProduct[] }>('/console/home'),
    enabled: status === 'authenticated' && !!orgId,
  });

  // One-shot join banner from the invite flow (read once per mount; the
  // invite page wrote it alongside the redeem). Shown only for the org it
  // names — switching orgs hides it rather than misattributing it.
  const [inviteBanner, setInviteBanner] = useState(readInviteBanner);
  const showInviteBanner = inviteBanner !== null && inviteBanner.orgId === orgId;
  const dismissInviteBanner = () => {
    clearInviteBanner();
    setInviteBanner(null);
  };

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>{name ? `${name}` : 'Console'}</ViewTitle>
        <ViewSubtitle>Your organizations, products, and usage — one plane.</ViewSubtitle>
      </ViewHeader>

      {showInviteBanner && inviteBanner && (
        <InviteBanner role="status">
          <span>
            {inviteBanner.invitedBy} invited you to <strong>{inviteBanner.orgName}</strong> as{' '}
            {inviteBanner.role}. Meet the workspace — open a{' '}
            <Link to="/agent-studio/chat">shared conversation</Link> or run the team&apos;s assistant,
            not settings you can&apos;t touch.
          </span>
          <InviteBannerDismiss type="button" onClick={dismissInviteBanner}>
            Dismiss
          </InviteBannerDismiss>
        </InviteBanner>
      )}

      {!orgId ? (
        <ErrorState title="No organization yet" message="Your personal organization is created at signup — sign out and back in if this persists." />
      ) : (
        <>
          <KpiGrid>
            <QueryView query={summary} skeleton={<Skeleton $h="88px" $r="12px" />}>
              {(data) => (
                <>
                  <Panel title="Members" subtitle={`${data.members.active} active · ${data.members.suspended} suspended`}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{data.members.total}</div>
                  </Panel>
                  <Panel title="Pending invites" subtitle="Awaiting acceptance">
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{data.pendingInvites}</div>
                  </Panel>
                  <Panel title="Service accounts" subtitle={`${data.serviceAccounts.active} active`}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{data.serviceAccounts.total}</div>
                  </Panel>
                  {data.seats.length > 0 && (
                    <Panel title="Seat utilization" subtitle={data.seats.map((s) => s.product).join(', ')}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {data.seats[0].seats ? `${data.seats[0].activeMembers}/${data.seats[0].seats}` : '—'}
                      </div>
                    </Panel>
                  )}
                </>
              )}
            </QueryView>
          </KpiGrid>

          <QueryView query={home} skeleton={<Skeleton $h="300px" $r="14px" />}>
            {(data) => (
              <CardGrid>
                {data.products.map((product) => {
                  const entitlement = entitlements.data?.entitlements.find((e) => e.product === product.key);
                  const daysLeft = entitlement?.msRemaining ? Math.ceil(entitlement.msRemaining / 86_400_000) : null;
                  return (
                    <ProductCard key={product.key}>
                      <CardTitle>
                        {product.display_name}
                        <StatusPill tone={toneFor(product.entitlement_state)}>{product.entitlement_state.replace('_', ' ')}</StatusPill>
                      </CardTitle>
                      <CardBrief>{daysLeft !== null && product.entitlement_state === 'trial' ? `${daysLeft} day(s) left in trial · ` : ''}{product.brief}</CardBrief>
                      <CardFooter>
                        {(() => {
                          const cta = footerCtaKind(product, role);
                          switch (cta) {
                            case 'coming_soon':
                              return <CardBrief>Coming soon.</CardBrief>;
                            case 'ask_admin':
                              return <CardBrief>Ask your admin to enable {product.display_name}.</CardBrief>;
                            case 'start_trial':
                            case 'renew':
                              return (
                                <ActionButton variant="primary" size="sm" onClick={() => startTrial.mutate({ product: product.key })}>
                                  <Rocket size={13} /> {cta === 'renew' ? 'Renew' : 'Start trial'}
                                </ActionButton>
                              );
                            case 'resolve_billing':
                              return (
                                <Link to="/platform/billing" style={{ fontSize: 13, color: '#8b8ff8', textDecoration: 'none' }}>
                                  Resolve billing →
                                </Link>
                              );
                            case 'manage':
                            default:
                              // D1-06: honor the server-provided portal_path. The
                              // /agent-studio → /agent-studio/dashboard mapping is the
                              // console's studio-home convention (documented, not
                              // silent); every other product uses its manifest path
                              // verbatim instead of collapsing to /platform.
                              return product.portal_path ? (
                                <Link
                                  to={product.portal_path === '/agent-studio' ? '/agent-studio/dashboard' : product.portal_path}
                                  style={{ fontSize: 13, color: '#8b8ff8', textDecoration: 'none' }}
                                >
                                  Open →
                                </Link>
                              ) : (
                                <CardBrief>Coming soon.</CardBrief>
                              );
                          }
                        })()}
                      </CardFooter>
                    </ProductCard>
                  );
                })}
              </CardGrid>
            )}
          </QueryView>
        </>
      )}
    </ViewShell>
  );
}
