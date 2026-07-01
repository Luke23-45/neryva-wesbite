import type { ReactNode } from 'react';
import { StyledContainer } from './Container.styles';

interface ContainerProps {
  children: ReactNode;
  variant?: 'page' | 'prose' | 'wide';
}

export function Container({ children, variant = 'page' }: ContainerProps) {
  return <StyledContainer $variant={variant}>{children}</StyledContainer>;
}
