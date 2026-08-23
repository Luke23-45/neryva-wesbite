import styled from 'styled-components';

export const ViewRoot = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-height: 0;
`;

export const ChatArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 32px 24px;
  min-height: 0;

  ${({ theme }) => theme.media.mobile} {
    padding: 28px 20px 16px;
  }
`;

/** The scrollable conversation column — the page itself never scrolls. */
export const ScrollRegion = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px 2px 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.app.scrollbar};
    border-radius: 4px;
  }
`;

export const GreetingBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto 0 28px;
  padding-top: 8vh;
`;

export const GreetingTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(1.75rem, 2.4vw, 2.25rem);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 0 0 10px;
`;

export const GreetingSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.muted};
  margin: 0;
  max-width: 520px;
`;

export const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 28px;
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.app.surface.tint},
    ${({ theme }) => theme.app.surface.subtle}
  );
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.body};
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
  color: ${({ theme }) => theme.app.text.link};
  flex-shrink: 0;
`;

export const BannerText = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BannerAction = styled.button`
  border: 0;
  cursor: pointer;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  background: ${({ theme }) => theme.app.surface.active};
  padding: 6px 12px;
  border-radius: 8px;
  transition: background ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const BannerClose = styled.button`
  border: 0;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.muted};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
