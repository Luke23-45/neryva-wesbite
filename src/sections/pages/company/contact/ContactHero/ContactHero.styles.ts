import styled from 'styled-components';

export const Wrapper = styled.section`
  display: grid;
  grid-template-columns: 72% 28%;
  min-height: 60vh;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid #e4e3de;
  border-bottom: 1px solid #e4e3de;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Top, Right, Bottom, Left */
  padding: 120px 80px 50px max(24px, calc((100vw - ${({ theme }) => theme.containers.wide}) / 2 + 24px));

  ${({ theme }) => theme.media.tablet} {
    padding: 80px max(24px, calc((100vw - ${({ theme }) => theme.containers.wide}) / 2 + 24px));
    border-bottom: 1px solid #e4e3de;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 60px 16px;
  }
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 120px 80px 50px 80px;
  border-left: 1px solid #e4e3de;

  ${({ theme }) => theme.media.tablet} {
    border-left: none;
    padding: 60px 40px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 48px 24px;
  }
`;

export const Eyebrow = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 4.5rem;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
  max-width: 1000px;
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  max-width: 400px;
  transform: translateY(-8px); /* Optically aligns the baseline of the description with the title */

  ${({ theme }) => theme.media.tablet} {
    transform: none;
  }
`;
