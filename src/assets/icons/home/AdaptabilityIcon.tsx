import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

export function AdaptabilityIcon() {
  const theme = useTheme();
  const border = theme.colors.border;
  const accent = '#e60000'; // Neryva Red
  const orange = '#ff8c00'; // Dark Orange
  
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Source Knowledge Node */}
      <motion.rect x="16" y="36" width="24" height="24" rx="6" stroke={accent} strokeWidth="2.5" fill="none"
        initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
      />
      {/* Inner core */}
      <motion.circle cx="28" cy="48" r="4" fill={accent}
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
      />

      {/* Transfer paths */}
      <motion.path d="M42 48 L 64 28" stroke={border} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.8 }}
      />
      <motion.path d="M42 48 L 64 68" stroke={border} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.8 }}
      />

      {/* Knowledge Packets transferring */}
      <motion.circle cx="42" cy="48" r="3" fill={orange}
        initial={{ x: 0, y: 0, opacity: 0 }}
        whileInView={{ x: 22, y: -20, opacity: [0, 1, 0] }}
        viewport={{ once: true }}
        transition={{ delay: 1.2, duration: 1, ease: "easeInOut" }}
      />
      <motion.circle cx="42" cy="48" r="3" fill={orange}
        initial={{ x: 0, y: 0, opacity: 0 }}
        whileInView={{ x: 22, y: 20, opacity: [0, 1, 0] }}
        viewport={{ once: true }}
        transition={{ delay: 1.4, duration: 1, ease: "easeInOut" }}
      />

      {/* Destination Nodes (Adapted) */}
      <motion.circle cx="72" cy="24" r="8" stroke={border} strokeWidth="2" fill="none"
        initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 }}
      />
      <motion.circle cx="72" cy="24" r="3" fill={orange}
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.8 }}
      />

      <motion.rect x="64" y="64" width="16" height="16" rx="3" stroke={border} strokeWidth="2" fill="none"
        initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9 }}
      />
      <motion.rect x="69" y="69" width="6" height="6" rx="1" fill={orange}
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 2.0 }}
      />
    </svg>
  );
}
