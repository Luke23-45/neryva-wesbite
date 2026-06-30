import type { ReactNode } from 'react';
import { StyledSection } from './Section.styles';

interface SectionProps {
  children: ReactNode;
  paddingY?: 'sm' | 'md' | 'lg';
  background?: string;
  id?: string;
}

export function Section({ children, paddingY = 'md', background, id }: SectionProps) {
  return (
    <StyledSection $paddingY={paddingY} $background={background} id={id}>
      {children}
    </StyledSection>
  );
}
