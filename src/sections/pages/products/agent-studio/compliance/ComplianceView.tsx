import { useState } from 'react';

import toast from 'react-hot-toast';

import styled from 'styled-components';

import { motion } from 'framer-motion';

import { ShieldCheck, Download, Globe, FileCheck2, Link as LinkIcon, Undo2 } from 'lucide-react';

import { Panel } from '@components/common/ui/Panel';

import { StatusPill } from '@components/common/ui/StatusPill';

import { ActionButton } from '@components/common/ui/ActionButton';

import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';

import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';

import { QueryView } from '@components/common/ui/AsyncStates';

import { Modal } from '@components/common/ui/Modal';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle, SectionTitle } from '@components/common/ui/ViewLayout';

import {

  DataTable,

  DataHead,

  DataRow,

  DataCell,

  CellMono,

  CellMeta,

  CellPrimary,

} from '@components/common/ui/DataTable';

import { pageItem } from '@styles/motion';

import { useOrgProfile } from '@hooks/engine/queries';

import { useAudit } from '@hooks/engine/queries';

import {

  useExports,

  useLegalHolds,

  useRequestExport,

  useDownloadExport,

} from '@hooks/studio/useLifecycle';

import {

  useConfigDraft,

  useConfigHistory,

  useConfigDelivery,

  useValidateConfigDraft,

  useSaveConfigDraft,

  usePublishConfig,

  useRollbackConfig,

  useDeleteConfigDraft,

  CONFIG_SCOPES,

  type ConfigVersion,

  type ConfigScope,

} from '@hooks/studio/useConfigLifecycle';

import { useConversations } from '@hooks/studio/useStudioConversations';



import {






  ResidencyList,

  ResidencyRow,

  ResidencyLeft,

  ResidencyRegion,

  ResidencyData,

  ResidencyNote,

  ResidencyNoteIcon,

  ResidencyNoteText,

} from './ComplianceView.styles';



/**

 * Governance hub (ledger G-5/G-7) — the real plane:

 * - Audit trail: links to the live activity page (G-2 wired it)

 * - Data exports: GDPR/DSR via the engine lifecycle module

 * - Legal holds: hold status from the lifecycle module

 * - Data residency: real region from the org profile

 * - Config lifecycle: draft → validate → publish → rollback (G-7)

 *

 * Framework cards (SOC 2, GDPR) are attestations — they reference

 * certifications, not fabricated live status. The fake controls table and

 * hardcoded residency rows from compliance.json are gone.

 */









export function ComplianceView() {

  const profile = useOrgProfile();

  const audit = useAudit({ limit: 8 });

  const exports = useExports();

  const legalHolds = useLegalHolds();

  const requestExport = useRequestExport();

  const downloadExport = useDownloadExport();

  const [exportConfirm, setExportConfirm] = useState(false);
  const [exportSelection, setExportSelection] = useState<string[]>([]);



  const region = profile.data?.org.region ?? null;



  return (

    <ViewShell>

      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>

        <ViewHeader>

          <ViewTitle>Compliance</ViewTitle>

          <ViewSubtitle>

            Data residency, DSR exports, and the governance config plane.

          </ViewSubtitle>

        </ViewHeader>

      </ViewHeaderRow>





      {/* ─── Data residency ─── */}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>

        <SectionTitle>Data residency</SectionTitle>

        <Panel>

          <QueryView query={profile} skeleton={<Skeleton $h="72px" $r="10px" />} isEmpty={(d) => !d.org.region} empty={{ title: 'No region set', description: 'Set a region in Settings → Workspace to pin your data residency.' }}>

            {() => (

              <ResidencyList>

                <ResidencyRow>

                  <ResidencyLeft>

                    <ResidencyRegion>{region}</ResidencyRegion>

                    <ResidencyData>Agent data, transcripts, and knowledge indexes are stored in this region.</ResidencyData>

                  </ResidencyLeft>

                  <StatusPill tone="emerald" dot={false}>

                    <Globe size={11} strokeWidth={1.8} /> pinned

                  </StatusPill>

                </ResidencyRow>

              </ResidencyList>

            )}

          </QueryView>

          <ResidencyNote>

            <ResidencyNoteIcon aria-hidden="true"><Globe size={13} strokeWidth={1.8} /></ResidencyNoteIcon>

            <ResidencyNoteText>

              Region is set at the organization level — change it in Settings → Workspace. Runtime data
              residency depends on your deployment topology; confirm with your
              infrastructure team that runtimes are pinned to the required region.

            </ResidencyNoteText>

          </ResidencyNote>

        </Panel>

      </motion.div>



      {/* ─── Data exports (GDPR/DSR) ─── */}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>

        <SectionTitle>Data exports</SectionTitle>

        <Panel

          flush

          action={

            <ActionButton

              variant="secondary"

              size="sm"

              disabled={requestExport.isPending}

              onClick={() => setExportConfirm(true)}

            >

              <FileCheck2 size={13} strokeWidth={1.8} />

              Request export

            </ActionButton>

          }

        >

          <QueryView

            query={exports}

            skeleton={<Skeleton $h="140px" $r="12px" />}

            isEmpty={(d) => d.length === 0}

            empty={{ title: 'No exports yet', description: 'Request a data export to download an archive of the conversations you select.' }}

          >

            {(rows) => (

              <DataTable>

                <DataHead>

                  <DataCell $w="28%">Export</DataCell>

                  <DataCell $w="18%">Scope</DataCell>

                  <DataCell $w="20%">Requested</DataCell>

                  <DataCell $w="16%">Status</DataCell>

                  <DataCell $w="18%" />

                </DataHead>

                {rows.map((e) => (

                  <DataRow key={e.id} $interactive={false}>

                    <DataCell $w="28%">

                      <CellMono>{e.id.slice(0, 14)}</CellMono>

                    </DataCell>

                    <DataCell $w="18%">

                      <CellMeta>{e.conversationCount !== null ? `${e.conversationCount} conversation${e.conversationCount === 1 ? '' : 's'}` : '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="20%">

                      <CellMeta>{e.createdAt?.slice(0, 10) ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="16%">

                      <StatusPill tone={e.state === 'ready' ? 'success' : e.state === 'expired' ? 'error' : 'warning'} dot={false}>

                        {e.state ?? 'pending'}

                      </StatusPill>

                    </DataCell>

                    <DataCell $w="18%">

                      {e.state === 'ready' && (e.downloadCount ?? 0) < 1 && (

                        <ActionButton

                          variant="secondary"

                          size="sm"

                          disabled={downloadExport.isPending}

                          onClick={() => downloadExport.mutate(e.id)}

                        >

                          <Download size={12} strokeWidth={1.8} />

                          Download

                        </ActionButton>

                      )}

                    </DataCell>

                  </DataRow>

                ))}

              </DataTable>

            )}

          </QueryView>

        </Panel>

      </motion.div>



      {/* ─── Legal holds ─── */}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>

        <SectionTitle>Legal holds</SectionTitle>

        <Panel flush>

          <QueryView

            query={legalHolds}

            skeleton={<Skeleton $h="80px" $r="12px" />}

            isEmpty={(d) => d.length === 0}

            empty={{ title: 'No legal holds', description: 'Active legal holds block purges for their scope. Place one from the API when litigation requires it.' }}

          >

            {(rows) => (

              <DataTable>

                <DataHead>

                  <DataCell $w="24%">Hold</DataCell>

                  <DataCell $w="18%">Scope</DataCell>

                  <DataCell $w="16%">Since</DataCell>

                  <DataCell $w="42%">Reason</DataCell>

                </DataHead>

                {rows.map((h) => (

                  <DataRow key={h.id} $interactive={false}>

                    <DataCell $w="24%">

                      <CellMono>{h.id.slice(0, 14)}</CellMono>

                    </DataCell>

                    <DataCell $w="18%">

                      <CellMeta>{h.scopeType ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="16%">

                      <CellMeta>{h.createdAt?.slice(0, 10) ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="42%">

                      <CellMeta>{h.reason ?? '—'}</CellMeta>

                    </DataCell>

                  </DataRow>

                ))}

              </DataTable>

            )}

          </QueryView>

        </Panel>

      </motion.div>



      {/* ─── Audit trail link ─── */}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>

        <SectionTitle>Audit trail</SectionTitle>

        <Panel flush>

          <QueryView

            query={audit}

            skeleton={<Skeleton $h="120px" $r="12px" />}

            isEmpty={(d) => d.events.length === 0}

            empty={{ title: 'No audit events', description: 'Privileged actions appear here and on the Activity page.' }}

          >

            {(data) => (

              <div>

                <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                  <span style={{ fontSize: 13, opacity: 0.65 }}>

                    Latest events from the hash-chained trail

                  </span>

                  <ActionButton variant="secondary" size="sm" onClick={() => { window.location.hash = ''; window.location.assign('/agent-studio/activity'); }}>

                    <LinkIcon size={12} strokeWidth={1.8} />

                    View full trail

                  </ActionButton>

                </div>

                {data.events.slice(0, 4).map((e) => (

                  <div key={e.id} style={{ padding: '6px 22px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'center' }}>

                    <ShieldCheck size={12} strokeWidth={1.7} style={{ opacity: 0.4, flexShrink: 0 }} />

                    <span style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.7 }}>{e.action}</span>

                    <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 'auto' }}>{e.created_at.slice(0, 10)}</span>

                  </div>

                ))}

              </div>

            )}

          </QueryView>

        </Panel>

      </motion.div>



      {/* ─── Config lifecycle (G-7) ─── */}

      <ConfigLifecycleSection />



      <ExportDialog
        open={exportConfirm}
        selection={exportSelection}
        onSelectionChange={setExportSelection}
        pending={requestExport.isPending}
        onClose={() => setExportConfirm(false)}
        onConfirm={(ids) => {
          requestExport.mutate({ conversationIds: ids }, {
            onSuccess: () => {
              toast.success(ids.length === 0 ? 'Empty export requested' : `Export requested — ${ids.length} conversation${ids.length === 1 ? '' : 's'}`);
              setExportConfirm(false);
              setExportSelection([]);
            },
          });
        }}
      />

    </ViewShell>

  );

}

/** DSR export dialog: pick up to 20 conversations — the engine builds the
 * manifest from exactly these IDs, so an unscoped request can never silently
 * produce an empty archive. */
const MAX_EXPORT_CONVERSATIONS = 20;

function ExportDialog({ open, selection, onSelectionChange, pending, onClose, onConfirm }: {
  open: boolean;
  selection: string[];
  onSelectionChange: (ids: string[]) => void;
  pending: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const conversations = useConversations({ enabled: open });
  const rows = conversations.data ?? [];

  const toggle = (id: string) => {
    if (selection.includes(id)) {
      onSelectionChange(selection.filter((s) => s !== id));
    } else if (selection.length < MAX_EXPORT_CONVERSATIONS) {
      onSelectionChange([...selection, id]);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a data export"
      width={560}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton
            disabled={pending || rows.length === 0}
            onClick={() => onConfirm(selection)}
          >
            {selection.length === 0 ? 'Request empty export' : `Request export (${selection.length})`}
          </ActionButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
          Select up to {MAX_EXPORT_CONVERSATIONS} conversations to include. The export compiles
          transcripts and run records into a downloadable archive, ready immediately.
          Downloads are one-time.
        </p>
        {conversations.isLoading ? (
          <Skeleton $h="120px" $r="12px" />
        ) : rows.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>No conversations in this organization yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
            {rows.map((c) => {
              const checked = selection.includes(c.id);
              return (
                <label
                  key={c.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: checked ? 'rgba(139,143,248,0.10)' : 'transparent' }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    disabled={!checked && selection.length >= MAX_EXPORT_CONVERSATIONS}
                    aria-label={`Include ${c.title}`}
                  />
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{c.updatedAt?.slice(0, 10) ?? ''}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}



// ─── Config lifecycle (G-7) ──────────────────────────────────────────



// ─── Config lifecycle (G-7) ──────────────────────────────────────────

/**
 * Config lifecycle editor, wired to the engine's real config-publish contract:
 * every read and write carries a scope (policy_set, guardrail_profile,
 * quota_profile, model_catalog, knowledge_config). Publish and rollback are
 * live-effect acts and go through step-up MFA; the engine has no canary
 * concept, so the console does not offer one.
 */
function ConfigLifecycleSection() {
  const [scope, setScope] = useState<ConfigScope>('policy_set');
  const draft = useConfigDraft(scope);
  const history = useConfigHistory(scope);
  const delivery = useConfigDelivery(scope);
  const validate = useValidateConfigDraft();
  const saveDraft = useSaveConfigDraft();
  const deleteDraft = useDeleteConfigDraft();
  const publish = usePublishConfig();
  const rollback = useRollbackConfig();

  const [json, setJson] = useState<Record<string, unknown> | null>(null);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);

  // Switching scope resets the local editor to that scope's draft.
  const effective = json ?? draft.data?.payload ?? null;
  const jsonText = effective ? JSON.stringify(effective, null, 2) : '{}';

  const selectScope = (next: ConfigScope) => {
    setScope(next);
    setJson(null);
    setRollbackVersion(null);
  };

  const setFromText = (text: string) => {
    try {
      setJson(JSON.parse(text) as Record<string, unknown>);
    } catch {
      /* invalid JSON — the textarea keeps the text; validation catches it */
    }
  };

  const validateAndSave = async () => {
    if (!effective) return;
    try {
      const result = await validate.mutateAsync({ scope, payload: effective });
      if (result.ok === false) {
        const issues = (result.issues ?? []).map((i) => `${i.path}: ${i.message}`);
        toast.error(`Validation failed: ${(issues.length > 0 ? issues : ['unknown']).join('; ')}`);
        return;
      }
      await saveDraft.mutateAsync({ scope, payload: effective });
      setJson(null);
      toast.success('Draft validated and saved');
    } catch {
      /* the hook surfaced the error */
    }
  };

  const versions = history.data ?? [];
  const rollbackTarget = rollbackVersion ?? (versions.length > 0 ? versions[0].version : null);

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
        <SectionTitle>Configuration lifecycle</SectionTitle>
        <Panel
          title="Config draft"
          subtitle="Edit, validate, and publish org config. The engine validates each scope against its own schema."
          action={
            <ActionCluster>
              <ScopeSelect value={scope} onChange={(e) => selectScope(e.target.value as ConfigScope)} aria-label="Config scope">
                {CONFIG_SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </ScopeSelect>
              <ActionButton
                variant="secondary"
                size="sm"
                disabled={!effective || validate.isPending}
                onClick={() => void validateAndSave()}
              >
                Validate & save
              </ActionButton>
              <ActionButton
                variant="secondary"
                size="sm"
                disabled={deleteDraft.isPending || !draft.data?.payload}
                onClick={() => deleteDraft.mutate({ scope }, { onSuccess: () => { setJson(null); toast.success('Draft discarded'); } })}
              >
                Discard
              </ActionButton>
              <ActionButton
                size="sm"
                disabled={!draft.data?.payload || publish.isPending}
                onClick={() => setPublishConfirm(true)}
              >
                Publish
              </ActionButton>
            </ActionCluster>
          }
        >
          <QueryView query={draft} skeleton={<Skeleton $h="180px" $r="12px" />} isEmpty={(d) => d.payload === null} empty={{ title: 'No draft', description: `No ${scope} draft yet — edit the JSON below and save it as a draft.` }}>
            {() => (
              <ConfigStack>
                <ConfigTextarea
                  value={jsonText}
                  onChange={(e) => setFromText(e.target.value)}
                  rows={Math.min(14, Math.max(6, jsonText.split('\n').length))}
                  spellCheck={false}
                  aria-label="Config draft JSON"
                />
                {draft.data?.validationIssues && draft.data.validationIssues.length > 0 && (
                  <ValidationErrors>
                    {draft.data.validationIssues.map((err, i) => (
                      <ValidationError key={i}>{err}</ValidationError>
                    ))}
                  </ValidationErrors>
                )}
              </ConfigStack>
            )}
          </QueryView>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={7}>
        <TwoColGrid>
          <Panel title="Version history" flush>
            <QueryView
              query={history}
              skeleton={<Skeleton $h="120px" $r="12px" />}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No published versions', description: `Publish the ${scope} draft to create version 1.` }}
            >
              {(rows) => (
                <DataTable>
                  <DataHead>
                    <DataCell $w="24%">Version</DataCell>
                    <DataCell $w="30%">Published</DataCell>
                    <DataCell $w="24%">By</DataCell>
                    <DataCell $w="22%" />
                  </DataHead>
                  {rows.slice(0, 6).map((v: ConfigVersion) => (
                    <DataRow key={v.version} $interactive={false}>
                      <DataCell $w="24%">
                        <CellMono>v{v.version}</CellMono>
                      </DataCell>
                      <DataCell $w="30%">
                        <CellMeta>{v.publishedAt?.slice(0, 10) ?? '—'}</CellMeta>
                      </DataCell>
                      <DataCell $w="24%">
                        <CellMeta>{v.publishedBy?.slice(0, 8) ?? '—'}</CellMeta>
                      </DataCell>
                      <DataCell $w="22%">
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          disabled={rollback.isPending}
                          onClick={() => setRollbackVersion(v.version)}
                        >
                          <Undo2 size={12} strokeWidth={1.8} />
                          Rollback
                        </ActionButton>
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
              )}
            </QueryView>
          </Panel>

          <Panel title="Delivery" flush>
            <QueryView
              query={delivery}
              skeleton={<Skeleton $h="120px" $r="12px" />}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No deliveries', description: 'Satellite delivery status appears here after the first publish.' }}
            >
              {(rows) => (
                <DataTable>
                  <DataHead>
                    <DataCell $w="40%">Satellite</DataCell>
                    <DataCell $w="30%">Status</DataCell>
                    <DataCell $w="30%">Acked</DataCell>
                  </DataHead>
                  {rows.map((d) => (
                    <DataRow key={d.satellite} $interactive={false}>
                      <DataCell $w="40%">
                        <CellPrimary>{d.satellite}</CellPrimary>
                      </DataCell>
                      <DataCell $w="30%">
                        <StatusPill tone={d.status === 'acked' ? 'success' : 'warning'} dot={false}>
                          {d.status ?? 'pending'}
                        </StatusPill>
                      </DataCell>
                      <DataCell $w="30%">
                        <CellMeta>{d.ackedAt?.slice(0, 10) ?? '—'}</CellMeta>
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
              )}
            </QueryView>
          </Panel>
        </TwoColGrid>
      </motion.div>

      <Modal
        open={publishConfirm}
        onClose={() => setPublishConfirm(false)}
        title="Publish this config?"
        width={480}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setPublishConfirm(false)}>Cancel</ActionButton>
            <ActionButton
              disabled={publish.isPending}
              onClick={() => {
                publish.mutate(
                  { scope },
                  { onSuccess: () => { toast.success('Config published'); setPublishConfirm(false); } },
                );
              }}
            >
              Publish
            </ActionButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
          Publishes the saved <CellMono>{scope}</CellMono> draft as a new immutable version and
          fans it out to all satellites. This is a privileged act — you will be asked for MFA.
        </p>
      </Modal>

      <ConfirmDialog
        open={rollbackVersion !== null}
        title={`Roll back ${scope} to v${rollbackTarget}?`}
        message="The engine creates a new version with that version's content — history is never rewritten. This is a privileged act — you will be asked for MFA."
        confirmLabel="Roll back"
        onConfirm={() => {
          if (rollbackTarget === null) return;
          rollback.mutate({ scope, toVersion: rollbackTarget }, {
            onSuccess: () => { toast.success(`Config rolled back to v${rollbackTarget}`); setRollbackVersion(null); },
          });
        }}
        onCancel={() => setRollbackVersion(null)}
      />
    </>
  );
}

const ScopeSelect = styled.select`
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.30);
  color: inherit;
  font-family: inherit;
  cursor: pointer;
`;





const ActionCluster = styled.div`

  display: flex;

  gap: 8px;

`;



const ConfigStack = styled.div`

  display: flex;

  flex-direction: column;

  gap: 12px;

`;



const ConfigTextarea = styled.textarea`

  width: 100%;

  background: rgba(0, 0, 0, 0.30);

  border: 1px solid ${({ theme }) => theme.app.border.strong};

  border-radius: 10px;

  color: ${({ theme }) => theme.app.text.primary};

  font-family: ${({ theme }) => theme.typography.fonts.mono};

  font-size: ${({ theme }) => theme.app.type.caption};

  line-height: 1.55;

  padding: 12px;

  resize: vertical;



  &:focus-visible {

    outline: 2px solid ${({ theme }) => theme.app.border.focus};

    outline-offset: 1px;

  }

`;



const ValidationErrors = styled.div`

  display: flex;

  flex-direction: column;

  gap: 4px;

`;



const ValidationError = styled.div`

  font-size: ${({ theme }) => theme.app.type.micro};

  color: ${({ theme }) => theme.app.status.error.fg};

  padding: 4px 8px;

  border-radius: 6px;

  background: ${({ theme }) => theme.app.status.error.bg};

`;



const TwoColGrid = styled.div`

  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 20px;

  align-items: start;



  @media (max-width: 900px) {

    grid-template-columns: 1fr;

  }
`;
