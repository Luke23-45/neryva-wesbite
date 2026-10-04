import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { useSetControlBlock, BLOCK_TARGETS, describeBlockExpiry } from '@hooks/studio/useSetupOperate';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from '../SectionBackRow';
import { Dropdown } from '@components/common/ui/Dropdown';

const FieldLabel = styled.label`
  font-size: 13px;
  display: block;
`;


const FieldProblem = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.status.error.fg};
  margin: 4px 0 0;
`;

const FieldNote = styled.p`
  font-size: 12px;
  opacity: 0.75;
  margin: 4px 0 0;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/** Full route id once the coordinator wires it (additive leaf under the libraries area, path '/blocks/new'). */
export const LIBRARIES_BLOCKS_NEW_ROUTE_ID = '/agent-studio/blocks/new' as const;

const BLOCKS_LIST_PATH = '/agent-studio/blocks';

/**
 * Set control block — dedicated section replacing the "Set control block"
 * modal from the Libraries blocks page.
 *
 * Copy, validation, and danger semantics are verbatim from the modal:
 * kill-switch explainer, target type select, target name 1–128, mandatory
 * reason 1–512 (audited), optional future-dated expiry (empty = permanent),
 * and TWO-STEP ARMING for permanent blocks — the first click only arms
 * ("Yes — block with no expiry"), the second commits. A route mount is
 * fresh by construction, so the modal's close-reset is unnecessary.
 */
export function LibrariesBlockNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canGovern = canSetup(role, 'setup:govern');
  const setBlock = useSetControlBlock();

  const [targetType, setTargetType] = useState<string>('assistant');
  const [targetName, setTargetName] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [permanentArmed, setPermanentArmed] = useState(false);
  // Clock captured once per mount (render must stay pure — no Date.now() inline).
  const [nowMs] = useState(() => Date.now());
  // datetime-local is timezone-naive: the min hint must be local wall-clock,
  // not the UTC slice, or non-UTC operators see a wrong earliest time.
  const [minExpiry] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Role gate. Nothing renders before it (server gates too).
  useEffect(() => {
    if (!canGovern) {
      navigate({ to: BLOCKS_LIST_PATH });
    }
  }, [canGovern, navigate]);

  // Dirty guard: block navigation while the form has unsent content.
  // Declared before the gate return (rules of hooks) — the dialog only
  // renders with the form below. The submitted flag releases the guard on
  // the success navigation: after a committed block there is nothing
  // unsaved, so the post-submit return must not trip the leave dialog.
  const [submitted, setSubmitted] = useState(false);
  const dirty =
    !submitted &&
    (targetType !== 'assistant' || targetName.trim() !== '' || reason.trim() !== '' || expiresAt !== '');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent control block. Leaving now discards it.');

  if (!canGovern) {
    return null;
  }

  const nameProblem =
    targetName.trim().length >= 1 && targetName.trim().length <= 128
      ? null
      : 'Target names are 1–128 chars.';
  const reasonProblem =
    reason.trim().length >= 1 && reason.trim().length <= 512
      ? null
      : 'Operator justification is mandatory (1–512 chars).';
  const expiryText = expiresAt.trim();
  const expiryMs = expiryText === '' ? null : new Date(expiryText).getTime();
  const expiryProblem =
    expiryText === ''
      ? null
      : expiryMs === null || Number.isNaN(expiryMs)
        ? 'Expiry must be a real date and time.'
        : expiryMs <= nowMs
          ? 'Expiry must be in the future.'
          : null;
  const valid = !nameProblem && !reasonProblem && !expiryProblem;
  const permanent = expiryText === '';

  const submit = () => {
    if (!valid || setBlock.isPending) {
      return;
    }
    // Permanent blocks never lift — require the same two-step arming the
    // modal used before committing.
    if (permanent && !permanentArmed) {
      setPermanentArmed(true);
      return;
    }
    // Commit-time disarm: the block is handed to the engine here, so the
    // async success navigation must not trip the leave dialog. Re-armed on
    // failure so a failed commit keeps protecting the draft.
    setSubmitted(true);
    setBlock.mutate(
      {
        targetType,
        targetName: targetName.trim(),
        reason: reason.trim(),
        ...(permanent ? {} : { expiresAt: new Date(expiryText).toISOString() }),
      },
      {
        onSuccess: () => {
          navigate({ to: BLOCKS_LIST_PATH });
        },
        // A failed commit keeps the draft and its protection.
        onError: () => setSubmitted(false),
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to={BLOCKS_LIST_PATH}>
        <span aria-hidden="true">‹</span> Blocks
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Set control block</ViewTitle>
          <ViewSubtitle>
            Governance kill switch — refuses acceptance, assignment, tool calls, credentials,
            and installs. Expiry needs no worker; terminal runs never strand. There is no edit:
            to change a block, clear it and set it again.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Control block" subtitle="Target, mandatory audited reason, and optional expiry.">
          <FieldLabel>
            Target type
            <div style={{ marginTop: 4 }}>
              <Dropdown
                variant="select"
                aria-label="Target type"
                value={targetType}
                onChange={(v) => setTargetType(v)}
                items={BLOCK_TARGETS.map((target) => ({ value: target, label: target }))}
              />
            </div>
          </FieldLabel>
          <div style={{ marginTop: 12 }}>
            <TextInput id="block-target-name" label="Target name (id or slug)" value={targetName} onChange={(e) => setTargetName(e.target.value)} error={nameProblem ?? undefined} />
          </div>
          <div style={{ marginTop: 12 }}>
            <TextInput id="block-reason" label="Reason (mandatory, audited)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this block exists" error={reason.trim() ? (reasonProblem ?? undefined) : undefined} />
          </div>
          <div style={{ marginTop: 12 }}>
            <FieldLabel>
              Expires at (optional)
              <input
                type="datetime-local"
                aria-label="Block expiry"
                value={expiresAt}
                min={minExpiry}
                onChange={(e) => {
                  setExpiresAt(e.target.value);
                  setPermanentArmed(false);
                }}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </FieldLabel>
            {expiryProblem ? (
              <FieldProblem>{expiryProblem}</FieldProblem>
            ) : (
              <FieldNote>
                {permanent
                  ? 'No expiry = permanent. Setting it asks for a second confirmation.'
                  : `Lifts automatically ${describeBlockExpiry(new Date(expiryText).toISOString())} — no worker needed.`}
              </FieldNote>
            )}
          </div>
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: BLOCKS_LIST_PATH })}>
              Cancel
            </ActionButton>
            <ActionButton variant="danger" disabled={!valid || setBlock.isPending} onClick={submit}>
              <ShieldAlert size={13} strokeWidth={1.8} />
              {permanentArmed ? 'Yes — block with no expiry' : 'Set block'}
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
