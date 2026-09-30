import styled from 'styled-components';

/**
 * Overview screen chrome (configure-first redesign).
 *
 * Quiet card surfaces on the dark app system. No progress rings, no
 * percentages, no invented metrics — every number is derived from the
 * readiness rows, the projector statuses, or the version list.
 */

export const Page = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 32px 48px;
  /* Hidden scrollbars — wheel/touch/keyboard keep working. */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const PageInner = styled.div`
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PageTitle = styled.h1`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.app.type.pageTitle};
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const PageSub = styled.p`
  margin: 0 0 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const Card = styled.section`
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 18px 20px;
`;

export const CardTitle = styled.h2`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const CardSummary = styled.p<{ $tone: 'ok' | 'bad' | 'muted' }>`
  margin: 0 0 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme, $tone }) =>
    $tone === 'ok'
      ? theme.app.status.success.fg
      : $tone === 'bad'
        ? theme.app.status.error.fg
        : theme.app.text.muted};
`;

export const RetryButton = styled.button`
  margin-top: 8px;
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const GroupRow = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 4px;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: transparent;
  color: ${({ theme }) => theme.app.text.body};
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;
  text-align: left;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const GroupName = styled.span`
  flex: 1;
  min-width: 0;
  font-weight: 550;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const GroupCount = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

export const Chevron = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.faint};
  svg {
    display: block;
  }
`;

export const VersionGrid = styled.dl`
  margin: 12px 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const VersionTerm = styled.dt`
  color: ${({ theme }) => theme.app.text.muted};
`;

export const VersionValue = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 550;
`;

export const DraftPill = styled.span<{ $tone?: 'info' | 'neutral' }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'neutral' ? theme.app.status.neutral.border : theme.app.status.info.border};
  background: ${({ theme, $tone }) =>
    $tone === 'neutral' ? theme.app.status.neutral.bg : theme.app.status.info.bg};
  color: ${({ theme, $tone }) =>
    $tone === 'neutral' ? theme.app.status.neutral.fg : theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
`;
