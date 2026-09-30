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
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.px18} ${({ theme }) => theme.spacing.s4};
`;

export const GuideToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s2};
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  font-family: inherit;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.px10} 0 ${({ theme }) => theme.spacing.px6};

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
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
  padding-top: ${({ theme }) => theme.spacing.px6};

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
  }
`;

export const DefaultNote = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/** Viewer: the voice as a reading card. */
export const VoiceCard = styled.figure`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.s5};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const VoiceLabel = styled.figcaption`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const VoiceText = styled.blockquote`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const VoiceEmpty = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.faint};
  font-style: italic;
`;

/** One-line explainer: what brand voice is and where it lands. Quiet by
 * design — the textarea is the desk, this is the plaque on it. */
export const Explainer = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.s3};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;
