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
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const Crumb = styled.span`
  &:last-child {
    color: ${({ theme }) => theme.app.text.secondary};
  }
`;

export const CrumbDivider = styled.span`
  color: ${({ theme }) => theme.app.text.ghost};
`;

export const ModelButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 8px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.surface.tint};
  border-radius: 10px;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  color: ${({ theme }) => theme.app.text.primary};
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
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
  color: ${({ theme }) => theme.app.text.inverse};
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
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  letter-spacing: -0.005em;
  white-space: nowrap;
`;

export const ModelChevron = styled.svg<{ $open: boolean }>`
  width: 13px;
  height: 13px;
  color: ${({ theme }) => theme.app.text.muted};
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
  transition: transform ${({ theme }) => theme.transitions.fast};
`;

export const ModelOptionName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
`;
