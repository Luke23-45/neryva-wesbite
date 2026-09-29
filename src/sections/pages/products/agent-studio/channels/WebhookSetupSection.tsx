import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { Webhook } from 'lucide-react';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { CopyButton } from '@components/common/ui/CopyButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import {
  useChannel,
  useWebhookSetup,
  widgetSnippet,
  widgetSnippetOrigin,
  type ChannelAccount,
  type WebhookSetupResult,
} from '@hooks/studio/useSetupChannels';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { SectionBackRow } from './SectionBackRow';
import { PlatformIcon } from './platformIcons';

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const TokenBox = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 12px;
  font-size: 13px;
`;

const RevealNotice = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

const LocalhostWarning = styled.p`
  font-size: 12px;
  color: #b45309;
  margin: 6px 0 0;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const revealedKey = (accountId: string) => `channels:webhook-setup:revealed:${accountId}`;

/**
 * Webhook setup — dedicated section replacing the webhook-result modal (C-3).
 * The verify token is shown ONCE: it lives in memory only, the reveal marker
 * is written to sessionStorage the moment the token renders, and a refresh
 * after reveal shows an explicit "already revealed" state with a re-run
 * action — never a silent loss like a dismissed modal, and never a
 * second rendering of the same secret. Re-running setup generates a fresh
 * token; the old one stops working.
 */
export function WebhookSetupSection() {
  const params = useParams({ from: '/agent-studio/channels/$accountId/webhook-setup' });
  const navigate = useNavigate();
  const { role } = useOrg();
  const canGovern = canSetup(role, 'setup:govern');
  const channel = useChannel(params.accountId);

  // C14: search is validated on the parent layout route and inherited here.
  const search = useSearch({ from: '/agent-studio/channels/$accountId/webhook-setup' });
  const returnTo = typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/') ? search.returnTo : null;

  // Non-govern users bounce to the list (server gates setup too) — the
  // account display name and setup surface never render before the gate.
  useEffect(() => {
    if (!canGovern) {
      navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } });
    }
  }, [canGovern, navigate]);

  useEffect(() => {
    if (!channel.isPending && !channel.isError && !channel.data) {
      navigate({ to: '/agent-studio/channels', search: { returnTo: undefined, assistantId: undefined } });
    }
  }, [channel.isPending, channel.isError, channel.data, navigate]);

  if (!canGovern) {
    return null;
  }

  // The styled back row erases TanStack's per-route param/search inference,
  // so the account id is interpolated into the path (same pattern as
  // AgentEditor's BackLink). It lands on the natural parent; the C14
  // contract params are threaded through the entry links and done().
  return (
    <ViewShell>
      <SectionBackRow to={`/agent-studio/channels/${params.accountId}`}>
        <span aria-hidden="true">‹</span> Channels
      </SectionBackRow>
      <QueryView
        query={channel}
        isEmpty={(d) => d === null}
        empty={{ title: 'Channel not found', description: 'This channel account does not exist in your organization.' }}
      >
        {(account) => (account ? <WebhookSetupForm key={account.id} account={account} returnTo={returnTo} /> : null)}
      </QueryView>
    </ViewShell>
  );
}

function WebhookSetupForm({ account, returnTo }: { account: ChannelAccount; returnTo: string | null }) {
  const navigate = useNavigate();
  const webhookSetup = useWebhookSetup();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The token is shown exactly once: it lives in memory only and the reveal
  // marker is written the moment the result renders — so a refresh after
  // reveal lands on the explicit "already revealed" state, never a
  // re-render of the same secret.
  const [result, setResult] = useState<WebhookSetupResult | null>(null);
  const [alreadyRevealed, setAlreadyRevealed] = useState(
    () => sessionStorage.getItem(revealedKey(account.id)) === '1',
  );

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const run = () => {
    setAlreadyRevealed(false);
    webhookSetup.mutate(account.id, {
      onSuccess: (setupResult) => {
        // Mark revealed the moment the token renders — it must never render
        // twice, even across a refresh. Recovery is re-running setup, which
        // issues a fresh token and invalidates the old one.
        try {
          sessionStorage.setItem(revealedKey(account.id), '1');
        } catch {
          // Storage blocked — the in-memory result still renders once.
        }
        setResult(setupResult);
      },
    });
  };

  const done = () => {
    // C14 publish exit: honor the return contract — back to the agent when
    // this page was entered with ?returnTo=, otherwise the channel detail.
    if (returnTo) {
      navigate({ to: returnTo });
    } else {
      navigate({ to: '/agent-studio/channels/$accountId', params: { accountId: account.id }, search: { returnTo: undefined, assistantId: undefined } });
    }
  };

  return (
    <>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Webhook — {account.displayName}</ViewTitle>
          <ViewSubtitle>
            Get the callback URL and the once-shown verify token for <Mono>{account.platform}</Mono>.
          </ViewSubtitle>
        </ViewHeader>
        <PlatformIcon platform={account.platform} size={22} />
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Setup result"
          subtitle={result ? 'Copy the token now — it is shown once.' : 'Run setup to generate the callback URL and verify token.'}
        >
          {result ? (
            <>
              {result.webhookUrl ? (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 13, margin: '0 0 6px' }}>Callback URL (paste into the platform dashboard):</p>
                  <Mono>{result.webhookUrl}</Mono>{' '}
                  <CopyButton value={result.webhookUrl} label="Copy callback URL" />
                  {/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/i.test(result.webhookUrl) ? (
                    <LocalhostWarning>
                      This URL points at localhost — the platform cannot reach it. Set ENGINE_BASE_URL to this
                      deployment's public engine URL and re-run webhook setup.
                    </LocalhostWarning>
                  ) : null}
                </div>
              ) : (
                <p style={{ fontSize: 13, opacity: 0.55 }}>No callback URL returned.</p>
              )}
              {result.verifyToken ? (
                <TokenBox>
                  <strong>Verify token — shown ONCE, never again.</strong>
                  <div style={{ marginTop: 6 }}><Mono>{result.verifyToken}</Mono>{' '}<CopyButton value={result.verifyToken} label="Copy verify token" /></div>
                </TokenBox>
              ) : (
                <p style={{ fontSize: 13, opacity: 0.55 }}>{account.platform === 'telegram' ? 'Telegram registers server-side — no token step.' : 'No verify token for this platform.'}</p>
              )}
              {account.platform === 'web' && account.publicKey ? (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, margin: '0 0 6px' }}>
                    Loader snippet (paste before <Mono>{'</body>'}</Mono>; baked for <Mono>{widgetSnippetOrigin()}</Mono> —
                    re-copy from your production console for live sites):
                  </p>
                  <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{widgetSnippet(account.publicKey)}</pre>{' '}
                  <CopyButton value={widgetSnippet(account.publicKey)} label="Copy snippet" />
                </div>
              ) : null}
              <ActionsRow>
                <ActionButton variant="secondary" onClick={run} disabled={webhookSetup.isPending}>
                  <Webhook size={13} strokeWidth={1.7} />
                  Re-run setup
                </ActionButton>
                <ActionButton onClick={done}>
                  Done
                </ActionButton>
              </ActionsRow>
            </>
          ) : alreadyRevealed ? (
            <>
              <RevealNotice>
                The verify token was already shown and dismissed — it is never rendered twice.
                Re-running setup generates a fresh token; the old one stops working.
              </RevealNotice>
              <ActionsRow>
                <ActionButton onClick={run} disabled={webhookSetup.isPending}>
                  <Webhook size={13} strokeWidth={1.7} />
                  Run webhook setup again
                </ActionButton>
              </ActionsRow>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, opacity: 0.75 }}>
                {account.platform === 'telegram'
                  ? 'Telegram registers the webhook server-side — running setup returns the callback URL, no token step.'
                  : 'Running setup returns the callback URL to paste into the platform dashboard, plus a verify token that is shown exactly once.'}
              </p>
              <ActionsRow>
                <ActionButton onClick={run} disabled={webhookSetup.isPending}>
                  <Webhook size={13} strokeWidth={1.7} />
                  Run webhook setup
                </ActionButton>
              </ActionsRow>
            </>
          )}
        </Panel>
      </motion.div>
    </>
  );
}
