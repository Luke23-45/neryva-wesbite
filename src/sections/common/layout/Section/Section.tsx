import type { ReactNode } from 'react';
import { StyledSection } from './Section.styles';

type PaddingValue = 'sm' | 'md' | 'lg' | 'none';

interface SectionProps {
  children: ReactNode;
  paddingY?: PaddingValue;
  paddingYTop?: PaddingValue;
  paddingYBottom?: PaddingValue;
  background?: string;
  id?: string;
}

export function Section({ children, paddingY = 'md', paddingYTop, paddingYBottom, background, id }: SectionProps) {
  return (
    <StyledSection
      $paddingY={paddingY}
      $paddingYTop={paddingYTop}
      $paddingYBottom={paddingYBottom}
      $background={background}
      id={id}
    >
      {children}
    </StyledSection>
  );
}
