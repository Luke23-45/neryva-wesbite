import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

/**
 * Ship section — redesigned.
 *
 * The publish ceremony: the verdict, readiness rows, the degraded
 * acknowledge, the confirm-gated publish, refusals with their fixes,
 * and the success receipt. Copy stays engine-verbatim; layout reads
 * at a real measure.
 */

export { Muted } from './TrySection.styles';

export const Verdict = styled.div<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: baseline;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  margin-bottom: ${({ theme }) => theme.spacing.px6};
  color: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.primary};
`;

export const Dot = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  width: ${({ theme }) => theme.spacing.px10};
  height: ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.round};
  flex: none;
  align-self: center;
  background: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.muted};
`;

export const Sub = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  margin-bottom: ${({ theme }) => theme.spacing.px10};
`;

export const FixLink = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: ${({ theme }) => theme.spacing.px2};
`;

export const RefusalLink = styled(Link)`
  font-size: ${({ theme }) => theme.app.type.caption};
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const Refusal = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s4};
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  background: ${({ theme }) => theme.app.status.error.bg};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const RefusalTitle = styled.strong`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const RefusalMessage = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px6};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const RefusalFix = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px10};
`;

export const Notice = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  margin-top: ${({ theme }) => theme.spacing.px10};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const AckLabel = styled.label`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: flex-start;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.primary};
  margin-top: ${({ theme }) => theme.spacing.s3};
`;

export const AckCheckbox = styled.input`
  margin-top: ${({ theme }) => theme.spacing.s1};
  width: ${({ theme }) => theme.spacing.px18};
  height: ${({ theme }) => theme.spacing.px18};
  flex: none;
  accent-color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const PublishBlock = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s4};
`;
