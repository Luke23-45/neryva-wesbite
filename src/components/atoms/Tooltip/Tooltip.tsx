import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipContent = styled(motion.div)`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: ${({ theme }) => theme.zIndices.tooltip};
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.surface};
  }

  /* Optional: Border triangle */
  &::before {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(1px);
    border: 7px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.border};
    z-index: -1;
  }
`;

const tooltipVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 },
};

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}

export const Tooltip = ({ content, children }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <TooltipWrapper
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <TooltipContent
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={tooltipVariants}
                        transition={{ duration: 0.2 }}
                    >
                        {content}
                    </TooltipContent>
                )}
            </AnimatePresence>
        </TooltipWrapper>
    );
};
