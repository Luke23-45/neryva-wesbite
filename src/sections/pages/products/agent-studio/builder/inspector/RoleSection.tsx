import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  MessageSquare,
  OctagonX,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { ROLE_LIMITS, type Role } from '@lib/engine/agent-payload';
import {
  defaultRoleFieldMode,
  isRoleFieldMode,
  parseRoleListField,
  parseRoleTextField,
  roleListHasValue,
  roleTextHasValue,
  type RoleFieldBlock,
  type RoleFieldMode,
} from '@lib/engine/role-fields';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import { ConflictDialog } from './ConflictDialog';
import { EmptyState, Whisper } from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';
import {
  SectionPage,
  PageOutline,
  MicroTip,
} from '../section-ui/SectionPage';
import { PillDot, ProgressPill } from '../section-ui/SectionPage.styles';
import {
  BlockCard,
  ListPreview,
  TextPreview,
} from '../section-ui/BlockCard';
import { BlockEditor } from '../section-ui/BlockEditor';
import type { EditableBlock, ModalBlock, SavedBlock } from '../section-ui/types';
import {
  PersonaCard,
  PersonaChip,
  PersonaChips,
  PersonaGoal,
  PersonaGroup,
  PersonaLabel,
  PersonaName,
  PersonaNote,
  PersonaText,
} from './RoleSection.styles';

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

/** One focused-editor session: what to edit and how to apply it. */
interface EditingSession {
  target: EditableBlock;
  apply: (saved: SavedBlock) => void;
}

type RoleFieldKey = 'role' | 'goal' | 'traits' | 'communicationStyle' | 'knowledgeAreas' | 'prohibitedTopics';

const FIELD_KEYS: readonly RoleFieldKey[] = [
  'role',
  'goal',
  'traits',
  'communicationStyle',
  'knowledgeAreas',
  'prohibitedTopics',
] as const;

const LIST_KEYS: ReadonlySet<RoleFieldKey> = new Set(['traits', 'knowledgeAreas', 'prohibitedTopics']);

/** Full local state — six modal fields, each { mode, content }. */
type RoleState = Record<RoleFieldKey, { mode: RoleFieldMode; content: string }>;

/** Normalize whatever the definition holds into editable local state.
 * Unknown modes fall back to the documented default (raw for text,
 * json for lists); the caps layer flags nothing here — the section
 * never rewrites what it read, it just edits it. */
function readRole(definition: AgentDefinition): RoleState {
  const r = definition.role;
  const out = {} as RoleState;
  for (const key of FIELD_KEYS) {
    const isList = LIST_KEYS.has(key);
    const raw = r?.[key] as RoleFieldBlock | undefined;
    out[key] = {
      mode: raw && isRoleFieldMode(raw.mode) ? raw.mode : defaultRoleFieldMode(isList),
      content: typeof raw?.content === 'string' ? raw.content : '',
    };
  }
  return out;
}

/** The console writes `role` ONLY when at least one field is set —
 * absent = no persona configured (valid, the engine composes nothing).
 * Blank fields never ship; clearing every field removes the key so no
 * meaningless empty object persists. */
function roleOrUndefined(state: RoleState): Role | undefined {
  const fields: Role = {};
  for (const key of FIELD_KEYS) {
    const field = state[key];
    if (field.content.trim() !== '') {
      fields[key] = { mode: field.mode, content: field.content };
    }
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

/** Blank local state for a missing definition (loading). */
function blankRoleState(): RoleState {
  const out = {} as RoleState;
  for (const key of FIELD_KEYS) {
    out[key] = { mode: defaultRoleFieldMode(LIST_KEYS.has(key)), content: '' };
  }
  return out;
}

const EMPTY_BLANK: RoleState = blankRoleState();

interface RoleFieldDef {
  key: RoleFieldKey;
  kind: 'text' | 'list';
  title: string;
  helper: string;
  /** Parsed-value cap for text fields (raw/markdown surfaces only — JSON
   * quoting adds characters, so the caps layer enforces JSON mode). */
  maxLength?: number;
  placeholder: string;
  emptyHint: string;
  icon: React.ReactNode;
}

/** Canonical runtime order: Role → Goal → Traits → Communication style
 * → Knowledge areas → Avoid. */
const FIELDS: readonly RoleFieldDef[] = [
  {
    key: 'role',
    kind: 'text',
    title: 'Role',
    helper: 'The persona this agent plays — composed into its system prompt. All fields are optional.',
    maxLength: ROLE_LIMITS.role,
    placeholder: 'e.g. Senior support engineer',
    emptyHint: 'e.g. Senior support engineer — one breath.',
    icon: <UserRound size={16} strokeWidth={1.8} />,
  },
  {
    key: 'goal',
    kind: 'text',
    title: 'Goal',
    helper: 'What this agent is here to achieve.',
    maxLength: ROLE_LIMITS.goal,
    placeholder: 'What this agent is here to achieve',
    emptyHint: 'The outcome this agent exists to produce.',
    icon: <Target size={16} strokeWidth={1.8} />,
  },
  {
    key: 'traits',
    kind: 'list',
    title: 'Traits',
    helper: 'How the agent carries itself.',
    placeholder: 'one\nper line',
    emptyHint: 'One per line — e.g. patient, precise, candid.',
    icon: <Sparkles size={16} strokeWidth={1.8} />,
  },
  {
    key: 'communicationStyle',
    kind: 'text',
    title: 'Communication style',
    helper: 'Tone, format, language — how the agent speaks.',
    maxLength: ROLE_LIMITS.communicationStyle,
    placeholder: 'Tone, format, language — how the agent speaks',
    emptyHint: 'e.g. Terse. Bullets over paragraphs. No flattery.',
    icon: <MessageSquare size={16} strokeWidth={1.8} />,
  },
  {
    key: 'knowledgeAreas',
    kind: 'list',
    title: 'Knowledge areas',
    helper: 'Domains this agent knows well.',
    placeholder: 'one\nper line',
    emptyHint: 'One per line — the domains it speaks with authority on.',
    icon: <BookOpen size={16} strokeWidth={1.8} />,
  },
  {
    key: 'prohibitedTopics',
    kind: 'list',
    title: 'Avoid',
    helper: 'Topics the agent steers clear of.',
    placeholder: 'one\nper line',
    emptyHint: 'One per line — topics it declines or redirects.',
    icon: <OctagonX size={16} strokeWidth={1.8} />,
  },
];

function modeCaption(mode: RoleFieldMode): string {
  if (mode === 'markdown') return 'Markdown';
  if (mode === 'json') return 'JSON';
  return 'Raw';
}

function toModalBlock(block: { mode: RoleFieldMode; content: string }): ModalBlock {
  return { mode: block.mode, content: block.content };
}

/**
 * Role section — the SINGLE owner/editor of `role` (D-N2: six modal
 * fields, each Raw/Markdown/JSON, composed into the system prompt
 * server-side). All six fields are optional; an empty role is a valid
 * "no persona" state. The page shows one card per field; clicking a card
 * opens the focused in-place editor (no modal, no route change). Mirrors
 * the Instructions save machinery: POST/PUT through the draft-version
 * hooks, 8s autosave with unmount flush, manual saveSignal, 409 adoption,
 * 412 conflict dialog. Every cap issue shown here is filtered to role
 * paths.
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
  const [policy, setPolicy] = useState<RoleState>(() =>
    definition ? readRole(definition) : EMPTY_BLANK,
  );
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingSession | null>(null);
  const policyRef = useRef(policy);
  useEffect(() => {
    policyRef.current = policy;
  });

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(() => (definition ? readRole(definition) : null), [definition]);
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
    return buildDraftPayload(definition, { role: roleOrUndefined(policy) });
  }, [definition, policy]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'role' || issue.path.startsWith('role.'))
          .map((i) => i.message),
      );
    }
    return messages;
  }, [buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ role: definition.role }) : null),
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
                attempted: JSON.stringify({ role: next.role }),
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
          toast.success('A draft opened elsewhere — resumed it. Your role stays; the next save writes to it.');
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

  // Manual save (topbar Save button / Ctrl+S / ⌘S): never silent — a held
  // save toasts its reason instead of swallowing the click.
  useManualSaveSignal(saveSignal, doSave, {
    canAuthor,
    blocked,
    conflict,
    holdReason: () => heldMessages[0] ?? null,
  });

  const patchField = useCallback(
    (key: RoleFieldKey, part: Partial<{ mode: RoleFieldMode; content: string }>) => {
      setPolicy((prev) => ({ ...prev, [key]: { ...prev[key], ...part } }));
    },
    [],
  );

  const openField = useCallback(
    (def: RoleFieldDef) => {
      const field = policyRef.current[def.key];
      setEditing({
        target: {
          key: `role:${def.key}`,
          sectionLabel: 'Role',
          title: def.title,
          jsonKind: def.kind === 'list' ? 'list' : 'text',
          block: toModalBlock(field),
          placeholder:
            def.kind === 'list'
              ? field.mode === 'json'
                ? '["patient", "precise", "candid"]'
                : field.mode === 'markdown'
                  ? '- patient\n- precise\n- candid'
                  : 'patient\nprecise\ncandid'
              : def.kind === 'text' && field.mode === 'json'
                ? '"A JSON string — quotes included"'
                : def.placeholder,
          cap: def.maxLength,
        },
        apply: (saved) =>
          patchField(def.key, { mode: saved.block.mode as RoleFieldMode, content: saved.block.content }),
      });
    },
    [patchField],
  );

  if (!definition) {
    return <SkeletonRows rows={4} />;
  }

  if (!canAuthor) {
    const roleText = parseRoleTextField(policy.role);
    const goalText = parseRoleTextField(policy.goal);
    const styleText = parseRoleTextField(policy.communicationStyle);
    const traitList = parseRoleListField(policy.traits) ?? [];
    const areaList = parseRoleListField(policy.knowledgeAreas) ?? [];
    const topicList = parseRoleListField(policy.prohibitedTopics) ?? [];
    const hasAny =
      roleTextHasValue(policy.role) ||
      roleTextHasValue(policy.goal) ||
      roleListHasValue(policy.traits) ||
      roleTextHasValue(policy.communicationStyle) ||
      roleListHasValue(policy.knowledgeAreas) ||
      roleListHasValue(policy.prohibitedTopics);
    return (
      <SectionPage
        title="Role"
        subtitle="Who this agent is — its persona, goals, and boundaries."
        pill={
          <ProgressPill>
            <PillDot aria-hidden="true" />
            Read-only
          </ProgressPill>
        }
      >
        {hasAny ? (
          <PersonaCard>
            {roleText && roleText.trim() && <PersonaName>{roleText}</PersonaName>}
            {goalText && goalText.trim() && <PersonaGoal>{goalText}</PersonaGoal>}
            {traitList.length > 0 && (
              <PersonaGroup>
                <PersonaLabel>Traits</PersonaLabel>
                <PersonaChips>
                  {traitList.map((trait) => (
                    <PersonaChip key={trait}>{trait}</PersonaChip>
                  ))}
                </PersonaChips>
              </PersonaGroup>
            )}
            {styleText && styleText.trim() && (
              <PersonaGroup>
                <PersonaLabel>Communication style</PersonaLabel>
                <PersonaText>{styleText}</PersonaText>
              </PersonaGroup>
            )}
            {areaList.length > 0 && (
              <PersonaGroup>
                <PersonaLabel>Knowledge areas</PersonaLabel>
                <PersonaChips>
                  {areaList.map((area) => (
                    <PersonaChip key={area}>{area}</PersonaChip>
                  ))}
                </PersonaChips>
              </PersonaGroup>
            )}
            {topicList.length > 0 && (
              <PersonaGroup>
                <PersonaLabel>Avoid</PersonaLabel>
                <PersonaChips>
                  {topicList.map((topic) => (
                    <PersonaChip key={topic}>{topic}</PersonaChip>
                  ))}
                </PersonaChips>
              </PersonaGroup>
            )}
          </PersonaCard>
        ) : (
          <EmptyState>No persona configured — this agent runs without a role.</EmptyState>
        )}
        <PersonaNote>Role needs an owner, admin, or developer — {denied}</PersonaNote>
      </SectionPage>
    );
  }

  // The focused editor replaces the page in place — no modal, no route
  // change. Drafts push into the section every 2s, so closing the editor
  // never loses work.
  if (editing) {
    return (
      <BlockEditor
        key={editing.target.key}
        target={editing.target}
        onDraft={editing.apply}
        onSave={editing.apply}
        onClose={() => setEditing(null)}
      />
    );
  }

  const doneCount = FIELD_KEYS.filter((key) =>
    LIST_KEYS.has(key) ? roleListHasValue(policy[key]) : roleTextHasValue(policy[key]),
  ).length;

  const scrollToField = (key: string) => {
    document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      onKeyDown={(event) => {
        // Esc on the page only ever blurs — the editor owns Esc while open.
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      <SectionPage
        title="Role"
        subtitle="Who this agent is — its persona, goals, and boundaries."
        progress={{ done: doneCount, total: FIELD_KEYS.length }}
        rail={
          <>
            <PageOutline
              items={FIELDS.map((def) => {
                const field = policy[def.key];
                const hasValue = def.kind === 'list' ? roleListHasValue(field) : roleTextHasValue(field);
                const parsed = def.kind === 'list' ? parseRoleListField(field) : undefined;
                return {
                  key: `role-${def.key}`,
                  label: def.title,
                  meta: parsed !== undefined ? `${parsed.length}` : '',
                  done: hasValue,
                };
              })}
              onSelect={scrollToField}
            />
            <MicroTip>
              All six fields are optional — an empty role is a valid “no persona” state.
            </MicroTip>
          </>
        }
      >
        {FIELDS.map((def) => {
          const field = policy[def.key];
          const cardId = `role-${def.key}`;
          if (def.kind === 'list') {
            const parsed = parseRoleListField(field);
            const malformed = field.content.trim() !== '' && parsed === undefined;
            const items = parsed ?? [];
            return (
              <div key={def.key} id={cardId}>
                <BlockCard
                  title={def.title}
                  helper={def.helper}
                  charCount={`${field.content.length.toLocaleString()} chars`}
                  done={roleListHasValue(field)}
                  empty={!malformed && items.length === 0}
                  emptyTitle={`No ${def.title.toLowerCase()} yet`}
                  emptyHint={def.emptyHint}
                  emptyIcon={def.icon}
                  preview={
                    malformed ? <TextPreview text={field.content} /> : <ListPreview items={items} />
                  }
                  caption={
                    malformed
                      ? `${modeCaption(field.mode)} · invalid — edit to fix`
                      : `${modeCaption(field.mode)} · ${items.length} ${items.length === 1 ? 'item' : 'items'}`
                  }
                  onOpen={() => openField(def)}
                />
              </div>
            );
          }
          const parsed = parseRoleTextField(field);
          const malformed = field.content.trim() !== '' && parsed === undefined;
          return (
            <div key={def.key} id={cardId}>
              <BlockCard
                title={def.title}
                helper={def.helper}
                charCount={`${field.content.length.toLocaleString()} chars`}
                done={roleTextHasValue(field)}
                empty={!malformed && (parsed ?? '').trim() === ''}
                emptyTitle={`No ${def.title.toLowerCase()} yet`}
                emptyHint={def.emptyHint}
                emptyIcon={def.icon}
                preview={<TextPreview text={field.content} />}
                caption={malformed ? `${modeCaption(field.mode)} · invalid — edit to fix` : modeCaption(field.mode)}
                onOpen={() => openField(def)}
              />
            </div>
          );
        })}

        {heldMessages.map((message) => (
          <Whisper key={message} $tone="red" role="alert">
            {message} Autosave held — fix it and saving resumes on its own.
          </Whisper>
        ))}
      </SectionPage>

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          onClose={() => setConflict(null)}
          selectTheirs={(live) => JSON.stringify({ role: live.role })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { role?: Role };
              setPolicy(readRole({ ...definition, role: parsed.role }));
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
    </div>
  );
}
