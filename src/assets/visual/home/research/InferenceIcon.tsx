import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

// Parallel pipeline stages: tokens → quantize → cache → decode → output
export function InferenceIcon() {
  const theme = useTheme();
  const coral = theme.colors.accent.coral;
  const coralLight = theme.colors.accent.coralLight;
  const border = theme.colors.border;
  const muted = theme.colors.text.muted;

  const stages = [
    { x: 6, label: 'QUANT', color: coralLight },
    { x: 30, label: 'CACHE', color: coralLight },
    { x: 54, label: 'SPEC', color: coral },
    { x: 78, label: 'OUT', color: coral },
  ];

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Three parallel token rows (input stream) */}
      {[30, 48, 66].map((y, rowIdx) => (
        <g key={y}>
          {stages.map((stage, i) => (
            <motion.rect
              key={i}
              x={stage.x}
              y={y - 7}
              width={20}
              height={14}
              rx="3"
              fill={stage.color}
              opacity={0.15 + i * 0.2}
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 0.15 + i * 0.2 }}
              viewport={{ once: true }}
              style={{ originX: `${stage.x}px` }}
              transition={{
                delay: rowIdx * 0.08 + i * 0.12,
                duration: 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
          {/* Connector arrows between stages */}
          {stages.slice(0, -1).map((stage, i) => (
            <motion.path
              key={`arrow-${i}`}
              d={`M${stage.x + 20} ${y} L${stages[i + 1].x} ${y}`}
              stroke={border}
              strokeWidth="1.2"
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: rowIdx * 0.08 + i * 0.12 + 0.4, duration: 0.3 }}
            />
          ))}
        </g>
      ))}

      {/* Stage labels */}
      {stages.map((stage, i) => (
        <text
          key={i}
          x={stage.x + 10}
          y={20}
          textAnchor="middle"
          fontSize="6"
          fill={muted}
          fontFamily="monospace"
          letterSpacing="0.3"
        >
          {stage.label}
        </text>
      ))}

      {/* Throughput indicator at bottom */}
      <motion.path
        d="M8 84 L88 84"
        stroke={coral}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
      />
      <motion.polygon
        points="82,80 92,84 82,88"
        fill={coral}
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5, duration: 0.3, type: 'spring', bounce: 0.4 }}
      />

      {/* Arrow marker def */}
      <defs>
        <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <polygon points="0 0, 4 2, 0 4" fill={border} />
        </marker>
      </defs>
    </svg>
  );
}
