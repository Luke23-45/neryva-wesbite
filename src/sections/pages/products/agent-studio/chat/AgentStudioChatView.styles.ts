import styled from 'styled-components';

export const ViewRoot = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-height: 100vh;
`;

export const ChatArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  padding: 64px 32px 32px;

  ${({ theme }) => theme.media.mobile} {
    padding: 36px 20px 20px;
  }
`;

export const GreetingBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
`;

export const GreetingTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(1.75rem, 2.4vw, 2.25rem);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: #f5f7fb;
  margin: 0 0 10px;
`;

export const GreetingSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.55;
  color: rgba(229, 231, 235, 0.6);
  margin: 0;
  max-width: 520px;
`;

export const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 760px;
  padding: 10px 14px;
  margin-bottom: 28px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e6e9ef;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
`;

export const BannerLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

export const BannerIcon = styled.svg`
  width: 18px;
  height: 18px;
  color: #93c5fd;
  flex-shrink: 0;
`;

export const BannerText = styled.span`
  font-size: 13.5px;
  color: rgba(229, 231, 235, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BannerAction = styled.button`
  border: 0;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 8px;
  transition: background ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
  }
`;

export const BannerClose = styled.button`
  border: 0;
  background: transparent;
  cursor: pointer;
  color: rgba(229, 231, 235, 0.5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: #f5f7fb;
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const StageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex: 1;
  padding: 12px 0 24px;
`;
