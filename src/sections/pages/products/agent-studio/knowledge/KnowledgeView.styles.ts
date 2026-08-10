import styled from 'styled-components';

export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
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
  max-width: 580px;
`;

export const NewBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: linear-gradient(135deg, #c084fc 0%, #2563eb 100%);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.30);
`;

export const TotalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const TotalCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const TotalLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const TotalValue = styled.div`
  font-size: 22px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 14px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: rgba(229, 231, 235, 0.85);
`;

export const SourcesTable = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

export const TableHeader = styled.div`
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

export const TableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

export const Cell = styled.div<{ $w: string; $align?: 'left' | 'right' }>`
  width: ${({ $w }) => $w};
  text-align: ${({ $align }) => $align ?? 'left'};
  padding-right: 8px;
  min-width: 0;
`;

export const SourceName = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const SourceUrl = styled.div`
  font-size: 11.5px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: rgba(229, 231, 235, 0.55);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const KindPill = styled.span<{ $kind: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  letter-spacing: 0.02em;
  text-transform: lowercase;
  background: ${({ $kind }) =>
    $kind === 'url'
      ? 'rgba(96, 165, 250, 0.12)'
      : $kind === 'file'
        ? 'rgba(168, 85, 247, 0.12)'
        : 'rgba(245, 158, 11, 0.12)'};
  border: 1px solid
    ${({ $kind }) =>
      $kind === 'url'
        ? 'rgba(96, 165, 250, 0.30)'
        : $kind === 'file'
          ? 'rgba(168, 85, 247, 0.30)'
          : 'rgba(245, 158, 11, 0.30)'};
  color: ${({ $kind }) =>
    $kind === 'url' ? '#93c5fd' : $kind === 'file' ? '#d8b4fe' : '#fbbf24'};
`;

export const Metric = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.85);
  font-variant-numeric: tabular-nums;
`;

export const Meta = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
  line-height: 1.5;
`;
