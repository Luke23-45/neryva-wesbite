import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FileText, Square } from 'lucide-react';
import { ease } from '@styles/motion';
import type { AttachmentUpload } from '@hooks/studio/useAttachmentUpload';
import {
  ComposerWrap,
  FieldShell,
  PlusButton,
  Input,
  SendButton,
  StopSpinner,
  HintRow,
} from './ChatComposer.styles';

const statusLabel: Record<AttachmentUpload['status'], string> = {
  uploading: 'uploading',
  processing: 'processing',
  ready: 'ready',
  failed: 'failed',
  quarantined: 'quarantined',
};

/** Auto-size cap — beyond this the composer scrolls internally. */
const MAX_COMPOSER_HEIGHT = 160;

type Props = {
  placeholder: string;
  hint: string;
  onSend?: (text: string) => void;
  /** A run is in flight — send becomes stop. */
  streaming?: boolean;
  onStop?: () => void;
  /** A3-25 — the cancel is in flight; the button shows Stopping… */
  stopping?: boolean;
  disabled?: boolean;
  attachments?: AttachmentUpload[];
  onAttach?: (file: File | null | undefined) => void;
};

/**
 * A3-48 — the composer is an auto-sizing textarea: Enter sends,
 * Shift+Enter inserts a newline (the old single-line input swallowed it).
 * A3-49 — Escape stops a running turn.
 */
export const ChatComposer = forwardRef<HTMLTextAreaElement, Props>(
  ({ placeholder, hint, onSend, streaming = false, onStop, stopping = false, disabled = false, attachments = [], onAttach }, ref) => {
    const [value, setValue] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);
    const areaRef = useRef<HTMLTextAreaElement | null>(null);
    const canSend = value.trim().length > 0 && !disabled && !streaming;

    const setAreaRef = (element: HTMLTextAreaElement | null) => {
      areaRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    // Auto-size: grow with content up to the cap, then scroll internally.
    useEffect(() => {
      const element = areaRef.current;
      if (!element) return;
      element.style.height = 'auto';
      element.style.height = `${Math.min(element.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
    }, [value]);

    const submit = () => {
      const trimmed = value.trim();
      if (!trimmed || streaming || disabled) return;
      onSend?.(trimmed);
      setValue('');
      // The send button steals focus on click — hand it back to the composer.
      areaRef.current?.focus();
    };

    const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      } else if (e.key === 'Escape' && streaming) {
        e.preventDefault();
        onStop?.();
      }
    };

    return (
      <ComposerWrap>
        {attachments.length > 0 && (
          <AttachmentStrip role="list" aria-label="Attachments">
            {attachments.map((a) => (
                <AttachmentChip key={a.sessionId} $failed={a.status === 'failed' || a.status === 'quarantined'} role="listitem">
                  <FileText size={11} strokeWidth={1.8} aria-hidden="true" />
                  <span>{a.filename}</span>
                  <AttachmentState title={a.lastError ?? undefined}>{statusLabel[a.status]}</AttachmentState>
                </AttachmentChip>
            ))}
          </AttachmentStrip>
        )}
        <FieldShell
          as={motion.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: ease.premium, delay: 0.3 }}
        >
          <PlusButton
            aria-label="Attach a file"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </PlusButton>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            onChange={(e) => {
              onAttach?.(e.target.files?.[0]);
              e.target.value = '';
            }}
            aria-label="Attachment file"
          />

          <Input
            ref={setAreaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label="Message"
            disabled={disabled}
            rows={1}
          />

          {streaming ? (
            <SendButton
              type="button"
              aria-label={stopping ? 'Stopping the run' : 'Stop the run'}
              $enabled
              onClick={() => onStop?.()}
              disabled={stopping}
              title={stopping ? 'Stopping…' : undefined}
            >
              {stopping ? <StopSpinner aria-hidden="true" /> : <Square size={12} strokeWidth={2} fill="currentColor" />}
            </SendButton>
          ) : (
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
          )}
        </FieldShell>

        <HintRow>{hint}</HintRow>
      </ComposerWrap>
    );
  },
);

ChatComposer.displayName = 'ChatComposer';

const AttachmentStrip = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0 4px 8px;
`;

const AttachmentChip = styled.span<{ $failed: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  background: ${({ $failed, theme }) => ($failed ? theme.app.status.error.bg : theme.app.surface.tint)};
  border: 1px solid ${({ $failed, theme }) => ($failed ? theme.app.status.error.border : theme.app.border.default)};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.micro};
  max-width: 260px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const AttachmentState = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.ghost};
`;
