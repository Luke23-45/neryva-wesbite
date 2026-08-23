import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { ActionLink } from './LinkAction.styles';

type Props = {
  children: ReactNode;
  /** Internal route — renders a router <Link>. */
  to?: string;
  /** External URL — renders an <a>. */
  href?: string;
  onClick?: () => void;
  /** Trailing arrow (default true). */
  arrow?: boolean;
};

/**
 * The quiet inline action — "View all →" — used inside panel headers
 * and section titles across the apps.
 */
export function LinkAction({ children, to, href, onClick, arrow = true }: Props) {
  const content = (
    <>
      {children}
      {arrow && <ArrowRight size={11} strokeWidth={1.8} aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <ActionLink as={Link} to={to}>
        {content}
      </ActionLink>
    );
  }
  if (href) {
    return (
      <ActionLink href={href} target="_blank" rel="noreferrer">
        {content}
      </ActionLink>
    );
  }
  return (
    <ActionLink as="button" type="button" onClick={onClick}>
      {content}
    </ActionLink>
  );
}
