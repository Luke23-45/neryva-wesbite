import { motion } from 'framer-motion';

// LLM icon: stacked transformer layers with attention flow
export function LLMIcon({ accent }: { accent: string }) {
  const LAYERS = 4;
  const W = 72;
  const GAP = 16;
  const START_Y = 14;
  const LAYER_H = 10;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Stacked attention layers */}
      {Array.from({ length: LAYERS }).map((_, i) => {
        const y = START_Y + i * (LAYER_H + GAP);
        const opacity = 0.3 + (i / (LAYERS - 1)) * 0.7;
        return (
          <motion.rect
            key={i}
            x={(96 - W) / 2}
            y={y}
            width={W}
            height={LAYER_H}
            rx="4"
            fill={accent}
            style={{ opacity }}
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
          />
        );
      })}

      {/* Attention flow arrows between layers */}
      {Array.from({ length: LAYERS - 1 }).map((_, i) => {
        const fromY = START_Y + i * (LAYER_H + GAP) + LAYER_H;
        const toY = fromY + GAP;
        return (
          <motion.line
            key={`arrow-${i}`}
            x1="48" y1={fromY + 1}
            x2="48" y2={toY - 1}
            stroke={accent}
            strokeWidth="1.5"
            strokeDasharray="2 2"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.5 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          />
        );
      })}

      {/* Output token glow at bottom */}
      <motion.circle
        cx="48"
        cy="84"
        r="5"
        fill={accent}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.4, type: 'spring', bounce: 0.5 }}
      />
    </svg>
  );
}
