import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { Modal } from '@components/common/ui/Modal';
import { pageItem } from '@styles/motion';
import { useConversations } from '@hooks/studio/useStudioConversations';
import { useRequestExport } from '@hooks/studio/useLifecycle';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { Copy, CapsCopy, ActionsRow } from './section-styles';

const PickerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 280px;
  overflow-y: auto;
`;

const PickerRow = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $checked }) => ($checked ? 'rgba(139,143,248,0.10)' : 'transparent')};
`;

const PickerTitle = styled.span`
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PickerDate = styled.span`
  font-size: 11px;
  opacity: 0.5;
`;

const EmptyCopy = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.6;
`;

const TokenCell = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  word-break: break-all;
  user-select: all;
`;

/**
 * DSR export cap — the engine builds the manifest from at most this many
 * conversation IDs (buildHoldBody's sibling: parseExportRequest / the
 * engine's conversation_ids cap). Kept as the single source of truth for
 * the picker's selection ceiling, byte-identical to the dialog era.
 */
export const MAX_EXPORT_CONVERSATIONS = 20;

/**
 * Request a data export — dedicated section replacing ExportDialog (X-1).
 * The picker, caps disclosure, button labels, selection-count semantics,
 * and cancel behavior are verbatim from the dialog; only the host changed
 * from a modal to a routed section.
 *
 * The one-time download token (X-2, intentionally interruptive per the
 * migration inventory) still renders as the shared Modal — now hosted by
 * this section instead of the parent view. The token lives in component
 * state only: never persisted, never in the URL, shown exactly once.
 */
export function ExportNewSection() {
  const navigate = useNavigate();
  // The engine's default list window is the 50 most recent conversations
  // (limit clamped 1..100). The dialog called useConversations({ enabled: open });
  // the section calls it bare — the default 50-most-recent window is
  // unchanged, so the "50 most recent" copy stays true.
  const conversations = useConversations();
  const rows = conversations.data ?? [];
  const requestExport = useRequestExport();
  const [selection, setSelection] = useState<string[]>([]);
  const [reveal, setReveal] = useState<{ exportId: string | null; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while a selection is picked but unrequested.
  const dirty = reveal === null && selection.length > 0;
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unrequested export selection. Leaving now discards it.');

  const toggle = (id: string) => {
    if (selection.includes(id)) {
      setSelection(selection.filter((s) => s !== id));
    } else if (selection.length < MAX_EXPORT_CONVERSATIONS) {
      setSelection([...selection, id]);
    }
  };

  const pending = requestExport.isPending;

  const submit = () => {
    if (pending || rows.length === 0) {
      return;
    }
    const ids = selection;
    requestExport.mutate(
      { conversationIds: ids },
      {
        onSuccess: (data) => {
          toast.success(ids.length === 0 ? 'Empty export requested' : `Export requested — ${ids.length} conversation${ids.length === 1 ? '' : 's'}`);
          setSelection([]);
          // C-05: surface the one-time download token immediately — the
          // engine returns it exactly once and never shows it again.
          if (data.downloadToken) {
            setCopied(false);
            setReveal({ exportId: data.id, token: data.downloadToken });
          } else {
            navigate({ to: '/agent-studio/compliance' });
          }
        },
      },
    );
  };

  const copy = async () => {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.token);
      setCopied(true);
    } catch {
      /* clipboard unavailable — the token is still visible to copy manually */
    }
  };

  const closeReveal = () => {
    setReveal(null);
    navigate({ to: '/agent-studio/compliance' });
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to="/agent-studio/compliance">
        <span aria-hidden="true">‹</span> Compliance
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Request a data export</ViewTitle>
          {/* Dialog intro, first two sentences verbatim — the section
              pattern needs a subtitle, so the panel starts at the caps
              disclosure instead of repeating the intro. */}
          <ViewSubtitle>
            Select up to {MAX_EXPORT_CONVERSATIONS} conversations to include. The export compiles
            transcripts and run records into a downloadable archive, ready immediately.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Conversations" subtitle="Pick the conversations the export manifest is built from.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Copy>
              Downloads are one-time and require the token shown after requesting.
            </Copy>
            {/* C-02: the archive is bounded — disclose the caps up front instead
                of letting the export look silently complete. */}
            <CapsCopy>
              Each conversation contributes up to 200 messages and 50 runs; conversations that
              reach a cap are flagged inside the archive. Conversations you cannot access are
              skipped, not failed.
              {/* OBS-1: the picker lists the 50 most recent conversations (the
                  engine's default list window) — older threads are not offered
                  here, so say so instead of implying the list is complete. */}
              The list below shows the 50 most recent conversations; older ones are not included.
            </CapsCopy>
            {conversations.isLoading ? (
              <Skeleton $h="120px" $r="12px" />
            ) : rows.length === 0 ? (
              <EmptyCopy>No conversations in this organization yet.</EmptyCopy>
            ) : (
              <PickerList>
                {rows.map((c) => {
                  const checked = selection.includes(c.id);
                  return (
                    <PickerRow key={c.id} $checked={checked}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        disabled={!checked && selection.length >= MAX_EXPORT_CONVERSATIONS}
                        aria-label={`Include ${c.title}`}
                      />
                      <PickerTitle>{c.title}</PickerTitle>
                      <PickerDate>{c.updatedAt?.slice(0, 10) ?? ''}</PickerDate>
                    </PickerRow>
                  );
                })}
              </PickerList>
            )}
            <ActionsRow>
              <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/compliance' })}>
                Cancel
              </ActionButton>
              <ActionButton disabled={pending || rows.length === 0} onClick={submit}>
                {selection.length === 0 ? 'Request empty export' : `Request export (${selection.length})`}
              </ActionButton>
            </ActionsRow>
          </div>
        </Panel>
      </motion.div>

      {/* X-2 (keep-as-modal): the one-time download token is issued exactly
          once, in the POST /exports response. The console never persists it,
          and the engine never shows it again. */}
      {reveal && (
        <Modal
          open
          onClose={closeReveal}
          title="Download token — copy it now"
          width={520}
          footer={
            <>
              <ActionButton variant="secondary" onClick={copy}>{copied ? 'Copied' : 'Copy token'}</ActionButton>
              <ActionButton onClick={closeReveal}>Done</ActionButton>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Copy>
              This token is shown <strong>once</strong>. Downloading the export requires it —
              without it the archive cannot be retrieved, even by an admin.
            </Copy>
            <TokenCell>{reveal.token}</TokenCell>
          </div>
        </Modal>
      )}
    </ViewShell>
  );
}
