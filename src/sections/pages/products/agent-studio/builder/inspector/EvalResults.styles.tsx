import styled from 'styled-components';

/**
 * Eval results — redesigned.
 *
 * The shared verdict view: stale banner first, decision pills,
 * required and optional checks, failing cases, provenance.
 * Rows are eval-owned cards with sentence-case sections.
 */

export const EvalSection = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
  margin: ${({ theme }) => theme.spacing.px20} 0 ${({ theme }) => theme.spacing.s1};
`;

export const EvalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const EvalItem = styled.div`
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const EvalMeta = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s1};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const StaleBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
`;

export const StaleHeadline = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const StaleDetail = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px6};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ShadowBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.status.info.fg};
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px dashed ${({ theme }) => theme.app.status.info.border};
`;

export const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.s3};
`;

export const ScoreLine = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const FinishedAt = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const Undecided = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
`;

export const CheckRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: baseline;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  margin-top: ${({ theme }) => theme.spacing.s2};
`;

export const CheckMark = styled.span<{ $pass: boolean }>`
  flex: none;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme, $pass }) => ($pass ? theme.app.status.success.fg : theme.app.status.error.fg)};
`;

export const CaseCard = styled.div`
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
`;

export const CaseExcerpt = styled.div`
  color: ${({ theme }) => theme.app.text.secondary};
  font-style: italic;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const CopyRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px10};
`;

export const EvalActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
`;
