import styled from 'styled-components';
import { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

export const Skeleton = styled.div<{ $w?: string; $h?: string; $r?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
  border-radius: ${({ $r }) => $r ?? '6px'};
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;
