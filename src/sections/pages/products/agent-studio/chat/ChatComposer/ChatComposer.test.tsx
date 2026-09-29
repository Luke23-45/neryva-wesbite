// @vitest-environment jsdom
/**
 * H3 — attachment chip strip: every chip carries a real remove button
 * wired to onRemoveAttachment (the upload hook's dismiss), so a user at
 * the attachment cap can drop one and retry in the same thread. Without
 * the handler no remove control renders — never a dead affordance.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { ChatComposer } from './ChatComposer';
import type { AttachmentUpload } from '@hooks/studio/useAttachmentUpload';

const upload = (
  sessionId: string,
  filename: string,
  status: AttachmentUpload['status'] = 'ready',
): AttachmentUpload => ({
  sessionId,
  filename,
  size: 128,
  status,
  lastError: null,
  sourceSlug: null,
  versionOfSlug: null,
  touchedAt: 0,
});

const UPLOADS = [
  upload('sess-1', 'report.pdf'),
  upload('sess-2', 'notes.txt', 'uploading'),
  upload('sess-3', 'bad.png', 'failed'),
];

function renderComposer(
  overrides: {
    attachments?: AttachmentUpload[];
    onRemoveAttachment?: (sessionId: string) => void;
  } = {},
) {
  const onRemoveAttachment = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ChatComposer
        placeholder="Message"
        hint=""
        attachments={UPLOADS}
        onRemoveAttachment={onRemoveAttachment}
        {...overrides}
      />
    </ThemeProvider>,
  );
  return { onRemoveAttachment };
}

describe('ChatComposer attachment removal (H3)', () => {
  it('renders a remove button on every chip, named by filename', () => {
    renderComposer();
    expect(screen.getByRole('button', { name: 'Remove report.pdf' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove notes.txt' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove bad.png' })).toBeTruthy();
  });

  it('remove calls the handler with that chip\u2019s sessionId only', () => {
    const { onRemoveAttachment } = renderComposer();
    fireEvent.click(screen.getByRole('button', { name: 'Remove notes.txt' }));
    expect(onRemoveAttachment).toHaveBeenCalledTimes(1);
    expect(onRemoveAttachment).toHaveBeenCalledWith('sess-2');
  });

  it('failed chips are removable too — the strip never traps a terminal row', () => {
    const { onRemoveAttachment } = renderComposer();
    fireEvent.click(screen.getByRole('button', { name: 'Remove bad.png' }));
    expect(onRemoveAttachment).toHaveBeenCalledWith('sess-3');
  });

  it('renders no remove control when no handler is provided (no dead affordance)', () => {
    renderComposer({ onRemoveAttachment: undefined });
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
    // The chips themselves still render.
    expect(screen.getByText('report.pdf')).toBeTruthy();
  });

  it('renders no strip at all when there are no attachments', () => {
    renderComposer({ attachments: [] });
    expect(screen.queryByRole('list', { name: 'Attachments' })).toBeNull();
  });
});
