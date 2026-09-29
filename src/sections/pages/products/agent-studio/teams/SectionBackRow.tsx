import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

/**
 * Back row for dedicated Teams sections — styled after NavBackButton
 * (StudioShell.styles.ts) but wired as a TanStack Router Link. Single
 * chevron ‹, weight 600, 8px radius. Browser back works free via router
 * history; this is the explicit visual affordance.
 */
export const SectionBackRow = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: transparent;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  span[aria-hidden='true'] {
    font-size: 1.1em;
    line-height: 1;
  }
`;
