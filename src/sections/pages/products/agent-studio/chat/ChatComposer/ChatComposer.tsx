import { forwardRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ease } from '@styles/motion';
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
  onSend?: (text: string) => void;
};

export const ChatComposer = forwardRef<HTMLInputElement, Props>(
  ({ placeholder, mode, hint, onSend }, ref) => {
    const [value, setValue] = useState('');
    const canSend = value.trim().length > 0;

    const submit = () => {
      const trimmed = value.trim();
      if (!trimmed) return;
      onSend?.(trimmed);
      setValue('');
    };

    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    };

    return (
      <ComposerWrap>
        <FieldShell
          as={motion.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: ease.premium, delay: 0.3 }}
        >
          <PlusButton aria-label="Attach file" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </PlusButton>

          <Input
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label="Message"
          />

          <ModeBadge aria-label={`Response mode: ${mode}`}>{mode}</ModeBadge>

          <SendButton
            type="button"
            aria-label="Send message"
            $enabled={canSend}
            disabled={!canSend}
            onClick={submit}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  },
);

ChatComposer.displayName = 'ChatComposer';
