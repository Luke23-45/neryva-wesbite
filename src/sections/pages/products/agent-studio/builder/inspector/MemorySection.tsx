import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';
import { useMemories, useOrgMemoryPolicy } from '@hooks/studio/useSetupKnowledge';
import {
  COMPACTION_COPY,
  HISTORY_SERVED_MAX,
  SCRUB_COPY,
  USER_PREVIEW_COPY,
  describeTtl,
  parseMemoryScope,
  type MemoryScope,
} from '../lib/memory-model';
import { EmptyState, Whisper, Wrap } from './InstructionsSection.styles';
import {
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  PinMeta,
  PreviewItem,
  PreviewList,
  PreviewMeta,
  SwitchRow,
  SwitchSub,
  SwitchText,
  SwitchTitle,
  TextButton,
} from './MemorySection.styles';

export interface MemorySectionProps {
  assistantId: string;
  definition: AgentDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  onDirtyChange: (dirty: boolean) => void;
  /** Manual save counter (topbar Save button / Ctrl+S) — fires doSave when it increments.
   *  Optional: sections rendered without a save source (tests, standalone) default to 0. */
  saveSignal?: number;
}

function scopeLabel(scope: MemoryScope): string {
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

/**
 * Memory node — read-only since D-N1 (Context owns the session-memory
 * policy). The library preview and org defaults stay here: Block C shows
 * exactly the library rows the pinned run-time scope can serve; Block D
 * shows org scrub/TTL. No editing state, no save machine — the component
 * always reports clean.
 */
export function MemorySection({
  assistantId,
  definition,
  canAuthor,
  onDirtyChange,
}: MemorySectionProps) {
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');
  const orgPolicy = useOrgMemoryPolicy();
  const orgMemories = useMemories('organization');
  const assistantMemories = useMemories('assistant', assistantId);

  // Read-only: always clean (signature kept stable for the inspector wiring).
  useEffect(() => {
    onDirtyChange(false);
  }, [onDirtyChange]);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  const engineScope = parseMemoryScope(definition.context_policy.memory_scope);
  const historyLimit = definition.context_policy.history_limit;

  // A4-23: the preview shows exactly the library rows the pinned run-time
  // scope can serve. 'assistant' serves this agent's own assistant-scoped
  // rows (FL-1.5 assistant branch — fail-closed to zero when unresolvable);
  // 'organization' serves org rows. Every other policy serves no library
  // rows here: user rows resolve per account at run time, conversation rows
  // live on the thread. Showing anything else under "IN SCOPE" would be
  // the old lie (assistant rows previewed as served while no run read them).
  const inAssistantPolicy = engineScope === 'assistant';
  const inOrgPolicy = engineScope === 'organization';
  const previewSource = inAssistantPolicy ? assistantMemories : orgMemories;
  const previewActive = inAssistantPolicy || inOrgPolicy;
  const previewRows = previewActive ? (previewSource.data ?? []).slice(0, 4) : [];
  const previewPending = previewActive && previewSource.isPending;
  const previewError = previewActive && previewSource.isError;

  return (
    <Wrap>
      {/* Scope + history — owned by the Context node, reported here */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Session memory</FieldTitle>
          <FieldHelper>Set in the Context section — reported here.</FieldHelper>
        </FieldHead>
        <SwitchRow>
          <SwitchText>
            <SwitchTitle>Scope</SwitchTitle>
            <SwitchSub>{scopeLabel(engineScope)}</SwitchSub>
          </SwitchText>
        </SwitchRow>
        <SwitchRow>
          <SwitchText>
            <SwitchTitle>History</SwitchTitle>
            <SwitchSub>
              {historyLimit} messages (runs serve ≤{HISTORY_SERVED_MAX}). {COMPACTION_COPY}
            </SwitchSub>
          </SwitchText>
        </SwitchRow>
      </FieldBlock>

      {/* Block C · in scope, read-only */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>In scope</FieldTitle>
          <FieldHelper>{USER_PREVIEW_COPY}</FieldHelper>
        </FieldHead>
        {previewPending ? (
          <PinMeta>Checking in-scope memories…</PinMeta>
        ) : previewError ? (
          <Whisper $tone="amber">In-scope preview is unavailable.</Whisper>
        ) : !previewActive ? (
          <PinMeta>
            {engineScope === 'none'
              ? 'No memories surface under this policy — the agent runs on the thread alone.'
              : 'No library rows surface under this policy — they resolve at run time (per account, or on the thread).'}
          </PinMeta>
        ) : previewRows.length === 0 ? (
          <PinMeta>
            {inAssistantPolicy
              ? 'No assistant memories yet — add rows in the Memory library (Assistant scope) and this agent\u2019s runs will serve them.'
              : 'No org memories yet — an empty memory is a clean slate.'}
          </PinMeta>
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
        <PinMeta>
          Thread memories live on the chat.{' '}
          <TextButton
            type="button"
            onClick={() =>
              inAssistantPolicy
                ? navigate({ to: '/agent-studio/memory', search: { scope: 'assistant', scope_id: assistantId } })
                : navigate({ to: '/agent-studio/memory' })
            }
          >
            Open the Memory library →
          </TextButton>
        </PinMeta>
      </FieldBlock>

      {/* Block D · org defaults, read-only */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Org defaults</FieldTitle>
        </FieldHead>
        {orgPolicy.policy ? (
          <>
            <SwitchRow>
              <SwitchText>
                <SwitchTitle>Scrub</SwitchTitle>
                <SwitchSub>{SCRUB_COPY[orgPolicy.policy.scrub]}</SwitchSub>
              </SwitchText>
            </SwitchRow>
            <SwitchRow>
              <SwitchText>
                <SwitchTitle>Default TTL</SwitchTitle>
                <SwitchSub>
                  {describeTtl(orgPolicy.policy.ttlSeconds)} Applies when a memory sets no expiry.
                </SwitchSub>
              </SwitchText>
            </SwitchRow>
          </>
        ) : orgPolicy.isError ? (
          <Whisper $tone="amber">Org defaults are unreachable.</Whisper>
        ) : (
          <PinMeta>Loading org defaults…</PinMeta>
        )}
        <PinMeta>
          Scrub and TTL are org policy (owners/admins, Workspace settings). Purge lives in the{' '}
          <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/memory' })}>
            Memory library
          </TextButton>
          .
        </PinMeta>
      </FieldBlock>

      {!canAuthor && <PinMeta>Memory needs an owner, admin, or developer — {denied}</PinMeta>}
    </Wrap>
  );
}
