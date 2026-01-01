import styled from 'styled-components';
import { motion } from 'framer-motion';

export interface TimelineItem {
    date: string;
    title: string;
    description: string;
    type: 'milestone' | 'publication' | 'launch';
}

interface TimelineProps {
    items: TimelineItem[];
}

const TimelineContainer = styled.div`
  position: relative;
  padding-left: ${({ theme }) => theme.spacing[8]};
  max-width: 800px;
  margin: 0 auto;
  
  /* Vertical line */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${({ theme }) => theme.colors.border};
  }
`;

const TimelineEntry = styled(motion.div)`
  position: relative;
  padding-bottom: ${({ theme }) => theme.spacing[12]};
  
  /* Dot on timeline */
  &::before {
    content: '';
    position: absolute;
    left: -${({ theme }) => theme.spacing[8]};
    top: 4px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent.teal};
    border: 3px solid ${({ theme }) => theme.colors.background.primary};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.accent.teal};
    transform: translateX(-50%);
    z-index: 1;
  }
  
  &:last-child {
      padding-bottom: 0;
  }
`;

const TimelineDate = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.accent.teal};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const TimelineTitle = styled.h4`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const TimelineDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

export const Timeline = ({ items }: TimelineProps) => {
    return (
        <TimelineContainer>
            {items.map((item, index) => (
                <TimelineEntry
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                    <TimelineDate>{item.date}</TimelineDate>
                    <TimelineTitle>{item.title}</TimelineTitle>
                    <TimelineDescription>{item.description}</TimelineDescription>
                </TimelineEntry>
            ))}
        </TimelineContainer>
    );
};
