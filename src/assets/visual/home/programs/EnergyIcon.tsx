import { motion } from 'framer-motion';

// Energy icon: a network grid with efficiency optimization — nodes with waste reduction
export function EnergyIcon({ accent }: { accent: string }) {
  const nodes = [
    { cx: 16, cy: 48 },
    { cx: 40, cy: 18 },
    { cx: 80, cy: 24 },
    { cx: 70, cy: 62 },
    { cx: 40, cy: 76 },
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 3],
  ];

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Network edges */}
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.3 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
        />
      ))}

      {/* Optimal path highlight */}
      <motion.path
        d={`M${nodes[0].cx} ${nodes[0].cy} L${nodes[1].cx} ${nodes[1].cy} L${nodes[2].cx} ${nodes[2].cy} L${nodes[3].cx} ${nodes[3].cy}`}
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
      />

      {/* Nodes */}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={i === 2 ? 7 : 5}
          fill={i === 2 ? accent : 'none'}
          stroke={accent}
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          transition={{ delay: 0.1 + i * 0.1, duration: 0.3, type: 'spring', bounce: 0.4 }}
        />
      ))}

      {/* Efficiency arrow — pointing toward optimum */}
      <motion.path
        d="M80 18 L80 8 M76 12 L80 8 L84 12"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.0, duration: 0.4 }}
      />
    </svg>
  );
}
