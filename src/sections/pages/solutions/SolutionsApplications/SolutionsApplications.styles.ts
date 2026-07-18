import styled from 'styled-components';

export const AppsWrapper = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

/* ── Header Area — left-aligned editorial style ── */
export const AppsHeader = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 600px;
  margin-bottom: 64px;
`;

export const AppsTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 42px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 16px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
`;

export const AppsDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  line-height: 1.6;
`;

/* ── The 4-Column Application Grid ── */
export const AppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const AppCell = styled.div`
  display: flex;
  flex-direction: column;
  padding: 40px 32px 40px 0;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  /* Remove right border from the last column */
  &:nth-child(4n) {
    border-right: none;
    padding-right: 0;
  }

  ${({ theme }) => theme.media.tablet} {
    &:nth-child(4n) {
      border-right: 1px solid ${({ theme }) => theme.colors.border};
      padding-right: 32px;
    }
    &:nth-child(2n) {
      border-right: none;
      padding-right: 0;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    border-right: none !important;
    padding-right: 0 !important;
  }
`;

/* ── Cell Content ── */
export const CellIcon = styled.div`
  margin-bottom: 32px;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.5px;
  }
`;

export const CellTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0 0 12px 0;
`;

export const CellDesc = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;