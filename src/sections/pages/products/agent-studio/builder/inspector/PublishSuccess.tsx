import styled from 'styled-components';
import { Link, useNavigate } from '@tanstack/react-router';
import { Check, Radio } from 'lucide-react';
import { ActionButton } from '@components/common/ui/ActionButton';
import { PUBLISH_COPY, PUBLISH_FIX_ROUTES } from '../lib/publish-model';

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

const Receipt = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  background: ${({ theme }) => theme.app.status.success.bg};
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
`;

const Headline = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.status.success.fg};
`;

const Lines = styled.div`
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Exits = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const Footer = styled.div`
  margin-top: 10px;
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
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
          size="sm"
          title="Connect a platform with this agent preselected, then return here"
          onClick={() => navigate({ to: PUBLISH_FIX_ROUTES.channels, search: { returnTo, assistantId: agentId } })}
        >
          <Radio size={13} strokeWidth={1.8} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 6 }} />
          Connect a channel →
        </ActionButton>
        <ActionButton
          size="sm"
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
        <Link to="/agent-studio/chat" search={{ agent: agentId }}>
          Test the live version →
        </Link>
        {' · '}{PUBLISH_COPY.auditPromise} <Link to={PUBLISH_FIX_ROUTES.audit}>Open Audit →</Link>
      </Footer>
    </Receipt>
  );
}
