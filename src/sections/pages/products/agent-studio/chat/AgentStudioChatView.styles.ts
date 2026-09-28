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

/* ── A3-02: honest load-failure state (never a blank page, never a fake empty state) ── */

export const NotFoundWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: auto 0;
  padding: 8vh 16px;
  gap: 10px;
`;

export const NotFoundTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1.25rem;
  font-weight: 550;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 0;
`;

export const NotFoundBody = styled.p`
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.muted};
  margin: 0 0 8px;
  max-width: 460px;
`;

export const NotFoundActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
`;

export const NotFoundButton = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  cursor: pointer;
  border: 1px solid
    ${({ theme, $primary }) => ($primary ? 'transparent' : theme.app.border.strong)};
  background: ${({ theme, $primary }) =>
    $primary ? theme.app.text.primary : 'transparent'};
  color: ${({ theme, $primary }) =>
    $primary ? theme.app.text.inverse : theme.app.text.secondary};
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: ${({ $primary }) => ($primary ? 0.88 : 1)};
    background: ${({ theme, $primary }) =>
      $primary ? theme.app.text.primary : theme.app.surface.active};
    color: ${({ theme, $primary }) =>
      $primary ? theme.app.text.inverse : theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

/* ── A3-01: agent picker gate — an unbound chat cannot start, so pick honestly ── */

export const PickerWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
`;

export const PickerTitle = styled.p`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  margin: 0;
  text-align: center;
`;

export const PickerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PickerItem = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, $disabled }) =>
      $disabled ? theme.app.surface.tint : theme.app.surface.active};
    border-color: ${({ theme, $disabled }) =>
      $disabled ? theme.app.border.default : theme.app.border.hover};
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'translateY(-1px)')};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const PickerIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.active};
  color: ${({ theme }) => theme.app.text.link};
  flex-shrink: 0;
`;

export const PickerName = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 550;
  letter-spacing: -0.005em;
`;

export const PickerMeta = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

export const PickerEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 12px;
  text-align: center;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.body};
`;

/* ── A3-03: thread loading skeleton ── */

export const SkeletonWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 32px 4px;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
`;
