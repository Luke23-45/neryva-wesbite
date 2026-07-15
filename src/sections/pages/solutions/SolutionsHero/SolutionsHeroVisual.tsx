

export function SolutionsHeroVisual() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="noiseFilter" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" in="noise" result="coloredNoise" />
          <feBlend in="SourceGraphic" in2="coloredNoise" mode="screen" />
        </filter>
        <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Base Noise Background */}
      <rect width="100%" height="100%" fill="url(#bridgeGrad)" filter="url(#noiseFilter)" />

      {/* Geometric Overlay representing 'The Commercial Bridge' */}
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none">
        {/* Abstract structural grid */}
        <path d="M 100 0 L 100 800 M 300 0 L 300 800 M 500 0 L 500 800 M 700 0 L 700 800" />
        <path d="M 0 200 L 800 200 M 0 400 L 800 400 M 0 600 L 800 600" />
        
        {/* Bold architectural diagonals */}
        <line x1="100" y1="600" x2="500" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <line x1="300" y1="800" x2="700" y2="400" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <line x1="100" y1="200" x2="700" y2="200" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
        
        {/* Node intersections representing connections */}
        <circle cx="100" cy="200" r="4" fill="#FFFFFF" />
        <circle cx="300" cy="400" r="4" fill="#FFFFFF" />
        <circle cx="500" cy="200" r="4" fill="#FFFFFF" />
        <circle cx="700" cy="400" r="4" fill="#FFFFFF" />
        <circle cx="500" cy="600" r="4" fill="#FFFFFF" />
        
        {/* Subtle glowing highlights */}
        <circle cx="500" cy="200" r="20" fill="rgba(124, 58, 237, 0.2)" filter="blur(8px)" stroke="none" />
        <circle cx="300" cy="400" r="30" fill="rgba(30, 58, 138, 0.2)" filter="blur(12px)" stroke="none" />
      </g>
      
      {/* Structural Labeling */}
      <g fill="rgba(255,255,255,0.4)" fontFamily="monospace" fontSize="10" letterSpacing="0.1em">
        <text x="110" y="190">NODE_A // COMM_LAYER</text>
        <text x="510" y="190">NODE_B // ENT_DEPLOY</text>
        <text x="310" y="390">AXIS_01 // CORE_ROUTING</text>
      </g>
    </svg>
  );
}
