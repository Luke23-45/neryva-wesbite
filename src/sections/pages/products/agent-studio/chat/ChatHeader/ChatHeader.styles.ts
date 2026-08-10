import styled from 'styled-components';

export const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
`;

export const LeftCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

export const Crumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.45);

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const Crumb = styled.span`
  &:last-child {
    color: rgba(229, 231, 235, 0.78);
  }
`;

export const CrumbDivider = styled.span`
  color: rgba(229, 231, 235, 0.3);
`;

export const ModelButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  color: #f5f7fb;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.16);
  }
`;

export const ModelBadge = styled.span<{ $hue: 'emerald' | 'azure' | 'lilac' | 'amethyst' }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  color: #0b0d12;
  background: ${({ $hue }) =>
    $hue === 'emerald'
      ? '#05e3a4'
      : $hue === 'azure'
        ? '#93c5fd'
        : $hue === 'lilac'
          ? '#c084fc'
          : '#d8b4fe'};
`;

export const ModelName = styled.span`
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
`;

export const ModelChevron = styled.svg<{ $open: boolean }>`
  width: 13px;
  height: 13px;
  color: rgba(229, 231, 235, 0.55);
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
  transition: transform ${({ theme }) => theme.transitions.fast};
`;

export const RightCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const IconAction = styled.button`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgba(229, 231, 235, 0.55);
  border-radius: 8px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: #f5f7fb;
    background: rgba(255, 255, 255, 0.06);
  }
`;
