import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileOutput, FileText, MessagesSquare, Plus, ShieldAlert, Target, X } from 'lucide-react';
import { ApiError, engine } from '@lib/engine/client';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { findSecret } from '@lib/engine/setup-caps';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import {
  blankInstructionsV1,
  blankSingleton,
  BLOCK_HINTS,
  BLOCK_LABELS,
  clientSaveBlockers,
  ensureSingletonsV1,
  estimateTokens,
  INSTRUCTIONS_BLOCK_MAX_LENGTH,
  INSTRUCTIONS_LIMIT,
  isEmptyDocumentV1,
  makeRepeatableBlock,
  normalizeDocumentForSave,
  SINGLETON_KINDS,
  type ExampleBlock,
  type InstructionMode,
  type InstructionsV1,
  type NewInstructionBlock,
  type RepeatableBlock,
  type RepeatableKind,
  type SingletonBlock,
  type SingletonKind,
} from '../lib/instructions-v1';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import { useSectionConfirmationContext } from '../lib/section-confirmation-context';
import { ConflictDialog } from './ConflictDialog';
import { SamplesSection } from './SamplesSection';
import { SkeletonRows } from './SkeletonRows';
import {
  SectionPage,
  PageOutline,
  ContextBudget,
  MicroTip,
} from '../section-ui/SectionPage';
import { PillDot, ProgressPill } from '../section-ui/SectionPage.styles';
import {
  BlockCard,
  TextPreview,
} from '../section-ui/BlockCard';
import { BlockEditor } from '../section-ui/BlockEditor';
import { RulesBuilder } from '../section-ui/RulesBuilder';
import { AddButton } from '../section-ui/RulesBuilder.styles';
import type { EditableBlock, ModalBlock, SavedBlock } from '../section-ui/types';
import {
  AddHint,
  AddRow,
  CounterRow,
  IconButton,
  UndoToast,
  UndoToastButton,
  Whisper,
} from './InstructionsSection.styles';
import {
  CompiledCard,
  CompiledEmpty,
  CompiledHead,
  CompiledHelper,
  CompiledMeta,
  CompiledText,
  CompiledTitle,
  ReadCard,
  ReadText,
} from './InstructionsCompiled.styles';

/**
 * Research ceiling (PLAN.md §5.1): 2–3 canonical examples beat 10 mediocre
 * ones. The cap states its reason inline instead of silently refusing.
 */
const MAX_EXAMPLES = 6;

/** Server preview debounce — one compile request per pause in typing. */
const PREVIEW_DEBOUNCE_MS = 600;

export interface InstructionsSectionProps {
  assistantId: string;
  /** Current source text (draft ?? active ?? blank). Null while loading. */
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

interface PreviewBlockMeta {
  kind: string;
  block_id: string | null;
  title: string | null;
  empty: boolean;
}

interface ServerPreview {
  text: string;
  hash: string;
  compiler_version: string;
  blocks: PreviewBlockMeta[];
}

interface ConflictState {
  expectedHash: string;
  currentHash: string | null;
  attemptedDoc: InstructionsV1;
  attemptedPreview: string | null;
}

/** One focused-editor session: what to edit and how to apply it. */
interface EditingSession {
  target: EditableBlock;
  apply: (saved: SavedBlock) => void;
}

function modeCaption(mode: InstructionMode): string {
  if (mode === 'markdown') return 'Markdown';
  if (mode === 'json') return 'JSON';
  return 'Plain';
}

function toModalBlock(block: { mode: InstructionMode; content: string }): ModalBlock {
  return { mode: block.mode, content: block.content };
}

/**
 * Structured Instructions composer — blocks over the version-scoped
 * Instructions v1 document. The page shows one card per block; clicking a
 * card opens the focused in-place editor (no modal, no route change). Saves
 * PUT the document with If-Match; the 412 merge-or-reload dialog is
 * preserved. The browser never compiles: the compiled card shows the
 * server-produced prompt the model will receive.
 */
export function InstructionsSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: InstructionsSectionProps) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);

  const [doc, setDoc] = useState<InstructionsV1 | null>(null);
  const [baseDoc, setBaseDoc] = useState<InstructionsV1 | null>(null);
  const [serverHash, setServerHash] = useState<string | null>(versionHash);
  const [preview, setPreview] = useState<ServerPreview | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [putPending, setPutPending] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [editing, setEditing] = useState<EditingSession | null>(null);
  // I-BUG12: the "Use a sample" collapse state lives at the section root —
  // above the BlockEditor early-return that remounts the whole page when a
  // sub-editor closes. null = the maker hasn't touched the toggle yet, so
  // the auto-open rule (empty doc → open) applies.
  const [samplesOpen, setSamplesOpen] = useState<boolean | null>(null);
  const samplesRef = useRef<HTMLDivElement>(null);
  const previewSeqRef = useRef(0);
  const previewKeyRef = useRef('');
  const docRef = useRef<InstructionsV1 | null>(null);
  docRef.current = doc;

  const instructionsPath =
    orgId && versionId
      ? `/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/instructions`
      : null;

  // Structured document fetch — the single source of truth for authors.
  const docQuery = useQuery({
    queryKey: ['studio', 'assistants', assistantId, 'instructions', versionId],
    queryFn: async (): Promise<{ instructions: InstructionsV1 | null; hash: string }> => {
      const raw = await engine<Record<string, unknown>>(instructionsPath as string);
      return {
        instructions: (raw.instructions as InstructionsV1 | null) ?? null,
        hash: typeof raw.hash === 'string' ? raw.hash : '',
      };
    },
    enabled: instructionsPath !== null && canAuthor && isDraft,
  });

  const docKey = doc ? JSON.stringify(doc) : '';
  const baseKey = baseDoc ? JSON.stringify(baseDoc) : '';
  const dirty = doc !== null && baseDoc !== null && docKey !== baseKey;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  // Adopt the server document whenever the local copy is clean (save echo,
  // version switch, 409-adopt). Local edits always win — while dirty, a fresh
  // server revision only refreshes the If-Match hash; the next save carries
  // the user's blocks to the new revision.
  const serverDoc = docQuery.data;
  useEffect(() => {
    if (!serverDoc) return;
    if (!dirty) {
      const incoming = ensureSingletonsV1(serverDoc.instructions ?? blankInstructionsV1());
      setDoc(incoming);
      setBaseDoc(incoming);
    }
    setServerHash(serverDoc.hash);
  }, [serverDoc, dirty]);

  // Versionless (no draft yet): work against a local blank document. The
  // first save creates the draft, then chains the structured PUT below.
  useEffect(() => {
    if (versionId === null && doc === null && definition) {
      const blank = blankInstructionsV1();
      setDoc(blank);
      setBaseDoc(blank);
    }
  }, [versionId, doc, definition]);

  // What the next save (and the server preview) measures: the normalized
  // document, never the raw editor state.
  const effectiveDoc = useMemo(() => (doc ? normalizeDocumentForSave(doc) : null), [doc]);
  const effectiveKey = effectiveDoc ? JSON.stringify(effectiveDoc) : '';

  // Server preview — the ONLY compilation. Debounced per pause in typing, so
  // the budget rail and the over-limit hold all measure the same
  // server-produced text the model will receive.
  useEffect(() => {
    if (!canAuthor || !isDraft || !instructionsPath || !effectiveDoc) return;
    const payload = effectiveDoc;
    const key = effectiveKey;
    const seq = (previewSeqRef.current += 1);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const raw = await engine<Record<string, unknown>>(`${instructionsPath}/preview`, {
            method: 'POST',
            body: { instructions: payload },
          });
          if (previewSeqRef.current !== seq) return;
          setPreview({
            text: typeof raw.text === 'string' ? raw.text : '',
            hash: typeof raw.hash === 'string' ? raw.hash : '',
            compiler_version: typeof raw.compiler_version === 'string' ? raw.compiler_version : '',
            blocks: Array.isArray(raw.blocks) ? (raw.blocks as PreviewBlockMeta[]) : [],
          });
          previewKeyRef.current = key;
        } catch (err) {
          if (previewSeqRef.current !== seq) return;
          // Preview is advisory — the composer keeps working and the server
          // still validates on save. One toast, never a loop.
          if (err instanceof ApiError) toast.error(`Preview failed: ${err.message}`);
          setPreview(null);
        }
      })();
    }, PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [canAuthor, isDraft, instructionsPath, effectiveDoc, effectiveKey]);

  const previewStale = effectiveKey !== '' && previewKeyRef.current !== effectiveKey;
  const compiledChars = preview && !previewStale ? preview.text.length : null;
  const overLimit = compiledChars !== null && compiledChars > INSTRUCTIONS_LIMIT;

  const blockers = useMemo(() => {
    const messages: string[] = [];
    if (effectiveDoc) messages.push(...clientSaveBlockers(effectiveDoc));
    if (overLimit && compiledChars !== null) {
      messages.push(
        `${(compiledChars - INSTRUCTIONS_LIMIT).toLocaleString()} over the ${INSTRUCTIONS_LIMIT.toLocaleString()} cap — trim to save.`,
      );
    }
    return messages;
  }, [effectiveDoc, overLimit, compiledChars]);

  const secretHit = useMemo(() => {
    if (!canAuthor || !effectiveDoc) return null;
    const shell = defaultConsumer();
    const check = (content: string, label: string) => {
      if (content.trim() === '') return null;
      const hit = findSecret({ ...shell, instructions: content });
      return hit ? { label, message: hit } : null;
    };
    for (const kind of SINGLETON_KINDS) {
      const hit = check(effectiveDoc[kind]?.content ?? '', BLOCK_LABELS[kind]);
      if (hit) return hit;
    }
    const repeatableEntries: Array<[string, Array<{ content?: string }>]> = [
      ['Rules', effectiveDoc.rules],
      ['Examples', effectiveDoc.examples],
      ['Custom', effectiveDoc.custom],
    ];
    for (const [label, list] of repeatableEntries) {
      for (let i = 0; i < list.length; i += 1) {
        const hit = check(list[i]?.content ?? '', `${label} #${i + 1}`);
        if (hit) return hit;
      }
    }
    return null;
  }, [canAuthor, effectiveDoc]);

  const blocked = blockers.length > 0 || secretHit !== null;
  const pending = putPending || saveDraft.isPending || creatingDraft;

  const patchSingleton = useCallback((kind: SingletonKind, patch: Partial<SingletonBlock>) => {
    setDoc((prev) => {
      if (!prev) return prev;
      return { ...prev, [kind]: { ...(prev[kind] ?? blankSingleton()), ...patch } };
    });
  }, []);

  const patchRepeatable = useCallback(
    (kind: RepeatableKind, id: string, patch: { mode?: InstructionMode; content?: string; title?: string }) => {
      setDoc((prev) => {
        if (!prev) return prev;
        if (kind === 'rules') {
          return { ...prev, rules: prev.rules.map((b) => (b.id === id ? { ...b, ...patch } : b)) };
        }
        if (kind === 'examples') {
          return {
            ...prev,
            examples: prev.examples.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          };
        }
        return { ...prev, custom: prev.custom.map((b) => (b.id === id ? { ...b, ...patch } : b)) };
      });
    },
    [],
  );

  /** Re-insert a deleted repeatable block at its original position (undo). */
  const restoreRepeatable = useCallback(
    (kind: RepeatableKind, block: RepeatableBlock, index: number) => {
      setDoc((prev) => {
        if (!prev) return prev;
        if (kind === 'rules') {
          const rules = [...prev.rules];
          rules.splice(Math.min(index, rules.length), 0, block);
          return { ...prev, rules };
        }
        if (kind === 'examples') {
          const examples = [...prev.examples];
          examples.splice(Math.min(index, examples.length), 0, block as ExampleBlock);
          return { ...prev, examples };
        }
        const custom = [...prev.custom];
        custom.splice(Math.min(index, custom.length), 0, block);
        return { ...prev, custom };
      });
    },
    [],
  );

  const removeRepeatable = useCallback(
    (kind: RepeatableKind, id: string) => {
      // I-BUG10: deletes are STAGED — the server document is untouched
      // until the section save (autosave / topbar Save), so the correct
      // protection is reversibility, not a confirm gate. Snapshot the
      // block first; the toast below restores it at its original index.
      // One model for all three deletes (rule / example / custom text) —
      // they all funnel through here.
      const current = docRef.current;
      const list: RepeatableBlock[] = !current
        ? []
        : kind === 'rules'
          ? current.rules
          : kind === 'examples'
            ? current.examples
            : current.custom;
      const index = list.findIndex((b) => b.id === id);
      const removed = index >= 0 ? list[index] : null;
      setDoc((prev) => {
        if (!prev) return prev;
        if (kind === 'rules') return { ...prev, rules: prev.rules.filter((b) => b.id !== id) };
        if (kind === 'examples') return { ...prev, examples: prev.examples.filter((b) => b.id !== id) };
        return { ...prev, custom: prev.custom.filter((b) => b.id !== id) };
      });
      if (!removed) return;
      const label = kind === 'rules' ? 'Rule' : kind === 'examples' ? 'Example' : 'Custom text';
      toast(
        (t) => (
          <UndoToast>
            <span>
              {label} removed — still a draft until you save.
            </span>
            <UndoToastButton
              type="button"
              onClick={() => {
                restoreRepeatable(kind, removed, index);
                toast.dismiss(t.id);
              }}
            >
              Undo
            </UndoToastButton>
          </UndoToast>
        ),
        { duration: 8000 },
      );
    },
    [restoreRepeatable],
  );

  const moveRule = useCallback((id: string, direction: -1 | 1) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const index = prev.rules.findIndex((b) => b.id === id);
      const swap = index + direction;
      if (index < 0 || swap < 0 || swap >= prev.rules.length) return prev;
      const rules = [...prev.rules];
      [rules[index], rules[swap]] = [rules[swap], rules[index]];
      return { ...prev, rules };
    });
  }, []);

  const openSingleton = useCallback(
    (kind: SingletonKind) => {
      const block = docRef.current?.[kind] ?? blankSingleton();
      setEditing({
        target: {
          key: `singleton:${kind}`,
          sectionLabel: 'Instructions',
          title: BLOCK_LABELS[kind],
          jsonKind: 'any',
          block: toModalBlock(block),
          placeholder:
            kind === 'output'
              ? 'Verdict + section cite · max 3 exchanges'
              : kind === 'refusal'
                ? 'Over $500 or off-policy → escalate to a human'
                : 'One breath.',
          cap: INSTRUCTIONS_BLOCK_MAX_LENGTH,
        },
        apply: (saved) => patchSingleton(kind, { mode: saved.block.mode, content: saved.block.content }),
      });
    },
    [patchSingleton],
  );

  const openRepeatableTarget = useCallback(
    (
      kind: RepeatableKind,
      id: string,
      label: string,
      block: { mode: InstructionMode; content: string },
      title?: string,
    ) => {
      setEditing({
        target: {
          key: `${kind}:${id}`,
          sectionLabel: 'Instructions',
          title: label,
          jsonKind: 'any',
          block: toModalBlock(block),
          placeholder:
            kind === 'examples'
              ? 'User: …\nAssistant: …'
              : 'Define what this agent must always do, must never do, or should do under specific conditions.',
          cap: INSTRUCTIONS_BLOCK_MAX_LENGTH,
          ...(kind === 'examples'
            ? { titleField: { value: title ?? '', placeholder: 'Edge case: angry refund request' } }
            : {}),
        },
        apply: (saved) =>
          patchRepeatable(kind, id, {
            mode: saved.block.mode,
            content: saved.block.content,
            ...(saved.title !== undefined ? { title: saved.title } : {}),
          }),
      });
    },
    [patchRepeatable],
  );

  const openRepeatable = useCallback(
    (kind: RepeatableKind, id: string) => {
      const current = docRef.current;
      const list: Array<{ id: string; mode: InstructionMode; content: string }> = !current
        ? []
        : kind === 'rules'
          ? current.rules
          : kind === 'examples'
            ? current.examples
            : current.custom;
      const found = list.find((b) => b.id === id);
      if (!found) return;
      const index = list.indexOf(found);
      const label =
        kind === 'rules'
          ? `Rule ${index + 1}`
          : kind === 'examples'
            ? `Example ${index + 1}`
            : list.length > 1
              ? `Custom text ${index + 1}`
              : 'Custom text';
      openRepeatableTarget(
        kind,
        id,
        label,
        found,
        kind === 'examples' ? (found as ExampleBlock).title ?? '' : undefined,
      );
    },
    [openRepeatableTarget],
  );

  /** Add a repeatable block and open the focused editor on it right away. */
  const addRepeatableAndEdit = useCallback(
    (kind: RepeatableKind) => {
      const made =
        kind === 'examples' ? makeRepeatableBlock('examples', '') : makeRepeatableBlock(kind, '');
      setDoc((prev) => {
        if (!prev) return prev;
        if (kind === 'rules') return { ...prev, rules: [...prev.rules, made as RepeatableBlock] };
        if (kind === 'examples') return { ...prev, examples: [...prev.examples, made as ExampleBlock] };
        return { ...prev, custom: [...prev.custom, made as RepeatableBlock] };
      });
      openRepeatableTarget(
        kind,
        (made as RepeatableBlock).id,
        kind === 'rules' ? 'New rule' : kind === 'examples' ? 'New example' : 'New custom text',
        made as RepeatableBlock,
        kind === 'examples' ? '' : undefined,
      );
    },
    [openRepeatableTarget],
  );

  const appendSampleBlocks = useCallback((incoming: NewInstructionBlock[]) => {
    if (incoming.length === 0) return;
    setDoc((prev) => {
      if (!prev) return prev;
      const next: InstructionsV1 = {
        ...prev,
        rules: [...prev.rules],
        examples: [...prev.examples],
        custom: [...prev.custom],
      };
      for (const b of incoming) {
        if (b.kind === 'examples') next.examples.push(makeRepeatableBlock('examples', b.content, b.mode, b.title));
        else if (b.kind === 'rules') next.rules.push(makeRepeatableBlock('rules', b.content, b.mode));
        else next.custom.push(makeRepeatableBlock('custom', b.content, b.mode));
      }
      return next;
    });
    // The "every save is a version" toast fires on the real save (doSave),
    // never at insert time — insert stays silent so the claim is only
    // ever made after a save.
  }, []);

  const openSamples = useCallback(() => {
    // "Browse examples" explicitly opens the gallery (the root state
    // survives the sub-editor remount — no key-remount needed).
    setSamplesOpen(true);
    window.setTimeout(() => {
      samplesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, []);

  const putInstructions = useCallback(
    (path: string, toSave: InstructionsV1, matchHash: string): Promise<string> =>
      engine<Record<string, unknown>>(path, {
        method: 'PUT',
        body: { instructions: toSave },
        headers: { 'If-Match': matchHash },
        idempotent: true,
      }).then((raw) => (typeof raw.hash === 'string' ? raw.hash : matchHash)),
    [],
  );

  const adoptSaved = useCallback(
    (toSave: InstructionsV1, newHash: string, newVersionId: string | null) => {
      setServerHash(newHash);
      setBaseDoc(toSave);
      setDoc(toSave);
      if (newVersionId) {
        queryClient.setQueryData(
          ['studio', 'assistants', assistantId, 'instructions', newVersionId],
          (old: unknown) => ({
            ...((old as Record<string, unknown> | null) ?? {}),
            instructions: toSave,
            hash: newHash,
          }),
        );
      }
      void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
    },
    [assistantId, queryClient],
  );

  // C-BUG4/M-BUG3 Option A: confirm the section when Save succeeds, so the
  // nav badge grades `ready` even at engine defaults.
  const confirmSection = useSectionConfirmationContext();

  const doSave = useCallback(() => {
    if (!canAuthor || !definition || !effectiveDoc || blocked || conflict || pending) return;
    const toSave = effectiveDoc;

    // Draft-scoped structured write with optimistic concurrency.
    if (isDraft && versionId && serverHash && instructionsPath) {
      setPutPending(true);
      const sentHash = serverHash;
      void putInstructions(instructionsPath, toSave, sentHash)
        .then((newHash) => {
          adoptSaved(toSave, newHash, versionId);
          confirmSection('instructions');
          toast.success('Instructions saved — every save is a version.');
        })
        .catch((error: unknown) => {
          // 412 → merge-or-reload dialog (the hook stays silent on 412 by
          // design). The dialog diffs compiled text against compiled text, so
          // the attempt is compiled server-side here.
          if (error instanceof ApiError && error.status === 412) {
            const details = (error.details ?? {}) as Record<string, unknown>;
            const attemptKey = JSON.stringify(toSave);
            const attemptedPreview =
              preview && !previewStale && previewKeyRef.current === attemptKey ? preview.text : null;
            setConflict({
              expectedHash: sentHash,
              currentHash: typeof details.current === 'string' ? details.current : null,
              attemptedDoc: toSave,
              attemptedPreview,
            });
            if (attemptedPreview === null) {
              const seq = (previewSeqRef.current += 1);
              void engine<Record<string, unknown>>(`${instructionsPath}/preview`, {
                method: 'POST',
                body: { instructions: toSave },
              })
                .then((raw) => {
                  if (previewSeqRef.current !== seq) return;
                  setConflict((c) =>
                    c ? { ...c, attemptedPreview: typeof raw.text === 'string' ? raw.text : '' } : c,
                  );
                })
                .catch(() => {
                  if (previewSeqRef.current === seq) {
                    setConflict((c) => (c ? { ...c, attemptedPreview: '(preview unavailable)' } : c));
                  }
                });
            }
          } else if (error instanceof ApiError) {
            toast.error(error.message);
          } else {
            toast.error('Could not save the instructions.');
          }
        })
        .finally(() => setPutPending(false));
      return;
    }

    // No draft version yet: create the draft, then chain the structured PUT —
    // the user's blocks are never parked in legacy text.
    setCreatingDraft(true);
    const next = buildDraftPayload(definition, { instructions: '' });
    saveDraft.mutate(next, {
      onSuccess: (raw: unknown) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        const v = (r.version ?? {}) as Record<string, unknown>;
        const newId = typeof v.id === 'string' ? v.id : null;
        const newHash = typeof v.hash === 'string' ? v.hash : null;
        if (!newId || !newHash || !orgId) {
          setCreatingDraft(false);
          toast.error('Draft created, but the version reference was unreadable — reload and try again.');
          return;
        }
        const chainedPath = `/console/org/${orgId}/assistants/${assistantId}/versions/${newId}/instructions`;
        void putInstructions(chainedPath, toSave, newHash)
          .then((finalHash) => {
            adoptSaved(toSave, finalHash, newId);
            confirmSection('instructions');
            toast.success('Instructions saved.');
          })
          .catch((error: unknown) => {
            toast.error(
              error instanceof ApiError
                ? error.message
                : 'Draft created, but the instructions did not save — try again.',
            );
          })
          .finally(() => {
            setCreatingDraft(false);
            void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          });
      },
      onError: (error: unknown) => {
        setCreatingDraft(false);
        // A draft appeared between load and save (Room parity): refetch adopts
        // it as the save target — your blocks stay, the next save PUTs to it.
        // (The hook's own toast still fires; guidance follows, never silence.)
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your blocks stay; the next save writes to it.');
        }
      },
    });
  }, [
    canAuthor,
    definition,
    effectiveDoc,
    blocked,
    conflict,
    pending,
    isDraft,
    versionId,
    serverHash,
    instructionsPath,
    putInstructions,
    adoptSaved,
    saveDraft,
    orgId,
    assistantId,
    queryClient,
    preview,
    previewStale,
    confirmSection,
  ]);

  // A2-23: shared autosave — 8s debounce plus an unmount flush so switching
  // sections persists pending edits instead of silently dropping them. There
  // is no parked adopting state in this section: the 409-on-create path keeps
  // the document dirty and the server fetch converges through the dirty guard
  // above, so the parked autosave resumes on its own.
  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive: false, pending, definition },
    doSave,
    [effectiveKey],
  );

  // Manual save (topbar Save button / Ctrl+S / ⌘S): never silent — a held
  // save toasts its reason instead of swallowing the click.
  useManualSaveSignal(saveSignal, doSave, {
    canAuthor,
    blocked,
    conflict,
    pending,
    holdReason: () =>
      secretHit !== null
        ? 'Looks like a pasted credential — secrets are refused at save. Mention it, don’t paste it.'
        : (blockers[0] ?? null),
  });

  // Viewing a published version: editing starts by creating a draft, so the
  // composer always opens on the server-migrated published content — never on
  // a blank document that would silently discard it.
  const createDraftForEdit = useCallback(() => {
    if (!canAuthor || !definition || creatingDraft) return;
    setCreatingDraft(true);
    saveDraft.mutate(buildDraftPayload(definition, { instructions: definition.instructions ?? '' }), {
      onSuccess: () => {
        // The parent refetch flips isDraft/versionId; the structured GET then
        // migrates the inherited text into the composer.
        toast.success('Draft created — editing the latest published instructions.');
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft is already open — resumed it.');
        }
      },
      onSettled: () => setCreatingDraft(false),
    });
  }, [canAuthor, definition, creatingDraft, saveDraft, queryClient]);

  if (!definition) {
    return <SkeletonRows rows={4} />;
  }

  if (!canAuthor || (!isDraft && versionId)) {
    const publishedText = definition.instructions ?? '';
    return (
      <SectionPage
        title="Instructions"
        subtitle="Tell the agent how to behave, decide, and speak."
        pill={
          <ProgressPill>
            <PillDot aria-hidden="true" />
            Read-only
          </ProgressPill>
        }
      >
        <ReadCard>
          {publishedText.trim() === '' ? (
            <ReadText>No instructions yet.</ReadText>
          ) : (
            <ReadText>{publishedText}</ReadText>
          )}
        </ReadCard>
        {canAuthor && !isDraft && versionId && (
          <AddRow>
            <AddButton type="button" onClick={createDraftForEdit} disabled={creatingDraft}>
              <Plus size={13} strokeWidth={2} /> {creatingDraft ? 'Creating draft…' : 'Edit in a new draft'}
            </AddButton>
          </AddRow>
        )}
        <CounterRow>
          <span>
            {publishedText.length.toLocaleString()} / {INSTRUCTIONS_LIMIT.toLocaleString()} chars
          </span>
          <span>~{estimateTokens(publishedText.length).toLocaleString()} tokens (est.)</span>
        </CounterRow>
        <SamplesSection
          assistantId={assistantId}
          canAuthor={false}
          startOpen={false}
          onInsert={() => undefined}
        />
      </SectionPage>
    );
  }

  if (doc === null) {
    return <SkeletonRows rows={4} />;
  }

  // The focused editor replaces the page in place — no modal, no route
  // change; the right rail recedes. Drafts push into the section every 2s,
  // so closing the editor never loses work.
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

  const emptyDoc = isEmptyDocumentV1(doc);
  const rules = doc.rules;
  const examples = doc.examples;
  const customs = doc.custom;

  const singletonDone = SINGLETON_KINDS.map((kind) => (doc[kind]?.content.trim() ?? '') !== '');
  // I-BUG13: the denominator is the FIXED block count (3 singletons + 3
  // repeatable groups), never the current item count — "5 of 5" after
  // deleting the only example was a lie. Groups grade exactly like the
  // rail outline: done when at least one item is non-empty.
  const groupDone = (list: Array<{ content: string }>) => list.some((b) => b.content.trim() !== '');
  const doneBlocks =
    singletonDone.filter(Boolean).length +
    (groupDone(rules) ? 1 : 0) +
    (groupDone(examples) ? 1 : 0) +
    (groupDone(customs) ? 1 : 0);
  const totalBlocks = SINGLETON_KINDS.length + 3;

  const scrollToBlock = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const singletonIcons: Record<SingletonKind, React.ReactNode> = {
    objective: <Target size={16} strokeWidth={1.8} />,
    output: <FileOutput size={16} strokeWidth={1.8} />,
    refusal: <ShieldAlert size={16} strokeWidth={1.8} />,
  };
  const singletonEmptyHints: Record<SingletonKind, string> = {
    objective: 'One breath — what is this agent for?',
    output: 'How should answers be shaped? Verdict + section cite · max 3 exchanges.',
    refusal: 'When should it decline? Over $500 or off-policy → escalate to a human.',
  };

  const compiledTokens = compiledChars !== null ? estimateTokens(compiledChars) : null;

  return (
    <div
      onKeyDown={(event) => {
        // Esc on the page only ever blurs (PLAN.md §5.6) — the editor owns
        // Esc while it is open.
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      <SectionPage
        title="Instructions"
        subtitle="Tell the agent how to behave, decide, and speak."
        progress={{ done: doneBlocks, total: totalBlocks }}
        rail={
          <>
            <PageOutline
              items={[
                { key: 'instr-objective', label: 'Objective', meta: '', done: singletonDone[0] },
                {
                  key: 'instr-rules',
                  label: 'Rules',
                  meta: `${rules.length}`,
                  done: rules.some((b) => b.content.trim() !== ''),
                },
                { key: 'instr-output', label: 'Output', meta: '', done: singletonDone[1] },
                { key: 'instr-refusal', label: 'Refusal', meta: '', done: singletonDone[2] },
                {
                  key: 'instr-examples',
                  label: 'Examples',
                  meta: `${examples.length}`,
                  done: examples.some((b) => b.content.trim() !== ''),
                },
                {
                  key: 'instr-custom',
                  label: 'Custom text',
                  meta: `${customs.length}`,
                  done: customs.some((b) => b.content.trim() !== ''),
                },
              ]}
              onSelect={scrollToBlock}
            />
            <ContextBudget
              total={compiledChars ?? 0}
              limit={INSTRUCTIONS_LIMIT}
              rows={[
                { key: 'compiled', label: 'Compiled prompt', chars: compiledChars ?? 0 },
              ]}
              note={
                compiledChars === null
                  ? 'Compiling…'
                  : `${(INSTRUCTIONS_LIMIT - compiledChars).toLocaleString()} chars of headroom · ~${(compiledTokens ?? 0).toLocaleString()} tokens (est.)${
                      compiledChars > 0 && compiledChars < 500
                        ? ' — short prompts hold shape better; cut a paragraph, re-run evals, keep what scores.'
                        : ''
                    }`
              }
            />
            <MicroTip>2–3 canonical examples beat 10 mediocre ones.</MicroTip>
          </>
        }
      >
        <div id="instr-objective">
          <BlockCard
            title={BLOCK_LABELS.objective}
            helper={BLOCK_HINTS.objective}
            charCount={`${(doc.objective?.content.length ?? 0).toLocaleString()} chars`}
            done={singletonDone[0]}
            empty={!singletonDone[0]}
            emptyTitle="No objective yet"
            emptyHint={singletonEmptyHints.objective}
            emptyIcon={singletonIcons.objective}
            preview={<TextPreview text={doc.objective?.content ?? ''} />}
            caption={modeCaption(doc.objective?.mode ?? 'markdown')}
            onOpen={() => openSingleton('objective')}
          />
        </div>

        <div id="instr-rules">
          <RulesBuilder
            title="Rules"
            helper={BLOCK_HINTS.rules}
            emptyTitle="No rules yet"
            emptyHint="Hard constraints the agent must never break. One rule per line works best."
            rules={rules.map((b) => ({ id: b.id, block: toModalBlock(b) }))}
            countLabel={(n) => `${n} ${n === 1 ? 'rule' : 'rules'}`}
            onAdd={() => addRepeatableAndEdit('rules')}
            onEdit={(id) => openRepeatable('rules', id)}
            onDelete={(id) => removeRepeatable('rules', id)}
            onMove={moveRule}
            onBrowseExamples={openSamples}
          />
        </div>

        <div id="instr-output">
          <BlockCard
            title={BLOCK_LABELS.output}
            helper={BLOCK_HINTS.output}
            charCount={`${(doc.output?.content.length ?? 0).toLocaleString()} chars`}
            done={singletonDone[1]}
            empty={!singletonDone[1]}
            emptyTitle="No output contract yet"
            emptyHint={singletonEmptyHints.output}
            emptyIcon={singletonIcons.output}
            preview={<TextPreview text={doc.output?.content ?? ''} />}
            caption={modeCaption(doc.output?.mode ?? 'markdown')}
            onOpen={() => openSingleton('output')}
          />
        </div>

        <div id="instr-refusal">
          <BlockCard
            title={BLOCK_LABELS.refusal}
            helper={BLOCK_HINTS.refusal}
            charCount={`${(doc.refusal?.content.length ?? 0).toLocaleString()} chars`}
            done={singletonDone[2]}
            empty={!singletonDone[2]}
            emptyTitle="No refusal policy yet"
            emptyHint={singletonEmptyHints.refusal}
            emptyIcon={singletonIcons.refusal}
            preview={<TextPreview text={doc.refusal?.content ?? ''} />}
            caption={modeCaption(doc.refusal?.mode ?? 'markdown')}
            onOpen={() => openSingleton('refusal')}
          />
        </div>

        <div id="instr-examples">
          {examples.map((block, index) => (
            <div key={block.id} id={`instr-example-${block.id}`}>
              <BlockCard
                title={block.title?.trim() ? block.title.trim() : `Example ${index + 1}`}
                helper="A canonical interaction the agent should imitate."
                charCount={`${block.content.length.toLocaleString()} chars`}
                done={block.content.trim() !== ''}
                empty={block.content.trim() === ''}
                emptyTitle="Empty example"
                emptyHint="User: … Assistant: …"
                emptyIcon={<MessagesSquare size={16} strokeWidth={1.8} />}
                headerActions={
                  <IconButton
                    type="button"
                    aria-label={`Remove example ${index + 1}`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      removeRepeatable('examples', block.id);
                    }}
                  >
                    <X size={14} strokeWidth={1.8} />
                  </IconButton>
                }
                preview={<TextPreview text={block.content} mono />}
                caption={modeCaption(block.mode)}
                onOpen={() => openRepeatable('examples', block.id)}
              />
            </div>
          ))}
          {examples.length < MAX_EXAMPLES ? (
            <AddRow>
              <AddButton type="button" onClick={() => addRepeatableAndEdit('examples')}>
                <Plus size={13} strokeWidth={2} /> Add example
              </AddButton>
            </AddRow>
          ) : (
            <AddHint>{MAX_EXAMPLES} examples is plenty — 2–3 canonical beats 10 mediocre.</AddHint>
          )}
        </div>

        <div id="instr-custom">
          {customs.map((block, index) => (
            <div key={block.id} id={`instr-custom-${block.id}`}>
              <BlockCard
                title={customs.length > 1 ? `Custom text ${index + 1}` : 'Custom text'}
                helper={BLOCK_HINTS.custom}
                charCount={`${block.content.length.toLocaleString()} chars`}
                done={block.content.trim() !== ''}
                empty={block.content.trim() === ''}
                emptyTitle="Empty custom block"
                emptyHint="Anything that does not fit above — preserved verbatim."
                emptyIcon={<FileText size={16} strokeWidth={1.8} />}
                headerActions={
                  <IconButton
                    type="button"
                    aria-label={`Delete custom text ${index + 1}`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      removeRepeatable('custom', block.id);
                    }}
                  >
                    <X size={14} strokeWidth={1.8} />
                  </IconButton>
                }
                preview={<TextPreview text={block.content} />}
                caption={modeCaption(block.mode)}
                onOpen={() => openRepeatable('custom', block.id)}
              />
            </div>
          ))}
          <AddRow>
            <AddButton type="button" onClick={() => addRepeatableAndEdit('custom')}>
              <Plus size={13} strokeWidth={2} /> Add custom text
            </AddButton>
          </AddRow>
        </div>

        <div id="instr-compiled">
          <CompiledCard>
            <CompiledHead>
              <CompiledTitle>Compiled prompt</CompiledTitle>
              {preview && !previewStale && (
                <CompiledMeta>
                  compiler {preview.compiler_version || 'unknown'} · hash {preview.hash.slice(0, 12)}
                </CompiledMeta>
              )}
            </CompiledHead>
            <CompiledHelper>Server-compiled — exactly what the model receives.</CompiledHelper>
            {preview === null || previewStale ? (
              <CompiledEmpty>Compiling preview…</CompiledEmpty>
            ) : preview.text.trim() === '' ? (
              <CompiledEmpty>No instructions yet — compose or use a sample below.</CompiledEmpty>
            ) : (
              <CompiledText>{preview.text}</CompiledText>
            )}
          </CompiledCard>
        </div>

        {secretHit && (
          <Whisper $tone="amber" role="alert">
            Looks like a pasted credential in {secretHit.label} (
            {secretHit.message.replace(/^instructions:\s*/, '')}) — secrets are refused at save. Mention it, don’t
            paste it.
          </Whisper>
        )}
        {blockers.map((message) => (
          <Whisper key={message} $tone="red" role="alert">
            {message} Autosave held — fix it and saving resumes on its own.
          </Whisper>
        ))}

        <div ref={samplesRef}>
          <SamplesSection
            assistantId={assistantId}
            canAuthor
            startOpen={emptyDoc}
            open={samplesOpen ?? emptyDoc}
            onOpenChange={setSamplesOpen}
            onInsert={appendSampleBlocks}
          />
        </div>
      </SectionPage>

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attemptedPreview ?? 'Compiling your attempt for comparison…'}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          selectTheirs={(live) => live.instructions ?? ''}
          onReloadTheirs={(theirs) => {
            // Adopt theirs wholesale + refetch so props converge: the parked
            // autosave resumes only once the document IS theirs (dirty gate).
            void (async () => {
              try {
                const raw = await engine<Record<string, unknown>>(
                  `/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/instructions`,
                );
                const incoming = ensureSingletonsV1(
                  (raw.instructions as InstructionsV1 | null) ?? blankInstructionsV1(),
                );
                setDoc(incoming);
                setBaseDoc(incoming);
                if (typeof raw.hash === 'string') setServerHash(raw.hash);
              } catch (err) {
                // The live fetch failed: keep the user's structured document
                // exactly as it is — it is still dirty, so the adoption guard
                // will not overwrite it — and let the invalidated refetch
                // below refresh the If-Match hash for a retry.
                if (theirs.trim() !== '') {
                  toast.error(
                    err instanceof ApiError ? err.message : 'Could not reload their version — try again.',
                  );
                }
              } finally {
                setConflict(null);
                void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
                toast('Reloaded their version — review it, then keep editing or close.');
              }
            })();
          }}
          onSaveMine={(freshHash) => {
            if (!instructionsPath) return;
            setPutPending(true);
            void putInstructions(instructionsPath, conflict.attemptedDoc, freshHash)
              .then((newHash) => {
                adoptSaved(conflict.attemptedDoc, newHash, versionId);
                toast.success('Saved over the latest version');
                setConflict(null);
              })
              .catch((error: unknown) => {
                if (error instanceof ApiError && error.status === 412) {
                  const details = (error.details ?? {}) as Record<string, unknown>;
                  setConflict({
                    expectedHash: freshHash,
                    currentHash: typeof details.current === 'string' ? details.current : conflict.currentHash,
                    attemptedDoc: conflict.attemptedDoc,
                    attemptedPreview: conflict.attemptedPreview,
                  });
                } else {
                  toast.error(error instanceof ApiError ? error.message : 'Could not save.');
                  setConflict(null);
                }
              })
              .finally(() => setPutPending(false));
          }}
          onClose={() => setConflict(null)}
        />
      )}
    </div>
  );
}
