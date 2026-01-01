import styled from 'styled-components';
import { Button, GridPattern, PulseRing } from '@components/atoms';
import { motion } from 'framer-motion';

interface CTASectionProps {
    title: string;
    description: string;
    primaryAction: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

const CTAContainer = styled.section`
  background: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing[32]} ${({ theme }) => theme.spacing[8]};
  text-align: center;
  position: relative;
  overflow: hidden;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const BackgroundGlow = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 400px;
    background: ${({ theme }) => theme.colors.accent.tealMuted};
    filter: blur(120px);
    opacity: 0.3;
    z-index: 0;
    pointer-events: none;
`;

const CTAContent = styled(motion.div)`
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  
  h2 {
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
    letter-spacing: -0.03em;
    line-height: 1;
  }
  
  p {
    font-family: ${({ theme }) => theme.typography.fontFamily.body};
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: ${({ theme }) => theme.spacing[12]};
    line-height: 1.6;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
    font-weight: ${({ theme }) => theme.typography.fontWeight.light};
  }
`;

const ButtonWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    width: 100%;
    
     ${ButtonWrapper}, button {
      width: 100%;
    }
  }
`;

export const CTASection = ({ title, description, primaryAction, secondaryAction }: CTASectionProps) => {
    return (
        <CTAContainer>
            <GridPattern />
            <BackgroundGlow />
            <CTAContent
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <h2>{title}</h2>
                <p>{description}</p>
                <ButtonGroup>
                    <ButtonWrapper>
                        <PulseRing color="#14B8A6" size="140%" />
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={primaryAction.onClick}
                        >
                            {primaryAction.label}
                        </Button>
                    </ButtonWrapper>
                    {secondaryAction && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={secondaryAction.onClick}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </ButtonGroup>
            </CTAContent>
        </CTAContainer>
    );
};
