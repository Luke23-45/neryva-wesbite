import styled from 'styled-components';

/**
 * InstructionsSection extras — the server-compiled prompt card and the
 * read-only view. Field cards, the focused editor, and the page shell all
 * come from section-ui; the shared Whisper/AddRow/AddHint/CounterRow live in
 * InstructionsSection.styles (shared across builder sections).
 */

export const CompiledCard = styled.div`
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const CompiledHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.s2};
  flex-wrap: wrap;
`;

export const CompiledTitle = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
`;

export const CompiledMeta = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const CompiledHelper = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const CompiledText = styled.pre`
  margin: 0;
  max-height: 360px;
  overflow-y: auto;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  padding: 12px 14px;
  white-space: pre-wrap;
  overflow-wrap: break-word;

  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.app.border.strong} transparent;
`;

export const CompiledEmpty = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  padding: 8px 0;
`;

export const ReadCard = styled.div`
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 16px;
`;

export const ReadText = styled.pre`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  line-height: 1.7;
  color: ${({ theme }) => theme.app.text.body};
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;
