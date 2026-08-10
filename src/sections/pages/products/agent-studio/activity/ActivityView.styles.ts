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

export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
`;

export const FilterChip = styled.button<{ $active: boolean }>`
  border: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 6px;
  color: ${({ $active }) => ($active ? '#0b0d12' : 'rgba(229, 231, 235, 0.65)')};
  background: ${({ $active }) => ($active ? '#f5f7fb' : 'rgba(255, 255, 255, 0.04)')};
  transition: background ${({ theme }) => theme.transitions.fast};
`;

export const SearchWrap = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(229, 231, 235, 0.55);
  min-width: 200px;

  &:focus-within {
    border-color: rgba(147, 197, 253, 0.55);
  }
`;

export const SearchIconWrap = styled.span`
  display: inline-flex;
`;

export const SearchInput = styled.input`
  border: 0;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 12.5px;
  color: #f5f7fb;
  width: 100%;

  &::placeholder {
    color: rgba(229, 231, 235, 0.4);
  }
`;

export const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: #f5f7fb;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
  }
`;

export const Group = styled.div`
  margin-bottom: 18px;
`;

export const GroupTitle = styled.h3`
  margin: 0 0 6px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const Row = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: 0;
  }
`;

export const RowTime = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  color: rgba(229, 231, 235, 0.5);
  width: 80px;
  flex-shrink: 0;
`;

export const RowDot = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'info' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  background: ${({ $tone }) =>
    $tone === 'success' ? '#34d399' :
    $tone === 'warning' ? '#fbbf24' :
    $tone === 'error' ? '#f87171' : '#93c5fd'};
`;

export const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

export const RowTitle = styled.div`
  font-size: 13.5px;
  color: #f5f7fb;
  font-weight: 500;
`;

export const RowDetail = styled.div`
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.65);
  margin-top: 2px;
  line-height: 1.4;
`;

export const RowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  flex-wrap: wrap;
`;
