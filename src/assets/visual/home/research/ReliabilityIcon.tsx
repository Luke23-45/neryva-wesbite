import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

export function ReliabilityIcon() {
  const theme = useTheme();
  const border = theme.colors.border;
  const accent = '#cc0000'; // Deep Red
  const orange = '#ff4c00'; // Neryva Orange
  const muted = theme.colors.text.muted;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Strict validation bounds */}
      <motion.line x1="16" y1="24" x2="80" y2="24" stroke={border} strokeWidth="1.5" strokeDasharray="2 4"
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
      />
      <motion.line x1="16" y1="72" x2="80" y2="72" stroke={border} strokeWidth="1.5" strokeDasharray="2 4"
        initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
      />

      {/* Guardrails (solid vertical bounds on edges) */}
      <motion.path d="M 16 16 L 16 80 M 80 16 L 80 80" stroke={muted} strokeWidth="2" strokeLinecap="round"
        initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.6 }}
      />

      {/* Highly reliable controlled signal that stays within bounds */}
      <motion.path
        d="M 16 48 C 30 28, 40 68, 55 40 C 65 24, 72 60, 80 48"
        stroke={accent} strokeWidth="2.5" strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
      />

      {/* Validation checkmarks/dots at critical points */}
      <motion.circle cx="34" cy="46" r="3" fill={orange}
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 }}
      />
      <motion.circle cx="50" cy="55" r="3" fill={orange}
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.6 }}
      />
      <motion.circle cx="68" cy="40" r="3" fill={orange}
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.9 }}
      />
    </svg>
  );
}
