import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

// Unstable jagged line → smoothing → flat stable line with midpoint anchor
export function StabilityIcon() {
  const theme = useTheme();
  const success = theme.colors.semantic.success;
  const border = theme.colors.border;
  const warning = theme.colors.semantic.warning;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Axis */}
      <line x1="8" y1="80" x2="88" y2="80" stroke={border} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="80" x2="8" y2="12" stroke={border} strokeWidth="1.5" strokeLinecap="round" />

      {/* Unstable/chaotic region — jagged loss curve */}
      <motion.path
        d="M8 60 L18 40 L26 68 L34 28 L42 55"
        stroke={warning}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.7 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0 }}
      />

      {/* Transition point indicator */}
      <motion.circle
        cx="42" cy="55" r="3"
        fill={warning}
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.3, type: 'spring', bounce: 0.5 }}
      />

      {/* Stable region — smoothly descending loss */}
      <motion.path
        d="M42 55 C 52 50, 60 38, 70 32 C 76 29, 82 28, 88 27"
        stroke={success}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.75 }}
      />

      {/* Endpoint glow dot */}
      <motion.circle
        cx="88" cy="27" r="4"
        fill={success}
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5, duration: 0.3, type: 'spring', bounce: 0.5 }}
      />

      {/* LOSS label */}
      <text x="12" y="22" fontSize="7" fill={theme.colors.text.muted} fontFamily="monospace" letterSpacing="0.5">LOSS</text>
      <text x="70" y="92" fontSize="7" fill={theme.colors.text.muted} fontFamily="monospace" letterSpacing="0.5">STEPS</text>
    </svg>
  );
}
