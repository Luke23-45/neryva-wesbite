import { useEffect } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { useOrg } from '@/Context/OrgContext';
import { engine } from '@lib/engine/client';
import { parseConnectors } from '@hooks/studio/useSetupConnectors';
import { findVerifiedOAuthAccount } from './oauthLinkProof';

/**
 * Connector OAuth landing (team_setup_ledger.md F-A8) — the engine's public
 * callback 302s here with an OPAQUE status plus the bound account id
 * (`/platform/org/:orgId/connectors?oauth=connected|failed&account=<id>`,
 * engine knowledge/connectors.controller.ts oauthCallback). Error details stay
 * server-side by design — this page never invents a reason, it renders the
 * outcome and the way forward, then hands off to the connectors surface.
 *
 * The `?oauth=` value is client-assertable (hand-typable), so a "connected"
 * claim is never taken at face value: the page verifies the CALLBACK-NAMED
 * account against the connector list (`GET /console/org/:orgId/connectors`)
 * before asserting success. A completed dance always leaves server-side proof
 * — the callback persists the sealed token bundle and flips the account
 * `active` (`connectors.service.ts handleOAuthCallback`, verified by
 * `isOAuthLinked` in `./oauthLinkProof`) — so verification is
 * `account.id === <named>` + `state === 'active'` + `hasCredentials`, via
 * `findVerifiedOAuthAccount`. Verification failure is fail-closed: the page
 * shows "not confirmed", never the success copy. A hand-typed account id can
 * only surface true statements (the page asserts "this account is linked"
 * against live server state), never a forged "the dance just ran".
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

export function ConnectorOAuthSection({ status, accountId }: { status: string | undefined; accountId: string | undefined }) {
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

  // Verify a "connected" claim against server state before asserting it.
  // The callback org is gated on membership (same check as the adoption
  // below) — a foreign org id never reaches the query.
  const callbackOrgId = params.orgId && orgs.some((o) => o.orgId === params.orgId) ? params.orgId : null;
  const verification = useQuery({
    queryKey: ['platform', 'connectors', callbackOrgId, 'oauth-verify'],
    queryFn: () => engine<unknown>(`/console/org/${callbackOrgId}/connectors`),
    enabled: connected && callbackOrgId !== null,
    staleTime: 0, // verification read — always fresh, never a cached verdict
    retry: 1,
    select: parseConnectors,
  });
  const verifying =
    connected && callbackOrgId !== null && (verification.isPending || verification.isFetching);
  // Fail closed: success is asserted only on server-side proof for the
  // callback-named account. A fetch error, a foreign org id, a missing or
  // unknown account id, or an account that is not linked resolves to
  // "not confirmed", never success.
  const verifiedAccount =
    connected && verification.isSuccess ? findVerifiedOAuthAccount(verification.data, accountId) : undefined;
  const verified = verifiedAccount !== undefined;

  const tone: 'checking' | 'success' | 'failure' = !connected ? 'failure' : verifying ? 'checking' : verified ? 'success' : 'failure';

  return (
    <Wrap>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <IconRow>
          {tone === 'success' ? (
            <CheckCircle2 size={40} strokeWidth={1.5} />
          ) : tone === 'checking' ? (
            <CheckCircle2 size={40} strokeWidth={1.5} opacity={0.35} />
          ) : (
            <XCircle size={40} strokeWidth={1.5} />
          )}
        </IconRow>
        <Title>
          {tone === 'success' ? 'Connector authorized' : tone === 'checking' ? 'Confirming authorization…' : 'Authorization did not complete'}
        </Title>
        <Copy>
          {tone === 'success' ? (
            <>
              The provider linked successfully. Run a manual sync from the connectors surface — synced content lands in Documents
              with <code>ext-</code> slugs.
            </>
          ) : tone === 'checking' ? (
            <>Checking the connector state with the server — this takes a moment.</>
          ) : (
            <>
              {connected
                ? 'We could not confirm the authorization completed — the provider does not show as linked on the server. '
                : 'The provider did not return an authorization grant. '}
              Details stay server-side by design — check the provider&apos;s consent screen for a denial, confirm the OAuth app
              registration, and try the dance again. Nothing was linked or changed.
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
