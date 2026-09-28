import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { ROLE_LIMITS, type RolePolicy } from '@lib/engine/agent-payload';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave } from '../lib/use-draft-autosave';
import { ConflictDialog } from './ConflictDialog';
import { EmptyState, SectionLabel, Whisper, Wrap } from './InstructionsSection.styles';
import { StaticLabel, StaticRow } from './BrainSection.styles';
import { TextButton, ToolMeta } from './ToolsSection.styles';
import { TextArea } from '@components/common/ui/TextArea';
import { TextInput } from '@components/common/ui/TextInput';
import { TagAddRow, TagChip, TagCount, TagRemove, TagRow, TagText } from './RoleSection.styles';

export interface RoleSectionProps {
  assistantId: string;
  definition: AgentDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  /** Dirty-state callback — parent combines with other sections for the shared guard. */
  onDirtyChange: (dirty: boolean) => void;
  /** Manual save counter (topbar Save button / Ctrl+S) — fires doSave when it increments.
   *  Optional: sections rendered without a save source (tests, standalone) default to 0. */
  saveSignal?: number;
}

interface ConflictState {
  expectedHash: string;
  currentHash: string | null;
  attempted: string;
  attemptedDef: AgentDefinition;
}

/** Full local state — every role_policy member present, all optional. */
interface RolePolicyState {
  role: string;
  goal: string;
  traits: string[];
  communication_style: string;
  knowledge_areas: string[];
  prohibited_topics: string[];
}

/** Normalize whatever the definition holds into editable local state. */
function readPolicy(definition: AgentDefinition): RolePolicyState {
  const rp = definition.role_policy;
  return {
    role: rp?.role ?? '',
    goal: rp?.goal ?? '',
    traits: rp?.traits ? [...rp.traits] : [],
    communication_style: rp?.communication_style ?? '',
    knowledge_areas: rp?.knowledge_areas ? [...rp.knowledge_areas] : [],
    prohibited_topics: rp?.prohibited_topics ? [...rp.prohibited_topics] : [],
  };
}

/** The console writes role_policy ONLY when at least one member is set —
 * absent = no persona configured (valid, the engine composes nothing).
 * Blank strings and empty lists never ship; clearing every field removes
 * the key so no meaningless empty object persists. */
function policyOrUndefined(policy: RolePolicyState): RolePolicy | undefined {
  const members: RolePolicy = {
    ...(policy.role.trim() ? { role: policy.role.trim() } : {}),
    ...(policy.goal.trim() ? { goal: policy.goal.trim() } : {}),
    ...(policy.traits.length > 0 ? { traits: [...policy.traits] } : {}),
    ...(policy.communication_style.trim() ? { communication_style: policy.communication_style.trim() } : {}),
    ...(policy.knowledge_areas.length > 0 ? { knowledge_areas: [...policy.knowledge_areas] } : {}),
    ...(policy.prohibited_topics.length > 0 ? { prohibited_topics: [...policy.prohibited_topics] } : {}),
  };
  return Object.keys(members).length > 0 ? members : undefined;
}

/** Blank local state for a missing definition (loading). */
const EMPTY_BLANK: RolePolicyState = {
  role: '',
  goal: '',
  traits: [],
  communication_style: '',
  knowledge_areas: [],
  prohibited_topics: [],
};

/** Keyboard-accessible tag-list editor: Enter or the Add button appends a
 * trimmed, de-duplicated tag; chips carry a labeled remove button. Count
 * and per-item length caps are enforced in the UI (caps module enforces
 * them before save too). */
function TagEditor({
  label,
  values,
  maxItems,
  maxItem,
  onChange,
}: {
  label: string;
  values: string[];
  maxItems: number;
  maxItem: number;
  onChange: (values: string[]) => void;
}) {
  const [text, setText] = useState('');
  const full = values.length >= maxItems;

  const add = useCallback(() => {
    const cleaned = text.trim();
    if (!cleaned || full || cleaned.length > maxItem || values.includes(cleaned)) {
      return;
    }
    onChange([...values, cleaned]);
    setText('');
  }, [text, full, maxItem, values, onChange]);

  return (
    <div>
      {values.length > 0 && (
        <TagRow>
          {values.map((tag) => (
            <TagChip key={tag}>
              <TagText>{tag}</TagText>
              <TagRemove
                type="button"
                aria-label={`Remove ${label} ${tag}`}
                onClick={() => onChange(values.filter((v) => v !== tag))}
              >
                ×
              </TagRemove>
            </TagChip>
          ))}
        </TagRow>
      )}
      <TagAddRow>
        <TextInput
          aria-label={`Add ${label}`}
          value={text}
          maxLength={maxItem}
          disabled={full}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={full ? `${maxItems} items — the cap` : `Add ${label}, then Enter`}
        />
        <TextButton type="button" onClick={add} disabled={full || !text.trim()}>
          Add
        </TextButton>
        <TagCount>
          {values.length}/{maxItems}
        </TagCount>
      </TagAddRow>
    </div>
  );
}

/**
 * Role node — the SINGLE owner/editor of `role_policy` (D-N2, option A:
 * structured persona composed into the system prompt server-side). All six
 * members are optional; an empty policy is a valid "no persona" state.
 * Mirrors the Context/Response save machinery: POST/PUT through the
 * draft-version hooks, 8s autosave with unmount flush, manual saveSignal,
 * 409 adoption, 412 conflict dialog. Every cap issue shown here is
 * filtered to role_policy paths.
 */
export function RoleSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: RoleSectionProps) {
  const queryClient = useQueryClient();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [policy, setPolicy] = useState<RolePolicyState>(() =>
    definition ? readPolicy(definition) : EMPTY_BLANK,
  );
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);

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
    return buildDraftPayload(definition, { role_policy: policyOrUndefined(policy) });
  }, [definition, policy]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'role_policy' || issue.path.startsWith('role_policy.'))
          .map((i) => i.message),
      );
    }
    return messages;
  }, [buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ role_policy: definition.role_policy }) : null),
    [definition],
  );
  const adoptingActive = adopting !== null && sourcePolicyJson !== adopting;

  const doSave = useCallback(() => {
    const next = buildNext();
    if (!canAuthor || !next || blocked || conflict) return;
    if (isDraft && versionId && versionHash) {
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
                attempted: JSON.stringify({ role_policy: next.role_policy }),
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
          toast.success('A draft opened elsewhere — resumed it. Your role policy stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  // A2-23: shared autosave — 8s debounce plus an unmount flush so switching
  // sections persists pending edits instead of silently dropping them.
  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition },
    doSave,
    [current],
  );

  // Manual save (topbar Save button / Ctrl+S / ⌘S): doSave already guards
  // on canAuthor/blocked/conflict/null, so a no-op signal is harmless.
  useEffect(() => {
    if (saveSignal > 0) doSave();
  }, [saveSignal, doSave]);

  const patch = useCallback((part: Partial<RolePolicyState>) => {
    setPolicy((prev) => ({ ...prev, ...part }));
  }, []);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  if (!canAuthor) {
    const hasAny =
      policy.role.trim() ||
      policy.goal.trim() ||
      policy.traits.length > 0 ||
      policy.communication_style.trim() ||
      policy.knowledge_areas.length > 0 ||
      policy.prohibited_topics.length > 0;
    return (
      <Wrap>
        {hasAny ? (
          <>
            {policy.role.trim() && (
              <StaticRow>
                <StaticLabel>Role</StaticLabel>
                <span>{policy.role}</span>
              </StaticRow>
            )}
            {policy.goal.trim() && (
              <StaticRow>
                <StaticLabel>Goal</StaticLabel>
                <span>{policy.goal}</span>
              </StaticRow>
            )}
            {policy.traits.length > 0 && (
              <StaticRow>
                <StaticLabel>Traits</StaticLabel>
                <span>{policy.traits.join(', ')}</span>
              </StaticRow>
            )}
            {policy.communication_style.trim() && (
              <StaticRow>
                <StaticLabel>Communication style</StaticLabel>
                <span>{policy.communication_style}</span>
              </StaticRow>
            )}
            {policy.knowledge_areas.length > 0 && (
              <StaticRow>
                <StaticLabel>Knowledge areas</StaticLabel>
                <span>{policy.knowledge_areas.join(', ')}</span>
              </StaticRow>
            )}
            {policy.prohibited_topics.length > 0 && (
              <StaticRow>
                <StaticLabel>Prohibited topics</StaticLabel>
                <span>{policy.prohibited_topics.join(', ')}</span>
              </StaticRow>
            )}
          </>
        ) : (
          <EmptyState>No persona configured — this agent runs without a role.</EmptyState>
        )}
        <ToolMeta>Role needs an owner, admin, or developer — {denied}</ToolMeta>
      </Wrap>
    );
  }

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      {/* Role name */}
      <div>
        <SectionLabel>ROLE · PER-AGENT</SectionLabel>
        <TextInput
          aria-label="Role"
          value={policy.role}
          maxLength={ROLE_LIMITS.role}
          onChange={(event) => patch({ role: event.target.value })}
          placeholder="e.g. Senior support engineer"
        />
        <ToolMeta>The persona this agent plays — composed into its system prompt. All fields are optional.</ToolMeta>
      </div>

      {/* Goal */}
      <div>
        <SectionLabel>GOAL</SectionLabel>
        <TextArea
          aria-label="Goal"
          value={policy.goal}
          maxLength={ROLE_LIMITS.goal}
          rows={3}
          onChange={(event) => patch({ goal: event.target.value })}
          placeholder="What this agent is here to achieve"
        />
      </div>

      {/* Traits */}
      <div>
        <SectionLabel>TRAITS</SectionLabel>
        <TagEditor
          label="trait"
          values={policy.traits}
          maxItems={ROLE_LIMITS.traits.max}
          maxItem={ROLE_LIMITS.traits.item}
          onChange={(traits) => patch({ traits })}
        />
        <ToolMeta>Up to {ROLE_LIMITS.traits.max} traits — how the agent carries itself.</ToolMeta>
      </div>

      {/* Communication style */}
      <div>
        <SectionLabel>COMMUNICATION STYLE</SectionLabel>
        <TextArea
          aria-label="Communication style"
          value={policy.communication_style}
          maxLength={ROLE_LIMITS.communication_style}
          rows={3}
          onChange={(event) => patch({ communication_style: event.target.value })}
          placeholder="Tone, format, language — how the agent speaks"
        />
      </div>

      {/* Knowledge areas */}
      <div>
        <SectionLabel>KNOWLEDGE AREAS</SectionLabel>
        <TagEditor
          label="knowledge area"
          values={policy.knowledge_areas}
          maxItems={ROLE_LIMITS.knowledge_areas.max}
          maxItem={ROLE_LIMITS.knowledge_areas.item}
          onChange={(knowledge_areas) => patch({ knowledge_areas })}
        />
        <ToolMeta>Domains the agent leans into — up to {ROLE_LIMITS.knowledge_areas.max}.</ToolMeta>
      </div>

      {/* Prohibited topics */}
      <div>
        <SectionLabel>PROHIBITED TOPICS</SectionLabel>
        <TagEditor
          label="prohibited topic"
          values={policy.prohibited_topics}
          maxItems={ROLE_LIMITS.prohibited_topics.max}
          maxItem={ROLE_LIMITS.prohibited_topics.item}
          onChange={(prohibited_topics) => patch({ prohibited_topics })}
        />
        <ToolMeta>Topics the agent stays away from — up to {ROLE_LIMITS.prohibited_topics.max}.</ToolMeta>
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
          selectTheirs={(live) => JSON.stringify({ role_policy: live.role_policy })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { role_policy?: RolePolicy };
              setPolicy(readPolicy({ ...definition, role_policy: parsed.role_policy }));
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
