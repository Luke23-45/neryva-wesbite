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

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ListPane = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px;
  min-height: 480px;
`;

export const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

export const FilterSelect = styled.select`
  appearance: none;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px 10px;
  color: rgba(229, 231, 235, 0.85);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
`;

export const FilterSearchWrap = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(229, 231, 235, 0.55);
  flex: 1;
  min-width: 120px;

  &:focus-within {
    border-color: rgba(147, 197, 253, 0.55);
    color: rgba(229, 231, 235, 0.85);
  }
`;

export const FilterSearchIcon = styled.span`
  display: inline-flex;
`;

export const FilterSearch = styled.input`
  border: 0;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 12.5px;
  color: #f5f7fb;
  width: 100%;
  &::placeholder { color: rgba(229, 231, 235, 0.4); }
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 -6px;
  padding: 0 6px;
  overflow-y: auto;
  max-height: 640px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 4px; }
`;

export const Row = styled.div<{ $active: boolean }>`
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.04)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.10)' : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

export const RowMain = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
`;

export const RowTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13.5px;
`;

export const RowPreview = styled.div`
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.65);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const RowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  margin-top: 2px;
`;

export const RowAgent = styled.span`
  color: rgba(229, 231, 235, 0.78);
`;

export const RowChannel = styled.span`
  color: rgba(229, 231, 235, 0.5);
`;

export const Rating = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgba(229, 231, 235, 0.7);
`;

export const DetailPane = styled.div``;

export const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

export const DetailMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(229, 231, 235, 0.6);
`;

export const DetailTitle = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
`;

export const DetailClose = styled.button`
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgba(229, 231, 235, 0.55);
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #f5f7fb;
  }
`;

export const Transcript = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 -22px -22px;
  padding: 4px 22px 22px;
`;

export const Bubble = styled.div<{ $role: 'user' | 'agent' }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 88%;
  padding: 12px 14px;
  border-radius: 14px;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-start' : 'flex-end')};
  background: ${({ $role }) =>
    $role === 'user'
      ? 'rgba(255, 255, 255, 0.04)'
      : 'linear-gradient(180deg, rgba(192, 132, 252, 0.10), rgba(37, 99, 235, 0.06))'};
  border: 1px solid
    ${({ $role }) =>
      $role === 'user' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(192, 132, 252, 0.18)'};
`;

export const BubbleMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.55);
`;

export const BubbleText = styled.div`
  font-size: 13.5px;
  line-height: 1.55;
  color: rgba(245, 247, 251, 0.95);
`;
