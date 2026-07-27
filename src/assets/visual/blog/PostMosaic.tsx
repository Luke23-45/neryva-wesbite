import { useMemo } from 'react';

/* ─────────────────────────────────────────────────────────────
   PostMosaic: Parameterized geometric mosaic for blog cards.
   Uses a seeded random generator so each seed → unique pattern.
   Uses the post's colorTheme to build a vivid, bold palette.
   No framer-motion — cards animate as a whole unit externally.
───────────────────────────────────────────────────────────── */

interface Props {
  seed: number;
  baseColor: string; // hex, e.g. "#2458D3"
}

interface Tile {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  rx: number;
}

// Deterministic seeded RNG (Park-Miller)
function seeded(s: number) {
  let state = s;
  return () => {
    state = (state * 16807 + 0) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function buildPalette(r: number, g: number, b: number): string[] {
  // Lighter: blend toward white by 45%
  const lR = Math.min(255, Math.round(r + (255 - r) * 0.45));
  const lG = Math.min(255, Math.round(g + (255 - g) * 0.45));
  const lB = Math.min(255, Math.round(b + (255 - b) * 0.45));
  return [
    `rgb(${r},${g},${b})`,              // base solid — most prominent
    `rgba(${r},${g},${b},0.75)`,        // base 75%
    `rgba(${r},${g},${b},0.45)`,        // base 45%
    `rgb(${lR},${lG},${lB})`,           // lighter tint
    `rgba(${lR},${lG},${lB},0.65)`,    // lighter tint semi
    'rgba(255,255,255,0.94)',            // near-white
    'rgba(255,255,255,0.55)',            // white mid
    'rgba(255,255,255,0.22)',            // white ghost
  ];
}

const W = 400;
const H = 260;

export function PostMosaic({ seed, baseColor }: Props) {
  const { bgColor, tiles, crosses } = useMemo(() => {
    const rand = seeded(seed);
    const [r, g, b] = hexToRgb(baseColor);

    // Very dark version of the base color for the background
    const bgR = Math.round(r * 0.14);
    const bgG = Math.round(g * 0.14);
    const bgB = Math.round(b * 0.14);
    const bg = `rgb(${bgR},${bgG},${bgB})`;

    const palette = buildPalette(r, g, b);
    const pick = () => palette[Math.floor(rand() * palette.length)];
    const items: Tile[] = [];

    // ── Layer 1: Structural grid (5 cols × 4 rows) ──
    const COLS = 5;
    const ROWS = 4;
    const cW = W / COLS;
    const cH = H / ROWS;
    const filled = new Set<string>();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const key = `${row}-${col}`;
        if (filled.has(key)) continue;
        if (rand() < 0.18) continue; // leave some cells empty for depth

        const spanC = rand() > 0.68 && col < COLS - 1 && !filled.has(`${row}-${col + 1}`) ? 2 : 1;
        const spanR = rand() > 0.80 && row < ROWS - 1 && !filled.has(`${row + 1}-${col}`) ? 2 : 1;

        // Mark spanned cells as filled to avoid overlap
        for (let dr = 0; dr < spanR; dr++) {
          for (let dc = 0; dc < spanC; dc++) {
            filled.add(`${row + dr}-${col + dc}`);
          }
        }

        const GAP = 1.5; // gap between tiles for a clean separated look
        items.push({
          x: col * cW + GAP,
          y: row * cH + GAP,
          w: cW * spanC - GAP * 2,
          h: cH * spanR - GAP * 2,
          fill: pick(),
          rx: rand() > 0.72 ? 3 : 0,
        });
      }
    }

    // ── Layer 2: Mid-size overlay rectangles ──
    for (let i = 0; i < 7; i++) {
      const w = 36 + rand() * (W * 0.32);
      const h = 28 + rand() * (H * 0.38);
      items.push({
        x: rand() * (W - w * 0.5),
        y: rand() * (H - h * 0.5),
        w,
        h,
        fill: pick(),
        rx: rand() > 0.55 ? 4 : 0,
      });
    }

    // ── Layer 3: Small accent squares ──
    for (let i = 0; i < 5; i++) {
      const sz = 10 + rand() * 22;
      items.push({
        x: rand() * (W - sz),
        y: rand() * (H - sz),
        w: sz,
        h: sz,
        fill: pick(),
        rx: rand() > 0.5 ? sz / 2 : 2,
      });
    }

    // Crosshair positions (subtle depth markers)
    const crosses = [
      [W * 0.18, H * 0.28],
      [W * 0.72, H * 0.62],
      [W * 0.48, H * 0.14],
    ];

    return { bgColor: bg, tiles: items, crosses };
  }, [seed, baseColor]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Dark base background */}
      <rect width={W} height={H} fill={bgColor} />

      {/* Mosaic tiles */}
      {tiles.map((tile, i) => (
        <rect
          key={i}
          x={tile.x}
          y={tile.y}
          width={tile.w}
          height={tile.h}
          rx={tile.rx}
          fill={tile.fill}
        />
      ))}

      {/* Subtle crosshair markers */}
      {crosses.map(([cx, cy], i) => (
        <g key={`x-${i}`} opacity="0.18">
          <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke="white" strokeWidth="1" />
          <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} stroke="white" strokeWidth="1" />
        </g>
      ))}

      {/* Bottom vignette: fades to bg so the content below reads cleanly */}
      <defs>
        <linearGradient id={`vignette-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="70%" stopColor={bgColor} stopOpacity="0" />
          <stop offset="100%" stopColor={bgColor} stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#vignette-${seed})`} />
    </svg>
  );
}
