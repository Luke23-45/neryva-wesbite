import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.mobile} {
    padding: 80px 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    padding: 0 ${({ theme }) => theme.spacing.s4};
  }
`;

export const HeaderSection = styled.div`
  margin-bottom: 80px;
`;

export const SectionLabel = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(2.75rem, 5vw, 4.5rem);
  font-weight: 500;
  line-height: 1.0;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  letter-spacing: -0.04em;
`;

/* ── Two Column Layout ── */

export const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 64px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

export const SidebarMenu = styled.div`
  position: sticky;
  top: calc(50vh - 130px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: flex-start;

  ${({ theme }) => theme.media.tablet} {
    position: relative;
    top: 0;
    flex-direction: row;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 8px;
  }
`;

export const MenuItem = styled.button<{ $active: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.background.secondary)};
  color: ${({ $active, theme }) => ($active ? theme.colors.background.primary : theme.colors.text.secondary)};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;

  &:hover {
    background-color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.border)};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const ProgramsContent = styled.div`
  display: flex;
  flex-direction: column;
`;

/* ── Individual Program Row ── */

export const ProgramRow = styled.div`
  margin-bottom: 120px;
  scroll-margin-top: 120px;

  &:last-child {
    margin-bottom: 0;
  }

  ${({ theme }) => theme.media.mobile} {
    margin-bottom: 80px;
    scroll-margin-top: 80px;
  }
`;

export const ProgramHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

export const ProgramTitle = styled.h3<{ $accent: string }>`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  color: ${({ $accent }) => $accent};
  margin: 0;
  letter-spacing: -0.03em;
`;

export const ProgramCTA = styled.div`
  padding-top: 8px;
  flex-shrink: 0;
`;

export const ProgramDescription = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 32px 0;
  max-width: 720px;
`;

export const ProgramVisual = styled.div<{ $accent: string }>`
  width: 100%;
  aspect-ratio: 16 / 7;
  border-radius: 20px;
  background: ${({ $accent }) => $accent};
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ theme }) => theme.media.mobile} {
    aspect-ratio: 16 / 9;
    border-radius: 16px;
  }
`;

export const VisualOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%);
  pointer-events: none;
`;

export const VisualCaption = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24px;
  padding: 20px 28px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  overflow-x: auto;
  white-space: nowrap;

  ${({ theme }) => theme.media.mobile} {
    padding: 16px 20px;
    font-size: 9px;
    gap: 16px;
  }
`;

export const FooterAction = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 80px;
`;
