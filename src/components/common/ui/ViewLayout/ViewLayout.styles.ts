import styled from 'styled-components';

/**
 * App view scaffolding — the shared page frame for every dashboard view.
 * Views compose these directly (styled components) so motion can be
 * attached with `as={motion.div}` at the call site.
 */

export const ViewShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const ViewHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ViewTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.pageTitle};
  font-weight: 500;
  letter-spacing: -0.025em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ViewSubtitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 14px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.secondary};

  svg {
    color: ${({ theme }) => theme.app.text.muted};
  }
`;

/** Standard dashboard grid: KPI row (4 → 2 → 1). */
export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;
