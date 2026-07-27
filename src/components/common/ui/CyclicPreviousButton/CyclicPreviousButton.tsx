import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ButtonWrapper,
    LabelText,
    PixelChevronIcon,
    IconContainer
} from './CyclicPreviousButton.styles';

interface CyclicPreviousButtonProps {
    label?: string;
    onClick?: () => void;
    className?: string;
}

const PixelLeftArrow = () => (
    <PixelChevronIcon viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <rect x="8" y="1" width="2" height="2" />
        <rect x="6" y="3" width="2" height="2" />
        <rect x="4" y="5" width="2" height="2" />
        <rect x="2" y="6" width="2" height="2" />
        <rect x="4" y="7" width="2" height="2" />
        <rect x="6" y="9" width="2" height="2" />
        <rect x="8" y="11" width="2" height="2" />
    </PixelChevronIcon>
);

const premiumTransition = {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1]
};

export default function CyclicPreviousButton({
    label = 'Previous',
    onClick,
    className
}: CyclicPreviousButtonProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        }
    };

    return (
        <ButtonWrapper
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={className}
            aria-label={label}
        >
            <IconContainer
                as={motion.div}
                initial={false}
                animate={{
                    width: isHovered ? 0 : 14,
                    opacity: isHovered ? 0 : 1,
                    x: isHovered ? -10 : 0,
                    marginRight: isHovered ? 0 : 10
                }}
                transition={premiumTransition}
                style={{ overflow: 'hidden' }}
            >
                <PixelLeftArrow />
            </IconContainer>

            <LabelText>
                {label}
            </LabelText>

            <IconContainer
                as={motion.div}
                initial={false}
                animate={{
                    width: isHovered ? 14 : 0,
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : 10,
                    marginLeft: isHovered ? 10 : 0
                }}
                transition={premiumTransition}
                style={{ overflow: 'hidden' }}
            >
                <PixelLeftArrow />
            </IconContainer>
        </ButtonWrapper>
    );
}
