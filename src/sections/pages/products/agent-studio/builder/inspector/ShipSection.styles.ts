import styled from 'styled-components';
import { createLink } from '@tanstack/react-router';

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
  padding: 0 4px;
  /* DS-14: 44px hit area without changing the visual design — the text
   * stays body-size, vertically centered in the taller target (Wave B
   * HitTextButton/InlineRetry precedent). */
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: ${({ theme }) => theme.spacing.px2};
`;

/**
 * Refusal fix-jump links (DS-21) — the recovery path after a publish
 * refusal, so they get the 44px text-button treatment (Wave B InlineRetry
 * precedent): inline-size text vertically centered in a 44px target, with
 * the link treatment otherwise unchanged. Built with createLink rather
 * than styled(Link): the styled() wrapper erases the route's search-param
 * inference.
 */
const RefusalAnchor = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: ${({ theme }) => theme.app.type.caption};
`;
export const RefusalLink = createLink(RefusalAnchor);

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

/**
 * DS-17: read failures use the error tone (Evaluation's read-failure
 * precedent); the default warning tone stays for neutral status notes.
 */
export const Notice = styled.div<{ $tone?: 'warning' | 'error' }>`
  font-size: ${({ theme }) => theme.app.type.body};
  margin-top: ${({ theme }) => theme.spacing.px10};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ $tone, theme }) =>
    $tone === 'error' ? theme.app.status.error.fg : theme.app.status.warning.fg};
`;

/** Screen-reader-only text — layout never shifts for it. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
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
