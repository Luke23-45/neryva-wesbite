import { forwardRef, useRef, useState, type KeyboardEvent } from 'react';
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
  HintRow,
} from './ChatComposer.styles';

const statusLabel: Record<AttachmentUpload['status'], string> = {
  uploading: 'uploading',
  processing: 'processing',
  ready: 'ready',
  failed: 'failed',
  quarantined: 'quarantined',
};

type Props = {
  placeholder: string;
  hint: string;
  onSend?: (text: string) => void;
  /** A run is in flight — send becomes stop. */
  streaming?: boolean;
  onStop?: () => void;
  disabled?: boolean;
  attachments?: AttachmentUpload[];
  onAttach?: (file: File | null | undefined) => void;
};

export const ChatComposer = forwardRef<HTMLInputElement, Props>(
  ({ placeholder, hint, onSend, streaming = false, onStop, disabled = false, attachments = [], onAttach }, ref) => {
    const [value, setValue] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);
    const canSend = value.trim().length > 0 && !disabled && !streaming;

    const submit = () => {
      const trimmed = value.trim();
      if (!trimmed || streaming || disabled) return;
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
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label="Message"
            disabled={disabled}
          />

          {streaming ? (
            <SendButton
              type="button"
              aria-label="Stop the run"
              $enabled
              onClick={() => onStop?.()}
            >
              <Square size={12} strokeWidth={2} fill="currentColor" />
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
