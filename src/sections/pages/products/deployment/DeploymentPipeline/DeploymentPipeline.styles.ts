import styled from 'styled-components';

export const DeploymentPipelineFlexContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 64px;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 32px;
  }
`;

export const DeploymentPipelineHeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  margin-top: 40px;
  margin-bottom: 40px;
`;

export const DeploymentPipelineTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
  }
`;

export const DeploymentPipelineSidebar = styled.nav`
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 120px;
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    position: static;
    flex-direction: row;
    overflow-x: auto;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

export const DeploymentPipelineSidebarItem = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 16px 20px;
  width: 100%;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  cursor: pointer;

  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  line-height: 1.4;
  letter-spacing: -0.01em;
  text-align: left;

  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};

  transition: all ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background.secondary};
  }

  ${({ theme }) => theme.media.tablet} {
    white-space: nowrap;
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    flex-shrink: 0;

    &::after {
      display: none;
    }

    &:last-child {
      border-right: none;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 13px;
  }
`;

export const DeploymentPipelineSidebarItemIcon = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.muted};
  transition: color ${({ theme }) => theme.transitions.fast};

  svg {
    width: 30px;
    height: 30px;
  }
`;

export const DeploymentPipelineSidebarItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.03rem;
  font-weight: 500;

  ${({ theme }) => theme.media.mobile} {
    font-size: 0.85rem;
  }
`;

export const DeploymentPipelinePanel = styled.div`
  flex: 1;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;
`;

export const DeploymentPipelineSection = styled.section`
  scroll-margin-top: 120px;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const DeploymentPipelineSectionTitle = styled.h2`
  font-size: 3.3rem;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0;
  padding: 35px 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.mobile} {
    font-size: 22px;
    padding: 20px 24px;
  }
`;

export const DeploymentPipelineVisualBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  overflow: hidden;

  background-color: #F8F9FA;
  background-image:
    radial-gradient(ellipse 70% 55% at 18% 8%, rgba(192, 132, 252, 0.10), transparent 60%),
    radial-gradient(ellipse 75% 60% at 88% 96%, rgba(37, 99, 235, 0.07), transparent 65%);
  animation: deployment-visual-block-breathe 16s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;

    background-image:
      radial-gradient(circle, rgba(15, 23, 42, 0.22) 1px, transparent 1.6px),
      linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
      linear-gradient(to right, rgba(15, 23, 42, 0.022) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.022) 1px, transparent 1px);

    background-size:
      80px 80px,
      80px 80px,
      80px 80px,
      40px 40px,
      40px 40px;

    background-position: 0 0, 0 0, 0 0, 0 0, 0 0;
    animation: deployment-visual-grid-drift 42s linear infinite;
    will-change: background-position;
  }

  ${({ theme }) => theme.media.mobile} {
    background-image:
      radial-gradient(ellipse 80% 60% at 18% 8%, rgba(192, 132, 252, 0.06), transparent 60%),
      radial-gradient(ellipse 80% 60% at 88% 96%, rgba(37, 99, 235, 0.05), transparent 65%);

    &::before {
      background-size:
        60px 60px,
        60px 60px,
        60px 60px,
        30px 30px,
        30px 30px;
      animation-duration: 32s;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    &::before {
      animation: none;
    }
  }

  @keyframes deployment-visual-block-breathe {
    0%, 100% { filter: saturate(1) brightness(1); }
    50%      { filter: saturate(1.06) brightness(1.015); }
  }

  @keyframes deployment-visual-grid-drift {
    from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
    to   { background-position: -80px -80px, -80px 0, 0 -80px, -40px -40px, -40px 0; }
  }
`;

export const DeploymentPipelineVisualImageFrame = styled.div`
  width: 100%;
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    padding: 24px;
  }

  ${({ theme }) => theme.media.mobile} {
    aspect-ratio: 4 / 3;
    padding: 16px;
  }
`;

export const DeploymentPipelineVisualImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
`;

export const DeploymentPipelineVisualCaption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 32px 28px;
  text-align: center;
  background: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.mobile} {
    padding: 16px 20px 22px;
  }
`;

export const DeploymentPipelineVisualTypeLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  z-index: 1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

export const DeploymentPipelineVisualDescription = styled.p`
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  max-width: 480px;
  margin: 0;
  padding: 0 24px;
  z-index: 1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 11px;
  }
`;

export const DeploymentPipelineFeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  background: ${({ theme }) => theme.colors.background.primary};

  > div {
    display: flex;
    flex-direction: column;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }

  > div:last-child {
    border-right: none;
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;

    > div {
      border-right: none;
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }

    > div:last-child {
      border-bottom: none;
    }
  }
`;

export const DeploymentPipelineFeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px;
  flex: 1;
  background: transparent;
`;

export const DeploymentPipelineFeatureTitle = styled.h3`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  letter-spacing: -0.01em;
  margin: 0 0 12px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 22px;
  }
`;

export const DeploymentPipelineFeatureDescription = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 14px;
  }
`;

export const DeploymentPipelineSectionDivider = styled.div`
  display: none;
`;
