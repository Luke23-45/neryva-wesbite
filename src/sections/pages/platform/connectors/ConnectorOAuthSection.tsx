import { useEffect } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { useOrg } from '@/Context/OrgContext';

/**
 * Connector OAuth landing (team_setup_ledger.md F-A8) — the engine's public
 * callback 302s here with an OPAQUE status only
 * (`/platform/org/:orgId/connectors?oauth=connected|failed`,
 * engine connectors.controller.ts:161-176). Error details stay server-side
 * by design — this page never invents a reason, it renders the outcome and
 * the way forward, then hands off to the connectors surface.
 */

const Wrap = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: 64px 24px;
  text-align: center;
`;

const IconRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 650;
`;

const Copy = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  opacity: 0.75;
  line-height: 1.6;
`;

const CtaRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

export function ConnectorOAuthSection({ status }: { status: string | undefined }) {
  const params = useParams({ from: '/platform/org/$orgId/connectors' });
  const navigate = useNavigate();
  const { orgId, orgs, adoptOrg } = useOrg();

  // Adopt the callback's org (deep link may arrive on a different active org).
  useEffect(() => {
    if (params.orgId && orgs.some((o) => o.orgId === params.orgId) && orgId !== params.orgId) {
      adoptOrg(params.orgId);
    }
  }, [params.orgId, orgs, orgId, adoptOrg]);

  const connected = status === 'connected';

  return (
    <Wrap>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <IconRow>{connected ? <CheckCircle2 size={40} strokeWidth={1.5} /> : <XCircle size={40} strokeWidth={1.5} />}</IconRow>
        <Title>{connected ? 'Connector authorized' : 'Authorization did not complete'}</Title>
        <Copy>
          {connected ? (
            <>
              The provider linked successfully. Run a manual sync from the connectors surface — synced content lands in Documents
              with <code>ext-</code> slugs.
            </>
          ) : (
            <>
              The provider did not return an authorization grant. Details stay server-side by design — check the provider&apos;s
              consent screen for a denial, confirm the OAuth app registration, and try the dance again. Nothing was linked or
              changed.
            </>
          )}
        </Copy>
        <CtaRow>
          <ActionButton size="sm" onClick={() => navigate({ to: '/agent-studio/integrations' })}>
            Open connectors
          </ActionButton>
          <Link to="/platform">
            <ActionButton size="sm" variant="secondary">
              Console home
            </ActionButton>
          </Link>
        </CtaRow>
      </motion.div>
    </Wrap>
  );
}
