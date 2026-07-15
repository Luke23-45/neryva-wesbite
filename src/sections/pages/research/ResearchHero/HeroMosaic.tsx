import { motion } from 'framer-motion';

const premiumEase = [0.16, 1, 0.3, 1] as const;

/* ── Absolute Mathematical Coordinates (Zero Randomness) ── */
// The grid creates a strict 5x5 lattice within an 800x800 viewBox.
const X_COORDS = [80, 240, 400, 560, 720];
const Y_COORDS = [80, 240, 400, 560, 720];

// Slowly drifting coordinates for the volumetric background lights
const ORBS = [
  { cx: 240, cy: 240, r: 280, fill: '#2458D3', delay: 0 }, // Oceanic Blue
  { cx: 560, cy: 560, r: 320, fill: '#0B7F79', delay: 2 }, // Technical Teal
  { cx: 600, cy: 200, r: 240, fill: '#D99100', delay: 4 }, // Energy Amber
];

// Structural hardware elements specifically placed to break the grid asymmetrically
const BLOCKS = [
  { x: X_COORDS[1], y: Y_COORDS[1], w: 160, h: 160, type: 'hollow' },
  { x: X_COORDS[2], y: Y_COORDS[2], w: 160, h: 320, type: 'glass' },
  { x: X_COORDS[3], y: Y_COORDS[1], w: 160, h: 160, type: 'solid' },
  { x: X_COORDS[1], y: Y_COORDS[3], w: 320, h: 160, type: 'hollow' },
];

export function HeroMosaic() {
  return (
    <svg
      viewBox="0 0 800 800"
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Extreme Volumetric Blur for the glowing "Latent Space" */}
        <filter id="ambientGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="90" result="blur" />
        </filter>

        {/* Cinematic Vignette to flawlessly blend the edge into the infinite dark bleed */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
          <stop offset="50%" stopColor="#06101e" stopOpacity="0" />
          <stop offset="100%" stopColor="#06101e" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* 1. THE VOID (Base Background) */}
      <rect width="800" height="800" fill="#06101e" />

      {/* 2. LATENT ENERGY (Volumetric Glowing Orbs) */}
      <g filter="url(#ambientGlow)">
        {ORBS.map((orb, i) => (
          <motion.circle
            key={`orb-${i}`}
            cx={orb.cx}
            cy={orb.cy}
            r={orb.r}
            fill={orb.fill}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 0.6, 0.4, 0.3], // Pulsing deeply and slowly
              cx: [orb.cx, orb.cx - 40, orb.cx + 20, orb.cx], // Drifting on X
              cy: [orb.cy, orb.cy + 30, orb.cy - 50, orb.cy], // Drifting on Y
            }}
            transition={{
              opacity: { duration: 2.5, delay: orb.delay, ease: premiumEase },
              cx: { duration: 20, ease: 'linear', repeat: Infinity },
              cy: { duration: 24, ease: 'linear', repeat: Infinity },
            }}
          />
        ))}
      </g>

      {/* 3. THE ARCHITECTURE (Path-Traced Lattice Lines) */}
      {/* Horizontal Lines */}
      {Y_COORDS.map((y, i) => (
        <motion.line
          key={`h-${i}`}
          x1={X_COORDS[0] - 80} // Start outside the main nodes
          y1={y}
          x2={X_COORDS[4] + 80} // End outside
          y2={y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: premiumEase, delay: 0.2 + i * 0.1 }}
        />
      ))}
      {/* Vertical Lines */}
      {X_COORDS.map((x, i) => (
        <motion.line
          key={`v-${i}`}
          x1={x}
          y1={Y_COORDS[0] - 80}
          x2={x}
          y2={Y_COORDS[4] + 80}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: premiumEase, delay: 0.6 + i * 0.1 }}
        />
      ))}

      {/* 4. THE COMPUTE (Architectural Blocks & Geometry) */}
      <g>
        {BLOCKS.map((block, i) => (
          <motion.rect
            key={`block-${i}`}
            x={block.x}
            y={block.y}
            width={block.w}
            height={block.h}
            fill={
              block.type === 'solid'
                ? 'rgba(255,255,255,0.08)'
                : block.type === 'glass'
                  ? 'rgba(255,255,255,0.02)'
                  : 'transparent'
            }
            stroke={block.type !== 'solid' ? 'rgba(255,255,255,0.15)' : 'none'}
            strokeWidth="1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: premiumEase, delay: 1.2 + i * 0.15 }}
          />
        ))}

        {/* Razor-sharp precision crosshairs at every node intersection */}
        {X_COORDS.map((x) =>
          Y_COORDS.map((y) => (
            <motion.g
              key={`cross-${x}-${y}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                ease: premiumEase,
                // Radiate outwards from the center node for drawing effect
                delay: 1.5 + (Math.abs(x - 400) + Math.abs(y - 400)) * 0.002,
              }}
            >
              <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            </motion.g>
          ))
        )}
      </g>

      {/* 5. IMMERSION BLEND (Vignette Overlay) */}
      {/* 
        This is what stops it from looking like a flat, cheap SVG bounding box. 
        It fades the razor-sharp grid seamlessly into the pitch-black void of the right bleed column.
      */}
      <rect
        width="800"
        height="600"
        fill="url(#vignette)"
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  );
}