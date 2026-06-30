import type { ReactNode } from 'react';
import { StyledTag } from './Tag.styles';

interface TagProps {
  children: ReactNode;
  color?: string;
}

export function Tag({ children, color }: TagProps) {
  return <StyledTag $color={color}>{children}</StyledTag>;
}
