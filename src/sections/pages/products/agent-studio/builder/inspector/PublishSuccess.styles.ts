import styled from 'styled-components';
import { createLink } from '@tanstack/react-router';

/**
 * Publish success receipt — redesigned.
 *
 * Shared by the ship section and the detail panel. The receipt is a
 * calm success surface: the headline, the provenance lines, exits,
 * and the audit promise.
 */

export const Receipt = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  background: ${({ theme }) => theme.app.status.success.bg};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  margin-top: ${({ theme }) => theme.spacing.s4};
`;

export const Headline = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.status.success.fg};
`;

export const Lines = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const Exits = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.px10};
  margin-top: ${({ theme }) => theme.spacing.px14};
`;

export const Footer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s3};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/**
 * Footer navigation links (DS-21) — flow-critical exits on the publish
 * receipt, so they get the 44px text-button treatment (Wave B InlineRetry
 * precedent): inline-size text vertically centered in a 44px target, with
 * the link treatment otherwise unchanged. Built with createLink rather than
 * styled(Link): the styled() wrapper erases the route's search-param
 * inference, so `search={{ agent }}` would lose type checking.
 */
const FooterAnchor = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
`;
export const FooterLink = createLink(FooterAnchor);
