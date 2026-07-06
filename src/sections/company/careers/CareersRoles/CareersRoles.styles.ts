import styled from 'styled-components';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const SectionHeader = styled.div`
  margin-bottom: 80px;
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

export const DepartmentGroup = styled.div`
  margin-bottom: 64px;
`;

export const DepartmentName = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.text.primary};
  display: inline-block;
`;

export const RoleList = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const RoleRow = styled.button<{ $isOpen?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 48px;
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
  color: ${({ theme }) => theme.colors.text.secondary};

  ${({ theme }) => theme.media.tablet} {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const RoleArrow = styled.div<{ $isOpen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 20px;
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(90deg)' : 'rotate(0)')};
  transition: color 200ms ease, transform 300ms ease;

  ${RoleRow}:hover & {
    color: ${({ theme }) => theme.colors.text.primary};
    transform: ${({ $isOpen }) => ($isOpen ? 'rotate(90deg)' : 'translateX(4px)')};
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

export const AccordionDesc = styled.p`
  font-size: 1.0625rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 640px;
`;

export const ApplyButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.background.primary};
  font-weight: 500;
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 200ms ease;
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }
`;
