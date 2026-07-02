import { FC } from 'react';

const MOTIF_GRIDS: Record<string, string[]> = {
  'large-language-models': [
    '...........',
    '...█████...',
    '..███████..',
    '..██.█.██..',
    '..███████..',
    '...█████...',
    '....███....',
    '...█...█...',
    '..█.....█..',
    '.█.......█.',
    '...........',
  ],
  'robotics-task-transfer': [
    '...........',
    '....███....',
    '...█...█...',
    '..█.███.█..',
    '..█.█.█.█..',
    '..█.███.█..',
    '...█...█...',
    '....███....',
    '.....█.....',
    '....███....',
    '...........',
  ],
  'clinical-ai': [
    '...........',
    '....███....',
    '....███....',
    '....███....',
    '.█████████.',
    '.█████████.',
    '.█████████.',
    '....███....',
    '....███....',
    '....███....',
    '...........',
  ],
  'energy-engineering-optimization': [
    '...........',
    '......██...',
    '.....███...',
    '....████...',
    '...████....',
    '..███████..',
    '.....███...',
    '....███....',
    '...███.....',
    '..██.......',
    '...........',
  ],
};

const DEFAULT_MOTIF = [
  '...........',
  '...........',
  '..███████..',
  '..█.....█..',
  '..█.███.█..',
  '..█.███.█..',
  '..█.███.█..',
  '..█.....█..',
  '..███████..',
  '...........',
  '...........',
];

interface ModelMotifProps {
  programId: string;
  size?: number;
  color?: string;
  className?: string;
}

export const ModelMotif: FC<ModelMotifProps> = ({
  programId,
  size = 20,
  color = 'currentColor',
  className,
}) => {
  const grid = MOTIF_GRIDS[programId] || DEFAULT_MOTIF;
  const gridSize = 11; // 11x11 grid

  const rects = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y] && grid[y][x] === '█') {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      className={className}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {rects}
    </svg>
  );
};
