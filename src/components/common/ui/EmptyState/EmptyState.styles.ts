import styled from 'styled-components';

export const EmptyWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 56px 24px;
  text-align: center;
`;

export const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(229, 231, 235, 0.6);
  margin-bottom: 4px;
`;

export const Title = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: #f5f7fb;
`;

export const Description = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.55);
  max-width: 380px;
`;

export const Action = styled.div`
  margin-top: 8px;
`;
