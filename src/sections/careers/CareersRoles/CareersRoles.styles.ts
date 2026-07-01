import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 140px 0;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.line};

  ${({ theme }) => theme.media.mobile} {
    padding: 100px 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
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
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 20px;
`;

export const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

export const DepartmentGroup = styled.div`
  margin-bottom: 64px;
`;

export const DepartmentName = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.ink};
  display: inline-block;
`;

export const RoleList = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`;

export const RoleRow = styled.a`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 48px;
  align-items: center;
  padding: 24px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  text-decoration: none;
  transition: background 200ms ease;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.paper};
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
  color: ${({ theme }) => theme.colors.ink};
  
  /* Slight translation on hover for a premium feel */
  transition: transform 200ms ease;
  ${RoleRow}:hover & {
    transform: translateX(8px);
  }
`;

export const RoleMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.inkSoft};

  ${({ theme }) => theme.media.tablet} {
    color: ${({ theme }) => theme.colors.muted};
  }
`;

export const RoleArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 20px;
  transition: color 200ms ease, transform 200ms ease;

  ${RoleRow}:hover & {
    color: ${({ theme }) => theme.colors.ink};
    transform: translateX(4px);
  }

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;
