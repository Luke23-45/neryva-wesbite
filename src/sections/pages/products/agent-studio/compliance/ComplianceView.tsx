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

  type ConfigVersion,

} from '@hooks/studio/useConfigLifecycle';



import {

  FrameworkGrid,

  FrameworkCard,

  FrameworkTop,

  FrameworkName,

  FrameworkRenewal,

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



const FRAMEWORK_TONE: Record<string, 'emerald' | 'azure' | 'neutral'> = {

  compliant: 'emerald',

  in_progress: 'azure',

  not_started: 'neutral',

};



const ATTESTATIONS = [

  { name: 'SOC 2 Type II', status: 'compliant', renewal: 'Attested annually', controls: 'Security, availability, confidentiality' },

  { name: 'GDPR', status: 'compliant', renewal: 'Ongoing obligation', controls: 'Data subject rights, lawful basis, DPIA' },

  { name: 'ISO 27001', status: 'in_progress', renewal: 'Stage 2 audit scheduled', controls: 'ISMS, risk management, operations security' },

];



export function ComplianceView() {

  const profile = useOrgProfile();

  const audit = useAudit({ limit: 8 });

  const exports = useExports();

  const legalHolds = useLegalHolds();

  const requestExport = useRequestExport();

  const downloadExport = useDownloadExport();

  const [exportConfirm, setExportConfirm] = useState(false);



  const region = profile.data?.org.region ?? null;



  return (

    <ViewShell>

      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>

        <ViewHeader>

          <ViewTitle>Compliance</ViewTitle>

          <ViewSubtitle>

            Attestations, data residency, DSR exports, and the governance config plane.

          </ViewSubtitle>

        </ViewHeader>

      </ViewHeaderRow>



      {/* ─── Attestations ─── */}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>

        <SectionTitle>Attestations</SectionTitle>

        <FrameworkGrid>

          {ATTESTATIONS.map((f) => (

            <FrameworkCard key={f.name}>

              <FrameworkTop>

                <FrameworkName>{f.name}</FrameworkName>

                <StatusPill tone={FRAMEWORK_TONE[f.status] ?? 'neutral'} dot={false}>

                  {f.status.replace('_', ' ')}

                </StatusPill>

              </FrameworkTop>

              <FrameworkRenewal>{f.renewal}</FrameworkRenewal>

              <FrameworkRenewal>{f.controls}</FrameworkRenewal>

            </FrameworkCard>

          ))}

        </FrameworkGrid>

      </motion.div>



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

              residency is enforced by the satellite deployment in the same region.

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

            empty={{ title: 'No exports yet', description: 'Request a data export to receive a downloadable archive of your organization\'s data.' }}

          >

            {(rows) => (

              <DataTable>

                <DataHead>

                  <DataCell $w="28%">Export</DataCell>

                  <DataCell $w="18%">Type</DataCell>

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

                      <CellMeta>{e.resourceType ?? 'org'}</CellMeta>

                    </DataCell>

                    <DataCell $w="20%">

                      <CellMeta>{e.requestedAt?.slice(0, 10) ?? '—'}</CellMeta>

                    </DataCell>

                    <DataCell $w="16%">

                      <StatusPill tone={e.status === 'completed' ? 'success' : e.status === 'failed' ? 'error' : 'warning'} dot={false}>

                        {e.status ?? 'pending'}

                      </StatusPill>

                    </DataCell>

                    <DataCell $w="18%">

                      {e.status === 'completed' && (

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

      {(legalHolds.data?.length ?? 0) > 0 && (

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>

          <SectionTitle>Legal holds</SectionTitle>

          <Panel flush>

            <QueryView query={legalHolds} skeleton={<Skeleton $h="80px" $r="12px" />}>

              {(rows) => (

                <DataTable>

                  <DataHead>

                    <DataCell $w="30%">Hold</DataCell>

                    <DataCell $w="20%">Resource</DataCell>

                    <DataCell $w="20%">Since</DataCell>

                    <DataCell $w="30%">Reason</DataCell>

                  </DataHead>

                  {rows.map((h) => (

                    <DataRow key={h.id} $interactive={false}>

                      <DataCell $w="30%">

                        <CellMono>{h.id.slice(0, 14)}</CellMono>

                      </DataCell>

                      <DataCell $w="20%">

                        <CellMeta>{h.resourceType ?? '—'}</CellMeta>

                      </DataCell>

                      <DataCell $w="20%">

                        <CellMeta>{h.createdAt?.slice(0, 10) ?? '—'}</CellMeta>

                      </DataCell>

                      <DataCell $w="30%">

                        <CellMeta>{h.reason ?? '—'}</CellMeta>

                      </DataCell>

                    </DataRow>

                  ))}

                </DataTable>

              )}

            </QueryView>

          </Panel>

        </motion.div>

      )}



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

                    {data.total} events in the hash-chained trail

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



      <ConfirmDialog

        open={exportConfirm}

        title="Request a data export?"

        message="The engine compiles your organization's data into a downloadable archive. This may take a few minutes for large datasets."

        confirmLabel="Request export"

        onConfirm={() => {

          requestExport.mutate(undefined, { onSuccess: () => toast.success('Export requested — it will appear here when ready') });

          setExportConfirm(false);

        }}

        onCancel={() => setExportConfirm(false)}

      />

    </ViewShell>

  );

}



// ─── Config lifecycle (G-7) ──────────────────────────────────────────



function ConfigLifecycleSection() {

  const draft = useConfigDraft();

  const history = useConfigHistory();

  const delivery = useConfigDelivery();

  const validate = useValidateConfigDraft();

  const saveDraft = useSaveConfigDraft();

  const publish = usePublishConfig();

  const rollback = useRollbackConfig();



  const [json, setJson] = useState<Record<string, unknown> | null>(null);

  const [canary, setCanary] = useState(0);

  const [publishConfirm, setPublishConfirm] = useState(false);

  const [rollbackConfirm, setRollbackConfirm] = useState(false);



  const effective = json ?? draft.data?.content ?? null;

  const jsonText = effective ? JSON.stringify(effective, null, 2) : '{}';



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

      const result = await validate.mutateAsync(effective);

      if (result.valid === false) {

        toast.error(`Validation failed: ${(result.errors ?? ['unknown']).join('; ')}`);

        return;

      }

      await saveDraft.mutateAsync(effective);

      toast.success('Draft validated and saved');

    } catch {

      /* the hook surfaced the error */

    }

  };



  return (

    <>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>

        <SectionTitle>Configuration lifecycle</SectionTitle>

        <Panel

          title="Config draft"

          subtitle="Edit, validate, and publish org config. The satellite validates against its own schema."

          action={

            <ActionCluster>

              <ActionButton

                variant="secondary"

                size="sm"

                disabled={!effective || validate.isPending}

                onClick={() => void validateAndSave()}

              >

                Validate & save

              </ActionButton>

              <ActionButton

                size="sm"

                disabled={!effective || !draft.data?.content || publish.isPending}

                onClick={() => setPublishConfirm(true)}

              >

                Publish

              </ActionButton>

            </ActionCluster>

          }

        >

          <QueryView query={draft} skeleton={<Skeleton $h="180px" $r="12px" />} isEmpty={(d) => d.content === null} empty={{ title: 'No draft', description: 'The config draft loads from the engine — edit it as JSON and validate before publishing.' }}>

            {() => (

              <ConfigStack>

                <ConfigTextarea

                  value={jsonText}

                  onChange={(e) => setFromText(e.target.value)}

                  rows={Math.min(14, Math.max(6, jsonText.split('\n').length))}

                  spellCheck={false}

                  aria-label="Config draft JSON"

                />

                {draft.data?.validationErrors && draft.data.validationErrors.length > 0 && (

                  <ValidationErrors>

                    {draft.data.validationErrors.map((err, i) => (

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

              empty={{ title: 'No published versions', description: 'Publish the draft to create version 1.' }}

            >

              {(rows) => (

                <DataTable>

                  <DataHead>

                    <DataCell $w="20%">Version</DataCell>

                    <DataCell $w="24%">Published</DataCell>

                    <DataCell $w="20%">Canary</DataCell>

                    <DataCell $w="18%">Status</DataCell>

                    <DataCell $w="18%" />

                  </DataHead>

                  {rows.slice(0, 6).map((v: ConfigVersion) => (

                    <DataRow key={v.version} $interactive={false}>

                      <DataCell $w="20%">

                        <CellMono>v{v.version}</CellMono>

                      </DataCell>

                      <DataCell $w="24%">

                        <CellMeta>{v.publishedAt?.slice(0, 10) ?? '—'}</CellMeta>

                      </DataCell>

                      <DataCell $w="20%">

                        <CellMeta>{v.canaryPercent !== null ? `${v.canaryPercent}%` : 'full'}</CellMeta>

                      </DataCell>

                      <DataCell $w="18%">

                        {v.status && <StatusPill tone={v.status === 'published' ? 'success' : 'neutral'} dot={false}>{v.status}</StatusPill>}

                      </DataCell>

                      <DataCell $w="18%">

                        <ActionButton

                          variant="secondary"

                          size="sm"

                          disabled={rollback.isPending}

                          onClick={() => setRollbackConfirm(true)}

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

              empty={{ title: 'No deliveries', description: 'Satellite delivery status appears here after publish.' }}

            >

              {(rows) => (

                <DataTable>

                  <DataHead>

                    <DataCell $w="40%">Satellite</DataCell>

                    <DataCell $w="30%">Status</DataCell>

                    <DataCell $w="30%">Version</DataCell>

                  </DataHead>

                  {rows.map((d) => (

                    <DataRow key={d.satellite} $interactive={false}>

                      <DataCell $w="40%">

                        <CellPrimary>{d.satellite}</CellPrimary>

                      </DataCell>

                      <DataCell $w="30%">

                        <StatusPill tone={d.status === 'acked' || d.status === 'delivered' ? 'success' : 'warning'} dot={false}>

                          {d.status ?? 'pending'}

                        </StatusPill>

                      </DataCell>

                      <DataCell $w="30%">

                        <CellMeta>{d.version !== null ? `v${d.version}` : '—'}</CellMeta>

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

                  { canaryPercent: canary > 0 ? canary : undefined },

                  { onSuccess: () => { toast.success(`Config published${canary > 0 ? ` at ${canary}% canary` : ''}`); setPublishConfirm(false); } },

                );

              }}

            >

              {canary > 0 ? `Publish at ${canary}%` : 'Publish'}

            </ActionButton>

          </>

        }

      >

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <p style={{ margin: 0, fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>

            {canary > 0

              ? `The config rolls out to ${canary}% of traffic first. If canary checks fail, the engine auto-rolls back.`

              : 'The config publishes to all satellites at 100%. Consider a canary percentage for safer rollout.'}

          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

            {[0, 10, 25, 50, 100].map((step) => (

              <button key={step} type="button" onClick={() => setCanary(step)}

                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${canary === step ? 'rgba(139, 143, 248, 0.6)' : 'rgba(255,255,255,0.10)'}`, background: canary === step ? 'rgba(139, 143, 248, 0.12)' : 'transparent', color: canary === step ? '#a5a8f5' : 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>

                {step === 0 ? 'Full' : `${step}% canary`}

              </button>

            ))}

          </div>

        </div>

      </Modal>



      <ConfirmDialog

        open={rollbackConfirm}

        title="Roll back the config?"

        message="The engine creates a new version with the previous version's content — history is never rewritten."

        confirmLabel="Roll back"

        onConfirm={() => {

          rollback.mutate({}, { onSuccess: () => toast.success('Config rolled back') });

          setRollbackConfirm(false);

        }}

        onCancel={() => setRollbackConfirm(false)}

      />

    </>

  );

}





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
