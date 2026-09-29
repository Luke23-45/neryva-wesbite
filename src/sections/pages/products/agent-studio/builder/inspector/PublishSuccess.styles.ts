import styled from 'styled-components';

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
