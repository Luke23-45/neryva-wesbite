import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { actionButtonCss, type ActionSize, type ActionVariant } from './ActionButton.styles';

/**
 * A real anchor wearing ActionButton chrome.
 *
 * Prefer this over `<ActionButton as={Link}>`: styled-components would
 * need the `to` prop threaded through a polymorphic button, and a
 * navigation is not a button. Navigation must be a link so it opens in a
 * new tab, announces as a link, and is reachable by keyboard as one.
 *
 * Promoted to the kit from a private copy in TeamsView.
 */
export const ActionButtonLink = styled(Link)<{
  $size: ActionSize;
  $variant: ActionVariant;
}>`
  ${actionButtonCss}
  text-decoration: none;
`;