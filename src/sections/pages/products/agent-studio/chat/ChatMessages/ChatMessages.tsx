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
  kind: 'tool' | 'usage' | 'status' | 'error';
  text: string;
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
        {messages.map((m) => (
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
          />
        ))}
        {notices.map((n) => (
          <NoticeRow key={n.id} role="status">
            <NoticeDot $tone={noticeTone[n.kind]} aria-hidden="true" />
            {n.text}
          </NoticeRow>
        ))}
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
