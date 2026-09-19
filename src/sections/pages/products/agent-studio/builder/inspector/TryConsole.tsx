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
import { StreamingBubble, Note } from './TraceDrawer.styles';
import { EmptyState, SectionLabel, Wrap } from './InstructionsSection.styles';
import { TextButton } from './ToolsSection.styles';
import { Bubble, BubbleMeta, DockRow, Muted, NoticePill, PrereqBlock, PrereqDetail, PrereqHeadline, Thread } from './TrySection.styles';

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
  onTryEvent?: (event: { at: string; failed: boolean }) => void;
  /** Builder jumps select slots; detail links out to the builder. */
  editMode: { kind: 'jump'; onEditJump: (target: TraceEditTarget) => void } | { kind: 'link'; builderHref: string };
  /** Optional header — the detail version picker lives here. */
  header?: ReactNode;
}

/**
 * Shared Try console (C13 owns it): prerequisite blocks, multi-turn thread,
 * input dock, and the shared trace drawer. Every send is a fresh
 * draft-pinned test run — follow-ups would resolve through the published
 * pointer and silently leave the draft pin (PLAN.md §8 D6). Runs never
 * write the draft, so there is no save machine here, only the session.
 * Viewers see threads read-only (the stream endpoint allows
 * reader/billing).
 */
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
  const hasInstructions = (definition?.instructions ?? '').trim() !== '';

  const prereqs = runnable
    ? describeTryPrereqs({ hasRunnableVersion: true, usableModelCount: Math.max(usableCount, 0), hasInstructions })
    : describeTryPrereqs({ hasRunnableVersion: false, usableModelCount: Math.max(usableCount, 0), hasInstructions });

  // Report terminal turns once so the builder canvas grade reflects this load.
  useEffect(() => {
    if (!onTryEvent) return;
    for (const turn of turns) {
      if ((turn.status === 'done' || turn.status === 'error') && !reportedRef.current.has(turn.key)) {
        reportedRef.current.add(turn.key);
        onTryEvent({ at: new Date().toISOString(), failed: turn.status === 'error' });
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
    if (session.send(prompt)) {
      setPrompt('');
    }
  };

  const traceTurn = turns.find((t) => t.key === traceKey) ?? null;
  const guardrails = definition?.guardrails ?? null;

  const fixLink = (kind: 'no-model' | 'instructions-advisory') =>
    editMode.kind === 'jump' ? (
      <TextButton onClick={() => editMode.onEditJump(kind === 'no-model' ? 'brain' : 'purpose')}>
        {kind === 'no-model' ? 'Fix in Brain ›' : 'Edit in Purpose ›'}
      </TextButton>
    ) : (
      <Link to={editMode.builderHref}>{kind === 'no-model' ? 'Fix in Brain ›' : 'Edit in Purpose ›'}</Link>
    );

  return (
    <Wrap>
      {header}
      <SectionLabel>Runs against</SectionLabel>
      <Muted>{runnable ? `${versionLabel} — draft-pinned, never billable.` : 'No runnable version open — save a draft first.'}</Muted>

      {modelsLoading && <Muted>Checking usable models…</Muted>}
      {prereqs.map((prereq) => (
        <PrereqBlock key={prereq.kind} $tone={prereq.tone}>
          <PrereqHeadline $tone={prereq.tone}>{prereq.headline}</PrereqHeadline>
          <PrereqDetail>{prereq.detail}</PrereqDetail>
          {prereq.kind === 'no-model' && !modelsLoading && fixLink('no-model')}
          {prereq.kind === 'instructions-advisory' && fixLink('instructions-advisory')}
        </PrereqBlock>
      ))}

      {turns.length === 0 ? (
        <EmptyState>Ask anything — the reply streams here with its trace.</EmptyState>
      ) : (
        <Thread>
          {turns.map((turn) => {
            const reply = turn.agentText !== '' ? turn.agentText : turn.liveText;
            const streaming = turn.status === 'streaming' || turn.status === 'accepted' || turn.status === 'sending';
            return (
              <div key={turn.key} style={{ display: 'contents' }}>
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
                {turn.notices.map((notice: RunNotice) => (
                  <NoticePill key={notice.id} $tone={notice.kind}>
                    {notice.text}
                  </NoticePill>
                ))}
                {(turn.status === 'done' || turn.status === 'error') && (
                  <TextButton onClick={() => setTraceKey(turn.key)}>Open trace ›</TextButton>
                )}
              </div>
            );
          })}
        </Thread>
      )}

      {canRun ? (
        <>
          <TextArea
            label="Test prompt"
            name="try-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="A customer asks… (1–8192)"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                // Blur first: the builder window keymap would deselect the
                // spine and strand the half-typed prompt.
                e.currentTarget.blur();
                e.stopPropagation();
              }
            }}
          />
          <DockRow>
            {isBusy ? (
              <ActionButton size="sm" onClick={session.stop} title="Stop the running turn">
                <Square size={13} strokeWidth={1.8} />
                Stop
              </ActionButton>
            ) : (
              <ActionButton
                size="sm"
                disabled={!runnable || prompt.trim() === ''}
                title={!runnable ? TRY_COPY.noRunnableVersion : 'Run pinned to this version'}
                onClick={send}
              >
                <Play size={13} strokeWidth={1.8} />
                Run test
              </ActionButton>
            )}
            {turns.length > 0 && !isBusy && (
              <ActionButton
                size="sm"
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
