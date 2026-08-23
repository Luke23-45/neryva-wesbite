import styled from 'styled-components';

export const TotalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const TotalCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const TotalLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const TotalValue = styled.div`
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

export const SourceCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const KindIcon = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  flex-shrink: 0;
`;

export const SourceName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SourceUrl = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const KindPill = styled.span<{ $kind: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  background: ${({ $kind, theme }) =>
    $kind === 'url'
      ? theme.app.status.info.bg
      : $kind === 'file'
        ? theme.app.status.warning.bg
        : theme.app.status.lilac.bg};
  color: ${({ $kind, theme }) =>
    $kind === 'url'
      ? theme.app.status.info.fg
      : $kind === 'file'
        ? theme.app.status.warning.fg
        : theme.app.status.lilac.fg};
`;

export const SyncMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.4;
`;

export const SyncBy = styled.span`
  color: ${({ theme }) => theme.app.text.ghost};
`;

export const RowMenuButton = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 7px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

/* ─── Add-source modal ─── */

export const AddForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const AddLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const AddInput = styled.input`
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }

  &:focus {
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;
