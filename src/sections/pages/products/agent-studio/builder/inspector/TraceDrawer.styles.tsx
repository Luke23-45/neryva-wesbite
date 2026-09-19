import styled from 'styled-components';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';

/**
 * C13-only trace primitives. Shared section primitives (labels, whispers,
 * preview rows, text buttons) are reused from the C02/C04/C05/C06 section
 * style sheets — never redefined here.
 */

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;
export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 11px;
  font-size: 11px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.status.info.fg};
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StopBlock = styled.div<{ $tone: 'error' | 'warning' }>`
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
`;

export const StopHeadline = styled.div<{ $tone: 'error' | 'warning' }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.fg : theme.app.status.warning.fg)};
`;

export const StopDetail = styled.div`
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export function StreamingBubble() {
  return (
    <div role="status" aria-label="Streaming reply" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      <Skeleton $w="82%" />
      <Skeleton $w="64%" />
      <Skeleton $w="71%" />
    </div>
  );
}

/** Plain muted caption — for honest absence notes, never warnings. */
export const Note = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.muted};
`;
