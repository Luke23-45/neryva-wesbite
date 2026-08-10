import styled from 'styled-components';

export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: #f5f7fb;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.55);
`;

export const EndpointCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`;

export const EndpointUrl = styled.code`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  color: #f5f7fb;
  word-break: break-all;
`;

export const EndpointMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.85);
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

export const EventChip = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`;

export const EventMeta = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
  margin-left: 18px;
`;

export const LogTable = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

export const LogHeader = styled.div`
  display: flex;
  padding: 10px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const LogRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
`;

export const Cell = styled.div<{ $w: string; $align?: 'left' | 'right' }>`
  width: ${({ $w }) => $w};
  text-align: ${({ $align }) => $align ?? 'left'};
  padding-right: 8px;
`;

export const Status = styled.span<{ $success: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  color: ${({ $success }) => ($success ? '#6ee7b7' : '#fca5a5')};
  background: ${({ $success }) =>
    $success ? 'rgba(16, 185, 129, 0.10)' : 'rgba(239, 68, 68, 0.10)'};
  border: 1px solid
    ${({ $success }) =>
      $success ? 'rgba(16, 185, 129, 0.30)' : 'rgba(239, 68, 68, 0.30)'};
`;

export const Method = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 5px;
  background: rgba(96, 165, 250, 0.10);
  border: 1px solid rgba(96, 165, 250, 0.30);
  color: #93c5fd;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
`;

export const Latency = styled.span`
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.78);
  font-variant-numeric: tabular-nums;
`;

export const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: #f5f7fb;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
  }
`;
