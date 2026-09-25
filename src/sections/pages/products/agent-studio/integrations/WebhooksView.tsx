import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Send, Pencil, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
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
import {
  useWebhookEvents,
  useWebhooks,
  useWebhookDeliveries,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useRotateWebhookSecret,
  useTestWebhook,
  secretFromRotateResponse,
  type WebhookSummary,
  type WebhookEventCatalogEntry,
} from '@hooks/studio/useWebhooks';

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
  const webhooks = useWebhooks();
  const remove = useDeleteWebhook();
  const rotate = useRotateWebhookSecret();
  const test = useTestWebhook();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WebhookSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

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

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Endpoints"
          subtitle="Each webhook delivers HMAC-signed POST requests to its destination."
          action={
            !webhooksDisabled ? (
              <ActionButton size="sm" onClick={() => setCreateOpen(true)}>
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
                          title="Send test delivery"
                          aria-label={`Test ${webhook.url}`}
                          disabled={test.isPending}
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
                        <IconAction title="Rotate secret" aria-label={`Rotate secret for ${webhook.url}`} disabled={rotate.isPending} onClick={() => startRotate(webhook)}>
                          <RefreshCw size={13} strokeWidth={1.7} />
                        </IconAction>
                        <IconAction title="Edit webhook" aria-label={`Edit ${webhook.url}`} onClick={() => setEditTarget(webhook)}>
                          <Pencil size={13} strokeWidth={1.7} />
                        </IconAction>
                        <IconAction title="Delete webhook" aria-label={`Delete ${webhook.url}`} onClick={() => setDeleteTarget(webhook)}>
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

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(id) => setSelectedId(id)} />

      <EditModal target={editTarget} onClose={() => setEditTarget(null)} />

      <Modal
        open={!!rotatedSecret}
        onClose={() => setRotatedSecret(null)}
        title="New signing secret"
        width={520}
        footer={
          <ActionButton onClick={() => setRotatedSecret(null)}>Done</ActionButton>
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

/** Multi-select event picker shared by the create and edit modals. */
function EventSelector({
  catalog,
  selected,
  onChange,
}: {
  catalog: WebhookEventCatalogEntry[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = selected.includes('*');
  const toggle = (type: string) => {
    if (type === '*') {
      onChange(allSelected ? [] : ['*']);
      return;
    }
    const without = selected.filter((t) => t !== '*' && t !== type);
    onChange(selected.includes(type) ? without : [...without, type]);
  };
  return (
    <div>
      <FieldLabel>Subscribed events</FieldLabel>
      <EventGrid style={{ padding: 0 }}>
        <ToggleChip $active={allSelected} onClick={() => toggle('*')} title="Receive every event type">
          All events (*)
        </ToggleChip>
        {catalog.map((e) => (
          <ToggleChip
            key={e.type}
            $active={!allSelected && selected.includes(e.type)}
            onClick={() => toggle(e.type)}
            title={e.description}
          >
            {e.type}
          </ToggleChip>
        ))}
      </EventGrid>
      <HintText>
        {allSelected
          ? 'This webhook receives every event type.'
          : selected.length === 0
            ? 'Select at least one event type — a webhook with no subscriptions never fires.'
            : `${selected.length} event type${selected.length === 1 ? '' : 's'} selected.`}
      </HintText>
    </div>
  );
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function CreateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const create = useCreateWebhook();
  const catalog = useWebhookEvents();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<string[]>(['*']);
  const [secret, setSecret] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState('');
  // One idempotency key per create-intent (minted when the modal state
  // initializes, renewed on close). Double-submits of the same form replay
  // the stored response instead of minting a second webhook. A failed
  // submit keeps the key: the engine never caches failures, so a retry is
  // safe and a lost response replays instead of duplicating.
  const [idemKey, setIdemKey] = useState<string>(() => crypto.randomUUID());

  const reset = () => {
    setStep('form');
    setUrl('');
    setDescription('');
    setEvents(['*']);
    setSecret(null);
    setCreatedId('');
    setIdemKey(crypto.randomUUID());
    create.reset();
  };

  const close = () => {
    reset();
    onClose();
  };

  const valid = isValidUrl(url) && events.length > 0;

  const submit = () => {
    create.mutate(
      { url: url.trim(), events, description: description.trim() || undefined, idempotencyKey: idemKey },
      {
        onSuccess: (result) => {
          setCreatedId(result.id);
          setSecret(result.secret);
          setStep('done');
        },
        onError: (err) => toastEngineError(err, 'Could not create the webhook.'),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={step === 'form' ? 'New webhook' : 'Webhook created'}
      width={520}
      footer={
        step === 'form' ? (
          <>
            <ActionButton variant="secondary" onClick={close}>Cancel</ActionButton>
            <ActionButton disabled={!valid || create.isPending} onClick={submit}>
              Create webhook
            </ActionButton>
          </>
        ) : (
          <ActionButton
            onClick={() => { onCreated(createdId); close(); }}
          >
            I&apos;ve saved the secret — done
          </ActionButton>
        )
      }
    >
      {step === 'form' ? (
        <Stack>
          <TextInput
            label="Destination URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.example.com/neryva"
            hint="The engine validates the host server-side and blocks private/internal targets. HTTPS is required in production; HTTP is accepted in local dev only."
            autoFocus
          />
          <TextInput
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Order events for the fulfillment service"
          />
          <EventSelector catalog={catalog.data ?? []} selected={events} onChange={setEvents} />
        </Stack>
      ) : (
        <Stack>
          <RotateNote>
            Your webhook is ready. Copy the signing secret now — it is shown
            exactly once and can never be retrieved again. Use it to verify
            the <code>HMAC-SHA256</code> signature on every delivery.
          </RotateNote>
          {secret ? (
            <SecretBox>
              <code>{secret}</code>
              <CopyButton value={secret} label="Copy secret" />
            </SecretBox>
          ) : (
            <RotateNote>
              The engine did not return a secret for this webhook. Rotate the
              secret from the endpoint list to issue one.
            </RotateNote>
          )}
        </Stack>
      )}
    </Modal>
  );
}

function EditModal({ target, onClose }: { target: WebhookSummary | null; onClose: () => void }) {
  const update = useUpdateWebhook();
  const catalog = useWebhookEvents();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'disabled'>('active');

  useEffect(() => {
    if (target) {
      setUrl(target.url);
      setDescription(target.description ?? '');
      setEvents(target.events.length > 0 ? target.events : ['*']);
      setStatus(target.status === 'disabled' ? 'disabled' : 'active');
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  const valid = isValidUrl(url) && events.length > 0;

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Edit webhook"
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton
            disabled={!valid || update.isPending}
            onClick={() => target && update.mutate(
              {
                webhookId: target.id,
                url: url.trim(),
                events,
                description: description.trim() ? description.trim() : null,
                status,
              },
              {
                onSuccess: () => { toast.success('Webhook updated'); onClose(); },
                onError: (err) => toastEngineError(err, 'Could not update the webhook.'),
              },
            )}
          >
            Save changes
          </ActionButton>
        </>
      }
    >
      <Stack>
        <TextInput
          label="Destination URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hooks.example.com/neryva"
          autoFocus
        />
        <TextInput
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Order events for the fulfillment service"
        />
        <EventSelector catalog={catalog.data ?? []} selected={events} onChange={setEvents} />
        <div>
          <FieldLabel>Status</FieldLabel>
          <StatusToggle>
            <ToggleChip $active={status === 'active'} onClick={() => setStatus('active')}>Active</ToggleChip>
            <ToggleChip $active={status === 'disabled'} onClick={() => setStatus('disabled')}>Disabled</ToggleChip>
          </StatusToggle>
          <HintText>
            {status === 'active'
              ? 'The webhook receives deliveries.'
              : 'Disabled webhooks keep their history but receive nothing.'}
          </HintText>
        </div>
      </Stack>
    </Modal>
  );
}

// ─── local styled additions ──────────────────────────────────────────

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const RotateNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;

  code {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
  }
`;

const SecretBox = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};

  code {
    flex: 1;
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: ${({ theme }) => theme.app.type.caption};
    color: ${({ theme }) => theme.app.text.primary};
    word-break: break-all;
    line-height: 1.5;
  }
`;

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

const EventGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 22px;
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

const ToggleChip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  cursor: pointer;
  background: ${({ $active, theme }) => ($active ? theme.app.status.lilac.bg : 'transparent')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.app.status.lilac.border : theme.app.border.default)};
  color: ${({ $active, theme }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const FieldLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 8px;
`;

const HintText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 8px;
  line-height: 1.5;
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

const StatusToggle = styled.div`
  display: flex;
  gap: 8px;
`;
