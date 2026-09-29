import styled from 'styled-components';

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';

/**
 * Role section — redesigned.
 *
 * Field anatomy (FieldBlock/FieldHead/FieldTitle/FieldHelper) is shared
 * across the builder via InstructionsSection.styles; Role owns only its
 * tag editor and persona card.
 */

/* ── Tag-list editor ───────────────────────────────────────────── */

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.px14};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appTight};
`;

export const TagText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TagRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.app.iconSize.md};
  height: ${({ theme }) => theme.app.iconSize.md};
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.title};
  line-height: ${({ theme }) => theme.typography.lineHeights.appTight};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const TagAddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: center;
`;

export const TagCount = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

/* ── Viewer: the persona card ──────────────────────────────────── */

export const PersonaCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px18};
  padding: ${({ theme }) => theme.spacing.s5};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const PersonaName = styled.div`
  font-size: ${({ theme }) => theme.app.type.titleLg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const PersonaGoal = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  overflow-wrap: anywhere;
`;

export const PersonaGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const PersonaLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const PersonaText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  overflow-wrap: anywhere;
`;

export const PersonaChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const PersonaChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.bg.base};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appTight};
`;

export const PersonaNote = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;
