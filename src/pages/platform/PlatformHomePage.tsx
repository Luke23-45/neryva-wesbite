/**
 * /platform home: the console-home payload — org header summary, seat cards,
 * and one card per registered product with its entitlement state per the
 * access-model (owned → summary; none → brief + trial CTA).
 */
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Rocket } from 'lucide-react';
import { engine } from '@lib/engine/client';
import { useSessionStore } from '@lib/engine/auth';
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

const toneFor = (state: string) =>
  state === 'active' ? 'success' : state === 'trial' ? 'azure' : state === 'past_due' ? 'warning' : state === 'suspended' ? 'error' : state === 'expired' ? 'neutral' : 'neutral';

interface HomeProduct {
  key: string;
  display_name: string;
  brief: string;
  stage: string;
  entitlement_state: string;
  portal_path: string | null;
  cta: { label?: string; route?: string } | null;
}

export default function PlatformHomePage() {
  const status = useSessionStore((s) => s.status);
  const { orgId, name, role } = useOrg();
  const summary = useOrgSummary();
  const entitlements = useEntitlements();
  const startTrial = useStartTrial();

  const home = useQuery({
    queryKey: ['engine', 'home', 'products'],
    queryFn: () => engine<{ products: HomeProduct[] }>('/console/home'),
    enabled: status === 'authenticated',
  });

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>{name ? `${name}` : 'Console'}</ViewTitle>
        <ViewSubtitle>Your organizations, products, and usage — one plane.</ViewSubtitle>
      </ViewHeader>

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
                        {product.entitlement_state === 'none' || product.entitlement_state === 'expired' ? (
                          role === 'owner' || role === 'billing' ? (
                            <ActionButton variant="primary" size="sm" onClick={() => startTrial.mutate({ product: product.key })}>
                              <Rocket size={13} /> {product.entitlement_state === 'expired' ? 'Renew' : 'Start trial'}
                            </ActionButton>
                          ) : (
                            <CardBrief>Ask your admin to enable {product.display_name}.</CardBrief>
                          )
                        ) : product.portal_path ? (
                          <Link
                            to={product.portal_path.startsWith('/agent-studio') ? '/agent-studio/dashboard' : product.portal_path.startsWith('/deployment') ? '/deployment/dashboard' : '/platform'}
                            style={{ fontSize: 13, color: '#8b8ff8', textDecoration: 'none' }}
                          >
                            Open →
                          </Link>
                        ) : (
                          <CardBrief>Coming soon.</CardBrief>
                        )}
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
