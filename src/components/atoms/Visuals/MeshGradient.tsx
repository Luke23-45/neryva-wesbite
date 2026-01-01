import styled, { keyframes } from 'styled-components';

const move = keyframes`
  0% { transform: translate(0, 0) scale(1.1); }
  33% { transform: translate(50px, -70px) scale(1.2); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1.1); }
`;

const GradientContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: -1;
  background: ${({ theme }) => theme.colors.background.primary};
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, transparent, ${({ theme }) => theme.colors.background.primary} 90%);
  }
`;

const Blob = styled.div<{ $color: string; $top: string; $left: string; $delay: string; $size: string; $opacity: number }>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  background: ${({ $color }) => $color};
  filter: blur(100px);
  opacity: ${({ $opacity }) => $opacity};
  border-radius: 50%;
  animation: ${move} 25s infinite ease-in-out;
  animation-delay: ${({ $delay }) => $delay};
  will-change: transform;
`;

export const MeshGradient = () => {
  return (
    <GradientContainer>
      <Blob $color="#14B8A6" $top="-15%" $left="-5%" $delay="0s" $size="700px" $opacity={0.15} />
      <Blob $color="#8B5CF6" $top="35%" $left="55%" $delay="-7s" $size="600px" $opacity={0.12} />
      <Blob $color="#14B8A6" $top="65%" $left="15%" $delay="-13s" $size="550px" $opacity={0.1} />
      <Blob $color="#F97316" $top="20%" $left="80%" $delay="-18s" $size="400px" $opacity={0.06} />
      <Blob $color="#8B5CF6" $top="75%" $left="75%" $delay="-9s" $size="500px" $opacity={0.08} />
    </GradientContainer>
  );
};
