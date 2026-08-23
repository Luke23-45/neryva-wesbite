import toast from 'react-hot-toast';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, ViewHeaderRow } from '@components/common/ui/ViewLayout';
import { motion } from 'framer-motion';
import { Plus, Bell, AlertTriangle, Clock, MapPin, User } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import alerts from '@neryva_data/products/deployment/alerts.json';
import { pageItem } from '@styles/motion';
import {
  NewBtn,
  OnCallGrid,
  OnCallCard,
  OnCallAvatar,
  OnCallBody,
  OnCallRole,
  OnCallName,
  OnCallEmail,
  SectionTitle,
  IncidentList,
  IncidentCard,
  IncidentDot,
  IncidentBody,
  IncidentTitle,
  IncidentMeta,
  MetaItem,
  IncidentSummary,
  IncidentActions,
  RuleTable,
  TableHeader,
  TableRow,
  Cell,
  RuleName,
  RuleCondition,
  ChannelPills,
  ChannelPill,
} from './AlertsView.styles';

const ON_CALL_ACCENTS: Record<string, string> = {
  primary: 'rgba(245, 158, 11, 0.40)',
  secondary: 'rgba(192, 132, 252, 0.40)',
  escalation: 'rgba(248, 113, 113, 0.40)',
};

const incidentStatusTone: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  resolved: 'success',
  investigating: 'warning',
  mitigated: 'info',
  open: 'error',
};

const incidentStatusLabel: Record<string, string> = {
  resolved: 'resolved',
  investigating: 'investigating',
  mitigated: 'mitigated',
  open: 'open',
};

const ruleSeverityTone: Record<string, 'error' | 'warning' | 'azure'> = {
  high: 'error',
  medium: 'warning',
  low: 'azure',
};

const ruleSeverityLabel: Record<string, string> = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export function AlertsView() {
  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewHeader><ViewTitle>Alerts</ViewTitle>
          <ViewSubtitle>
            Active incidents, alert rules, and on-call rotations. Get paged the moment something
            breaks.
          </ViewSubtitle></ViewHeader>
        <NewBtn type="button"
          onClick={() => toast.success('New alert rule created')}>
          <Plus size={14} strokeWidth={2} />
          New rule
        </NewBtn>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <SectionTitle>
          <Bell size={14} strokeWidth={1.7} />
          On-call rotation
        </SectionTitle>
        <OnCallGrid>
          {[alerts.onCall.primary, alerts.onCall.secondary, alerts.onCall.escalation].map((p, i) => {
            const initials = p.name.split(' ').map((s) => s[0]).slice(0, 2).join('');
            return (
              <OnCallCard
                key={p.rotation}
                $accent={ON_CALL_ACCENTS[p.rotation]}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 2}
              >
                <OnCallAvatar $tone={p.tone}>{initials}</OnCallAvatar>
                <OnCallBody>
                  <OnCallRole>{p.rotation}</OnCallRole>
                  <OnCallName>{p.name}</OnCallName>
                  <OnCallEmail>{p.email}</OnCallEmail>
                </OnCallBody>
              </OnCallCard>
            );
          })}
        </OnCallGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
        <SectionTitle>
          <AlertTriangle size={14} strokeWidth={1.7} />
          Active incidents
        </SectionTitle>
        <IncidentList>
          {alerts.incidents.map((inc, i) => (
            <IncidentCard
              key={inc.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={pageItem}
              custom={i + 6}
            >
              <IncidentDot $tone={inc.tone} />
              <IncidentBody>
                <IncidentTitle>{inc.title}</IncidentTitle>
                <IncidentMeta>
                  <MetaItem>
                    <MapPin size={11} strokeWidth={1.7} />
                    {inc.region}
                  </MetaItem>
                  <span>·</span>
                  <MetaItem>
                    <User size={11} strokeWidth={1.7} />
                    {inc.responder}
                  </MetaItem>
                  <span>·</span>
                  <MetaItem>
                    <Clock size={11} strokeWidth={1.7} />
                    {inc.duration}
                  </MetaItem>
                </IncidentMeta>
                <IncidentSummary>{inc.summary}</IncidentSummary>
              </IncidentBody>
              <IncidentActions>
                <StatusPill tone={incidentStatusTone[inc.status]}>
                  {incidentStatusLabel[inc.status]}
                </StatusPill>
                <StatusPill tone={ruleSeverityTone[inc.severity]} dot={false}>
                  {ruleSeverityLabel[inc.severity]}
                </StatusPill>
              </IncidentActions>
            </IncidentCard>
          ))}
        </IncidentList>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={11}>
        <Panel title="Alert rules" subtitle="Conditions that trigger pages and notifications">
          <RuleTable>
            <TableHeader>
              <Cell $w="26%">Rule</Cell>
              <Cell $w="28%">Condition</Cell>
              <Cell $w="12%">Window</Cell>
              <Cell $w="12%">Severity</Cell>
              <Cell $w="14%">Channels</Cell>
              <Cell $w="8%" $align="right">On</Cell>
            </TableHeader>
            {alerts.alertRules.map((r, i) => (
              <TableRow
                key={r.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 12}
              >
                <Cell $w="26%">
                  <RuleName>{r.name}</RuleName>
                </Cell>
                <Cell $w="28%">
                  <RuleCondition>{r.condition}</RuleCondition>
                </Cell>
                <Cell $w="12%">
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 12,
                      color: 'rgba(229, 231, 235, 0.65)',
                    }}
                  >
                    {r.window}
                  </span>
                </Cell>
                <Cell $w="12%">
                  <StatusPill tone={ruleSeverityTone[r.severity]} dot={false}>
                    {ruleSeverityLabel[r.severity]}
                  </StatusPill>
                </Cell>
                <Cell $w="14%">
                  <ChannelPills>
                    {r.channels.map((c) => (
                      <ChannelPill key={c}>{c}</ChannelPill>
                    ))}
                  </ChannelPills>
                </Cell>
                <Cell $w="8%" $align="right">
                  <Switch checked={r.enabled} onChange={() => {}} />
                </Cell>
              </TableRow>
            ))}
          </RuleTable>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
