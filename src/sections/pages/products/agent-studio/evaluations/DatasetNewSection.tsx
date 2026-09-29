import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { useCreateEvalDataset, EVAL_DATASET_NAME_MAX, EVAL_DATASET_DESC_MAX } from '@hooks/studio/useSetupEval';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

/**
 * New dataset — dedicated section replacing DatasetModal (E-1). The form is
 * byte-faithful to the modal: name/description caps with counts (the engine
 * silently truncates names >128 and descriptions >2048 — E-02), trimmed
 * create payload, empty description omitted, Cancel/Create semantics.
 *
 * Exit contract (C14 pattern): honors a guarded ?returnTo (threaded by the
 * layout's validateSearch and inherited here) and falls back to the
 * evaluations list — the old modal's Cancel closed back onto the
 * originating view, which is the evaluations list.
 */
export function DatasetNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  // Search is validated on the evaluations layout route and inherited here.
  const search = useSearch({ from: '/agent-studio/evaluations/datasets/new' });
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
      <DatasetForm returnTo={returnTo} />
    </ViewShell>
  );
}

function DatasetForm({ returnTo }: { returnTo: string | null }) {
  const navigate = useNavigate();
  const create = useCreateEvalDataset();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while the form holds unsent content. The
  // submitted flag disarms the guard at commit time (CloneSection pattern):
  // the success navigation fires asynchronously after the mutation
  // resolves, and the blocker's shouldBlockFn closure would otherwise still
  // see the pre-submit render's dirty=true. Re-armed if the commit fails.
  const dirty = !submitted && (name.trim() !== '' || description.trim() !== '');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent dataset draft. Leaving now discards it.');

  const exit = () => {
    if (returnTo) {
      navigate({ to: returnTo });
    } else {
      navigate({ to: '/agent-studio/evaluations', search: { returnTo: undefined } });
    }
  };

  const submit = () => {
    if (!name.trim() || create.isPending) {
      return;
    }
    // Commit-time disarm: the draft is handed to the engine here, so the
    // async success navigation must not trip the leave dialog. Re-armed on
    // failure so a failed commit keeps protecting the draft.
    setSubmitted(true);
    create.mutate(
      { name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}) },
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
          <ViewTitle ref={headingRef} tabIndex={-1}>New dataset</ViewTitle>
          <ViewSubtitle>
            A regression suite your publish gates read — template installs seed datasets automatically.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Dataset" subtitle="Names cap at 128 chars and descriptions at 2048 — the engine silently truncates beyond that, so the inputs cap and count instead of losing text.">
          <TextInput
            id="eval-dataset-name"
            label={`Name${name ? ` — ${name.length}/${EVAL_DATASET_NAME_MAX}` : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. refund-regressions"
            maxLength={EVAL_DATASET_NAME_MAX}
            autoFocus
          />
          <div style={{ marginTop: 12 }}>
            <TextInput
              id="eval-dataset-description"
              label={`Description (optional)${description ? ` — ${description.length}/${EVAL_DATASET_DESC_MAX}` : ''}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this suite guards"
              maxLength={EVAL_DATASET_DESC_MAX}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <ActionButton variant="secondary" onClick={exit}>
              Cancel
            </ActionButton>
            <ActionButton
              disabled={!name.trim() || create.isPending}
              onClick={submit}
            >
              Create
            </ActionButton>
          </div>
        </Panel>
      </motion.div>
    </>
  );
}
