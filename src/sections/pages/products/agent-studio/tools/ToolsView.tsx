import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plus, Wrench, Zap } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
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
  useToolTemplates,
  useUpsertTool,
  useToolFromTemplate,
  useSetToolEnabled,
  TOOL_EFFECT_CLASSES,
  TOOL_APPROVAL_REQUIREMENTS,
  TOOL_NAME_PATTERN,
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
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  const catalog = useToolCatalog();
  const setEnabled = useSetToolEnabled();

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [fromTemplateOpen, setFromTemplateOpen] = useState(false);
  // C06: filters, expanded drawer row, edit target, per-row pending (one
  // toggle must never freeze the whole column).
  const [nameFilter, setNameFilter] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
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
          <ActionButton variant="secondary" size="sm" disabled={!canWrite} title={canWrite ? 'Instantiate a prebuilt tool' : writeDenied} onClick={() => setFromTemplateOpen(true)}>
            <Zap size={13} strokeWidth={1.8} />
            From template
          </ActionButton>
          <ActionButton size="sm" disabled={!canWrite} title={canWrite ? 'Register a custom tool' : writeDenied} onClick={() => setUpsertOpen(true)}>
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
                          <ActionButton variant="ghost" size="sm" disabled={!canWrite} title={canWrite ? `Edit ${tool.name}` : writeDenied} onClick={() => { setEditTarget(tool.name); setUpsertOpen(true); }}>
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

      <UpsertModal
        key={editTarget ?? 'new'}
        open={upsertOpen}
        onClose={() => { setUpsertOpen(false); setEditTarget(null); }}
        initial={(catalog.data ?? []).find((t) => t.name === editTarget) ?? null}
      />
      <FromTemplateModal
        open={fromTemplateOpen}
        onClose={() => setFromTemplateOpen(false)}
      />
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
        <SectionGap>
          <Panel title="Pin discipline" subtitle="How versions stay reproducible.">
            <Note>
              Version tool entries carry <Mono>schema_hash</Mono> pins. Publish refuses entries referencing a missing or disabled
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

function UpsertModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: { name: string; version: string | null; description: string | null; effectClass: string | null; approvalRequirement: string | null; inputSchema: Record<string, unknown> | null } | null }) {
  const upsert = useUpsertTool();
  const editing = initial !== null && initial !== undefined;
  const [name, setName] = useState(initial?.name ?? '');
  const [version, setVersion] = useState(initial?.version ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [effectClass, setEffectClass] = useState<string>(initial?.effectClass ?? 'READ_ONLY');
  const [approval, setApproval] = useState<string>(initial?.approvalRequirement ?? 'NONE');
  const [inputSchema, setInputSchema] = useState(
    initial?.inputSchema ? JSON.stringify(initial.inputSchema, null, 2) : '{\n  "type": "object",\n  "properties": {},\n  "additionalProperties": false\n}',
  );

  const normalized = name.trim().toLowerCase();
  const nameProblem = !normalized ? 'Name is required.' : !TOOL_NAME_PATTERN.test(normalized) ? 'Must match ^[a-z][a-z0-9_]{1,63}$ (letter first, 2–64 chars).' : null;
  let schemaProblem: string | null = null;
  let schemaParsed: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(inputSchema);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      schemaProblem = 'Must be a JSON Schema object.';
    } else {
      schemaParsed = parsed as Record<string, unknown>;
    }
  } catch {
    schemaProblem = 'Must be valid JSON.';
  }

  const valid = !nameProblem && !schemaProblem;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit tool ${initial?.name ?? ''}` : 'Register a tool'}
      width={600}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!valid || upsert.isPending}
            onClick={() => {
              if (!schemaParsed) {
                return;
              }
              upsert.mutate(
                {
                  name: normalized,
                  effectClass,
                  approvalRequirement: approval,
                  inputSchema: schemaParsed,
                  ...(version.trim() ? { version: version.trim() } : {}),
                  ...(description.trim() ? { description: description.trim() } : {}),
                },
                { onSuccess: () => onClose() },
              );
            }}
          >
            <Wrench size={13} strokeWidth={1.8} />
            Save tool
          </ActionButton>
        </>
      }
    >
      {editing && (
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          Saving updates the row in place, re-enables it, and re-hashes — pinned versions drift until re-pinned.
        </p>
      )}
      <TextInput label="Name (path-authoritative, lowercased)" value={name} onChange={(e) => setName(e.target.value)} placeholder="lookup_ticket" autoFocus={!editing} disabled={editing} error={nameProblem ?? undefined} />
      <div style={{ marginTop: 12 }}>
        <TextInput label="Version (bump on breaking schema changes)" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
      </div>
      <div style={{ marginTop: 12 }}>
        <TextInput label="Description (optional, ≤2048)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this tool does" />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <label style={{ flex: 1, fontSize: 13 }}>
          Effect class
          <select value={effectClass} onChange={(e) => setEffectClass(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
            {TOOL_EFFECT_CLASSES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1, fontSize: 13 }}>
          Approval requirement
          <select value={approval} onChange={(e) => setApproval(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
            {TOOL_APPROVAL_REQUIREMENTS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <TextArea label="Input schema (JSON Schema object)" value={inputSchema} onChange={(e) => setInputSchema(e.target.value)} rows={8} />
        {schemaProblem && <p style={{ fontSize: 12, color: '#f87171' }}>{schemaProblem}</p>}
      </div>
    </Modal>
  );
}

function FromTemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const templates = useToolTemplates();
  const instantiate = useToolFromTemplate();
  const [templateId, setTemplateId] = useState('');
  const [url, setUrl] = useState('');
  const [credential, setCredential] = useState('');
  const [rateLimit, setRateLimit] = useState('');

  const urlProblem = !url.trim() ? 'An https URL is required.' : !/^https:\/\//.test(url.trim()) ? 'Must be an https URL.' : null;
  const rateTrimmed = rateLimit.trim();
  const rateProblem = rateTrimmed === '' ? null : !Number.isFinite(Number(rateTrimmed)) || Number(rateTrimmed) < 1 ? 'Must be a number ≥ 1.' : null;
  const valid = templateId !== '' && !urlProblem && !rateProblem;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Instantiate from template"
      width={560}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!valid || instantiate.isPending}
            onClick={() => {
              const rate = rateLimit.trim() === '' ? undefined : Number(rateLimit);
              instantiate.mutate(
                {
                  templateId,
                  url: url.trim(),
                  ...(credential.trim() ? { credential: credential.trim() } : {}),
                  ...(rate !== undefined && Number.isFinite(rate) ? { rateLimitPerRun: Math.max(1, Math.round(rate)) } : {}),
                },
                { onSuccess: () => onClose() },
              );
            }}
          >
            <Zap size={13} strokeWidth={1.8} />
            Instantiate
          </ActionButton>
        </>
      }
    >
      {templates.isPending ? (
        <Muted>Loading templates…</Muted>
      ) : (templates.data ?? []).length === 0 ? (
        <Muted>No prebuilt tool templates published.</Muted>
      ) : (
        <label style={{ fontSize: 13 }}>
          Template
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
            <option value="">Pick a template…</option>
            {(templates.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.effectClass} / {t.approvalRequirement}
              </option>
            ))}
          </select>
        </label>
      )}
      <div style={{ marginTop: 12 }}>
        <TextInput label="Endpoint URL (https)" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" error={url.trim() ? (urlProblem ?? undefined) : undefined} />
      </div>
      <div style={{ marginTop: 12 }}>
        <TextInput
          label="Credential (optional — sealed per-tool, never in the manifest)"
          type="password"
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
          placeholder="…"
          autoComplete="off"
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <TextInput label="Rate limit per run (optional)" type="number" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} placeholder="unset = platform cap" error={rateTrimmed ? (rateProblem ?? undefined) : undefined} />
      </div>
    </Modal>
  );
}
