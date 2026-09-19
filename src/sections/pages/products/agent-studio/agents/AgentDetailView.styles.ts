import styled, { css, keyframes } from 'styled-components';

export const CurrentTag = styled.span`
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 5px;
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  color: ${({ theme }) => theme.app.status.success.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  text-decoration: none;
  width: fit-content;
  margin-bottom: -8px;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
    border-radius: 4px;
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
  color: ${({ theme }) => theme.app.text.primary};
`;

export const HeaderSub = styled.p`
  margin: 4px 0 0;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
  max-width: 600px;
`;

export const ActionCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const MetaLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const MetaValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const CodeBlock = styled.pre`
  margin: 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.primary};
  white-space: pre-wrap;
  word-break: break-word;
`;

export const PromptTitle = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
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
  background: ${({ $hue, theme }) =>
    $hue === 'emerald'
      ? theme.app.status.emerald.bg
      : $hue === 'lilac'
        ? theme.app.status.lilac.bg
        : theme.app.status.info.bg};
  border: 1px solid
    ${({ $hue, theme }) =>
      $hue === 'emerald'
        ? theme.app.status.emerald.border
        : $hue === 'lilac'
          ? theme.app.status.lilac.border
          : theme.app.status.info.border};
  color: ${({ $hue, theme }) =>
    $hue === 'emerald'
      ? theme.app.status.emerald.fg
      : $hue === 'lilac'
        ? theme.app.status.lilac.fg
        : theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.caption};

  code {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: ${({ theme }) => theme.app.type.micro};
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
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const GuardDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.status.warning.fg};
  flex-shrink: 0;
`;

export const EmptyNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const VersionList = styled.div`
  & > * + * {
    border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  }
`;

const highlightPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

export const VersionRow = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border-radius: 10px;
  ${({ $highlight, theme }) =>
    $highlight &&
    css`
      outline: 1px solid ${theme.app.status.info.border};
      background: ${theme.app.status.info.bg};
      animation: ${highlightPulse} 1.6s ease-in-out 2;
    `};
`;

export const VersionMain = styled.div`
  flex: 1;
  min-width: 0;
`;

export const VersionId = styled.div`
  display: flex;
  align-items: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  word-break: break-all;
`;

export const VersionMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

export const VersionActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;
