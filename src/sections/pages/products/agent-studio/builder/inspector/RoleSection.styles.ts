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
  gap: 8px;
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 6px 8px 6px 14px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.4;
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
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: 15px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const TagAddRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const TagCount = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-variant-numeric: tabular-nums;
`;

/* ── Viewer: the persona card ──────────────────────────────────── */

export const PersonaCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const PersonaName = styled.div`
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const PersonaGoal = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
  overflow-wrap: anywhere;
`;

export const PersonaGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PersonaLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const PersonaText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
  overflow-wrap: anywhere;
`;

export const PersonaChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const PersonaChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.bg.base};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.4;
`;

export const PersonaNote = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
`;
