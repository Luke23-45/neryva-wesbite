import styled from 'styled-components';

export const StyledContainer = styled.div<{ $variant?: 'page' | 'prose' | 'wide' }>`
  width: 100%;
  max-width: ${({ theme, $variant = 'page' }) =>
    $variant === 'prose' ? theme.containers.prose
    : $variant === 'wide' ? theme.containers.wide
    : theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    padding: 0 ${({ theme }) => theme.spacing.s4};
  }
`;
