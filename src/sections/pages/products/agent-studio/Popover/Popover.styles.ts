import styled from 'styled-components';
import { motion } from 'framer-motion';

export const Popover = styled.div`
  position: relative;
  display: inline-flex;
`;

export const PopoverPanel = styled(motion.div)<{ $width?: number }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: ${({ $width }) => $width ?? 320}px;
  max-width: calc(100vw - 32px);
  background: ${({ theme }) => theme.app.surface.glass};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.app.shadow.popover};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  overflow: hidden;
  z-index: 200;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
`;

export const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
`;

export const PopoverTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
`;

export const PopoverAction = styled.button`
  background: transparent;
  border: 0;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.link};
  cursor: pointer;
  padding: 0;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.app.text.linkHover};
  }

  &:disabled {
    color: ${({ theme }) => theme.app.text.faint};
    cursor: default;
  }
`;

export const MenuItem = styled.a<{ $tone?: 'default' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme, $tone }) => ($tone === 'danger' ? theme.app.status.error.fg : theme.app.text.body)};
  cursor: pointer;
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const MenuIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.app.text.muted};
  flex-shrink: 0;
`;

export const MenuLabel = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
`;

export const MenuHint = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  margin-left: 12px;
  flex-shrink: 0;
`;

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.app.border.default};
`;

export const Empty = styled.div`
  padding: 24px 16px;
  text-align: center;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
`;
