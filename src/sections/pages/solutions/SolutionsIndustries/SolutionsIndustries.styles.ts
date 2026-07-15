import styled from 'styled-components';

export const IndustriesWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
`;

export const IndHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.s10} ${({ theme }) => theme.spacing.s5};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const IndTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 ${({ theme }) => theme.spacing.s4} 0;
`;

export const IndDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0;
`;

export const IndList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const IndItemRow = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(0, 0, 0, 0.01);
  }

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
  }
`;

export const IndItemNameBlock = styled.div`
  width: 40%;
  padding: ${({ theme }) => theme.spacing.s10} ${({ theme }) => theme.spacing.s5};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding: ${({ theme }) => theme.spacing.s6} ${({ theme }) => theme.spacing.s5};
  }
`;

export const IndItemName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

export const IndItemAppsBlock = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
  }
`;

export const IndItemApp = styled.div`
  padding: ${({ theme }) => theme.spacing.s6} ${({ theme }) => theme.spacing.s5};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s4};

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-top: 8px;
    background-color: ${({ theme }) => theme.colors.text.strong};
    flex-shrink: 0;
  }
`;

export const IndItemAppText = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.bodyLg};
  color: ${({ theme }) => theme.colors.text.secondary};
`;
