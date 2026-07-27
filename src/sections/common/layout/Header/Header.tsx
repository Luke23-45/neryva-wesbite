import { useState, useRef, useEffect } from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useUiStore } from '@store/uiStore';
import { getMainNav } from '@lib/data/navigation';
import LogoIcon from '@assets/brand/transparent/logo-transparent-dark.svg?react';
import { NavMotifIcon, type NavMotifKind } from '@assets/visual/navigation/NavMotifs';
import {
  StyledHeader,
  HeaderInner,
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
  DropdownArrow,
  AccentDot,
  MenuGlyph,
  MegaMenuPanel,
  MegaMenuColumn,
  MegaMenuTitle,
  MegaMenuLink,
  MegaMenuArrow,
  DesktopActions,
  ButtonGhost,
  ButtonPrimary,
  MobileMenuButton,
  MobileNavOverlay,
  MobileNavHeader,
  MobileNavScroll,
  MobileNavGroup,
  MobileNavLink,
  MobileSubLinkContainer,
  MobileSubLink,
  MobileSectionTitle,
  MobileActions,
} from './Header.styles';

const navItems = getMainNav();

export function Header() {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav, headerTheme } = useUiStore();
  const isDark = headerTheme === 'dark';
  const matchRoute = useMatchRoute();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll-aware: track scroll position for header background transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile drawer: lock body scroll when open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  const handleMouseEnter = (href: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(href);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 80);
  };

  return (
    <>
      <StyledHeader $scrolled={scrolled} $isDark={isDark}>
        <HeaderInner>
          {/* LEFT: Brand Logo */}
          <HeaderLeft>
            <LogoLink as={Link} to="/" onClick={closeMobileNav} $isDark={isDark}>
              <LogoImage as={LogoIcon} aria-label="Neryva" />
              <span>Neryva</span>
            </LogoLink>
          </HeaderLeft>

          {/* CENTER: Main Navigation */}
          <HeaderCenter>
            <DesktopNav>
              {navItems.map((item) => {
                const isActive = !!matchRoute({ to: item.href, fuzzy: true });

                // 1. Mega Menu (e.g., Resources)
                if (item.megaMenu) {
                  return (
                    <NavItemWrapper
                      key={item.href}
                      onMouseEnter={() => handleMouseEnter(item.href)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <NavLink as={Link} to={item.href} $isActive={isActive} $isDark={isDark}>
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
                              const isExternal = link.href.startsWith('http');
                              const hasAccent = 'accent' in link && link.accent;
                              return (
                                <MegaMenuLink
                                  key={link.href}
                                  as={isExternal ? 'a' : Link}
                                  {...(isExternal
                                    ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
                                  : { to: link.href })}
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <MenuGlyph>
                                    {link.icon ? (
                                      <NavMotifIcon kind={link.icon as NavMotifKind} />
                                    ) : hasAccent ? (
                                      <AccentDot $color={link.accent!} />
                                    ) : null}
                                  </MenuGlyph>
                                  {link.label}
                                  <MegaMenuArrow aria-hidden="true"><ChevronRight size={18} strokeWidth={2.25} /></MegaMenuArrow>
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
                      <NavLink as={Link} to={item.href} $isActive={isActive} $isDark={isDark}>
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
                            <MenuGlyph>
                              {child.icon ? (
                                <NavMotifIcon kind={child.icon as NavMotifKind} />
                              ) : (
                                <AccentDot $color={child.accent || 'transparent'} />
                              )}
                            </MenuGlyph>
                            {child.label}
                            <DropdownArrow aria-hidden="true"><ChevronRight size={18} strokeWidth={2.25} /></DropdownArrow>
                          </DropdownItem>
                        ))}
                      </DropdownPanel>
                    </NavItemWrapper>
                  );
                }

                // 3. Simple Link
                return (
                  <NavLink key={item.href} as={Link} to={item.href} $isActive={isActive} $isDark={isDark}>
                    {item.label}
                  </NavLink>
                );
              })}
            </DesktopNav>
          </HeaderCenter>

          {/* RIGHT: CTAs & Mobile Toggle */}
          <HeaderRight>
            <DesktopActions>
              <ButtonGhost as={Link} to="/auth" $isDark={isDark}>
                Sign In
              </ButtonGhost>
              <ButtonPrimary as={Link} to="/contact" $isDark={isDark}>
                Contact Us
              </ButtonPrimary>
            </DesktopActions>

            <MobileMenuButton
              onClick={toggleMobileNav}
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
              $isDark={isDark}
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </MobileMenuButton>
          </HeaderRight>
        </HeaderInner>
      </StyledHeader>

      {/* MOBILE DRAWER */}
      <MobileNavOverlay $isOpen={isMobileNavOpen} aria-hidden={!isMobileNavOpen}>
        <MobileNavHeader>
          <LogoLink as={Link} to="/" onClick={closeMobileNav}>
            <LogoImage as={LogoIcon} aria-label="Neryva" />
            <span>Neryva</span>
          </LogoLink>
          <MobileMenuButton onClick={closeMobileNav} aria-label="Close menu">
            <X size={20} />
          </MobileMenuButton>
        </MobileNavHeader>

        <MobileNavScroll>
          {navItems.map((item) => {
            const hasChildren = item.children || item.megaMenu;
            const isActive = !!matchRoute({ to: item.href, fuzzy: true });

            return (
              <MobileNavGroup key={item.href}>
                <MobileNavLink
                  as={Link}
                  to={item.href}
                  $isActive={isActive}
                  onClick={hasChildren ? undefined : closeMobileNav}
                >
                  {item.label}
                </MobileNavLink>

                {hasChildren && (
                  <MobileSubLinkContainer>
                    {item.children?.map((child) => (
                      <MobileSubLink
                        key={child.href}
                        as={Link}
                        to={child.href}
                        onClick={closeMobileNav}
                      >
                        {child.icon ? (
                          <NavMotifIcon kind={child.icon as NavMotifKind} />
                        ) : (
                          <AccentDot $color={child.accent ?? '#666'} />
                        )}
                        {child.label}
                      </MobileSubLink>
                    ))}

                    {item.megaMenu?.map((section) => (
                      <div key={section.title}>
                        <MobileSectionTitle>{section.title}</MobileSectionTitle>
                        {section.items.map((link) => {
                          const isExternal = link.href.startsWith('http');
                          return (
                            <MobileSubLink
                              key={link.href}
                              as={isExternal ? 'a' : Link}
                              {...(isExternal
                                ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
                                : { to: link.href })}
                              onClick={closeMobileNav}
                              $indented
                            >
                              {link.label}
                            </MobileSubLink>
                          );
                        })}
                      </div>
                    ))}
                  </MobileSubLinkContainer>
                )}
              </MobileNavGroup>
            );
          })}
        </MobileNavScroll>

        <MobileActions>
          <ButtonGhost as={Link} to="/auth" onClick={closeMobileNav}>
            Sign In
          </ButtonGhost>
            <ButtonPrimary as={Link} to="/contact" onClick={closeMobileNav}>
              Contact Us
            </ButtonPrimary>
        </MobileActions>
      </MobileNavOverlay>
    </>
  );
}
