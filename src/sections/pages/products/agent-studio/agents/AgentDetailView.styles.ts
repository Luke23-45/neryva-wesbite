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

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.55);
  text-decoration: none;
  width: fit-content;
  margin-bottom: -8px;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: #f5f7fb;
  }
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
`;

export const HeaderMain = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
`;

export const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: #f5f7fb;
`;

export const HeaderSub = styled.p`
  margin: 4px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.55);
  max-width: 600px;
`;

export const ActionCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ActionButton = styled.button`
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
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.10);
  }
`;

export const PrimaryButton = styled.button<{ $variant: 'primary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 0;
  border-radius: 8px;
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
      : 'rgba(255, 255, 255, 0.06)'};
  color: #fff;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: ${({ $variant }) =>
    $variant === 'primary' ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'};
`;

export const Section = styled.section``;

export const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.85);
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const MetaLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const MetaValue = styled.div`
  font-size: 13.5px;
  color: #f5f7fb;
`;

export const CodeBlock = styled.pre`
  margin: 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.04);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12.5px;
  line-height: 1.65;
  color: rgba(245, 247, 251, 0.92);
  white-space: pre-wrap;
  word-break: break-word;
`;

export const PromptTitle = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.55);
  margin-bottom: 8px;
`;

export const PromptBody = styled.div`
  white-space: pre-wrap;
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Chip = styled.span<{ $hue?: 'azure' | 'emerald' | 'lilac' }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 6px;
  background: ${({ $hue }) =>
    $hue === 'emerald'
      ? 'rgba(5, 227, 164, 0.10)'
      : $hue === 'lilac'
        ? 'rgba(192, 132, 252, 0.10)'
        : 'rgba(96, 165, 250, 0.10)'};
  border: 1px solid
    ${({ $hue }) =>
      $hue === 'emerald'
        ? 'rgba(5, 227, 164, 0.30)'
        : $hue === 'lilac'
          ? 'rgba(192, 132, 252, 0.30)'
          : 'rgba(96, 165, 250, 0.30)'};
  color: ${({ $hue }) =>
    $hue === 'emerald' ? '#6ee7b7' : $hue === 'lilac' ? '#d8b4fe' : '#93c5fd'};
  font-size: 12px;

  code {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: 11.5px;
  }
`;

export const GuardList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const GuardItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
  color: rgba(229, 231, 235, 0.85);
`;

export const GuardDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  flex-shrink: 0;
`;
