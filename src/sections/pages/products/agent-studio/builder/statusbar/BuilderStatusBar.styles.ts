import styled from 'styled-components';

// v10 status bar tokens (flat colors only — C1)
const BAR_BG = '#0E1218';
const BAR_BORDER = '#1E2530';
const TEXT_PRIMARY = '#A6B0BF';
const TEXT_MUTED = '#7C8698';
const GREEN = '#3DD68C';
const PILL_BG = '#1A202B';
const PILL_BORDER = '#2A3342';

export const Bar = styled.footer`
  display: flex;
  align-items: center;
  gap: 16px;
  height: 32px;
  flex: none;
  padding: 0 12px;
  background: ${BAR_BG};
  border-top: 1px solid ${BAR_BORDER};
  font-size: 10px;
`;

export const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${TEXT_PRIMARY};
  font-size: 10px;
  white-space: nowrap;
`;

export const GreenDot = styled.span`
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: ${GREEN};
`;

export const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
  color: ${TEXT_MUTED};
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 960px) {
    display: none;
  }
`;

export const Right = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  color: ${TEXT_MUTED};
  font-size: 10px;
`;

export const DraftPill = styled.span`
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 8px;
  border-radius: 9px;
  background: ${PILL_BG};
  border: 1px solid ${PILL_BORDER};
  color: ${TEXT_PRIMARY};
  font-size: 10px;
  white-space: nowrap;
`;
