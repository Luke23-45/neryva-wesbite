import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

/* ── Wrapper: full viewport, solid dark background ── */
export const Wrapper = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #06101e;
  overflow: hidden;
  padding: 140px 32px 100px;
  animation: ${fadeIn} 0.4s ease both;

  ${({ theme }) => theme.media.mobile} {
    padding: 120px 24px 80px;
    min-height: auto;
  }
`;

/* ── The mosaic canvas sits absolutely behind everything ── */
export const MosaicCanvas = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
`;

/* ── All text content is layered above the mosaic ── */
export const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

/* ── "Neryva Lab" wordmark label ── */
export const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 36px;
  
  span {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
  }

  /* Two short decorative rules flanking the label */
  &::before,
  &::after {
    content: '';
    display: block;
    width: 32px;
    height: 1px;
    background: rgba(255, 255, 255, 0.18);
  }
`;

/* ── Main tagline ── */
export const Tagline = styled.h1`
  font-size: clamp(3rem, 6.5vw, 5.5rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0 0 56px;
  max-width: 800px;

  em {
    font-style: normal;
    color: rgba(255, 255, 255, 0.38);
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: clamp(2.25rem, 9vw, 3.5rem);
    margin-bottom: 40px;
  }
`;

/* ── The animated mosaic block sits between tagline and mission ── */
export const MosaicBlock = styled.div`
  width: 100%;
  max-width: 720px;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 64px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.07), 0 0 60px rgba(30, 80, 180, 0.15);

  ${({ theme }) => theme.media.mobile} {
    margin-bottom: 48px;
  }
`;

/* ── Divider between mosaic and mission ── */
export const Divider = styled.div`
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.18), transparent);
  margin-bottom: 48px;
`;

/* ── Mission block ── */
export const MissionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 640px;
`;

export const MissionEyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
`;

export const MissionTagline = styled.h2`
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.92);
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 1.5rem;
  }
`;

export const MissionDescription = styled.p`
  font-size: 1.0625rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.42);
  margin: 0;
  max-width: 560px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 0.9375rem;
  }
`;

/* ── Scroll hint at the very bottom ── */
export const ScrollHint = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;

  span {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.22);
  }
`;

export const ScrollLine = styled.div`
  width: 1px;
  height: 36px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.22), transparent);
`;
