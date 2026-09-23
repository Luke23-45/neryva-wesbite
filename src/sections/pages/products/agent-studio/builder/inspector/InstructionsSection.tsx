import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { checkDefinitionCaps, findSecret } from '@lib/engine/setup-caps';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import {
  composeInstructions,
  ensureSingletons,
  estimateTokens,
  INSTRUCTIONS_LIMIT,
  isEmptyDocument,
  makeBlock,
  parseInstructions,
  type InstructionBlock,
} from '../lib/instructions-model';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave } from '../lib/use-draft-autosave';
import { ConflictDialog } from './ConflictDialog';
import { SamplesSection } from './SamplesSection';
import {
  AddButton,
  AddRow,
  BlockCard,
  BudgetBar,
  BudgetFill,
  CounterRow,
  CustomCard,
  EmptyState,
  Goldilocks,
  IconButton,
  MicroCount,
  OverrideBanner,
  PreviewBlock,
  PreviewCard,
  PreviewHeader,
  PreviewText,
  RuleInputWrap,
  RuleRow,
  SectionLabel,
  Whisper,
  Wrap,
} from './InstructionsSection.styles';

/**
 * Research ceiling (PLAN.md §5.1): 2–3 canonical examples beat 10 mediocre
 * ones. The cap states its reason inline instead of silently refusing.
 */
const MAX_EXAMPLES = 6;

const NORMALIZE_SEEN = new Set<string>();

function hashSource(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return `${text.length}:${hash}`;
}

export interface InstructionsSectionProps {
  assistantId: string;
  /** Current source text (draft ?? active ?? blank). Null while loading. */
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
}

const SINGLETON_LABEL: Record<string, string> = {
  role: 'Role — who this agent is',
  task: 'Task — the job in one breath',
  output: 'Output — the response contract',
  refusal: 'Refusal — the exact fallback',
};

/**
 * C02 composer — structured blocks over the single version `instructions`
 * field. First draft-writing surface in the builder: owns autosave, the 409
 * adopt flow, and the 412 merge-or-reload dialog (Room copy skeleton).
 */
export function InstructionsSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: InstructionsSectionProps) {
  const queryClient = useQueryClient();
  const sourceText = definition?.instructions ?? '';
  const initKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;

  const [docKey, setDocKey] = useState(initKey);
  const [blocks, setBlocks] = useState<InstructionBlock[]>(() =>
    ensureSingletons(parseInstructions(sourceText)),
  );
  const [tab, setTab] = useState<'compose' | 'preview' | 'raw'>('compose');
  const [rawOverride, setRawOverride] = useState('');
  const [overridden, setOverridden] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  // Reload-theirs adopts server text that props haven't caught up to yet —
  // derived (never cleared): once the source converges it stays converged.
  const [adopting, setAdopting] = useState<string | null>(null);
  const fieldRefs = useRef(new Map<string, HTMLElement>());
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const composed = overridden ? rawOverride : composeInstructions(blocks);
  const dirty = composed !== sourceText;

  // Adopt server text whenever clean (save echo, 409-adopt, reload-theirs).
  // Local edits ALWAYS win — adoption only fires on exact equality. State
  // adjustment during render (sanctioned pattern: previous-value tracking),
  // never cascading effects.
  const shouldAdopt = docKey !== initKey && !dirty;
  if (shouldAdopt) {
    setDocKey(initKey);
    setBlocks(ensureSingletons(parseInstructions(sourceText)));
    if (overridden) {
      setOverridden(false);
      setRawOverride('');
    }
  }
  const normalizeKey =
    shouldAdopt && sourceText !== '' && composeInstructions(parseInstructions(sourceText)) !== sourceText
      ? hashSource(sourceText)
      : null;
  useEffect(() => {
    if (normalizeKey !== null && !NORMALIZE_SEEN.has(normalizeKey)) {
      NORMALIZE_SEEN.add(normalizeKey);
      toast.success('Formatted into blocks — content preserved.');
    }
  }, [normalizeKey]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const adoptingActive = adopting !== null && sourceText !== adopting;

  const chars = composed.length;
  const overLimit = chars > INSTRUCTIONS_LIMIT;

  const secretHit = useMemo(() => {
    if (!canAuthor) return null;
    const shell = defaultConsumer();
    for (const block of blocks) {
      if (block.body.trim() === '') continue;
      const hit = findSecret({ ...shell, instructions: block.body });
      if (hit) return { blockId: block.id, message: hit };
    }
    if (overridden && rawOverride.trim() !== '') {
      const hit = findSecret({ ...shell, instructions: rawOverride });
      if (hit) return { blockId: null, message: hit };
    }
    return null;
  }, [blocks, overridden, rawOverride, canAuthor]);

  const capsIssues = useMemo(() => {
    if (!definition) return [];
    return checkDefinitionCaps({ ...definition, instructions: composed });
  }, [definition, composed]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    if (overLimit) {
      messages.push(
        `${(chars - INSTRUCTIONS_LIMIT).toLocaleString()} over the ${INSTRUCTIONS_LIMIT.toLocaleString()} cap — trim to save.`,
      );
    }
    // checkDefinitionCaps is the Room-parity gate (models-missing, empty,
    // over-limit, secrets): first message verbatim, never paraphrased.
    const first = capsIssues[0];
    if (first && !(overLimit && first.path === 'instructions')) {
      messages.push(first.message);
    }
    return messages;
  }, [overLimit, chars, capsIssues]);

  const blocked = heldMessages.length > 0 || secretHit !== null;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const patchBlock = useCallback((id: string, patch: Partial<Pick<InstructionBlock, 'title' | 'body'>>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const moveBlock = useCallback((id: string, direction: -1 | 1) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      const swap = index + direction;
      if (index < 0 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }, []);

  const addRule = useCallback((afterIndex?: number) => {
    const row = makeBlock('rule');
    setBlocks((prev) => {
      const rules = prev.filter((b) => b.type === 'rule');
      const anchor = afterIndex === undefined ? rules[rules.length - 1] : rules[afterIndex];
      if (!anchor) {
        // No rules yet: append after the last singleton for stable ordering.
        let at = prev.length;
        for (let i = 0; i < prev.length; i += 1) {
          if (prev[i].type === 'example' || prev[i].type === 'output' || prev[i].type === 'refusal' || prev[i].type === 'custom') {
            at = i;
            break;
          }
        }
        const next = [...prev];
        next.splice(at, 0, row);
        return next;
      }
      const at = prev.findIndex((b) => b.id === anchor.id) + 1;
      const next = [...prev];
      next.splice(at, 0, row);
      return next;
    });
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-rule-row="${row.id}"] input`)?.focus();
    }, 0);
  }, []);

  const addExample = useCallback(() => {
    const example = makeBlock('example');
    setBlocks((prev) => [...prev, example]);
    window.setTimeout(() => {
      fieldRefs.current.get(example.id)?.focus();
    }, 0);
  }, []);

  const appendBlocks = useCallback((incoming: InstructionBlock[]) => {
    setBlocks((prev) => {
      const next = [...prev];
      const kept: string[] = [];
      for (const block of incoming) {
        if ((block.type === 'role' || block.type === 'task' || block.type === 'output' || block.type === 'refusal') &&
          next.some((b) => b.type === block.type && b.body.trim() !== '')) {
          kept.push(block.type);
          continue;
        }
        next.push({ ...block, id: makeBlock(block.type).id });
      }
      if (kept.length > 0) {
        window.setTimeout(() => {
          toast.success(`Starter merged — your ${kept.join(', ')} kept.`);
        }, 0);
      }
      return next;
    });
  }, []);

  const doSave = useCallback(() => {
    if (!canAuthor || !definition || blocked || conflict) return;
    const next = buildDraftPayload(definition, { instructions: composed });
    if (isDraft && versionId && versionHash) {
      sendHashRef.current = versionHash;
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        {
          onSuccess: () => undefined,
          onError: (error) => {
            // 412 → merge-or-reload dialog (hook stays silent on 412 by design).
            if (error instanceof ApiError && error.status === 412) {
              const details =
                typeof error.details === 'object' && error.details !== null
                  ? (error.details as Record<string, unknown>)
                  : {};
              setConflict({
                expectedHash: sendHashRef.current,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: composed,
              });
            }
            // Other failures keep the hook's verbatim toast (no double-surface).
          },
        },
      );
      return;
    }
    saveDraft.mutate(next, {
      onSuccess: () => undefined,
      onError: (error) => {
        // A draft appeared between load and save (Room parity): refetch adopts
        // it as the save target — your text stays, the next save PUTs to it.
        // (The hook's own toast still fires; guidance follows, never silence.)
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your text stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, definition, composed, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  // A2-23: shared autosave — 8s debounce plus an unmount flush so switching
  // sections persists pending edits instead of silently dropping them.
  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition },
    doSave,
    [composed],
  );

  const focusBlock = useCallback((id: string) => {
    setTab('compose');
    window.setTimeout(() => {
      fieldRefs.current.get(id)?.focus();
    }, 0);
  }, []);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  if (!canAuthor) {
    const preview = composeInstructions(blocks);
    return (
      <Wrap>
        <PreviewCard>
          {preview.trim() === '' ? (
            <EmptyState>No instructions yet.</EmptyState>
          ) : (
            <PreviewText>{preview}</PreviewText>
          )}
        </PreviewCard>
        <CounterRow>
          <span>
            {chars.toLocaleString()} / {INSTRUCTIONS_LIMIT.toLocaleString()} chars
          </span>
          <span>~{estimateTokens(chars).toLocaleString()} tokens (est.)</span>
        </CounterRow>
        <SamplesSection
          assistantId={assistantId}
          canAuthor={false}
          startOpen={false}
          onInsert={() => undefined}
        />
      </Wrap>
    );
  }

  const singletons = blocks.filter((b) => b.type === 'role' || b.type === 'task' || b.type === 'output' || b.type === 'refusal');
  const rules = blocks.filter((b) => b.type === 'rule');
  const examples = blocks.filter((b) => b.type === 'example');
  const customs = blocks.filter((b) => b.type === 'custom');
  const emptyDoc = isEmptyDocument({ blocks });
  const ratio = chars / INSTRUCTIONS_LIMIT;

  const registerField = (id: string) => (element: HTMLElement | null) => {
    if (element) fieldRefs.current.set(id, element);
    else fieldRefs.current.delete(id);
  };

  return (
    <Wrap
      onKeyDown={(event) => {
        // Esc inside the composer only ever blurs (PLAN.md §5.6) — canvas
        // deselect is owned by the page guard, which stands down while dirty.
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      <Segmented
        options={[
          { value: 'compose', label: 'Compose' },
          { value: 'preview', label: 'Preview' },
          { value: 'raw', label: 'Raw' },
        ]}
        value={tab}
        onChange={setTab}
        size="sm"
        ariaLabel="Instructions editing mode"
      />

      {tab === 'preview' && (
        <PreviewCard>
          {composed.trim() === '' ? (
            <EmptyState>No instructions yet — compose or use a sample below.</EmptyState>
          ) : (
            blocks
              .filter((b) => b.body.trim() !== '' || b.title.trim() !== '')
              .map((b) => (
                <PreviewBlock key={b.id} type="button" onClick={() => focusBlock(b.id)} title="Jump to this block">
                  <PreviewHeader>{b.type.toUpperCase()}</PreviewHeader>
                  <PreviewText>{b.title ? `${b.title}\n${b.body}` : b.body}</PreviewText>
                </PreviewBlock>
              ))
          )}
        </PreviewCard>
      )}

      {tab === 'raw' && (
        <>
          {overridden && (
            <OverrideBanner>
              <span>Custom text — composer paused. Structured edits resume after restore.</span>
              <span>
                <ActionButton size="sm" variant="secondary" onClick={() => setRestoreOpen(true)}>
                  Restore from blocks
                </ActionButton>
              </span>
            </OverrideBanner>
          )}
          <TextArea
            id="instructions-raw-text"
            label="Raw payload — exactly what the model receives"
            value={overridden ? rawOverride : composed}
            onChange={(event) => {
              setRawOverride(event.target.value);
              if (!overridden) setOverridden(true);
            }}
            rows={14}
          />
        </>
      )}

      {tab === 'compose' && (
        <>
          {singletons.map((block) => (
            <div key={block.id}>
              <SectionLabel>
                {SINGLETON_LABEL[block.type] ?? block.type}
                <MicroCount>{block.body.length.toLocaleString()}</MicroCount>
              </SectionLabel>
              <BlockCard style={{ marginTop: 6 }}>
                <TextArea
                  ref={registerField(block.id)}
                  label={undefined}
                  aria-label={SINGLETON_LABEL[block.type] ?? block.type}
                  value={block.body}
                  onChange={(event) => patchBlock(block.id, { body: event.target.value })}
                  rows={block.type === 'role' ? 3 : 2}
                  placeholder={
                    block.type === 'role'
                      ? 'You are…'
                      : block.type === 'output'
                        ? 'Verdict + section cite · max 3 exchanges'
                        : block.type === 'refusal'
                          ? 'Over $500 or off-policy → escalate to a human'
                          : 'One breath.'
                  }
                />
              </BlockCard>
            </div>
          ))}

          <div>
            <SectionLabel>
              RULES · {rules.length}
              <MicroCount>one rule per line works best</MicroCount>
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {rules.map((block, index) => (
                <RuleRow key={block.id} data-rule-row={block.id}>
                  <IconButton
                    type="button"
                    aria-label={`Move rule ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveBlock(block.id, -1)}
                  >
                    <ChevronUp size={14} strokeWidth={1.8} />
                  </IconButton>
                  <IconButton
                    type="button"
                    aria-label={`Move rule ${index + 1} down`}
                    disabled={index === rules.length - 1}
                    onClick={() => moveBlock(block.id, 1)}
                  >
                    <ChevronDown size={14} strokeWidth={1.8} />
                  </IconButton>
                  <RuleInputWrap>
                    <TextInput
                      aria-label={`Rule ${index + 1}`}
                      value={block.body}
                      onChange={(event) => patchBlock(block.id, { body: event.target.value })}
                      placeholder="A hard constraint, stated as a rule"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addRule(index);
                        }
                      }}
                    />
                  </RuleInputWrap>
                  <IconButton type="button" aria-label={`Delete rule ${index + 1}`} onClick={() => removeBlock(block.id)}>
                    <X size={14} strokeWidth={1.8} />
                  </IconButton>
                </RuleRow>
              ))}
              {rules.length === 0 && (
                <EmptyState>No rules yet — one rule per line works best.</EmptyState>
              )}
              <AddRow>
                <AddButton type="button" onClick={() => addRule()}>
                  <Plus size={12} strokeWidth={2} style={{ verticalAlign: -1 }} /> Add rule
                </AddButton>
                {examples.length < MAX_EXAMPLES ? (
                  <AddButton type="button" onClick={addExample}>
                    <Plus size={12} strokeWidth={2} style={{ verticalAlign: -1 }} /> Add example
                  </AddButton>
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.6 }}>
                    {MAX_EXAMPLES} examples is plenty — 2–3 canonical beats 10 mediocre.
                  </span>
                )}
              </AddRow>
            </div>
          </div>

          {examples.map((block, index) => (
            <div key={block.id}>
              <SectionLabel>
                EXAMPLE {index + 1}
                <MicroCount>
                  <AddButton type="button" onClick={() => removeBlock(block.id)}>
                    Remove
                  </AddButton>
                </MicroCount>
              </SectionLabel>
              <BlockCard style={{ marginTop: 6 }}>
                <TextInput
                  ref={registerField(block.id)}
                  aria-label={`Example ${index + 1} title`}
                  value={block.title}
                  onChange={(event) => patchBlock(block.id, { title: event.target.value })}
                  placeholder="Edge case: angry refund request"
                />
                <TextArea
                  aria-label={`Example ${index + 1} body`}
                  value={block.body}
                  onChange={(event) => patchBlock(block.id, { body: event.target.value })}
                  rows={3}
                  placeholder={'User: …\nAssistant: …'}
                />
              </BlockCard>
            </div>
          ))}

          {customs.map((block) => (
            <div key={block.id}>
              <SectionLabel>
                CUSTOM TEXT — PRESERVED VERBATIM
                <MicroCount>
                  <AddButton type="button" onClick={() => removeBlock(block.id)}>
                    Delete
                  </AddButton>
                </MicroCount>
              </SectionLabel>
              <CustomCard style={{ marginTop: 6 }}>
                <TextArea
                  ref={registerField(block.id)}
                  aria-label="Custom text (preserved verbatim)"
                  value={block.body}
                  onChange={(event) => patchBlock(block.id, { body: event.target.value })}
                  rows={6}
                />
              </CustomCard>
            </div>
          ))}

          {emptyDoc && (
            <EmptyState>
              Fastest start: use a sample below — appends as blocks, nothing overwritten.
            </EmptyState>
          )}
        </>
      )}

      {secretHit && (
        <Whisper $tone="amber" role="alert">
          Looks like a pasted credential ({secretHit.message.replace(/^instructions:\s*/, '')}) — secrets are refused
          at save. Mention it, don’t paste it.
        </Whisper>
      )}
      {heldMessages.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      <SamplesSection
        assistantId={assistantId}
        canAuthor
        startOpen={emptyDoc}
        onInsert={appendBlocks}
      />

      <div>
        <CounterRow>
          <span>
            {chars.toLocaleString()} / {INSTRUCTIONS_LIMIT.toLocaleString()} chars
          </span>
          <span>~{estimateTokens(chars).toLocaleString()} tokens (est.)</span>
        </CounterRow>
        <BudgetBar style={{ marginTop: 6 }}>
          <BudgetFill $ratio={ratio} />
        </BudgetBar>
        {chars < 500 && chars > 0 && (
          <Goldilocks style={{ marginTop: 8 }}>
            Short prompts hold shape better — cut a paragraph, re-run evals, keep what scores.
          </Goldilocks>
        )}
      </div>

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          selectTheirs={(live) => live.instructions ?? ''}
          onReloadTheirs={(theirs) => {
            // Adopt theirs wholesale + refetch so props converge: the parked
            // autosave resumes only once the source IS theirs (adopting gate).
            setBlocks(ensureSingletons(parseInstructions(theirs)));
            setOverridden(false);
            setRawOverride('');
            setConflict(null);
            setAdopting(theirs);
            void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
            toast('Reloaded their version — review it, then keep editing or close.');
          }}
          onSaveMine={(freshHash) => {
            updateDraft.mutate(
              { definition: buildDraftPayload(definition as AgentDefinition, { instructions: conflict.attempted }), expectedHash: freshHash },
              {
                onSuccess: () => {
                  toast.success('Saved over the latest version');
                  setConflict(null);
                },
                onError: (error) => {
                  if (error instanceof ApiError && error.status === 412) {
                    const details =
                      typeof error.details === 'object' && error.details !== null
                        ? (error.details as Record<string, unknown>)
                        : {};
                    setConflict({
                      expectedHash: freshHash,
                      currentHash: typeof details.current === 'string' ? details.current : conflict.currentHash,
                      attempted: conflict.attempted,
                    });
                  }
                },
              },
            );
          }}
          onClose={() => setConflict(null)}
        />
      )}

      <ConfirmDialog
        open={restoreOpen}
        title="Restore from blocks?"
        message="Discard raw edits and restore from blocks?"
        confirmLabel="Restore"
        cancelLabel="Keep raw text"
        onConfirm={() => {
          setOverridden(false);
          setRawOverride('');
          setRestoreOpen(false);
        }}
        onCancel={() => setRestoreOpen(false)}
      />
    </Wrap>
  );
}
