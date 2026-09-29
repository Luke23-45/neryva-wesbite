import { useState } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';

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

import { TextInput } from '@components/common/ui/TextInput';

import { TextArea } from '@components/common/ui/TextArea';
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

import { useOrg } from '@/Context/OrgContext';

import { toastEngineError } from '@lib/engine/errors';

import {

  useExports,

  useLegalHolds,

  useDownloadExport,

  useReleaseLegalHold,

  useUpsertRetentionPolicy,

  usePurgeTask,

  fetchTombstone,

  buildRetentionPolicyBody,

  type TombstoneResult,

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

  useRenotifyConfig,

  normalizeProduct,

  productError,

  PUBLISHABLE_SCOPES,

  type ConfigVersion,

  type PublishableConfigScope,

} from '@hooks/studio/useConfigLifecycle';



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

  const navigate = useNavigate();

  const profile = useOrgProfile();

  const audit = useAudit({ limit: 8 });

  const exports = useExports();

  const legalHolds = useLegalHolds();

  const downloadExport = useDownloadExport();

  // C-05: the download needs the one-time token issued at creation — the
  // table opens a token prompt instead of downloading blind.
  const [downloadPrompt, setDownloadPrompt] = useState<string | null>(null);

  // C-08: hold management (release) — owner/admin gated by the engine.
  // Placing a hold moved to the dedicated /agent-studio/compliance/holds/new
  // section (X-4 migration); the one-time download token reveal moved with
  // the export request into /agent-studio/compliance/exports/new (X-1/X-2).
  const releaseHold = useReleaseLegalHold();
  const [releaseTarget, setReleaseTarget] = useState<string | null>(null);



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

              onClick={() => navigate({ to: '/agent-studio/compliance/exports/new' })}

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

                  <DataCell $w="24%">Export</DataCell>

                  <DataCell $w="12%">Scope</DataCell>

                  <DataCell $w="14%">Requested</DataCell>

                  {/* C-04: expiry was parsed but never rendered — the UI
                      could not tell the user an export was expired before
                      they clicked Download. */}
                  <DataCell $w="12%">Expires</DataCell>

                  <DataCell $w="12%">Status</DataCell>

                  <DataCell $w="26%" />

                </DataHead>

                {rows.map((e) => (

                  <DataRow key={e.id} $interactive={false}>

                    <DataCell $w="24%">

                      <CellMono>{e.id.slice(0, 14)}</CellMono>

                    </DataCell>

                    <DataCell $w="12%">

                      <CellMeta>{e.conversationCount !== null ? `${e.conversationCount} conversation${e.conversationCount === 1 ? '' : 's'}` : '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="14%">

                      <CellMeta>{e.createdAt?.slice(0, 10) ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="12%">

                      <CellMeta>{e.expiresAt?.slice(0, 10) ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="12%">

                      <StatusPill tone={e.state === 'ready' ? 'success' : e.state === 'expired' ? 'error' : 'warning'} dot={false}>

                        {e.state ?? 'pending'}

                      </StatusPill>

                    </DataCell>

                    <DataCell $w="26%">

                      {e.state === 'ready' && (e.downloadCount ?? 0) < 1 ? (
                        <ActionButton

                          variant="secondary"

                          size="sm"

                          disabled={downloadExport.isPending}

                          onClick={() => setDownloadPrompt(e.id)}

                        >

                          <Download size={12} strokeWidth={1.8} />

                          Download

                        </ActionButton>
                      ) : (
                        /* C-04: downloadCount was parsed but invisible — a
                           consumed export now says so instead of silently
                           dropping its Download button. */
                        e.state === 'ready' && <CellMeta>downloaded</CellMeta>
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

        <Panel
          flush
          action={
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => navigate({ to: '/agent-studio/compliance/holds/new' })}
            >
              Place hold
            </ActionButton>
          }
        >

          <QueryView

            query={legalHolds}

            skeleton={<Skeleton $h="80px" $r="12px" />}

            isEmpty={(d) => d.length === 0}

            empty={{ title: 'No legal holds', description: 'Active legal holds block purges for their scope. Place one from the API when litigation requires it.' }}

          >

            {(rows) => (

              <DataTable>

                <DataHead>

                  <DataCell $w="14%">Hold</DataCell>

                  {/* C-07: the scope id is the operative identifier for
                      conversation-scoped holds — it was invisible. */}
                  <DataCell $w="18%">Scope</DataCell>

                  {/* C-06: the wire field is placedAt, not createdAt —
                      reading createdAt rendered this column as '—' forever. */}
                  <DataCell $w="12%">Since</DataCell>

                  {/* C-07: placedBy was not even parsed before. */}
                  <DataCell $w="12%">Placed by</DataCell>

                  <DataCell $w="10%">Status</DataCell>

                  <DataCell $w="26%">Reason</DataCell>

                  <DataCell $w="8%" />

                </DataHead>

                {rows.map((h) => (

                  <DataRow key={h.id} $interactive={false}>

                    <DataCell $w="14%">

                      <CellMono>{h.id.slice(0, 14)}</CellMono>

                    </DataCell>

                    <DataCell $w="18%">

                      <CellMeta>{h.scopeType ?? '—'}</CellMeta>

                      {h.scopeId && <CellMono>{h.scopeId.slice(0, 14)}</CellMono>}

                    </DataCell>

                    <DataCell $w="12%">

                      <CellMeta>{h.placedAt?.slice(0, 10) ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="12%">

                      <CellMeta>{h.placedBy?.slice(0, 8) ?? '—'}</CellMeta>

                    </DataCell>

                    {/* P5-C17: the engine lists released holds too — show the status so a released hold is never mistaken for an active one. */}

                    <DataCell $w="10%">

                      <StatusPill tone={h.status === 'released' ? 'neutral' : 'warning'} dot={false}>

                        {h.status ?? 'active'}

                      </StatusPill>

                      {h.status === 'released' && h.releasedAt && (
                        <CellMeta>{h.releasedAt.slice(0, 10)}</CellMeta>
                      )}

                    </DataCell>

                    <DataCell $w="26%">

                      <CellMeta>{h.reason ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="8%">

                      {/* C-08: release is owner/admin-gated by the engine. */}
                      {h.status !== 'released' && (
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          disabled={releaseHold.isPending}
                          onClick={() => setReleaseTarget(h.id)}
                        >
                          Release
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

                  <ActionButton variant="secondary" size="sm" onClick={() => navigate({ to: '/agent-studio/activity' })}>

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



      <DownloadPromptDialog
        exportId={downloadPrompt}
        pending={downloadExport.isPending}
        onClose={() => setDownloadPrompt(null)}
        onConfirm={(token) => {
          if (!downloadPrompt) return;
          downloadExport.mutate(
            { exportId: downloadPrompt, token },
            { onSuccess: () => setDownloadPrompt(null) },
          );
        }}
      />

      <ConfirmDialog
        open={releaseTarget !== null}
        title="Release this legal hold?"
        message="Released holds stay listed for the audit trail, but stop blocking purges for their scope."
        confirmLabel="Release hold"
        onConfirm={() => {
          if (releaseTarget === null) return;
          releaseHold.mutate(releaseTarget, {
            onSuccess: () => {
              toast.success('Legal hold released');
              setReleaseTarget(null);
            },
          });
        }}
        onCancel={() => setReleaseTarget(null)}
      />

      <GovernanceSection />

    </ViewShell>

  );

}

function DownloadPromptDialog({ exportId, pending, onClose, onConfirm }: {
  exportId: string | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (token: string) => void;
}) {
  const [token, setToken] = useState('');
  if (!exportId) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title="Download export"
      width={480}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton disabled={pending || token.trim() === ''} onClick={() => onConfirm(token.trim())}>
            Download
          </ActionButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
          Enter the one-time download token shown when this export was requested.
          Downloads are one-time per export.
        </p>
        <TextInput
          label="Download token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste the token from the request step"
          autoComplete="off"
        />
      </div>
    </Modal>
  );
}

function GovernanceSection() {
  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
        <SectionTitle>Retention & purge</SectionTitle>
        <TwoColGrid>
          <Panel title="Purge tasks" flush>
            <PurgePanel />
          </Panel>
          <Panel title="Retention policies" flush>
            <RetentionPanel />
          </Panel>
        </TwoColGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
        <Panel title="Tombstone lookup" flush>
          <TombstonePanel />
        </Panel>
      </motion.div>
    </>
  );
}

function PurgePanel() {
  // X-6 migration: the request form moved to the dedicated
  // /agent-studio/compliance/purges/new section. The section navigates back
  // here with ?purgeTask=<id> after a successful enqueue, so the panel
  // shows the just-enqueued task's status — exactly what the dialog-era
  // onSuccess did via panel state.
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { purgeTask?: string };
  const initialTask = typeof search.purgeTask === 'string' && search.purgeTask !== '' ? search.purgeTask : null;
  const [taskId, setTaskId] = useState<string | null>(initialTask);
  const [lookupId, setLookupId] = useState('');
  const task = usePurgeTask(taskId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
        Enqueue a purge for a conversation — the worker advances it through authorize,
        hold-check, and deletion steps. Active legal holds block it. Owner/admin only.
      </p>
      <div>
        <ActionButton variant="secondary" size="sm" onClick={() => navigate({ to: '/agent-studio/compliance/purges/new' })}>
          Request purge
        </ActionButton>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <TextInput
            label="Task status lookup"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Purge task id"
          />
        </div>
        <ActionButton variant="secondary" size="sm" onClick={() => setTaskId(lookupId.trim() || null)}>
          Check
        </ActionButton>
      </div>
      {taskId && (
        <QueryView
          query={task}
          skeleton={<Skeleton $h="60px" $r="10px" />}
          isEmpty={() => false}
          empty={{ title: '', description: '' }}
        >
          {(t) => t ? (
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <CellMono>{t.id.slice(0, 14)}</CellMono>
              <div><CellMeta>state: {t.state ?? '—'} · step: {t.step ?? '—'}</CellMeta></div>
              {t.lastError && <ValidationError>{t.lastError}</ValidationError>}
              {t.finishedAt && <CellMeta>finished {t.finishedAt.slice(0, 10)}</CellMeta>}
            </div>
          ) : (
            <CellMeta>No purge task with that id.</CellMeta>
          )}
        </QueryView>
      )}
    </div>
  );
}

function RetentionPanel() {
  const upsert = useUpsertRetentionPolicy();
  const [resourceType, setResourceType] = useState('');
  const [retentionClass, setRetentionClass] = useState('');
  const [keepDays, setKeepDays] = useState('');
  const { body, error } = buildRetentionPolicyBody({ resourceType, retentionClass, keepDays });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
        Upsert a retention policy — the hourly sweep enqueues purges for artifacts past
        their keep window. Owner/admin only. Policies are keyed by resource type +
        retention class; saving overwrites the previous policy for that key.
      </p>
      <TextInput label="Resource type" value={resourceType} onChange={(e) => setResourceType(e.target.value)} placeholder="e.g. conversation, artifact" />
      <TextInput label="Retention class" value={retentionClass} onChange={(e) => setRetentionClass(e.target.value)} placeholder="e.g. standard, extended" />
      <TextInput label="Keep days" value={keepDays} onChange={(e) => setKeepDays(e.target.value)} placeholder="e.g. 365" inputMode="numeric" />
      {error && <ValidationError>{error}</ValidationError>}
      <div>
        <ActionButton
          variant="secondary"
          size="sm"
          disabled={upsert.isPending || !body}
          onClick={() => body && upsert.mutate(
            { resourceType, retentionClass, keepDays },
            {
              onSuccess: () => {
                toast.success('Retention policy saved');
                setResourceType('');
                setRetentionClass('');
                setKeepDays('');
              },
            },
          )}
        >
          Save policy
        </ActionButton>
      </div>
    </div>
  );
}

function TombstonePanel() {
  const { orgId } = useOrg();
  const [resourceType, setResourceType] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [result, setResult] = useState<TombstoneResult | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    if (!orgId || resourceType.trim() === '' || resourceId.trim() === '') return;
    setChecking(true);
    try {
      setResult(await fetchTombstone(orgId, resourceType.trim(), resourceId.trim()));
    } catch (error) {
      toastEngineError(error, 'Tombstone lookup failed');
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
        Check whether a purged resource left a tombstone — tombstones record that the
        data was deleted and why.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <TextInput label="Resource type" value={resourceType} onChange={(e) => setResourceType(e.target.value)} placeholder="e.g. conversation" />
        </div>
        <div style={{ flex: 2 }}>
          <TextInput label="Resource id" value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="Resource UUID" />
        </div>
        <ActionButton variant="secondary" size="sm" disabled={checking} onClick={() => void check()}>
          Check
        </ActionButton>
      </div>
      {result && (
        <div style={{ fontSize: 13 }}>
          {result.tombstoned ? (
            <StatusPill tone="neutral" dot={false}>tombstoned</StatusPill>
          ) : (
            <StatusPill tone="success" dot={false}>not tombstoned</StatusPill>
          )}
          {result.reason && <CellMeta> — {result.reason}</CellMeta>}
        </div>
      )}
    </div>
  );
}



// ─── Config lifecycle (G-7) ──────────────────────────────────────────



// ─── Config lifecycle (G-7) ──────────────────────────────────────────

/**
 * Config lifecycle editor, wired to the engine's real config-publish contract:
 * every read and write carries a scope. Publish and rollback are
 * live-effect acts and go through step-up MFA; the engine has no canary
 * concept, so the console does not offer one.
 *
 * C-P0-13: the scope select only offers the publishable scopes — the
 * scopes something actually consumes. policy_set, guardrail_profile, and
 * quota_profile are accepted by the engine API but no engine or runtime
 * consumer reads them, so the console does not present a publish trail
 * for them.
 */
function ConfigLifecycleSection() {
  const [scope, setScope] = useState<PublishableConfigScope>('model_catalog');
  // C-16: the engine keys publishes on (org, scope, product). Empty = the
  // org-level config; every read and write below carries the same product.
  const [product, setProduct] = useState('');
  const productBlocker = productError(product);
  const draft = useConfigDraft(scope, product);
  const history = useConfigHistory(scope, product);
  const delivery = useConfigDelivery(scope, product);
  const validate = useValidateConfigDraft();
  const saveDraft = useSaveConfigDraft();
  const deleteDraft = useDeleteConfigDraft();
  const publish = usePublishConfig();
  const rollback = useRollbackConfig();
  // C-18: re-run fanout for stalled pullers / late-activated satellites.
  const renotify = useRenotifyConfig();

  const [json, setJson] = useState<Record<string, unknown> | null>(null);
  // P5-C18: the textarea is a controlled input — its raw text must live in
  // state. The previous version parsed every keystroke and silently dropped
  // invalid intermediate states, so typing was impossible (the value kept
  // reverting to '{}').
  const [rawText, setRawText] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  // C-13: the audit rationale the engine records on draft/publish/rollback
  // (≤512 chars). The hooks accepted notes all along; the console never
  // offered an input.
  const [draftNotes, setDraftNotes] = useState('');
  const [publishNotes, setPublishNotes] = useState('');
  const [rollbackNotes, setRollbackNotes] = useState('');

  // Switching scope resets the local editor to that scope's draft.
  const effective = json ?? draft.data?.payload ?? null;
  const jsonText = rawText ?? (effective ? JSON.stringify(effective, null, 2) : '{}');

  const resetEditor = () => {
    setJson(null);
    setRawText(null);
    setTextError(null);
  };

  const selectScope = (next: PublishableConfigScope) => {
    setScope(next);
    resetEditor();
    setRollbackVersion(null);
  };

  const setFromText = (text: string) => {
    setRawText(text);
    try {
      setJson(JSON.parse(text) as Record<string, unknown>);
      setTextError(null);
    } catch {
      setTextError('Invalid JSON — fix the syntax before validating.');
    }
  };

  const validateAndSave = async () => {
    if (textError) {
      toast.error(textError);
      return;
    }
    if (!json) return;
    try {
      const result = await validate.mutateAsync({ scope, payload: json });
      if (result.ok === false) {
        const issues = (result.issues ?? []).map((i) => `${i.path}: ${i.message}`);
        toast.error(`Validation failed: ${(issues.length > 0 ? issues : ['unknown']).join('; ')}`);
        return;
      }
      await saveDraft.mutateAsync({ scope, product, payload: json, notes: draftNotes.trim() || undefined });
      resetEditor();
      setDraftNotes('');
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
              {/* C-16: the engine keys publishes on (org, scope, product).
                  Empty = org-level config; every read/write carries it. */}
              <ProductInput
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="product (optional)"
                aria-label="Product scope"
                title="Product tag — lowercase letters, digits, underscores. Empty = org-level config."
              />
              <ScopeSelect value={scope} onChange={(e) => selectScope(e.target.value as PublishableConfigScope)} aria-label="Config scope">
                {PUBLISHABLE_SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </ScopeSelect>
              <ActionButton
                variant="secondary"
                size="sm"
                disabled={!!textError || !json || !!productBlocker || validate.isPending}
                onClick={() => void validateAndSave()}
              >
                Validate & save
              </ActionButton>
              <ActionButton
                variant="secondary"
                size="sm"
                disabled={deleteDraft.isPending || !draft.data?.payload}
                onClick={() => deleteDraft.mutate({ scope, product }, { onSuccess: () => { resetEditor(); toast.success('Draft discarded'); } })}
              >
                Discard
              </ActionButton>
              <ActionButton
                size="sm"
                disabled={!draft.data?.payload || !!productBlocker || publish.isPending}
                onClick={() => setPublishConfirm(true)}
              >
                Publish
              </ActionButton>
            </ActionCluster>
          }
        >
          <QueryView query={draft} skeleton={<Skeleton $h="180px" $r="12px" />}>
            {() => (
              <ConfigStack>
                {/* C-P0-13: honest scope gating — the engine API also accepts
                    policy_set, guardrail_profile, and quota_profile, but no
                    engine or runtime consumer reads them, so offering a
                    publish trail here would be a green-looking no-op. The
                    select lists only the scopes something actually applies. */}
                <DraftNote>
                  Only scopes with a live runtime consumer are listed. The engine API also accepts policy_set,
                  guardrail_profile, and quota_profile — but nothing consumes them yet, so publishing them
                  here would be a no-op.
                </DraftNote>
                {productBlocker && <ValidationError>{productBlocker}</ValidationError>}
                {/* P5-C15: the editor must render even when no draft exists —
                    gating it behind the empty state made the first draft
                    impossible to create ("edit the JSON below" with no JSON
                    below). The empty note is now a caption above the editor. */}
                {!draft.data?.payload && (
                  <DraftNote>No {scope} draft yet — edit the JSON below and save it as a draft.</DraftNote>
                )}
                <ConfigTextarea
                  value={jsonText}
                  onChange={(e) => setFromText(e.target.value)}
                  rows={Math.min(14, Math.max(6, jsonText.split('\n').length))}
                  spellCheck={false}
                  aria-label="Config draft JSON"
                />
                {/* C-13: the audit rationale the engine records with the draft. */}
                {draft.data?.notes && (
                  <DraftNote>Saved with this draft: {draft.data.notes}</DraftNote>
                )}
                <TextInput
                  label={`Change notes (optional)${draftNotes ? ` — ${draftNotes.length}/512` : ''}`}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Why this draft changes — recorded in the audit trail"
                  maxLength={512}
                />
                {(textError || (draft.data?.validationIssues && draft.data.validationIssues.length > 0)) && (
                  <ValidationErrors>
                    {textError && <ValidationError>{textError}</ValidationError>}
                    {draft.data?.validationIssues?.map((err, i) => (
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
                    <DataCell $w="16%">Version</DataCell>
                    <DataCell $w="22%">Published</DataCell>
                    <DataCell $w="16%">By</DataCell>
                    {/* C-13: the audit rationale recorded at publish/rollback. */}
                    <DataCell $w="30%">Notes</DataCell>
                    <DataCell $w="16%" />
                  </DataHead>
                  {rows.slice(0, 6).map((v: ConfigVersion) => (
                    <DataRow key={v.version} $interactive={false}>
                      <DataCell $w="16%">
                        <CellMono>v{v.version}</CellMono>
                      </DataCell>
                      <DataCell $w="22%">
                        <CellMeta>{v.publishedAt?.slice(0, 10) ?? '—'}</CellMeta>
                      </DataCell>
                      <DataCell $w="16%">
                        <CellMeta>{v.publishedBy?.slice(0, 8) ?? '—'}</CellMeta>
                      </DataCell>
                      <DataCell $w="30%">
                        <CellMeta title={v.notes ?? undefined}>{v.notes ? (v.notes.length > 60 ? `${v.notes.slice(0, 60)}…` : v.notes) : '—'}</CellMeta>
                      </DataCell>
                      <DataCell $w="16%">
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

          <Panel
            title="Delivery"
            flush
            action={
              /* C-18: re-run fanout for stalled pullers / late-activated
                 satellites — owner/admin only, engine-enforced. */
              <ActionButton
                variant="secondary"
                size="sm"
                disabled={renotify.isPending}
                onClick={() => renotify.mutate({ scope, product }, {
                  onSuccess: () => toast.success('Re-notify sent — stalled satellites will be nudged'),
                })}
              >
                Re-notify
              </ActionButton>
            }
          >
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
                        {/* C-P0-12: delivery state derives from ackedAt (the
                            engine's ACK signal), not satelliteStatus (the
                            registry lease state). The lease state stays
                            visible separately below so the two signals are
                            not conflated. */}
                        <StatusPill tone={d.deliveryStatus === 'acked' ? 'success' : 'warning'} dot={false}>
                          {d.deliveryStatus}
                        </StatusPill>
                        <CellMeta>lease: {d.satelliteStatus ?? 'unknown'}</CellMeta>
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
                  { scope, product, notes: publishNotes.trim() || undefined },
                  { onSuccess: () => { toast.success('Config published'); setPublishConfirm(false); setPublishNotes(''); } },
                );
              }}
            >
              Publish
            </ActionButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
          Publishes the saved <CellMono>{scope}</CellMono>{normalizeProduct(product) ? <> for product <CellMono>{normalizeProduct(product)}</CellMono></> : null} draft as a new immutable version and
          fans it out to all satellites. This is a privileged act — you will be asked for MFA.
        </p>
        {/* C-13: the audit rationale the engine records with the publish. */}
        <div style={{ marginTop: 12 }}>
          <TextArea
            label={`Change notes (optional)${publishNotes ? ` — ${publishNotes.length}/512` : ''}`}
            value={publishNotes}
            onChange={(e) => setPublishNotes(e.target.value)}
            placeholder="Why this publish — recorded in the audit trail"
            maxLength={512}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={rollbackVersion !== null}
        onClose={() => { setRollbackVersion(null); setRollbackNotes(''); }}
        title={`Roll back ${scope} to v${rollbackTarget}?`}
        width={480}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setRollbackVersion(null); setRollbackNotes(''); }}>Cancel</ActionButton>
            <ActionButton
              disabled={rollback.isPending}
              onClick={() => {
                if (rollbackTarget === null) return;
                rollback.mutate(
                  { scope, product, toVersion: rollbackTarget, notes: rollbackNotes.trim() || undefined },
                  { onSuccess: () => { toast.success(`Config rolled back to v${rollbackTarget}`); setRollbackVersion(null); setRollbackNotes(''); } },
                );
              }}
            >
              Roll back
            </ActionButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
          The engine creates a new version with that version&apos;s content — history is never
          rewritten. This is a privileged act — you will be asked for MFA.
        </p>
        {/* C-13: the audit rationale the engine records with the rollback. */}
        <div style={{ marginTop: 12 }}>
          <TextArea
            label={`Change notes (optional)${rollbackNotes ? ` — ${rollbackNotes.length}/512` : ''}`}
            value={rollbackNotes}
            onChange={(e) => setRollbackNotes(e.target.value)}
            placeholder="Why this rollback — recorded in the audit trail"
            maxLength={512}
            rows={3}
          />
        </div>
      </Modal>
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

/* C-16: the product tag the engine keys (org, scope, product) on. */
const ProductInput = styled.input`
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.30);
  color: inherit;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  width: 150px;

  &::placeholder {
    color: ${({ theme }) => theme.app.text.muted};
    opacity: 0.6;
  }
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



/* P5-C15: caption shown above the always-visible editor when no draft exists. */

const DraftNote = styled.p`

  font-size: ${({ theme }) => theme.app.type.caption};

  color: ${({ theme }) => theme.app.text.muted};

  margin: 0;

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
