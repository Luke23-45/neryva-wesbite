import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Play, RotateCcw, Square } from 'lucide-react';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { useTrySession, type RunNotice } from '@hooks/studio/useChat';
import type { ModelAvailability } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import { TRY_COPY, describeTryPrereqs } from '../lib/try-model';
import { readTryParam, writeTryParam } from '../lib/try-thread-param';
import { TraceDrawer, type TraceEditTarget } from './TraceDrawer';
import { SkeletonRows } from './SkeletonRows';
import { StreamingBubble, Note } from './TraceDrawer.styles';
import { EmptyState, Wrap } from './InstructionsSection.styles';
import { TextButton } from './ToolsSection.styles';
import {
  Bubble,
  BubbleMeta,
  DockRow,
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  Muted,
  NoticePill,
  PrereqBlock,
  PrereqDetail,
  PrereqHeadline,
  QuotaCtaRow,
  QuotaPanel,
  QuotaCopy,
  QuotaTitle,
  Thread,
  TurnGroup,
} from './TrySection.styles';

export interface TryConsoleProps {
  assistantId: string;
  definition: ConsumerDefinition | null;
  /** Runnable version to pin (null = none) — every send posts a fresh test run. */
  runnableVersionId: string | null;
  versionLabel: string;
  runnable: boolean;
  canRun: boolean;
  /** Role truth for viewers (setup:author denial copy). */
  deniedCopy: string;
  models: ModelAvailability[] | undefined;
  modelsLoading: boolean;
  /** Builder canvas grade reporter — detail surfaces omit it. */
  onTryEvent?: (event: { at: string; failed: boolean; restored?: boolean }) => void;
  /** Builder jumps select slots; detail links out to the builder. */
  editMode: { kind: 'jump'; onEditJump: (target: TraceEditTarget) => void } | { kind: 'link'; builderHref: string };
  /** Optional header — the detail version picker lives here. */
  header?: ReactNode;
}

/**
 * Limit-hit panel: the run was refused with `quota_exceeded` — the
 * organization's usage limit was reached. Names the way out (billing).
 */
function QuotaLimitPanel({
  editMode,
}: {
  editMode: TryConsoleProps['editMode'];
}) {
  const connectCta =
    editMode.kind === 'jump' ? (
      <TextButton onClick={() => editMode.onEditJump('model')}>
        Connect a provider ›
      </TextButton>
    ) : (
      <Link to={editMode.builderHref}>Connect a provider ›</Link>
    );
  return (
    <QuotaPanel>
      <QuotaTitle>Usage limit reached</QuotaTitle>
      <QuotaCopy>
        This organization’s usage limit was reached, so the run was refused.
      </QuotaCopy>
      <QuotaCtaRow>
        <Link to="/platform/billing">Open billing</Link>
        {connectCta}
      </QuotaCtaRow>
    </QuotaPanel>
  );
}

export function TryConsole({
  assistantId,
  definition,
  runnableVersionId,
  versionLabel,
  runnable,
  canRun,
  deniedCopy,
  models,
  modelsLoading,
  onTryEvent,
  editMode,
  header,
}: TryConsoleProps) {
  const [prompt, setPrompt] = useState('');
  const [traceKey, setTraceKey] = useState<string | null>(null);
  const [restoredParam] = useState<string | null>(() => readTryParam());
  const reportedRef = useRef<Set<string>>(new Set());

  const session = useTrySession(assistantId, runnable ? runnableVersionId : null, runnable ? restoredParam : null);
  const { turns, isBusy } = session;

  const allowed = definition?.model_policy.allowed_models ?? [];
  const usable = new Set((models ?? []).filter((m) => m.usable).map((m) => m.ref));
  const usableCount = models === undefined ? -1 : allowed.filter((ref) => usable.has(ref)).length;
  // TRY-M1 — the run gate: the Run button arms only when at least one
  // allowed model is usable for this org. usableCount is -1 while the
  // availability read is in flight; only a loaded zero blocks — a
  // still-loading read must not wedge the console (the engine's typed
  // refusal is the backstop meanwhile).
  const modelBlocked = usableCount === 0;
  const hasInstructions = (definition?.instructions ?? '').trim() !== '';

  // No usable model: the honest empty state — top up credits to try.
  const blockedCopy = TRY_COPY.noUsableModel;

  const prereqs = runnable
    ? describeTryPrereqs({ hasRunnableVersion: true, usableModelCount: Math.max(usableCount, 0), hasInstructions })
    : describeTryPrereqs({ hasRunnableVersion: false, usableModelCount: Math.max(usableCount, 0), hasInstructions });

  // Report terminal turns once so the builder canvas grade reflects this load.
  // Restored turns report once too, but on a distinct path (restored: true):
  // they carry no version pin, so the canvas must never grade them as the
  // current draft's "Last run ok" (TRY-2 keeps them out of the live lastTry).
  useEffect(() => {
    if (!onTryEvent) return;
    for (const turn of turns) {
      if ((turn.status === 'done' || turn.status === 'error') && !reportedRef.current.has(turn.key)) {
        reportedRef.current.add(turn.key);
        onTryEvent({ at: new Date().toISOString(), failed: turn.status === 'error', ...(turn.restored ? { restored: true } : {}) });
      }
    }
  }, [turns, onTryEvent]);

  // The thread pointer lives in ?try= — reload restores it from the server.
  const lastConversationId = turns.length > 0 ? (turns[turns.length - 1].conversationId ?? null) : null;
  useEffect(() => {
    writeTryParam(lastConversationId);
  }, [lastConversationId]);

  const editJumpProps =
    editMode.kind === 'jump' ? { onEditJump: editMode.onEditJump } : { builderHref: editMode.builderHref };

  const send = () => {
    // Belt-and-suspenders with the disabled Run button: the dock never
    // posts a try prompt without a usable model (TRY-M1).
    if (modelBlocked) {
      return;
    }
    if (session.send(prompt)) {
      setPrompt('');
    }
  };

  const traceTurn = turns.find((t) => t.key === traceKey) ?? null;
  const guardrails = definition?.guardrails ?? null;
  // A restored thread whose transcript fetch failed: the hook leaves the
  // turn parked with its "restored" notice and no content — surface the
  // failure visibly instead of an empty restored turn.
  const restoreFailed = session.messages.isError && turns.some((t) => t.restored);

  const fixLink = (kind: 'no-model' | 'instructions-advisory') =>
    editMode.kind === 'jump' ? (
      <TextButton onClick={() => editMode.onEditJump(kind === 'instructions-advisory' ? 'purpose' : 'model')}>
        {kind === 'instructions-advisory' ? 'Edit in Purpose ›' : 'Fix in Model ›'}
      </TextButton>
    ) : (
      <Link to={editMode.builderHref}>{kind === 'instructions-advisory' ? 'Edit in Purpose ›' : 'Fix in Model ›'}</Link>
    );

  return (
    <Wrap>
      {header}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Runs against</FieldTitle>
        </FieldHead>
        <FieldHelper>
          {runnable ? `${versionLabel} — draft-pinned, never billable.` : 'No runnable version open — save a draft first.'}
        </FieldHelper>
      </FieldBlock>

      {modelsLoading && <SkeletonRows rows={1} widths={['45%']} />}
      {prereqs.map((prereq) => (
        <PrereqBlock key={prereq.kind} $tone={prereq.tone}>
          <PrereqHeadline $tone={prereq.tone}>{prereq.headline}</PrereqHeadline>
          <PrereqDetail>{prereq.detail}</PrereqDetail>
          {prereq.kind === 'no-model' && !modelsLoading && fixLink(prereq.kind)}
          {prereq.kind === 'instructions-advisory' && fixLink('instructions-advisory')}
        </PrereqBlock>
      ))}

      {turns.length === 0 ? (
        // Finding 2 — the dead end reads as one coherent state: while no
        // usable model exists the thread area echoes the blocked copy
        // instead of inviting input that cannot run.
        <>
          <EmptyState>
            {modelBlocked ? (
              <>
                {blockedCopy}{' '}
                <Link to="/platform/billing">Top up credits</Link>
              </>
            ) : (
              'Ask anything — the reply streams here with its trace.'
            )}
          </EmptyState>
        </>
      ) : (
        <>
          <Thread>
          {turns.map((turn) => {
            const reply = turn.agentText !== '' ? turn.agentText : turn.liveText;
            const streaming = turn.status === 'streaming' || turn.status === 'accepted' || turn.status === 'sending';
            return (
              <TurnGroup key={turn.key}>
                <Bubble $role="user">
                  <BubbleMeta>You</BubbleMeta>
                  {turn.prompt !== '' ? turn.prompt : <Muted>…</Muted>}
                </Bubble>
                {reply !== '' ? (
                  <Bubble $role="agent">
                    <BubbleMeta>Assistant</BubbleMeta>
                    {reply}
                    {streaming && turn.agentText === '' ? '▍' : ''}
                  </Bubble>
                ) : streaming ? (
                  <Bubble $role="agent">
                    <BubbleMeta>Assistant</BubbleMeta>
                    <StreamingBubble />
                  </Bubble>
                ) : null}
                {turn.quota && <QuotaLimitPanel editMode={editMode} />}
                {turn.notices.map((notice: RunNotice) => (
                  <NoticePill key={notice.id} $tone={notice.kind}>
                    {notice.text}
                  </NoticePill>
                ))}
                {turn.restored && restoreFailed && (
                  <NoticePill $tone="error">
                    The previous thread couldn’t be restored — this composer
                    starts fresh. Nothing was deleted; the thread is still on
                    the server.{' '}
                    <TextButton onClick={() => void session.messages.refetch()}>
                      Retry restore
                    </TextButton>
                  </NoticePill>
                )}
                {(turn.status === 'done' || turn.status === 'error') && (
                  <TextButton onClick={() => setTraceKey(turn.key)}>Open trace ›</TextButton>
                )}
              </TurnGroup>
            );
          })}
        </Thread>
        </>
      )}

      {canRun ? (
        <>
          <TextArea
            label="Test prompt"
            name="try-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            // Finding 2 — the prompt field must not invite input that cannot
            // run: disabled with the blocked copy while no usable model exists.
            disabled={modelBlocked}
            placeholder={modelBlocked ? blockedCopy : 'A customer asks… (1–8192)'}
          />
          <DockRow>
            {isBusy ? (
              <ActionButton size="lg" onClick={session.stop} title="Stop the running turn">
                <Square size={13} strokeWidth={1.8} />
                Stop
              </ActionButton>
            ) : (
              <ActionButton
                size="lg"
                // TRY-M1 — finding 1a: the same usable-model signal as the
                // prereq block wires into the button — it cannot arm with a
                // typed prompt when no usable model exists.
                disabled={!runnable || prompt.trim() === '' || modelBlocked}
                title={
                  !runnable
                    ? TRY_COPY.noRunnableVersion
                    : modelBlocked
                      ? blockedCopy
                      : 'Run pinned to this version'
                }
                onClick={send}
              >
                <Play size={13} strokeWidth={1.8} />
                Run test
              </ActionButton>
            )}
            {turns.length > 0 && !isBusy && (
              <ActionButton
                size="lg"
                onClick={() => {
                  session.clearSession();
                  setTraceKey(null);
                }}
                title="Clear this session — server threads persist, the pointer resets"
              >
                <RotateCcw size={13} strokeWidth={1.8} />
                New try
              </ActionButton>
            )}
          </DockRow>
          <Note>
            {TRY_COPY.threadKept} {TRY_COPY.noBill}
          </Note>
        </>
      ) : (
        <Note>Viewing only — {deniedCopy} Threads restore read-only for every role.</Note>
      )}

      <Note>
        Test runs are recorded in audit. <Link to="/platform/audit">Open Audit →</Link>
      </Note>

      <TraceDrawer
        open={traceKey !== null}
        onClose={() => setTraceKey(null)}
        turn={traceTurn}
        versionLabel={versionLabel}
        directiveText={(definition?.instructions ?? '').trim() !== '' ? (definition?.instructions ?? null) : null}
        guardrailPolicy={
          guardrails ? { input: guardrails.input_policy, output: guardrails.output_policy, mode: guardrails.execution_mode } : null
        }
        {...editJumpProps}
        onReask={traceTurn && !isBusy && traceTurn.prompt !== '' ? () => session.reask(traceTurn.key) : null}
      />
    </Wrap>
  );
}
