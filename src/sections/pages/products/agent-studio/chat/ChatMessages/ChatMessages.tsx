import { motion } from 'framer-motion';
import {
  MessagesArea,
  EmptyState,
  SuggestionList,
  SuggestionItem,
  SuggestionIconWrap,
  SuggestionLabel,
} from './ChatMessages.styles';

type Suggestion = { icon: string; label: string };

type Props = {
  suggestions: Suggestion[];
};

const premiumEase = [0.16, 1, 0.3, 1] as const;

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

export function ChatMessages({ suggestions }: Props) {
  return (
    <MessagesArea>
      <EmptyState>
        <SuggestionList>
          {suggestions.map((s, i) => (
            <SuggestionItem
              key={s.label}
              as={motion.button}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: premiumEase, delay: 0.35 + i * 0.07 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
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
    </MessagesArea>
  );
}
