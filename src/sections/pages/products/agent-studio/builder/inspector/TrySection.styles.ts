import styled from 'styled-components';

/**
 * Try console — redesigned.
 *
 * The conversation surface: a readable thread, calm prerequisite
 * blocks, and an input dock. Bubbles carry body text at a real
 * measure; the dock is the section's single action surface.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';

export const Thread = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const TurnGroup = styled.div`
  display: contents;
`;

export const Bubble = styled.div<{ $role: 'user' | 'agent' }>`
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 92%;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  white-space: pre-wrap;
  word-break: break-word;
  background: ${({ $role, theme }) => ($role === 'user' ? theme.app.surface.active : 'transparent')};
`;

export const BubbleMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.ghost};
  margin-bottom: ${({ theme }) => theme.spacing.s1};
`;

export const NoticePill = styled.span<{ $tone: 'tool' | 'usage' | 'status' | 'error' | 'approval' }>`
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme, $tone }) =>
    $tone === 'error'
      ? theme.app.status.error.fg
      : $tone === 'usage'
        ? theme.app.text.secondary
        : theme.app.status.info.fg};
  background: ${({ theme, $tone }) =>
    $tone === 'error'
      ? theme.app.status.error.bg
      : $tone === 'usage'
        ? theme.app.surface.subtle
        : theme.app.status.info.bg};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'error'
        ? theme.app.status.error.border
        : $tone === 'usage'
          ? theme.app.border.default
          : theme.app.status.info.border};
`;

export const PrereqBlock = styled.div<{ $tone: 'block' | 'advisory' }>`
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
`;

export const PrereqHeadline = styled.div<{ $tone: 'block' | 'advisory' }>`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.fg : theme.app.status.warning.fg)};
`;

export const PrereqDetail = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px6};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

/**
 * Limit-hit panel: the run was refused with `quota_exceeded`.
 */
export const QuotaPanel = styled.div`
  align-self: flex-start;
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  background: ${({ theme }) => theme.app.status.error.bg};
`;

export const QuotaTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const QuotaCopy = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px6};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const QuotaCtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s3};
  margin-top: ${({ theme }) => theme.spacing.s3};

  a {
    color: ${({ theme }) => theme.app.status.info.fg};
    font-size: ${({ theme }) => theme.app.type.body};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const DockRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.s3};
`;

export const Muted = styled.p`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;
