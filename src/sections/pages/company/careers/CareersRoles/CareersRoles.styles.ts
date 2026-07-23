import styled from 'styled-components';
import { motion } from 'framer-motion';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const SectionHeader = styled.div`
  margin-bottom: 80px;
  margin-top: 40px;
`;

export const Label = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const DepartmentGroup = styled(motion.div)`
  margin-bottom: 64px;
`;

export const DepartmentName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 32px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  width: 100%;
`;

export const RoleList = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const RoleRow = styled.button<{ $isOpen?: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto 48px;
  align-items: center;
  padding: 24px 16px;
  border: none;
  border-bottom: 1px solid ${({ $isOpen, theme }) => ($isOpen ? 'transparent' : theme.colors.border)};
  background: ${({ $isOpen, theme }) => ($isOpen ? theme.colors.surfaceHover : 'transparent')};
  width: 100%;
  text-align: left;
  transition: background 200ms ease, border-color 200ms ease;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 24px;
  }
`;

export const RoleTitle = styled.div`
  font-size: 1.125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  
  /* Slight translation on hover for a premium feel */
  transition: transform 200ms ease;
  ${RoleRow}:hover & {
    transform: translateX(8px);
  }
`;

export const RoleMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.primary};
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  white-space: nowrap;

  ${RoleRow}:hover & {
    border-color: rgba(15, 23, 42, 0.15);
  }

  ${({ theme }) => theme.media.tablet} {
    background: transparent;
    border: none;
    padding: 0;
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const RoleArrow = styled.div<{ $isOpen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: ${({ theme }) => theme.colors.text.muted};
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(90deg)' : 'rotate(0)')};
  transition: color 300ms ease, transform 400ms cubic-bezier(0.16, 1, 0.3, 1);

  svg {
    width: 16px;
    height: 16px;
    shape-rendering: crispedges;
  }

  ${RoleRow}:hover & {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

export const AccordionBody = styled.div`
  overflow: hidden;
`;

export const AccordionContent = styled.div`
  padding: 16px 16px 48px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 48px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceHover};

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 32px;
  }
`;

export const LocationText = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 16px;
  text-transform: uppercase;
`;

export const AccordionDesc = styled.p`
  font-size: 1.0625rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 640px;
`;

export const EmailFallback = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 24px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: all 300ms ease;
  white-space: nowrap;

  span {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
    margin-left: 6px;
  }

  &:hover {
    border-color: rgba(15, 23, 42, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;


