/**
 * Entitlement rendering (frontend-engine-integration-plan A4, access-model
 * "what not bought yet means in the UI"):
 *
 *  - `EntitlementBanner` — the mode strip under the topbar: payment alert,
 *    suspension notice, or the enable/billing CTA. There is no trial — the
 *    banner never offers or counts down one.
 *  - `EntitlementGate` — children render only while reads are alive; the
 *    blocked states render the honest brief + CTA instead.
 *
 * `useEntitlement(product)` (the state + derived flags) lives in
 * ./useEntitlement.ts so this file exports only components.
 *
 * Actions link to the surface that owns them (billing) — no fake buttons.
 */
import { type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { AlertTriangle, ArrowRight, PauseCircle, Sparkles } from 'lucide-react';
import { useOrg } from '@/Context/OrgContext';
import { useEntitlement } from './useEntitlement';

const BannerWrap = styled.div<{ $tone: 'warning' | 'error' | 'neutral' }>`
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
          : 'rgba(255, 255, 255, 0.1)'};
  background:
    ${({ $tone }) =>
      $tone === 'warning'
        ? 'rgba(245, 185, 66, 0.08)'
        : $tone === 'error'
          ? 'rgba(248, 113, 113, 0.08)'
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

/**
 * The product-mode strip for the active organization. Renders nothing on
 * `active` — the absence of a banner is the good state. An engine-reported
 * `trial` state is treated the same: trials are not offered, and a trial
 * state grants full access, so no trial-specific UI is ever shown.
 */
export function EntitlementBanner({ product, displayName }: { product: string; displayName?: string }) {
  const { role } = useOrg();
  const { state } = useEntitlement(product);
  const label = displayName ?? 'This product';

  if (state === 'active' || state === 'trial') {
    return null;
  }

  const canDecide = role === 'owner' || role === 'billing';
  const billingLink = (
    <BannerAction as={Link} to="/platform/billing">
      Open billing <ArrowRight size={12} />
    </BannerAction>
  );

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

  // none | expired — never entitled, or the entitlement lapsed. No trial is
  // offered: enabling a product means paying for it via billing.
  return (
    <BannerWrap $tone="neutral">
      <BannerIcon><Sparkles size={15} /></BannerIcon>
      <BannerText>
        {canDecide
          ? `Enable ${label} for this organization — add billing to get started.`
          : `${label} isn’t enabled for this organization yet. Ask an owner or billing manager to enable it.`}
      </BannerText>
      {canDecide ? billingLink : null}
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
  const { readBlocked } = useEntitlement(product);
  const label = displayName ?? 'This product';
  const canDecide = role === 'owner' || role === 'billing';

  if (!readBlocked) {
    return <>{children}</>;
  }

  return (
    <GateWrap>
      <GateIcon><Sparkles size={18} /></GateIcon>
      <GateTitle>
        {label} isn’t enabled yet
      </GateTitle>
      <GateBody>
        {canDecide
          ? `Enable ${label} for this organization from the console — add billing to get started.`
          : `${label} isn’t enabled for this organization yet. Ask an owner or billing manager to enable it.`}
      </GateBody>
      {canDecide ? (
        <ActionLink as={Link} to="/platform/billing">
          Open billing <ArrowRight size={12} />
        </ActionLink>
      ) : null}
    </GateWrap>
  );
}
