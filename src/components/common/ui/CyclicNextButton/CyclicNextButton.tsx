import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ButtonWrapper,
    LabelText,
    PixelChevronIcon,
    IconContainer
} from './CyclicNextButton.styles';

interface CyclicNextButtonProps {
    label?: string;
    onClick?: () => void;
    className?: string;
    size?: 'default' | 'large';
    bgColor?: string;
    textColor?: string;
    borderRadius?: string | number;
}

const PixelRightArrow = ({ size, textColor }: { size?: 'default' | 'large', textColor?: string }) => (
    <PixelChevronIcon $size={size} $textColor={textColor} viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <rect x="4" y="1" width="2" height="2" />
        <rect x="6" y="3" width="2" height="2" />
        <rect x="8" y="5" width="2" height="2" />
        <rect x="10" y="6" width="2" height="2" />
        <rect x="8" y="7" width="2" height="2" />
        <rect x="6" y="9" width="2" height="2" />
        <rect x="4" y="11" width="2" height="2" />
    </PixelChevronIcon>
);

const premiumTransition = {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1]
};

export default function CyclicNextButton({
    label = 'Next',
    onClick,
    className,
    size = 'default',
    bgColor,
    textColor,
    borderRadius
}: CyclicNextButtonProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.forward();
            } else {
                window.location.href = '/';
            }
        }
    };

    const iconWidth = size === 'large' ? 16 : 14;
    const iconMargin = size === 'large' ? 12 : 10;

    return (
        <ButtonWrapper
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={className}
            aria-label={label}
            $size={size}
            $bgColor={bgColor}
            $textColor={textColor}
            $borderRadius={borderRadius}
        >
            <IconContainer
                as={motion.div}
                initial={false}
                animate={{
                    width: isHovered ? iconWidth : 0,
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? 0 : -10,
                    marginRight: isHovered ? iconMargin : 0
                }}
                transition={premiumTransition}
                style={{ overflow: 'hidden' }}
            >
                <PixelRightArrow size={size} textColor={textColor} />
            </IconContainer>

            <LabelText $size={size} $textColor={textColor}>
                {label}
            </LabelText>

            <IconContainer
                as={motion.div}
                initial={false}
                animate={{
                    width: isHovered ? 0 : iconWidth,
                    opacity: isHovered ? 0 : 1,
                    x: isHovered ? 10 : 0,
                    marginLeft: isHovered ? 0 : iconMargin
                }}
                transition={premiumTransition}
                style={{ overflow: 'hidden' }}
            >
                <PixelRightArrow size={size} textColor={textColor} />
            </IconContainer>
        </ButtonWrapper>
    );
}
