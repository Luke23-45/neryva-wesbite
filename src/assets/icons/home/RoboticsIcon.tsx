import { motion } from 'framer-motion';

// Robotics icon: an articulated arm transferring a learned skill to a new target
export function RoboticsIcon({ accent }: { accent: string }) {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Base */}
      <rect x="36" y="82" width="24" height="6" rx="3" fill={accent} opacity="0.4" />

      {/* Arm segment 1 — lower */}
      <motion.line
        x1="48" y1="82"
        x2="48" y2="56"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />

      {/* Joint 1 */}
      <circle cx="48" cy="56" r="5" fill={accent} />

      {/* Arm segment 2 — upper, angled right */}
      <motion.line
        x1="48" y1="56"
        x2="68" y2="36"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.35 }}
      />

      {/* Joint 2 */}
      <circle cx="68" cy="36" r="5" fill={accent} />

      {/* End-effector / gripper */}
      <motion.path
        d="M68 30 L64 22 M68 30 L72 22"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.65 }}
      />

      {/* Dashed "ghost" arm at new task position — showing transfer */}
      <motion.line
        x1="48" y1="56"
        x2="22" y2="32"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.4 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />
      <motion.circle
        cx="22" cy="32" r="4"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeDasharray="3 2"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.4 }}
        viewport={{ once: true }}
        transition={{ delay: 1.1, duration: 0.3, type: 'spring', bounce: 0.4 }}
      />

      {/* Transfer arc */}
      <motion.path
        d="M68 34 Q48 14 22 30"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="3 3"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.5 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.9 }}
      />
    </svg>
  );
}
