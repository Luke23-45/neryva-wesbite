import styled from 'styled-components';

export const StyledTag = styled.span<{ $color?: string }>`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.label};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: ${({ theme }) => theme.typography.lineHeights.label};
  color: ${({ theme, $color }) => $color || theme.colors.text.secondary};
  background-color: ${({ theme }) => theme.colors.surfaceHover};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: ${({ theme }) => `${theme.spacing.s1} ${theme.spacing.s2}`};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.label};
  text-transform: uppercase;
`;
