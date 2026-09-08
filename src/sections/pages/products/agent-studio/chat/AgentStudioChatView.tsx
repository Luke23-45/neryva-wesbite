import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useUiStore } from '@store/uiStore';
import { ease } from '@styles/motion';
import workspaceData from '@neryva_data/products/agent_studio_chat/workspace.json';
import { useChatSession, useConversationMessages, useConversationStatus, type RunNotice } from '@hooks/studio/useChat';
import { useAttachmentUpload } from '@hooks/studio/useAttachmentUpload';
import { useAssistants } from '@hooks/studio/useAssistants';

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
} from './AgentStudioChatView.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: ease.premium, delay: custom * 0.08 },
  }),
};

function titleFromRecord(raw: unknown): string | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  for (const key of ['title', 'name', 'summary']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

export function AgentStudioChatView() {
  const { setHeaderTheme } = useUiStore();
  const navigate = useNavigate();
  // ?chat=<id> opens a thread (sidebar recents, S-4); ?agent=<id> binds new
  // threads to an agent (agent detail "Test", A-5).
  const search = useSearch({ strict: false }) as { chat?: string; agent?: string };
  const conversationId = search.chat ?? null;
  const boundAgentId = search.agent ?? null;

  const [bannerVisible, setBannerVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const session = useChatSession(conversationId, boundAgentId);
  const transcript = useConversationMessages(conversationId);
  const conversation = useConversationStatus(conversationId);
  const assistants = useAssistants();
  const attachments = useAttachmentUpload();

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

  const agentName = assistants.data?.find((a) => a.id === boundAgentId)?.name ?? null;

  const startNewThread = () => {
    session.reset();
    attachments.reset();
    navigate({ to: '/agent-studio/chat', search: { agent: boundAgentId ?? undefined } });
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

  const onAttach = (file: File | null | undefined) => {
    if (!file) return;
    void attachments.attach(file).then((sessionId) => {
      if (sessionId === null) {
        toast.error(`${file.name} could not be attached`);
      }
    });
  };

  const typing = session.phase === 'streaming' || session.phase === 'sending' || session.phase === 'creating';

  return (
    <ViewRoot>
      <ChatHeader
        title={titleFromRecord(conversation.data) ?? 'New thread'}
        agentName={agentName}
        streaming={session.phase === 'streaming'}
        onNewThread={startNewThread}
      />
      <ChatArea>
        <ScrollRegion>
          {messages.length === 0 ? (
            <>
              <GreetingBlock as={motion.div} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} custom={1}>
                  <GreetingTitle>{data.greeting.title}</GreetingTitle>
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

              <ChatMessages suggestions={data.suggestions} onSuggestionClick={send} />
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
          placeholder={data.composer.placeholder}
          hint={data.composer.hint}
          onSend={send}
          streaming={session.isBusy}
          onStop={session.stop}
          disabled={session.phase === 'creating'}
          attachments={attachments.uploads}
          onAttach={onAttach}
        />
      </ChatArea>
    </ViewRoot>
  );
}
