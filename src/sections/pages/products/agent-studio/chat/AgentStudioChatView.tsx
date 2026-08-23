import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { useUiStore } from '@store/uiStore';
import { ease } from '@styles/motion';
import workspaceData from '@neryva_data/products/agent_studio_chat/workspace.json';

import { ChatMessages, type Message } from './ChatMessages';
import { ChatComposer } from './ChatComposer';

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

const AGENT_REPLIES = [
  "Here's what I found — let me know if you'd like me to take this further.",
  "I've compiled the key points. Want a deeper breakdown or a different angle?",
  "Done — that should unblock the next step. Anything else?",
  'Quick context: this affects three downstream workflows. Want me to flag them?',
  'Drafted. Pick a tone — concise, formal, or exploratory — and I\'ll refine.',
];

export function AgentStudioChatView() {
  const { setHeaderTheme } = useUiStore();
  const [bannerVisible, setBannerVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyTimer = useRef<number | null>(null);
  const navigate = useNavigate();

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

  // Never leave a pending reply timer behind on unmount.
  useEffect(() => {
    return () => {
      if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    };
  }, []);

  const data = workspaceData.workspace;

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setIsTyping(true);
    const delay = 700 + Math.random() * 800;
    replyTimer.current = window.setTimeout(() => {
      const reply = AGENT_REPLIES[Math.floor(Math.random() * AGENT_REPLIES.length)];
      const agentMsg: Message = { id: String(Date.now() + 1), role: 'agent', text: reply };
      setMessages((m) => [...m, agentMsg]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <ViewRoot>
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
            <ChatMessages messages={messages} isTyping={isTyping} onSuggestionClick={send} />
          )}
        </ScrollRegion>

        <ChatComposer
          ref={inputRef}
          placeholder={data.composer.placeholder}
          mode={data.composer.mode}
          hint={data.composer.hint}
          onSend={send}
        />
      </ChatArea>
    </ViewRoot>
  );
}
