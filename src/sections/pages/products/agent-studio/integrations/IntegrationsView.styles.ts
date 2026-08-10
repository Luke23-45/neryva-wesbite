import styled from 'styled-components';

export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: #f5f7fb;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.55);
`;

export const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  margin-bottom: 18px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  width: fit-content;
`;

export const Tab = styled.button<{ $active: boolean }>`
  border: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 7px;
  color: ${({ $active }) => ($active ? '#0b0d12' : 'rgba(229, 231, 235, 0.7)')};
  background: ${({ $active }) => ($active ? '#f5f7fb' : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ $active }) => ($active ? '#0b0d12' : '#f5f7fb')};
  }
`;

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

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const CardName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const CardCategory = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const CardDescription = styled.div`
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.6);
`;

export const CardFoot = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
`;

export const StatusDot = styled.span<{ $connected: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $connected }) => ($connected ? '#34d399' : 'rgba(229, 231, 235, 0.4)')};
`;

export const StatusText = styled.span<{ $connected: boolean }>`
  font-size: 12px;
  color: ${({ $connected }) =>
    $connected ? 'rgba(229, 231, 235, 0.78)' : 'rgba(229, 231, 235, 0.45)'};
  flex: 1;
`;

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #f5f7fb;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.10);
    border-color: rgba(255, 255, 255, 0.18);
  }
`;

/**
 * Connect-modal scope picker. Each row is a row-style toggle with an
 * iOS-style leading dot indicator. Used by the "Connect {service}"
 * modal to show OAuth-style permission grants.
 */
export const ScopeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ScopeItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 13px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: #f5f7fb;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
`;

/**
 * iOS-style leading checkmark indicator. Toggles between an empty
 * outlined circle and a filled accent gradient with a check glyph —
 * the same shape as iOS list-row selection indicators.
 */
export const ScopeDot = styled.span<{ $on: boolean }>`
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $on }) => ($on ? '#fff' : 'transparent')};
  background: ${({ $on }) =>
    $on
      ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
      : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid
    ${({ $on }) => ($on ? 'transparent' : 'rgba(255, 255, 255, 0.10)')};
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.standard},
    color ${({ theme }) => theme.transitions.standard},
    border-color ${({ theme }) => theme.transitions.standard};
`;
