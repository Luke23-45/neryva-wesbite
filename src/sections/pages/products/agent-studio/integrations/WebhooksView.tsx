import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { CopyButton } from '@components/common/ui/CopyButton';

import {
  PageRoot,
  PageHeader,
  PageTitle,
  PageSubtitle,
  EndpointCard,
  EndpointUrl,
  EndpointMeta,
  EventsGrid,
  EventChip,
  EventMeta,
  LogTable,
  LogHeader,
  LogRow,
  Cell,
  Status,
  Method,
  Latency,
  AddButton,
} from './WebhooksView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 } }),
};

const ENDPOINT = 'https://api.neryva.studio/v1/webhooks/whk_4d2e7a91b6f3';
const SECRET = 'whsec_4d2e7a91b6f3a8c1e2f5b9d4a7c8e1f2';

const EVENTS = [
  { id: 'agent.created', label: 'agent.created', desc: 'New agent published' },
  { id: 'agent.paused', label: 'agent.paused', desc: 'Agent paused' },
  { id: 'agent.updated', label: 'agent.updated', desc: 'Agent config changed' },
  { id: 'conversation.resolved', label: 'conversation.resolved', desc: 'Conversation closed' },
  { id: 'conversation.escalated', label: 'conversation.escalated', desc: 'Routed to a human' },
  { id: 'tool.failed', label: 'tool.failed', desc: 'Tool call failed' },
  { id: 'usage.threshold', label: 'usage.threshold', desc: 'Usage quota crossed' },
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
  return (
    <PageRoot>
      <PageHeader
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <PageTitle>Webhooks</PageTitle>
        <PageSubtitle>
          Send every agent event to your own HTTP endpoint.
        </PageSubtitle>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Panel
          title="Endpoint"
          subtitle="POST requests are sent to this URL with a signed payload."
          action={
            <AddButton type="button" onClick={() => toast.success('Webhook rotation queued')}>
              Rotate secret
            </AddButton>
          }
        >
          <EndpointCard>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(229,231,235,0.5)', marginBottom: 6 }}>
                Destination
              </div>
              <EndpointUrl>{ENDPOINT}</EndpointUrl>
            </div>
            <CopyButton value={ENDPOINT} label="Copy" />
          </EndpointCard>

          <EndpointCard style={{ marginTop: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(229,231,235,0.5)', marginBottom: 6 }}>
                Signing secret
              </div>
              <EndpointMeta>
                <code>{SECRET.slice(0, 10)}…{SECRET.slice(-6)}</code>
                <span style={{ color: 'rgba(229,231,235,0.55)' }}>· HMAC-SHA256</span>
              </EndpointMeta>
            </div>
            <CopyButton value={SECRET} label="Copy" />
          </EndpointCard>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <Panel
          title="Subscribed events"
          subtitle="Toggle events that fire a webhook."
          action={
            <AddButton type="button" onClick={() => toast.success('Event subscribed')}>
              <Plus size={13} strokeWidth={1.8} />
              Subscribe
            </AddButton>
          }
        >
          <EventsGrid>
            {EVENTS.map((e, i) => (
              <EventChip key={e.id} as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={i + 3}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: i < 4 ? '#34d399' : 'rgba(229,231,235,0.3)',
                    }}
                  />
                  <code style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#f5f7fb' }}>{e.label}</code>
                </div>
                <EventMeta>{e.desc}</EventMeta>
              </EventChip>
            ))}
          </EventsGrid>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10}>
        <Panel title="Delivery log" subtitle="Last 24 hours · 7 deliveries">
          <LogTable>
            <LogHeader>
              <Cell $w="16%">Time</Cell>
              <Cell $w="36%">Event</Cell>
              <Cell $w="16%">Status</Cell>
              <Cell $w="14%">Method</Cell>
              <Cell $w="14%" $align="right">Latency</Cell>
            </LogHeader>
            {DELIVERIES.map((d) => (
              <LogRow key={d.id}>
                <Cell $w="16%">
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(229,231,235,0.65)' }}>
                    {d.time}
                  </span>
                </Cell>
                <Cell $w="36%">
                  <code style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#f5f7fb' }}>
                    {d.event}
                  </code>
                </Cell>
                <Cell $w="16%">
                  <Status $success={d.status === 'success'}>{d.status}</Status>
                </Cell>
                <Cell $w="14%">
                  <Method>POST</Method>
                </Cell>
                <Cell $w="14%" $align="right">
                  <Latency>{d.latency}</Latency>
                </Cell>
              </LogRow>
            ))}
          </LogTable>
        </Panel>
      </motion.div>
    </PageRoot>
  );
}
