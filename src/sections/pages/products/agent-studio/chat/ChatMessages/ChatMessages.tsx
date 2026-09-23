import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Check, Copy, Pencil, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ease } from '@styles/motion';
import {
  EmptyState,
  SuggestionList,
  SuggestionItem,
  SuggestionIconWrap,
  SuggestionLabel,
  MessageList,
  Bubble,
  BubbleMeta,
  BubbleText,
  TypingBubble,
  TypingRow,
  TypingDot,
  SuggestionInline,
  SuggestionChip,
} from './ChatMessages.styles';
import { MarkdownText } from './MarkdownText';
import { useRecordFeedback } from '@hooks/studio/useChat';

export type Message = {
  id: string;
  role: 'user' | 'agent';
  text: string;
};

export type ChatNotice = {
  id: string;
  kind: 'tool' | 'usage' | 'status' | 'error' | 'approval';
  text: string;
  /** A3-21 — rich tool-call payload for expanded rendering. */
  toolCall?: { name: string | null; args: unknown; status: string | null; callId: string | null } | null;
  /** A3-20 — inline approval card payload. */
  approval?: {
    id: string;
    runId: string;
    approvalRef: string;
    summary: string;
    actionType: string;
    expiresAt: string | null;
  } | null;
  /** A3-23 — the session kept the failed text; the notice offers retry. */
  retryable?: boolean;
};

type Suggestion = { icon: string; label: string };

type Props = {
  messages?: Message[];
  isTyping?: boolean;
  suggestions?: Suggestion[];
  onSuggestionClick?: (text: string) => void;
  notices?: ChatNotice[];
  onRegenerate?: () => void;
  showRegenerate?: boolean;
  /** A3-40 — conversation the messages belong to; enables feedback. */
  conversationId?: string | null;
  /** A3-40 — edit-and-resend on a user message (real engine edit endpoint). */
  onEditMessage?: (messageId: string, text: string) => Promise<void>;
  /** A3-45 — the scrollable ancestor; ChatMessages pins it imperatively. */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /** A3-20 — decides an inline approval card (approve/deny). */
  onDecideApproval?: (approval: NonNullable<ChatNotice['approval']>, decision: 'APPROVED' | 'DENIED') => Promise<void>;
  /** A3-24 — true while the last agent bubble is still streaming (cursor). */
  isStreaming?: boolean;
  /** A3-23 — re-posts the text of the last failed send. */
  onRetrySend?: () => void;
};

const iconPaths: Record<string, string> = {
  sparkles:
    'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3zM18 14l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9.9-2z',
  compass:
    'M12 3a9 9 0 100 18 9 9 0 000-18zm3.5 5.5l-1.6 4.4-4.4 1.6 1.6-4.4 4.4-1.6z',
  plug:
    'M9 2v5M15 2v5M6 7h12v5a6 6 0 11-12 0V7zm-3 5h2m14 0h2M10 18v4M14 18v4',
  orbit:
    'M12 5a7 7 0 100 14 7 7 0 000-14zm0-3v2m0 16v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4',
};

const noticeTone: Record<ChatNotice['kind'], string> = {
  tool: '#60a5fa',
  usage: '#94a3b8',
  status: '#c084fc',
  error: '#f87171',
  approval: '#fbbf24',
};

/** Live (streaming) rows are `live-…` — actions only apply to persisted rows. */
function isPersisted(id: string): boolean {
  return !id.startsWith('live-');
}

function BubbleCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <ActionButton type="button" onClick={copy} aria-label={copied ? 'Copied' : 'Copy message'}>
      {copied ? <Check size={13} strokeWidth={2.2} /> : <Copy size={13} strokeWidth={1.8} />}
      {copied ? 'Copied' : 'Copy'}
    </ActionButton>
  );
}

function FeedbackButtons({
  conversationId,
  messageId,
  rating,
  onRated,
}: {
  conversationId: string;
  messageId: string;
  rating: 'up' | 'down' | null;
  onRated: (messageId: string, rating: 'up' | 'down') => void;
}) {
  const recordFeedback = useRecordFeedback();
  const rate = (value: 'up' | 'down') => {
    if (rating === value || recordFeedback.isPending) return;
    onRated(messageId, value);
    recordFeedback.mutate({ conversationId, messageId, rating: value });
  };
  return (
    <>
      <ActionButton
        type="button"
        $active={rating === 'up'}
        onClick={() => rate('up')}
        aria-label="Good response"
        aria-pressed={rating === 'up'}
        title="Good response"
      >
        <ThumbsUp size={13} strokeWidth={1.8} />
      </ActionButton>
      <ActionButton
        type="button"
        $active={rating === 'down'}
        onClick={() => rate('down')}
        aria-label="Bad response"
        aria-pressed={rating === 'down'}
        title="Bad response"
      >
        <ThumbsDown size={13} strokeWidth={1.8} />
      </ActionButton>
    </>
  );
}

/**
 * One message bubble, memoized on primitive props (A3-47 perf): a settled
 * message's text never changes, and MarkdownText memoizes the parse, so
 * streaming one bubble never re-parses the rest of a long thread.
 */
const MessageBubble = memo(function MessageBubble({
  id,
  role,
  text,
  conversationId,
  feedback,
  onFeedback,
  editing,
  onEditStart,
  onEditCancel,
  onEditSave,
  streaming,
}: {
  id: string;
  role: 'user' | 'agent';
  text: string;
  conversationId: string | null | undefined;
  feedback: 'up' | 'down' | null;
  onFeedback: (messageId: string, rating: 'up' | 'down') => void;
  editing: boolean;
  onEditStart: (messageId: string) => void;
  onEditCancel: () => void;
  onEditSave: (messageId: string, text: string) => Promise<void>;
  /** A3-24 — the bubble is still receiving chunks; show a cursor. */
  streaming?: boolean;
}) {
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);
  const persisted = isPersisted(id);

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = draft.trim();
    if (saving || trimmed === '') return;
    if (trimmed === text) {
      onEditCancel();
      return;
    }
    setSaving(true);
    try {
      await onEditSave(id, trimmed);
    } finally {
      // On failure the hook toasts and the editor stays open with the draft.
      setSaving(false);
    }
  };

  return (
    <Bubble
      $role={role}
      as={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: ease.premium }}
    >
      <BubbleMeta>{role === 'user' ? 'You' : 'Neryva'}</BubbleMeta>
      {editing ? (
        <EditForm onSubmit={(event) => void save(event)}>
          <EditArea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void save();
              }
              if (event.key === 'Escape') onEditCancel();
            }}
            disabled={saving}
            autoFocus
            aria-label="Edit message"
            rows={3}
          />
          <EditActions>
            <EditButton type="submit" $primary disabled={saving || draft.trim() === ''}>
              {saving ? 'Sending…' : 'Send'}
            </EditButton>
            <EditButton type="button" onClick={onEditCancel} disabled={saving}>
              Cancel
            </EditButton>
          </EditActions>
        </EditForm>
      ) : (
        <BubbleText>
          <MarkdownText text={text} />
          {/* A3-24 — blinking cursor while the reply is still streaming. */}
          {streaming && <StreamCursor aria-hidden="true" />}
        </BubbleText>
      )}
      {persisted && !editing && (
        <MessageActions aria-label="Message actions">
          <BubbleCopyButton text={text} />
          {role === 'agent' ? (
            conversationId ? (
              <FeedbackButtons
                conversationId={conversationId}
                messageId={id}
                rating={feedback}
                onRated={onFeedback}
              />
            ) : null
          ) : (
            <ActionButton
              type="button"
              onClick={() => {
                setDraft(text);
                onEditStart(id);
              }}
              aria-label="Edit and resend"
              title="Edit and resend"
            >
              <Pencil size={13} strokeWidth={1.8} />
            </ActionButton>
          )}
        </MessageActions>
      )}
    </Bubble>
  );
});

export function ChatMessages({
  messages = [],
  isTyping,
  suggestions = [],
  onSuggestionClick,
  notices = [],
  onRegenerate,
  showRegenerate,
  conversationId,
  onEditMessage,
  scrollContainerRef,
  onDecideApproval,
  isStreaming,
  onRetrySend,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  // A3-45 — stick only while the user is near the bottom; our own sends
  // always pin. handledLiveId makes the pin fire once per sent message.
  const stickRef = useRef(true);
  const handledLiveId = useRef<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [feedbackById, setFeedbackById] = useState<Record<string, 'up' | 'down'>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const container = scrollContainerRef?.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
        return;
      }
      bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    },
    [scrollContainerRef],
  );

  const handleFeedback = useCallback((messageId: string, rating: 'up' | 'down') => {
    setFeedbackById((prev) => ({ ...prev, [messageId]: rating }));
  }, []);

  const handleEditSave = useCallback(
    async (messageId: string, text: string) => {
      if (!onEditMessage) return;
      try {
        await onEditMessage(messageId, text);
        setEditingId(null);
      } catch {
        // The hook surfaced a toast; keep the editor open with the draft.
      }
    },
    [onEditMessage],
  );

  const handleEditCancel = useCallback(() => setEditingId(null), []);

  /* Track whether the user is near the bottom; stop forcing scroll otherwise. */
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;
    const onScroll = () => {
      const near = container.scrollHeight - container.scrollTop - container.clientHeight < 96;
      stickRef.current = near;
      if (near) setShowJump(false);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef]);

  /* A3-45: pin on our own sends; otherwise stick only when near the bottom.
     This effect synchronizes the scroll container (an external system) after
     the message list changes — the jump-pill state is part of that sync. */
  useEffect(() => {
    const liveUser = messages.find((m) => m.role === 'user' && m.id.startsWith('live-'));
    if (liveUser) {
      if (handledLiveId.current !== liveUser.id) {
        handledLiveId.current = liveUser.id;
        stickRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- scroll sync, see above
        setShowJump(false);
        scrollToBottom();
      }
      return;
    }
    handledLiveId.current = null;
    if (stickRef.current) {
      scrollToBottom();
    } else {
      setShowJump(true);
    }
  }, [messages, scrollToBottom]);

  if (messages.length === 0) {
    return (
      <EmptyState>
        <SuggestionList>
          {suggestions.map((s, i) => (
            <SuggestionItem
              key={s.label}
              as={motion.button}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: ease.premium, delay: 0.35 + i * 0.07 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSuggestionClick?.(s.label)}
            >
              <SuggestionIconWrap viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d={iconPaths[s.icon] ?? iconPaths.sparkles}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </SuggestionIconWrap>
              <SuggestionLabel>{s.label}</SuggestionLabel>
            </SuggestionItem>
          ))}
        </SuggestionList>
      </EmptyState>
    );
  }

  return (
    <>
      <MessageList role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            id={m.id}
            role={m.role}
            text={m.text}
            conversationId={conversationId}
            feedback={feedbackById[m.id] ?? null}
            onFeedback={handleFeedback}
            editing={editingId === m.id}
            onEditStart={setEditingId}
            onEditCancel={handleEditCancel}
            onEditSave={handleEditSave}
            // A3-24 — the streaming cursor marks the live bubble while
            // chunks are still arriving.
            streaming={isStreaming && i === messages.length - 1 && m.role === 'agent' && m.id === 'live-assistant'}
          />
        ))}
        {notices.map((n) =>
          n.kind === 'approval' && n.approval ? (
            <ApprovalCard key={n.id} approval={n.approval} onDecide={onDecideApproval} />
          ) : n.kind === 'tool' && n.toolCall ? (
            <ToolNoticeRow key={n.id} notice={n} />
          ) : (
            <NoticeRow key={n.id} role="status">
              <NoticeDot $tone={noticeTone[n.kind]} aria-hidden="true" />
              {n.text}
              {/* A3-23 — the session kept the failed text; offer a retry. */}
              {n.retryable && n.kind === 'error' && onRetrySend && (
                <RetryButton type="button" onClick={() => onRetrySend()}>
                  Retry
                </RetryButton>
              )}
            </NoticeRow>
          ),
        )}
        {isTyping && (
          <TypingBubble
            as={motion.div}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: ease.premium }}
          >
            <BubbleMeta>Neryva</BubbleMeta>
            <TypingRow aria-label="Neryva is typing">
              <TypingDot $delay={0} />
              <TypingDot $delay={0.15} />
              <TypingDot $delay={0.3} />
            </TypingRow>
          </TypingBubble>
        )}
      </MessageList>
      {showJump && (
        <JumpPill
          type="button"
          onClick={() => {
            stickRef.current = true;
            setShowJump(false);
            scrollToBottom();
          }}
        >
          ↓ New messages
        </JumpPill>
      )}
      {/* A3-41 — regenerate renders on its own phase gate, NOT inside the
          suggestion gate: the thread view never passes suggestions, so the
          old coupling made it unreachable. */}
      {onRegenerate && showRegenerate && messages.some((m) => m.role === 'agent' && isPersisted(m.id)) && (
        <SuggestionInline>
          <SuggestionChip type="button" onClick={onRegenerate}>
            <RefreshCw size={11} strokeWidth={1.8} />
            Regenerate response
          </SuggestionChip>
        </SuggestionInline>
      )}
      <div ref={bottomRef} aria-hidden="true" />
    </>
  );
}

/* ─── Per-message action styles (A3-40) ─── */

const MessageActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 2px;
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${Bubble}:hover &,
  ${Bubble}:focus-within & {
    opacity: 1;
  }

  @media (hover: none) {
    opacity: 1;
  }
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: ${({ $active, theme }) => ($active ? '#7aa7ff' : theme.app.text.muted)};
  border-radius: 7px;
  padding: 5px 7px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

/** A3-23 — retry a failed send from the error notice. */
const RetryButton = styled.button`
  margin-left: 8px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const JumpPill = styled.button`
  position: sticky;
  bottom: 14px;
  align-self: center;
  z-index: 5;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border-radius: 999px;
  padding: 7px 14px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const EditArea = styled.textarea`
  width: 100%;
  resize: vertical;
  min-height: 64px;
  border: 1px solid ${({ theme }) => theme.app.border.focus};
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  line-height: 1.55;
  padding: 8px 10px;

  &:focus {
    outline: none;
  }
`;

const EditActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const EditButton = styled.button<{ $primary?: boolean }>`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ $primary, theme }) => ($primary ? theme.app.surface.hover : 'transparent')};
  color: ${({ theme }) => theme.app.text.primary};
  border-radius: 8px;
  padding: 6px 14px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const NoticeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

const NoticeDot = styled.span<{ $tone: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $tone }) => $tone};
  flex-shrink: 0;
`;

/** A3-24 — blinking block cursor on the live streaming bubble. */
const StreamCursor = styled.span`
  display: inline-block;
  width: 8px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: ${({ theme }) => theme.app.text.primary};
  animation: stream-blink 1s steps(2, start) infinite;
  @keyframes stream-blink {
    to {
      visibility: hidden;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** A3-21 — tool-call notice with expandable arguments. */
function ToolNoticeRow({ notice }: { notice: ChatNotice }) {
  const tc = notice.toolCall;
  const argsText =
    tc?.args == null
      ? null
      : typeof tc.args === 'string'
        ? tc.args
        : JSON.stringify(tc.args, null, 2);
  return (
    <NoticeRow role="status" style={{ borderRadius: 12, maxWidth: '100%' }}>
      <NoticeDot $tone={noticeTone[notice.kind]} aria-hidden="true" />
      <span style={{ minWidth: 0 }}>
        {notice.text}
        {argsText && (
          <details style={{ marginTop: 4 }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.85em' }}>Arguments</summary>
            <pre
              style={{
                margin: '4px 0 0',
                padding: 8,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.25)',
                overflowX: 'auto',
                fontSize: '0.85em',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {argsText}
            </pre>
          </details>
        )}
      </span>
    </NoticeRow>
  );
}

/**
 * A3-20 — inline approval card. The engine stores no tool arguments on the
 * approval record, so the card shows the action summary, the mutating/
 * read-only classification, and the expiry countdown — never invented args.
 */
function ApprovalCard({
  approval,
  onDecide,
}: {
  approval: NonNullable<ChatNotice['approval']>;
  onDecide?: (approval: NonNullable<ChatNotice['approval']>, decision: 'APPROVED' | 'DENIED') => Promise<void>;
}) {
  const [busy, setBusy] = useState<'APPROVED' | 'DENIED' | null>(null);
  const [outcome, setOutcome] = useState<'approved' | 'denied' | 'error' | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!approval.expiresAt || outcome) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [approval.expiresAt, outcome]);

  const decide = async (decision: 'APPROVED' | 'DENIED') => {
    if (busy || outcome || !onDecide) {
      return;
    }
    setBusy(decision);
    setErrorText(null);
    try {
      await onDecide(approval, decision);
      setOutcome(decision === 'APPROVED' ? 'approved' : 'denied');
    } catch (error) {
      // A3-20 — SoD: the engine 403s when the author tries to self-approve.
      // Surface it inline so the user knows to ask a different admin.
      const message = error instanceof Error ? error.message : 'Could not record the decision.';
      setErrorText(message);
      setOutcome('error');
    } finally {
      setBusy(null);
    }
  };

  const expiresMs = approval.expiresAt ? new Date(approval.expiresAt).getTime() - now : null;
  const expiresLabel =
    expiresMs == null ? null : expiresMs <= 0 ? 'expired' : `expires in ${Math.floor(expiresMs / 60000)}m ${Math.floor((expiresMs % 60000) / 1000)}s`;

  return (
    <ApprovalWrap role="group" aria-label={`Approval needed: ${approval.summary}`}>
      <ApprovalHeader>
        <NoticeDot $tone={noticeTone.approval} aria-hidden="true" />
        <ApprovalTitle>Approval needed</ApprovalTitle>
        {approval.actionType && <ApprovalBadge>{approval.actionType}</ApprovalBadge>}
      </ApprovalHeader>
      <ApprovalSummary>{approval.summary}</ApprovalSummary>
      {expiresLabel && <ApprovalMeta>{expiresLabel}</ApprovalMeta>}
      {outcome === 'approved' && <ApprovalMeta>Approved — the run is resuming.</ApprovalMeta>}
      {outcome === 'denied' && <ApprovalMeta>The tool call was denied.</ApprovalMeta>}
      {outcome === 'error' && errorText && <ApprovalError>{errorText}</ApprovalError>}
      {!outcome && (
        <ApprovalActions>
          <ApprovalButton $primary disabled={busy !== null} onClick={() => void decide('APPROVED')}>
            {busy === 'APPROVED' ? 'Approving…' : 'Approve'}
          </ApprovalButton>
          <ApprovalButton disabled={busy !== null} onClick={() => void decide('DENIED')}>
            {busy === 'DENIED' ? 'Denying…' : 'Deny'}
          </ApprovalButton>
        </ApprovalActions>
      )}
    </ApprovalWrap>
  );
}

const ApprovalWrap = styled.div`
  align-self: center;
  width: min(480px, 100%);
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(251, 191, 36, 0.06);
  border: 1px solid rgba(251, 191, 36, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ApprovalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ApprovalTitle = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ApprovalBadge = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.4);
`;

const ApprovalSummary = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ui-monospace, monospace;
  word-break: break-word;
`;

const ApprovalMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

const ApprovalError = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: #f87171;
`;

const ApprovalActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ApprovalButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.accent.emerald : 'transparent')};
  color: ${({ $primary, theme }) => ($primary ? '#fff' : theme.app.text.primary)};
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
