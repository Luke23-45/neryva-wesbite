import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plus, Zap } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import {
  useToolCatalog,
  useSetToolEnabled,
  TOOL_EFFECT_CLASSES,
  TOOL_APPROVAL_REQUIREMENTS,
  BUILT_IN_TOOLS,
} from '@hooks/studio/useSetupTools';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

const SectionGap = styled.div`
  margin-top: 18px;
`;

const Note = styled.p`
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.8;
`;

/**
 * Inline switch + visible text pair — used where the switch's own label is
 * the control's only visible label. The Switch component renders no visible
 * label text (label prop = accessible name only), so the visible copy lives
 * here. The text is a <label htmlFor> (sibling, never wrapping) so it stays
 * clickable without double-activation.
 */
const SwitchPair = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const SwitchText = styled.label<{ $disabled?: boolean }>`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
`;

const effectTone: Record<string, StatusTone> = {
  READ_ONLY: 'success',
  MUTATING: 'warning',
  DESTRUCTIVE: 'error',
};

/** Compact perimeter cell (C06): effective env + egress count, never a default claim. */
function PerimeterCell({ tool }: { tool: { executionEnvironment: string | null; allowedEgressDomains: string[] | null } }) {
  const env = tool.executionEnvironment;
  const short = env === 'in_process' ? 'in-proc' : env === 'sandboxed_microvm' ? 'microvm' : env === 'external_gateway' ? 'gateway' : null;
  if (!short) {
    return <Muted title="Catalog default — historical posture (external_gateway), resolving…">—</Muted>;
  }
  const egress = tool.allowedEgressDomains;
  return (
    <span title={env === 'in_process' ? 'in_process — no egress surface' : `egress: ${(egress ?? []).join(', ') || 'none declared'}`}>
      <Mono>{short}</Mono>
      {env !== 'in_process' && <Muted> · {egress === null ? '…' : `${egress.length} host${egress.length === 1 ? '' : 's'}`}</Muted>}
    </span>
  );
}

export function ToolsView() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  // A4-64 — disabled rows must stay reachable (re-enable path). The engine
  // serves `?include_disabled=true` (b43838e; live after an engine restart).
  const [showDisabled, setShowDisabled] = useState(false);
  const catalog = useToolCatalog({ includeDisabled: showDisabled });
  const setEnabled = useSetToolEnabled();

  // C06: filters, expanded drawer row, edit target, per-row pending (one
  // toggle must never freeze the whole column).
  const [nameFilter, setNameFilter] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Tools</ViewTitle>
          <ViewSubtitle>
            The org tool catalog versions pin against — built-ins need no row, everything else pins an enabled entry by schema hash.
          </ViewSubtitle>
        </ViewHeader>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionButton variant="secondary" size="sm" disabled={!canWrite} title={canWrite ? 'Instantiate a prebuilt tool' : writeDenied} onClick={() => navigate({ to: '/agent-studio/tools/instantiate' })}>
            <Zap size={13} strokeWidth={1.8} />
            From template
          </ActionButton>
          <ActionButton size="sm" disabled={!canWrite} title={canWrite ? 'Register a custom tool' : writeDenied} onClick={() => navigate({ to: '/agent-studio/tools/new' })}>
            <Plus size={14} strokeWidth={2} />
            New tool
          </ActionButton>
        </div>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Built-in tools" subtitle="Platform-implemented — publish pin checks skip them, no catalog row needed.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BUILT_IN_TOOLS.map((name) => (
              <StatusPill key={name} tone="neutral" dot={false}>
                <Mono>{name}</Mono>
              </StatusPill>
            ))}
          </div>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionGap>
          <Panel title="Catalog" subtitle="Effect class is orthogonal to approval. Disabling breaks version pins referencing the row.">
            <Note style={{ marginTop: 0 }}>
              Lists the newest 200 rows — the name filter searches the loaded rows. There is no tool-scoped dry run:
              a misconfigured binding (bad URL, wrong schema) surfaces only when an agent run tries to call it.
              Tools can’t be deleted — disabling a tool is the only removal path.
            </Note>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 180px' }}>
                <TextInput aria-label="Filter tools" placeholder="Filter by name…" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
              </div>
              <label style={{ fontSize: 13 }}>
                Effect
                <select value={effectFilter} onChange={(e) => setEffectFilter(e.target.value)} style={{ display: 'block', marginTop: 4 }}>
                  <option value="">All effects</option>
                  {TOOL_EFFECT_CLASSES.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                Approval
                <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} style={{ display: 'block', marginTop: 4 }}>
                  <option value="">All approvals</option>
                  {TOOL_APPROVAL_REQUIREMENTS.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
                <SwitchPair>
                  <Switch
                    checked={showDisabled}
                    onChange={setShowDisabled}
                    label="Show disabled tools"
                    id="show-disabled-tools"
                  />
                  <SwitchText htmlFor="show-disabled-tools">Show disabled tools</SwitchText>
                </SwitchPair>
              </div>
            </div>
            <QueryView
              query={catalog}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'Catalog empty', description: 'Instantiate a prebuilt tool or register a custom one — version tool pins resolve against enabled rows.' }}
            >
              {(rows) => {
                const q = nameFilter.trim().toLowerCase();
                const visible = rows.filter(
                  (tool) =>
                    (q === '' || tool.name.toLowerCase().includes(q) || (tool.description?.toLowerCase().includes(q) ?? false)) &&
                    (effectFilter === '' || tool.effectClass === effectFilter) &&
                    (approvalFilter === '' || tool.approvalRequirement === approvalFilter),
                );
                if (visible.length === 0) {
                  return <Muted>No tools match — loosen the filters.</Muted>;
                }
                return (
                <DataTable>
                  <DataHead>
                    <DataCell $w="18%">Name</DataCell>
                    <DataCell $w="8%">Version</DataCell>
                    <DataCell $w="12%">Effect</DataCell>
                    <DataCell $w="12%">Approval</DataCell>
                    <DataCell $w="12%">Schema hash</DataCell>
                    <DataCell $w="14%">Perimeter</DataCell>
                    <DataCell $w="12%">Enabled</DataCell>
                    <DataCell $w="12%">Pin</DataCell>
                  </DataHead>
                  {visible.map((tool, i) => (
                    <DataRow key={tool.name} as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={i + 3} $interactive={false}>
                      <DataCell $w="18%">
                        <Mono>{tool.name}</Mono>
                        {tool.description && <div><Muted>{tool.description.slice(0, 80)}</Muted></div>}
                        <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                          <ActionButton variant="ghost" size="sm" onClick={() => setExpanded((prev) => (prev === tool.name ? null : tool.name))}>
                            {expanded === tool.name ? 'Hide' : 'Detail'}
                          </ActionButton>
                          <ActionButton variant="ghost" size="sm" disabled={!canWrite} title={canWrite ? `Edit ${tool.name}` : writeDenied} onClick={() => navigate({ to: '/agent-studio/tools/$toolId/edit', params: { toolId: tool.name } })}>
                            Edit
                          </ActionButton>
                        </div>
                      </DataCell>
                      <DataCell $w="8%">
                        <Mono>{tool.version ?? '—'}</Mono>
                      </DataCell>
                      <DataCell $w="12%">
                        <StatusPill tone={effectTone[tool.effectClass ?? ''] ?? 'neutral'} dot={false}>
                          {tool.effectClass ?? '—'}
                        </StatusPill>
                      </DataCell>
                      <DataCell $w="12%">
                        <Mono>{tool.approvalRequirement ?? '—'}</Mono>
                      </DataCell>
                      <DataCell $w="12%">
                        <Mono title={tool.hash ?? undefined}>{tool.hash ? `${tool.hash.slice(0, 12)}…` : '—'}</Mono>
                      </DataCell>
                      <DataCell $w="14%">
                        <PerimeterCell tool={tool} />
                      </DataCell>
                      <DataCell $w="12%">
                        <span title={canGovern ? `Toggle ${tool.name}` : governDenied}>
                          <SwitchPair>
                            <Switch
                              checked={tool.enabled === true}
                              disabled={!canGovern || (setEnabled.isPending && pendingName === tool.name)}
                              label={`Enable ${tool.name}`}
                              id={`enable-${tool.name}`}
                              onChange={(next) => {
                                if (!next) {
                                  toast(`Disabling ${tool.name} breaks version pins referencing it — publish will refuse until re-pinned.`);
                                }
                                setPendingName(tool.name);
                                setEnabled.mutate(
                                  { name: tool.name, enabled: next },
                                  { onSettled: () => setPendingName((prev) => (prev === tool.name ? null : prev)) },
                                );
                              }}
                            />
                            <SwitchText
                              htmlFor={`enable-${tool.name}`}
                              $disabled={!canGovern || (setEnabled.isPending && pendingName === tool.name)}
                            >
                              Enable {tool.name}
                            </SwitchText>
                          </SwitchPair>
                        </span>
                      </DataCell>
                      <DataCell $w="12%">
                        <CopyPinButton hash={tool.hash} />
                      </DataCell>
                    </DataRow>
                  ))}
                  {expanded && (() => {
                    const tool = visible.find((t) => t.name === expanded);
                    if (!tool) return null;
                    return (
                      <DataRow key={`${tool.name}:detail`} $interactive={false}>
                        <DataCell $w="100%">
                          <div style={{ fontSize: 13, fontWeight: 600 }}><Mono>{tool.name}</Mono> — row detail</div>
                          {tool.description && <Note>{tool.description}</Note>}
                          <Note>
                            Full hash: <Mono>{tool.hash ?? '—'}</Mono>
                          </Note>
                          <Note>
                            Perimeter: <Mono>{tool.executionEnvironment ?? 'catalog default (external_gateway posture)'}</Mono>
                            {' · '}egress: {(tool.allowedEgressDomains ?? []).join(', ') || 'none declared'}
                            {tool.bindingHost ? ` · binding host ${tool.bindingHost}` : ''}
                            {tool.rateLimitPerRun !== null && tool.rateLimitPerRun !== undefined ? ` · rate limit ${tool.rateLimitPerRun}/run` : ''}
                          </Note>
                          <Note>Versions pin this row by schema hash — editing the schema re-hashes and drifts pins until re-pinned.</Note>
                        </DataCell>
                      </DataRow>
                    );
                  })()}
                </DataTable>
                );
              }}
            </QueryView>
          </Panel>
        </SectionGap>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
        <SectionGap>
          <Panel title="Pin discipline" subtitle="How versions stay reproducible.">
            <Note>
              Version tool entries carry{' '}<Mono>schema_hash</Mono>{' '}pins. Publish refuses entries referencing a missing or disabled
              row, and stale hashes refuse with a re-pin flow — refresh the pin from the hash shown here. Effectful-without-approval
              rows (MUTATING/DESTRUCTIVE with approval NONE) are legal but linted in the editor; approval REQUIRED on the catalog row
              escalates at authorize time regardless of the version entry.
            </Note>
          </Panel>
        </SectionGap>
      </motion.div>
    </ViewShell>
  );
}

function CopyPinButton({ hash }: { hash: string | null }) {
  if (!hash) {
    return <Muted>—</Muted>;
  }
  return (
    <ActionButton
      variant="ghost"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(hash).then(
          () => toast.success('Schema hash copied — paste it as the version pin'),
          () => toast.error('Copy failed — select the hash manually'),
        );
      }}
    >
      Copy pin
    </ActionButton>
  );
}
