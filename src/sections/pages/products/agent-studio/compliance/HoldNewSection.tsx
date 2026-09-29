import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { pageItem } from '@styles/motion';
import { usePlaceLegalHold, buildHoldBody, HOLD_SCOPE_TYPES } from '@hooks/studio/useLifecycle';
import { useOrg } from '@/Context/OrgContext';
import { canSetup } from '@lib/engine/capabilities';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { ScopeSelect, ValidationError, FieldColumn, ActionsRow } from './section-styles';

/**
 * Place a legal hold — dedicated section replacing PlaceHoldDialog (X-4).
 * C-08: hold management is owner/admin gated by the engine; the section
 * mirrors the client gate the rest of the console uses (setup:govern) and
 * bounces everyone else to the compliance list before rendering anything.
 *
 * Fields, UUID validation, the 512-char reason cap, the validation error
 * line, and Cancel / Place hold are verbatim from the dialog — validation
 * stays in the shared buildHoldBody so the section and the engine DTO can
 * never drift.
 */
export function HoldNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canGovern = canSetup(role, 'setup:govern');

  const placeHold = usePlaceLegalHold();
  const [scopeType, setScopeType] = useState('conversation');
  const [scopeId, setScopeId] = useState('');
  const [reason, setReason] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while the form has unsent content.
  const dirty = scopeId.trim() !== '' || reason.trim() !== '';
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent legal hold. Leaving now discards it.');

  // Non-govern users land here directly — bounce to the compliance list
  // (the engine gates too). Nothing renders before the gate.
  useEffect(() => {
    if (!canGovern) {
      navigate({ to: '/agent-studio/compliance' });
    }
  }, [canGovern, navigate]);

  if (!canGovern) {
    return null;
  }

  const { error } = buildHoldBody({ scopeType, scopeId, reason });

  const submit = () => {
    if (placeHold.isPending || error) {
      return;
    }
    placeHold.mutate(
      { scopeType, scopeId, reason },
      {
        onSuccess: () => {
          toast.success('Legal hold placed');
          navigate({ to: '/agent-studio/compliance' });
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
          <ViewTitle ref={headingRef} tabIndex={-1}>Place a legal hold</ViewTitle>
          <ViewSubtitle>
            Active holds block purges for their scope. Placing a hold is a privileged act —
            owner or admin only.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Hold" subtitle="Scope and the audit-record reason.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldColumn>
              Scope
              <ScopeSelect value={scopeType} onChange={(e) => setScopeType(e.target.value)} aria-label="Hold scope">
                {HOLD_SCOPE_TYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </ScopeSelect>
            </FieldColumn>
            <TextInput
              id="hold-scope-id"
              label={scopeType === 'organization' ? 'Scope id (optional, UUID)' : 'Conversation id (UUID)'}
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              placeholder={scopeType === 'organization' ? 'Leave empty for the whole organization' : 'Conversation UUID'}
            />
            <TextArea
              id="hold-reason"
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this hold exists — it becomes the audit record"
              maxLength={512}
              rows={3}
            />
            {error && <ValidationError>{error}</ValidationError>}
            <ActionsRow>
              <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/compliance' })}>
                Cancel
              </ActionButton>
              <ActionButton disabled={placeHold.isPending || !!error} onClick={submit}>
                Place hold
              </ActionButton>
            </ActionsRow>
          </div>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
