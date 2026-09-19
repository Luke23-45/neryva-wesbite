import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { useMemories, useOrgMemoryPolicy } from '@hooks/studio/useSetupKnowledge';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { AUTOSAVE_MS, buildDraftPayload } from '../lib/draft-save';
import {
  COMPACTION_COPY,
  HISTORY_MAX,
  HISTORY_MIN,
  HISTORY_SERVED_MAX,
  MEMORY_SCOPE_ORDER,
  SCRUB_COPY,
  SCOPE_CONSEQUENCES,
  SERVED_20_COPY,
  USER_PREVIEW_COPY,
  describeTtl,
  fromConsumerScope,
  parseMemoryScope,
  toConsumerScope,
  type ConsumerScope,
  type MemoryScope,
} from '../lib/memory-model';
import { ConflictDialog } from './ConflictDialog';
import { EmptyState, SectionLabel, Whisper, Wrap } from './InstructionsSection.styles';
import { StaticLabel, StaticRow } from './BrainSection.styles';
import { ControlLabel, ControlRow, TextButton, ToolMeta } from './ToolsSection.styles';
import { PresetPill, PresetRow } from './GuardrailsSection.styles';
import { PreviewItem, PreviewList, PreviewMeta, StepButton, StepValue, StepperRow } from './MemorySection.styles';

export interface MemorySectionProps {
  assistantId: string;
  definition: AgentDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

interface ConflictState {
  expectedHash: string;
  currentHash: string | null;
  attempted: string;
  attemptedDef: AgentDefinition;
}

interface PolicyState {
  memory_scope: ConsumerScope;
  history_limit: number;
}

function readPolicy(definition: AgentDefinition): PolicyState {
  const history = definition.context_policy.history_limit;
  return {
    memory_scope: toConsumerScope(parseMemoryScope(definition.context_policy.memory_scope)),
    history_limit: Number.isInteger(history) ? history : 30,
  };
}

function scopeLabel(scope: MemoryScope): string {
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

/**
 * C08 mount — scope with consequences, history stepper with the served-20
 * whisper, read-only in-scope preview, read-only org defaults; the proven
 * save machine (debounce, PUT/POST, 409 adopt, 412 dialog, dirty flag).
 * No summary toggle: `summary_enabled` is stored but read nowhere engine-side
 * (PLAN §8.2) — a toggle would invent control. No user-row preview: the run
 * actor resolves per run (PLAN §4 / research R1).
 */
export function MemorySection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: MemorySectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');
  const orgPolicy = useOrgMemoryPolicy();
  const assistantMemories = useMemories('assistant', assistantId);
  const orgMemories = useMemories('organization');

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [policy, setPolicy] = useState<PolicyState>(() => (definition ? readPolicy(definition) : { memory_scope: 'user', history_limit: 30 }));
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(() => (definition ? readPolicy(definition) : null), [definition]);
  const current = useMemo(() => JSON.stringify(policy), [policy]);
  const dirty = source !== null && current !== JSON.stringify(source);

  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    if (source) setPolicy(source);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, {
      context_policy: {
        ...definition.context_policy,
        memory_scope: policy.memory_scope,
        history_limit: policy.history_limit,
      },
    });
  }, [definition, policy]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'context_policy' || issue.path.startsWith('context_policy.') || issue.path === 'secrets')
          .map((i) => i.message),
      );
    }
    return messages;
  }, [buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ context_policy: definition.context_policy }) : null),
    [definition],
  );
  const adoptingActive = adopting !== null && sourcePolicyJson !== adopting;

  const doSave = useCallback(() => {
    const next = buildNext();
    if (!canAuthor || !next || blocked || conflict) return;
    if (isDraft && versionId && versionHash) {
      sendHashRef.current = versionHash;
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        {
          onSuccess: () => undefined,
          onError: (error) => {
            if (error instanceof ApiError && error.status === 412) {
              const details =
                typeof error.details === 'object' && error.details !== null
                  ? (error.details as Record<string, unknown>)
                  : {};
              setConflict({
                expectedHash: versionHash,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: JSON.stringify({ context_policy: next.context_policy }),
                attemptedDef: next,
              });
            }
          },
        },
      );
      return;
    }
    saveDraft.mutate(next, {
      onSuccess: () => undefined,
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your memory policy stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  useEffect(() => {
    if (!canAuthor || !dirty || blocked || conflict || adoptingActive || pending || !definition) return;
    const timer = window.setTimeout(() => {
      doSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition, current, doSave]);

  const patch = useCallback((part: Partial<PolicyState>) => {
    setPolicy((prev) => ({ ...prev, ...part }));
  }, []);

  const clampHistory = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    patch({ history_limit: Math.min(HISTORY_MAX, Math.max(HISTORY_MIN, Math.trunc(value))) });
  }, [patch]);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  const engineScope = fromConsumerScope(policy.memory_scope);

  if (!canAuthor) {
    return (
      <Wrap>
        <StaticRow>
          <StaticLabel>Scope</StaticLabel>
          <span>{scopeLabel(engineScope)} — {SCOPE_CONSEQUENCES[engineScope]}</span>
        </StaticRow>
        <StaticRow>
          <StaticLabel>History</StaticLabel>
          <span>{policy.history_limit} messages (runs serve ≤{HISTORY_SERVED_MAX}). {COMPACTION_COPY}</span>
        </StaticRow>
        <ToolMeta>Memory needs an owner, admin, or developer — {denied}</ToolMeta>
      </Wrap>
    );
  }

  const previewRows = [...(assistantMemories.data ?? []).slice(0, 2), ...(orgMemories.data ?? []).slice(0, 2)];
  const previewPending = assistantMemories.isPending || orgMemories.isPending;
  const previewError = assistantMemories.isError || orgMemories.isError;

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      {/* Block A · scope */}
      <div>
        <SectionLabel>SCOPE · PER-AGENT</SectionLabel>
        <PresetRow role="group" aria-label="Memory scope">
          {MEMORY_SCOPE_ORDER.map((scope) => (
            <PresetPill
              key={scope}
              type="button"
              $active={engineScope === scope}
              aria-pressed={engineScope === scope}
              onClick={() => patch({ memory_scope: toConsumerScope(scope) })}
            >
              {scopeLabel(scope)}
            </PresetPill>
          ))}
        </PresetRow>
        <ToolMeta>{SCOPE_CONSEQUENCES[engineScope]}</ToolMeta>
      </div>

      {/* Block B · history */}
      <div>
        <SectionLabel>HISTORY</SectionLabel>
        <StepperRow>
          <StepButton type="button" aria-label="Fewer history messages" disabled={policy.history_limit <= HISTORY_MIN} onClick={() => clampHistory(policy.history_limit - 1)}>
            −
          </StepButton>
          <StepValue
            type="number"
            aria-label="History limit in messages"
            min={HISTORY_MIN}
            max={HISTORY_MAX}
            value={policy.history_limit}
            onChange={(event) => clampHistory(Number(event.target.value))}
          />
          <StepButton type="button" aria-label="More history messages" disabled={policy.history_limit >= HISTORY_MAX} onClick={() => clampHistory(policy.history_limit + 1)}>
            ＋
          </StepButton>
        </StepperRow>
        <ToolMeta>{SERVED_20_COPY}</ToolMeta>
        <ToolMeta>{COMPACTION_COPY}</ToolMeta>
      </div>

      {/* Block C · in scope, read-only */}
      <div>
        <SectionLabel>IN SCOPE · READ-ONLY</SectionLabel>
        {previewPending ? (
          <ToolMeta>Checking in-scope memories…</ToolMeta>
        ) : previewError ? (
          <Whisper $tone="amber">In-scope preview is unavailable — the policy above still saves.</Whisper>
        ) : previewRows.length === 0 ? (
          <ToolMeta>No assistant or org memories yet — an empty memory is a clean slate.</ToolMeta>
        ) : (
          <PreviewList>
            {previewRows.map((row) => (
              <PreviewItem key={row.id}>
                {(row.content ?? '—').slice(0, 120)}
                <PreviewMeta>
                  {row.scopeType ?? 'organization'} · {row.visibility ?? 'organization'}
                </PreviewMeta>
              </PreviewItem>
            ))}
          </PreviewList>
        )}
        <ToolMeta>{USER_PREVIEW_COPY}</ToolMeta>
        <ToolMeta>
          Thread memories live on the chat.{' '}
          <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/memory' })}>
            Open the Memory library →
          </TextButton>
        </ToolMeta>
      </div>

      {/* Block D · org defaults, read-only */}
      <div>
        <SectionLabel>ORG DEFAULTS · READ-ONLY</SectionLabel>
        {orgPolicy.policy ? (
          <>
            <ControlRow>
              <ControlLabel>Scrub</ControlLabel>
              <ToolMeta>{SCRUB_COPY[orgPolicy.policy.scrub]}</ToolMeta>
            </ControlRow>
            <ControlRow>
              <ControlLabel>Default TTL</ControlLabel>
              <ToolMeta>{describeTtl(orgPolicy.policy.ttlSeconds)} Applies when a memory sets no expiry.</ToolMeta>
            </ControlRow>
          </>
        ) : orgPolicy.isError ? (
          <Whisper $tone="amber">Org defaults are unreachable — the policy above still saves.</Whisper>
        ) : (
          <ToolMeta>Loading org defaults…</ToolMeta>
        )}
        <ToolMeta>
          Scrub and TTL are org policy (owners/admins, Workspace settings). Purge lives in the{' '}
          <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/memory' })}>
            Memory library
          </TextButton>
          .
        </ToolMeta>
      </div>

      {heldMessages.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          onClose={() => setConflict(null)}
          selectTheirs={(live) => JSON.stringify({ context_policy: live.context_policy })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { context_policy?: unknown };
              const context = (parsed.context_policy ?? {}) as Record<string, unknown>;
              const history = context.history_limit;
              setPolicy({
                memory_scope: toConsumerScope(parseMemoryScope(context.memory_scope)),
                history_limit: typeof history === 'number' && Number.isInteger(history) ? history : 30,
              });
            } catch {
              // Unparseable theirs: leave local state, still refetch below.
            }
            setConflict(null);
            setAdopting(theirs);
            void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
            toast('Reloaded their version — review it, then keep editing or close.');
          }}
          onSaveMine={(freshHash) => {
            updateDraft.mutate(
              { definition: conflict.attemptedDef, expectedHash: freshHash },
              {
                onSuccess: () => {
                  toast.success('Saved over the latest version');
                  setConflict(null);
                },
              },
            );
          }}
        />
      )}
    </Wrap>
  );
}
