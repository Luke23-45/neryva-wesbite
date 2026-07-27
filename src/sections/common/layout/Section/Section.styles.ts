import styled from 'styled-components';

type PaddingValue = 'sm' | 'md' | 'lg' | 'none';

const resolvePadding = (value: PaddingValue, theme: { spacing: { s7: string; s9: string; s10: string } }) =>
  value === 'none' ? '0'
  : value === 'sm' ? theme.spacing.s7
  : value === 'lg' ? theme.spacing.s10
  : theme.spacing.s9;

export const StyledSection = styled.section<{
  $paddingY?: PaddingValue;
  $paddingYTop?: PaddingValue;
  $paddingYBottom?: PaddingValue;
  $background?: string;
}>`
  width: 100%;
  padding-top: ${({ theme, $paddingYTop, $paddingY = 'md' }) =>
    $paddingYTop ? resolvePadding($paddingYTop, theme) : resolvePadding($paddingY, theme)};
  padding-bottom: ${({ theme, $paddingYBottom, $paddingY = 'md' }) =>
    $paddingYBottom ? resolvePadding($paddingYBottom, theme) : resolvePadding($paddingY, theme)};
  background-color: ${({ $background }) => $background || 'transparent'};
`;
