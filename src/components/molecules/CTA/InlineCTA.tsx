import styled from 'styled-components';
import { Button } from '@components/atoms';
import { motion } from 'framer-motion';

interface InlineCTAProps {
    title: string;
    description: string;
    action: {
        label: string;
        onClick: () => void;
    };
}

const InlineCTAContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[8]};
  gap: ${({ theme }) => theme.spacing[8]};
  margin: ${({ theme }) => theme.spacing[8]} 0;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    text-align: center;
    gap: ${({ theme }) => theme.spacing[6]};
  }
`;

const Content = styled.div`
  flex: 1;

  h3 {
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }

  p {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    color: ${({ theme }) => theme.colors.text.secondary};
    margin: 0;
  }
`;

export const InlineCTA = ({ title, description, action }: InlineCTAProps) => {
    return (
        <InlineCTAContainer
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <Content>
                <h3>{title}</h3>
                <p>{description}</p>
            </Content>
            <Button variant="primary" onClick={action.onClick}>
                {action.label}
            </Button>
        </InlineCTAContainer>
    );
};
