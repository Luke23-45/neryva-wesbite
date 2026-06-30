import { Link, useMatchRoute } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import { getMainNav } from '@lib/data/navigation';
import logoSrc from '@assets/brand/meridian/pure_black/meridian-mark.svg';
import {
  StyledHeader,
  LogoLink,
  LogoImage,
  DesktopNav,
  NavLink,
  MobileMenuButton,
  MobileNavOverlay,
  MobileNavHeader,
  MobileNavLink,
} from './Header.styles';

const navItems = getMainNav();

export function Header() {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();
  const matchRoute = useMatchRoute();

  return (
    <>
      <StyledHeader>
        <LogoLink as={Link} to="/" onClick={closeMobileNav}>
          <LogoImage src={logoSrc} alt="Neryva" />
          <span>Neryva</span>
        </LogoLink>

        <DesktopNav>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              as={Link}
              to={item.href}
              $isActive={!!matchRoute({ to: item.href, fuzzy: true })}
            >
              {item.label}
            </NavLink>
          ))}
        </DesktopNav>

        <MobileMenuButton
          onClick={toggleMobileNav}
          aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
        </MobileMenuButton>
      </StyledHeader>

      <MobileNavOverlay $isOpen={isMobileNavOpen}>
        <MobileNavHeader>
          <LogoLink as={Link} to="/" onClick={closeMobileNav}>
            <LogoImage src={logoSrc} alt="Neryva" />
            <span>Neryva</span>
          </LogoLink>
          <MobileMenuButton onClick={closeMobileNav} aria-label="Close menu">
            <X size={24} />
          </MobileMenuButton>
        </MobileNavHeader>

        {navItems.map((item) => (
          <MobileNavLink
            key={item.href}
            as={Link}
            to={item.href}
            $isActive={!!matchRoute({ to: item.href, fuzzy: true })}
            onClick={closeMobileNav}
          >
            {item.label}
          </MobileNavLink>
        ))}
      </MobileNavOverlay>
    </>
  );
}
