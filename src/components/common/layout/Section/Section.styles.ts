import styled from 'styled-components';

export const StyledSection = styled.section<{
  $paddingY?: 'sm' | 'md' | 'lg';
  $background?: string;
}>`
  width: 100%;
  padding-top: ${({ theme, $paddingY = 'md' }) =>
    $paddingY === 'sm' ? theme.spacing.s7
    : $paddingY === 'lg' ? theme.spacing.s10
    : theme.spacing.s9};
  padding-bottom: ${({ theme, $paddingY = 'md' }) =>
    $paddingY === 'sm' ? theme.spacing.s7
    : $paddingY === 'lg' ? theme.spacing.s10
    : theme.spacing.s9};
  background-color: ${({ $background }) => $background || 'transparent'};
`;
