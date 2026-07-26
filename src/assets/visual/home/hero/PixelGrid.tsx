import React, { useEffect, useState, useRef, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion } from "framer-motion";

// ─── Animation Configuration ───────────────────────────────────────────────

const TILE_COLORS = [
  "#C084FC", // Row 0: Bright Lilac
  "#A855F7", // Row 1: Rich Amethyst
  "#05E3A4", // Row 2: Vibrant Emerald
  "#0284C7", // Row 3: Mid Ocean Azure
  "#2563EB", // Row 4: Royal Azure
];

// Mathematical 5-step sliding puzzle paths for exactly 17 cells.
// Coordinates are relative to the 5x5 bounding box: [row, col]
// The final 3 frames hold the "N" matrix perfectly still.
const PATHS = {
  L0: { row: 0, path: [[1, 0], [1, 0], [1, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]] },
  L1: { row: 1, path: [[2, 0], [2, 0], [2, 0], [2, 0], [1, 0], [1, 0], [1, 0], [1, 0]] },
  L2: { row: 2, path: [[2, 1], [2, 1], [2, 1], [2, 1], [2, 1], [2, 0], [2, 0], [2, 0]] },
  L3: { row: 3, path: [[4, 0], [4, 0], [4, 0], [4, 0], [3, 0], [3, 0], [3, 0], [3, 0]] },
  L4: { row: 4, path: [[4, 1], [4, 1], [4, 1], [4, 1], [4, 1], [4, 0], [4, 0], [4, 0]] },
  R0: { row: 0, path: [[0, 3], [0, 3], [0, 4], [0, 4], [0, 4], [0, 4], [0, 4], [0, 4]] },
  R1: { row: 1, path: [[1, 3], [1, 3], [1, 3], [1, 4], [1, 4], [1, 4], [1, 4], [1, 4]] },
  R2: { row: 2, path: [[3, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4]] },
  R3: { row: 3, path: [[4, 4], [4, 4], [3, 4], [3, 4], [3, 4], [3, 4], [3, 4], [3, 4]] },
  R4: { row: 4, path: [[4, 3], [4, 3], [4, 3], [4, 4], [4, 4], [4, 4], [4, 4], [4, 4]] },
  T0: { row: 0, path: [[0, 0], [0, 0], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1]] },
  T1: { row: 1, path: [[0, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]] },
  B0: { row: 3, path: [[2, 3], [2, 3], [2, 3], [2, 3], [2, 3], [3, 3], [3, 3], [3, 3]] },
  B1: { row: 4, path: [[3, 3], [3, 3], [3, 3], [3, 3], [4, 3], [4, 3], [4, 3], [4, 3]] },
  D0: { row: 1, path: [[0, 2], [0, 2], [0, 2], [0, 2], [0, 2], [1, 2], [1, 2], [1, 2]] },
  D1: { row: 2, path: [[1, 2], [1, 2], [1, 2], [1, 2], [2, 2], [2, 2], [2, 2], [2, 2]] },
  D2: { row: 3, path: [[2, 2], [2, 2], [2, 2], [3, 2], [3, 2], [3, 2], [3, 2], [3, 2]] },
};

// ─── Styled Components ────────────────────────────────────────────────────────

const GridWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at center, #12131C 0%, #050507 70%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 0;
`;

const GridContainer = styled.div<{ $cols: number; $rows: number; $cellSize: number }>`
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, ${(p) => p.$cellSize}px);
  grid-template-rows: repeat(${(p) => p.$rows}, ${(p) => p.$cellSize}px);
  width: 100%;
  height: 100%;
`;

const pulseAnimation = keyframes`
  0% { opacity: 0; }
  50% { opacity: 0.1; }
  100% { opacity: 0; }
`;

const BackgroundCell = styled.div<{ $delay: number; $shouldPulse: boolean }>`
  width: 100%;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  background-color: transparent;

  ${(p) =>
    p.$shouldPulse &&
    css`
    &::after {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      background: white;
      opacity: 0;
      animation: ${pulseAnimation} 4s infinite;
      animation-delay: ${p.$delay}s;
    }
  `}
`;

const ActiveCell = styled(motion.div) <{ $color: string; $cellSize: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(p) => p.$cellSize}px;
  height: ${(p) => p.$cellSize}px;
  background-color: ${(p) => p.$color};
  box-shadow: ${(p) => `0 0 15px ${p.$color}30, inset 0 0 8px ${p.$color}20`};
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
  border-radius: 2px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export interface PixelGridProps {
  className?: string;
}

export function PixelGrid({ className }: PixelGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState({ cols: 0, rows: 0, cellSize: 48 });

  useEffect(() => {
    const updateGrid = () => {
      if (!wrapperRef.current) return;
      const { clientWidth, clientHeight } = wrapperRef.current;
      // Make the grid exactly 5 rows tall
      const cellSize = clientHeight / 5;
      const cols = Math.ceil(clientWidth / cellSize);
      const rows = 5;
      setGridSize({ cols, rows, cellSize });
    };

    updateGrid();
    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, []);

  // 1. Render the static faint background grid
  const backgroundCells = useMemo(() => {
    if (gridSize.cols === 0 || gridSize.rows === 0) return null;

    const items = [];
    for (let r = 0; r < gridSize.rows; r++) {
      for (let c = 0; c < gridSize.cols; c++) {
        const delay = ((r * 13) + (c * 7)) % 10;
        const shouldPulse = ((r * 31) + (c * 17)) % 100 > 90;
        items.push(
          <BackgroundCell
            key={`bg-${r}-${c}`}
            $delay={delay}
            $shouldPulse={shouldPulse}
          />
        );
      }
    }
    return items;
  }, [gridSize]);

  // 2. Render the 17 active animating cells
  const activeCells = useMemo(() => {
    if (gridSize.cols === 0 || gridSize.rows === 0) return null;

    const startRow = Math.max(0, Math.floor((gridSize.rows - 5) / 2));
    const startCol = Math.max(0, Math.floor((gridSize.cols - 5) / 2));

    return Object.entries(PATHS).map(([id, data]) => {
      // Map the mathematical grid steps to precise pixel coordinates
      const xKeyframes = data.path.map(p => (p[1] + startCol) * gridSize.cellSize);
      const yKeyframes = data.path.map(p => (p[0] + startRow) * gridSize.cellSize);

      return (
        <ActiveCell
          key={id}
          $color={TILE_COLORS[data.row]}
          $cellSize={gridSize.cellSize}
          animate={{
            x: xKeyframes,
            y: yKeyframes,
          }}
          transition={{
            duration: 8, // 1 second per step
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      );
    });
  }, [gridSize]);

  return (
    <GridWrapper ref={wrapperRef} className={className} aria-label="Brand Logo Grid">
      <GridContainer $cols={gridSize.cols} $rows={gridSize.rows} $cellSize={gridSize.cellSize}>
        {backgroundCells}
      </GridContainer>
      {/* Active cells float in their own layer over the grid */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {activeCells}
      </div>
    </GridWrapper>
  );
}