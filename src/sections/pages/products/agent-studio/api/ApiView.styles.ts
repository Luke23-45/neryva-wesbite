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

export const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionBtn = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid
    ${({ $variant }) => ($variant === 'primary' ? 'transparent' : 'rgba(255, 255, 255, 0.10)')};
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
      : 'transparent'};
  color: #f5f7fb;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $variant }) =>
      $variant === 'primary'
        ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
        : 'rgba(255, 255, 255, 0.04)'};
    border-color: rgba(255, 255, 255, 0.16);
  }
`;

export const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SidebarSection = styled.div`
  margin-bottom: 8px;
`;

export const SidebarLabel = styled.div`
  padding: 6px 12px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.45);
`;

export const SidebarItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.06)' : 'transparent')};
  font-family: inherit;
  font-size: 13px;
  color: ${({ $active }) => ($active ? '#f5f7fb' : 'rgba(229, 231, 235, 0.78)')};
  cursor: pointer;
  text-align: left;
  transition: background ${({ theme }) => theme.transitions.fast};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12.5px;
`;

export const MethodBadge = styled.span<{ $method: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 9.5px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.04em;
  background: ${({ $method }) =>
    $method === 'GET'
      ? 'rgba(52, 211, 153, 0.18)'
      : $method === 'POST'
        ? 'rgba(96, 165, 250, 0.18)'
        : $method === 'PATCH'
          ? 'rgba(245, 158, 11, 0.18)'
          : 'rgba(248, 113, 113, 0.18)'};
  color: ${({ $method }) =>
    $method === 'GET'
      ? '#34d399'
      : $method === 'POST'
        ? '#93c5fd'
        : $method === 'PATCH'
          ? '#fbbf24'
          : '#f87171'};
  flex-shrink: 0;
  min-width: 38px;
  text-align: center;
`;

export const Detail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`;

export const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const DetailPath = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 15px;
  color: #f5f7fb;
  letter-spacing: -0.005em;
  flex: 1;
  min-width: 0;
`;

export const Description = styled.div`
  font-size: 13.5px;
  color: rgba(229, 231, 235, 0.78);
  line-height: 1.55;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.55);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const ParamsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ParamRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const ParamLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const ParamName = styled.span<{ $required: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12.5px;
  font-weight: 500;
  color: #f5f7fb;

  &::before {
    content: '${({ $required }) => ($required ? '●' : '○')}';
    color: ${({ $required }) => ($required ? '#fbbf24' : 'rgba(229, 231, 235, 0.45)')};
    margin-right: 6px;
  }
`;

export const ParamDesc = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
  line-height: 1.5;
`;

export const ParamType = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 5px;
  background: rgba(192, 132, 252, 0.10);
  border: 1px solid rgba(192, 132, 252, 0.30);
  color: #d8b4fe;
  letter-spacing: 0.02em;
  white-space: nowrap;
  align-self: center;
`;

export const CodeBlock = styled.pre`
  margin: 0;
  padding: 16px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  color: rgba(229, 231, 235, 0.85);
  overflow-x: auto;
  line-height: 1.6;
`;

export const CodeRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`;

export const LineNumber = styled.span`
  flex-shrink: 0;
  width: 24px;
  text-align: right;
  color: rgba(229, 231, 235, 0.30);
  user-select: none;
`;

export const LineContent = styled.code`
  flex: 1;
  white-space: pre;
`;

export const Tab = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 3px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  width: fit-content;
`;

export const TabBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 0;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.10)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#f5f7fb' : 'rgba(229, 231, 235, 0.65)')};
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
`;

export const TryBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export const TryNote = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
`;

export const TryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 0;
  border-radius: 9px;
  background: linear-gradient(135deg, #c084fc 0%, #2563eb 100%);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.30);
`;
