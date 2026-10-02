import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Segmented } from '@components/common/ui/Segmented';
import { pageItem } from '@styles/motion';
import { useCreateMemory, useUpdateMemory } from '@hooks/studio/useSetupKnowledge';
import { MEMORY_CONTENT_MAX } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from '../SectionBackRow';
import { MemoryContentEditor, type MemoryContentMode } from './MemoryContentEditor';

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const MEMORY_LIST_PATH = '/agent-studio/memory';

export interface MemoryComposerInitial {
  id: string;
  content: string;
}

/**
 * New / edit memory form — dedicated section replacing the composer modal
 * from the Memory library page. Form-identical to the modal:
 *
 * - New: organization/user scope picker (the engine coerces anything else to
 *   organization, so nothing else is offered), 8192-char cap with counter
 *   (the engine truncates past the cap, after PII redaction).
 * - Edit (A4-20): PATCHes the row's content only — scope, TTL and provenance
 *   are not editable and the picker is hidden with the reason stated, not
 *   silently dropped.
 *
 * A route mount is fresh by construction, so the modal's keyed-remount
 * freshness trick is unnecessary; edit sections additionally key on the
 * memory id.
 */
export function MemoryComposerForm({
  mode,
  initial,
  backTo,
  backLabel,
  successTo,
}: {
  mode: 'new' | 'edit';
  initial: MemoryComposerInitial | null;
  backTo: string;
  backLabel: string;
  successTo: string;
}) {
  const navigate = useNavigate();
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();
  const editing = mode === 'edit' ? initial : null;

  const [content, setContent] = useState(editing?.content ?? '');
  const [contentMode, setContentMode] = useState<MemoryContentMode>('raw');
  const [contentValid, setContentValid] = useState(true);
  const [scopeType, setScopeType] = useState<'organization' | 'user'>('organization');
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const trimmed = content.trim();
  const overCap = content.length > MEMORY_CONTENT_MAX;
  const valid = trimmed !== '' && !overCap && contentValid;
  const saving = createMemory.isPending || updateMemory.isPending;

  // Dirty guard: block navigation while the form has unsent content.
  // The submitted flag releases the guard on the success navigation: after
  // a saved memory there is nothing unsaved, so the post-submit landing
  // must not trip the leave dialog.
  const [submitted, setSubmitted] = useState(false);
  const dirty =
    !submitted &&
    (editing
      ? content !== editing.content || contentMode !== 'raw'
      : trimmed !== '' || contentMode !== 'raw');
  const { dialog: dirtyDialog } = useDirtyGuard(
    dirty,
    'You have an unsaved memory. Leaving now discards it.',
  );

  /** Resolve the storable text: JSON mode stores the parsed string, not the quotes. */
  const storableContent = (): string => {
    if (contentMode === 'json') {
      try {
        const parsed: unknown = JSON.parse(content);
        if (typeof parsed === 'string') return parsed.trim().slice(0, MEMORY_CONTENT_MAX);
      } catch {
        // Invalid JSON — save is blocked by `valid`, this is a fallback.
      }
    }
    return trimmed.slice(0, MEMORY_CONTENT_MAX);
  };

  const save = () => {
    if (!valid || saving) {
      return;
    }
    // Commit-time disarm: the memory is handed to the engine here, so the
    // async success navigation must not trip the leave dialog. Re-armed on
    // failure so a failed save keeps protecting the draft.
    setSubmitted(true);
    const finalContent = storableContent();
    if (editing) {
      updateMemory.mutate(
        { memoryId: editing.id, content: finalContent },
        {
          onSuccess: () => {
            navigate({ to: successTo });
          },
          onError: () => setSubmitted(false),
        },
      );
    } else {
      createMemory.mutate(
        { content: finalContent, scopeType },
        {
          onSuccess: () => {
            navigate({ to: successTo });
          },
          onError: () => setSubmitted(false),
        },
      );
    }
  };

  const title = editing ? 'Edit memory' : 'New memory';

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to={backTo}>
        <span aria-hidden="true">‹</span> {backLabel}
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>{title}</ViewTitle>
          <ViewSubtitle>
            {editing
              ? 'Correct the stored content — re-scrubbed, re-embedded, and audited.'
              : 'What your agents should remember — scrubbed then embedded, TTL-defaulted, and audited.'}
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title={title} subtitle="Memory content, plus scope for new memories.">
          <MemoryContentEditor
            value={content}
            mode={contentMode}
            onChange={setContent}
            onModeChange={setContentMode}
            onValidChange={setContentValid}
            placeholder="The org ships on Fridays; freeze Thursdays…"
          />
          <p style={{ fontSize: 12, opacity: 0.75 }}>
            {/* M2 (console field audit): the engine truncates at 8192 AFTER PII
                scrubbing (`memory.service` scrubs → slices the scrubbed text), so
                redaction markers can shift the final boundary a few characters
                from this pre-scrub count. Say so — the old copy implied this
                counter was the exact cut point. */}
            {content.length.toLocaleString()} / {MEMORY_CONTENT_MAX.toLocaleString()} — the engine truncates past the
            cap. The cap applies after PII redaction, so the stored text can land a few characters short of this count.
          </p>
          {editing ? (
            <p style={{ fontSize: 12, opacity: 0.75 }}>
              Scope and TTL are not editable — this only corrects the content. The entry is re-scrubbed,
              re-embedded, and the change is audited.
            </p>
          ) : (
            <>
              <div style={{ marginTop: 8 }}>
                <Segmented
                  options={[
                    { value: 'organization' as const, label: 'Organization' },
                    { value: 'user' as const, label: 'User' },
                  ]}
                  value={scopeType}
                  onChange={setScopeType}
                  size="sm"
                  ariaLabel="New memory scope"
                />
              </div>
              <p style={{ fontSize: 12, opacity: 0.75 }}>
                {scopeType === 'user'
                  ? 'User memories resolve per account at run time — visible only to that account.'
                  : 'Organization memories are retrievable by every run in the org.'}{' '}
                Writes are scrubbed then embedded, TTL-defaulted, and audited.
              </p>
            </>
          )}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: backTo })}>
              Cancel
            </ActionButton>
            <ActionButton size="sm" disabled={!valid || saving} onClick={save}>
              {editing ? 'Save changes' : 'Save memory'}
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}

export { MEMORY_LIST_PATH };
