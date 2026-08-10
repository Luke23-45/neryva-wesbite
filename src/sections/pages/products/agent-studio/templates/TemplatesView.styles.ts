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

export const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-width: 280px;
  flex: 1;
  max-width: 360px;

  &:focus-within {
    border-color: rgba(192, 132, 252, 0.45);
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 13px;
  color: #f5f7fb;

  &::placeholder {
    color: rgba(229, 231, 235, 0.4);
  }
`;

export const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const FilterPill = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(192, 132, 252, 0.45)' : 'rgba(255, 255, 255, 0.08)')};
  background: ${({ $active }) =>
    $active ? 'linear-gradient(180deg, rgba(192,132,252,0.10), rgba(37,99,235,0.04))' : 'rgba(255, 255, 255, 0.02)'};
  color: ${({ $active }) => ($active ? '#d8b4fe' : 'rgba(229, 231, 235, 0.65)')};
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: #f5f7fb;
    border-color: rgba(255, 255, 255, 0.16);
  }
`;

export const Count = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: rgba(229, 231, 235, 0.55);
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
`;

export const TemplateGrid = styled.div`
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

export const TemplateCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(192, 132, 252, 0.40);
    background: rgba(255, 255, 255, 0.04);
    transform: translateY(-2px);
  }
`;

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const IconBox = styled.div<{ $tone: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $tone }) =>
    $tone === 'lilac' || $tone === 'amethyst'
      ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.30), rgba(168, 85, 247, 0.20))'
      : $tone === 'emerald'
        ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.30), rgba(16, 185, 129, 0.20))'
        : $tone === 'azure'
          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.30), rgba(37, 99, 235, 0.20))'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.30), rgba(245, 158, 11, 0.20))'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'lilac' || $tone === 'amethyst'
        ? 'rgba(192, 132, 252, 0.30)'
        : $tone === 'emerald'
          ? 'rgba(52, 211, 153, 0.30)'
          : $tone === 'azure'
            ? 'rgba(96, 165, 250, 0.30)'
            : 'rgba(245, 158, 11, 0.30)'};
  color: ${({ $tone }) =>
    $tone === 'lilac' || $tone === 'amethyst'
      ? '#d8b4fe'
      : $tone === 'emerald'
        ? '#34d399'
        : $tone === 'azure'
          ? '#93c5fd'
          : '#fbbf24'};
`;

export const FeaturedBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.40);
  color: #fbbf24;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
`;

export const Name = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
`;

export const Description = styled.div`
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.65);
  line-height: 1.55;
  flex: 1;
`;

export const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  flex-wrap: wrap;
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const Integrations = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export const IntegrationPill = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(229, 231, 235, 0.78);
  letter-spacing: 0.02em;
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

export const Stats = styled.div`
  display: flex;
  gap: 14px;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  font-variant-numeric: tabular-nums;
`;

export const UseBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: linear-gradient(135deg, #c084fc 0%, #2563eb 100%);
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.30);
`;
