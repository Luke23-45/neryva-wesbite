import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { StyledTextLink, Arrow } from './TextLink.styles';

interface TextLinkProps {
  children: ReactNode;
  to: string;
  external?: boolean;
}

export function TextLink({ children, to, external = false }: TextLinkProps) {
  if (external) {
    return (
      <StyledTextLink href={to} target="_blank" rel="noopener noreferrer">
        {children}
        <Arrow className="text-link-arrow">
          <ArrowRight size={14} />
        </Arrow>
      </StyledTextLink>
    );
  }

  return (
    <StyledTextLink as={Link} to={to}>
      {children}
      <Arrow className="text-link-arrow">
        <ArrowRight size={14} />
      </Arrow>
    </StyledTextLink>
  );
}
