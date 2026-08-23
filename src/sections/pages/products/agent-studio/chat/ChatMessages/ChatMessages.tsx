import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

export type Message = {
  id: string;
  role: 'user' | 'agent';
  text: string;
};

type Suggestion = { icon: string; label: string };

type Props = {
  messages?: Message[];
  isTyping?: boolean;
  suggestions?: Suggestion[];
  onSuggestionClick?: (text: string) => void;
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

export function ChatMessages({ messages = [], isTyping, suggestions = [], onSuggestionClick }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isTyping]);

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
          <Bubble
            key={m.id}
            $role={m.role}
            as={motion.div}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: ease.premium }}
          >
            <BubbleMeta>{m.role === 'user' ? 'You' : 'Neryva'}</BubbleMeta>
            <BubbleText>{m.text}</BubbleText>
          </Bubble>
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
        <div ref={bottomRef} aria-hidden="true" />
      </MessageList>
      {onSuggestionClick && suggestions.length > 0 && (
        <SuggestionInline>
          {suggestions.slice(0, 2).map((s) => (
            <SuggestionChip key={s.label} type="button" onClick={() => onSuggestionClick(s.label)}>
              {s.label}
            </SuggestionChip>
          ))}
        </SuggestionInline>
      )}
    </>
  );
}
