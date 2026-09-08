import styled from 'styled-components';

/** Toolbar zone inside a flush panel — matches panel gutters. */
export const ToolbarArea = styled.div`
  padding: 18px 22px 0;
`;

export const AgentMain = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const AgentName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const AgentDesc = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.4;
  margin-top: 2px;
`;

export const ModelTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 5px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const RowMenuButton = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 6px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const ModalIntro = styled.p`
  margin: 0 0 14px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

export const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const TemplateCard = styled.div<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid ${({ $selected, theme }) => ($selected ? theme.app.status.lilac.border : theme.app.border.default)};
  background: ${({ $selected, theme }) => ($selected ? theme.app.status.lilac.bg : theme.app.surface.subtle)};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
    background: ${({ theme }) => theme.app.surface.tint};
  }
`;

export const TemplateIcon = styled.div<{ $hue: string }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${({ $hue, theme }) =>
    $hue === 'emerald'
      ? 'rgba(5, 227, 164, 0.18)'
      : $hue === 'azure'
        ? 'rgba(37, 99, 235, 0.18)'
        : $hue === 'lilac'
          ? 'rgba(192, 132, 252, 0.18)'
          : $hue === 'amber'
            ? 'rgba(245, 158, 11, 0.18)'
            : theme.app.surface.active};
`;

export const TemplateTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  margin-top: 4px;
`;

export const TemplateDesc = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.4;
`;
