import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useRouterState } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@components/atoms';
import { mainNavItems } from '../../../data/navigation';
import { Button } from '@components/atoms';

const HeaderContainer = styled.header<{ $scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${({ theme }) => theme.sizes.navHeight};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing[8]};
  background: ${({ $scrolled, theme }) =>
        $scrolled ? theme.colors.background.primary + 'E6' : 'transparent'};
  backdrop-filter: ${({ $scrolled }) =>
        $scrolled ? 'blur(10px)' : 'none'};
  border-bottom: 1px solid ${({ $scrolled, theme }) =>
        $scrolled ? theme.colors.border : 'transparent'};
  z-index: ${({ theme }) => theme.zIndices.sticky};
  transition: all 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[8]};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const NavLink = styled(Link) <{ $active: boolean }>`
  color: ${({ $active, theme }) =>
        $active ? theme.colors.accent.teal : theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent.tealLight};
  }
`;

const CTAWrapper = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  z-index: ${({ theme }) => theme.zIndices.modal + 1};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
  }
`;

// Mobile Menu Components
const MobileMenuOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay.blur};
  backdrop-filter: blur(10px);
  z-index: ${({ theme }) => theme.zIndices.modal};
`;

const MobileMenuContent = styled(motion.nav)`
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 400px;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing[10]};
  padding-top: ${({ theme }) => theme.sizes.navHeight};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
`;

const MobileNavLink = styled(Link) <{ $active: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $active, theme }) =>
        $active ? theme.colors.accent.teal : theme.colors.text.primary};
  text-decoration: none;
`;


// Animation variants
// Animation variants
const menuVariants = {
    closed: { x: '100%' },
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } as const },
};

const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
};

export const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { location } = useRouterState();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
        if (!mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    };

    return (
        <>
            <HeaderContainer $scrolled={scrolled || mobileMenuOpen}>
                <Logo />

                <NavLinks>
                    {mainNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path as any}
                            $active={location.pathname === item.path}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </NavLinks>

                <CTAWrapper>
                    <Link to="/contact">
                        <Button variant="primary" size="sm">Partner with Us</Button>
                    </Link>
                </CTAWrapper>

                <HamburgerButton onClick={toggleMobileMenu} aria-label="Toggle menu">
                    {mobileMenuOpen ? '✕' : '☰'}
                </HamburgerButton>
            </HeaderContainer>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <MobileMenuOverlay
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={overlayVariants}
                            onClick={toggleMobileMenu}
                        />
                        <MobileMenuContent
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={menuVariants}
                        >
                            {mainNavItems.map((item) => (
                                <MobileNavLink
                                    key={item.path}
                                    to={item.path as any}
                                    $active={location.pathname === item.path}
                                >
                                    {item.label}
                                </MobileNavLink>
                            ))}
                            <div style={{ marginTop: '20px' }}>
                                <Button variant="primary" size="lg" style={{ width: '100%' }}>
                                    Partner with Us
                                </Button>
                            </div>
                        </MobileMenuContent>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
