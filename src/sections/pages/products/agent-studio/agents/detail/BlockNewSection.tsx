import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { useAssistant } from '@hooks/studio/useAgentAuthoring';
import { useSetControlBlock, BLOCK_TARGETS } from '@hooks/studio/useSetupOperate';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from '../SectionBackRow';
import { Dropdown } from '@components/common/ui/Dropdown';

const FieldLabel = styled.label`
  font-size: 13px;
  display: block;
`;


const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/** Full route id once the coordinator wires it (child of agentStudioAgentsRoute, path '/$agentId/block/new'). */
export const BLOCK_NEW_ROUTE_ID = '/agent-studio/agents/$agentId/block/new' as const;

/**
 * Set control block — dedicated section replacing BlockModal (A-11) from
 * the agent detail Operate panel.
 *
 * Copy, validation, and danger semantics are verbatim from the modal:
 * kill-switch explainer, target type select, target name 1–128 (prefilled
 * with the agent id), mandatory reason 1–512 (audited), optional
 * future-dated expiry (empty = permanent), and TWO-STEP ARMING for
 * permanent blocks — the first click only arms ("Yes — block with no
 * expiry"), the second commits. A route mount is fresh by construction,
 * so the modal's keyed-remount freshness trick is unnecessary.
 */
export function BlockNewSection() {
  const params = useParams({ from: BLOCK_NEW_ROUTE_ID });
  const agentId = params.agentId;
  const { role } = useOrg();
  const navigate = useNavigate();
  const canGovern = canSetup(role, 'setup:govern');
  // Don't fire the agent read for users who are about to bounce (server gates too).
  const assistant = useAssistant(canGovern ? agentId : null);
  const setBlock = useSetControlBlock();

  const [targetType, setTargetType] = useState<string>('assistant');
  const [targetName, setTargetName] = useState(agentId);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [permanentArmed, setPermanentArmed] = useState(false);
  // Clock captured once per mount (render must stay pure — no Date.now() inline).
  const [nowMs] = useState(() => Date.now());
  const [minExpiry] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Role gate + unknown-agent bounce. Nothing renders before the gates.
  const agentUnknown = !assistant.isPending && (assistant.isError || assistant.data === null);
  useEffect(() => {
    if (!canGovern || agentUnknown) {
      navigate({ to: '/agent-studio/agents' });
    }
  }, [canGovern, agentUnknown, navigate]);

  // Dirty guard: block navigation while the form has unsent content.
  // Declared before the gate return (rules of hooks) — the dialog only
  // renders with the form below. The submitted flag releases the guard on
  // the success navigation: after a committed block there is nothing
  // unsaved, so the post-submit return must not trip the leave dialog.
  const [submitted, setSubmitted] = useState(false);
  const dirty =
    !submitted && (targetName !== agentId || reason.trim() !== '' || expiresAt !== '');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent control block. Leaving now discards it.');

  if (!canGovern || agentUnknown) {
    return null;
  }

  const detailTo = { to: '/agent-studio/agents/$agentId' as const, params: { agentId } };
  // The styled back row erases TanStack's per-route param/search inference,
  // so the account id is interpolated into the path (P1 channels pattern).
  const detailPath = `/agent-studio/agents/${agentId}`;

  const nameProblem = targetName.trim().length >= 1 && targetName.trim().length <= 128 ? null : 'Target names are 1–128 chars.';
  const reasonProblem = reason.trim().length >= 1 && reason.trim().length <= 512 ? null : 'Operator justification is mandatory (1–512 chars).';
  const expiryProblem =
    expiresAt.trim() === ''
      ? null
      : (() => {
          const parsed = Date.parse(expiresAt);
          if (!Number.isFinite(parsed)) return 'Expiry must be a real timestamp.';
          return parsed > nowMs ? null : 'Expiry must be in the future.';
        })();
  const permanent = expiresAt.trim() === '';
  const valid = !nameProblem && !reasonProblem && !expiryProblem;

  const submit = () => {
    if (!valid || setBlock.isPending) {
      return;
    }
    // Permanent blocks never lift — require the same two-step arming the
    // Libraries page uses before committing.
    if (permanent && !permanentArmed) {
      setPermanentArmed(true);
      return;
    }
    setBlock.mutate(
      {
        targetType,
        targetName: targetName.trim(),
        reason: reason.trim(),
        ...(permanent ? {} : { expiresAt: new Date(expiresAt).toISOString() }),
      },
      { onSuccess: () => {
          setSubmitted(true);
          navigate(detailTo);
        } },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to={detailPath}>
        <span aria-hidden="true">‹</span> Agent detail
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Set control block</ViewTitle>
          <ViewSubtitle>
            Governance kill switch — refuses acceptance, assignment, tool calls, credentials, and installs. Expiry needs
            no worker; terminal runs never strand.
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
          <FieldLabel style={{ marginTop: 12 }}>
            Expires at (optional — lifts automatically, no worker; empty = permanent)
            <input
              type="datetime-local"
              value={expiresAt}
              min={minExpiry}
              onChange={(e) => {
                setExpiresAt(e.target.value);
                setPermanentArmed(false);
              }}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            />
          </FieldLabel>
          {expiryProblem && <p style={{ fontSize: 12, color: '#f87171' }}>{expiryProblem}</p>}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate(detailTo)}>
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
