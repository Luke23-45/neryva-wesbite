import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Bot } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import { ease } from '@styles/motion';
import workspaceData from '@neryva_data/products/agent_studio_chat/workspace.json';
import { ApiError } from '@lib/engine/client';
import {
  useChatSession,
  useConversationMessages,
  useConversationStatus,
  useRenameConversation,
  useUpdateConversationStatus,
  type RunNotice,
} from '@hooks/studio/useChat';
import { useAttachmentUpload } from '@hooks/studio/useAttachmentUpload';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { Skeleton } from '@components/common/ui/Skeleton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';

import { ChatMessages, type Message } from './ChatMessages';
import { ChatComposer } from './ChatComposer';
import { ChatHeader } from './ChatHeader';

import {
  ViewRoot,
  ChatArea,
  ScrollRegion,
  GreetingBlock,
  GreetingTitle,
  GreetingSubtitle,
  Banner,
  BannerLeft,
  BannerIcon,
  BannerText,
  BannerAction,
  BannerClose,
  NotFoundWrap,
  NotFoundTitle,
  NotFoundBody,
  NotFoundActions,
  NotFoundButton,
  PickerWrap,
  PickerTitle,
  PickerList,
  PickerItem,
  PickerIcon,
  PickerName,
  PickerMeta,
  PickerEmpty,
  SkeletonWrap,
} from './AgentStudioChatView.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: ease.premium, delay: custom * 0.08 },
  }),
};

/** The engine returns `{ conversation: {...} }` — unwrap before reading fields (A3-08). */
function conversationRecord(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const nested = record.conversation;
  const target = typeof nested === 'object' && nested !== null ? nested : record;
  return target as Record<string, unknown>;
}

function strField(record: Record<string, unknown> | null, keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

/** Time-aware greeting (A3-04) — computed from the viewer's locale, never a static "Evening". */
function daypartGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.code === 'not_found');
}

export function AgentStudioChatView() {
  const { setHeaderTheme } = useUiStore();
  const navigate = useNavigate();
  // ?chat=<id> opens a thread (sidebar recents, S-4); ?chat=new is the
  // explicit new-thread marker; ?agent=<id> binds new threads to an agent
  // (agent detail "Test", A-5).
  const search = useSearch({ strict: false }) as { chat?: string; agent?: string };
  const conversationId = search.chat && search.chat !== 'new' ? search.chat : null;
  const boundAgentId = search.agent ?? null;
  const isNewThread = conversationId === null;
  // A3-01: without an agent binding the engine cannot create a conversation
  // (assistant_id is required) — gate honestly instead of 400ing.
  const needsAgent = isNewThread && !boundAgentId;

  const [bannerVisible, setBannerVisible] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const session = useChatSession(conversationId, boundAgentId);
  const transcript = useConversationMessages(conversationId);
  const conversation = useConversationStatus(conversationId);
  const assistants = useAssistants();
  const attachments = useAttachmentUpload();
  const rename = useRenameConversation();
  const updateStatus = useUpdateConversationStatus();

  // The thread's own assistant (A3-08) — ?chat=<id> opens carry no ?agent=.
  const record = conversationRecord(conversation.data);
  const threadAssistantId = strField(record, ['assistantId', 'assistant_id', 'agentId', 'agent_id']);
  const threadAgentId = boundAgentId ?? threadAssistantId;
  const threadTitle = strField(record, ['title', 'name', 'summary']) ?? (conversationId ? 'Untitled conversation' : 'New thread');
  const threadStatus = strField(record, ['status']);

  const agentName = assistants.data?.find((a) => a.id === threadAgentId)?.name ?? null;
  // The serving model is the agent's real published policy (prefer active) —
  // read-only here; changing it is agent authoring, not chat chrome (E-1).
  const agentDefinition = useAssistantDefinition(threadAgentId, { prefer: 'active' });
  const allowedModels = agentDefinition.data?.definition.model_policy.allowed_models ?? [];
  const agentModel =
    allowedModels.length > 1
      ? `${allowedModels[0]} +${allowedModels.length - 1}`
      : (allowedModels[0] ?? null);

  useEffect(() => {
    setHeaderTheme('light');
    return () => setHeaderTheme('light');
  }, [setHeaderTheme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const data = workspaceData.workspace;

  // Merge the server transcript with the live streaming overlay. Live rows
  // disappear once the refetched transcript carries the turn.
  const messages: Message[] = useMemo(() => {
    const base: Message[] = (transcript.data ?? []).map((m) => ({ id: m.id, role: m.role, text: m.text }));
    const lastUserText = [...base].reverse().find((m) => m.role === 'user')?.text ?? null;
    if (session.live.user && session.live.user.text !== lastUserText) {
      base.push({ id: session.live.user.id, role: 'user', text: session.live.user.text });
    }
    if (session.live.assistantText) {
      base.push({ id: 'live-assistant', role: 'agent', text: session.live.assistantText });
    }
    return base;
  }, [transcript.data, session.live]);

  const allNotices: RunNotice[] = useMemo(() => {
    const rows: RunNotice[] = [...session.notices];
    if (session.phase === 'accepted') {
      rows.push({
        id: 'accepted-runtime',
        kind: 'status',
        text: 'The run was accepted, but no runtime answered in this deployment yet — responses stream here once a satellite is connected.',
      });
    }
    return rows;
  }, [session.notices, session.phase]);

  // A3-02: a bad ?chat= must surface an honest error — never the empty state.
  const threadFailed = conversationId !== null && (conversation.isError || transcript.isError);
  const threadError = conversation.error ?? transcript.error ?? null;
  const threadNotFound = threadError !== null && isNotFoundError(threadError);
  // A3-03: skeleton while the thread loads — never the greeting flash.
  const threadLoading =
    conversationId !== null &&
    !threadFailed &&
    (conversation.isPending || transcript.isPending) &&
    messages.length === 0;

  const startNewThread = () => {
    session.reset();
    attachments.reset();
    navigate({ to: '/agent-studio/chat', search: { chat: 'new', agent: boundAgentId ?? undefined } });
  };

  const send = (text: string) => {
    const readyIds = attachments.uploads.filter((u) => u.status === 'ready').map((u) => u.sessionId);
    void session.send(text, readyIds.length > 0 ? readyIds : undefined);
    attachments.reset();
  };

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      void session.send(lastUser.text);
    }
  };

  const handleRename = (title: string): Promise<void> => {
    if (!conversationId) return Promise.reject(new Error('No conversation open'));
    return rename.mutateAsync({ conversationId, title }).then(() => undefined);
  };

  const handleDelete = () => {
    if (!conversationId || updateStatus.isPending) return;
    updateStatus.mutate(
      { conversationId, status: 'deleted' },
      {
        onSuccess: () => {
          setConfirmDeleteOpen(false);
          toast.success('Chat deleted');
          startNewThread();
        },
      },
    );
  };

  const onAttach = (file: File | null | undefined) => {
    if (!file) return;
    void attachments
      .attach({ file, purpose: 'MESSAGE_ATTACHMENT' })
      .then((sessionId) => {
        if (sessionId === null) {
          toast.error(`${file.name} could not be attached — unsupported file type`);
        }
      })
      .catch((error: unknown) => {
        // Authorize/complete refusals (size window, allowlist, slug clash)
        // throw so the engine's reason renders verbatim.
        toast.error(error instanceof Error ? error.message : `${file.name} could not be attached`);
      });
  };

  const retryThreadLoad = () => {
    void conversation.refetch();
    void transcript.refetch();
  };

  const typing = session.phase === 'streaming' || session.phase === 'sending' || session.phase === 'creating';

  return (
    <ViewRoot>
      <ChatHeader
        title={threadTitle}
        conversationId={conversationId}
        agentName={agentName}
        agentModel={agentModel}
        conversationStatus={threadStatus}
        streaming={session.phase === 'streaming'}
        onBack={() => navigate({ to: '/agent-studio/conversations' })}
        onNewThread={startNewThread}
        onRename={handleRename}
        onDelete={() => setConfirmDeleteOpen(true)}
      />
      <ChatArea>
        <ScrollRegion>
          {threadFailed ? (
            <NotFoundWrap>
              <NotFoundTitle>
                {threadNotFound ? 'This conversation couldn’t be found' : 'Couldn’t load this conversation'}
              </NotFoundTitle>
              <NotFoundBody>
                {threadNotFound
                  ? 'It may have been deleted, or the link is incorrect. Your other conversations are untouched.'
                  : 'Something went wrong on our side while loading it. Your other conversations are untouched.'}
              </NotFoundBody>
              <NotFoundActions>
                <NotFoundButton $primary type="button" onClick={startNewThread}>
                  Start a new thread
                </NotFoundButton>
                <NotFoundButton type="button" onClick={retryThreadLoad}>
                  Try again
                </NotFoundButton>
              </NotFoundActions>
            </NotFoundWrap>
          ) : threadLoading ? (
            <SkeletonWrap aria-label="Loading conversation">
              <Skeleton $h="18px" $w="42%" />
              <Skeleton $h="64px" $w="78%" $r="14px" />
              <Skeleton $h="18px" $w="36%" />
              <Skeleton $h="96px" $w="86%" $r="14px" />
              <Skeleton $h="48px" $w="62%" $r="14px" />
            </SkeletonWrap>
          ) : messages.length === 0 ? (
            <>
              <GreetingBlock as={motion.div} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} custom={1}>
                  <GreetingTitle>{`${daypartGreeting()}, ready to focus on work?`}</GreetingTitle>
                </motion.div>
                <motion.div variants={fadeUp} custom={2}>
                  <GreetingSubtitle>{data.greeting.subtitle}</GreetingSubtitle>
                </motion.div>
              </GreetingBlock>

              {bannerVisible && (
                <Banner
                  as={motion.div}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: ease.premium, delay: 0.2 }}
                >
                  <BannerLeft>
                    <BannerIcon viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 2.5l2.2 4.6 5.1.6-3.7 3.5 1 5L12 13.7 7.4 16.2l1-5L4.7 7.7l5.1-.6L12 2.5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </BannerIcon>
                    <BannerText>{data.banner.label}</BannerText>
                  </BannerLeft>
                  <BannerAction
                    as={motion.button}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setBannerVisible(false);
                      navigate({ to: '/agent-studio/integrations' });
                    }}
                  >
                    {data.banner.action}
                  </BannerAction>
                  <BannerClose aria-label="Dismiss" onClick={() => setBannerVisible(false)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </BannerClose>
                </Banner>
              )}

              {needsAgent ? (
                <PickerWrap>
                  <PickerTitle>
                    Choose an agent to chat with — the thread runs on its published configuration.
                  </PickerTitle>
                  {assistants.isPending ? (
                    <>
                      <Skeleton $h="60px" $r="12px" />
                      <Skeleton $h="60px" $r="12px" />
                    </>
                  ) : assistants.isError ? (
                    <PickerEmpty>
                      Couldn’t load your agents.
                      <NotFoundButton type="button" onClick={() => assistants.refetch()}>
                        Try again
                      </NotFoundButton>
                    </PickerEmpty>
                  ) : assistants.data.length === 0 ? (
                    <PickerEmpty>
                      No agents in this organization yet — create one to start chatting.
                      <NotFoundButton
                        $primary
                        type="button"
                        onClick={() => navigate({ to: '/agent-studio/agents/new' })}
                      >
                        Create your first agent
                      </NotFoundButton>
                    </PickerEmpty>
                  ) : (
                    <PickerList>
                      {assistants.data.map((assistant) => {
                        const runnable = assistant.status === 'live';
                        return (
                          <PickerItem
                            key={assistant.id}
                            type="button"
                            $disabled={!runnable}
                            disabled={!runnable}
                            onClick={
                              runnable
                                ? () =>
                                    navigate({
                                      to: '/agent-studio/chat',
                                      search: { chat: 'new', agent: assistant.id },
                                    })
                                : undefined
                            }
                            title={
                              runnable
                                ? `Chat with ${assistant.name}`
                                : `${assistant.name} isn’t published yet`
                            }
                          >
                            <PickerIcon aria-hidden="true">
                              <Bot size={16} strokeWidth={1.8} />
                            </PickerIcon>
                            <span>
                              <PickerName>{assistant.name}</PickerName>
                              <PickerMeta>
                                {runnable
                                  ? (assistant.description ?? 'Published agent')
                                  : 'Not published yet — publish it before chatting.'}
                              </PickerMeta>
                            </span>
                          </PickerItem>
                        );
                      })}
                    </PickerList>
                  )}
                </PickerWrap>
              ) : (
                <ChatMessages suggestions={data.suggestions} onSuggestionClick={send} />
              )}
            </>
          ) : (
            <ChatMessages
              messages={messages}
              notices={allNotices}
              isTyping={typing && !session.live.assistantText}
              onRegenerate={regenerate}
              showRegenerate={session.phase === 'done' || session.phase === 'accepted'}
            />
          )}
        </ScrollRegion>

        <ChatComposer
          ref={inputRef}
          placeholder={needsAgent ? 'Choose an agent above to start chatting' : data.composer.placeholder}
          hint={
            needsAgent
              ? 'Pick one of your published agents — the chat runs on its configuration.'
              : data.composer.hint
          }
          onSend={send}
          streaming={session.isBusy}
          onStop={session.stop}
          disabled={needsAgent || session.phase === 'creating'}
          attachments={attachments.uploads}
          onAttach={onAttach}
        />
      </ChatArea>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this chat?"
        message="This chat will be removed from your history. This can't be undone."
        confirmLabel="Delete chat"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </ViewRoot>
  );
}
