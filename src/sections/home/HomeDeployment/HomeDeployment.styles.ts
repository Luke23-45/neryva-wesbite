import styled from 'styled-components';

export const SectionWrapper = styled.section`
  padding: 160px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    padding: 120px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const HeaderContent = styled.div`
  text-align: center;
  max-width: 600px;
  margin-bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 56px;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
  }
`;

export const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const ArchitectureCard = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 1px; /* Ultra-sharp edges, no soft corners */
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 48px rgba(0,0,0,0.04);
  }
`;

export const CardIconWrapper = styled.div`
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.strong};
  margin-bottom: 24px;

  svg {
    width: 100%;
    height: 100%;
    /* Keep strokes razor thin to look like technical blueprints */
    stroke-width: 1px; 
  }
`;

export const CardTextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
`;

export const CardLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding-bottom: 8px;
  margin-bottom: 8px;
`;

export const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const CardDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
