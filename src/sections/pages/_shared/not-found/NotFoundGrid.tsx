import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@store/uiStore';
import CyclicPreviousButton from '@components/common/ui/CyclicPreviousButton/CyclicPreviousButton';
import notFoundImage from '@assets/page/not_found/hero.png';

import {
    MasterLayout,
    VisualSection,
    ImageFrame,
    LedgerRow,
    LedgerCell,
    CenterDisplay,
    HugeCode,
    BottomActionSection
} from './NotFoundGrid.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;

export default function NotFoundGrid() {
    const { setHeaderTheme } = useUiStore();

    useEffect(() => {
        // Pure, uncompromising contrast mandates a light theme header boundary
        setHeaderTheme('light');
    }, [setHeaderTheme]);

    return (
        <MasterLayout>

            {/* ─── SECTION 1: THE MONOLITHIC FRAME ─── */}
            <VisualSection>
                <ImageFrame
                    as={motion.div}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: premiumEase }}
                >
                    <img
                        src={notFoundImage}
                        alt="Operational bound error imagery"
                    />
                </ImageFrame>
            </VisualSection>

            {/* ─── SECTION 2: THE 3-COLUMN BOUNDARY LEDGER ─── */}
            <LedgerRow>

                {/* COLUMN 1: System Definition */}
                <LedgerCell
                    as={motion.div}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: premiumEase, delay: 0.3 }}
                >
                </LedgerCell>

                {/* COLUMN 2: Supreme Typographic Error Anchor */}
                <LedgerCell
                    as={motion.div}
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: premiumEase, delay: 0.1 }}
                >
                    <CenterDisplay>
                        <HugeCode>404</HugeCode>
                    </CenterDisplay>
                </LedgerCell>

                {/* COLUMN 3: Structural Escape Mechanics */}
                <LedgerCell
                    as={motion.div}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: premiumEase, delay: 0.4 }}
                >
                </LedgerCell>

            </LedgerRow>

            {/* ─── SECTION 3: PREVIOUS ACTION SECTION ─── */}
            <BottomActionSection
                as={motion.section}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: premiumEase, delay: 0.5 }}
            >
                <CyclicPreviousButton label="Previous" />
            </BottomActionSection>

        </MasterLayout>
    );
}