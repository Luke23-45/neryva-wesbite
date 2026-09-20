import styled from 'styled-components';

export const Trigger = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: linear-gradient(
    135deg,
    rgba(192, 132, 252, 0.30) 0%,
    rgba(37, 99, 235, 0.30) 100%
  );
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const Header = styled.div`
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.gradients.primary};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
`;

export const HeaderBody = styled.div`
  min-width: 0;
  flex: 1;
`;

export const HeaderName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const HeaderEmail = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MenuSection = styled.div`
  padding: 6px;
`;
