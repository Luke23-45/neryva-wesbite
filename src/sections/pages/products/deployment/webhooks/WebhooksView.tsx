import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, ViewHeaderRow } from '@components/common/ui/ViewLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Webhook, MoreHorizontal, Send, RotateCw, Copy as CopyIcon } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import webhooks from '@neryva_data/products/deployment/webhooks.json';
import {
import { pageItem } from '@styles/motion';
  NewBtn,
  KpiGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  TotalMeta,
  HookList,
  HookCard,
  HookTop,
  HookLeft,
  HookName,
  HookUrl,
  HookMeta,
  MetaItem,
  MetaLabel,
  MetaValue,
  EventPills,
  EventPill,
  Actions,
  IconBtn,
  SectionTitle,
  EventTypeGrid,
  EventType,
  EventTypeLabel,
  EventTypeDesc,
  EventCategory,
} from './WebhooksView.styles';

const statusTone: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  paused: 'neutral',
  failing: 'error',
};

const statusLabel: Record<string, string> = {
  active: 'active',
  paused: 'paused',
  failing: 'failing',
};

const totalDeliveries = webhooks.webhooks.reduce((sum, h) => sum + h.totalDeliveries, 0);
const avgSuccess =
  Math.round(
    (webhooks.webhooks.reduce((sum, h) => sum + h.successRate, 0) / webhooks.webhooks.length) * 10,
  ) / 10;

export function WebhooksView() {
  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewHeader><ViewTitle>Webhooks</ViewTitle>
          <ViewSubtitle>
            Outbound HTTP callbacks for deployment, alert, and audit events. Signed with HMAC for
            security.
          </ViewSubtitle></ViewHeader>
        <NewBtn type="button"
          onClick={() => toast.success('Webhook endpoint created')}>
          <Plus size={14} strokeWidth={2} />
          New webhook
        </NewBtn>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          <TotalCard>
            <TotalLabel>Endpoints</TotalLabel>
            <TotalValue>{webhooks.webhooks.length}</TotalValue>
            <TotalMeta>{webhooks.webhooks.filter((w) => w.status === 'active').length} active</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Deliveries</TotalLabel>
            <TotalValue>{(totalDeliveries / 1000).toFixed(1)}k</TotalValue>
            <TotalMeta>all time</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Success rate</TotalLabel>
            <TotalValue style={{ color: '#34d399' }}>{avgSuccess}%</TotalValue>
            <TotalMeta>across all endpoints</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Event types</TotalLabel>
            <TotalValue>{webhooks.events.length}</TotalValue>
            <TotalMeta>deploy · alert · audit</TotalMeta>
          </TotalCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionTitle>
          <Webhook size={14} strokeWidth={1.7} />
          Endpoints
        </SectionTitle>
        <HookList>
          {webhooks.webhooks.map((h, i) => (
            <HookCard
              key={h.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={pageItem}
              custom={i + 3}
            >
              <HookTop>
                <HookLeft>
                  <HookName>
                    {h.name}
                    <StatusPill tone={statusTone[h.status]}>
                      {statusLabel[h.status]}
                    </StatusPill>
                  </HookName>
                  <HookUrl>{h.url}</HookUrl>
                </HookLeft>
                <Actions>
                  <Switch
                    checked={h.status !== 'paused'}
                    onChange={() => toast.success(`${h.name} updated`)}
                  />
                  <IconBtn
                    type="button"
                    aria-label={`Send test to ${h.name}`}
                    onClick={() => toast.success(`Test event sent to ${h.name}`)}
                  >
                    <Send size={13} strokeWidth={1.7} />
                  </IconBtn>
                  <IconBtn
                    type="button"
                    aria-label={`Rotate secret for ${h.name}`}
                    onClick={() => toast.success(`Secret rotated for ${h.name}`)}
                  >
                    <RotateCw size={13} strokeWidth={1.7} />
                  </IconBtn>
                  <IconBtn
                    type="button"
                    aria-label={`Copy secret for ${h.name}`}
                    onClick={() => toast.success(`Secret copied`)}
                  >
                    <CopyIcon size={13} strokeWidth={1.7} />
                  </IconBtn>
                  <IconBtn type="button" aria-label={`More actions for ${h.name}`}>
                    <MoreHorizontal size={13} strokeWidth={1.7} />
                  </IconBtn>
                </Actions>
              </HookTop>
              <HookMeta>
                <MetaItem>
                  <MetaLabel>Last delivery</MetaLabel>
                  <MetaValue>{h.lastDelivery}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Deliveries</MetaLabel>
                  <MetaValue>{h.totalDeliveries.toLocaleString()}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Success rate</MetaLabel>
                  <MetaValue
                    style={{
                      color:
                        h.successRate >= 99
                          ? '#34d399'
                          : h.successRate >= 95
                            ? '#fbbf24'
                            : '#f87171',
                    }}
                  >
                    {h.successRate}%
                  </MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Created</MetaLabel>
                  <MetaValue>{h.createdAt}</MetaValue>
                </MetaItem>
              </HookMeta>
              <EventPills>
                {h.events.map((e) => (
                  <EventPill key={e}>{e}</EventPill>
                ))}
              </EventPills>
            </HookCard>
          ))}
        </HookList>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={10}>
        <SectionTitle>Available event types</SectionTitle>
        <EventTypeGrid>
          {webhooks.events.map((e, i) => (
            <EventType
              key={e.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={pageItem}
              custom={i + 11}
            >
              <EventCategory>{e.category}</EventCategory>
              <EventTypeLabel>{e.label}</EventTypeLabel>
              <EventTypeDesc>{e.description}</EventTypeDesc>
            </EventType>
          ))}
        </EventTypeGrid>
      </motion.div>
    </ViewShell>
  );
}
