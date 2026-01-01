import styled from 'styled-components';
import { motion } from 'framer-motion';

const SpinnerContainer = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.accent.teal};
  border-radius: 50%;
`;

export const LoadingSpinner = () => {
    return (
        <SpinnerContainer
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-label="Loading"
            role="status"
        />
    );
};
