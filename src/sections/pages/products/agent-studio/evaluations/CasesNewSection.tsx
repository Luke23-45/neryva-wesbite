import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import { useEvalDatasets, useAddEvalCases } from '@hooks/studio/useSetupEval';
import { canSetup } from '@lib/engine/capabilities';
import { buildCase, EMPTY_CASE, type CaseDraft } from '@lib/engine/eval-cases';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Problem = styled.p`
  font-size: 12px;
  color: #f87171;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/**
 * Add cases — dedicated section replacing CasesModal (E-2). The builder is
 * byte-faithful to the modal: repeatable drafts over the HTTP case
 * vocabulary (evalCaseSchema — strict), per-case validation, JSON preview,
 * Cancel / Add N cases. Append-only by design — listing, editing, and
 * deleting cases live in the cases manager.
 *
 * E-2 return contract (C14 pattern): both entry points (per-dataset "Add
 * cases" and the results drawer's "Add cases") thread ?returnTo=<originating
 * context>, guarded to /agent-studio/* at every hop. Done/Cancel honors the
 * guarded returnTo and falls back to the evaluations list — the old modal's
 * Cancel closed back onto the originating view, which is the evaluations
 * list for both entries (there is no per-dataset or per-run detail route).
 */
export function CasesNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  const params = useParams({ from: '/agent-studio/evaluations/datasets/$datasetId/cases/new' });
  // E-2: search is validated on the evaluations layout route and inherited here.
  const search = useSearch({ from: '/agent-studio/evaluations/datasets/$datasetId/cases/new' });
  const returnTo =
    typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/')
      ? search.returnTo
      : null;
  const datasets = useEvalDatasets();

  const dataset = (datasets.data ?? []).find((d) => d.id === params.datasetId) ?? null;
  const datasetMissing = !datasets.isPending && !datasets.isError && dataset === null;

  // Role gate + unknown-dataset bounce before render (never denial panels).
  // The server gates the write too; an unknown id can only arrive from a
  // stale link, so it lands on the evaluations list.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: '/agent-studio/evaluations', search: { returnTo: undefined } });
    }
  }, [canWrite, navigate]);

  useEffect(() => {
    if (datasetMissing) {
      navigate({ to: '/agent-studio/evaluations', search: { returnTo: undefined } });
    }
  }, [datasetMissing, navigate]);

  if (!canWrite || datasetMissing) {
    return null;
  }

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/evaluations">
        <span aria-hidden="true">‹</span> Evaluations
      </SectionBackRow>
      <QueryView
        query={datasets}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No datasets', description: 'This dataset does not exist in your organization.' }}
      >
        {(rows) => {
          const current = rows.find((d) => d.id === params.datasetId);
          return current ? (
            <CasesBuilder
              key={current.id}
              datasetId={current.id}
              datasetName={current.name}
              returnTo={returnTo}
            />
          ) : null;
        }}
      </QueryView>
    </ViewShell>
  );
}

function CasesBuilder({
  datasetId,
  datasetName,
  returnTo,
}: {
  datasetId: string;
  datasetName: string;
  returnTo: string | null;
}) {
  const navigate = useNavigate();
  const addCases = useAddEvalCases();
  // Form-first builder over the HTTP case vocabulary (evalCaseSchema —
  // strict). The richer template vocabulary (expected_behavior/must_not/
  // tools_expected) is translated at seed time by provisioning — it does
  // NOT post here. Listing/editing/deleting cases lives in the cases
  // manager; this section is append-only by design.
  const [drafts, setDrafts] = useState<CaseDraft[]>([{ ...EMPTY_CASE }]);
  const [showJson, setShowJson] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const built = drafts.map(buildCase);
  const firstProblem = built.find((b) => b.problem)?.problem ?? null;
  const bodies = built.map((b) => b.body).filter((b): b is Record<string, unknown> => b !== undefined);

  const set = (index: number, patch: Partial<CaseDraft>) => {
    setDrafts((prev) => prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
  };

  // Dirty guard: block navigation while drafts hold unsent content.
  const dirty = drafts.some((draft) => Object.values(draft).some((value) => value.trim() !== ''));
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have unsent case drafts. Leaving now discards them.');

  const exit = () => {
    if (returnTo) {
      navigate({ to: returnTo });
    } else {
      navigate({ to: '/agent-studio/evaluations', search: { returnTo: undefined } });
    }
  };

  const submit = () => {
    if (bodies.length !== drafts.length || addCases.isPending) {
      return;
    }
    addCases.mutate({ datasetId, cases: bodies }, { onSuccess: () => exit() });
  };

  return (
    <>
      {dirtyDialog}
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Add cases — {datasetName}</ViewTitle>
          <ViewSubtitle>
            Append-only: new cases join the dataset — listing, editing, and deleting live in the cases manager.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Case drafts" subtitle="One draft per case — every draft must validate before the append.">
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            Scored by the engine harness on three components: lexical <Mono>contains</Mono>/<Mono>not_contains</Mono> hit fractions;
            state assertions of the form <Mono>tool.&lt;name&gt;=called|not_called</Mono> checked against the run&apos;s tool-call log;
            rubric cases sent to the engine&apos;s configured LLM-judge endpoint (<Mono>HARNESS__LLM_JUDGE_URL</Mono>) and passed at
            min score — rubric cases fail closed when no judge is configured. Empty assertions pass vacuously and say so.
            Unknown keys refuse — violations return per-index 400s, never silent drops.
          </p>
          {drafts.map((draft, index) => (
            <div key={index} style={{ borderTop: index === 0 ? 0 : '1px solid var(--neryva-border, #222)', paddingTop: index === 0 ? 0 : 12, marginTop: index === 0 ? 0 : 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>Case {index + 1}</strong>
                {drafts.length > 1 && (
                  <ActionButton variant="ghost" size="sm" onClick={() => setDrafts((prev) => prev.filter((_, i) => i !== index))}>
                    Remove
                  </ActionButton>
                )}
              </div>
              {/*
                Deviation from the modal (documented): every field carries a
                per-draft id so its <label> is programmatically associated.
                The modal's labels were unassociated (TextArea/TextInput only
                wire htmlFor when id/name is passed) — a WCAG label-association
                gap. Copy, validation, and behavior are unchanged.
              */}
              <TextArea id={`eval-case-${index}-text`} label="Input text (required)" value={draft.text} onChange={(e) => set(index, { text: e.target.value })} rows={2} placeholder="What the user asks…" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <TextArea id={`eval-case-${index}-contains`} label="Must contain (one per line)" value={draft.contains} onChange={(e) => set(index, { contains: e.target.value })} rows={2} placeholder="30 days" />
                <TextArea id={`eval-case-${index}-not-contains`} label="Must not contain (one per line)" value={draft.notContains} onChange={(e) => set(index, { notContains: e.target.value })} rows={2} placeholder="lifetime" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <TextInput id={`eval-case-${index}-state`} label="State assertions (one per line, optional)" value={draft.stateAssertions} onChange={(e) => set(index, { stateAssertions: e.target.value })} placeholder="tool.ticket_lookup=called" />
                <TextInput id={`eval-case-${index}-docids`} label="Expected document ids, uuid (one per line, drives recall)" value={draft.documentIds} onChange={(e) => set(index, { documentIds: e.target.value })} placeholder="…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginTop: 8 }}>
                <TextInput id={`eval-case-${index}-rubric`} label="Rubric instructions (optional)" value={draft.rubricInstructions} onChange={(e) => set(index, { rubricInstructions: e.target.value })} placeholder="Judge tone…" />
                <TextInput id={`eval-case-${index}-min-score`} label="Min score" value={draft.minScore} onChange={(e) => set(index, { minScore: e.target.value })} placeholder="0.7" />
              </div>
              {built[index]?.problem && <Problem>{built[index]?.problem}</Problem>}
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <ActionButton variant="secondary" size="sm" onClick={() => setDrafts((prev) => [...prev, { ...EMPTY_CASE }])}>
              Another case
            </ActionButton>
          </div>
          {showJson && (
            <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 12 }}>
              {JSON.stringify({ cases: bodies }, null, 2)}
            </pre>
          )}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={exit}>
              Cancel
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={() => setShowJson((v) => !v)}>
              {showJson ? 'Hide JSON' : 'Preview JSON'}
            </ActionButton>
            <ActionButton
              disabled={bodies.length !== drafts.length || addCases.isPending}
              title={firstProblem ?? `Append ${drafts.length} case${drafts.length === 1 ? '' : 's'}`}
              onClick={submit}
            >
              Add {drafts.length} case{drafts.length === 1 ? '' : 's'}
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
    </>
  );
}
