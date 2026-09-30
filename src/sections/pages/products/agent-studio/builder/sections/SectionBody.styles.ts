import styled from 'styled-components';

/**
 * SectionBody chrome (configure-first redesign).
 *
 * The main content pane: a quiet section header (real label + the
 * projector's honest status line) above the section's own real
 * implementation. No canvas chrome, no node meta lines.
 */

export const SectionWrap = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const SectionTitle = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.pageTitle};
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const SectionSub = styled.p`
  margin: 6px 0 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const SectionPane = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 28px 48px;
  /* Hidden scrollbars — wheel/touch/keyboard keep working. */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

/**
 * Section content column (builder redesign).
 *
 * Form-density sections constrain to a readable measure — psychology:
 * a bounded line length lowers cognitive load and the page feels calm
 * instead of stretched. List/table-density sections pass $wide to take
 * the full pane.
 */
export const SectionContent = styled.div<{ $wide?: boolean }>`
  max-width: ${({ $wide }) => ($wide ? 'none' : '720px')};
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 8px;
`;
