import styled from 'styled-components';

export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
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
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.85);
`;

export const EndpointGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

export const EndpointCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(245, 158, 11, 0.30);
  }
`;

export const EndpointTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const EndpointName = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

export const EndpointLabel = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-all;
`;

export const EndpointUrl = styled.div`
  font-size: 11.5px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: rgba(229, 231, 235, 0.55);
  word-break: break-all;
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
`;

export const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const DetailLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const DetailValue = styled.div`
  font-size: 12.5px;
  color: #f5f7fb;
  font-variant-numeric: tabular-nums;
`;

export const IpList = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

export const IpChip = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(229, 231, 235, 0.85);
`;

export const VpcCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(37, 99, 235, 0.06) 100%);
  border: 1px solid rgba(245, 158, 11, 0.20);
`;

export const VpcHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

export const VpcMeta = styled.div`
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
`;

export const VpcMetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const VpcMetaLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const VpcMetaValue = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const VpcName = styled.div`
  font-size: 17px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.01em;
`;

export const SubnetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const Subnet = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const SubnetLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const SubnetName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const SubnetCidr = styled.div`
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: rgba(229, 231, 235, 0.55);
`;

export const Table = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 1.6fr 0.4fr;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 600px) {
    grid-template-columns: 1fr 0.4fr;
  }
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 1.6fr 0.4fr;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.015);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.035);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr 0.4fr;
  }
`;

export const Th = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const Td = styled.div`
  font-size: 12.5px;
  color: #f5f7fb;
  font-variant-numeric: tabular-nums;
  min-width: 0;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

export const Pill = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  background: ${({ $tone }) =>
    $tone === 'azure'
      ? 'rgba(37, 99, 235, 0.12)'
      : $tone === 'emerald'
        ? 'rgba(16, 185, 129, 0.12)'
        : 'rgba(168, 85, 247, 0.12)'};
  color: ${({ $tone }) =>
    $tone === 'azure' ? '#60a5fa' : $tone === 'emerald' ? '#34d399' : '#c4b5fd'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'azure'
        ? 'rgba(37, 99, 235, 0.30)'
        : $tone === 'emerald'
          ? 'rgba(16, 185, 129, 0.30)'
          : 'rgba(168, 85, 247, 0.30)'};
`;

export const CdnCard = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 18px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const CdnMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const CdnLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const CdnValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
`;
