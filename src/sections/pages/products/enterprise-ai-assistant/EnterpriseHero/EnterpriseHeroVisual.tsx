import { motion } from 'framer-motion';

/*
  Custom geometric mosaic visual inspired by the provided design.
  Features a rigid grid, blocky cyan/blue pillars, a swooping arc, and data nodes.
*/

const spring = [0.16, 1, 0.3, 1] as const;

export function EnterpriseHeroVisual() {
  const W = 800;
  const H = 600;

  // Colors based on the screenshot aesthetic
  const C_LIGHT = '#BDE0FE'; // Light icy blue
  const C_CYAN = '#00B4D8';  // Bright cyan
  const C_MID = '#0077B6';   // Mid blue
  const C_DARK = '#023E8A';  // Deep blue

  return (
    <motion.svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.0, ease: spring, delay: 0.2 }}
      style={{ display: 'block', maxWidth: 800, overflow: 'visible' }}
    >
      {/* ── Background Grid ── */}
      <defs>
        <pattern id="heroGrid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#heroGrid)" />

      {/* ── Left Pillar Structure ── */}
      <g>
        <motion.rect x="100" y="100" width="100" height="300" fill={C_LIGHT}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.8, delay: 0.3, ease: spring }} style={{ transformOrigin: 'bottom' }} />
        <motion.rect x="200" y="100" width="100" height="300" fill={C_CYAN}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.8, delay: 0.4, ease: spring }} style={{ transformOrigin: 'bottom' }} />
        
        <motion.rect x="100" y="400" width="100" height="100" fill={C_MID}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
        <motion.rect x="200" y="400" width="100" height="100" fill={C_DARK}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} />
        
        <motion.rect x="0" y="400" width="100" height="100" fill={C_DARK}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
        <motion.rect x="100" y="500" width="100" height="100" fill={C_MID}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />
      </g>

      {/* ── Right Pillar Structure ── */}
      <g>
        <motion.rect x="600" y="100" width="100" height="300" fill={C_LIGHT}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.8, delay: 0.5, ease: spring }} style={{ transformOrigin: 'bottom' }} />
        <motion.rect x="700" y="100" width="100" height="300" fill={C_CYAN}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.8, delay: 0.6, ease: spring }} style={{ transformOrigin: 'bottom' }} />

        <motion.rect x="600" y="400" width="100" height="100" fill={C_MID}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} />
        <motion.rect x="700" y="400" width="100" height="100" fill={C_DARK}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
        
        <motion.rect x="500" y="400" width="100" height="100" fill={C_CYAN}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />
      </g>

      {/* ── Bottom Connecting Blocks ── */}
      <motion.rect x="300" y="500" width="100" height="100" fill={C_CYAN}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} />
      <motion.rect x="400" y="500" width="100" height="100" fill={C_MID}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} />
      <motion.rect x="500" y="500" width="100" height="100" fill={C_LIGHT}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} />

      {/* ── Intersecting Arc Line ── */}
      <motion.path 
        d="M 350 -50 Q 400 300 750 350" 
        fill="none" 
        stroke="rgba(255,255,255,0.3)" 
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 1.2 }}
      />

      {/* ── Square Nodes on Arc ── */}
      <motion.rect x="382" y="112" width="6" height="6" fill="#ffffff" 
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8, type: 'spring' }} />
      
      <motion.rect x="562" y="212" width="6" height="6" fill="#ffffff" 
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.0, type: 'spring' }} />

      {/* ── Label Text (Matches product instead of 'FINANCE') ── */}
      <motion.text 
        x="585" 
        y="218" 
        fill="rgba(255,255,255,0.7)" 
        fontSize="12" 
        fontFamily="monospace"
        letterSpacing="2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.2 }}
      >
        AGENT STUDIO
      </motion.text>
    </motion.svg>
  );
}
