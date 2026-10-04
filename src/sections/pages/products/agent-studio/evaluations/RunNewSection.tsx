import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { Dropdown } from '@components/common/ui/Dropdown';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { useEvalDatasets, useStartEvalRun } from '@hooks/studio/useSetupEval';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useAssistantVersions } from '@hooks/studio/useAgentAuthoring';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

/**
 * Start eval run — dedicated section replacing StartRunModal (E-5). The
 * configuration is byte-faithful to the modal: dataset picker, assistant
 * picker (resets the version on change), PUBLISHED-versions-only picker
 * (drafts evaluate from their agent page, where the snapshot synthesis
 * context lives), attempts clamped to 1–5, identical start payload.
 *
 * Exit contract (C14 pattern): honors a guarded ?returnTo (threaded by the
 * layout's validateSearch and inherited here) and falls back to the
 * evaluations list — the old modal's Cancel closed back onto the
 * originating view, which is the evaluations list.
 */
export function RunNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  // Search is validated on the evaluations layout route and inherited here.
  const search = useSearch({ from: '/agent-studio/evaluations/runs/new' });
  const canWrite = canSetup(role, 'setup:author');
  const returnTo =
    typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/')
      ? search.returnTo
      : null;

  // Role gate before render (never denial panels). The server gates the
  // write too; a reader can only arrive from a stale link.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: '/agent-studio/evaluations', search: { returnTo: undefined } });
    }
  }, [canWrite, navigate]);

  if (!canWrite) {
    return null;
  }

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/evaluations">
        <span aria-hidden="true">‹</span> Evaluations
      </SectionBackRow>
      <RunForm returnTo={returnTo} />
    </ViewShell>
  );
}

function RunForm({ returnTo }: { returnTo: string | null }) {
  const navigate = useNavigate();
  const start = useStartEvalRun();
  const datasets = useEvalDatasets();
  const assistants = useAssistants();
  const [datasetId, setDatasetId] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [attempts, setAttempts] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const versions = useAssistantVersions(assistantId || null);
  const publishedVersions = (versions.data ?? []).filter((v) => v.status === 'PUBLISHED');
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Published versions only for ad-hoc runs from here (drafts evaluate from
  // their agent page, where the snapshot synthesis context lives).
  const valid = datasetId !== '' && versionId !== '';

  // Dirty guard: block navigation while the run configuration is unsent.
  // The submitted flag disarms the guard at commit time (CloneSection
  // pattern): the success navigation fires asynchronously after the start
  // resolves, and the blocker's shouldBlockFn closure would otherwise still
  // see the pre-submit render's dirty=true. Re-armed if the start fails.
  const dirty = !submitted && (datasetId !== '' || assistantId !== '' || versionId !== '' || attempts !== '1');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent run configuration. Leaving now discards it.');

  const exit = () => {
    if (returnTo) {
      navigate({ to: returnTo });
    } else {
      navigate({ to: '/agent-studio/evaluations', search: { returnTo: undefined } });
    }
  };

  const submit = () => {
    if (!valid || start.isPending) {
      return;
    }
    // Commit-time disarm: the configuration is handed to the engine here,
    // so the async success navigation must not trip the leave dialog.
    // Re-armed on failure so a failed start keeps protecting the config.
    setSubmitted(true);
    start.mutate(
      { datasetId, assistantVersionId: versionId.trim(), attemptsPerCase: Math.min(Math.max(1, Math.round(Number(attempts) || 1)), 5) },
      {
        onSuccess: () => { exit(); },
        onError: () => { setSubmitted(false); },
      },
    );
  };

  return (
    <>
      {dirtyDialog}
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Start eval run</ViewTitle>
          <ViewSubtitle>
            Execute a PUBLISHED version against a dataset — the engine scores lexical, state, and rubric checks.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Run configuration" subtitle="Same dataset, same attempts as a re-run — drafts evaluate from their agent page.">
          <Dropdown
            variant="select"
            label="Dataset"
            value={datasetId}
            onChange={setDatasetId}
            items={[
              { value: '', label: 'Pick a dataset…' },
              ...(datasets.data ?? []).map((dataset) => ({
                value: dataset.id,
                label: dataset.name,
              })),
            ]}
          />
          <Dropdown
            variant="select"
            label="Assistant (to locate published versions)"
            value={assistantId}
            onChange={(v) => { setAssistantId(v); setVersionId(''); }}
            items={[
              { value: '', label: 'Pick an assistant…' },
              ...(assistants.data ?? []).map((assistant) => ({
                value: assistant.id,
                label: assistant.name,
              })),
            ]}
          />
          <Dropdown
            variant="select"
            label="Published version"
            value={versionId}
            onChange={setVersionId}
            items={[
              { value: '', label: assistantId ? 'Pick a PUBLISHED version…' : 'Pick an assistant first…' },
              ...publishedVersions.map((v) => ({
                value: v.id,
                label: `v${v.version}${v.hash ? ` · ${v.hash.slice(0, 12)}` : ''}`,
              })),
            ]}
          />
          <div style={{ marginTop: 12, maxWidth: 200 }}>
            <TextInput id="eval-run-attempts" label="Attempts per case (1–5)" type="number" value={attempts} min={1} max={5} onChange={(e) => setAttempts(e.target.value)} />
          </div>
          <p style={{ fontSize: 12, opacity: 0.65 }}>
            Generic runs execute PUBLISHED versions. Draft evaluation (with snapshot synthesis) runs from the version&apos;s agent page.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <ActionButton variant="secondary" onClick={exit}>
              Cancel
            </ActionButton>
            <ActionButton
              disabled={!valid || start.isPending}
              onClick={submit}
            >
              Start run
            </ActionButton>
          </div>
        </Panel>
      </motion.div>
    </>
  );
}
