import { motion, AnimatePresence } from 'framer-motion';
import { useRouterState } from '@tanstack/react-router';
import { ReactNode } from 'react';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export const PageTransition = ({ children }: { children: ReactNode }) => {
    const { location } = useRouterState();

    return (
        <AnimatePresence mode="wait">
            <motion.main
                key={location.pathname}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
            >
                {children}
            </motion.main>
        </AnimatePresence>
    );
};
