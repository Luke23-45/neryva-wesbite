import styled from 'styled-components';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number; // 0-100
    label?: string;
    showValue?: boolean;
}

const Container = styled.div`
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ProgressTrack = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${({ theme }) => theme.colors.gradients.primary};
  border-radius: ${({ theme }) => theme.radii.full};
`;

export const ProgressBar = ({ progress, label, showValue = true }: ProgressBarProps) => {
    return (
        <Container>
            {(label || showValue) && (
                <Header>
                    {label && <span>{label}</span>}
                    {showValue && <span>{Math.round(progress)}%</span>}
                </Header>
            )}
            <ProgressTrack role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <ProgressFill
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </ProgressTrack>
        </Container>
    );
};
