import { useMemo } from 'react';
import { motion } from 'framer-motion';

/* 
  Animated geometric mosaic grid.
  On a dark background we use a white/light palette with varying opacities.
  Tiles animate in staggered, then subtly pulse.
*/

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  opacity: number;
  delay: number;
  rx: number;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// On dark: white/off-white palette with varying opacity for depth
const DARK_PALETTE = [
  'rgba(255,255,255,0.06)',
  'rgba(255,255,255,0.10)',
  'rgba(255,255,255,0.14)',
  'rgba(255,255,255,0.04)',
  'rgba(255,255,255,0.18)',
  'rgba(255,255,255,0.08)',
  'rgba(255,255,255,0.22)',
  'rgba(255,255,255,0.12)',
  // A couple of very subtly tinted tiles for visual interest
  'rgba(100,160,255,0.12)',
  'rgba(180,120,255,0.09)',
  'rgba(80,200,180,0.08)',
];

export function HeroMosaic() {
  const W = 960;
  const H = 320;

  const rects = useMemo<Rect[]>(() => {
    const rand = seeded(42);
    const items: Rect[] = [];

    // Layer 1: structural grid of large cells (6 cols × 3 rows)
    const cols = 7;
    const rows = 3;
    const cW = W / cols;
    const cH = H / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spanC = rand() > 0.72 && c < cols - 1 ? 2 : 1;
        const spanR = rand() > 0.82 && r < rows - 1 ? 2 : 1;
        items.push({
          x: c * cW,
          y: r * cH,
          w: cW * spanC,
          h: cH * spanR,
          fill: DARK_PALETTE[Math.floor(rand() * DARK_PALETTE.length)],
          opacity: 0.7 + rand() * 0.3,
          delay: rand() * 0.6,
          rx: rand() > 0.6 ? 4 : 0,
        });
      }
    }

    // Layer 2: mid-size overlay rects
    for (let i = 0; i < 12; i++) {
      const w = 60 + rand() * (W * 0.28);
      const h = 40 + rand() * (H * 0.45);
      items.push({
        x: rand() * (W - w * 0.5),
        y: rand() * (H - h * 0.5),
        w, h,
        fill: DARK_PALETTE[Math.floor(rand() * DARK_PALETTE.length)],
        opacity: 0.5 + rand() * 0.5,
        delay: 0.1 + rand() * 0.7,
        rx: rand() > 0.5 ? 6 : 0,
      });
    }

    // Layer 3: small accent squares
    for (let i = 0; i < 8; i++) {
      const size = 12 + rand() * 28;
      items.push({
        x: rand() * (W - size),
        y: rand() * (H - size),
        w: size, h: size,
        fill: DARK_PALETTE[Math.floor(rand() * DARK_PALETTE.length)],
        opacity: 0.6 + rand() * 0.4,
        delay: 0.2 + rand() * 0.8,
        rx: rand() > 0.4 ? size / 2 : 2,
      });
    }

    return items;
  }, []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Dark base */}
      <rect width={W} height={H} fill="#091629" />

      {/* Animated mosaic tiles */}
      {rects.map((r, i) => (
        <motion.rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          rx={r.rx}
          fill={r.fill}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{
            opacity: [0, r.opacity, r.opacity * 0.85, r.opacity],
            scale: [0.88, 1, 1, 1],
          }}
          transition={{
            duration: 1.8,
            delay: r.delay,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.4, 0.7, 1],
            // Subtle ongoing breathing animation
            repeat: Infinity,
            repeatType: 'mirror',
            repeatDelay: 2 + Math.random() * 4,
          }}
          style={{ transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px` }}
        />
      ))}

      {/* Crosshair marks at grid intersections — subtle depth markers */}
      {[
        [W * 0.25, H * 0.33], [W * 0.5, H * 0.5], [W * 0.75, H * 0.67],
        [W * 0.15, H * 0.8], [W * 0.85, H * 0.2],
      ].map(([cx, cy], i) => (
        <g key={`cross-${i}`} opacity="0.18">
          <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="white" strokeWidth="1" />
          <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="white" strokeWidth="1" />
        </g>
      ))}

      {/* Bottom and top vignette fades to blend with surrounding dark section */}
      <defs>
        <linearGradient id="heroTopFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06101e" stopOpacity="1" />
          <stop offset="25%" stopColor="#06101e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroBottomFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="75%" stopColor="#06101e" stopOpacity="0" />
          <stop offset="100%" stopColor="#06101e" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#heroTopFade)" />
      <rect width={W} height={H} fill="url(#heroBottomFade)" />
    </svg>
  );
}
