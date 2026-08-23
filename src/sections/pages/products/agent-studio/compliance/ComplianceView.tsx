import { motion } from 'framer-motion';
import { ShieldCheck, Download, Globe, ListChecks, FileCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import compliance from '@neryva_data/products/agent_studio/compliance.json';
import {
  FrameworkGrid,
  FrameworkCard,
  FrameworkTop,
  FrameworkName,
  FrameworkRenewal,
  FrameworkControls,
  ControlsLabel,
  ControlsValue,
  TwoColumn,
  ControlName,
  ControlCategory,
  ResidencyList,
  ResidencyRow,
  ResidencyLeft,
  ResidencyRegion,
  ResidencyData,
  ResidencyNote,
  ResidencyNoteIcon,
  ResidencyNoteText,
  AuditTime,
  AuditCategory,
  AuditEvent,
  AuditActor,
  MetaHint,
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

export function ComplianceView() {
  return (
    <ViewShell>
      <ViewHeaderRow
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={pageItem}
        custom={0}
      >
        <ViewHeader>
          <ViewTitle>Compliance</ViewTitle>
          <ViewSubtitle>
            Certifications, controls, data residency, and audit log. Export reports for auditors
            and security reviews.
          </ViewSubtitle>
        </ViewHeader>
        <ActionButton variant="secondary" size="sm" onClick={() => toast.success('Compliance report exported')}>
          <Download size={13} strokeWidth={1.8} />
          Export report
        </ActionButton>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
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
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={8}>
          <Panel
            title="Active controls"
            subtitle="Real-time status across security categories"
            flush
            action={
              <MetaHint>
                <ListChecks size={11} strokeWidth={1.7} />
                {compliance.controls.length} total
              </MetaHint>
            }
          >
            <DataTable>
              <DataHead>
                <DataCell $w="56%">Control</DataCell>
                <DataCell $w="24%">Category</DataCell>
                <DataCell $w="20%">Status</DataCell>
              </DataHead>
              {compliance.controls.map((c, i) => (
                <DataRow
                  key={c.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 9}
                  $interactive={false}
                >
                  <DataCell $w="56%">
                    <ControlName>{c.control}</ControlName>
                    <ControlCategory>reviewed {c.lastReview}</ControlCategory>
                  </DataCell>
                  <DataCell $w="24%">
                    <ControlCategory>{c.category}</ControlCategory>
                  </DataCell>
                  <DataCell $w="20%">
                    <StatusPill tone={STATUS_TONE[c.status]}>
                      {STATUS_LABEL[c.status]}
                    </StatusPill>
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={18}>
          <Panel
            title="Data residency"
            subtitle="Where your data is stored by region"
            action={
              <MetaHint>
                <Globe size={11} strokeWidth={1.7} />
                {compliance.residency.length} regions
              </MetaHint>
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
                    <ResidencyRegion>{r.region}</ResidencyRegion>
                    <ResidencyData>{r.data}</ResidencyData>
                  </ResidencyLeft>
                  <StatusPill tone="success">in region</StatusPill>
                </ResidencyRow>
              ))}
            </ResidencyList>

            <ResidencyNote>
              <ResidencyNoteIcon>
                <FileCheck2 size={14} strokeWidth={1.7} />
              </ResidencyNoteIcon>
              <ResidencyNoteText>
                Customer data never leaves the assigned region. Backups are encrypted and
                replicated across availability zones within the same jurisdiction.
              </ResidencyNoteText>
            </ResidencyNote>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={23}>
        <Panel
          title="Audit log"
          subtitle="Compliance-related events — exported daily to immutable cold storage"
          flush
          action={<MetaHint>retained 7 years</MetaHint>}
        >
          <DataTable>
            {compliance.auditLog.map((a, i) => (
              <DataRow
                key={`${a.time}-${i}`}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 24}
                $interactive={false}
              >
                <AuditTime>{a.time}</AuditTime>
                <AuditCategory $kind={a.category}>{a.category}</AuditCategory>
                <AuditEvent>{a.event}</AuditEvent>
                <AuditActor>{a.actor}</AuditActor>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
