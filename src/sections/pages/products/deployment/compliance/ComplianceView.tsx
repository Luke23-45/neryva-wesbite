import styled from 'styled-components';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, ViewHeaderRow } from '@components/common/ui/ViewLayout';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, ScrollText, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import compliance from '@neryva_data/products/deployment/compliance.json';
import { pageItem } from '@styles/motion';
import {
  ExportBtn,
  KpiGrid,
  SectionTitle,
  TwoColumn,
  FrameworkGrid,
  FrameworkCard,
  FrameworkTop,
  FrameworkName,
  FrameworkRenewal,
  ControlsList,
  ControlRow,
  ControlLeft,
  ControlName,
  ControlMeta,
  AuditList,
  AuditRow,
  AuditTime,
  AuditCategory,
  AuditEvent,
  AuditActor,
  ResidencyList,
  ResidencyRow,
  ResidencyLeft,
  ResidencySwatch,
  ResidencyRegion,
} from './ComplianceView.styles';

const FRAMEWORK_TONE: Record<string, 'emerald' | 'azure' | 'neutral'> = {
  compliant: 'emerald',
  in_progress: 'azure',
  not_started: 'neutral',
};

const FRAMEWORK_LABEL: Record<string, string> = {
  compliant: 'compliant',
  in_progress: 'in progress',
  not_started: 'not started',
};

const STATUS_TONE: Record<string, 'success' | 'azure' | 'warning'> = {
  passing: 'success',
  failing: 'warning',
  in_progress: 'azure',
};

const STATUS_LABEL: Record<string, string> = {
  passing: 'passing',
  failing: 'failing',
  in_progress: 'in progress',
};

const RESIDENCY_COLORS = ['#34d399', '#60a5fa', '#fbbf24'];

export function ComplianceView() {
  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewHeader><ViewTitle>Compliance</ViewTitle>
          <ViewSubtitle>
            Certifications, deployment controls, regional data residency, and an immutable audit
            trail.
          </ViewSubtitle></ViewHeader>
        <ExportBtn
          type="button"
          onClick={() => toast.success('Deployment compliance report exported')}
        >
          <Download size={13} strokeWidth={1.8} />
          Export report
        </ExportBtn>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          <MetricCard
            label="Frameworks"
            value={compliance.frameworks.filter((f) => f.status === 'compliant').length + ' / ' + compliance.frameworks.length}
            delta={{ value: '+1', positive: true }}
            footnote="fully compliant"
            spark={<Sparkline data={[2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4]} color="#34d399" />}
          />
          <MetricCard
            label="Controls passing"
            value={`${compliance.controls.filter((c) => c.status === 'passing').length} / ${compliance.controls.length}`}
            delta={{ value: '100%', positive: true }}
            footnote="active controls"
            spark={<Sparkline data={[80, 82, 84, 85, 86, 87, 88, 88, 88, 88, 88, 88]} color="#fbbf24" />}
          />
          <MetricCard
            label="Regions"
            value={compliance.residency.length.toString()}
            delta={{ value: 'global', positive: true }}
            footnote="data residency zones"
            spark={<Sparkline data={[1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3]} color="#60a5fa" />}
          />
          <MetricCard
            label="Audit events"
            value={compliance.auditLog.length.toString() + '+'}
            delta={{ value: 'today', positive: true }}
            footnote="retention 7 years"
            spark={<Sparkline data={[10, 14, 12, 18, 22, 28, 24, 32, 36, 40, 42, 48]} color="#c084fc" />}
          />
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
          Compliance frameworks
        </SectionTitle>
        <FrameworkGrid>
          {compliance.frameworks.map((f, i) => {
            const pct = f.controls > 0 ? Math.round((f.passingControls / f.controls) * 100) : 0;
            return (
              <FrameworkCard
                key={f.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 3}
              >
                <FrameworkTop>
                  <FrameworkName>
                    <ShieldCheck size={13} strokeWidth={1.7} />
                    {f.name}
                  </FrameworkName>
                  <StatusPill tone={FRAMEWORK_TONE[f.status]}>
                    {FRAMEWORK_LABEL[f.status]}
                  </StatusPill>
                </FrameworkTop>
                <FrameworkRenewal>
                  {f.renewalDate !== '—' ? `Renews ${f.renewalDate}` : 'Not yet started'}
                </FrameworkRenewal>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12.5,
                      color: 'rgba(229, 231, 235, 0.65)',
                    }}
                  >
                    <span>Controls</span>
                    <StrongNum>
                      {f.passingControls} / {f.controls}
                    </StrongNum>
                  </div>
                  <ProgressBar
                    value={pct}
                    tone={pct === 100 ? 'emerald' : pct >= 90 ? 'azure' : 'amber'}
                  />
                </div>
              </FrameworkCard>
            );
          })}
        </FrameworkGrid>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={8} style={{ flex: 1 }}>
          <Panel
            title="Deployment controls"
            subtitle="Security configurations enforced on every deployment"
            action={
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(229, 231, 235, 0.45)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Lock size={11} strokeWidth={1.7} />
                enforced
              </span>
            }
          >
            <ControlsList>
              {compliance.controls.map((c, i) => (
                <ControlRow
                  key={c.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 9}
                >
                  <ControlLeft>
                    <ControlName>{c.control}</ControlName>
                    <ControlMeta>{c.category} · reviewed {c.lastReview}</ControlMeta>
                  </ControlLeft>
                  <StatusPill tone={STATUS_TONE[c.status]}>
                    {STATUS_LABEL[c.status]}
                  </StatusPill>
                </ControlRow>
              ))}
            </ControlsList>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={18} style={{ flex: 1 }}>
          <Panel
            title="Regional residency"
            subtitle="Customer data stays in the assigned region"
            action={
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(229, 231, 235, 0.45)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Globe size={11} strokeWidth={1.7} />
                {compliance.residency.length} regions
              </span>
            }
          >
            <ResidencyList>
              {compliance.residency.map((r, i) => (
                <ResidencyRow
                  key={r.region}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 19}
                >
                  <ResidencyLeft>
                    <ResidencySwatch $color={RESIDENCY_COLORS[i % RESIDENCY_COLORS.length]} />
                    <ResidencyRegion>{r.region}</ResidencyRegion>
                  </ResidencyLeft>
                  <span style={{ fontSize: 12, color: 'rgba(229, 231, 235, 0.55)' }}>
                    {r.data}
                  </span>
                </ResidencyRow>
              ))}
            </ResidencyList>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={22}>
        <Panel
          title="Audit log"
          subtitle="Deployment, rollback, and configuration events — exported to cold storage"
          action={
            <span
              style={{
                fontSize: 11,
                color: 'rgba(229, 231, 235, 0.45)',
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ScrollText size={11} strokeWidth={1.7} />
              immutable
            </span>
          }
        >
          <AuditList>
            {compliance.auditLog.map((a, i) => (
              <AuditRow
                key={i}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 23}
              >
                <AuditTime>{a.time}</AuditTime>
                <AuditCategory $kind={a.category}>{a.category}</AuditCategory>
                <AuditEvent>{a.event}</AuditEvent>
                <AuditActor>{a.actor}</AuditActor>
              </AuditRow>
            ))}
          </AuditList>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}

const StrongNum = styled.span`
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;
