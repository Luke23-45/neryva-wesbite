import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Send, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { CopyButton } from '@components/common/ui/CopyButton';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
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
import {
  useWebhookEventCatalog,
  useWebhooks,
  useWebhookDeliveries,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useRotateWebhookSecret,
  useTestWebhook,
  secretFromRotateResponse,
  type WebhookRow,
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
 * Webhooks (ledger I-1) — the engine's webhook plane, fully wired: create,
 * edit, delete, rotate (reveal-once), test delivery, and the delivery log.
 * The events grid is ⛔ E-5 (no subscribable-event catalog endpoint yet) —
 * a toggle grid that cannot persist would be a stub, so it is not shipped.
 */

export function WebhooksView() {
  const webhooks = useWebhooks();
  const create = useCreateWebhook();
  const update = useUpdateWebhook();
  const remove = useDeleteWebhook();
  const rotate = useRotateWebhookSecret();
  const test = useTestWebhook();

  const [createOpen, setCreateOpen] = useState(false);
  const [createUrl, setCreateUrl] = useState('');
  const [editTarget, setEditTarget] = useState<WebhookRow | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WebhookRow | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  const startRotate = (webhook: WebhookRow) => {
    rotate.mutate(webhook.id, {
      onSuccess: (raw) => {
        const secret = secretFromRotateResponse(raw);
        if (secret) {
          setRotatedSecret(secret);
        } else {
          toast.success('Signing secret rotated');
        }
      },
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
            <ActionButton size="sm" onClick={() => { setCreateUrl(''); setCreateOpen(true); }}>
              <Plus size={14} strokeWidth={2} />
              New webhook
            </ActionButton>
          }
          flush
        >
          <QueryView
            query={webhooks}
            skeleton={<Skeleton $h="200px" $r="12px" />}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'No webhooks yet', description: 'Add your HTTPS endpoint — every subscribed agent event arrives there, signed.' }}
          >
            {(rows) => (
              <div style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rows.map((webhook) => (
                  <EndpointCard key={webhook.id} $selected={selectedId === webhook.id} onClick={() => setSelectedId(webhook.id === selectedId ? null : webhook.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(webhook.id === selectedId ? null : webhook.id); } }}>
                    <EndpointBody style={{ minWidth: 0 }}>
                      <EndpointLabel>{webhook.status ? `Webhook · ${webhook.status}` : 'Webhook'}</EndpointLabel>
                      <EndpointUrl>{webhook.url}</EndpointUrl>
                      <EndpointMeta>
                        {webhook.secretHint && <code>{webhook.secretHint}</code>}
                        {webhook.createdAt && <EndpointMetaNote>· added {webhook.createdAt.slice(0, 10)}</EndpointMetaNote>}
                        {webhook.events.length > 0 && <EndpointMetaNote>· {webhook.events.length} event{webhook.events.length === 1 ? '' : 's'}</EndpointMetaNote>}
                      </EndpointMeta>
                    </EndpointBody>
                    <CardActions onClick={(e) => e.stopPropagation()}>
                      <CopyButton value={webhook.url} label="Copy URL" />
                      <IconAction title="Test delivery" aria-label={`Test ${webhook.url}`} disabled={test.isPending} onClick={() => test.mutate(webhook.id, { onSuccess: () => toast.success('Test delivery sent — check the delivery log') })}>
                        <Send size={13} strokeWidth={1.7} />
                      </IconAction>
                      <IconAction title="Rotate secret" aria-label={`Rotate secret for ${webhook.url}`} disabled={rotate.isPending} onClick={() => startRotate(webhook)}>
                        <RefreshCw size={13} strokeWidth={1.7} />
                      </IconAction>
                      <IconAction title="Edit endpoint" aria-label={`Edit ${webhook.url}`} onClick={() => { setEditTarget(webhook); setEditUrl(webhook.url); }}>
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
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <EventCatalog />
      </motion.div>

      {selectedId && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
          <Panel title="Delivery log" subtitle="Most recent delivery attempts for the selected webhook." flush>
            <Deliveries webhookId={selectedId} />
          </Panel>
        </motion.div>
      )}

      <CreateModal open={createOpen} url={createUrl} onUrl={setCreateUrl} onClose={() => setCreateOpen(false)} create={create} />

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit webhook destination"
        width={480}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setEditTarget(null)}>Cancel</ActionButton>
            <ActionButton
              disabled={!editUrl.startsWith('https://') || update.isPending}
              onClick={() => editTarget && update.mutate(
                { webhookId: editTarget.id, url: editUrl.trim() },
                { onSuccess: () => { toast.success('Webhook updated'); setEditTarget(null); } },
              )}
            >
              Save
            </ActionButton>
          </>
        }
      >
        <Stack>
          <TextInput label="Destination URL (HTTPS)" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://hooks.example.com/neryva" autoFocus />
        </Stack>
      </Modal>

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
            remove.mutate(deleteTarget.id, { onSuccess: () => toast.success('Webhook deleted') });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </ViewShell>
  );
}

function EventCatalog() {
  const catalog = useWebhookEventCatalog();
  return (
    <Panel
      title='Subscribable events'
      subtitle='The event vocabulary the engine can deliver to your webhooks.'
    >
      <QueryView
        query={catalog}
        skeleton={<Skeleton $h='60px' $r='12px' />}
        isEmpty={(d) => d.events.length === 0}
        empty={{ title: 'No event types', description: "The engine's event catalog is empty." }}
      >
        {(data) => (
          <EventGrid>
            {data.events.map((e) => (
              <EventChip key={e.type}>
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
  const deliveries = useWebhookDeliveries(webhookId);
  return (
    <QueryView
      query={deliveries}
      skeleton={<Skeleton $h="160px" $r="12px" />}
      isEmpty={(d) => d.length === 0}
      empty={{ title: 'No deliveries yet', description: 'Send a test delivery — attempts land here with their response codes.' }}
    >
      {(rows) => (
        <DataTable>
          <DataHead>
            <DataCell $w="20%">When</DataCell>
            <DataCell $w="34%">Event</DataCell>
            <DataCell $w="16%">Status</DataCell>
            <DataCell $w="14%">Response</DataCell>
            <DataCell $w="16%" $align="right">ID</DataCell>
          </DataHead>
          {rows.map((d) => (
            <DataRow key={d.id} $interactive={false}>
              <DataCell $w="20%">
                <CellMeta>{d.createdAt?.replace('T', ' ').slice(0, 19) ?? '—'}</CellMeta>
              </DataCell>
              <DataCell $w="34%">
                <CellMono>{d.event ?? '—'}</CellMono>
              </DataCell>
              <DataCell $w="16%">
                <StatusPill
                  tone={d.status === 'success' || (d.responseCode !== null && d.responseCode < 400) ? 'success' : 'error'}
                >
                  {d.status ?? 'unknown'}
                </StatusPill>
              </DataCell>
              <DataCell $w="14%">
                <CellMono>{d.responseCode ?? '—'}</CellMono>
              </DataCell>
              <DataCell $w="16%" $align="right">
                <CellMeta>{d.id.slice(0, 10)}</CellMeta>
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      )}
    </QueryView>
  );
}

function CreateModal({
  open,
  url,
  onUrl,
  onClose,
  create,
}: {
  open: boolean;
  url: string;
  onUrl: (next: string) => void;
  onClose: () => void;
  create: ReturnType<typeof useCreateWebhook>;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New webhook"
      width={480}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton
            disabled={!url.startsWith('https://') || create.isPending}
            onClick={() => create.mutate(
              { url: url.trim() },
              { onSuccess: () => { toast.success('Webhook created — events are on their way'); onClose(); } },
            )}
          >
            Create
          </ActionButton>
        </>
      }
    >
      <Stack>
        <TextInput
          label="Destination URL (HTTPS)"
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="https://hooks.example.com/neryva"
          hint="The engine rejects non-HTTPS destinations and validates the host server-side."
          autoFocus
        />
      </Stack>
    </Modal>
  );
}

// ─── local styled additions ──────────────────────────────────────────
import styled from 'styled-components';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const RotateNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
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
