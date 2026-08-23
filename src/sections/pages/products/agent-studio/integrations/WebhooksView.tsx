import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { CopyButton } from '@components/common/ui/CopyButton';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
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
  EndpointCard,
  EndpointLabel,
  EndpointBody,
  EndpointUrl,
  EndpointMeta,
  EndpointMetaNote,
  EventsGrid,
  EventChip,
  EventLabelRow,
  EventDot,
  EventLabel,
  EventMeta,
} from './WebhooksView.styles';

const ENDPOINT = 'https://api.neryva.studio/v1/webhooks/whk_4d2e7a91b6f3';
const SECRET = 'whsec_4d2e7a91b6f3a8c1e2f5b9d4a7c8e1f2';

const EVENTS = [
  { id: 'agent.created', label: 'agent.created', desc: 'New agent published', on: true },
  { id: 'agent.paused', label: 'agent.paused', desc: 'Agent paused', on: true },
  { id: 'agent.updated', label: 'agent.updated', desc: 'Agent config changed', on: true },
  { id: 'conversation.resolved', label: 'conversation.resolved', desc: 'Conversation closed', on: true },
  { id: 'conversation.escalated', label: 'conversation.escalated', desc: 'Routed to a human', on: false },
  { id: 'tool.failed', label: 'tool.failed', desc: 'Tool call failed', on: false },
  { id: 'usage.threshold', label: 'usage.threshold', desc: 'Usage quota crossed', on: false },
];

const DELIVERIES = [
  { id: 'd1', time: '12:48', event: 'conversation.resolved', status: 'success', latency: '142ms' },
  { id: 'd2', time: '12:31', event: 'agent.updated', status: 'success', latency: '88ms' },
  { id: 'd3', time: '12:14', event: 'conversation.escalated', status: 'success', latency: '210ms' },
  { id: 'd4', time: '11:58', event: 'tool.failed', status: 'failed', latency: '—' },
  { id: 'd5', time: '11:42', event: 'conversation.resolved', status: 'success', latency: '156ms' },
  { id: 'd6', time: '11:21', event: 'usage.threshold', status: 'success', latency: '94ms' },
  { id: 'd7', time: 'Yesterday', event: 'agent.created', status: 'success', latency: '178ms' },
];

export function WebhooksView() {
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>(
    Object.fromEntries(EVENTS.map((e) => [e.id, e.on])),
  );

  const toggle = (id: string, label: string) => {
    setSubscribed((s) => {
      const next = !s[id];
      toast.success(`${label} ${next ? 'subscribed' : 'unsubscribed'}`);
      return { ...s, [id]: next };
    });
  };

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Webhooks</ViewTitle>
        <ViewSubtitle>Send every agent event to your own HTTP endpoint.</ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Endpoint"
          subtitle="POST requests are sent to this URL with a signed payload."
          action={
            <ActionButton variant="secondary" size="sm" onClick={() => toast.success('Webhook rotation queued')}>
              Rotate secret
            </ActionButton>
          }
        >
          <EndpointCard>
            <EndpointBody>
              <EndpointLabel>Destination</EndpointLabel>
              <EndpointUrl>{ENDPOINT}</EndpointUrl>
            </EndpointBody>
            <CopyButton value={ENDPOINT} label="Copy" />
          </EndpointCard>

          <EndpointCard>
            <EndpointBody>
              <EndpointLabel>Signing secret</EndpointLabel>
              <EndpointMeta>
                <code>{SECRET.slice(0, 10)}…{SECRET.slice(-6)}</code>
                <EndpointMetaNote>· HMAC-SHA256</EndpointMetaNote>
              </EndpointMeta>
            </EndpointBody>
            <CopyButton value={SECRET} label="Copy" />
          </EndpointCard>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel
          title="Subscribed events"
          subtitle="Toggle the events that fire a webhook."
          action={
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setSubscribed(Object.fromEntries(EVENTS.map((e) => [e.id, true])));
                toast.success('All events subscribed');
              }}
            >
              <Plus size={13} strokeWidth={1.8} />
              Subscribe all
            </ActionButton>
          }
        >
          <EventsGrid>
            {EVENTS.map((e, i) => {
              const on = subscribed[e.id];
              return (
                <EventChip
                  key={e.id}
                  $on={on}
                  aria-pressed={on}
                  as={motion.button}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 3}
                  onClick={() => toggle(e.id, e.label)}
                >
                  <EventLabelRow>
                    <EventDot $on={on} aria-hidden="true" />
                    <EventLabel>{e.label}</EventLabel>
                  </EventLabelRow>
                  <EventMeta>{e.desc}</EventMeta>
                </EventChip>
              );
            })}
          </EventsGrid>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={10}>
        <Panel title="Delivery log" subtitle="Last 24 hours · 7 deliveries" flush>
          <DataTable>
            <DataHead>
              <DataCell $w="16%">Time</DataCell>
              <DataCell $w="36%">Event</DataCell>
              <DataCell $w="16%">Status</DataCell>
              <DataCell $w="14%">Method</DataCell>
              <DataCell $w="14%" $align="right">Latency</DataCell>
            </DataHead>
            {DELIVERIES.map((d) => (
              <DataRow key={d.id} $interactive={false}>
                <DataCell $w="16%">
                  <CellMeta>{d.time}</CellMeta>
                </DataCell>
                <DataCell $w="36%">
                  <CellMono>{d.event}</CellMono>
                </DataCell>
                <DataCell $w="16%">
                  <StatusPill tone={d.status === 'success' ? 'success' : 'error'}>
                    {d.status}
                  </StatusPill>
                </DataCell>
                <DataCell $w="14%">
                  <CellMono>POST</CellMono>
                </DataCell>
                <DataCell $w="14%" $align="right">
                  <CellMono>{d.latency}</CellMono>
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
