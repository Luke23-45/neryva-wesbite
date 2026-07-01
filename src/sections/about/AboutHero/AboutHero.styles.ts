import styled, { keyframes } from 'styled-components';

const breathe = keyframes`
  0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.15; }
  50% { transform: scale(1.05) translate(-10px, -10px); opacity: 0.25; }
`;

export const Wrapper = styled.section`
  position: relative;
  min-height: 100vh;
  background-color: #030811; /* Very deep dark blue/black */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 120px 0;

  ${({ theme }) => theme.media.mobile} {
    min-height: 85vh;
    padding: 100px 0;
  }
`;

/* Subtle animated glowing orb behind the text */
export const GlowBackground = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;
  width: 80vw;
  height: 80vw;
  max-width: 1000px;
  max-height: 1000px;
  background: radial-gradient(circle, rgba(36, 88, 211, 0.4) 0%, rgba(36, 88, 211, 0) 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  filter: blur(80px);
  animation: ${breathe} 12s ease-in-out infinite;
  pointer-events: none;
`;

export const Inner = styled.div`
  position: relative;
  z-index: 10;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Label = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 32px;
  display: block;
`;

export const Title = styled.h1`
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0 0 40px 0;
  
  /* Text gradient for a premium metallic feel */
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Description = styled.p`
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  max-width: 680px;
`;
