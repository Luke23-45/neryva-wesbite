import styled from 'styled-components';

/**
 * Samples gallery — redesigned.
 *
 * A three-source gallery (template starters, org agents, scaffold)
 * where every row is a theme-owned card: readable label, locked
 * provenance note, and an honest disabled state for rows with no text.
 */

export const Gallery = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
`;

export const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SampleRow = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const SampleDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  flex: none;
  margin-top: 4px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const SampleMain = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

export const SampleLabel = styled.span`
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
`;

export const SampleBlurb = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;

export const SampleNote = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  padding-top: 2px;
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 2px;
`;

export const ToggleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

export const ToggleTitle = styled.div`
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ToggleSub = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;

export const Excerpt = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const RowError = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
  line-height: 1.6;
`;

export const DeniedNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.65;
  padding: 14px 16px;
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const SamplesToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 0;
  background: ${({ theme }) => theme.app.status.info.bg};
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
  font-family: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const ToggleLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const SamplesMeta = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 400;
  opacity: 0.8;
`;

export const SamplesBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;
