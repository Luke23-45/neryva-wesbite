import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2, RefreshCw, Send, Pencil, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { CopyButton } from '@components/common/ui/CopyButton';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { EmptyState } from '@components/common/ui/EmptyState';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellMono,
  CellMeta,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { ApiError } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useWebhookEvents,
  useWebhooks,
  useWebhookDeliveries,
  useDeleteWebhook,
  useRotateWebhookSecret,
  useTestWebhook,
  secretFromRotateResponse,
  type WebhookSummary,
} from '@hooks/studio/useWebhooks';
import { Stack, RotateNote, SecretBox, EventGrid } from './webhook-section-shared';

// Twin of the create-flow marker in WebhookNewSection: a rotate's shown-once
// secret is memory-only, so a refresh-during-reveal would silently lose it.
// The marker records the webhook id; the list then shows an honest
// "already revealed — rotate again for a new one" banner instead of nothing.
const PENDING_ROTATE_KEY = 'neryva:webhook-pending-rotate-reveal';

function readPendingRotate(): string | null {
  try {
    return sessionStorage.getItem(PENDING_ROTATE_KEY);
  } catch {
    return null;
  }
}

import {
  EndpointCard,
  EndpointLabel,
  EndpointBody,
  EndpointUrl,
  EndpointMeta,
  EndpointMetaNote,
} from './WebhooksView.styles';

/**
 * Webhooks — the engine's webhook plane, fully wired: create (with real
 * subscription selection and reveal-once secret), edit (URL, events,
 * description, status), delete, rotate (reveal-once), targeted test
 * delivery, and the delivery log. The event grid is the subscribable
 * catalog; lifecycle events ride `*`-subscribed webhooks (see catalog
 * subtitle). Manual redelivery remains ⛔ E-5 (no endpoint yet).
 */

export function WebhooksView() {
  const navigate = useNavigate();
  const { role } = useOrg();
  // Webhook writes (create/edit/delete/rotate/test) require
  // owner/admin/developer — setup:author matches the engine @Roles exactly.
  // Readers and billing keep full read access; write controls render
  // disabled with the reason (capabilities.ts UI convention).
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const webhooks = useWebhooks();
  const remove = useDeleteWebhook();
  const rotate = useRotateWebhookSecret();
  const test = useTestWebhook();

  const [deleteTarget, setDeleteTarget] = useState<WebhookSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
  // Refresh-during-rotate-reveal: the secret is gone (memory-only) but the
  // marker survives, so the list shows an honest banner instead of silence.
  const [interruptedRotateId, setInterruptedRotateId] = useState<string | null>(() => readPendingRotate());

  const closeRotateReveal = () => {
    try {
      sessionStorage.removeItem(PENDING_ROTATE_KEY);
    } catch {
      // Storage blocked — the in-memory reveal already happened.
    }
    setRotatedSecret(null);
  };

  const dismissInterruptedRotate = () => {
    try {
      sessionStorage.removeItem(PENDING_ROTATE_KEY);
    } catch {
      // Storage blocked — nothing to clear.
    }
    setInterruptedRotateId(null);
  };

  // J1-04 twin: a 404 on the webhooks read means the engine's webhooks
  // module is disabled in this deployment — not a failure. The honest
  // state is "unavailable", and webhook creation is withheld since issuing
  // would 404 too.
  const webhooksDisabled =
    webhooks.isError && webhooks.error instanceof ApiError && webhooks.error.status === 404;

  const startRotate = (webhook: WebhookSummary) => {
    rotate.mutate(webhook.id, {
      onSuccess: (raw) => {
        const secret = secretFromRotateResponse(raw);
        if (secret) {
          try {
            sessionStorage.setItem(PENDING_ROTATE_KEY, webhook.id);
          } catch {
            // Storage blocked — the in-memory secret still renders once.
          }
          setRotatedSecret(secret);
        } else {
          toast.success('Signing secret rotated');
        }
      },
      onError: (err) => toastEngineError(err, 'Could not rotate the signing secret.'),
    });
  };

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Webhooks</ViewTitle>
        <ViewSubtitle>Send signed agent events to your own HTTP endpoints.</ViewSubtitle>
      </ViewHeader>

      {interruptedRotateId && !rotatedSecret && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Panel
            title="Signing secret already revealed"
            subtitle="A new signing secret was issued just before the page reloaded. It was shown exactly once and can't be displayed again — rotate once more to issue a fresh one."
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <ActionButton variant="secondary" onClick={dismissInterruptedRotate}>
                Dismiss
              </ActionButton>
            </div>
          </Panel>
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Endpoints"
          subtitle="Each webhook delivers HMAC-signed POST requests to its destination."
          action={
            !webhooksDisabled ? (
              <ActionButton
                size="sm"
                disabled={!canWrite}
                title={canWrite ? undefined : writeDenied}
                onClick={() => navigate({ to: '/agent-studio/integrations/webhooks/new' })}
              >
                <Plus size={14} strokeWidth={2} />
                New webhook
              </ActionButton>
            ) : undefined
          }
          flush
        >
          {webhooksDisabled ? (
            <EmptyState
              icon={<KeyRound size={18} opacity={0.5} />}
              title="Webhooks are not available in this deployment"
              description="The engine's webhooks module is disabled, so endpoints cannot be listed or created. Enable the webhooks module on the engine to use webhooks."
            />
          ) : (
            <QueryView
              query={webhooks}
              skeleton={<Skeleton $h="200px" $r="12px" />}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No webhooks yet', description: 'Add your endpoint — every subscribed agent event arrives there, signed.' }}
            >
              {(rows) => (
                <div style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rows.map((webhook) => (
                    <EndpointCard key={webhook.id} $selected={selectedId === webhook.id} onClick={() => setSelectedId(webhook.id === selectedId ? null : webhook.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(webhook.id === selectedId ? null : webhook.id); } }}>
                      <EndpointBody style={{ minWidth: 0 }}>
                        <EndpointLabel>
                          <StatusPill tone={webhook.status === 'active' ? 'success' : webhook.status === 'disabled' ? 'neutral' : 'info'}>
                            {webhook.status ?? 'unknown'}
                          </StatusPill>
                        </EndpointLabel>
                        <EndpointUrl>{webhook.url}</EndpointUrl>
                        {webhook.description && <EndpointMetaNote>{webhook.description}</EndpointMetaNote>}
                        <EndpointMeta>
                          {webhook.secretHint && <code title="Last characters of the signing secret">{webhook.secretHint}</code>}
                          {webhook.events.length > 0 && (
                            <EndpointMetaNote>
                              · {webhook.events.includes('*') ? 'all events' : webhook.events.slice(0, 3).join(', ') + (webhook.events.length > 3 ? ` +${webhook.events.length - 3} more` : '')}
                            </EndpointMetaNote>
                          )}
                          {webhook.createdAt && <EndpointMetaNote>· added {webhook.createdAt.slice(0, 10)}</EndpointMetaNote>}
                        </EndpointMeta>
                      </EndpointBody>
                      <CardActions onClick={(e) => e.stopPropagation()}>
                        <CopyButton value={webhook.url} label="Copy URL" />
                        <IconAction
                          title={canWrite ? 'Send test delivery' : writeDenied}
                          aria-label={`Test ${webhook.url}`}
                          disabled={test.isPending || !canWrite}
                          onClick={() => test.mutate(webhook.id, {
                            onSuccess: () => {
                              toast.success('Test event sent — it appears in the delivery log below');
                              setSelectedId(webhook.id);
                            },
                            onError: (err) => toastEngineError(err, 'Could not send the test delivery.'),
                          })}
                        >
                          <Send size={13} strokeWidth={1.7} />
                        </IconAction>
                        <IconAction title={canWrite ? 'Rotate secret' : writeDenied} aria-label={`Rotate secret for ${webhook.url}`} disabled={rotate.isPending || !canWrite} onClick={() => startRotate(webhook)}>
                          <RefreshCw size={13} strokeWidth={1.7} />
                        </IconAction>
                        <IconAction title={canWrite ? 'Edit webhook' : writeDenied} aria-label={`Edit ${webhook.url}`} disabled={!canWrite} onClick={() => navigate({ to: '/agent-studio/integrations/webhooks/$webhookId/edit', params: { webhookId: webhook.id } })}>
                          <Pencil size={13} strokeWidth={1.7} />
                        </IconAction>
                        <IconAction title={canWrite ? 'Delete webhook' : writeDenied} aria-label={`Delete ${webhook.url}`} disabled={!canWrite} onClick={() => setDeleteTarget(webhook)}>
                          <Trash2 size={13} strokeWidth={1.7} />
                        </IconAction>
                      </CardActions>
                    </EndpointCard>
                  ))}
                </div>
              )}
            </QueryView>
          )}
        </Panel>
      </motion.div>

      {!webhooksDisabled && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <EventCatalog />
        </motion.div>
      )}

      {!webhooksDisabled && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
          <Panel
            title="Verifying deliveries"
            subtitle="Prove a delivery came from this engine before acting on it."
          >
            <VerifyBody>
              <RotateNote>
                Every delivery is an <code>HTTPS POST</code> with a JSON body shaped{' '}
                <code>{'{ "type", "created_at", "data" }'}</code>. The engine signs the raw
                request body with your webhook's signing secret:
              </RotateNote>
              <VerifyCode>signature = HMAC_SHA256(secret, timestamp + &quot;.&quot; + raw_body)</VerifyCode>
              <RotateNote>Request headers on every delivery:</RotateNote>
              <VerifyList>
                <li>
                  <code>x-neryva-signature</code> — <code>sha256=&lt;hex&gt;</code>, the signature above
                </li>
                <li>
                  <code>x-neryva-timestamp</code> — unix seconds when the signature was computed
                </li>
                <li>
                  <code>x-neryva-event</code> — the event type (also in the body's <code>type</code>)
                </li>
                <li>
                  <code>user-agent</code> — <code>neryva-webhooks/1.0</code>
                </li>
              </VerifyList>
              <RotateNote>
                To verify: recompute the signature over the exact bytes you received and compare
                it with the header using a constant-time comparison. Reject deliveries whose
                timestamp is older than a few minutes. Each secret is shown exactly once — store
                it securely. Attempts time out after 10 seconds; non-2xx responses are retried
                with backoff (1m, 5m, 30m, 2h, 6h — up to 5 attempts).
              </RotateNote>
            </VerifyBody>
          </Panel>
        </motion.div>
      )}

      {selectedId && !webhooksDisabled && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
          <Panel title="Delivery log" subtitle="Delivery attempts for the selected webhook, newest first." flush>
            <Deliveries webhookId={selectedId} />
          </Panel>
        </motion.div>
      )}

      <Modal
        open={!!rotatedSecret}
        onClose={closeRotateReveal}
        title="New signing secret"
        width={520}
        footer={
          <ActionButton onClick={closeRotateReveal}>Done</ActionButton>
        }
      >
        <Stack>
          <RotateNote>
            The previous secret stopped working immediately. Update your verification code, then keep this value —
            it is shown exactly once.
          </RotateNote>
          <SecretBox>
            <code>{rotatedSecret}</code>
            <CopyButton value={rotatedSecret ?? ''} label="Copy secret" />
          </SecretBox>
        </Stack>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this webhook?"
        message={deleteTarget ? `${deleteTarget.url} stops receiving events immediately.` : ''}
        destructive
        confirmLabel="Delete webhook"
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Webhook deleted');
                if (selectedId === deleteTarget.id) setSelectedId(null);
              },
              onError: (err) => toastEngineError(err, 'Could not delete the webhook.'),
            });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </ViewShell>
  );
}

function EventCatalog() {
  const catalog = useWebhookEvents();
  return (
    <Panel
      title="Subscribable events"
      subtitle="Event types you can subscribe webhooks to explicitly. 'All events (*)' receives every event type."
    >
      <QueryView
        query={catalog}
        skeleton={<Skeleton $h="60px" $r="12px" />}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No event types', description: "The engine's event catalog is empty." }}
      >
        {(events) => (
          <EventGrid>
            {events.map((e) => (
              <EventChip key={e.type} title={e.description}>
                <EventName>{e.type}</EventName>
              </EventChip>
            ))}
          </EventGrid>
        )}
      </QueryView>
    </Panel>
  );
}

function Deliveries({ webhookId }: { webhookId: string }) {
  const [limit, setLimit] = useState(50);
  const deliveries = useWebhookDeliveries(webhookId, limit);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 22px 0' }}>
        <ActionButton size="sm" variant="secondary" onClick={() => deliveries.refetch()} disabled={deliveries.isFetching}>
          <RefreshCw size={13} strokeWidth={2} />
          Refresh
        </ActionButton>
      </div>
      <QueryView
        query={deliveries}
        skeleton={<Skeleton $h="160px" $r="12px" />}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No deliveries yet', description: 'Send a test delivery — attempts land here with their response codes.' }}
      >
        {(rows) => (
          <>
            <DataTable>
              <DataHead>
                <DataCell $w="18%">When</DataCell>
                <DataCell $w="26%">Event</DataCell>
                <DataCell $w="14%">Status</DataCell>
                <DataCell $w="12%">Response</DataCell>
                <DataCell $w="20%">Error</DataCell>
                <DataCell $w="10%" $align="right">ID</DataCell>
              </DataHead>
              {rows.map((d) => (
                <DataRow key={d.id} $interactive={false} title={d.lastError ?? undefined}>
                  <DataCell $w="18%">
                    <CellMeta>{d.createdAt?.replace('T', ' ').slice(0, 19) ?? '—'}</CellMeta>
                  </DataCell>
                  <DataCell $w="26%">
                    <CellMono>{d.eventType ?? '—'}</CellMono>
                  </DataCell>
                  <DataCell $w="14%">
                    <StatusPill tone={deliveryTone(d.status)}>
                      {d.status ?? 'unknown'}
                    </StatusPill>
                  </DataCell>
                  <DataCell $w="12%">
                    <CellMono>{d.responseStatus ?? '—'}</CellMono>
                  </DataCell>
                  <DataCell $w="20%">
                    <CellMeta>{d.lastError ? truncate(d.lastError, 60) : '—'}</CellMeta>
                  </DataCell>
                  <DataCell $w="10%" $align="right">
                    <CellMeta>{d.id.slice(0, 8)}</CellMeta>
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
            {rows.length >= limit && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 16px' }}>
                <ActionButton size="sm" variant="secondary" onClick={() => setLimit((l) => l + 50)} disabled={deliveries.isFetching}>
                  Show more
                </ActionButton>
              </div>
            )}
          </>
        )}
      </QueryView>
    </>
  );
}

function deliveryTone(status: string | null): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'delivered': return 'success';
    case 'pending': return 'warning';
    case 'failed': return 'warning';
    case 'dead': return 'error';
    default: return 'neutral';
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

// ─── local styled additions ──────────────────────────────────────────
// (The create/edit event picker and form primitives moved to
// webhook-section-shared.tsx when the modals became routed sections;
// only the rotate-secret reveal modal remains here.)




const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const IconAction = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 7px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;


const EventChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const EventName = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
`;




const VerifyBody = styled.div`
  padding: 16px 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const VerifyCode = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  white-space: nowrap;
`;

const VerifyList = styled.ul`
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;

  code {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
  }
`;

