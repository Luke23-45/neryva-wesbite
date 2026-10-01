import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import { Check, Radio } from 'lucide-react';
import { ActionButton } from '@components/common/ui/ActionButton';
import { PUBLISH_COPY, PUBLISH_FIX_ROUTES } from '../lib/publish-model';
import { Exits, Footer, FooterLink, Headline, Lines, Mono, Receipt } from './PublishSuccess.styles';

/**
 * Shared publish success receipt (C14 — the ship section and the detail
 * panel render THIS, never two success screens). The POST returns
 * `{ version }` only (`assistants.controller.ts:186`) — badge, decision,
 * and degraded statement are composed from reads the caller already holds.
 */

export interface PublishReceipt {
  versionNumber: number | null;
  hash: string | null;
  templateSlug: string | null;
  templateVersion: string | null;
  decision: string | null;
  decisionFinishedAt: string | null;
  degraded: boolean;
  degradedSlugs: string[];
}

/** DS-22: theme tokens, never arbitrary literals. */
const ConnectIcon = styled.span`
  display: inline-flex;
  vertical-align: -${({ theme }) => theme.spacing.px2};
  margin-right: ${({ theme }) => theme.spacing.px6};
`;

function short(iso: string | null): string {
  if (!iso) return 'unknown time';
  return iso.slice(0, 16).replace('T', ' ');
}

export function PublishSuccess({
  receipt,
  agentId,
  returnTo,
}: {
  receipt: PublishReceipt;
  agentId: string;
  /** Where the channel screen returns after connect (detail URL — never a dead end). */
  returnTo: string;
}) {
  const versionLabel = receipt.versionNumber === null ? 'new version' : `v${receipt.versionNumber}`;
  const navigate = useNavigate();
  return (
    <Receipt role="status" aria-live="polite">
      <Headline>
        <Check size={16} aria-hidden="true" />
        {PUBLISH_COPY.successLive} — {versionLabel}
        {receipt.hash ? (
          <>
            {' '}· <Mono>{receipt.hash.slice(0, 16)}</Mono>
          </>
        ) : null}
      </Headline>
      <Lines>
        {receipt.templateSlug ? (
          <div>
            Template: {receipt.templateSlug} @ {receipt.templateVersion || 'unknown'}
          </div>
        ) : null}
        {receipt.decision ? (
          <div>
            Eval: {receipt.decision} on {receipt.hash ? receipt.hash.slice(0, 8) : 'this content'} · {short(receipt.decisionFinishedAt)}
          </div>
        ) : (
          <div>No template-declared checks — the BLOCK gate still applied.</div>
        )}
        {receipt.degraded ? (
          <div>
            Shipped degraded: {receipt.degradedSlugs.join(', ')} (waiver to +7 days). {PUBLISH_COPY.degradedLifecycle}
          </div>
        ) : null}
        <div>Snapshot + provenance written in-transaction · in-flight runs stayed pinned.</div>
      </Lines>
      <Exits>
        <ActionButton
          size="lg"
          title="Connect a platform with this agent preselected, then return here"
          onClick={() => navigate({ to: PUBLISH_FIX_ROUTES.channels, search: { returnTo, assistantId: agentId } })}
        >
          <ConnectIcon aria-hidden="true">
            <Radio size={13} strokeWidth={1.8} />
          </ConnectIcon>
          Connect a channel →
        </ActionButton>
        <ActionButton
          size="lg"
          variant="secondary"
          onClick={() => navigate({ to: '/agent-studio/agents/$agentId', params: { agentId } })}
        >
          Watch in operate
        </ActionButton>
        <ActionButton size="sm" variant="secondary" onClick={() => navigate({ to: '/agent-studio/agents' })}>
          Back to agents
        </ActionButton>
      </Exits>
      <Footer>
        <FooterLink to="/agent-studio/chat" search={{ agent: agentId }}>
          Test the live version →
        </FooterLink>
        {' · '}{PUBLISH_COPY.auditPromise} <FooterLink to={PUBLISH_FIX_ROUTES.audit}>Open Audit →</FooterLink>
      </Footer>
    </Receipt>
  );
}
