import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposerWrap,
  FieldShell,
  PlusButton,
  Input,
  ModeBadge,
  SendButton,
  HintRow,
} from './ChatComposer.styles';

type Props = {
  placeholder: string;
  mode: string;
  hint: string;
};

const premiumEase = [0.16, 1, 0.3, 1] as const;

export function ChatComposer({ placeholder, mode, hint }: Props) {
  const [value, setValue] = useState('');

  return (
    <ComposerWrap>
      <FieldShell
        as={motion.div}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: premiumEase, delay: 0.3 }}
        $focused={value.length > 0}
      >
        <PlusButton aria-label="Attach file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </PlusButton>

        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Message"
        />

        <ModeBadge aria-label={`Mode: ${mode}`}>
          {mode}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ModeBadge>

        <SendButton
          as={motion.button}
          aria-label="Send message"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.95 }}
          $enabled={value.trim().length > 0}
          disabled={value.trim().length === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12l7-7 7 7"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SendButton>
      </FieldShell>

      <HintRow>{hint}</HintRow>
    </ComposerWrap>
  );
}
