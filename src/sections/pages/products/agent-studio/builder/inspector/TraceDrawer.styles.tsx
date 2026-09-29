import styled from 'styled-components';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';

/**
 * Trace drawer — redesigned.
 *
 * The drawer reports what a run saw: retrieval hits, the draft
 * directive, tool calls, guardrail verdicts, usage. Section titles
 * read in sentence case; rows are drawer-owned cards rather than
 * borrowed section primitives.
 */

export const TraceSection = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
  margin: ${({ theme }) => theme.spacing.px20} 0 ${({ theme }) => theme.spacing.s1};
`;

export const TraceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const TraceItem = styled.div`
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.px14};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const TraceMeta = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s1};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s2};
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.status.info.fg};
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StopBlock = styled.div<{ $tone: 'error' | 'warning' }>`
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
`;

export const StopHeadline = styled.div<{ $tone: 'error' | 'warning' }>`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.fg : theme.app.status.warning.fg)};
`;

export const StopDetail = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px6};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

const StreamingWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
  margin-top: ${({ theme }) => theme.spacing.s2};
`;

export function StreamingBubble() {
  return (
    <StreamingWrap role="status" aria-label="Streaming reply">
      <Skeleton $w="82%" />
      <Skeleton $w="64%" />
      <Skeleton $w="71%" />
    </StreamingWrap>
  );
}

/** Plain muted caption — for honest absence notes, never warnings. */
export const Note = styled.p`
  margin: ${({ theme }) => theme.spacing.s2} 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TraceActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s3};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.px20};
`;
