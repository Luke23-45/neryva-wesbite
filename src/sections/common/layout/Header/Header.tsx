import { useState, useRef } from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import { getMainNav } from '@lib/data/navigation';
import logoSrc from '@assets/brand/meridian/pure_black/meridian-mark.svg';
import {
  StyledHeader,
  HeaderLeft,
  HeaderCenter,
  HeaderRight,
  LogoLink,
  LogoImage,
  DesktopNav,
  NavLink,
  NavItemWrapper,
  DropdownPanel,
  DropdownItem,
  AccentDot,
  MegaMenuPanel,
  MegaMenuColumn,
  MegaMenuTitle,
  MegaMenuLink,
  DesktopActions,
  ButtonPrimary,
  MobileMenuButton,
  MobileNavOverlay,
  MobileNavHeader,
  MobileNavLink,
  MobileSubLink,
  MobileActions,
} from './Header.styles';

const navItems = getMainNav();

export function Header() {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();
  const matchRoute = useMatchRoute();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (href: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(href);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  return (
    <>
      <StyledHeader>
        {/* LEFT: Brand Logo */}
        <HeaderLeft>
          <LogoLink as={Link} to="/" onClick={closeMobileNav}>
            <LogoImage src={logoSrc} alt="Neryva" />
            <span>Neryva</span>
          </LogoLink>
        </HeaderLeft>

        {/* CENTER: Main Navigation */}
        <HeaderCenter>
          <DesktopNav>
            {navItems.map((item) => {
              // 1. Mega Menu (e.g., Resources)
              if (item.megaMenu) {
                return (
                  <NavItemWrapper
                    key={item.href}
                    onMouseEnter={() => handleMouseEnter(item.href)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      as={Link}
                      to={item.href}
                      $isActive={!!matchRoute({ to: item.href, fuzzy: true })}
                    >
                      {item.label}
                    </NavLink>
                    <MegaMenuPanel
                      $isOpen={openDropdown === item.href}
                      onMouseEnter={() => handleMouseEnter(item.href)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {item.megaMenu.map((section) => (
                        <MegaMenuColumn key={section.title}>
                          <MegaMenuTitle>{section.title}</MegaMenuTitle>
                          {section.items.map((link) => {
                            // Check if external link
                            const isExternal = link.href.startsWith('http');
                            if (isExternal) {
                              return (
                                <MegaMenuLink
                                  key={link.href}
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  {link.label}
                                </MegaMenuLink>
                              );
                            }
                            return (
                              <MegaMenuLink
                                key={link.href}
                                as={Link}
                                to={link.href}
                                onClick={() => setOpenDropdown(null)}
                              >
                                {link.label}
                              </MegaMenuLink>
                            );
                          })}
                        </MegaMenuColumn>
                      ))}
                    </MegaMenuPanel>
                  </NavItemWrapper>
                );
              }

              // 2. Standard Dropdown (e.g., Programs)
              if (item.children) {
                return (
                  <NavItemWrapper
                    key={item.href}
                    onMouseEnter={() => handleMouseEnter(item.href)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      as={Link}
                      to={item.href}
                      $isActive={!!matchRoute({ to: item.href, fuzzy: true })}
                    >
                      {item.label}
                    </NavLink>
                    <DropdownPanel
                      $isOpen={openDropdown === item.href}
                      onMouseEnter={() => handleMouseEnter(item.href)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {item.children.map((child) => (
                        <DropdownItem
                          key={child.href}
                          as={Link}
                          to={child.href}
                          onClick={() => setOpenDropdown(null)}
                        >
                          <AccentDot $color={child.accent} />
                          {child.label}
                        </DropdownItem>
                      ))}
                    </DropdownPanel>
                  </NavItemWrapper>
                );
              }

              // 3. Simple Link
              return (
                <NavLink
                  key={item.href}
                  as={Link}
                  to={item.href}
                  $isActive={!!matchRoute({ to: item.href, fuzzy: true })}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </DesktopNav>
        </HeaderCenter>

        {/* RIGHT: CTAs & Mobile Toggle */}
        <HeaderRight>
          <DesktopActions>
            <ButtonPrimary as={Link} to="/contact">
              Contact Us
            </ButtonPrimary>
          </DesktopActions>

          <MobileMenuButton
            onClick={toggleMobileNav}
            aria-expanded={isMobileNavOpen}
            aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </MobileMenuButton>
        </HeaderRight>
      </StyledHeader>

      {/* MOBILE DRAWER */}
      <MobileNavOverlay $isOpen={isMobileNavOpen} aria-hidden={!isMobileNavOpen}>
        <MobileNavHeader>
          <LogoLink as={Link} to="/" onClick={closeMobileNav}>
            <LogoImage src={logoSrc} alt="Neryva" />
            <span>Neryva</span>
          </LogoLink>
          <MobileMenuButton onClick={closeMobileNav} aria-label="Close menu">
            <X size={18} />
          </MobileMenuButton>
        </MobileNavHeader>

        {navItems.map((item) => (
          <div key={item.href}>
            <MobileNavLink
              as={Link}
              to={item.href}
              $isActive={!!matchRoute({ to: item.href, fuzzy: true })}
              onClick={item.children || item.megaMenu ? undefined : closeMobileNav}
            >
              {item.label}
            </MobileNavLink>
            
            {/* Render children sub-links */}
            {item.children?.map((child) => (
              <MobileSubLink
                key={child.href}
                as={Link}
                to={child.href}
                onClick={closeMobileNav}
              >
                <AccentDot $color={child.accent} />
                {child.label}
              </MobileSubLink>
            ))}

            {/* Render megaMenu sub-links grouped by section title */}
            {item.megaMenu?.map((section) => (
              <div key={section.title}>
                <MobileSubLink
                  as="span"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    borderBottom: 'none',
                    paddingBottom: '0',
                    marginTop: '8px'
                  }}
                >
                  {section.title}
                </MobileSubLink>
                {section.items.map((link) => {
                  const isExternal = link.href.startsWith('http');
                  if (isExternal) {
                    return (
                      <MobileSubLink
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeMobileNav}
                        style={{ paddingLeft: '32px' }}
                      >
                        {link.label}
                      </MobileSubLink>
                    );
                  }
                  return (
                    <MobileSubLink
                      key={link.href}
                      as={Link}
                      to={link.href}
                      onClick={closeMobileNav}
                      style={{ paddingLeft: '32px' }}
                    >
                      {link.label}
                    </MobileSubLink>
                  );
                })}
              </div>
            ))}
          </div>
        ))}

        <MobileActions>
          <ButtonPrimary as={Link} to="/contact" onClick={closeMobileNav}>
            Contact Us
          </ButtonPrimary>
        </MobileActions>
      </MobileNavOverlay>
    </>
  );
}