import { FC } from 'react';

interface PixelArrowProps {
  className?: string;
  size?: number;
}

export const PixelArrow: FC<PixelArrowProps> = ({ className, size = 14 }) => {
  // Arrow is 7 blocks wide, 5 blocks tall
  return (
    <svg
      width={size}
      height={(size * 5) / 7}
      viewBox="0 0 7 5"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Top pixel */}
      <rect x="4" y="0" width="1" height="1" />
      {/* Top diagonal pixel */}
      <rect x="5" y="1" width="1" height="1" />
      {/* Center stem and tip */}
      <rect x="0" y="2" width="7" height="1" />
      {/* Bottom diagonal pixel */}
      <rect x="5" y="3" width="1" height="1" />
      {/* Bottom pixel */}
      <rect x="4" y="4" width="1" height="1" />
    </svg>
  );
};
