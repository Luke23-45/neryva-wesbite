import styled from 'styled-components';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const FilterRow = styled.div`
  display: flex;
  margin-bottom: 18px;
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
    background: ${({ theme }) => theme.app.surface.tint};
  }
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const Icon = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: ${({ $color }) => $color};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const CardName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CardCategory = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const CardDescription = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const CardFoot = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
`;

export const StatusText = styled.span<{ $connected?: boolean }>`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ $connected, theme }) =>
    $connected ? theme.app.text.secondary : theme.app.text.faint};
  flex: 1;
`;

export const PanelCopy = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

/**
 * Connect-modal scope picker. Each row is a toggle with an iOS-style
 * leading check indicator.
 */
