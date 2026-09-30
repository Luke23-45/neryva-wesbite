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
import { AddRow, EmptyState, Whisper, Wrap } from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';
import { TextButton } from './ToolsSection.styles';
import { TextArea } from '@components/common/ui/TextArea';
import { TextInput } from '@components/common/ui/TextInput';
import { Segmented } from '@components/common/ui/Segmented';
import { MarkdownText } from '../../chat/ChatMessages/MarkdownText';
import {
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  PersonaCard,
  PersonaChip,
  PersonaChips,
  PersonaGoal,
  PersonaGroup,
  PersonaLabel,
  PersonaName,
  PersonaNote,
  PersonaText,
  TagAddRow,
  TagChip,
  TagCount,
  TagRemove,
  TagRow,
  TagText,
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

const MODE_OPTIONS = [
  { value: 'raw', label: 'Raw' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
] as const;

const WRITE_PREVIEW_OPTIONS = [
  { value: 'write', label: 'Write' },
  { value: 'preview', label: 'Preview' },
] as const;

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

interface RoleFieldDef {
  key: RoleFieldKey;
  kind: 'text' | 'list';
  title: string;
  helper: string;
  /** Singular item label for list fields (aria labels, placeholders). */
  label: string;
  rows: number;
  /** Parsed-value cap (raw/markdown modes only — JSON quoting adds
   * characters, so the caps layer enforces JSON mode instead). */
  maxLength?: number;
  maxItems?: number;
  maxItem?: number;
  placeholder: string;
}

/** Canonical runtime order: Role → Goal → Traits → Communication style
 * → Knowledge areas → Avoid. */
const FIELDS: readonly RoleFieldDef[] = [
  {
    key: 'role',
    kind: 'text',
    title: 'Role',
    helper: 'The persona this agent plays — composed into its system prompt. All fields are optional.',
    label: 'role',
    rows: 2,
    maxLength: ROLE_LIMITS.role,
    placeholder: 'e.g. Senior support engineer',
  },
  {
    key: 'goal',
    kind: 'text',
    title: 'Goal',
    helper: 'What this agent is here to achieve.',
    label: 'goal',
    rows: 3,
    maxLength: ROLE_LIMITS.goal,
    placeholder: 'What this agent is here to achieve',
  },
  {
    key: 'traits',
    kind: 'list',
    title: 'Traits',
    helper: 'How the agent carries itself.',
    label: 'trait',
    rows: 4,
    maxItems: ROLE_LIMITS.traits.max,
    maxItem: ROLE_LIMITS.traits.item,
    placeholder: 'one\nper line',
  },
  {
    key: 'communicationStyle',
    kind: 'text',
    title: 'Communication style',
    helper: 'Tone, format, language — how the agent speaks.',
    label: 'communication style',
    rows: 3,
    maxLength: ROLE_LIMITS.communicationStyle,
    placeholder: 'Tone, format, language — how the agent speaks',
  },
  {
    key: 'knowledgeAreas',
    kind: 'list',
    title: 'Knowledge areas',
    helper: 'Domains this agent knows well.',
    label: 'knowledge area',
    rows: 4,
    maxItems: ROLE_LIMITS.knowledgeAreas.max,
    maxItem: ROLE_LIMITS.knowledgeAreas.item,
    placeholder: 'one\nper line',
  },
  {
    key: 'prohibitedTopics',
    kind: 'list',
    title: 'Avoid',
    helper: 'Topics the agent steers clear of.',
    label: 'avoided topic',
    rows: 4,
    maxItems: ROLE_LIMITS.prohibitedTopics.max,
    maxItem: ROLE_LIMITS.prohibitedTopics.item,
    placeholder: 'one\nper line',
  },
];

/** A text field: mode selector on top, textarea below, Write/Preview in
 * markdown mode (the Instructions section's primitives, reused). */
function RoleTextField({
  def,
  field,
  onPatch,
}: {
  def: RoleFieldDef;
  field: { mode: RoleFieldMode; content: string };
  onPatch: (part: Partial<{ mode: RoleFieldMode; content: string }>) => void;
}) {
  const [preview, setPreview] = useState(false);
  const showPreview = field.mode === 'markdown' && preview;
  return (
    <FieldBlock>
      <FieldHead>
        <FieldTitle>{def.title}</FieldTitle>
        <FieldHelper>{def.helper}</FieldHelper>
      </FieldHead>
      <AddRow>
        <Segmented
          options={MODE_OPTIONS}
          value={field.mode}
          onChange={(mode: RoleFieldMode) => onPatch({ mode })}
          size="sm"
          ariaLabel={`${def.title} format`}
        />
        {field.mode === 'markdown' && (
          <Segmented
            options={WRITE_PREVIEW_OPTIONS}
            value={preview ? 'preview' : 'write'}
            onChange={(v: 'write' | 'preview') => setPreview(v === 'preview')}
            size="sm"
            ariaLabel={`${def.title} view`}
          />
        )}
      </AddRow>
      {showPreview ? (
        <MarkdownText text={field.content} />
      ) : (
        <TextArea
          aria-label={def.title}
          value={field.content}
          maxLength={field.mode === 'json' ? undefined : def.maxLength}
          rows={def.rows}
          onChange={(event) => onPatch({ content: event.target.value })}
          placeholder={
            field.mode === 'json'
              ? '"A JSON string — quotes included"'
              : def.placeholder
          }
        />
      )}
    </FieldBlock>
  );
}

/** A list field: tag editor in JSON mode, textarea in Raw/Markdown modes
 * (one item per line; markdown wants strict "- " lines). */
function RoleListField({
  def,
  field,
  onPatch,
}: {
  def: RoleFieldDef;
  field: { mode: RoleFieldMode; content: string };
  onPatch: (part: Partial<{ mode: RoleFieldMode; content: string }>) => void;
}) {
  const parsed = useMemo(() => parseRoleListField(field), [field]);
  // Malformed JSON must be visible, never silently replaced: fall back to a
  // raw textarea so the stored content survives until the user fixes it.
  const malformedJson =
    field.mode === 'json' && field.content.trim() !== '' && parsed === undefined;
  const maxItems = def.maxItems ?? 0;
  const maxItem = def.maxItem ?? 0;
  return (
    <FieldBlock>
      <FieldHead>
        <FieldTitle>{def.title}</FieldTitle>
        <FieldHelper>
          {def.helper}{' '}
          {field.mode === 'json'
            ? `Up to ${maxItems}.`
            : field.mode === 'markdown'
              ? `One "- " line per item — up to ${maxItems}.`
              : `One item per line — up to ${maxItems}.`}
        </FieldHelper>
      </FieldHead>
      <AddRow>
        <Segmented
          options={MODE_OPTIONS}
          value={field.mode}
          onChange={(mode: RoleFieldMode) => onPatch({ mode })}
          size="sm"
          ariaLabel={`${def.title} format`}
        />
      </AddRow>
      {field.mode === 'json' && !malformedJson ? (
        <TagEditor
          label={def.label}
          values={parsed ?? []}
          maxItems={maxItems}
          maxItem={maxItem}
          onChange={(values) => onPatch({ content: JSON.stringify(values) })}
        />
      ) : (
        <>
          {malformedJson && (
            <Whisper $tone="red" role="alert">
              This field does not parse as a JSON list — fix the text below.
              Nothing is overwritten until it parses.
            </Whisper>
          )}
          <TextArea
            aria-label={def.title}
            value={field.content}
            rows={def.rows}
            onChange={(event) => onPatch({ content: event.target.value })}
            placeholder={field.mode === 'markdown' ? '- one\n- per line' : def.placeholder}
          />
        </>
      )}
    </FieldBlock>
  );
}

/**
 * Role section — the SINGLE owner/editor of `role` (D-N2: six modal
 * fields, each Raw/Markdown/JSON, composed into the system prompt
 * server-side). All six fields are optional; an empty role is a valid
 * "no persona" state. Mirrors the Context/Response save machinery:
 * POST/PUT through the draft-version hooks, 8s autosave with unmount
 * flush, manual saveSignal, 409 adoption, 412 conflict dialog. Every cap
 * issue shown here is filtered to role paths.
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

  if (!definition) {
    return (
      <Wrap>
        <SkeletonRows rows={4} />
      </Wrap>
    );
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
      <Wrap>
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
      {FIELDS.map((def) =>
        def.kind === 'text' ? (
          <RoleTextField
            key={def.key}
            def={def}
            field={policy[def.key]}
            onPatch={(part) => patchField(def.key, part)}
          />
        ) : (
          <RoleListField
            key={def.key}
            def={def}
            field={policy[def.key]}
            onPatch={(part) => patchField(def.key, part)}
          />
        ),
      )}

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
    </Wrap>
  );
}
