import { useMemo } from 'react';
import { motion } from 'framer-motion';

/*
  Abstract animated visual for the Enterprise hero.
  Composed of:
  1. Three soft gradient orbs (lilac, azure, emerald) — slow drift
  2. A thin node-network with connecting lines
  3. A glassmorphism card floating in the composition
*/

const spring = [0.16, 1, 0.3, 1] as const;

const W = 560;
const H = 480;

interface Orb {
  cx: number;
  cy: number;
  r: number;
  color1: string;
  color2: string;
  id: string;
  driftY: number[];
  driftX: number[];
  duration: number;
}

interface Node {
  x: number;
  y: number;
  r: number;
  glow: string;
}

/* ─── Orb definitions ─── */
const ORBS: Orb[] = [
  { cx: 160, cy: 140, r: 110, color1: '#C084FC', color2: '#7C3AED', id: 'orbLilac', driftY: [0, -18, 0], driftX: [0, 10, 0], duration: 24 },
  { cx: 380, cy: 200, r: 90, color1: '#2563EB', color2: '#1E40AF', id: 'orbAzure', driftY: [0, 14, 0], driftX: [0, -8, 0], duration: 28 },
  { cx: 260, cy: 360, r: 80, color1: '#05E3A4', color2: '#027A56', id: 'orbEmerald', driftY: [0, -12, 0], driftX: [0, 6, 0], duration: 22 },
];

/* ─── Node network points ─── */
const NODES: Node[] = [
  { x: 100, y: 100, r: 3.5, glow: '#C084FC' },
  { x: 220, y: 70, r: 3, glow: '#93C5FD' },
  { x: 360, y: 110, r: 4, glow: '#2563EB' },
  { x: 460, y: 80, r: 3, glow: '#C084FC' },
  { x: 140, y: 240, r: 3.5, glow: '#05E3A4' },
  { x: 300, y: 280, r: 4.5, glow: '#C084FC' },
  { x: 440, y: 300, r: 3, glow: '#2563EB' },
  { x: 180, y: 380, r: 3.5, glow: '#05E3A4' },
  { x: 380, y: 400, r: 3, glow: '#C084FC' },
  { x: 480, y: 200, r: 3, glow: '#2563EB' },
];

/* ─── Line connections (index pairs) ─── */
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3],
  [0, 4], [4, 5], [5, 6],
  [4, 7], [7, 8],
  [1, 5], [2, 5], [2, 9], [6, 9],
  [5, 8], [3, 9],
];

/* ─── Floating particles along connection paths ─── */
const PARTICLES = [
  { from: [220, 70], to: [360, 110], color: '#93C5FD', duration: 6, delay: 0 },
  { from: [300, 280], to: [440, 300], color: '#C084FC', duration: 7, delay: 1.2 },
  { from: [140, 240], to: [180, 380], color: '#05E3A4', duration: 5.5, delay: 0.8 },
  { from: [360, 110], to: [480, 200], color: '#2563EB', duration: 6.5, delay: 2.0 },
  { from: [100, 100], to: [220, 70], color: '#C084FC', duration: 5, delay: 0.5 },
];

export function EnterpriseHeroVisual() {
  const lines = useMemo(
    () =>
      CONNECTIONS.map(([a, b]) => ({
        x1: NODES[a].x,
        y1: NODES[a].y,
        x2: NODES[b].x,
        y2: NODES[b].y,
        key: `${a}-${b}`,
      })),
    [],
  );

  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: spring, delay: 0.3 }}
      style={{ display: 'block', maxWidth: 560, overflow: 'visible' }}
    >
      <defs>
        {/* Soft blur filter for orbs */}
        <filter id="heroOrbBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="40" />
        </filter>

        {/* Glow filter for nodes */}
        <filter id="heroNodeGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Orb gradients */}
        {ORBS.map((orb) => (
          <radialGradient key={orb.id} id={orb.id} cx="40%" cy="35%">
            <stop offset="0%" stopColor={orb.color1} stopOpacity="0.35" />
            <stop offset="60%" stopColor={orb.color2} stopOpacity="0.12" />
            <stop offset="100%" stopColor={orb.color2} stopOpacity="0" />
          </radialGradient>
        ))}

        {/* Glass card gradient */}
        <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>

      {/* ── Gradient orbs ── */}
      {ORBS.map((orb) => (
        <motion.circle
          key={orb.id}
          cx={orb.cx}
          cy={orb.cy}
          r={orb.r}
          fill={`url(#${orb.id})`}
          filter="url(#heroOrbBlur)"
          animate={{ cy: orb.driftY, cx: orb.driftX }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── Connecting lines ── */}
      <g opacity="0.14">
        {lines.map((line) => (
          <motion.line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="white"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: spring, delay: 0.6 + Math.random() * 0.4 }}
          />
        ))}
      </g>

      {/* ── Nodes ── */}
      {NODES.map((node, i) => (
        <motion.circle
          key={`node-${i}`}
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={node.glow}
          filter="url(#heroNodeGlow)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0.7, 1, 0.7], scale: 1 }}
          transition={{
            opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
            scale: { duration: 0.6, delay: 0.8 + i * 0.08, ease: spring },
          }}
        />
      ))}

      {/* ── Floating particles along lines ── */}
      {PARTICLES.map((p, i) => (
        <motion.circle
          key={`particle-${i}`}
          r={2.5}
          fill={p.color}
          filter="url(#heroNodeGlow)"
          initial={{ opacity: 0 }}
          animate={{
            cx: [p.from[0], p.to[0]],
            cy: [p.from[1], p.to[1]],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* ── Glassmorphism card ── */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: spring, delay: 1.2 }}
      >
        {/* Card body */}
        <rect
          x="200"
          y="160"
          width="160"
          height="120"
          rx="12"
          fill="url(#glassGrad)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        {/* Card content lines */}
        <rect x="220" y="185" width="72" height="6" rx="3" fill="rgba(192,132,252,0.4)" />
        <rect x="220" y="202" width="120" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
        <rect x="220" y="216" width="96" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
        <rect x="220" y="238" width="56" height="22" rx="6" fill="rgba(192,132,252,0.2)" stroke="rgba(192,132,252,0.3)" strokeWidth="1" />
        <rect x="284" y="238" width="56" height="22" rx="6" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </motion.g>
    </motion.svg>
  );
}
