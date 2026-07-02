import { FC, useId } from 'react';

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

interface AbstractBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
}

const LAYERED_BLOCKS: Record<string, AbstractBlock[]> = {
  'large-language-models': [
    { x: 24, y: 24, w: 312, h: 312, opacity: 0.05 },
    { x: 120, y: 0, w: 120, h: 360, opacity: 0.1 },
    { x: 0, y: 144, w: 360, h: 72, opacity: 0.15 },
    { x: 72, y: 72, w: 216, h: 216, opacity: 0.2 },
  ],
  'robotics-task-transfer': [
    { x: 24, y: 24, w: 144, h: 144, opacity: 0.15 },
    { x: 192, y: 192, w: 144, h: 144, opacity: 0.15 },
    { x: 144, y: 48, w: 72, h: 264, opacity: 0.1 },
    { x: 48, y: 144, w: 264, h: 72, opacity: 0.1 },
    { x: 96, y: 96, w: 168, h: 168, opacity: 0.2 },
  ],
  'clinical-ai': [
    { x: 120, y: 24, w: 120, h: 312, opacity: 0.1 },
    { x: 24, y: 120, w: 312, h: 120, opacity: 0.1 },
    { x: 48, y: 48, w: 48, h: 48, opacity: 0.15 },
    { x: 264, y: 48, w: 48, h: 48, opacity: 0.15 },
    { x: 48, y: 264, w: 48, h: 48, opacity: 0.15 },
    { x: 264, y: 264, w: 48, h: 48, opacity: 0.15 },
    { x: 96, y: 96, w: 168, h: 168, opacity: 0.15 },
  ],
  'energy-engineering-optimization': [
    { x: 192, y: 24, w: 144, h: 144, opacity: 0.1 },
    { x: 120, y: 120, w: 144, h: 144, opacity: 0.15 },
    { x: 24, y: 192, w: 144, h: 144, opacity: 0.1 },
    { x: 168, y: 0, w: 48, h: 360, opacity: 0.1 },
    { x: 72, y: 72, w: 216, h: 216, opacity: 0.15 },
  ],
};

interface Props {
  slug: string;
  accent: string;
}

export const ProgramHeroVisual: FC<Props> = ({ slug, accent }) => {
  const patternId = useId();
  
  const motifGrid = MOTIF_GRIDS[slug] || DEFAULT_MOTIF;
  const blocks = LAYERED_BLOCKS[slug] || LAYERED_BLOCKS['large-language-models'];

  const gridSize = 11;
  const cellSize = 24; // 24px per pixel
  const offset = 48; // Centered (360 - (11 * 24)) / 2 = 48px

  const motifRects = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (motifGrid[y] && motifGrid[y][x] === '█') {
        motifRects.push(
          <rect
            key={`m-${x}-${y}`}
            x={offset + x * cellSize}
            y={offset + y * cellSize}
            width={cellSize}
            height={cellSize}
            fill={accent}
            opacity="0.95"
          />
        );
      }
    }
  }

  return (
    <svg
      width="360"
      height="360"
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <pattern
          id={patternId}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke={accent}
            strokeWidth="1"
            strokeOpacity="0.15"
          />
        </pattern>
      </defs>

      {/* Layer 1: The Base Grid */}
      <rect width="360" height="360" fill={`url(#${patternId})`} />
      
      {/* Outer bounding border for the grid */}
      <rect width="360" height="360" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.25" />

      {/* Layer 2: Abstract Overlapping Blocks (Different shares of the accent color) */}
      {blocks.map((b, i) => (
        <rect
          key={`b-${i}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={accent}
          fillOpacity={b.opacity}
        />
      ))}

      {/* Layer 3: The Scaled-up Core Geometry Motif */}
      {motifRects}
    </svg>
  );
};
