import { Variants } from 'framer-motion';

export const motionConfig = {
    duration: {
        fast: 0.15,      // Micro-interactions
        normal: 0.3,     // Standard transitions
        slow: 0.5,       // Page transitions
        glacial: 0.8,    // Hero animations
    },

    spring: {
        snappy: { type: 'spring', stiffness: 400, damping: 30 },
        bouncy: { type: 'spring', stiffness: 300, damping: 20 },
        gentle: { type: 'spring', stiffness: 150, damping: 25 },
    },

    stagger: {
        fast: 0.05,
        normal: 0.1,
        slow: 0.15,
    },
};

// Variants
export const fadeInUpVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
};

export const fadeInDownVariants: Variants = {
    hidden: { opacity: 0, y: -24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const fadeInLeftVariants: Variants = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

export const fadeInRightVariants: Variants = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

export const scaleVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
};

export const popVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 400, damping: 20 },
    },
};

export const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

export const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
};

export const buttonMotionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
};

export const cardMotionProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    whileHover: { y: -8, transition: { type: 'spring', stiffness: 300 } },
};

export const floatingAnimation = {
    animate: { y: [0, -10, 0] },
    transition: { duration: 4, ease: 'easeInOut', repeat: Infinity },
};

export const pulseRingAnimation = {
    animate: { scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] },
    transition: { duration: 2, ease: 'easeInOut', repeat: Infinity },
};
