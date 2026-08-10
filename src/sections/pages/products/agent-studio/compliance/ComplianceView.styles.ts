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
`;

export const ExportBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: #f5f7fb;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.16);
  }
`;

export const FrameworkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const FrameworkCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`;

export const FrameworkTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const FrameworkName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #f5f7fb;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const FrameworkRenewal = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
`;

export const FrameworkControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ControlsLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.65);
`;

export const ControlsValue = styled.span`
  color: #f5f7fb;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

export const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ControlsTable = styled.div`
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
  padding: 12px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: 0;
  }
`;

export const Cell = styled.div<{ $w: string; $align?: 'left' | 'right' }>`
  width: ${({ $w }) => $w};
  text-align: ${({ $align }) => $align ?? 'left'};
  padding-right: 8px;
`;

export const ControlName = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const ControlCategory = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  margin-top: 2px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const ResidencyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ResidencyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const ResidencyLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const ResidencyRegion = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const ResidencyData = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
`;

export const AuditList = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

export const AuditRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: 0;
  }
`;

export const AuditTime = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  color: rgba(229, 231, 235, 0.5);
  width: 88px;
  flex-shrink: 0;
`;

export const AuditCategory = styled.span<{ $kind: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  background: ${({ $kind }) =>
    $kind === 'security'
      ? 'rgba(96, 165, 250, 0.10)'
      : $kind === 'export'
        ? 'rgba(168, 85, 247, 0.10)'
        : $kind === 'privacy'
          ? 'rgba(245, 158, 11, 0.10)'
          : $kind === 'storage'
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(52, 211, 153, 0.10)'};
  color: ${({ $kind }) =>
    $kind === 'security'
      ? '#93c5fd'
      : $kind === 'export'
        ? '#d8b4fe'
        : $kind === 'privacy'
          ? '#fbbf24'
          : $kind === 'storage'
            ? 'rgba(229, 231, 235, 0.65)'
            : '#34d399'};
  font-weight: 500;
  flex-shrink: 0;
`;

export const AuditEvent = styled.div`
  flex: 1;
  font-size: 13px;
  color: #f5f7fb;
  min-width: 0;
`;

export const AuditActor = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
`;
