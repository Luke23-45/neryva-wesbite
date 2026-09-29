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
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 20px 0 4px;
`;

export const TraceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TraceItem = styled.div`
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 12px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: 1.65;
`;

export const TraceMeta = styled.div`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.6;
  color: ${({ theme }) => theme.app.status.info.fg};
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StopBlock = styled.div<{ $tone: 'error' | 'warning' }>`
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
`;

export const StopHeadline = styled.div<{ $tone: 'error' | 'warning' }>`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.fg : theme.app.status.warning.fg)};
`;

export const StopDetail = styled.div`
  margin-top: 6px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const StreamingWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
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
  margin: 8px 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TraceActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 20px;
`;
