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
  background: rgba(15, 17, 22, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
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
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
`;

export const PopoverAction = styled.button`
  background: transparent;
  border: 0;
  font-family: inherit;
  font-size: 11.5px;
  color: rgba(147, 197, 253, 0.85);
  cursor: pointer;
  padding: 0;

  &:hover {
    color: #93c5fd;
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
  font-size: 13px;
  font-weight: 500;
  color: ${({ $tone }) => ($tone === 'danger' ? '#fca5a5' : '#e6e9ef')};
  cursor: pointer;
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const MenuIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(229, 231, 235, 0.6);
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
  font-size: 10.5px;
  color: rgba(229, 231, 235, 0.45);
  margin-left: 12px;
  flex-shrink: 0;
`;

export const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
`;

export const Empty = styled.div`
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: rgba(229, 231, 235, 0.5);
`;
