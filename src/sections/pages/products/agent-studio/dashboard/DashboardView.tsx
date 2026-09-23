import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Link } from '@tanstack/react-router';
import { ActivityIcon, CheckCircle2, Circle } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { Segmented } from '@components/common/ui/Segmented';
import { LinkAction } from '@components/common/ui/LinkAction';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView, ErrorState } from '@components/common/ui/AsyncStates';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import {
  ViewShell,
  ViewHeader,
  ViewTitle,
  ViewSubtitle,
  SectionTitle,
  KpiGrid,
} from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellPrimary,
  CellMono,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useOnboarding } from '@hooks/studio/useOnboarding';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useConversations } from '@hooks/studio/useStudioConversations';
import { useEntitlements, useAudit, useOrgLimits, parseQuotaMeters } from '@hooks/engine/queries';
import { parseSeries, rangeDates, useUsageSeries } from '@hooks/engine/usage';
import { useStudioStatus } from '@hooks/studio/useStudioStatus';
import { useOrg } from '@/Context/OrgContext';
import { SetupChecklist } from './SetupChecklist';

import {
  TwoColumn,
  ChartWrap,
  ActivityList,
  ActivityRow,
  ActivityDot,
  ActivityTime,
  ActivityTitle,
  ActivityAgent,
  HealthStrip,
  HealthItem,
  HealthLabel,
  HealthValue,
  HealthMeta,
  OnboardList,
  OnboardRow,
  OnboardCheck,
  OnboardLabel,
  OnboardProgress,
} from './DashboardView.styles';

/**
 * Dashboard (ledger G-1) — every panel is a real backend value: KPI cards
 * from live agents/conversations/entitlement/quota, usage series from the
 * engine's metering, recent activity from the audit trail, health from the
 * status center, and the onboarding checklist. dashboard.json is gone.
 */

type Range = '7d' | '30d';
const rangeOptions: { value: Range; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

const stateTone = (state: string): 'success' | 'azure' | 'warning' | 'error' | 'neutral' =>
  state === 'active' ? 'success' : state === 'trial' ? 'azure' : state === 'past_due' ? 'warning' : state === 'suspended' ? 'error' : 'neutral';

export function DashboardView() {
  const { orgId } = useOrg();
  if (!orgId) {
    // Org context still resolving (e.g. cold login before ['org','home']
    // lands) — skeletons, never the "No active organization" crash (D1-01).
    // The per-panel QueryViews take over once the org resolves.
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>Dashboard</ViewTitle>
          <ViewSubtitle>
            Your agents, usage, and platform health — measured, not estimated.
          </ViewSubtitle>
        </ViewHeader>
        <KpiGrid>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} $h="88px" $r="12px" />
          ))}
        </KpiGrid>
        <Skeleton $h="260px" $r="12px" />
      </ViewShell>
    );
  }
  return <DashboardContent />;
}

function DashboardContent() {
  const [range, setRange] = useState<Range>('30d');
  const dates = rangeDates(range);

  const assistants = useAssistants();
  const conversations = useConversations();
  const entitlements = useEntitlements();
  const limits = useOrgLimits();
  const status = useStudioStatus();
  const audit = useAudit({ limit: 6 });
  const onboarding = useOnboarding();
  const series = useUsageSeries('agent_studio', dates);
  const { name: orgName } = useOrg();

  const meters = parseQuotaMeters(limits.data, 'agent_studio');
  const spendMeter = meters.find((m) => m.label.toLowerCase().includes('spend') || m.label.toLowerCase().includes('usd'));
  const onboardingItems = onboarding.data?.items ?? [];
  const onboardingLeft = onboardingItems.filter((item) => !item.done);
  const activation = onboarding.data?.activation;
  const showOnboarding = onboardingItems.length > 0 && onboardingLeft.length > 0;

  const activationLabel = (() => {
    if (!activation) {
      return null;
    }
    if (activation.activated && activation.firstActivationAt) {
      const ms = Date.parse(activation.firstActivationAt);
      const when = Number.isNaN(ms)
        ? ''
        : ` · ${new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
      return `First value achieved${when}`;
    }
    if (activation.activated) {
      return 'First value achieved';
    }
    return 'First value — run any assistant to activate';
  })();

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>{orgName ?? 'Dashboard'}</ViewTitle>
        <ViewSubtitle>
          Your agents, usage, and platform health — measured, not estimated.
        </ViewSubtitle>
      </ViewHeader>

      {/*
        D1-09: the server checklist used to render nothing while pending or on
        error — a first-run user on a failing backend never learned it exists.
        Skeleton while loading, honest error + retry on failure.
      */}
      {onboarding.isPending ? (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Skeleton $h="180px" $r="12px" />
        </motion.div>
      ) : onboarding.isError ? (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Panel
            title="Get set up"
            subtitle="Finish these to put your agents to work"
            flush
          >
            <ErrorState
              message={onboarding.error instanceof Error ? onboarding.error.message : 'Could not load the setup checklist.'}
              onRetry={() => void onboarding.refetch()}
            />
          </Panel>
        </motion.div>
      ) : showOnboarding ? (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Panel
            title="Get set up"
            subtitle="Finish these to put your agents to work"
            action={<OnboardProgress>{onboardingItems.length - onboardingLeft.length} of {onboardingItems.length} done</OnboardProgress>}
            flush
          >
            <OnboardList>
              {onboardingItems.map((item) => (
                <OnboardRow key={item.id}>
                  <OnboardCheck $done={item.done} aria-hidden="true">
                    {item.done ? <CheckCircle2 size={16} strokeWidth={1.7} /> : <Circle size={16} strokeWidth={1.7} />}
                  </OnboardCheck>
                  <OnboardLabel $done={item.done}>{item.label}</OnboardLabel>
                  {!item.done && item.href && <LinkAction to={item.href}>Set up</LinkAction>}
                </OnboardRow>
              ))}
              {activation && activationLabel && (
                <OnboardRow key="first-value">
                  <OnboardCheck $done={activation.activated} aria-hidden="true">
                    {activation.activated ? <CheckCircle2 size={16} strokeWidth={1.7} /> : <Circle size={16} strokeWidth={1.7} />}
                  </OnboardCheck>
                  <OnboardLabel $done={activation.activated}>{activationLabel}</OnboardLabel>
                </OnboardRow>
              )}
            </OnboardList>
          </Panel>
        </motion.div>
      ) : null}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SetupChecklist />
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <KpiGrid>
          <QueryView query={assistants} skeleton={<Skeleton $h="88px" $r="12px" />}>
            {(data) => (
              <KpiCardWrap>
                <KpiCardLabel>Agents</KpiCardLabel>
                {/* D1-10: a genuine empty list is "None yet", not a measured 0. */}
                <KpiCardValue>{data.length === 0 ? 'None yet' : data.length}</KpiCardValue>
                <KpiCardMeta><Link to="/agent-studio/agents">Manage →</Link></KpiCardMeta>
              </KpiCardWrap>
            )}
          </QueryView>
          <QueryView query={conversations} skeleton={<Skeleton $h="88px" $r="12px" />}>
            {(data) => (
              <KpiCardWrap>
                <KpiCardLabel>Conversations</KpiCardLabel>
                {/* D1-10: "0 conversations" implies measurement; "None yet" is honest. */}
                <KpiCardValue>{data.length === 0 ? 'None yet' : data.length}</KpiCardValue>
                <KpiCardMeta><Link to="/agent-studio/conversations">Review →</Link></KpiCardMeta>
              </KpiCardWrap>
            )}
          </QueryView>
          <QueryView query={entitlements} skeleton={<Skeleton $h="88px" $r="12px" />}>
            {(data) => {
              const row = data.entitlements.find((e) => e.product === 'agent_studio');
              return (
                <KpiCardWrap>
                  <KpiCardLabel>Agent Studio</KpiCardLabel>
                  <KpiCardValue>
                    {row ? (
                      <StatusPill tone={stateTone(row.status)} dot={false}>
                        {row.status.replace('_', ' ')}
                      </StatusPill>
                    ) : (
                      <StatusPill tone="neutral" dot={false}>not enabled</StatusPill>
                    )}
                  </KpiCardValue>
                  <KpiCardMeta><Link to="/agent-studio/settings/billing">Billing →</Link></KpiCardMeta>
                </KpiCardWrap>
              );
            }}
          </QueryView>
          <QueryView query={limits} skeleton={<Skeleton $h="88px" $r="12px" />}>
            {() => {
              const meter = spendMeter ?? meters[0];
              const pct = meter && meter.limit !== null && meter.limit > 0 ? (meter.used / meter.limit) * 100 : 0;
              return (
                <KpiCardWrap>
                  <KpiCardLabel>{meter ? meter.label : 'Quota'}</KpiCardLabel>
                  <KpiCardValue>
                    {meter ? (
                      meter.limit !== null ? `${Math.min(100, Math.round(pct))}%` : meter.used.toLocaleString()
                    ) : (
                      <span style={{ opacity: 0.4 }}>—</span>
                    )}
                  </KpiCardValue>
                  {meter && meter.limit !== null && <ProgressBar value={pct} tone={pct > 85 ? 'amber' : 'azure'} />}
                  <KpiCardMeta><Link to="/agent-studio/usage">Usage →</Link></KpiCardMeta>
                </KpiCardWrap>
              );
            }}
          </QueryView>
        </KpiGrid>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
          <Panel
            title="Usage"
            subtitle={`Metered events · last ${range === '7d' ? '7' : '30'} days`}
            action={
              <Segmented
                options={rangeOptions}
                value={range}
                onChange={setRange}
                ariaLabel="Time range"
              />
            }
          >
            <ChartWrap>
              {/*
                D1-07: the chart is a QueryView like every sibling panel —
                skeleton while loading, error + retry on failure, and the
                "no usage" copy ONLY when the backend genuinely returns an
                empty series. Rendering ChartEmpty on `series.data === undefined`
                made a 500 indistinguishable from "no usage yet".
              */}
              <QueryView
                query={series}
                skeleton={<Skeleton $h="260px" $r="12px" />}
                isEmpty={(d) => {
                  const c = parseSeries(d);
                  return c.valueKeys.length === 0 || c.points.length === 0;
                }}
                empty={{
                  title: 'No usage yet',
                  description: 'Usage fills in as your agents run — see the Usage page for the full explorer.',
                }}
              >
                {(data) => {
                  const c = parseSeries(data);
                  return (
                    <StudioAreaChart
                      data={c.points}
                      series={c.valueKeys.map((key, i) => ({
                        dataKey: key,
                        name: key.replace(/_/g, ' '),
                        color: ['#8b8ff8', '#05e3a4', '#f5b942'][i % 3],
                        gradientId: `dash-grad-${key}`,
                      }))}
                      height={260}
                    />
                  );
                }}
              </QueryView>
            </ChartWrap>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
          <Panel title="Recent activity" subtitle="From the organization's audit trail" flush action={<LinkAction to="/agent-studio/activity">View all</LinkAction>}>
            <QueryView
              query={audit}
              skeleton={<Skeleton $h="200px" $r="12px" />}
              isEmpty={(d) => d.events.length === 0}
              empty={{ title: 'No activity yet', description: 'Actions land here as they happen.' }}
            >
              {(data) => (
                <ActivityList>
                  {data.events.map((e) => (
                    <ActivityRow key={e.id}>
                      <ActivityTime>{e.created_at.slice(0, 10)}</ActivityTime>
                      <ActivityDot $tone={e.action.toLowerCase().includes('delete') || e.action.toLowerCase().includes('revoke') ? 'error' : 'info'} aria-hidden="true" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <ActivityTitle>{e.action}</ActivityTitle>
                        <ActivityAgent>{e.resource_type}</ActivityAgent>
                      </div>
                    </ActivityRow>
                  ))}
                </ActivityList>
              )}
            </QueryView>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
        <Panel
          title="Your agents"
          subtitle="Definitions and publish state — telemetry lands with per-agent rollups (A-9)."
          flush
          action={<LinkAction to="/agent-studio/agents">All agents</LinkAction>}
        >
          <QueryView
            query={assistants}
            skeleton={<Skeleton $h="160px" $r="12px" />}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'No agents yet', description: 'Create one from the Agents page — templates get you there fast.' }}
          >
            {(data) => (
              <DataTable>
                <DataHead>
                  <DataCell $w="40%">Agent</DataCell>
                  <DataCell $w="20%">Status</DataCell>
                  <DataCell $w="24%">Model</DataCell>
                  <DataCell $w="16%" />
                </DataHead>
                {data.slice(0, 6).map((a) => (
                  <DataRow key={a.id} $interactive={false}>
                    <DataCell $w="40%">
                      <CellPrimary>{a.name}</CellPrimary>
                    </DataCell>
                    <DataCell $w="20%">
                      <StatusPill tone={a.status === 'live' ? 'success' : a.status === 'disabled' ? 'warning' : 'neutral'}>{a.status}</StatusPill>
                    </DataCell>
                    <DataCell $w="24%">
                      {a.model ? <CellMono>{a.model}</CellMono> : <span style={{ opacity: 0.4 }}>—</span>}
                    </DataCell>
                    <DataCell $w="16%">
                      <LinkAction to={`/agent-studio/agents/${a.id}/edit`}>Edit</LinkAction>
                    </DataCell>
                  </DataRow>
                ))}
              </DataTable>
            )}
          </QueryView>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
        <SectionTitle>
          <ActivityIcon size={14} strokeWidth={1.7} />
          Platform health
          <LinkAction to="/platform/status">Status center</LinkAction>
        </SectionTitle>
        <QueryView
          query={status}
          skeleton={<Skeleton $h="88px" $r="12px" />}
          isEmpty={(d) => d.satellites.length === 0 && d.overall === 'operational'}
          empty={{ title: 'All systems operational', description: 'No satellites registered for this organization yet.' }}
        >
          {(data) => (
            <HealthStrip>
              {data.overall === 'operational' && (
                <HealthItem>
                  <HealthLabel>Platform</HealthLabel>
                  <HealthValue>operational</HealthValue>
                  <StatusPill tone="success" dot={false}>ok</StatusPill>
                </HealthItem>
              )}
              {data.satellites.map((s) => (
                <HealthItem key={s.key}>
                  <HealthLabel>{s.key}</HealthLabel>
                  {/*
                    D1-03: headline the STATUS, not the heartbeat. The old
                    layout put `s.liveness` ("never") in the 18px headline and
                    the actual status in a small pill — a new satellite read as
                    "never" with no clear meaning. Liveness is supporting info,
                    clearly labelled; a missing heartbeat says so in words.
                  */}
                  <HealthValue>{s.status}</HealthValue>
                  <HealthMeta>
                    {s.liveness === 'never'
                      ? 'No heartbeat yet'
                      : s.liveness === 'alive'
                        ? 'Heartbeat: alive'
                        : `Heartbeat: ${s.liveness}`}
                  </HealthMeta>
                </HealthItem>
              ))}
              {data.degradedComponents.map((cname) => (
                <HealthItem key={cname}>
                  <HealthLabel>{cname}</HealthLabel>
                  <HealthValue>degraded</HealthValue>
                  <StatusPill tone="warning" dot={false}>degraded</StatusPill>
                </HealthItem>
              ))}
            </HealthStrip>
          )}
        </QueryView>
      </motion.div>
    </ViewShell>
  );
}

// ─── styled ──────────────────────────────────────────────────────────

const KpiCardWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const KpiCardLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  text-transform: capitalize;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.app.text.muted};
`;

const KpiCardValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
`;

const KpiCardMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};

  a {
    color: ${({ theme }) => theme.app.text.ghost};
    text-decoration: none;
    &:hover { color: ${({ theme }) => theme.app.text.secondary}; }
  }
`;
