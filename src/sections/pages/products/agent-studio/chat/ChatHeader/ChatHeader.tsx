import { useEffect, useRef, useState } from 'react';
import { Plus, Bot, ChevronLeft, Pencil, Trash2, Cpu } from 'lucide-react';
import styled from 'styled-components';
import {
  Bar,
  LeftCluster,
  RightCluster,
  Crumbs,
  Crumb,
  CrumbDivider,
  IconButton,
  TitleInput,
  ModelChip,
  StatusChip,
} from './ChatHeader.styles';

/**
 * The chat header (ledger C-2) — back navigation, the real thread title
 * (inline rename), the bound agent + its serving model (read from the
 * agent's published model policy — never a stub), run status, and
 * new-thread / delete.
 *
 * The model picker was removed deliberately: chat runs through the
 * engine's conversations module and the model allowlist registry is
 * ⛔ E-1 — a picker that only changed a label was a stub. The model shown
 * here is the agent's real published policy; changing it is agent
 * authoring, not chat chrome.
 */

const StreamingPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 9px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.azure.bg};
  border: 1px solid ${({ theme }) => theme.app.status.azure.border};
  color: ${({ theme }) => theme.app.status.azure.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const AgentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.micro};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 24ch;
`;

const NewThreadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 7px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

type Props = {
  title: string;
  /** Present when a real thread is open — enables rename + delete. */
  conversationId: string | null;
  agentName: string | null;
  /** The agent's serving model (allowed_models[0] of the published policy). */
  agentModel: string | null;
  /** Raw conversation status ('active' | 'archived' | null). */
  conversationStatus: string | null;
  streaming: boolean;
  onBack: () => void;
  onNewThread: () => void;
  /** Rename the thread; rejects on failure (the caller toasts). */
  onRename: (title: string) => Promise<void>;
  onDelete: () => void;
};

export function ChatHeader({
  title,
  conversationId,
  agentName,
  agentModel,
  conversationStatus,
  streaming,
  onBack,
  onNewThread,
  onRename,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);

  // Keep the draft in sync when the thread (and its title) changes.
  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing, conversationId]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing ]);

  const cancelEdit = () => {
    committingRef.current = false;
    setDraft(title);
    setEditing(false);
  };

  const commitEdit = async () => {
    if (committingRef.current) return;
    const next = draft.trim();
    if (next === '' || next === title) {
      cancelEdit();
      return;
    }
    committingRef.current = true;
    setSaving(true);
    try {
      await onRename(next);
      setEditing(false);
    } catch {
      // The caller surfaces the failure; stay in edit mode so the
      // title isn't silently lost.
    } finally {
      committingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Bar>
      <LeftCluster>
        <IconButton type="button" onClick={onBack} aria-label="Back to all conversations" title="Back to all conversations">
          <ChevronLeft size={14} strokeWidth={2} />
        </IconButton>

        <Crumbs aria-label="Breadcrumb">
          <Crumb>Studio</Crumb>
          <CrumbDivider aria-hidden="true">/</CrumbDivider>
          {editing ? (
            <TitleInput
              ref={inputRef}
              value={draft}
              disabled={saving}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void commitEdit();
                else if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={() => {
                // Blur after Enter commits; any other blur cancels.
                if (!committingRef.current) cancelEdit();
              }}
              aria-label="Conversation title"
              maxLength={120}
            />
          ) : (
            <Crumb>{title}</Crumb>
          )}
        </Crumbs>

        {conversationId && !editing && (
          <IconButton
            type="button"
            onClick={() => {
              setDraft(title);
              setEditing(true);
            }}
            aria-label="Rename conversation"
            title="Rename conversation"
          >
            <Pencil size={12} strokeWidth={1.8} />
          </IconButton>
        )}

        {agentName && (
          <AgentBadge title={agentName}>
            <Bot size={11} strokeWidth={1.8} aria-hidden="true" />
            {agentName}
          </AgentBadge>
        )}

        {agentModel && (
          <ModelChip title={`Serving model: ${agentModel}`}>
            <Cpu size={11} strokeWidth={1.8} aria-hidden="true" />
            {agentModel}
          </ModelChip>
        )}

        {conversationStatus === 'archived' && <StatusChip>Archived</StatusChip>}

        {streaming && <StreamingPill>working…</StreamingPill>}
      </LeftCluster>

      <RightCluster>
        {conversationId && (
          <IconButton
            type="button"
            onClick={onDelete}
            aria-label="Delete conversation"
            title="Delete conversation"
          >
            <Trash2 size={13} strokeWidth={1.8} />
          </IconButton>
        )}
        <NewThreadButton type="button" onClick={onNewThread}>
          <Plus size={12} strokeWidth={2} />
          New thread
        </NewThreadButton>
      </RightCluster>
    </Bar>
  );
}
