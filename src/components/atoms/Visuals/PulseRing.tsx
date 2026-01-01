import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`;

const Ring = styled.div<{ $color: string; $size: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border: 2px solid ${({ $color }) => $color};
  border-radius: 50%;
  pointer-events: none;
  z-index: -1;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

interface PulseRingProps {
    color?: string;
    size?: string;
    count?: number;
}

export const PulseRing = ({ color = '#14B8A6', size = '100%', count = 2 }: PulseRingProps) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <Ring
                    key={i}
                    $color={color}
                    $size={size}
                    style={{ animationDelay: `${i * 0.5}s` }}
                />
            ))}
        </>
    );
};
