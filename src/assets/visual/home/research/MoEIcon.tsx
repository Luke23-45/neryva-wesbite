import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

// A rich routing diagram: input node → branching paths to 3 expert nodes → merged output
export function MoEIcon() {
  const theme = useTheme();
  const teal = theme.colors.accent.teal;
  const border = theme.colors.border;
  const muted = theme.colors.text.muted;

  const pathVariant = (delay: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 1.0, ease: 'easeOut' as const, delay },
  });

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Input node */}
      <circle cx="12" cy="48" r="6" fill={teal} />

      {/* Three branch paths: top, mid, bottom */}
      <motion.path
        d="M18 48 C 30 48, 36 20, 52 20"
        stroke={border} strokeWidth="2" strokeLinecap="round"
        {...pathVariant(0)}
      />
      <motion.path
        d="M18 48 C 30 48, 36 48, 52 48"
        stroke={teal} strokeWidth="2.5" strokeLinecap="round"
        {...pathVariant(0.15)}
      />
      <motion.path
        d="M18 48 C 30 48, 36 76, 52 76"
        stroke={border} strokeWidth="2" strokeLinecap="round"
        {...pathVariant(0)}
      />

      {/* Expert nodes: top (inactive), mid (active/selected), bottom (inactive) */}
      <circle cx="58" cy="20" r="7" fill="none" stroke={border} strokeWidth="2" />
      <text x="58" y="24" textAnchor="middle" fontSize="8" fill={muted} fontFamily="monospace">E1</text>

      <circle cx="58" cy="48" r="8" fill={teal} />
      <text x="58" y="52" textAnchor="middle" fontSize="8" fill="white" fontFamily="monospace" fontWeight="700">E2</text>

      <circle cx="58" cy="76" r="7" fill="none" stroke={border} strokeWidth="2" />
      <text x="58" y="80" textAnchor="middle" fontSize="8" fill={muted} fontFamily="monospace">E3</text>

      {/* Selected expert → output */}
      <motion.path
        d="M66 48 C 76 48, 80 48, 86 48"
        stroke={teal} strokeWidth="2.5" strokeLinecap="round"
        {...pathVariant(0.6)}
      />

      {/* Output node */}
      <motion.circle
        cx="86" cy="48" r="5"
        fill={teal}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9, duration: 0.4, type: 'spring', bounce: 0.5 }}
      />

      {/* Router label */}
      <text x="35" y="44" textAnchor="middle" fontSize="7" fill={muted} fontFamily="monospace" letterSpacing="0.5">ROUTER</text>
    </svg>
  );
}
