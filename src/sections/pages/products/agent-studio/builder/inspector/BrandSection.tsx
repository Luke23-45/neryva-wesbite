import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { TextArea } from '@components/common/ui/TextArea';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { ApiError } from '@lib/engine/client';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { checkDefinitionCaps, findSecret } from '@lib/engine/setup-caps';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { AUTOSAVE_MS, buildDraftPayload } from '../lib/draft-save';
import {
  BRAND_LIMIT,
  countBrandChars,
  estimateBrandTokens,
  isBrandEmpty,
} from '../lib/brand-model';
import { ConflictDialog } from './ConflictDialog';
import { BrandSamples } from './BrandSamples';
import {
  DefaultNote,
  GuideBody,
  GuideBox,
  GuideToggle,
} from './BrandSection.styles';
import {
  BudgetBar,
  BudgetFill,
  CounterRow,
  EmptyState,
  Whisper,
  Wrap,
} from './InstructionsSection.styles';

export interface BrandSectionProps {
  assistantId: string;
  /** Current source voice (draft ?? active ?? blank). Null while loading. */
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

/**
 * C03 voice section — a single ≤2000-char statement (SPEC: single textarea),
 * composed by the engine into every reply. Same save state machine as the
 * composer (debounce, PUT/POST, 409 adopt, 412 dialog, dirty flag); the only
 * structural difference is insert-replaces-with-consent (a voice is singular —
 * appending two voices breeds contradiction).
 */
export function BrandSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: BrandSectionProps) {
  const queryClient = useQueryClient();
  const sourceText = definition?.brand ?? '';
  const initKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;

  const [docKey, setDocKey] = useState(initKey);
  const [text, setText] = useState(sourceText);
  const [guideOpen, setGuideOpen] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [pendingVoice, setPendingVoice] = useState<{ text: string; source: string } | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const dirty = text !== sourceText;

  // Adopt server text whenever clean (save echo, 409-adopt, reload-theirs).
  // Local edits ALWAYS win — adoption only fires on exact equality.
  if (docKey !== initKey) {
    setDocKey(initKey);
    if (!dirty) setText(sourceText);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const chars = countBrandChars(text);
  const overLimit = chars > BRAND_LIMIT;

  const secretHit = useMemo(() => {
    if (!canAuthor || text.trim() === '') return null;
    // findSecret scans the instructions slot — reuse it as the text-level
    // detector (same shapes Room refuses; the whisper copy is brand-specific).
    // Stronger case than instructions: brand ships into EVERY reply, so a
    // pasted credential here is a broadcast.
    return findSecret({ ...defaultConsumer(), instructions: text }) !== null;
  }, [text, canAuthor]);

  const capsIssues = useMemo(() => {
    if (!definition) return [];
    return checkDefinitionCaps({ ...definition, brand: text });
  }, [definition, text]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    if (overLimit) {
      messages.push(
        `${(chars - BRAND_LIMIT).toLocaleString()} over the ${BRAND_LIMIT.toLocaleString()} cap — trim to save.`,
      );
    }
    const first = capsIssues[0];
    if (first && !(overLimit && first.path === 'brand')) {
      messages.push(first.message);
    }
    return messages;
  }, [overLimit, chars, capsIssues]);

  const blocked = heldMessages.length > 0 || secretHit;
  const pending = saveDraft.isPending || updateDraft.isPending;
  const adoptingActive = adopting !== null && sourceText !== adopting;

  const doSave = useCallback(() => {
    if (!canAuthor || !definition || blocked || conflict) return;
    const next = buildDraftPayload(definition, { brand: text });
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
                expectedHash: sendHashRef.current,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: text,
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
          toast.success('A draft opened elsewhere — resumed it. Your text stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, definition, text, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  useEffect(() => {
    if (!canAuthor || !dirty || blocked || conflict || adoptingActive || pending || !definition) return;
    const timer = window.setTimeout(() => {
      doSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition, text, doSave]);

  const applySample = useCallback((sampleText: string, source: string) => {
    if (isBrandEmpty(sourceText) && isBrandEmpty(text)) {
      setText(sampleText);
      toast.success('Voice set — every save is a version.');
      return;
    }
    setPendingVoice({ text: sampleText, source });
  }, [sourceText, text]);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  if (!canAuthor) {
    return (
      <Wrap>
        {isBrandEmpty(text) ? (
          <DefaultNote>Platform default voice — nothing set.</DefaultNote>
        ) : (
          <DefaultNote>{text}</DefaultNote>
        )}
        <CounterRow>
          <span>
            {chars.toLocaleString()} / {BRAND_LIMIT.toLocaleString()} chars
          </span>
          <span>~{estimateBrandTokens(chars).toLocaleString()} tokens (est.)</span>
        </CounterRow>
        <BrandSamples assistantId={assistantId} canAuthor={false} startOpen={false} onInsert={() => undefined} />
      </Wrap>
    );
  }

  const ratio = chars / BRAND_LIMIT;

  return (
    <Wrap
      onKeyDown={(event) => {
        // Esc only ever blurs here (C02 parity) — canvas deselect stands down
        // while dirty via the page guard.
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      <TextArea
        label="Brand voice"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        placeholder="Short sentences. Contractions always. Never say “leverage”."
        hint="Composed into every reply, ahead of instructions."
      />

      <GuideBox>
        <GuideToggle type="button" onClick={() => setGuideOpen((o) => !o)} aria-expanded={guideOpen}>
          <span>How to write it {guideOpen ? '▾' : '▸'}</span>
        </GuideToggle>
        {guideOpen && (
          <GuideBody>
            <span><strong>Name 2–3 traits as rules, not adjectives</strong> (“short sentences” beats “friendly”).</span>
            <span><strong>List words to use and words to never use.</strong> Explicit bans beat vague tone.</span>
            <span><strong>Show one do and one don’t.</strong> The don’ts do the most work — generic models drift exactly where you don’t forbid.</span>
          </GuideBody>
        )}
      </GuideBox>

      {isBrandEmpty(text) && !dirty && (
        <DefaultNote>
          Platform default voice — nothing set. The agent speaks plainly until you give it a voice.
        </DefaultNote>
      )}

      {secretHit && (
        <Whisper $tone="amber" role="alert">
          This looks like a pasted credential — brand ships into every reply. Mention it, don’t paste it.
        </Whisper>
      )}
      {heldMessages.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      <BrandSamples assistantId={assistantId} canAuthor startOpen={isBrandEmpty(text)} onInsert={applySample} />

      <div>
        <CounterRow>
          <span>
            {chars.toLocaleString()} / {BRAND_LIMIT.toLocaleString()} chars
          </span>
          <span>~{estimateBrandTokens(chars).toLocaleString()} tokens (est.)</span>
        </CounterRow>
        <BudgetBar style={{ marginTop: 6 }}>
          <BudgetFill $ratio={ratio} />
        </BudgetBar>
      </div>

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          selectTheirs={(live) => live.brand ?? ''}
          onReloadTheirs={(theirs) => {
            setText(theirs);
            setConflict(null);
            setAdopting(theirs);
            void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
            toast('Reloaded their version — review it, then keep editing or close.');
          }}
          onSaveMine={(freshHash) => {
            updateDraft.mutate(
              { definition: buildDraftPayload(definition as AgentDefinition, { brand: conflict.attempted }), expectedHash: freshHash },
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
        open={pendingVoice !== null}
        title="Replace the current voice?"
        message={`Use the ${pendingVoice?.source ?? 'sample'} voice? Versions keep the old one — nothing is lost.`}
        confirmLabel="Use this voice"
        cancelLabel="Keep mine"
        onConfirm={() => {
          if (pendingVoice) setText(pendingVoice.text);
          setPendingVoice(null);
        }}
        onCancel={() => setPendingVoice(null)}
      />
    </Wrap>
  );
}
