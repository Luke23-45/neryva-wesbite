import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { pageItem } from '@styles/motion';
import { useEnqueuePurge, buildPurgeBody, PURGE_REASONS } from '@hooks/studio/useLifecycle';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { ScopeSelect, ValidationError, FieldColumn, ActionsRow } from './section-styles';

/**
 * Request a purge — dedicated section replacing the request-purge modal
 * (X-6) that lived in PurgePanel. The conversation-id field, reason
 * select, validation error line, explainer, and Cancel / Enqueue purge
 * are verbatim from the dialog — validation stays in the shared
 * buildPurgeBody so the section and the engine DTO can never drift.
 *
 * On success the section navigates back to the compliance list with the
 * new task id in the search params, so the panel's task-status lookup
 * shows the just-enqueued task — exactly what the dialog-era onSuccess
 * did via panel state.
 */
export function PurgeNewSection() {
  const navigate = useNavigate();
  const enqueue = useEnqueuePurge();
  const [scopeId, setScopeId] = useState('');
  const [reason, setReason] = useState<'user_request' | 'retention_expiry' | 'org_deletion'>('user_request');
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while the form has unsent content.
  const dirty = scopeId.trim() !== '';
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent purge request. Leaving now discards it.');

  const { error } = buildPurgeBody({ scopeType: 'conversation', scopeId, reason });

  const submit = () => {
    if (enqueue.isPending || error) {
      return;
    }
    enqueue.mutate(
      { scopeType: 'conversation', scopeId, reason },
      {
        onSuccess: (data) => {
          toast.success('Purge enqueued');
          navigate({
            to: '/agent-studio/compliance',
            search: data.task ? { purgeTask: data.task.id } : {},
          });
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to="/agent-studio/compliance">
        <span aria-hidden="true">‹</span> Compliance
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Request a purge</ViewTitle>
          {/* Dialog explainer, verbatim — the section pattern needs a
              subtitle, so it lives here instead of the panel body. */}
          <ViewSubtitle>
            This starts the multi-step purge worker. It is not instant and not silent —
            the task id tracks every step, and legal holds block it.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Purge" subtitle="Conversation and reason — the worker does the rest.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TextInput
              id="purge-scope-id"
              label="Conversation id (UUID)"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              placeholder="Conversation UUID to purge"
            />
            <FieldColumn>
              Reason
              <ScopeSelect value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} aria-label="Purge reason">
                {PURGE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </ScopeSelect>
            </FieldColumn>
            {error && <ValidationError>{error}</ValidationError>}
            <ActionsRow>
              <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/compliance' })}>
                Cancel
              </ActionButton>
              <ActionButton disabled={enqueue.isPending || !!error} onClick={submit}>
                Enqueue purge
              </ActionButton>
            </ActionsRow>
          </div>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
