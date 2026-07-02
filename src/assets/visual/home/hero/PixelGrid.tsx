import React, { useEffect, useRef, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tile {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  scale: number;
}

// ─── Brand color stops (Neryva Oranges and Reds) ───────────────────────────────

const BRAND_COLORS = [
  "rgba(255, 76, 0, VAL)",   // #ff4c00 Neryva Orange
  "rgba(230, 0, 0, VAL)",    // #e60000 Neryva Red
  "rgba(255, 140, 0, VAL)",  // #ff8c00 Dark Orange
  "rgba(204, 0, 0, VAL)",    // #cc0000 Deep Red
];

function pickColor(opacity: number): string {
  const raw = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
  return raw.replace("VAL", String(opacity.toFixed(3)));
}

// ─── Tile generation ──────────────────────────────────────────────────────────

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateTiles(count: number, seed: number): Tile[] {
  const rand = seedRandom(seed);
  const tiles: Tile[] = [];

  const SIZES = [
    { w: 120, h: 48 },
    { w: 80, h: 80 },
    { w: 200, h: 36 },
    { w: 60, h: 120 },
    { w: 160, h: 56 },
    { w: 48, h: 48 },
    { w: 240, h: 44 },
    { w: 96, h: 96 },
  ];

  for (let i = 0; i < count; i++) {
    const sizeTemplate = SIZES[Math.floor(rand() * SIZES.length)];
    const widthVariance = 0.75 + rand() * 0.5;
    const heightVariance = 0.75 + rand() * 0.5;

    tiles.push({
      id: i,
      x: rand() * 110 - 5,           // % of container width  (allow slight bleed)
      y: rand() * 110 - 5,           // % of container height
      width: sizeTemplate.w * widthVariance,
      height: sizeTemplate.h * heightVariance,
      color: pickColor(0.08 + rand() * 0.22),
      opacity: 1,
      duration: 4 + rand() * 8,      // seconds for one drift cycle
      delay: rand() * -12,            // stagger start (negative = already in motion)
      driftX: (rand() - 0.5) * 3,   // % drift amount in X
      driftY: (rand() - 0.5) * 2,   // % drift amount in Y
      scale: 0.92 + rand() * 0.16,
    });
  }

  return tiles;
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const makeDrift = (driftX: number, driftY: number, scale: number) => keyframes`
  0%   { transform: translate(0%,       0%)       scale(1);           opacity: 0; }
  8%   { opacity: 1; }
  40%  { transform: translate(${driftX * 0.6}%, ${driftY * 0.6}%) scale(${scale}); }
  60%  { transform: translate(${driftX}%,        ${driftY}%)        scale(${1 + (scale - 1) * 0.4}); }
  92%  { opacity: 1; }
  100% { transform: translate(0%,       0%)       scale(1);           opacity: 0; }
`;

// ─── Styled components ────────────────────────────────────────────────────────

const Container = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
`;

const TileCanvas = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
`;

interface TileElProps {
  $x: number;
  $y: number;
  $width: number;
  $height: number;
  $color: string;
  $duration: number;
  $delay: number;
  $driftX: number;
  $driftY: number;
  $scale: number;
}

const TileEl = styled.div<TileElProps>`
  position: absolute;
  left:   ${(p) => p.$x}%;
  top:    ${(p) => p.$y}%;
  width:  ${(p) => p.$width}px;
  height: ${(p) => p.$height}px;
  background: ${(p) => p.$color};
  border-radius: 4px;
  border: 1px solid ${(p) => p.$color.replace(/[\d.]+\)$/, "0.25)")};
  will-change: transform, opacity;
  ${(p) =>
    css`
      animation: ${makeDrift(p.$driftX, p.$driftY, p.$scale)}
        ${p.$duration}s
        ${p.$delay}s
        ease-in-out
        infinite;
    `}

  /* Subtle inner glow from brand hue */
  box-shadow:
    inset 0 0 12px  ${(p) => p.$color.replace(/[\d.]+\)$/, "0.15)")},
            0 0 20px ${(p) => p.$color.replace(/[\d.]+\)$/, "0.04)")};
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface PixelGridProps {
  /** Number of animated background tiles. Default: 32 */
  tileCount?: number;
}

export function PixelGrid({ tileCount = 32 }: PixelGridProps) {
  // Generate tiles once — seeded so SSR and client match
  const tiles = useMemo<Tile[]>(() => generateTiles(tileCount, 42), [tileCount]);

  // Pause animations when tab is hidden (respects battery / GPU)
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onVisibility = () => {
      el.style.animationPlayState = document.hidden ? "paused" : "running";
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Container ref={sectionRef} aria-hidden="true">
      <TileCanvas>
        {tiles.map((tile) => (
          <TileEl
            key={tile.id}
            $x={tile.x}
            $y={tile.y}
            $width={tile.width}
            $height={tile.height}
            $color={tile.color}
            $duration={tile.duration}
            $delay={tile.delay}
            $driftX={tile.driftX}
            $driftY={tile.driftY}
            $scale={tile.scale}
          />
        ))}
      </TileCanvas>
    </Container>
  );
}