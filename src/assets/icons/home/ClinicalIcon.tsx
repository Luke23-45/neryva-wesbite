import { motion } from 'framer-motion';

// Clinical AI icon: ECG heartbeat line + a clean verification checkmark
export function ClinicalIcon({ accent }: { accent: string }) {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* ECG flat line before pulse */}
      <line x1="8" y1="52" x2="24" y2="52" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />

      {/* ECG pulse — sharp, medical-grade waveform */}
      <motion.path
        d="M24 52 L36 52 L40 28 L44 72 L48 40 L52 56 L56 52 L88 52"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
      />

      {/* Shield outline — safety/oversight */}
      <motion.path
        d="M48 14 L60 20 L60 34 Q60 44 48 50 Q36 44 36 34 L36 20 Z"
        stroke={accent}
        strokeWidth="2"
        fill={accent}
        fillOpacity="0.08"
        strokeLinejoin="round"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        style={{ transformOrigin: '48px 32px' }}
        transition={{ duration: 0.5, delay: 0.8, type: 'spring', bounce: 0.3 }}
      />

      {/* Checkmark inside shield */}
      <motion.path
        d="M42 32 L46 37 L55 27"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 1.1 }}
      />
    </svg>
  );
}
