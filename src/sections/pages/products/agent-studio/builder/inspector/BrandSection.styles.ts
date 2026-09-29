import styled from 'styled-components';

/**
 * Brand section — redesigned.
 *
 * Voice is singular: the section is a writing desk, not a form. One
 * generous textarea, a progressive-disclosure writing guide, and a
 * reading card for viewers.
 */

export const GuideBox = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 14px;
  padding: 8px 18px 16px;
`;

export const GuideToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  letter-spacing: -0.005em;
  font-family: inherit;
  cursor: pointer;
  padding: 10px 0 6px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const GuideChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.muted};
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
  transition: transform ${({ theme }) => theme.transitions.fast};
`;

export const GuideBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.65;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: 600;
  }
`;

export const DefaultNote = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 14px;
  padding: 18px 20px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;

/** Viewer: the voice as a reading card. */
export const VoiceCard = styled.figure`
  margin: 0;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const VoiceLabel = styled.figcaption`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const VoiceText = styled.blockquote`
  margin: 0;
  font-size: 16px;
  line-height: 1.65;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const VoiceEmpty = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.faint};
  font-style: italic;
`;
