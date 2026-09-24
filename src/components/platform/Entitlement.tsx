/**
 * Entitlement rendering (frontend-engine-integration-plan A4, access-model
 * "what not bought yet means in the UI"):
 *
 *  - `EntitlementBanner` — the mode strip under the topbar: trial countdown,
 *    payment alert, suspension notice, or the start/renew CTA. CTA copy is
 *    role-aware (owner/billing get the action, everyone else gets "ask").
 *  - `EntitlementGate` — children render only while reads are alive; the
 *    blocked states render the honest brief + CTA instead.
 *
 * `useEntitlement(product)` (the state + derived flags) lives in
 * ./useEntitlement.ts so this file exports only components.
 *
 * Actions themselves stay wired in their owning tasks (trial start is B-5);
 * here we link to the surface that owns the action — no fake buttons.
 */
import { type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { AlertTriangle, ArrowRight, PauseCircle, Rocket, Sparkles } from 'lucide-react';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';
import { useEntitlement } from './useEntitlement';

const BannerWrap = styled.div<{ $tone: 'info' | 'warning' | 'error' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin: 20px 32px 0;
  max-width: 1200px;
  border-radius: 10px;
  font-size: 13px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'warning'
        ? 'rgba(245, 185, 66, 0.35)'
        : $tone === 'error'
          ? 'rgba(248, 113, 113, 0.35)'
          : $tone === 'info'
            ? 'rgba(99, 102, 241, 0.3)'
            : 'rgba(255, 255, 255, 0.1)'};
  background:
    ${({ $tone }) =>
      $tone === 'warning'
        ? 'rgba(245, 185, 66, 0.08)'
        : $tone === 'error'
          ? 'rgba(248, 113, 113, 0.08)'
          : $tone === 'info'
            ? 'rgba(99, 102, 241, 0.08)'
            : 'rgba(255, 255, 255, 0.03)'};
`;

const BannerIcon = styled.span`
  display: inline-flex;
  color: inherit;
  opacity: 0.85;
`;

const BannerText = styled.p`
  margin: 0;
  flex: 1;
  line-height: 1.45;
  strong {
    font-weight: 600;
  }
`;

const BannerAction = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: #a5a8f5;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  background: rgba(99, 102, 241, 0.14);
  color: #a5a8f5;
  border: 1px solid rgba(99, 102, 241, 0.35);
  transition: background 150ms ease;

  &:hover {
    background: rgba(99, 102, 241, 0.22);
  }
`;

interface EntitlementRow {
  product: string;
  plan: string;
  status: string;
  msRemaining: number | null;
}

function useEntitlementRows(): EntitlementRow[] | undefined {
  const { orgId } = useOrg();
  // Same key as @hooks/engine/queries useEntitlements — one cache entry.
  const rows = useQuery({
    queryKey: ['engine', 'entitlements', orgId],
    queryFn: () => engine<{ entitlements: EntitlementRow[] }>(`/console/org/${orgId}/entitlements`),
    enabled: !!orgId,
    staleTime: 30_000,
  });
  return rows.data?.entitlements;
}

function daysLeft(row: EntitlementRow | undefined): number | null {
  const ms = row?.msRemaining;
  if (typeof ms !== 'number' || ms <= 0) {
    return null;
  }
  return Math.ceil(ms / 86_400_000);
}

/**
 * The product-mode strip for the active organization. Renders nothing on
 * `active` — the absence of a banner is the good state.
 */
export function EntitlementBanner({ product, displayName }: { product: string; displayName?: string }) {
  const { role } = useOrg();
  const { state } = useEntitlement(product);
  const rows = useEntitlementRows();
  const row = rows?.find((r) => r.product === product);
  const label = displayName ?? 'This product';

  if (state === 'active') {
    return null;
  }

  const canDecide = role === 'owner' || role === 'billing';
  const productsLink = (
    <BannerAction as={Link} to="/platform">
      Review products <ArrowRight size={12} />
    </BannerAction>
  );

  if (state === 'trial') {
    const days = daysLeft(row);
    return (
      <BannerWrap $tone="info">
        <BannerIcon><Rocket size={15} /></BannerIcon>
        <BannerText>
          <strong>{label} trial</strong>
          {days !== null ? ` — ${days} day${days === 1 ? '' : 's'} left. ` : ' — '}
          Everything works; usage counts against the trial limits.
        </BannerText>
        {canDecide ? productsLink : null}
      </BannerWrap>
    );
  }

  if (state === 'past_due') {
    return (
      <BannerWrap $tone="warning">
        <BannerIcon><AlertTriangle size={15} /></BannerIcon>
        <BannerText>
          <strong>Payment needed.</strong> {label} is read-only until billing is settled — nothing is lost.
        </BannerText>
        <BannerAction as={Link} to="/platform/billing">
          Open billing <ArrowRight size={12} />
        </BannerAction>
      </BannerWrap>
    );
  }

  if (state === 'suspended') {
    return (
      <BannerWrap $tone="error">
        <BannerIcon><PauseCircle size={15} /></BannerIcon>
        <BannerText>
          <strong>{label} is suspended.</strong> Reads remain available; writes are paused. Contact billing to restore access.
        </BannerText>
        {canDecide ? (
          <BannerAction as={Link} to="/platform/billing">
            Open billing <ArrowRight size={12} />
          </BannerAction>
        ) : null}
      </BannerWrap>
    );
  }

  // none | expired — never entitled, or the trial lapsed.
  return (
    <BannerWrap $tone="neutral">
      <BannerIcon><Sparkles size={15} /></BannerIcon>
      <BannerText>
        {state === 'expired' ? (
          <>
            <strong>{label} trial ended.</strong>{' '}
          </>
        ) : null}
        {canDecide
          ? `Enable ${label} for this organization from the console — setup takes about a minute.`
          : `${label} isn’t enabled for this organization yet. Ask an owner or billing manager to enable it.`}
      </BannerText>
      {canDecide ? productsLink : null}
    </BannerWrap>
  );
}

const GateWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 24px;
  text-align: center;
`;

const GateIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: #a5a8f5;
`;

const GateTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const GateBody = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
  max-width: 420px;
  line-height: 1.5;
`;

/**
 * Renders `children` only while reads are alive for the product; on
 * none/expired renders the honest brief + CTA instead of the page.
 */
export function EntitlementGate({
  product,
  displayName,
  children,
}: {
  product: string;
  displayName?: string;
  children: ReactNode;
}) {
  const { role } = useOrg();
  const { state, readBlocked } = useEntitlement(product);
  const label = displayName ?? 'This product';
  const canDecide = role === 'owner' || role === 'billing';

  if (!readBlocked) {
    return <>{children}</>;
  }

  return (
    <GateWrap>
      <GateIcon><Sparkles size={18} /></GateIcon>
      <GateTitle>
        {state === 'expired' ? `Your ${label} trial ended` : `${label} isn’t enabled yet`}
      </GateTitle>
      <GateBody>
        {canDecide
          ? `Enable ${label} for this organization from the console — the trial starts immediately and everything in here works from the first minute.`
          : `${label} isn’t enabled for this organization yet. Ask an owner or billing manager to enable it.`}
      </GateBody>
      {canDecide ? (
        <ActionLink as={Link} to="/platform">
          Review products <ArrowRight size={12} />
        </ActionLink>
      ) : null}
    </GateWrap>
  );
}
