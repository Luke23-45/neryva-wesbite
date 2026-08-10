import { motion } from 'framer-motion';
import { ShieldCheck, Download, Globe, ListChecks, FileCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import compliance from '@neryva_data/products/agent_studio/compliance.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  ExportBtn,
  FrameworkGrid,
  FrameworkCard,
  FrameworkTop,
  FrameworkName,
  FrameworkRenewal,
  FrameworkControls,
  ControlsLabel,
  ControlsValue,
  TwoColumn,
  ControlsTable,
  TableHeader,
  TableRow,
  Cell,
  ControlName,
  ControlCategory,
  ResidencyList,
  ResidencyRow,
  ResidencyLeft,
  ResidencyRegion,
  ResidencyData,
  AuditList,
  AuditRow,
  AuditTime,
  AuditCategory,
  AuditEvent,
  AuditActor,
} from './ComplianceView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 },
  }),
};

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

export function ComplianceView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Compliance</PageTitle>
          <PageSubtitle>
            Certifications, controls, data residency, and audit log. Export reports for auditors
            and security reviews.
          </PageSubtitle>
        </TitleBlock>
        <ExportBtn
          type="button"
          onClick={() => toast.success('Compliance report exported')}
        >
          <Download size={13} strokeWidth={1.8} />
          Export report
        </ExportBtn>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <FrameworkGrid>
          {compliance.frameworks.map((f, i) => {
            const pct = f.controls > 0 ? Math.round((f.passingControls / f.controls) * 100) : 0;
            return (
              <FrameworkCard
                key={f.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 2}
              >
                <FrameworkTop>
                  <FrameworkName>
                    <ShieldCheck size={14} strokeWidth={1.7} />
                    {f.name}
                  </FrameworkName>
                  <StatusPill tone={FRAMEWORK_TONE[f.status]}>
                    {FRAMEWORK_LABEL[f.status]}
                  </StatusPill>
                </FrameworkTop>
                <FrameworkRenewal>
                  {f.renewalDate !== '—' ? `Renews ${f.renewalDate}` : 'Not yet started'}
                </FrameworkRenewal>
                <FrameworkControls>
                  <ControlsLabel>
                    <span>Controls</span>
                    <ControlsValue>
                      {f.passingControls} / {f.controls}
                    </ControlsValue>
                  </ControlsLabel>
                  <ProgressBar
                    value={pct}
                    tone={pct === 100 ? 'emerald' : pct >= 90 ? 'azure' : 'amber'}
                  />
                </FrameworkControls>
              </FrameworkCard>
            );
          })}
        </FrameworkGrid>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8} style={{ flex: 1 }}>
          <Panel
            title="Active controls"
            subtitle="Real-time status across security categories"
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
                <ListChecks size={11} strokeWidth={1.7} />
                {compliance.controls.length} total
              </span>
            }
          >
            <ControlsTable>
              <TableHeader>
                <Cell $w="56%">Control</Cell>
                <Cell $w="24%">Category</Cell>
                <Cell $w="20%">Status</Cell>
              </TableHeader>
              {compliance.controls.map((c, i) => (
                <TableRow
                  key={c.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 9}
                >
                  <Cell $w="56%">
                    <ControlName>{c.control}</ControlName>
                    <ControlCategory>reviewed {c.lastReview}</ControlCategory>
                  </Cell>
                  <Cell $w="24%">
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        color: 'rgba(229, 231, 235, 0.65)',
                      }}
                    >
                      {c.category}
                    </span>
                  </Cell>
                  <Cell $w="20%">
                    <StatusPill tone={STATUS_TONE[c.status]}>
                      {STATUS_LABEL[c.status]}
                    </StatusPill>
                  </Cell>
                </TableRow>
              ))}
            </ControlsTable>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={18} style={{ flex: 1 }}>
          <Panel
            title="Data residency"
            subtitle="Where your data is stored by region"
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
                  variants={fadeUp}
                  custom={i + 19}
                >
                  <ResidencyLeft>
                    <ResidencyRegion>{r.region}</ResidencyRegion>
                    <ResidencyData>{r.data}</ResidencyData>
                  </ResidencyLeft>
                  <StatusPill tone="success">in region</StatusPill>
                </ResidencyRow>
              ))}
            </ResidencyList>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background: 'rgba(52, 211, 153, 0.06)',
                border: '1px solid rgba(52, 211, 153, 0.20)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <FileCheck2 size={14} strokeWidth={1.7} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(229, 231, 235, 0.78)' }}>
                Customer data never leaves the assigned region. Backups are encrypted and replicated
                across availability zones within the same jurisdiction.
              </div>
            </div>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={23}>
        <Panel
          title="Audit log"
          subtitle="Compliance-related events — exported daily to immutable cold storage"
          action={
            <span
              style={{
                fontSize: 11,
                color: 'rgba(229, 231, 235, 0.45)',
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              retained 7 years
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
                variants={fadeUp}
                custom={i + 24}
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
    </PageRoot>
  );
}
