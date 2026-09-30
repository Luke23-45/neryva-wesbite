import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AudioLines, ChevronDown } from 'lucide-react';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { ApiError } from '@lib/engine/client';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { checkDefinitionCaps, findSecret } from '@lib/engine/setup-caps';
import { isRoleFieldMode, type RoleFieldBlock, type RoleFieldMode } from '@lib/engine/role-fields';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import {
  BRAND_LIMIT,
  brandVoiceHasValue,
  countBrandChars,
  defaultBrandMode,
  estimateBrandTokens,
  isBrandEmpty,
  parseBrandVoice,
  readBrandBlock,
  type BrandMode,
  type BrandVoice,
} from '../lib/brand-model';
import { ConflictDialog } from './ConflictDialog';
import { BrandSamples } from './BrandSamples';
import {
  DefaultNote,
  GuideBody,
  GuideBox,
  GuideChevron,
  GuideToggle,
  VoiceCard,
  VoiceEmpty,
  VoiceLabel,
  VoiceText,
} from './BrandSection.styles';
import { CounterRow, Whisper } from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';
import {
  SectionPage,
  ContextBudget,
  MicroTip,
} from '../section-ui/SectionPage';
import { PillDot, ProgressPill } from '../section-ui/SectionPage.styles';
import { BlockCard, TextPreview } from '../section-ui/BlockCard';
import { BlockEditor } from '../section-ui/BlockEditor';
import type { EditableBlock, SavedBlock } from '../section-ui/types';

export interface BrandSectionProps {
  assistantId: string;
  /** Current source voice (draft ?? active ?? absent). Null while loading. */
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

interface ConflictState {
  expectedHash: string;
  currentHash: string | null;
  attempted: string;
  attemptedDef: AgentDefinition;
}

/** Local edit state — one modal text block. */
interface BrandState {
  mode: RoleFieldMode;
  content: string;
}

/** One focused-editor session. */
interface EditingSession {
  target: EditableBlock;
  apply: (saved: SavedBlock) => void;
}

/**
 * Normalize whatever the definition holds into editable local state.
 * Unknown modes fall back to raw (the documented default for text
 * fields); the section never rewrites what it read, it just edits it.
 */
function readBrandState(definition: AgentDefinition | null): BrandState {
  const raw = readBrandBlock(definition?.brand) as RoleFieldBlock | undefined;
  return {
    mode: raw && isRoleFieldMode(raw.mode) ? raw.mode : defaultBrandMode(),
    content: typeof raw?.content === 'string' ? raw.content : '',
  };
}

/** The console writes `brand` ONLY when the block is non-blank — absent =
 * platform default (valid, the engine composes nothing). Clearing the
 * field removes the key so no meaningless empty block persists. */
function brandOrUndefined(state: BrandState): BrandVoice | undefined {
  if (state.content.trim() === '') return undefined;
  return { mode: state.mode as BrandMode, content: state.content };
}

function modeCaption(mode: RoleFieldMode): string {
  if (mode === 'markdown') return 'Markdown';
  if (mode === 'json') return 'JSON';
  return 'Plain';
}

/**
 * Brand voice section — one modal text block ({ mode, content }), composed
 * by the engine into every reply after instructions and role. The page
 * shows a single card; clicking it opens the focused in-place editor (no
 * modal, no route change). Same save state machine as the other sections
 * (debounce, PUT/POST, 409 adopt, 412 dialog, dirty flag); the only
 * structural difference is insert-replaces-with-consent (a voice is
 * singular — appending two voices breeds contradiction).
 */
export function BrandSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: BrandSectionProps) {
  const queryClient = useQueryClient();
  const source = readBrandState(definition);
  const initKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;

  const [docKey, setDocKey] = useState(initKey);
  const [block, setBlock] = useState<BrandState>(() => readBrandState(definition));
  const [guideOpen, setGuideOpen] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [pendingVoice, setPendingVoice] = useState<{ text: string; source: string } | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingSession | null>(null);
  const blockRef = useRef(block);
  useEffect(() => {
    blockRef.current = block;
  });
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const dirty = block.mode !== source.mode || block.content !== source.content;

  // Adopt server state whenever clean (save echo, 409-adopt, reload-theirs).
  // Local edits ALWAYS win — adoption only fires on exact equality.
  if (docKey !== initKey) {
    setDocKey(initKey);
    if (!dirty) setBlock(source);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const chars = countBrandChars(block);
  const overLimit = chars > BRAND_LIMIT;

  const secretHit = useMemo(() => {
    if (!canAuthor || block.content.trim() === '') return null;
    // findSecret scans the instructions slot — reuse it as the text-level
    // detector (same shapes Room refuses; the whisper copy is brand-specific).
    // Stronger case than instructions: brand ships into EVERY reply, so a
    // pasted credential here is a broadcast.
    return findSecret({ ...defaultConsumer(), instructions: block.content }) !== null;
  }, [block.content, canAuthor]);

  const capsIssues = useMemo(() => {
    if (!definition) return [];
    return checkDefinitionCaps({ ...definition, brand: brandOrUndefined(block) });
  }, [definition, block]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    if (overLimit) {
      messages.push(
        `${(chars - BRAND_LIMIT).toLocaleString()} over the ${BRAND_LIMIT.toLocaleString()} cap — trim to save.`,
      );
    }
    // Own-section gate only: completeness issues elsewhere (no model picked…)
    // must never hold a brand save — drafts are work-in-progress; the publish
    // gate owns completeness. An unfiltered capsIssues[0] used to silently
    // refuse every save on a model-less agent.
    for (const issue of capsIssues) {
      if (issue.path !== 'brand') continue;
      if (overLimit) continue; // already messaged above
      messages.push(issue.message);
    }
    return messages;
  }, [overLimit, chars, capsIssues]);

  const blocked = heldMessages.length > 0 || secretHit;
  const pending = saveDraft.isPending || updateDraft.isPending;
  const adoptingActive = adopting !== null && JSON.stringify(source) !== adopting;

  const buildNext = useCallback(() => {
    if (!definition) return null;
    return buildDraftPayload(definition, { brand: brandOrUndefined(block) });
  }, [definition, block]);

  const doSave = useCallback(() => {
    const next = buildNext();
    if (!canAuthor || !next || blocked || conflict) return;
    if (isDraft && versionId && versionHash) {
      sendHashRef.current = versionHash;
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        {
          onError: (error) => {
            if (error instanceof ApiError && error.status === 412) {
              const details =
                typeof error.details === 'object' && error.details !== null
                  ? (error.details as Record<string, unknown>)
                  : {};
              setConflict({
                expectedHash: sendHashRef.current,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: JSON.stringify({ brand: next.brand ?? null }),
                attemptedDef: next,
              });
            }
          },
        },
      );
      return;
    }
    saveDraft.mutate(next, {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your voice stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  // A2-23: shared autosave — 8s debounce plus an unmount flush so switching
  // sections persists pending edits instead of silently dropping them.
  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition },
    doSave,
    [block],
  );

  // Manual save (topbar Save button / Ctrl+S / ⌘S): never silent — a held
  // save toasts its reason instead of swallowing the click.
  useManualSaveSignal(saveSignal, doSave, {
    canAuthor,
    blocked,
    conflict,
    holdReason: () => (secretHit ? 'This looks like a pasted credential — brand ships into every reply. Mention it, don’t paste it.' : (heldMessages[0] ?? null)),
  });

  const applySample = useCallback((sampleText: string, sampleSource: string) => {
    if (isBrandEmpty(source) && isBrandEmpty(blockRef.current)) {
      setBlock((b) => ({ ...b, content: sampleText }));
      toast.success('Voice set — every save is a version.');
      return;
    }
    setPendingVoice({ text: sampleText, source: sampleSource });
  }, [source]);

  const openEditor = useCallback(() => {
    const b = blockRef.current;
    setEditing({
      target: {
        key: 'brand:voice',
        sectionLabel: 'Brand voice',
        title: 'Brand voice',
        jsonKind: 'text',
        block: { mode: b.mode, content: b.content },
        placeholder:
          b.mode === 'json'
            ? '"A JSON string — quotes included"'
            : 'Short sentences. Contractions always. Never say “leverage”.',
        cap: BRAND_LIMIT,
      },
      apply: (saved) =>
        setBlock({ mode: saved.block.mode as BrandMode, content: saved.block.content }),
    });
  }, []);

  if (!definition) {
    return <SkeletonRows rows={4} />;
  }

  if (!canAuthor) {
    const voice = parseBrandVoice(definition.brand);
    return (
      <SectionPage
        title="Brand voice"
        subtitle="The agent's personality — how it sounds in every reply. Composed into the system prompt after instructions and role."
        pill={
          <ProgressPill>
            <PillDot aria-hidden="true" />
            Read-only
          </ProgressPill>
        }
      >
        <VoiceCard>
          <VoiceLabel>Brand voice</VoiceLabel>
          {voice === undefined ? (
            <VoiceEmpty>Platform default voice — nothing set.</VoiceEmpty>
          ) : (
            <VoiceText>{voice}</VoiceText>
          )}
        </VoiceCard>
        <CounterRow>
          <span>
            {chars.toLocaleString()} / {BRAND_LIMIT.toLocaleString()} chars
          </span>
          <span>~{estimateBrandTokens(chars).toLocaleString()} tokens (est.)</span>
        </CounterRow>
        <BrandSamples assistantId={assistantId} canAuthor={false} startOpen={false} onInsert={() => undefined} />
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

  const hasVoice = brandVoiceHasValue(block);
  const malformed = block.content.trim() !== '' && !hasVoice;
  const tokens = estimateBrandTokens(chars);

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
        title="Brand voice"
        subtitle="The agent's personality — how it sounds in every reply. Composed into the system prompt after instructions and role."
        progress={{ done: hasVoice ? 1 : 0, total: 1 }}
        rail={
          <>
            <ContextBudget
              total={chars}
              limit={BRAND_LIMIT}
              rows={[{ key: 'voice', label: 'Brand voice', chars }]}
              note={`${(BRAND_LIMIT - chars).toLocaleString()} chars of headroom · ~${tokens.toLocaleString()} tokens (est.)`}
            />
            <MicroTip>
              A voice is singular — replacing beats appending. Samples ask before they replace yours.
            </MicroTip>
          </>
        }
      >
        <BlockCard
          title="Brand voice"
          helper="Composed into every reply, after instructions and role."
          charCount={`${chars.toLocaleString()} chars`}
          done={hasVoice}
          empty={!malformed && !hasVoice}
          emptyTitle="No voice yet"
          emptyHint="Short sentences. Contractions always. Never say “leverage”."
          emptyIcon={<AudioLines size={16} strokeWidth={1.8} />}
          preview={<TextPreview text={block.content} />}
          caption={malformed ? `${modeCaption(block.mode)} · invalid — edit to fix` : modeCaption(block.mode)}
          onOpen={openEditor}
        />

        {isBrandEmpty(block) && !dirty && (
          <DefaultNote>
            Platform default voice — nothing set. The agent speaks plainly until you give it a voice.
          </DefaultNote>
        )}

        <GuideBox>
          <GuideToggle type="button" onClick={() => setGuideOpen((o) => !o)} aria-expanded={guideOpen}>
            <span>How to write it</span>
            <GuideChevron $open={guideOpen} aria-hidden="true">
              <ChevronDown size={16} strokeWidth={2} />
            </GuideChevron>
          </GuideToggle>
          {guideOpen && (
            <GuideBody>
              <span><strong>Name 2–3 traits as rules, not adjectives</strong> (“short sentences” beats “friendly”).</span>
              <span><strong>List words to use and words to never use.</strong> Explicit bans beat vague tone.</span>
              <span><strong>Show one do and one don’t.</strong> The don’ts do the most work — generic models drift exactly where you don’t forbid.</span>
            </GuideBody>
          )}
        </GuideBox>

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

        <BrandSamples assistantId={assistantId} canAuthor startOpen={isBrandEmpty(block)} onInsert={applySample} />
      </SectionPage>

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          selectTheirs={(live) => JSON.stringify({ brand: live.brand ?? null })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { brand?: unknown };
              const raw = readBrandBlock(parsed.brand) as RoleFieldBlock | undefined;
              setBlock({
                mode: raw && isRoleFieldMode(raw.mode) ? raw.mode : defaultBrandMode(),
                content: typeof raw?.content === 'string' ? raw.content : '',
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
                      attemptedDef: conflict.attemptedDef,
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
          if (pendingVoice) setBlock((b) => ({ ...b, content: pendingVoice.text }));
          setPendingVoice(null);
        }}
        onCancel={() => setPendingVoice(null)}
      />
    </div>
  );
}
