import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

export function EfficiencyIcon() {
  const theme = useTheme();
  const border = theme.colors.border;
  const accent = '#ff4c00'; // Neryva Orange
  const muted = theme.colors.text.muted;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Abstract structure with wasted paths fading away and efficient core path glowing */}
      
      {/* Wasted paths (fading out) */}
      <motion.path
        d="M20 20 Q 48 20 48 48 T 76 20"
        stroke={border} strokeWidth="2" strokeLinecap="round" fill="none"
        initial={{ opacity: 0.6 }}
        whileInView={{ opacity: 0.1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />
      <motion.path
        d="M20 76 Q 48 76 48 48 T 76 76"
        stroke={border} strokeWidth="2" strokeLinecap="round" fill="none"
        initial={{ opacity: 0.6 }}
        whileInView={{ opacity: 0.1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />

      {/* The Core Efficient Path */}
      <motion.path
        d="M12 48 L 84 48"
        stroke={accent} strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
      />
      
      {/* Nodes on the efficient path */}
      <motion.circle cx="12" cy="48" r="4" fill={accent} 
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
      />
      <motion.circle cx="48" cy="48" r="5" fill={accent} 
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.9 }}
      />
      <motion.circle cx="84" cy="48" r="4" fill={accent} 
        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.4 }}
      />

      {/* Decorative brackets indicating "cutting waste" */}
      <motion.path d="M 32 30 L 32 36 M 64 30 L 64 36" stroke={muted} strokeWidth="1.5" strokeLinecap="round"
        initial={{ opacity: 0, y: -5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1 }} />
      <motion.path d="M 32 66 L 32 60 M 64 66 L 64 60" stroke={muted} strokeWidth="1.5" strokeLinecap="round"
        initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1 }} />
    </svg>
  );
}
