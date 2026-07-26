import React, { useEffect, useState, useRef, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";

// ─── Logo Matrix Configuration ───────────────────────────────────────────────

const N_MATRIX = [
  [1, 1, 0, 0, 1], // Row 1 (y: 0) - Top bridge mapping
  [1, 1, 1, 0, 1], // Row 2 (y: 1) - Diagonal drop
  [1, 0, 1, 0, 1], // Row 3 (y: 2) - Center equilibrium
  [1, 0, 1, 1, 1], // Row 4 (y: 3) - Diagonal completion
  [1, 0, 0, 1, 1], // Row 5 (y: 4) - Bottom anchor mirroring row 1
];

const TILE_COLORS = [
  "#C084FC", // Bright Lilac
  "#A855F7", // Rich Amethyst
  "#05E3A4", // Vibrant Emerald
  "#0284C7", // Mid Ocean Azure
  "#2563EB", // Royal Azure
];

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

const Cell = styled.div<{ $isActive: boolean; $color?: string; $delay: number; $shouldPulse: boolean }>`
  width: 100%;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  background-color: ${(p) => (p.$isActive ? p.$color : "transparent")};
  box-shadow: ${(p) => (p.$isActive ? `0 0 15px ${p.$color}30, inset 0 0 8px ${p.$color}20` : "none")};
  transition: background-color 0.4s ease, box-shadow 0.4s ease;

  &:hover {
    background-color: ${(p) => (!p.$isActive ? "rgba(255, 255, 255, 0.04)" : p.$color)};
    transition: background-color 0.1s ease;
  }

  ${(p) =>
    p.$shouldPulse &&
    !p.$isActive &&
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
      // Make the grid exactly 5 rows tall to remove extra vertical cells
      const cellSize = clientHeight / 5;
      const cols = Math.ceil(clientWidth / cellSize);
      const rows = 5;
      setGridSize({ cols, rows, cellSize });
    };

    updateGrid();
    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, []);

  const cells = useMemo(() => {
    if (gridSize.cols === 0 || gridSize.rows === 0) return null;

    const items = [];
    // Center vertically
    const startRow = Math.max(0, Math.floor((gridSize.rows - 5) / 2));
    
    // Center horizontally
    const startCol = Math.max(0, Math.floor((gridSize.cols - 5) / 2));

    for (let r = 0; r < gridSize.rows; r++) {
      for (let c = 0; c < gridSize.cols; c++) {
        const matrixRow = r - startRow;
        const matrixCol = c - startCol;
        
        let isActive = false;
        let color = "";
        
        if (
          matrixRow >= 0 && matrixRow < 5 &&
          matrixCol >= 0 && matrixCol < 5
        ) {
          if (N_MATRIX[matrixRow][matrixCol] === 1) {
            isActive = true;
            color = TILE_COLORS[matrixRow];
          }
        }

        // Pseudo-random delay based on coordinates
        const delay = ((r * 13) + (c * 7)) % 10;
        // Only pulse a small random subset of cells so it's not overwhelming
        const shouldPulse = ((r * 31) + (c * 17)) % 100 > 90;

        items.push(
          <Cell
            key={`${r}-${c}`}
            $isActive={isActive}
            $color={color}
            $delay={delay}
            $shouldPulse={shouldPulse}
          />
        );
      }
    }
    return items;
  }, [gridSize]);

  return (
    <GridWrapper ref={wrapperRef} className={className} aria-label="Brand Logo Grid">
      <GridContainer $cols={gridSize.cols} $rows={gridSize.rows} $cellSize={gridSize.cellSize}>
        {cells}
      </GridContainer>
    </GridWrapper>
  );
}