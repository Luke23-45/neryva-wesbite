import styled from 'styled-components';

export const Wrapper = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 85vh;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

export const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 120px 80px;

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 40px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 60px 24px;
  }
`;

export const Label = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 48px;
  display: block;
`;

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(3rem, 6vw, 4.5rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 48px 0;
  max-width: 600px;
`;

export const ArrowIndicator = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 64px;
  color: ${({ theme }) => theme.colors.text.muted};
  opacity: 0.5;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(1.125rem, 1.5vw, 1.25rem);
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 32px 0;
  max-width: 480px;
`;

export const CTAButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${({ theme }) => theme.colors.text.strong};
  color: ${({ theme }) => theme.colors.background.primary};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  padding: 14px 24px;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.text.primary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const ImageColumn = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-left: 1px solid ${({ theme }) => theme.colors.border};

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  ${({ theme }) => theme.media.tablet} {
    min-height: 500px;
    border-left: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;
