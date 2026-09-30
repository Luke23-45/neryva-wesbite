import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Segmented } from '@components/common/ui/Segmented';
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
  INSTRUCTIONS_LIMIT,
  isEmptyDocumentV1,
  jsonBlockError,
  makeRepeatableBlock,
  normalizeDocumentForSave,
  REPEATABLE_KINDS,
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
import { ConflictDialog } from './ConflictDialog';
import { SamplesSection } from './SamplesSection';
import { MarkdownText } from '../../chat/ChatMessages/MarkdownText';
import {
  AddButton,
  AddHint,
  AddRow,
  BlockCard,
  BlockCount,
  BlockGroup,
  BlockHeader,
  BlockNumber,
  BlockSub,
  BlockTitle,
  BudgetBar,
  BudgetFill,
  CounterRow,
  CustomCard,
  EmptyState,
  Goldilocks,
  IconButton,
  PreviewBlock,
  PreviewCard,
  PreviewHeader,
  PreviewText,
  RuleInputWrap,
  RuleList,
  RuleRow,
  Whisper,
  Wrap,
} from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';

/**
 * Research ceiling (PLAN.md §5.1): 2–3 canonical examples beat 10 mediocre
 * ones. The cap states its reason inline instead of silently refusing.
 */
const MAX_EXAMPLES = 6;

/** Server preview debounce — one compile request per pause in typing. */
const PREVIEW_DEBOUNCE_MS = 600;

const MODE_OPTIONS = [
  { value: 'raw', label: 'Raw' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
] as const;

const WRITE_PREVIEW_OPTIONS = [
  { value: 'write', label: 'Write' },
  { value: 'preview', label: 'Preview' },
] as const;

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

/**
 * Structured Instructions composer — blocks over the version-scoped
 * Instructions v1 document. The browser never compiles: the Compose tab edits
 * the document, the Preview tab shows the server-compiled prompt, and the JSON
 * tab edits the exact payload the server validates. Saves PUT the document
 * with If-Match; the 412 merge-or-reload dialog is preserved (Room copy
 * skeleton).
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
  const [tab, setTab] = useState<'compose' | 'preview' | 'json'>('compose');
  const [preview, setPreview] = useState<ServerPreview | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [putPending, setPutPending] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  // Per-block markdown Write/Preview toggle (markdown blocks only). Keyed by
  // block id for repeatables, `singleton:<kind>` for singletons.
  const [mdPreview, setMdPreview] = useState<Record<string, boolean>>({});
  const fieldRefs = useRef(new Map<string, HTMLElement>());
  const jsonKeyRef = useRef('');
  const jsonEditedRef = useRef(false);
  const previewSeqRef = useRef(0);
  const previewKeyRef = useRef('');

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
  // Dirty covers both editing surfaces. Compose edits change the document;
  // JSON-tab edits are tracked via the ref until they are applied to the
  // document (leaving the tab) or saved. Every mutation of jsonEditedRef is
  // paired with a setState, so this recomputes on the same render.
  const dirty =
    (doc !== null && baseDoc !== null && docKey !== baseKey) || jsonEditedRef.current;

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
      setJsonText('');
      jsonKeyRef.current = '';
      jsonEditedRef.current = false;
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

  // The JSON tab edits the exact payload the server validates. Parsed lazily
  // so blockers and the manual-save hold reason can name JSON problems.
  const jsonParsed = useMemo(() => {
    if (tab !== 'json') return null;
    try {
      return { ok: true as const, doc: JSON.parse(jsonText) as InstructionsV1 };
    } catch {
      return { ok: false as const, doc: null as InstructionsV1 | null };
    }
  }, [tab, jsonText]);

  // What the next save (and the server preview) measures: the normalized
  // document, never the raw editor state.
  const effectiveDoc = useMemo(() => {
    if (tab === 'json') {
      if (!jsonParsed || !jsonParsed.ok || !jsonParsed.doc) return null;
      return normalizeDocumentForSave(jsonParsed.doc);
    }
    return doc ? normalizeDocumentForSave(doc) : null;
  }, [tab, jsonParsed, doc]);
  const effectiveKey = effectiveDoc ? JSON.stringify(effectiveDoc) : '';

  // Server preview — the ONLY compilation. Debounced per pause in typing, so
  // the Preview tab, the budget bar, and the over-limit hold all measure the
  // same server-produced text the model will receive.
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

  // Entering the JSON tab serializes the current document; the user's JSON
  // edits survive tab switches until the document itself changes or a save
  // lands.
  useEffect(() => {
    if (tab !== 'json' || !doc) return;
    if (!jsonEditedRef.current && jsonKeyRef.current !== docKey) {
      setJsonText(JSON.stringify(normalizeDocumentForSave(doc), null, 2));
      jsonKeyRef.current = docKey;
    }
  }, [tab, doc, docKey]);

  // Leaving the JSON tab with valid user edits applies them to the document —
  // Compose, Preview, and the budget then all measure the same JSON the user
  // wrote. Invalid JSON stays in the tab (the hold banner names the problem)
  // for the user to fix; it is never silently discarded or reinterpreted.
  const prevTabRef = useRef(tab);
  useEffect(() => {
    const prev = prevTabRef.current;
    prevTabRef.current = tab;
    if (prev !== 'json' || tab === 'json' || !jsonEditedRef.current || !doc) return;
    let parsed: InstructionsV1;
    try {
      parsed = JSON.parse(jsonText) as InstructionsV1;
    } catch {
      return;
    }
    const adopted = ensureSingletonsV1(normalizeDocumentForSave(parsed));
    jsonEditedRef.current = false;
    jsonKeyRef.current = '';
    // Skip the state churn when the JSON already matches the document.
    if (JSON.stringify(normalizeDocumentForSave(doc)) !== JSON.stringify(adopted)) {
      setDoc(adopted);
    }
  }, [tab, jsonText, doc]);

  const previewStale = effectiveKey !== '' && previewKeyRef.current !== effectiveKey;
  const compiledChars = preview && !previewStale ? preview.text.length : null;
  const overLimit = compiledChars !== null && compiledChars > INSTRUCTIONS_LIMIT;

  const blockers = useMemo(() => {
    const messages: string[] = [];
    if (tab === 'json') {
      if (!jsonParsed || !jsonParsed.ok) {
        messages.push('Fix the JSON — it does not parse yet.');
        return messages;
      }
    }
    if (effectiveDoc) messages.push(...clientSaveBlockers(effectiveDoc));
    if (overLimit && compiledChars !== null) {
      messages.push(
        `${(compiledChars - INSTRUCTIONS_LIMIT).toLocaleString()} over the ${INSTRUCTIONS_LIMIT.toLocaleString()} cap — trim to save.`,
      );
    }
    return messages;
  }, [tab, jsonParsed, effectiveDoc, overLimit, compiledChars]);

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
    for (const kind of REPEATABLE_KINDS) {
      const list = effectiveDoc[kind] ?? [];
      for (let i = 0; i < list.length; i += 1) {
        const hit = check(list[i]?.content ?? '', `${BLOCK_LABELS[kind]} #${i + 1}`);
        if (hit) return hit;
      }
    }
    return null;
  }, [canAuthor, effectiveDoc]);

  const blocked = blockers.length > 0 || secretHit !== null;
  const pending = putPending || saveDraft.isPending || creatingDraft;

  const registerField = (key: string) => (element: HTMLElement | null) => {
    if (element) fieldRefs.current.set(key, element);
    else fieldRefs.current.delete(key);
  };

  const focusBlock = useCallback((key: string) => {
    setTab('compose');
    window.setTimeout(() => {
      fieldRefs.current.get(key)?.focus();
    }, 0);
  }, []);

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

  const removeRepeatable = useCallback((kind: RepeatableKind, id: string) => {
    setDoc((prev) => {
      if (!prev) return prev;
      if (kind === 'rules') return { ...prev, rules: prev.rules.filter((b) => b.id !== id) };
      if (kind === 'examples') return { ...prev, examples: prev.examples.filter((b) => b.id !== id) };
      return { ...prev, custom: prev.custom.filter((b) => b.id !== id) };
    });
  }, []);

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

  const addRepeatable = useCallback((kind: RepeatableKind) => {
    const made =
      kind === 'examples' ? makeRepeatableBlock('examples', '') : makeRepeatableBlock(kind, '');
    setDoc((prev) => {
      if (!prev) return prev;
      if (kind === 'rules') return { ...prev, rules: [...prev.rules, made as RepeatableBlock] };
      if (kind === 'examples') return { ...prev, examples: [...prev.examples, made as ExampleBlock] };
      return { ...prev, custom: [...prev.custom, made as RepeatableBlock] };
    });
    window.setTimeout(() => {
      fieldRefs.current.get(kind === 'examples' ? (made as ExampleBlock).id : (made as RepeatableBlock).id)?.focus();
    }, 0);
  }, []);

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
    // The toast lives in SamplesSection.insert — one surface, never two.
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
      setJsonText('');
      jsonKeyRef.current = '';
      jsonEditedRef.current = false;
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
  ]);

  // A2-23: shared autosave — 8s debounce plus an unmount flush so switching
  // sections persists pending edits instead of silently dropping them. There
  // is no parked adopting state in this section: the 409-on-create path keeps
  // the document dirty and the server fetch converges through the dirty guard
  // above, so the parked autosave resumes on its own.
  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive: false, pending, definition },
    doSave,
    // effectiveKey covers both surfaces: Compose edits and JSON-tab edits
    // each restart the debounce, so typing in either tab delays the save.
    [effectiveKey],
  );

  // Manual save (topbar Save button / Ctrl+S / ⌘S): never silent — a held
  // save toasts its reason instead of swallowing the click.
  useManualSaveSignal(saveSignal, doSave, {
    canAuthor,
    blocked,
    conflict,
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
    return (
      <Wrap>
        <SkeletonRows rows={4} />
      </Wrap>
    );
  }

  if (!canAuthor || (!isDraft && versionId)) {
    const publishedText = definition.instructions ?? '';
    return (
      <Wrap>
        <PreviewCard>
          {publishedText.trim() === '' ? (
            <EmptyState>No instructions yet.</EmptyState>
          ) : (
            <PreviewText>{publishedText}</PreviewText>
          )}
        </PreviewCard>
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
      </Wrap>
    );
  }

  if (doc === null) {
    return (
      <Wrap>
        <SkeletonRows rows={4} />
      </Wrap>
    );
  }

  const emptyDoc = isEmptyDocumentV1(doc);
  const rules = doc.rules;
  const examples = doc.examples;
  const customs = doc.custom;
  const previewChars = compiledChars ?? 0;
  const ratio = previewChars / INSTRUCTIONS_LIMIT;
  const blockLabel = (kind: string): string =>
    (BLOCK_LABELS as Record<string, string>)[kind] ?? kind;

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
          { value: 'json', label: 'JSON' },
        ]}
        value={tab}
        onChange={setTab}
        size="sm"
        ariaLabel="Instructions editing mode"
      />

      {tab === 'preview' && (
        <PreviewCard>
          {preview === null || previewStale ? (
            <EmptyState>Compiling preview…</EmptyState>
          ) : preview.text.trim() === '' ? (
            <EmptyState>No instructions yet — compose or use a sample below.</EmptyState>
          ) : (
            <>
              {preview.blocks
                .filter((b) => !b.empty)
                .map((b) => {
                  const key = b.block_id ?? `singleton:${b.kind}`;
                  return (
                    <PreviewBlock
                      key={key}
                      type="button"
                      onClick={() => focusBlock(key)}
                      title="Jump to this block"
                    >
                      <PreviewHeader>
                        {b.title ? `${blockLabel(b.kind)} — ${b.title}` : blockLabel(b.kind)}
                      </PreviewHeader>
                    </PreviewBlock>
                  );
                })}
              <PreviewText>{preview.text}</PreviewText>
              <CounterRow>
                <span>compiler {preview.compiler_version || 'unknown'}</span>
                <span>hash {preview.hash.slice(0, 12)}</span>
              </CounterRow>
            </>
          )}
        </PreviewCard>
      )}

      {tab === 'json' && (
        <>
          <TextArea
            id="instructions-json-text"
            label="Structured document — exactly what the server validates on save"
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              jsonEditedRef.current = true;
            }}
            rows={20}
            spellCheck={false}
          />
          <AddRow>
            <AddButton
              type="button"
              onClick={() => {
                setJsonText(JSON.stringify(normalizeDocumentForSave(doc), null, 2));
                jsonKeyRef.current = docKey;
                jsonEditedRef.current = false;
              }}
            >
              Reset to composer
            </AddButton>
          </AddRow>
        </>
      )}

      {tab === 'compose' && (
        <>
          {SINGLETON_KINDS.map((kind, index) => {
            const block = doc[kind] ?? blankSingleton();
            const key = `singleton:${kind}`;
            const showMdPreview = block.mode === 'markdown' && mdPreview[key] === true;
            const jsonErr = block.mode === 'json' ? jsonBlockError(block.content) : null;
            return (
              <BlockGroup key={kind}>
                <BlockHeader>
                  <BlockNumber aria-hidden="true">{index + 1}</BlockNumber>
                  <BlockTitle>
                    {BLOCK_LABELS[kind]} <BlockSub>{BLOCK_HINTS[kind]}</BlockSub>
                  </BlockTitle>
                  <BlockCount>{block.content.length.toLocaleString()} chars</BlockCount>
                </BlockHeader>
                <BlockCard>
                  <AddRow>
                    <Segmented
                      options={MODE_OPTIONS}
                      value={block.mode}
                      onChange={(mode: InstructionMode) => patchSingleton(kind, { mode })}
                      size="sm"
                      ariaLabel={`${BLOCK_LABELS[kind]} format`}
                    />
                    {block.mode === 'markdown' && (
                      <Segmented
                        options={WRITE_PREVIEW_OPTIONS}
                        value={showMdPreview ? 'preview' : 'write'}
                        onChange={(v: 'write' | 'preview') =>
                          setMdPreview((prev) => ({ ...prev, [key]: v === 'preview' }))
                        }
                        size="sm"
                        ariaLabel={`${BLOCK_LABELS[kind]} view`}
                      />
                    )}
                  </AddRow>
                  {showMdPreview ? (
                    <MarkdownText text={block.content} />
                  ) : (
                    <TextArea
                      ref={registerField(key)}
                      label={undefined}
                      aria-label={BLOCK_LABELS[kind]}
                      value={block.content}
                      onChange={(event) => patchSingleton(kind, { content: event.target.value })}
                      rows={kind === 'role' ? 3 : 2}
                      placeholder={
                        kind === 'role'
                          ? 'You are…'
                          : kind === 'output'
                            ? 'Verdict + section cite · max 3 exchanges'
                            : kind === 'refusal'
                              ? 'Over $500 or off-policy → escalate to a human'
                              : 'One breath.'
                      }
                    />
                  )}
                  {jsonErr && (
                    <Whisper $tone="amber" role="alert">
                      Not valid JSON — the server will refuse this block on save.{' '}
                      <AddButton
                        type="button"
                        onClick={() => patchSingleton(kind, { content: JSON.stringify(block.content) })}
                      >
                        Wrap as JSON string
                      </AddButton>
                    </Whisper>
                  )}
                </BlockCard>
              </BlockGroup>
            );
          })}

          <BlockGroup>
            <BlockHeader>
              <BlockTitle>
                Rules <BlockSub>{BLOCK_HINTS.rules}</BlockSub>
              </BlockTitle>
              <BlockCount>
                {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
              </BlockCount>
            </BlockHeader>
            <RuleList>
              {rules.map((block, index) => (
                <RuleRow key={block.id} data-rule-row={block.id}>
                  <IconButton
                    type="button"
                    aria-label={`Move rule ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveRule(block.id, -1)}
                  >
                    <ChevronUp size={14} strokeWidth={1.8} />
                  </IconButton>
                  <IconButton
                    type="button"
                    aria-label={`Move rule ${index + 1} down`}
                    disabled={index === rules.length - 1}
                    onClick={() => moveRule(block.id, 1)}
                  >
                    <ChevronDown size={14} strokeWidth={1.8} />
                  </IconButton>
                  <RuleInputWrap>
                    <TextInput
                      ref={registerField(block.id)}
                      aria-label={`Rule ${index + 1}`}
                      value={block.content}
                      onChange={(event) => patchRepeatable('rules', block.id, { content: event.target.value })}
                      placeholder="Define what this agent must always do, must never do, or should do under specific conditions."
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addRepeatable('rules');
                        }
                      }}
                    />
                  </RuleInputWrap>
                  <Segmented
                    options={MODE_OPTIONS}
                    value={block.mode}
                    onChange={(mode: InstructionMode) => patchRepeatable('rules', block.id, { mode })}
                    size="sm"
                    ariaLabel={`Rule ${index + 1} format`}
                  />
                  <IconButton type="button" aria-label={`Delete rule ${index + 1}`} onClick={() => removeRepeatable('rules', block.id)}>
                    <X size={14} strokeWidth={1.8} />
                  </IconButton>
                </RuleRow>
              ))}
            </RuleList>
            {rules.length === 0 && (
              <EmptyState>No rules yet — one rule per line works best.</EmptyState>
            )}
            <AddRow>
              <AddButton type="button" onClick={() => addRepeatable('rules')}>
                <Plus size={13} strokeWidth={2} /> Add rule
              </AddButton>
              <AddButton type="button" onClick={() => addRepeatable('custom')}>
                <Plus size={13} strokeWidth={2} /> Add custom text
              </AddButton>
              {examples.length < MAX_EXAMPLES ? (
                <AddButton type="button" onClick={() => addRepeatable('examples')}>
                  <Plus size={13} strokeWidth={2} /> Add example
                </AddButton>
              ) : (
                <AddHint>
                  {MAX_EXAMPLES} examples is plenty — 2–3 canonical beats 10 mediocre.
                </AddHint>
              )}
            </AddRow>
          </BlockGroup>

          {examples.map((block, index) => {
            const key = block.id;
            const showMdPreview = block.mode === 'markdown' && mdPreview[key] === true;
            const jsonErr = block.mode === 'json' ? jsonBlockError(block.content) : null;
            return (
              <BlockGroup key={block.id}>
                <BlockHeader>
                  <BlockTitle>Example {index + 1}</BlockTitle>
                  <BlockCount>
                    <AddButton type="button" onClick={() => removeRepeatable('examples', block.id)}>
                      Remove
                    </AddButton>
                  </BlockCount>
                </BlockHeader>
                <BlockCard>
                  <TextInput
                    aria-label={`Example ${index + 1} title`}
                    value={block.title ?? ''}
                    onChange={(event) => patchRepeatable('examples', block.id, { title: event.target.value })}
                    placeholder="Edge case: angry refund request"
                  />
                  <AddRow>
                    <Segmented
                      options={MODE_OPTIONS}
                      value={block.mode}
                      onChange={(mode: InstructionMode) => patchRepeatable('examples', block.id, { mode })}
                      size="sm"
                      ariaLabel={`Example ${index + 1} format`}
                    />
                    {block.mode === 'markdown' && (
                      <Segmented
                        options={WRITE_PREVIEW_OPTIONS}
                        value={showMdPreview ? 'preview' : 'write'}
                        onChange={(v: 'write' | 'preview') =>
                          setMdPreview((prev) => ({ ...prev, [key]: v === 'preview' }))
                        }
                        size="sm"
                        ariaLabel={`Example ${index + 1} view`}
                      />
                    )}
                  </AddRow>
                  {showMdPreview ? (
                    <MarkdownText text={block.content} />
                  ) : (
                    <TextArea
                      ref={registerField(key)}
                      aria-label={`Example ${index + 1} body`}
                      value={block.content}
                      onChange={(event) => patchRepeatable('examples', block.id, { content: event.target.value })}
                      rows={3}
                      placeholder={'User: …\nAssistant: …'}
                    />
                  )}
                  {jsonErr && (
                    <Whisper $tone="amber" role="alert">
                      Not valid JSON — the server will refuse this block on save.{' '}
                      <AddButton
                        type="button"
                        onClick={() => patchRepeatable('examples', block.id, { content: JSON.stringify(block.content) })}
                      >
                        Wrap as JSON string
                      </AddButton>
                    </Whisper>
                  )}
                </BlockCard>
              </BlockGroup>
            );
          })}

          {customs.map((block, index) => {
            const key = block.id;
            const showMdPreview = block.mode === 'markdown' && mdPreview[key] === true;
            const jsonErr = block.mode === 'json' ? jsonBlockError(block.content) : null;
            return (
              <BlockGroup key={block.id}>
                <BlockHeader>
                  <BlockTitle>
                    Custom text <BlockSub>{BLOCK_HINTS.custom}</BlockSub>
                  </BlockTitle>
                  <BlockCount>
                    <AddButton type="button" onClick={() => removeRepeatable('custom', block.id)}>
                      Delete
                    </AddButton>
                  </BlockCount>
                </BlockHeader>
                <CustomCard>
                  <AddRow>
                    <Segmented
                      options={MODE_OPTIONS}
                      value={block.mode}
                      onChange={(mode: InstructionMode) => patchRepeatable('custom', block.id, { mode })}
                      size="sm"
                      ariaLabel={`Custom text ${index + 1} format`}
                    />
                    {block.mode === 'markdown' && (
                      <Segmented
                        options={WRITE_PREVIEW_OPTIONS}
                        value={showMdPreview ? 'preview' : 'write'}
                        onChange={(v: 'write' | 'preview') =>
                          setMdPreview((prev) => ({ ...prev, [key]: v === 'preview' }))
                        }
                        size="sm"
                        ariaLabel={`Custom text ${index + 1} view`}
                      />
                    )}
                  </AddRow>
                  {showMdPreview ? (
                    <MarkdownText text={block.content} />
                  ) : (
                    <TextArea
                      ref={registerField(key)}
                      aria-label="Custom text (preserved verbatim)"
                      value={block.content}
                      onChange={(event) => patchRepeatable('custom', block.id, { content: event.target.value })}
                      rows={6}
                    />
                  )}
                  {jsonErr && (
                    <Whisper $tone="amber" role="alert">
                      Not valid JSON — the server will refuse this block on save.{' '}
                      <AddButton
                        type="button"
                        onClick={() => patchRepeatable('custom', block.id, { content: JSON.stringify(block.content) })}
                      >
                        Wrap as JSON string
                      </AddButton>
                    </Whisper>
                  )}
                </CustomCard>
              </BlockGroup>
            );
          })}

          {emptyDoc && (
            <EmptyState>
              Fastest start: use a sample below — appends as blocks, nothing overwritten.
            </EmptyState>
          )}
        </>
      )}

      {secretHit && (
        <Whisper $tone="amber" role="alert">
          Looks like a pasted credential in {secretHit.label} ({secretHit.message.replace(/^instructions:\s*/, '')}) —
          secrets are refused at save. Mention it, don’t paste it.
        </Whisper>
      )}
      {blockers.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      <SamplesSection
        assistantId={assistantId}
        canAuthor
        startOpen={emptyDoc}
        onInsert={appendSampleBlocks}
      />

      <div>
        <CounterRow>
          <span>
            {compiledChars === null ? (
              'Measuring…'
            ) : (
              <>
                {compiledChars.toLocaleString()} / {INSTRUCTIONS_LIMIT.toLocaleString()} chars
              </>
            )}
          </span>
          <span>
            {compiledChars === null
              ? 'server preview pending'
              : `~${estimateTokens(compiledChars).toLocaleString()} tokens (est.) · server-measured`}
          </span>
        </CounterRow>
        <BudgetBar>
          <BudgetFill $ratio={ratio} />
        </BudgetBar>
        {compiledChars !== null && compiledChars < 500 && compiledChars > 0 && (
          <Goldilocks>
            Short prompts hold shape better — cut a paragraph, re-run evals, keep what scores.
          </Goldilocks>
        )}
      </div>

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
                setJsonText('');
                jsonKeyRef.current = '';
                jsonEditedRef.current = false;
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
    </Wrap>
  );
}
