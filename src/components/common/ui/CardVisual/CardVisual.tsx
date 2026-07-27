import { useMemo } from 'react';

interface CardVisualProps {
  accent: string;
  title?: string;
}

// Deterministic seeded RNG so each card always renders the same pattern
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Convert hex to HSL, then generate shade variations
function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  rx: number;
}

export function CardVisual({ accent, title }: CardVisualProps) {
  const W = 480;
  const H = 280;

  const rects = useMemo(() => {
    const seed = accent.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137 + (title?.length ?? 0) * 31;
    const rand = seeded(seed);
    const [baseH, baseS, baseL] = hexToHSL(accent);

    // Generate a palette of 6-8 shades around the accent
    const palette: string[] = [];
    const count = 6 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const hShift = Math.round((rand() - 0.5) * 20);           // ±10° hue shift
      const sShift = Math.round(baseS + (rand() - 0.4) * 20);   // slight saturation variance
      const lShift = Math.round(20 + rand() * 50);               // lightness between 20%-70%
      palette.push(hsl(baseH + hShift, Math.min(100, Math.max(30, sShift)), lShift));
    }
    // Always include a very dark and a very saturated version
    palette.push(hsl(baseH, baseS, 18));
    palette.push(hsl(baseH, Math.min(100, baseS + 15), Math.max(35, baseL - 10)));

    const items: Rect[] = [];

    // LAYER 1: Base grid of larger blocks (4-6 columns, 3-4 rows)
    const cols = 4 + Math.floor(rand() * 3);
    const rows = 3 + Math.floor(rand() * 2);
    const cellW = W / cols;
    const cellH = H / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Some cells span 2 columns or 2 rows
        const spanC = (rand() > 0.75 && c < cols - 1) ? 2 : 1;
        const spanR = (rand() > 0.8 && r < rows - 1) ? 2 : 1;
        const x = c * cellW;
        const y = r * cellH;
        const w = cellW * spanC;
        const h = cellH * spanR;

        items.push({
          x,
          y,
          w,
          h,
          fill: palette[Math.floor(rand() * palette.length)],
          rx: 0,
        });
      }
    }

    // LAYER 2: Overlapping smaller rectangles for depth
    const overlaps = 8 + Math.floor(rand() * 8);
    for (let i = 0; i < overlaps; i++) {
      const w = 30 + rand() * (W * 0.35);
      const h = 24 + rand() * (H * 0.35);
      const x = rand() * (W - w * 0.3);
      const y = rand() * (H - h * 0.3);
      items.push({
        x, y, w, h,
        fill: palette[Math.floor(rand() * palette.length)],
        rx: rand() > 0.7 ? 6 : 0,
      });
    }

    // LAYER 3: A few small accent squares
    const accents = 4 + Math.floor(rand() * 4);
    for (let i = 0; i < accents; i++) {
      const size = 14 + rand() * 30;
      items.push({
        x: rand() * (W - size),
        y: rand() * (H - size),
        w: size,
        h: size,
        fill: palette[Math.floor(rand() * palette.length)],
        rx: rand() > 0.5 ? 3 : 0,
      });
    }

    return items;
  }, [accent, title]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', borderRadius: '16px' }}
    >
      {/* Fill entire canvas with darkest shade first */}
      <rect width={W} height={H} fill={accent} />

      {/* Mosaic grid */}
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          rx={r.rx}
          fill={r.fill}
        />
      ))}
    </svg>
  );
}
