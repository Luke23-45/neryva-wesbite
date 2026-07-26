import styled from 'styled-components';

export const AppsWrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.s10} 0;
  background-color: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.tablet} {
    padding: ${({ theme }) => theme.spacing.s9} 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.containers.wide};
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

/* ── Header Area ── */
export const AppsHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;
`;

export const HeaderIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    width: 24px;
    height: 24px;
    stroke-width: 1.5px;
    
    /* Make the icons pop slightly, referencing the emoji feel */
    &:nth-child(1) { color: #0078D7; }
    &:nth-child(2) { color: #FF4500; }
    &:nth-child(3) { color: #FF8C00; }
  }
`;

export const AppsTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 56px;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 24px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
  }
`;

export const AppsDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 600px;
  line-height: 1.6;
`;

/* ── The 4-Column Master Grid ── */
export const AppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
    border-bottom: none; /* Handled by individual cells on mobile/tablet */
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const AppCell = styled.div`
  display: flex;
  flex-direction: column;
  height: 420px; /* Forces all cards to be uniformly tall, matching reference */
  padding: 48px 32px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  transition: background-color 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.015);
  }

  /* Remove right border from the last column */
  &:last-child {
    border-right: none;
  }

  ${({ theme }) => theme.media.tablet} {
    height: 320px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    
    /* Reset borders for 2-column layout */
    &:nth-child(2n) {
      border-right: none;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    border-right: none;
  }
`;

/* ── Cell Content Typography ── */
export const CellIcon = styled.div`
  margin-bottom: 40px; /* Big gap between icon and title */
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.5px;
  }
`;

export const CellTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 28px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
`;

export const CellDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  font-weight: 500;
  
  /* CRITICAL: This pushes the description to the absolute bottom of the cell */
  margin-top: auto; 
`;