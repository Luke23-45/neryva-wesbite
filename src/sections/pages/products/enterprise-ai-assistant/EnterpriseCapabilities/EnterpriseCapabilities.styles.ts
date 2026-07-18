import styled from 'styled-components';

export const CapabilitiesSection = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

export const AppsHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 80px;
`;

export const Subtext = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.accent.emeraldDark};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: ${({ theme }) => theme.spacing.s5};
`;

export const SectionHeading = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 56px;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 24px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
  }
`;

export const SectionDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 600px;
  line-height: 1.6;
`;

export const AppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
    border-bottom: none;
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const AppCell = styled.div`
  display: flex;
  flex-direction: column;
  height: 420px;
  padding: 48px 32px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  transition: background-color 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.015);
  }

  &:last-child {
    border-right: none;
  }

  ${({ theme }) => theme.media.tablet} {
    height: 320px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    &:nth-child(2n) {
      border-right: none;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    border-right: none;
  }
`;

export const CellIcon = styled.div`
  margin-bottom: 40px;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.5px;
  }
`;

export const CellTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 28px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
`;

export const CellDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  margin-top: auto;
`;
