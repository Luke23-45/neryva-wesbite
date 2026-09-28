import styled from 'styled-components';

/* v10 palette rail — flat tokens only (C1). */

export const Rail = styled.aside`
  width: 272px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 12px 12px;
  background: #0d1117;
  border-right: 1px solid #1e2530;
  overflow-y: auto;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px 10px;
`;

export const RailTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  color: #7c8698;
`;

export const CountChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 20px;
  padding: 0 7px;
  border-radius: 8px;
  background: #1a202b;
  border: 1px solid #2a3342;
  color: #a6b0bf;
  font-size: 10px;
  font-weight: 600;
`;

export const SearchWrap = styled.div`
  padding: 0 2px 8px;
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 0 10px 0 30px;
  border-radius: 8px;
  border: 1px solid #232b39;
  background: #0f141b
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%237C8698' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M20 20l-3.5-3.5'/%3E%3C/svg%3E")
    no-repeat 10px center;
  color: #e9edf3;
  font-size: 12px;
  font-family: inherit;

  &::placeholder {
    color: #7c8698;
  }

  &:focus {
    outline: none;
    border-color: #58a6ff;
  }
`;

export const GroupLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  color: #7c8698;
  padding: 10px 6px 4px;
`;

export const Row = styled.button<{ $selected: boolean; $dimmed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(88, 166, 255, 0.45)' : 'transparent')};
  background: ${({ $selected }) => ($selected ? 'rgba(88, 166, 255, 0.08)' : 'transparent')};
  color: #e9edf3;
  font-family: inherit;
  text-align: left;
  cursor: ${({ $dimmed }) => ($dimmed ? 'not-allowed' : 'pointer')};
  opacity: ${({ $dimmed }) => ($dimmed ? 0.55 : 1)};

  &:hover {
    background: ${({ $selected }) => ($selected ? 'rgba(88, 166, 255, 0.08)' : '#141924')};
  }

  &:focus-visible {
    outline: 2px solid #58a6ff;
    outline-offset: 1px;
  }
`;

export const IconTile = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: 6px;
  background: ${({ $color }) => `color-mix(in srgb, ${$color} 14%, transparent)`};
  color: ${({ $color }) => $color};
`;

export const RowMain = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

export const RowLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  color: #c6ceda;
`;

export const RowSide = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
`;

export const RowStatus = styled.span`
  font-size: 10px;
  line-height: 1.4;
  color: #7c8698;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

export const StatusDot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const LockGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  color: #7c8698;
`;

export const FilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px;
  font-size: 12px;
  color: #a6b0bf;
`;

export const ClearFilter = styled.button`
  border: 0;
  background: transparent;
  color: #58a6ff;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  font-family: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

export const LockedNote = styled.div`
  margin: 8px 2px 0;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px dashed #2a3342;
  font-size: 12px;
  color: #a6b0bf;
  line-height: 1.5;
`;

/* Health card (bottom of rail) */

export const HealthCard = styled.section`
  margin-top: auto;
  padding-top: 12px;
`;

export const HealthInner = styled.div`
  background: #10151d;
  border: 1px solid #232b39;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const HealthTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const HealthTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #e9edf3;
  line-height: 1.35;
`;

export const HealthSub = styled.div`
  font-size: 10px;
  color: #7c8698;
  line-height: 1.4;
`;

export const HealthRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #a6b0bf;
  line-height: 1.4;
`;

export const ReviewButton = styled.button`
  border: 0;
  background: transparent;
  color: #58a6ff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: inherit;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export const NextHint = styled.button`
  border: 0;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: 10px;
  font-style: italic;
  line-height: 1.5;
  color: rgba(88, 166, 255, 0.75);
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;
