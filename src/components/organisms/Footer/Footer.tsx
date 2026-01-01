import styled from 'styled-components';
import { Link } from '@tanstack/react-router';
import { Logo } from '@components/atoms';
import { footerColumns } from '../../../data/navigation';

const FooterContainer = styled.footer`
  background: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[8]};
  margin-top: auto;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[12]};
  max-width: ${({ theme }) => theme.sizes.maxWidth};
  margin: 0 auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing[8]};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FooterBrand = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};

  p {
    color: ${({ theme }) => theme.colors.text.muted};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    max-width: 300px;
    line-height: 1.6;
  }
`;

const FooterColumn = styled.div`
  h4 {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.muted};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }
  
  ul {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[3]};
    list-style: none;
    padding: 0;
  }
  
  a {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: ${({ theme }) => theme.colors.accent.teal};
    }
  }
`;

const FooterBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[8]};
  margin-top: ${({ theme }) => theme.spacing[16]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  max-width: ${({ theme }) => theme.sizes.maxWidth};
  margin-left: auto;
  margin-right: auto;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[4]};
    text-align: center;
  }
`;

const BackToTop = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.full};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent.teal};
    color: ${({ theme }) => theme.colors.accent.teal};
  }
`;

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <FooterContainer>
      <FooterGrid>
        <FooterBrand>
          <Logo />
          <p>
            Democratizing critical care intelligence through advanced AI, robotics, and voice systems.
            Saving lives, everywhere, for everyone.
          </p>
        </FooterBrand>

        <FooterColumn>
          <h4>Research</h4>
          <ul>
            {footerColumns.research.map((item) => (
              <li key={item.path}>
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn>
          <h4>Company</h4>
          <ul>
            {footerColumns.company.map((item) => (
              <li key={item.path}>
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn>
          <h4>Resources</h4>
          <ul>
            {footerColumns.resources.map((item) => (
              <li key={item.path}>
                {item.external ? (
                  <a href={item.path} target="_blank" rel="noopener noreferrer">
                    {item.label} ↗
                  </a>
                ) : (
                  <Link to={item.path as any}>{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </FooterColumn>
      </FooterGrid>

      <FooterBottom>
        <div>
          © {new Date().getFullYear()} NERYVA Research. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {footerColumns.legal.map((item) => (
            <Link key={item.path} to={item.path as any}>{item.label}</Link>
          ))}
        </div>
        <BackToTop onClick={scrollToTop}>Back to Top ↑</BackToTop>
      </FooterBottom>
    </FooterContainer>
  );
};
