import styled from 'styled-components';

export const Panel = styled.aside`
  width: 360px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.app.bg.deep};
  border-left: 1px solid ${({ theme }) => theme.app.border.default};
  overflow-y: auto;
`;

export const Head = styled.div`
  padding: 16px 16px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const Subtitle = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const Body = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;

export const PassTag = styled.span`
  align-self: flex-start;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TypeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TypeRow = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const TypeDot = styled.span<{ $color: string }>`
  width: 9px;
  height: 9px;
  flex: none;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const TypeMain = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const TypeLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
`;

export const TypeBlurb = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TypeNote = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.ghost};
  white-space: nowrap;
`;

export const ModelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const EmptySelect = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.6;
`;
