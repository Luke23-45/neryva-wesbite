import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plus, Zap, Globe, UserRound, Image as ImageIcon, BookOpen, Clock, Wrench, Pin, Ban, FlaskConical } from 'lucide-react';
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

/* ── Built-in tool chips ─────────────────────────────────────── */

const BuiltInGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const BuiltInChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 14px 0 10px;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const BuiltInIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── Catalog hero card ───────────────────────────────────────── */

const CatalogCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  overflow: hidden;
`;

const CatalogHeader = styled.div`
  padding: 20px 24px 16px;
`;

const CatalogTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
`;

const CatalogTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 18px;
  padding: 0 7px;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.muted};
`;

const CatalogSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const CatalogNote = styled.span`
  margin-left: auto;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

const CatalogBody = styled.div`
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
`;

/* ── Empty state ─────────────────────────────────────────────── */

const EmptyWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  text-align: center;
`;

const EmptyIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.link};
  margin-bottom: 20px;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const EmptyDesc = styled.p`
  margin: 0 0 24px;
  font-size: 13.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.muted};
  max-width: 420px;
`;

const CtaRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

/* ── Fact strip ──────────────────────────────────────────────── */

const FactStrip = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Fact = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const FactIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.active};
  color: ${({ theme }) => theme.app.text.muted};
  flex-shrink: 0;
`;

const FactTitle = styled.h4`
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const FactDesc = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
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
            The org tool catalog that version pins resolve against — built-ins need no row; custom tools pin by schema hash.
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
        <Panel title="Built-in tools" subtitle="Platform-implemented — no catalog row, and publish pin checks skip them.">
          <BuiltInGrid>
            {BUILT_IN_TOOLS.map((name) => {
              const Icon = {
                web_search: Globe,
                request_human_handoff: UserRound,
                generate_image: ImageIcon,
                search_knowledge: BookOpen,
                search_memory: Clock,
              }[name] ?? Wrench;
              return (
                <BuiltInChip key={name}>
                  <BuiltInIcon>
                    <Icon size={14} strokeWidth={1.8} />
                  </BuiltInIcon>
                  {name}
                </BuiltInChip>
              );
            })}
          </BuiltInGrid>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionGap>
          <CatalogCard>
            <CatalogHeader>
              <CatalogTitleRow>
                <CatalogTitle>Catalog</CatalogTitle>
                <CountBadge aria-label={`${catalog.data?.length ?? 0} tools`}>{catalog.data?.length ?? 0}</CountBadge>
                <CatalogNote>Newest 200 rows loaded · name filter searches loaded rows</CatalogNote>
              </CatalogTitleRow>
              <CatalogSubtitle>Instantiate, configure, and disable the org's tools.</CatalogSubtitle>
            </CatalogHeader>
            <CatalogBody>
            <QueryView query={catalog}>
              {(rows) => {
                // Custom empty state (not QueryView's generic) — matches SVG.
                // Filters are hidden when empty (nothing to filter).
                if (rows.length === 0) {
                  return (
                    <EmptyWrap>
                      <EmptyIconWrap>
                        <Wrench size={28} strokeWidth={1.6} />
                      </EmptyIconWrap>
                      <EmptyTitle>Catalog empty</EmptyTitle>
                      <EmptyDesc>
                        Instantiate a prebuilt tool or register a custom one —
                        version tool pins resolve against enabled rows.
                      </EmptyDesc>
                      <CtaRow>
                        <ActionButton
                          size="sm"
                          disabled={!canWrite}
                          title={canWrite ? 'Register a custom tool' : writeDenied}
                          onClick={() => canWrite && navigate({ to: '/agent-studio/tools/new' })}
                        >
                          <Plus size={14} strokeWidth={2} />
                          New tool
                        </ActionButton>
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          disabled={!canWrite}
                          title={canWrite ? 'Instantiate a prebuilt tool' : writeDenied}
                          onClick={() => canWrite && navigate({ to: '/agent-studio/tools/instantiate' })}
                        >
                          <Zap size={13} strokeWidth={1.8} />
                          From template
                        </ActionButton>
                      </CtaRow>
                    </EmptyWrap>
                  );
                }
                // Filters only render when there are rows to filter.
                return (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', padding: '16px 24px 0' }}>
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
                    {(() => {
                      const q = nameFilter.trim().toLowerCase();
                      const visible = rows.filter(
                        (tool) =>
                          (q === '' || tool.name.toLowerCase().includes(q) || (tool.description?.toLowerCase().includes(q) ?? false)) &&
                          (effectFilter === '' || tool.effectClass === effectFilter) &&
                          (approvalFilter === '' || tool.approvalRequirement === approvalFilter),
                      );
                      if (visible.length === 0) {
                        return <div style={{ padding: '0 24px 24px' }}><Muted>No tools match — loosen the filters.</Muted></div>;
                      }
                      return (
                        <div style={{ padding: '0 24px 24px' }}>
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
                        </div>
                      );
                    })()}
                  </>
                );
              }}
            </QueryView>
            </CatalogBody>
          </CatalogCard>
        </SectionGap>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
        <FactStrip>
          <Fact>
            <FactIcon>
              <Pin size={16} strokeWidth={1.8} />
            </FactIcon>
            <div>
              <FactTitle>Schema-hash pins</FactTitle>
              <FactDesc>
                Publish refuses missing, disabled, or stale rows — refresh via the re-pin flow.
              </FactDesc>
            </div>
          </Fact>
          <Fact>
            <FactIcon>
              <Ban size={16} strokeWidth={1.8} />
            </FactIcon>
            <div>
              <FactTitle>Disable is removal</FactTitle>
              <FactDesc>
                Tools can't be deleted; disabling breaks version pins referencing the row.
              </FactDesc>
            </div>
          </Fact>
          <Fact>
            <FactIcon>
              <FlaskConical size={16} strokeWidth={1.8} />
            </FactIcon>
            <div>
              <FactTitle>No dry run</FactTitle>
              <FactDesc>
                Bad URLs or wrong schemas surface only when a run calls the tool.
              </FactDesc>
            </div>
          </Fact>
        </FactStrip>
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
