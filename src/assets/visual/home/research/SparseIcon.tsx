import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

// 5×5 dot grid, sparse subset highlighted — shows selective activation
export function SparseIcon() {
  const theme = useTheme();
  const violet = theme.colors.accent.violet;
  const border = theme.colors.border;

  // Active pattern — intentionally sparse, visually distinct
  const activeSet = new Set(['0-2', '1-0', '1-4', '2-2', '3-1', '3-3', '4-0', '4-4']);

  const COLS = 5;
  const ROWS = 5;
  const SPACING = 16;
  const OFFSET_X = 8;
  const OFFSET_Y = 8;

  const dots = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r}-${c}`;
      const isActive = activeSet.has(key);
      const cx = OFFSET_X + c * SPACING;
      const cy = OFFSET_Y + r * SPACING;

      dots.push(
        <motion.circle
          key={key}
          cx={cx}
          cy={cy}
          r={isActive ? 4.5 : 2.5}
          fill={isActive ? violet : border}
          initial={{ opacity: isActive ? 0 : 0.4, scale: isActive ? 0.3 : 1 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: isActive ? 0.5 : 0.2,
            delay: isActive ? 0.1 + (r + c) * 0.05 : 0,
            type: isActive ? 'spring' : 'tween',
            bounce: 0.4,
          }}
        />
      );
    }
  }

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {dots}
    </svg>
  );
}
